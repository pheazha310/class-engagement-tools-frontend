<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  label: string
  votes: number
  totalVotes: number
  color?: string
  maxPercentage?: number
}>()

const percentage = computed(() => {
  if (props.totalVotes === 0) return 0
  return Math.round((props.votes / props.totalVotes) * 100)
})

const isWinner = computed(() => {
  if (!props.maxPercentage || props.totalVotes === 0) return false
  return percentage.value === props.maxPercentage && percentage.value > 0
})

const barColor = computed(() => {
  if (props.color) return props.color
  return isWinner.value ? 'from-emerald-500 to-emerald-400' : 'from-indigo-500 to-indigo-400'
})
</script>

<template>
  <div class="space-y-1.5">
    <div class="flex items-center justify-between text-sm">
      <span class="font-medium text-gray-700">{{ label }}</span>
      <span class="font-semibold text-gray-500">
        {{ votes }} vote{{ votes !== 1 ? 's' : '' }}
        <span class="ml-1 text-xs text-gray-400">({{ percentage }}%)</span>
      </span>
    </div>
    <div class="h-3 w-full overflow-hidden rounded-full bg-gray-100">
      <div
        class="h-full rounded-full bg-gradient-to-r transition-all duration-700 ease-out"
        :class="[barColor]"
        :style="{ width: percentage + '%' }"
      />
    </div>
  </div>
</template>
