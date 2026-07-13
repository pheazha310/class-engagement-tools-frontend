<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { usePollStore } from '@/stores/pollStore'
import { listenToPoll } from '@/services/echo'
import VoteCard from '@/components/VoteCard.vue'
import ResultChart from '@/components/ResultChart.vue'
import LiveCounter from '@/components/LiveCounter.vue'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import EmptyState from '@/components/EmptyState.vue'
import ToastNotification from '@/components/ToastNotification.vue'
import type { VoteUpdatedPayload } from '@/types/poll'

const store = usePollStore()

const showResults = ref(false)
const toastMessage = ref<string | null>(null)
const toastType = ref<'success' | 'error'>('success')
const cleanup = ref<(() => void) | null>(null)

const isTeacher = computed(() => {
  // Teacher role info can be enhanced later
  return false
})

const maxPercentage = computed(() => {
  if (!store.results?.results.length) return 0
  return Math.max(...store.results.results.map((r) => r.percentage))
})

onMounted(async () => {
  try {
    await store.fetchActivePoll()
    if (store.hasVoted && store.activePoll) {
      showResults.value = true
      await store.fetchResults(store.activePoll.id)
    }
  } catch {
    // no active poll
  }
})

async function handleVote(optionId: number) {
  if (!store.activePoll) return
  try {
    await store.submitVote(store.activePoll.id, optionId)
    toastMessage.value = 'Vote submitted successfully!'
    toastType.value = 'success'
    showResults.value = true

    cleanup.value = listenToPoll(store.activePoll.id, (payload: VoteUpdatedPayload) => {
      store.updateResultsFromBroadcast(payload)
    })
  } catch (e: any) {
    toastMessage.value = e.response?.data?.message || 'Failed to submit vote.'
    toastType.value = 'error'
    store.hasVoted = false
  }
}

onUnmounted(() => {
  cleanup.value?.()
  store.activePoll = null
  store.results = null
  store.clearError()
})
</script>

<template>
  <div class="min-h-screen bg-white">
    <div class="mx-auto max-w-5xl px-4 py-10">
      <div class="mb-10 text-center">
        <h1 class="text-3xl font-bold text-gray-900">Live Classroom Voting</h1>
        <p class="mt-2 text-gray-500">Cast your vote and watch the results update in real time</p>
      </div>

      <LoadingSpinner v-if="store.loading && !store.activePoll" />

      <EmptyState
        v-else-if="!store.activePoll"
        title="No Active Poll"
        description="There is no active poll available right now. Check back later!"
      />

      <template v-else-if="store.activePoll">
        <div class="mb-8 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div class="mb-1 flex items-center gap-2">
            <span class="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
              <span class="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
              Live
            </span>
          </div>
          <h2 class="mt-3 text-2xl font-bold text-gray-900">{{ store.activePoll.question }}</h2>
          <p class="mt-1 text-sm text-gray-400">{{ store.activePoll.options.length }} options</p>
        </div>

        <div class="grid gap-8 lg:grid-cols-5">
          <div class="lg:col-span-3">
            <div v-if="!showResults">
              <VoteCard
                :poll="store.activePoll"
                :has-voted="store.hasVoted"
                @vote="handleVote"
              />
            </div>

            <div v-if="showResults && store.results" class="space-y-6">
              <div class="grid grid-cols-3 gap-4">
                <LiveCounter :value="store.results.totalVotes" label="Total Votes" />
                <LiveCounter :value="store.results.results.length" label="Options" />
                <LiveCounter :value="store.results.status" label="Status" />
              </div>

              <div class="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <h3 class="mb-5 text-sm font-semibold text-gray-500 uppercase tracking-wider">Vote Breakdown</h3>
                <div class="space-y-4">
                  <div
                    v-for="result in store.results.results"
                    :key="result.id"
                  >
                    <div class="mb-1.5 flex items-center justify-between">
                      <span class="text-sm font-medium text-gray-900">{{ result.option }}</span>
                      <span class="text-sm text-gray-400">
                        {{ result.votes }} vote{{ result.votes !== 1 ? 's' : '' }}
                        <span class="text-gray-300">({{ result.percentage }}%)</span>
                      </span>
                    </div>
                    <div class="h-2.5 w-full overflow-hidden rounded-full bg-gray-100">
                      <div
                        class="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-700 ease-out"
                        :style="{ width: `${result.percentage}%` }"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <ResultChart :data="store.results" />
            </div>

            <div v-else-if="store.hasVoted && !store.results" class="rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-sm">
              <LoadingSpinner />
              <p class="mt-2 text-sm text-gray-400">Loading results...</p>
            </div>
          </div>

          <div class="lg:col-span-2">
            <div v-if="!showResults && !store.hasVoted" class="rounded-2xl border border-gray-100 bg-gray-50 p-6 shadow-sm">
              <h3 class="text-sm font-semibold text-gray-500 uppercase tracking-wider">About This Poll</h3>
              <ul class="mt-4 space-y-3 text-sm text-gray-600">
                <li class="flex items-start gap-2">
                  <svg class="mt-0.5 h-4 w-4 shrink-0 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Select one of the available options</span>
                </li>
                <li class="flex items-start gap-2">
                  <svg class="mt-0.5 h-4 w-4 shrink-0 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Submit your vote to see live results</span>
                </li>
                <li class="flex items-start gap-2">
                  <svg class="mt-0.5 h-4 w-4 shrink-0 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Results update in real time</span>
                </li>
              </ul>
            </div>

            <div v-if="showResults && store.results" class="rounded-2xl border border-gray-100 bg-gray-50 p-6 shadow-sm">
              <h3 class="text-sm font-semibold text-gray-500 uppercase tracking-wider">Summary</h3>
              <div class="mt-4 space-y-3">
                <div class="flex items-center justify-between rounded-xl bg-white px-4 py-3 text-sm">
                  <span class="text-gray-500">Total Votes</span>
                  <span class="font-bold text-gray-900">{{ store.results.totalVotes }}</span>
                </div>
                <div class="flex items-center justify-between rounded-xl bg-white px-4 py-3 text-sm">
                  <span class="text-gray-500">Options</span>
                  <span class="font-bold text-gray-900">{{ store.results.results.length }}</span>
                </div>
                <div class="flex items-center justify-between rounded-xl bg-white px-4 py-3 text-sm">
                  <span class="text-gray-500">Status</span>
                  <span
                    class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
                    :class="store.results.status === 'active'
                      ? 'bg-green-50 text-green-700'
                      : 'bg-gray-100 text-gray-600'"
                  >
                    {{ store.results.status }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>

    <ToastNotification
      :message="toastMessage"
      :type="toastType"
      @close="toastMessage = null"
    />
  </div>
</template>
