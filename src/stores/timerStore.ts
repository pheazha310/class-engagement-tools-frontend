import { ref } from 'vue'
import { defineStore } from 'pinia'

export interface TimerPreset {
  id: string
  name: string
  durationSeconds: number
}

const PRESETS_STORAGE_KEY = 'class-engagement-timer-presets'

function loadSavedPresets(): TimerPreset[] {
  if (typeof window === 'undefined') return []

  try {
    const savedValue = window.localStorage.getItem(PRESETS_STORAGE_KEY)
    if (!savedValue) return []

    const parsedValue: unknown = JSON.parse(savedValue)
    if (!Array.isArray(parsedValue)) return []

    return parsedValue.filter((preset): preset is TimerPreset => (
      typeof preset?.id === 'string'
      && typeof preset.name === 'string'
      && typeof preset.durationSeconds === 'number'
      && preset.durationSeconds > 0
    ))
  } catch {
    return []
  }
}

export const useTimerStore = defineStore('timer', () => {
  const remainingSeconds = ref(5 * 60)
  const isRunning = ref(false)
  const isPaused = ref(false)
  const isCompleted = ref(false)
  const hasPlayedAlarm = ref(false)
  const savedPresets = ref<TimerPreset[]>(loadSavedPresets())
  let timerId: number | null = null

  function persistPresets() {
    if (typeof window === 'undefined') return

    window.localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(savedPresets.value))
  }

  function stopInterval() {
    if (timerId !== null) {
      clearInterval(timerId)
      timerId = null
    }
    isRunning.value = false
  }

  function complete() {
    remainingSeconds.value = 0
    stopInterval()
    isPaused.value = false
    isCompleted.value = true
  }

  function tick() {
    if (remainingSeconds.value <= 1) {
      complete()
      return
    }

    remainingSeconds.value -= 1
  }

  function start(durationSeconds: number) {
    if (durationSeconds <= 0 || isRunning.value) return

    if (remainingSeconds.value <= 0) {
      remainingSeconds.value = durationSeconds
    }

    isPaused.value = false
    isCompleted.value = false
    hasPlayedAlarm.value = false
    isRunning.value = true
    timerId = window.setInterval(tick, 1000)
  }

  function pause() {
    if (!isRunning.value) return

    stopInterval()
    isPaused.value = true
  }

  function resume() {
    if (!isPaused.value || remainingSeconds.value <= 0) return

    isPaused.value = false
    isRunning.value = true
    timerId = window.setInterval(tick, 1000)
  }

  function reset(durationSeconds: number) {
    stopInterval()
    remainingSeconds.value = durationSeconds
    isPaused.value = false
    isCompleted.value = false
    hasPlayedAlarm.value = false
  }

  function setDuration(durationSeconds: number) {
    if (isRunning.value) return

    remainingSeconds.value = durationSeconds
    isPaused.value = false
    isCompleted.value = false
    hasPlayedAlarm.value = false
  }

  function claimCompletionAlarm() {
    if (!isCompleted.value || hasPlayedAlarm.value) return false

    hasPlayedAlarm.value = true
    return true
  }

  function savePreset(name: string, durationSeconds: number) {
    const trimmedName = name.trim()
    if (!trimmedName || durationSeconds <= 0) return

    savedPresets.value.push({
      id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`,
      name: trimmedName,
      durationSeconds,
    })
    persistPresets()
  }

  function deletePreset(id: string) {
    savedPresets.value = savedPresets.value.filter((preset) => preset.id !== id)
    persistPresets()
  }

  function dispose() {
    stopInterval()
  }

  return {
    remainingSeconds,
    isRunning,
    isPaused,
    isCompleted,
    hasPlayedAlarm,
    savedPresets,
    start,
    pause,
    resume,
    reset,
    setDuration,
    claimCompletionAlarm,
    savePreset,
    deletePreset,
    dispose,
  }
})
