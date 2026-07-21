<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useLivePollStore } from '@/stores/livePollStore'
import { useAuthStore } from '@/stores/auth'
import { getGuestToken } from '@/services/livePollService'
import VoteOption from '@/components/live/VoteOption.vue'
import ResultBar from '@/components/live/ResultBar.vue'
import CountdownTimer from '@/components/CountdownTimer.vue'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import ToastNotification from '@/components/ToastNotification.vue'
import type { LivePoll, LivePollResults } from '@/types/livePoll'

const route = useRoute()
const store = useLivePollStore()
const auth = useAuthStore()

const token = computed(() => route.params.token as string)
const poll = ref<LivePoll | null>(null)
const results = ref<LivePollResults | null>(null)
const selectedOptionId = ref<string | null>(null)
const pageError = ref<string | null>(null)
const phase = ref<'loading' | 'poll' | 'voted' | 'results' | 'error'>('loading')
const resultsLoading = ref(false)

const isStudent = computed(() => auth.user?.role === 'student')

const totalSeconds = computed(() => {
  if (!poll.value?.duration_minutes || !poll.value?.started_at) return 0
  const started = new Date(poll.value.started_at).getTime()
  const elapsed = (Date.now() - started) / 1000
  const remaining = Math.round(poll.value.duration_minutes * 60 - elapsed)
  return Math.max(0, remaining)
})

onMounted(async () => {
  await auth.fetchUser()
  await loadPoll()
})

watch(token, () => {
  phase.value = 'loading'
  selectedOptionId.value = null
  poll.value = null
  results.value = null
  loadPoll()
})

async function loadPoll() {
  try {
    const p = await store.fetchPublicPoll(token.value)
    if (!p) {
      pageError.value = 'Poll not found or is not active.'
      phase.value = 'error'
      return
    }
    poll.value = p

    if (p.show_results && p.status === 'closed') {
      await loadResults()
      phase.value = 'results'
    } else {
      phase.value = 'poll'
    }
  } catch {
    pageError.value = 'Failed to load poll. It may have expired or been removed.'
    phase.value = 'error'
  }
}

async function loadResults() {
  resultsLoading.value = true
  try {
    const r = await store.fetchPublicResults(token.value)
    if (r) results.value = r
  } catch {
    // ignore
  } finally {
    resultsLoading.value = false
  }
}

async function submitVote() {
  if (!selectedOptionId.value) return
  try {
    if (isStudent.value && auth.user) {
      await livePollServiceSubmitVote(token.value, selectedOptionId.value)
    } else {
      await livePollServiceSubmitVote(token.value, selectedOptionId.value, getGuestToken())
    }
    phase.value = 'voted'
    if (poll.value?.show_results) {
      await loadResults()
    }
  } catch (e: unknown) {
    const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to submit vote.'
    store.error = msg
  }
}

async function livePollServiceSubmitVote(t: string, optionId: string, guestToken?: string) {
  const { livePollService } = await import('@/services/livePollService')
  return livePollService.submitVote(t, optionId, guestToken)
}

function onExpire() {
  if (poll.value) {
    phase.value = 'results'
    loadResults()
  }
}

const maxPercentage = computed(() => {
  if (!results.value?.options.length) return 0
  return Math.max(...results.value.options.map((o) => (results.value!.total_votes > 0 ? Math.round((o.votes / results.value!.total_votes) * 100) : 0)))
})

const viewResults = () => {
  phase.value = 'results'
  loadResults()
}
</script>

<template>
  <div class="min-h-[100dvh] bg-gradient-to-br from-indigo-50 via-white to-purple-50 px-4 py-8 sm:px-6">
    <div class="mx-auto max-w-lg">
      <div class="mb-8 text-center">
        <div class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-100">
          <svg class="h-7 w-7 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 class="text-xl font-bold text-gray-900">Classroom Poll</h1>
      </div>

      <!-- Loading -->
      <div v-if="phase === 'loading'" class="py-16">
        <LoadingSpinner size="lg" />
      </div>

      <!-- Error -->
      <div v-else-if="phase === 'error'" class="rounded-2xl bg-white p-8 text-center shadow-sm">
        <div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
          <svg class="h-8 w-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h2 class="mb-2 text-lg font-semibold text-gray-900">Poll Unavailable</h2>
        <p class="text-sm text-gray-500">{{ pageError || store.error || 'This poll is not available.' }}</p>
      </div>

      <!-- Vote phase -->
      <div v-else-if="phase === 'poll' && poll" class="space-y-5">
        <div class="rounded-2xl bg-white p-6 shadow-sm">
          <div v-if="poll.duration_minutes && poll.started_at" class="mb-4 flex justify-center">
            <CountdownTimer
              :seconds="totalSeconds"
              label="Time Remaining"
              :size="100"
              :stroke-width="6"
              :warning-threshold="60"
              :danger-threshold="30"
              :on-expire="onExpire"
            />
          </div>

          <h2 class="mb-1 text-lg font-bold text-gray-900">{{ poll.question }}</h2>
          <p v-if="poll.title" class="mb-4 text-sm text-gray-500">{{ poll.title }}</p>

          <div v-if="poll.anonymous" class="mb-4 inline-flex items-center gap-1.5 rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-purple-700">
            <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
            </svg>
            Anonymous poll
          </div>
        </div>

        <div class="rounded-2xl bg-white p-6 shadow-sm">
          <h3 class="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-500">
            {{ poll.allow_multiple_votes ? 'Select all that apply' : 'Select one option' }}
          </h3>
          <div class="space-y-3">
            <VoteOption
              v-for="option in poll.options"
              :key="option.id"
              :value="option.id"
              :label="option.option_text"
              :selected="selectedOptionId === option.id"
              @select="selectedOptionId = $event"
            />
          </div>
        </div>

        <div v-if="store.error" class="rounded-xl bg-red-50 p-4 text-sm text-red-700">
          {{ store.error }}
        </div>

        <div class="flex gap-3">
          <button
            class="flex-1 rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-50"
            :disabled="!selectedOptionId || store.voting"
            @click="submitVote"
          >
            {{ store.voting ? 'Submitting...' : 'Submit Vote' }}
          </button>
          <button
            v-if="poll.show_results"
            class="rounded-xl border border-gray-300 px-5 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            @click="viewResults"
          >
            Results
          </button>
        </div>
      </div>

      <!-- Voted phase -->
      <div v-else-if="phase === 'voted'" class="space-y-5">
        <div class="rounded-2xl bg-white p-8 text-center shadow-sm">
          <div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <svg class="h-8 w-8 animate-scale-check text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 class="mb-2 text-xl font-bold text-gray-900">Thank You!</h2>
          <p class="text-sm text-gray-500">Your vote has been recorded successfully.</p>
          <div v-if="resultsLoading" class="mt-4">
            <LoadingSpinner size="sm" />
          </div>
          <button
            v-if="results && !resultsLoading"
            class="mt-6 rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
            @click="phase = 'results'"
          >
            View Results
          </button>
        </div>
      </div>

      <!-- Results phase -->
      <div v-else-if="results" class="space-y-5">
        <div class="rounded-2xl bg-white p-6 shadow-sm">
          <h2 class="mb-1 text-lg font-bold text-gray-900">{{ results.question }}</h2>
          <p class="text-sm text-gray-500">
            {{ results.total_votes }} vote{{ results.total_votes !== 1 ? 's' : '' }}
            <span v-if="results.status === 'active'" class="ml-2 inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
              <span class="h-1.5 w-1.5 animate-pulse rounded-full bg-green-500" />
              Live
            </span>
            <span v-else class="ml-2 text-xs text-gray-400">Closed</span>
          </p>
        </div>

        <div class="rounded-2xl bg-white p-6 shadow-sm">
          <div v-if="results.total_votes === 0" class="py-6 text-center text-sm text-gray-400">
            No votes yet.
          </div>
          <div v-else class="space-y-4">
            <div v-for="option in results.options" :key="option.id">
              <ResultBar
                :label="option.option_text"
                :votes="option.votes"
                :total-votes="results.total_votes"
                :max-percentage="maxPercentage"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <ToastNotification
      :message="store.error"
      type="error"
      @close="store.clearError()"
    />
  </div>
</template>
