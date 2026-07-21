<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { joinGameSession, type JoinGameSessionResponse } from '@/services/game'

const route = useRoute()
const router = useRouter()

const joinCode = ref('')
const studentName = ref('')
const isSubmitting = ref(false)
const errorMessage = ref('')
const successData = ref<JoinGameSessionResponse | null>(null)

onMounted(() => {
  const code = route.params.joinCode
  if (typeof code === 'string') {
    joinCode.value = code
  }
})

async function handleJoin() {
  errorMessage.value = ''
  successData.value = null

  const trimmedName = studentName.value.trim()
  if (!trimmedName) {
    errorMessage.value = 'Please enter your name.'
    return
  }

  if (!joinCode.value) {
    errorMessage.value = 'Invalid join code.'
    return
  }

  isSubmitting.value = true

  try {
    const data = await joinGameSession(joinCode.value, { name: trimmedName })
    successData.value = data
    router.replace({
      name: 'game-play',
      params: { joinCode: joinCode.value },
      query: { studentName: trimmedName },
    })
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Failed to join game. Please try again.'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="join-page">
    <div class="join-card">
      <div class="join-card-header">
        <div class="join-card-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
            <polyline points="10 17 15 12 10 7" />
            <line x1="15" y1="12" x2="3" y2="12" />
          </svg>
        </div>
        <div>
          <h1 class="join-card-title">Join Game</h1>
          <p class="join-card-subtitle">Enter your name to join the activity</p>
        </div>
      </div>

      <div v-if="!successData" class="join-card-body">
        <div class="join-code-display">
          <span class="join-code-label">Game Code</span>
          <span class="join-code-value">{{ joinCode }}</span>
        </div>

        <form @submit.prevent="handleJoin" class="join-form">
          <label for="student-name" class="join-label">Your Name</label>
          <input
            id="student-name"
            v-model="studentName"
            type="text"
            class="join-input"
            placeholder="Enter your name"
            autocomplete="name"
            :disabled="isSubmitting"
            maxlength="50"
          />

          <p v-if="errorMessage" class="join-error">{{ errorMessage }}</p>

          <button
            type="submit"
            class="join-submit-btn"
            :disabled="isSubmitting || !studentName.trim()"
          >
            <span v-if="!isSubmitting">Join Game</span>
            <span v-else class="join-submit-loading">
              <span class="join-spinner"></span>
              Joining...
            </span>
          </button>
        </form>
      </div>

      <div v-else class="join-card-body">
        <div class="join-success">
          <div class="join-success-icon">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h2 class="join-success-title">You're In!</h2>
          <p class="join-success-text">
            You have successfully joined the game. Get ready to participate!
          </p>
          <p v-if="successData.message" class="join-success-message">{{ successData.message }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.join-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  position: relative;
  overflow: hidden;
}

.join-page::before {
  content: '';
  position: absolute;
  inset: 0;
  background: url('data:image/svg+xml,<svg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"><g fill="none" fill-rule="evenodd"><g fill="%23ffffff" fill-opacity="0.06"><path d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/></g></g></svg>');
  opacity: 0.5;
  pointer-events: none;
  z-index: 0;
}

.join-card {
  width: 100%;
  max-width: 420px;
  background: #ffffff;
  border-radius: 24px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(0, 0, 0, 0.04);
  overflow: hidden;
}

.join-card-header {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 24px 24px 20px;
  border-bottom: 1px solid #f1f5f9;
}

.join-card-icon {
  width: 48px;
  height: 48px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: #fff;
  flex-shrink: 0;
  box-shadow: 0 4px 14px rgba(99, 102, 241, 0.35);
}

.join-card-title {
  margin: 0;
  font-size: 20px;
  font-weight: 800;
  color: #0f172a;
  line-height: 1.3;
}

.join-card-subtitle {
  margin: 2px 0 0;
  font-size: 13px;
  font-weight: 500;
  color: #64748b;
}

.join-card-body {
  padding: 24px;
}

.join-code-display {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 18px;
  border-radius: 14px;
  border: 2px dashed #cbd5e1;
  background: linear-gradient(to bottom, #f8fafc, #ffffff);
  margin-bottom: 20px;
}

.join-code-label {
  font-size: 12px;
  font-weight: 700;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.join-code-value {
  font-size: 22px;
  font-weight: 900;
  color: #0f172a;
  letter-spacing: 0.2em;
  font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;
}

.join-form {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.join-label {
  font-size: 13px;
  font-weight: 700;
  color: #334155;
}

.join-input {
  width: 100%;
  padding: 14px 16px;
  border-radius: 12px;
  border: 2px solid #e2e8f0;
  background: #ffffff;
  font-size: 15px;
  font-weight: 600;
  color: #0f172a;
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s;
}

.join-input:focus {
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
}

.join-input:disabled {
  background: #f8fafc;
  color: #94a3b8;
}

.join-error {
  font-size: 13px;
  font-weight: 600;
  color: #dc2626;
  margin: 4px 0 0;
}

.join-submit-btn {
  margin-top: 8px;
  padding: 14px 24px;
  border: none;
  border-radius: 12px;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: #fff;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.15s, box-shadow 0.15s, opacity 0.15s;
  box-shadow: 0 4px 14px rgba(99, 102, 241, 0.4);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 48px;
}

.join-submit-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(99, 102, 241, 0.5);
}

.join-submit-btn:active:not(:disabled) {
  transform: translateY(0);
}

.join-submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.join-submit-loading {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.join-spinner {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #ffffff;
  animation: join-spin 0.8s linear infinite;
}

@keyframes join-spin {
  to {
    transform: rotate(360deg);
  }
}

.join-success {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 12px;
  padding: 16px 0;
}

.join-success-icon {
  width: 72px;
  height: 72px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #dcfce7;
  color: #15803d;
}

.join-success-title {
  margin: 0;
  font-size: 22px;
  font-weight: 800;
  color: #0f172a;
}

.join-success-text {
  margin: 0;
  font-size: 14px;
  font-weight: 500;
  color: #475569;
  line-height: 1.5;
  max-width: 320px;
}

.join-success-message {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  color: #15803d;
  background: #f0fdf4;
  padding: 10px 14px;
  border-radius: 10px;
  border: 1px solid #bbf7d0;
}

@media (max-width: 480px) {
  .join-page {
    padding: 16px;
    align-items: flex-start;
    padding-top: 48px;
  }

  .join-card {
    border-radius: 20px;
  }

  .join-code-value {
    font-size: 18px;
    letter-spacing: 0.15em;
  }
}
</style>
