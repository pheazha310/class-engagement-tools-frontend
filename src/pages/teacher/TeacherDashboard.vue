<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useTeacherDashboardStore } from '@/stores/teacherDashboardStore'
import { useToolOrganizerStore } from '@/stores/toolOrganizerStore'
import TeacherLayout from '@/components/teacher/TeacherLayout.vue'
import TeacherIcon from '@/components/teacher/TeacherIcon.vue'

type TrendPoint = { label: string; value: number }

const router = useRouter()
const authStore = useAuthStore()
const dashboardStore = useTeacherDashboardStore()
const organizer = useToolOrganizerStore()

const searchValue = ref('')
const teacherName = computed(() => authStore.user?.name || 'Dr. Sarah Miller')
const greeting = computed(() => {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good Morning'
  if (hour < 18) return 'Good Afternoon'
  return 'Good Evening'
})

onMounted(() => {
  dashboardStore.loadInitialDashboard()
})

const stats = computed(() => ({
  totalClasses: dashboardStore.totalClasses,
  totalStudents: dashboardStore.uniqueStudents,
  activePolls: dashboardStore.activePolls,
  scheduledSessions: dashboardStore.scheduledSessions,
  liveSessions: dashboardStore.liveSessions,
  totalActivities: dashboardStore.totalActivities,
  engagementPct: dashboardStore.engagementPct,
}))

const statCards = computed(() => [
  { label: 'Total Classes', value: stats.value.totalClasses, meta: 'Tracked', icon: 'cap', tone: 'blue' as const, route: '/teacher/classes' },
  { label: 'Students', value: stats.value.totalStudents, meta: `${stats.value.engagementPct}% engagement`, icon: 'users', tone: 'green' as const, route: '/teacher/students' },
  { label: 'Active Polls', value: stats.value.activePolls, meta: 'Live', icon: 'poll', tone: 'red' as const, route: '/teacher/tools' },
  { label: 'Scheduled', value: stats.value.scheduledSessions, meta: 'Upcoming', icon: 'calendar', tone: 'blue' as const, route: '/teacher/tools' },
  { label: 'Live Now', value: stats.value.liveSessions, meta: 'On air', icon: 'zap', tone: 'red' as const, route: '/teacher/tools' },
  { label: 'Activities', value: stats.value.totalActivities, meta: 'All time', icon: 'clipboard', tone: 'blue' as const, route: '/teacher/activity-history' },
])

const livePoll = computed(() => dashboardStore.livePoll)

const recentActivities = computed(() =>
  (Array.isArray(dashboardStore.recentActivities) ? dashboardStore.recentActivities : []).slice(0, 3).map((activity: any) => ({
    className: activity.class_name || activity.class || 'Class',
    activity: activity.name || activity.title || activity.description || 'Activity',
    status: activity.status === 'active' || activity.status === 'live' ? 'Live' : 'Completed',
    responses: activity.max_responses ? `${activity.responses}/${activity.max_responses}` : `${activity.responses ?? 0}`,
    action: activity.status === 'active' || activity.status === 'live' ? ('external' as const) : ('chart' as const),
  })),
)

const sessionLogs = computed(() =>
  (Array.isArray(dashboardStore.topQuizzes) ? dashboardStore.topQuizzes : []).slice(0, 4).map((quiz: any) => ({
    date: quiz.created_at ? new Date(quiz.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Today',
    type: quiz.title || 'Quiz',
    subject: quiz.subject || quiz.class_name || 'General',
    score: `${quiz.submissions_count ?? 0} submissions`,
  })),
)

const trendSeries = computed<TrendPoint[]>(() => dashboardStore.participationTrend)
const chartWidth = 680
const chartHeight = 230

function buildPath(points: TrendPoint[]) {
  if (points.length === 0) return ''
  const values = points.map((point) => point.value)
  const max = Math.max(...values, 1)
  const innerWidth = chartWidth - 44
  const innerHeight = chartHeight - 44
  const stepX = values.length > 1 ? innerWidth / (values.length - 1) : 0
  return values
    .map((value, index) => {
      const x = 22 + index * stepX
      const y = 22 + innerHeight - (value / max) * innerHeight
      return `${index === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`
    })
    .join(' ')
}

function buildArea(points: TrendPoint[]) {
  if (points.length === 0) return ''
  const values = points.map((point) => point.value)
  const max = Math.max(...values, 1)
  const innerWidth = chartWidth - 44
  const innerHeight = chartHeight - 44
  const stepX = values.length > 1 ? innerWidth / (values.length - 1) : 0
  const firstY = 22 + innerHeight - (((values[0] ?? 0) / max) * innerHeight)
  const lastX = 22 + (values.length - 1) * stepX
  const baseY = 22 + innerHeight
  return `${buildPath(points)} L ${lastX.toFixed(1)} ${baseY.toFixed(1)} L 22 ${baseY.toFixed(1)} L 22 ${firstY.toFixed(1)} Z`
}

const trendPath = computed(() => buildPath(trendSeries.value))
const trendArea = computed(() => buildArea(trendSeries.value))
const trendAverage = computed(() => {
  if (trendSeries.value.length === 0) return 0
  return trendSeries.value.reduce((sum, point) => sum + point.value, 0) / trendSeries.value.length
})
const averageLine = computed(() => {
  if (trendSeries.value.length === 0) return ''
  const values = trendSeries.value.map((point) => point.value)
  const max = Math.max(...values, 1)
  const innerHeight = chartHeight - 44
  const y = 22 + innerHeight - (trendAverage.value / max) * innerHeight
  return `M 22 ${y.toFixed(1)} L 658 ${y.toFixed(1)}`
})

const trendLabels = computed(() => trendSeries.value.map((point) => point.label))

const favoriteTools = computed(() =>
  organizer.favoriteTools.slice(0, 6).map((tool) => ({
    label: tool.title,
    icon: tool.icon,
    tone: tool.category.toLowerCase().includes('quiz')
      ? 'green'
      : tool.category.toLowerCase().includes('game')
        ? 'violet'
        : tool.category.toLowerCase().includes('class')
          ? 'orange'
          : 'blue',
    route: tool.route,
  })),
)

const goTo = (route?: string) => {
  if (route) router.push(route)
}
</script>

<template>
  <TeacherLayout
    sidebar-active="dashboard"
    :page-subtitle="`Your engagement is up ${stats.engagementPct}% this week.`"
    v-model:search-value="searchValue"
    search-placeholder="Search activities..."
  >
    <template #greeting>
      <h1>{{ greeting }}, {{ teacherName }}</h1>
      <p>
        Your engagement is up <strong>{{ stats.engagementPct }}%</strong> this week.
      </p>
    </template>

    <section class="dashboard-hero" aria-label="Dashboard overview">
      <div class="hero-copy">
        <p class="hero-kicker">Live classroom overview</p>
        <h2>Everything you need to keep classes moving.</h2>
        <p class="hero-text">
          Real-time counts from your polls, quizzes, sessions, and student activity.
        </p>
      </div>

      <div class="hero-metrics">
        <div class="hero-metric">
          <span class="hero-metric-icon"><TeacherIcon icon="users" :size="18" /></span>
          <strong>{{ stats.totalStudents }}</strong>
          <span>Students</span>
        </div>
        <div class="hero-metric">
          <span class="hero-metric-icon"><TeacherIcon icon="calendar" :size="18" /></span>
          <strong>{{ stats.scheduledSessions }}</strong>
          <span>Scheduled</span>
        </div>
        <div class="hero-metric">
          <span class="hero-metric-icon"><TeacherIcon icon="zap" :size="18" /></span>
          <strong>{{ stats.liveSessions }}</strong>
          <span>Live now</span>
        </div>
      </div>
    </section>

    <section class="stats-grid" aria-label="Dashboard statistics">
      <article
        v-for="stat in statCards"
        :key="stat.label"
        class="stat-card"
        :class="`tone-${stat.tone}`"
        role="button"
        tabindex="0"
        @click="goTo(stat.route)"
        @keydown.enter="goTo(stat.route)"
        @keydown.space.prevent="goTo(stat.route)"
      >
        <div class="stat-label-row">
          <span>{{ stat.label }}</span>
          <span class="stat-icon-badge">
            <TeacherIcon :icon="stat.icon" :size="19" />
          </span>
        </div>
        <div class="stat-value-row">
          <strong class="stat-number">{{ stat.value }}</strong>
          <span class="stat-meta-badge">{{ stat.meta }}</span>
        </div>
      </article>
    </section>

    <div class="dashboard-grid">
      <section class="panel recent-panel">
        <div class="panel-header">
          <h2>Recent Activities</h2>
          <button class="link-button" type="button" @click="goTo('/teacher/activity-history')">View All</button>
        </div>

        <div v-if="recentActivities.length" class="activity-table">
          <div class="activity-row activity-heading">
            <span>Class</span>
            <span>Activity</span>
            <span>Status</span>
            <span>Responses</span>
            <span></span>
          </div>
          <div v-for="activity in recentActivities" :key="`${activity.className}-${activity.activity}`" class="activity-row activity-data-row">
            <strong>{{ activity.className }}</strong>
            <span>{{ activity.activity }}</span>
            <span><mark :class="activity.status.toLowerCase()">{{ activity.status }}</mark></span>
            <span>{{ activity.responses }}</span>
            <button class="table-action" type="button" aria-label="Open activity">
              <TeacherIcon :icon="activity.action" :size="21" />
            </button>
          </div>
        </div>

        <div v-else class="empty-state">
          <div class="empty-icon">
            <TeacherIcon icon="activity" :size="40" />
          </div>
          <h3>No recent activity yet</h3>
          <p>Launch a poll, quiz, or classroom session to see real activity here.</p>
        </div>
      </section>

      <aside class="panel live-poll-panel">
        <div class="live-poll-header">
          <span class="live-badge">Classroom Tools</span>
          <div>
            <strong>{{ stats.totalActivities }}</strong>
            <small>Activities</small>
          </div>
        </div>

        <h2>Engage your classroom</h2>
        <p>Use interactive tools like quizzes, wheels, and group generators to boost participation.</p>

        <div class="live-poll-actions">
          <button class="primary-button close-poll-button" type="button" @click="goTo('/teacher/tools')">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="16" />
              <line x1="8" y1="12" x2="16" y2="12" />
            </svg>
            Browse Tools
          </button>
        </div>
      </aside>

      <section class="panel trends-panel">
        <div class="panel-header">
          <h2>Participation Trends</h2>
          <div class="chart-legend">
            <span><i></i>Today</span>
            <span><i></i>Average</span>
          </div>
        </div>

        <template v-if="trendSeries.length">
          <svg class="trend-chart" viewBox="0 0 680 230" preserveAspectRatio="none" role="img" aria-label="Participation trend">
            <path class="chart-fill" :d="trendArea" />
            <path class="chart-line" :d="trendPath" />
            <path class="chart-average" :d="averageLine" />
            <g class="chart-points">
              <circle
                v-for="(point, index) in trendSeries"
                :key="`${point.label}-${index}`"
                :cx="22 + (trendSeries.length > 1 ? (index * (636 / (trendSeries.length - 1))) : 0)"
                :cy="22 + (186 - (point.value / Math.max(...trendSeries.map((item) => item.value), 1)) * 186)"
                r="5"
              />
            </g>
          </svg>
          <div class="weekday-row">
            <span v-for="label in trendLabels" :key="label">{{ label }}</span>
          </div>
        </template>

        <div v-else class="empty-state compact">
          <div class="empty-icon">
            <TeacherIcon icon="chart" :size="40" />
          </div>
          <h3>No trend data yet</h3>
          <p>Participation metrics will appear after students interact with your activities.</p>
        </div>
      </section>

      <section class="panel session-panel">
        <div class="panel-header">
          <h2>Recent Quiz Activity</h2>
          <button class="link-button" type="button" @click="goTo('/teacher/activity-history')">View All</button>
        </div>

        <div v-if="sessionLogs.length" class="session-table">
          <div class="session-row session-heading">
            <span>Date</span>
            <span>Quiz</span>
            <span>Subject</span>
            <span>Submissions</span>
            <span>Actions</span>
          </div>
          <div v-for="log in sessionLogs" :key="`${log.date}-${log.type}`" class="session-row session-data-row">
            <span>{{ log.date }}</span>
            <strong>{{ log.type }}</strong>
            <span>{{ log.subject }}</span>
            <strong class="score">{{ log.score }}</strong>
            <button class="table-action" type="button" aria-label="More session actions">
              <TeacherIcon icon="more" :size="20" />
            </button>
          </div>
        </div>

        <div v-else class="empty-state compact">
          <div class="empty-icon">
            <TeacherIcon icon="clipboard" :size="40" />
          </div>
          <h3>No quiz activity yet</h3>
          <p>Published quizzes with submissions will appear here automatically.</p>
        </div>
      </section>

      <section class="favtools-section panel">
        <div class="section-title-row">
          <h2>
            <span class="favtools-title-icon">
              <TeacherIcon icon="star" :size="16" />
            </span>
            Favorite Tools
            <span v-if="favoriteTools.length" class="favtools-count-badge">{{ favoriteTools.length }}</span>
          </h2>
          <div class="favtools-actions-row">
            <button class="ghost-button" type="button" @click="goTo('/teacher/organize-tools')">
              <TeacherIcon icon="picker" :size="16" />
              <span>Add / Remove</span>
            </button>
            <button class="outline-button manage-tools-btn" type="button" @click="goTo('/teacher/organize-tools')">
              <TeacherIcon icon="picker" :size="16" />
              <span>Manage</span>
            </button>
          </div>
        </div>

        <div v-if="favoriteTools.length" class="favtools-track-wrapper">
          <div class="favtools-track">
            <button
              v-for="tool in favoriteTools"
              :key="tool.label"
              class="favtool-card"
              :class="`color-${tool.tone}`"
              type="button"
              @click="goTo(tool.route)"
            >
              <span class="favtool-emoji">{{ tool.icon }}</span>
              <span class="favtool-name">{{ tool.label }}</span>
              <span class="favtool-hint">Open tool</span>
            </button>
          </div>
        </div>

        <div v-else class="empty-state compact">
          <div class="empty-icon">
            <TeacherIcon icon="star" :size="40" />
          </div>
          <h3>No favorite tools yet</h3>
          <p>Add your go-to classroom tools for quick access from this dashboard.</p>
        </div>
      </section>
    </div>
  </TeacherLayout>
</template>

<style scoped>
.dashboard-hero {
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) minmax(280px, 0.9fr);
  gap: 18px;
  margin-bottom: 18px;
  padding: 22px 24px;
  border: 1px solid rgba(197, 203, 221, 0.8);
  border-radius: 20px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.96) 0%, rgba(249, 251, 255, 0.96) 100%);
  box-shadow: 0 18px 38px rgba(21, 33, 72, 0.08);
}

.hero-copy h2 {
  margin: 0;
  color: var(--ink);
  font-size: clamp(22px, 2.2vw, 30px);
  line-height: 1.1;
  font-weight: 900;
  letter-spacing: -0.03em;
}

.hero-kicker {
  margin: 0 0 8px;
  color: var(--primary);
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.12em;
}

.hero-text {
  max-width: 54ch;
  margin: 10px 0 0;
  color: var(--muted);
  font-size: 14px;
  line-height: 1.6;
}

.hero-metrics {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.hero-metric {
  display: grid;
  place-items: center;
  gap: 8px;
  padding: 16px 12px;
  border: 1px solid #dbe3fb;
  border-radius: 16px;
  background: linear-gradient(180deg, #ffffff 0%, #f5f8ff 100%);
  text-align: center;
}

.hero-metric-icon {
  display: inline-grid;
  width: 36px;
  height: 36px;
  place-items: center;
  border-radius: 12px;
  background: var(--primary-soft);
  color: var(--primary);
}

.hero-metric strong {
  color: var(--ink);
  font-size: 24px;
  line-height: 1;
  font-weight: 900;
}

.hero-metric span:last-child {
  color: var(--muted);
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 14px;
  margin-bottom: 22px;
}

.stat-card {
  min-height: 128px;
  padding: 22px 20px 18px;
  border: 1px solid rgba(214, 221, 242, 0.95);
  border-radius: 18px;
  background: linear-gradient(180deg, #ffffff 0%, #f8faff 100%);
  box-shadow: 0 14px 30px rgba(21, 33, 72, 0.07);
  cursor: pointer;
}

.stat-label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
  color: #5d6478;
}

.stat-icon-badge {
  display: inline-grid;
  width: 32px;
  height: 32px;
  place-items: center;
  border-radius: 12px;
  background: var(--primary-soft);
  color: var(--primary);
}

.stat-card.tone-green .stat-icon-badge {
  background: var(--green-soft);
  color: var(--green);
}

.stat-card.tone-red .stat-icon-badge {
  background: var(--red-soft);
  color: var(--red);
}

.stat-value-row {
  display: flex;
  align-items: baseline;
  gap: 12px;
  margin-top: 20px;
}

.stat-number {
  font-size: 30px;
  line-height: 1;
  font-weight: 900;
}

.stat-meta-badge {
  color: var(--muted);
  font-size: 11px;
  font-weight: 800;
}

.stat-card.tone-green .stat-number,
.stat-card.tone-green .stat-meta-badge {
  color: var(--green);
}

.stat-card.tone-red .stat-number,
.stat-card.tone-red .stat-meta-badge {
  color: var(--red);
}

.dashboard-grid {
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(280px, 0.95fr);
  gap: 22px;
}

.panel {
  min-width: 0;
  border: 1px solid rgba(197, 203, 221, 0.9);
  border-radius: 18px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(250, 252, 255, 0.98) 100%);
  box-shadow: 0 16px 30px rgba(21, 33, 72, 0.08);
  overflow: hidden;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  min-height: 72px;
  padding: 0 26px;
}

.panel-header h2 {
  margin: 0;
  font-size: 17px;
  font-weight: 800;
}

.link-button {
  border: 0;
  background: transparent;
  color: var(--primary);
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
}

.activity-table,
.session-table {
  width: 100%;
}

.activity-row,
.session-row {
  display: grid;
  align-items: center;
  gap: 12px;
  border-top: 1px solid #e8edf8;
  padding: 0 26px;
}

.activity-row {
  grid-template-columns: 120px minmax(160px, 1fr) 110px 110px 40px;
  min-height: 82px;
}

.session-row {
  grid-template-columns: minmax(120px, 0.8fr) minmax(180px, 1.1fr) minmax(180px, 1fr) 130px 40px;
  min-height: 78px;
}

.activity-heading,
.session-heading {
  min-height: 48px;
  background: #eef3ff;
  color: #596072;
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
}

.activity-data-row:hover,
.session-data-row:hover {
  background: #f5f8ff;
}

.table-action {
  display: inline-grid;
  width: 34px;
  height: 34px;
  place-items: center;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: #646b7c;
}

mark.live {
  background: var(--green-soft);
  color: var(--green);
}

.live-poll-panel {
  padding-bottom: 24px;
  border-left: 4px solid var(--primary);
}

.live-poll-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 24px 26px 0;
}

.live-poll-header strong {
  display: block;
  color: var(--primary);
  font-size: 22px;
  line-height: 1;
}

.live-poll-header small {
  color: #73798b;
  font-size: 9px;
  text-transform: uppercase;
}

.live-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border-radius: 999px;
  background: #ffdde0;
  color: var(--red);
  font-size: 10px;
  font-weight: 800;
  padding: 5px 10px;
  text-transform: uppercase;
}

.live-badge::before {
  content: '';
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--red);
}

.live-poll-panel h2,
.live-poll-panel p,
.poll-bars {
  padding-left: 26px;
  padding-right: 26px;
}

.live-poll-panel h2 {
  margin: 10px 0 0;
  line-height: 1.25;
}

.live-poll-panel p {
  margin: 14px 0 18px;
  color: #1f2738;
  line-height: 1.45;
}

.poll-bars {
  display: grid;
  gap: 14px;
}

.poll-bar div {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  font-size: 13px;
}

.poll-bar strong {
  color: var(--primary);
}

.poll-bar i {
  display: block;
  height: 8px;
  margin-top: 7px;
  border-radius: 999px;
  background: var(--primary);
  box-shadow: 80px 0 0 #dbe6fb;
}

.live-poll-actions {
  display: flex;
  gap: 10px;
  margin: 22px 26px 0;
  width: calc(100% - 52px);
}

.close-poll-button {
  flex: 1;
  min-height: 48px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: none;
  border-radius: 10px;
  background: var(--primary);
  color: white;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s ease;
  font-family: inherit;
}

.close-poll-button:hover {
  background: #0019a0;
  transform: translateY(-1px);
}

.close-poll-button-secondary {
  flex: 1;
  min-height: 48px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: 1px solid var(--primary);
  border-radius: 10px;
  background: transparent;
  color: var(--primary);
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s ease;
  font-family: inherit;
}

.close-poll-button-secondary:hover {
  background: var(--primary-soft);
  transform: translateY(-1px);
}

.trends-panel,
.session-panel,
.favtools-section {
  grid-column: 1 / -1;
}

.chart-legend {
  display: flex;
  gap: 14px;
  color: #7a8192;
  font-size: 10px;
  font-weight: 800;
  text-transform: uppercase;
}

.chart-legend span {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.chart-legend i {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: var(--primary);
}

.chart-legend span:last-child i {
  background: #737b8f;
}

.trend-chart {
  width: calc(100% - 48px);
  height: 210px;
  margin: 10px 24px 0;
  overflow: visible;
}

.chart-fill {
  fill: rgba(0, 31, 158, 0.11);
}

.chart-line {
  fill: none;
  stroke: var(--primary);
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 5;
}

.chart-average {
  fill: none;
  stroke: #737b8f;
  stroke-dasharray: 8 7;
  stroke-linecap: round;
  stroke-width: 3;
}

.chart-points {
  fill: var(--primary);
}

.weekday-row {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  padding: 0 34px 18px;
  color: #6d7485;
  font-size: 12px;
  text-transform: uppercase;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 240px;
  gap: 12px;
  padding: 32px 24px;
  text-align: center;
}

.empty-state.compact {
  min-height: 200px;
}

.empty-icon {
  color: #697082;
  opacity: 0.36;
}

.empty-state h3 {
  margin: 0;
  font-size: 18px;
  color: var(--ink);
}

.empty-state p {
  margin: 0;
  color: var(--muted);
}

.favtools-section {
  padding-bottom: 24px;
}

.section-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 0 26px;
  min-height: 72px;
}

.section-title-row h2 {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0;
  font-size: 16px;
  font-weight: 800;
}

.favtools-title-icon {
  display: inline-grid;
  width: 30px;
  height: 30px;
  place-items: center;
  border-radius: 8px;
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: #fff;
}

.favtools-count-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 22px;
  height: 22px;
  border-radius: 999px;
  background: var(--primary-soft);
  color: var(--primary);
  font-size: 11px;
  font-weight: 800;
  padding: 0 6px;
}

.favtools-actions-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.manage-tools-btn {
  gap: 6px;
  min-height: 32px;
  border-color: var(--primary);
}

.favtools-track-wrapper {
  overflow-x: auto;
  padding: 0 26px 24px;
}

.favtools-track {
  display: flex;
  gap: 14px;
  min-width: min-content;
}

.favtool-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: 156px;
  min-height: 150px;
  padding: 18px 14px;
  border-radius: 16px;
  border: 1px solid #e6eaff;
  background: linear-gradient(145deg, #ffffff 0%, #f8faff 100%);
  color: var(--primary);
  box-shadow: 0 4px 12px rgba(21, 33, 72, 0.05);
  cursor: pointer;
}

.favtool-card.color-green {
  background: linear-gradient(145deg, #e6f7ed 0%, #c8f0d7 100%);
  color: #007733;
}

.favtool-card.color-orange {
  background: linear-gradient(145deg, #fef0e0 0%, #fde0b8 100%);
  color: #cc5a00;
}

.favtool-card.color-violet {
  background: linear-gradient(145deg, #f0e8fe 0%, #e0d0fc 100%);
  color: #6b21a8;
}

.favtool-card.color-blue {
  background: linear-gradient(145deg, #e0e8ff 0%, #c0d4ff 100%);
  color: #001f9e;
}

.favtool-emoji {
  font-size: 34px;
  line-height: 1;
}

.favtool-name {
  font-size: 12px;
  font-weight: 800;
  text-align: center;
  line-height: 1.2;
}

.favtool-hint {
  font-size: 10px;
  color: var(--muted);
  font-weight: 600;
}

@media (max-width: 1280px) {
  .stats-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .dashboard-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 980px) {
  .dashboard-hero {
    grid-template-columns: 1fr;
  }

  .hero-metrics {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 720px) {
  .stats-grid,
  .hero-metrics {
    grid-template-columns: 1fr;
  }

  .activity-row,
  .session-row {
    grid-template-columns: 1fr;
    min-height: auto;
    padding: 18px 18px;
  }

  .activity-heading,
  .session-heading {
    display: none;
  }

  .section-title-row,
  .panel-header {
    flex-direction: column;
    align-items: flex-start;
    padding-left: 18px;
    padding-right: 18px;
  }

  .trend-chart {
    width: calc(100% - 28px);
    margin: 10px 14px 0;
  }

  .weekday-row,
  .favtools-track-wrapper,
  .poll-bars,
  .live-poll-panel h2,
  .live-poll-panel p {
    padding-left: 18px;
    padding-right: 18px;
  }

  .close-poll-button {
    width: calc(100% - 36px);
    margin-left: 18px;
    margin-right: 18px;
  }
}
</style>
