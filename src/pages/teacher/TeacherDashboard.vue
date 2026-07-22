<script setup lang="ts">
import { computed, h, ref, type PropType } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()
const currentHour = ref(new Date().getHours())

const iconPaths = {
  logo: [
    'M4 10l8-4 8 4-8 4-8-4z',
    'M6 11.5v4c0 .8 2.7 2.5 6 2.5s6-1.7 6-2.5v-4',
    'M20 10v5',
  ],
  grid: ['M4 4h6v6H4z', 'M14 4h6v6h-6z', 'M4 14h6v6H4z', 'M14 14h6v6h-6z'],
  users: [
    'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2',
    'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8',
    'M22 21v-2a4 4 0 0 0-3-3.87',
    'M16 3.13a4 4 0 0 1 0 7.75',
  ],
  clipboard: [
    'M9 3h6v4H9z',
    'M7 5H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2',
    'M8 12h8',
    'M8 16h8',
  ],
  history: ['M3 12a9 9 0 1 0 3-6.7', 'M3 4v6h6', 'M12 7v5l3 2'],
  settings: [
    'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6',
    'M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .34 1.7 1.7 0 0 0-.7 1.52V21a2 2 0 1 1-4 0v-.09A1.7 1.7 0 0 0 8 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.34-1 1.7 1.7 0 0 0-1.52-.7H2.6a2 2 0 1 1 0-4h.09A1.7 1.7 0 0 0 4.6 8a1.7 1.7 0 0 0-.34-1.88l-.06-.06A2 2 0 1 1 7.03 3.2l.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.34 1.7 1.7 0 0 0 .7-1.52V2.6a2 2 0 1 1 4 0v.09A1.7 1.7 0 0 0 16 4.6a1.7 1.7 0 0 0 1.88-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.4 9c0 .36.12.7.34 1 .34.47.86.73 1.52.7h.14a2 2 0 1 1 0 4h-.09A1.7 1.7 0 0 0 19.4 15z',
  ],
  search: ['M21 21l-4.35-4.35', 'M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15z'],
  bell: ['M18 8a6 6 0 0 0-12 0c0 7-3 7-3 7h18s-3 0-3-7', 'M13.73 21a2 2 0 0 1-3.46 0'],
  chevron: ['M6 9l6 6 6-6'],
  cap: ['M4 10l8-4 8 4-8 4-8-4z', 'M6 12v4c2 2 10 2 12 0v-4'],
  poll: ['M5 20V9', 'M12 20V4', 'M19 20v-7', 'M3 20h18'],
  quiz: ['M9 9a3 3 0 1 1 5.5 1.7c-.7.7-1.7 1.1-2.5 1.8V14', 'M12 18h.01', 'M4 4h16v16H4z'],
  timer: ['M10 2h4', 'M12 14V8', 'M12 22a8 8 0 1 0 0-16 8 8 0 0 0 0 16z'],
  picker: ['M14 4h6v6', 'M20 4l-7 7', 'M10 20H4v-6', 'M4 20l7-7'],
  groups: ['M8 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6', 'M16 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6', 'M3 21v-1a5 5 0 0 1 10 0v1', 'M11 21v-1a5 5 0 0 1 10 0v1'],
  plus: ['M12 5v14', 'M5 12h14'],
  calendar: ['M8 2v4', 'M16 2v4', 'M3 9h18', 'M5 4h14a2 2 0 0 1 2 2v14H3V6a2 2 0 0 1 2-2z'],
  chart: ['M4 19V5', 'M8 17v-5', 'M13 17V8', 'M18 17v-8', 'M22 19H3'],
  package: ['M4 7l8-4 8 4-8 4-8-4z', 'M4 7v10l8 4 8-4V7', 'M12 11v10'],
  star: ['M12 3l2.7 5.5 6.1.9-4.4 4.2 1 6-5.4-2.9L6.6 19.6l1-6-4.4-4.2 6.1-.9L12 3z'],
  zap: ['M13 2L4 14h7l-1 8 9-12h-7l1-8z'],
  external: ['M14 3h7v7', 'M21 3l-9 9', 'M20 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h5'],
  more: ['M12 12h.01', 'M19 12h.01', 'M5 12h.01'],
  audio: ['M4 14h4l5 4V6L8 10H4v4z', 'M16 9a4 4 0 0 1 0 6', 'M19 6a8 8 0 0 1 0 12'],
} as const

type IconName = keyof typeof iconPaths

const IconGlyph = {
  name: 'IconGlyph',
  props: {
    icon: {
      type: String as PropType<IconName>,
      required: true,
    },
    size: {
      type: [Number, String],
      default: 20,
    },
    strokeWidth: {
      type: Number,
      default: 2,
    },
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

const teacherName = computed(() => authStore.user?.name || 'Dr. Sarah Miller')
const teacherInitials = computed(() =>
  teacherName.value
    .split(/\s+/)
    .filter(Boolean)
    .slice(-2)
    .map((part) => part[0])
    .join('')
    .toUpperCase(),
)

const getGreeting = () => {
  if (currentHour.value < 12) return 'Good Morning'
  if (currentHour.value < 18) return 'Good Afternoon'
  return 'Good Evening'
}

const sidebarItems: Array<{ id: string; label: string; icon: IconName; route?: string }> = [
  { id: 'dashboard', label: 'Dashboard', icon: 'grid', route: '/teacher/dashboard' },
  { id: 'classes', label: 'Classes', icon: 'cap', route: '/teacher/classes' },
  { id: 'students', label: 'Students', icon: 'users' },
  { id: 'student-order', label: 'Student Order', icon: 'clipboard' },
  { id: 'history', label: 'Activity History', icon: 'history' },
]

const stats: Array<{
  label: string
  value: string
  meta: string
  icon: IconName
  tone: 'blue' | 'green' | 'red'
}> = [
  { label: 'Total Classes', value: '14', meta: '+2', icon: 'cap', tone: 'blue' },
  { label: 'Students', value: '342', meta: '+12%', icon: 'users', tone: 'blue' },
  { label: 'Active Polls', value: '3', meta: 'Live', icon: 'poll', tone: 'green' },
  { label: 'Scheduled', value: '2', meta: 'Next: 2PM', icon: 'calendar', tone: 'blue' },
  { label: 'Live Now', value: '8', meta: 'On air', icon: 'zap', tone: 'red' },
  { label: 'Activities', value: '450', meta: 'Total', icon: 'clipboard', tone: 'blue' },
]

const engageTools: Array<{
  label: string
  icon: IconName
  tone: 'blue' | 'green' | 'orange' | 'cyan' | 'violet'
  route?: string
  favorite?: boolean
}> = [
  { label: 'Live Poll', icon: 'poll', tone: 'blue', route: '/teacher/live-polls/create', favorite: true },
  { label: 'Quiz', icon: 'quiz', tone: 'green', route: '/quizzes/create', favorite: true },
  { label: 'Timer', icon: 'timer', tone: 'orange', route: '/timer', favorite: true },
  { label: 'Picker', icon: 'picker', tone: 'cyan', route: '/student-picker' },
  { label: 'Groups', icon: 'groups', tone: 'violet', route: '/group-generator' },
]

const recentActivities = [
  {
    className: 'BIOL-102',
    activity: 'Cellular Mitosis Quiz',
    status: 'Live',
    responses: '24/32',
    action: 'external' as IconName,
  },
  {
    className: 'ECON-101',
    activity: 'Supply & Demand Poll',
    status: 'Completed',
    responses: '156/156',
    action: 'chart' as IconName,
  },
  {
    className: 'CHEM-201',
    activity: 'Molecular Bonding Quiz',
    status: 'Completed',
    responses: '28/30',
    action: 'chart' as IconName,
  },
]

const pollOptions = [
  { label: 'Horizontal Scaling', value: 68 },
  { label: 'Vertical Scaling', value: 25 },
]

const quickFavorites: Array<{ label: string; icon: IconName; tone: 'blue' | 'green' | 'orange' | 'cyan' }> = [
  { label: 'Class Timer', icon: 'timer', tone: 'blue' },
  { label: 'Quick Poll', icon: 'poll', tone: 'green' },
  { label: 'Students', icon: 'users', tone: 'orange' },
  { label: 'Audio', icon: 'audio', tone: 'cyan' },
]

const sessionLogs = [
  {
    date: 'Oct 24, 2023',
    type: 'Interactive Quiz',
    subject: 'Genetics & Inheritance',
    score: '88%',
  },
  {
    date: 'Oct 23, 2023',
    type: 'Live Poll',
    subject: 'Advanced Biology',
    score: '94%',
  },
]

const navigateTo = (route?: string) => {
  if (route) {
    router.push(route)
  }
}
</script>

<template>
  <div class="teacher-dashboard">
    <aside class="teacher-sidebar" aria-label="Teacher dashboard navigation">
      <div class="brand-lockup">
        <div class="brand-mark">
          <IconGlyph icon="logo" :size="27" :stroke-width="2.3" />
        </div>
        <div>
          <p class="brand-name">EduPulse</p>
          <p class="brand-subtitle">Classroom Engagement</p>
        </div>
      </div>

      <nav class="sidebar-nav">
        <button
          v-for="item in sidebarItems"
          :key="item.id"
          class="sidebar-link"
          :class="{ active: item.id === 'dashboard' }"
          type="button"
          @click="navigateTo(item.route)"
        >
          <IconGlyph :icon="item.icon" :size="22" />
          <span>{{ item.label }}</span>
        </button>
      </nav>

      <div class="sidebar-footer">
        <div class="teacher-card">
          <div class="teacher-avatar-initials">{{ teacherInitials }}</div>
          <div>
            <p>{{ teacherName }}</p>
            <span>Senior Instructor</span>
          </div>
        </div>
        <button class="settings-link" type="button">
          <IconGlyph icon="settings" :size="22" />
          <span>Settings</span>
        </button>
      </div>
    </aside>

    <section class="dashboard-workspace">
      <header class="dashboard-topbar">
        <div class="greeting-block">
          <h1>{{ getGreeting() }}, {{ teacherName }}</h1>
          <p>Your engagement is up <strong>12%</strong> this week.</p>
        </div>

        <label class="search-field" aria-label="Search activities">
          <IconGlyph icon="search" :size="22" />
          <input type="search" placeholder="Search activities..." />
        </label>

        <div class="topbar-actions">
          <button class="ghost-button tools-button" type="button">
            <span>Tools</span>
            <IconGlyph icon="chevron" :size="16" />
          </button>
          <button class="outline-button" type="button">History</button>
          <button class="primary-button" type="button">Quick Launch</button>
          <button class="icon-button notification-button" type="button" aria-label="Notifications">
            <IconGlyph icon="bell" :size="22" />
            <span></span>
          </button>
        </div>
      </header>

      <main class="dashboard-content">
        <section class="stats-grid" aria-label="Dashboard statistics">
          <article v-for="stat in stats" :key="stat.label" class="stat-card" :class="`tone-${stat.tone}`">
            <div class="stat-label-row">
              <span>{{ stat.label }}</span>
              <IconGlyph :icon="stat.icon" :size="19" />
            </div>
            <div class="stat-value-row">
              <strong>{{ stat.value }}</strong>
              <span>{{ stat.meta }}</span>
            </div>
          </article>
        </section>

        <section class="engage-section">
          <div class="section-title-row">
            <h2>Engage Your Class</h2>
            <button class="manage-tools-button" type="button">
              <IconGlyph icon="settings" :size="16" />
              <span>Manage Tools</span>
            </button>
          </div>

          <div class="engage-grid">
            <button
              v-for="tool in engageTools"
              :key="tool.label"
              class="engage-tool"
              :class="`tone-${tool.tone}`"
              type="button"
              @click="navigateTo(tool.route)"
            >
              <IconGlyph v-if="tool.favorite" class="favorite-star" icon="star" :size="16" />
              <span class="tool-icon"><IconGlyph :icon="tool.icon" :size="28" /></span>
              <span class="tool-label">{{ tool.label }}</span>
            </button>

            <button class="engage-tool add-tool" type="button">
              <span class="tool-icon"><IconGlyph icon="plus" :size="28" /></span>
              <span class="tool-label">Add Tool</span>
            </button>
          </div>
        </section>

        <div class="dashboard-grid">
          <section class="panel recent-panel">
            <div class="panel-header">
              <h2>Recent Activities</h2>
              <button class="link-button" type="button">View All</button>
            </div>
            <div class="activity-table">
              <div class="activity-row activity-heading">
                <span>Class</span>
                <span>Activity Name</span>
                <span>Status</span>
                <span>Responses</span>
                <span></span>
              </div>
              <div v-for="activity in recentActivities" :key="activity.activity" class="activity-row">
                <strong>{{ activity.className }}</strong>
                <span>{{ activity.activity }}</span>
                <span>
                  <mark :class="activity.status.toLowerCase()">{{ activity.status }}</mark>
                </span>
                <span>{{ activity.responses }}</span>
                <button class="table-action" type="button" aria-label="Open activity">
                  <IconGlyph :icon="activity.action" :size="21" />
                </button>
              </div>
            </div>
          </section>

          <aside class="panel live-poll-panel">
            <div class="live-poll-header">
              <span>Live Poll</span>
              <div>
                <strong>156</strong>
                <small>Responses</small>
              </div>
            </div>
            <h2>Concept Check: Option A vs B</h2>
            <p>Which of the following best describes Option A in terms of scalability?</p>
            <div class="poll-bars">
              <div v-for="option in pollOptions" :key="option.label" class="poll-bar">
                <div>
                  <span>{{ option.label }}</span>
                  <strong>{{ option.value }}%</strong>
                </div>
                <i :style="{ width: `${option.value}%` }"></i>
              </div>
            </div>
            <button class="primary-button close-poll-button" type="button">Close Poll & Share Results</button>
          </aside>

          <section class="panel trends-panel">
            <div class="panel-header">
              <h2>Participation Trends</h2>
              <div class="chart-legend">
                <span><i></i>Live</span>
                <span><i></i>Average</span>
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
            <div class="weekday-row">
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
            </div>
          </section>

          <aside class="panel favorites-panel">
            <div class="panel-header">
              <h2>Quick Favorites</h2>
              <button class="icon-button compact" type="button" aria-label="Favorite shortcuts">
                <IconGlyph icon="zap" :size="16" />
              </button>
            </div>
            <div class="favorites-grid">
              <button
                v-for="favorite in quickFavorites"
                :key="favorite.label"
                class="favorite-action"
                :class="`tone-${favorite.tone}`"
                type="button"
              >
                <IconGlyph :icon="favorite.icon" :size="24" />
                <span>{{ favorite.label }}</span>
              </button>
            </div>
          </aside>

          <section class="panel session-panel">
            <div class="panel-header">
              <h2>Session Log</h2>
              <button class="filter-button" type="button">
                <span>All Types</span>
                <IconGlyph icon="chevron" :size="14" />
              </button>
            </div>
            <div class="session-table">
              <div class="session-row session-heading">
                <span>Date</span>
                <span>Activity Type</span>
                <span>Subject</span>
                <span>Score</span>
                <span>Actions</span>
              </div>
              <div v-for="log in sessionLogs" :key="`${log.date}-${log.type}`" class="session-row">
                <span>{{ log.date }}</span>
                <strong>{{ log.type }}</strong>
                <span>{{ log.subject }}</span>
                <strong class="score">{{ log.score }}</strong>
                <button class="table-action" type="button" aria-label="More session actions">
                  <IconGlyph icon="more" :size="20" />
                </button>
              </div>
            </div>
          </section>
        </div>
      </main>
    </section>
  </div>
</template>

<style scoped>
.teacher-dashboard {
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
  display: flex;
  min-height: 100vh;
  background: var(--surface-soft);
  color: var(--ink);
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

button,
input {
  font: inherit;
}

button {
  cursor: pointer;
}

.teacher-sidebar {
  position: sticky;
  top: 0;
  display: flex;
  width: 263px;
  min-width: 263px;
  height: 100vh;
  flex-direction: column;
  background: linear-gradient(180deg, #2547bc 0%, #1838a9 100%);
  color: #ffffff;
}

.brand-lockup {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 32px 24px 34px;
}

.brand-mark {
  display: grid;
  width: 29px;
  height: 29px;
  place-items: center;
  color: #ffffff;
}

.brand-name {
  margin: 0;
  font-size: 16px;
  font-weight: 800;
}

.brand-subtitle {
  margin: 8px 0 0;
  color: rgba(255, 255, 255, 0.78);
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
}

.sidebar-nav {
  display: grid;
  gap: 8px;
  padding: 0 16px;
}

.sidebar-link,
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

.sidebar-link {
  min-height: 42px;
  border-radius: 8px;
  padding: 0 20px;
  font-size: 16px;
}

.sidebar-link.active,
.sidebar-link:hover {
  background: rgba(255, 255, 255, 0.18);
}

.sidebar-footer {
  margin-top: auto;
  border-top: 1px solid rgba(255, 255, 255, 0.12);
  padding: 18px 16px 24px;
}

.teacher-card {
  display: grid;
  grid-template-columns: 42px minmax(0, 1fr);
  gap: 10px;
  align-items: center;
  min-height: 58px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.12);
  padding: 8px;
}

.teacher-avatar-initials {
  display: grid;
  width: 42px;
  height: 42px;
  place-items: center;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.22);
  font-weight: 800;
}

.teacher-card p {
  overflow: hidden;
  margin: 0;
  color: #ffffff;
  font-size: 14px;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.teacher-card span {
  display: block;
  margin-top: 4px;
  color: rgba(255, 255, 255, 0.7);
  font-size: 11px;
  text-transform: uppercase;
}

.settings-link {
  margin-top: 22px;
  min-height: 34px;
  padding: 0 18px;
  font-size: 16px;
}

.dashboard-workspace {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
}

.dashboard-topbar {
  display: grid;
  grid-template-columns: minmax(220px, 1fr) minmax(260px, 430px) auto;
  gap: 22px;
  align-items: center;
  min-height: 82px;
  border-bottom: 1px solid var(--line);
  background: rgba(255, 255, 255, 0.96);
  padding: 0 42px;
}

.greeting-block h1 {
  margin: 0;
  color: var(--primary);
  font-size: 16px;
  font-weight: 800;
}

.greeting-block p {
  margin: 4px 0 0;
  max-width: 290px;
  color: #1d2432;
  font-size: 14px;
  line-height: 1.35;
}

.greeting-block strong {
  color: var(--green);
}

.search-field {
  display: grid;
  grid-template-columns: 24px 1fr;
  gap: 10px;
  align-items: center;
  height: 38px;
  border: 1px solid #d0d6e8;
  border-radius: 8px;
  background: #eef3ff;
  color: #4e586b;
  padding: 0 14px;
}

.search-field input {
  min-width: 0;
  border: 0;
  outline: 0;
  background: transparent;
  color: var(--ink);
  font-size: 15px;
}

.search-field input::placeholder {
  color: #6d7587;
}

.topbar-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.ghost-button,
.outline-button,
.primary-button,
.manage-tools-button,
.filter-button,
.link-button,
.icon-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  font-weight: 700;
}

.ghost-button {
  gap: 4px;
  border: 0;
  background: transparent;
  color: var(--primary);
  padding: 0 8px;
}

.outline-button,
.manage-tools-button,
.filter-button {
  min-height: 38px;
  border: 1px solid var(--line);
  background: #ffffff;
  color: var(--primary);
  padding: 0 18px;
}

.primary-button {
  min-height: 38px;
  border: 1px solid var(--primary-dark);
  background: var(--primary);
  color: #ffffff;
  padding: 0 18px;
  box-shadow: 0 6px 12px rgba(0, 31, 158, 0.18);
}

.icon-button {
  width: 42px;
  height: 42px;
  border: 0;
  background: transparent;
  color: #151928;
}

.notification-button {
  position: relative;
  margin-left: 10px;
}

.notification-button::before {
  position: absolute;
  left: -10px;
  width: 1px;
  height: 30px;
  background: var(--line);
  content: '';
}

.notification-button span {
  position: absolute;
  top: 7px;
  right: 8px;
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: var(--red);
}

.dashboard-content {
  width: min(100%, 1020px);
  margin: 0 auto;
  padding: 42px 32px 40px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(120px, 1fr));
  gap: 24px;
}

.stat-card {
  min-height: 126px;
  border: 1px solid transparent;
  border-left: 4px solid var(--primary);
  border-radius: 8px;
  background: #ffffff;
  box-shadow: 0 14px 24px rgba(21, 33, 72, 0.07);
  padding: 26px 24px 20px;
}

.stat-label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  color: #60677a;
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
}

.stat-value-row {
  display: flex;
  align-items: flex-end;
  gap: 10px;
  margin-top: 22px;
}

.stat-value-row strong {
  color: var(--primary);
  font-size: 31px;
  line-height: 0.9;
}

.stat-value-row span {
  color: var(--green);
  font-size: 11px;
  font-weight: 800;
}

.stat-card.tone-red {
  border-left-color: var(--red);
}

.stat-card.tone-red .stat-value-row strong,
.stat-card.tone-red .stat-value-row span {
  color: var(--red);
}

.stat-card.tone-green .stat-value-row span {
  border-radius: 999px;
  background: var(--green-soft);
  color: var(--green);
  padding: 3px 8px;
}

.engage-section {
  margin-top: 32px;
}

.section-title-row,
.panel-header,
.live-poll-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.section-title-row h2,
.panel-header h2,
.live-poll-panel h2 {
  margin: 0;
  font-size: 16px;
  font-weight: 800;
}

.manage-tools-button {
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
  color: currentColor;
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

.recent-panel,
.trends-panel,
.session-panel {
  overflow: hidden;
}

.panel-header {
  min-height: 74px;
  padding: 0 24px;
}

.link-button {
  border: 0;
  background: transparent;
  color: var(--primary);
  font-size: 14px;
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

.activity-row span {
  min-width: 0;
}

mark {
  border-radius: 999px;
  background: #dbe7ff;
  color: #182035;
  font-size: 10px;
  font-weight: 800;
  padding: 3px 9px;
  text-transform: uppercase;
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
}

.live-poll-panel {
  border-left: 4px solid var(--primary);
  padding: 30px 26px 24px;
}

.live-poll-header {
  align-items: flex-start;
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
  gap: 4px;
  min-height: 32px;
  padding: 0 14px;
  color: #1a2030;
  font-size: 12px;
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

.dashboard-topbar button:focus-visible,
.dashboard-content button:focus-visible,
.sidebar-link:focus-visible,
.settings-link:focus-visible,
.search-field:focus-within {
  outline: 3px solid rgba(23, 120, 255, 0.28);
  outline-offset: 2px;
}

@media (max-width: 1280px) {
  .dashboard-content {
    width: 100%;
  }

  .stats-grid,
  .engage-grid {
    grid-template-columns: repeat(3, minmax(150px, 1fr));
  }

  .dashboard-topbar {
    grid-template-columns: 1fr;
    gap: 14px;
    padding: 18px 28px;
  }

  .topbar-actions {
    flex-wrap: wrap;
  }
}

@media (max-width: 980px) {
  .teacher-dashboard {
    flex-direction: column;
  }

  .teacher-sidebar {
    position: relative;
    width: 100%;
    min-width: 0;
    height: auto;
  }

  .brand-lockup {
    padding: 20px;
  }

  .sidebar-nav {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    padding-bottom: 16px;
  }

  .sidebar-footer {
    display: none;
  }

  .dashboard-grid {
    grid-template-columns: 1fr;
  }

  .session-panel {
    margin-top: 0;
  }
}

@media (max-width: 720px) {
  .dashboard-content {
    padding: 24px 16px;
  }

  .stats-grid,
  .engage-grid,
  .favorites-grid {
    grid-template-columns: 1fr;
  }

  .section-title-row,
  .panel-header {
    align-items: flex-start;
    flex-direction: column;
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

  .topbar-actions {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    width: 100%;
  }

  .primary-button,
  .outline-button,
  .ghost-button {
    width: 100%;
  }

  .icon-button.notification-button {
    width: 100%;
  }

  .notification-button::before {
    display: none;
  }

  .sidebar-nav {
    grid-template-columns: 1fr;
  }
}
</style>
