<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useLivePollStore } from '@/stores/livePollStore'
import QRCodeModal from '@/components/QRCodeModal.vue'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import ToastNotification from '@/components/ToastNotification.vue'

const route = useRoute()
const router = useRouter()
const store = useLivePollStore()
const hostname = window.location.hostname
const origin = window.location.origin

const pollId = route.params.id as string
const showQr = ref(false)
const toastMessage = ref<string | null>(null)
const toastType = ref<'success' | 'error'>('success')
const loading = ref(true)
const error = ref<string | null>(null)

const poll = computed(() => store.currentPoll)
const joinUrl = computed(() => poll.value?.join_url || `${origin}/vote/${poll.value?.public_token}`)
const roomCode = computed(() => poll.value?.room_code || '')

onMounted(async () => {
  if (!pollId) {
    error.value = 'No poll ID provided.'
    loading.value = false
    return
  }
  try {
    await store.fetchPoll(pollId)
    if (!store.currentPoll) {
      error.value = 'Poll not found.'
    }
  } catch {
    error.value = 'Failed to load poll details.'
  } finally {
    loading.value = false
  }
})

async function copyLink() {
  if (!joinUrl.value) return
  try {
    await navigator.clipboard.writeText(joinUrl.value)
    toastMessage.value = 'Link copied to clipboard!'
    toastType.value = 'success'
  } catch {
    toastMessage.value = 'Failed to copy link.'
    toastType.value = 'error'
  }
}

async function copyRoomCode() {
  if (!roomCode.value) return
  try {
    await navigator.clipboard.writeText(roomCode.value)
    toastMessage.value = 'Room code copied!'
    toastType.value = 'success'
  } catch {
    toastMessage.value = 'Failed to copy room code.'
    toastType.value = 'error'
  }
}

function viewResults() {
  router.push({ name: 'live-poll-results', params: { id: pollId } })
}

function goToPolls() {
  router.push({ name: 'live-poll-list' })
}
</script>

<template>
  <div class="pcs-page">
    <!-- Background Decor -->
    <div class="pcs-bg-orb pcs-bg-orb--1" aria-hidden="true" />
    <div class="pcs-bg-orb pcs-bg-orb--2" aria-hidden="true" />

    <div class="pcs-container">
      <!-- Loading -->
      <div v-if="loading" class="pcs-loading">
        <LoadingSpinner size="lg" />
        <p class="pcs-loading-text">Loading poll details...</p>
      </div>

      <!-- Error -->
      <div v-else-if="error" class="pcs-error-card">
        <div class="pcs-error-icon">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h2 class="pcs-error-title">Something went wrong</h2>
        <p class="pcs-error-msg">{{ error }}</p>
        <button class="pcs-btn pcs-btn--primary" @click="goToPolls">Back to Polls</button>
      </div>

      <!-- Success Content -->
      <div v-else-if="poll" class="pcs-content">
        <!-- Success Banner -->
        <div class="pcs-banner">
          <div class="pcs-banner-icon">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div class="pcs-banner-text">
            <h1 class="pcs-banner-title">Poll Created Successfully!</h1>
            <p class="pcs-banner-subtitle">Your poll is now live. Share the code or link with your students.</p>
          </div>
        </div>

        <!-- Join Code Card -->
        <div class="pcs-join-card">
          <div class="pcs-join-header">
            <svg class="pcs-join-header-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
            <span>Share with your class</span>
          </div>

          <!-- Room Code -->
          <div class="pcs-room-code-section">
            <label class="pcs-room-label">Join Code</label>
            <div class="pcs-room-code-display">
              <span class="pcs-room-code">{{ roomCode }}</span>
              <button class="pcs-room-copy-btn" @click="copyRoomCode" title="Copy code">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
            </div>
            <p class="pcs-room-hint">Students enter this code at <strong>{{ hostname }}</strong> to vote</p>
          </div>

          <!-- QR Code -->
          <div class="pcs-qr-section">
            <div class="pcs-qr-card" @click="showQr = true">
              <div class="pcs-qr-placeholder">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                </svg>
              </div>
              <span class="pcs-qr-label">Show QR Code</span>
            </div>
          </div>

          <!-- Share Link -->
          <div class="pcs-link-section">
            <label class="pcs-link-label">Share Link</label>
            <div class="pcs-link-row">
              <input
                :value="joinUrl"
                type="text"
                class="pcs-link-input"
                readonly
                @focus="$event.target.select()"
              />
              <button class="pcs-link-copy-btn" @click="copyLink">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                Copy
              </button>
            </div>
          </div>
        </div>

        <!-- Poll Info -->
        <div class="pcs-info-card">
          <div class="pcs-info-header">
            <svg class="pcs-info-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Poll Details</span>
          </div>
          <div class="pcs-info-grid">
            <div class="pcs-info-item">
              <span class="pcs-info-label">Question</span>
              <span class="pcs-info-value">{{ poll.question }}</span>
            </div>
            <div class="pcs-info-item">
              <span class="pcs-info-label">Type</span>
              <span class="pcs-info-value">{{ poll.poll_type === 'multiple_choice' ? 'Multiple Choice' : poll.poll_type === 'yes_no' ? 'Yes / No' : 'Rating Scale' }}</span>
            </div>
            <div class="pcs-info-item">
              <span class="pcs-info-label">Status</span>
              <span class="pcs-info-value pcs-status" :class="`pcs-status--${poll.status}`">{{ poll.status }}</span>
            </div>
            <div class="pcs-info-item">
              <span class="pcs-info-label">Anonymous</span>
              <span class="pcs-info-value">{{ poll.anonymous ? 'Yes' : 'No' }}</span>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="pcs-actions">
          <button class="pcs-btn pcs-btn--primary" @click="viewResults">
            <svg class="pcs-btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            View Live Results
          </button>
          <button class="pcs-btn pcs-btn--outline" @click="goToPolls">
            <svg class="pcs-btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            All Polls
          </button>
        </div>
      </div>
    </div>

    <!-- QR Code Modal -->
    <QRCodeModal
      :show="showQr"
      :join-url="joinUrl"
      :room-code="roomCode"
      @close="showQr = false"
    />

    <ToastNotification
      :message="toastMessage"
      :type="toastType"
      @close="toastMessage = null"
    />
  </div>
</template>

<style scoped>
.pcs-page {
  position: relative;
  min-height: 100vh;
  background: linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 50%, #EEF2FF 100%);
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  padding: 88px 24px 60px;
  overflow-x: hidden;
}

.pcs-bg-orb {
  position: fixed;
  border-radius: 9999px;
  pointer-events: none;
  filter: blur(100px);
  opacity: 0.25;
  z-index: 0;
}
.pcs-bg-orb--1 {
  top: -100px;
  right: -100px;
  width: 400px;
  height: 400px;
  background: rgba(99, 102, 241, 0.1);
}
.pcs-bg-orb--2 {
  bottom: -100px;
  left: -100px;
  width: 350px;
  height: 350px;
  background: rgba(16, 185, 129, 0.08);
}

.pcs-container {
  position: relative;
  max-width: 600px;
  margin: 0 auto;
  z-index: 1;
}

/* Loading */
.pcs-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 80px 20px;
}
.pcs-loading-text {
  color: #64748B;
  font-size: 14px;
}

/* Error */
.pcs-error-card {
  background: white;
  border: 1px solid #E2E8F0;
  border-radius: 16px;
  padding: 48px 32px;
  text-align: center;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.04);
}
.pcs-error-icon {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: #FEF2F2;
  color: #EF4444;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
}
.pcs-error-icon svg {
  width: 28px;
  height: 28px;
}
.pcs-error-title {
  font-size: 20px;
  font-weight: 700;
  color: #0F172A;
  margin: 0 0 8px;
}
.pcs-error-msg {
  font-size: 14px;
  color: #64748B;
  margin: 0 0 24px;
}

/* Content */
.pcs-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* Banner */
.pcs-banner {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 24px;
  background: linear-gradient(135deg, #F0FDF4, #ECFDF5);
  border: 1px solid #BBF7D0;
  border-radius: 16px;
  animation: pcs-slide-down 0.5s ease-out;
}
.pcs-banner-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: #DCFCE7;
  color: #16A34A;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.pcs-banner-icon svg {
  width: 24px;
  height: 24px;
}
.pcs-banner-text {
  flex: 1;
}
.pcs-banner-title {
  font-size: 20px;
  font-weight: 800;
  color: #166534;
  margin: 0;
  letter-spacing: -0.02em;
}
.pcs-banner-subtitle {
  font-size: 14px;
  color: #15803D;
  margin: 4px 0 0;
  line-height: 1.5;
}

/* Join Code Card */
.pcs-join-card {
  background: white;
  border: 1px solid #E2E8F0;
  border-radius: 16px;
  padding: 28px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.04);
  animation: pcs-slide-up 0.5s ease-out;
}
.pcs-join-header {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 15px;
  font-weight: 700;
  color: #0F172A;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #F1F5F9;
}
.pcs-join-header-icon {
  width: 20px;
  height: 20px;
  color: #4F46E5;
}

/* Room Code */
.pcs-room-code-section {
  margin-bottom: 24px;
}
.pcs-room-label {
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: #64748B;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 8px;
}
.pcs-room-code-display {
  display: flex;
  align-items: center;
  gap: 12px;
}
.pcs-room-code {
  font-family: 'SF Mono', 'Fira Code', 'Fira Mono', monospace;
  font-size: 40px;
  font-weight: 800;
  letter-spacing: 0.15em;
  color: #4F46E5;
  background: linear-gradient(135deg, #EEF2FF, #E0E7FF);
  padding: 12px 24px;
  border-radius: 12px;
  flex: 1;
  text-align: center;
  user-select: all;
  cursor: pointer;
  transition: all 0.2s ease;
}
.pcs-room-code:hover {
  background: linear-gradient(135deg, #E0E7FF, #C7D2FE);
  transform: translateY(-1px);
}
.pcs-room-copy-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 12px;
  border: 1.5px solid #E2E8F0;
  background: white;
  color: #64748B;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
}
.pcs-room-copy-btn:hover {
  border-color: #4F46E5;
  color: #4F46E5;
  background: #EEF2FF;
}
.pcs-room-copy-btn svg {
  width: 20px;
  height: 20px;
}
.pcs-room-hint {
  font-size: 13px;
  color: #94A3B8;
  margin: 10px 0 0;
}

/* QR Code */
.pcs-qr-section {
  margin-bottom: 24px;
}
.pcs-qr-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 20px;
  border: 2px dashed #CBD5E1;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}
.pcs-qr-card:hover {
  border-color: #4F46E5;
  background: #F5F3FF;
}
.pcs-qr-placeholder {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: #F1F5F9;
  color: #64748B;
  display: flex;
  align-items: center;
  justify-content: center;
}
.pcs-qr-placeholder svg {
  width: 22px;
  height: 22px;
}
.pcs-qr-label {
  font-size: 14px;
  font-weight: 600;
  color: #0F172A;
}

/* Share Link */
.pcs-link-section {
  margin-bottom: 0;
}
.pcs-link-label {
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: #64748B;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 8px;
}
.pcs-link-row {
  display: flex;
  gap: 8px;
}
.pcs-link-input {
  flex: 1;
  padding: 10px 14px;
  border: 1.5px solid #E2E8F0;
  border-radius: 10px;
  background: #FAFBFC;
  font-size: 13px;
  font-family: 'SF Mono', 'Fira Code', monospace;
  color: #475569;
  outline: none;
  cursor: text;
}
.pcs-link-input:focus {
  border-color: #4F46E5;
  box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.06);
}
.pcs-link-copy-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 18px;
  border: 1.5px solid #E2E8F0;
  border-radius: 10px;
  background: white;
  color: #475569;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: inherit;
  white-space: nowrap;
}
.pcs-link-copy-btn:hover {
  border-color: #4F46E5;
  color: #4F46E5;
  background: #EEF2FF;
}
.pcs-link-copy-btn svg {
  width: 16px;
  height: 16px;
}

/* Info Card */
.pcs-info-card {
  background: white;
  border: 1px solid #E2E8F0;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.04);
  animation: pcs-slide-up 0.6s ease-out;
}
.pcs-info-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 700;
  color: #0F172A;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #F1F5F9;
}
.pcs-info-icon {
  width: 18px;
  height: 18px;
  color: #4F46E5;
}
.pcs-info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}
.pcs-info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.pcs-info-label {
  font-size: 11px;
  font-weight: 600;
  color: #94A3B8;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.pcs-info-value {
  font-size: 14px;
  font-weight: 600;
  color: #0F172A;
}
.pcs-status {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 10px;
  border-radius: 9999px;
  font-size: 12px;
  text-transform: capitalize;
}
.pcs-status--draft {
  background: #FEF3C7;
  color: #D97706;
}
.pcs-status--active {
  background: #DCFCE7;
  color: #16A34A;
}
.pcs-status--closed {
  background: #F1F5F9;
  color: #64748B;
}

/* Actions */
.pcs-actions {
  display: flex;
  gap: 12px;
  animation: pcs-slide-up 0.7s ease-out;
}

.pcs-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 24px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: inherit;
  text-decoration: none;
  flex: 1;
}
.pcs-btn-icon {
  width: 18px;
  height: 18px;
}
.pcs-btn--primary {
  background: linear-gradient(135deg, #4F46E5, #6366F1);
  color: white;
  border: none;
  box-shadow: 0 4px 12px rgba(79, 70, 229, 0.25);
}
.pcs-btn--primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(79, 70, 229, 0.3);
}
.pcs-btn--outline {
  background: white;
  color: #475569;
  border: 1.5px solid #E2E8F0;
}
.pcs-btn--outline:hover {
  border-color: #CBD5E1;
  background: #F8FAFC;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
}

/* Animations */
@keyframes pcs-slide-down {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
@keyframes pcs-slide-up {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Responsive */
@media (max-width: 640px) {
  .pcs-page {
    padding: 80px 16px 40px;
  }
  .pcs-room-code {
    font-size: 28px;
    padding: 10px 16px;
    letter-spacing: 0.12em;
  }
  .pcs-info-grid {
    grid-template-columns: 1fr;
  }
  .pcs-banner {
    flex-direction: column;
    text-align: center;
    padding: 20px;
  }
  .pcs-actions {
    flex-direction: column;
  }
}
</style>
