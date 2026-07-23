<script setup lang="ts">
import { ref, computed, onMounted, h, type PropType } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useLivePollStore } from '@/stores/livePollStore'
import type { ActivePollItem } from '@/types/livePoll'

const router = useRouter()
const authStore = useAuthStore()
const pollStore = useLivePollStore()
const currentHour = ref(new Date().getHours())

// ── SVG Icon system (same design language as teacher dashboard) ──
const iconPaths = {
  logo: ['M4 10l8-4 8 4-8 4-8-4z', 'M6 11.5v4c0 .8 2.7 2.5 6 2.5s6-1.7 6-2.5v-4', 'M20 10v5'],
  grid: ['M4 4h6v6H4z', 'M14 4h6v6h-6z', 'M4 14h6v6H4z', 'M14 14h6v6h-6z'],
  users: ['M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2', 'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8', 'M22 21v-2a4 4 0 0 0-3-3.87', 'M16 3.13a4 4 0 0 1 0 7.75'],
  clipboard: ['M9 3h6v4H9z', 'M7 5H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2', 'M8 12h8', 'M8 16h8'],
  history: ['M3 12a9 9 0 1 0 3-6.7', 'M3 4v6h6', 'M12 7v5l3 2'],
  settings: ['M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6', 'M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .34 1.7 1.7 0 0 0-.7 1.52V21a2 2 0 1 1-4 0v-.09A1.7 1.7 0 0 0 8 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.34-1 1.7 1.7 0 0 0-1.52-.7H2.6a2 2 0 1 1 0-4h.09A1.7 1.7 0 0 0 4.6 8a1.7 1.7 0 0 0-.34-1.88l-.06-.06A2 2 0 1 1 7.03 3.2l.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.34 1.7 1.7 0 0 0 .7-1.52V2.6a2 2 0 1 1 4 0v.09A1.7 1.7 0 0 0 16 4.6a1.7 1.7 0 0 0 1.88-.34l-.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.4 9c0 .36.12.7.34 1 .34.47.86.73 1.52.7h.14a2 2 0 1 1 0 4h-.09A1.7 1.7 0 0 0 19.4 15z'],
  search: ['M21 21l-4.35-4.35', 'M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15z'],
  bell: ['M18 8a6 6 0 0 0-12 0c0 7-3 7-3 7h18s-3 0-3-7', 'M13.73 21a2 2 0 0 1-3.46 0'],
  chevron: ['M6 9l6 6 6-6'],
  chevronRight: ['M9 18l6-6-6-6'],
  plus: ['M12 5v14', 'M5 12h14'],
  cap: ['M4 10l8-4 8 4-8 4-8-4z', 'M6 12v4c2 2 10 2 12 0v-4'],
  poll: ['M5 20V9', 'M12 20V4', 'M19 20v-7', 'M3 20h18'],
  quiz: ['M9 9a3 3 0 1 1 5.5 1.7c-.7.7-1.7 1.1-2.5 1.8V14', 'M12 18h.01', 'M4 4h16v16H4z'],
  timer: ['M10 2h4', 'M12 14V8', 'M12 22a8 8 0 1 0 0-16 8 8 0 0 0 0 16z'],
  star: ['M12 3l2.7 5.5 6.1.9-4.4 4.2 1 6-5.4-2.9L6.6 19.6l1-6-4.4-4.2 6.1-.9L12 3z'],
  zap: ['M13 2L4 14h7l-1 8 9-12h-7l1-8z'],
  external: ['M14 3h7v7', 'M21 3l-9 9', 'M20 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h5'],
  book: ['M4 19.5A2.5 2.5 0 0 1 6.5 17H20', 'M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z'],
  check: ['M5 13l4 4L19 7'],
  x: ['M18 6L6 18', 'M6 6l12 12'],
  home: ['M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m-4-4h4m6 4v-4a1 1 0 00-1-1h-2a1 1 0 00-1 1v4m-6 0h6'],
  trendingUp: ['M22 7l-7 7-4-4-6 6', 'M17 7h5v5'],
  calendar: ['M8 2v4', 'M16 2v4', 'M3 9h18', 'M5 4h14a2 2 0 0 1 2 2v14H3V6a2 2 0 0 1 2-2z'],
  activity: ['M4 19V5', 'M8 17v-5', 'M13 17V8', 'M18 17v-8', 'M22 19H3'],
  trophy: ['M6 9H4.5a2.5 2.5 0 0 1 0-5H6', 'M18 9h1.5a2.5 2.5 0 0 0 0-5H18', 'M4 22h16', 'M10 22V9l-3-5h10l-3 5v13', 'M12 14v4'],
  userCheck: ['M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2', 'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8', 'M16 11l2 2 4-4'],
  refresh: ['M23 4v6h-6', 'M1 20v-6h6', 'M3.5 9a9 9 0 0 1 14.5-3.5L23 10M1 14l5 4.5A9 9 0 0 0 20.5 15'],
  play: ['M5 3l14 9-14 9V3z'],
  logOut: ['M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4', 'M16 17l5-5-5-5', 'M21 12H9'],
} as const

type IconName = keyof typeof iconPaths

const IconGlyph = {
  name: 'IconGlyph',
  props: {
    icon: { type: String as PropType<IconName>, required: true },
    size: { type: [Number, String], default: 20 },
    strokeWidth: { type: Number, default: 2 },
  },
  setup(props: { icon: IconName; size: number | string; strokeWidth: number }) {
    return () =>
      h(
        'svg',
        {
          width: props.size,
          height: props.size,
          viewBox: '0 0 24 24',
          fill: 'none',
          stroke: 'currentColor',
          'stroke-width': props.strokeWidth,
          'stroke-linecap': 'round',
          'stroke-linejoin': 'round',
          'aria-hidden': 'true',
          focusable: 'false',
        },
        iconPaths[props.icon].map((path) => h('path', { d: path })),
      )
  },
}

// ── Data ───────────────────────────────────────────────────────────
const loading = ref(true)
const activePolls = ref<ActivePollItem[]>([])
const error = ref<string | null>(null)

const studentName = computed(() => authStore.user?.name || 'Student')
const studentEmail = computed(() => authStore.user?.email || '')
const studentSchool = computed(() => authStore.user?.school ?? '')
const studentInitials = computed(() => {
  const name = studentName.value
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return (parts[0]?.[0] ?? '').toUpperCase()
  return ((parts[0]?.[0] ?? '') + (parts[parts.length - 1]?.[0] ?? '')).toUpperCase()
})

const getGreeting = () => {
  if (currentHour.value < 12) return 'Good Morning'
  if (currentHour.value < 18) return 'Good Afternoon'
  return 'Good Evening'
}

const typeLabels: Record<string, string> = {
  multiple_choice: 'Multiple Choice',
  yes_no: 'Yes / No',
  rating: 'Rating Scale',
  open_ended: 'Open Ended',
}

const typeIcons: Record<string, IconName> = {
  multiple_choice: 'poll',
  yes_no: 'check',
  rating: 'star',
  open_ended: 'clipboard',
}

const typeColors: Record<string, string> = {
  multiple_choice: 'blue',
  yes_no: 'green',
  rating: 'orange',
  open_ended: 'violet',
}

const demoPolls: ActivePollItem[] = [
  {
    id: '1',
    title: 'Concept Check: Module 3',
    question: 'Which of the following best describes cloud computing?',
    poll_type: 'multiple_choice',
    public_token: 'demo-token-1',
    options_count: 4,
    anonymous: false,
    duration_minutes: null,
    started_at: new Date().toISOString(),
    allow_multiple_votes: false,
    created_at: new Date().toISOString(),
  },
  {
    id: '2',
    title: 'Quick Check-In',
    question: 'Do you understand the material covered today?',
    poll_type: 'yes_no',
    public_token: 'demo-token-2',
    options_count: 2,
    anonymous: true,
    duration_minutes: null,
    started_at: new Date().toISOString(),
    allow_multiple_votes: false,
    created_at: new Date().toISOString(),
  },
  {
    id: '3',
    title: 'Course Feedback',
    question: 'Rate your understanding of this week\'s topic (1-5)',
    poll_type: 'rating',
    public_token: 'demo-token-3',
    options_count: 5,
    anonymous: true,
    duration_minutes: null,
    started_at: new Date().toISOString(),
    allow_multiple_votes: false,
    created_at: new Date().toISOString(),
  },
]

const completedActivities = [
  { name: 'Biology Quiz - Cell Division', date: 'Oct 24, 2023', score: '85%', type: 'quiz' as const },
  { name: 'Economics Poll - Supply & Demand', date: 'Oct 23, 2023', score: '92%', type: 'poll' as const },
  { name: 'Chemistry Lab Safety Quiz', date: 'Oct 20, 2023', score: '78%', type: 'quiz' as const },
]

// ── Methods ────────────────────────────────────────────────────────
async function fetchData() {
  loading.value = true
  error.value = null
  try {
    await pollStore.fetchActivePolls()
    activePolls.value = pollStore.activePolls.length > 0 ? pollStore.activePolls : demoPolls as any
  } catch (e: any) {
    console.error('Failed to fetch active polls:', e)
    // Show demo data on error
    activePolls.value = demoPolls as any
  } finally {
    loading.value = false
  }
}

function vote(poll: ActivePollItem) {
  if (poll.public_token) {
    router.push({ name: 'live-vote-public', params: { token: poll.public_token } })
  }
}

function navigateToAllPolls() {
  router.push({ name: 'active-polls-list' })
}

function navigateToProfile() {
  router.push('/profile')
}

function handleLogout() {
  authStore.logout()
  router.push('/login')
}

onMounted(() => {
  fetchData()
})
</script>

<template>
  <div class="student-dashboard">
    <!-- ── Top Navigation Bar ─────────────────────────────────────── -->
    <header class="top-nav">
      <div class="nav-inner">
        <div class="brand-section">
          <div class="brand-icon">
            <IconGlyph icon="logo" :size="24" :stroke-width="2.3" />
          </div>
          <div class="brand-text">
            <p class="brand-name">EduPulse</p>
            <p class="brand-sub">Student Portal</p>
          </div>
        </div>

        <nav class="nav-links">
          <button class="nav-link active" type="button">
            <IconGlyph icon="home" :size="20" />
            <span>Dashboard</span>
          </button>
          <button class="nav-link" type="button" @click="navigateToAllPolls">
            <IconGlyph icon="poll" :size="20" />
            <span>Active Polls</span>
          </button>
          <button class="nav-link" type="button" @click="navigateToProfile">
            <IconGlyph icon="users" :size="20" />
            <span>Profile</span>
          </button>
        </nav>

        <div class="nav-right">
          <button class="icon-btn" type="button" aria-label="Notifications">
            <IconGlyph icon="bell" :size="22" />
            <span class="notif-dot"></span>
          </button>
          <div class="user-profile-mini">
            <div class="avatar-mini">{{ studentInitials }}</div>
            <div class="user-info-mini">
              <span class="user-name">{{ studentName }}</span>
              <span class="user-role">Student</span>
            </div>
          </div>
          <button class="logout-btn" type="button" @click="handleLogout" title="Logout">
            <IconGlyph icon="logOut" :size="20" />
          </button>
        </div>
      </div>
    </header>

    <!-- ── Main Content ──────────────────────────────────────────── -->
    <main class="main-content">
      <div class="content-container">
        <!-- Greeting & Stats -->
        <div class="greeting-section">
          <div class="greeting-text-block">
            <h1>{{ getGreeting() }}, {{ studentName }}! 👋</h1>
            <p>Welcome back! Here's what's happening in your classes today.</p>
          </div>
          <div class="greeting-avatar">
            <div class="big-avatar">{{ studentInitials }}</div>
            <div class="avatar-details">
              <span class="avatar-name">{{ studentName }}</span>
              <span v-if="studentSchool" class="avatar-school">{{ studentSchool }}</span>
              <span class="avatar-email">{{ studentEmail }}</span>
            </div>
          </div>
        </div>

        <!-- Stats Cards -->
        <section class="stats-grid" aria-label="Dashboard statistics">
          <article class="stat-card tone-blue">
            <div class="stat-icon-wrap">
              <IconGlyph icon="zap" :size="24" />
            </div>
            <div class="stat-body">
              <strong class="stat-value">{{ activePolls.length }}</strong>
              <span class="stat-label">Active Polls</span>
            </div>
          </article>
          <article class="stat-card tone-green">
            <div class="stat-icon-wrap">
              <IconGlyph icon="check" :size="24" />
            </div>
            <div class="stat-body">
              <strong class="stat-value">{{ completedActivities.length }}</strong>
              <span class="stat-label">Completed</span>
            </div>
          </article>
          <article class="stat-card tone-orange">
            <div class="stat-icon-wrap">
              <IconGlyph icon="trophy" :size="24" />
            </div>
            <div class="stat-body">
              <strong class="stat-value">78%</strong>
              <span class="stat-label">Avg. Score</span>
            </div>
          </article>
          <article class="stat-card tone-violet">
            <div class="stat-icon-wrap">
              <IconGlyph icon="trendingUp" :size="24" />
            </div>
            <div class="stat-body">
              <strong class="stat-value">+12%</strong>
              <span class="stat-label">Improvement</span>
            </div>
          </article>
        </section>

        <div class="dashboard-grid">
          <!-- Active Polls Section -->
          <section class="panel polls-panel">
            <div class="panel-header">
              <h2>Active Polls</h2>
              <button class="link-button" type="button" @click="navigateToAllPolls">
                View All
                <IconGlyph icon="chevron" :size="16" />
              </button>
            </div>

            <div v-if="loading" class="panel-loading">
              <div class="spinner"></div>
              <p>Loading polls...</p>
            </div>

            <div v-else-if="activePolls.length === 0" class="panel-empty">
              <IconGlyph icon="poll" :size="48" class="empty-icon" />
              <h3>No Active Polls</h3>
              <p>There are no active polls right now. Check back later!</p>
            </div>

            <div v-else class="poll-cards">
              <div
                v-for="poll in activePolls"
                :key="poll.id"
                class="poll-card"
                :class="`type-${typeColors[poll.poll_type] || 'blue'}`"
                @click="vote(poll)"
              >
                <div class="poll-card-top">
                  <div class="poll-type-badge" :class="`badge-${typeColors[poll.poll_type] || 'blue'}`">
                    <IconGlyph :icon="typeIcons[poll.poll_type] || 'poll'" :size="14" />
                    <span>{{ typeLabels[poll.poll_type] || poll.poll_type }}</span>
                  </div>
                  <span class="live-indicator">
                    <span class="live-dot"></span>
                    Live
                  </span>
                </div>
                <h3 class="poll-question">{{ poll.question }}</h3>
                <p v-if="poll.title" class="poll-title">{{ poll.title }}</p>
                <div class="poll-card-footer">
                  <span class="poll-meta">
                    <IconGlyph icon="users" :size="14" />
                    {{ poll.options_count }} options
                  </span>
                  <span v-if="poll.anonymous" class="poll-meta anonymous">
                    <IconGlyph icon="userCheck" :size="14" />
                    Anonymous
                  </span>
                  <span class="vote-cta">
                    Vote Now
                    <IconGlyph icon="chevron" :size="14" />
                  </span>
                </div>
              </div>
            </div>
          </section>

          <!-- Recent Activity / Completed -->
          <aside class="panel activity-panel">
            <div class="panel-header">
              <h2>Recent Activity</h2>
              <button class="icon-btn compact" type="button">
                <IconGlyph icon="refresh" :size="16" />
              </button>
            </div>

            <div class="activity-list">
              <div v-for="(activity, index) in completedActivities" :key="index" class="activity-item">
                <div class="activity-icon" :class="activity.type === 'quiz' ? 'icon-quiz' : 'icon-poll'">
                  <IconGlyph :icon="activity.type === 'quiz' ? 'quiz' : 'poll'" :size="20" />
                </div>
                <div class="activity-info">
                  <strong>{{ activity.name }}</strong>
                  <span class="activity-date">{{ activity.date }}</span>
                </div>
                <div class="activity-score" :class="parseInt(activity.score) >= 80 ? 'score-good' : 'score-ok'">
                  {{ activity.score }}
                </div>
              </div>
            </div>

            <div class="panel-footer-action">
              <button class="ghost-button" type="button">
                View Full History
                <IconGlyph icon="chevron" :size="16" />
              </button>
            </div>
          </aside>

          <!-- Quick Actions -->
          <aside class="panel quick-actions-panel">
            <div class="panel-header">
              <h2>Quick Actions</h2>
            </div>
            <div class="quick-grid">
              <button class="quick-action tone-blue" type="button" @click="navigateToAllPolls">
                <IconGlyph icon="poll" :size="24" />
                <span>Vote on Polls</span>
              </button>
              <button class="quick-action tone-green" type="button" @click="navigateToProfile">
                <IconGlyph icon="users" :size="24" />
                <span>My Profile</span>
              </button>
              <button class="quick-action tone-orange" type="button">
                <IconGlyph icon="timer" :size="24" />
                <span>View Schedule</span>
              </button>
              <button class="quick-action tone-violet" type="button">
                <IconGlyph icon="book" :size="24" />
                <span>Resources</span>
              </button>
            </div>
          </aside>

          <!-- Upcoming / Schedule -->
          <section class="panel schedule-panel">
            <div class="panel-header">
              <h2>Upcoming</h2>
              <button class="link-button" type="button">
                View Calendar
                <IconGlyph icon="chevron" :size="16" />
              </button>
            </div>
            <div class="schedule-list">
              <div class="schedule-item">
                <div class="schedule-date-box">
                  <strong>25</strong>
                  <span>Oct</span>
                </div>
                <div class="schedule-info">
                  <strong>Biology Quiz - Genetics</strong>
                  <span>9:00 AM - Science Hall 301</span>
                </div>
                <span class="schedule-badge">Quiz</span>
              </div>
              <div class="schedule-item">
                <div class="schedule-date-box">
                  <strong>27</strong>
                  <span>Oct</span>
                </div>
                <div class="schedule-info">
                  <strong>Economics Group Project Due</strong>
                  <span>11:59 PM - Online Submission</span>
                </div>
                <span class="schedule-badge badge-orange">Deadline</span>
              </div>
              <div class="schedule-item">
                <div class="schedule-date-box">
                  <strong>30</strong>
                  <span>Oct</span>
                </div>
                <div class="schedule-info">
                  <strong>Chemistry Lab Report</strong>
                  <span>2:00 PM - Lab B-12</span>
                </div>
                <span class="schedule-badge badge-blue">Lab</span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
/* ── CSS Variables ──────────────────────────────────────────── */
.student-dashboard {
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
  min-height: 100vh;
  background: var(--surface-soft);
  color: var(--ink);
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

button {
  cursor: pointer;
  font: inherit;
}

/* ── Top Navigation ─────────────────────────────────────────── */
.top-nav {
  position: sticky;
  top: 0;
  z-index: 100;
  background: rgba(255, 255, 255, 0.97);
  border-bottom: 1px solid var(--line);
  backdrop-filter: blur(8px);
}

.nav-inner {
  display: flex;
  align-items: center;
  gap: 32px;
  max-width: 1200px;
  margin: 0 auto;
  min-height: 68px;
  padding: 0 32px;
}

.brand-section {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.brand-icon {
  display: grid;
  width: 28px;
  height: 28px;
  place-items: center;
  color: var(--primary);
}

.brand-text {
  line-height: 1.2;
}

.brand-name {
  margin: 0;
  font-size: 15px;
  font-weight: 800;
  color: var(--primary);
}

.brand-sub {
  margin: 0;
  font-size: 10px;
  font-weight: 700;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.nav-links {
  display: flex;
  gap: 4px;
}

.nav-link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 38px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: var(--muted);
  padding: 0 16px;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.15s;
}

.nav-link:hover {
  background: var(--primary-soft);
  color: var(--primary);
}

.nav-link.active {
  background: var(--primary);
  color: #ffffff;
}

.nav-right {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-left: auto;
  flex-shrink: 0;
}

.icon-btn {
  display: inline-grid;
  width: 40px;
  height: 40px;
  place-items: center;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: #3a4255;
  position: relative;
  transition: background 0.15s;
}

.icon-btn:hover {
  background: #f0f2f7;
}

.compact {
  width: 36px;
  height: 36px;
}

.notif-dot {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--red);
  border: 2px solid #ffffff;
}

.user-profile-mini {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 4px 12px 4px 4px;
  border-radius: 8px;
  background: var(--surface-soft);
}

.avatar-mini {
  display: grid;
  width: 34px;
  height: 34px;
  place-items: center;
  border-radius: 8px;
  background: var(--primary);
  color: #ffffff;
  font-size: 13px;
  font-weight: 800;
}

.user-info-mini {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
}

.user-name {
  font-size: 13px;
  font-weight: 700;
  color: var(--ink);
}

.user-role {
  font-size: 10px;
  font-weight: 600;
  color: var(--muted);
  text-transform: uppercase;
}

.logout-btn {
  display: inline-grid;
  width: 36px;
  height: 36px;
  place-items: center;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: var(--muted);
  transition: all 0.15s;
}

.logout-btn:hover {
  background: var(--red-soft);
  color: var(--red);
}

/* ── Main Content ───────────────────────────────────────────── */
.main-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 32px 32px 48px;
}

/* ── Greeting Section ───────────────────────────────────────── */
.greeting-section {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 32px;
  padding: 28px 32px;
  border-radius: 12px;
  background: linear-gradient(135deg, #001f9e 0%, #2547bc 100%);
  color: #ffffff;
}

.greeting-text-block h1 {
  margin: 0;
  font-size: 26px;
  font-weight: 800;
}

.greeting-text-block p {
  margin: 6px 0 0;
  font-size: 15px;
  opacity: 0.85;
}

.greeting-avatar {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-shrink: 0;
}

.big-avatar {
  display: grid;
  width: 60px;
  height: 60px;
  place-items: center;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.2);
  font-size: 22px;
  font-weight: 800;
  border: 2px solid rgba(255, 255, 255, 0.3);
}

.avatar-details {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.avatar-name {
  font-size: 16px;
  font-weight: 700;
}

.avatar-school {
  font-size: 12px;
  opacity: 0.8;
}

.avatar-email {
  font-size: 11px;
  opacity: 0.65;
}

/* ── Stats Grid ─────────────────────────────────────────────── */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 32px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 16px;
  min-height: 100px;
  border: 1px solid var(--line);
  border-left: 4px solid var(--primary);
  border-radius: 10px;
  background: #ffffff;
  box-shadow: 0 8px 20px rgba(21, 33, 72, 0.06);
  padding: 20px 24px;
  transition: transform 0.15s, box-shadow 0.15s;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 28px rgba(21, 33, 72, 0.1);
}

.stat-card.tone-green {
  border-left-color: var(--green);
}

.stat-card.tone-orange {
  border-left-color: var(--orange);
}

.stat-card.tone-violet {
  border-left-color: var(--violet);
}

.stat-icon-wrap {
  display: grid;
  width: 48px;
  height: 48px;
  place-items: center;
  border-radius: 10px;
  background: var(--primary-soft);
  color: var(--primary);
  flex-shrink: 0;
}

.stat-card.tone-green .stat-icon-wrap {
  background: var(--green-soft);
  color: var(--green);
}

.stat-card.tone-orange .stat-icon-wrap {
  background: var(--orange-soft);
  color: var(--orange);
}

.stat-card.tone-violet .stat-icon-wrap {
  background: var(--violet-soft);
  color: var(--violet);
}

.stat-body {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-value {
  font-size: 28px;
  line-height: 1;
  color: var(--primary);
}

.stat-card.tone-green .stat-value { color: var(--green); }
.stat-card.tone-orange .stat-value { color: var(--orange); }
.stat-card.tone-violet .stat-value { color: var(--violet); }

.stat-label {
  font-size: 12px;
  font-weight: 700;
  color: var(--muted);
  text-transform: uppercase;
}

/* ── Dashboard Grid ─────────────────────────────────────────── */
.dashboard-grid {
  display: grid;
  grid-template-columns: 1.5fr 1fr;
  gap: 24px;
}

/* ── Panels ─────────────────────────────────────────────────── */
.panel {
  border: 1px solid var(--line);
  border-radius: 10px;
  background: #ffffff;
  box-shadow: 0 8px 20px rgba(21, 33, 72, 0.05);
  overflow: hidden;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  min-height: 64px;
  padding: 0 24px;
}

.panel-header h2 {
  margin: 0;
  font-size: 16px;
  font-weight: 800;
}

.link-button {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border: 0;
  background: transparent;
  color: var(--primary);
  font-size: 13px;
  font-weight: 700;
}

.ghost-button {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border: 0;
  background: transparent;
  color: var(--primary);
  font-size: 13px;
  font-weight: 700;
  padding: 8px 0;
}

/* ── Poll Cards ─────────────────────────────────────────────── */
.poll-cards {
  display: grid;
  gap: 0;
}

.poll-card {
  padding: 20px 24px;
  border-top: 1px solid #e0e4ef;
  cursor: pointer;
  transition: background 0.15s;
}

.poll-card:hover {
  background: #f8faff;
}

.poll-card:first-child {
  border-top: 0;
}

.poll-card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}

.poll-type-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 6px;
  background: var(--primary-soft);
  color: var(--primary);
  font-size: 11px;
  font-weight: 700;
}

.poll-type-badge.badge-green {
  background: var(--green-soft);
  color: var(--green);
}

.poll-type-badge.badge-orange {
  background: var(--orange-soft);
  color: var(--orange);
}

.poll-type-badge.badge-violet {
  background: var(--violet-soft);
  color: var(--violet);
}

.live-indicator {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 999px;
  background: var(--green-soft);
  color: var(--green);
  font-size: 10px;
  font-weight: 800;
  text-transform: uppercase;
}

.live-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--green);
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

.poll-question {
  margin: 0 0 4px;
  font-size: 15px;
  font-weight: 700;
  line-height: 1.4;
  color: var(--ink);
}

.poll-title {
  margin: 0 0 12px;
  font-size: 13px;
  color: var(--muted);
}

.poll-card-footer {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
}

.poll-meta {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--muted);
}

.poll-meta.anonymous {
  color: var(--violet);
}

.vote-cta {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-left: auto;
  font-size: 13px;
  font-weight: 700;
  color: var(--primary);
  transition: gap 0.15s;
}

.poll-card:hover .vote-cta {
  gap: 8px;
}

/* ── Loading / Empty ────────────────────────────────────────── */
.panel-loading,
.panel-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  padding: 32px;
  gap: 12px;
}

.empty-icon {
  color: var(--muted);
  opacity: 0.35;
}

.panel-empty h3 {
  margin: 0;
  font-size: 16px;
  color: var(--ink);
}

.panel-empty p {
  margin: 0;
  font-size: 13px;
  color: var(--muted);
  text-align: center;
  max-width: 280px;
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--line);
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ── Activity Panel ─────────────────────────────────────────── */
.activity-list {
  display: grid;
}

.activity-item {
  display: grid;
  grid-template-columns: 44px 1fr auto;
  gap: 14px;
  align-items: center;
  min-height: 72px;
  padding: 0 24px;
  border-top: 1px solid #e0e4ef;
}

.activity-item:first-child {
  border-top: 0;
}

.activity-icon {
  display: grid;
  width: 44px;
  height: 44px;
  place-items: center;
  border-radius: 10px;
  background: var(--primary-soft);
  color: var(--primary);
}

.activity-icon.icon-poll {
  background: var(--green-soft);
  color: var(--green);
}

.activity-info {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

.activity-info strong {
  font-size: 14px;
  color: var(--ink);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.activity-date {
  font-size: 12px;
  color: var(--muted);
}

.activity-score {
  font-size: 15px;
  font-weight: 800;
  padding: 4px 10px;
  border-radius: 6px;
}

.score-good {
  color: var(--green);
  background: var(--green-soft);
}

.score-ok {
  color: var(--orange);
  background: var(--orange-soft);
}

.panel-footer-action {
  padding: 14px 24px;
  border-top: 1px solid #e0e4ef;
}

/* ── Quick Actions Panel ────────────────────────────────────── */
.quick-actions-panel {
  grid-column: 1;
}

.quick-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  padding: 0 24px 24px;
}

.quick-action {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  min-height: 100px;
  border: 0;
  border-left: 4px solid var(--primary);
  border-radius: 8px;
  background: var(--primary-soft);
  color: var(--primary);
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
  transition: transform 0.15s;
}

.quick-action:hover {
  transform: translateY(-2px);
}

.quick-action.tone-blue {
  border-left-color: var(--primary);
  background: var(--primary-soft);
  color: var(--primary);
}

.quick-action.tone-green {
  border-left-color: var(--green);
  background: var(--green-soft);
  color: var(--green);
}

.quick-action.tone-orange {
  border-left-color: var(--orange);
  background: var(--orange-soft);
  color: var(--orange);
}

.quick-action.tone-violet {
  border-left-color: var(--violet);
  background: var(--violet-soft);
  color: var(--violet);
}

/* ── Schedule Panel ─────────────────────────────────────────── */
.schedule-panel {
  grid-column: 2;
}

.schedule-list {
  display: grid;
}

.schedule-item {
  display: grid;
  grid-template-columns: 50px 1fr auto;
  gap: 14px;
  align-items: center;
  min-height: 72px;
  padding: 0 24px;
  border-top: 1px solid #e0e4ef;
}

.schedule-item:first-child {
  border-top: 0;
}

.schedule-date-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  line-height: 1.2;
}

.schedule-date-box strong {
  font-size: 20px;
  color: var(--primary);
}

.schedule-date-box span {
  font-size: 11px;
  font-weight: 700;
  color: var(--muted);
  text-transform: uppercase;
}

.schedule-info {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

.schedule-info strong {
  font-size: 14px;
  color: var(--ink);
}

.schedule-info span {
  font-size: 12px;
  color: var(--muted);
}

.schedule-badge {
  padding: 4px 10px;
  border-radius: 6px;
  background: var(--green-soft);
  color: var(--green);
  font-size: 10px;
  font-weight: 800;
  text-transform: uppercase;
}

.schedule-badge.badge-orange {
  background: var(--orange-soft);
  color: var(--orange);
}

.schedule-badge.badge-blue {
  background: var(--primary-soft);
  color: var(--primary);
}

/* ── Responsive ─────────────────────────────────────────────── */
@media (max-width: 1100px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .dashboard-grid {
    grid-template-columns: 1fr;
  }

  .schedule-panel {
    grid-column: 1;
  }
}

@media (max-width: 820px) {
  .nav-inner {
    flex-wrap: wrap;
    gap: 12px;
    padding: 12px 20px;
  }

  .nav-links {
    order: 3;
    width: 100%;
    justify-content: center;
  }

  .greeting-section {
    flex-direction: column;
    text-align: center;
    padding: 24px 20px;
  }

  .greeting-text-block h1 {
    font-size: 22px;
  }

  .quick-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 600px) {
  .main-content {
    padding: 20px 16px;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .nav-right .user-profile-mini {
    display: none;
  }

  .nav-links .nav-link span {
    display: none;
  }
}
</style>