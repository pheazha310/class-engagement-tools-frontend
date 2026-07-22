<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useQuizStore } from '@/stores/quizStore'
import { questionService } from '@/services/questionService'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import ToastNotification from '@/components/ToastNotification.vue'
import QuestionCard from '@/components/QuestionCard.vue'
import type { QuizFormData, Quiz } from '@/types/quiz'
import type { Question, QuestionFormData } from '@/types/question'
import type { AxiosError } from 'axios'

const router = useRouter()
const route = useRoute()
const store = useQuizStore()

const isEditMode = computed(() => !!route.params.id)
const quizId = computed(() => route.params.id as string | undefined)

// ── Quiz Form ──
const form = reactive<QuizFormData>({
  title: '',
  description: '',
  subject: '',
  class_name: '',
  duration: 30,
  passing_score: 50,
  due_date: '',
  shuffle_questions: false,
  status: 'draft',
})

const loading = ref(false)
const submittingQuestions = ref(false)
const errors = ref<Record<string, string>>({})
const toastMessage = ref<string | null>(null)
const toastType = ref<'success' | 'error'>('success')

// ── Questions (inline) ──
interface PendingQuestion {
  localId: number
  formData: QuestionFormData
  remoteId?: string  // set for existing questions in edit mode
}

const questions = ref<PendingQuestion[]>([])
const existingQuestions = ref<Question[]>([])
let nextLocalId = 1

// Inline question form state
const showQuestionForm = ref(false)
const editingQuestionLocalId = ref<number | null>(null)

const questionForm = reactive<QuestionFormData>({
  question_text: '',
  question_type: 'multiple_choice',
  points: 1,
  choices: [
    { choice_text: '', is_correct: false },
    { choice_text: '', is_correct: false },
  ],
  correct_answer: '',
})

const questionFormErrors = ref<Record<string, string>>({})

const isEditingQuestion = computed(() => editingQuestionLocalId.value !== null)

// ── Quiz form validation ──
const isFormValid = computed(() => {
  return form.title.trim() !== '' &&
    form.subject.trim() !== '' &&
    form.class_name.trim() !== '' &&
    form.duration > 0 &&
    form.due_date !== ''
})

function validate(): boolean {
  errors.value = {}

  if (!form.title.trim()) errors.value.title = 'Quiz title is required.'
  if (!form.subject.trim()) errors.value.subject = 'Subject is required.'
  if (!form.class_name.trim()) errors.value.class_name = 'Class is required.'
  if (!form.duration || form.duration < 1) errors.value.duration = 'Duration must be at least 1 minute.'
  if (form.passing_score < 0 || form.passing_score > 100) errors.value.passing_score = 'Passing score must be between 0 and 100.'
  if (!form.due_date) {
    errors.value.due_date = 'Due date is required.'
  } else {
    const due = new Date(form.due_date).getTime()
    const now = Date.now()
    if (due <= now + 60000) errors.value.due_date = 'Due date must be at least 1 minute from now.'
  }
  return Object.keys(errors.value).length === 0
}

// ── Question form logic ──
const questionTypeOptions = [
  { value: 'multiple_choice', label: 'Multiple Choice', icon: '◉' },
  { value: 'true_false', label: 'True / False', icon: '✓✗' },
  { value: 'short_answer', label: 'Short Answer', icon: '✎' },
]

function openAddQuestionForm() {
  resetQuestionForm()
  editingQuestionLocalId.value = null
  showQuestionForm.value = true
}

function openEditQuestionForm(localId: number) {
  const pq = questions.value.find((q) => q.localId === localId)
  if (!pq) return
  editingQuestionLocalId.value = localId
  questionForm.question_text = pq.formData.question_text
  questionForm.question_type = pq.formData.question_type
  questionForm.points = pq.formData.points
  questionForm.choices = pq.formData.choices.map((c) => ({ ...c }))
  questionForm.correct_answer = pq.formData.correct_answer
  questionFormErrors.value = {}
  showQuestionForm.value = true
}

function resetQuestionForm() {
  questionForm.question_text = ''
  questionForm.question_type = 'multiple_choice'
  questionForm.points = 1
  questionForm.choices = [
    { choice_text: '', is_correct: false },
    { choice_text: '', is_correct: false },
  ]
  questionForm.correct_answer = ''
  questionFormErrors.value = {}
}

function onQuestionTypeChange() {
  questionFormErrors.value = {}
  if (questionForm.question_type === 'true_false') {
    questionForm.choices = [
      { choice_text: 'True', is_correct: false },
      { choice_text: 'False', is_correct: false },
    ]
    questionForm.correct_answer = ''
  } else if (questionForm.question_type === 'short_answer') {
    questionForm.choices = []
    questionForm.correct_answer = ''
  } else {
    if (questionForm.choices.length < 2) {
      questionForm.choices = [
        { choice_text: '', is_correct: false },
        { choice_text: '', is_correct: false },
      ]
    }
  }
}

function addChoice() {
  questionForm.choices.push({ choice_text: '', is_correct: false })
}

function removeChoice(index: number) {
  if (questionForm.choices.length > 2) questionForm.choices.splice(index, 1)
}

function setCorrectChoice(index: number) {
  questionForm.choices.forEach((c, i) => { c.is_correct = i === index })
  questionForm.correct_answer = questionForm.choices[index]?.choice_text || ''
}

function validateQuestionForm(): boolean {
  questionFormErrors.value = {}
  if (!questionForm.question_text.trim()) questionFormErrors.value.question_text = 'Question text is required.'
  if (questionForm.points < 1) questionFormErrors.value.points = 'Points must be at least 1.'

  if (questionForm.question_type === 'multiple_choice') {
    const valid = questionForm.choices.filter((c) => c.choice_text.trim())
    if (valid.length < 2) questionFormErrors.value.choices = 'At least 2 choices are required.'
    if (!questionForm.choices.some((c) => c.is_correct && c.choice_text.trim())) questionFormErrors.value.correct_answer = 'Please select a correct answer.'
  }
  if (questionForm.question_type === 'true_false') {
    if (!questionForm.choices.some((c) => c.is_correct)) questionFormErrors.value.correct_answer = 'Please select True or False as the correct answer.'
  }
  if (questionForm.question_type === 'short_answer') {
    if (!questionForm.correct_answer.trim()) questionFormErrors.value.correct_answer = 'Correct answer is required.'
  }
  return Object.keys(questionFormErrors.value).length === 0
}

function saveQuestion() {
  if (!validateQuestionForm()) return

  const payload: QuestionFormData = {
    question_text: questionForm.question_text,
    question_type: questionForm.question_type,
    points: questionForm.points,
    choices: questionForm.question_type === 'short_answer' ? [] : questionForm.choices.map((c) => ({ ...c })),
    correct_answer:
      questionForm.question_type === 'multiple_choice'
        ? questionForm.choices.find((c) => c.is_correct)?.choice_text || ''
        : questionForm.correct_answer,
  }

  if (isEditingQuestion.value && editingQuestionLocalId.value !== null) {
    const idx = questions.value.findIndex((q) => q.localId === editingQuestionLocalId.value)
    if (idx !== -1) questions.value[idx]!.formData = payload
  } else {
    questions.value.push({ localId: nextLocalId++, formData: payload })
  }

  showQuestionForm.value = false
  editingQuestionLocalId.value = null
  resetQuestionForm()
}

function cancelQuestionForm() {
  showQuestionForm.value = false
  editingQuestionLocalId.value = null
  resetQuestionForm()
}

function confirmDeleteQuestion(localId: number) {
  questions.value = questions.value.filter((q) => q.localId !== localId)
}

function editQuestionById(id: string) {
  const pq = questions.value.find((q) => q.remoteId === id)
  if (pq) openEditQuestionForm(pq.localId)
}

// ── Submit ──
async function handleSubmit() {
  console.log('handleSubmit called', { title: form.title, subject: form.subject, class_name: form.class_name, duration: form.duration, due_date: form.due_date })
  if (!validate()) {
    console.log('Validation failed', errors.value)
    alert('Please fill in all required fields correctly.')
    return
  }

  loading.value = true
  toastMessage.value = null
  console.log('Submitting quiz...')

  try {
    if (isEditMode.value && quizId.value) {
      // ── Edit mode: update quiz, then sync questions ──
      const { quizService: qs } = await import('@/services/quizService')
      await qs.updateQuiz(quizId.value, { ...form })
      toastMessage.value = 'Quiz updated successfully!'

      // Determine which questions to create, update, delete
      const existingIds = new Set(existingQuestions.value.map((q) => q.id))
      const submittedRemoteIds = new Set<string>()

      for (const pq of questions.value) {
        if (pq.remoteId) {
          submittedRemoteIds.add(pq.remoteId)
          await questionService.updateQuestion(pq.remoteId, pq.formData)
        } else {
          const created = await questionService.createQuestion(quizId.value, pq.formData)
          pq.remoteId = created.id
        }
      }

      // Delete questions that were removed
      for (const eq of existingQuestions.value) {
        if (!submittedRemoteIds.has(eq.id)) {
          await questionService.deleteQuestion(eq.id)
        }
      }
    } else {
      // ── Create mode: create quiz, then batch-create questions ──
      const quizCreated = await store.createQuiz({ ...form })
      toastMessage.value = 'Quiz created successfully!'

      const newQuizId = quizCreated.id
      submittingQuestions.value = true

      if (questions.value.length > 0) {
        for (const pq of questions.value) {
          await questionService.createQuestion(newQuizId, pq.formData)
        }
      }
    }

    toastType.value = 'success'
    setTimeout(() => router.push('/quizzes'), 1500)
  } catch (e: unknown) {
    const axiosError = e as AxiosError<{ message?: string; errors?: Record<string, string[]> }>
    const errData = axiosError.response?.data
    let msg = ''
    if (errData?.errors) msg = Object.values(errData.errors).flat().join('. ')
    else if (errData?.message) msg = errData.message
    else if (axiosError.message) msg = axiosError.message
    else msg = isEditMode.value ? 'Failed to update quiz.' : 'Failed to create quiz.'
    toastMessage.value = msg
    toastType.value = 'error'
    console.error('Quiz submit error:', e)
    alert('Error: ' + msg)
  } finally {
    loading.value = false
    submittingQuestions.value = false
  }
}

const todayString = computed(() => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
})

// ── Load quiz for editing ──
async function loadQuiz() {
  if (!quizId.value) return
  loading.value = true
  try {
    const { quizService: qs } = await import('@/services/quizService')
    const quiz: Quiz = await qs.getQuiz(quizId.value)
    form.title = quiz.title
    form.description = quiz.description
    form.subject = quiz.subject
    form.class_name = quiz.class_name
    form.duration = quiz.duration
    form.passing_score = quiz.passing_score
    form.due_date = quiz.due_date
    form.shuffle_questions = quiz.shuffle_questions
    form.status = quiz.status

    // Load existing questions
    const existing = await questionService.getQuestions(quizId.value)
    existingQuestions.value = existing
    questions.value = existing.map((q, i) => ({
      localId: nextLocalId++,
      formData: {
        question_text: q.question_text,
        question_type: q.question_type,
        points: q.points,
        choices: q.choices?.map((c) => ({ choice_text: c.choice_text, is_correct: c.is_correct })) || [],
        correct_answer: q.correct_answer,
      },
      remoteId: q.id,
    }))
  } catch (e: unknown) {
    const axiosError = e as AxiosError<{ message?: string }>
    alert(axiosError.response?.data?.message || 'Failed to load quiz.')
    router.push('/quizzes')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  if (isEditMode.value) loadQuiz()
})

const totalPoints = computed(() =>
  questions.value.reduce((sum, q) => sum + (q.formData.points || 0), 0)
)
</script>

<template>
  <div class="quiz-create-page">
    <div class="quiz-bg" aria-hidden="true"></div>

    <div class="quiz-container">
      <!-- ===================== HEADER ===================== -->
      <header class="quiz-header">
        <div class="quiz-header-icon">
          <svg class="quiz-header-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5A2.5 2.5 0 0 1 4 19.5z" />
            <line x1="8" y1="7" x2="16" y2="7" />
            <line x1="8" y1="11" x2="14" y2="11" />
            <line x1="8" y1="15" x2="12" y2="15" />
          </svg>
        </div>
        <div class="quiz-header-text">
          <h1 class="quiz-header-title">{{ isEditMode ? 'Edit Quiz' : 'Create New Quiz' }}</h1>
          <p class="quiz-header-subtitle">{{ isEditMode ? 'Update your quiz settings and questions' : 'Design a quiz with questions for your classroom assessments' }}</p>
        </div>
      </header>

      <!-- ===================== FORM ===================== -->
      <form @submit.prevent="handleSubmit" class="quiz-form" novalidate>
        <div class="quiz-form-grid">
          <!-- ======= LEFT COLUMN ======= -->
          <div class="quiz-form-col">
            <!-- Quiz Title -->
            <div class="input-group" :class="{ 'input-group--error': errors.title }">
              <label for="title" class="input-label">Quiz Title <span class="required-star" aria-hidden="true">*</span></label>
              <div class="input-wrapper">
                <svg class="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                </svg>
                <input id="title" v-model="form.title" type="text" placeholder="e.g. Mathematics Final Exam" class="input-field" aria-required="true" :aria-invalid="!!errors.title" />
              </div>
              <p v-if="errors.title" class="input-error" role="alert">{{ errors.title }}</p>
              <p v-else class="input-hint">Give your quiz a clear, descriptive name</p>
            </div>

            <!-- Description -->
            <div class="input-group">
              <label for="description" class="input-label">Description</label>
              <div class="input-wrapper input-wrapper--textarea">
                <textarea id="description" v-model="form.description" rows="4" placeholder="Optional — add instructions or context for students..." class="input-field input-field--textarea"></textarea>
              </div>
              <p class="input-hint">Briefly describe what this quiz covers (optional)</p>
            </div>

            <!-- Subject & Class -->
            <div class="input-row">
              <div class="input-group" :class="{ 'input-group--error': errors.subject }">
                <label for="subject" class="input-label">Subject <span class="required-star" aria-hidden="true">*</span></label>
                <div class="input-wrapper">
                  <svg class="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c3 3 9 3 12 0v-5" />
                  </svg>
                  <input id="subject" v-model="form.subject" type="text" placeholder="e.g. Mathematics" class="input-field" aria-required="true" :aria-invalid="!!errors.subject" />
                </div>
                <p v-if="errors.subject" class="input-error" role="alert">{{ errors.subject }}</p>
              </div>
              <div class="input-group" :class="{ 'input-group--error': errors.class_name }">
                <label for="class_name" class="input-label">Class <span class="required-star" aria-hidden="true">*</span></label>
                <div class="input-wrapper">
                  <svg class="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                  <input id="class_name" v-model="form.class_name" type="text" placeholder="e.g. Grade 10A" class="input-field" aria-required="true" :aria-invalid="!!errors.class_name" />
                </div>
                <p v-if="errors.class_name" class="input-error" role="alert">{{ errors.class_name }}</p>
              </div>
            </div>

            <!-- Duration & Passing Score -->
            <div class="input-row">
              <div class="input-group" :class="{ 'input-group--error': errors.duration }">
                <label for="duration" class="input-label">Duration (min) <span class="required-star" aria-hidden="true">*</span></label>
                <div class="input-wrapper">
                  <svg class="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                  </svg>
                  <input id="duration" v-model.number="form.duration" type="number" min="1" max="999" placeholder="30" class="input-field" aria-required="true" :aria-invalid="!!errors.duration" />
                  <span class="input-suffix">min</span>
                </div>
                <p v-if="errors.duration" class="input-error" role="alert">{{ errors.duration }}</p>
              </div>
              <div class="input-group" :class="{ 'input-group--error': errors.passing_score }">
                <label for="passing_score" class="input-label">Passing Score (%)</label>
                <div class="input-wrapper">
                  <svg class="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                  <input id="passing_score" v-model.number="form.passing_score" type="number" min="0" max="100" placeholder="50" class="input-field" :aria-invalid="!!errors.passing_score" />
                  <span class="input-suffix">%</span>
                </div>
                <p v-if="errors.passing_score" class="input-error" role="alert">{{ errors.passing_score }}</p>
              </div>
            </div>
          </div>

          <!-- ======= RIGHT COLUMN ======= -->
          <div class="quiz-form-col">
            <!-- Due Date -->
            <div class="input-group" :class="{ 'input-group--error': errors.due_date }">
              <label for="due_date" class="input-label">Due Date <span class="required-star" aria-hidden="true">*</span></label>
              <div class="input-wrapper">
                <svg class="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                <input id="due_date" v-model="form.due_date" type="datetime-local" :min="todayString" class="input-field input-field--date" aria-required="true" :aria-invalid="!!errors.due_date" />
              </div>
              <p v-if="errors.due_date" class="input-error" role="alert">{{ errors.due_date }}</p>
              <p v-else class="input-hint">When the quiz closes for submissions</p>
            </div>

            <!-- Status -->
            <div class="input-group">
              <label class="input-label">Status</label>
              <div class="segmented-control" role="radiogroup" aria-label="Quiz status">
                <button type="button" role="radio" :aria-checked="form.status === 'draft'" class="segmented-btn" :class="{ 'segmented-btn--active segmented-btn--draft': form.status === 'draft' }" @click="form.status = 'draft'">
                  <svg class="segmented-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="12" y1="18" x2="12" y2="12" /><line x1="9" y1="15" x2="15" y2="15" />
                  </svg>
                  <span>Draft</span>
                </button>
                <button type="button" role="radio" :aria-checked="form.status === 'published'" class="segmented-btn" :class="{ 'segmented-btn--active segmented-btn--published': form.status === 'published' }" @click="form.status = 'published'">
                  <svg class="segmented-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                  <span>Published</span>
                </button>
              </div>
              <p class="input-hint">Draft saves privately; Published makes it available to students</p>
            </div>
          </div>
        </div>

        <!-- ================================================================
             QUESTIONS SECTION
             ================================================================ -->
        <div class="quiz-section-divider">
          <div class="quiz-section-divider-line"></div>
          <div class="quiz-section-divider-label">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="divider-icon"><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
            Questions
          </div>
          <div class="quiz-section-divider-line"></div>
        </div>

        <!-- Question list -->
        <div v-if="questions.length > 0" class="questions-list">
          <QuestionCard
            v-for="(pq, index) in questions"
            :key="pq.localId"
            :question="{
              id: pq.remoteId || String(pq.localId),
              quiz_id: quizId || '',
              question_text: pq.formData.question_text,
              question_type: pq.formData.question_type,
              points: pq.formData.points,
              choices: pq.formData.choices,
              correct_answer: pq.formData.correct_answer,
              order: index + 1,
              created_at: '',
              updated_at: '',
            }"
            :index="index"
            @edit="pq.remoteId ? editQuestionById(pq.remoteId) : openEditQuestionForm(pq.localId)"
            @delete="confirmDeleteQuestion(pq.localId)"
          />
        </div>

        <!-- Empty questions state -->
        <div v-else class="questions-empty">
          <div class="questions-empty-icon">❓</div>
          <p class="questions-empty-text">No questions added yet</p>
          <p class="questions-empty-hint">Click the button below to add your first question</p>
        </div>

        <!-- Total points indicator -->
        <div v-if="questions.length > 0" class="questions-summary">
          <span class="questions-summary-count">{{ questions.length }} question{{ questions.length !== 1 ? 's' : '' }}</span>
          <span class="questions-summary-divider">·</span>
          <span class="questions-summary-points">{{ totalPoints }} total point{{ totalPoints !== 1 ? 's' : '' }}</span>
        </div>

        <!-- Add Question button -->
        <button type="button" class="btn btn-add-question" @click="openAddQuestionForm">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="btn-add-icon" aria-hidden="true"><path d="M12 5v14" /><path d="M5 12h14" /></svg>
          Add Question
        </button>

        <!-- ================================================================
             INLINE QUESTION FORM
             ================================================================ -->
        <Transition name="slide-fade">
          <div v-if="showQuestionForm" class="question-form-panel">
            <div class="question-form-panel-header">
              <h3 class="question-form-panel-title">
                {{ isEditingQuestion ? 'Edit Question' : 'Add New Question' }}
              </h3>
              <button type="button" class="question-form-close" @click="cancelQuestionForm">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>

            <!-- Question Text -->
            <div class="input-group" :class="{ 'input-group--error': questionFormErrors.question_text }">
              <label class="input-label">Question <span class="required-star" aria-hidden="true">*</span></label>
              <div class="input-wrapper input-wrapper--textarea">
                <textarea v-model="questionForm.question_text" rows="2" placeholder="Enter your question here..." class="input-field input-field--textarea qf-textarea" aria-required="true"></textarea>
              </div>
              <p v-if="questionFormErrors.question_text" class="input-error" role="alert">{{ questionFormErrors.question_text }}</p>
            </div>

            <!-- Question Type -->
            <div class="input-group">
              <label class="input-label">Question Type <span class="required-star" aria-hidden="true">*</span></label>
              <div class="question-type-grid">
                <button v-for="opt in questionTypeOptions" :key="opt.value" type="button" class="type-btn" :class="{ 'type-btn--active': questionForm.question_type === opt.value }" @click="questionForm.question_type = opt.value as QuestionFormData['question_type']; onQuestionTypeChange()">
                  <span class="type-btn-icon">{{ opt.icon }}</span>
                  <span class="type-btn-label">{{ opt.label }}</span>
                </button>
              </div>
            </div>

            <!-- Multiple Choice: Choices -->
            <div v-if="questionForm.question_type === 'multiple_choice'" class="input-group">
              <div class="choices-header">
                <label class="input-label">Choices <span class="required-star" aria-hidden="true">*</span></label>
                <button type="button" class="btn btn-sm btn-outline" @click="addChoice">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="btn-sm-icon"><path d="M12 5v14" /><path d="M5 12h14" /></svg>
                  Add
                </button>
              </div>
              <div class="choices-list">
                <div v-for="(choice, index) in questionForm.choices" :key="index" class="choice-row" :class="{ 'choice-row--correct': choice.is_correct }">
                  <div class="choice-radio-wrapper" @click="setCorrectChoice(index)">
                    <div class="choice-radio" :class="{ 'choice-radio--selected': choice.is_correct }">
                      <div v-if="choice.is_correct" class="choice-radio-dot"></div>
                    </div>
                  </div>
                  <input v-model="choice.choice_text" type="text" :placeholder="'Choice ' + (index + 1)" class="input-field choice-input" />
                  <button v-if="questionForm.choices.length > 2" type="button" class="choice-remove-btn" @click="removeChoice(index)" title="Remove">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                  </button>
                  <span v-if="choice.is_correct" class="choice-correct-badge">Correct</span>
                </div>
              </div>
              <p v-if="questionFormErrors.choices" class="input-error" role="alert">{{ questionFormErrors.choices }}</p>
              <p v-if="questionFormErrors.correct_answer" class="input-error" role="alert">{{ questionFormErrors.correct_answer }}</p>
            </div>

            <!-- True/False -->
            <div v-if="questionForm.question_type === 'true_false'" class="input-group">
              <label class="input-label">Correct Answer <span class="required-star" aria-hidden="true">*</span></label>
              <div class="tf-grid">
                <button v-for="(choice, index) in questionForm.choices" :key="index" type="button" class="tf-btn" :class="{ 'tf-btn--true': index === 0, 'tf-btn--false': index === 1, 'tf-btn--active': choice.is_correct }" @click="setCorrectChoice(index)">
                  <span v-if="index === 0" class="tf-icon">✓</span>
                  <span v-else class="tf-icon">✗</span>
                  <span>{{ choice.choice_text }}</span>
                </button>
              </div>
              <p v-if="questionFormErrors.correct_answer" class="input-error" role="alert">{{ questionFormErrors.correct_answer }}</p>
            </div>

            <!-- Short Answer -->
            <div v-if="questionForm.question_type === 'short_answer'" class="input-group">
              <label class="input-label">Correct Answer <span class="required-star" aria-hidden="true">*</span></label>
              <div class="input-wrapper">
                <svg class="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
                <input v-model="questionForm.correct_answer" type="text" placeholder="Enter the correct answer" class="input-field" aria-required="true" />
              </div>
              <p v-if="questionFormErrors.correct_answer" class="input-error" role="alert">{{ questionFormErrors.correct_answer }}</p>
              <p v-else class="input-hint">Answer will be checked case-insensitively</p>
            </div>

            <!-- Points -->
            <div class="input-group" :class="{ 'input-group--error': questionFormErrors.points }">
              <label class="input-label">Points <span class="required-star" aria-hidden="true">*</span></label>
              <div class="input-wrapper" style="max-width: 140px;">
                <svg class="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
                <input v-model.number="questionForm.points" type="number" min="1" max="999" placeholder="1" class="input-field" aria-required="true" />
              </div>
              <p v-if="questionFormErrors.points" class="input-error" role="alert">{{ questionFormErrors.points }}</p>
            </div>

            <!-- Question form actions -->
            <div class="qf-inline-actions">
              <button type="button" class="btn btn-cancel" @click="cancelQuestionForm">Cancel</button>
              <button type="button" class="btn btn-submit" @click="saveQuestion">
                <svg class="btn-submit-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path d="M12 5v14" /><path d="M5 12h14" />
                </svg>
                {{ isEditingQuestion ? 'Update Question' : 'Add Question' }}
              </button>
            </div>
          </div>
        </Transition>

        <!-- ===================== LOADING ===================== -->
        <div v-if="loading || store.loading" class="quiz-loading">
          <LoadingSpinner />
          <span class="quiz-loading-text">
            {{ submittingQuestions ? 'Adding questions...' : (isEditMode ? 'Updating your quiz...' : 'Creating your quiz...') }}
          </span>
        </div>

        <!-- ===================== ACTIONS ===================== -->
        <div v-else class="quiz-actions">
          <button type="button" class="btn btn-cancel" @click="router.push('/quizzes')">Cancel</button>
          <button type="submit" class="btn btn-submit">
            <svg class="btn-submit-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M12 5v14" /><path d="M5 12h14" />
            </svg>
            {{ isEditMode ? 'Update Quiz' : 'Create Quiz' }}
          </button>
        </div>
      </form>
    </div>

    <ToastNotification :message="toastMessage" :type="toastType" @close="toastMessage = null" />
  </div>
</template>

<style scoped>
/* ============================================================
   PAGE CONTAINER
   ============================================================ */
.quiz-create-page {
  position: relative;
  min-height: 100vh;
  padding: 7rem 1rem 4rem;
  background: #ffffff;
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
}

.quiz-bg {
  position: fixed;
  inset: 0;
  pointer-events: none;
  background:
    radial-gradient(ellipse 80% 60% at 50% -20%, rgba(20, 168, 140, 0.08), transparent),
    radial-gradient(ellipse 60% 40% at 80% 80%, rgba(20, 168, 140, 0.04), transparent);
  z-index: 0;
}

.quiz-container {
  position: relative;
  z-index: 1;
  max-width: 920px;
  margin: 0 auto;
}

/* ============================================================
   HEADER
   ============================================================ */
.quiz-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2.5rem;
  padding: 0 0.25rem;
}

.quiz-header-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 52px;
  height: 52px;
  border-radius: 14px;
  background: linear-gradient(135deg, #2563eb 0%, #3b82f6 100%);
  box-shadow: 0 8px 24px rgba(37, 99, 235, 0.25);
  flex-shrink: 0;
}

.quiz-header-svg { width: 26px; height: 26px; color: #fff; }
.quiz-header-title { font-size: 1.625rem; font-weight: 700; color: #1e293b; letter-spacing: -0.02em; margin: 0; line-height: 1.3; }
.quiz-header-subtitle { font-size: 0.9rem; color: #64748b; margin: 0.2rem 0 0; line-height: 1.4; }

/* ============================================================
   FORM
   ============================================================ */
.quiz-form {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 20px;
  padding: 2rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-top: 1rem;
}

.quiz-form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.75rem;
}

.quiz-form-col { display: flex; flex-direction: column; gap: 1.5rem; }

/* ============================================================
   INPUT GROUP (shared with original)
   ============================================================ */
.input-group { display: flex; flex-direction: column; gap: 0.35rem; }
.input-label { font-size: 0.8125rem; font-weight: 600; color: #475569; letter-spacing: 0.01em; }
.required-star { color: #f43f5e; }
.input-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
.input-wrapper { position: relative; display: flex; align-items: center; }
.input-icon { position: absolute; left: 13px; width: 18px; height: 18px; color: #64748b; pointer-events: none; flex-shrink: 0; transition: color 0.2s ease; }
.input-field {
  width: 100%; padding: 0.7rem 0.85rem 0.7rem 2.5rem; background: #f8fafc;
  border: 1px solid #cbd5e1; border-radius: 10px; color: #1e293b; font-size: 0.9rem;
  font-family: inherit; outline: none; transition: all 0.2s ease;
}
.input-field::placeholder { color: #94a3b8; }
.input-field:hover { border-color: #94a3b8; }
.input-field:focus { border-color: #3b82f6; background: #ffffff; box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1); }
.input-field--textarea { padding-left: 0.85rem; resize: vertical; min-height: 80px; }
.qf-textarea { min-height: 60px; }
.input-wrapper--textarea .input-icon { display: none; }
.input-suffix { position: absolute; right: 14px; font-size: 0.8rem; font-weight: 500; color: #64748b; pointer-events: none; }
.input-field--date::-webkit-calendar-picker-indicator { opacity: 0.6; filter: invert(0.4); cursor: pointer; }
.input-field--date::-webkit-calendar-picker-indicator:hover { opacity: 1; filter: invert(0.6); }
.input-error {
  font-size: 0.78rem; color: #fb7185; margin: 0; display: flex; align-items: center; gap: 4px;
}
.input-error::before {
  content: ''; display: inline-block; width: 14px; height: 14px;
  background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23fb7185' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='12' cy='12' r='10'/%3E%3Cline x1='15' y1='9' x2='9' y2='15'/%3E%3Cline x1='9' y1='9' x2='15' y2='15'/%3E%3C/svg%3E") no-repeat center;
  background-size: contain; flex-shrink: 0;
}
.input-hint { font-size: 0.75rem; color: #64748b; margin: 0; }
.input-group--error .input-field { border-color: #f43f5e; background: #fef2f2; }
.input-group--error .input-field:focus { box-shadow: 0 0 0 3px rgba(244, 63, 94, 0.1); background: #fef2f2; }
.input-group--error .input-icon { color: #f43f5e; }

/* ============================================================
   TOGGLE CARD
   ============================================================ */
.toggle-card {
  display: flex; align-items: center; justify-content: space-between; gap: 1rem;
  padding: 1rem 1.125rem; background: #f8fafc; border: 1px solid #e2e8f0;
  border-radius: 12px; transition: border-color 0.2s ease; cursor: pointer;
}
.toggle-card:hover { border-color: #94a3b8; }
.toggle-card-content { display: flex; align-items: center; gap: 0.85rem; }
.toggle-card-icon {
  display: flex; align-items: center; justify-content: center; width: 36px; height: 36px;
  border-radius: 10px; background: #ffffff; flex-shrink: 0;
}
.toggle-card-icon svg { width: 18px; height: 18px; color: #3b82f6; }
.toggle-card-text { display: flex; flex-direction: column; gap: 0.15rem; }
.toggle-card-label { font-size: 0.875rem; font-weight: 600; color: #1e293b; }
.toggle-card-desc { font-size: 0.75rem; color: #64748b; }
.toggle-switch {
  position: relative; display: inline-flex; width: 46px; height: 26px; border-radius: 999px;
  border: none; background: #cbd5e1; cursor: pointer; flex-shrink: 0;
  transition: background 0.25s ease; padding: 0;
}
.toggle-switch:focus-visible { outline: 2px solid #3b82f6; outline-offset: 2px; }
.toggle-switch--active { background: #3b82f6; }
.toggle-switch-knob {
  display: block; width: 20px; height: 20px; border-radius: 50%; background: #ffffff;
  box-shadow: 0 2px 4px rgba(0,0,0,0.15); transition: all 0.25s cubic-bezier(0.4,0,0.2,1); margin: 3px;
}
.toggle-switch-knob--active { transform: translateX(20px); }

/* ============================================================
   SEGMENTED CONTROL
   ============================================================ */
.segmented-control {
  display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem;
  background: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 12px; padding: 0.375rem;
}
.segmented-btn {
  display: flex; align-items: center; justify-content: center; gap: 0.4rem;
  padding: 0.6rem 0.75rem; border: none; border-radius: 9px; background: transparent;
  color: #64748b; font-size: 0.85rem; font-weight: 500; font-family: inherit;
  cursor: pointer; transition: all 0.2s ease;
}
.segmented-btn:hover { color: #475569; background: rgba(0,0,0,0.03); }
.segmented-btn:focus-visible { outline: 2px solid #3b82f6; outline-offset: 2px; }
.segmented-btn-icon { width: 16px; height: 16px; flex-shrink: 0; }
.segmented-btn--active { font-weight: 600; box-shadow: 0 1px 3px rgba(0,0,0,0.3); }
.segmented-btn--draft.segmented-btn--active { background: linear-gradient(135deg,#fef3c7,#fde68a); color: #92400e; }
.segmented-btn--published.segmented-btn--active { background: linear-gradient(135deg,#dbeafe,#bfdbfe); color: #1e40af; }

/* ============================================================
   SECTION DIVIDER
   ============================================================ */
.quiz-section-divider {
  display: flex; align-items: center; gap: 1rem; margin: 2rem 0 1.5rem;
}
.quiz-section-divider-line { flex: 1; height: 1px; background: #e2e8f0; }
.quiz-section-divider-label {
  display: flex; align-items: center; gap: 0.5rem; font-size: 0.9rem; font-weight: 700;
  color: #1e293b; white-space: nowrap;
}
.divider-icon { width: 18px; height: 18px; color: #3b82f6; }

/* ============================================================
   QUESTIONS LIST
   ============================================================ */
.questions-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1rem;
}

.questions-empty {
  display: flex; flex-direction: column; align-items: center; gap: 0.35rem;
  padding: 1.5rem; border: 2px dashed #e2e8f0; border-radius: 14px; margin-bottom: 1rem;
}
.questions-empty-icon { font-size: 1.75rem; }
.questions-empty-text { font-size: 0.9rem; font-weight: 600; color: #64748b; }
.questions-empty-hint { font-size: 0.8rem; color: #94a3b8; }

.questions-summary {
  display: flex; align-items: center; justify-content: center; gap: 0.5rem;
  padding: 0.5rem; font-size: 0.8rem; color: #64748b; margin-bottom: 0.75rem;
}
.questions-summary-count, .questions-summary-points { font-weight: 600; }
.questions-summary-divider { color: #cbd5e1; }

/* ============================================================
   ADD QUESTION BUTTON
   ============================================================ */
.btn-add-question {
  width: 100%; display: flex; align-items: center; justify-content: center; gap: 0.5rem;
  padding: 0.7rem; border: 2px dashed #cbd5e1; border-radius: 12px; background: transparent;
  color: #2563eb; font-size: 0.9rem; font-weight: 600; font-family: inherit;
  cursor: pointer; transition: all 0.2s ease; margin-bottom: 1rem;
}
.btn-add-question:hover {
  border-color: #3b82f6; background: #eff6ff; transform: translateY(-1px);
}
.btn-add-icon { width: 18px; height: 18px; }

/* ============================================================
   INLINE QUESTION FORM PANEL
   ============================================================ */
.question-form-panel {
  background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 1.5rem;
  margin-bottom: 1.25rem;
}
.question-form-panel-header {
  display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.25rem;
}
.question-form-panel-title { font-size: 1.05rem; font-weight: 700; color: #1e293b; margin: 0; }
.question-form-close {
  display: flex; align-items: center; justify-content: center; width: 32px; height: 32px;
  border: none; border-radius: 8px; background: transparent; color: #94a3b8; cursor: pointer;
  transition: all 0.2s ease;
}
.question-form-close svg { width: 18px; height: 18px; }
.question-form-close:hover { background: #fee2e2; color: #ef4444; }

/* Question type grid inside panel */
.question-type-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.5rem; }
.type-btn {
  display: flex; flex-direction: column; align-items: center; gap: 0.3rem;
  padding: 0.7rem 0.5rem; background: #ffffff; border: 1px solid #e2e8f0;
  border-radius: 10px; cursor: pointer; transition: all 0.2s ease; font-family: inherit;
}
.type-btn:hover { border-color: #94a3b8; transform: translateY(-1px); }
.type-btn--active { border-color: #3b82f6; background: #eff6ff; box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }
.type-btn-icon { font-size: 1.1rem; }
.type-btn-label { font-size: 0.75rem; font-weight: 500; color: #475569; }
.type-btn--active .type-btn-label { color: #2563eb; font-weight: 600; }

/* Choices */
.choices-header { display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; }
.choices-list { display: flex; flex-direction: column; gap: 0.4rem; }
.choice-row {
  display: flex; align-items: center; gap: 0.5rem; padding: 0.4rem;
  border-radius: 8px; border: 1px solid #e2e8f0; transition: all 0.2s ease;
}
.choice-row--correct { border-color: #86efac; background: #f0fdf4; }
.choice-radio-wrapper { display: flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0; }
.choice-radio {
  width: 20px; height: 20px; border-radius: 50%; border: 2px solid #cbd5e1;
  display: flex; align-items: center; justify-content: center; transition: all 0.2s ease;
}
.choice-radio--selected { border-color: #16a34a; background: #16a34a; }
.choice-radio-dot { width: 7px; height: 7px; border-radius: 50%; background: #ffffff; }
.choice-input { padding-left: 0.75rem; flex: 1; border: none; background: transparent; font-size: 0.85rem; }
.choice-input:focus { box-shadow: none; border: none; background: transparent; }
.choice-remove-btn {
  display: flex; align-items: center; justify-content: center; width: 26px; height: 26px;
  border: none; background: transparent; color: #94a3b8; cursor: pointer; border-radius: 6px;
  transition: all 0.2s ease; flex-shrink: 0;
}
.choice-remove-btn svg { width: 14px; height: 14px; }
.choice-remove-btn:hover { color: #ef4444; background: #fef2f2; }
.choice-correct-badge {
  font-size: 0.6rem; font-weight: 600; padding: 0.1rem 0.4rem; border-radius: 999px;
  background: #dbeafe; color: #1e40af; white-space: nowrap; flex-shrink: 0;
}

/* True/False */
.tf-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.65rem; }
.tf-btn {
  display: flex; align-items: center; justify-content: center; gap: 0.4rem; padding: 0.85rem;
  border: 2px solid #e2e8f0; border-radius: 10px; background: #ffffff;
  font-size: 0.9rem; font-weight: 600; font-family: inherit; cursor: pointer; transition: all 0.2s ease;
}
.tf-btn:hover { border-color: #94a3b8; transform: translateY(-1px); }
.tf-btn--true.tf-btn--active { border-color: #2563eb; background: #eff6ff; color: #1e40af; }
.tf-btn--false.tf-btn--active { border-color: #ef4444; background: #fef2f2; color: #991b1b; }
.tf-icon { font-size: 1rem; }

/* Inline actions */
.qf-inline-actions {
  display: flex; align-items: center; justify-content: flex-end; gap: 0.75rem;
  margin-top: 0.5rem; padding-top: 1rem; border-top: 1px solid #e2e8f0;
}

/* ============================================================
   QUESTION FORM TRANSITION
   ============================================================ */
.slide-fade-enter-active { transition: all 0.25s ease-out; }
.slide-fade-leave-active { transition: all 0.2s ease-in; }
.slide-fade-enter-from { opacity: 0; transform: translateY(-12px); }
.slide-fade-leave-to { opacity: 0; transform: translateY(-8px); }

/* ============================================================
   LOADING & ACTIONS
   ============================================================ */
.quiz-loading {
  display: flex; align-items: center; justify-content: center; gap: 0.75rem; padding: 1.5rem 0;
}
.quiz-loading-text { font-size: 0.9rem; color: #94a3b8; font-weight: 500; }

.quiz-actions {
  display: flex; align-items: center; justify-content: flex-end; gap: 0.85rem;
  margin-top: 1.75rem; padding-top: 1.5rem; border-top: 1px solid #e2e8f0;
}

.btn {
  display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.7rem 1.5rem;
  border-radius: 10px; font-size: 0.875rem; font-weight: 600; font-family: inherit;
  border: none; cursor: pointer; transition: all 0.2s ease; text-decoration: none;
}
.btn:focus-visible { outline: 2px solid #3b82f6; outline-offset: 2px; }
.btn:disabled { cursor: not-allowed; opacity: 0.45; }
.btn-sm { padding: 0.35rem 0.75rem; font-size: 0.8rem; border-radius: 8px; }
.btn-sm-icon { width: 14px; height: 14px; }
.btn-outline { background: transparent; color: #2563eb; border: 1px solid #cbd5e1; }
.btn-outline:hover { background: #eff6ff; border-color: #3b82f6; }
.btn-cancel { background: transparent; color: #64748b; border: 1px solid #cbd5e1; }
.btn-cancel:hover { background: #f8fafc; color: #475569; border-color: #94a3b8; }
.btn-submit {
  background: linear-gradient(135deg, #2563eb, #3b82f6); color: #ffffff;
  box-shadow: 0 4px 14px rgba(37,99,235,0.25);
}
.btn-submit:hover:not(:disabled) {
  transform: translateY(-1px); box-shadow: 0 6px 20px rgba(37,99,235,0.4);
  background: linear-gradient(135deg, #1d4ed8, #2563eb);
}
.btn-submit-icon { width: 18px; height: 18px; }

/* ============================================================
   RESPONSIVE
   ============================================================ */
@media (max-width: 768px) {
  .quiz-create-page { padding: 1.25rem 0.75rem 3rem; }
  .quiz-form-grid { grid-template-columns: 1fr; gap: 1.25rem; }
  .quiz-form { padding: 1.25rem; border-radius: 16px; }
  .quiz-header { flex-direction: column; text-align: center; gap: 0.75rem; }
  .quiz-header-icon { width: 48px; height: 48px; }
  .quiz-header-svg { width: 24px; height: 24px; }
  .quiz-header-title { font-size: 1.3rem; }
  .quiz-header-subtitle { font-size: 0.85rem; }
  .input-row { grid-template-columns: 1fr; gap: 1.25rem; }
  .quiz-actions { flex-direction: column-reverse; gap: 0.75rem; }
  .btn { width: 100%; justify-content: center; }
  .question-type-grid { grid-template-columns: repeat(3, 1fr); }
  .type-btn { padding: 0.65rem 0.35rem; }
  .type-btn-icon { font-size: 1rem; }
  .type-btn-label { font-size: 0.7rem; }
  .tf-grid { grid-template-columns: 1fr 1fr; }
  .question-form-panel { padding: 1.125rem; }
  .qf-inline-actions { flex-direction: column-reverse; }

  .segmented-control { grid-template-columns: 1fr 1fr; }
  .toggle-card { padding: 0.875rem 1rem; }
  .toggle-card-icon { width: 32px; height: 32px; }
  .toggle-card-icon svg { width: 16px; height: 16px; }
  .toggle-card-label { font-size: 0.85rem; }
  .toggle-card-desc { font-size: 0.7rem; }
  .toggle-switch { width: 42px; height: 24px; }
  .toggle-switch-knob { width: 18px; height: 18px; }
  .toggle-switch-knob--active { transform: translateX(18px); }
}

@media (max-width: 480px) {
  .quiz-create-page { padding: 1rem 0.5rem 2.5rem; }
  .quiz-form { padding: 1rem; border-radius: 14px; }
  .quiz-header-title { font-size: 1.2rem; }
  .input-field { font-size: 0.85rem; padding: 0.65rem 0.75rem 0.65rem 2.25rem; }
  .input-icon { left: 10px; width: 16px; height: 16px; }
  .input-label { font-size: 0.75rem; }
  .input-hint { font-size: 0.7rem; }
  .btn { padding: 0.65rem 1.25rem; font-size: 0.85rem; }
}
</style>
