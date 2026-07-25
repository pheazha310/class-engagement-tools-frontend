<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import ProfileForm from '@/components/ProfileForm.vue'

defineOptions({
  name: 'ProfilePage',
})

const auth = useAuthStore()

const currentHour = ref(new Date().getHours())

const greeting = computed(() => {
  const h = currentHour.value
  if (h < 12) return { text: 'Good Morning', emoji: '🌅' }
  if (h < 18) return { text: 'Good Afternoon', emoji: '☀️' }
  return { text: 'Good Evening', emoji: '🌙' }
})

const studentName = computed(() => auth.user?.name || 'Student')
const studentEmail = computed(() => auth.user?.email || '')
const studentSchool = computed(() => auth.user?.school ?? '')
const studentRole = computed(() => {
  const role = auth.user?.role
  if (!role) return ''
  return role.charAt(0).toUpperCase() + role.slice(1)
})

const studentInitials = computed(() => {
  const name = studentName.value
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return '?'
  if (parts.length === 1) return parts[0]![0]!.toUpperCase()
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase()
})

const profileImageUrl = computed(() => auth.profileImageUrl)
let greetTimer: ReturnType<typeof setInterval> | null = null

onMounted(async () => {
  await auth.fetchUser()
  // Update greeting every minute
  greetTimer = setInterval(() => { currentHour.value = new Date().getHours() }, 60000)
})

onUnmounted(() => {
  if (greetTimer) clearInterval(greetTimer)
})
</script>

<template>
  <div class="profile-page">
    <!-- ── Animated Background ──────────────────────────────────── -->
    <div class="bg-canvas">
      <div class="bg-orb bg-orb--1" />
      <div class="bg-orb bg-orb--2" />
      <div class="bg-orb bg-orb--3" />
      <div class="bg-grid" />
    </div>

    <div class="profile-container">
      <!-- ── Profile Hero Header ────────────────────────────────── -->
      <div class="profile-hero">
        <div class="hero-bg" />
        <div class="hero-content">
          <div class="hero-left">
            <div class="hero-avatar-ring">
              <div class="hero-avatar">
                <img
                  v-if="profileImageUrl"
                  :src="profileImageUrl"
                  :alt="studentName"
                  class="hero-avatar-img"
                />
                <span v-else class="hero-avatar-initials">{{ studentInitials }}</span>
              </div>
            </div>
            <div class="hero-info">
              <h1 class="hero-name">{{ studentName }}</h1>
              <p class="hero-email">{{ studentEmail }}</p>
              <div class="hero-badges">
                <span class="hero-badge hero-badge--role">{{ studentRole }}</span>
                <span v-if="studentSchool" class="hero-badge hero-badge--school">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                    <path d="M6 12v5c3 3 9 3 12 0v-5" />
                  </svg>
                  {{ studentSchool }}
                </span>
              </div>
            </div>
          </div>
          <div class="hero-greeting">
            <span class="hero-greeting-emoji">{{ greeting.emoji }}</span>
            <span class="hero-greeting-text">{{ greeting.text }}</span>
          </div>
        </div>
      </div>

      <!-- ── Breadcrumb ────────────────────────────────────────── -->
      <div class="breadcrumb">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
        <RouterLink to="/student/dashboard" class="breadcrumb-link">Dashboard</RouterLink>
        <svg class="breadcrumb-sep" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="9 18 15 12 9 6" />
        </svg>
        <span class="breadcrumb-current">Profile</span>
      </div>

      <!-- ── Content Grid ──────────────────────────────────────── -->
      <div class="content-grid">
        <!-- Left: Profile Form -->
        <div class="content-card form-card">
          <div class="card-ornament" />
          <div class="card-header-x">
            <div class="card-icon-wrap">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <div>
              <h2 class="card-title-x">Personal Information</h2>
              <p class="card-desc-x">Update your name and profile picture displayed on your account.</p>
            </div>
          </div>

          <ProfileForm />
        </div>

        <!-- Right: Quick Info Panel -->
        <div class="info-panel">
          <div class="info-card">
            <div class="info-card-icon" style="background: #eff6ff; color: #3b82f6">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 8v4l3 3" />
                <path d="M12 22a10 10 0 100-20 10 10 0 000 20z" />
              </svg>
            </div>
            <div class="info-card-body">
              <span class="info-card-value">Student</span>
              <span class="info-card-label">Account Type</span>
            </div>
          </div>

          <div class="info-card">
            <div class="info-card-icon" style="background: #fef2f2; color: #ef4444">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0110 0v4" />
              </svg>
            </div>
            <div class="info-card-body">
              <span class="info-card-value">Secure</span>
              <span class="info-card-label">Account Status</span>
            </div>
          </div>

          <div class="info-card">
            <div class="info-card-icon" style="background: #f0fdf4; color: #22c55e">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <div class="info-card-body">
              <span class="info-card-value">Active</span>
              <span class="info-card-label">Membership</span>
            </div>
          </div>

          <div class="info-tip">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            <span>Changes to your profile are visible to your teachers and classmates.</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ── CSS Variables ──────────────────────────────────────────── */
.profile-page {
  --primary: #1a3a8a;
  --primary-light: #3b82f6;
  --primary-soft: #eff6ff;
  --ink: #0f172a;
  --ink-secondary: #475569;
  --muted: #94a3b8;
  --line: #e2e8f0;
  --surface: #ffffff;
  --surface-soft: #f8fafc;
  --green: #10b981;
  --green-soft: #ecfdf5;
  --violet: #8b5cf6;
  min-height: 100vh;
  background: var(--surface-soft);
  color: var(--ink);
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  position: relative;
  overflow-x: hidden;
  margin-top: 60px;
}

/* ── Background Canvas ──────────────────────────────────────── */
.bg-canvas {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  overflow: hidden;
}

.bg-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.08;
  animation: orb-float 14s ease-in-out infinite alternate;
}

.bg-orb--1 {
  width: 500px;
  height: 500px;
  top: -10%;
  left: -5%;
  background: #3b82f6;
  animation-delay: 0s;
}

.bg-orb--2 {
  width: 400px;
  height: 400px;
  bottom: -5%;
  right: -5%;
  background: #8b5cf6;
  animation-delay: -4s;
}

.bg-orb--3 {
  width: 300px;
  height: 300px;
  top: 40%;
  right: 30%;
  background: #10b981;
  animation-delay: -8s;
}

@keyframes orb-float {
  0% { transform: translate(0, 0) scale(1); }
  100% { transform: translate(30px, -20px) scale(1.12); }
}

.bg-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(59, 130, 246, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(59, 130, 246, 0.03) 1px, transparent 1px);
  background-size: 60px 60px;
}

/* ── Container ──────────────────────────────────────────────── */
.profile-container {
  position: relative;
  z-index: 1;
  max-width: 920px;
  margin: 0 auto;
  padding: 28px 24px 80px;
}

/* ── Profile Hero ───────────────────────────────────────────── */
.profile-hero {
  position: relative;
  border-radius: 20px;
  overflow: hidden;
  margin-bottom: 20px;
  animation: hero-in 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes hero-in {
  0% { opacity: 0; transform: translateY(20px) scale(0.97); }
  100% { opacity: 1; transform: translateY(0) scale(1); }
}

.hero-bg {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, #1a3a8a 0%, #3b82f6 50%, #2563eb 100%);
}

.hero-bg::after {
  content: '';
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse 400px 250px at 10% 80%, rgba(255,255,255,0.1) 0%, transparent),
    radial-gradient(ellipse 300px 300px at 85% 20%, rgba(255,255,255,0.06) 0%, transparent);
}

.hero-content {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 28px 32px;
}

.hero-left {
  display: flex;
  align-items: center;
  gap: 20px;
}

.hero-avatar-ring {
  flex-shrink: 0;
  padding: 3px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
}

.hero-avatar {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(4px);
}

.hero-avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.hero-avatar-initials {
  color: #fff;
  font-size: 28px;
  font-weight: 800;
}

.hero-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.hero-name {
  margin: 0;
  font-size: 24px;
  font-weight: 800;
  color: #fff;
  letter-spacing: -0.02em;
}

.hero-email {
  margin: 0;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.75);
}

.hero-badges {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 2px;
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 12px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.4px;
}

.hero-badge--role {
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
  backdrop-filter: blur(4px);
}

.hero-badge--school {
  background: rgba(255, 255, 255, 0.15);
  color: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(4px);
}

.hero-greeting {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  flex-shrink: 0;
}

.hero-greeting-emoji {
  font-size: 32px;
  line-height: 1;
  animation: wave 2s ease-in-out infinite;
}

@keyframes wave {
  0%, 100% { transform: rotate(0deg); }
  25% { transform: rotate(-10deg); }
  75% { transform: rotate(10deg); }
}

.hero-greeting-text {
  font-size: 11px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.7);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* ── Breadcrumb ─────────────────────────────────────────────── */
.breadcrumb {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--muted);
  margin-bottom: 24px;
  animation: fade-up 0.4s ease 0.15s both;
}

.breadcrumb svg {
  flex-shrink: 0;
  color: var(--muted);
}

.breadcrumb-link {
  color: var(--primary-light);
  text-decoration: none;
  font-weight: 500;
  transition: color 0.15s ease;
}

.breadcrumb-link:hover {
  color: var(--primary);
  text-decoration: underline;
}

.breadcrumb-current {
  color: var(--ink-secondary);
  font-weight: 600;
}

.breadcrumb-sep {
  color: #cbd5e1;
}

/* ── Content Grid ───────────────────────────────────────────── */
.content-grid {
  display: grid;
  grid-template-columns: 1.5fr 1fr;
  gap: 24px;
  animation: fade-up 0.5s ease 0.25s both;
}

@keyframes fade-up {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}

/* ── Form Card ──────────────────────────────────────────────── */
.form-card {
  position: relative;
  background: var(--surface);
  border-radius: 16px;
  border: 1px solid var(--line);
  padding: 28px 32px;
  box-shadow: 0 4px 16px rgba(15, 23, 42, 0.04);
  overflow: hidden;
}

.card-ornament {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 3px;
  background: linear-gradient(90deg, #3b82f6, #8b5cf6, #10b981);
}

.card-header-x {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  margin-bottom: 24px;
  padding-bottom: 20px;
  border-bottom: 1px solid var(--line);
}

.card-icon-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: linear-gradient(135deg, var(--primary-soft), #dbeafe);
  color: var(--primary-light);
  flex-shrink: 0;
}

.card-title-x {
  margin: 0 0 4px;
  font-size: 17px;
  font-weight: 700;
  color: var(--ink);
}

.card-desc-x {
  margin: 0;
  font-size: 13px;
  color: var(--muted);
  line-height: 1.5;
}

/* ── Info Panel ─────────────────────────────────────────────── */
.info-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.info-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 18px;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 14px;
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.03);
  transition: all 0.2s ease;
}

.info-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(15, 23, 42, 0.06);
}

.info-card-icon {
  display: grid;
  width: 42px;
  height: 42px;
  place-items: center;
  border-radius: 11px;
  flex-shrink: 0;
}

.info-card-body {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.info-card-value {
  font-size: 14px;
  font-weight: 700;
  color: var(--ink);
}

.info-card-label {
  font-size: 11px;
  font-weight: 600;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.info-tip {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 12px 14px;
  border-radius: 10px;
  background: #fffbeb;
  color: #92400e;
  font-size: 12px;
  line-height: 1.5;
  border: 1px solid #fde68a;
}

.info-tip svg {
  flex-shrink: 0;
  margin-top: 1px;
  color: #f59e0b;
}

/* ── Responsive ─────────────────────────────────────────────── */
@media (max-width: 900px) {
  .content-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .profile-container {
    padding: 16px 16px 60px;
  }

  .hero-content {
    flex-direction: column;
    text-align: center;
    padding: 24px 20px;
  }

  .hero-left {
    flex-direction: column;
    text-align: center;
  }

  .hero-badges {
    justify-content: center;
  }

  .hero-greeting {
    flex-direction: row;
    gap: 6px;
  }

  .hero-name {
    font-size: 20px;
  }

  .form-card {
    padding: 24px 20px;
  }

  .card-header-x {
    flex-direction: column;
  }
}
</style>