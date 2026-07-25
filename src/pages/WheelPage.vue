<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import WheelCanvas from '@/components/WheelCanvas.vue'
import ParticipantListEditor from '@/components/ParticipantListEditor.vue'
import WheelThemePicker from '@/components/WheelThemePicker.vue'
import type { Participant, WheelTheme } from '@/types/wheel'
import { wheelThemes, getThemeById, defaultThemeId } from '@/types/wheel'

const route = useRoute()

const participants = ref<Participant[]>([
  { id: 1, name: 'Alice' },
  { id: 2, name: 'Bob' },
  { id: 3, name: 'Charlie' },
  { id: 4, name: 'Diana' },
  { id: 5, name: 'Eve' },
  { id: 6, name: 'Frank' },
  { id: 7, name: 'Grace' },
  { id: 8, name: 'Henry' },
])

const storageKey = 'wheel-selected-theme-id'
const selectedTheme = ref<WheelTheme>(getThemeById(defaultThemeId)!)

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

const futureListTitle = ref('Future List')

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

  const futureTitle = route.query.futureListTitle
  if (typeof futureTitle === 'string' && futureTitle.trim()) {
    futureListTitle.value = futureTitle.trim()
  }
}

onMounted(() => {
  loadTheme()
  applyUrlNames()
  document.addEventListener('fullscreenchange', onFullscreenChange)
})

onUnmounted(() => {
  document.removeEventListener('fullscreenchange', onFullscreenChange)
})

function onFullscreenChange() {
  if (projectorMode.value && !document.fullscreenElement) {
    projectorMode.value = false
    exitProjectorMode()
  }
}

watch(
  [() => route.query.names, () => route.query.futureListTitle],
  () => {
    applyUrlNames()
  },
)

function handleSpinComplete(participant: Participant) {
  participants.value = participants.value.filter((p) => p.id !== participant.id)
  console.log('Selected participant:', participant)
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

const projectorMode = ref(false)
const wheelContainerRef = ref<HTMLElement | null>(null)

function toggleProjectorMode() {
  projectorMode.value = !projectorMode.value
  if (projectorMode.value) {
    enterProjectorMode()
  } else {
    exitProjectorMode()
  }
}

function enterProjectorMode() {
  const el = document.documentElement
  if (el.requestFullscreen) {
    el.requestFullscreen().catch(() => {})
  }
  document.body.style.overflow = 'hidden'
  document.body.classList.add('projector-mode-active')
}

function exitProjectorMode() {
  if (document.fullscreenElement) {
    document.exitFullscreen().catch(() => {})
  }
  document.body.style.overflow = ''
  document.body.classList.remove('projector-mode-active')
}
</script>

<template>
  <div class="page" :class="{ 'projector-mode': projectorMode }" :style="{ background: selectedTheme.backgroundColor }">
    <div class="container">
      <div class="page-header">
        <RouterLink to="/tools" class="btn-back">← Back to all tools</RouterLink>
        <div class="header-actions">
          <button class="btn-projector" type="button" @click="toggleProjectorMode">
            <svg class="icon-projector" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M8 2h8l4 4v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z" />
              <path d="M7 14h10" />
              <path d="M12 10v8" />
            </svg>
            {{ projectorMode ? 'Exit Projector' : 'Projector Mode' }}
          </button>
        </div>
        <div class="header-text">
          <h1 class="title">Random Wheel</h1>
          <p class="subtitle">Manage participants and spin to select one randomly</p>
        </div>
      </div>

      <div class="layout">
        <div class="wheel-column">
          <WheelCanvas
            :participants="participants"
            :theme="selectedTheme"
            :projector-mode="projectorMode"
            @spin-complete="handleSpinComplete"
            @spin-error="handleSpinError"
            @close-winner="handleCloseWinner"
            @remove-winner="handleRemoveWinner"
          />
        </div>
        <div class="editor-column">
          <WheelThemePicker v-model="selectedTheme" :themes="wheelThemes" />
          <ParticipantListEditor
            v-model:participants="participants"
            :future-list-title="futureListTitle"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 100vh;
  padding: 24px;
  gap: 24px;
}

.container {
  width: 100%;
  max-width: 1200px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.page-header {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.header-actions {
  width: 100%;
  display: flex;
  justify-content: center;
}

.header-text {
  text-align: center;
}

.layout {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  justify-content: center;
  gap: 32px;
  width: 100%;
  max-width: 1200px;
}

.editor-column {
  flex: 1;
  max-width: 420px;
  gap: 20px;
}

.wheel-column {
  flex: 1;
  max-width: 520px;
}

.title {
  font-size: 32px;
  font-weight: 800;
  color: #fff;
  margin: 0;
  text-align: center;
}

.subtitle {
  font-size: 16px;
  color: #888;
  margin: 0;
  text-align: center;
}

.btn-projector {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: 100%;
  max-width: 720px;
  height: 56px;
  border: 1.5px solid rgba(255, 255, 255, 0.12);
  border-radius: 14px;
  background: rgba(15, 23, 42, 0.82);
  color: #fff;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.2s ease, border-color 0.2s ease;
}

.btn-projector:hover {
  background: rgba(15, 23, 42, 0.94);
  border-color: rgba(255, 255, 255, 0.22);
}

.icon-projector {
  width: 20px;
  height: 20px;
}

.btn-back {
  display: inline-flex;
  align-items: center;
  padding: 10px 20px;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 600;
  font-size: 14px;
  border: 1.5px solid rgba(255, 255, 255, 0.2);
  color: rgba(255, 255, 255, 0.9);
  transition: all 0.2s ease;
}

.btn-back:hover {
  border-color: #22d3ee;
  color: #22d3ee;
}

@media (max-width: 900px) {
  .layout {
    flex-direction: column;
    align-items: center;
  }

  .editor-column,
  .wheel-column {
    max-width: 520px;
    width: 100%;
  }
}

.page.projector-mode {
  padding: 0;
}

.page.projector-mode .container {
  max-width: 100%;
  padding: 0;
}

.page.projector-mode .layout {
  max-width: 100%;
  gap: 0;
  padding: 0;
}

.page.projector-mode .editor-column {
  display: none;
}

.page.projector-mode .wheel-column {
  max-width: 100%;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}

.page.projector-mode .page-header {
  display: none;
}

.page.projector-mode .wheel-controls {
  display: none;
}
</style>

<style>
body.projector-mode-active .navbar {
  display: none !important;
}
</style>
