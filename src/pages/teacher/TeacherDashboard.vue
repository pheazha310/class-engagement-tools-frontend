<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import Sidebar from '@/components/teacher/Sidebar.vue'
import DashboardStats from '@/components/teacher/DashboardStats.vue'
import EngageClassSection from '@/components/teacher/EngageClassSection.vue'
import RecentActivities from '@/components/teacher/RecentActivities.vue'
import LivePollSection from '@/components/teacher/LivePollSection.vue'
import ParticipationTrends from '@/components/teacher/ParticipationTrends.vue'

const authStore = useAuthStore()
const teacherName = ref('Dr. Jenkins')
const currentHour = ref(new Date().getHours())

const stats = ref({
  totalClasses: 4,
  totalStudents: 128,
  activePolls: 2,
  scheduledSessions: 1,
  liveSessions: 8,
  engagementMetric: 450,
  engagementIncrease: 12
})

const recentActivities = ref([
  {
    id: 1,
    name: 'Unit 4 Review',
    class: 'BIOL-102',
    status: 'Live',
    timeAgo: 'Created 2h ago'
  },
  {
    id: 2,
    name: 'Micro Economics Quiz',
    class: 'ECON-101',
    status: 'Completed',
    timeAgo: 'Yesterday, 15:30'
  },
  {
    id: 3,
    name: 'Icebreaker: Tech Trivia',
    class: 'CS-101 Intro',
    status: 'Scheduled',
    timeAgo: 'Scheduled for 3 h'
  }
])

const livePoll = ref({
  title: 'Live Poll: Concept Check',
  question: 'Which of the following best describes Option A?',
  options: [
    { label: 'Option A: Mitochondrion', percentage: 68 },
    { label: 'Option B: Mitochondrion', percentage: 28 },
    { label: 'Option C: Nucleus', percentage: 7 }
  ],
  responses: 156
})

const getGreeting = () => {
  if (currentHour.value < 12) return 'Good Morning'
  if (currentHour.value < 18) return 'Good Afternoon'
  return 'Good Evening'
}

onMounted(() => {
  // Fetch teacher data from API if needed
})
</script>

<template>
  <div class="teacher-dashboard">
    <Sidebar />

    <div class="dashboard-container">
      <!-- Header -->
      <div class="dashboard-header">
        <div class="header-greeting">
          <h1 class="greeting-text">{{ getGreeting() }}, {{ teacherName }}</h1>
          <p class="engagement-note">Your classroom engagement is up {{ stats.engagementIncrease }}% this week. Keep it up!</p>
        </div>
        <div class="header-actions">
          <button class="btn-session-history">Session History</button>
          <button class="btn-quick-launch">Quick Launch</button>
        </div>
      </div>

      <!-- Statistics Cards -->
      <DashboardStats :stats="stats" />

      <!-- Engage Your Class Section -->
      <EngageClassSection />

      <!-- Recent Activities and Live Poll Section -->
      <div class="main-content-grid">
        <RecentActivities :activities="recentActivities" />
        <LivePollSection :poll="livePoll" />
      </div>

      <!-- Participation Trends -->
      <ParticipationTrends />
    </div>
  </div>
</template>

<style scoped>
.teacher-dashboard {
  display: flex;
  height: 100vh;
  background-color: #f8fafc;
}

.dashboard-container {
  flex: 1;
  overflow-y: auto;
  padding: 32px;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 32px;
}

.header-greeting h1 {
  font-size: 28px;
  font-weight: 700;
  color: #1a202c;
  margin: 0 0 8px 0;
}

.engagement-note {
  font-size: 14px;
  color: #718096;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.btn-session-history,
.btn-quick-launch {
  padding: 10px 16px;
  border: 1px solid #e2e8f0;
  background: white;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  color: #4a5568;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-session-history:hover,
.btn-quick-launch:hover {
  background: #f7fafc;
  border-color: #cbd5e0;
}

.btn-quick-launch {
  background: #3182ce;
  color: white;
  border-color: #3182ce;
}

.btn-quick-launch:hover {
  background: #2c5aa0;
  border-color: #2c5aa0;
}

.main-content-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  margin: 32px 0;
}

@media (max-width: 1400px) {
  .main-content-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .dashboard-container {
    padding: 16px;
  }

  .dashboard-header {
    flex-direction: column;
    gap: 16px;
  }

  .header-greeting h1 {
    font-size: 24px;
  }
}
</style>
