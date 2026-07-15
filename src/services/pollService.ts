import api from './api'
import { getVoterToken } from '@/utils/voterToken'
import type { Poll, PollFormData, PollResultsData, QrCodeData } from '@/types/poll'

export const pollService = {
  async getPolls(perPage = 10) {
    const response = await api.get('/api/polls', { params: { per_page: perPage } })
    return response.data
  },

  async getPoll(id: number) {
    const response = await api.get(`/api/polls/${id}`)
    return response.data.data as Poll
  },

  async createPoll(data: PollFormData) {
    const response = await api.post('/api/polls', data)
    return response.data.data as Poll
  },

  async updatePoll(id: number, data: Partial<PollFormData>) {
    const response = await api.put(`/api/polls/${id}`, data)
    return response.data.data as Poll
  },

  async deletePoll(id: number) {
    const response = await api.delete(`/api/polls/${id}`)
    return response.data
  },

  async startPoll(id: number) {
    const response = await api.post(`/api/polls/${id}/start`)
    return response.data
  },

  async endPoll(id: number) {
    const response = await api.post(`/api/polls/${id}/end`)
    return response.data
  },

  async getActivePoll() {
    const response = await api.get('/api/polls/active', { params: { voter_token: getVoterToken() } })
    return response.data
  },

  async vote(pollId: number, optionId: number | null, points?: number, textResponse?: string) {
    const payload: Record<string, any> = { voter_token: getVoterToken() }
    if (optionId != null) payload.option_id = optionId
    if (points !== undefined) payload.points = points
    if (textResponse !== undefined) payload.text_response = textResponse
    const response = await api.post(`/api/polls/${pollId}/vote`, payload)
    return response.data as PollResultsData
  },

  async getResults(pollId: number) {
    const response = await api.get(`/api/polls/${pollId}/results`)
    return response.data as PollResultsData
  },

  async getQrCode(pollId: number) {
    const response = await api.get(`/api/polls/${pollId}/qr`)
    return response.data as QrCodeData
  },
}
