import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export interface PollOption {
  id: number
  option_text: string
}

export interface Poll {
  id: number
  teacher_id: number
  question: string
  room_code: string | null
  status: 'draft' | 'active' | 'ended'
  is_multiple_choice: boolean
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
}

export interface PollResultsData {
  question: string
  status: string
  totalVotes: number
  results: PollResult[]
}

export const usePollStore = defineStore('poll', () => {
  const currentPoll = ref<Poll | null>(null)
  const polls = ref<Poll[]>([])
  const results = ref<PollResultsData | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const hasVoted = ref(false)
  const pollingInterval = ref<ReturnType<typeof setInterval> | null>(null)

  const isActive = computed(() => currentPoll.value?.status === 'active')
  const isEnded = computed(() => currentPoll.value?.status === 'ended')
  const activePolls = computed(() => polls.value.filter(p => p.status === 'active'))
  const draftPolls = computed(() => polls.value.filter(p => p.status === 'draft'))
  const endedPolls = computed(() => polls.value.filter(p => p.status === 'ended'))

  async function apiCall<T>(url: string, options?: RequestInit): Promise<T> {
    const res = await fetch(url, {
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
      const data = await apiCall<{ poll: { data: Poll } }>(`/api/polls/${pollId}/start`, { method: 'POST' })
      const idx = polls.value.findIndex(p => p.id === pollId)
      if (idx !== -1) polls.value[idx] = data.poll.data
      if (currentPoll.value?.id === pollId) currentPoll.value = data.poll.data
      return data.poll.data
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to start poll'
      return null
    }
  }

  async function endPoll(pollId: number) {
    error.value = null
    try {
      const data = await apiCall<{ poll: { data: Poll } }>(`/api/polls/${pollId}/end`, { method: 'POST' })
      const idx = polls.value.findIndex(p => p.id === pollId)
      if (idx !== -1) polls.value[idx] = data.poll.data
      if (currentPoll.value?.id === pollId) currentPoll.value = data.poll.data
      return data.poll.data
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
      const data = await apiCall<{ poll: { data: Poll }; hasVoted: boolean }>('/api/polls/join-by-code', {
        method: 'POST',
        body: JSON.stringify({ room_code: roomCode.toUpperCase() }),
      })
      currentPoll.value = data.poll.data
      hasVoted.value = data.hasVoted
      return data.poll.data
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
      const data = await apiCall<{ poll: { data: Poll }; hasVoted: boolean }>('/api/polls/active')
      currentPoll.value = data.poll.data
      hasVoted.value = data.hasVoted
      return data.poll.data
    } catch {
      currentPoll.value = null
      return null
    } finally {
      loading.value = false
    }
  }

  async function submitVote(optionId: number) {
    if (!currentPoll.value) return
    error.value = null
    try {
      const data = await apiCall<{ data: PollResultsData }>(`/api/polls/${currentPoll.value.id}/vote`, {
        method: 'POST',
        body: JSON.stringify({ option_id: optionId }),
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

  function reset() {
    currentPoll.value = null
    results.value = null
    error.value = null
    hasVoted.value = false
    stopPolling()
  }

  return {
    currentPoll, polls, results, loading, error, hasVoted,
    isActive, isEnded, activePolls, draftPolls, endedPolls,
    fetchTeacherPolls, createPoll, startPoll, endPoll, deletePoll,
    fetchPollByRoomCode, fetchActivePoll, submitVote, fetchResults,
    startPolling, stopPolling, reset,
  }
})
