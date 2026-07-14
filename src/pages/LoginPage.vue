<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const auth = useAuthStore()

const email = ref('')
const password = ref('')
const error = ref<string | null>(null)
const showPassword = ref(false)

async function submit(event: Event) {
  event.preventDefault()
  error.value = null

  const err = await auth.login(email.value, password.value)
  if (err) {
    error.value = err
    return
  }

  router.replace('/')
}
</script>

<template>
  <div class="page">
    <div class="card">
      <!-- Header -->
      <div class="header">
        <div class="badge">
          <svg class="badge-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          Welcome Back
        </div>
        <h1 class="title">Sign In</h1>
        <p class="subtitle">Sign in to access your tools and activities</p>
      </div>

      <!-- Error Alert -->
      <Transition name="fade">
        <div v-if="error" class="alert alert-error">
          <svg class="alert-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
          <span>{{ error }}</span>
        </div>
      </Transition>

      <!-- Form -->
      <form novalidate @submit="submit">
        <!-- Email -->
        <label class="form-group">
          <span class="form-label">Email Address</span>
          <div class="input-wrap">
            <svg class="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
            <input v-model="email" type="email" class="input" placeholder="you@example.com" required />
          </div>
        </label>

        <!-- Password -->
        <label class="form-group">
          <span class="form-label">Password</span>
          <div class="input-wrap">
            <svg class="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <input
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              class="input"
              placeholder="Enter your password"
              required
            />
            <button type="button" class="toggle-password" @click="showPassword = !showPassword" tabindex="-1">
              <svg v-if="!showPassword" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </svg>
            </button>
          </div>
        </label>

        <!-- Submit -->
        <button class="btn btn-primary" type="submit" :disabled="auth.loading">
          <template v-if="auth.loading">
            <svg class="spinner" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <circle cx="12" cy="12" r="10" stroke-dasharray="31.4 31.4" stroke-linecap="round" />
            </svg>
            Signing in...
          </template>
          <template v-else>
            Sign In
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </template>
        </button>
      </form>

      <!-- Footer -->
      <div class="footer">
        <p class="footer-text">
          Don't have an account?
          <router-link to="/register" class="footer-link">Create one</router-link>
        </p>
      </div>
    </div>

    <!-- Background decorations -->
    <div class="bg-glow bg-glow--1" />
    <div class="bg-glow bg-glow--2" />
  </div>
</template>

<style scoped>
.page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: #080812;
  position: relative;
  overflow: hidden;
}

/* ===== Background Glows ===== */
.bg-glow {
  position: absolute;
  border-radius: 50%;
  filter: blur(120px);
  pointer-events: none;
  z-index: 0;
}

.bg-glow--1 {
  width: 400px;
  height: 400px;
  background: rgba(78, 205, 196, 0.12);
  top: -120px;
  right: -100px;
}

.bg-glow--2 {
  width: 350px;
  height: 350px;
  background: rgba(99, 102, 241, 0.10);
  bottom: -100px;
  left: -80px;
}

/* ===== Card ===== */
.card {
  width: 100%;
  max-width: 400px;
  padding: 36px 32px 28px;
  background: #111127;
  border: 1px solid #1e1e40;
  border-radius: 20px;
  box-shadow:
    0 20px 60px rgba(0, 0, 0, 0.6),
    0 0 0 1px rgba(78, 205, 196, 0.05);
  position: relative;
  z-index: 1;
  animation: cardIn 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes cardIn {
  from {
    opacity: 0;
    transform: translateY(24px) scale(0.97);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* ===== Header ===== */
.header {
  text-align: center;
  margin-bottom: 24px;
}

.badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 700;
  color: #4ecdc4;
  background: rgba(78, 205, 196, 0.10);
  border: 1px solid rgba(78, 205, 196, 0.15);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 16px;
}

.badge-icon {
  opacity: 0.8;
}

.title {
  margin: 0 0 6px;
  font-size: 26px;
  font-weight: 800;
  color: #fff;
  letter-spacing: -0.02em;
}

.subtitle {
  margin: 0;
  font-size: 14px;
  color: #6b7280;
  line-height: 1.5;
}

/* ===== Form ===== */
form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-label {
  font-size: 12px;
  font-weight: 700;
  color: #c8c8dc;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.input-wrap {
  position: relative;
  display: flex;
  align-items: center;
}

.input-icon {
  position: absolute;
  left: 14px;
  color: #4b4b6e;
  pointer-events: none;
  transition: color 0.2s;
}

.input-wrap:focus-within .input-icon {
  color: #4ecdc4;
}

.input {
  width: 100%;
  padding: 13px 14px 13px 42px;
  border-radius: 12px;
  border: 1px solid #222244;
  background: #0d0d22;
  color: #e8e8f0;
  font-size: 15px;
  outline: none;
  font-family: inherit;
  transition: all 0.2s ease;
}

.input::placeholder {
  color: #3a3a5c;
}

.input:focus {
  border-color: #4ecdc4;
  box-shadow: 0 0 0 3px rgba(78, 205, 196, 0.08);
}

.toggle-password {
  position: absolute;
  right: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  color: #4b4b6e;
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.2s;
}

.toggle-password:hover {
  color: #8b8baa;
  background: rgba(255, 255, 255, 0.04);
}

/* ===== Alert ===== */
.alert {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 14px;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 600;
  line-height: 1.4;
}

.alert-error {
  color: #ff6b6b;
  background: rgba(255, 107, 107, 0.08);
  border: 1px solid rgba(255, 107, 107, 0.15);
}

.alert-icon {
  flex-shrink: 0;
  opacity: 0.8;
}

/* ===== Button ===== */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px 20px;
  border: none;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.2s ease;
  margin-top: 4px;
}

.btn-primary {
  color: #fff;
  background: linear-gradient(135deg, #4ecdc4, #2fa89e);
  box-shadow:
    0 4px 16px rgba(78, 205, 196, 0.30),
    inset 0 1px 0 rgba(255, 255, 255, 0.15);
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow:
    0 8px 24px rgba(78, 205, 196, 0.40),
    inset 0 1px 0 rgba(255, 255, 255, 0.15);
}

.btn-primary:active:not(:disabled) {
  transform: translateY(0);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* ===== Footer ===== */
.footer {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #1a1a3a;
  text-align: center;
}

.footer-text {
  margin: 0;
  font-size: 13px;
  color: #6b7280;
}

.footer-link {
  color: #4ecdc4;
  font-weight: 700;
  text-decoration: none;
  transition: color 0.2s;
}

.footer-link:hover {
  color: #6ee7de;
  text-decoration: underline;
}

/* ===== Transitions ===== */
.fade-enter-active,
.fade-leave-active {
  transition: all 0.25s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
