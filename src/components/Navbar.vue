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
const activeParticipantsDropdown = ref(false)

const handleScroll = () => {
  isScrolled.value = window.scrollY > 50
}

const toggleMobileMenu = () => {
  mobileMenuOpen.value = !mobileMenuOpen.value
  if (mobileMenuOpen.value) {
    activeDropdown.value = false
    activeParticipantsDropdown.value = false
  }
}

const toggleDropdown = () => {
  activeDropdown.value = !activeDropdown.value
  if (activeDropdown.value) {
    activeParticipantsDropdown.value = false
  }
}

const closeMobileMenu = () => {
  mobileMenuOpen.value = false
  activeDropdown.value = false
  activeParticipantsDropdown.value = false
}

async function handleLogout() {
  await auth.logout()
  mobileMenuOpen.value = false
  await router.replace('/')
}

onMounted(async () => {
  window.addEventListener('scroll', handleScroll)
  await auth.fetchUser()
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>

<template>
  <nav class="navbar" :class="{ scrolled: isScrolled }">
    <div class="nav-container">
      <div class="nav-logo">
        <RouterLink to="/" class="nav-logo-link">
          <img src="@/assets/photo_logo.jpg" alt="Graduation" class="image" />
        </RouterLink>
      </div>

      <ul class="nav-menu" :class="{ active: mobileMenuOpen }">
        <li><RouterLink to="/" class="nav-link" :class="{ active: route.path === '/' }" @click="closeMobileMenu">Home</RouterLink></li>
        <li><RouterLink to="/about" class="nav-link" :class="{ active: route.path === '/about' }" @click="closeMobileMenu">About</RouterLink></li>
        <li class="nav-dropdown-trigger" @mouseenter="activeDropdown = true" @mouseleave="activeDropdown = false">
          <button class="nav-link dropdown-toggle" type="button" @click.prevent="toggleDropdown">
            Tools
            <svg class="dropdown-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </button>
          <div class="dropdown-menu" :class="{ active: activeDropdown }">
            <RouterLink to="/tools" class="dropdown-item" @click="closeMobileMenu">All Tools</RouterLink>
            <RouterLink to="/tools/category/random" class="dropdown-item" @click="closeMobileMenu">Random Tools</RouterLink>
            <RouterLink to="/tools/category/quiz" class="dropdown-item" @click="closeMobileMenu">Quiz &amp; Assessment</RouterLink>
            <RouterLink to="/tools/category/classroom" class="dropdown-item" @click="closeMobileMenu">Classroom Control</RouterLink>
            <RouterLink to="/tools/category/games" class="dropdown-item" @click="closeMobileMenu">Games</RouterLink>
            <RouterLink to="/tools/category/engagement" class="dropdown-item" @click="closeMobileMenu">Engagement</RouterLink>
            <RouterLink to="/tools/category/fun" class="dropdown-item" @click="closeMobileMenu">Fun Activities</RouterLink>
            <div class="dropdown-divider"></div>
            <RouterLink to="/live-voting" class="dropdown-item" @click="closeMobileMenu">📊 Live Voting</RouterLink>
          </div>
        </li>
        <li class="nav-dropdown-trigger" @mouseenter="activeParticipantsDropdown = true" @mouseleave="activeParticipantsDropdown = false">
          <button class="nav-link dropdown-toggle" type="button" @click.prevent="activeParticipantsDropdown = !activeParticipantsDropdown">
            Participants
            <svg class="dropdown-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </button>
          <div class="dropdown-menu" :class="{ active: activeParticipantsDropdown }">
            <RouterLink to="/participants/theme" class="dropdown-item" @click="closeMobileMenu">Theme</RouterLink>
          </div>
        </li>
        <li><RouterLink to="/contact" class="nav-link" :class="{ active: route.path === '/contact' }" @click="closeMobileMenu">Contact</RouterLink></li>
      

        <!-- Mobile auth links (visible only in mobile menu) -->
        <li v-if="!auth.isAuthenticated" class="mobile-auth-links">
          <RouterLink to="/login" class="nav-link mobile-login-btn" @click="closeMobileMenu">Login</RouterLink>
          <RouterLink to="/register" class="nav-link mobile-register-btn" @click="closeMobileMenu">Register</RouterLink>
        </li>
        <li v-else class="mobile-auth-links">
          <RouterLink to="/profile" class="nav-link" @click="closeMobileMenu">Profile</RouterLink>
          <RouterLink to="/settings" class="nav-link" @click="closeMobileMenu">Settings</RouterLink>
          <button class="nav-link mobile-logout-btn" type="button" @click="handleLogout">Logout</button>
        </li>
      </ul>

      <div class="nav-buttons">
        <template v-if="auth.isAuthenticated">
          <ProfileDropdown />
        </template>
        <template v-else>
          <RouterLink to="/login" class="btn btn-login">Login</RouterLink>
          <RouterLink to="/register" class="btn btn-register">Register</RouterLink>
        </template>
        <button class="mobile-menu-toggle" type="button" :class="{ active: mobileMenuOpen }" @click="toggleMobileMenu">
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>
    </div>
  </nav>
</template>

<style scoped>
.navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  border-bottom: 1px solid transparent;
  transition: all 0.3s ease;
  height: 64px;
}

.navbar.scrolled {
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
  background: rgba(255, 255, 255, 0.98);
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

.nav-logo {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 20px;
  font-weight: 700;
  color: #1e293b;
  z-index: 1001;
  text-decoration: none;
}

.nav-logo-link {
  text-decoration: none;
  display: flex;
  align-items: center;
}

.nav-logo .image {
  width: 200px;
  height: 200px;
  object-fit: contain;
}

.nav-menu {
  display: flex;
  list-style: none;
  align-items: center;
  gap: 8px;
  margin: 0;
  padding: 0;
}

.nav-link {
  display: inline-flex;
  align-items: center;
  padding: 8px 14px;
  color: #475569;
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  border-radius: 6px;
  transition: all 0.2s ease;
  border: none;
  background: transparent;
  cursor: pointer;
  gap: 4px;
  position: relative;
}

.nav-link:hover {
  color: #2563eb;
  background: rgba(248, 250, 252, 0.8);
}

.nav-link.active {
  color: #2563eb;
  background: rgba(248, 250, 252, 0.8);
}

.nav-link--vote {
  color: #16a34a !important;
  font-weight: 600;
}

.nav-link--vote:hover {
  color: #15803d !important;
  background: rgba(220, 252, 231, 0.6) !important;
}

.nav-link::after {
  content: '';
  position: absolute;
  bottom: 2px;
  left: 14px;
  right: 14px;
  height: 2px;
  background: #2563eb;
  border-radius: 1px;
  transform: scaleX(0);
  transition: transform 0.2s ease;
}

.nav-link:hover::after,
.nav-link.active::after {
  transform: scaleX(1);
}

.nav-dropdown-trigger {
  position: relative;
}

.dropdown-toggle {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.dropdown-icon {
  transition: transform 0.2s ease;
}

.nav-dropdown-trigger:hover .dropdown-icon {
  transform: rotate(180deg);
}

.dropdown-menu {
  position: absolute;
  top: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%) translateY(8px) scale(0.96);
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 6px;
  min-width: 220px;
  opacity: 0;
  visibility: hidden;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.12);
  z-index: 1002;
}

.dropdown-menu.active {
  opacity: 1;
  visibility: visible;
  transform: translateX(-50%) translateY(0) scale(1);
}

.dropdown-item {
  display: flex;
  align-items: center;
  width: 100%;
  text-align: left;
  padding: 10px 14px;
  color: #475569;
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  border-radius: 8px;
  transition: all 0.15s ease;
  border: none;
  background: none;
  cursor: pointer;
  gap: 8px;
}

.dropdown-item:hover {
  background: #f8fafc;
  color: #2563eb;
  padding-left: 18px;
}

.dropdown-divider {
  height: 1px;
  background: #f1f5f9;
  margin: 4px 0;
}


.nav-buttons {
  display: flex;
  align-items: center;
  gap: 14px;
}

.btn-login {
  background: transparent;
  color: #475569;
  border: 1px solid #e2e8f0;
  backdrop-filter: blur(10px);
  border-radius: 8px;
  padding: 8px 18px;
  font-size: 14px;
  font-weight: 500;
  text-decoration: none;
  transition: all 0.2s ease;
}

.btn-login:hover {
  background: #f8fafc;
  color: #2563eb;
  border-color: #cbd5e1;
}

.btn-register {
  background: #2563eb;
  color: white;
  border-radius: 8px;
  padding: 8px 18px;
  font-size: 14px;
  font-weight: 600;
  box-shadow: 0 1px 3px rgba(37, 99, 235, 0.2);
  text-decoration: none;
  transition: all 0.2s ease;
}

.btn-register:hover {
  background: #1d4ed8;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
}

.btn-logout {
  background: transparent;
  color: #ef4444;
  border: 1px solid #fecaca;
  border-radius: 8px;
  padding: 8px 18px;
  font-size: 14px;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.2s ease;
}

.btn-logout:hover {
  background: #fef2f2;
  border-color: #fca5a5;
  transform: translateY(-1px);
}

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
  width: 24px;
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
  transform: rotate(-45deg) translate(6px, -6px);
}

/* Mobile auth links inside the nav menu */
.mobile-auth-links {
  display: none;
  padding: 8px 4px 4px;
  border-top: 1px solid #f1f5f9;
  margin-top: 4px;
  gap: 10px;
}

.mobile-login-btn,
.mobile-register-btn {
  justify-content: center;
  border-radius: 8px;
  font-weight: 600;
}

.mobile-register-btn {
  background: #2563eb;
  color: white !important;
}

.mobile-register-btn:hover {
  background: #1d4ed8;
}

.mobile-logout-btn {
  justify-content: center;
  color: #ef4444 !important;
  border: 1px solid #fecaca;
  border-radius: 8px;
  background: #fff;
  font-weight: 600;
}

.mobile-logout-btn:hover {
  background: #fef2f2;
}

@media (max-width: 768px) {
  .nav-menu {
    position: fixed;
    top: 64px;
    left: 0;
    right: 0;
    background: white;
    flex-direction: column;
    padding: 20px;
    gap: 4px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
    border-bottom: 1px solid #f1f5f9;
    max-height: 0;
    max-width: 100vw;
    overflow: hidden;
    opacity: 0;
    transform: translateY(-8px);
    transition: all 0.3s ease;
    z-index: 999;
  }

  .nav-menu.active {
    max-height: calc(100vh - 64px);
    opacity: 1;
    transform: translateY(0);
  }

  .nav-link {
    width: 100%;
    padding: 12px 16px;
    justify-content: flex-start;
  }

  .nav-link::after {
    display: none;
  }

  .dropdown-menu {
    position: static;
    transform: none;
    background: #f8fafc;
    padding-left: 16px;
    max-height: 0;
    max-width: 100vw;
    overflow: hidden;
    opacity: 0;
    padding-top: 0;
    padding-bottom: 0;
    transition: all 0.25s ease;
  }

  .dropdown-menu.active {
    max-height: 500px;
    opacity: 1;
    padding-top: 4px;
    padding-bottom: 4px;
  }

  .mobile-auth-links {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .mobile-menu-toggle {
    display: flex;
  }

  .nav-buttons .btn,
  .nav-buttons .profile-dropdown-wrapper,
  .nav-buttons .btn-logout {
    display: none;
  }
}
</style>
