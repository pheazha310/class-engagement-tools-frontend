<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import WheelCanvas from '@/components/WheelCanvas.vue'
import type { Participant, WheelTheme } from '@/types/wheel'
import { getThemeById, defaultThemeId } from '@/types/wheel'

const route = useRoute()
const router = useRouter()

const participants = ref<Participant[]>([])
const selectedTheme = ref<WheelTheme>(getThemeById(defaultThemeId)!)
const projectorMode = ref(false)

const storageKey = 'wheel-selected-theme-id'

function loadTheme() {
  const stored = localStorage.getItem(storageKey)
  if (stored) {
    const theme = getThemeById(stored)
    if (theme) {
      selectedTheme.value = theme
      return
    }
  }
  selectedTheme.value = getThemeById(defaultThemeId)!
}

function saveTheme(theme: WheelTheme) {
  localStorage.setItem(storageKey, theme.id)
}

watch(selectedTheme, (theme) => {
  saveTheme(theme)
})

function parseNames(raw: string): string[] {
  return raw
    .split(/[\n,;]+/)
    .map((name) => name.trim())
    .filter((name) => name.length > 0)
}

function applyUrlNames() {
  const names = route.query.names
  if (typeof names === 'string' && names.trim()) {
    const parsed = parseNames(names)
    if (parsed.length > 0) {
      participants.value = parsed.map((name, index) => ({
        id: index + 1,
        name,
      }))
    }
  }
}

onMounted(() => {
  loadTheme()
  applyUrlNames()
})

watch(
  () => route.query.names,
  () => {
    applyUrlNames()
  },
)

function handleSpinComplete(participant: Participant) {
  participants.value = participants.value.filter((p) => p.id !== participant.id)
}

function handleSpinError(error: Error) {
  console.error('Spin error:', error)
}

function handleCloseWinner() {
  // popup closed
}

function handleRemoveWinner(participant: Participant) {
  participants.value = participants.value.filter((p) => p.id !== participant.id)
}

function openProjector() {
  projectorMode.value = !projectorMode.value
}

function goBack() {
  router.back()
}
</script>

<template>
  <div class="wheel-view" :class="{ 'projector-mode': projectorMode }" :style="{ background: selectedTheme.backgroundColor }">
    <header class="wheel-header">
      <button class="icon-btn" type="button" @click="goBack" aria-label="Back">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </button>
      <button class="icon-btn" type="button" @click="openProjector" aria-label="Projector Mode">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M8 2h8l4 4v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z" />
          <path d="M7 14h10" />
          <path d="M12 10v8" />
        </svg>
      </button>
    </header>

    <main class="wheel-main">
      <WheelCanvas
        :participants="participants"
        :theme="selectedTheme"
        @spin-complete="handleSpinComplete"
        @spin-error="handleSpinError"
        @close-winner="handleCloseWinner"
        @remove-winner="handleRemoveWinner"
      />
    </main>
  </div>
</template>

<style scoped>
.wheel-view {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 100vh;
  transition: background 0.4s ease;
  background: #0f0f1e;
}

.wheel-header {
  position: fixed;
  top: 16px;
  right: 16px;
  z-index: 50;
  display: flex;
  align-items: center;
  gap: 8px;
}

.icon-btn {
  display: inline-grid;
  width: 46px;
  height: 46px;
  place-items: center;
  border-radius: 14px;
  border: 1.5px solid rgba(255, 255, 255, 0.12);
  background: rgba(15, 23, 42, 0.55);
  backdrop-filter: blur(14px);
  color: #fff;
  cursor: pointer;
  transition: background 0.2s ease, border-color 0.2s ease, transform 0.15s ease, box-shadow 0.2s ease;
}

.icon-btn:hover {
  background: rgba(15, 23, 42, 0.8);
  border-color: rgba(255, 255, 255, 0.25);
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(0,0,0,0.3);
}

.icon-btn:active {
  transform: translateY(0);
}

.icon-btn svg {
  width: 20px;
  height: 20px;
}

.wheel-main {
  flex: 1;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.wheel-view.projector-mode .wheel-header {
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.3s ease;
}
</style>
