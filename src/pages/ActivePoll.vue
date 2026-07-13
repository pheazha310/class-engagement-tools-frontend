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
  <div class="mx-auto max-w-4xl px-4 py-8">
    <div class="mb-8 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white shadow-lg">
      <h1 class="text-2xl font-bold">Active Poll</h1>
      <p class="mt-1 text-indigo-100">Cast your vote and see live results</p>
    </div>

    <LoadingSpinner v-if="store.loading && !store.activePoll" />

    <EmptyState
      v-else-if="!store.activePoll"
      title="No Active Poll"
      description="There is no active poll available right now. Check back later!"
    />

    <template v-else-if="store.activePoll">
      <div class="grid gap-6 lg:grid-cols-2">
        <VoteCard
          v-if="!showResults"
          :poll="store.activePoll"
          :has-voted="store.hasVoted"
          @vote="handleVote"
        />

        <div v-if="showResults && store.results" class="space-y-6 lg:col-span-2">
          <h2 class="text-xl font-bold text-gray-900 dark:text-white">{{ store.results.question }}</h2>

          <div class="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <LiveCounter :value="store.results.totalVotes" label="Total Votes" />
            <LiveCounter :value="store.results.results.length" label="Options" />
            <LiveCounter :value="store.results.status" label="Status" />
          </div>

          <div class="space-y-3">
            <h3 class="text-sm font-semibold text-gray-600 dark:text-gray-400">Vote Breakdown</h3>
            <div
              v-for="result in store.results.results"
              :key="result.id"
              class="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
            >
              <div class="mb-2 flex items-center justify-between">
                <span class="text-sm font-medium text-gray-900 dark:text-white">{{ result.option }}</span>
                <span class="text-sm text-gray-500 dark:text-gray-400">
                  {{ result.votes }} votes ({{ result.percentage }}%)
                </span>
              </div>
              <div class="h-3 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
                <div
                  class="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500 ease-out"
                  :style="{ width: `${maxPercentage > 0 ? (result.percentage / maxPercentage) * 100 : 0}%` }"
                />
              </div>
            </div>
          </div>

          <ResultChart :data="store.results" />
        </div>

        <div v-else-if="!showResults" class="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          <h3 class="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Live Results</h3>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            Vote first to see the live results update in real time!
          </p>
        </div>
      </div>
    </template>

    <ToastNotification
      :message="toastMessage"
      :type="toastType"
      @close="toastMessage = null"
    />
  </div>
</template>
