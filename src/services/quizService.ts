import api from './api'
import type { QuizFormData, Quiz } from '@/types/quiz'

export const quizService = {
  async createQuiz(data: QuizFormData) {
    const response = await api.post('/api/quizzes', data)
    return response.data.data as Quiz
  },

  async getQuizzes(params?: { search?: string; subject?: string; class_name?: string; status?: string }) {
    const response = await api.get('/api/quizzes', { params })
    return response.data.data as Quiz[]
  },

  async getQuiz(id: string) {
    const response = await api.get(`/api/quizzes/${id}`)
    return response.data.data as Quiz
  },

  async updateQuiz(id: string, data: QuizFormData) {
    const response = await api.put(`/api/quizzes/${id}`, data)
    return response.data.data as Quiz
  },

  async deleteQuiz(id: string) {
    const response = await api.delete(`/api/quizzes/${id}`)
    return response.data
  },

  async duplicateQuiz(id: string) {
    const response = await api.post(`/api/quizzes/${id}/duplicate`)
    return response.data.data as Quiz
  },
}
