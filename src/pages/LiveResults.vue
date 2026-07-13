<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { usePollStore } from '@/stores/pollStore'
import { listenToPoll } from '@/services/echo'
import ResultChart from '@/components/ResultChart.vue'
import LiveCounter from '@/components/LiveCounter.vue'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import type { VoteUpdatedPayload } from '@/types/poll'

const route = useRoute()
const store = usePollStore()

const pollId = Number(route.params.id)
const cleanup = ref<(() => void) | null>(null)

const maxPercentage = computed(() => {
  if (!store.results?.results.length) return 0
  return Math.max(...store.results.results.map((r) => r.percentage))
})

onMounted(async () => {
  try {
    await store.fetchResults(pollId)
  } catch {
    store.error = 'Failed to load results.'
  }

  cleanup.value = listenToPoll(pollId, (payload: VoteUpdatedPayload) => {
    store.updateResultsFromBroadcast(payload)
  })
})

onUnmounted(() => {
  cleanup.value?.()
  store.results = null
  store.clearError()
})
</script>

<template>
  <div class="mx-auto max-w-5xl px-4 py-8">
    <div class="mb-8 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white shadow-lg">
      <h1 class="text-2xl font-bold">Live Results</h1>
      <p v-if="store.results" class="mt-1 text-indigo-100">{{ store.results.question }}</p>
    </div>

    <LoadingSpinner v-if="store.loading && !store.results" />

    <div v-else-if="store.error" class="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
      {{ store.error }}
    </div>

    <template v-else-if="store.results">
      <div class="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <LiveCounter :value="store.results.totalVotes" label="Total Votes" />
        <LiveCounter :value="store.results.results.length" label="Options" />
        <LiveCounter :value="store.results.status" label="Status" />
      </div>

      <div class="mb-6 space-y-3">
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
    </template>

    <div v-else class="text-center text-gray-500">No results available.</div>
  </div>
</template>
