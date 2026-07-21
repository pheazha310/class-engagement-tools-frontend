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
      <span class="profile-avatar-ring">
        <span v-if="profileImageUrl" class="profile-avatar profile-avatar--image">
          <img :src="profileImageUrl" :alt="auth.userName" class="profile-avatar-img" />
        </span>
        <span v-else class="profile-avatar">
          {{ displayInitials }}
        </span>
      </span>
      <span class="profile-name">{{ auth.userName }}</span>
      <svg
        class="profile-chevron"
        :class="{ 'profile-chevron--open': isOpen }"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <polyline points="6 9 12 15 18 9"></polyline>
      </svg>
    </button>

    <Transition name="dropdown">
      <div
        v-if="isOpen"
        ref="dropdownRef"
        class="dropdown-menu"
      >
        <!-- Header -->
        <div class="dropdown-header">
          <span class="dropdown-header-avatar-ring">
            <span v-if="profileImageUrl" class="dropdown-header-avatar dropdown-header-avatar--image">
              <img :src="profileImageUrl" :alt="auth.userName" class="dropdown-header-avatar-img" />
            </span>
            <span v-else class="dropdown-header-avatar">
              {{ displayInitials }}
            </span>
          </span>
          <div class="dropdown-header-info">
            <span class="dropdown-header-name">{{ auth.userName }}</span>
            <span class="dropdown-header-email">{{ auth.user?.email }}</span>
          </div>
        </div>

        <div class="dropdown-divider"></div>

        <!-- Menu Items -->
        <div class="dropdown-items">
          <!-- Profile -->
          <button class="dropdown-item" type="button" @click="goToProfile">
            <span class="dropdown-item-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </span>
            <span class="dropdown-item-label">
              <span class="dropdown-item-title">Profile</span>
              <span class="dropdown-item-desc">Manage your account</span>
            </span>
          </button>

          <!-- Settings -->
          <button class="dropdown-item" type="button" @click="goToSettings">
            <span class="dropdown-item-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
              </svg>
            </span>
            <span class="dropdown-item-label">
              <span class="dropdown-item-title">Settings</span>
              <span class="dropdown-item-desc">Preferences &amp; security</span>
            </span>
          </button>
        </div>

        <div class="dropdown-divider"></div>

        <!-- Logout -->
        <button class="dropdown-item dropdown-item--danger" type="button" @click="handleLogout">
          <span class="dropdown-item-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
          </span>
          <span class="dropdown-item-label">
            <span class="dropdown-item-title">Logout</span>
            <span class="dropdown-item-desc">Sign out of your account</span>
          </span>
        </button>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.profile-dropdown-wrapper {
  position: relative;
  flex-shrink: 0;
}

/* ─────────── Trigger Button ─────────── */
.profile-trigger {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 10px 5px 5px;
  background: transparent;
  border: 1px solid #e2e8f0;
  border-radius: 999px;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  font-family: inherit;
  color: #1e293b;
  white-space: nowrap;
}

.profile-trigger:hover {
  border-color: #cbd5e1;
  background: #f8fafc;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}

.profile-trigger:active {
  transform: scale(0.97);
}

/* ─────────── Avatar Ring ─────────── */
.profile-avatar-ring {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  flex-shrink: 0;
  overflow: hidden;
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.06);
}

.profile-avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: white;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.02em;
  flex-shrink: 0;
  overflow: hidden;
  user-select: none;
}

.profile-avatar--image {
  background: #fff;
}

.profile-avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* ─────────── User Name ─────────── */
.profile-name {
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
  max-width: 110px;
  overflow: hidden;
  text-overflow: ellipsis;
  color: #1e293b;
  line-height: 1;
}

/* ─────────── Chevron ─────────── */
.profile-chevron {
  color: #94a3b8;
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  flex-shrink: 0;
}

.profile-chevron--open {
  transform: rotate(180deg);
}

/* ─────────── Dropdown Menu ─────────── */
.dropdown-menu {
  position: absolute;
  top: calc(100% + 10px);
  right: 0;
  width: 260px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 6px;
  box-shadow:
    0 12px 32px rgba(0, 0, 0, 0.1),
    0 4px 8px rgba(0, 0, 0, 0.04);
  z-index: 1002;
  transform-origin: top right;
}

/* ─────────── Dropdown Transitions ─────────── */
.dropdown-enter-active {
  animation: dropdownIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

.dropdown-leave-active {
  animation: dropdownOut 0.15s ease forwards;
}

@keyframes dropdownIn {
  from {
    opacity: 0;
    transform: translateY(-6px) scale(0.96);
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
    transform: translateY(-6px) scale(0.96);
  }
}

/* ─────────── Dropdown Header ─────────── */
.dropdown-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 12px 10px;
}

.dropdown-header-avatar-ring {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  flex-shrink: 0;
  overflow: hidden;
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.08);
}

.dropdown-header-avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: white;
  font-size: 15px;
  font-weight: 700;
  flex-shrink: 0;
  overflow: hidden;
  user-select: none;
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
  gap: 2px;
}

.dropdown-header-name {
  font-size: 14px;
  font-weight: 600;
  color: #0f172a;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 1.3;
}

.dropdown-header-email {
  font-size: 12px;
  color: #94a3b8;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 1.3;
}

/* ─────────── Divider ─────────── */
.dropdown-divider {
  height: 1px;
  background: #f1f5f9;
  margin: 4px 0;
}

/* ─────────── Dropdown Items Container ─────────── */
.dropdown-items {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 2px 0;
}

/* ─────────── Dropdown Item ─────────── */
.dropdown-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  text-align: left;
  padding: 9px 10px;
  color: #475569;
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  border-radius: 9px;
  transition: all 0.15s ease;
  border: none;
  background: none;
  cursor: pointer;
  font-family: inherit;
  line-height: 1.3;
}

.dropdown-item:hover {
  background: #f8fafc;
}

.dropdown-item:active {
  background: #f1f5f9;
}

/* Icon */
.dropdown-item-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: #f8fafc;
  color: #64748b;
  flex-shrink: 0;
  transition: all 0.15s ease;
}

.dropdown-item:hover .dropdown-item-icon {
  background: #eef2ff;
  color: #6366f1;
}

/* Label group */
.dropdown-item-label {
  display: flex;
  flex-direction: column;
  min-width: 0;
  gap: 1px;
}

.dropdown-item-title {
  font-size: 13px;
  font-weight: 600;
  color: #1e293b;
  transition: color 0.15s ease;
}

.dropdown-item:hover .dropdown-item-title {
  color: #0f172a;
}

.dropdown-item-desc {
  font-size: 11px;
  color: #94a3b8;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition: color 0.15s ease;
}

.dropdown-item:hover .dropdown-item-desc {
  color: #64748b;
}

/* ─────────── Danger Item (Logout) ─────────── */
.dropdown-item--danger .dropdown-item-icon {
  background: #fef2f2;
  color: #ef4444;
}

.dropdown-item--danger:hover .dropdown-item-icon {
  background: #fef2f2;
  color: #dc2626;
}

.dropdown-item--danger .dropdown-item-title {
  color: #ef4444;
}

.dropdown-item--danger:hover .dropdown-item-title {
  color: #dc2626;
}

.dropdown-item--danger .dropdown-item-desc {
  color: #fca5a5;
}

.dropdown-item--danger:hover .dropdown-item-desc {
  color: #f87171;
}

.dropdown-item--danger:hover {
  background: #fef2f2;
}

.dropdown-item--danger:active {
  background: #fee2e2;
}
</style>
