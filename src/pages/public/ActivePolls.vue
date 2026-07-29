<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useLivePollStore } from '@/stores/livePollStore'
import { getPolls } from '@/utils/pollStorage'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import EmptyState from '@/components/EmptyState.vue'

const router = useRouter()
const store = useLivePollStore()
const pageError = ref<string | null>(null)
const refreshInterval = ref<ReturnType<typeof setInterval> | null>(null)
const localActivePolls = ref<Array<{
  id: string
  title: string
  question: string
  poll_type: string
  public_token: null
  duration_minutes: number
  anonymous: boolean
  allow_multiple_votes: boolean
  options_count: number
  source: 'local'
}>>([])

const displayPolls = computed(() =>
  store.activePolls.length > 0
    ? store.activePolls.map((poll) => ({ ...poll, source: 'backend' as const }))
    : localActivePolls.value,
)

function loadLocalPolls() {
  localActivePolls.value = getPolls()
    .filter((poll) => poll.status === 'active')
    .map((poll) => ({
      id: poll.id,
      title: poll.title,
      question: poll.question,
      poll_type: poll.type,
      public_token: null,
      duration_minutes: poll.duration,
      anonymous: poll.anonymous,
      allow_multiple_votes: poll.allowMultipleVotes,
      options_count: poll.options.length,
      source: 'local' as const,
    }))
}

onMounted(async () => {
  loadLocalPolls()
  try {
    await store.fetchActivePolls()
  } catch {
    if (!localActivePolls.value.length) {
      pageError.value = 'Failed to load active polls.'
    }
  }
  loadLocalPolls()
  refreshInterval.value = setInterval(() => {
    loadLocalPolls()
    void store.fetchActivePolls().catch(() => undefined)
  }, 5000)
})

onUnmounted(() => {
  if (refreshInterval.value) {
    clearInterval(refreshInterval.value)
    refreshInterval.value = null
  }
})

function vote(poll: { source: 'backend'; public_token: string | null } | { source: 'local'; id: string }) {
  if (poll.source === 'backend' && poll.public_token) {
    router.push({ name: 'live-vote-public', params: { token: poll.public_token } })
    return
  }

  if (poll.source === 'local') {
    router.push({ name: 'student-live-vote', query: { pollId: poll.id } })
  }
}

const typeLabels: Record<string, string> = {
  multiple_choice: 'Multiple Choice',
  'multiple-choice': 'Multiple Choice',
  yes_no: 'Yes / No',
  'yes-no': 'Yes / No',
  rating: 'Rating Scale',
  'rating-scale': 'Rating Scale',
}
</script>

<template>
  <div class="min-h-[100dvh] bg-gradient-to-br from-indigo-50 via-white to-purple-50 px-4 py-12 sm:px-6">
    <div class="mx-auto max-w-2xl">
      <div class="mb-8 text-center">
        <div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-100">
          <svg class="h-8 w-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 class="text-3xl font-bold text-gray-900">Classroom Polls</h1>
        <p class="mt-2 text-gray-500">Guests can open a poll and vote without signing in</p>
      </div>

      <div v-if="store.loading && !displayPolls.length" class="py-16">
        <LoadingSpinner size="lg" />
      </div>

      <div v-else-if="pageError && !displayPolls.length" class="rounded-2xl bg-white p-8 text-center shadow-sm">
        <p class="text-red-600">{{ pageError }}</p>
      </div>

      <div v-else-if="!displayPolls.length" class="py-8">
        <EmptyState title="No active polls" description="There are no active polls available right now. Check back later!">
          <div class="mt-4 text-sm text-gray-400">Polls appear here when teachers start them.</div>
        </EmptyState>
      </div>

      <div v-else class="space-y-4">
        <div
          v-for="poll in displayPolls"
          :key="`${poll.source}-${poll.id}`"
          class="group cursor-pointer overflow-hidden rounded-[28px] border border-gray-200 bg-white shadow-[0_14px_40px_rgba(15,23,42,0.08)] transition-all hover:-translate-y-1 hover:border-indigo-300 hover:shadow-[0_20px_50px_rgba(79,70,229,0.15)]"
          @click="vote(poll)"
        >
          <div class="relative overflow-hidden bg-gradient-to-br from-indigo-900 via-indigo-700 to-slate-900 px-5 py-5 text-white">
            <div class="absolute right-0 top-0 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
            <div class="relative flex items-start justify-between gap-4">
              <div class="min-w-0 flex-1">
                <div class="mb-2 inline-flex rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-white/80">
                  Live Poll
                </div>
                <h3 class="text-xl font-semibold leading-tight text-white">{{ poll.question }}</h3>
                <p v-if="poll.title" class="mt-2 text-sm text-indigo-100">{{ poll.title }}</p>
              </div>
              <span class="inline-flex items-center gap-1.5 rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-semibold text-emerald-100 ring-1 ring-emerald-300/25">
                <span class="h-2 w-2 animate-pulse rounded-full bg-emerald-300" />
                Open
              </span>
            </div>
          </div>

          <div class="p-5">
            <div class="mt-1 flex flex-wrap items-center gap-3 text-xs text-gray-500">
              <span class="rounded-full bg-gray-100 px-3 py-1 font-semibold text-gray-700">{{ typeLabels[poll.poll_type] || poll.poll_type }}</span>
              <span class="rounded-full bg-gray-100 px-3 py-1 font-semibold text-gray-700">{{ poll.options_count }} option{{ poll.options_count !== 1 ? 's' : '' }}</span>
              <span v-if="poll.anonymous" class="rounded-full bg-purple-100 px-3 py-1 font-semibold text-purple-700">Anonymous</span>
              <span v-if="poll.allow_multiple_votes" class="rounded-full bg-blue-100 px-3 py-1 font-semibold text-blue-700">Multi-vote</span>
              <span v-if="poll.source === 'local'" class="rounded-full bg-amber-100 px-3 py-1 font-semibold text-amber-700">Website poll</span>
            </div>

            <div class="mt-5 flex items-center justify-end">
              <span class="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 group-hover:text-indigo-800">
                Vote now
                <svg class="h-4 w-4 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
