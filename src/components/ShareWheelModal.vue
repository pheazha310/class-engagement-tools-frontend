<script setup lang="ts">
import { ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import type { WheelTheme } from '@/types/wheel'
import { generateShareToken, type ShareTokenResponse } from '@/services/wheel'

const props = defineProps<{
  modelValue: boolean
  wheelId: string | null
  wheelName: string
  theme: WheelTheme
  loading?: boolean
  error?: string | null
}>()

const emit = defineEmits<{
  'update:modelValue': [open: boolean]
  'shared': [payload: ShareTokenResponse]
}>()

const generating = ref(false)
const shareData = ref<ShareTokenResponse | null>(null)
const localError = ref<string | null>(null)
const copied = ref(false)
const shareLink = ref('')

watch(() => props.modelValue, (open) => {
  if (open) {
    shareData.value = null
    copied.value = false
    localError.value = null
    shareLink.value = ''
  }
})

watch(shareData, (data) => {
  if (data) {
    shareLink.value = `${window.location.origin}/wheel/shared/${data.share_token}`
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

async function generateLink() {
  if (!props.wheelId) {
    localError.value = 'Please save the wheel before sharing.'
    return
  }

  generating.value = true
  localError.value = null
  shareData.value = null
  copied.value = false

  try {
    const data = await generateShareToken(props.wheelId)
    shareData.value = data
    emit('shared', data)
  } catch (err) {
    localError.value = err instanceof Error ? err.message : 'Failed to generate share link'
  } finally {
    generating.value = false
  }
}

async function copyLink() {
  if (!shareData.value) return

  const link = `${window.location.origin}/wheel/shared/${shareData.value.share_token}`

  try {
    await navigator.clipboard.writeText(link)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch {
    localError.value = 'Failed to copy link. Please copy it manually.'
  }
}
</script>

<template>
  <div v-if="modelValue" class="modal-backdrop" @click="handleBackdropClick">
    <div class="modal" role="dialog" aria-modal="true" aria-labelledby="share-wheel-title">
      <div class="modal-header">
        <h2 id="share-wheel-title" class="modal-title">Share Wheel</h2>
        <button type="button" class="modal-close" @click="close" aria-label="Close">
          ×
        </button>
      </div>

      <div class="modal-body">
        <div v-if="error || localError" class="modal-error">
          {{ error || localError }}
        </div>

        <div v-if="!wheelId && !shareData" class="share-auth-warning">
          <strong>Please login first</strong> to save this wheel and generate a share link.
          <RouterLink to="/login" class="share-auth-link">Go to login</RouterLink>
        </div>

        <div v-if="!shareData" class="share-preview">
          <div class="share-preview-label">Wheel to share</div>
          <div class="share-preview-meta">
            <span class="share-preview-name">{{ wheelName || 'Untitled Wheel' }}</span>
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

        <div v-if="shareData" class="share-result">
          <div class="share-result-label">Your share link is ready</div>
          <div class="share-link-row">
            <input
              :value="shareLink"
              class="share-link-input"
              readonly
            />
            <button
              type="button"
              class="btn btn-copy"
              :class="{ 'btn-copied': copied }"
              @click="copyLink"
            >
              {{ copied ? 'Copied!' : 'Copy' }}
            </button>
          </div>
          <p class="share-hint">
            Anyone with this link can view and spin the wheel, but cannot edit it.
          </p>
        </div>
      </div>

      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" @click="close">
          Close
        </button>
        <button
          v-if="!shareData"
          type="button"
          class="btn btn-primary"
          :style="{
            background: `linear-gradient(135deg, ${theme.buttonGradient[0]}, ${theme.buttonGradient[1]})`,
            boxShadow: `0 4px 12px ${theme.buttonShadow}`,
          }"
          :disabled="generating || !wheelId"
          :title="!wheelId ? 'Save the wheel first before sharing' : ''"
          @click="generateLink"
        >
          {{ generating ? 'Generating...' : !wheelId ? 'Login to save & share' : 'Generate Share Link' }}
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

.share-auth-warning {
  background: #1f1f38;
  border: 1px solid #2a2a45;
  border-radius: 10px;
  padding: 10px 12px;
  color: #ddd;
  font-size: 14px;
  line-height: 1.4;
}

.share-auth-warning strong {
  color: #4ecdc4;
}

.share-auth-link {
  display: inline-block;
  margin-top: 8px;
  color: #22d3ee;
  text-decoration: none;
  font-weight: 700;
  font-size: 13px;
}

.share-auth-link:hover {
  text-decoration: underline;
}

.share-preview {
  border-top: 1px solid #2a2a45;
  padding-top: 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.share-preview-label {
  font-size: 12px;
  font-weight: 700;
  color: #888;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.share-preview-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.share-preview-name {
  font-size: 15px;
  font-weight: 700;
  color: #fff;
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

.share-result {
  border-top: 1px solid #2a2a45;
  padding-top: 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.share-result-label {
  font-size: 13px;
  font-weight: 700;
  color: #4ecdc4;
}

.share-link-row {
  display: flex;
  gap: 8px;
  align-items: center;
}

.share-link-input {
  flex: 1;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid #2a2a45;
  background: #1a1a2e;
  color: #ddd;
  font-size: 13px;
  outline: none;
  min-width: 0;
}

.share-hint {
  font-size: 13px;
  color: #888;
  line-height: 1.4;
  margin: 0;
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

.btn-copy {
  background: #2a2a45;
  box-shadow: none;
  white-space: nowrap;
}

.btn-copy:hover:not(:disabled) {
  background: #3a3a5a;
}

.btn-copied {
  background: #40916c;
}
</style>
