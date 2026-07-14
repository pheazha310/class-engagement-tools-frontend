<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useQuizStore } from '@/stores/quizStore'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import ToastNotification from '@/components/ToastNotification.vue'
import type { QuizFormData, Quiz } from '@/types/quiz'
import type { AxiosError } from 'axios'

const router = useRouter()
const route = useRoute()
const store = useQuizStore()

const isEditMode = computed(() => !!route.params.id)
const quizId = computed(() => route.params.id as string | undefined)

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
const errors = ref<Record<string, string>>({})
const toastMessage = ref<string | null>(null)
const toastType = ref<'success' | 'error'>('success')

const isFormValid = computed(() => {
  return form.title.trim() !== '' &&
    form.subject.trim() !== '' &&
    form.class_name.trim() !== '' &&
    form.duration > 0 &&
    form.due_date !== ''
})

function validate(): boolean {
  errors.value = {}

  if (!form.title.trim()) {
    errors.value.title = 'Quiz title is required.'
  }

  if (!form.subject.trim()) {
    errors.value.subject = 'Subject is required.'
  }

  if (!form.class_name.trim()) {
    errors.value.class_name = 'Class is required.'
  }

  if (!form.duration || form.duration < 1) {
    errors.value.duration = 'Duration must be at least 1 minute.'
  }

  if (form.passing_score < 0 || form.passing_score > 100) {
    errors.value.passing_score = 'Passing score must be between 0 and 100.'
  }

  if (!form.due_date) {
    errors.value.due_date = 'Due date is required.'
  } else {
    const due = new Date(form.due_date).getTime()
    const now = Date.now()
    // Must be at least 1 minute in the future to account for clock drift
    if (due <= now + 60000) {
      errors.value.due_date = 'Due date must be at least 1 minute from now.'
    }
  }

  return Object.keys(errors.value).length === 0
}

async function handleSubmit() {
  if (!validate()) return

  try {
    if (isEditMode.value && quizId.value) {
      const { quizService } = await import('@/services/quizService')
      await quizService.updateQuiz(quizId.value, { ...form })
      toastMessage.value = 'Quiz updated successfully!'
    } else {
      await store.createQuiz({ ...form })
      toastMessage.value = 'Quiz created successfully!'
    }
    toastType.value = 'success'
    setTimeout(() => {
      router.push('/quizzes')
    }, 1500)
  } catch (e: unknown) {
    const axiosError = e as AxiosError<{ message?: string; errors?: Record<string, string[]> }>
    // Try to extract the most descriptive error message
    const errData = axiosError.response?.data
    let msg = ''
    if (errData?.errors) {
      // Laravel 422 validation errors — join them together
      msg = Object.values(errData.errors).flat().join('. ')
    } else if (errData?.message) {
      msg = errData.message
    } else {
      msg = isEditMode.value ? 'Failed to update quiz.' : 'Failed to create quiz.'
    }
    toastMessage.value = msg
    toastType.value = 'error'
  }
}

const todayString = computed(() => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
})

// Load quiz data for editing
async function loadQuiz() {
  if (!quizId.value) return

  loading.value = true
  try {
    const { quizService } = await import('@/services/quizService')
    const quiz: Quiz = await quizService.getQuiz(quizId.value)
    form.title = quiz.title
    form.description = quiz.description
    form.subject = quiz.subject
    form.class_name = quiz.class_name
    form.duration = quiz.duration
    form.passing_score = quiz.passing_score
    form.due_date = quiz.due_date
    form.shuffle_questions = quiz.shuffle_questions
    form.status = quiz.status
  } catch (e: unknown) {
    const axiosError = e as AxiosError<{ message?: string }>
    alert(axiosError.response?.data?.message || 'Failed to load quiz.')
    router.push('/quizzes')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  if (isEditMode.value) {
    loadQuiz()
  }
})
</script>

<template>
  <div class="quiz-create-page">
    <!-- Background gradient -->
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
          <p class="quiz-header-subtitle">{{ isEditMode ? 'Update your quiz settings' : 'Design a quiz for your classroom assessments' }}</p>
        </div>
      </header>

      <!-- ===================== FORM ===================== -->
      <form @submit.prevent="handleSubmit" class="quiz-form" novalidate>
        <div class="quiz-form-grid">
          <!-- ======= LEFT COLUMN ======= -->
          <div class="quiz-form-col">
            <!-- Quiz Title -->
            <div class="input-group" :class="{ 'input-group--error': errors.title }">
              <label for="title" class="input-label">
                Quiz Title <span class="required-star" aria-hidden="true">*</span>
              </label>
              <div class="input-wrapper">
                <svg class="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                </svg>
                <input
                  id="title"
                  v-model="form.title"
                  type="text"
                  placeholder="e.g. Mathematics Final Exam"
                  class="input-field"
                  aria-required="true"
                  :aria-invalid="!!errors.title"
                  :aria-describedby="errors.title ? 'title-error' : undefined"
                />
              </div>
              <p v-if="errors.title" id="title-error" class="input-error" role="alert">{{ errors.title }}</p>
              <p v-else class="input-hint">Give your quiz a clear, descriptive name</p>
            </div>

            <!-- Description -->
            <div class="input-group">
              <label for="description" class="input-label">Description</label>
              <div class="input-wrapper input-wrapper--textarea">
                <textarea
                  id="description"
                  v-model="form.description"
                  rows="4"
                  placeholder="Optional — add instructions or context for students..."
                  class="input-field input-field--textarea"
                ></textarea>
              </div>
              <p class="input-hint">Briefly describe what this quiz covers (optional)</p>
            </div>

            <!-- Subject & Class (two-column sub-grid) -->
            <div class="input-row">
              <div class="input-group" :class="{ 'input-group--error': errors.subject }">
                <label for="subject" class="input-label">
                  Subject <span class="required-star" aria-hidden="true">*</span>
                </label>
                <div class="input-wrapper">
                  <svg class="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c3 3 9 3 12 0v-5" />
                  </svg>
                  <input
                    id="subject"
                    v-model="form.subject"
                    type="text"
                    placeholder="e.g. Mathematics"
                    class="input-field"
                    aria-required="true"
                    :aria-invalid="!!errors.subject"
                    :aria-describedby="errors.subject ? 'subject-error' : undefined"
                  />
                </div>
                <p v-if="errors.subject" id="subject-error" class="input-error" role="alert">{{ errors.subject }}</p>
              </div>
              <div class="input-group" :class="{ 'input-group--error': errors.class_name }">
                <label for="class_name" class="input-label">
                  Class <span class="required-star" aria-hidden="true">*</span>
                </label>
                <div class="input-wrapper">
                  <svg class="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                  <input
                    id="class_name"
                    v-model="form.class_name"
                    type="text"
                    placeholder="e.g. Grade 10A"
                    class="input-field"
                    aria-required="true"
                    :aria-invalid="!!errors.class_name"
                    :aria-describedby="errors.class_name ? 'class-error' : undefined"
                  />
                </div>
                <p v-if="errors.class_name" id="class-error" class="input-error" role="alert">{{ errors.class_name }}</p>
              </div>
            </div>

            <!-- Duration & Passing Score -->
            <div class="input-row">
              <div class="input-group" :class="{ 'input-group--error': errors.duration }">
                <label for="duration" class="input-label">
                  Duration (minutes) <span class="required-star" aria-hidden="true">*</span>
                </label>
                <div class="input-wrapper">
                  <svg class="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                  </svg>
                  <input
                    id="duration"
                    v-model.number="form.duration"
                    type="number"
                    min="1"
                    max="999"
                    placeholder="30"
                    class="input-field"
                    aria-required="true"
                    :aria-invalid="!!errors.duration"
                    :aria-describedby="errors.duration ? 'duration-error' : 'duration-hint'"
                  />
                  <span class="input-suffix">min</span>
                </div>
                <p v-if="errors.duration" id="duration-error" class="input-error" role="alert">{{ errors.duration }}</p>
                <p v-else id="duration-hint" class="input-hint">How long students have to complete the quiz</p>
              </div>
              <div class="input-group" :class="{ 'input-group--error': errors.passing_score }">
                <label for="passing_score" class="input-label">Passing Score (%)</label>
                <div class="input-wrapper">
                  <svg class="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                  <input
                    id="passing_score"
                    v-model.number="form.passing_score"
                    type="number"
                    min="0"
                    max="100"
                    placeholder="50"
                    class="input-field"
                    :aria-invalid="!!errors.passing_score"
                    :aria-describedby="errors.passing_score ? 'score-error' : 'score-hint'"
                  />
                  <span class="input-suffix">%</span>
                </div>
                <p v-if="errors.passing_score" id="score-error" class="input-error" role="alert">{{ errors.passing_score }}</p>
                <p v-else id="score-hint" class="input-hint">Minimum percentage required to pass</p>
              </div>
            </div>
          </div>

          <!-- ======= RIGHT COLUMN ======= -->
          <div class="quiz-form-col">
            <!-- Due Date -->
            <div class="input-group" :class="{ 'input-group--error': errors.due_date }">
              <label for="due_date" class="input-label">
                Due Date <span class="required-star" aria-hidden="true">*</span>
              </label>
              <div class="input-wrapper">
                <svg class="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                  <path d="M8 14h.01" /><path d="M12 14h.01" /><path d="M16 14h.01" /><path d="M8 18h.01" /><path d="M12 18h.01" /><path d="M16 18h.01" />
                </svg>
                <input
                  id="due_date"
                  v-model="form.due_date"
                  type="datetime-local"
                  :min="todayString"
                  class="input-field input-field--date"
                  aria-required="true"
                  :aria-invalid="!!errors.due_date"
                  :aria-describedby="errors.due_date ? 'due-error' : 'due-hint'"
                />
              </div>
              <p v-if="errors.due_date" id="due-error" class="input-error" role="alert">{{ errors.due_date }}</p>
              <p v-else id="due-hint" class="input-hint">When the quiz closes for submissions</p>
            </div>

            <!-- Shuffle Questions Toggle Card -->
            <div class="toggle-card">
              <div class="toggle-card-content">
                <div class="toggle-card-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <polyline points="16 3 21 3 21 8" /><line x1="4" y1="20" x2="21" y2="3" />
                    <polyline points="21 16 21 21 16 21" /><line x1="15" y1="15" x2="21" y2="21" /><line x1="4" y1="4" x2="9" y2="9" />
                  </svg>
                </div>
                <div class="toggle-card-text">
                  <span class="toggle-card-label">Shuffle Questions</span>
                  <span class="toggle-card-desc">Randomize the order of questions for each student</span>
                </div>
              </div>
              <button
                id="shuffle_questions"
                type="button"
                role="switch"
                :aria-checked="form.shuffle_questions"
                :aria-label="`Shuffle questions ${form.shuffle_questions ? 'enabled' : 'disabled'}`"
                class="toggle-switch"
                :class="{ 'toggle-switch--active': form.shuffle_questions }"
                @click="form.shuffle_questions = !form.shuffle_questions"
              >
                <span class="toggle-switch-knob" :class="{ 'toggle-switch-knob--active': form.shuffle_questions }" />
              </button>
            </div>

            <!-- Status Segmented Control -->
            <div class="input-group">
              <label class="input-label">Status</label>
              <div class="segmented-control" role="radiogroup" aria-label="Quiz status">
                <button
                  type="button"
                  role="radio"
                  :aria-checked="form.status === 'draft'"
                  class="segmented-btn"
                  :class="{ 'segmented-btn--active segmented-btn--draft': form.status === 'draft' }"
                  @click="form.status = 'draft'"
                >
                  <svg class="segmented-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="12" y1="18" x2="12" y2="12" /><line x1="9" y1="15" x2="15" y2="15" />
                  </svg>
                  <span>Draft</span>
                </button>
                <button
                  type="button"
                  role="radio"
                  :aria-checked="form.status === 'published'"
                  class="segmented-btn"
                  :class="{ 'segmented-btn--active segmented-btn--published': form.status === 'published' }"
                  @click="form.status = 'published'"
                >
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

        <!-- ===================== LOADING ===================== -->
        <div v-if="loading || store.loading" class="quiz-loading">
          <LoadingSpinner />
          <span class="quiz-loading-text">{{ isEditMode ? 'Updating your quiz...' : 'Creating your quiz...' }}</span>
        </div>

        <!-- ===================== ACTIONS ===================== -->
        <div v-else class="quiz-actions">
          <button
            type="button"
            class="btn btn-cancel"
            @click="router.push('/quizzes')"
          >
            Cancel
          </button>
          <button
            type="submit"
            :disabled="!isFormValid"
            class="btn btn-submit"
          >
            <svg class="btn-submit-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M12 5v14" /><path d="M5 12h14" />
            </svg>
            {{ isEditMode ? 'Update Quiz' : 'Create Quiz' }}
          </button>
        </div>
      </form>
    </div>

    <ToastNotification
      :message="toastMessage"
      :type="toastType"
      @close="toastMessage = null"
    />
  </div>
</template>

<style scoped>
/* ============================================================
   PAGE CONTAINER
   ============================================================ */
.quiz-create-page {
  position: relative;
  min-height: 100vh;
  padding: 5rem 1rem 4rem;
  background: #ffffff;
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
}

/* Subtle radial background glow */
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
  background: linear-gradient(135deg, #0d9488 0%, #14b8a6 100%);
  box-shadow: 0 8px 24px rgba(13, 148, 136, 0.25);
  flex-shrink: 0;
}

.quiz-header-svg {
  width: 26px;
  height: 26px;
  color: #fff;
}

.quiz-header-title {
  font-size: 1.625rem;
  font-weight: 700;
  color: #1e293b;
  letter-spacing: -0.02em;
  margin: 0;
  line-height: 1.3;
}

.quiz-header-subtitle {
  font-size: 0.9rem;
  color: #64748b;
  margin: 0.2rem 0 0;
  line-height: 1.4;
}

/* ============================================================
   FORM
   ============================================================ */
.quiz-form {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 20px;
  padding: 2rem;
  box-shadow:
    0 4px 12px rgba(0, 0, 0, 0.08),
    0 1px 3px rgba(0, 0, 0, 0.1);
  margin-top: 1rem;
}

/* Two-column grid */
.quiz-form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.75rem;
}

.quiz-form-col {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* ============================================================
   INPUT GROUP
   ============================================================ */
.input-group {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.input-label {
  font-size: 0.8125rem;
  font-weight: 600;
  color: #475569;
  letter-spacing: 0.01em;
}

.required-star {
  color: #f43f5e;
}

/* Input row for side-by-side fields */
.input-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

/* Wrapper for icon + field */
.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.input-icon {
  position: absolute;
  left: 13px;
  width: 18px;
  height: 18px;
  color: #64748b;
  pointer-events: none;
  flex-shrink: 0;
  transition: color 0.2s ease;
}

/* Shared field style */
.input-field {
  width: 100%;
  padding: 0.7rem 0.85rem 0.7rem 2.5rem;
  background: #f8fafc;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  color: #1e293b;
  font-size: 0.9rem;
  font-family: inherit;
  outline: none;
  transition: all 0.2s ease;
}

.input-field::placeholder {
  color: #94a3b8;
}

.input-field:hover {
  border-color: #94a3b8;
}

.input-field:focus {
  border-color: #14b8a6;
  background: #ffffff;
  box-shadow: 0 0 0 3px rgba(20, 184, 166, 0.1);
}

/* Date field — style the browser's date picker icon for light theme */
.input-field--date::-webkit-calendar-picker-indicator {
  opacity: 0.6;
  filter: invert(0.4);
  cursor: pointer;
}

.input-field--date::-webkit-calendar-picker-indicator:hover {
  opacity: 1;
  filter: invert(0.6);
}

/* No left icon for textarea */
.input-field--textarea {
  padding-left: 0.85rem;
  resize: vertical;
  min-height: 100px;
}

.input-wrapper--textarea .input-icon {
  display: none;
}

.input-suffix {
  position: absolute;
  right: 14px;
  font-size: 0.8rem;
  font-weight: 500;
  color: #64748b;
  pointer-events: none;
}

/* ============================================================
   ERROR / HINT
   ============================================================ */
.input-error {
  font-size: 0.78rem;
  color: #fb7185;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 4px;
}

.input-error::before {
  content: '';
  display: inline-block;
  width: 14px;
  height: 14px;
  background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23fb7185' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='12' cy='12' r='10'/%3E%3Cline x1='15' y1='9' x2='9' y2='15'/%3E%3Cline x1='9' y1='9' x2='15' y2='15'/%3E%3C/svg%3E") no-repeat center;
  background-size: contain;
  flex-shrink: 0;
}

.input-hint {
  font-size: 0.75rem;
  color: #64748b;
  margin: 0;
}

.input-group--error .input-field {
  border-color: #f43f5e;
  background: #fef2f2;
}

.input-group--error .input-field:focus {
  box-shadow: 0 0 0 3px rgba(244, 63, 94, 0.1);
  background: #fef2f2;
}

.input-group--error .input-icon {
  color: #f43f5e;
}

/* ============================================================
   TOGGLE CARD (Shuffle Questions)
   ============================================================ */
.toggle-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem 1.125rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  transition: border-color 0.2s ease;
  cursor: pointer;
}

.toggle-card:hover {
  border-color: #94a3b8;
}

.toggle-card-content {
  display: flex;
  align-items: center;
  gap: 0.85rem;
}

.toggle-card-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: #ffffff;
  flex-shrink: 0;
}

.toggle-card-icon svg {
  width: 18px;
  height: 18px;
  color: #14b8a6;
}

.toggle-card-text {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.toggle-card-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #1e293b;
}

.toggle-card-desc {
  font-size: 0.75rem;
  color: #64748b;
}

/* The switch */
.toggle-switch {
  position: relative;
  display: inline-flex;
  width: 46px;
  height: 26px;
  border-radius: 999px;
  border: none;
  background: #cbd5e1;
  cursor: pointer;
  flex-shrink: 0;
  transition: background 0.25s ease;
  padding: 0;
}

.toggle-switch:focus-visible {
  outline: 2px solid #14b8a6;
  outline-offset: 2px;
}

.toggle-switch--active {
  background: #14b8a6;
}

.toggle-switch-knob {
  display: block;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #ffffff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  margin: 3px;
}

.toggle-switch-knob--active {
  transform: translateX(20px);
  background: #fff;
}

/* ============================================================
   SEGMENTED CONTROL (Status)
   ============================================================ */
.segmented-control {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 0.375rem;
}

.segmented-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  padding: 0.6rem 0.75rem;
  border: none;
  border-radius: 9px;
  background: transparent;
  color: #64748b;
  font-size: 0.85rem;
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s ease;
}

.segmented-btn:hover {
  color: #475569;
  background: rgba(0, 0, 0, 0.03);
}

.segmented-btn:focus-visible {
  outline: 2px solid #14b8a6;
  outline-offset: 2px;
}

.segmented-btn-icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.segmented-btn--active {
  font-weight: 600;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
}

.segmented-btn--draft.segmented-btn--active {
  background: linear-gradient(135deg, #fef3c7, #fde68a);
  color: #92400e;
}

.segmented-btn--published.segmented-btn--active {
  background: linear-gradient(135deg, #d1fae5, #a7f3d0);
  color: #065f46;
}

/* ============================================================
   LOADING
   ============================================================ */
.quiz-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 1.5rem 0;
}

.quiz-loading-text {
  font-size: 0.9rem;
  color: #94a3b8;
  font-weight: 500;
}

/* ============================================================
   ACTION BUTTONS
   ============================================================ */
.quiz-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.85rem;
  margin-top: 1.75rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e2e8f0;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.7rem 1.5rem;
  border-radius: 10px;
  font-size: 0.875rem;
  font-weight: 600;
  font-family: inherit;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  text-decoration: none;
}

.btn:focus-visible {
  outline: 2px solid #14b8a6;
  outline-offset: 2px;
}

.btn:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}

/* Cancel button */
.btn-cancel {
  background: transparent;
  color: #64748b;
  border: 1px solid #cbd5e1;
}

.btn-cancel:hover:not(:disabled) {
  background: #f8fafc;
  color: #475569;
  border-color: #94a3b8;
}

/* Submit button */
.btn-submit {
  background: linear-gradient(135deg, #0d9488, #14b8a6);
  color: #ffffff;
  box-shadow: 0 4px 14px rgba(13, 148, 136, 0.25);
  padding: 0.7rem 2rem;
}

.btn-submit:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(13, 148, 136, 0.4);
  background: linear-gradient(135deg, #0f766e, #0d9488);
}

.btn-submit:active:not(:disabled) {
  transform: translateY(0);
  box-shadow: 0 2px 8px rgba(13, 148, 136, 0.3);
}

.btn-submit-icon {
  width: 18px;
  height: 18px;
}

/* ============================================================
   RESPONSIVE
   ============================================================ */
@media (max-width: 768px) {
  .quiz-create-page {
    padding: 1.25rem 0.75rem 3rem;
  }

  .quiz-form-grid {
    grid-template-columns: 1fr;
    gap: 1.25rem;
  }

  .quiz-form {
    padding: 1.25rem;
    border-radius: 16px;
  }

  .quiz-header {
    flex-direction: column;
    text-align: center;
    gap: 0.75rem;
  }

  .quiz-header-icon {
    width: 48px;
    height: 48px;
  }

  .quiz-header-svg {
    width: 24px;
    height: 24px;
  }

  .quiz-header-title {
    font-size: 1.3rem;
  }

  .quiz-header-subtitle {
    font-size: 0.85rem;
  }

  .input-row {
    grid-template-columns: 1fr;
    gap: 1.25rem;
  }

  .quiz-actions {
    flex-direction: column-reverse;
    gap: 0.75rem;
  }

  .btn {
    width: 100%;
    justify-content: center;
  }

  .segmented-control {
    grid-template-columns: 1fr 1fr;
  }

  .toggle-card {
    padding: 0.875rem 1rem;
  }

  .toggle-card-icon {
    width: 32px;
    height: 32px;
  }

  .toggle-card-icon svg {
    width: 16px;
    height: 16px;
  }

  .toggle-card-label {
    font-size: 0.85rem;
  }

  .toggle-card-desc {
    font-size: 0.7rem;
  }

  .toggle-switch {
    width: 42px;
    height: 24px;
  }

  .toggle-switch-knob {
    width: 18px;
    height: 18px;
  }

  .toggle-switch-knob--active {
    transform: translateX(18px);
  }
}

@media (max-width: 480px) {
  .quiz-create-page {
    padding: 1rem 0.5rem 2.5rem;
  }

  .quiz-form {
    padding: 1rem;
    border-radius: 14px;
  }

  .quiz-header-title {
    font-size: 1.2rem;
  }

  .input-field {
    font-size: 0.85rem;
    padding: 0.65rem 0.75rem 0.65rem 2.25rem;
  }

  .input-icon {
    left: 10px;
    width: 16px;
    height: 16px;
  }

  .input-label {
    font-size: 0.75rem;
  }

  .input-hint {
    font-size: 0.7rem;
  }

  .btn {
    padding: 0.65rem 1.25rem;
    font-size: 0.85rem;
  }
}
</style>
