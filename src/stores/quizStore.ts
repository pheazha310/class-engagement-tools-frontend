import { defineStore } from 'pinia'
import { ref } from 'vue'
import { quizService } from '@/services/quizService'
import type { QuizFormData, Quiz } from '@/types/quiz'

export const useQuizStore = defineStore('quiz', () => {
  const quiz = ref<Quiz | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const success = ref(false)

  async function createQuiz(data: QuizFormData) {
    loading.value = true
    error.value = null
    success.value = false
    try {
      const created = await quizService.createQuiz(data)
      quiz.value = created
      success.value = true
      return created
    } catch (e: any) {
      const msg = e.response?.data?.message
        || e.response?.data?.error
        || (e.response?.data?.errors ? Object.values(e.response.data.errors).flat().join(', ') : null)
        || 'Failed to create quiz.'
      error.value = msg
      throw e
    } finally {
      loading.value = false
    }
  }

  function reset() {
    quiz.value = null
    loading.value = false
    error.value = null
    success.value = false
  }

  function clearError() {
    error.value = null
  }

  return {
    quiz,
    loading,
    error,
    success,
    createQuiz,
    reset,
    clearError,
  }
})
