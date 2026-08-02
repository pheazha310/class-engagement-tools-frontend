<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const activeItem = ref('dashboard')

interface MenuItem {
  id: string
  icon: string
  label: string
  route?: string
  badge?: number
}

const menuItems = ref<MenuItem[]>([
  { id: 'dashboard', icon: '📊', label: 'Dashboard', route: '/teacher/dashboard' },
  { id: 'students', icon: '👥', label: 'Students' },
  { id: 'student-order', icon: '📋', label: 'Student Order' },
  { id: 'classroom-timer', icon: '⏱️', label: 'Classroom Timer' },
  { id: 'group-generator', icon: '👨‍👩‍👧‍👦', label: 'Group Generator' },
  { id: 'link-voting', icon: '🔗', label: 'Link Voting' },
  { id: 'notifications', icon: '🔔', label: 'Notifications', badge: 2 },
  { id: 'classroom-quiz', icon: '❓', label: 'Classroom Quiz' },
  { id: 'icebreaker', icon: '🎮', label: 'Icebreaker Activities' },
  { id: 'soundboard', icon: '🔊', label: 'Classroom Soundboard' },
  { id: 'activity-history', icon: '📜', label: 'Activity History' },
  { id: 'favorites', icon: '⭐', label: 'Favorites' }
])

const navigateTo = (item: MenuItem) => {
  activeItem.value = item.id
  if (item.route) {
    router.push(item.route)
  }
}
</script>

<template>
  <div class="sidebar">
    <div class="sidebar-header">
      <div class="logo">
        <span class="logo-icon">📚</span>
        <span class="logo-text">EduEngage</span>
      </div>
    </div>

    <nav class="sidebar-menu">
      <button
        v-for="item in menuItems"
        :key="item.id"
        :class="['menu-item', { active: activeItem === item.id }]"
        @click="navigateTo(item)"
      >
        <span class="menu-icon">{{ item.icon }}</span>
        <span class="menu-label">{{ item.label }}</span>
        <span v-if="item.badge" class="badge">{{ item.badge }}</span>
      </button>
    </nav>

    <div class="sidebar-footer">
      <div class="teacher-profile">
        <div class="profile-avatar">DJ</div>
        <div class="profile-info">
          <p class="profile-name">Dr. Jenkins</p>
          <p class="profile-role">Teacher</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.sidebar {
  width: 280px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  height: 100vh;
  overflow-y: auto;
  padding: 20px 0;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.sidebar-header {
  padding: 0 20px 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.logo {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
}

.logo-icon {
  font-size: 24px;
}

.logo-text {
  font-size: 20px;
  font-weight: 700;
  color: white;
}

.sidebar-menu {
  flex: 1;
  overflow-y: auto;
  padding: 16px 8px;
}

.menu-item {
  width: 100%;
  padding: 12px 16px;
  margin-bottom: 8px;
  background: transparent;
  border: none;
  border-radius: 8px;
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 12px;
  transition: all 0.2s;
  position: relative;
}

.menu-item:hover {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

.menu-item.active {
  background: rgba(255, 255, 255, 0.25);
  color: white;
  border-left: 3px solid white;
  padding-left: 13px;
}

.menu-icon {
  font-size: 18px;
  width: 24px;
  text-align: center;
}

.menu-label {
  flex: 1;
  text-align: left;
}

.badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  background: #ff6b6b;
  color: white;
  border-radius: 50%;
  font-size: 12px;
  font-weight: 700;
}

.sidebar-footer {
  padding: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.teacher-profile {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
}

.profile-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 700;
  font-size: 14px;
}

.profile-info {
  flex: 1;
}

.profile-name {
  color: white;
  font-size: 14px;
  font-weight: 600;
  margin: 0;
}

.profile-role {
  color: rgba(255, 255, 255, 0.8);
  font-size: 12px;
  margin: 0;
}

/* Scrollbar styling */
.sidebar::-webkit-scrollbar {
  width: 6px;
}

.sidebar::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
}

.sidebar::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 3px;
}

.sidebar::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.5);
}

@media (max-width: 768px) {
  .sidebar {
    width: 250px;
  }

  .logo-text {
    font-size: 18px;
  }

  .menu-label {
    display: none;
  }

  .sidebar {
    width: 80px;
  }

  .menu-item {
    justify-content: center;
    padding: 12px;
  }

  .badge {
    position: absolute;
    top: -5px;
    right: -5px;
  }
}
</style>
