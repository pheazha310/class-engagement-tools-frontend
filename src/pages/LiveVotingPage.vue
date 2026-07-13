<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { usePollStore } from '@/stores/poll'

const router = useRouter()
const authStore = useAuthStore()
const pollStore = usePollStore()

const isTeacher = () => authStore.user?.role === 'teacher'
const isStudent = () => authStore.user?.role === 'student'

onMounted(async () => {
  if (isTeacher()) {
    await pollStore.fetchTeacherPolls()
  } else if (isStudent()) {
    await pollStore.fetchActiveSchoolPolls()
  }
})
</script>

<template>
  <div class="live-voting-page">
    <!-- Teacher View -->
    <div v-if="isTeacher()" class="lv-container">
      <div class="lv-header">
        <div>
          <h1 class="lv-title">Live Polls</h1>
          <p class="lv-subtitle">Create and manage live polls for your class</p>
        </div>
        <router-link :to="{ name: 'teacher-polls-create' }" class="btn btn-primary">
          + Create Poll
        </router-link>
      </div>

      <div class="lv-tabs">
        <router-link :to="{ name: 'teacher-polls' }" class="lv-tab">
          Manage Polls
          <span class="lv-tab-arrow">→</span>
        </router-link>
      </div>

      <div v-if="pollStore.loading" class="lv-loading">Loading polls...</div>
      <div v-else-if="pollStore.polls.length === 0" class="lv-empty">
        <p>No polls yet. Create your first live poll!</p>
      </div>
      <div v-else class="lv-poll-list">
        <div
          v-for="poll in pollStore.polls.slice(0, 5)"
          :key="poll.id"
          class="lv-poll-card"
        >
          <div class="lv-poll-body">
            <div class="lv-poll-top">
              <h3 class="lv-poll-question">{{ poll.question }}</h3>
              <span :class="['badge', `badge-${poll.status}`]">{{ poll.status }}</span>
            </div>
            <div class="lv-poll-meta">
              <span>{{ poll.options?.length || 0 }} options</span>
              <span v-if="poll.room_code" class="lv-room-code">
                Code: <strong>{{ poll.room_code }}</strong>
              </span>
              <span v-if="poll.participant_count != null">
                {{ poll.participant_count }} participant{{ poll.participant_count !== 1 ? 's' : '' }}
              </span>
            </div>
          </div>
          <div class="lv-poll-actions">
            <router-link
              :to="{ name: 'teacher-polls' }"
              class="btn btn-sm btn-ghost"
            >
              View
            </router-link>
          </div>
        </div>
      </div>

      <div v-if="pollStore.polls.length > 5" class="lv-view-all">
        <router-link :to="{ name: 'teacher-polls' }" class="btn btn-ghost">
          View all polls →
        </router-link>
      </div>
    </div>

    <!-- Student View -->
    <div v-else-if="isStudent()" class="lv-container">
      <div class="lv-header">
        <div>
          <h1 class="lv-title">Live Polls</h1>
          <p class="lv-subtitle">Active polls for your school</p>
        </div>
      </div>

      <div v-if="pollStore.error" class="alert alert-error">{{ pollStore.error }}</div>

      <div v-if="pollStore.loading" class="lv-loading">Loading active polls...</div>

      <div v-else-if="pollStore.activeSchoolPolls.length === 0" class="lv-empty">
        <p>No active polls available for your school.</p>
      </div>

      <div v-else class="lv-poll-list">
        <div
          v-for="poll in pollStore.activeSchoolPolls"
          :key="poll.id"
          class="lv-poll-card"
          @click="router.push({ name: 'student-poll-vote', params: { id: poll.id } })"
        >
          <div class="lv-poll-body">
            <div class="lv-poll-top">
              <h3 class="lv-poll-question">{{ poll.question }}</h3>
              <span class="badge badge-active">LIVE</span>
            </div>
            <div class="lv-poll-meta">
              <span>{{ poll.options?.length || 0 }} options</span>
              <span v-if="poll.total_votes != null">
                {{ poll.total_votes }} vote{{ poll.total_votes !== 1 ? 's' : '' }}
              </span>
            </div>
          </div>
          <div class="lv-poll-actions">
            <span class="btn btn-sm btn-primary">Vote</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Unauthenticated / Unknown role -->
    <div v-else class="lv-container">
      <div class="lv-card">
        <div class="lv-card-icon">🗳️</div>
        <h1 class="lv-card-title">Live Polls</h1>
        <p class="lv-card-subtitle">
          <router-link :to="{ name: 'login' }">Log in</router-link>
          or
          <router-link :to="{ name: 'register' }">register</router-link>
          to participate in live polls.
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.live-voting-page {
  min-height: 100vh;
  padding: 88px 24px 40px;
  background: #f8fafc;
}

.lv-container {
  max-width: 720px;
  margin: 0 auto;
}

.lv-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 24px;
  gap: 16px;
}

.lv-title {
  font-size: 28px;
  font-weight: 800;
  color: #0f172a;
  margin: 0;
}

.lv-subtitle {
  font-size: 14px;
  color: #64748b;
  margin: 4px 0 0;
}

.lv-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
}

.lv-tab {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 18px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  color: #0f172a;
  text-decoration: none;
  transition: all 0.2s;
}

.lv-tab:hover {
  border-color: #2563eb;
  color: #2563eb;
}

.lv-tab-arrow {
  font-size: 16px;
}

.lv-loading,
.lv-empty {
  text-align: center;
  padding: 60px 20px;
  color: #94a3b8;
  font-size: 15px;
}

.lv-poll-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.lv-poll-card {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 16px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  transition: box-shadow 0.2s;
}

.lv-poll-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.lv-poll-body {
  flex: 1;
  min-width: 0;
}

.lv-poll-top {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 6px;
}

.lv-poll-question {
  font-size: 15px;
  font-weight: 600;
  color: #0f172a;
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.lv-poll-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  font-size: 13px;
  color: #94a3b8;
}

.lv-room-code strong {
  color: #2563eb;
  font-family: monospace;
  font-size: 14px;
  letter-spacing: 0.1em;
}

.lv-poll-actions {
  flex-shrink: 0;
}

.lv-view-all {
  text-align: center;
  margin-top: 16px;
}

/* Student join card */
.lv-card {
  max-width: 480px;
  margin: 40px auto;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 40px 32px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
  text-align: center;
}

.lv-card-icon {
  font-size: 48px;
  margin-bottom: 8px;
}

.lv-card-title {
  font-size: 24px;
  font-weight: 800;
  color: #0f172a;
  margin: 0 0 8px;
}

.lv-card-subtitle {
  font-size: 14px;
  color: #64748b;
  margin: 0 0 24px;
}

.lv-card-subtitle a {
  color: #2563eb;
  font-weight: 600;
}

.lv-input-wrap {
  margin-bottom: 16px;
}

.lv-input {
  width: 100%;
  padding: 16px;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  font-size: 28px;
  font-weight: 700;
  font-family: monospace;
  text-align: center;
  letter-spacing: 0.3em;
  outline: none;
  transition: border-color 0.2s;
  background: #f8fafc;
  color: #0f172a;
  text-transform: uppercase;
}

.lv-input:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.1);
}

.alert {
  padding: 10px 14px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 16px;
}

.alert-error {
  background: #fef2f2;
  color: #dc2626;
  border: 1px solid #fecaca;
}

.badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  flex-shrink: 0;
}

.badge-draft {
  background: #f1f5f9;
  color: #64748b;
}

.badge-active {
  background: #dcfce7;
  color: #16a34a;
}

.badge-ended {
  background: #fef3c7;
  color: #d97706;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  text-decoration: none;
  font-family: inherit;
}

.btn-sm {
  padding: 6px 14px;
  font-size: 13px;
}

.btn-full {
  width: 100%;
}

.btn-primary {
  background: #2563eb;
  color: white;
}

.btn-primary:hover {
  background: #1d4ed8;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-ghost {
  background: transparent;
  color: #64748b;
}

.btn-ghost:hover {
  background: #f1f5f9;
  color: #0f172a;
}

@media (max-width: 640px) {
  .live-voting-page {
    padding: 80px 16px 32px;
  }

  .lv-header {
    flex-direction: column;
  }

  .lv-card {
    padding: 28px 20px;
  }

  .lv-input {
    font-size: 24px;
    padding: 14px;
  }
}
</style>
