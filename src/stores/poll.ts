import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { getEcho } from '@/services/echo'
import { getVoterToken } from '@/utils/voterToken'
import type { Channel } from 'laravel-echo'

export interface PollOption {
  id: number
  option_text: string
  is_correct?: boolean
}

export interface Poll {
  id: number
  teacher_id: number
  school_id: number | null
  province_id: number | null
  question: string
  room_code: string | null
  status: 'draft' | 'active' | 'ended'
  is_multiple_choice: boolean
  is_anonymous?: boolean
  is_quiz?: boolean
  is_open_text?: boolean
  max_points?: number | null
  duration_minutes: number | null
  started_at: string | null
  ended_at: string | null
  options: PollOption[]
  total_votes?: number
  participant_count?: number
  created_at: string
  updated_at: string
}

export interface PollResult {
  id: number
  option: string
  votes: number
  percentage: number
  points?: number | null
  is_correct?: boolean
}

export interface OpenTextResponse {
  text: string
  student_name?: string
  student_id?: number
}

export interface PollResultsData {
  question: string
  status: string
  totalVotes: number
  totalPoints?: number | null
  is_anonymous?: boolean
  is_quiz?: boolean
  is_open_text?: boolean
  max_points?: number | null
  has_weights?: boolean
  results: any[]
  quiz_summary?: {
    correct_option_ids: number[]
    total_votes: number
    correct_votes: number
    correct_percentage: number
    correct_students: Array<{ student_id: number; student_name: string }>
  } | null
}

export const usePollStore = defineStore('poll', () => {
  const currentPoll = ref<Poll | null>(null)
  const polls = ref<Poll[]>([])
  const activeSchoolPolls = ref<Poll[]>([])
  const results = ref<PollResultsData | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const hasVoted = ref(false)
  const pollingInterval = ref<ReturnType<typeof setInterval> | null>(null)
  const echoChannel = ref<Channel | null>(null)

  const isActive = computed(() => currentPoll.value?.status === 'active')
  const isEnded = computed(() => currentPoll.value?.status === 'ended')
  const activePolls = computed(() => polls.value.filter(p => p.status === 'active'))
  const draftPolls = computed(() => polls.value.filter(p => p.status === 'draft'))
  const endedPolls = computed(() => polls.value.filter(p => p.status === 'ended'))

  async function apiCall<T>(url: string, options?: RequestInit): Promise<T> {
    const separator = url.includes('?') ? '&' : '?'
    const urlWithToken = `${url}${separator}voter_token=${getVoterToken()}`
    const res = await fetch(urlWithToken, {
      credentials: 'include',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json', ...options?.headers },
      ...options,
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.message || `Request failed: ${res.status}`)
    return data
  }

  async function fetchTeacherPolls() {
    loading.value = true
    error.value = null
    try {
      const data = await apiCall<{ data: Poll[] }>('/api/polls')
      polls.value = data.data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load polls'
    } finally {
      loading.value = false
    }
  }

  async function createPoll(payload: {
    question: string
    options: string[]
    is_multiple_choice?: boolean
    duration_minutes?: number | null
    is_anonymous?: boolean
    is_quiz?: boolean
    is_open_text?: boolean
    max_points?: number | null
    options_correct?: boolean[]
  }) {
    loading.value = true
    error.value = null
    try {
      const data = await apiCall<{ data: Poll }>('/api/polls', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
      polls.value.unshift(data.data)
      return data.data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create poll'
      return null
    } finally {
      loading.value = false
    }
  }

  async function startPoll(pollId: number) {
    error.value = null
    try {
      const data = await apiCall<{ poll: Poll }>(`/api/polls/${pollId}/start`, { method: 'POST' })
      const idx = polls.value.findIndex(p => p.id === pollId)
      if (idx !== -1) polls.value[idx] = data.poll
      if (currentPoll.value?.id === pollId) currentPoll.value = data.poll
      return data.poll
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to start poll'
      return null
    }
  }

  async function endPoll(pollId: number) {
    error.value = null
    try {
      const data = await apiCall<{ poll: Poll }>(`/api/polls/${pollId}/end`, { method: 'POST' })
      const idx = polls.value.findIndex(p => p.id === pollId)
      if (idx !== -1) polls.value[idx] = data.poll
      if (currentPoll.value?.id === pollId) currentPoll.value = data.poll
      return data.poll
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to end poll'
      return null
    }
  }

  async function deletePoll(pollId: number) {
    error.value = null
    try {
      await apiCall(`/api/polls/${pollId}`, { method: 'DELETE' })
      polls.value = polls.value.filter(p => p.id !== pollId)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete poll'
    }
  }

  async function fetchPollByRoomCode(roomCode: string) {
    loading.value = true
    error.value = null
    hasVoted.value = false
    try {
      const data = await apiCall<{ poll: Poll; hasVoted: boolean }>('/api/polls/join-by-code', {
        method: 'POST',
        body: JSON.stringify({ room_code: roomCode.toUpperCase() }),
      })
      currentPoll.value = data.poll
      hasVoted.value = data.hasVoted
      return data.poll
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Invalid room code'
      return null
    } finally {
      loading.value = false
    }
  }

  async function fetchActivePoll() {
    loading.value = true
    error.value = null
    try {
      const data = await apiCall<{ poll: Poll; hasVoted: boolean }>('/api/polls/active')
      currentPoll.value = data.poll
      hasVoted.value = data.hasVoted
      return data.poll
    } catch {
      currentPoll.value = null
      return null
    } finally {
      loading.value = false
    }
  }

  async function fetchActiveSchoolPolls() {
    loading.value = true
    error.value = null
    try {
      const data = await apiCall<{ polls?: Poll[]; poll?: Poll }>('/api/polls/active')
      const pollsPayload = Array.isArray(data.polls) ? data.polls : (data.poll ? [data.poll] : [])
      activeSchoolPolls.value = pollsPayload
      return pollsPayload
    } catch (err) {
      activeSchoolPolls.value = []
      error.value = err instanceof Error ? err.message : 'Failed to load polls'
      return []
    } finally {
      loading.value = false
    }
  }

  async function submitVote(optionId: number | null, points?: number, textResponse?: string) {
    if (!currentPoll.value) return
    error.value = null
    const body: Record<string, any> = { voter_token: getVoterToken() }
    if (optionId != null) body.option_id = optionId
    if (points !== undefined) body.points = points
    if (textResponse !== undefined) body.text_response = textResponse
    try {
      const data = await apiCall<{ data: PollResultsData }>(`/api/polls/${currentPoll.value.id}/vote`, {
        method: 'POST',
        body: JSON.stringify(body),
      })
      hasVoted.value = true
      results.value = data.data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to submit vote'
    }
  }

  async function fetchResults(pollId: number) {
    error.value = null
    try {
      const data = await apiCall<{ data: PollResultsData }>(`/api/polls/${pollId}/results`)
      results.value = data.data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load results'
    }
  }

  function startPolling(pollId: number, intervalMs = 3000) {
    stopPolling()
    pollingInterval.value = setInterval(() => fetchResults(pollId), intervalMs)
  }

  function stopPolling() {
    if (pollingInterval.value) {
      clearInterval(pollingInterval.value)
      pollingInterval.value = null
    }
  }

  function listenForVoteUpdates(pollId: number) {
    stopListening()
    try {
      const echo = getEcho()
      echoChannel.value = echo.private(`poll.${pollId}`).listen('VoteUpdated', (data: {
        pollId: number
        totalVotes: number
        results: PollResult[]
      }) => {
        if (results.value) {
          results.value.totalVotes = data.totalVotes
          results.value.results = data.results
        }
      })
    } catch {
      // Echo not configured; fall back to polling
      startPolling(pollId)
    }
  }

  function stopListening() {
    if (echoChannel.value) {
      echoChannel.value.stopListening('VoteUpdated')
      try {
        const echo = getEcho()
        echo.leaveChannel(`poll.${currentPoll.value?.id}`)
      } catch {
        // ignore
      }
      echoChannel.value = null
    }
  }

  function reset() {
    currentPoll.value = null
    results.value = null
    error.value = null
    hasVoted.value = false
    stopPolling()
    stopListening()
  }

  return {
    currentPoll, polls, activeSchoolPolls, results, loading, error, hasVoted,
    isActive, isEnded, activePolls, draftPolls, endedPolls,
    apiCall, fetchTeacherPolls, createPoll, startPoll, endPoll, deletePoll,
    fetchPollByRoomCode, fetchActivePoll, fetchActiveSchoolPolls, submitVote, fetchResults,
    startPolling, stopPolling, listenForVoteUpdates, stopListening, reset,
  }
})
