import { defineStore } from 'pinia'
import { ref } from 'vue'
import { quizService } from '@/services/quizService'
import type { QuizFormData, Quiz } from '@/types/quiz'

export const useQuizStore = defineStore('quiz', () => {
  const quizzes = ref<Quiz[]>([])
  const quiz = ref<Quiz | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const success = ref(false)

  async function fetchQuizzes(params?: { search?: string; subject?: string; class_name?: string; status?: string }) {
    loading.value = true
    error.value = null
    try {
      const data = await quizService.getQuizzes(params)
      quizzes.value = data
      return data
    } catch (e: any) {
      error.value = e.response?.data?.message || 'Failed to fetch quizzes.'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function createQuiz(data: QuizFormData) {
    loading.value = true
    error.value = null
    success.value = false
    try {
      const created = await quizService.createQuiz(data)
      quiz.value = created
      quizzes.value.unshift(created)
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

  async function deleteQuiz(id: string) {
    loading.value = true
    error.value = null
    try {
      await quizService.deleteQuiz(id)
      quizzes.value = quizzes.value.filter((q) => q.id !== id)
    } catch (e: any) {
      error.value = e.response?.data?.message || 'Failed to delete quiz.'
      throw e
    } finally {
      loading.value = false
    }
  }

  function reset() {
    quiz.value = null
    quizzes.value = []
    loading.value = false
    error.value = null
    success.value = false
  }

  function clearError() {
    error.value = null
  }

  return {
    quizzes,
    quiz,
    loading,
    error,
    success,
    fetchQuizzes,
    createQuiz,
    deleteQuiz,
    reset,
    clearError,
  }
})
