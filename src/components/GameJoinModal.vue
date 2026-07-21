<script setup lang="ts">
import { ref, watch } from 'vue'
import QRCode from 'qrcode'

const props = defineProps<{
  modelValue: boolean
  joinCode: string
  gameTitle?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [open: boolean]
}>()

const qrDataUrl = ref('')
const copied = ref(false)
const generating = ref(true)

const joinUrl = `${window.location.origin}/join/${props.joinCode}`

watch(() => props.modelValue, (open) => {
  if (open) {
    copied.value = false
    generating.value = true
    qrDataUrl.value = ''
    QRCode.toDataURL(joinUrl, {
      width: 260,
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    }).then((url) => {
      qrDataUrl.value = url
    }).catch(() => {
      qrDataUrl.value = ''
    }).finally(() => {
      generating.value = false
    })
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

async function copyJoinCode() {
  try {
    await navigator.clipboard.writeText(props.joinCode)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch {
    copied.value = false
  }
}

async function copyJoinUrl() {
  try {
    await navigator.clipboard.writeText(joinUrl)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch {
    copied.value = false
  }
}
</script>

<template>
  <div v-if="modelValue" class="join-backdrop" @click="handleBackdropClick">
    <div class="join-modal" role="dialog" aria-modal="true" aria-labelledby="join-title">
      <div class="join-header">
        <div class="join-header-content">
          <div class="join-header-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
              <polyline points="10 17 15 12 10 7" />
              <line x1="15" y1="12" x2="3" y2="12" />
            </svg>
          </div>
          <div>
            <h2 id="join-title" class="join-title">Share with Students</h2>
            <p v-if="gameTitle" class="join-subtitle">{{ gameTitle }}</p>
          </div>
        </div>
        <button type="button" class="join-close" @click="close" aria-label="Close">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <div class="join-body">
        <div class="join-code-section">
          <div class="join-section-label">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <span>Join Code</span>
          </div>
          <div class="join-code-row">
            <div class="join-code-box">
              <span class="join-code-text">{{ joinCode }}</span>
            </div>
            <button
              type="button"
              class="join-copy-btn"
              :class="{ 'join-copy-btn--success': copied }"
              @click="copyJoinCode"
            >
              <svg v-if="!copied" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
              <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </button>
          </div>
        </div>

        <div class="join-qr-section">
          <div class="join-section-label">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
            </svg>
            <span>Scan QR Code</span>
          </div>
          <div class="join-qr-frame">
            <div v-if="generating" class="join-qr-loading">
              <div class="join-qr-spinner"></div>
            </div>
            <img
              v-else-if="qrDataUrl"
              :src="qrDataUrl"
              alt="QR code to join game"
              class="join-qr-image"
            />
            <div v-else class="join-qr-error">
              <span>Failed to generate QR code</span>
            </div>
          </div>
        </div>

        <div class="join-url-section">
          <div class="join-section-label">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
            </svg>
            <span>Join Link</span>
          </div>
          <div class="join-url-row">
            <span class="join-url-text">{{ joinUrl }}</span>
            <button
              type="button"
              class="join-copy-btn join-copy-btn--outline"
              :class="{ 'join-copy-btn--success': copied }"
              @click="copyJoinUrl"
            >
              <svg v-if="!copied" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
              <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div class="join-footer">
        <button type="button" class="join-btn join-btn--secondary" @click="close">
          Close
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.join-backdrop {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 96px 24px 28px;
  background: rgba(15, 23, 42, 0.75);
  backdrop-filter: blur(8px);
  overflow-y: auto;
}

.join-modal {
  width: 100%;
  max-width: 420px;
  max-height: calc(100vh - 60px);
  background: #ffffff;
  border-radius: 24px;
  box-shadow: 0 30px 80px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1);
  display: flex;
  flex-direction: column;
}

.join-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 20px 24px 18px;
}

.join-header-content {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.join-header-icon {
  width: 40px;
  height: 40px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: #fff;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.35);
}

.join-title {
  margin: 0;
  font-size: 18px;
  font-weight: 800;
  color: #0f172a;
  line-height: 1.3;
}

.join-subtitle {
  margin: 2px 0 0;
  font-size: 13px;
  font-weight: 600;
  color: #6366f1;
}

.join-close {
  width: 32px;
  height: 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  background: #f8fafc;
  color: #94a3b8;
  cursor: pointer;
  transition: all 0.15s;
  flex-shrink: 0;
}

.join-close:hover {
  background: #fef2f2;
  color: #b91c1c;
  border-color: #fecaca;
}

.join-body {
  padding: 0 24px 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.join-section-label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-weight: 700;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: 8px;
}

.join-section-label svg {
  opacity: 0.7;
}

.join-code-section {
  display: flex;
  flex-direction: column;
}

.join-code-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.join-code-box {
  flex: 1;
  padding: 16px 20px;
  border-radius: 14px;
  border: 2px dashed #cbd5e1;
  background: linear-gradient(to bottom, #f8fafc, #ffffff);
  text-align: center;
}

.join-code-text {
  font-size: 36px;
  font-weight: 900;
  color: #0f172a;
  letter-spacing: 0.3em;
  font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;
  user-select: all;
}

.join-copy-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 12px;
  border: none;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: #fff;
  cursor: pointer;
  transition: transform 0.15s, box-shadow 0.15s, background 0.2s;
  box-shadow: 0 4px 14px rgba(99, 102, 241, 0.4);
  flex-shrink: 0;
}

.join-copy-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(99, 102, 241, 0.5);
}

.join-copy-btn:active:not(:disabled) {
  transform: translateY(0);
}

.join-copy-btn--success {
  background: #15803d !important;
  box-shadow: 0 4px 14px rgba(21, 128, 61, 0.4) !important;
}

.join-copy-btn--outline {
  background: #f1f5f9;
  color: #475569;
  box-shadow: none;
  border: 1px solid #e2e8f0;
}

.join-copy-btn--outline:hover:not(:disabled) {
  background: #e2e8f0;
  box-shadow: none;
}

.join-qr-section {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.join-qr-frame {
  width: 240px;
  height: 240px;
  border-radius: 18px;
  border: 1px solid #e2e8f0;
  background: linear-gradient(135deg, #f8fafc, #ffffff);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04), 0 0 0 1px rgba(0, 0, 0, 0.02);
  position: relative;
}

.join-qr-image {
  width: 240px;
  height: 240px;
  display: block;
}

.join-qr-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.join-qr-spinner {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 3px solid #e2e8f0;
  border-top-color: #6366f1;
  animation: join-spin 0.8s linear infinite;
}

@keyframes join-spin {
  to {
    transform: rotate(360deg);
  }
}

.join-qr-error {
  font-size: 13px;
  color: #94a3b8;
  text-align: center;
}

.join-url-section {
  display: flex;
  flex-direction: column;
}

.join-url-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  background: #f8fafc;
}

.join-url-text {
  flex: 1;
  font-size: 13px;
  color: #334155;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.join-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 14px 24px 20px;
}

.join-btn {
  padding: 10px 24px;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.15s, box-shadow 0.15s, background 0.15s;
}

.join-btn:hover:not(:disabled) {
  transform: translateY(-1px);
}

.join-btn--secondary {
  background: #f1f5f9;
  color: #475569;
  box-shadow: none;
  border: 1px solid #e2e8f0;
}

.join-btn--secondary:hover:not(:disabled) {
  background: #e2e8f0;
}

@media (max-width: 480px) {
  .join-code-text {
    font-size: 28px;
    letter-spacing: 0.2em;
  }

  .join-qr-frame {
    width: 200px;
    height: 200px;
  }

  .join-qr-image {
    width: 200px;
    height: 200px;
  }
}
</style>
