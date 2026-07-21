<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import EmptyState from '@/components/EmptyState.vue'
import { useLivePollStore } from '@/stores/livePollStore'

const authStore = useAuthStore()
const router = useRouter()
const store = useLivePollStore()
const currentHour = ref(new Date().getHours())

const loading = ref(true)
const activePolls = ref<any[]>([])
const error = ref<string | null>(null)

const getGreeting = () => {
  if (currentHour.value < 12) return 'Good Morning'
  if (currentHour.value < 18) return 'Good Afternoon'
  return 'Good Evening'
}

const studentName = computed(() => {
  return authStore.user?.name || 'Student'
})

onMounted(async () => {
  try {
    await store.fetchActivePolls()
    activePolls.value = store.activePolls
  } catch {
    error.value = 'Failed to load dashboard data.'
  } finally {
    loading.value = false
  }
})

function vote(token: string) {
  router.push({ name: 'live-vote-public', params: { token } })
}

function navigateToPolls() {
  router.push({ name: 'active-polls-list' })
}

const typeLabels: Record<string, string> = {
  multiple_choice: 'Multiple Choice',
  yes_no: 'Yes / No',
  rating: 'Rating Scale',
}
</script>

<template>
  <div class="student-dashboard">
    <div class="dashboard-container">
      <!-- Header -->
      <div class="dashboard-header">
        <div class="header-greeting">
          <h1 class="greeting-text">{{ getGreeting() }}, {{ studentName }}! 👋</h1>
          <p class="welcome-note">Welcome to your student dashboard. Participate in polls and engage with your class!</p>
        </div>
      </div>

      <!-- Quick Stats -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">📊</div>
          <div class="stat-content">
            <div class="stat-value">{{ activePolls.length }}</div>
            <div class="stat-label">Active Polls</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">✅</div>
          <div class="stat-content">
            <div class="stat-value">0</div>
            <div class="stat-label">Polls Completed</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">🏆</div>
          <div class="stat-content">
            <div class="stat-value">0</div>
            <div class="stat-label">Achievements</div>
          </div>
        </div>
      </div>

      <!-- Active Polls Section -->
      <div class="polls-section">
        <div class="section-header">
          <h2 class="section-title">Active Polls</h2>
          <button class="btn-view-all" @click="navigateToPolls">
            View All
            <svg class="icon-arrow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        <div v-if="loading" class="loading-container">
          <LoadingSpinner size="lg" />
          <p>Loading your dashboard...</p>
        </div>

        <div v-else-if="error" class="error-container">
          <p class="error-text">{{ error }}</p>
          <button class="btn-retry" @click="navigateToPolls">Browse Polls</button>
        </div>

        <div v-else-if="!activePolls.length" class="no-polls">
          <EmptyState
            title="No active polls"
            description="There are no active polls available right now. Check back later!"
          >
            <div class="no-polls-hint">
              <p>Polls appear here when your teachers start them.</p>
            </div>
          </EmptyState>
        </div>

        <div v-else class="polls-grid">
          <div
            v-for="poll in activePolls"
            :key="poll.id"
            class="poll-card"
            @click="vote(poll.public_token)"
          >
            <div class="poll-card-header">
              <div class="poll-info">
                <h3 class="poll-question">{{ poll.question }}</h3>
                <p v-if="poll.title" class="poll-title">{{ poll.title }}</p>
              </div>
              <span class="live-badge">
                <span class="live-dot"></span>
                Live
              </span>
            </div>

            <div class="poll-meta">
              <span class="meta-tag">{{ typeLabels[poll.poll_type] || poll.poll_type }}</span>
              <span class="meta-tag">{{ poll.options_count }} options</span>
              <span v-if="poll.anonymous" class="meta-tag meta-anonymous">Anonymous</span>
            </div>

            <div class="poll-action">
              <span class="vote-link">
                Vote now
                <svg class="icon-arrow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="quick-actions">
        <h2 class="section-title">Quick Actions</h2>
        <div class="actions-grid">
          <button class="action-card" @click="navigateToPolls">
            <div class="action-icon">📋</div>
            <div class="action-content">
              <h3>View All Polls</h3>
              <p>Browse and participate in available polls</p>
            </div>
          </button>
          <button class="action-card" @click="router.push('/profile')">
            <div class="action-icon">👤</div>
            <div class="action-content">
              <h3>My Profile</h3>
              <p>View and edit your profile</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.student-dashboard {
  min-height: 100vh;
  background: linear-gradient(to bottom, #f8fafc, #f1f5f9);
  padding-top: 24px;
}

.dashboard-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px 48px;
}

.dashboard-header {
  margin-bottom: 32px;
}

.header-greeting {
  background: white;
  padding: 32px;
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  border: 1px solid #e2e8f0;
}

.greeting-text {
  font-size: 32px;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 8px 0;
}

.welcome-note {
  font-size: 16px;
  color: #64748b;
  margin: 0;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 20px;
  margin-bottom: 40px;
}

.stat-card {
  background: white;
  padding: 24px;
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  border: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  gap: 16px;
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08);
  border-color: #6366f1;
}

.stat-icon {
  font-size: 40px;
  width: 64px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%);
  border-radius: 14px;
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #6366f1;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 14px;
  color: #64748b;
  font-weight: 500;
}

.polls-section {
  margin-bottom: 40px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.section-title {
  font-size: 24px;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
}

.btn-view-all {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: white;
  color: #6366f1;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-view-all:hover {
  background: #6366f1;
  color: white;
  border-color: #6366f1;
}

.icon-arrow {
  width: 16px;
  height: 16px;
}

.loading-container {
  text-align: center;
  padding: 60px 20px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  border: 1px solid #e2e8f0;
}

.loading-container p {
  margin-top: 16px;
  color: #64748b;
  font-size: 14px;
}

.error-container {
  text-align: center;
  padding: 60px 20px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  border: 1px solid #e2e8f0;
}

.error-text {
  color: #dc2626;
  margin-bottom: 16px;
}

.btn-retry {
  padding: 10px 20px;
  background: #6366f1;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-retry:hover {
  background: #4f46e5;
}

.no-polls {
  background: white;
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  border: 1px solid #e2e8f0;
  padding: 48px 24px;
}

.no-polls-hint {
  margin-top: 16px;
  padding: 16px;
  background: #f8fafc;
  border-radius: 12px;
  border: 1px dashed #e2e8f0;
}

.no-polls-hint p {
  margin: 0;
  font-size: 14px;
  color: #64748b;
}

.polls-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
  gap: 20px;
}

.poll-card {
  background: white;
  padding: 24px;
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  border: 1px solid #e2e8f0;
  cursor: pointer;
  transition: all 0.3s ease;
}

.poll-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.1);
  border-color: #6366f1;
}

.poll-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 16px;
}

.poll-info {
  flex: 1;
  min-width: 0;
}

.poll-question {
  font-size: 18px;
  font-weight: 600;
  color: #0f172a;
  margin: 0 0 6px 0;
  line-height: 1.4;
}

.poll-title {
  font-size: 14px;
  color: #64748b;
  margin: 0;
}

.live-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: #dcfce7;
  color: #16a34a;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  flex-shrink: 0;
}

.live-dot {
  width: 8px;
  height: 8px;
  background: #16a34a;
  border-radius: 50%;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.poll-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
}

.meta-tag {
  padding: 4px 10px;
  background: #f1f5f9;
  color: #475569;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
}

.meta-anonymous {
  background: #f3e8ff;
  color: #9333ea;
}

.poll-action {
  display: flex;
  justify-content: flex-end;
  padding-top: 12px;
  border-top: 1px solid #f1f5f9;
}

.vote-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #6366f1;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.2s ease;
}

.poll-card:hover .vote-link {
  color: #4f46e5;
  gap: 10px;
}

.quick-actions {
  background: white;
  padding: 32px;
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  border: 1px solid #e2e8f0;
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
  margin-top: 20px;
}

.action-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
  width: 100%;
}

.action-card:hover {
  background: #eef2ff;
  border-color: #6366f1;
  transform: translateX(4px);
}

.action-icon {
  font-size: 32px;
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  border-radius: 12px;
  flex-shrink: 0;
}

.action-content {
  flex: 1;
}

.action-content h3 {
  font-size: 16px;
  font-weight: 600;
  color: #0f172a;
  margin: 0 0 4px 0;
}

.action-content p {
  font-size: 13px;
  color: #64748b;
  margin: 0;
}

@media (max-width: 768px) {
  .dashboard-container {
    padding: 0 16px 32px;
  }

  .greeting-text {
    font-size: 24px;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .polls-grid {
    grid-template-columns: 1fr;
  }

  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
}
</style>
</parameter>
</parameter>
</write_to_file>
