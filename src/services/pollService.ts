import api from './api'
import { getVoterToken } from '@/utils/voterToken'
import type { Poll, PollFormData, PollResultsData, QrCodeData } from '@/types/poll'

/**
 * Map frontend PollFormData to the backend's expected schema.
 */
function mapFormDataToBackend(data: PollFormData): Record<string, any> {
  return {
    title: data.question,
    question: data.question,
    options: data.is_open_text ? [] : (data.options || []),
    duration_minutes: data.duration_minutes || null,
    is_multiple_choice: data.is_multiple_choice || false,
    is_anonymous: data.is_anonymous || false,
    is_quiz: data.is_quiz || false,
    is_open_text: data.is_open_text || false,
    max_points: data.max_points || null,
    show_results: true,
  }
}

/**
 * Map a backend Poll object to the frontend Poll interface.
 */
function mapBackendPollToFrontend(poll: any): Poll {
  return {
    id: poll.id,
    title: poll.title,
    description: poll.description,
    question: poll.question,
    status: poll.status === 'closed' ? 'ended' : poll.status,
    poll_type: poll.poll_type,
    is_multiple_choice: poll.is_multiple_choice ?? (poll.poll_type === 'multiple_choice'),
    is_anonymous: poll.is_anonymous ?? poll.anonymous ?? false,
    is_quiz: poll.is_quiz ?? false,
    is_open_text: poll.is_open_text ?? (poll.poll_type === 'open_text'),
    allow_multiple_votes: poll.allow_multiple_votes ?? false,
    anonymous: poll.anonymous ?? false,
    show_results: poll.show_results ?? true,
    public_token: poll.public_token,
    created_by: poll.created_by,
    duration_minutes: poll.duration_minutes,
    started_at: poll.started_at,
    ended_at: poll.ended_at,
    options: (poll.options || []).map((opt: any) => ({
      id: opt.id,
      option_text: opt.option_text,
      display_order: opt.display_order,
    })),
    total_votes: poll.total_votes,
    created_at: poll.created_at,
    updated_at: poll.updated_at,
  }
}

export const pollService = {
  async getPolls(perPage = 10) {
    const response = await api.get('/api/polls', { params: { per_page: perPage } })
    return response.data
  },

  async getPoll(id: string) {
    const response = await api.get(`/api/polls/${id}`)
    // Backend returns { data: ..., poll: ... }
    const raw = response.data.data || response.data.poll
    return mapBackendPollToFrontend(raw) as Poll
  },

  async createPoll(data: PollFormData) {
    const backendData = mapFormDataToBackend(data)
    const response = await api.post('/api/polls', backendData)
    // Backend returns { message, data, poll }
    const raw = response.data.data || response.data.poll
    return mapBackendPollToFrontend(raw) as Poll
  },

  async updatePoll(id: string, data: Partial<PollFormData>) {
    const backendData = mapFormDataToBackend(data as PollFormData)
    const response = await api.put(`/api/polls/${id}`, backendData)
    const raw = response.data.data || response.data.poll
    return mapBackendPollToFrontend(raw) as Poll
  },

  async deletePoll(id: string) {
    const response = await api.delete(`/api/polls/${id}`)
    return response.data
  },

  async startPoll(id: string) {
    const response = await api.post(`/api/polls/${id}/start`)
    return response.data
  },

  async endPoll(id: string) {
    const response = await api.post(`/api/polls/${id}/end`)
    return response.data
  },

  async getActivePoll() {
    const response = await api.get('/api/polls/active', { params: { voter_token: getVoterToken() } })
    return response.data
  },

  async vote(pollId: string, optionId: string | null, points?: number, textResponse?: string) {
    const payload: Record<string, any> = { voter_token: getVoterToken() }
    if (optionId != null) payload.option_id = optionId
    if (points !== undefined) payload.points = points
    if (textResponse !== undefined) payload.text_response = textResponse
    const response = await api.post(`/api/polls/${pollId}/vote`, payload)
    return response.data as PollResultsData
  },

  async getResults(pollId: string) {
    const response = await api.get(`/api/polls/${pollId}/results`)
    return response.data as PollResultsData
  },

  async getQrCode(pollId: string) {
    const response = await api.get(`/api/polls/${pollId}/qr`)
    return response.data as QrCodeData
  },
}
