<template>
  <div class="join-page">
    <header class="header">
      <div class="header-left">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="qr-icon">
          <rect x="3" y="3" width="7" height="7"/>
          <rect x="14" y="3" width="7" height="7"/>
          <rect x="14" y="14" width="7" height="7"/>
          <rect x="3" y="14" width="7" height="7"/>
        </svg>
        <span class="header-text">QR_code_scanner</span>
      </div>
      <div class="header-right">
        <h2 class="header-title">Join Activity</h2>
        <button class="profile-button" aria-label="Profile">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
        </button>
      </div>
    </header>
    <main class="main-content">
      <div class="content-wrapper">
        <h1 class="title">Join Your Class</h1>
        <p class="subtitle">Enter the 6-digit code shared by your teacher to get started.</p>
        <div class="card">
          <label class="label">ACTIVITY CODE</label>

          <div class="code-input-container">
            <input
              v-for="(digit, index) in 6"
              :key="index"
              :ref="(el) => setCodeInputRef(el, index)"
              v-model="codeDigits[index]"
              type="text"
              maxlength="1"
              class="code-digit-input"
              @input="handleInput($event, index)"
              @keydown="handleKeydown($event, index)"
              @paste="handlePaste"
            />
          </div>

          <div class="display-name-section">
            <label class="label">YOUR NAME</label>
            <input
              v-model="displayName"
              type="text"
              placeholder="Enter your name"
              class="display-name-input"
              maxlength="30"
            />
          </div>
          <button class="join-button" @click="handleJoin" :disabled="isLoading">
            <span>{{ isLoading ? 'Joining...' : 'Join Activity' }}</span>
            <svg v-if="!isLoading" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/>
              <path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/>
              <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/>
              <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/>
            </svg>
          </button>

          <p v-if="error" class="error-message">{{ error }}</p>
        </div>

        <div class="divider">
          <span class="divider-text">OR</span>
        </div>

        <button class="qr-button" @click="scanQRCode">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="qr-icon">
            <rect x="3" y="3" width="7" height="7"/>
            <rect x="14" y="3" width="7" height="7"/>
            <rect x="14" y="14" width="7" height="7"/>
            <rect x="3" y="14" width="7" height="7"/>
          </svg>
          <span>Scan QR Code</span>
        </button>
      </div>
    </main>
    <AppToast />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from '@/composables/useToast'
import AppToast from '@/components/AppToast.vue'
import { joinSession as joinSessionApi } from '@/services/join'

const router = useRouter()
const { showToast } = useToast()

const codeDigits = ref<string[]>(Array(6).fill(''))
const codeInputRefs = ref<(HTMLInputElement | null)[]>([])
const displayName = ref('')
const error = ref('')
const isLoading = ref(false)

const setCodeInputRef = (el: unknown, index: number) => {
  codeInputRefs.value[index] = (el as HTMLInputElement | null)
}

const handleInput = (event: Event, index: number) => {
  const target = event.target as HTMLInputElement
  const value = target.value

  if (value && !/^[a-zA-Z0-9]$/.test(value)) {
    codeDigits.value[index] = ''
    return
  }

  if (value && index < 5) {
    codeInputRefs.value[index + 1]?.focus()
  }
}

const handleKeydown = (event: KeyboardEvent, index: number) => {
  if (event.key === 'Backspace' && !codeDigits.value[index] && index > 0) {
    codeInputRefs.value[index - 1]?.focus()
  }
}

const handlePaste = (event: ClipboardEvent) => {
  event.preventDefault()
  const pastedData = event.clipboardData?.getData('text') || ''
  const digits = pastedData.replace(/[^a-zA-Z0-9]/g, '').slice(0, 6).split('')

  digits.forEach((digit, index) => {
    if (index < 6) {
      codeDigits.value[index] = digit
    }
  })
  const nextEmptyIndex = digits.length
  if (nextEmptyIndex < 6) {
    codeInputRefs.value[nextEmptyIndex]?.focus()
  } else {
    codeInputRefs.value[5]?.focus()
  }
}

const validateInputs = (): boolean => {
  const code = codeDigits.value.join('')
  if (!code || code.length !== 6) {
    error.value = 'Please enter the complete 6-digit class code.'
    return false
  }
  if (!displayName.value.trim()) {
    error.value = 'Please enter your name.'
    return false
  }

  if (displayName.value.trim().length < 2) {
    error.value = 'Name must be at least 2 characters.'
    return false
  }

  error.value = ''
  return true
}

const handleJoin = async () => {
  if (!validateInputs()) {
    return
  }
  isLoading.value = true
  error.value = ''
  try {
    const code = codeDigits.value.join('')
    const response = await joinSessionApi({ code, displayName: displayName.value.trim() })

    showToast(`Successfully joined session: ${code}`, 'success')
    router.push({
      path: '/session',
      query: {
        code,
        name: displayName.value.trim(),
        sessionId: response.sessionId,
      },
    })
  } catch (err) {
    if (err instanceof Error) {
      error.value = err.message
    } else {
      error.value = 'Failed to join session. Please try again.'
    }
  } finally {
    isLoading.value = false
  }
}

const scanQRCode = () => {
  showToast('QR Code scanner would open here.\nThis would use the device camera to scan a QR code containing the session code.', 'info')
}

onMounted(() => {
  codeInputRefs.value[0]?.focus()
})
</script>

<style scoped>
.join-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #f5f7fa 0%, #e8eef5 100%);
  position: relative;
  overflow: hidden;
}

.join-page::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle at 30% 70%, rgba(99, 102, 241, 0.08) 0%, transparent 50%),
              radial-gradient(circle at 70% 30%, rgba(99, 102, 241, 0.08) 0%, transparent 50%);
  pointer-events: none;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background: #4f46e5;
  color: white;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.qr-icon {
  width: 24px;
  height: 24px;
}

.header-text {
  font-size: 18px;
  font-weight: 600;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.header-title {
  font-size: 20px;
  font-weight: 600;
  margin: 0;
}

.profile-button {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  transition: opacity 0.2s;
}

.profile-button:hover {
  opacity: 0.8;
}

.main-content {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 40px 20px;
  position: relative;
  z-index: 1;
}

.content-wrapper {
  width: 100%;
  max-width: 480px;
  text-align: center;
}

.title {
  font-size: 36px;
  font-weight: 700;
  color: #4f46e5;
  margin: 0 0 12px 0;
  letter-spacing: -0.5px;
}

.subtitle {
  font-size: 15px;
  color: #6b7280;
  margin: 0 0 32px 0;
  line-height: 1.5;
}

.card {
  background: white;
  border-radius: 16px;
  padding: 32px 24px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.04);
  text-align: center;
}

.label {
  font-family: "inter", sans-serif;
  display: block;
  text-align: center;
  font-size: 12px;
  font-weight: 600;
  color: #7c7c82;
  margin-bottom: 12px;
  letter-spacing: 0.5px;
}

.code-input-container {
  display: flex;
  gap: 10px;
  justify-content: center;
  margin-bottom: 24px;
}

.code-digit-input {
  width: 44px;
  height: 52px;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  text-align: center;
  font-size: 22px;
  font-weight: 600;
  color: #111827;
  transition: all 0.2s;
  outline: none;
  background: #f9fafb;
}

.code-digit-input:focus {
  border-color: #4f46e5;
  background: white;
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
}

.code-digit-input::placeholder {
  color: #d1d5db;
  font-weight: 400;
}

.display-name-section {
  margin-bottom: 20px;
  text-align: left;
}

.display-name-input {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  font-size: 15px;
  color: #111827;
  transition: all 0.2s;
  outline: none;
  box-sizing: border-box;
  background: #f9fafb;
}

.display-name-input:focus {
  border-color: #4f46e5;
  background: white;
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
}

.display-name-input::placeholder {
  color: #9ca3af;
}

.join-button {
  width: 100%;
  padding: 16px 24px;
  background: #4f46e5;
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.2s;
  box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);
}

.join-button:hover:not(:disabled) {
  background: #4338ca;
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(79, 70, 229, 0.4);
}

.join-button:active:not(:disabled) {
  transform: translateY(0);
}

.join-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error-message {
  color: #dc2626;
  margin-top: 12px;
  font-size: 14px;
  font-weight: 500;
}

.divider {
  display: flex;
  align-items: center;
  margin: 24px 0;
  position: relative;
}

.divider::before,
.divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: #e5e7eb;
}

.divider-text {
  padding: 0 16px;
  color: #9ca3af;
  font-size: 14px;
  font-weight: 500;
}

.qr-button {
  width: 100%;
  padding: 14px 24px;
  background: white;
  color: #92400e;
  border: 2px solid #fbbf24;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.2s;
}

.qr-button:hover {
  background: #fffbeb;
  transform: translateY(-1px);
}

.qr-button:active {
  transform: translateY(0);
}

@media (max-width: 640px) {
  .header {
    padding: 12px 16px;
  }

  .header-text {
    font-size: 16px;
  }

  .header-title {
    font-size: 18px;
  }

  .main-content {
    padding: 24px 16px;
  }

  .title {
    font-size: 28px;
  }

  .card {
    padding: 24px 16px;
  }

  .code-digit-input {
    width: 38px;
    height: 46px;
    font-size: 18px;
  }
}
</style>
