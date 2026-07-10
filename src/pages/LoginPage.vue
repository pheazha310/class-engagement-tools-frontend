<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const email = ref('')
const password = ref('')
const error = ref<string | null>(null)
const loading = ref(false)

async function submit(event: Event) {
  event.preventDefault()
  error.value = null
  loading.value = true

  try {
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        email: email.value.trim(),
        password: password.value,
      }),
    })

    const data = await response.json().catch(() => ({}))
    if (!response.ok) {
      error.value = data.message || `Login failed: ${response.status}`
      return
    }

    router.replace('/')
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Login failed'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="page">
    <form class="card" @submit="submit">
      <h1 class="title">Sign in</h1>
      <p class="subtitle">Sign in to save and manage your wheels.</p>

      <div v-if="error" class="alert alert-error">{{ error }}</div>

      <label class="form-group">
        <span class="form-label">Email</span>
        <input v-model="email" type="email" class="input" required />
      </label>

      <label class="form-group">
        <span class="form-label">Password</span>
        <input v-model="password" type="password" class="input" required />
      </label>

      <button class="btn btn-primary" type="submit" :disabled="loading">
        {{ loading ? 'Signing in...' : 'Sign in' }}
      </button>
    </form>
  </div>
</template>

<style scoped>
.page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: #0f0f1a;
}

.card {
  width: 100%;
  max-width: 360px;
  padding: 24px;
  background: #141428;
  border: 1px solid #252540;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.title {
  margin: 0;
  font-size: 22px;
  font-weight: 800;
  color: #fff;
  text-align: center;
}

.subtitle {
  margin: 0;
  font-size: 14px;
  color: #888;
  text-align: center;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-label {
  font-size: 12px;
  font-weight: 700;
  color: #ddd;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.input {
  padding: 12px 14px;
  border-radius: 10px;
  border: 1px solid #2a2a45;
  background: #1a1a2e;
  color: #fff;
  font-size: 15px;
  outline: none;
}

.input:focus {
  border-color: #4ecdc4;
}

.alert {
  padding: 10px 12px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 700;
}

.alert-error {
  color: #ff6b6b;
  background: #2a1010;
  border: 1px solid #5a1f1f;
}

.btn {
  padding: 12px;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  color: #fff;
  background: linear-gradient(135deg, #4ecdc4, #2fa89e);
  box-shadow: 0 4px 12px rgba(78, 205, 196, 0.35);
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
</style>
