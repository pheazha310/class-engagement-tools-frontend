<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useClassroomQuizStore } from '@/stores/classroomQuizStore'
const router = useRouter()
const store = useClassroomQuizStore()

const step = ref<'details' | 'questions'>('details')
const toastMessage = ref<string | null>(null)
const toastType = ref<'success' | 'error'>('success')

// Quiz details
const form = reactive({
  title: '',
  description: '',
  subject: '',
  class_name: '',
  duration: 10,
  passing_score: 50,
  shuffle_questions: false,
})

// Questions
const questions = ref<
  {
    id: string
    question_text: string
    question_type: 'multiple_choice' | 'true_false' | 'multiple_answer'
    points: number
    choices: { id: string; choice_text: string; is_correct: boolean }[]
  }[]
>([])

function addQuestion() {
  questions.value.push({
    id: `q-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    question_text: '',
    question_type: 'multiple_choice',
    points: 10,
    choices: [
      { id: 'a', choice_text: '', is_correct: false },
      { id: 'b', choice_text: '', is_correct: false },
      { id: 'c', choice_text: '', is_correct: false },
      { id: 'd', choice_text: '', is_correct: false },
    ],
  })
}

function removeQuestion(index: number) {
  if (questions.value.length <= 1) return
  questions.value.splice(index, 1)
}

function addChoice(questionIndex: number) {
  const q = questions.value[questionIndex]!
  const nextId = String.fromCharCode(97 + q.choices.length)
  q.choices.push({ id: nextId, choice_text: '', is_correct: false })
}

function removeChoice(questionIndex: number, choiceIndex: number) {
  const q = questions.value[questionIndex]!
  if (q.choices.length <= 2) return
  q.choices.splice(choiceIndex, 1)
}

function toggleCorrectAnswer(questionIndex: number, choiceId: string) {
  const q = questions.value[questionIndex]!
  if (q.question_type === 'multiple_answer') {
    const choice = q.choices.find(c => c.id === choiceId)
    if (choice) choice.is_correct = !choice.is_correct
  } else {
    q.choices.forEach(c => { c.is_correct = c.id === choiceId })
  }
}

function canGoToQuestions(): boolean {
  return form.title.trim() !== '' &&
         form.subject.trim() !== '' &&
         form.class_name.trim() !== '' &&
         form.duration >= 1
}

function goToQuestions() {
  if (!canGoToQuestions()) return
  if (questions.value.length === 0) {
    addQuestion()
  }
  step.value = 'questions'
}

function backToDetails() {
  step.value = 'details'
}

function isQuestionValid(index: number): boolean {
  const q = questions.value[index]!
  if (!q.question_text.trim()) return false
  if (q.choices.length < 2) return false
  const hasCorrect = q.choices.some(c => c.is_correct)
  if (!hasCorrect) return false
  const allFilled = q.choices.every(c => c.choice_text.trim() !== '')
  if (!allFilled) return false
  return true
}

function allQuestionsValid(): boolean {
  return questions.value.length > 0 && questions.value.every((_, i) => isQuestionValid(i))
}

function createQuiz() {
  if (!allQuestionsValid()) return

  const quizId = `custom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`

  store.createCustomQuiz({
    id: quizId,
    title: form.title.trim(),
    description: form.description.trim(),
    subject: form.subject.trim(),
    class_name: form.class_name.trim(),
    duration: form.duration,
    passing_score: form.passing_score,
    due_date: '2026-12-31T23:59:59Z',
    shuffle_questions: form.shuffle_questions,
    status: 'published' as const,
    questions: questions.value.map((q, idx) => ({
      id: q.id,
      question_text: q.question_text.trim(),
      question_type: q.question_type,
      points: q.points,
      choices: q.choices.map(c => ({ ...c })),
      correct_answer: q.choices.find(c => c.is_correct)!.choice_text,
      order: idx + 1,
    })),
  })

  toastMessage.value = 'Quiz created successfully!'
  toastType.value = 'success'

  setTimeout(() => {
    router.push('/classroom')
  }, 1200)
}

function cancel() {
  router.push('/classroom')
}
</script>

<template>
  <div class="create-page">
    <div class="create-bg" aria-hidden="true"></div>

    <div class="create-container">
      <!-- Header -->
      <header class="create-header">
        <button class="btn-back-icon" @click="cancel" title="Back">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
          </svg>
        </button>
        <div class="create-header-icon">
          <svg class="create-header-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 5v14" /><path d="M5 12h14" />
          </svg>
        </div>
        <div>
          <h1 class="create-header-title">Create Your Own Quiz</h1>
          <p class="create-header-subtitle">Design a custom quiz for your classroom</p>
        </div>
      </header>

      <!-- Steps indicator -->
      <div class="steps-bar">
        <div class="step-item" :class="{ 'step-item--active': step === 'details', 'step-item--done': step === 'questions' }">
          <span class="step-number">1</span>
          <span class="step-label">Quiz Details</span>
        </div>
        <div class="step-connector" :class="{ 'step-connector--done': step === 'questions' }"></div>
        <div class="step-item" :class="{ 'step-item--active': step === 'questions' }">
          <span class="step-number">2</span>
          <span class="step-label">Questions</span>
        </div>
      </div>

      <!-- Toast -->
      <div v-if="toastMessage" class="toast" :class="'toast--' + toastType">
        <svg v-if="toastType === 'success'" class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
        </svg>
        <span>{{ toastMessage }}</span>
      </div>

      <!-- Step 1: Quiz Details -->
      <div v-if="step === 'details'" class="form-card">
        <h2 class="form-section-title">Quiz Information</h2>

        <div class="form-group">
          <label class="form-label">Quiz Title <span class="required">*</span></label>
          <input v-model="form.title" type="text" placeholder="e.g. Algebra Quiz" class="form-input" />
        </div>

        <div class="form-group">
          <label class="form-label">Description</label>
          <textarea v-model="form.description" placeholder="Brief description of the quiz..." class="form-textarea" rows="3"></textarea>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Subject <span class="required">*</span></label>
            <input v-model="form.subject" type="text" placeholder="e.g. Mathematics" class="form-input" />
          </div>
          <div class="form-group">
            <label class="form-label">Class <span class="required">*</span></label>
            <input v-model="form.class_name" type="text" placeholder="e.g. Grade 10A" class="form-input" />
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Duration (minutes) <span class="required">*</span></label>
            <input v-model.number="form.duration" type="number" min="1" max="180" class="form-input" />
          </div>
          <div class="form-group">
            <label class="form-label">Passing Score (%)</label>
            <input v-model.number="form.passing_score" type="number" min="0" max="100" class="form-input" />
          </div>
        </div>

        <div class="form-group">
          <label class="checkbox-label">
            <input v-model="form.shuffle_questions" type="checkbox" class="checkbox-input" />
            <span class="checkbox-custom"></span>
            Shuffle questions for each student
          </label>
        </div>

        <div class="form-actions">
          <button class="btn btn-cancel" @click="cancel">Cancel</button>
          <button class="btn btn-next" :disabled="!canGoToQuestions()" @click="goToQuestions">
            Next: Add Questions
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="btn-arrow">
              <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
            </svg>
          </button>
        </div>
      </div>

      <!-- Step 2: Questions -->
      <div v-if="step === 'questions'" class="form-card">
        <div class="form-section-header">
          <h2 class="form-section-title">Questions ({{ questions.length }})</h2>
          <button class="btn btn-add-question" @click="addQuestion">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="btn-icon">
              <path d="M12 5v14" /><path d="M5 12h14" />
            </svg>
            Add Question
          </button>
        </div>

        <div
          v-for="(q, qIdx) in questions"
          :key="q.id"
          class="question-block"
          :class="{ 'question-block--invalid': !isQuestionValid(qIdx) }"
        >
          <div class="question-block-header">
            <span class="question-block-number">Question {{ qIdx + 1 }}</span>
            <button
              v-if="questions.length > 1"
              class="btn-remove-question"
              @click="removeQuestion(qIdx)"
              title="Remove question"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
            </button>
          </div>

          <div class="form-group">
            <label class="form-label">Question Text <span class="required">*</span></label>
            <input v-model="q.question_text" type="text" placeholder="Enter your question..." class="form-input" />
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Type</label>
              <select v-model="q.question_type" class="form-select">
                <option value="multiple_choice">Multiple Choice</option>
                <option value="multiple_answer">Multiple Answer</option>
                <option value="true_false">True / False</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Points <span class="required">*</span></label>
              <input v-model.number="q.points" type="number" min="1" max="100" class="form-input" />
            </div>
          </div>

          <!-- Choices -->
          <div class="choices-section">
            <label class="form-label">Answer Choices <span class="required">*</span></label>
            <div
              v-for="(choice, cIdx) in q.choices"
              :key="choice.id"
              class="choice-row"
              :class="{ 'choice-row--correct': choice.is_correct }"
            >
              <button
                class="choice-correct-btn"
                :class="{ 'choice-correct-btn--active': choice.is_correct }"
                @click="toggleCorrectAnswer(qIdx, choice.id)"
                :title="choice.is_correct ? 'Correct answer' : 'Mark as correct'"
              >
                <svg v-if="choice.is_correct" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span v-else>{{ choice.id.toUpperCase() }}</span>
              </button>
              <input
                v-model="choice.choice_text"
                type="text"
                :placeholder="`Choice ${choice.id.toUpperCase()}...`"
                class="form-input choice-input"
              />
              <button
                v-if="q.choices.length > 2"
                class="btn-remove-choice"
                @click="removeChoice(qIdx, cIdx)"
                title="Remove choice"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <button
              v-if="(q.question_type === 'multiple_choice' || q.question_type === 'multiple_answer') && q.choices.length < 6"
              class="btn-add-choice"
              @click="addChoice(qIdx)"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="btn-icon-sm">
                <path d="M12 5v14" /><path d="M5 12h14" />
              </svg>
              Add Choice
            </button>
          </div>
        </div>

        <div class="form-actions">
          <button class="btn btn-cancel" @click="backToDetails">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="btn-arrow">
              <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
            </svg>
            Back
          </button>
          <button class="btn btn-create" :disabled="!allQuestionsValid()" @click="createQuiz">
            <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            Create Quiz
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ============================================================
   PAGE CONTAINER
   ============================================================ */
.create-page {
  position: relative;
  min-height: 100vh;
  padding: 7rem 1rem 4rem;
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
}

.create-bg {
  position: fixed;
  inset: 0;
  pointer-events: none;
  background:
    radial-gradient(ellipse 70% 50% at 50% -15%, rgba(99, 102, 241, 0.07), transparent),
    radial-gradient(ellipse 50% 40% at 20% 90%, rgba(20, 184, 166, 0.04), transparent);
  z-index: 0;
}

.create-container {
  position: relative;
  z-index: 1;
  max-width: 720px;
  margin: 0 auto;
}

/* ============================================================
   HEADER
   ============================================================ */
.create-header {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  margin-bottom: 1.5rem;
  padding: 0 0.25rem;
}

.btn-back-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  border: 1px solid #cbd5e1;
  background: #ffffff;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s ease;
  padding: 0;
  flex-shrink: 0;
}

.btn-back-icon svg { width: 20px; height: 20px; }

.btn-back-icon:hover {
  border-color: #3b82f6;
  color: #2563eb;
  background: #eff6ff;
}

.create-header-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 14px;
  background: linear-gradient(135deg, #2563eb 0%, #3b82f6 100%);
  box-shadow: 0 8px 24px rgba(37, 99, 235, 0.25);
  flex-shrink: 0;
}

.create-header-svg {
  width: 24px;
  height: 24px;
  color: #fff;
}

.create-header-title {
  font-size: 1.4rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
  line-height: 1.3;
}

.create-header-subtitle {
  font-size: 0.85rem;
  color: #64748b;
  margin: 0.15rem 0 0;
}

/* ============================================================
   STEPS BAR
   ============================================================ */
.steps-bar {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
  padding: 1rem 1.25rem;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
}

.step-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.step-number {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #f1f5f9;
  color: #94a3b8;
  font-size: 0.8rem;
  font-weight: 700;
  transition: all 0.2s ease;
}

.step-item--active .step-number {
  background: #2563eb;
  color: #fff;
}

.step-item--done .step-number {
  background: #16a34a;
  color: #fff;
}

.step-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: #94a3b8;
}

.step-item--active .step-label { color: #1e293b; }
.step-item--done .step-label { color: #16a34a; }

.step-connector {
  flex: 1;
  height: 2px;
  background: #e2e8f0;
  border-radius: 2px;
}

.step-connector--done { background: #16a34a; }

/* ============================================================
   TOAST
   ============================================================ */
.toast {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0.85rem 1.25rem;
  border-radius: 10px;
  font-size: 0.9rem;
  font-weight: 600;
  margin-bottom: 1rem;
  animation: toastSlideIn 0.3s ease;
}

@keyframes toastSlideIn {
  from { transform: translateY(-10px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

.toast--success {
  background: #d1fae5;
  color: #065f46;
  border: 1px solid #86efac;
}

.toast--error {
  background: #fee2e2;
  color: #991b1b;
  border: 1px solid #fca5a5;
}

.toast-icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

/* ============================================================
   FORM CARD
   ============================================================ */
.form-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 1.75rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.form-section-title {
  font-size: 1.15rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 1.25rem;
}

.form-section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.25rem;
  gap: 1rem;
  flex-wrap: wrap;
}

.form-section-header .form-section-title {
  margin-bottom: 0;
}

/* Form elements */
.form-group {
  margin-bottom: 1rem;
}

.form-label {
  display: block;
  font-size: 0.85rem;
  font-weight: 600;
  color: #475569;
  margin-bottom: 0.4rem;
}

.required { color: #ef4444; }

.form-input,
.form-textarea,
.form-select {
  width: 100%;
  padding: 0.7rem 0.85rem;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  font-size: 0.9rem;
  font-family: inherit;
  outline: none;
  transition: all 0.2s ease;
  box-sizing: border-box;
  background: #fff;
  color: #1e293b;
}

.form-textarea { resize: vertical; min-height: 80px; }

.form-input:focus,
.form-textarea:focus,
.form-select:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

/* Checkbox */
.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  font-size: 0.9rem;
  color: #475569;
  cursor: pointer;
  user-select: none;
}

.checkbox-input {
  display: none;
}

.checkbox-custom {
  width: 20px;
  height: 20px;
  border: 2px solid #cbd5e1;
  border-radius: 5px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.checkbox-input:checked + .checkbox-custom {
  background: #2563eb;
  border-color: #2563eb;
}

.checkbox-input:checked + .checkbox-custom::after {
  content: '';
  width: 6px;
  height: 10px;
  border: solid #fff;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
  margin-top: -2px;
}

/* Buttons */
.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.65rem 1.25rem;
  border-radius: 10px;
  font-size: 0.85rem;
  font-weight: 600;
  font-family: inherit;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-icon { width: 16px; height: 16px; }
.btn-icon-sm { width: 14px; height: 14px; }
.btn-arrow { width: 16px; height: 16px; }

.btn-cancel {
  background: #f1f5f9;
  color: #64748b;
}

.btn-cancel:hover {
  background: #e2e8f0;
}

.btn-next,
.btn-create {
  background: linear-gradient(135deg, #2563eb, #3b82f6);
  color: #ffffff;
  box-shadow: 0 4px 14px rgba(37, 99, 235, 0.25);
}

.btn-next:hover:not(:disabled),
.btn-create:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(37, 99, 235, 0.4);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1.5rem;
  padding-top: 1.25rem;
  border-top: 1px solid #f1f5f9;
}

/* ============================================================
   QUESTIONS
   ============================================================ */
.btn-add-question {
  background: #f0fdf4;
  color: #16a34a;
  border: 1px solid #86efac;
  font-size: 0.8rem;
}

.btn-add-question:hover {
  background: #d1fae5;
}

.question-block {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 1.25rem;
  margin-bottom: 1rem;
}

.question-block--invalid {
  border-color: #fca5a5;
}

.question-block-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.85rem;
}

.question-block-number {
  font-size: 0.8rem;
  font-weight: 700;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.btn-remove-question {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  border: none;
  background: #fee2e2;
  color: #dc2626;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-remove-question svg { width: 14px; height: 14px; }

.btn-remove-question:hover {
  background: #fecaca;
}

/* Choices within a question */
.choices-section {
  margin-top: 0.75rem;
}

.choice-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  padding: 0.5rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #ffffff;
  transition: all 0.2s ease;
}

.choice-row--correct {
  border-color: #86efac;
  background: #f0fdf4;
}

.choice-correct-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  border: 2px solid #cbd5e1;
  background: #ffffff;
  color: #94a3b8;
  font-size: 0.75rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
  padding: 0;
}

.choice-correct-btn svg { width: 16px; height: 16px; }

.choice-correct-btn:hover {
  border-color: #16a34a;
}

.choice-correct-btn--active {
  border-color: #16a34a;
  background: #16a34a;
  color: #fff;
}

.choice-input {
  flex: 1;
}

.btn-remove-choice {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  border: none;
  background: transparent;
  color: #94a3b8;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
  padding: 0;
}

.btn-remove-choice svg { width: 16px; height: 16px; }

.btn-remove-choice:hover {
  background: #fee2e2;
  color: #dc2626;
}

.btn-add-choice {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.4rem 0.75rem;
  border: 1px dashed #94a3b8;
  border-radius: 8px;
  background: transparent;
  color: #64748b;
  font-size: 0.78rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: inherit;
  margin-top: 0.25rem;
}

.btn-add-choice:hover {
  border-color: #3b82f6;
  color: #2563eb;
}

/* ============================================================
   RESPONSIVE
   ============================================================ */
@media (max-width: 768px) {
  .create-page { padding: 1.25rem 0.75rem 3rem; }

  .create-header { flex-wrap: wrap; }

  .create-header-title { font-size: 1.2rem; }

  .form-row { grid-template-columns: 1fr; }

  .steps-bar { flex-wrap: wrap; }

  .step-label { font-size: 0.75rem; }

  .form-actions { flex-direction: column; }

  .btn { width: 100%; justify-content: center; }
}
</style>
