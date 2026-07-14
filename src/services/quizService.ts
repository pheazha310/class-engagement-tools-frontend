import api from './api'
import type { QuizFormData, Quiz } from '@/types/quiz'

export const quizService = {
  async createQuiz(data: QuizFormData) {
    const response = await api.post('/api/quizzes', data)
    return response.data.data as Quiz
  },
}
