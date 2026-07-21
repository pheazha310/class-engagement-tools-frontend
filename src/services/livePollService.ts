import api from './api'
import type { LivePoll, LivePollFormData, LivePollResults, PaginatedResponse, ActivePollItem } from '@/types/livePoll'

export const livePollService = {
  async getPolls(params?: { page?: number; per_page?: number; search?: string; status?: string }) {
    const response = await api.get<PaginatedResponse<LivePoll>>('/api/polls', { params })
    return response.data
  },

  async getPoll(id: string) {
    const response = await api.get<{ poll: LivePoll }>(`/api/polls/${id}`)
    return response.data.poll
  },

  async createPoll(data: LivePollFormData) {
    const response = await api.post<{ message: string; poll: LivePoll }>('/api/polls', data)
    return response.data.poll
  },

  async updatePoll(id: string, data: Partial<LivePollFormData>) {
    const response = await api.put<{ message: string; poll: LivePoll }>(`/api/polls/${id}`, data)
    return response.data.poll
  },

  async deletePoll(id: string) {
    const response = await api.delete<{ message: string }>(`/api/polls/${id}`)
    return response.data
  },

  async startPoll(id: string) {
    const response = await api.post<{ message: string; poll: LivePoll }>(`/api/polls/${id}/start`)
    return response.data.poll
  },

  async endPoll(id: string) {
    const response = await api.post<{ message: string; poll: LivePoll }>(`/api/polls/${id}/end`)
    return response.data.poll
  },

  async getActivePolls() {
    const response = await api.get<{ polls: ActivePollItem[] }>('/api/polls/active')
    return response.data.polls
  },

  async getPublicPoll(token: string) {
    const response = await api.get<{ poll: LivePoll }>(`/api/polls/public/${token}`)
    return response.data.poll
  },

  async getPublicResults(token: string) {
    const response = await api.get<{ results: LivePollResults }>(`/api/polls/public/${token}/results`)
    return response.data.results
  },

  async submitVote(token: string, optionId: string, guestToken?: string) {
    const response = await api.post<{ message: string }>(`/api/polls/public/${token}/vote`, {
      option_id: optionId,
      guest_token: guestToken,
    })
    return response.data
  },
}

function getGuestToken(): string {
  const key = 'live_poll_guest_token'
  let token = localStorage.getItem(key)
  if (!token) {
    token = crypto.randomUUID()
    localStorage.setItem(key, token)
  }
  return token
}

export { getGuestToken }
