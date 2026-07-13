<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { onClickOutside } from '@vueuse/core'
import { useAuthStore } from '@/stores/auth'

defineOptions({
  name: 'ProfileDropdown',
})

const router = useRouter()
const auth = useAuthStore()

const isOpen = ref(false)
const triggerRef = ref<HTMLElement | null>(null)
const dropdownRef = ref<HTMLElement | null>(null)

const profileImageUrl = computed(() => auth.profileImageUrl)

const displayInitials = computed(() => {
  const initials = auth.userInitials
  return initials || '?'
})

function toggle() {
  isOpen.value = !isOpen.value
}

function close() {
  isOpen.value = false
}

onClickOutside(triggerRef, (event) => {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target as Node)) {
    isOpen.value = false
  }
})

function goToProfile() {
  close()
  router.push('/profile')
}

function goToSettings() {
  close()
  router.push('/settings')
}

async function handleLogout() {
  close()
  await auth.logout()
  await router.replace('/')
}
</script>

<template>
  <div ref="triggerRef" class="profile-dropdown-wrapper">
    <button
      class="profile-trigger"
      type="button"
      @click="toggle"
      :aria-expanded="isOpen"
      aria-label="Profile menu"
    >
      <span v-if="profileImageUrl" class="profile-avatar profile-avatar--image">
        <img :src="profileImageUrl" :alt="auth.userName" class="profile-avatar-img" />
      </span>
      <span v-else class="profile-avatar">
        {{ displayInitials }}
      </span>
    </button>

    <Transition
      enter-active-class="dropdown-enter"
      leave-active-class="dropdown-leave"
    >
      <div
        v-if="isOpen"
        ref="dropdownRef"
        class="dropdown-menu"
      >
        <!-- Header -->
        <div class="dropdown-header">
          <span v-if="profileImageUrl" class="dropdown-header-avatar dropdown-header-avatar--image">
            <img :src="profileImageUrl" :alt="auth.userName" class="dropdown-header-avatar-img" />
          </span>
          <span v-else class="dropdown-header-avatar">
            {{ displayInitials }}
          </span>
          <div class="dropdown-header-info">
            <span class="dropdown-header-name">{{ auth.userName }}</span>
            <span class="dropdown-header-email">{{ auth.user?.email }}</span>
          </div>
        </div>

        <div class="dropdown-divider"></div>

        <!-- Profile -->
        <button class="dropdown-item" type="button" @click="goToProfile">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
          Profile
        </button>

        <!-- Settings -->
        <button class="dropdown-item" type="button" @click="goToSettings">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="3"></circle>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
          </svg>
          Settings
        </button>

        <div class="dropdown-divider"></div>

        <!-- Logout -->
        <button class="dropdown-item dropdown-item--danger" type="button" @click="handleLogout">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
            <polyline points="16 17 21 12 16 7"></polyline>
            <line x1="21" y1="12" x2="9" y2="12"></line>
          </svg>
          Logout
        </button>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.profile-dropdown-wrapper {
  position: relative;
}

.profile-trigger {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  padding: 0;
  background: transparent;
  border: 2px solid #e2e8f0;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s ease;
  overflow: hidden;
  font-family: inherit;
}

.profile-trigger:hover {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
  transform: scale(1.05);
}

.profile-trigger:active {
  transform: scale(0.95);
}

.profile-avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: linear-gradient(135deg, #2563eb, #7c3aed);
  color: white;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.02em;
  flex-shrink: 0;
  overflow: hidden;
}

.profile-avatar--image {
  background: #fff;
}

.profile-avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* Dropdown Menu */
.dropdown-menu {
  position: absolute;
  top: calc(100% + 10px);
  right: 0;
  width: 240px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 6px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.12), 0 4px 12px rgba(0, 0, 0, 0.06);
  z-index: 1002;
  transform-origin: top right;
}

/* Transitions */
.dropdown-enter {
  animation: dropdownIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

.dropdown-leave {
  animation: dropdownOut 0.15s ease forwards;
}

@keyframes dropdownIn {
  from {
    opacity: 0;
    transform: translateY(-8px) scale(0.96);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes dropdownOut {
  from {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
  to {
    opacity: 0;
    transform: translateY(-8px) scale(0.96);
  }
}

.dropdown-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
}

.dropdown-header-avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #2563eb, #7c3aed);
  color: white;
  font-size: 14px;
  font-weight: 700;
  flex-shrink: 0;
  overflow: hidden;
}

.dropdown-header-avatar--image {
  background: #fff;
}

.dropdown-header-avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.dropdown-header-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.dropdown-header-name {
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dropdown-header-email {
  font-size: 12px;
  color: #94a3b8;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dropdown-divider {
  height: 1px;
  background: #f1f5f9;
  margin: 4px 0;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  text-align: left;
  padding: 10px 12px;
  color: #475569;
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  border-radius: 8px;
  transition: all 0.15s ease;
  border: none;
  background: none;
  cursor: pointer;
  font-family: inherit;
}

.dropdown-item:hover {
  background: #f8fafc;
  color: #2563eb;
}

.dropdown-item--danger {
  color: #ef4444;
}

.dropdown-item--danger:hover {
  background: #fef2f2;
  color: #dc2626;
}
</style>
