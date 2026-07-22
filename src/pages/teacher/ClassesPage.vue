<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import TeacherLayout from '@/components/teacher/TeacherLayout.vue'
import TeacherIcon from '@/components/teacher/TeacherIcon.vue'
import teacherDashboardService, { type ClassConfiguration, type CreateClassConfigurationRequest } from '@/services/teacherDashboardService'
import { showNotification } from '@/utils/notifications'

const router = useRouter()
const authStore = useAuthStore()

interface ClassItem extends ClassConfiguration {
  studentCount: number
  color: string
}

const classes = ref<ClassItem[]>([])
const loading = ref(false)
const searchQuery = ref('')
const statusFilter = ref<'all' | 'active' | 'inactive'>('all')
const viewMode = ref<'grid' | 'table'>('grid')
const currentPage = ref(1)
const perPage = ref(12)
const showModal = ref(false)
const isEditing = ref(false)
const editingId = ref<number | null>(null)
const formData = ref({ name: '', class_name: '', subject: '', schedule: '', room: '', is_active: true, student_count: 0 })
const showDeleteModal = ref(false)
const deletingId = ref<number | null>(null)
const deletingName = ref('')

const subjectColors: Record<string, string> = {
  Biology: '#00772f', Chemistry: '#c51313', Physics: '#001f9e', Economics: '#f07800',
  Mathematics: '#8d35ff', English: '#1778ff', History: '#d4a300', Computer: '#00a3a3', default: '#697082',
}

function getSubjectColor(subject: string): string {
  for (const [key, color] of Object.entries(subjectColors)) {
    if (subject.toLowerCase().includes(key.toLowerCase())) return color
  }
  return subjectColors.default
}

const filteredClasses = computed(() => {
  let r = classes.value
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase()
    r = r.filter((c) => c.name.toLowerCase().includes(q) || c.class_name.toLowerCase().includes(q) || c.subject.toLowerCase().includes(q))
  }
  if (statusFilter.value !== 'all') r = r.filter((c) => (statusFilter.value === 'active' ? c.is_active : !c.is_active))
  return r
})

const paginatedClasses = computed(() => {
  const s = (currentPage.value - 1) * perPage.value
  return filteredClasses.value.slice(s, s + perPage.value)
})

const totalPages = computed(() => Math.max(1, Math.ceil(filteredClasses.value.length / perPage.value)))

const statsSummary = computed(() => ({
  total: classes.value.length,
  active: classes.value.filter((c) => c.is_active).length,
  subjects: new Set(classes.value.map((c) => c.subject)).size,
  totalStudents: classes.value.reduce((s, c) => s + c.studentCount, 0),
  avgStudents: classes.value.length > 0 ? Math.round(classes.value.reduce((s, c) => s + c.studentCount, 0) / classes.value.length) : 0,
}))

async function fetchClasses() {
  loading.value = true
  try {
    const response = await teacherDashboardService.getClassConfigurations()
    const items = response.data || []
    classes.value = items.map((c) => ({ ...c, studentCount: (c.settings as any)?.student_count || Math.floor(18 + Math.random() * 18), color: getSubjectColor(c.subject) }))
  } catch {
    showNotification('Failed to load classes. Using demo data.', 'error')
    classes.value = getDemoClasses()
  } finally { loading.value = false }
}

function getDemoClasses(): ClassItem[] {
  return [
    { id: 1, teacher_id: 1, name: 'Biology 101 - Section A', class_name: 'BIOL-101-A', subject: 'Biology', settings: { room: 'Science Hall 301', schedule: 'Mon/Wed 9:00 AM', student_count: 32 }, is_active: true, created_at: '2024-01-15T08:00:00Z', updated_at: '2024-03-10T14:00:00Z', studentCount: 32, color: '#00772f' },
    { id: 2, teacher_id: 1, name: 'Advanced Chemistry', class_name: 'CHEM-201', subject: 'Chemistry', settings: { room: 'Lab B-12', schedule: 'Tue/Thu 11:00 AM', student_count: 28 }, is_active: true, created_at: '2024-01-20T09:00:00Z', updated_at: '2024-03-08T10:00:00Z', studentCount: 28, color: '#c51313' },
    { id: 3, teacher_id: 1, name: 'Introduction to Economics', class_name: 'ECON-101', subject: 'Economics', settings: { room: 'Business Center 205', schedule: 'Mon/Wed/Fri 1:00 PM', student_count: 45 }, is_active: false, created_at: '2024-02-01T08:00:00Z', updated_at: '2024-02-28T16:00:00Z', studentCount: 45, color: '#f07800' },
    { id: 4, teacher_id: 1, name: 'Physics for Engineers', class_name: 'PHYS-210', subject: 'Physics', settings: { room: 'Engineering Wing 105', schedule: 'Tue/Thu 2:00 PM', student_count: 24 }, is_active: true, created_at: '2024-01-10T10:00:00Z', updated_at: '2024-03-12T09:00:00Z', studentCount: 24, color: '#001f9e' },
    { id: 5, teacher_id: 1, name: 'Calculus III', class_name: 'MATH-301', subject: 'Mathematics', settings: { room: 'Math Building 204', schedule: 'Mon/Wed/Fri 10:00 AM', student_count: 36 }, is_active: true, created_at: '2024-01-18T09:00:00Z', updated_at: '2024-03-05T10:00:00Z', studentCount: 36, color: '#8d35ff' },
    { id: 6, teacher_id: 1, name: 'English Literature', class_name: 'ENGL-201', subject: 'English', settings: { room: 'Humanities Hall 102', schedule: 'Tue/Thu 1:00 PM', student_count: 30 }, is_active: false, created_at: '2024-02-05T10:00:00Z', updated_at: '2024-02-20T10:00:00Z', studentCount: 30, color: '#1778ff' },
    { id: 7, teacher_id: 1, name: 'Computer Science 101', class_name: 'CS-101', subject: 'Computer Science', settings: { room: 'CS Building 305', schedule: 'Mon/Wed 3:00 PM', student_count: 40 }, is_active: true, created_at: '2024-01-12T09:00:00Z', updated_at: '2024-03-01T10:00:00Z', studentCount: 40, color: '#00a3a3' },
    { id: 8, teacher_id: 1, name: 'World History', class_name: 'HIST-101', subject: 'History', settings: { room: 'Liberal Arts 110', schedule: 'Mon/Wed/Fri 11:00 AM', student_count: 35 }, is_active: true, created_at: '2024-01-22T08:00:00Z', updated_at: '2024-03-11T10:00:00Z', studentCount: 35, color: '#d4a300' },
  ]
}

function openCreateModal() {
  isEditing.value = false; editingId.value = null
  formData.value = { name: '', class_name: '', subject: '', schedule: '', room: '', is_active: true, student_count: 0 }
  showModal.value = true
}

function openEditModal(c: ClassItem) {
  isEditing.value = true; editingId.value = c.id
  formData.value = { name: c.name, class_name: c.class_name, subject: c.subject, schedule: (c.settings as any)?.schedule || '', room: (c.settings as any)?.room || '', is_active: c.is_active, student_count: c.studentCount }
  showModal.value = true
}

async function submitForm() {
  if (!formData.value.name || !formData.value.class_name || !formData.value.subject) { showNotification('Please fill in all required fields', 'error'); return }
  const settings: Record<string, any> = { student_count: formData.value.student_count }
  if (formData.value.schedule) settings.schedule = formData.value.schedule
  if (formData.value.room) settings.room = formData.value.room
  const data: CreateClassConfigurationRequest = { name: formData.value.name, class_name: formData.value.class_name, subject: formData.value.subject, settings, is_active: formData.value.is_active }
  loading.value = true
  try {
    if (isEditing.value && editingId.value) { await teacherDashboardService.updateClassConfiguration(editingId.value, data); showNotification('Class updated successfully!', 'success') }
    else { await teacherDashboardService.createClassConfiguration(data); showNotification('Class created successfully!', 'success') }
    showModal.value = false; await fetchClasses()
  } catch {
    const now = new Date().toISOString()
    if (isEditing.value && editingId.value) { const idx = classes.value.findIndex((c) => c.id === editingId.value); if (idx !== -1) classes.value[idx] = { ...classes.value[idx], ...data, settings, studentCount: formData.value.student_count, updated_at: now } }
    else { classes.value.unshift({ id: Date.now(), teacher_id: 1, ...data, settings, studentCount: formData.value.student_count, color: getSubjectColor(formData.value.subject), created_at: now, updated_at: now }) }
    showModal.value = false
  } finally { loading.value = false }
}

function confirmDelete(c: ClassItem) { deletingId.value = c.id; deletingName.value = c.name; showDeleteModal.value = true }

async function executeDelete() {
  if (!deletingId.value) return
  loading.value = true
  try { await teacherDashboardService.deleteClassConfiguration(deletingId.value); showNotification('Class deleted successfully!', 'success'); showDeleteModal.value = false; await fetchClasses() }
  catch { classes.value = classes.value.filter((c) => c.id !== deletingId.value); showDeleteModal.value = false }
  finally { loading.value = false; deletingId.value = null; deletingName.value = '' }
}

function toggleActive(c: ClassItem) {
  const updated = { ...c, is_active: !c.is_active, updated_at: new Date().toISOString() }
  const idx = classes.value.findIndex((x) => x.id === c.id); const orig = idx !== -1 ? { ...classes.value[idx] } : null
  if (idx !== -1) classes.value[idx] = updated
  teacherDashboardService.updateClassConfiguration(c.id, { is_active: !c.is_active }).catch(() => { if (idx !== -1 && orig) classes.value[idx] = orig })
}

function formatDate(d: string) { return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) }

onMounted(() => fetchClasses())
</script>

<template>
  <TeacherLayout sidebar-active="classes" page-title="My Classes" page-subtitle="Manage your classes, schedules, and sections." v-model:search-value="searchQuery" search-placeholder="Search classes...">
    <template #actions>
      <div class="view-toggle">
        <button class="toggle-btn" :class="{ active: viewMode === 'grid' }" type="button" @click="viewMode = 'grid'" title="Grid view">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
        </button>
        <button class="toggle-btn" :class="{ active: viewMode === 'table' }" type="button" @click="viewMode = 'table'" title="Table view">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M3 15h18"/><path d="M9 3v18"/></svg>
        </button>
      </div>
      <button class="primary-button" type="button" @click="openCreateModal"><TeacherIcon icon="plus" :size="18" /><span>New Class</span></button>
    </template>

    <!-- Stats -->
    <section class="stats-grid" aria-label="Classes summary">
      <article class="stat-card tone-blue"><div class="stat-label-row"><span>Total Classes</span><TeacherIcon icon="cap" :size="19" /></div><div class="stat-value-row"><strong>{{ statsSummary.total }}</strong><span>{{ statsSummary.active }} active</span></div></article>
      <article class="stat-card tone-green"><div class="stat-label-row"><span>Students</span><TeacherIcon icon="users" :size="19" /></div><div class="stat-value-row"><strong>{{ statsSummary.totalStudents }}</strong><span>avg {{ statsSummary.avgStudents }}/class</span></div></article>
      <article class="stat-card tone-blue"><div class="stat-label-row"><span>Subjects</span><TeacherIcon icon="book" :size="19" /></div><div class="stat-value-row"><strong>{{ statsSummary.subjects }}</strong></div></article>
      <article class="stat-card tone-orange"><div class="stat-label-row"><span>Active Rate</span><TeacherIcon icon="trend" :size="19" /></div><div class="stat-value-row"><strong>{{ statsSummary.total > 0 ? Math.round((statsSummary.active / statsSummary.total) * 100) : 0 }}%</strong></div></article>
    </section>

    <!-- Filter -->
    <section class="filter-bar">
      <div class="filter-group">
        <label class="filter-label">Status</label>
        <div class="filter-chips">
          <button class="chip" :class="{ active: statusFilter === 'all' }" type="button" @click="statusFilter = 'all'; currentPage = 1">All Classes</button>
          <button class="chip chip-green" :class="{ active: statusFilter === 'active' }" type="button" @click="statusFilter = 'active'; currentPage = 1">Active</button>
          <button class="chip chip-gray" :class="{ active: statusFilter === 'inactive' }" type="button" @click="statusFilter = 'inactive'; currentPage = 1">Inactive</button>
        </div>
      </div>
      <div class="filter-info"><span class="result-count">{{ filteredClasses.length }} class{{ filteredClasses.length !== 1 ? 'es' : '' }}</span></div>
    </section>

    <!-- Loading -->
    <div v-if="loading && classes.length === 0" class="loading-state"><div class="spinner"></div><p>Loading classes...</p></div>

    <!-- Empty -->
    <section v-else-if="paginatedClasses.length === 0" class="empty-state">
      <div class="empty-icon"><TeacherIcon icon="cap" :size="56" /></div>
      <h3>No classes found</h3>
      <p>{{ searchQuery ? 'Try adjusting your search or filters.' : 'Get started by creating your first class.' }}</p>
      <button v-if="!searchQuery" class="primary-button" type="button" @click="openCreateModal"><TeacherIcon icon="plus" :size="18" /><span>Create Class</span></button>
    </section>

    <!-- Grid View -->
    <section v-else-if="viewMode === 'grid'" class="classes-grid" aria-label="Classes">
      <div v-for="c in paginatedClasses" :key="c.id" class="class-card" :class="{ 'inactive-card': !c.is_active }">
        <div class="card-accent" :style="{ background: c.color }"></div>
        <div class="card-header">
          <div class="card-title-row">
            <h3 class="card-title">{{ c.name }}</h3>
            <button class="card-menu-btn" type="button" title="More actions"><TeacherIcon icon="more" :size="18" /></button>
          </div>
          <div class="card-code-row"><code>{{ c.class_name }}</code><mark :class="c.is_active ? 'active' : 'inactive'">{{ c.is_active ? 'Active' : 'Inactive' }}</mark></div>
        </div>
        <div class="card-body">
          <div class="card-meta-grid">
            <div class="card-meta-item"><TeacherIcon icon="book" :size="16" /><span>{{ c.subject }}</span></div>
            <div class="card-meta-item"><TeacherIcon icon="clock" :size="16" /><span>{{ (c.settings as any)?.schedule || 'No schedule' }}</span></div>
            <div class="card-meta-item"><TeacherIcon icon="mapPin" :size="16" /><span>{{ (c.settings as any)?.room || 'No room' }}</span></div>
            <div class="card-meta-item"><TeacherIcon icon="users" :size="16" /><span>{{ c.studentCount }} students</span></div>
          </div>
        </div>
        <div class="card-footer">
          <div class="card-date">{{ formatDate(c.created_at) }}</div>
          <div class="card-actions">
            <button class="card-action-btn edit" type="button" title="Edit" @click.stop="openEditModal(c)"><TeacherIcon icon="edit" :size="16" /></button>
            <button class="card-action-btn" :class="c.is_active ? 'deactivate' : 'activate'" type="button" :title="c.is_active ? 'Deactivate' : 'Activate'" @click.stop="toggleActive(c)"><TeacherIcon :icon="c.is_active ? 'x' : 'check'" :size="16" /></button>
            <button class="card-action-btn delete" type="button" title="Delete" @click.stop="confirmDelete(c)"><TeacherIcon icon="trash" :size="16" /></button>
          </div>
        </div>
      </div>
    </section>

    <!-- Table View -->
    <section v-else class="table-wrapper">
      <div class="classes-table">
        <div class="table-row table-heading">
          <span class="tcol-name">Class Name</span><span class="tcol-code">Code</span><span class="tcol-subject">Subject</span><span class="tcol-students">Students</span><span class="tcol-status">Status</span><span class="tcol-schedule">Schedule</span><span class="tcol-date">Created</span><span class="tcol-actions">Actions</span>
        </div>
        <div v-for="c in paginatedClasses" :key="c.id" class="table-row" :class="{ 'inactive-row': !c.is_active }">
          <span class="tcol-name"><div class="name-dot" :style="{ background: c.color }"></div><strong>{{ c.name }}</strong></span>
          <span class="tcol-code"><code>{{ c.class_name }}</code></span>
          <span class="tcol-subject"><span class="subject-badge" :style="{ background: c.color + '18', color: c.color }">{{ c.subject }}</span></span>
          <span class="tcol-students">{{ c.studentCount }}</span>
          <span class="tcol-status"><mark :class="c.is_active ? 'active' : 'inactive'">{{ c.is_active ? 'Active' : 'Inactive' }}</mark></span>
          <span class="tcol-schedule">{{ (c.settings as any)?.schedule || '—' }}</span>
          <span class="tcol-date">{{ new Date(c.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) }}</span>
          <span class="tcol-actions"><div class="t-actions"><button class="t-action" type="button" title="Edit" @click="openEditModal(c)"><TeacherIcon icon="edit" :size="16" /></button><button class="t-action" :class="c.is_active ? 'deactivate' : 'activate'" type="button" :title="c.is_active ? 'Deactivate' : 'Activate'" @click="toggleActive(c)"><TeacherIcon :icon="c.is_active ? 'x' : 'check'" :size="16" /></button><button class="t-action delete" type="button" title="Delete" @click="confirmDelete(c)"><TeacherIcon icon="trash" :size="16" /></button></div></span>
        </div>
      </div>
    </section>

    <!-- Pagination -->
    <div v-if="filteredClasses.length > perPage" class="pagination-bar">
      <div class="pagination-info">Showing {{ ((currentPage - 1) * perPage) + 1 }}-{{ Math.min(currentPage * perPage, filteredClasses.length) }} of {{ filteredClasses.length }}</div>
      <div class="pagination-controls"><button class="page-btn" :disabled="currentPage <= 1" @click="currentPage--"><TeacherIcon icon="chevronLeft" :size="16" /></button><span class="page-indicator">{{ currentPage }} / {{ totalPages }}</span><button class="page-btn" :disabled="currentPage >= totalPages" @click="currentPage++"><TeacherIcon icon="chevronRight" :size="16" /></button></div>
    </div>

    <!-- Create/Edit Modal -->
    <Teleport to="body">
      <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
        <div class="modal-container">
          <div class="modal-header"><h2>{{ isEditing ? 'Edit Class' : 'Create New Class' }}</h2><button class="modal-close" type="button" @click="showModal = false"><TeacherIcon icon="x" :size="24" /></button></div>
          <form class="modal-body" @submit.prevent="submitForm">
            <div class="form-row">
              <div class="form-group"><label>Class Name <span class="required">*</span></label><input v-model="formData.name" type="text" placeholder="e.g. Biology 101" required /></div>
              <div class="form-group"><label>Class Code <span class="required">*</span></label><input v-model="formData.class_name" type="text" placeholder="e.g. BIOL-101-A" required /></div>
            </div>
            <div class="form-row">
              <div class="form-group"><label>Subject <span class="required">*</span></label><select v-model="formData.subject" class="form-select" required><option value="" disabled>Select subject</option><option value="Biology">Biology</option><option value="Chemistry">Chemistry</option><option value="Physics">Physics</option><option value="Mathematics">Mathematics</option><option value="Economics">Economics</option><option value="English">English</option><option value="History">History</option><option value="Computer Science">Computer Science</option></select></div>
              <div class="form-group"><label>Student Count</label><input v-model.number="formData.student_count" type="number" min="0" max="500" placeholder="e.g. 30" /></div>
            </div>
            <div class="form-row">
              <div class="form-group"><label>Schedule</label><input v-model="formData.schedule" type="text" placeholder="e.g. Mon/Wed 9:00 AM" /></div>
              <div class="form-group"><label>Room</label><input v-model="formData.room" type="text" placeholder="e.g. Science Hall 301" /></div>
            </div>
            <div class="checkbox-group"><label class="checkbox-label"><input v-model="formData.is_active" type="checkbox" /><span>Active</span></label></div>
            <div class="modal-actions"><button type="button" class="outline-button" @click="showModal = false">Cancel</button><button type="submit" class="primary-button" :disabled="loading">{{ loading ? 'Saving...' : isEditing ? 'Update Class' : 'Create Class' }}</button></div>
          </form>
        </div>
      </div>
    </Teleport>

    <!-- Delete Modal -->
    <Teleport to="body">
      <div v-if="showDeleteModal" class="modal-overlay" @click.self="showDeleteModal = false">
        <div class="modal-container modal-sm">
          <div class="modal-header"><h2>Delete Class</h2><button class="modal-close" type="button" @click="showDeleteModal = false"><TeacherIcon icon="x" :size="24" /></button></div>
          <div class="modal-body">
            <div class="delete-content"><div class="delete-icon"><TeacherIcon icon="trash" :size="32" /></div><p>Are you sure you want to delete <strong>{{ deletingName }}</strong>?</p><p class="delete-warning">This action cannot be undone. All associated data will be permanently removed.</p></div>
            <div class="modal-actions"><button type="button" class="outline-button" @click="showDeleteModal = false">Cancel</button><button type="button" class="danger-button" @click="executeDelete" :disabled="loading">{{ loading ? 'Deleting...' : 'Delete Class' }}</button></div>
          </div>
        </div>
      </div>
    </Teleport>
  </TeacherLayout>
</template>

<style scoped>
.classes-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 20px; }
.class-card { display: flex; flex-direction: column; border-radius: 12px; background: #fff; border: 1px solid var(--line); overflow: hidden; box-shadow: 0 2px 8px rgba(21,33,72,.04); transition: all .25s cubic-bezier(.16,1,.3,1); }
.class-card:hover { box-shadow: 0 12px 32px rgba(21,33,72,.1); transform: translateY(-3px); border-color: #b0b8d0; }
.inactive-card { opacity: .7; }
.inactive-card:hover { opacity: .85; }
.card-accent { height: 5px; flex-shrink: 0; }
.card-header { padding: 20px 22px 12px; }
.card-title-row { display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; }
.card-title { margin: 0; font-size: 16px; font-weight: 700; color: var(--ink); line-height: 1.3; }
.card-menu-btn { display: grid; width: 30px; height: 30px; place-items: center; border: 0; border-radius: 6px; background: transparent; color: #8a91a3; cursor: pointer; transition: all .15s; }
.card-menu-btn:hover { background: #f0f2f7; color: var(--ink); }
.card-code-row { display: flex; align-items: center; gap: 10px; margin-top: 10px; }
.card-code-row code { background: #eef3ff; padding: 3px 9px; border-radius: 5px; font-size: 11px; color: var(--primary); font-weight: 700; }
.card-body { padding: 12px 22px; flex: 1; }
.card-meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.card-meta-item { display: flex; align-items: center; gap: 8px; font-size: 13px; color: #3e465a; }
.card-meta-item svg { color: var(--muted); flex-shrink: 0; }
.card-footer { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 12px 22px; border-top: 1px solid #e6eaf3; background: #fafcff; }
.card-date { font-size: 11px; color: var(--muted); }
.card-actions { display: flex; gap: 4px; }
.card-action-btn { display: inline-grid; width: 30px; height: 30px; place-items: center; border: 0; border-radius: 6px; background: transparent; color: #6e7687; cursor: pointer; transition: all .15s; }
.card-action-btn:hover { background: var(--primary-soft); color: var(--primary); }
.card-action-btn.delete:hover { background: var(--red-soft); color: var(--red); }
.card-action-btn.deactivate:hover { background: #fff0f0; color: var(--red); }
.card-action-btn.activate:hover { background: var(--green-soft); color: var(--green); }
.table-row { display: grid; grid-template-columns: minmax(200px,2fr) minmax(100px,0.8fr) minmax(110px,0.9fr) 80px 90px minmax(130px,1fr) 90px 90px; align-items: center; min-height: 64px; border-top: 1px solid #e0e4ef; padding: 0 20px; gap: 10px; transition: background .15s; }
.table-row:hover { background: #f8faff; }
.table-heading { min-height: 46px; background: #eef3ff; color: #596072; font-size: 11px; font-weight: 800; text-transform: uppercase; }
.table-heading:hover { background: #eef3ff; }
.inactive-row { opacity: .6; }
.name-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.tcol-name { display: flex; align-items: center; gap: 10px; }
.tcol-name strong { color: var(--primary); font-size: 14px; }
.tcol-code code { background: #eef3ff; padding: 2px 8px; border-radius: 4px; font-size: 11px; color: var(--primary); font-weight: 700; }
.subject-badge { padding: 3px 10px; border-radius: 6px; font-size: 12px; font-weight: 700; }
.t-actions { display: flex; gap: 4px; }
.t-action { display: inline-grid; width: 30px; height: 30px; place-items: center; border: 0; border-radius: 6px; background: transparent; color: #6e7687; cursor: pointer; transition: all .15s; }
.t-action:hover { background: var(--primary-soft); color: var(--primary); }
.t-action.delete:hover { background: var(--red-soft); color: var(--red); }
.t-action.deactivate:hover { background: #fff0f0; color: var(--red); }
.t-action.activate:hover { background: var(--green-soft); color: var(--green); }
.delete-content { text-align: center; padding: 8px 0 16px; }
.delete-icon { color: var(--red); margin-bottom: 12px; }
.delete-content p { margin: 8px 0; font-size: 15px; color: var(--ink); }
.delete-warning { font-size: 13px !important; color: var(--muted) !important; }
@media (max-width:1280px) { .table-row { grid-template-columns: minmax(160px,2fr) minmax(80px,0.8fr) minmax(90px,0.9fr) 60px 80px minmax(110px,1fr) 70px 70px; } }
@media (max-width:980px) { .classes-grid { grid-template-columns: repeat(auto-fill, minmax(280px,1fr)); } .table-row { grid-template-columns: 1fr 1fr; min-height: auto; padding: 16px 20px; } .table-heading { display: none; } }
@media (max-width:720px) { .classes-grid { grid-template-columns: 1fr; } .table-row { grid-template-columns: 1fr; gap: 6px; } .card-meta-grid { grid-template-columns: 1fr; } }
</style>
