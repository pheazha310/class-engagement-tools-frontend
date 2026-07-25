<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useTeacherDashboardStore } from '@/stores/teacherDashboardStore'
import { useToolOrganizerStore } from '@/stores/toolOrganizerStore'
import TeacherLayout from '@/components/teacher/TeacherLayout.vue'
import TeacherIcon from '@/components/teacher/TeacherIcon.vue'
import { categories } from '@/data/toolsData'

type TrendPoint = { label: string; value: number }

const router = useRouter()
const authStore = useAuthStore()
const dashboardStore = useTeacherDashboardStore()
const organizer = useToolOrganizerStore()

<<<<<<< HEAD
// ── Tone map for tools ───────────────────────────────────────
const toneMap: Record<string, string> = {
  'Random Tools': 'cyan',
  'Quiz & Assessment': 'green',
  'Classroom Control': 'orange',
  'Games': 'violet',
  'Engagement': 'blue',
  'Fun Activities': 'orange',
}

// ── Favorite tools logic ─────────────────────────────────────
function toggleFavorite(slug: string) {
  organizer.toggleFavorite(slug)
}

// All favorite tools for "Favorite Tools" section
const engageTools = computed(() => {
  return organizer.favoriteTools.map(t => ({
    label: t.title,
    icon: t.slug,
    tone: (toneMap[t.category] || 'blue') as 'blue' | 'green' | 'orange' | 'cyan' | 'violet' | 'red',
    route: t.route,
    slug: t.slug,
    emoji: t.icon,
  }))
})

// ── Manage Tools Modal ────────────────────────────────────────
const showManageModal = ref(false)
const searchTools = ref('')
const favoritesOnly = ref(false)
=======
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
>>>>>>> 6acf3de (fix: fixed style that brokend after merge)

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
  { label: 'Active Polls', value: stats.value.activePolls, meta: 'Live', icon: 'poll', tone: 'red' as const, route: '/teacher/live-polls' },
  { label: 'Scheduled', value: stats.value.scheduledSessions, meta: 'Upcoming', icon: 'calendar', tone: 'blue' as const, route: '/teacher/live-polls' },
  { label: 'Live Now', value: stats.value.liveSessions, meta: 'On air', icon: 'zap', tone: 'red' as const, route: '/teacher/live-polls' },
  { label: 'Activities', value: stats.value.totalActivities, meta: 'All time', icon: 'clipboard', tone: 'blue' as const, route: '/teacher/activity-history' },
])

const livePoll = computed(() => dashboardStore.livePoll)
const livePollOptions = computed(() => livePoll.value?.options || [])

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

<<<<<<< HEAD
const filteredModalTools = computed(() => {
  let list = organizer.allToolsWithState

  // Filter by favorites-only toggle
  if (favoritesOnly.value) {
    list = list.filter(t => t.isFavorite)
  }

  // Filter by search
  const q = searchTools.value.trim().toLowerCase()
  if (q) {
    list = list.filter(
      t => t.title.toLowerCase().includes(q) || t.category.toLowerCase().includes(q)
    )
  }

  // Filter by category
  if (activeCatFilter.value !== 'all') {
    list = list.filter(t => t.category === activeCatFilter.value)
  }

  return list
})

const groupedModalTools = computed(() => {
  return categories
    .map(cat => ({
      category: cat.name,
      icon: cat.icon,
      tools: filteredModalTools.value.filter(t => t.category === cat.name),
    }))
    .filter(group => group.tools.length > 0)
})

function openManageModal() {
  showManageModal.value = true
  searchTools.value = ''
  activeCatFilter.value = 'all'
  favoritesOnly.value = false
}

function closeManageModal() {
  showManageModal.value = false
=======
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
>>>>>>> 6acf3de (fix: fixed style that brokend after merge)
}
</script>

<template>
  <TeacherLayout
    sidebar-active="dashboard"
<<<<<<< HEAD
    page-subtitle="Your engagement is up 12% this week."
=======
    :page-subtitle="`Your engagement is up ${stats.engagementPct}% this week.`"
    v-model:search-value="searchValue"
    search-placeholder="Search activities..."
>>>>>>> 6acf3de (fix: fixed style that brokend after merge)
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

<<<<<<< HEAD
    <!-- ========== Favorite Tools — Colorful Cards ========== -->
    <section class="favtools-section">
      <div class="section-title-row">
        <h2>
          <span class="favtools-title-icon">
            <TeacherIcon icon="star" :size="16" />
          </span>
          Favorite Tools
          <span v-if="organizer.favoriteTools.length > 0" class="favtools-count-badge">{{ organizer.favoriteTools.length }}</span>
        </h2>
        <div class="favtools-actions-row">
          <button class="ghost-button" type="button" @click="openManageModal">
            <TeacherIcon icon="picker" :size="16" />
            <span>Add / Remove</span>
          </button>
          <button class="outline-button manage-tools-btn" type="button" @click="navigateTo('/teacher/organize-tools')">
            <TeacherIcon icon="picker" :size="16" />
            <span>Manage</span>
          </button>
        </div>
      </div>

      <!-- Empty state -->
      <div v-if="engageTools.length === 0" class="empty-favorites">
        <div class="empty-fav-icon">
          <TeacherIcon icon="star" :size="48" />
        </div>
        <h3>No favorite tools yet</h3>
        <p>Add your go-to classroom tools for quick access right here on your dashboard.</p>
        <button class="primary-button" type="button" @click="openManageModal">
          <TeacherIcon icon="picker" :size="16" />
          <span>Browse &amp; Add Tools</span>
        </button>
      </div>

      <!-- Favorites carousel-style row -->
      <div v-else class="favtools-track-wrapper">
        <div class="favtools-track">
          <div
            v-for="tool in engageTools"
            :key="tool.slug"
            class="favtool-card"
            :class="`color-${tool.tone}`"
            @click="navigateTo(tool.route)"
            role="button"
            :tabindex="0"
            @keydown.enter="navigateTo(tool.route)"
            :title="`Open ${tool.label}`"
          >
            <!-- Remove button -->
            <span
              class="favtool-remove"
              role="button"
              :title="`Remove ${tool.label}`"
              tabindex="0"
              @click.stop="toggleFavorite(tool.slug)"
              @keydown.enter.stop="toggleFavorite(tool.slug)"
              @keydown.space.prevent.stop="toggleFavorite(tool.slug)"
            >
              <TeacherIcon icon="x" :size="10" />
            </span>

            <span class="favtool-emoji">{{ tool.emoji }}</span>
            <span class="favtool-name">{{ tool.label }}</span>
            <span class="favtool-hint">Click to open</span>
          </div>

          <!-- Add More card (opens modal) -->
          <button
            class="favtool-card favtool-add-more"
            type="button"
            @click="openManageModal"
            title="Add more favorite tools"
          >
            <span class="favtool-add-icon">
              <TeacherIcon icon="plus" :size="24" />
            </span>
            <span class="favtool-name">Add More</span>
            <span class="favtool-hint">Browse all tools</span>
          </button>
        </div>
      </div>
    </section>

    <!-- ========== Manage Tools Modal ========== -->
    <Transition name="modal-slide">
      <div v-if="showManageModal" class="modal-overlay" @click.self="closeManageModal">
        <div class="manage-modal">
          <!-- Modal Header -->
          <div class="manage-modal-header">
            <div class="manage-modal-header-left">
              <div class="manage-modal-title-icon">
                <TeacherIcon icon="picker" :size="20" />
              </div>
              <div>
                <h2>Tool Manager</h2>
                <p>Star your favorites for quick access on the dashboard. Hide tools you don't need.</p>
              </div>
            </div>
            <button class="modal-close-btn" type="button" @click="closeManageModal" aria-label="Close">
              <TeacherIcon icon="x" :size="20" />
            </button>
          </div>

          <!-- Search & Filter Bar -->
          <div class="manage-modal-controls">
            <div class="manage-modal-bar">
              <div class="manage-search">
                <TeacherIcon icon="search" :size="18" />
                <input
                  v-model="searchTools"
                  type="search"
                  placeholder="Search tools by name or category..."
                  class="manage-search-input"
                />
              </div>
              <div class="manage-filter-toggles">
                <button
                  class="manage-filter-pill"
                  :class="{ active: activeCatFilter === 'all' }"
                  type="button"
                  @click="activeCatFilter = 'all'"
                >All Tools</button>
                <button
                  class="manage-filter-pill"
                  :class="{ active: favoritesOnly }"
                  type="button"
                  @click="favoritesOnly = !favoritesOnly"
                >
                  <TeacherIcon icon="star" :size="14" />
                  Favorites
                  <span v-if="organizer.favoriteTools.length" class="fav-pill-count">{{ organizer.favoriteTools.length }}</span>
                </button>
              </div>
            </div>
            <div class="manage-categories-row">
              <button
                v-for="cat in categoryFilters"
                :key="cat"
                class="manage-cat-chip"
                :class="{ active: activeCatFilter === cat }"
                type="button"
                @click="activeCatFilter = cat"
              >{{ cat }}</button>
            </div>
          </div>

          <!-- Tools List (Grouped by Category) -->
          <div class="manage-modal-body">
            <!-- Empty state -->
            <div v-if="groupedModalTools.length === 0" class="manage-empty">
              <div class="manage-empty-icon">
                <TeacherIcon icon="search" :size="48" />
              </div>
              <h3 v-if="favoritesOnly">No favorites yet</h3>
              <h3 v-else>No tools found</h3>
              <p v-if="searchTools">Try a different search term or clear the filter.</p>
              <p v-else-if="favoritesOnly">Star some tools above to add them to your favorites.</p>
              <p v-else>All tools are accounted for!</p>
              <button v-if="favoritesOnly || searchTools" class="ghost-button" type="button" @click="searchTools = ''; favoritesOnly = false; activeCatFilter = 'all'">
                <TeacherIcon icon="refresh" :size="16" />
                <span>Clear Filters</span>
              </button>
            </div>

            <!-- Grouped Tools -->
            <div
              v-for="group in groupedModalTools"
              :key="group.category"
              class="manage-category-group"
            >
              <!-- Category Header -->
              <div class="manage-category-header">
                <span class="manage-category-icon">{{ group.icon }}</span>
                <h3>{{ group.category }}</h3>
                <span class="manage-category-count">{{ group.tools.length }} tool{{ group.tools.length !== 1 ? 's' : '' }}</span>
              </div>

              <!-- Tools in category -->
              <div class="manage-tools-grid">
                <div
                  v-for="tool in group.tools"
                  :key="tool.slug"
                  class="manage-tool-item"
                  :class="{
                    'is-favorite': tool.isFavorite,
                    'is-hidden': tool.isHidden,
                  }"
                >
                  <span class="manage-tool-icon">{{ tool.icon }}</span>
                  <div class="manage-tool-info">
                    <strong :class="{ 'text-muted': tool.isHidden }">{{ tool.title }}</strong>
                    <span class="manage-tool-desc">{{ tool.description }}</span>
                  </div>

                  <div class="manage-tool-actions">
                    <!-- Launch button -->
                    <button
                      v-if="tool.route"
                      class="manage-tool-launch"
                      type="button"
                      :title="`Open ${tool.title}`"
                      @click.stop="navigateTo(tool.route)"
                    >
                      <TeacherIcon icon="external" :size="16" />
                    </button>

                    <!-- Star toggle -->
                    <button
                      class="manage-tool-star"
                      :class="{ active: tool.isFavorite }"
                      type="button"
                      :title="tool.isFavorite ? 'Remove from favorites' : 'Add to favorites'"
                      @click="organizer.toggleFavorite(tool.slug)"
                    >
                      <TeacherIcon icon="star" :size="18" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="manage-modal-footer">
            <span class="manage-count">
              <TeacherIcon icon="star" :size="14" />
              {{ organizer.favoriteTools.length }} favorite{{ organizer.favoriteTools.length !== 1 ? 's' : '' }}
            </span>
            <button class="primary-button" type="button" @click="closeManageModal">
              <TeacherIcon icon="check" :size="16" />
              <span>Done</span>
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- ========== Dashboard Grid ========== -->
=======
>>>>>>> 6acf3de (fix: fixed style that brokend after merge)
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
          <span class="live-badge">Live Poll</span>
          <div>
            <strong>{{ livePoll?.responses ?? 0 }}</strong>
            <small>Responses</small>
          </div>
        </div>

        <template v-if="livePoll">
          <h2>{{ livePoll.title }}</h2>
          <p>{{ livePoll.question }}</p>
          <div class="poll-bars">
            <div v-for="option in livePollOptions" :key="option.label" class="poll-bar">
              <div>
                <span>{{ option.label }}</span>
                <strong>{{ option.value }}%</strong>
              </div>
              <i :style="{ width: `${option.value}%` }"></i>
            </div>
          </div>
        </template>

        <template v-else>
          <h2>No live poll right now</h2>
          <p>Start a poll to watch responses update here in real time.</p>
        </template>

        <button class="primary-button close-poll-button" type="button" @click="goTo('/teacher/live-polls')">
          Open Live Polls
        </button>
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

.close-poll-button {
  width: calc(100% - 52px);
  min-height: 48px;
  margin: 22px 26px 0;
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

<<<<<<< HEAD
.favtool-card:hover .favtool-hint {
  opacity: 1;
}

/* Add More card */
.favtool-add-more {
  border: 2px dashed var(--line);
  background: transparent;
  color: var(--muted);
  box-shadow: none;
}

.favtool-add-more:hover {
  border-color: var(--primary);
  color: var(--primary);
  background: var(--primary-soft);
  transform: translateY(-4px);
}

.favtool-add-icon {
  display: inline-grid;
  width: 52px;
  height: 52px;
  place-items: center;
  border-radius: 12px;
  background: #edf2ff;
  color: var(--primary);
  transition: all 0.2s;
}

.favtool-add-more:hover .favtool-add-icon {
  background: var(--primary);
  color: #fff;
  transform: scale(1.08);
}

/* ── Manage Tools Modal ───────────────────────────────────── */
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 5000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(15, 23, 42, 0.55);
  backdrop-filter: blur(8px);
  padding: 24px;
}

.manage-modal {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 760px;
  max-height: 85vh;
  border-radius: 20px;
  background: #fff;
  box-shadow: 0 32px 64px rgba(0, 0, 0, 0.25);
  overflow: hidden;
  animation: modalScaleIn 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes modalScaleIn {
  from { opacity: 0; transform: scale(0.92) translateY(16px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}

/* ── Header ─────────────────────────────────────────────────── */
.manage-modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 24px 28px 0;
}

.manage-modal-header-left {
  display: flex;
  align-items: flex-start;
  gap: 14px;
}

.manage-modal-title-icon {
  display: inline-grid;
  width: 44px;
  height: 44px;
  place-items: center;
  border-radius: 12px;
  background: linear-gradient(135deg, #6366f1, #4f46e5);
  color: #fff;
  flex-shrink: 0;
}

.manage-modal-header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 800;
  color: #0f172a;
}

.manage-modal-header p {
  margin: 4px 0 0;
  font-size: 13px;
  color: #64748b;
  line-height: 1.4;
}

.modal-close-btn {
  display: inline-grid;
  width: 36px;
  height: 36px;
  place-items: center;
  border: 0;
  border-radius: 10px;
  background: transparent;
  color: #94a3b8;
  cursor: pointer;
  transition: all 0.15s;
  flex-shrink: 0;
}

.modal-close-btn:hover {
  background: #f1f5f9;
  color: #0f172a;
}

/* ── Controls ───────────────────────────────────────────────── */
.manage-modal-controls {
  padding: 20px 28px 0;
}

.manage-modal-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.manage-search {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  min-width: 200px;
  min-height: 42px;
  padding: 0 16px;
  border: 1.5px solid #e2e8f0;
  border-radius: 10px;
  background: #f8fafc;
  color: #64748b;
  transition: all 0.15s;
}

.manage-search:focus-within {
  border-color: #6366f1;
  background: #fff;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.manage-search-input {
  flex: 1;
  min-height: 40px;
  border: 0;
  background: transparent;
  font-size: 14px;
  color: #0f172a;
  outline: none;
}

.manage-search-input::placeholder {
  color: #94a3b8;
}

.manage-filter-toggles {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.manage-filter-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 38px;
  padding: 0 16px;
  border: 1.5px solid #e2e8f0;
  border-radius: 999px;
  background: #fff;
  color: #475569;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
}

.manage-filter-pill:hover {
  border-color: #cbd5e1;
  background: #f8fafc;
}

.manage-filter-pill.active {
  border-color: #6366f1;
  background: #eef2ff;
  color: #4f46e5;
}

.fav-pill-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  border-radius: 999px;
  background: #6366f1;
  color: #fff;
  font-size: 10px;
  font-weight: 800;
  padding: 0 5px;
}

.manage-categories-row {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-top: 14px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f1f5f9;
}

.manage-cat-chip {
  min-height: 28px;
  padding: 0 12px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  background: #fff;
  color: #64748b;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s;
}

.manage-cat-chip:hover {
  border-color: #cbd5e1;
  color: #334155;
}

.manage-cat-chip.active {
  border-color: #6366f1;
  background: #eef2ff;
  color: #4f46e5;
}

/* ── Body (scrollable) ──────────────────────────────────────── */
.manage-modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px 28px 4px;
}

.manage-modal-body::-webkit-scrollbar {
  width: 5px;
}

.manage-modal-body::-webkit-scrollbar-track {
  background: transparent;
}

.manage-modal-body::-webkit-scrollbar-thumb {
  background: #d0d6e8;
  border-radius: 999px;
}

/* ── Empty state ────────────────────────────────────────────── */
.manage-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 48px 20px;
  text-align: center;
  color: #94a3b8;
}

.manage-empty-icon {
  color: #cbd5e1;
  margin-bottom: 4px;
}

.manage-empty h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 800;
  color: #64748b;
}

.manage-empty p {
  margin: 0;
  font-size: 13px;
  color: #94a3b8;
  max-width: 280px;
}

.manage-empty .ghost-button {
  margin-top: 8px;
}

/* ── Category groups ────────────────────────────────────────── */
.manage-category-group {
  margin-bottom: 24px;
}

.manage-category-group:last-child {
  margin-bottom: 0;
}

.manage-category-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 2px solid #f1f5f9;
}

.manage-category-icon {
  font-size: 20px;
  line-height: 1;
}

.manage-category-header h3 {
  margin: 0;
  font-size: 13px;
  font-weight: 800;
  color: #0f172a;
  text-transform: uppercase;
  letter-spacing: 0.4px;
}

.manage-category-count {
  margin-left: auto;
  font-size: 11px;
  font-weight: 700;
  color: #94a3b8;
}

/* ── Tool items ─────────────────────────────────────────────── */
.manage-tools-grid {
  display: grid;
  gap: 6px;
}

.manage-tool-item {
  display: flex;
  align-items: center;
  gap: 14px;
  min-height: 56px;
  padding: 8px 14px;
  border: 1px solid #f1f5f9;
  border-radius: 10px;
  background: #fff;
  transition: all 0.15s;
}

.manage-tool-item:hover {
  border-color: #e2e8f0;
  background: #fafbff;
}

.manage-tool-item.is-favorite {
  background: #fffbeb;
  border-color: #fde68a;
}

.manage-tool-item.is-hidden {
  opacity: 0.55;
  border-style: dashed;
}

.manage-tool-icon {
  font-size: 26px;
  line-height: 1;
  flex-shrink: 0;
  width: 36px;
  text-align: center;
}

.manage-tool-info {
  flex: 1;
  min-width: 0;
}

.manage-tool-info strong {
  display: block;
  font-size: 14px;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 1px;
}

.manage-tool-desc {
  display: block;
  font-size: 12px;
  color: #94a3b8;
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.manage-tool-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

.manage-tool-launch {
  display: inline-grid;
  width: 32px;
  height: 32px;
  place-items: center;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: #94a3b8;
  cursor: pointer;
  transition: all 0.15s;
}

.manage-tool-launch:hover {
  background: #eef2ff;
  color: #6366f1;
}

.manage-tool-star {
  display: inline-grid;
  width: 34px;
  height: 34px;
  place-items: center;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: #d0d6e8;
  cursor: pointer;
  transition: all 0.15s;
}

.manage-tool-star:hover {
  background: #fffbeb;
  color: #f59e0b;
}

.manage-tool-star.active {
  color: #f59e0b;
}

.manage-tool-star.active:hover {
  color: #d97706;
  background: #fef3c7;
}

.text-muted {
  color: #94a3b8;
  font-weight: 600;
}

/* ── Footer ─────────────────────────────────────────────────── */
.manage-modal-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 28px 20px;
  border-top: 1px solid #f1f5f9;
}

.manage-count {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 700;
  color: #64748b;
}

.manage-count TeacherIcon {
  color: #f59e0b;
}

/* ── Modal transition ───────────────────────────────────────── */
.modal-slide-enter-active,
.modal-slide-leave-active {
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

.modal-slide-enter-from,
.modal-slide-leave-to {
  opacity: 0;
}

.modal-slide-enter-from .manage-modal,
.modal-slide-leave-to .manage-modal {
  transform: scale(0.92) translateY(16px);
}

/* ── Dashboard Grid ─────────────────────────────────────────── */
.dashboard-grid {
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(260px, 0.95fr);
  gap: 24px;
  margin-top: 38px;
}

.panel {
  min-width: 0;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: #ffffff;
  box-shadow: 0 16px 24px rgba(21, 33, 72, 0.06);
  transition: box-shadow 0.2s ease;
}

.panel:hover {
  box-shadow: 0 20px 32px rgba(21, 33, 72, 0.1);
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  min-height: 74px;
  padding: 0 24px;
}

.panel-header h2 {
  margin: 0;
  font-size: 16px;
  font-weight: 800;
}

.recent-panel,
.trends-panel,
.session-panel {
  overflow: hidden;
}

.link-button {
  border: 0;
  background: transparent;
  color: var(--primary);
  font-size: 14px;
  cursor: pointer;
  font-weight: 700;
  transition: color 0.15s;
}

.link-button:hover {
  color: var(--primary-dark);
  text-decoration: underline;
}

/* ── Activity Table ────────────────────────────────────────── */
.activity-table,
.session-table {
  width: 100%;
}

.activity-row {
  display: grid;
  grid-template-columns: 110px minmax(160px, 1fr) 130px 100px 42px;
  align-items: center;
  min-height: 90px;
  border-top: 1px solid #e0e4ef;
  padding: 0 24px;
  transition: background 0.15s ease;
}

.activity-heading,
.session-heading {
  min-height: 50px;
  background: #eef3ff;
  color: #596072;
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
}

.activity-data-row:hover {
  background: #f5f8ff;
}

.activity-row strong {
  color: var(--primary);
  font-size: 16px;
}

mark.live {
  background: var(--green-soft);
  color: var(--green);
}

.table-action {
  display: inline-grid;
  width: 34px;
  height: 34px;
  place-items: center;
  border: 0;
  background: transparent;
  color: #646b7c;
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.15s;
}

.table-action:hover {
  background: #eef3ff;
  color: var(--primary);
}

/* ── Live Poll Panel ───────────────────────────────────────── */
.live-poll-panel {
  border-left: 4px solid var(--primary);
  padding: 30px 26px 24px;
}

.live-poll-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.live-poll-header .live-badge {
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
  animation: pulse-dot 1.5s ease-in-out infinite;
}

.live-poll-header div {
  text-align: right;
}

.live-poll-header strong {
  display: block;
  color: var(--primary);
  font-size: 22px;
  line-height: 0.95;
}

.live-poll-header small {
  color: #73798b;
  font-size: 9px;
  text-transform: uppercase;
}

.live-poll-panel h2 {
  max-width: 240px;
  margin-top: 6px;
  line-height: 1.35;
}

.live-poll-panel p {
  margin: 28px 0 24px;
  color: #1f2738;
  line-height: 1.35;
}

.poll-bars {
  display: grid;
  gap: 16px;
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
  transition: width 0.5s ease;
}

.close-poll-button {
  width: 100%;
  min-height: 50px;
  margin-top: 52px;
  transition: all 0.2s;
}

.close-poll-button:hover {
  opacity: 0.9;
  transform: scale(1.01);
}

/* ── Trends Panel ──────────────────────────────────────────── */
.trends-panel {
  min-height: 346px;
  padding-bottom: 20px;
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
  background: #9aa0b3;
}

.trend-chart {
  width: calc(100% - 48px);
  height: 205px;
  margin: 10px 24px 0;
  overflow: visible;
}

.chart-fill {
  fill: rgba(0, 31, 158, 0.11);
  transition: all 0.5s ease;
}

.trends-panel:hover .chart-fill {
  fill: rgba(0, 31, 158, 0.16);
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

.chart-points circle {
  transition: r 0.2s ease;
  cursor: pointer;
}

.chart-points circle:hover {
  r: 7;
}

.weekday-row {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  padding: 0 34px;
  color: #6d7485;
  font-size: 12px;
  text-transform: uppercase;
}

/* ── Session Log ───────────────────────────────────────────── */
.session-panel {
  grid-column: 1 / -1;
  margin-top: 10px;
}

.filter-button {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  min-height: 32px;
  padding: 0 14px;
  color: #1a2030;
  font-size: 12px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: #fff;
  cursor: pointer;
  font-weight: 700;
  transition: all 0.15s;
}

.filter-button:hover {
  border-color: var(--primary);
  color: var(--primary);
}

.session-row {
  display: grid;
  grid-template-columns: minmax(130px, 0.8fr) minmax(180px, 1.2fr) minmax(220px, 1.5fr) 100px 70px;
  align-items: center;
  min-height: 82px;
  border-top: 1px solid #dfe4ef;
  padding: 0 24px;
  transition: background 0.15s ease;
}

.session-data-row:hover {
  background: #f5f8ff;
}

.session-row strong {
  color: #101523;
}

.session-row .score {
  color: var(--green);
}

/* ── Responsive ─────────────────────────────────────────────── */
=======
>>>>>>> 6acf3de (fix: fixed style that brokend after merge)
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
