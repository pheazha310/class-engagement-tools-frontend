<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const auth = useAuthStore()
const redirecting = ref(true)

onMounted(async () => {
  // Ensure auth state is loaded
  if (!auth.initialized) {
    try {
      await auth.fetchUser()
    } catch {
      // proceed as guest
    }
  }

  // Brief delay to show the smooth loading animation
  await new Promise((r) => setTimeout(r, 400))

  if (auth.isAuthenticated && auth.user?.role === 'teacher') {
    router.replace('/live-voting')
  } else {
    router.replace('/polls/active')
  }
})
</script>

<template>
  <div class="lve-page">
    <div class="lve-bg-orb lve-bg-orb--1" aria-hidden="true" />
    <div class="lve-bg-orb lve-bg-orb--2" aria-hidden="true" />
    <div class="lve-bg-grid" aria-hidden="true" />

    <div class="lve-container">
      <div class="lve-card">
        <div class="lve-icon-wrap">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 class="lve-title">Live Voting</h1>
        <p class="lve-desc">Redirecting you to the right place...</p>
        <div class="lve-spinner-row">
          <div class="lve-spinner" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.lve-page {
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 50%, #EEF2FF 100%);
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  padding: 24px;
}

.lve-bg-orb {
  position: fixed;
  border-radius: 9999px;
  pointer-events: none;
  filter: blur(100px);
  opacity: 0.25;
  z-index: 0;
}

.lve-bg-orb--1 {
  top: -80px;
  right: -80px;
  width: 300px;
  height: 300px;
  background: rgba(99, 102, 241, 0.12);
}

.lve-bg-orb--2 {
  bottom: -120px;
  left: -80px;
  width: 350px;
  height: 350px;
  background: rgba(168, 85, 247, 0.1);
}

.lve-bg-grid {
  position: fixed;
  inset: 0;
  pointer-events: none;
  opacity: 0.1;
  background-image:
    linear-gradient(rgba(148, 163, 184, 0.06) 1px, transparent 1px),
    linear-gradient(90deg, rgba(148, 163, 184, 0.06) 1px, transparent 1px);
  background-size: 48px 48px;
  mask-image: linear-gradient(180deg, rgba(0, 0, 0, 0.5), transparent 90%);
  -webkit-mask-image: linear-gradient(180deg, rgba(0, 0, 0, 0.5), transparent 90%);
  z-index: 0;
}

.lve-container {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 400px;
}

.lve-card {
  background: white;
  border-radius: 24px;
  padding: 48px 32px;
  text-align: center;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.06);
  border: 1px solid #E2E8F0;
}

.lve-icon-wrap {
  width: 72px;
  height: 72px;
  border-radius: 20px;
  background: linear-gradient(135deg, #EEF2FF, #E0E7FF);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;
  color: #4F46E5;
}

.lve-icon-wrap svg {
  width: 36px;
  height: 36px;
}

.lve-title {
  font-size: 24px;
  font-weight: 800;
  color: #0F172A;
  margin: 0 0 8px;
  letter-spacing: -0.02em;
}

.lve-desc {
  font-size: 14px;
  color: #64748B;
  margin: 0 0 28px;
}

.lve-spinner-row {
  display: flex;
  justify-content: center;
}

.lve-spinner {
  width: 28px;
  height: 28px;
  border: 3px solid #E2E8F0;
  border-top-color: #6366F1;
  border-radius: 50%;
  animation: lve-spin 0.7s linear infinite;
}

@keyframes lve-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
