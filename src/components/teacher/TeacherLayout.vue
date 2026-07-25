<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import TeacherIcon from './TeacherIcon.vue'

const router = useRouter()
const authStore = useAuthStore()

const props = withDefaults(
  defineProps<{
    sidebarActive?: string
    pageTitle?: string
    pageSubtitle?: string
    showSearch?: boolean
    searchValue?: string
    searchPlaceholder?: string
    teacherName?: string
    teacherRole?: string
    hideTopbar?: boolean
  }>(),
  {
    sidebarActive: 'dashboard',
    pageTitle: '',
    pageSubtitle: '',
    showSearch: true,
    searchValue: '',
    searchPlaceholder: 'Search...',
    teacherName: '',
    teacherRole: 'Senior Instructor',
    hideTopbar: false,
  },
)

const emit = defineEmits<{
  'update:searchValue': [value: string]
}>()

const currentHour = ref(new Date().getHours())

const displayName = computed(() => props.teacherName || authStore.user?.name || 'Dr. Sarah Miller')

const initials = computed(() =>
  displayName.value
    .split(/\s+/)
    .filter(Boolean)
    .slice(-2)
    .map((p) => p[0])
    .join('')
    .toUpperCase(),
)

const displayTitle = computed(() => {
  if (props.pageTitle) return props.pageTitle
  const greeting =
    currentHour.value < 12
      ? 'Good Morning'
      : currentHour.value < 18
        ? 'Good Afternoon'
        : 'Good Evening'
  return `${greeting}, ${displayName.value}`
})

// ── Profile dropdown state ────────────────────────────────────
const profileOpen = ref(false)

function toggleProfile() {
  profileOpen.value = !profileOpen.value
}

function closeProfile() {
  profileOpen.value = false
}

function goToProfile() {
  closeProfile()
  router.push('/teacher/settings')
}

async function handleLogout() {
  closeProfile()
  await authStore.logout()
  router.replace('/')
}

// Close dropdown on outside click
function onDocumentClick(e: MouseEvent) {
  const target = e.target as HTMLElement
  if (!target.closest('.profile-trigger')) {
    closeProfile()
  }
}

onMounted(() => {
  document.addEventListener('click', onDocumentClick)
})

onUnmounted(() => {
  document.removeEventListener('click', onDocumentClick)
})

const sidebarItems: Array<{ id: string; label: string; icon: string; route: string }> = [
  { id: 'dashboard', label: 'Dashboard', icon: 'grid', route: '/teacher/dashboard' },
  { id: 'classes', label: 'Classes', icon: 'cap', route: '/teacher/classes' },
  { id: 'students', label: 'Students', icon: 'users', route: '/teacher/students' },
  { id: 'tools', label: 'Tools', icon: 'zap', route: '/teacher/tools' },
  { id: 'organize', label: 'Organize Tools', icon: 'picker', route: '/teacher/organize-tools' },
  { id: 'history', label: 'Activity History', icon: 'history', route: '/teacher/activity-history' },
]

function navigateTo(route: string) {
  router.push(route)
}

function onSearchInput(e: Event) {
  const target = e.target as HTMLInputElement
  emit('update:searchValue', target.value)
}
</script>

<template>
  <div class="teacher-dashboard">
    <!-- ── Sidebar ──────────────────────────────────────────── -->
    <aside class="teacher-sidebar" aria-label="Teacher dashboard navigation">
      <div class="brand-lockup">
        <!-- <div class="brand-mark">
          <TeacherIcon icon="logo" :size="27" :stroke-width="2.3" />
        </div> -->
        <!-- <div>
          <p class="brand-name">Engagement</p>
          <p class="brand-subtitle">ClassroomKH</p>
        </div> -->
        <RouterLink to="/" class="nav-logo-link">
          <img src="@/assets/photo_logo.jpg" alt="Graduation" class="image" />
        </RouterLink>
      </div>

      <!-- Divider line below logo -->
      <div class="brand-divider"></div>

      <nav class="sidebar-nav">
        <button
          v-for="item in sidebarItems"
          :key="item.id"
          class="sidebar-link"
          :class="{ active: sidebarActive === item.id }"
          type="button"
          @click="navigateTo(item.route)"
        >
          <TeacherIcon :icon="item.icon" :size="22" />
          <span>{{ item.label }}</span>
        </button>
        <slot name="sidebar-after" />
      </nav>

      <div class="sidebar-footer">
        <div class="teacher-card">
          <div class="teacher-avatar-initials">{{ initials }}</div>
          <div>
            <p>{{ displayName }}</p>
            <span>{{ teacherRole }}</span>
          </div>
        </div>
        <button class="settings-link" type="button" @click="navigateTo('/teacher/settings')">
          <TeacherIcon icon="settings" :size="22" />
          <span>Settings</span>
        </button>
        <slot name="sidebar-footer-after" />
      </div>
    </aside>

    <!-- ── Main Workspace ───────────────────────────────────── -->
    <section class="dashboard-workspace">
      <header v-if="!hideTopbar" class="dashboard-topbar">
        <div class="greeting-block">
          <!-- Greeting Slot -->
          <slot name="greeting">
            <h1>{{ displayTitle }}</h1>
            <p v-if="pageSubtitle">{{ pageSubtitle }}</p>
          </slot>
        </div>

        <!-- Search Slot -->
        <slot name="search">
          <label v-if="showSearch" class="search-field" aria-label="Search">
            <TeacherIcon icon="search" :size="22" />
            <input
              :value="searchValue"
              type="search"
              :placeholder="searchPlaceholder"
              @input="onSearchInput"
            />
          </label>
          <div v-else></div>
        </slot>

        <div class="topbar-actions">
          <slot name="actions" />

          <!-- Launch button -->
          <button
            class="launch-btn"
            type="button"
            @click="navigateTo('/teacher/organize-tools')"
            title="Quick Launch"
          >
            <TeacherIcon icon="zap" :size="16" />
            <span>Launch</span>
          </button>

          <!-- Notifications -->
          <button class="icon-button notification-button" type="button" aria-label="Notifications">
            <TeacherIcon icon="bell" :size="22" />
            <span class="notification-dot"></span>
          </button>

          <!-- Profile -->
          <div class="profile-trigger">
            <button
              class="profile-btn"
              type="button"
              aria-label="Profile menu"
              aria-haspopup="true"
              :aria-expanded="profileOpen"
              @click="toggleProfile"
            >
              <span class="topbar-avatar">{{ initials }}</span>
              <span class="topbar-name">{{ displayName.split(' ')[0] }}</span>
              <TeacherIcon icon="chevron" :size="12" />
            </button>

            <!-- Dropdown -->
            <Transition name="dropdown">
              <div v-if="profileOpen" class="profile-dropdown" @click.stop>
                <div class="dropdown-header">
                  <span class="dropdown-avatar">{{ initials }}</span>
                  <div>
                    <p class="dropdown-name">{{ displayName }}</p>
                    <span class="dropdown-role">{{
                      authStore.user?.role || props.teacherRole || 'Teacher'
                    }}</span>
                    <span v-if="authStore.user?.email" class="dropdown-email">{{
                      authStore.user.email
                    }}</span>
                    <span v-if="authStore.user?.school" class="dropdown-school">{{
                      authStore.user.school
                    }}</span>
                  </div>
                </div>
                <div class="dropdown-divider"></div>
                <button class="dropdown-item" type="button" @click="goToProfile">
                  <TeacherIcon icon="settings" :size="16" />
                  <span>Profile &amp; Settings</span>
                </button>
                <button
                  class="dropdown-item"
                  type="button"
                  @click="navigateTo('/teacher/dashboard')"
                >
                  <TeacherIcon icon="grid" :size="16" />
                  <span>Dashboard</span>
                </button>
                <div class="dropdown-divider"></div>
                <button class="dropdown-item dropdown-logout" type="button" @click="handleLogout">
                  <TeacherIcon icon="logOut" :size="16" />
                  <span>Log Out</span>
                </button>
              </div>
            </Transition>
          </div>
        </div>
      </header>

      <!-- Main Content -->
      <main class="dashboard-content">
        <slot />
      </main>
    </section>
  </div>
</template>

<style scoped>
/* ── Variables ──────────────────────────────────────────────── */
.teacher-dashboard {
  --primary: #001f9e;
  --primary-dark: #00157a;
  --primary-soft: #eaf0ff;
  --ink: #0b1020;
  --muted: #697082;
  --line: #c5cbdd;
  --surface: #ffffff;
  --surface-soft: #f5f7ff;
  --green: #00772f;
  --green-soft: #eaf8ef;
  --red: #c51313;
  --red-soft: #fff0f0;
  --orange: #f07800;
  --orange-soft: #fff7e7;
  --cyan: #1778ff;
  --cyan-soft: #edf6ff;
  --violet: #8d35ff;
  --violet-soft: #fbf2ff;
  display: flex;
  min-height: 100vh;
  background:
    radial-gradient(circle at top left, rgba(37, 79, 203, 0.08), transparent 28%),
    radial-gradient(circle at bottom right, rgba(13, 110, 253, 0.05), transparent 24%),
    linear-gradient(180deg, #eef3ff 0%, #f7f9ff 34%, #eef2ff 100%);
  color: var(--ink);
  font-family:
    Inter,
    ui-sans-serif,
    system-ui,
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    sans-serif;
}

button,
input,
select,
textarea {
  font: inherit;
}

button {
  cursor: pointer;
}

* {
  box-sizing: border-box;
}

/* ── Sidebar ────────────────────────────────────────────────── */
.teacher-sidebar {
  position: sticky;
  top: 0;
  overflow: hidden;
  display: flex;
  width: 263px;
  min-width: 263px;
  height: 100vh;
  flex-direction: column;
  background: linear-gradient(180deg, #2547bc 0%, #1838a9 54%, #173199 100%);
  color: #ffffff;
  box-shadow: 16px 0 36px rgba(12, 28, 95, 0.18);
}

.teacher-sidebar::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 18% 12%, rgba(255, 255, 255, 0.14), transparent 18%),
    radial-gradient(circle at 86% 88%, rgba(255, 255, 255, 0.08), transparent 16%);
  pointer-events: none;
}

.brand-lockup {
  position: relative;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 34px 26px 28px;
}

.brand-mark {
  display: grid;
  width: 34px;
  height: 34px;
  place-items: center;
  color: #ffffff;
  flex-shrink: 0;
}

.brand-name {
  margin: 0;
  font-size: 18px;
  line-height: 1.1;
  font-weight: 900;
  letter-spacing: -0.02em;
}

.brand-subtitle {
  margin: 7px 0 0;
  color: rgba(255, 255, 255, 0.78);
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.brand-divider {
  height: 1px;
  background: rgba(255, 255, 255, 0.18);
  margin: 0 24px 22px;
  border-radius: 1px;
}

.sidebar-nav {
  display: grid;
  gap: 6px;
  padding: 0 16px;
}

.sidebar-link,
.settings-link {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  border: 0;
  background: transparent;
  color: #ffffff;
  text-align: left;
}

.sidebar-link {
  min-height: 44px;
  border-radius: 14px;
  padding: 0 16px;
  font-size: 14px;
  font-weight: 600;
  position: relative;
  transition:
    transform 0.18s ease,
    background 0.18s ease,
    box-shadow 0.18s ease,
    color 0.18s ease;
}

.sidebar-link.active,
.sidebar-link:hover {
  background: rgba(255, 255, 255, 0.18);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.08);
  transform: translateX(3px);
}

.sidebar-link.active {
  background: rgba(255, 255, 255, 0.26);
  box-shadow:
    0 0 0 1px rgba(255, 255, 255, 0.18),
    inset 0 0 0 1px rgba(255, 255, 255, 0.08),
    0 10px 20px rgba(0, 0, 0, 0.12);
  transform: translateX(0);
}

.sidebar-link.active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  height: 18px;
  width: 3px;
  border-radius: 0 3px 3px 0;
  background: #ffffff;
  opacity: 0.85;
}

.sidebar-link svg {
  opacity: 0.85;
}

.sidebar-link.active svg {
  opacity: 1;
}

.sidebar-footer {
  margin-top: auto;
  border-top: 1px solid rgba(255, 255, 255, 0.12);
  padding: 18px 16px 24px;
  position: relative;
}

.sidebar-footer::before {
  content: '';
  position: absolute;
  top: 0;
  left: 24px;
  right: 24px;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.28), transparent);
  border-radius: 1px;
}

.teacher-card {
  display: grid;
  grid-template-columns: 42px minmax(0, 1fr);
  gap: 10px;
  align-items: center;
  min-height: 58px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.12);
  padding: 8px;
  transition: background 0.18s ease, transform 0.18s ease, box-shadow 0.18s ease;
}

.teacher-card:hover {
  background: rgba(255, 255, 255, 0.18);
  transform: translateY(-1px);
  box-shadow: 0 8px 18px rgba(0, 0, 0, 0.12);
}

.teacher-avatar-initials {
  display: grid;
  width: 42px;
  height: 42px;
  place-items: center;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.22);
  font-weight: 800;
  transition: background 0.18s ease;
}

.teacher-card:hover .teacher-avatar-initials {
  background: rgba(255, 255, 255, 0.32);
}

.teacher-card p {
  overflow: hidden;
  margin: 0;
  color: #ffffff;
  font-size: 14px;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.teacher-card span {
  display: block;
  margin-top: 4px;
  color: rgba(255, 255, 255, 0.7);
  font-size: 11px;
  text-transform: uppercase;
}

.settings-link {
  margin-top: 14px;
  min-height: 34px;
  padding: 0 18px 0 14px;
  font-size: 16px;
  border-radius: 10px;
  transition: background 0.18s ease;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.88);
}

.settings-link:hover {
  background: rgba(255, 255, 255, 0.12);
  color: #ffffff;
}

.settings-link:hover {
  background: rgba(255, 255, 255, 0.1);
}

/* ── Topbar ─────────────────────────────────────────────────── */
.dashboard-workspace {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  overflow-y: auto;
  max-height: 100vh;
}

.dashboard-topbar {
  display: grid;
  grid-template-columns: minmax(220px, 1fr) minmax(260px, 430px) auto;
  gap: 22px;
  align-items: center;
  min-height: 82px;
  border-bottom: 1px solid rgba(197, 203, 221, 0.7);
  background: rgba(255, 255, 255, 0.84);
  backdrop-filter: blur(16px);
  box-shadow:
    0 1px 0 rgba(255, 255, 255, 0.75) inset,
    0 10px 30px rgba(21, 33, 72, 0.04);
  padding: 0 42px;
  position: sticky;
  top: 0;
  z-index: 50;
}

.greeting-block {
  min-width: 0;
}

.greeting-block h1 {
  margin: 0;
  color: var(--primary);
  font-size: 17px;
  font-weight: 800;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.greeting-block p {
  margin: 6px 0 0;
  max-width: 320px;
  color: #1d2432;
  font-size: 14px;
  line-height: 1.35;
}

.greeting-block strong {
  color: var(--green);
}

.search-field {
  display: grid;
  grid-template-columns: 24px 1fr;
  gap: 10px;
  align-items: center;
  height: 44px;
  border: 1px solid rgba(197, 203, 221, 0.9);
  border-radius: 999px;
  background: rgba(238, 243, 255, 0.9);
  color: #4e586b;
  padding: 0 14px;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.7);
}

.search-field input {
  min-width: 0;
  border: 0;
  outline: 0;
  background: transparent;
  color: var(--ink);
  font-size: 15px;
}

.search-field input::placeholder {
  color: #6d7587;
}

.topbar-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

/* ── Launch Button ──────────────────────────────────────────── */
.launch-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 40px;
  border: 0;
  border-radius: 999px;
  background: linear-gradient(135deg, var(--primary) 0%, #2d4ec4 100%);
  color: #fff;
  padding: 0 16px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 10px rgba(0, 31, 158, 0.25);
}

.launch-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(0, 31, 158, 0.35);
}

.launch-btn:active {
  transform: translateY(0);
}

/* ── Icon button (used in topbar only) ──────────────────────── */
.icon-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: #4a5268;
  transition: all 0.15s;
  cursor: pointer;
}

.icon-button:hover {
  background: #eef3ff;
  color: var(--primary);
}

.notification-button {
  position: relative;
}

.notification-dot {
  position: absolute;
  top: 6px;
  right: 6px;
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: var(--red);
  border: 2px solid #fff;
}

/* ── Profile Trigger ────────────────────────────────────────── */
.profile-trigger {
  position: relative;
  margin-left: 4px;
}

.profile-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 40px;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: #1a2030;
  padding: 0 8px;
  cursor: pointer;
  transition: all 0.15s;
  font: inherit;
}

.profile-btn:hover {
  background: #eef3ff;
}

.topbar-avatar {
  display: inline-grid;
  width: 30px;
  height: 30px;
  place-items: center;
  border-radius: 999px;
  background: linear-gradient(135deg, var(--primary) 0%, #2d4ec4 100%);
  color: #fff;
  font-size: 11px;
  font-weight: 800;
}

.topbar-name {
  font-size: 13px;
  font-weight: 700;
  display: none;
}

@media (min-width: 1100px) {
  .topbar-name {
    display: inline;
  }
}

/* ── Profile Dropdown ───────────────────────────────────────── */
.profile-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  z-index: 100;
  width: 240px;
  border: 1px solid var(--line);
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.14);
  overflow: hidden;
}

.dropdown-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 18px 20px 14px;
}

.dropdown-avatar {
  display: inline-grid;
  width: 44px;
  height: 44px;
  place-items: center;
  border-radius: 10px;
  background: linear-gradient(135deg, var(--primary) 0%, #2d4ec4 100%);
  color: #fff;
  font-size: 15px;
  font-weight: 800;
  flex-shrink: 0;
}

.dropdown-name {
  margin: 0;
  font-size: 14px;
  font-weight: 700;
  color: var(--ink);
}

.dropdown-role {
  font-size: 11px;
  color: var(--muted);
  text-transform: uppercase;
  font-weight: 700;
  display: block;
}

.dropdown-email {
  display: block;
  margin-top: 4px;
  font-size: 12px;
  color: #4a5268;
  font-weight: 600;
}

.dropdown-school {
  display: block;
  margin-top: 2px;
  font-size: 11px;
  color: var(--muted);
  font-weight: 600;
}

.dropdown-divider {
  height: 1px;
  background: #e8ecf4;
  margin: 0;
}

.dropdown-item {
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
}

.dropdown-item:hover {
  background: var(--primary-soft);
  color: var(--primary);
}

.dropdown-logout {
  color: var(--red);
}

.dropdown-logout:hover {
  background: var(--red-soft);
  color: var(--red);
}

/* Dropdown transition */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.15s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

/* ── Shared Content ─────────────────────────────────────────── */
.dashboard-content {
  width: min(100%, 1180px);
  margin: 0 auto;
  padding: 48px 36px 48px;
}

/* ── Responsive ─────────────────────────────────────────────── */
@media (max-width: 1280px) {
  .dashboard-content {
    width: 100%;
  }

  .dashboard-topbar {
    grid-template-columns: 1fr;
    gap: 14px;
    padding: 18px 28px;
  }

  .topbar-actions {
    flex-wrap: wrap;
  }
}

.topbar-page-label {
  font-size: 12px;
  font-weight: 800;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 0 4px;
}

@media (max-width: 980px) {
  .teacher-dashboard {
    flex-direction: column;
  }

  .teacher-sidebar {
    position: relative;
    width: 100%;
    min-width: 0;
    height: auto;
  }

  .brand-lockup {
    padding: 20px 20px 18px;
  }

  .sidebar-nav {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    padding-bottom: 16px;
  }

  .sidebar-footer {
    display: none;
  }
}

@media (max-width: 720px) {
  .dashboard-content {
    padding: 24px 16px;
  }
  .topbar-actions {
    display: grid;
    grid-template-columns: 1fr 1fr;
    width: 100%;
  }
  .icon-button.notification-button {
    width: 100%;
  }
  .notification-button::before {
    display: none;
  }
  .sidebar-nav {
    grid-template-columns: 1fr;
  }
}
</style>

<!-- Non-scoped styles for shared utility classes (used in slot content, so can't be scoped) -->
<style>
/* ── Shared utility classes (available to slot content via slot) ── */
.outline-button,
.primary-button,
.danger-button,
.ghost-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  font-weight: 700;
  gap: 8px;
}
.ghost-button {
  border: 0;
  background: transparent;
  color: #001f9e;
  padding: 0 8px;
  gap: 4px;
}
.outline-button {
  min-height: 38px;
  border: 1px solid #c5cbdd;
  background: #fff;
  color: #001f9e;
  padding: 0 18px;
}
.primary-button {
  min-height: 38px;
  border: 1px solid #00157a;
  background: #001f9e;
  color: #fff;
  padding: 0 18px;
  box-shadow: 0 6px 12px rgba(0, 31, 158, 0.18);
}
.danger-button {
  min-height: 38px;
  border: 1px solid #c51313;
  background: #c51313;
  color: #fff;
  padding: 0 18px;
}

.view-toggle {
  display: flex;
  border: 1px solid #c5cbdd;
  border-radius: 8px;
  overflow: hidden;
}
.toggle-btn {
  display: grid;
  width: 36px;
  height: 36px;
  place-items: center;
  border: 0;
  background: transparent;
  color: #6e7687;
  transition: all 0.15s;
  cursor: pointer;
}
.toggle-btn.active {
  background: #001f9e;
  color: #fff;
}
.toggle-btn:not(:last-child) {
  border-right: 1px solid #c5cbdd;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
  margin-bottom: 28px;
}
.stat-card {
  min-height: 100px;
  border: 1px solid transparent;
  border-left: 4px solid #001f9e;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 14px 24px rgba(21, 33, 72, 0.07);
  padding: 20px 22px 16px;
}
.stat-card.tone-green {
  border-left-color: #00772f;
}
.stat-card.tone-orange {
  border-left-color: #f07800;
}
.stat-card.tone-red {
  border-left-color: #c51313;
}
.stat-label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  color: #60677a;
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
}
.stat-value-row {
  display: flex;
  align-items: baseline;
  gap: 10px;
  margin-top: 14px;
}
.stat-value-row strong {
  color: #001f9e;
  font-size: 28px;
  line-height: 0.9;
}
.stat-value-row span {
  font-size: 12px;
  font-weight: 700;
  color: #697082;
}
.stat-card.tone-green .stat-value-row strong {
  color: #00772f;
}
.stat-card.tone-orange .stat-value-row strong {
  color: #f07800;
}
.stat-card.tone-red .stat-value-row strong {
  color: #c51313;
}

.filter-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 24px;
  padding: 14px 20px;
  border-radius: 10px;
  background: #fff;
  border: 1px solid #c5cbdd;
}
.filter-group {
  display: flex;
  align-items: center;
  gap: 12px;
}
.filter-label {
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
  color: #697082;
}
.filter-chips {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}
.chip {
  min-height: 30px;
  border: 1px solid #c5cbdd;
  border-radius: 999px;
  background: #fff;
  padding: 0 14px;
  font-size: 12px;
  font-weight: 700;
  color: #697082;
  transition: all 0.15s;
  cursor: pointer;
}
.chip.active {
  background: #001f9e;
  color: #fff;
  border-color: #001f9e;
}
.chip-green.active {
  background: #00772f;
  border-color: #00772f;
  color: #fff;
}
.chip-gray.active {
  background: #6e7687;
  border-color: #6e7687;
  color: #fff;
}
.chip-orange.active {
  background: #f07800;
  border-color: #f07800;
  color: #fff;
}
.chip-violet.active {
  background: #8d35ff;
  border-color: #8d35ff;
  color: #fff;
}
.chip-primary.active {
  background: #001f9e;
  border-color: #001f9e;
  color: #fff;
}
.filter-info {
  display: flex;
  align-items: center;
  gap: 10px;
}
.result-count {
  font-size: 13px;
  color: #697082;
  font-weight: 600;
}

.table-wrapper {
  border: 1px solid #c5cbdd;
  border-radius: 10px;
  background: #fff;
  box-shadow: 0 16px 24px rgba(21, 33, 72, 0.06);
  overflow: hidden;
}

.pagination-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 20px;
  padding: 14px 18px;
  border: 1px solid #c5cbdd;
  border-radius: 8px;
  background: #fff;
}
.pagination-info {
  font-size: 12px;
  color: #697082;
}
.pagination-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}
.page-btn {
  display: inline-grid;
  width: 34px;
  height: 34px;
  place-items: center;
  border: 1px solid #c5cbdd;
  border-radius: 6px;
  background: #fff;
  color: #0b1020;
  transition: all 0.15s;
  cursor: pointer;
}
.page-btn:hover:not(:disabled) {
  background: #eaf0ff;
  border-color: #001f9e;
}
.page-btn:disabled {
  opacity: 0.4;
  cursor: default;
}
.page-indicator {
  font-size: 13px;
  font-weight: 600;
  color: #697082;
  min-width: 40px;
  text-align: center;
}

.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 320px;
  border: 1px solid #c5cbdd;
  border-radius: 12px;
  background: #fff;
  gap: 12px;
  padding: 40px;
}
.empty-icon {
  color: #697082;
  opacity: 0.35;
}
.empty-state h3 {
  margin: 0;
  font-size: 18px;
  color: #0b1020;
}
.empty-state p {
  margin: 0;
  color: #697082;
  text-align: center;
}
.spinner {
  width: 36px;
  height: 36px;
  border: 3px solid #c5cbdd;
  border-top-color: #001f9e;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

mark {
  border-radius: 999px;
  font-size: 10px;
  font-weight: 800;
  padding: 3px 9px;
  text-transform: uppercase;
}
mark.active,
mark.completed {
  background: #eaf8ef;
  color: #00772f;
}
mark.inactive {
  background: #e8e8ee;
  color: #62687a;
}
mark.live {
  background: #fff0f0;
  color: #c51313;
}
mark.scheduled {
  background: #fff7e7;
  color: #f07800;
}

.form-select {
  min-height: 36px;
  border: 1px solid #c5cbdd;
  border-radius: 6px;
  background: #fff;
  padding: 0 12px;
  font-size: 13px;
  color: #0b1020;
  cursor: pointer;
}
.form-select:focus {
  outline: none;
  border-color: #001f9e;
  box-shadow: 0 0 0 3px rgba(0, 31, 158, 0.12);
}

.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: grid;
  place-items: center;
  background: rgba(0, 0, 0, 0.45);
  padding: 20px;
}
.modal-container {
  width: min(100%, 560px);
  border-radius: 14px;
  background: #fff;
  box-shadow: 0 24px 48px rgba(0, 0, 0, 0.18);
}
.modal-sm {
  width: min(100%, 440px);
}
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24px 28px 0;
}
.modal-header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 800;
  color: #0b1020;
}
.modal-close {
  display: grid;
  width: 36px;
  height: 36px;
  place-items: center;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: #6e7687;
  transition: background 0.15s;
  cursor: pointer;
}
.modal-close:hover {
  background: #f0f2f7;
}
.modal-body {
  padding: 24px 28px 28px;
}
.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}
.form-group {
  margin-bottom: 18px;
}
.form-group label {
  display: block;
  margin-bottom: 6px;
  font-size: 13px;
  font-weight: 700;
  color: #3e4558;
}
.required {
  color: #c51313;
}
.form-group input[type='text'],
.form-group input[type='email'],
.form-group input[type='number'],
.form-group input[type='password'],
.form-group textarea {
  width: 100%;
  min-height: 42px;
  border: 1px solid #c5cbdd;
  border-radius: 8px;
  background: #fff;
  padding: 0 14px;
  font-size: 14px;
  color: #0b1020;
  transition: border-color 0.15s;
  appearance: auto;
}
.form-group textarea {
  padding: 12px 14px;
  resize: vertical;
}
.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #001f9e;
  box-shadow: 0 0 0 3px rgba(0, 31, 158, 0.12);
}
.checkbox-group {
  display: flex;
  align-items: center;
}
.checkbox-label {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  color: #0b1020;
}
.checkbox-label input[type='checkbox'] {
  width: 18px;
  height: 18px;
  accent-color: #001f9e;
}
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 20px;
}

@media (max-width: 1280px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
@media (max-width: 720px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
  .filter-bar {
    flex-direction: column;
    align-items: stretch;
  }
  .form-row {
    grid-template-columns: 1fr;
  }
  .primary-button,
  .outline-button {
    width: 100%;
  }
}
</style>
