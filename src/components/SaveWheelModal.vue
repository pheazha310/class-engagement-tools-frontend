<script setup lang="ts">
import { ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import type { Participant, WheelTheme } from '@/types/wheel'

const props = defineProps<{
  modelValue: boolean
  name: string
  description: string
  participants: Participant[]
  theme: WheelTheme
  loading?: boolean
  error?: string | null
  isAuthenticated?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [open: boolean]
  save: [payload: { name: string; description: string }]
}>()

const localName = ref(props.name)
const localDescription = ref(props.description)

watch(() => props.modelValue, (open) => {
  if (open) {
    localName.value = props.name
    localDescription.value = props.description
  }
})

function close() {
  emit('update:modelValue', false)
}

function submit() {
  const trimmedName = localName.value.trim()
  if (!trimmedName) {
    return
  }

  emit('save', {
    name: trimmedName,
    description: localDescription.value.trim(),
  })
}

function handleBackdropClick(event: MouseEvent) {
  if (event.target === event.currentTarget) {
    close()
  }
}
</script>

<template>
  <div v-if="modelValue" class="modal-backdrop" @click="handleBackdropClick">
    <div class="modal" role="dialog" aria-modal="true" aria-labelledby="save-wheel-title">
      <div class="modal-header">
        <h2 id="save-wheel-title" class="modal-title">Save Wheel</h2>
        <button type="button" class="modal-close" @click="close" aria-label="Close">
          ×
        </button>
      </div>

      <div class="modal-body">
        <div v-if="error" class="modal-error">
          {{ error }}
        </div>

        <div v-if="!props.isAuthenticated" class="auth-prompt">
          <p class="auth-prompt-text">
            <strong>Please login first</strong> to save your wheel.
          </p>
          <RouterLink to="/login" class="auth-prompt-link">Go to login</RouterLink>
        </div>

        <template v-else>
          <div class="form-group">
            <label for="wheel-name" class="form-label">Wheel Name</label>
            <input
              id="wheel-name"
              v-model="localName"
              type="text"
              class="form-input"
              placeholder="e.g. Morning Circle"
              maxlength="255"
              required
            />
          </div>

          <div class="form-group">
            <label for="wheel-description" class="form-label">Description (optional)</label>
            <textarea
              id="wheel-description"
              v-model="localDescription"
              class="form-input form-textarea"
              placeholder="What is this wheel for?"
              maxlength="1000"
            />
          </div>

          <div class="modal-preview">
            <div class="modal-preview-label">Preview</div>
            <div class="modal-preview-meta">
              <span class="modal-preview-name">{{ localName || 'Untitled Wheel' }}</span>
              <span class="modal-preview-count">{{ participants.length }} participant{{ participants.length === 1 ? '' : 's' }}</span>
            </div>
            <div class="modal-theme-row">
              <span
                v-for="(color, index) in theme.colors"
                :key="index"
                class="modal-theme-swatch"
                :style="{ backgroundColor: color }"
              />
            </div>
          </div>
        </template>
      </div>

      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" @click="close" :disabled="loading">
          Cancel
        </button>
        <button
          v-if="props.isAuthenticated"
          type="button"
          class="btn btn-primary"
          :style="{
            background: `linear-gradient(135deg, ${theme.buttonGradient[0]}, ${theme.buttonGradient[1]})`,
            boxShadow: `0 4px 12px ${theme.buttonShadow}`,
          }"
          :disabled="loading || !localName.trim()"
          @click="submit"
        >
          {{ loading ? 'Saving...' : 'Save Wheel' }}
        </button>
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
  max-width: 480px;
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

.auth-prompt {
  background: #1f1f38;
  border: 1px solid #2a2a45;
  border-radius: 10px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.auth-prompt-text {
  color: #ddd;
  font-size: 14px;
  margin: 0;
}

.auth-prompt-text strong {
  color: #4ecdc4;
}

.auth-prompt-link {
  display: inline-flex;
  align-items: center;
  color: #22d3ee;
  text-decoration: none;
  font-weight: 700;
  font-size: 13px;
  align-self: flex-start;
}

.auth-prompt-link:hover {
  text-decoration: underline;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-label {
  font-size: 13px;
  font-weight: 700;
  color: #ddd;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.form-input {
  padding: 12px 14px;
  border-radius: 10px;
  border: 1px solid #2a2a45;
  background: #1a1a2e;
  color: #fff;
  font-size: 15px;
  outline: none;
}

.form-input:focus {
  border-color: #4ecdc4;
}

.form-textarea {
  min-height: 80px;
  resize: vertical;
}

.modal-preview {
  border-top: 1px solid #2a2a45;
  padding-top: 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.modal-preview-label {
  font-size: 12px;
  font-weight: 700;
  color: #888;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.modal-preview-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.modal-preview-name {
  font-size: 15px;
  font-weight: 700;
  color: #fff;
}

.modal-preview-count {
  font-size: 12px;
  font-weight: 700;
  color: #4ecdc4;
  background: #1f1f38;
  padding: 3px 10px;
  border-radius: 999px;
}

.modal-theme-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.modal-theme-swatch {
  width: 18px;
  height: 18px;
  border-radius: 5px;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.modal-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  padding: 14px 20px 18px;
}

.btn {
  padding: 10px 18px;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  color: #fff;
  transition: transform 0.15s, box-shadow 0.15s, opacity 0.15s;
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

.btn-secondary {
  background: #2a2a45;
  box-shadow: none;
}

.btn-secondary:hover:not(:disabled) {
  background: #3a3a5a;
}

.btn-primary {
  box-shadow: 0 4px 12px rgba(78, 205, 196, 0.35);
}
</style>
