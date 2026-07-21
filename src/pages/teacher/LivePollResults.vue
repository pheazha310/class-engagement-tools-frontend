<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useLivePollStore } from '@/stores/livePollStore'
import { livePollService } from '@/services/livePollService'
import ResultBar from '@/components/live/ResultBar.vue'
import PollStatusBadge from '@/components/live/PollStatusBadge.vue'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import ToastNotification from '@/components/ToastNotification.vue'
import type { LivePoll, LivePollResults } from '@/types/livePoll'

const route = useRoute()
const router = useRouter()
const store = useLivePollStore()

const poll = ref<LivePoll | null>(null)
const results = ref<LivePollResults | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)
const autoRefresh = ref(true)
let pollTimer: ReturnType<typeof setInterval> | null = null

const baseUrl = `${window.location.origin}/vote`

const voteUrl = computed(() => {
  if (!poll.value?.public_token) return ''
  return `${baseUrl}/${poll.value.public_token}`
})

onMounted(async () => {
  const id = route.params.id as string
  try {
    poll.value = await livePollService.getPoll(id)
    await fetchResults()
  } catch (e: unknown) {
    error.value = (e as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to load poll.'
  } finally {
    loading.value = false
  }
  startPolling()
})

onUnmounted(() => {
  stopPolling()
})

function startPolling() {
  if (pollTimer) clearInterval(pollTimer)
  pollTimer = setInterval(() => {
    if (autoRefresh.value && poll.value?.status === 'active') {
      fetchResults()
    }
  }, 3000)
}

function stopPolling() {
  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = null
  }
}

async function fetchResults() {
  if (!poll.value?.public_token) return
  try {
    const r = await livePollService.getPublicResults(poll.value.public_token)
    results.value = r
  } catch {
    // ignore polling errors
  }
}

async function handleEnd() {
  if (!poll.value) return
  try {
    const updated = await store.endPoll(poll.value.id)
    poll.value = updated
    await fetchResults()
    stopPolling()
  } catch {
    // error is set in store
  }
}

const maxPercentage = computed(() => {
  if (!results.value?.options.length) return 0
  return Math.max(...results.value.options.map((o) => (results.value!.total_votes > 0 ? Math.round((o.votes / results.value!.total_votes) * 100) : 0)))
})

async function copyLink() {
  if (!voteUrl.value) return
  try {
    await navigator.clipboard.writeText(voteUrl.value)
    store.successMessage = 'Vote link copied to clipboard!'
  } catch {
    store.error = 'Failed to copy link.'
  }
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 px-4 pb-12 pt-24 sm:px-6 lg:px-8">
    <div class="mx-auto max-w-3xl">
      <div v-if="loading" class="py-20">
        <LoadingSpinner size="lg" />
      </div>

      <div v-else-if="error" class="rounded-xl bg-red-50 p-6 text-center">
        <p class="text-red-700">{{ error }}</p>
        <button class="mt-4 text-sm font-medium text-indigo-600 hover:text-indigo-800" @click="router.push({ name: 'live-poll-list' })">
          Back to polls
        </button>
      </div>

      <template v-else-if="poll">
        <div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div class="mb-2 flex items-center gap-3">
              <h1 class="text-2xl font-bold text-gray-900">{{ poll.question }}</h1>
              <PollStatusBadge :status="poll.status" />
            </div>
            <p v-if="poll.title" class="text-sm text-gray-500">{{ poll.title }}</p>
            <p class="mt-1 text-sm text-gray-400">
              {{ results?.total_votes || 0 }} vote{{ results?.total_votes !== 1 ? 's' : '' }}
              <span v-if="poll.anonymous" class="ml-3 font-medium text-purple-600">Anonymous</span>
            </p>
          </div>
          <div class="flex flex-wrap gap-2">
            <button
              v-if="poll.status === 'active'"
              class="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700"
              @click="handleEnd"
            >
              End Poll
            </button>
            <router-link
              :to="{ name: 'live-poll-list' }"
              class="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              All Polls
            </router-link>
          </div>
        </div>

        <div v-if="poll.status === 'active'" class="mb-6 rounded-2xl border border-indigo-200 bg-indigo-50 p-5">
          <div class="mb-3 flex items-center justify-between">
            <h3 class="text-sm font-semibold text-indigo-900">Share this poll</h3>
            <label class="flex items-center gap-2 text-sm text-gray-600">
              <input v-model="autoRefresh" type="checkbox" class="h-4 w-4 rounded border-gray-300 text-indigo-600" />
              Auto-refresh
            </label>
          </div>
          <div class="flex flex-col gap-2 sm:flex-row">
            <div class="flex-1 truncate rounded-xl border border-indigo-200 bg-white px-4 py-3 text-sm font-mono text-indigo-700">
              {{ voteUrl }}
            </div>
            <button
              class="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700"
              @click="copyLink"
            >
              Copy Link
            </button>
          </div>
        </div>

        <div class="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 class="mb-6 text-lg font-semibold text-gray-900">Results</h2>

          <div v-if="!results" class="py-8 text-center text-gray-400">
            <LoadingSpinner size="sm" />
            <p class="mt-2 text-sm">Loading results...</p>
          </div>

          <div v-else-if="results.total_votes === 0" class="py-8 text-center text-gray-400">
            <svg class="mx-auto mb-3 h-12 w-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p class="text-sm">No votes yet. Share the link to start collecting responses.</p>
          </div>

          <div v-else class="space-y-5">
            <div v-for="option in results.options" :key="option.id" class="result-bar-item">
              <ResultBar
                :label="option.option_text"
                :votes="option.votes"
                :total-votes="results.total_votes"
                :max-percentage="maxPercentage"
              />
            </div>
          </div>
        </div>

        <ToastNotification
          :message="store.error"
          type="error"
          @close="store.clearError()"
        />
        <ToastNotification
          :message="store.successMessage"
          type="success"
          @close="store.clearSuccess()"
        />
      </template>
    </div>
  </div>
</template>
