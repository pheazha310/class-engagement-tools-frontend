<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import TeacherLayout from '@/components/teacher/TeacherLayout.vue'
import TeacherIcon from '@/components/teacher/TeacherIcon.vue'

const router = useRouter()
const authStore = useAuthStore()

const saved = ref(false)
const activeSection = ref('profile')

const sections = [
  { id: 'profile', label: 'Profile', icon: 'users' },
  { id: 'account', label: 'Account', icon: 'lock' },
  { id: 'notifications', label: 'Notifications', icon: 'bell' },
  { id: 'preferences', label: 'Preferences', icon: 'globe' },
]

const teacherName = computed(() => authStore.user?.name || 'Dr. Sarah Miller')
const teacherInitials = computed(() =>
  teacherName.value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase(),
)

const profileForm = ref({ name: teacherName.value, email: authStore.user?.email || 'sarah.miller@university.edu', title: 'Senior Instructor', department: 'Science & Mathematics', phone: '+1 (555) 123-4567', bio: 'Passionate educator with over 10 years of experience in STEM education.' })
const accountForm = ref({ currentPassword: '', newPassword: '', confirmPassword: '' })
const notificationForm = ref({ emailNotifications: true, pollResponses: true, quizSubmissions: true, studentJoin: true, weeklyDigest: false, marketingEmails: false })
const preferenceForm = ref({ timezone: 'America/New_York', dateFormat: 'MM/DD/YYYY', language: 'English', theme: 'light', defaultClassSize: 30 })

function saveSettings() { saved.value = true; setTimeout(() => { saved.value = false }, 3000) }
function handleLogout() { authStore.logout(); router.push('/login') }
</script>

<template>
  <TeacherLayout sidebar-active="settings" :show-search="false" hideTopbar>
    <div class="settings-page">
      <header class="settings-hero">
        <div class="settings-hero-copy">
          <p class="settings-kicker">Teacher workspace</p>
          <h1>Settings</h1>
          <p>Manage your profile, account, and preferences.</p>
        </div>
        <div class="settings-header-actions">
          <button class="settings-launch" type="button" @click="router.push('/teacher/organize-tools')" title="Quick Launch">
            <TeacherIcon icon="zap" :size="18" />
            <span>Launch</span>
          </button>
          <button class="settings-notifications" type="button" aria-label="Notifications">
            <TeacherIcon icon="bell" :size="20" />
            <span class="notification-dot"></span>
          </button>
          <button class="settings-profile-btn" type="button" aria-label="Profile">
            <span class="settings-avatar">{{ teacherInitials }}</span>
            <span class="settings-name">{{ teacherName.split(' ')[0] }}</span>
          </button>
        </div>
      </header>

      <div class="settings-layout">
        <nav class="settings-nav">
          <button v-for="s in sections" :key="s.id" class="settings-nav-item" :class="{ active: activeSection === s.id }" type="button" @click="activeSection = s.id">
            <TeacherIcon :icon="s.icon" :size="20" /><span>{{ s.label }}</span>
          </button>
        </nav>

        <section class="settings-content">
          <div v-if="saved" class="success-toast"><TeacherIcon icon="check" :size="18" /><span>Settings saved successfully!</span></div>

          <!-- Profile -->
          <div v-if="activeSection === 'profile'" class="settings-card">
            <div class="settings-card-header"><h2>Profile Information</h2><p>Update your personal details and public profile.</p></div>
            <form class="settings-form" @submit.prevent="saveSettings">
              <div class="form-row"><div class="form-group"><label>Full Name</label><input v-model="profileForm.name" type="text" /></div><div class="form-group"><label>Email</label><input v-model="profileForm.email" type="email" /></div></div>
              <div class="form-row"><div class="form-group"><label>Title</label><input v-model="profileForm.title" type="text" /></div><div class="form-group"><label>Department</label><input v-model="profileForm.department" type="text" /></div></div>
              <div class="form-group"><label>Phone</label><input v-model="profileForm.phone" type="text" /></div>
              <div class="form-group"><label>Bio</label><textarea v-model="profileForm.bio" rows="3"></textarea></div>
              <div class="form-actions"><button type="submit" class="primary-button">Save Changes</button></div>
            </form>
          </div>

          <!-- Account -->
          <div v-if="activeSection === 'account'" class="settings-card">
            <div class="settings-card-header"><h2>Account Security</h2><p>Manage your password and account settings.</p></div>
            <form class="settings-form" @submit.prevent="saveSettings">
              <div class="form-group"><label>Current Password</label><input v-model="accountForm.currentPassword" type="password" placeholder="Enter current password" /></div>
              <div class="form-row"><div class="form-group"><label>New Password</label><input v-model="accountForm.newPassword" type="password" placeholder="Enter new password" /></div><div class="form-group"><label>Confirm Password</label><input v-model="accountForm.confirmPassword" type="password" placeholder="Confirm new password" /></div></div>
              <div class="form-actions"><button type="submit" class="primary-button">Update Password</button></div>
            </form>
            <div class="danger-zone"><h3>Danger Zone</h3><p>Permanently delete your account and all associated data.</p><button class="danger-button" type="button">Delete Account</button></div>
          </div>

          <!-- Notifications -->
          <div v-if="activeSection === 'notifications'" class="settings-card">
            <div class="settings-card-header"><h2>Notification Preferences</h2><p>Choose what notifications you receive.</p></div>
            <form class="settings-form" @submit.prevent="saveSettings">
              <div class="toggle-list">
                <label class="toggle-item"><div class="toggle-info"><strong>Email Notifications</strong><span>Receive email notifications for important updates</span></div><input v-model="notificationForm.emailNotifications" type="checkbox" class="toggle-switch" /></label>
                <label class="toggle-item"><div class="toggle-info"><strong>Poll Responses</strong><span>When students respond to live polls</span></div><input v-model="notificationForm.pollResponses" type="checkbox" class="toggle-switch" /></label>
                <label class="toggle-item"><div class="toggle-info"><strong>Quiz Submissions</strong><span>When students submit quiz answers</span></div><input v-model="notificationForm.quizSubmissions" type="checkbox" class="toggle-switch" /></label>
                <label class="toggle-item"><div class="toggle-info"><strong>New Students</strong><span>When students join your classes</span></div><input v-model="notificationForm.studentJoin" type="checkbox" class="toggle-switch" /></label>
                <label class="toggle-item"><div class="toggle-info"><strong>Weekly Digest</strong><span>Weekly summary of classroom activity</span></div><input v-model="notificationForm.weeklyDigest" type="checkbox" class="toggle-switch" /></label>
              </div>
              <div class="form-actions"><button type="submit" class="primary-button">Save Preferences</button></div>
            </form>
          </div>

          <!-- Preferences -->
          <div v-if="activeSection === 'preferences'" class="settings-card">
            <div class="settings-card-header"><h2>Preferences</h2><p>Customize your experience.</p></div>
            <form class="settings-form" @submit.prevent="saveSettings">
              <div class="form-row"><div class="form-group"><label>Timezone</label><select v-model="preferenceForm.timezone" class="form-select"><option value="America/New_York">Eastern Time (ET)</option><option value="America/Chicago">Central Time (CT)</option><option value="America/Denver">Mountain Time (MT)</option><option value="America/Los_Angeles">Pacific Time (PT)</option></select></div><div class="form-group"><label>Date Format</label><select v-model="preferenceForm.dateFormat" class="form-select"><option value="MM/DD/YYYY">MM/DD/YYYY</option><option value="DD/MM/YYYY">DD/MM/YYYY</option><option value="YYYY-MM-DD">YYYY-MM-DD</option></select></div></div>
              <div class="form-row"><div class="form-group"><label>Language</label><select v-model="preferenceForm.language" class="form-select"><option value="English">English</option><option value="Spanish">Spanish</option><option value="French">French</option></select></div><div class="form-group"><label>Theme</label><select v-model="preferenceForm.theme" class="form-select"><option value="light">Light</option><option value="dark">Dark</option><option value="system">System</option></select></div></div>
              <div class="form-group"><label>Default Class Size</label><input v-model.number="preferenceForm.defaultClassSize" type="number" min="5" max="200" /></div>
              <div class="form-actions"><button type="submit" class="primary-button">Save Preferences</button></div>
            </form>
          </div>
        </section>
      </div>
    </div>

    <template #sidebar-footer-after>
      <button class="settings-link settings-link--logout" type="button" @click="handleLogout">
        <TeacherIcon icon="logOut" :size="22" />
        <span>Log Out</span>
      </button>
    </template>
  </TeacherLayout>
</template>

<style scoped>
.settings-page {
  padding: 24px 28px 40px;
}

.settings-hero {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 26px;
  padding: 24px 26px;
  border: 1px solid rgba(197, 203, 221, 0.9);
  border-radius: 20px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.96) 0%, rgba(247, 250, 255, 0.98) 100%);
  box-shadow: 0 16px 34px rgba(21, 33, 72, 0.08);
}

.settings-hero-copy {
  min-width: 0;
}

.settings-kicker {
  margin: 0 0 8px;
  color: var(--primary);
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.12em;
}

.settings-hero h1 {
  margin: 0;
  color: var(--primary);
  font-size: 22px;
  line-height: 1.15;
  font-weight: 900;
  letter-spacing: -0.03em;
}

.settings-hero p {
  margin: 8px 0 0;
  font-size: 15px;
  color: var(--muted);
}

.settings-header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.settings-launch {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 40px;
  border: 0;
  border-radius: 999px;
  background: linear-gradient(135deg, var(--primary), #2d4ec4);
  color: #fff;
  padding: 0 18px;
  font-size: 14px;
  font-weight: 700;
  box-shadow: 0 8px 18px rgba(0, 31, 158, 0.25);
  transition: all 0.2s ease;
}

.settings-launch:hover {
  transform: translateY(-1px);
  box-shadow: 0 10px 22px rgba(0, 31, 158, 0.35);
}

.settings-notifications {
  display: inline-grid;
  width: 40px;
  height: 40px;
  place-items: center;
  border: 1px solid #d0d6e8;
  border-radius: 999px;
  background: #fff;
  color: #4a5268;
  position: relative;
  transition: all 0.15s ease;
}

.settings-notifications:hover {
  background: #eef3ff;
  color: var(--primary);
  border-color: var(--primary);
}

.notification-dot {
  position: absolute;
  top: 9px;
  right: 9px;
  width: 9px;
  height: 9px;
  border-radius: 999px;
  background: var(--red);
  border: 2px solid #fff;
}

.settings-profile-btn {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  height: 40px;
  border: 1px solid #d0d6e8;
  border-radius: 999px;
  background: #fff;
  color: #1a2030;
  padding: 0 14px;
  cursor: pointer;
  transition: all 0.15s ease;
  font: inherit;
}

.settings-profile-btn:hover {
  border-color: var(--primary);
  background: #eef3ff;
}

.settings-avatar {
  display: inline-grid;
  width: 30px;
  height: 30px;
  place-items: center;
  border-radius: 999px;
  background: linear-gradient(135deg, var(--primary), #2d4ec4);
  color: #fff;
  font-size: 12px;
  font-weight: 800;
}

.settings-name {
  font-weight: 700;
  font-size: 14px;
}

.settings-layout {
  display: grid;
  grid-template-columns: 270px minmax(0, 1fr);
  gap: 24px;
  align-items: flex-start;
}

.settings-nav {
  position: sticky;
  top: 16px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px;
  border: 1px solid rgba(197, 203, 221, 0.9);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 14px 28px rgba(21, 33, 72, 0.06);
}

.settings-nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  min-height: 48px;
  padding: 0 14px;
  border: 0;
  border-radius: 12px;
  background: transparent;
  color: var(--muted);
  font-size: 14px;
  font-weight: 700;
  text-align: left;
  cursor: pointer;
  transition: all 0.2s ease;
}

.settings-nav-item:hover {
  background: var(--primary-soft);
  color: var(--primary);
  transform: translateX(2px);
}

.settings-nav-item.active {
  background: linear-gradient(135deg, var(--primary), #2d4ec4);
  color: #fff;
  box-shadow: 0 8px 18px rgba(0, 31, 158, 0.2);
}

.settings-content {
  flex: 1;
  min-width: 0;
}

.settings-card {
  padding: 30px;
  border: 1px solid rgba(197, 203, 221, 0.9);
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.98);
  box-shadow: 0 16px 30px rgba(21, 33, 72, 0.08);
  transition: box-shadow 0.2s ease, transform 0.2s ease;
}

.settings-card:hover {
  box-shadow: 0 22px 38px rgba(21, 33, 72, 0.1);
}

.settings-card-header {
  margin-bottom: 24px;
}

.settings-card-header h2 {
  margin: 0 0 6px;
  font-size: 20px;
  font-weight: 900;
  color: var(--ink);
}

.settings-card-header p {
  margin: 0;
  font-size: 14px;
  color: var(--muted);
}

.settings-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  padding-top: 10px;
}

.toggle-list {
  display: flex;
  flex-direction: column;
}

.toggle-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 0;
  border-bottom: 1px solid #e7ebf5;
  cursor: pointer;
  transition: background 0.15s ease;
}

.toggle-item:last-child {
  border-bottom: 0;
}

.toggle-info strong {
  display: block;
  font-size: 14px;
  color: var(--ink);
  margin-bottom: 2px;
}

.toggle-info span {
  font-size: 13px;
  color: var(--muted);
}

.toggle-switch {
  width: 48px;
  height: 26px;
  accent-color: var(--primary);
  cursor: pointer;
  flex-shrink: 0;
}

.success-toast {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 20px;
  border-radius: 12px;
  background: var(--green-soft);
  color: var(--green);
  font-weight: 700;
  font-size: 14px;
  margin-bottom: 24px;
  animation: slideDown 0.3s ease;
}
@keyframes slideDown { from { opacity: 0; transform: translateY(-12px); } to { opacity: 1; transform: translateY(0); } }
.danger-zone { margin-top: 24px; padding: 24px; border: 1px solid var(--red); border-radius: 10px; background: var(--red-soft); }
.danger-zone h3 { margin: 0 0 6px; font-size: 16px; font-weight: 800; color: var(--red); }
.danger-zone p { margin: 0 0 16px; font-size: 14px; color: #853232; }

.settings-link {
  display: flex;
  align-items: center;
  gap: 18px;
  width: 100%;
  border: 0;
  background: transparent;
  color: #ffffff;
  text-align: left;
}

.settings-link--logout {
  margin-top: 18px;
  min-height: 44px;
  padding: 0 18px;
  border: 1px solid rgba(255, 176, 176, 0.35);
  border-radius: 999px;
  font-size: 15px;
  color: #ffb0b0;
  background: rgba(255, 255, 255, 0.08);
}

.settings-link--logout:hover {
  background: rgba(255, 255, 255, 0.14);
  color: #fff;
}

@media (max-width:980px) {
  .settings-layout { grid-template-columns: 1fr; }
  .settings-nav { position: relative; top: 0; flex-direction: row; flex-wrap: wrap; min-width: 0; }
  .settings-nav-item { width: auto; flex: 1 1 140px; justify-content: center; }
  .settings-page { padding: 18px 16px 32px; }
  .settings-hero { flex-direction: column; }
  .settings-header-actions { flex-wrap: wrap; }
}

@media (max-width:720px) {
  .settings-card { padding: 22px 18px; }
  .settings-header-actions { width: 100%; }
  .settings-launch,
  .settings-profile-btn { flex: 1; justify-content: center; }
  .settings-notifications { flex-shrink: 0; }
  .form-row { grid-template-columns: 1fr; }
  .form-actions { justify-content: stretch; }
  .form-actions .primary-button,
  .form-actions .outline-button,
  .form-actions .danger-button { width: 100%; }
}
</style>
