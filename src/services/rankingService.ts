import api from './api'
import type { QuizRanking, RankingFilters } from '@/types/ranking'

export const rankingService = {
  async getQuizRankings(quizId: string) {
    const response = await api.get(`/api/quizzes/${quizId}/rankings`)
    return response.data.data as QuizRanking[]
  },

  async searchRankings(quizId: string, query: string) {
    const response = await api.get(`/api/quizzes/${quizId}/rankings`, {
      params: { search: query },
    })
    return response.data.data as QuizRanking[]
  },

  async filterRankings(quizId: string, filters: RankingFilters) {
    const response = await api.get(`/api/quizzes/${quizId}/rankings`, {
      params: filters,
    })
    return response.data.data as QuizRanking[]
  },
}
