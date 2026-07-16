import { defineStore } from 'pinia'
import { ref } from 'vue'
import { pollService } from '@/services/pollService'
import type { Poll, PollFormData, PollResultsData } from '@/types/poll'

export const usePollStore = defineStore('poll', () => {
  const polls = ref<Poll[]>([])
  const activePoll = ref<Poll | null>(null)
  const currentPoll = ref<Poll | null>(null)
  const results = ref<PollResultsData | null>(null)
  const hasVoted = ref(false)
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchPolls(perPage = 10) {
    loading.value = true
    error.value = null
    try {
      const response = await pollService.getPolls(perPage)
      polls.value = response.data
      return response
    } catch (e: any) {
      error.value = e.response?.data?.message || 'Failed to fetch polls.'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function fetchPoll(id: number) {
    loading.value = true
    error.value = null
    try {
      currentPoll.value = await pollService.getPoll(id)
      return currentPoll.value
    } catch (e: any) {
      error.value = e.response?.data?.message || 'Failed to fetch poll.'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function createPoll(data: PollFormData) {
    loading.value = true
    error.value = null
    try {
      const poll = await pollService.createPoll(data)
      polls.value.unshift(poll)
      return poll
    } catch (e: any) {
      error.value = e.response?.data?.message || 'Failed to create poll.'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function updatePoll(id: number, data: Partial<PollFormData>) {
    loading.value = true
    error.value = null
    try {
      const poll = await pollService.updatePoll(id, data)
      const index = polls.value.findIndex((p) => p.id === id)
      if (index !== -1) polls.value[index] = poll
      if (currentPoll.value?.id === id) currentPoll.value = poll
      return poll
    } catch (e: any) {
      error.value = e.response?.data?.message || 'Failed to update poll.'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function deletePoll(id: number) {
    loading.value = true
    error.value = null
    try {
      await pollService.deletePoll(id)
      polls.value = polls.value.filter((p) => p.id !== id)
    } catch (e: any) {
      error.value = e.response?.data?.message || 'Failed to delete poll.'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function startPoll(id: number) {
    loading.value = true
    error.value = null
    try {
      const response = await pollService.startPoll(id)
      const index = polls.value.findIndex((p) => p.id === id)
      if (index !== -1) polls.value[index] = response.poll
      if (currentPoll.value?.id === id) currentPoll.value = response.poll
      return response
    } catch (e: any) {
      error.value = e.response?.data?.message || 'Failed to start poll.'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function endPoll(id: number) {
    loading.value = true
    error.value = null
    try {
      const response = await pollService.endPoll(id)
      const index = polls.value.findIndex((p) => p.id === id)
      if (index !== -1) polls.value[index] = response.poll
      if (currentPoll.value?.id === id) currentPoll.value = response.poll
      return response
    } catch (e: any) {
      error.value = e.response?.data?.message || 'Failed to end poll.'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function fetchActivePoll() {
    loading.value = true
    error.value = null
    try {
      const response = await pollService.getActivePoll()
      activePoll.value = response.poll
      hasVoted.value = response.hasVoted
      return response
    } catch (e: any) {
      if (e.response?.status !== 404) {
        error.value = e.response?.data?.message || 'Failed to fetch active poll.'
      }
      activePoll.value = null
      return null
    } finally {
      loading.value = false
    }
  }

  async function submitVote(pollId: number, optionId: number) {
    loading.value = true
    error.value = null
    try {
      const result = await pollService.vote(pollId, optionId)
      results.value = result
      hasVoted.value = true
      return result
    } catch (e: any) {
      error.value = e.response?.data?.message || 'Failed to submit vote.'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function fetchResults(pollId: number) {
    loading.value = true
    error.value = null
    try {
      const result = await pollService.getResults(pollId)
      results.value = result
      return result
    } catch (e: any) {
      error.value = e.response?.data?.message || 'Failed to fetch results.'
      throw e
    } finally {
      loading.value = false
    }
  }

  function updateResultsFromBroadcast(data: { totalVotes: number; results: any[] }) {
    if (results.value) {
      results.value.totalVotes = data.totalVotes
      results.value.results = data.results
    }
  }

  function clearError() {
    error.value = null
  }

  return {
    polls,
    activePoll,
    currentPoll,
    results,
    hasVoted,
    loading,
    error,
    fetchPolls,
    fetchPoll,
    createPoll,
    updatePoll,
    deletePoll,
    startPoll,
    endPoll,
    fetchActivePoll,
    submitVote,
    fetchResults,
    updateResultsFromBroadcast,
    clearError,
  }
})
