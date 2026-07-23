<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import ProfileDropdown from '@/components/ProfileDropdown.vue'

defineOptions({
  name: 'AppNavbar',
})

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()

const mobileMenuOpen = ref(false)
const isScrolled = ref(false)
const activeDropdown = ref(false)

const handleScroll = () => {
  isScrolled.value = window.scrollY > 50
}

const toggleMobileMenu = () => {
  mobileMenuOpen.value = !mobileMenuOpen.value
  if (mobileMenuOpen.value) {
    activeDropdown.value = false
  }
}

const toggleDropdown = () => {
  activeDropdown.value = !activeDropdown.value
}

const closeMobileMenu = () => {
  mobileMenuOpen.value = false
  activeDropdown.value = false
}

async function handleLogout() {
  await auth.logout()
  mobileMenuOpen.value = false
  await router.replace('/')
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll)
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>

<template>
  <nav class="navbar" :class="{ scrolled: isScrolled }">
    <div class="nav-container">
      <!-- Logo -->
      <RouterLink to="/" class="nav-logo">
        <img src="@/assets/photo_logo.jpg" alt="Classroom Tools" class="nav-logo-img" />
      </RouterLink>

      <!-- Navigation Links -->
      <ul class="nav-menu" :class="{ active: mobileMenuOpen }">
        <li>
          <RouterLink to="/" class="nav-link" :class="{ active: route.path === '/' }" @click="closeMobileMenu">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            Home
          </RouterLink>
        </li>

        <li>
          <RouterLink to="/about" class="nav-link" :class="{ active: route.path === '/about' }" @click="closeMobileMenu">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
            About
          </RouterLink>
        </li>

        <!-- Tools Dropdown -->
        <li class="nav-dropdown-trigger" @mouseenter="activeDropdown = true" @mouseleave="activeDropdown = false">
          <button
            class="nav-link dropdown-toggle"
            :class="{ active: route.path.startsWith('/tools') || route.path.startsWith('/games') || route.path.startsWith('/icebreakers') }"
            type="button"
            @click.prevent="toggleDropdown"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5"/><line x1="13" y1="19" x2="19" y2="13"/><line x1="16" y1="16" x2="20" y2="20"/><line x1="19" y1="13" x2="20" y2="13"/></svg>
            Tools
            <svg class="dropdown-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </button>

          <div class="dropdown-menu" :class="{ active: activeDropdown }">
            <!-- Overview -->
            <RouterLink to="/tools" class="dropdown-item dropdown-item--hero" @click="closeMobileMenu">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
              <span class="dropdown-item-label">
                <span class="dropdown-item-title">All Tools</span>
                <span class="dropdown-item-desc">Browse the full toolkit</span>
              </span>
            </RouterLink>

            <div class="dropdown-divider" />

            <!-- Category: Random & Selection -->
            <span class="dropdown-group-label">Random &amp; Selection</span>
            <RouterLink to="/tools/category/random" class="dropdown-item" @click="closeMobileMenu">Random Tools</RouterLink>
            <RouterLink to="/single-student-picker" class="dropdown-item" @click="closeMobileMenu">Student Picker</RouterLink>
            <RouterLink to="/group-generator" class="dropdown-item" @click="closeMobileMenu">Group Generator</RouterLink>
            <RouterLink to="/lucky-draw" class="dropdown-item" @click="closeMobileMenu">Lucky Draw</RouterLink>

            <div class="dropdown-divider" />

            <!-- Category: Quiz & Assessment -->
            <span class="dropdown-group-label">Quiz &amp; Assessment</span>
            <RouterLink to="/tools/category/quiz" class="dropdown-item" @click="closeMobileMenu">Quiz Tools</RouterLink>
            <RouterLink to="/tools/flashcards" class="dropdown-item" @click="closeMobileMenu">Flashcards</RouterLink>
            <RouterLink to="/tools/bingo-generator" class="dropdown-item" @click="closeMobileMenu">Bingo Generator</RouterLink>

            <div class="dropdown-divider" />

            <!-- Category: Classroom Control -->
            <span class="dropdown-group-label">Classroom Control</span>
            <RouterLink to="/timer" class="dropdown-item" @click="closeMobileMenu">Timer</RouterLink>
            <RouterLink to="/stopwatch" class="dropdown-item" @click="closeMobileMenu">Stopwatch</RouterLink>
            <RouterLink to="/soundboard" class="dropdown-item" @click="closeMobileMenu">Soundboard</RouterLink>

            <div class="dropdown-divider" />

            <!-- Category: Icebreakers & Fun -->
            <span class="dropdown-group-label">Icebreakers &amp; Fun</span>
            <RouterLink to="/tools/icebreakers" class="dropdown-item" @click="closeMobileMenu">Icebreakers</RouterLink>
            <RouterLink to="/tools/category/engagement" class="dropdown-item" @click="closeMobileMenu">Engagement Tools</RouterLink>
            <RouterLink to="/wheel" class="dropdown-item" @click="closeMobileMenu">Spin the Wheel</RouterLink>
            <RouterLink to="/tools/category/games" class="dropdown-item" @click="closeMobileMenu">Games</RouterLink>

            <div class="dropdown-divider" />

            <!-- Voting & Polls -->
            <span class="dropdown-group-label">Polls &amp; Voting</span>
            <RouterLink to="/live-voting" class="dropdown-item" @click="closeMobileMenu">Live Voting</RouterLink>
            <RouterLink to="/vote/live" class="dropdown-item dropdown-item--vote" @click="closeMobileMenu">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/>
              </svg>
              Vote on Polls
            </RouterLink>
            <RouterLink to="/games/history" class="dropdown-item" @click="closeMobileMenu">Game History</RouterLink>
          </div>
        </li>

        <li>
          <RouterLink to="/contact" class="nav-link" :class="{ active: route.path === '/contact' }" @click="closeMobileMenu">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
            Contact
          </RouterLink>
        </li>

        <!-- Mobile auth links -->
        <li v-if="auth.initialized" class="mobile-auth-links">
          <template v-if="auth.isAuthenticated">
            <RouterLink to="/profile" class="nav-link" @click="closeMobileMenu">Profile</RouterLink>
            <RouterLink to="/settings" class="nav-link" @click="closeMobileMenu">Settings</RouterLink>
            <button class="nav-link mobile-logout-btn" type="button" @click="handleLogout">Logout</button>
          </template>
          <template v-else>
            <RouterLink to="/login" class="nav-link mobile-login-btn" @click="closeMobileMenu">Login</RouterLink>
            <RouterLink to="/register" class="nav-link mobile-register-btn" @click="closeMobileMenu">Register</RouterLink>
          </template>
        </li>
      </ul>

      <!-- Right Side: Auth Buttons / Profile -->
      <div class="nav-buttons">
        <template v-if="auth.isAuthenticated">
          <RouterLink to="/live-voting" class="btn btn-vote">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 12 11 14 15 10"/><circle cx="12" cy="12" r="10"/></svg>
            Vote
          </RouterLink>
          <ProfileDropdown />
          <button class="btn btn-logout" type="button" @click="handleLogout" title="Sign out">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          </button>
        </template>
        <template v-else>
          <RouterLink to="/login" class="btn btn-login">Log in</RouterLink>
          <RouterLink to="/register" class="btn btn-register">Get Started</RouterLink>
        </template>
        <button class="mobile-menu-toggle" type="button" :class="{ active: mobileMenuOpen }" @click="toggleMobileMenu" aria-label="Toggle menu">
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>
    </div>
  </nav>
</template>

<style scoped>
/* ────────────── Container ────────────── */
.navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(16px) saturate(180%);
  -webkit-backdrop-filter: blur(16px) saturate(180%);
  border-bottom: 1px solid transparent;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  height: 64px;
}

.navbar.scrolled {
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
  background: rgba(255, 255, 255, 0.95);
  border-bottom-color: #f1f5f9;
}

.nav-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
  height: 64px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* ────────────── Logo ────────────── */
.nav-logo {
  display: flex;
  align-items: center;
  text-decoration: none;
  flex-shrink: 0;
  z-index: 1001;
}

.nav-logo-img {
  height: 52px;
  width: auto;
  object-fit: contain;
  border-radius: 10px;
}

/* Larger logo on desktop */
@media (min-width: 1024px) {
  .nav-logo-img {
    height: 56px;
  }
}

/* ────────────── Nav Menu ────────────── */
.nav-menu {
  display: flex;
  list-style: none;
  align-items: center;
  gap: 4px;
  margin: 0;
  padding: 0;
}

/* ────────────── Nav Link ────────────── */
.nav-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  color: #475569;
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  border-radius: 8px;
  transition: all 0.2s ease;
  border: none;
  background: transparent;
  cursor: pointer;
  position: relative;
  white-space: nowrap;
}

.nav-link svg {
  flex-shrink: 0;
  opacity: 0.7;
}

.nav-link:hover {
  color: #001f9e;
  background: rgba(0, 31, 158, 0.06);
}

.nav-link.active {
  color: #001f9e;
  background: rgba(0, 31, 158, 0.08);
  font-weight: 600;
}

.nav-link.active svg {
  opacity: 1;
}

/* ────────────── Dropdown ────────────── */
.nav-dropdown-trigger {
  position: relative;
}

.dropdown-toggle {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.dropdown-icon {
  transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  opacity: 0.6;
}

.nav-dropdown-trigger:hover .dropdown-icon,
.active .dropdown-icon {
  transform: rotate(180deg);
}

.dropdown-menu {
  position: absolute;
  top: calc(100% + 10px);
  left: 50%;
  transform: translateX(-50%) translateY(8px) scale(0.96);
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 8px;
  min-width: 240px;
  opacity: 0;
  visibility: hidden;
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  z-index: 1002;
}

.dropdown-menu.active {
  opacity: 1;
  visibility: visible;
  transform: translateX(-50%) translateY(0) scale(1);
}

/* ────────────── Group Label ────────────── */
.dropdown-group-label {
  display: block;
  padding: 10px 14px 4px;
  font-size: 10px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #94a3b8;
}

/* ────────────── Dropdown Item ────────────── */
.dropdown-item {
  display: flex;
  align-items: center;
  width: 100%;
  text-align: left;
  padding: 8px 14px;
  color: #475569;
  text-decoration: none;
  font-size: 13px;
  font-weight: 500;
  border-radius: 8px;
  transition: all 0.15s ease;
  border: none;
  background: none;
  cursor: pointer;
  gap: 10px;
  line-height: 1.4;
}

.dropdown-item:hover {
  background: rgba(0, 31, 158, 0.06);
  color: #001f9e;
  padding-left: 18px;
}

/* Hero item (All Tools) */
.dropdown-item--hero {
  padding: 10px 14px;
  background: #f8faff;
  border: 1px solid #eef3ff;
  border-radius: 10px;
  margin-bottom: 2px;
}

.dropdown-item--hero:hover {
  background: #eef3ff;
  border-color: #d0d9f0;
}

.dropdown-item--hero .dropdown-item-title {
  font-size: 14px;
  font-weight: 700;
  color: #001f9e;
}

.dropdown-item--hero .dropdown-item-desc {
  font-size: 11px;
  color: #94a3b8;
}

/* Label group in items */
.dropdown-item-label {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.dropdown-item-title {
  font-size: 13px;
  font-weight: 600;
  color: #1e293b;
}

.dropdown-item-desc {
  font-size: 10px;
  color: #94a3b8;
}

/* Vote item */
.dropdown-item--vote {
  color: #16a34a !important;
  font-weight: 600;
}

.dropdown-item--vote:hover {
  background: rgba(220, 252, 231, 0.5) !important;
  color: #15803d !important;
}

/* ────────────── Divider ────────────── */
.dropdown-divider {
  height: 1px;
  background: #f1f5f9;
  margin: 6px 8px;
}

/* ────────────── Buttons ────────────── */
.nav-buttons {
  display: flex;
  align-items: center;
  gap: 10px;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.2s ease;
  border: none;
  cursor: pointer;
  font-family: inherit;
  white-space: nowrap;
}

/* Login button */
.btn-login {
  background: transparent;
  color: #475569;
  border: 1px solid #e2e8f0;
}

.btn-login:hover {
  background: #f8fafc;
  color: #001f9e;
  border-color: #b0bce0;
}

/* Register button */
.btn-register {
  background: linear-gradient(135deg, #2d4ec4, #001f9e);
  color: white;
  box-shadow: 0 2px 8px rgba(0, 31, 158, 0.25);
}

.btn-register:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 18px rgba(0, 31, 158, 0.35);
}

/* Vote button */
.btn-vote {
  background: linear-gradient(135deg, #22c55e, #16a34a);
  color: white;
  box-shadow: 0 2px 8px rgba(34, 197, 94, 0.25);
  padding: 8px 14px;
  font-size: 13px;
}

.btn-vote:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 18px rgba(34, 197, 94, 0.35);
}

/* Logout button (icon only) */
.btn-logout {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  padding: 0;
  border-radius: 8px;
  background: transparent;
  color: #94a3b8;
  border: 1px solid #e2e8f0;
}

.btn-logout:hover {
  background: #fef2f2;
  color: #ef4444;
  border-color: #fecaca;
}

/* ────────────── Mobile Toggle ────────────── */
.mobile-menu-toggle {
  display: none;
  flex-direction: column;
  gap: 5px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
  z-index: 1001;
}

.mobile-menu-toggle span {
  display: block;
  width: 22px;
  height: 2px;
  background: #64748b;
  transition: all 0.3s ease;
  border-radius: 2px;
}

.mobile-menu-toggle.active span:nth-child(1) {
  transform: rotate(45deg) translate(5px, 5px);
}

.mobile-menu-toggle.active span:nth-child(2) {
  opacity: 0;
}

.mobile-menu-toggle.active span:nth-child(3) {
  transform: rotate(-45deg) translate(5px, -5px);
}

/* ────────────── Mobile Auth Links ────────────── */
.mobile-auth-links {
  display: none;
  padding: 12px 4px 4px;
  border-top: 1px solid #f1f5f9;
  margin-top: auto;
  gap: 6px;
}

.mobile-login-btn,
.mobile-register-btn {
  justify-content: center;
  border-radius: 10px;
  font-weight: 600;
}

.mobile-register-btn {
  background: #001f9e;
  color: white !important;
}

.mobile-register-btn:hover {
  background: #00157a;
}

.mobile-logout-btn {
  justify-content: center;
  color: #ef4444 !important;
  border: 1px solid #fecaca;
  border-radius: 10px;
  background: #fff;
  font-weight: 600;
}

.mobile-logout-btn:hover {
  background: #fef2f2;
}

/* ────────────── Responsive ────────────── */
@media (max-width: 768px) {
  .nav-menu {
    position: fixed;
    top: 64px;
    left: 0;
    right: 0;
    bottom: 0;
    background: white;
    flex-direction: column;
    padding: 16px 20px 24px;
    gap: 2px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
    overflow-y: auto;
    max-height: 0;
    opacity: 0;
    visibility: hidden;
    transform: translateY(-8px);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    z-index: 999;
  }

  .nav-menu.active {
    max-height: calc(100vh - 64px);
    opacity: 1;
    visibility: visible;
    transform: translateY(0);
  }

  .nav-link {
    width: 100%;
    padding: 12px 16px;
    justify-content: flex-start;
    font-size: 15px;
  }

  .nav-link::after {
    display: none;
  }

  .dropdown-menu {
    position: static;
    transform: none;
    background: #f8fafc;
    border: none;
    border-radius: 10px;
    box-shadow: none;
    padding-left: 8px;
    max-height: 0;
    overflow: hidden;
    opacity: 0;
    padding-top: 0;
    padding-bottom: 0;
    margin: 0;
    transition: all 0.25s ease;
    visibility: visible;
  }

  .dropdown-menu.active {
    max-height: 800px;
    opacity: 1;
    padding-top: 4px;
    padding-bottom: 4px;
    margin: 2px 0 4px;
  }

  .dropdown-divider {
    margin: 4px 8px;
  }

  .dropdown-group-label {
    padding-top: 8px;
  }

  .dropdown-item--hero {
    background: transparent;
    border: none;
    padding: 10px 14px;
  }

  .dropdown-item--hero:hover {
    background: rgba(0, 31, 158, 0.06);
  }

  .mobile-auth-links {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .mobile-menu-toggle {
    display: flex;
  }

  .nav-buttons .btn-login,
  .nav-buttons .btn-register,
  .nav-buttons .btn-vote,
  .nav-buttons .btn-logout,
  .nav-buttons .profile-dropdown-wrapper {
    display: none;
  }
}

@media (max-width: 480px) {
  .nav-logo-img {
    height: 44px;
  }

  .nav-container {
    padding: 0 16px;
  }
}
</style>
