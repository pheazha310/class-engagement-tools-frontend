<script setup lang="ts">
import type { LivePoll } from '@/types/livePoll'
import PollStatusBadge from './PollStatusBadge.vue'

defineProps<{
  poll: LivePoll
}>()

defineEmits<{
  view: [id: string]
  edit: [id: string]
  start: [id: string]
  end: [id: string]
  delete: [id: string]
  results: [id: string]
}>()

const typeLabels: Record<string, string> = {
  multiple_choice: 'Multiple Choice',
  yes_no: 'Yes / No',
  rating: 'Rating Scale',
}
</script>

<template>
  <div class="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:shadow-md">
    <div class="mb-3 flex items-start justify-between gap-3">
      <div class="min-w-0 flex-1">
        <h3 class="truncate text-base font-semibold text-gray-900">{{ poll.question }}</h3>
        <p v-if="poll.title" class="mt-0.5 text-sm text-gray-500">{{ poll.title }}</p>
      </div>
      <PollStatusBadge :status="poll.status" />
    </div>

    <div class="mb-3 flex flex-wrap gap-2 text-xs text-gray-500">
      <span class="rounded-md bg-gray-100 px-2 py-1 font-medium">{{ typeLabels[poll.poll_type] || poll.poll_type }}</span>
      <span class="rounded-md bg-gray-100 px-2 py-1 font-medium">{{ poll.options?.length || 0 }} options</span>
      <span v-if="poll.anonymous" class="rounded-md bg-purple-100 px-2 py-1 font-medium text-purple-700">Anonymous</span>
      <span v-if="poll.allow_multiple_votes" class="rounded-md bg-blue-100 px-2 py-1 font-medium text-blue-700">Multi-vote</span>
    </div>

    <div class="flex flex-wrap gap-2">
      <button
        class="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-indigo-700"
        @click="$emit('results', poll.id)"
      >
        Results
      </button>

      <button
        v-if="poll.status === 'draft'"
        class="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-50"
        @click="$emit('edit', poll.id)"
      >
        Edit
      </button>

      <button
        v-if="poll.status === 'draft'"
        class="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-green-700"
        @click="$emit('start', poll.id)"
      >
        Start
      </button>

      <button
        v-if="poll.status === 'active'"
        class="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-red-700"
        @click="$emit('end', poll.id)"
      >
        End
      </button>

      <button
        v-if="poll.status === 'draft'"
        class="rounded-lg border border-red-300 px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50"
        @click="$emit('delete', poll.id)"
      >
        Delete
      </button>
    </div>
  </div>
</template>
