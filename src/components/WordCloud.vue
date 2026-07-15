<script setup lang="ts">
import { computed } from 'vue'
import type { OpenTextResponse } from '@/types/poll'

const props = defineProps<{
  responses: OpenTextResponse[]
  isAnonymous: boolean
}>()

interface WordItem {
  text: string
  count: number
  fontSize: number
}

const wordItems = computed<WordItem[]>(() => {
  const wordMap = new Map<string, number>()

  for (const r of props.responses) {
    const words = r.text
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter((w) => w.length > 2)

    for (const word of words) {
      wordMap.set(word, (wordMap.get(word) || 0) + 1)
    }
  }

  const items = Array.from(wordMap.entries())
    .map(([text, count]) => ({ text, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 50)

  const maxCount = items.length > 0 ? items[0]!.count : 1
  const minCount = items.length > 0 ? items[items.length - 1]!.count : 1

  return items.map((item) => ({
    text: item.text,
    count: item.count,
    fontSize: 12 + ((item.count - minCount) / Math.max(maxCount - minCount, 1)) * 28,
  }))
})

const colors = [
  '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
  '#ec4899', '#f43f5e', '#f97316', '#eab308',
  '#22c55e', '#06b6d4', '#2563eb', '#7c3aed',
]
</script>

<template>
  <div class="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
    <h3 class="mb-4 text-sm font-semibold text-gray-600 dark:text-gray-400">Word Cloud</h3>

    <div v-if="wordItems.length === 0" class="py-8 text-center text-sm text-gray-400">
      No responses yet.
    </div>

    <div v-else class="flex flex-wrap items-center justify-center gap-2">
      <span
        v-for="(word, i) in wordItems"
        :key="word.text"
        class="inline-block rounded-full px-3 py-1 font-medium leading-tight transition hover:scale-110"
        :style="{
          fontSize: `${word.fontSize}px`,
          color: colors[i % colors.length],
          backgroundColor: `${colors[i % colors.length]}15`,
        }"
        :title="`${word.text}: ${word.count} ${word.count === 1 ? 'mention' : 'mentions'}`"
      >
        {{ word.text }}
      </span>
    </div>

    <!-- Full responses list -->
    <div v-if="!isAnonymous && responses.length > 0" class="mt-6">
      <h4 class="mb-3 text-sm font-semibold text-gray-600 dark:text-gray-400">Individual Responses</h4>
      <div class="max-h-48 space-y-2 overflow-y-auto">
        <div
          v-for="(r, i) in responses"
          :key="i"
          class="rounded-lg bg-gray-50 p-3 text-sm dark:bg-gray-700/50"
        >
          <p class="text-gray-900 dark:text-white">{{ r.text }}</p>
          <p v-if="r.student_name" class="mt-1 text-xs text-gray-500 dark:text-gray-400">
            — {{ r.student_name }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
