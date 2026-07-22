<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue'

const props = defineProps<{
  seconds: number
  label?: string
  size?: number
  strokeWidth?: number
  warningThreshold?: number
  dangerThreshold?: number
  paused?: boolean
  onExpire?: () => void
}>()

const timeRemaining = ref(props.seconds)
const isRunning = ref(true)
let interval: ReturnType<typeof setInterval> | null = null

const normalizedSeconds = Math.max(0, props.seconds)

const circumference = computed(() => 2 * Math.PI * 45)
const dashOffset = computed(() => {
  const ratio = timeRemaining.value / normalizedSeconds
  return circumference.value * (1 - Math.max(0, Math.min(1, ratio)))
})

const color = computed(() => {
  if (props.dangerThreshold != null && timeRemaining.value <= props.dangerThreshold) return '#dc2626'
  if (props.warningThreshold != null && timeRemaining.value <= props.warningThreshold) return '#f59e0b'
  return '#6366f1'
})

const formattedTime = computed(() => {
  const mins = Math.floor(timeRemaining.value / 60)
  const secs = timeRemaining.value % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
})

function startTimer() {
  if (interval) clearInterval(interval)
  interval = setInterval(() => {
    if (!props.paused) {
      if (timeRemaining.value <= 1) {
        timeRemaining.value = 0
        stopTimer()
        props.onExpire?.()
      } else {
        timeRemaining.value -= 1
      }
    }
  }, 1000)
}

function stopTimer() {
  if (interval) {
    clearInterval(interval)
    interval = null
  }
}

function reset(newSeconds: number) {
  stopTimer()
  timeRemaining.value = Math.max(0, newSeconds)
  isRunning.value = true
  startTimer()
}

watch(() => props.seconds, (newVal) => {
  reset(Math.max(0, newVal))
})

watch(() => props.paused, (val) => {
  if (val) stopTimer()
  else if (timeRemaining.value > 0 && !interval) startTimer()
})

onUnmounted(() => {
  stopTimer()
})

startTimer()

defineExpose({ reset, timeRemaining, stopTimer, startTimer })
</script>

<template>
  <div class="countdown-timer" :class="{ 'countdown-timer--danger': dangerThreshold != null && timeRemaining <= dangerThreshold }">
    <div v-if="label" class="countdown-timer-label">{{ label }}</div>
    <svg
      viewBox="0 0 100 100"
      class="countdown-timer-svg"
      role="timer"
      :aria-label="`${label || 'Timer'}: ${formattedTime} remaining`"
      :style="{ width: (size ?? 120) + 'px', height: (size ?? 120) + 'px' }"
    >
      <defs>
        <linearGradient id="timerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" :stop-color="color" />
          <stop offset="100%" :stop-color="color" stop-opacity="0.6" />
        </linearGradient>
      </defs>
      <circle
        cx="50"
        cy="50"
        r="45"
        fill="none"
        stroke="#f1f5f9"
        :stroke-width="strokeWidth"
      />
      <circle
        cx="50"
        cy="50"
        r="45"
        fill="none"
        stroke="url(#timerGrad)"
        :stroke-width="strokeWidth"
        :stroke-dasharray="circumference"
        :stroke-dashoffset="dashOffset"
        stroke-linecap="round"
        transform="rotate(-90 50 50)"
        class="countdown-timer-ring"
      />
      <text
        x="50"
        y="54"
        text-anchor="middle"
        dominant-baseline="middle"
        :font-size="(size ?? 120) * 0.22"
        font-weight="800"
        :fill="color"
        font-family="'SF Mono', 'Fira Code', Consolas, monospace"
      >
        {{ formattedTime }}
      </text>
    </svg>
  </div>
</template>

<style scoped>
.countdown-timer {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.countdown-timer--danger .countdown-timer-svg {
  animation: timerPulse 0.8s ease-in-out infinite;
}

.countdown-timer-label {
  font-size: 12px;
  font-weight: 700;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.countdown-timer-svg {
  display: block;
}

.countdown-timer-ring {
  transition: stroke-dashoffset 0.4s linear;
}

@keyframes timerPulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.65; }
}
</style>
