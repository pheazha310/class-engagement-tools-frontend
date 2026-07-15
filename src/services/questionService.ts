import api from './api'
import type { Question, QuestionFormData } from '@/types/question'

export const questionService = {
  async getQuestions(quizId: string) {
    const response = await api.get(`/api/quizzes/${quizId}/questions`)
    return response.data.data as Question[]
  },

  async getQuestionById(id: string) {
    const response = await api.get(`/api/questions/${id}`)
    return response.data.data as Question
  },

  async createQuestion(quizId: string, data: QuestionFormData) {
    const response = await api.post(`/api/quizzes/${quizId}/questions`, data)
    return response.data.data as Question
  },

  async updateQuestion(id: string, data: QuestionFormData) {
    const response = await api.put(`/api/questions/${id}`, data)
    return response.data.data as Question
  },

  async deleteQuestion(id: string) {
    const response = await api.delete(`/api/questions/${id}`)
    return response.data
  },
}
