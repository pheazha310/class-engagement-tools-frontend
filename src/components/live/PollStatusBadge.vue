<script setup lang="ts">
import type { PollStatus } from '@/types/livePoll'

defineProps<{
  status: PollStatus
}>()

const config: Record<PollStatus, { label: string; class: string }> = {
  draft: { label: 'Draft', class: 'bg-yellow-100 text-yellow-800' },
  active: { label: 'Active', class: 'bg-green-100 text-green-800' },
  closed: { label: 'Closed', class: 'bg-gray-100 text-gray-600' },
}
</script>

<template>
  <span
    class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium uppercase tracking-wider"
    :class="config[status]?.class"
  >
    {{ config[status]?.label }}
  </span>
</template>
