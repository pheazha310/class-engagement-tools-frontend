import api from './api'
import type { Poll, PollFormData, PollResultsData } from '@/types/poll'

export const pollService = {
  async getPolls(perPage = 10) {
    const response = await api.get('/polls', { params: { per_page: perPage } })
    return response.data
  },

  async getPoll(id: number) {
    const response = await api.get(`/polls/${id}`)
    return response.data.data as Poll
  },

  async createPoll(data: PollFormData) {
    const response = await api.post('/polls', data)
    return response.data.data as Poll
  },

  async updatePoll(id: number, data: Partial<PollFormData>) {
    const response = await api.put(`/polls/${id}`, data)
    return response.data.data as Poll
  },

  async deletePoll(id: number) {
    const response = await api.delete(`/polls/${id}`)
    return response.data
  },

  async startPoll(id: number) {
    const response = await api.post(`/polls/${id}/start`)
    return response.data
  },

  async endPoll(id: number) {
    const response = await api.post(`/polls/${id}/end`)
    return response.data
  },

  async getActivePoll() {
    const response = await api.get('/polls/active')
    return response.data
  },

  async vote(pollId: number, optionId: number) {
    const response = await api.post(`/polls/${pollId}/vote`, { option_id: optionId })
    return response.data as PollResultsData
  },

  async getResults(pollId: number) {
    const response = await api.get(`/polls/${pollId}/results`)
    return response.data as PollResultsData
  },
}
