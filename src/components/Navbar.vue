<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { categories } from '@/data/toolsData'
import ProfileDropdown from '@/components/ProfileDropdown.vue'

defineOptions({
  name: 'AppNavbar',
})

const route = useRoute()
const auth = useAuthStore()

const mobileMenuOpen = ref(false)
const isScrolled = ref(false)
const activeDropdown = ref(false)

// Track which categories are expanded in the dropdown
const expandedCategories = ref<Set<string>>(new Set())

function toggleCategory(slug: string) {
  const s = expandedCategories.value
  if (s.has(slug)) {
    s.delete(slug)
  } else {
    s.add(slug)
  }
  // Trigger reactivity by replacing the Set
  expandedCategories.value = new Set(s)
}

function isCategoryExpanded(slug: string): boolean {
  return expandedCategories.value.has(slug)
}

// Close all categories when dropdown closes
function closeAllCategories() {
  expandedCategories.value = new Set()
}

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
            <RouterLink to="/tools" class="dropdown-item dropdown-item--hero" @click="closeMobileMenu(); closeAllCategories()">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
              <span class="dropdown-item-label">
                <span class="dropdown-item-title">All Tools</span>
                <span class="dropdown-item-desc">Browse the full toolkit</span>
              </span>
            </RouterLink>

            <div class="dropdown-divider" />

            <!-- ===== Dynamic Category Sections (collapsible) ===== -->
            <div v-for="cat in categories" :key="cat.slug" class="dropdown-category">
              <button
                class="dropdown-category-btn"
                type="button"
                @click="toggleCategory(cat.slug)"
              >
                <span class="dropdown-category-label">
                  <span class="dropdown-category-icon">{{ cat.icon }}</span>
                  <span>{{ cat.name }}</span>
                </span>
                <svg
                  class="dropdown-category-chevron"
                  :class="{ expanded: isCategoryExpanded(cat.slug) }"
                  width="12" height="12" viewBox="0 0 24 24"
                  fill="none" stroke="currentColor" stroke-width="2.5"
                  stroke-linecap="round" stroke-linejoin="round"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              <!-- Sub-items (tools) inside this category -->
              <div class="dropdown-submenu" :class="{ open: isCategoryExpanded(cat.slug) }">
                <RouterLink
                  v-for="tool in cat.tools"
                  :key="tool.slug"
                  :to="tool.route || '/tools/' + tool.slug"
                  class="dropdown-submenu-item"
                  @click="closeMobileMenu"
                >
                  <span class="dropdown-submenu-icon">{{ tool.icon }}</span>
                  <span class="dropdown-submenu-label">
                    <span class="dropdown-submenu-title">{{ tool.title }}</span>
                    <span class="dropdown-submenu-desc">{{ tool.description }}</span>
                  </span>
                </RouterLink>
              </div>
            </div>

            <div class="dropdown-divider" />

            <!-- Voting & Polls (always visible) -->
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
        <li><RouterLink to="/contact" class="nav-link" :class="{ active: route.path === '/contact' }" @click="closeMobileMenu">Contact</RouterLink></li>

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
  background: #ffffff;
  border-bottom: 1px solid #e8ecf4;
  transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
  height: 68px;
}

.navbar.scrolled {
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
  border-bottom-color: #dce0ec;
}

.nav-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 28px;
  height: 68px;
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
  height: 64px;
  width: auto;
  object-fit: contain;
  display: block;
  transition: opacity 0.2s ease;
}


.nav-logo:hover .nav-logo-img {
  opacity: 0.85;

}

/* Larger logo on desktop */
@media (min-width: 1024px) {
  .nav-logo-img {
    height: 100px;
  }
}

/* ────────────── Nav Menu ────────────── */
.nav-menu {
  display: flex;
  list-style: none;
  align-items: center;
  gap: 2px;
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

.nav-link::after {
  content: '';
  position: absolute;
  bottom: 2px;
  left: 50%;
  width: 0;
  height: 2.5px;
  border-radius: 999px;
  background: #001f9e;
  transform: translateX(-50%);
  transition: width 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  opacity: 0;
}

.nav-link:hover::after,
.nav-link.active::after {
  width: 60%;
  opacity: 1;
}

.nav-link svg {
  flex-shrink: 0;
  opacity: 0.7;
  transition: opacity 0.2s;
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
  top: calc(100% + 12px);
  left: 50%;
  transform: translateX(-50%) translateY(10px) scale(0.95);
  background: #ffffff;
  border: 1px solid #e0e6f0;
  border-radius: 16px;
  padding: 8px;
  min-width: 260px;
  opacity: 0;
  visibility: hidden;
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: 0 24px 56px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(0, 31, 158, 0.04);
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
  background: linear-gradient(135deg, #f8faff, #f0f5ff);
  border: 1px solid #e8edf8;
  border-radius: 10px;
  margin-bottom: 2px;
}

.dropdown-item--hero:hover {
  background: #eef3ff !important;
  border-color: #c8d4f0;
  padding-left: 14px !important;
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

/* ────────────── Category Sections (collapsible) ────────────── */
.dropdown-category {
  padding: 1px 8px;
}

.dropdown-category-btn {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 9px 10px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: #475569;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
  font-family: inherit;
  text-align: left;
}

.dropdown-category-btn:hover {
  background: rgba(0, 31, 158, 0.05);
  color: #001f9e;
}

.dropdown-category-label {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.dropdown-category-icon {
  font-size: 16px;
  line-height: 1;
  flex-shrink: 0;
}

.dropdown-category-chevron {
  flex-shrink: 0;
  color: #94a3b8;
  transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.dropdown-category-chevron.expanded {
  transform: rotate(180deg);
  color: #001f9e;
}

.dropdown-submenu {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.dropdown-submenu.open {
  max-height: 280px;
}

.dropdown-submenu-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 10px 7px 34px;
  border-radius: 8px;
  text-decoration: none;
  color: #475569;
  font-size: 12px;
  font-weight: 500;
  transition: all 0.15s ease;
}

.dropdown-submenu-item:hover {
  background: rgba(0, 31, 158, 0.05);
  color: #001f9e;
}

.dropdown-submenu-icon {
  font-size: 14px;
  line-height: 1;
  flex-shrink: 0;
}

.dropdown-submenu-label {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}

.dropdown-submenu-title {
  font-size: 12px;
  font-weight: 600;
  color: #1e293b;
}

.dropdown-submenu-item:hover .dropdown-submenu-title {
  color: #001f9e;
}

.dropdown-submenu-desc {
  font-size: 10px;
  color: #94a3b8;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
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

/* Login button — premium outline */
.btn-login {
  background: #ffffff;
  color: #475569;
  border: 1.5px solid #d0d6e8;
  font-weight: 600;
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

.btn-login:hover {
  border-color: #001f9e;
  color: #001f9e;
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(0, 31, 158, 0.12);
}

.btn-login:active {
  transform: translateY(0);
  box-shadow: 0 2px 6px rgba(0, 31, 158, 0.08);
}

/* Register / Get Started button — premium gradient */
.btn-register {
  background: linear-gradient(135deg, #2d4ec4 0%, #001f9e 100%);
  color: white;
  font-weight: 700;
  padding: 10px 22px;
  position: relative;
  overflow: hidden;
  box-shadow: 0 4px 14px rgba(0, 31, 158, 0.25);
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

.btn-register::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.12), transparent);
  opacity: 0;
  transition: opacity 0.25s ease;
  pointer-events: none;
}

.btn-register:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 31, 158, 0.35);
}

.btn-register:hover::before {
  opacity: 1;
}

.btn-register:active {
  transform: translateY(0);
  box-shadow: 0 4px 12px rgba(0, 31, 158, 0.2);
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
  border-radius: 8px;
  transition: background 0.2s;
}

.mobile-menu-toggle:hover {
  background: rgba(0, 31, 158, 0.06);
}

.mobile-menu-toggle span {
  display: block;
  width: 22px;
  height: 2.5px;
  background: #475569;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: 2px;
}

.mobile-menu-toggle.active span {
  background: #001f9e;
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
  border-top: 1px solid #e8ecf4;
  margin-top: auto;
  gap: 6px;
}

.mobile-login-btn,
.mobile-register-btn {
  justify-content: center;
  border-radius: 10px;
  font-weight: 600;
}

.mobile-login-btn {
  border: 1.5px solid #d0d6e8;
  color: #001f9e !important;
  background: #fff !important;
}

.mobile-login-btn:hover {
  border-color: #001f9e !important;
  box-shadow: 0 4px 12px rgba(0, 31, 158, 0.1) !important;
}

.mobile-register-btn {
  background: linear-gradient(135deg, #2d4ec4, #001f9e);
  color: white !important;
  box-shadow: 0 4px 12px rgba(0, 31, 158, 0.2);
}

.mobile-register-btn:hover {
  box-shadow: 0 6px 18px rgba(0, 31, 158, 0.3);
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
    top: 68px;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(255, 255, 255, 0.98);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    flex-direction: column;
    padding: 20px 24px 24px;
    gap: 2px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
    overflow-y: auto;
    max-height: 0;
    opacity: 0;
    visibility: hidden;
    transform: translateY(-12px);
    transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
    z-index: 999;
  }

  .nav-menu.active {
    max-height: calc(100vh - 68px);
    opacity: 1;
    visibility: visible;
    transform: translateY(0);
  }

  .nav-link {
    width: 100%;
    padding: 14px 16px;
    justify-content: flex-start;
    font-size: 15px;
    border-radius: 10px;
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
  .nav-buttons .btn-logout {
    display: none;
  }
}

@media (max-width: 480px) {
  .nav-logo-img {
    height: 56px;
  }

  .nav-container {
    padding: 0 16px;
  }
}
</style>
