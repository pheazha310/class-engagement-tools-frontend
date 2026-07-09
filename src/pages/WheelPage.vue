<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import WheelCanvas from '@/components/WheelCanvas.vue'
import ParticipantListEditor from '@/components/ParticipantListEditor.vue'
import WheelThemePicker from '@/components/WheelThemePicker.vue'
import type { Participant, WheelTheme } from '@/types/wheel'
import { wheelThemes, getThemeById, defaultThemeId } from '@/types/wheel'

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

onMounted(() => {
  loadTheme()
})

function handleSpinComplete(participant: Participant) {
  console.log('Selected participant:', participant)
}

function handleSpinError(error: Error) {
  console.error('Spin error:', error)
}
</script>

  <template>
    <div class="page" :style="{ background: selectedTheme.backgroundColor }">
      <h1 class="title">Random Wheel</h1>
      <p class="subtitle">Manage participants and spin to select one randomly</p>
      <div class="layout">
        <div class="wheel-column">
          <WheelCanvas
            :participants="participants"
            :theme="selectedTheme"
            @spin-complete="handleSpinComplete"
            @spin-error="handleSpinError"
          />
        </div>
        <div class="editor-column">
          <WheelThemePicker v-model="selectedTheme" :themes="wheelThemes" />
          <ParticipantListEditor v-model:participants="participants" />
        </div>
      </div>
    </div>
  </template>

<style scoped>
.page {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  min-height: 100vh;
  padding: 24px;
  gap: 24px;
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
</style>
