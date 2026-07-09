<script setup lang="ts">
import { ref, watch, onBeforeUnmount } from 'vue'
import type { SavedWheel, WheelTheme } from '@/types/wheel'
import { getThemeById, defaultThemeId } from '@/types/wheel'
import { listSavedWheels, deleteSavedWheel } from '@/services/wheel'

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [open: boolean]
  'open-wheel': [wheel: SavedWheel]
  'delete-wheel': [id: string]
}>()

const wheels = ref<SavedWheel[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const deletingId = ref<string | null>(null)
const deleteConfirmId = ref<string | null>(null)

async function loadWheels() {
  loading.value = true
  error.value = null
  wheels.value = []

  try {
    wheels.value = await listSavedWheels()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load saved wheels'
  } finally {
    loading.value = false
  }
}

watch(() => props.modelValue, (open) => {
  if (open) {
    loadWheels()
  } else {
    deleteConfirmId.value = null
    deletingId.value = null
  }
})

function close() {
  emit('update:modelValue', false)
}

function handleBackdropClick(event: MouseEvent) {
  if (event.target === event.currentTarget) {
    close()
  }
}

async function handleOpen(wheel: SavedWheel) {
  emit('open-wheel', wheel)
  close()
}

function handleDeleteClick(id: string) {
  if (deleteConfirmId.value === id) {
    return
  }
  deleteConfirmId.value = id
}

async function handleDeleteConfirm(id: string) {
  if (deletingId.value) return
  deletingId.value = id

  try {
    await deleteSavedWheel(id)
    wheels.value = wheels.value.filter((w) => w.id !== id)
    emit('delete-wheel', id)
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to delete wheel'
  } finally {
    deletingId.value = null
    deleteConfirmId.value = null
  }
}

function cancelDelete() {
  deleteConfirmId.value = null
}

function resolveTheme(wheel: SavedWheel): WheelTheme {
  if (wheel.color) {
    const theme = getThemeById(wheel.color)
    if (theme) return theme
  }
  return getThemeById(defaultThemeId)!
}

function formatDate(dateString?: string): string {
  if (!dateString) return ''
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

onBeforeUnmount(() => {
  loading.value = false
})
</script>

<template>
  <div v-if="modelValue" class="modal-backdrop" @click="handleBackdropClick">
    <div class="modal" role="dialog" aria-modal="true" aria-labelledby="my-wheels-title">
      <div class="modal-header">
        <h2 id="my-wheels-title" class="modal-title">My Wheels</h2>
        <button type="button" class="modal-close" @click="close" aria-label="Close">
          ×
        </button>
      </div>

      <div class="modal-body">
        <div v-if="error" class="modal-error">
          {{ error }}
        </div>

        <div v-if="loading" class="loading-state">
          <div class="loading-spinner" />
          <span class="loading-text">Loading wheels...</span>
        </div>

        <div v-else-if="wheels.length === 0" class="empty-state">
          <p class="empty-text">No saved wheels yet.</p>
          <p class="empty-hint">Save your current wheel configuration to see it here.</p>
        </div>

        <div v-else class="wheel-list">
          <div v-for="wheel in wheels" :key="wheel.id" class="wheel-card">
            <div class="wheel-card-header">
              <div class="wheel-card-title-group">
                <h3 class="wheel-card-name">{{ wheel.name }}</h3>
                <span v-if="wheel.description" class="wheel-card-description">
                  {{ wheel.description }}
                </span>
              </div>
              <span class="wheel-card-count">
                {{ wheel.participants?.length ?? 0 }} participant{{ (wheel.participants?.length ?? 0) === 1 ? '' : 's' }}
              </span>
            </div>

            <div class="wheel-card-meta">
              <span class="wheel-card-date">{{ formatDate(wheel.created_at) }}</span>
              <div class="wheel-theme-row">
                <span
                  v-for="(color, index) in resolveTheme(wheel).colors"
                  :key="index"
                  class="wheel-theme-swatch"
                  :style="{ backgroundColor: color }"
                />
              </div>
            </div>

            <div class="wheel-card-actions">
              <button
                type="button"
                class="btn btn-primary"
                :style="{
                  background: `linear-gradient(135deg, ${resolveTheme(wheel).buttonGradient[0]}, ${resolveTheme(wheel).buttonGradient[1]})`,
                  boxShadow: `0 4px 12px ${resolveTheme(wheel).buttonShadow}`,
                }"
                @click="handleOpen(wheel)"
              >
                Open
              </button>
              <button
                v-if="deleteConfirmId === wheel.id"
                type="button"
                class="btn btn-danger"
                :disabled="deletingId === wheel.id"
                @click="handleDeleteConfirm(wheel.id)"
              >
                {{ deletingId === wheel.id ? 'Deleting...' : 'Confirm' }}
              </button>
              <button
                v-else
                type="button"
                class="btn btn-secondary"
                :disabled="deletingId === wheel.id"
                @click="handleDeleteClick(wheel.id)"
              >
                Delete
              </button>
              <button
                v-if="deleteConfirmId === wheel.id"
                type="button"
                class="btn btn-ghost"
                @click="cancelDelete"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(2px);
}

.modal {
  width: 100%;
  max-width: 520px;
  max-height: calc(100vh - 48px);
  overflow-y: auto;
  background: #141428;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 20px;
  border-bottom: 1px solid #252540;
}

.modal-title {
  margin: 0;
  font-size: 18px;
  font-weight: 800;
  color: #fff;
}

.modal-close {
  width: 32px;
  height: 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  border: 1px solid #3a1f1f;
  background: #2a1010;
  color: #ff6b6b;
  font-size: 20px;
  line-height: 1;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}

.modal-close:hover {
  background: #3a1515;
  color: #ff4c4c;
}

.modal-body {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.modal-error {
  color: #e74c3c;
  font-size: 14px;
  line-height: 1.4;
  background: #2a1010;
  border: 1px solid #5a1f1f;
  border-radius: 10px;
  padding: 10px 12px;
}

.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 32px 0;
}

.loading-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid #2a2a45;
  border-top-color: #4ecdc4;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loading-text {
  color: #888;
  font-size: 14px;
}

.empty-state {
  text-align: center;
  padding: 24px 0;
}

.empty-text {
  color: #fff;
  font-size: 16px;
  font-weight: 700;
  margin: 0 0 6px;
}

.empty-hint {
  color: #888;
  font-size: 14px;
  margin: 0;
}

.wheel-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.wheel-card {
  border: 1px solid #252540;
  border-radius: 12px;
  background: #1a1a2e;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.wheel-card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.wheel-card-title-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
  min-width: 0;
}

.wheel-card-name {
  margin: 0;
  font-size: 15px;
  font-weight: 700;
  color: #fff;
  word-break: break-word;
}

.wheel-card-description {
  font-size: 13px;
  color: #888;
  line-height: 1.4;
  word-break: break-word;
}

.wheel-card-count {
  flex-shrink: 0;
  font-size: 12px;
  font-weight: 700;
  color: #4ecdc4;
  background: #1f1f38;
  padding: 3px 10px;
  border-radius: 999px;
}

.wheel-card-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.wheel-card-date {
  font-size: 12px;
  color: #888;
}

.wheel-theme-row {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.wheel-theme-swatch {
  width: 14px;
  height: 14px;
  border-radius: 4px;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.wheel-card-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.btn {
  padding: 10px 16px;
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
  box-shadow: 0 4px 12px rgba(78, 205, 196, 0.35);
}

.btn-secondary {
  background: #2a2a45;
  box-shadow: none;
}

.btn-secondary:hover:not(:disabled) {
  background: #3a3a5a;
}

.btn-danger {
  background: #c0392b;
  box-shadow: 0 4px 12px rgba(231, 76, 60, 0.35);
}

.btn-danger:hover:not(:disabled) {
  background: #e74c3c;
}

.btn-ghost {
  background: transparent;
  box-shadow: none;
  color: #ddd;
}

.btn-ghost:hover:not(:disabled) {
  background: #2a2a45;
}
</style>
