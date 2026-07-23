<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useTeacherDashboardStore } from '@/stores/teacherDashboardStore'
import { useToolOrganizerStore } from '@/stores/toolOrganizerStore'
import TeacherLayout from '@/components/teacher/TeacherLayout.vue'
import TeacherIcon from '@/components/teacher/TeacherIcon.vue'
import { categories } from '@/data/toolsData'

const router = useRouter()
const organizer = useToolOrganizerStore()
const authStore = useAuthStore()
const dashboardStore = useTeacherDashboardStore()

const teacherName = computed(() => authStore.user?.name || 'Dr. Sarah Miller')
const currentHour = ref(new Date().getHours())
const getGreeting = () =>
  currentHour.value < 12
    ? 'Good Morning'
    : currentHour.value < 18
      ? 'Good Afternoon'
      : 'Good Evening'

// ── Real-time stats (store-backed with simulation fallback) ──
const fallbackBase = {
  totalClasses: 14,
  totalStudents: 342,
  activePolls: 3,
  scheduledSessions: 2,
  liveSessions: 8,
  totalActivities: 450,
  engagementPct: 12,
}

const stats = ref({ ...fallbackBase })

function jitter(base: number, maxDelta: number): number {
  const delta = Math.round((Math.random() - 0.5) * maxDelta * 2)
  return Math.max(0, base + delta)
}

let intervalId: ReturnType<typeof setInterval> | null = null

function refreshStats() {
  const store = dashboardStore
  // Use store data when available, otherwise fall back to jitter
  const classes = store.totalClasses || jitter(fallbackBase.totalClasses, 1)
  const students = store.uniqueStudents || jitter(fallbackBase.totalStudents, 8)
  const polls = store.activeQuizzes || jitter(fallbackBase.activePolls, 1)
  const activities = store.totalActivities || jitter(fallbackBase.totalActivities, 12)

  stats.value = {
    totalClasses: typeof classes === 'number' ? classes : Number(classes),
    totalStudents: typeof students === 'number' ? students : Number(students),
    activePolls: typeof polls === 'number' ? polls : Number(polls),
    scheduledSessions: jitter(fallbackBase.scheduledSessions, 1),
    liveSessions: jitter(fallbackBase.liveSessions, 2),
    totalActivities: typeof activities === 'number' ? activities : Number(activities),
    engagementPct: jitter(fallbackBase.engagementPct, 2),
  }
}

onMounted(async () => {
  // Try to fetch real data from store
  try {
    await dashboardStore.fetchDashboardStats()
    await dashboardStore.fetchRecentActivities()
  } catch {
    // Silently fall back to simulated data
  }
  refreshStats()
  intervalId = setInterval(refreshStats, 5000)
})

onUnmounted(() => {
  if (intervalId) clearInterval(intervalId)
})

// ── Stat card definitions ────────────────────────────────────
const statCards = computed(() => [
  {
    label: 'Total Classes',
    value: String(stats.value.totalClasses),
    meta: '+2',
    icon: 'cap',
    tone: 'blue' as const,
    route: '/teacher/classes',
  },
  {
    label: 'Students',
    value: String(stats.value.totalStudents),
    meta: `+${stats.value.engagementPct}%`,
    icon: 'users',
    tone: 'green' as const,
    route: '/teacher/students',
  },
  {
    label: 'Active Polls',
    value: String(stats.value.activePolls),
    meta: 'Live',
    icon: 'poll',
    tone: 'red' as const,
    route: '/teacher/live-polls',
  },
  {
    label: 'Scheduled',
    value: String(stats.value.scheduledSessions),
    meta: 'Next: 2PM',
    icon: 'calendar',
    tone: 'blue' as const,
    route: '/teacher/live-polls',
  },
  {
    label: 'Live Now',
    value: String(stats.value.liveSessions),
    meta: 'On air',
    icon: 'zap',
    tone: 'red' as const,
    route: '/teacher/live-polls',
  },
  {
    label: 'Activities',
    value: String(stats.value.totalActivities),
    meta: 'Total',
    icon: 'clipboard',
    tone: 'blue' as const,
    route: '/teacher/activity-history',
  },
])

// ── Recent Activities ────────────────────────────────────────
const recentActivities = computed(() => {
  const storeItems = dashboardStore.recentActivities
  if (storeItems.length > 0) {
    return storeItems.slice(0, 3).map((a: any) => ({
      className: a.class_name || a.class || 'Class',
      activity: a.name || a.title || a.description || 'Activity',
      status: a.status === 'active' || a.status === 'live' ? 'Live' : 'Completed',
      responses: a.responses ? `${a.responses}/??` : '—',
      action: 'external' as const,
    }))
  }
  return [
    { className: 'BIOL-102', activity: 'Cellular Mitosis Quiz', status: 'Live' as const, responses: '24/32', action: 'external' as const },
    { className: 'ECON-101', activity: 'Supply & Demand Poll', status: 'Completed' as const, responses: '156/156', action: 'chart' as const },
    { className: 'CHEM-201', activity: 'Molecular Bonding Quiz', status: 'Completed' as const, responses: '28/30', action: 'chart' as const },
  ]
})

// ── Poll Options ─────────────────────────────────────────────
const pollOptions = [
  { label: 'Horizontal Scaling', value: 68 },
  { label: 'Vertical Scaling', value: 25 },
]

// ── Session Logs ─────────────────────────────────────────────
const sessionLogs = [
  { date: 'Oct 24, 2023', type: 'Interactive Quiz', subject: 'Genetics & Inheritance', score: '88%' },
  { date: 'Oct 23, 2023', type: 'Live Poll', subject: 'Advanced Biology', score: '94%' },
]

// ── Navigation ───────────────────────────────────────────────
const navigateTo = (route?: string) => {
  if (route) router.push(route)
}

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

const categoryFilters = computed(() => {
  const cats = new Set(organizer.allToolsWithState.map(t => t.category))
  return Array.from(cats)
})

const activeCatFilter = ref('all')

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
}
</script>

<template>
  <TeacherLayout
    sidebar-active="dashboard"
    page-subtitle="Your engagement is up 12% this week."
  >
    <template #greeting>
      <h1>{{ getGreeting() }}, {{ teacherName }}</h1>
      <p>Your engagement is up <strong>{{ stats.engagementPct }}%</strong> this week.</p>
    </template>

    <!-- ========== Stats Grid ========== -->
    <section class="stats-grid" aria-label="Dashboard statistics">
      <article
        v-for="stat in statCards"
        :key="stat.label"
        class="stat-card"
        :class="`tone-${stat.tone}`"
        @click="navigateTo(stat.route)"
        role="button"
        :tabindex="0"
        @keydown.enter="navigateTo(stat.route)"
      >
        <div class="stat-label-row">
          <span>{{ stat.label }}</span>
          <TeacherIcon :icon="stat.icon" :size="19" />
        </div>
        <div class="stat-value-row">
          <strong class="stat-number">{{ stat.value }}</strong>
          <span class="stat-meta-badge">{{ stat.meta }}</span>
        </div>
        <div class="stat-hover-indicator">
          <span>View details</span>
          <TeacherIcon icon="chevronRight" :size="14" />
        </div>
      </article>
    </section>

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
    <div class="dashboard-grid">
      <!-- Recent Activities -->
      <section class="panel recent-panel">
        <div class="panel-header">
          <h2>Recent Activities</h2>
          <button class="link-button" type="button" @click="navigateTo('/teacher/activity-history')">View All</button>
        </div>
        <div class="activity-table">
          <div class="activity-row activity-heading">
            <span>Class</span><span>Activity Name</span><span>Status</span><span>Responses</span><span></span>
          </div>
          <div
            v-for="activity in recentActivities"
            :key="activity.activity"
            class="activity-row activity-data-row"
          >
            <strong>{{ activity.className }}</strong>
            <span>{{ activity.activity }}</span>
            <span><mark :class="activity.status.toLowerCase()">{{ activity.status }}</mark></span>
            <span>{{ activity.responses }}</span>
            <button class="table-action" type="button" aria-label="Open activity">
              <TeacherIcon :icon="activity.action" :size="21" />
            </button>
          </div>
        </div>
      </section>

      <!-- Live Poll -->
      <aside class="panel live-poll-panel">
        <div class="live-poll-header">
          <span class="live-badge">Live Poll</span>
          <div><strong>156</strong><small>Responses</small></div>
        </div>
        <h2>Concept Check: Option A vs B</h2>
        <p>Which of the following best describes Option A in terms of scalability?</p>
        <div class="poll-bars">
          <div v-for="option in pollOptions" :key="option.label" class="poll-bar">
            <div><span>{{ option.label }}</span><strong>{{ option.value }}%</strong></div>
            <i :style="{ width: option.value + '%' }"></i>
          </div>
        </div>
        <button class="primary-button close-poll-button" type="button">Close Poll &amp; Share Results</button>
      </aside>

      <!-- Participation Trends -->
      <section class="panel trends-panel">
        <div class="panel-header">
          <h2>Participation Trends</h2>
          <div class="chart-legend">
            <span><i></i>Today</span><span><i></i>Average</span>
          </div>
        </div>
        <svg class="trend-chart" viewBox="0 0 680 230" preserveAspectRatio="none" role="img" aria-label="Weekly participation trend">
          <path class="chart-fill" d="M22 160 L132 137 L240 171 L350 128 L460 105 L570 128 L660 72 L660 214 L22 214 Z" />
          <path class="chart-line" d="M22 160 L132 137 L240 171 L350 128 L460 105 L570 128 L660 72" />
          <path class="chart-average" d="M22 181 L132 169 L240 181 L350 174 L460 169 L570 176 L660 165" />
          <g class="chart-points">
            <circle cx="132" cy="137" r="5" />
            <circle cx="350" cy="128" r="5" />
            <circle cx="460" cy="105" r="5" />
          </g>
        </svg>
        <div class="weekday-row"><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span></div>
      </section>

      <!-- Session Log -->
      <section class="panel session-panel">
        <div class="panel-header">
          <h2>Session Log</h2>
          <button class="filter-button" type="button">
            <span>All Types</span>
            <TeacherIcon icon="chevron" :size="14" />
          </button>
        </div>
        <div class="session-table">
          <div class="session-row session-heading">
            <span>Date</span><span>Activity Type</span><span>Subject</span><span>Score</span><span>Actions</span>
          </div>
          <div
            v-for="log in sessionLogs"
            :key="`${log.date}-${log.type}`"
            class="session-row session-data-row"
          >
            <span>{{ log.date }}</span>
            <strong>{{ log.type }}</strong>
            <span>{{ log.subject }}</span>
            <strong class="score">{{ log.score }}</strong>
            <button class="table-action" type="button" aria-label="More session actions">
              <TeacherIcon icon="more" :size="20" />
            </button>
          </div>
        </div>
      </section>
    </div>
  </TeacherLayout>
</template>

<style scoped>
/* ── Live data pulse animation ─────────────────────────────── */
@keyframes pulse-dot {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

/* ── Stats Grid ────────────────────────────────────────────── */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(120px, 1fr));
  gap: 24px;
}

.stat-card {
  position: relative;
  min-height: 126px;
  padding: 26px 24px 20px;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}

.stat-number {
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 20px 32px rgba(21, 33, 72, 0.12);
  border-color: var(--primary);
}

.stat-card:active {
  transform: translateY(-2px);
}

.stat-card:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
}

.stat-value-row {
  align-items: flex-end;
  margin-top: 22px;
}

.stat-number {
  font-size: 31px;
  line-height: 0.9;
  display: inline-block;
  transition: transform 0.3s ease;
}

.stat-card:hover .stat-number {
  transform: scale(1.05);
}

.stat-meta-badge {
  color: var(--green);
  font-size: 11px;
  font-weight: 800;
}

.stat-card.tone-red .stat-number,
.stat-card.tone-red .stat-meta-badge {
  color: var(--red);
}

.stat-card.tone-green .stat-number {
  color: var(--green);
}

.stat-card.tone-green .stat-meta-badge {
  color: var(--green);
}

.stat-hover-indicator {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 6px;
  background: rgba(0, 31, 158, 0.06);
  font-size: 11px;
  font-weight: 700;
  color: var(--primary);
  transform: translateY(100%);
  transition: transform 0.2s ease;
}

.stat-card:hover .stat-hover-indicator {
  transform: translateY(0);
}

/* ══════════════════════════════════════════════════════════════
   REDESIGNED FAVORITE TOOLS SECTION
   ══════════════════════════════════════════════════════════════ */
.favtools-section {
  margin-top: 38px;
}

.section-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
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

.manage-tools-btn {
  gap: 8px;
  min-height: 36px;
  border-color: var(--primary);
}

.favtools-actions-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.favtools-actions-row .ghost-button,
.favtools-actions-row .outline-button {
  min-height: 34px;
  font-size: 12px;
}

/* Empty state */
.empty-favorites {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 52px 24px;
  border: 2px dashed var(--line);
  border-radius: 16px;
  background: linear-gradient(135deg, #fafbff 0%, #f0f4ff 100%);
  margin-top: 22px;
}

.empty-fav-icon {
  color: var(--muted);
  opacity: 0.35;
}

.empty-favorites h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 800;
  color: var(--ink);
}

.empty-favorites p {
  margin: 0;
  color: var(--muted);
  font-size: 14px;
  max-width: 300px;
  text-align: center;
}

/* ── Favorites track (horizontal scroll) ───────────────────── */
.favtools-track-wrapper {
  margin-top: 20px;
  margin-left: -4px;
  margin-right: -4px;
  overflow-x: auto;
  padding-bottom: 6px;
  scrollbar-width: thin;
  scrollbar-color: var(--line) transparent;
}

.favtools-track-wrapper::-webkit-scrollbar {
  height: 4px;
}

.favtools-track-wrapper::-webkit-scrollbar-thumb {
  background: var(--line);
  border-radius: 999px;
}

.favtools-track {
  display: flex;
  gap: 16px;
  padding: 4px;
  min-width: min-content;
}

/* ── Individual favorite card ──────────────────────────────── */
.favtool-card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: 156px;
  min-height: 156px;
  padding: 20px 14px;
  border-radius: 16px;
  border: 1px solid #e6eaff;
  background: linear-gradient(145deg, #ffffff 0%, #f8faff 100%);
  color: var(--primary);
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(21, 33, 72, 0.05);
}

.favtool-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 14px 32px rgba(21, 33, 72, 0.13);
  border-color: var(--primary);
}

.favtool-card:active {
  transform: translateY(-3px);
}

/* ── VIBRANT COLOR SCHEMES for favorite tool cards ───────── */

.favtool-card.color-cyan {
  background: linear-gradient(145deg, #e8f4fd 0%, #d0ecff 100%);
  border-color: #7fc4ff;
  color: #0066cc;
}
.favtool-card.color-cyan:hover {
  border-color: #0095ff;
  box-shadow: 0 12px 28px rgba(0, 149, 255, 0.25);
  background: linear-gradient(145deg, #dceefe 0%, #b8e0ff 100%);
}

.favtool-card.color-green {
  background: linear-gradient(145deg, #e6f7ed 0%, #c8f0d7 100%);
  border-color: #6fcf8f;
  color: #007733;
}
.favtool-card.color-green:hover {
  border-color: #00b34d;
  box-shadow: 0 12px 28px rgba(0, 179, 77, 0.25);
  background: linear-gradient(145deg, #d4f4e0 0%, #a8e8c0 100%);
}

.favtool-card.color-orange {
  background: linear-gradient(145deg, #fef0e0 0%, #fde0b8 100%);
  border-color: #faba66;
  color: #cc5a00;
}
.favtool-card.color-orange:hover {
  border-color: #ff8800;
  box-shadow: 0 12px 28px rgba(255, 136, 0, 0.25);
  background: linear-gradient(145deg, #fde8cc 0%, #fcd4a0 100%);
}

.favtool-card.color-violet {
  background: linear-gradient(145deg, #f0e8fe 0%, #e0d0fc 100%);
  border-color: #b88af0;
  color: #6b21a8;
}
.favtool-card.color-violet:hover {
  border-color: #9333ea;
  box-shadow: 0 12px 28px rgba(147, 51, 234, 0.25);
  background: linear-gradient(145deg, #e8d8fe 0%, #d0b8fc 100%);
}

.favtool-card.color-red {
  background: linear-gradient(145deg, #fde8e8 0%, #fccccc 100%);
  border-color: #f08080;
  color: #b91c1c;
}
.favtool-card.color-red:hover {
  border-color: #ef4444;
  box-shadow: 0 12px 28px rgba(239, 68, 68, 0.25);
  background: linear-gradient(145deg, #fcd4d4 0%, #fab0b0 100%);
}

.favtool-card.color-blue {
  background: linear-gradient(145deg, #e0e8ff 0%, #c0d4ff 100%);
  border-color: #80a0ff;
  color: #001f9e;
}
.favtool-card.color-blue:hover {
  border-color: #3366ff;
  box-shadow: 0 12px 28px rgba(51, 102, 255, 0.25);
  background: linear-gradient(145deg, #ccd8ff 0%, #a0baff 100%);
}

/* Remove button */
.favtool-remove {
  position: absolute;
  top: 8px;
  right: 8px;
  display: inline-grid;
  width: 24px;
  height: 24px;
  place-items: center;
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.04);
  color: #8a92a8;
  cursor: pointer;
  opacity: 0;
  transition: all 0.2s ease;
}

.favtool-card:hover .favtool-remove {
  opacity: 1;
}

.favtool-remove:hover {
  background: var(--red-soft);
  color: var(--red);
  transform: scale(1.15);
}

.favtool-emoji {
  font-size: 36px;
  line-height: 1;
  transition: transform 0.3s ease;
}

.favtool-card:hover .favtool-emoji {
  transform: scale(1.12);
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
  opacity: 0;
  transition: opacity 0.2s ease;
}

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
@media (max-width: 1280px) {
  .stats-grid {
    grid-template-columns: repeat(3, minmax(150px, 1fr));
  }
}

@media (max-width: 980px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
  }
  .session-panel {
    margin-top: 0;
  }
}

@media (max-width: 720px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }

  .favtools-track {
    gap: 12px;
  }

  .favtool-card {
    width: 140px;
    min-height: 140px;
  }

  .section-title-row,
  .panel-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .activity-row,
  .session-row {
    grid-template-columns: 1fr;
    gap: 10px;
    min-height: auto;
    padding: 18px;
  }

  .activity-heading,
  .session-heading {
    display: none;
  }
}
</style>
