<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { questionService } from '@/services/questionService'
import { quizService } from '@/services/quizService'
import type { QuestionFormData, Question } from '@/types/question'
import type { Quiz } from '@/types/quiz'
import QuestionForm from '@/components/QuestionForm.vue'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import ToastNotification from '@/components/ToastNotification.vue'

const router = useRouter()
const route = useRoute()

const quizId = route.params.quizId as string
const questionId = route.params.questionId as string | undefined

const isEditMode = computed(() => !!questionId)

const quiz = ref<Quiz | null>(null)
const question = ref<Question | null>(null)
const loading = ref(false)
const submitting = ref(false)
const toastMessage = ref<string | null>(null)
const toastType = ref<'success' | 'error'>('success')

onMounted(async () => {
  loading.value = true
  try {
    const quizData = await quizService.getQuiz(quizId)
    quiz.value = quizData

    if (isEditMode.value && questionId) {
      const q = await questionService.getQuestionById(questionId)
      question.value = q
    }
  } catch (e: any) {
    const msg = e.response?.data?.message || 'Failed to load data.'
    toastMessage.value = msg
    toastType.value = 'error'
    setTimeout(() => router.push(`/quizzes/${quizId}/questions`), 1500)
  } finally {
    loading.value = false
  }
})

async function handleSubmit(data: QuestionFormData) {
  submitting.value = true
  try {
    if (isEditMode.value && questionId) {
      await questionService.updateQuestion(questionId, data)
      toastMessage.value = 'Question updated successfully!'
    } else {
      await questionService.createQuestion(quizId, data)
      toastMessage.value = 'Question added successfully!'
    }
    toastType.value = 'success'
    setTimeout(() => {
      router.push(`/quizzes/${quizId}/questions`)
    }, 1500)
  } catch (e: any) {
    const msg = e.response?.data?.message
      || (e.response?.data?.errors ? Object.values(e.response.data.errors).flat().join('. ') : null)
      || (isEditMode.value ? 'Failed to update question.' : 'Failed to add question.')
    toastMessage.value = msg
    toastType.value = 'error'
  } finally {
    submitting.value = false
  }
}

function handleCancel() {
  router.push(`/quizzes/${quizId}/questions`)
}
</script>

<template>
  <div class="question-form-page">
    <div class="question-form-bg" aria-hidden="true"></div>

    <div class="question-form-container">
      <!-- ===================== HEADER ===================== -->
      <header class="qf-header">
        <div class="qf-header-left">
          <button class="btn btn-back-icon" @click="handleCancel" title="Back to questions">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
            </svg>
          </button>
          <div class="qf-header-icon">
            <svg class="qf-header-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
          <div>
            <h1 class="qf-header-title">{{ isEditMode ? 'Edit Question' : 'Add Question' }}</h1>
            <p class="qf-header-subtitle" v-if="quiz">
              {{ quiz.title }} · {{ quiz.subject }} · {{ quiz.class_name }}
            </p>
            <p class="qf-header-subtitle" v-else>
              {{ isEditMode ? 'Update question details' : 'Create a new question for this quiz' }}
            </p>
          </div>
        </div>
      </header>

      <!-- Loading -->
      <LoadingSpinner v-if="loading" />

      <!-- Form Card -->
      <div v-else class="qf-form-card">
        <QuestionForm
          :question="question"
          :loading="submitting"
          @submit="handleSubmit"
          @cancel="handleCancel"
        />
      </div>
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
.question-form-page {
  position: relative;
  min-height: 100vh;
  padding: 5rem 1rem 4rem;
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
}

.question-form-bg {
  position: fixed;
  inset: 0;
  pointer-events: none;
  background:
    radial-gradient(ellipse 80% 60% at 50% -20%, rgba(20, 168, 140, 0.08), transparent),
    radial-gradient(ellipse 60% 40% at 80% 80%, rgba(20, 168, 140, 0.04), transparent);
  z-index: 0;
}

.question-form-container {
  position: relative;
  z-index: 1;
  max-width: 780px;
  margin: 0 auto;
}

/* ============================================================
   HEADER
   ============================================================ */
.qf-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.75rem;
  padding: 0 0.25rem;
}

.qf-header-left {
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

.qf-header-icon {
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

.qf-header-svg {
  width: 26px;
  height: 26px;
  color: #fff;
}

.qf-header-title {
  font-size: 1.625rem;
  font-weight: 700;
  color: #1e293b;
  letter-spacing: -0.02em;
  margin: 0;
  line-height: 1.3;
}

.qf-header-subtitle {
  font-size: 0.9rem;
  color: #64748b;
  margin: 0.2rem 0 0;
  line-height: 1.4;
}

/* ============================================================
   FORM CARD
   ============================================================ */
.qf-form-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 20px;
  padding: 2rem;
  box-shadow:
    0 4px 12px rgba(0, 0, 0, 0.08),
    0 1px 3px rgba(0, 0, 0, 0.1);
}

/* ============================================================
   RESPONSIVE
   ============================================================ */
@media (max-width: 768px) {
  .question-form-page {
    padding: 1.25rem 0.75rem 3rem;
  }

  .qf-header {
    flex-direction: column;
    align-items: stretch;
    gap: 0.75rem;
  }

  .qf-header-left {
    flex-direction: column;
    text-align: center;
    gap: 0.6rem;
  }

  .qf-header-icon {
    width: 48px;
    height: 48px;
  }

  .qf-header-svg {
    width: 24px;
    height: 24px;
  }

  .qf-header-title {
    font-size: 1.3rem;
  }

  .qf-header-subtitle {
    font-size: 0.85rem;
  }

  .qf-form-card {
    padding: 1.25rem;
    border-radius: 16px;
  }

  .btn-back-icon {
    align-self: flex-start;
  }
}
</style>
