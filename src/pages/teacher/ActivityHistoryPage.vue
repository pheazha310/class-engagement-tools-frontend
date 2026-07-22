<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import TeacherLayout from '@/components/teacher/TeacherLayout.vue'
import TeacherIcon from '@/components/teacher/TeacherIcon.vue'

interface ActivityLog { id: number; date: string; type: string; name: string; class: string; classCode: string; status: 'completed' | 'live' | 'scheduled'; participants: number; score?: string; duration?: string }

const searchQuery = ref('')
const typeFilter = ref<string>('all')
const dateRange = ref<'all' | 'today' | 'week' | 'month'>('all')
const currentPage = ref(1)
const perPage = ref(10)
const activities = ref<ActivityLog[]>([])

function generateDemoActivities(): ActivityLog[] {
  const types = ['quiz', 'poll', 'quiz', 'poll', 'timer', 'picker', 'game', 'group', 'quiz', 'poll']
  const names: Record<string, string[]> = { quiz: ['Cellular Mitosis Quiz', 'Molecular Bonding Quiz', 'Genetics & Inheritance', 'Chemistry Lab Safety', 'Physics Mechanics Test'], poll: ['Supply & Demand Poll', 'Concept Check: Module 3', 'Quick Check-In', 'Course Feedback Survey', 'Topic Preference Poll'], timer: ['Class Timer - 5 min', 'Pop Quiz Timer', 'Break Timer'], picker: ['Random Student Select', 'Group Leader Pick'], game: ['Trivia Challenge', 'Speed Round', 'Team Competition'], group: ['Group Generator - Project A', 'Team Formation'] }
  const classes = [{ name: 'Biology 101 - Section A', code: 'BIOL-101-A' }, { name: 'Advanced Chemistry', code: 'CHEM-201' }, { name: 'Introduction to Economics', code: 'ECON-101' }, { name: 'Physics for Engineers', code: 'PHYS-210' }]
  const result: ActivityLog[] = []; const now = new Date()
  for (let i = 0; i < 40; i++) {
    const type = types[i % types.length]; const typeNames = names[type]; const cls = classes[i % classes.length]; const date = new Date(now); date.setDate(date.getDate() - Math.floor(i / 2))
    result.push({ id: i + 1, date: date.toISOString(), type, name: typeNames ? typeNames[i % typeNames.length] : `${type} Activity ${i}`, class: cls.name, classCode: cls.code, status: i < 8 ? 'completed' : i < 12 ? 'live' : 'completed', participants: Math.floor(10 + Math.random() * 30), score: ['quiz', 'poll'].includes(type) ? `${Math.floor(65 + Math.random() * 35)}%` : undefined, duration: type === 'timer' ? `${Math.floor(3 + Math.random() * 12)} min` : undefined })
  }
  return result
}

const typeColors: Record<string, string> = { quiz: 'var(--primary)', poll: 'var(--green)', timer: 'var(--orange)', picker: 'var(--cyan)', game: 'var(--violet)', group: 'var(--red)' }
const typeIcons: Record<string, string> = { quiz: 'quiz', poll: 'poll', timer: 'timer', picker: 'picker', game: 'trophy', group: 'users' }

const filteredActivities = computed(() => {
  let r = activities.value
  if (searchQuery.value.trim()) { const q = searchQuery.value.toLowerCase(); r = r.filter(a => a.name.toLowerCase().includes(q) || a.class.toLowerCase().includes(q) || a.classCode.toLowerCase().includes(q)) }
  if (typeFilter.value !== 'all') r = r.filter(a => a.type === typeFilter.value)
  if (dateRange.value !== 'all') { const start = new Date(); if (dateRange.value === 'today') start.setHours(0,0,0,0); else if (dateRange.value === 'week') start.setDate(start.getDate() - 7); else if (dateRange.value === 'month') start.setMonth(start.getMonth() - 1); r = r.filter(a => new Date(a.date) >= start) }
  return r
})
const paginatedActivities = computed(() => { const s = (currentPage.value - 1) * perPage.value; return filteredActivities.value.slice(s, s + perPage.value) })
const totalPages = computed(() => Math.max(1, Math.ceil(filteredActivities.value.length / perPage.value)))
const statsSummary = computed(() => ({ total: activities.value.length, completed: activities.value.filter(a => a.status === 'completed').length, live: activities.value.filter(a => a.status === 'live').length, totalParticipants: activities.value.reduce((s, a) => s + a.participants, 0) }))

function formatDate(d: string) { const diff = Math.floor((new Date().getTime() - new Date(d).getTime()) / (1000 * 60 * 60 * 24)); if (diff === 0) return 'Today'; if (diff === 1) return 'Yesterday'; if (diff < 7) return `${diff} days ago`; return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) }
function formatDateTime(d: string) { return new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) }

onMounted(() => { activities.value = generateDemoActivities() })
</script>

<template>
  <TeacherLayout sidebar-active="history" page-title="Activity History" page-subtitle="Track all classroom activities and student engagement." v-model:search-value="searchQuery" search-placeholder="Search activities...">
    <template #actions>
      <button class="outline-button" type="button" @click="() => { searchQuery = ''; typeFilter = 'all'; dateRange = 'all'; currentPage = 1 }"><TeacherIcon icon="refresh" :size="16" /><span>Reset</span></button>
    </template>

    <section class="stats-grid" aria-label="Activity stats">
      <article class="stat-card tone-blue"><div class="stat-label-row"><span>Total Activities</span><TeacherIcon icon="activity" :size="19" /></div><div class="stat-value-row"><strong>{{ statsSummary.total }}</strong></div></article>
      <article class="stat-card tone-green"><div class="stat-label-row"><span>Completed</span><TeacherIcon icon="check" :size="19" /></div><div class="stat-value-row"><strong>{{ statsSummary.completed }}</strong></div></article>
      <article class="stat-card tone-red"><div class="stat-label-row"><span>Live Now</span><TeacherIcon icon="zap" :size="19" /></div><div class="stat-value-row"><strong>{{ statsSummary.live }}</strong></div></article>
      <article class="stat-card tone-blue"><div class="stat-label-row"><span>Total Participants</span><TeacherIcon icon="users" :size="19" /></div><div class="stat-value-row"><strong>{{ statsSummary.totalParticipants }}</strong></div></article>
    </section>

    <section class="filter-bar">
      <div class="filter-group">
        <label class="filter-label">Type</label>
        <div class="filter-chips">
          <button class="chip" :class="{ active: typeFilter === 'all' }" type="button" @click="typeFilter = 'all'; currentPage = 1">All</button>
          <button class="chip chip-primary" :class="{ active: typeFilter === 'quiz' }" type="button" @click="typeFilter = 'quiz'; currentPage = 1">Quizzes</button>
          <button class="chip chip-green" :class="{ active: typeFilter === 'poll' }" type="button" @click="typeFilter = 'poll'; currentPage = 1">Polls</button>
          <button class="chip chip-orange" :class="{ active: typeFilter === 'timer' }" type="button" @click="typeFilter = 'timer'; currentPage = 1">Timers</button>
          <button class="chip chip-violet" :class="{ active: typeFilter === 'game' }" type="button" @click="typeFilter = 'game'; currentPage = 1">Games</button>
        </div>
      </div>
      <div class="filter-group">
        <label class="filter-label">Period</label>
        <div class="filter-chips">
          <button class="chip" :class="{ active: dateRange === 'all' }" type="button" @click="dateRange = 'all'; currentPage = 1">All</button>
          <button class="chip" :class="{ active: dateRange === 'today' }" type="button" @click="dateRange = 'today'; currentPage = 1">Today</button>
          <button class="chip" :class="{ active: dateRange === 'week' }" type="button" @click="dateRange = 'week'; currentPage = 1">This Week</button>
          <button class="chip" :class="{ active: dateRange === 'month' }" type="button" @click="dateRange = 'month'; currentPage = 1">This Month</button>
        </div>
      </div>
    </section>

    <section class="table-wrapper">
      <div v-if="paginatedActivities.length === 0" class="empty-state"><div class="empty-icon"><TeacherIcon icon="history" :size="48" /></div><h3>No activities found</h3><p>Activities appear here when you start engaging your class.</p></div>
      <template v-else>
        <div class="activity-table">
          <div class="activity-row activity-heading">
            <span class="a-col-date">Date</span><span class="a-col-type">Type</span><span class="a-col-name">Activity</span><span class="a-col-class">Class</span><span class="a-col-status">Status</span><span class="a-col-participants">Participants</span><span class="a-col-score">Score</span><span class="a-col-actions"></span>
          </div>
          <div v-for="a in paginatedActivities" :key="a.id" class="activity-row">
            <span class="a-col-date"><span class="date-main">{{ formatDate(a.date) }}</span><span class="date-sub">{{ formatDateTime(a.date) }}</span></span>
            <span class="a-col-type"><span class="type-badge" :style="{ background: (typeColors[a.type] || 'var(--muted)') + '20', color: typeColors[a.type] || 'var(--muted)' }"><TeacherIcon :icon="typeIcons[a.type] || 'activity'" :size="14" /><span>{{ a.type }}</span></span></span>
            <span class="a-col-name"><strong>{{ a.name }}</strong></span>
            <span class="a-col-class"><code>{{ a.classCode }}</code></span>
            <span class="a-col-status"><mark :class="a.status">{{ a.status }}</mark></span>
            <span class="a-col-participants">{{ a.participants }}</span>
            <span class="a-col-score"><strong v-if="a.score" :style="{ color: parseInt(a.score) >= 80 ? 'var(--green)' : 'var(--orange)' }">{{ a.score }}</strong><span v-else-if="a.duration" class="duration">{{ a.duration }}</span><span v-else class="no-data">—</span></span>
            <span class="a-col-actions"><button class="action-btn" type="button" title="View details"><TeacherIcon icon="external" :size="16" /></button></span>
          </div>
        </div>
        <div class="pagination-bar">
          <div class="pagination-info">Showing {{ ((currentPage - 1) * perPage) + 1 }}-{{ Math.min(currentPage * perPage, filteredActivities.length) }} of {{ filteredActivities.length }}</div>
          <div class="pagination-controls"><button class="page-btn" :disabled="currentPage <= 1" @click="currentPage--"><TeacherIcon icon="chevronLeft" :size="16" /></button><span class="page-indicator">{{ currentPage }} / {{ totalPages }}</span><button class="page-btn" :disabled="currentPage >= totalPages" @click="currentPage++"><TeacherIcon icon="chevronRight" :size="16" /></button></div>
        </div>
      </template>
    </section>
  </TeacherLayout>
</template>

<style scoped>
.activity-table { width: 100%; }
.activity-row { display: grid; grid-template-columns: 110px 100px minmax(180px,1.8fr) minmax(90px,0.9fr) 90px 90px 80px 40px; align-items: center; min-height: 64px; border-top: 1px solid #e0e4ef; padding: 0 20px; gap: 12px; transition: background .15s; }
.activity-row:hover { background: #f8faff; }
.activity-heading { min-height: 46px; background: #eef3ff; color: #596072; font-size: 11px; font-weight: 800; text-transform: uppercase; }
.activity-heading:hover { background: #eef3ff; }
.date-main { display: block; font-size: 13px; font-weight: 600; color: var(--ink); }
.date-sub { display: block; font-size: 11px; color: var(--muted); margin-top: 2px; }
.type-badge { display: inline-flex; align-items: center; gap: 5px; padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 700; text-transform: capitalize; }
.activity-row strong { color: var(--ink); font-size: 14px; }
.activity-row code { background: #eef3ff; padding: 2px 7px; border-radius: 4px; font-size: 11px; color: var(--primary); font-weight: 700; }
.duration { font-size: 12px; color: var(--muted); font-weight: 600; }
.no-data { color: var(--muted); }
.action-btn { display: inline-grid; width: 30px; height: 30px; place-items: center; border: 0; border-radius: 6px; background: transparent; color: #646b7c; cursor: pointer; transition: all .15s; }
.action-btn:hover { background: var(--primary-soft); color: var(--primary); }
@media (max-width:1280px) { .activity-row { grid-template-columns: 100px 90px minmax(150px,1.8fr) minmax(80px,0.9fr) 80px 70px 60px 30px; } }
@media (max-width:980px) { .activity-row { grid-template-columns: 1fr 1fr; min-height: auto; padding: 16px 20px; } .activity-heading { display: none; } }
</style>
