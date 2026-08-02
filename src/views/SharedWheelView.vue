<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import WheelCanvas from '@/components/WheelCanvas.vue'
import Navbar from '@/components/Navbar.vue'
import type { Participant, WheelTheme } from '@/types/wheel'
import { getThemeById, defaultThemeId } from '@/types/wheel'
import { loadSharedWheel } from '@/services/wheel'

const route = useRoute()
const shareToken = route.params.shareToken as string

const participants = ref<Participant[]>([])
const selectedTheme = ref<WheelTheme>(getThemeById(defaultThemeId)!)
const wheelName = ref('')
const wheelDescription = ref('')
const loading = ref(true)
const error = ref<string | null>(null)
const selectedParticipant = ref<Participant | null>(null)

onMounted(async () => {
  loading.value = true
  error.value = null

  try {
    const data = await loadSharedWheel(shareToken)
    wheelName.value = data.name
    wheelDescription.value = data.description ?? ''
    participants.value = data.participants.map((p) => ({
      id: p.id,
      name: p.name,
    }))

    if (data.color) {
      const theme = getThemeById(data.color)
      if (theme) {
        selectedTheme.value = theme
      }
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load shared wheel'
  } finally {
    loading.value = false
  }
})

function handleSpinComplete(participant: Participant) {
  selectedParticipant.value = participant
}
</script>

<template>
  <div class="page" style="background: #f9fafb;">
    <Navbar />

    <div class="back-wrapper">
      <RouterLink to="/tools" class="btn-back">← Back to all tools</RouterLink>
    </div>

    <div v-if="error" class="alert alert-error">
      {{ error }}
    </div>

    <div v-else-if="loading" class="loading-state">
      <div class="loading-spinner" />
      <span class="loading-text">Loading shared wheel...</span>
    </div>

    <template v-else>
      <div class="header">
        <h1 class="title">{{ wheelName || 'Shared Wheel' }}</h1>
        <p v-if="wheelDescription" class="subtitle">{{ wheelDescription }}</p>
        <span class="read-only-badge">Read-only shared wheel</span>
      </div>

      <div class="layout">
        <div class="wheel-column">
          <WheelCanvas
            :participants="participants"
            :theme="selectedTheme"
            @spin-complete="handleSpinComplete"
          />
        </div>
        <div class="editor-column">
          <div class="participant-list">
            <h3 class="participant-list-title">Participants ({{ participants.length }})</h3>
            <ul class="participant-list-items">
              <li v-for="participant in participants" :key="participant.id" class="participant-item">
                {{ participant.name }}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.page {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  min-height: 100vh;
  padding: 88px 24px 24px;
  gap: 20px;
}

.back-wrapper {
  width: 100%;
  max-width: 1200px;
  display: flex;
  justify-content: flex-start;
}

.header {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.title {
  font-size: 32px;
  font-weight: 800;
  color: #1e293b;
  margin: 0;
  text-align: center;
}

.subtitle {
  font-size: 16px;
  color: #64748b;
  margin: 0;
  text-align: center;
}

.read-only-badge {
  font-size: 12px;
  font-weight: 700;
  color: #4f46e5;
  background: #eef2ff;
  border: 1px solid #c7d2fe;
  padding: 4px 12px;
  border-radius: 999px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.alert {
  width: 100%;
  max-width: 1200px;
  padding: 12px 16px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 700;
  text-align: center;
}

.alert-error {
  color: #dc2626;
  background: #fef2f2;
  border: 1px solid #fecaca;
}

.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 64px 0;
}

.loading-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid #e2e8f0;
  border-top-color: #4f46e5;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loading-text {
  color: #64748b;
  font-size: 14px;
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

.participant-list {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.participant-list-title {
  margin: 0;
  font-size: 14px;
  font-weight: 700;
  color: #475569;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.participant-list-items {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.participant-item {
  padding: 10px 12px;
  border-radius: 8px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  color: #1e293b;
  font-size: 14px;
}

.btn-back {
  display: inline-flex;
  align-items: center;
  padding: 10px 20px;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 600;
  font-size: 14px;
  border: 1.5px solid #e2e8f0;
  color: #475569;
  background: #ffffff;
  transition: all 0.2s ease;
}

.btn-back:hover {
  border-color: #4f46e5;
  color: #4f46e5;
  background: #eef2ff;
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
