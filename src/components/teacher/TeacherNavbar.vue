<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import TeacherIcon from './TeacherIcon.vue'

const router = useRouter()
const authStore = useAuthStore()

const profileOpen = ref(false)

const displayName = computed(() => authStore.user?.name || 'Teacher')
const initials = computed(() =>
  displayName.value
    .split(/\s+/)
    .filter(Boolean)
    .slice(-2)
    .map((p) => p[0])
    .join('')
    .toUpperCase(),
)

function toggleProfile() {
  profileOpen.value = !profileOpen.value
}

function closeProfile() {
  profileOpen.value = false
}

function goToDashboard() {
  closeProfile()
  router.push('/teacher/dashboard')
}

function goToProfile() {
  closeProfile()
  router.push('/teacher/settings')
}

async function handleLogout() {
  closeProfile()
  await authStore.logout()
  router.push('/login')
}

function onDocumentClick(e: MouseEvent) {
  const target = e.target as HTMLElement
  if (!target.closest('.tn-profile-trigger')) {
    closeProfile()
  }
}

onMounted(() => {
  document.addEventListener('click', onDocumentClick)
})

onUnmounted(() => {
  document.removeEventListener('click', onDocumentClick)
})
</script>

<template>
  <nav class="teacher-navbar">
    <div class="tn-container">
      <!-- Left: Brand -->
      <div class="tn-left">
        <button class="tn-brand" type="button" @click="goToDashboard" title="Go to Dashboard">
          <span class="tn-brand-icon">
            <TeacherIcon icon="logo" :size="22" :stroke-width="2.3" />
          </span>
          <span class="tn-brand-name">EduPulse</span>
        </button>
        <span class="tn-brand-divider"></span>
        <button class="tn-dashboard-link" type="button" @click="goToDashboard">
          <TeacherIcon icon="grid" :size="16" />
          <span>Dashboard</span>
        </button>
      </div>

      <!-- Center: Page indicator -->
      <div class="tn-center">
        <slot name="center" />
      </div>

      <!-- Right: Profile -->
      <div class="tn-right">
        <div class="tn-profile-trigger">
          <button
            class="tn-profile-btn"
            type="button"
            aria-label="Profile menu"
            aria-haspopup="true"
            :aria-expanded="profileOpen"
            @click="toggleProfile"
          >
            <span class="tn-avatar">{{ initials }}</span>
            <span class="tn-name">{{ displayName.split(' ')[0] }}</span>
            <TeacherIcon icon="chevron" :size="12" />
          </button>

          <!-- Dropdown -->
          <Transition name="tn-dropdown">
            <div v-if="profileOpen" class="tn-dropdown" @click.stop>
              <div class="tn-dropdown-header">
                <span class="tn-dropdown-avatar">{{ initials }}</span>
                <div>
                  <p class="tn-dropdown-name">{{ displayName }}</p>
                  <span class="tn-dropdown-role">{{ authStore.user?.role || 'Teacher' }}</span>
                  <span v-if="authStore.user?.email" class="tn-dropdown-email">{{ authStore.user.email }}</span>
                  <span v-if="authStore.user?.school" class="tn-dropdown-school">{{ authStore.user.school }}</span>
                </div>
              </div>
              <div class="tn-dropdown-divider"></div>
              <button class="tn-dropdown-item" type="button" @click="goToDashboard">
                <TeacherIcon icon="grid" :size="16" />
                <span>Dashboard</span>
              </button>
              <button class="tn-dropdown-item" type="button" @click="goToProfile">
                <TeacherIcon icon="settings" :size="16" />
                <span>Profile &amp; Settings</span>
              </button>
              <div class="tn-dropdown-divider"></div>
              <button class="tn-dropdown-item tn-dropdown-logout" type="button" @click="handleLogout">
                <TeacherIcon icon="logOut" :size="16" />
                <span>Log Out</span>
              </button>
            </div>
          </Transition>
        </div>
      </div>
    </div>
  </nav>
</template>

<style scoped>
/* ── Container ──────────────────────────────────────────────── */
.teacher-navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  height: 68px;
  background: #ffffff;
  border-bottom: 1px solid #e8ecf4;
  transition: box-shadow 0.35s cubic-bezier(0.16, 1, 0.3, 1);
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

.teacher-navbar {
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
}

.tn-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 28px;
  height: 68px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

/* ── Left side ─────────────────────────────────────────────── */
.tn-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.tn-brand {
  display: flex;
  align-items: center;
  gap: 8px;
  border: none;
  background: transparent;
  cursor: pointer;
  padding: 0;
  font-family: inherit;
  transition: opacity 0.2s;
}

.tn-brand:hover {
  opacity: 0.85;
}

.tn-brand-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: linear-gradient(135deg, #2d4ec4 0%, #001f9e 100%);
  color: #ffffff;
}

.tn-brand-name {
  font-size: 18px;
  font-weight: 800;
  color: #0b1020;
  letter-spacing: -0.02em;
}

.tn-brand-divider {
  width: 1px;
  height: 28px;
  background: #e0e4ef;
}

.tn-dashboard-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: #475569;
  font-size: 13px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.tn-dashboard-link:hover {
  background: rgba(0, 31, 158, 0.06);
  color: #001f9e;
}

/* ── Center slot ───────────────────────────────────────────── */
.tn-center {
  flex: 1;
  display: flex;
  justify-content: center;
  min-width: 0;
}

/* ── Right side ────────────────────────────────────────────── */
.tn-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.tn-profile-trigger {
  position: relative;
}

.tn-profile-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 38px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: #1a2030;
  padding: 0 8px;
  cursor: pointer;
  transition: all 0.15s;
  font-family: inherit;
}

.tn-profile-btn:hover {
  background: #eef3ff;
}

.tn-avatar {
  display: inline-grid;
  width: 30px;
  height: 30px;
  place-items: center;
  border-radius: 6px;
  background: linear-gradient(135deg, #2d4ec4 0%, #001f9e 100%);
  color: #fff;
  font-size: 11px;
  font-weight: 800;
}

.tn-name {
  font-size: 13px;
  font-weight: 700;
  display: none;
}

@media (min-width: 1100px) {
  .tn-name {
    display: inline;
  }
}

/* ── Dropdown ──────────────────────────────────────────────── */
.tn-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  z-index: 100;
  width: 240px;
  border: 1px solid #e0e4ef;
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.14);
  overflow: hidden;
}

.tn-dropdown-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 18px 20px 14px;
}

.tn-dropdown-avatar {
  display: inline-grid;
  width: 44px;
  height: 44px;
  place-items: center;
  border-radius: 10px;
  background: linear-gradient(135deg, #2d4ec4 0%, #001f9e 100%);
  color: #fff;
  font-size: 15px;
  font-weight: 800;
  flex-shrink: 0;
}

.tn-dropdown-name {
  margin: 0;
  font-size: 14px;
  font-weight: 700;
  color: #0b1020;
}

.tn-dropdown-role {
  font-size: 11px;
  color: #697082;
  text-transform: uppercase;
  font-weight: 700;
  display: block;
}

.tn-dropdown-email {
  display: block;
  margin-top: 4px;
  font-size: 12px;
  color: #4a5268;
  font-weight: 600;
}

.tn-dropdown-school {
  display: block;
  margin-top: 2px;
  font-size: 11px;
  color: #697082;
  font-weight: 600;
}

.tn-dropdown-divider {
  height: 1px;
  background: #e8ecf4;
  margin: 0;
}

.tn-dropdown-item {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 12px 20px;
  border: 0;
  background: transparent;
  color: #1a2030;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.1s;
  text-align: left;
  font-family: inherit;
}

.tn-dropdown-item:hover {
  background: #eaf0ff;
  color: #001f9e;
}

.tn-dropdown-logout {
  color: #c51313;
}

.tn-dropdown-logout:hover {
  background: #fff0f0;
  color: #c51313;
}

/* Dropdown transition */
.tn-dropdown-enter-active,
.tn-dropdown-leave-active {
  transition: all 0.15s ease;
}

.tn-dropdown-enter-from,
.tn-dropdown-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

/* ── Responsive ─────────────────────────────────────────────── */
@media (max-width: 768px) {
  .tn-container {
    padding: 0 16px;
  }

  .tn-brand-name {
    display: none;
  }

  .tn-brand-divider {
    display: none;
  }

  .tn-dashboard-link span {
    display: none;
  }
}

@media (max-width: 480px) {
  .tn-avatar {
    width: 28px;
    height: 28px;
    font-size: 10px;
  }
}
</style>
