<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

const props = defineProps<{
  startedAt: string | null
  durationMinutes: number | null
}>()

const now = ref(Date.now())
let timer: ReturnType<typeof setInterval> | null = null

const remainingSeconds = computed(() => {
  if (!props.startedAt || !props.durationMinutes) return null
  const start = new Date(props.startedAt).getTime()
  const end = start + props.durationMinutes * 60 * 1000
  const remaining = Math.max(0, Math.floor((end - now.value) / 1000))
  return remaining
})

const display = computed(() => {
  const secs = remainingSeconds.value
  if (secs === null) return null
  if (secs <= 0) return 'Ended'
  const m = Math.floor(secs / 60)
  const s = secs % 60
  return `${m}:${s.toString().padStart(2, '0')}`
})

const isUrgent = computed(() => {
  return remainingSeconds.value !== null && remainingSeconds.value > 0 && remainingSeconds.value <= 60
})

onMounted(() => {
  timer = setInterval(() => {
    now.value = Date.now()
  }, 1000)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>

<template>
  <div
    v-if="display"
    class="lv-countdown"
    :class="isUrgent ? 'lv-countdown--urgent' : 'lv-countdown--normal'"
  >
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2.5"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
    <span>{{ display }}</span>
  </div>
</template>
