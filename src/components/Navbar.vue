<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'

const router = useRouter()
const route = useRoute()

const mobileMenuOpen = ref(false)
const isScrolled = ref(false)
const activeDropdown = ref(false)
const activeParticipantsDropdown = ref(false)
const user = ref<{ name: string } | null>(null)

const handleScroll = () => {
  isScrolled.value = window.scrollY > 50
}

const toggleMobileMenu = () => {
  mobileMenuOpen.value = !mobileMenuOpen.value
}

const toggleDropdown = () => {
  activeDropdown.value = !activeDropdown.value
}

const closeDropdown = () => {
  activeDropdown.value = false
}

async function checkAuth() {
  try {
    const res = await fetch('/api/user', { credentials: 'include' })
    if (res.ok) {
      const data = await res.json()
      user.value = data.data ?? data
    }
  } catch {
    // not authenticated
  }
}

async function logout() {
  try {
    await fetch('/api/logout', { method: 'POST', credentials: 'include' })
  } catch {
    // ignore
  }
  user.value = null
  router.push('/')
}

onMounted(checkAuth)
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
        <li><RouterLink to="/" class="nav-link" :class="{ active: route.path === '/' }">Home</RouterLink></li>
        <li><RouterLink to="/about" class="nav-link" :class="{ active: route.path === '/about' }">About</RouterLink></li>
        <li class="nav-dropdown-trigger" @mouseenter="activeDropdown = true" @mouseleave="activeDropdown = false">
          <button class="nav-link dropdown-toggle" @click.prevent="toggleDropdown">
            Tools
            <svg class="dropdown-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </button>
           <div class="dropdown-menu" :class="{ active: activeDropdown }">
             <RouterLink to="/tools" class="dropdown-item">All Tools</RouterLink>
             <RouterLink to="/tools/category/random" class="dropdown-item">Random Tools</RouterLink>
             <RouterLink to="/tools/category/quiz" class="dropdown-item">Quiz & Assessment</RouterLink>
             <RouterLink to="/tools/category/classroom" class="dropdown-item">Classroom Control</RouterLink>
             <RouterLink to="/tools/category/games" class="dropdown-item">Games</RouterLink>
             <RouterLink to="/tools/category/engagement" class="dropdown-item">Engagement</RouterLink>
             <RouterLink to="/tools/category/fun" class="dropdown-item">Fun Activities</RouterLink>
            </div>
         </li>
         <li class="nav-dropdown-trigger" @mouseenter="activeParticipantsDropdown = true" @mouseleave="activeParticipantsDropdown = false">
           <button class="nav-link dropdown-toggle" @click.prevent="activeParticipantsDropdown = !activeParticipantsDropdown">
             Participants
             <svg class="dropdown-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
               <polyline points="6 9 12 15 18 9"></polyline>
             </svg>
           </button>
            <div class="dropdown-menu" :class="{ active: activeParticipantsDropdown }">
              <RouterLink to="/participants/theme" class="dropdown-item">Theme</RouterLink>
            </div>
         </li>
         <li><RouterLink to="/contact" class="nav-link" :class="{ active: route.path === '/contact' }">Contact</RouterLink></li>
      </ul>

      <div class="nav-buttons">
        <template v-if="user">
          <RouterLink to="/profile" class="btn btn-login">{{ user.name }}</RouterLink>
          <button class="btn btn-register" @click="logout">Logout</button>
        </template>
        <template v-else>
          <RouterLink to="/login" class="btn btn-login">Login</RouterLink>
          <RouterLink to="/register" class="btn btn-register">Register</RouterLink>
        </template>
        <button class="mobile-menu-toggle" :class="{ active: mobileMenuOpen }" @click="toggleMobileMenu">
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
}

.btn-register:hover {
  background: #1d4ed8;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
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
    justify-content: space-between;
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

  .dropdown-toggle::after {
    content: '';
    border: none;
  }

  .nav-logo-tagline {
    display: none;
  }

  .nav-buttons {
    display: flex;
    gap: 14px;
  }

  .btn-login {
    background: transparent;
    color: #475569;
    border: 1.5px solid #e2e8f0;
    border-radius: 999px;
    padding: 10px 20px;
    font-size: 14px;
    font-weight: 500;
    transition: all 0.25s ease;
    text-decoration: none;
  }

  .btn-login:hover {
    background: rgba(248, 250, 252, 0.9);
    color: #2563eb;
    border-color: #2563eb;
  }

  .btn-register {
    background: #2563eb;
    color: white;
    border: none;
    border-radius: 999px;
    padding: 10px 24px;
    font-size: 14px;
    font-weight: 600;
    box-shadow: 0 2px 8px rgba(37, 99, 235, 0.25);
    transition: all 0.25s ease;
    text-decoration: none;
  }

  .btn-register:hover {
    background: #1d4ed8;
    transform: translateY(-1px);
    box-shadow: 0 6px 18px rgba(37, 99, 235, 0.35);
  }

  .mobile-menu-toggle {
    display: flex;
  }

  .nav-buttons .btn {
    display: inline-flex;
    padding: 8px 16px;
    font-size: 14px;
  }

  .mobile-menu-toggle {
    display: flex;
  }
}
</style>
