import { defineStore } from 'pinia'
import { ref } from 'vue'
import { livePollService, getGuestToken } from '@/services/livePollService'
import type { LivePoll, PollStatus, LivePollFormData, LivePollResults, ActivePollItem } from '@/types/livePoll'

function getErrorMessage(e: unknown, fallback: string): string {
  const err = e as { response?: { data?: { message?: string } } }
  return err.response?.data?.message || fallback
}

export const useLivePollStore = defineStore('livePoll', () => {
  const polls = ref<LivePoll[]>([])
  const activePolls = ref<ActivePollItem[]>([])
  const currentPoll = ref<LivePoll | null>(null)
  const publicPoll = ref<LivePoll | null>(null)
  const results = ref<LivePollResults | null>(null)
  const loading = ref(false)
  const voting = ref(false)
  const hasVoted = ref(false)
  const error = ref<string | null>(null)
  const successMessage = ref<string | null>(null)
  const meta = ref<{ current_page: number; last_page: number; per_page: number; total: number } | null>(null)

  function clearError() {
    error.value = null
  }

  function clearSuccess() {
    successMessage.value = null
  }

  function clearCurrentPoll() {
    currentPoll.value = null
  }

  function clearPublicPoll() {
    publicPoll.value = null
  }

  function clearResults() {
    results.value = null
    hasVoted.value = false
  }

  async function fetchPolls(params?: { page?: number; per_page?: number; search?: string; status?: string }) {
    loading.value = true
    error.value = null
    try {
      const response = await livePollService.getPolls(params)
      polls.value = response.data
      meta.value = response.meta
      return response
    } catch (e: unknown) {
      error.value = getErrorMessage(e, 'Failed to fetch polls.')
      throw e
    } finally {
      loading.value = false
    }
  }

  async function fetchActivePolls() {
    loading.value = true
    error.value = null
    try {
      activePolls.value = await livePollService.getActivePolls()
      return activePolls.value
    } catch (e: unknown) {
      error.value = getErrorMessage(e, 'Failed to fetch active polls.')
      throw e
    } finally {
      loading.value = false
    }
  }

  async function fetchPoll(id: string) {
    loading.value = true
    error.value = null
    try {
      currentPoll.value = await livePollService.getPoll(id)
      return currentPoll.value
    } catch (e: unknown) {
      error.value = getErrorMessage(e, 'Failed to fetch poll.')
      throw e
    } finally {
      loading.value = false
    }
  }

  async function createPoll(data: LivePollFormData) {
    loading.value = true
    error.value = null
    successMessage.value = null
    try {
      const poll = await livePollService.createPoll(data)
      polls.value.unshift(poll)
      successMessage.value = 'Poll created successfully!'
      return poll
    } catch (e: unknown) {
      error.value = getErrorMessage(e, 'Failed to create poll.')
      throw e
    } finally {
      loading.value = false
    }
  }

  async function updatePoll(id: string, data: Partial<LivePollFormData>) {
    loading.value = true
    error.value = null
    successMessage.value = null
    try {
      const poll = await livePollService.updatePoll(id, data)
      const index = polls.value.findIndex((p) => p.id === id)
      if (index !== -1) polls.value[index] = poll
      currentPoll.value = poll
      successMessage.value = 'Poll updated successfully!'
      return poll
    } catch (e: unknown) {
      error.value = getErrorMessage(e, 'Failed to update poll.')
      throw e
    } finally {
      loading.value = false
    }
  }

  async function deletePoll(id: string) {
    loading.value = true
    error.value = null
    successMessage.value = null
    try {
      await livePollService.deletePoll(id)
      polls.value = polls.value.filter((p) => p.id !== id)
      successMessage.value = 'Poll deleted successfully.'
    } catch (e: unknown) {
      error.value = getErrorMessage(e, 'Failed to delete poll.')
      throw e
    } finally {
      loading.value = false
    }
  }

  async function startPoll(id: string) {
    loading.value = true
    error.value = null
    try {
      const poll = await livePollService.startPoll(id)
      const index = polls.value.findIndex((p) => p.id === id)
      if (index !== -1) polls.value[index] = poll
      currentPoll.value = poll
      successMessage.value = 'Poll started! Share the link with your students.'
      return poll
    } catch (e: unknown) {
      error.value = getErrorMessage(e, 'Failed to start poll.')
      throw e
    } finally {
      loading.value = false
    }
  }

  async function endPoll(id: string) {
    loading.value = true
    error.value = null
    try {
      const poll = await livePollService.endPoll(id)
      const index = polls.value.findIndex((p) => p.id === id)
      if (index !== -1) polls.value[index] = poll
      currentPoll.value = poll
      successMessage.value = 'Poll ended. Results are final.'
      return poll
    } catch (e: unknown) {
      error.value = getErrorMessage(e, 'Failed to end poll.')
      throw e
    } finally {
      loading.value = false
    }
  }

  async function fetchPublicPoll(token: string) {
    loading.value = true
    error.value = null
    try {
      publicPoll.value = await livePollService.getPublicPoll(token)
      return publicPoll.value
    } catch (e: unknown) {
      const err = e as { response?: { status?: number; data?: { message?: string } } }
      if (err.response?.status !== 404) {
        error.value = getErrorMessage(e, 'Failed to fetch poll.')
      }
      publicPoll.value = null
      return null
    } finally {
      loading.value = false
    }
  }

  async function fetchPublicResults(token: string) {
    loading.value = true
    error.value = null
    try {
      results.value = await livePollService.getPublicResults(token)
      return results.value
    } catch (e: unknown) {
      const err = e as { response?: { status?: number; data?: { message?: string } } }
      if (err.response?.status !== 404) {
        error.value = getErrorMessage(e, 'Failed to fetch results.')
      }
      return null
    } finally {
      loading.value = false
    }
  }

  async function submitVote(token: string, optionId: string) {
    voting.value = true
    error.value = null
    try {
      const guestToken = getGuestToken()
      await livePollService.submitVote(token, optionId, guestToken)
      hasVoted.value = true
      successMessage.value = 'Your vote has been recorded!'
    } catch (e: unknown) {
      error.value = getErrorMessage(e, 'Failed to submit vote.')
      throw e
    } finally {
      voting.value = false
    }
  }

  const filteredPolls = (status: PollStatus) => polls.value.filter((p) => p.status === status)

  return {
    polls,
    activePolls,
    currentPoll,
    publicPoll,
    results,
    loading,
    voting,
    hasVoted,
    error,
    successMessage,
    meta,
    clearError,
    clearSuccess,
    clearCurrentPoll,
    clearPublicPoll,
    clearResults,
    fetchPolls,
    fetchActivePolls,
    fetchPoll,
    createPoll,
    updatePoll,
    deletePoll,
    startPoll,
    endPoll,
    fetchPublicPoll,
    fetchPublicResults,
    submitVote,
    filteredPolls,
  }
})
