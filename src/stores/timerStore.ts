import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useTimerStore = defineStore('timer', () => {
  const remainingSeconds = ref(5 * 60)
  const isRunning = ref(false)
  const isPaused = ref(false)
  const isCompleted = ref(false)
  const hasPlayedAlarm = ref(false)
  let timerId: number | null = null

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

  function dispose() {
    stopInterval()
  }

  return {
    remainingSeconds,
    isRunning,
    isPaused,
    isCompleted,
    hasPlayedAlarm,
    start,
    pause,
    resume,
    reset,
    setDuration,
    claimCompletionAlarm,
    dispose,
  }
})
