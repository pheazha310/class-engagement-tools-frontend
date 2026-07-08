<script setup lang="ts">
import WheelCanvas from '@/components/WheelCanvas.vue'
import type { Participant } from '@/types/wheel'

const participants: Participant[] = [
  { id: 1, name: 'Alice' },
  { id: 2, name: 'Bob' },
  { id: 3, name: 'Charlie' },
  { id: 4, name: 'Diana' },
  { id: 5, name: 'Eve' },
  { id: 6, name: 'Frank' },
  { id: 7, name: 'Grace' },
  { id: 8, name: 'Henry' },
]

function handleSpinComplete(participant: Participant) {
  console.log('Selected participant:', participant)
}

function handleSpinError(error: Error) {
  console.error('Spin error:', error)
}
</script>

<template>
  <div class="page">
    <h1 class="title">Random Wheel</h1>
    <p class="subtitle">Click the button to spin and select a random participant</p>
    <WheelCanvas
      :participants="participants"
      @spin-complete="handleSpinComplete"
      @spin-error="handleSpinError"
    />
  </div>
</template>

<style scoped>
.page {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 24px;
  background: #0f0f1a;
}

.title {
  font-size: 32px;
  font-weight: 800;
  color: #fff;
  margin: 0 0 8px;
  text-align: center;
}

.subtitle {
  font-size: 16px;
  color: #888;
  margin: 0 0 32px;
  text-align: center;
}
</style>
