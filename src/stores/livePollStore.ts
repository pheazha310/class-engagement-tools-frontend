import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { pollService } from '@/services/pollService'
import type { Poll, PollResultsData } from '@/types/poll'

export const useLivePollStore = defineStore('livePollStore', () => {
  const polls = ref<Poll[]>([])
  const activePolls = computed(() => polls.value.filter((poll) => poll.status === 'active'))
  const publicPoll = ref<Poll | null>(null)
  const results = ref<PollResultsData | null>(null)
  const loading = ref(false)
  const voting = ref(false)
  const error = ref<string | null>(null)
  const hasVoted = ref(false)

  async function fetchPolls(perPage = 50) {
    loading.value = true
    error.value = null
    try {
      const response = await pollService.getPolls(perPage)
      polls.value = response.data || []
      return response
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load polls.'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchActivePolls() {
    loading.value = true
    error.value = null
    try {
      const response = await pollService.getActivePoll()
      const payload = (response as any)?.polls || (response as any)?.data?.polls || []
      polls.value = Array.isArray(payload) ? payload : []
      if (!polls.value.length) {
        const single = (response as any)?.poll || (response as any)?.data?.poll || null
        polls.value = single ? [single] : []
      }
      return polls.value
    } catch (err) {
      polls.value = []
      error.value = err instanceof Error ? err.message : 'Failed to load active polls.'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchPublicPoll(token: string) {
    loading.value = true
    error.value = null
    hasVoted.value = false
    try {
      const response = await pollService.getActivePoll()
      const poll = (response as any)?.poll || (response as any)?.data || null
      publicPoll.value = poll || null
      hasVoted.value = Boolean((response as any)?.hasVoted)
      return publicPoll.value
    } catch (err) {
      publicPoll.value = null
      error.value = err instanceof Error ? err.message : 'Failed to load poll.'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function submitVote(tokenOrPollId: string, optionId: string | null, points?: number, textResponse?: string) {
    voting.value = true
    error.value = null
    try {
      const pollId = publicPoll.value?.id || tokenOrPollId
      const result = await pollService.vote(pollId, optionId, points, textResponse)
      results.value = result
      hasVoted.value = true
      return result
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to submit vote.'
      throw err
    } finally {
      voting.value = false
    }
  }

  function clearPublicPoll() {
    publicPoll.value = null
    results.value = null
    hasVoted.value = false
  }

  function clearError() {
    error.value = null
  }

  return {
    polls,
    activePolls,
    publicPoll,
    results,
    loading,
    voting,
    error,
    hasVoted,
    fetchPolls,
    fetchActivePolls,
    fetchPublicPoll,
    submitVote,
    clearPublicPoll,
    clearError,
  }
})
