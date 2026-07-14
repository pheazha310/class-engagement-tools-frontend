<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{
  count: number
  label?: string
}>()

const animatedCount = ref(props.count)
const animating = ref(false)

watch(
  () => props.count,
  (newVal) => {
    if (newVal !== animatedCount.value) {
      animating.value = true
      animatedCount.value = newVal
      setTimeout(() => {
        animating.value = false
      }, 400)
    }
  },
)
</script>

<template>
  <div class="lv-participants">
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87" />
      <path d="M16 3.13a4 4 0 010 7.75" />
    </svg>
    <span
      class="lv-participants-count"
      :class="{ 'lv-participants-count--bump': animating }"
    >
      {{ animatedCount }}
    </span>
    <span v-if="label" class="lv-participants-label">{{ label }}</span>
  </div>
</template>
