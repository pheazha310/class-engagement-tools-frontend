<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useToolOrganizerStore } from '@/stores/toolOrganizerStore'
import TeacherLayout from '@/components/teacher/TeacherLayout.vue'
import TeacherIcon from '@/components/teacher/TeacherIcon.vue'

const router = useRouter()
const organizer = useToolOrganizerStore()

const authStore = useAuthStore()
const teacherName = computed(() => authStore.user?.name || 'Dr. Sarah Miller')
const currentHour = ref(new Date().getHours())
const getGreeting = () => currentHour.value < 12 ? 'Good Morning' : currentHour.value < 18 ? 'Good Afternoon' : 'Good Evening'

const stats = [
  { label: 'Total Classes', value: '14', meta: '+2', icon: 'cap', tone: 'blue' as const },
  { label: 'Students', value: '342', meta: '+12%', icon: 'users', tone: 'blue' as const },
  { label: 'Active Polls', value: '3', meta: 'Live', icon: 'poll', tone: 'green' as const },
  { label: 'Scheduled', value: '2', meta: 'Next: 2PM', icon: 'calendar', tone: 'blue' as const },
  { label: 'Live Now', value: '8', meta: 'On air', icon: 'zap', tone: 'red' as const },
  { label: 'Activities', value: '450', meta: 'Total', icon: 'clipboard', tone: 'blue' as const },
]

const toneMap: Record<string, string> = {
  'Random Tools': 'cyan',
  'Quiz & Assessment': 'green',
  'Classroom Control': 'orange',
  'Games': 'violet',
  'Engagement': 'blue',
  'Fun Activities': 'orange',
}

const engageTools = computed(() => {
  return organizer.favoriteTools.map(t => ({
    label: t.title,
    icon: t.slug === 'random-wheel' || t.slug === 'live-voting' || t.slug === 'classroom-quiz' ? t.slug : t.slug,
    tone: (toneMap[t.category] || 'blue') as 'blue' | 'green' | 'orange' | 'cyan' | 'violet' | 'red',
    route: t.route,
    emoji: t.icon,
  }))
})

const recentActivities = [
  { className: 'BIOL-102', activity: 'Cellular Mitosis Quiz', status: 'Live', responses: '24/32', action: 'external' },
  { className: 'ECON-101', activity: 'Supply & Demand Poll', status: 'Completed', responses: '156/156', action: 'chart' },
  { className: 'CHEM-201', activity: 'Molecular Bonding Quiz', status: 'Completed', responses: '28/30', action: 'chart' },
]

const pollOptions = [
  { label: 'Horizontal Scaling', value: 68 },
  { label: 'Vertical Scaling', value: 25 },
]

const quickFavorites = [
  { label: 'Class Timer', icon: 'timer', tone: 'blue' as const },
  { label: 'Quick Poll', icon: 'poll', tone: 'green' as const },
  { label: 'Students', icon: 'users', tone: 'orange' as const },
  { label: 'Audio', icon: 'audio', tone: 'cyan' as const },
]

const sessionLogs = [
  { date: 'Oct 24, 2023', type: 'Interactive Quiz', subject: 'Genetics & Inheritance', score: '88%' },
  { date: 'Oct 23, 2023', type: 'Live Poll', subject: 'Advanced Biology', score: '94%' },
]

const navigateTo = (route?: string) => {
  if (route) router.push(route)
}

const searchValue = ref('')
</script>

<template>
  <TeacherLayout
    sidebar-active="dashboard"
    page-subtitle="Your engagement is up 12% this week."
    v-model:search-value="searchValue"
    search-placeholder="Search activities..."
  >
    <template #greeting>
      <h1>{{ getGreeting() }}, {{ teacherName }}</h1>
      <p>Your engagement is up <strong>12%</strong> this week.</p>
    </template>

    <template #actions>
      <button class="ghost-button" type="button">
        <span>Tools</span>
        <TeacherIcon icon="chevron" :size="16" />
      </button>
      <button class="outline-button" type="button">History</button>
      <button class="primary-button" type="button">Quick Launch</button>
    </template>

    <!-- Stats Grid -->
    <section class="stats-grid" aria-label="Dashboard statistics">
      <article v-for="stat in stats" :key="stat.label" class="stat-card" :class="`tone-${stat.tone}`">
        <div class="stat-label-row">
          <span>{{ stat.label }}</span>
          <TeacherIcon :icon="stat.icon" :size="19" />
        </div>
        <div class="stat-value-row">
          <strong>{{ stat.value }}</strong>
          <span>{{ stat.meta }}</span>
        </div>
      </article>
    </section>

    <!-- Engage Section -->
    <section class="engage-section">
      <div class="section-title-row">
        <h2>Engage Your Class</h2>
        <button class="outline-button manage-tools-btn" type="button">
          <TeacherIcon icon="settings" :size="16" />
          <span>Manage Tools</span>
        </button>
      </div>
      <div class="engage-grid">
        <button v-for="tool in engageTools" :key="tool.label" class="engage-tool" :class="`tone-${tool.tone}`" type="button" @click="navigateTo(tool.route)">
          <TeacherIcon class="favorite-star" icon="star" :size="14" />
          <span class="tool-icon engage-emoji">{{ tool.emoji }}</span>
          <span class="tool-label">{{ tool.label }}</span>
        </button>
        <button class="engage-tool add-tool" type="button" @click="navigateTo('/teacher/organize-tools')">
          <span class="tool-icon"><TeacherIcon icon="plus" :size="28" /></span>
          <span class="tool-label">Manage Tools</span>
        </button>
      </div>
    </section>

    <!-- Dashboard Grid -->
    <div class="dashboard-grid">
      <section class="panel recent-panel">
        <div class="panel-header">
          <h2>Recent Activities</h2>
          <button class="link-button" type="button">View All</button>
        </div>
        <div class="activity-table">
          <div class="activity-row activity-heading">
            <span>Class</span><span>Activity Name</span><span>Status</span><span>Responses</span><span></span>
          </div>
          <div v-for="activity in recentActivities" :key="activity.activity" class="activity-row">
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

      <aside class="panel live-poll-panel">
        <div class="live-poll-header">
          <span>Live Poll</span>
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
        <button class="primary-button close-poll-button" type="button">Close Poll & Share Results</button>
      </aside>

      <section class="panel trends-panel">
        <div class="panel-header">
          <h2>Participation Trends</h2>
          <div class="chart-legend">
            <span><i></i>Live</span><span><i></i>Average</span>
          </div>
        </div>
        <svg class="trend-chart" viewBox="0 0 680 230" preserveAspectRatio="none" role="img" aria-label="Weekly participation trend">
          <path class="chart-fill" d="M22 160 L132 137 L240 171 L350 128 L460 105 L570 128 L660 72 L660 214 L22 214 Z" />
          <path class="chart-line" d="M22 160 L132 137 L240 171 L350 128 L460 105 L570 128 L660 72" />
          <path class="chart-average" d="M22 181 L132 169 L240 181 L350 174 L460 169 L570 176 L660 165" />
          <g class="chart-points"><circle cx="132" cy="137" r="5" /><circle cx="350" cy="128" r="5" /><circle cx="460" cy="105" r="5" /></g>
        </svg>
        <div class="weekday-row"><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span></div>
      </section>

      <aside class="panel favorites-panel">
        <div class="panel-header">
          <h2>Quick Favorites</h2>
          <button class="icon-button compact" type="button" aria-label="Favorite shortcuts"><TeacherIcon icon="zap" :size="16" /></button>
        </div>
        <div class="favorites-grid">
          <button v-for="favorite in quickFavorites" :key="favorite.label" class="favorite-action" :class="`tone-${favorite.tone}`" type="button">
            <TeacherIcon :icon="favorite.icon" :size="24" />
            <span>{{ favorite.label }}</span>
          </button>
        </div>
      </aside>

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
          <div v-for="log in sessionLogs" :key="`${log.date}-${log.type}`" class="session-row">
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
/* ── Dashboard-specific overrides (6-column stats, engage grid, etc.) ── */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(120px, 1fr));
  gap: 24px;
}

.stat-card {
  min-height: 126px;
  padding: 26px 24px 20px;
}

.stat-value-row {
  align-items: flex-end;
  margin-top: 22px;
}

.stat-value-row strong {
  font-size: 31px;
  line-height: 0.9;
}

.stat-value-row span {
  color: var(--green);
  font-size: 11px;
  font-weight: 800;
}

.stat-card.tone-red .stat-value-row strong,
.stat-card.tone-red .stat-value-row span {
  color: var(--red);
}

.engage-section {
  margin-top: 32px;
}

.section-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.section-title-row h2 {
  margin: 0;
  font-size: 16px;
  font-weight: 800;
}

.manage-tools-btn {
  gap: 8px;
  min-height: 36px;
  border-color: var(--primary);
}

.engage-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(120px, 1fr));
  gap: 24px;
  margin-top: 22px;
}

.engage-tool {
  position: relative;
  display: flex;
  min-height: 154px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 20px;
  border: 1px solid transparent;
  border-left: 4px solid var(--primary);
  border-radius: 8px;
  background: var(--primary-soft);
  color: var(--primary);
  box-shadow: 0 14px 22px rgba(18, 36, 91, 0.08);
}

.engage-tool .tool-icon {
  display: grid;
  width: 64px;
  height: 64px;
  place-items: center;
  border-radius: 8px;
  background: #ffffff;
}

.engage-tool .tool-label {
  font-weight: 800;
}

.favorite-star {
  position: absolute;
  top: 14px;
  right: 12px;
}

.engage-tool.tone-green {
  border-left-color: var(--green);
  background: var(--green-soft);
  color: var(--green);
}

.engage-tool.tone-orange {
  border-left-color: var(--orange);
  background: var(--orange-soft);
  color: #eb6400;
}

.engage-tool.tone-cyan {
  border-left-color: var(--cyan);
  background: var(--cyan-soft);
  color: var(--cyan);
}

.engage-tool.tone-violet {
  border-left-color: var(--violet);
  background: var(--violet-soft);
  color: var(--violet);
}

.engage-tool.add-tool {
  border: 2px dashed #bfc6db;
  background: transparent;
  color: #696d7d;
  box-shadow: none;
}

.engage-tool.add-tool .tool-icon {
  background: #edf2ff;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(260px, 0.95fr);
  gap: 24px;
  margin-top: 32px;
}

.panel {
  min-width: 0;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: #ffffff;
  box-shadow: 0 16px 24px rgba(21, 33, 72, 0.06);
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
}

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
}

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

.live-poll-header > span {
  border-radius: 999px;
  background: #ffdde0;
  color: var(--red);
  font-size: 10px;
  font-weight: 800;
  padding: 5px 10px;
  text-transform: uppercase;
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
}

.close-poll-button {
  width: 100%;
  min-height: 50px;
  margin-top: 52px;
}

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
  grid-template-columns: repeat(5, 1fr);
  padding: 0 34px;
  color: #6d7485;
  font-size: 12px;
  text-transform: uppercase;
}

.favorites-panel {
  padding: 16px 20px 24px;
}

.favorites-panel .panel-header {
  min-height: 58px;
  padding: 0;
}

.compact {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background: #e8eefb;
  color: var(--primary);
}

.favorites-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  margin-top: 16px;
}

.favorite-action {
  display: flex;
  min-height: 116px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  border: 0;
  border-left: 4px solid var(--primary);
  border-radius: 8px;
  background: var(--primary-soft);
  color: var(--primary);
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
  cursor: pointer;
}

.favorite-action.tone-green {
  border-left-color: var(--green);
  color: var(--green);
}

.favorite-action.tone-orange {
  border-left-color: var(--orange);
  color: var(--orange);
}

.favorite-action.tone-cyan {
  border-left-color: var(--cyan);
  color: var(--cyan);
}

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
}

.session-row {
  display: grid;
  grid-template-columns: minmax(130px, 0.8fr) minmax(180px, 1.2fr) minmax(220px, 1.5fr) 100px 70px;
  align-items: center;
  min-height: 82px;
  border-top: 1px solid #dfe4ef;
  padding: 0 24px;
}

.session-row strong {
  color: #101523;
}

.session-row .score {
  color: var(--green);
}

.icon-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: #151928;
  cursor: pointer;
}

/* ── Responsive ─────────────────────────────────────────────── */
@media (max-width: 1280px) {
  .stats-grid,
  .engage-grid {
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
  .stats-grid,
  .engage-grid,
  .favorites-grid {
    grid-template-columns: 1fr;
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
