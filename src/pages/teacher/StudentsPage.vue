<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import TeacherLayout from '@/components/teacher/TeacherLayout.vue'
import TeacherIcon from '@/components/teacher/TeacherIcon.vue'

const router = useRouter()
const authStore = useAuthStore()

interface Student { id: number; name: string; email: string; class: string; classCode: string; status: 'active' | 'inactive'; joinDate: string; lastActive: string; engagement: number; totalPolls: number; totalQuizzes: number; averageScore: number; avatarInitials: string }

const loading = ref(false)
const searchQuery = ref('')
const selectedClassFilter = ref('all')
const selectedStatusFilter = ref<'all' | 'active' | 'inactive'>('all')
const showInviteModal = ref(false)
const inviteEmail = ref('')
const inviteClass = ref('')
const studentDetail = ref<Student | null>(null)
const showDetailModal = ref(false)

const students = ref<Student[]>([])

function generateDemoStudents(): Student[] {
  const names = ['Emma Thompson', 'Liam Chen', 'Sophia Patel', 'Noah Williams', 'Olivia Martinez', 'Ethan Kim', 'Ava Johnson', 'Mason Brown', 'Isabella Garcia', 'Lucas Lee', 'Mia Rodriguez', 'James Wilson', 'Charlotte Anderson', 'Benjamin Taylor', 'Amelia Thomas', 'Elijah Jackson', 'Harper White', 'Alexander Harris', 'Evelyn Martin', 'Daniel Moore']
  const classes = [{ name: 'Biology 101 - Section A', code: 'BIOL-101-A' }, { name: 'Advanced Chemistry', code: 'CHEM-201' }, { name: 'Physics for Engineers', code: 'PHYS-210' }]
  return names.map((name, i) => {
    const cls = (classes[i % classes.length] ?? classes[0])!
    const initials = name.split(' ').map(n => n[0]).join('').toUpperCase()
    return { id: i + 1, name, email: name.toLowerCase().replace(/ /g, '.') + '@university.edu', class: cls.name, classCode: cls.code, status: i < 16 ? 'active' : 'inactive', joinDate: new Date(2024, 0, 10 + i).toISOString(), lastActive: new Date(2024, 9, 20 - (i % 5)).toISOString(), engagement: Math.floor(50 + Math.random() * 50), totalPolls: Math.floor(5 + Math.random() * 20), totalQuizzes: Math.floor(3 + Math.random() * 15), averageScore: Math.floor(60 + Math.random() * 40), avatarInitials: initials }
  })
}

const classOptions = computed(() => ['all', ...Array.from(new Set(students.value.map((s) => s.class)))])
const filteredStudents = computed(() => {
  let r = students.value
  if (searchQuery.value.trim()) { const q = searchQuery.value.toLowerCase(); r = r.filter((s) => s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q) || s.classCode.toLowerCase().includes(q)) }
  if (selectedClassFilter.value !== 'all') r = r.filter((s) => s.class === selectedClassFilter.value)
  if (selectedStatusFilter.value !== 'all') r = r.filter((s) => s.status === selectedStatusFilter.value)
  return r
})
const statsSummary = computed(() => ({ total: students.value.length, active: students.value.filter((s) => s.status === 'active').length, avgEngagement: Math.round(students.value.reduce((sum, s) => sum + s.engagement, 0) / students.value.length), avgScore: Math.round(students.value.reduce((sum, s) => sum + s.averageScore, 0) / students.value.length) }))

function viewStudentDetail(student: Student) { studentDetail.value = student; showDetailModal.value = true }
function closeDetail() { showDetailModal.value = false; studentDetail.value = null }
function openInviteModal() { inviteEmail.value = ''; inviteClass.value = classOptions.value.filter(c => c !== 'all')[0] || ''; showInviteModal.value = true }
function formatDate(d: string) { return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) }
function getEngColor(s: number) { return s >= 80 ? 'var(--green)' : s >= 60 ? 'var(--orange)' : 'var(--red)' }

onMounted(() => { students.value = generateDemoStudents() })
</script>

<template>
  <TeacherLayout sidebar-active="students" page-title="Students" page-subtitle="Manage your students across all classes." v-model:search-value="searchQuery" search-placeholder="Search students...">
    <template #actions>
      <button class="primary-button" type="button" @click="openInviteModal"><TeacherIcon icon="plus" :size="18" /><span>Invite Student</span></button>
    </template>

    <section class="stats-grid" aria-label="Student stats">
      <article class="stat-card tone-blue"><div class="stat-label-row"><span>Total Students</span><TeacherIcon icon="users" :size="19" /></div><div class="stat-value-row"><strong>{{ statsSummary.total }}</strong></div></article>
      <article class="stat-card tone-green"><div class="stat-label-row"><span>Active Students</span><TeacherIcon icon="check" :size="19" /></div><div class="stat-value-row"><strong>{{ statsSummary.active }}</strong></div></article>
      <article class="stat-card tone-blue"><div class="stat-label-row"><span>Avg Engagement</span><TeacherIcon icon="activity" :size="19" /></div><div class="stat-value-row"><strong>{{ statsSummary.avgEngagement }}%</strong></div></article>
      <article class="stat-card tone-orange"><div class="stat-label-row"><span>Avg Score</span><TeacherIcon icon="trophy" :size="19" /></div><div class="stat-value-row"><strong>{{ statsSummary.avgScore }}%</strong></div></article>
    </section>

    <section class="filter-bar">
      <div class="filter-group">
        <label class="filter-label">Class</label>
        <select v-model="selectedClassFilter" class="form-select" style="min-height:36px;min-width:200px;font-size:13px;"><option value="all">All Classes</option><option v-for="cls in classOptions.filter(c => c !== 'all')" :key="cls" :value="cls">{{ cls }}</option></select>
      </div>
      <div class="filter-group">
        <label class="filter-label">Status</label>
        <div class="filter-chips">
          <button class="chip" :class="{ active: selectedStatusFilter === 'all' }" type="button" @click="selectedStatusFilter = 'all'">All</button>
          <button class="chip chip-green" :class="{ active: selectedStatusFilter === 'active' }" type="button" @click="selectedStatusFilter = 'active'">Active</button>
          <button class="chip chip-gray" :class="{ active: selectedStatusFilter === 'inactive' }" type="button" @click="selectedStatusFilter = 'inactive'">Inactive</button>
        </div>
      </div>
    </section>

    <div v-if="loading" class="loading-state"><div class="spinner"></div><p>Loading students...</p></div>

    <section v-else-if="filteredStudents.length === 0" class="empty-state"><div class="empty-icon"><TeacherIcon icon="users" :size="48" /></div><h3>No students found</h3><p>Invite students to get started.</p></section>

    <section v-else class="table-wrapper">
      <div class="data-table">
        <div class="table-row table-heading">
          <span class="col-student">Student</span><span class="col-class">Class</span><span class="col-status">Status</span><span class="col-engagement">Engagement</span><span class="col-score">Avg Score</span><span class="col-last">Last Active</span><span class="col-actions">Actions</span>
        </div>
        <div v-for="student in filteredStudents" :key="student.id" class="table-row clickable" @click="viewStudentDetail(student)">
          <span class="col-student"><div class="student-avatar-sm">{{ student.avatarInitials }}</div><div class="student-info"><strong>{{ student.name }}</strong><span>{{ student.email }}</span></div></span>
          <span class="col-class"><code>{{ student.classCode }}</code><small>{{ student.class }}</small></span>
          <span class="col-status"><mark :class="student.status">{{ student.status }}</mark></span>
          <span class="col-engagement"><div class="engagement-bar-wrap"><div class="engagement-bar" :style="{ width: student.engagement + '%', background: getEngColor(student.engagement) }"></div><span class="engagement-value">{{ student.engagement }}%</span></div></span>
          <span class="col-score"><strong :style="{ color: getEngColor(student.averageScore) }">{{ student.averageScore }}%</strong></span>
          <span class="col-last">{{ formatDate(student.lastActive) }}</span>
          <span class="col-actions"><div class="action-buttons"><button class="action-btn" type="button" title="Send message" @click.stop><TeacherIcon icon="mail" :size="16" /></button><button class="action-btn" type="button" title="More" @click.stop><TeacherIcon icon="more" :size="16" /></button></div></span>
        </div>
      </div>
      <div class="table-footer"><span>Showing {{ filteredStudents.length }} of {{ students.length }} students</span></div>
    </section>

    <!-- Invite Modal -->
    <Teleport to="body">
      <div v-if="showInviteModal" class="modal-overlay" @click.self="showInviteModal = false">
        <div class="modal-container modal-sm">
          <div class="modal-header"><h2>Invite Student</h2><button class="modal-close" type="button" @click="showInviteModal = false"><TeacherIcon icon="x" :size="24" /></button></div>
          <form class="modal-body" @submit.prevent="() => showInviteModal = false">
            <div class="form-group"><label>Student Email</label><input v-model="inviteEmail" type="email" placeholder="student@university.edu" required /></div>
            <div class="form-group"><label>Assign to Class</label><select v-model="inviteClass" class="form-select"><option v-for="cls in classOptions.filter(c => c !== 'all')" :key="cls" :value="cls">{{ cls }}</option></select></div>
            <div class="modal-actions"><button type="button" class="outline-button" @click="showInviteModal = false">Cancel</button><button type="submit" class="primary-button">Send Invitation</button></div>
          </form>
        </div>
      </div>
    </Teleport>

    <!-- Detail Modal -->
    <Teleport to="body">
      <div v-if="showDetailModal && studentDetail" class="modal-overlay" @click.self="closeDetail">
        <div class="modal-container">
          <div class="modal-header"><h2>Student Profile</h2><button class="modal-close" type="button" @click="closeDetail"><TeacherIcon icon="x" :size="24" /></button></div>
          <div class="modal-body">
            <div class="detail-profile"><div class="detail-avatar">{{ studentDetail.avatarInitials }}</div><div class="detail-info"><h3>{{ studentDetail.name }}</h3><span>{{ studentDetail.email }}</span><mark :class="studentDetail.status">{{ studentDetail.status }}</mark></div></div>
            <div class="detail-stats-grid">
              <div class="detail-stat"><span class="detail-stat-label">Engagement</span><strong :style="{ color: getEngColor(studentDetail.engagement) }">{{ studentDetail.engagement }}%</strong></div>
              <div class="detail-stat"><span class="detail-stat-label">Avg Score</span><strong :style="{ color: getEngColor(studentDetail.averageScore) }">{{ studentDetail.averageScore }}%</strong></div>
              <div class="detail-stat"><span class="detail-stat-label">Polls</span><strong>{{ studentDetail.totalPolls }}</strong></div>
              <div class="detail-stat"><span class="detail-stat-label">Quizzes</span><strong>{{ studentDetail.totalQuizzes }}</strong></div>
            </div>
            <div class="detail-meta"><div class="detail-meta-item"><span>Class</span><strong>{{ studentDetail.class }} ({{ studentDetail.classCode }})</strong></div><div class="detail-meta-item"><span>Joined</span><strong>{{ formatDate(studentDetail.joinDate) }}</strong></div><div class="detail-meta-item"><span>Last Active</span><strong>{{ formatDate(studentDetail.lastActive) }}</strong></div></div>
          </div>
        </div>
      </div>
    </Teleport>
  </TeacherLayout>
</template>

<style scoped>
.data-table { width: 100%; }
.table-row { display: grid; grid-template-columns: minmax(220px,2fr) minmax(160px,1.2fr) 80px minmax(130px,1fr) 90px 110px 80px; align-items: center; min-height: 68px; border-top: 1px solid #e0e4ef; padding: 0 20px; gap: 12px; transition: background .15s; }
.table-row:hover { background: #f8faff; }
.table-row.clickable { cursor: pointer; }
.table-heading { min-height: 48px; background: #eef3ff; color: #596072; font-size: 11px; font-weight: 800; text-transform: uppercase; }
.table-heading:hover { background: #eef3ff; }
.col-student { display: flex; align-items: center; gap: 12px; }
.student-avatar-sm { display: grid; width: 36px; height: 36px; place-items: center; border-radius: 8px; background: var(--primary-soft); color: var(--primary); font-size: 12px; font-weight: 800; flex-shrink: 0; }
.student-info { min-width: 0; }
.student-info strong { display: block; color: var(--primary); font-size: 14px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.student-info span { display: block; font-size: 11px; color: var(--muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.col-class { min-width: 0; }
.col-class code { background: #eef3ff; padding: 2px 7px; border-radius: 4px; font-size: 11px; color: var(--primary); font-weight: 700; }
.col-class small { display: block; margin-top: 3px; font-size: 11px; color: var(--muted); }
.engagement-bar-wrap { display: flex; align-items: center; gap: 8px; }
.engagement-bar { height: 6px; border-radius: 999px; min-width: 4px; transition: width .4s; }
.engagement-value { font-size: 12px; font-weight: 700; white-space: nowrap; }
.col-score strong { font-size: 14px; }
.action-buttons { display: flex; gap: 4px; }
.action-btn { display: inline-grid; width: 30px; height: 30px; place-items: center; border: 0; border-radius: 6px; background: transparent; color: #646b7c; cursor: pointer; transition: all .15s; }
.action-btn:hover { background: var(--primary-soft); color: var(--primary); }
.table-footer { display: flex; justify-content: flex-end; padding: 14px 20px; border-top: 1px solid #e0e4ef; font-size: 12px; color: var(--muted); }
.detail-profile { display: flex; align-items: center; gap: 18px; margin-bottom: 24px; }
.detail-avatar { display: grid; width: 64px; height: 64px; place-items: center; border-radius: 12px; background: var(--primary); color: #fff; font-size: 22px; font-weight: 800; }
.detail-info h3 { margin: 0 0 4px; font-size: 20px; }
.detail-info span { display: block; font-size: 13px; color: var(--muted); margin-bottom: 8px; }
.detail-stats-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 12px; margin-bottom: 24px; }
.detail-stat { text-align: center; padding: 16px 8px; border-radius: 8px; background: var(--surface-soft); }
.detail-stat-label { display: block; font-size: 10px; font-weight: 800; text-transform: uppercase; color: var(--muted); margin-bottom: 6px; }
.detail-stat strong { font-size: 22px; }
.detail-meta { display: grid; gap: 12px; }
.detail-meta-item { display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid #e0e4ef; }
.detail-meta-item:last-child { border-bottom: 0; }
.detail-meta-item span { font-size: 13px; color: var(--muted); }
.detail-meta-item strong { font-size: 14px; color: var(--ink); }
@media (max-width:1280px) { .table-row { grid-template-columns: minmax(180px,2fr) minmax(130px,1.2fr) 80px minmax(110px,1fr) 80px 100px 70px; } }
@media (max-width:980px) { .table-row { grid-template-columns: 1fr 1fr; min-height: auto; padding: 16px 20px; } .table-heading { display: none; } }
@media (max-width:720px) { .table-row { grid-template-columns: 1fr; } .detail-stats-grid { grid-template-columns: repeat(2,1fr); } }
</style>
