<template>
  <div class="session-page">
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
        <h2 class="header-title">Active Session</h2>
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
        <h1 class="title">You are in the session</h1>
        <p class="subtitle">Session code: <strong>{{ sessionCode }}</strong></p>
        <p class="subtitle">Display name: <strong>{{ displayName }}</strong></p>
        <p class="subtitle">Session features will appear here as they become available.</p>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'
import { ref, onMounted } from 'vue'

const route = useRoute()

const sessionCode = ref('')
const displayName = ref('')

onMounted(() => {
  const code = route.query.code as string | undefined
  const name = route.query.name as string | undefined
  if (code) sessionCode.value = code
  if (name) displayName.value = name
})
</script>

<style scoped>
.session-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #f5f7fa 0%, #e8eef5 100%);
}

.session-page::before {
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
  position: relative;
  z-index: 1;
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
  margin: 0 0 12px 0;
  line-height: 1.5;
}
</style>
