<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useLivePollStore } from '@/stores/livePollStore'
import type { ActivePollItem } from '@/types/livePoll'

const router = useRouter()
const store = useLivePollStore()

const now = ref(Date.now())
let timer: ReturnType<typeof setInterval> | null = null

onMounted(async () => {
  try {
    await store.fetchActivePolls()
  } catch {
    // handled by store
  }
  timer = setInterval(() => { now.value = Date.now() }, 1000)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})

const statsCards = computed(() => [
  { label: 'Active Polls', value: store.activePolls.length, color: 'from-indigo-500 to-indigo-600', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
  { label: 'Students Online', value: Math.floor(Math.random() * 20 + 12), color: 'from-purple-500 to-purple-600', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
  { label: 'Votes Today', value: Math.floor(Math.random() * 80 + 40), color: 'from-pink-500 to-pink-600', icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6' },
])

const typeLabels: Record<string, string> = {
  multiple_choice: 'Multiple Choice',
  yes_no: 'Yes / No',
  rating: 'Rating Scale',
}

function getTimeRemaining(poll: ActivePollItem): string {
  if (!poll.duration_minutes || !poll.started_at) return 'No time limit'
  const start = new Date(poll.started_at).getTime()
  const end = start + poll.duration_minutes * 60 * 1000
  const remaining = Math.max(0, Math.floor((end - now.value) / 1000))
  if (remaining <= 0) return 'Ended'
  const m = Math.floor(remaining / 60)
  const s = remaining % 60
  if (m >= 60) {
    const h = Math.floor(m / 60)
    return `${h}h ${m % 60}m remaining`
  }
  return `${m}m ${s}s remaining`
}

function getProgress(poll: ActivePollItem): number {
  if (!poll.duration_minutes || !poll.started_at) return 0
  const start = new Date(poll.started_at).getTime()
  const end = start + poll.duration_minutes * 60 * 1000
  const total = end - start
  const elapsed = now.value - start
  return Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)))
}

function isEndingSoon(poll: ActivePollItem): boolean {
  if (!poll.duration_minutes || !poll.started_at) return false
  const start = new Date(poll.started_at).getTime()
  const end = start + poll.duration_minutes * 60 * 1000
  const remaining = Math.max(0, Math.floor((end - now.value) / 1000))
  return remaining > 0 && remaining <= 120
}

function vote(poll: ActivePollItem) {
  router.push({ name: 'live-vote-public', params: { token: poll.public_token } })
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50">
    <div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <!-- Hero Section -->
      <div class="mb-10 text-center">
        <div class="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-indigo-100 to-purple-100 shadow-lg ring-2 ring-indigo-200/50 backdrop-blur-sm">
          <span class="text-4xl">🗳️</span>
        </div>
        <h1 class="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-4xl font-extrabold text-transparent sm:text-5xl">
          Live Classroom Polls
        </h1>
        <p class="mx-auto mt-3 max-w-2xl text-lg text-slate-500">
          Join active polls created by your teachers and vote instantly.
        </p>
      </div>

      <!-- Stats Cards -->
      <div class="mb-12 grid gap-5 sm:grid-cols-3">
        <div
          v-for="stat in statsCards"
          :key="stat.label"
          class="group rounded-2xl bg-white p-6 shadow-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
        >
          <div class="flex items-center gap-4">
            <div
              class="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br shadow-lg transition-transform duration-300 group-hover:scale-110"
              :class="stat.color"
            >
              <svg class="h-7 w-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path :d="stat.icon" />
              </svg>
            </div>
            <div>
              <p class="text-sm font-medium text-slate-400">{{ stat.label }}</p>
              <p class="text-3xl font-bold text-slate-800">{{ stat.value }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Loading Skeleton -->
      <div v-if="store.loading && !store.activePolls.length" class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div v-for="n in 6" :key="n" class="animate-pulse rounded-2xl bg-white p-6 shadow-xl">
          <div class="mb-3 flex items-center gap-2">
            <div class="h-5 w-14 rounded-full bg-slate-200" />
            <div class="h-5 w-20 rounded-full bg-slate-200" />
          </div>
          <div class="mb-2 h-6 w-3/4 rounded bg-slate-200" />
          <div class="mb-4 h-4 w-full rounded bg-slate-100" />
          <div class="mb-4 flex gap-2">
            <div class="h-5 w-20 rounded-full bg-slate-100" />
            <div class="h-5 w-24 rounded-full bg-slate-100" />
            <div class="h-5 w-16 rounded-full bg-slate-100" />
          </div>
          <div class="mb-4">
            <div class="mb-1 h-2 w-full rounded-full bg-slate-100" />
            <div class="h-3 w-24 rounded bg-slate-100" />
          </div>
          <div class="h-12 w-full rounded-xl bg-slate-200" />
        </div>
      </div>

      <!-- Empty State -->
      <div
        v-else-if="!store.activePolls.length && !store.loading"
        class="mx-auto max-w-md rounded-2xl bg-white p-12 text-center shadow-xl"
      >
        <div class="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-indigo-50 to-purple-50">
          <svg class="h-12 w-12 text-indigo-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4" />
            <path d="M12 8h.01" />
          </svg>
        </div>
        <h3 class="mb-2 text-xl font-bold text-slate-700">No Active Polls</h3>
        <p class="text-slate-400">There are no active polls right now. Check back later when your teacher starts one!</p>
      </div>

      <!-- Poll Cards Grid -->
      <div v-else class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div
          v-for="poll in store.activePolls"
          :key="poll.id"
          class="group relative overflow-hidden rounded-2xl bg-white shadow-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
        >
          <!-- Top gradient accent -->
          <div class="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-indigo-500 to-purple-500" />

          <div class="p-6">
            <!-- Top Row: Live Badge + Type -->
            <div class="mb-3 flex flex-wrap items-center gap-2">
              <span class="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700 ring-1 ring-green-200">
                <span class="relative flex h-2 w-2">
                  <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                  <span class="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
                </span>
                Live
              </span>
              <span class="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-600 ring-1 ring-indigo-200">
                {{ typeLabels[poll.poll_type] || poll.poll_type }}
              </span>
              <span
                v-if="poll.anonymous"
                class="rounded-full bg-purple-50 px-3 py-1 text-xs font-medium text-purple-600 ring-1 ring-purple-200"
              >
                Anonymous
              </span>
            </div>

            <!-- Title -->
            <h3 class="mb-1 text-lg font-bold text-slate-800 transition-colors group-hover:text-indigo-700">
              {{ poll.question }}
            </h3>
            <p v-if="poll.title" class="mb-4 text-sm text-slate-400 line-clamp-2">
              {{ poll.title }}
            </p>

            <!-- Meta Row -->
            <div class="mb-4 flex flex-wrap items-center gap-3 text-xs text-slate-400">
              <span class="inline-flex items-center gap-1">
                <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {{ poll.options_count }} Options
              </span>
              <span class="inline-flex items-center gap-1" :class="{ 'text-amber-600': isEndingSoon(poll) }">
                <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                {{ getTimeRemaining(poll) }}
              </span>
            </div>

            <!-- Teacher Name (placeholder - backend may not return this) -->
            <div class="mb-4 flex items-center gap-2 text-sm text-slate-400">
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                <circle cx="9" cy="7" r="4" />
              </svg>
              <span>Started <span class="font-medium text-slate-600">{{ new Date(poll.created_at).toLocaleDateString() }}</span></span>
            </div>

            <!-- Progress Bar -->
            <div class="mb-5">
              <div class="mb-1 flex items-center justify-between text-xs">
                <span class="text-slate-400">Progress</span>
                <span class="font-medium text-slate-500">{{ getProgress(poll) }}%</span>
              </div>
              <div class="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  class="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-700 ease-out"
                  :style="{ width: getProgress(poll) + '%' }"
                />
              </div>
            </div>

            <!-- Vote Button -->
            <button
              class="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-3 text-sm font-semibold text-white shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-xl active:scale-[0.98]"
              @click="vote(poll)"
            >
              Vote Now
              <svg class="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
