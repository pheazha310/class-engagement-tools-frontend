<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { usePollStore } from '@/stores/pollStore'
import { listenToPoll } from '@/services/echo'
import ResultChart from '@/components/ResultChart.vue'
import LiveCounter from '@/components/LiveCounter.vue'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import Leaderboard from '@/components/Leaderboard.vue'
import WordCloud from '@/components/WordCloud.vue'
import type { VoteUpdatedPayload, OpenTextResponse } from '@/types/poll'

const route = useRoute()
const store = usePollStore()

const pollId = Number(route.params.id)
const cleanup = ref<(() => void) | null>(null)

const maxPercentage = computed(() => {
  if (!store.results?.results.length) return 0
  if (store.results.is_open_text) return 0
  const results = store.results.results as any[]
  return Math.max(...results.map((r: any) => r.percentage ?? 0))
})

const isOpenText = computed(() => store.results?.is_open_text ?? false)
const isQuiz = computed(() => store.results?.is_quiz ?? false)
const isAnonymous = computed(() => store.results?.is_anonymous ?? false)
const hasWeights = computed(() => store.results?.has_weights ?? false)
const totalPoints = computed(() => store.results?.totalPoints)

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
      <!-- Quiz Summary -->
      <Leaderboard
        v-if="isQuiz && store.results.quiz_summary"
        :quiz-summary="store.results.quiz_summary"
        :results="store.results.results as any[]"
      />

      <!-- Word Cloud for Open Text -->
      <WordCloud
        v-if="isOpenText"
        :responses="store.results.results as OpenTextResponse[]"
        :is-anonymous="isAnonymous"
      />

      <!-- Standard Results -->
      <template v-if="!isOpenText">
        <div class="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
          <LiveCounter :value="store.results.totalVotes" :label="hasWeights ? 'Total Voters' : 'Total Votes'" />
          <LiveCounter :value="hasWeights ? (totalPoints ?? 0) : store.results.results.length" :label="hasWeights ? 'Total Points' : 'Options'" />
          <LiveCounter :value="store.results.status === 'active' ? 1 : 0" :label="store.results.status" />
        </div>

        <div class="mb-6 space-y-3">
          <h3 class="text-sm font-semibold text-gray-600 dark:text-gray-400">Vote Breakdown</h3>
          <div
            v-for="result in store.results.results as any[]"
            :key="result.id"
            class="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
          >
            <div class="mb-2 flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="text-sm font-medium text-gray-900 dark:text-white">{{ result.option }}</span>
                <span v-if="result.is_correct" class="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">Correct</span>
              </div>
              <span class="text-sm text-gray-500 dark:text-gray-400">
                {{ result.votes }} votes
                <template v-if="result.points !== undefined && result.points !== null">
                  ({{ result.points }} pts, {{ result.percentage }}%)
                </template>
                <template v-else>
                  ({{ result.percentage }}%)
                </template>
              </span>
            </div>
            <div class="h-3 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
              <div
                class="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500 ease-out"
                :class="{ 'bg-gradient-to-r from-green-500 to-emerald-500': result.is_correct }"
                :style="{ width: `${maxPercentage > 0 ? (result.percentage / maxPercentage) * 100 : 0}%` }"
              />
            </div>
          </div>
        </div>

        <ResultChart :data="store.results" />
      </template>
    </template>

    <div v-else class="text-center text-gray-500">No results available.</div>
  </div>
</template>
