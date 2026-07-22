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

const profileForm = ref({ name: teacherName.value, email: authStore.user?.email || 'sarah.miller@university.edu', title: 'Senior Instructor', department: 'Science & Mathematics', phone: '+1 (555) 123-4567', bio: 'Passionate educator with over 10 years of experience in STEM education.' })
const accountForm = ref({ currentPassword: '', newPassword: '', confirmPassword: '' })
const notificationForm = ref({ emailNotifications: true, pollResponses: true, quizSubmissions: true, studentJoin: true, weeklyDigest: false, marketingEmails: false })
const preferenceForm = ref({ timezone: 'America/New_York', dateFormat: 'MM/DD/YYYY', language: 'English', theme: 'light', defaultClassSize: 30 })

function saveSettings() { saved.value = true; setTimeout(() => { saved.value = false }, 3000) }
function handleLogout() { authStore.logout(); router.push('/login') }
</script>

<template>
  <TeacherLayout sidebar-active="" :show-search="false">
    <template #greeting>
      <h1>Settings</h1>
      <p>Manage your profile, account, and preferences.</p>
    </template>
    <template #actions>
      <button class="outline-button" type="button" @click="handleLogout"><TeacherIcon icon="logOut" :size="18" /><span>Log Out</span></button>
    </template>

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
  </TeacherLayout>
</template>

<style scoped>
.settings-layout { display: flex; gap: 32px; align-items: flex-start; }
.settings-nav { position: sticky; top: 100px; display: flex; flex-direction: column; gap: 4px; min-width: 200px; padding: 8px; border: 1px solid var(--line); border-radius: 10px; background: #fff; }
.settings-nav-item { display: flex; align-items: center; gap: 12px; width: 100%; min-height: 42px; padding: 0 14px; border: 0; border-radius: 8px; background: transparent; color: var(--muted); font-size: 14px; font-weight: 600; text-align: left; cursor: pointer; transition: all .15s; }
.settings-nav-item:hover { background: var(--primary-soft); color: var(--primary); }
.settings-nav-item.active { background: var(--primary); color: #fff; }
.settings-content { flex: 1; min-width: 0; }
.settings-card { padding: 28px; border: 1px solid var(--line); border-radius: 12px; background: #fff; box-shadow: 0 16px 24px rgba(21,33,72,.06); }
.settings-card-header { margin-bottom: 24px; }
.settings-card-header h2 { margin: 0 0 6px; font-size: 20px; font-weight: 800; color: var(--ink); }
.settings-card-header p { margin: 0; font-size: 14px; color: var(--muted); }
.settings-form { display: flex; flex-direction: column; gap: 20px; }
.form-actions { display: flex; justify-content: flex-end; padding-top: 8px; }
.toggle-list { display: flex; flex-direction: column; }
.toggle-item { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 16px 0; border-bottom: 1px solid #e0e4ef; cursor: pointer; }
.toggle-item:last-child { border-bottom: 0; }
.toggle-info strong { display: block; font-size: 14px; color: var(--ink); margin-bottom: 2px; }
.toggle-info span { font-size: 13px; color: var(--muted); }
.toggle-switch { width: 44px; height: 24px; accent-color: var(--primary); cursor: pointer; flex-shrink: 0; }
.success-toast { display: flex; align-items: center; gap: 10px; padding: 14px 20px; border-radius: 8px; background: var(--green-soft); color: var(--green); font-weight: 600; font-size: 14px; margin-bottom: 24px; animation: slideDown .3s ease; }
@keyframes slideDown { from { opacity: 0; transform: translateY(-12px); } to { opacity: 1; transform: translateY(0); } }
.danger-zone { margin-top: 32px; padding: 24px; border: 1px solid var(--red); border-radius: 8px; background: var(--red-soft); }
.danger-zone h3 { margin: 0 0 6px; font-size: 16px; font-weight: 800; color: var(--red); }
.danger-zone p { margin: 0 0 16px; font-size: 14px; color: #853232; }
@media (max-width:980px) { .settings-layout { flex-direction: column; } .settings-nav { position: relative; top: 0; flex-direction: row; flex-wrap: wrap; min-width: 0; } }
</style>
