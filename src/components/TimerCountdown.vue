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

const urgencyClass = computed(() => {
  if (isFinished.value) return 'urgency--done'
  if (!isRunning.value || !initialDuration.value) return ''
  if (remainingSeconds.value <= 5) return 'urgency--critical'
  if (remainingSeconds.value <= 30) return 'urgency--warning'
  return ''
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

const progressStops = computed(() => {
  if (isFinished.value) return { start: '#f87171', end: '#ef4444' }
  if (remainingSeconds.value <= 5) return { start: '#f87171', end: '#ef4444' }
  if (remainingSeconds.value <= 30) return { start: '#fbbf24', end: '#f59e0b' }
  return { start: '#818cf8', end: '#6366f1' }
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
      <RouterLink to="/tools" class="back-button">
        <span class="back-icon">←</span>
        <span class="back-text">Back</span>
      </RouterLink>
      <button
        type="button"
        class="fullscreen-btn"
        @click="toggleFullscreen"
        aria-label="Toggle fullscreen"
      >
        ⛶
      </button>
      
      <div class="timer-circle" :class="{ running: isRunning, [urgencyClass]: true }">
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
            stroke-width="7"
            stroke-linecap="round"
            :stroke-dasharray="SVG_CIRCUMFERENCE"
            :stroke-dashoffset="dashOffset"
            transform="rotate(-90 50 50)"
            class="timer-progress-arc"
          />
          <defs>
            <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" :stop-color="progressStops.start" />
              <stop offset="100%" :stop-color="progressStops.end" />
            </linearGradient>
          </defs>
        </svg>
        <div class="timer-display" :class="{ pulse: isRunning && remainingSeconds > 0 }">
          {{ formattedRemainingTime }}
        </div>
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

.back-button {
  position: absolute;
  top: 16px;
  left: 16px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: 999px;
  text-decoration: none;
  font-weight: 700;
  font-size: 13px;
  letter-spacing: 0.02em;
  border: 1.5px solid #e2e8f0;
  color: #475569;
  background: #f8fafc;
  transition: all 0.25s ease;
  white-space: nowrap;
  z-index: 2;
}

.back-button:hover {
  border-color: #6366f1;
  color: #4f46e5;
  background: #eef2ff;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(79, 70, 229, 0.12);
}

.back-icon {
  font-size: 16px;
  line-height: 1;
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
  transition: all 0.2s ease;
}

.fullscreen-btn:hover {
  background: #e2e8f0;
  transform: scale(1.05);
}

.timer-card {
  position: relative;
  max-width: 500px;
  margin: 0 auto;
  background: white;
  border-radius: 28px;
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.08), 0 0 0 1px rgba(148, 163, 184, 0.16);
  padding: 32px;
  transition: box-shadow 0.4s ease, transform 0.4s ease;
  animation: cardIn 0.65s cubic-bezier(0.16, 1, 0.3, 1) both;
}

.timer-card:hover {
  box-shadow: 0 28px 72px rgba(15, 23, 42, 0.13), 0 0 0 1px rgba(148, 163, 184, 0.26);
  transform: translateY(-2px);
}

@keyframes cardIn {
  from { opacity: 0; transform: translateY(28px) scale(0.98); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

/* Circle */
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
  transition: box-shadow 0.5s ease, background 0.5s ease;
}

.timer-circle.running {
  animation: subtlePulse 2.4s ease-in-out infinite;
}

.timer-circle.urgency--warning {
  animation: subtlePulse 1.4s ease-in-out infinite;
}

.timer-circle.urgency--critical {
  animation: criticalPulse 0.8s ease-in-out infinite;
}

.timer-circle.urgency--done {
  animation: doneFlash 1.2s ease-in-out infinite;
}

@keyframes subtlePulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.0); }
  50% { box-shadow: 0 0 0 18px rgba(99, 102, 241, 0.08); }
}

@keyframes criticalPulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.0); }
  50% { box-shadow: 0 0 0 22px rgba(239, 68, 68, 0.12); }
}

@keyframes doneFlash {
  0%, 100% { background: radial-gradient(circle at top, rgba(239, 68, 68, 0.15), transparent 45%), #fff; }
  50% { background: radial-gradient(circle at top, rgba(239, 68, 68, 0.28), transparent 45%), #fff; }
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
  transition: color 0.5s ease, transform 0.12s ease;
  letter-spacing: -0.03em;
  line-height: 0.95;
}

.timer-display.pulse {
  animation: textPulse 1s ease-in-out infinite;
}

.timer-circle.urgency--warning .timer-display {
  color: #f59e0b;
}

.timer-circle.urgency--critical .timer-display {
  color: #ef4444;
  animation: criticalText 0.7s ease-in-out infinite;
}

.timer-circle.urgency--done .timer-display {
  color: #ef4444;
}

@keyframes textPulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.04); }
}

@keyframes criticalText {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.07); opacity: 0.85; }
}

.timer-label {
  margin-top: 12px;
  font-size: 0.85rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: #64748b;
  position: relative;
  z-index: 1;
  transition: color 0.5s ease;
}

.timer-circle.urgency--warning .timer-label {
  color: #f59e0b;
}

.timer-circle.urgency--critical .timer-label {
  color: #ef4444;
}

/* Controls */
.timer-controls {
  display: grid;
  grid-template-columns: repeat(2, minmax(120px, 1fr));
  gap: 18px;
  margin-bottom: 24px;
}

.timer-field {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.field-label {
  font-size: 0.75rem;
  letter-spacing: 0.16em;
  color: #64748b;
  text-transform: uppercase;
  font-weight: 700;
}

.field-control {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border: 1.5px solid #e2e8f0;
  border-radius: 999px;
  background: #f8fafc;
  padding: 6px;
  transition: all 0.2s ease;
}

.field-control:focus-within {
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.08);
}

.field-control button {
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 999px;
  background: white;
  color: #334155;
  font-size: 1.2rem;
  font-weight: 800;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(15, 23, 42, 0.06);
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.field-control button:hover:not(:disabled) {
  background: #eef2ff;
  color: #4f46e5;
  transform: scale(1.08);
  box-shadow: 0 4px 12px rgba(79, 70, 229, 0.14);
}

.field-control button:active:not(:disabled) {
  transform: scale(0.95);
}

.field-control button:disabled {
  cursor: not-allowed;
  opacity: 0.35;
}

.field-control input {
  width: 56px;
  border: none;
  background: transparent;
  text-align: center;
  font-size: 1.2rem;
  font-weight: 800;
  color: #0f172a;
  -moz-appearance: textfield;
  transition: color 0.5s ease;
}

.field-control input::-webkit-outer-spin-button,
.field-control input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.field-control input:focus {
  outline: none;
}

/* Actions */
.timer-action-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: center;
  margin-bottom: 24px;
}

.btn {
  border: none;
  border-radius: 12px;
  padding: 12px 18px;
  cursor: pointer;
  font-weight: 700;
  font-size: 0.88rem;
  min-width: auto;
  white-space: nowrap;
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  letter-spacing: 0.01em;
  position: relative;
  overflow: hidden;
}

.btn:hover:not(:disabled) {
  transform: translateY(-2px);
}

.btn:active:not(:disabled) {
  transform: translateY(0) scale(0.98);
}

.btn-primary {
  background: linear-gradient(135deg, #4f46e5, #6366f1);
  color: white;
  box-shadow: 0 4px 14px rgba(79, 70, 229, 0.3);
}

.btn-primary:hover:not(:disabled) {
  background: linear-gradient(135deg, #6366f1, #818cf8);
  box-shadow: 0 8px 22px rgba(79, 70, 229, 0.4);
}

.btn-secondary {
  background: #f1f5f9;
  color: #0f172a;
  border: 1px solid #e2e8f0;
}

.btn-secondary:hover:not(:disabled) {
  background: #e2e8f0;
  box-shadow: 0 4px 14px rgba(15, 23, 42, 0.08);
}

/* Presets */
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
  border: 1.5px solid #e2e8f0;
  background: white;
  color: #0f172a;
  border-radius: 999px;
  padding: 9px 20px;
  cursor: pointer;
  font-weight: 700;
  font-size: 0.85rem;
  min-width: 48px;
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

.preset-pill:hover {
  border-color: #6366f1;
  background: #eef2ff;
  color: #4f46e5;
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(79, 70, 229, 0.18);
}

.preset-pill:active {
  transform: translateY(0) scale(0.97);
}

/* Saved presets */
.saved-preset-manager {
  margin-top: 22px;
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
  transition: all 0.2s ease;
}

.save-preset-row input:focus {
  outline: none;
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.08);
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
  transition: all 0.2s ease;
}

.save-preset-button:hover:not(:disabled) {
  background: #e0e7ff;
  transform: translateY(-1px);
}

.saved-presets {
  margin-top: 16px;
}

.saved-presets-label {
  margin: 0 0 10px;
  font-size: 0.78rem;
  letter-spacing: 0.14em;
  color: #64748b;
  text-transform: uppercase;
  font-weight: 700;
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
  transition: all 0.2s ease;
}

.saved-preset-item:hover {
  box-shadow: 0 4px 12px rgba(79, 70, 229, 0.1);
  border-color: #a5b4fc;
}

.saved-preset-button {
  padding: 8px 12px;
  background: #eef2ff;
  color: #312e81;
  transition: all 0.2s ease;
}

.saved-preset-button:hover:not(:disabled) {
  background: #e0e7ff;
  color: #1e1b4b;
}

.delete-preset-button {
  width: 32px;
  background: #e0e7ff;
  color: #4338ca;
  font-size: 1.2rem;
  line-height: 1;
  transition: all 0.2s ease;
}

.delete-preset-button:hover:not(:disabled) {
  background: #c7d2fe;
  color: #312e81;
}

.save-preset-button:disabled,
.saved-preset-button:disabled,
.delete-preset-button:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}

.timer-note {
  margin: 0;
  font-size: 0.95rem;
  color: #475569;
  text-align: center;
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

@media (max-width: 640px) {
  .timer-card {
    padding: 22px;
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

  .timer-action-row {
    flex-wrap: wrap;
  }
}
</style>