<script setup lang="ts">
import { computed, onUnmounted, ref } from 'vue'

const elapsedSeconds = ref(0)
const intervalId = ref<number | null>(null)
const isRunning = ref(false)

const formattedElapsedTime = computed(() => {
  const minutes = Math.floor(elapsedSeconds.value / 60)
  const seconds = elapsedSeconds.value % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
})

const startStopwatch = () => {
  if (isRunning.value) return

  isRunning.value = true
  intervalId.value = window.setInterval(() => {
    elapsedSeconds.value += 1
  }, 1000)
}

const stopStopwatch = () => {
  if (intervalId.value !== null) {
    clearInterval(intervalId.value)
    intervalId.value = null
  }
  isRunning.value = false
}

const resetStopwatch = () => {
  stopStopwatch()
  elapsedSeconds.value = 0
}

onUnmounted(() => {
  stopStopwatch()
})
</script>

<template>
  <section class="stopwatch-section">
    <div class="stopwatch-card">
      <div class="stopwatch-display">
        <div class="stopwatch-time">{{ formattedElapsedTime }}</div>
        <div class="stopwatch-label">Elapsed Time</div>
      </div>

      <div class="stopwatch-action-row">
        <button
          type="button"
          class="btn btn-primary"
          @click="startStopwatch"
          :disabled="isRunning"
        >
          ▶ Start
        </button>
        <button
          type="button"
          class="btn btn-secondary"
          @click="stopStopwatch"
          :disabled="!isRunning"
        >
          ■ Stop
        </button>
        <button
          type="button"
          class="btn btn-tertiary"
          @click="resetStopwatch"
          :disabled="elapsedSeconds === 0 && !isRunning"
        >
          ⟳ Reset
        </button>
      </div>
    </div>
  </section>
</template>

<style scoped>
.stopwatch-section {
  padding: 24px 0;
}

.stopwatch-card {
  max-width: 420px;
  margin: 24px auto 0;
  background: white;
  border-radius: 28px;
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.08);
  border: 1px solid rgba(148, 163, 184, 0.16);
  padding: 32px;
  text-align: center;
}

.stopwatch-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  margin-bottom: 28px;
}

.stopwatch-time {
  font-size: 4rem;
  font-weight: 800;
  color: #0f172a;
}

.stopwatch-label {
  font-size: 0.9rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: #64748b;
}

.stopwatch-action-row {
  display: grid;
  grid-template-columns: repeat(3, minmax(100px, 1fr));
  gap: 12px;
}

.btn {
  border: none;
  border-radius: 14px;
  padding: 14px 18px;
  cursor: pointer;
  font-weight: 700;
  font-size: 0.98rem;
  min-width: 100px;
}

.btn-primary {
  background: #4f46e5;
  color: white;
}

.btn-secondary {
  background: #f1f5f9;
  color: #0f172a;
}

.btn-tertiary {
  background: #eef2ff;
  color: #0f172a;
}

button:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

@media (max-width: 640px) {
  .stopwatch-card {
    padding: 24px;
  }

  .stopwatch-time {
    font-size: 3rem;
  }

  .stopwatch-action-row {
    grid-template-columns: 1fr;
  }
}
</style>
