<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useTimerStore } from '@/stores/timerStore'

const timerStore = useTimerStore()
const { remainingSeconds, isRunning, isPaused, isCompleted, savedPresets } = storeToRefs(timerStore)
const minutesInput = ref(5)
const secondsInput = ref(0)
const presetName = ref('')
const isFullscreen = ref(false)
const audioContext = ref<AudioContext | null>(null)
const bellBuffer = ref<AudioBuffer | null>(null)
const bellSource = ref<AudioBufferSourceNode | null>(null)
const initialDuration = ref(0)

const SVG_CIRCUMFERENCE = 2 * Math.PI * 45 // ~282.74

const totalDurationSeconds = computed(() => {
  const minutes = Math.max(0, Math.floor(minutesInput.value))
  const seconds = Math.max(0, Math.min(59, Math.floor(secondsInput.value)))
  return minutes * 60 + seconds
})

const formattedRemainingTime = computed(() => {
  const minutes = Math.floor(remainingSeconds.value / 60)
  const seconds = remainingSeconds.value % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
})

const hasDuration = computed(() => totalDurationSeconds.value > 0)
const isFinished = computed(() => remainingSeconds.value <= 0)

const progressRatio = computed(() => {
  if (initialDuration.value <= 0) return 1
  return Math.max(0, remainingSeconds.value / initialDuration.value)
})

const dashOffset = computed(() => {
  return SVG_CIRCUMFERENCE * (1 - progressRatio.value)
})

const formatPresetDuration = (durationSeconds: number) => {
  const minutes = Math.floor(durationSeconds / 60)
  const seconds = durationSeconds % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

const stopAlarm = () => {
  if (!bellSource.value) return

  bellSource.value.stop()
  bellSource.value.disconnect()
  bellSource.value = null
}

const prepareBellSound = async () => {
  try {
    if (!audioContext.value) {
      audioContext.value = new AudioContext()
    }

    if (audioContext.value.state === 'suspended') {
      await audioContext.value.resume()
    }

    if (!bellBuffer.value) {
      const response = await fetch('/sounds/alarm.wav')
      if (!response.ok) throw new Error('Alarm sound file could not be loaded.')
      bellBuffer.value = await audioContext.value.decodeAudioData(await response.arrayBuffer())
    }

    return audioContext.value
  } catch (error) {
    console.error('Timer alarm could not be prepared:', error)
    return null
  }
}

const playTick = () => {
  if (!audioContext.value) return

  try {
    const osc = audioContext.value.createOscillator()
    const gain = audioContext.value.createGain()
    osc.connect(gain)
    gain.connect(audioContext.value.destination)
    osc.frequency.value = 880
    gain.gain.setValueAtTime(0.08, audioContext.value.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, audioContext.value.currentTime + 0.04)
    osc.start()
    osc.stop(audioContext.value.currentTime + 0.04)
  } catch {
    // Silently ignore tick errors
  }
}

const playAlarm = async () => {
  if (!timerStore.claimCompletionAlarm()) return

  const context = await prepareBellSound()
  if (!context || !bellBuffer.value) return

  stopAlarm()
  const source = context.createBufferSource()
  const gain = context.createGain()
  gain.gain.setValueAtTime(1, context.currentTime)
  source.buffer = bellBuffer.value
  source.loop = true
  source.connect(gain)
  gain.connect(context.destination)
  source.onended = () => {
    if (bellSource.value === source) bellSource.value = null
  }
  bellSource.value = source
  source.start()
  source.stop(context.currentTime + 5)
}

const startTimer = () => {
  stopAlarm()
  initialDuration.value = totalDurationSeconds.value
  void prepareBellSound()
  timerStore.start(totalDurationSeconds.value)
}

const pauseTimer = () => timerStore.pause()
const resumeTimer = () => {
  void prepareBellSound()
  timerStore.resume()
}

const resetTimer = () => {
  stopAlarm()
  timerStore.reset(totalDurationSeconds.value)
}

const toggleFullscreen = async () => {
  const timerSection = document.querySelector('.timer-section') as HTMLElement
  if (!timerSection) return

  try {
    if (!isFullscreen.value) {
      if (timerSection.requestFullscreen) {
        await timerSection.requestFullscreen()
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

const setPreset = (minutes: number, seconds = 0) => {
  if (isRunning.value) return
  minutesInput.value = minutes
  secondsInput.value = seconds
}

const saveCurrentPreset = () => {
  timerStore.savePreset(presetName.value, totalDurationSeconds.value)
  presetName.value = ''
}

const loadSavedPreset = (durationSeconds: number) => {
  if (isRunning.value) return

  stopAlarm()
  minutesInput.value = Math.floor(durationSeconds / 60)
  secondsInput.value = durationSeconds % 60
  timerStore.setDuration(durationSeconds)
}

const clampMinutes = (value: number) => {
  minutesInput.value = Math.max(0, Math.min(99, value))
}

const clampSeconds = (value: number) => {
  secondsInput.value = Math.max(0, Math.min(59, value))
}

const decrementMinutes = () => clampMinutes(minutesInput.value - 1)
const incrementMinutes = () => clampMinutes(minutesInput.value + 1)
const decrementSeconds = () => clampSeconds(secondsInput.value - 1)
const incrementSeconds = () => clampSeconds(secondsInput.value + 1)

// Play tick sound when remainingSeconds changes during countdown
watch(remainingSeconds, (newVal, oldVal) => {
  if (isRunning.value && !isPaused.value && newVal < oldVal && newVal > 0) {
    playTick()
  }
})

watch([minutesInput, secondsInput], () => {
  timerStore.setDuration(totalDurationSeconds.value)
})

watch(isCompleted, (completed) => {
  if (completed) void playAlarm()
})

onUnmounted(() => {
  timerStore.dispose()
  stopAlarm()
  if (audioContext.value && audioContext.value.state !== 'closed') {
    void audioContext.value.close()
  }
  if (isFullscreen.value && document.fullscreenElement) {
    document.exitFullscreen()
  }
})
</script>

<template>
  <section class="timer-section">
    <div class="timer-card">
      <button
        type="button"
        class="fullscreen-btn"
        @click="toggleFullscreen"
        aria-label="Toggle fullscreen"
      >
        ⛶
      </button>
      
      <div class="timer-circle">
        <!-- SVG progress ring -->
        <svg
          class="timer-progress-ring"
          viewBox="0 0 100 100"
          role="progressbar"
          :aria-valuenow="remainingSeconds"
          :aria-valuemin="0"
          :aria-valuemax="initialDuration"
        >
          <!-- Background track -->
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="rgba(99, 102, 241, 0.12)"
            stroke-width="6"
          />
          <!-- Animated progress arc -->
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="url(#progressGradient)"
            stroke-width="6"
            stroke-linecap="round"
            :stroke-dasharray="SVG_CIRCUMFERENCE"
            :stroke-dashoffset="dashOffset"
            transform="rotate(-90 50 50)"
            class="timer-progress-arc"
          />
          <defs>
            <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#818cf8" />
              <stop offset="100%" stop-color="#4f46e5" />
            </linearGradient>
          </defs>
        </svg>
        <div class="timer-display">{{ formattedRemainingTime }}</div>
        <p class="timer-label">{{ isFinished ? 'Finished' : 'Remaining' }}</p>
      </div>

      <div class="timer-controls">
        <div class="timer-field">
          <span class="field-label">MINUTES</span>
          <div class="field-control">
            <button type="button" @click="decrementMinutes" :disabled="isRunning">−</button>
            <input
              id="minutes-input"
              type="number"
              min="0"
              max="99"
              v-model.number="minutesInput"
              :disabled="isRunning"
              aria-label="Minutes"
            />
            <button type="button" @click="incrementMinutes" :disabled="isRunning">+</button>
          </div>
        </div>

        <div class="timer-field">
          <span class="field-label">SECONDS</span>
          <div class="field-control">
            <button type="button" @click="decrementSeconds" :disabled="isRunning">−</button>
            <input
              id="seconds-input"
              type="number"
              min="0"
              max="59"
              v-model.number="secondsInput"
              :disabled="isRunning"
              aria-label="Seconds"
            />
            <button type="button" @click="incrementSeconds" :disabled="isRunning">+</button>
          </div>
        </div>
      </div>

      <div class="timer-action-row">
        <button
          type="button"
          class="btn btn-primary"
          @click="startTimer"
          :disabled="!hasDuration || isRunning"
        >
          ▶ Start
        </button>
        <button
          type="button"
          class="btn btn-secondary"
          @click="pauseTimer"
          :disabled="!isRunning || isPaused"
        >
          ⏸ Pause
        </button>
        <button
          type="button"
          class="btn btn-secondary"
          @click="resumeTimer"
          :disabled="!isPaused"
        >
          ▶ Resume
        </button>
        <button
          type="button"
          class="btn btn-secondary"
          @click="resetTimer"
          :disabled="!hasDuration"
        >
          ⟳ Reset
        </button>
      </div>

      <div class="timer-presets">
        <div class="preset-buttons">
          <button type="button" class="preset-pill" @click="setPreset(0, 30)">30s</button>
          <button type="button" class="preset-pill" @click="setPreset(1, 0)">1m</button>
          <button type="button" class="preset-pill" @click="setPreset(2, 0)">2m</button>
          <button type="button" class="preset-pill" @click="setPreset(5, 0)">5m</button>
          <button type="button" class="preset-pill" @click="setPreset(10, 0)">10m</button>
        </div>
      </div>

      <div class="saved-preset-manager">
        <div v-if="savedPresets.length" class="saved-presets" aria-label="Saved timer presets">
          <p class="saved-presets-label">Saved presets</p>
          <div class="saved-preset-list">
            <div v-for="preset in savedPresets" :key="preset.id" class="saved-preset-item">
              <button
                type="button"
                class="saved-preset-button"
                :disabled="isRunning"
                @click="loadSavedPreset(preset.durationSeconds)"
              >
                {{ preset.name }} · {{ formatPresetDuration(preset.durationSeconds) }}
              </button>
              <button
                type="button"
                class="delete-preset-button"
                :disabled="isRunning"
                :aria-label="`Delete ${preset.name} preset`"
                @click="timerStore.deletePreset(preset.id)"
              >
                ×
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.timer-section {
  padding: 8px 0 16px;
}

.fullscreen-btn {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 42px;
  height: 42px;
  border: none;
  border-radius: 999px;
  background: #f1f5f9;
  color: #0f172a;
  font-size: 1.2rem;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.08);
}

.fullscreen-btn:hover {
  background: #e2e8f0;
}

.timer-section:fullscreen {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #0f172a;
  padding: 0;
  margin: 0;
  position: relative;
}

.timer-section:fullscreen .fullscreen-btn {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 100;
}

.timer-section:fullscreen .timer-card {
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
  position: relative;
}

.timer-section:fullscreen .timer-circle {
  width: 500px;
  height: 500px;
  margin: 0 0 60px 0;
  background: radial-gradient(circle at top, rgba(99, 102, 241, 0.2), transparent 45%), rgba(79, 70, 229, 0.1);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.timer-section:fullscreen .timer-display {
  font-size: 7rem;
  color: #ffffff;
  font-weight: 900;
  margin: 0;
  line-height: 0.9;
  text-align: center;
}

.timer-section:fullscreen .timer-label {
  font-size: 1.2rem;
  color: #cbd5e1;
  margin: 12px 0 0 0;
  text-align: center;
}

.timer-section:fullscreen .timer-controls {
  display: none;
}

.timer-section:fullscreen .timer-presets {
  display: none;
}

.timer-section:fullscreen .timer-note {
  display: none;
}

.timer-section:fullscreen .timer-action-row {
  gap: 20px;
  margin-top: 60px;
}

.timer-section:fullscreen .btn {
  padding: 18px 28px;
  font-size: 1.1rem;
  min-width: 140px;
}

.timer-section:fullscreen .timer-progress-ring {
  width: 530px;
  height: 530px;
}

.timer-section:fullscreen .timer-progress-ring circle {
  stroke-width: 8px;
}

.timer-card {
  position: relative;
  max-width: 500px;
  margin: 0 auto;
  background: white;
  border-radius: 28px;
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.08);
  border: 1px solid rgba(148, 163, 184, 0.16);
  padding: 32px;
}

.timer-circle {
  position: relative;
  width: 254px;
  height: 254px;
  margin: 0 auto 28px;
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: radial-gradient(circle at top, rgba(99, 102, 241, 0.12), transparent 45%), #fff;
}

.timer-progress-ring {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 274px;
  height: 274px;
  pointer-events: none;
}

.timer-progress-arc {
  transition: stroke-dashoffset 0.45s linear;
}

.timer-display {
  font-size: 3.6rem;
  font-weight: 800;
  color: #0f172a;
  position: relative;
  z-index: 1;
}

.timer-label {
  margin-top: 12px;
  font-size: 0.9rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: #64748b;
  position: relative;
  z-index: 1;
}

.timer-controls {
  display: grid;
  grid-template-columns: repeat(2, minmax(70px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.timer-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.field-label {
  font-size: 0.7rem;
  letter-spacing: 0.18em;
  color: #94a3b8;
  text-transform: uppercase;
}

.field-control {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border: 1px solid #e2e8f0;
  border-radius: 999px;
  background: #f8fafc;
  padding: 4px;
}

.field-control button {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 999px;
  background: white;
  color: #334155;
  font-size: 1.1rem;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(15, 23, 42, 0.08);
}

.field-control button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.field-control input {
  width: 48px;
  border: none;
  background: transparent;
  text-align: center;
  font-size: 1.1rem;
  font-weight: 700;
  color: #0f172a;
}

.field-control input:focus {
  outline: none;
}

.timer-action-row {
  display: flex;
  flex-wrap: nowrap;
  gap: 8px;
  justify-content: center;
  margin-bottom: 22px;
}

.btn {
  border: none;
  border-radius: 12px;
  padding: 10px 16px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.85rem;
  min-width: auto;
  white-space: nowrap;
}

.btn-primary {
  background: #4f46e5;
  color: white;
}

.btn-primary:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.btn-secondary {
  background: #f1f5f9;
  color: #0f172a;
}

.btn-secondary:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.timer-presets {
  margin-bottom: 18px;
}

.preset-buttons {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 10px;
}

.preset-pill {
  border: 1px solid #e2e8f0;
  background: #fff;
  color: #0f172a;
  border-radius: 999px;
  padding: 8px 14px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.85rem;
  min-width: 48px;
}

.preset-pill:hover {
  border-color: #c7d2fe;
  background: #eef2ff;
}

.saved-preset-manager {
  margin-bottom: 18px;
  padding-top: 18px;
  border-top: 1px solid #e2e8f0;
}

.save-preset-row {
  display: flex;
  gap: 10px;
}

.save-preset-row input {
  min-width: 0;
  flex: 1;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  padding: 10px 12px;
  color: #0f172a;
}

.save-preset-button,
.saved-preset-button,
.delete-preset-button {
  border: none;
  cursor: pointer;
  font-weight: 700;
}

.save-preset-button {
  border-radius: 10px;
  padding: 10px 14px;
  background: #eef2ff;
  color: #3730a3;
}

.saved-presets {
  margin-top: 16px;
}

.saved-presets-label {
  margin: 0 0 8px;
  font-size: 0.78rem;
  letter-spacing: 0.14em;
  color: #64748b;
  text-transform: uppercase;
}

.saved-preset-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.saved-preset-item {
  display: flex;
  overflow: hidden;
  border: 1px solid #c7d2fe;
  border-radius: 999px;
}

.saved-preset-button {
  padding: 8px 12px;
  background: #eef2ff;
  color: #312e81;
}

.delete-preset-button {
  width: 32px;
  background: #e0e7ff;
  color: #4338ca;
  font-size: 1.2rem;
  line-height: 1;
}

.save-preset-button:disabled,
.saved-preset-button:disabled,
.delete-preset-button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.timer-note {
  margin: 0;
  font-size: 0.95rem;
  color: #475569;
  text-align: center;
}

@media (max-width: 640px) {
  .timer-card {
    padding: 24px;
  }

  .timer-circle {
    width: 210px;
    height: 210px;
  }

  .timer-progress-ring {
    width: 230px;
    height: 230px;
  }

  .timer-display {
    font-size: 3rem;
  }

  .timer-controls {
    grid-template-columns: 1fr;
  }
}
</style>