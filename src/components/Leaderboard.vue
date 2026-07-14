<script setup lang="ts">
import { computed } from 'vue'
import type { QuizSummary, PollResult } from '@/types/poll'

const props = defineProps<{
  quizSummary: QuizSummary | null
  results: PollResult[]
}>()

const correctOptionTexts = computed(() => {
  if (!props.quizSummary) return []
  return props.results
    .filter((r) => props.quizSummary?.correct_option_ids.includes(r.id))
    .map((r) => r.option)
})
</script>

<template>
  <div v-if="quizSummary" class="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
    <h3 class="mb-4 text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Quiz Results</h3>

    <div class="mb-4 grid grid-cols-3 gap-3">
      <div class="rounded-lg bg-green-50 p-3 text-center dark:bg-green-900/20">
        <p class="text-2xl font-bold text-green-600 dark:text-green-400">{{ quizSummary.correct_votes }}</p>
        <p class="text-xs text-green-600/70 dark:text-green-400/70">Correct</p>
      </div>
      <div class="rounded-lg bg-red-50 p-3 text-center dark:bg-red-900/20">
        <p class="text-2xl font-bold text-red-600 dark:text-red-400">{{ quizSummary.total_votes - quizSummary.correct_votes }}</p>
        <p class="text-xs text-red-600/70 dark:text-red-400/70">Incorrect</p>
      </div>
      <div class="rounded-lg bg-blue-50 p-3 text-center dark:bg-blue-900/20">
        <p class="text-2xl font-bold text-blue-600 dark:text-blue-400">{{ quizSummary.correct_percentage }}%</p>
        <p class="text-xs text-blue-600/70 dark:text-blue-400/70">Success Rate</p>
      </div>
    </div>

    <div v-if="correctOptionTexts.length > 0" class="mb-4">
      <p class="text-sm font-medium text-gray-700 dark:text-gray-300">
        Correct Answer{{ correctOptionTexts.length > 1 ? 's' : '' }}:
        <span class="font-bold text-green-600 dark:text-green-400">{{ correctOptionTexts.join(', ') }}</span>
      </p>
    </div>

    <div v-if="quizSummary.correct_students.length > 0" class="mt-4">
      <h4 class="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
        Students Who Answered Correctly ({{ quizSummary.correct_students.length }})
      </h4>
      <div class="max-h-40 space-y-1 overflow-y-auto">
        <div
          v-for="(s, i) in quizSummary.correct_students"
          :key="s.student_id"
          class="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm"
          :class="i % 2 === 0 ? 'bg-green-50 dark:bg-green-900/10' : ''"
        >
          <span class="text-green-500">✓</span>
          <span class="text-gray-800 dark:text-gray-200">{{ s.student_name }}</span>
        </div>
      </div>
    </div>

    <div v-else-if="quizSummary.total_votes > 0" class="mt-4 text-sm text-gray-500 dark:text-gray-400">
      No correct answers yet.
    </div>
  </div>
</template>
