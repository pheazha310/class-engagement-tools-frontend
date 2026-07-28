<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useLivePollStore } from '@/stores/livePollStore'

const route = useRoute()
const router = useRouter()
const store = useLivePollStore()

const token = computed(() => route.params.token as string)
const now = ref(Date.now())
let timer: ReturnType<typeof setInterval> | null = null

const results = computed(() => store.results)
const loading = computed(() => store.loading)
const error = computed(() => store.error)

const maxPercentage = computed(() => {
  if (!results.value?.options.length || results.value.total_votes === 0) return 0
  return Math.max(...results.value.options.map((o) => Math.round((o.votes / results.value!.total_votes) * 100)))
})

const winner = computed(() => {
  if (!results.value?.options.length || results.value.total_votes === 0) return null
  const max = Math.max(...results.value.options.map((o) => o.votes))
  return results.value.options.find((o) => o.votes === max && max > 0) ?? null
})

const winnerPercentage = computed(() => {
  if (!winner.value || totalVotes.value === 0) return 0
  return Math.round((winner.value.votes / totalVotes.value) * 100)
})

const sortedOptions = computed(() => {
  if (!results.value?.options) return []
  return [...results.value.options].sort((a, b) => b.votes - a.votes)
})

const totalVotes = computed(() => results.value?.total_votes || 0)

function getPercentage(option: { votes: number }): number {
  if (totalVotes.value === 0) return 0
  return Math.round((option.votes / totalVotes.value) * 100)
}

function getBarColor(index: number, opt: { votes: number }): string {
  const w = winner.value
  if (w && opt.votes === w.votes && opt.votes > 0) {
    return 'from-emerald-500 to-green-500'
  }
  const colors: string[] = [
    'from-indigo-500 to-blue-500',
    'from-purple-500 to-pink-500',
    'from-amber-500 to-orange-500',
    'from-cyan-500 to-teal-500',
    'from-rose-500 to-red-500',
  ]
  return colors[index % colors.length]!
}

onMounted(async () => {
  try {
    await store.fetchPublicResults(token.value)
  } catch {
    // handled by store
  }
  timer = setInterval(async () => {
    now.value = Date.now()
    if (results.value?.status === 'active') {
      try {
        await store.fetchPublicResults(token.value)
      } catch {
        // silent refresh
      }
    }
  }, 5000)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
  store.clearResults()
})
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50">
    <div class="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <!-- Loading Skeleton -->
      <div v-if="loading && !results" class="rounded-2xl bg-white p-8 shadow-xl">
        <div class="mb-2 h-8 w-2/3 animate-pulse rounded bg-slate-200" />
        <div class="mb-6 h-5 w-1/3 animate-pulse rounded bg-slate-100" />
        <div v-for="n in 4" :key="n" class="mb-5">
          <div class="mb-2 flex items-center justify-between">
            <div class="h-4 w-32 animate-pulse rounded bg-slate-200" />
            <div class="h-4 w-20 animate-pulse rounded bg-slate-200" />
          </div>
          <div class="h-6 w-full animate-pulse rounded-full bg-slate-100" />
        </div>
      </div>

      <!-- Error State -->
      <div v-else-if="error && !results" class="rounded-2xl bg-white p-12 text-center shadow-xl">
        <div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
          <svg class="h-8 w-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4" />
            <path d="M12 8h.01" />
          </svg>
        </div>
        <h3 class="mb-2 text-lg font-bold text-slate-700">Results Unavailable</h3>
        <p class="text-slate-400">{{ error || 'Could not load results for this poll.' }}</p>
        <button
          class="mt-6 rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
          @click="router.push({ name: 'active-polls' })"
        >
          Back to Polls
        </button>
      </div>

      <!-- Results -->
      <div v-else-if="results" class="animate-fade-in-up space-y-6">
        <!-- Header Card -->
        <div class="rounded-2xl bg-white p-8 shadow-xl ring-1 ring-slate-100">
          <div class="mb-3 flex flex-wrap items-center gap-3">
            <span
              v-if="results.status === 'active'"
              class="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3.5 py-1.5 text-xs font-bold text-green-700 ring-1 ring-green-200"
            >
              <span class="relative flex h-2 w-2">
                <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                <span class="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
              </span>
              Live
            </span>
            <span
              v-else
              class="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3.5 py-1.5 text-xs font-bold text-slate-600"
            >
              <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              </svg>
              Closed
            </span>
            <span
              v-if="results.anonymous"
              class="rounded-full bg-purple-50 px-3 py-1.5 text-xs font-semibold text-purple-700 ring-1 ring-purple-200"
            >
              Anonymous
            </span>
          </div>

          <h1 class="text-2xl font-extrabold text-slate-800 sm:text-3xl">{{ results.question }}</h1>

          <div class="mt-6 grid grid-cols-3 gap-4">
            <div class="rounded-xl bg-gradient-to-br from-indigo-50 to-blue-50 p-4 text-center ring-1 ring-indigo-200">
              <p class="text-2xl font-bold text-indigo-700">{{ totalVotes }}</p>
              <p class="text-xs font-medium text-indigo-500">Total Votes</p>
            </div>
            <div class="rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 p-4 text-center ring-1 ring-purple-200">
              <p class="text-2xl font-bold text-purple-700">{{ results.options.length }}</p>
              <p class="text-xs font-medium text-purple-500">Options</p>
            </div>
            <div class="rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 p-4 text-center ring-1 ring-amber-200">
              <p class="text-2xl font-bold text-amber-700">{{ winnerPercentage }}%</p>
              <p class="text-xs font-medium text-amber-500">Top Result</p>
            </div>
          </div>
        </div>

        <!-- No Votes Yet -->
        <div
          v-if="totalVotes === 0"
          class="rounded-2xl bg-white p-12 text-center shadow-xl ring-1 ring-slate-100"
        >
          <div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-50">
            <svg class="h-8 w-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 class="mb-2 text-lg font-bold text-slate-600">No Votes Yet</h3>
          <p class="text-sm text-slate-400">Be the first to vote! Results will appear here in real time.</p>
        </div>

        <!-- Results Bars -->
        <div
          v-else
          class="rounded-2xl bg-white p-8 shadow-xl ring-1 ring-slate-100"
        >
          <div class="mb-6 flex items-center justify-between">
            <h2 class="text-lg font-bold text-slate-700">Results</h2>
            <span class="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500">
              {{ totalVotes }} total vote{{ totalVotes !== 1 ? 's' : '' }}
            </span>
          </div>

          <div class="space-y-5">
            <div
              v-for="(option, index) in sortedOptions"
              :key="option.id"
              class="group"
            >
              <div class="mb-2 flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <span class="text-sm font-semibold text-slate-700">{{ option.option_text }}</span>
                  <span
                    v-if="winner && option.votes === winner.votes && option.votes > 0"
                    class="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-700 ring-1 ring-emerald-200"
                  >
                    <svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Winner
                  </span>
                </div>
                <div class="flex items-center gap-2 text-sm">
                  <span class="font-bold text-slate-800">{{ option.votes }}</span>
                  <span class="text-slate-400">({{ getPercentage(option) }}%)</span>
                </div>
              </div>
              <div class="h-4 w-full overflow-hidden rounded-full bg-slate-100 ring-1 ring-slate-200">
                <div
                  class="h-full rounded-full bg-gradient-to-r transition-all duration-1000 ease-out"
                  :class="getBarColor(index, option)"
                  :style="{ width: getPercentage(option) + '%' }"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Back Button -->
        <div class="text-center">
          <button
            class="inline-flex items-center gap-2 rounded-xl border-2 border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-600 shadow-sm transition-all duration-200 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"
            @click="router.push({ name: 'active-polls' })"
          >
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Back to All Polls
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
