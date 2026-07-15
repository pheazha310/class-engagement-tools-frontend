<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { questionService } from '@/services/questionService'
import { quizService } from '@/services/quizService'
import type { Question } from '@/types/question'
import type { Quiz } from '@/types/quiz'
import QuestionCard from '@/components/QuestionCard.vue'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import EmptyState from '@/components/EmptyState.vue'
import DeleteQuestionModal from '@/components/DeleteQuestionModal.vue'
import ToastNotification from '@/components/ToastNotification.vue'

const router = useRouter()
const route = useRoute()

const quizId = route.params.quizId as string

const quiz = ref<Quiz | null>(null)
const questions = ref<Question[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const toastMessage = ref<string | null>(null)
const toastType = ref<'success' | 'error'>('success')

const showDeleteDialog = ref(false)
const questionToDelete = ref<string | null>(null)
const deleting = ref(false)

async function loadData() {
  loading.value = true
  error.value = null
  try {
    const [quizData, questionsData] = await Promise.all([
      quizService.getQuiz(quizId),
      questionService.getQuestions(quizId),
    ])
    quiz.value = quizData
    questions.value = questionsData
  } catch (e: any) {
    const msg = e.response?.data?.message || 'Failed to load questions.'
    error.value = msg
    toastMessage.value = msg
    toastType.value = 'error'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadData()
})

function goToAddQuestion() {
  router.push(`/quizzes/${quizId}/questions/create`)
}

function goToEditQuestion(id: string) {
  router.push(`/quizzes/${quizId}/questions/${id}/edit`)
}

function confirmDelete(id: string) {
  questionToDelete.value = id
  showDeleteDialog.value = true
}

async function executeDelete() {
  if (!questionToDelete.value) return
  deleting.value = true
  try {
    await questionService.deleteQuestion(questionToDelete.value)
    questions.value = questions.value.filter((q) => q.id !== questionToDelete.value)
    toastMessage.value = 'Question deleted successfully.'
    toastType.value = 'success'
  } catch (e: any) {
    toastMessage.value = e.response?.data?.message || 'Failed to delete question.'
    toastType.value = 'error'
  } finally {
    showDeleteDialog.value = false
    questionToDelete.value = null
    deleting.value = false
  }
}

function goBackToQuiz() {
  router.push({ name: 'teacher-quizzes' })
}
</script>

<template>
  <div class="questions-page">
    <div class="questions-bg" aria-hidden="true"></div>

    <div class="questions-container">
      <!-- ===================== HEADER ===================== -->
      <header class="questions-header">
        <div class="questions-header-left">
          <button class="btn btn-back-icon" @click="goBackToQuiz" title="Back to quizzes">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
            </svg>
          </button>
          <div class="questions-header-icon">
            <svg class="questions-header-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
          <div>
            <h1 class="questions-header-title" v-if="quiz">{{ quiz.title }} — Questions</h1>
            <h1 class="questions-header-title" v-else>Questions</h1>
            <p class="questions-header-subtitle" v-if="quiz">
              {{ questions.length }} question{{ questions.length !== 1 ? 's' : '' }} · {{ quiz.subject }} · {{ quiz.class_name }}
            </p>
            <p class="questions-header-subtitle" v-else>Manage questions for this quiz</p>
          </div>
        </div>
        <button class="btn btn-primary" @click="goToAddQuestion">
          <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M12 5v14" /><path d="M5 12h14" />
          </svg>
          Add Question
        </button>
      </header>

      <!-- ===================== ERROR ===================== -->
      <div v-if="error && !loading" class="error-banner">
        <svg class="error-banner-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <span>{{ error }}</span>
        <button class="error-retry-btn" @click="loadData">Retry</button>
      </div>

      <!-- ===================== LOADING ===================== -->
      <LoadingSpinner v-if="loading && questions.length === 0" />

      <!-- ===================== EMPTY ===================== -->
      <EmptyState
        v-else-if="!loading && questions.length === 0 && !error"
        title="No questions yet"
        description="Start building your quiz by adding questions."
        icon="❓"
      >
        <button class="btn btn-primary mt-4" @click="goToAddQuestion">
          + Add Question
        </button>
      </EmptyState>

      <!-- ===================== QUESTION LIST ===================== -->
      <div v-else-if="questions.length > 0" class="questions-grid">
        <QuestionCard
          v-for="(question, index) in questions"
          :key="question.id"
          :question="question"
          :index="index"
          @edit="goToEditQuestion"
          @delete="confirmDelete"
        />
      </div>
    </div>

    <!-- Delete confirmation -->
    <DeleteQuestionModal
      :show="showDeleteDialog"
      :deleting="deleting"
      @confirm="executeDelete"
      @cancel="showDeleteDialog = false"
    />

    <!-- Toast -->
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
.questions-page {
  position: relative;
  min-height: 100vh;
  padding: 7rem 1rem 4rem;
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
}

.questions-bg {
  position: fixed;
  inset: 0;
  pointer-events: none;
  background:
    radial-gradient(ellipse 70% 50% at 50% -15%, rgba(13, 148, 136, 0.07), transparent),
    radial-gradient(ellipse 50% 40% at 20% 90%, rgba(99, 102, 241, 0.04), transparent);
  z-index: 0;
}

.questions-container {
  position: relative;
  z-index: 1;
  max-width: 900px;
  margin: 0 auto;
}

/* ============================================================
   HEADER
   ============================================================ */
.questions-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 2.5rem;
  padding: 0 0.25rem;
  flex-wrap: wrap;
}

.questions-header-left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
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
}

.btn-back-icon svg {
  width: 20px;
  height: 20px;
}

.btn-back-icon:hover {
  border-color: #14b8a6;
  color: #0d9488;
  background: #f0fdfa;
}

.questions-header-icon {
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

.questions-header-svg {
  width: 26px;
  height: 26px;
  color: #fff;
}

.questions-header-title {
  font-size: 1.625rem;
  font-weight: 700;
  color: #1e293b;
  letter-spacing: -0.02em;
  margin: 0;
  line-height: 1.3;
}

.questions-header-subtitle {
  font-size: 0.9rem;
  color: #64748b;
  margin: 0.2rem 0 0;
  line-height: 1.4;
}

/* ============================================================
   BUTTONS
   ============================================================ */
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

.btn-primary {
  background: linear-gradient(135deg, #0d9488, #14b8a6);
  color: #ffffff;
  box-shadow: 0 4px 14px rgba(13, 148, 136, 0.25);
}

.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(13, 148, 136, 0.4);
  background: linear-gradient(135deg, #0f766e, #0d9488);
}

.btn-icon {
  width: 18px;
  height: 18px;
}

/* ============================================================
   ERROR BANNER
   ============================================================ */
.error-banner {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.25rem;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 12px;
  color: #991b1b;
  font-size: 0.875rem;
  margin-bottom: 1rem;
}

.error-banner-icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  color: #ef4444;
}

.error-retry-btn {
  margin-left: auto;
  padding: 0.35rem 0.85rem;
  border: 1px solid #fecaca;
  border-radius: 8px;
  background: #ffffff;
  color: #991b1b;
  font-size: 0.8rem;
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s ease;
}

.error-retry-btn:hover {
  background: #fee2e2;
}

.mt-4 {
  margin-top: 1rem;
}

/* ============================================================
   QUESTIONS GRID
   ============================================================ */
.questions-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}

/* ============================================================
   RESPONSIVE
   ============================================================ */
@media (max-width: 768px) {
  .questions-page {
    padding: 1.25rem 0.75rem 3rem;
  }

  .questions-header {
    flex-direction: column;
    align-items: stretch;
    gap: 0.75rem;
  }

  .questions-header-left {
    flex-direction: column;
    text-align: center;
    gap: 0.6rem;
  }

  .questions-header-icon {
    width: 48px;
    height: 48px;
  }

  .questions-header-svg {
    width: 24px;
    height: 24px;
  }

  .questions-header-title {
    font-size: 1.3rem;
  }

  .questions-header-subtitle {
    font-size: 0.85rem;
  }

  .btn {
    width: 100%;
    justify-content: center;
  }

  .btn-back-icon {
    align-self: flex-start;
  }

  .error-banner {
    flex-wrap: wrap;
  }
}
</style>
