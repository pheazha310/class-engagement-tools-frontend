<script setup lang="ts">
import { computed, onUnmounted, ref } from 'vue'

const elapsedSeconds = ref(0)
const intervalId = ref<number | null>(null)
const isRunning = ref(false)
const isPaused = ref(false)
const isFullscreen = ref(false)

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

const pauseStopwatch = () => {
  stopStopwatch()
  isPaused.value = true
}

const resumeStopwatch = () => {
  if (!isPaused.value) return

  isPaused.value = false
  isRunning.value = true
  intervalId.value = window.setInterval(() => {
    elapsedSeconds.value += 1
  }, 1000)
}

const resetStopwatch = () => {
  stopStopwatch()
  isPaused.value = false
  elapsedSeconds.value = 0
}

const toggleFullscreen = async () => {
  const stopwatchSection = document.querySelector('.stopwatch-section') as HTMLElement
  if (!stopwatchSection) return

  try {
    if (!isFullscreen.value) {
      if (stopwatchSection.requestFullscreen) {
        await stopwatchSection.requestFullscreen()
        isFullscreen.value = true
      }
    } else {
      if (document.fullscreenElement) {
        await document.exitFullscreen()
        isFullscreen.value = false
      }
    }
  } catch (error) {
    console.error('Fullscreen request failed:', error)
    isFullscreen.value = false
  }
}

onUnmounted(() => {
  stopStopwatch()
  if (isFullscreen.value && document.fullscreenElement) {
    document.exitFullscreen()
  }
})
</script>

<template>
  <section class="stopwatch-section">
    <div class="stopwatch-card">
      <div class="stopwatch-display">
        <div class="stopwatch-time">{{ formattedElapsedTime }}</div>
        <div class="stopwatch-label">Elapsed Time</div>
      </div>

      <button
        type="button"
        class="fullscreen-button"
        :aria-label="isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'"
        :title="isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'"
        @click="toggleFullscreen"
      >
        ⛶
      </button>

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
          @click="pauseStopwatch"
          :disabled="!isRunning || isPaused"
        >
          ⏸ Pause
        </button>
        <button
          type="button"
          class="btn btn-secondary"
          @click="resumeStopwatch"
          :disabled="!isPaused"
        >
          ▶ Resume
        </button>
        <button
          type="button"
          class="btn btn-secondary"
          @click="resetStopwatch"
          :disabled="elapsedSeconds === 0 && !isRunning && !isPaused"
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

.stopwatch-section:fullscreen {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #0f172a;
  padding: 0;
  margin: 0;
}

.stopwatch-section:fullscreen .stopwatch-card {
  max-width: none;
  margin: 0;
  border-radius: 0;
  box-shadow: none;
  border: none;
  padding: 60px;
  background: #0f172a;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stopwatch-section:fullscreen .stopwatch-display {
  gap: 20px;
  margin-bottom: 60px;
}

.stopwatch-section:fullscreen .stopwatch-action-row {
  gap: 20px;
  margin-bottom: 40px;
}

.stopwatch-section:fullscreen .btn {
  padding: 18px 28px;
  font-size: 1.1rem;
  min-width: 140px;
}

.stopwatch-section:fullscreen .fullscreen-button {
  position: fixed;
  top: 24px;
  right: 24px;
  color: #ffffff;
  background: rgba(255, 255, 255, 0.12);
}

.stopwatch-card {
  position: relative;
  max-width: 420px;
  margin: 24px auto 0;
  background: white;
  border-radius: 28px;
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.08);
  border: 1px solid rgba(148, 163, 184, 0.16);
  padding: 32px;
  text-align: center;
}

.fullscreen-button {
  position: absolute;
  top: 18px;
  right: 18px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  padding: 0;
  border: none;
  border-radius: 10px;
  background: #f1f5f9;
  color: #0f172a;
  cursor: pointer;
  font-size: 1.35rem;
  line-height: 1;
}

.fullscreen-button:hover {
  background: #e2e8f0;
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

.stopwatch-section:fullscreen .stopwatch-time {
  font-size: 10rem;
  color: #ffffff;
  font-weight: 900;
}

.stopwatch-label {
  font-size: 0.9rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: #64748b;
}

.stopwatch-section:fullscreen .stopwatch-label {
  font-size: 1.8rem;
  color: #cbd5e1;
}

.stopwatch-action-row {
  display: flex;
  flex-wrap: nowrap;
  gap: 8px;
  justify-content: center;
}

.btn {
  border: none;
  border-radius: 10px;
  padding: 8px 12px;
  cursor: pointer;
  font-weight: 700;
  font-size: 0.82rem;
  min-width: 70px;
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

}
</style>
