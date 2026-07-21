<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import WheelCanvas from '@/components/WheelCanvas.vue'
import ParticipantListEditor from '@/components/ParticipantListEditor.vue'
import WheelThemePicker from '@/components/WheelThemePicker.vue'
import SaveWheelModal from '@/components/SaveWheelModal.vue'
import MyWheels from '@/components/MyWheels.vue'
import ShareWheelModal from '@/components/ShareWheelModal.vue'
import Navbar from '@/components/Navbar.vue'
import type { Participant, WheelTheme, SavedWheel } from '@/types/wheel'
import { wheelThemes, getThemeById, defaultThemeId } from '@/types/wheel'
import { createSavedWheel, loadSavedWheel, AuthorizationError } from '@/services/wheel'
import { useAuthStore } from '@/stores/auth'
import { ensureCsrfCookie } from '@/services/api'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

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

const showSaveModal = ref(false)
const showMyWheelsModal = ref(false)
const showShareModal = ref(false)
const saving = ref(false)
const saveError = ref<string | null>(null)
const saveSuccess = ref<string | null>(null)
const wheelName = ref('')
const wheelDescription = ref('')
const savedWheelId = ref<string | null>(null)

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

onMounted(async () => {
  loadTheme()
  applyUrlNames()
})

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

function openSaveModal() {
  wheelName.value = ''
  wheelDescription.value = ''
  saveError.value = null
  saveSuccess.value = null
  showSaveModal.value = true
}

function closeSaveModal() {
  showSaveModal.value = false
}

async function handleSaveWheel(payload: { name: string; description: string }) {
  saving.value = true
  saveError.value = null
  saveSuccess.value = null

  try {
    await ensureCsrfCookie()
    await auth.fetchUser()
    if (!auth.user) {
      throw new Error('Your session has expired. Please log in again.')
    }

    const wheel = await createSavedWheel({
      name: payload.name,
      description: payload.description,
      color: selectedTheme.value.id,
      participants: participants.value,
    })
    savedWheelId.value = wheel.id
    saveSuccess.value = 'Wheel saved successfully!'
    closeSaveModal()
  } catch (err) {
    if (err instanceof AuthenticationError) {
      saveError.value = 'Your session has expired. Please log in again to save your wheel.'
      // Redirect to login page after a brief delay so user sees the message
      auth.clearUser()
      setTimeout(() => {
        router.push('/login?redirect=' + encodeURIComponent(route.fullPath))
      }, 2000)
    } else if (err instanceof AuthorizationError) {
      saveError.value = err.message || 'You do not have permission to perform this action.'
    } else {
      saveError.value = err instanceof Error ? err.message : 'Failed to save wheel'
    }
  } finally {
    saving.value = false
  }
}

function openShareModal() {
  showShareModal.value = true
}

function handleShared() {
  saveSuccess.value = 'Share link generated!'
}

async function handleOpenWheel(wheel: SavedWheel) {
  try {
    const loaded = await loadSavedWheel(wheel.id)
    participants.value = loaded.participants.map((p) => ({
      id: p.id,
      name: p.name,
    }))
    savedWheelId.value = wheel.id

    if (loaded.color) {
      const theme = getThemeById(loaded.color)
      if (theme) {
        selectedTheme.value = theme
      }
    }
  } catch (err) {
    saveError.value = err instanceof Error ? err.message : 'Failed to load wheel'
  }
}

function handleDeleteWheel() {
  // handled inside MyWheels modal
}
</script>

  <template>
    <div class="page" :style="{ background: selectedTheme.backgroundColor }">
      <div class="back-wrapper">
        <RouterLink to="/tools" class="btn-back">← Back to all tools</RouterLink>
      </div>
      <h1 class="title">Random Wheel</h1>
      <p class="subtitle">Manage participants and spin to select one randomly</p>

      <div class="toolbar">
        <button
          type="button"
          class="btn btn-primary"
          :disabled="!auth.isAuthenticated"
          @click="openSaveModal"
        >
          Save Wheel
        </button>
        <button
          type="button"
          class="btn btn-secondary"
          :disabled="!auth.isAuthenticated"
          @click="showMyWheelsModal = true"
        >
          My Wheels
        </button>
        <button
          type="button"
          class="btn btn-share"
          :disabled="!auth.isAuthenticated"
          @click="openShareModal"
        >
          Share Wheel
        </button>

      </div>

      <div v-if="saveError" class="alert alert-error">
        {{ saveError }}
      </div>
      <div v-if="saveSuccess" class="alert alert-success">
        {{ saveSuccess }}
      </div>

      <div class="layout">
        <div class="wheel-column">
          <WheelCanvas
            :participants="participants"
            :theme="selectedTheme"
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

      <SaveWheelModal
        v-model="showSaveModal"
        :name="wheelName"
        :description="wheelDescription"
        :participants="participants"
        :theme="selectedTheme"
        :loading="saving"
        :error="saveError"
        :is-authenticated="auth.isAuthenticated"
        @save="handleSaveWheel"
      />

      <ShareWheelModal
        v-model="showShareModal"
        :wheel-id="savedWheelId"
        :wheel-name="wheelName"
        :theme="selectedTheme"
        @shared="handleShared"
      />

      <MyWheels
        v-model="showMyWheelsModal"
        :is-authenticated="auth.isAuthenticated"
        @open-wheel="handleOpenWheel"
        @delete-wheel="handleDeleteWheel"
      />
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

.toolbar {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  flex-wrap: wrap;
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
  color: #ff6b6b;
  background: #2a1010;
  border: 1px solid #5a1f1f;
}

.alert-success {
  color: #4ecdc4;
  background: #1f1f38;
  border: 1px solid #2a2a45;
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

.btn {
  padding: 10px 18px;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  color: #fff;
  transition: transform 0.15s, box-shadow 0.15s, opacity 0.15s, background 0.15s;
}

.btn:hover:not(:disabled) {
  transform: translateY(-1px);
}

.btn:active:not(:disabled) {
  transform: translateY(0);
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background: #22d3ee;
  color: #0f172a;
  box-shadow: 0 4px 12px rgba(34, 211, 238, 0.35);
}

.btn-primary:hover:not(:disabled) {
  background: #06b6d4;
  box-shadow: 0 4px 16px rgba(34, 211, 238, 0.45);
}

.btn-secondary {
  background: #1e293b;
  box-shadow: none;
}

.btn-secondary:hover:not(:disabled) {
  background: #334155;
}

.btn-share {
  background: #4ecdc4;
  color: #0f172a;
  box-shadow: 0 4px 12px rgba(78, 205, 196, 0.35);
}

.btn-share:hover:not(:disabled) {
  background: #3dbdb4;
  box-shadow: 0 4px 16px rgba(78, 205, 196, 0.45);
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
</style>
