<script setup lang="ts">
import type { Poll } from '@/types/poll'

defineProps<{
  poll: Poll
}>()

const emit = defineEmits<{
  edit: [id: number]
  delete: [id: number]
  start: [id: number]
  end: [id: number]
  view: [id: number]
}>()

const statusColors: Record<string, string> = {
  draft: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  ended: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
}
</script>

<template>
  <div class="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md dark:border-gray-700 dark:bg-gray-800">
    <div class="mb-3 flex items-start justify-between">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white">{{ poll.question }}</h3>
      <span
        class="rounded-full px-2.5 py-0.5 text-xs font-medium uppercase"
        :class="statusColors[poll.status]"
      >
        {{ poll.status }}
      </span>
    </div>

    <div class="mb-4 text-sm text-gray-500 dark:text-gray-400">
      <span>{{ poll.options?.length || 0 }} options</span>
      <span v-if="poll.total_votes !== undefined" class="ml-3">{{ poll.total_votes }} votes</span>
    </div>

    <div class="flex flex-wrap gap-2">
      <button
        class="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-indigo-700"
        @click="emit('view', poll.id)"
      >
        View
      </button>

      <button
        v-if="poll.status === 'draft'"
        class="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-blue-700"
        @click="emit('edit', poll.id)"
      >
        Edit
      </button>

      <button
        v-if="poll.status === 'draft'"
        class="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-green-700"
        @click="emit('start', poll.id)"
      >
        Start
      </button>

      <button
        v-if="poll.status === 'active'"
        class="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-red-700"
        @click="emit('end', poll.id)"
      >
        End
      </button>

      <button
        v-if="poll.status === 'draft'"
        class="rounded-lg border border-red-300 px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
        @click="emit('delete', poll.id)"
      >
        Delete
      </button>
    </div>
  </div>
</template>
