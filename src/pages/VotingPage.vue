<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useLivePollStore } from '@/stores/livePollStore'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const store = useLivePollStore()
const auth = useAuthStore()

const token = computed(() => route.params.token as string)

const selectedOptionId = ref<string | null>(null)
const showSuccess = ref(false)
const now = ref(Date.now())
let timer: ReturnType<typeof setInterval> | null = null

const poll = computed(() => store.publicPoll)
const loading = computed(() => store.loading)
const voting = computed(() => store.voting)
const error = computed(() => store.error)

const totalSeconds = computed(() => {
  if (!poll.value?.duration_minutes || !poll.value?.started_at) return 0
  const start = new Date(poll.value.started_at).getTime()
  const elapsed = (now.value - start) / 1000
  return Math.max(0, Math.round(poll.value.duration_minutes * 60 - elapsed))
})

const countdownDisplay = computed(() => {
  const s = totalSeconds.value
  if (s <= 0) return 'Ended'
  const m = Math.floor(s / 60)
  const sec = s % 60
  if (m >= 60) {
    const h = Math.floor(m / 60)
    return `${h}h ${m % 60}m`
  }
  return `${m}m ${sec}s`
})

const isUrgent = computed(() => totalSeconds.value > 0 && totalSeconds.value <= 120)
const isEnded = computed(() => totalSeconds.value <= 0)

const canSubmit = computed(() => selectedOptionId.value !== null && !voting.value && !isEnded.value && !store.hasVoted)

async function loadPoll() {
  try {
    const p = await store.fetchPublicPoll(token.value)
    if (!p) {
      router.push({ name: 'active-polls' })
    }
  } catch {
    router.push({ name: 'active-polls' })
  }
}

async function submitVote() {
  if (!selectedOptionId.value || !canSubmit.value) return
  try {
    await store.submitVote(token.value, selectedOptionId.value)
    showSuccess.value = true
    setTimeout(() => {
      router.push({ name: 'live-results-page', params: { token: token.value } })
    }, 2500)
  } catch {
    // handled by store
  }
}

function selectOption(id: string) {
  if (store.hasVoted || isEnded.value) return
  selectedOptionId.value = id
}

function goToResults() {
  router.push({ name: 'live-results-page', params: { token: token.value } })
}

onMounted(async () => {
  if (!auth.initialized) {
    try {
      await auth.fetchUser()
    } catch {
      // continue
    }
  }

  if (auth.isAuthenticated && auth.user?.role === 'teacher') {
    router.replace('/teacher/live-polls')
    return
  }

  loadPoll()
  timer = setInterval(() => { now.value = Date.now() }, 1000)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
  store.clearPublicPoll()
  store.clearError()
})
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50">
    <!-- Floating Vote Icon -->
    <div class="pointer-events-none fixed bottom-8 right-8 z-40 hidden animate-bounce lg:block">
      <div class="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-xl ring-2 ring-white/30 backdrop-blur-sm">
        <svg class="h-7 w-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
    </div>

    <div class="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <!-- Loading Skeleton -->
      <div v-if="loading && !poll" class="rounded-2xl bg-white p-8 shadow-xl">
        <div class="mb-6 flex items-center gap-3">
          <div class="h-8 w-24 animate-pulse rounded-full bg-slate-200" />
          <div class="h-8 w-32 animate-pulse rounded-full bg-slate-200" />
        </div>
        <div class="mb-2 h-8 w-3/4 animate-pulse rounded bg-slate-200" />
        <div class="mb-6 h-5 w-1/2 animate-pulse rounded bg-slate-100" />
        <div class="mb-3 h-16 w-full animate-pulse rounded-xl bg-slate-100" />
        <div class="mb-3 h-16 w-full animate-pulse rounded-xl bg-slate-100" />
        <div class="mb-3 h-16 w-full animate-pulse rounded-xl bg-slate-100" />
        <div class="mb-3 h-16 w-full animate-pulse rounded-xl bg-slate-100" />
        <div class="mt-6 h-14 w-full animate-pulse rounded-xl bg-slate-200" />
      </div>

      <!-- Error State -->
      <div v-else-if="error && !poll" class="rounded-2xl bg-white p-12 text-center shadow-xl">
        <div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
          <svg class="h-8 w-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4" />
            <path d="M12 8h.01" />
          </svg>
        </div>
        <h3 class="mb-2 text-lg font-bold text-slate-700">Poll Unavailable</h3>
        <p class="text-slate-400">{{ error || 'This poll is no longer available.' }}</p>
        <button
          class="mt-6 rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
          @click="router.push({ name: 'active-polls' })"
        >
          Back to Polls
        </button>
      </div>

      <!-- Success Animation Overlay -->
      <Transition
        enter-active-class="transition-all duration-500"
        leave-active-class="transition-all duration-300"
        enter-from-class="scale-75 opacity-0"
        leave-to-class="scale-110 opacity-0"
      >
        <div
          v-if="showSuccess"
          class="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm"
        >
          <div class="text-center">
            <div class="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-green-400 to-emerald-500 shadow-2xl">
              <svg class="h-12 w-12 animate-scale-check text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h2 class="mb-2 text-2xl font-bold text-slate-800">Vote Submitted!</h2>
            <p class="text-slate-400">Redirecting to live results...</p>
          </div>
        </div>
      </Transition>

      <!-- Voting Card -->
      <div v-if="poll && !showSuccess" class="animate-fade-in-up">
        <div class="rounded-2xl bg-white shadow-xl ring-1 ring-slate-100">
          <!-- Header -->
          <div class="border-b border-slate-100 px-8 pb-6 pt-8">
            <div class="mb-4 flex flex-wrap items-center gap-3">
              <span class="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3.5 py-1.5 text-xs font-bold text-green-700 ring-1 ring-green-200">
                <span class="relative flex h-2 w-2">
                  <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                  <span class="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
                </span>
                LIVE POLL
              </span>
              <span
                v-if="isUrgent"
                class="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3.5 py-1.5 text-xs font-bold text-amber-700 ring-1 ring-amber-200"
              >
                <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                {{ countdownDisplay }}
              </span>
            </div>

            <h1 class="text-2xl font-extrabold text-slate-800 sm:text-3xl">{{ poll.question }}</h1>
            <p v-if="poll.title" class="mt-2 text-slate-400">{{ poll.title }}</p>
            <p class="mt-3 text-sm font-medium text-slate-500">Choose one answer below</p>
          </div>

          <!-- Poll Info Badges -->
          <div class="flex flex-wrap gap-2 border-b border-slate-100 px-8 py-4">
            <span
              v-if="poll.anonymous"
              class="inline-flex items-center gap-1.5 rounded-full bg-purple-50 px-3 py-1.5 text-xs font-semibold text-purple-700 ring-1 ring-purple-200"
            >
              <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
              </svg>
              Anonymous
            </span>
            <span
              class="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 ring-1 ring-indigo-200"
            >
              <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Single Choice
            </span>
            <span
              class="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200"
            >
              <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M18 20V10" />
                <path d="M12 20V4" />
                <path d="M6 20v-6" />
              </svg>
              Live Results
            </span>
            <span
              v-if="countdownDisplay && !isUrgent"
              class="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600 ring-1 ring-slate-200"
            >
              <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              Ends in {{ countdownDisplay }}
            </span>
          </div>

          <!-- Options -->
          <div class="space-y-3 px-8 py-6">
            <button
              v-for="option in poll.options"
              :key="option.id"
              class="group flex w-full items-center gap-4 rounded-xl border-2 p-5 text-left transition-all duration-200"
              :class="[
                selectedOptionId === option.id
                  ? 'border-indigo-500 bg-indigo-50 shadow-md'
                  : 'border-slate-200 bg-white hover:border-indigo-300 hover:bg-indigo-50/50 hover:shadow-sm',
                (store.hasVoted || isEnded) ? 'cursor-default opacity-60' : 'cursor-pointer',
              ]"
              :disabled="store.hasVoted || isEnded"
              @click="selectOption(option.id)"
            >
              <span
                class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-200"
                :class="[
                  selectedOptionId === option.id
                    ? 'border-indigo-500 bg-indigo-500'
                    : 'border-slate-300 group-hover:border-indigo-300',
                ]"
              >
                <span
                  v-if="selectedOptionId === option.id"
                  class="h-3 w-3 rounded-full bg-white"
                />
              </span>
              <span
                class="text-base font-medium"
                :class="selectedOptionId === option.id ? 'text-indigo-900' : 'text-slate-700'"
              >
                {{ option.option_text }}
              </span>
              <span
                v-if="selectedOptionId === option.id"
                class="ml-auto flex h-6 w-6 items-center justify-center rounded-full bg-indigo-500"
              >
                <svg class="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </span>
            </button>
          </div>

          <!-- Error Message -->
          <div v-if="error" class="mx-8 mb-2 rounded-xl bg-red-50 p-4 text-sm text-red-700 ring-1 ring-red-200">
            {{ error }}
          </div>

          <!-- Actions -->
          <div class="space-y-3 px-8 pb-8">
            <button
              class="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 text-base font-bold text-white shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-xl active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
              :disabled="!canSubmit"
              @click="submitVote"
            >
              <svg v-if="voting" class="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span v-else>Submit Vote</span>
            </button>

            <button
              class="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-slate-200 bg-white px-6 py-3.5 text-sm font-semibold text-slate-600 transition-all duration-200 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"
              @click="goToResults"
            >
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M18 20V10" />
                <path d="M12 20V4" />
                <path d="M6 20v-6" />
              </svg>
              View Live Results
            </button>
          </div>
        </div>

        <!-- Already Voted Banner -->
        <div
          v-if="store.hasVoted"
          class="mt-6 rounded-2xl bg-gradient-to-r from-emerald-50 to-green-50 p-5 text-center shadow-lg ring-1 ring-green-200"
        >
          <div class="mb-2 flex items-center justify-center gap-2">
            <svg class="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span class="font-bold text-green-800">You have already voted!</span>
          </div>
          <button
            class="mt-2 rounded-lg bg-green-600 px-5 py-2 text-sm font-semibold text-white shadow transition hover:bg-green-700"
            @click="goToResults"
          >
            View Live Results
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
