<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import TeacherLayout from '@/components/teacher/TeacherLayout.vue'
import TeacherIcon from '@/components/teacher/TeacherIcon.vue'
import teacherDashboardService, { type ClassConfiguration, type CreateClassConfigurationRequest } from '@/services/teacherDashboardService'
import { showNotification } from '@/utils/notifications'
import * as XLSX from 'xlsx'

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
  for (const key of Object.keys(subjectColors)) {
    if (subject.toLowerCase().includes(key.toLowerCase())) return subjectColors[key]!
  }
  return subjectColors.default!
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

const activeRate = computed(() =>
  statsSummary.value.total > 0 ? Math.round((statsSummary.value.active / statsSummary.value.total) * 100) : 0,
)

const paginationPages = computed(() => {
  const total = totalPages.value
  const current = currentPage.value
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const start = Math.max(1, current - 3)
  const end = Math.min(total, start + 6)
  return Array.from({ length: end - start + 1 }, (_, i) => start + i)
})

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
    if (isEditing.value && editingId.value) { const idx = classes.value.findIndex((c) => c.id === editingId.value); if (idx !== -1 && classes.value[idx]) classes.value[idx] = { ...classes.value[idx]!, ...data, settings, studentCount: formData.value.student_count, updated_at: now } }
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
  const idx = classes.value.findIndex((x) => x.id === c.id); const orig = idx !== -1 && classes.value[idx] ? { ...classes.value[idx] } : null
  if (idx !== -1 && classes.value[idx]) classes.value[idx] = updated
  teacherDashboardService.updateClassConfiguration(c.id, { is_active: !c.is_active }).catch(() => { if (idx !== -1 && orig) classes.value[idx] = orig })
}

function formatDate(d: string) { return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) }

// ── Export ──
const exporting = ref(false)
const exportDropdownOpen = ref(false)

function toggleExportDropdown() { exportDropdownOpen.value = !exportDropdownOpen.value }
function closeExportDropdown() { exportDropdownOpen.value = false }

function handleExport(handler: () => Promise<void>) {
  closeExportDropdown()
  handler()
}

function getExportData() {
  return classes.value.map((c) => ({
    'Class Name': c.name,
    Code: c.class_name,
    Subject: c.subject,
    'Student Count': c.studentCount,
    Status: c.is_active ? 'Active' : 'Inactive',
    Schedule: (c.settings as any)?.schedule || '',
    Room: (c.settings as any)?.room || '',
    'Created': formatDate(c.created_at),
  }))
}

function doExportXLSX() {
  const data = getExportData()
  if (data.length === 0) { showNotification('No classes to export', 'error'); return }
  exporting.value = true
  try {
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Classes')
    const cols = Object.keys(data[0]!).map((key) => {
      const maxLen = Math.max(key.length, ...data.map((row) => String(row[key as keyof typeof row] || '').length))
      return { wch: Math.min(maxLen + 3, 40) }
    })
    ws['!cols'] = cols
    XLSX.writeFile(wb, `classes-export-${new Date().toISOString().slice(0, 10)}.xlsx`)
    showNotification(`Exported ${data.length} classes to Excel`, 'success')
  } catch { showNotification('Failed to export Excel file', 'error') }
  finally { exporting.value = false }
}

function doExportCSV() {
  const data = getExportData()
  if (data.length === 0) { showNotification('No classes to export', 'error'); return }
  exporting.value = true
  try {
    const ws = XLSX.utils.json_to_sheet(data)
    const csv = XLSX.utils.sheet_to_csv(ws)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `classes-export-${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    showNotification(`Exported ${data.length} classes to CSV`, 'success')
  } catch { showNotification('Failed to export CSV file', 'error') }
  finally { exporting.value = false }
}

// Click outside to close export dropdown
function onDocumentClick(e: MouseEvent) {
  const target = e.target as HTMLElement
  if (!target.closest('.export-dropdown-trigger')) {
    closeExportDropdown()
  }
}

onMounted(() => {
  fetchClasses()
  document.addEventListener('click', onDocumentClick)
})

onUnmounted(() => {
  document.removeEventListener('click', onDocumentClick)
})
</script>

<template>
  <TeacherLayout sidebar-active="classes" page-title="My Classes" page-subtitle="Manage your classes, schedules, and sections.">
    <template #actions>
      <div class="view-toggle">
        <button class="toggle-btn" :class="{ active: viewMode === 'grid' }" type="button" @click="viewMode = 'grid'" title="Grid view">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
        </button>
        <button class="toggle-btn" :class="{ active: viewMode === 'table' }" type="button" @click="viewMode = 'table'" title="Table view">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M3 15h18"/><path d="M9 3v18"/></svg>
        </button>
      </div>
    </template>

    <!-- ====== Stats Grid ====== -->
    <section class="stats-grid" aria-label="Classes summary">
      <article class="stat-card">
        <div class="stat-bg-icon"><TeacherIcon icon="cap" :size="38" /></div>
        <div class="stat-top">
          <span class="stat-label">Total Classes</span>
          <span class="stat-badge">{{ statsSummary.active }}/{{ statsSummary.total }} active</span>
        </div>
        <div class="stat-value" style="color:#001f9e">{{ statsSummary.total }}</div>
        <div class="stat-progress"><div class="stat-progress-fill" :style="{ width: activeRate + '%', background: '#001f9e' }"></div></div>
      </article>
      <article class="stat-card">
        <div class="stat-bg-icon"><TeacherIcon icon="users" :size="38" /></div>
        <div class="stat-top">
          <span class="stat-label">Students</span>
          <span class="stat-badge">avg {{ statsSummary.avgStudents }}/class</span>
        </div>
        <div class="stat-value" style="color:#00772f">{{ statsSummary.totalStudents }}</div>
        <div class="stat-progress"><div class="stat-progress-fill" :style="{ width: '78%', background: '#00772f' }"></div></div>
      </article>
      <article class="stat-card">
        <div class="stat-bg-icon"><TeacherIcon icon="book" :size="38" /></div>
        <div class="stat-top">
          <span class="stat-label">Subjects</span>
          <span class="stat-badge">different</span>
        </div>
        <div class="stat-value" style="color:#8d35ff">{{ statsSummary.subjects }}</div>
        <div class="stat-progress"><div class="stat-progress-fill" :style="{ width: '45%', background: '#8d35ff' }"></div></div>
      </article>
      <article class="stat-card">
        <div class="stat-bg-icon"><TeacherIcon icon="trend" :size="38" /></div>
        <div class="stat-top">
          <span class="stat-label">Active Rate</span>
          <span class="stat-badge">engagement</span>
        </div>
        <div class="stat-value" style="color:#f07800">{{ activeRate }}%</div>
        <div class="stat-progress"><div class="stat-progress-fill" :style="{ width: activeRate + '%', background: '#f07800' }"></div></div>
      </article>
    </section>

    <!-- ====== Filter & Actions ====== -->
    <section class="filter-bar">
      <div class="filter-bar-row">
        <div class="search-wrapper">
          <svg class="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input
            v-model="searchQuery"
            type="search"
            placeholder="Search classes by name, code, or subject..."
            class="search-input"
            aria-label="Search classes"
          />
          <button v-if="searchQuery" class="search-clear" type="button" @click="searchQuery = ''; currentPage = 1" title="Clear search">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div class="filter-actions">
          <div class="export-dropdown-trigger">
            <button class="outline-button" type="button" :disabled="exporting || classes.length === 0" @click="toggleExportDropdown">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              <span>{{ exporting ? 'Exporting...' : 'Export' }}</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="opacity:.6;transition:transform .2s;" :style="{ transform: exportDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)' }"><polyline points="6 9 12 15 18 9"/></svg>
            </button>
            <Transition name="dropdown">
              <div v-if="exportDropdownOpen" class="export-dropdown-menu">
                <button class="export-dropdown-item" type="button" :disabled="exporting" @click="handleExport(doExportXLSX)">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                  <span class="export-dd-label">
                    <span class="export-dd-title">Excel (.xlsx)</span>
                    <span class="export-dd-desc">Spreadsheet with all columns</span>
                  </span>
                </button>
                <button class="export-dropdown-item" type="button" :disabled="exporting" @click="handleExport(doExportCSV)">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                  <span class="export-dd-label">
                    <span class="export-dd-title">CSV (.csv)</span>
                    <span class="export-dd-desc">Comma-separated values</span>
                  </span>
                </button>
              </div>
            </Transition>
          </div>
          <button class="primary-button" type="button" @click="openCreateModal"><TeacherIcon icon="plus" :size="18" /><span>New Class</span></button>
        </div>
      </div>
      <div class="filter-bar-row filters-row">
        <div class="filter-group">
          <label class="filter-label">Status</label>
          <div class="filter-chips">
            <button class="chip" :class="{ active: statusFilter === 'all' }" type="button" @click="statusFilter = 'all'; currentPage = 1">All Classes</button>
            <button class="chip chip-green" :class="{ active: statusFilter === 'active' }" type="button" @click="statusFilter = 'active'; currentPage = 1">Active</button>
            <button class="chip chip-gray" :class="{ active: statusFilter === 'inactive' }" type="button" @click="statusFilter = 'inactive'; currentPage = 1">Inactive</button>
          </div>
        </div>
        <div class="filter-info">
          <span class="result-count">{{ filteredClasses.length }} class{{ filteredClasses.length !== 1 ? 'es' : '' }}</span>
        </div>
      </div>
    </section>

    <!-- ====== Loading ====== -->
    <div v-if="loading && classes.length === 0" class="loading-state">
      <div class="spinner-ring"><div></div><div></div><div></div><div></div></div>
      <p>Loading classes...</p>
    </div>

    <!-- ====== Empty ====== -->
    <section v-else-if="paginatedClasses.length === 0" class="empty-state">
      <div class="empty-illustration">
        <svg width="80" height="80" viewBox="0 0 80 80" fill="none"><rect x="10" y="20" width="60" height="48" rx="6" stroke="#c5cbdd" stroke-width="2" fill="#f5f7ff"/><rect x="18" y="30" width="24" height="4" rx="2" fill="#d0d6e8"/><rect x="18" y="40" width="18" height="4" rx="2" fill="#e0e4ef"/><rect x="18" y="50" width="10" height="4" rx="2" fill="#e0e4ef"/><circle cx="58" cy="36" r="12" fill="#eef3ff" stroke="#c5cbdd" stroke-width="1.5"/><path d="M58 32v8M54 36h8" stroke="#7a8ac7" stroke-width="2" stroke-linecap="round"/></svg>
      </div>
      <h3>No classes {{ searchQuery ? 'match your search' : 'yet' }}</h3>
      <p>{{ searchQuery ? 'Try adjusting your search or filters.' : 'Get started by creating your first class.' }}</p>
      <button v-if="!searchQuery" class="primary-button" type="button" @click="openCreateModal"><TeacherIcon icon="plus" :size="18" /><span>Create Class</span></button>
    </section>

    <!-- ====== Grid View ====== -->
    <section v-else-if="viewMode === 'grid'" class="classes-grid" aria-label="Classes">
      <div v-for="c in paginatedClasses" :key="c.id" class="class-card" :class="{ 'inactive-card': !c.is_active }">
        <!-- Accent strip -->
        <div class="card-accent" :style="{ background: `linear-gradient(90deg, ${c.color}, ${c.color}dd 70%, ${c.color}66)` }"></div>

        <div class="card-inner">
          <!-- Header -->
          <div class="card-header">
            <div class="card-title-row">
              <div class="card-title-left">
                <span class="card-subj-icon" :style="{ background: c.color + '18', color: c.color }">{{ c.subject.charAt(0) }}</span>
                <div class="card-title-text">
                  <h3 class="card-title" :title="c.name">{{ c.name }}</h3>
                  <div class="card-code-badge">{{ c.class_name }}</div>
                </div>
              </div>
              <div class="card-header-right">
                <span class="card-status-badge" :class="c.is_active ? 'active' : 'inactive'">
                  <span class="status-dot"></span>
                  {{ c.is_active ? 'Active' : 'Inactive' }}
                </span>
                <button class="card-menu-btn" type="button" title="More actions"><TeacherIcon icon="more" :size="16" /></button>
              </div>
            </div>
          </div>

          <!-- Body -->
          <div class="card-body">
            <div class="card-meta-grid">
              <div class="card-meta-item">
                <span class="meta-icon-wrap" :style="{ color: c.color }">
                  <TeacherIcon icon="book" :size="13" />
                </span>
                <div class="meta-content">
                  <span class="meta-label">Subject</span>
                  <span class="meta-value">{{ c.subject }}</span>
                </div>
              </div>
              <div class="card-meta-item">
                <span class="meta-icon-wrap" :style="{ color: c.color }">
                  <TeacherIcon icon="clock" :size="13" />
                </span>
                <div class="meta-content">
                  <span class="meta-label">Schedule</span>
                  <span class="meta-value">{{ (c.settings as any)?.schedule || '—' }}</span>
                </div>
              </div>
              <div class="card-meta-item">
                <span class="meta-icon-wrap" :style="{ color: c.color }">
                  <TeacherIcon icon="mapPin" :size="13" />
                </span>
                <div class="meta-content">
                  <span class="meta-label">Room</span>
                  <span class="meta-value">{{ (c.settings as any)?.room || '—' }}</span>
                </div>
              </div>
              <div class="card-meta-item">
                <span class="meta-icon-wrap" :style="{ color: c.color }">
                  <TeacherIcon icon="users" :size="13" />
                </span>
                <div class="meta-content">
                  <span class="meta-label">Students</span>
                  <span class="meta-value">{{ c.studentCount }} enrolled</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="card-footer">
            <div class="card-footer-left">
              <div class="card-date-icon">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                <span>{{ formatDate(c.created_at) }}</span>
              </div>
            </div>
            <div class="card-footer-actions">
              <button class="card-action-btn" title="Edit" @click.stop="openEditModal(c)"><TeacherIcon icon="edit" :size="14" /></button>
              <button class="card-action-btn" :class="c.is_active ? 'deactivate' : 'activate'" :title="c.is_active ? 'Deactivate' : 'Activate'" @click.stop="toggleActive(c)"><TeacherIcon :icon="c.is_active ? 'x' : 'check'" :size="14" /></button>
              <button class="card-action-btn delete" title="Delete" @click.stop="confirmDelete(c)"><TeacherIcon icon="trash" :size="14" /></button>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ====== Table View ====== -->
    <section v-else class="table-section">
      <div class="table-container">
        <div class="table-head">
          <span class="th-col th-col--name" style="padding-left:20px">Class Name</span>
          <span class="th-col th-col--code">Code</span>
          <span class="th-col th-col--subject">Subject</span>
          <span class="th-col th-col--students">Students</span>
          <span class="th-col th-col--status">Status</span>
          <span class="th-col th-col--schedule">Schedule</span>
          <span class="th-col th-col--date">Created</span>
          <span class="th-col th-col--actions" style="padding-right:20px"></span>
        </div>
        <div v-for="c in paginatedClasses" :key="c.id" class="table-row" :class="{ 'inactive-row': !c.is_active }">
          <span class="td-col td-col--name" style="padding-left:20px">
            <span class="td-name-dot" :style="{ background: c.color }"></span>
            <strong>{{ c.name }}</strong>
          </span>
          <span class="td-col td-col--code"><code>{{ c.class_name }}</code></span>
          <span class="td-col td-col--subject">
            <span class="td-subject-badge" :style="{ background: c.color + '14', color: c.color }">{{ c.subject }}</span>
          </span>
          <span class="td-col td-col--students">
            <span class="td-students-number">{{ c.studentCount }}</span>
          </span>
          <span class="td-col td-col--status">
            <span class="td-status" :class="c.is_active ? 'active' : 'inactive'">
              <span class="td-status-dot"></span>
              {{ c.is_active ? 'Active' : 'Inactive' }}
            </span>
          </span>
          <span class="td-col td-col--schedule"><span class="td-schedule">{{ (c.settings as any)?.schedule || '—' }}</span></span>
          <span class="td-col td-col--date"><span class="td-date">{{ formatDate(c.created_at) }}</span></span>
          <span class="td-col td-col--actions" style="padding-right:16px">
            <div class="td-actions">
              <button class="td-action-btn" title="Edit" @click="openEditModal(c)"><TeacherIcon icon="edit" :size="14" /></button>
              <button class="td-action-btn" :class="c.is_active ? 'deactivate' : 'activate'" :title="c.is_active ? 'Deactivate' : 'Activate'" @click="toggleActive(c)"><TeacherIcon :icon="c.is_active ? 'x' : 'check'" :size="14" /></button>
              <button class="td-action-btn delete" title="Delete" @click="confirmDelete(c)"><TeacherIcon icon="trash" :size="14" /></button>
            </div>
          </span>
        </div>
      </div>
    </section>

    <!-- ====== Pagination (shared between views) ====== -->
    <div v-if="filteredClasses.length > perPage" class="pagination-bar">
      <div class="pagination-info">Showing {{ ((currentPage - 1) * perPage) + 1 }}–{{ Math.min(currentPage * perPage, filteredClasses.length) }} of {{ filteredClasses.length }}</div>
      <div class="pagination-controls">
        <button class="page-btn" :disabled="currentPage <= 1" @click="currentPage--">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <template v-for="p in paginationPages" :key="p">
          <button class="page-num" :class="{ active: currentPage === p }" @click="currentPage = p">{{ p }}</button>
        </template>
        <button class="page-btn" :disabled="currentPage >= totalPages" @click="currentPage++">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
      </div>
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
/* ══════════════════════════════════════════════════════════════
   STATS GRID - Modern KPI Cards
   ══════════════════════════════════════════════════════════════ */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 18px;
}

.stat-card {
  position: relative;
  padding: 20px 22px 18px;
  border-radius: 14px;
  background: #fff;
  border: 1px solid var(--line);
  overflow: hidden;
  transition: all .25s cubic-bezier(.16,1,.3,1);
}

.stat-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 28px rgba(21,33,72,.08);
  border-color: #b0b8d0;
}

/* Dashboard-style accent strip for stat cards */
.stat-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, var(--primary), #4a6cf7);
  opacity: 0.6;
  transition: opacity .25s;
}

.stat-card:hover::before {
  opacity: 1;
}

.stat-bg-icon {
  position: absolute;
  right: 14px;
  top: 14px;
  opacity: .08;
  pointer-events: none;
}

.stat-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 6px;
}

.stat-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--muted);
}

.stat-badge {
  font-size: 10px;
  font-weight: 700;
  color: var(--muted);
  background: #f1f3f8;
  padding: 2px 8px;
  border-radius: 999px;
  letter-spacing: .01em;
}

.stat-value {
  font-size: 32px;
  font-weight: 800;
  line-height: 1.1;
  margin-bottom: 10px;
}

.stat-progress {
  height: 4px;
  border-radius: 999px;
  background: #eef0f5;
  overflow: hidden;
}

.stat-progress-fill {
  height: 100%;
  border-radius: 999px;
  transition: width .6s ease;
}

/* ══════════════════════════════════════════════════════════════
   FILTER BAR
   ══════════════════════════════════════════════════════════════ */
.filter-bar {
  display: flex;
  flex-direction: column;
  gap: 0;
  margin-bottom: 22px;
  padding: 14px 20px;
  border-radius: 12px;
  background: #fff;
  border: 1px solid var(--line);
}

.filter-bar-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
}

.filter-bar-row:first-child {
  padding-bottom: 12px;
}

.filters-row {
  padding-top: 12px;
  border-top: 1px solid #eaecf3;
}

.filter-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

/* ── Search Field ── */
.search-wrapper {
  display: flex;
  align-items: center;
  flex: 1;
  max-width: 420px;
  min-height: 40px;
  padding: 0 14px;
  border: 1.5px solid #dce0ec;
  border-radius: 10px;
  background: #f8faff;
  transition: all .2s ease;
  gap: 10px;
}

.search-wrapper:focus-within {
  border-color: var(--primary);
  background: #fff;
  box-shadow: 0 0 0 3px rgba(0,31,158,.08);
}

.search-icon {
  flex-shrink: 0;
  color: #9aa0b3;
  transition: color .2s;
}

.search-wrapper:focus-within .search-icon {
  color: var(--primary);
}

.search-input {
  flex: 1;
  min-height: 36px;
  border: 0;
  background: transparent;
  font-size: 13px;
  color: var(--ink);
  outline: none;
  padding: 0;
}

.search-input::placeholder {
  color: #9aa0b3;
  font-weight: 500;
}

.search-input::-webkit-search-cancel-button {
  display: none;
}

.search-clear {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: #9aa0b3;
  cursor: pointer;
  transition: all .15s;
  flex-shrink: 0;
  opacity: .7;
}

.search-clear:hover {
  background: #eef0f5;
  color: #4a5268;
  opacity: 1;
}

.search-hint {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 22px;
  height: 22px;
  border: 1px solid #dce0ec;
  border-radius: 5px;
  background: #f4f6fb;
  font-size: 11px;
  font-weight: 700;
  color: #9aa0b3;
  font-family: inherit;
  line-height: 1;
  flex-shrink: 0;
  padding: 0 5px;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 10px;
}

.filter-label {
  font-size: 11px;
  font-weight: 700;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: .03em;
  white-space: nowrap;
}

.filter-chips {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.filter-info {
  flex-shrink: 0;
}

.result-count {
  font-size: 12px;
  font-weight: 700;
  color: var(--muted);
}

/* ══════════════════════════════════════════════════════════════
   CLASS GRID - Premium Cards
   ══════════════════════════════════════════════════════════════ */
.classes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(330px, 1fr));
  gap: 20px;
}

.class-card {
  display: flex;
  flex-direction: column;
  border-radius: 14px;
  background: #fff;
  border: 1px solid var(--line);
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(21,33,72,.04);
  transition: all .3s cubic-bezier(.16,1,.3,1);
}

.class-card:hover {
  transform: translateY(-4px);
  border-color: #b0b8d0;
  box-shadow: 0 14px 34px rgba(21,33,72,.1), 0 0 0 1px rgba(0,31,158,.06);
}

.inactive-card { opacity: .6; }
.inactive-card:hover { opacity: .78; }

.card-inner {
  display: flex;
  flex-direction: column;
  flex: 1;
}

/* ── Accent Strip ── */
.card-accent {
  height: 5px;
  flex-shrink: 0;
}

/* ── Card Header ── */
.card-header { padding: 16px 18px 8px; }

.card-title-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 10px;
}

.card-title-left {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  min-width: 0;
  flex: 1;
}

.card-subj-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 800;
  flex-shrink: 0;
  margin-top: 1px;
}

.card-title-text {
  min-width: 0;
}

.card-title {
  margin: 0;
  font-size: 14px;
  font-weight: 700;
  color: var(--ink);
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-code-badge {
  display: inline-block;
  margin-top: 4px;
  background: #eef3ff;
  padding: 2px 7px;
  border-radius: 4px;
  font-size: 10px;
  color: var(--primary);
  font-weight: 700;
}

.card-header-right {
  display: flex;
  align-items: center;
  gap: 5px;
  flex-shrink: 0;
}

.card-status-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 9px;
  border-radius: 999px;
  font-size: 9px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .04em;
  transition: all .15s;
}

.card-status-badge.active {
  background: #e6f7ed;
  color: #007733;
}

.card-status-badge.inactive {
  background: #f1f3f7;
  color: #6e7687;
}

.status-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
}

.card-status-badge.active .status-dot {
  background: #00b34d;
  box-shadow: 0 0 0 2px rgba(0,179,77,.18);
}

.card-status-badge.inactive .status-dot {
  background: #9aa0b3;
}

.card-menu-btn {
  display: grid;
  width: 26px;
  height: 26px;
  place-items: center;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: #8a91a3;
  cursor: pointer;
  transition: all .15s;
  flex-shrink: 0;
}

.card-menu-btn:hover {
  background: #f0f2f7;
  color: var(--ink);
}

/* ── Card Body ── */
.card-body {
  padding: 8px 18px 10px;
  flex: 1;
}

.card-meta-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
}

.card-meta-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border-radius: 8px;
  background: #f8faff;
  transition: background .15s;
  min-width: 0;
}

.class-card:hover .card-meta-item {
  background: #f0f5ff;
}

.meta-icon-wrap {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: 6px;
  background: rgba(0,31,158,.07);
  flex-shrink: 0;
}

.meta-content {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.meta-label {
  font-size: 9px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .04em;
  color: var(--muted);
  line-height: 1.2;
}

.meta-value {
  font-size: 11px;
  font-weight: 600;
  color: #2a3247;
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ── Card Footer ── */
.card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 8px 18px;
  border-top: 1px solid #eaeef6;
  background: #fafcff;
}

.card-footer-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.card-date-icon {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 10px;
  color: var(--muted);
}

.card-footer-actions {
  display: flex;
  gap: 2px;
}

.card-action-btn {
  display: inline-grid;
  width: 28px;
  height: 28px;
  place-items: center;
  border: 0;
  border-radius: 7px;
  background: transparent;
  color: #8a91a6;
  cursor: pointer;
  transition: all .15s;
}

.card-action-btn:hover {
  background: var(--primary-soft);
  color: var(--primary);
  transform: scale(1.1);
}

.card-action-btn.delete:hover {
  background: #fef0f0;
  color: #dc2626;
}

.card-action-btn.deactivate:hover {
  background: #fef0f0;
  color: #dc2626;
}

.card-action-btn.activate:hover {
  background: #e6f7ed;
  color: #16a34a;
}

/* ══════════════════════════════════════════════════════════════
   TABLE VIEW - Modern Table Design
   ══════════════════════════════════════════════════════════════ */
.table-section {
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 12px;
  overflow: hidden;
}

.table-container {
  width: 100%;
  overflow-x: auto;
}

.table-head {
  display: grid;
  grid-template-columns: minmax(180px,2fr) minmax(90px,0.8fr) minmax(100px,0.8fr) 76px 90px minmax(120px,1fr) 90px 70px;
  align-items: center;
  min-height: 46px;
  background: #f4f7fe;
  border-bottom: 1px solid #e0e4ef;
}

.th-col {
  font-size: 10px;
  font-weight: 800;
  color: #596072;
  text-transform: uppercase;
  letter-spacing: .04em;
  padding: 0 8px;
}

.table-row {
  display: grid;
  grid-template-columns: minmax(180px,2fr) minmax(90px,0.8fr) minmax(100px,0.8fr) 76px 90px minmax(120px,1fr) 90px 70px;
  align-items: center;
  min-height: 58px;
  border-bottom: 1px solid #eaeef6;
  padding: 0;
  gap: 0;
  transition: background .15s;
}

.table-row:last-child {
  border-bottom: none;
}

.table-row:hover {
  background: #f8faff;
}

.inactive-row {
  opacity: .55;
}

.td-col {
  padding: 0 8px;
  font-size: 13px;
  color: var(--ink);
}

.td-col--name {
  display: flex;
  align-items: center;
  gap: 10px;
}

.td-col--name strong {
  font-size: 13px;
  font-weight: 600;
  color: var(--primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.td-name-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
}

.td-col--code code {
  background: #eef3ff;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 10px;
  color: var(--primary);
  font-weight: 700;
}

.td-subject-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 5px;
  font-size: 11px;
  font-weight: 700;
}

.td-students-number {
  font-weight: 700;
  color: var(--ink);
}

.td-status {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 8px;
  border-radius: 999px;
  font-size: 9px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .03em;
}

.td-status.active {
  background: #e6f7ed;
  color: #007733;
}

.td-status.inactive {
  background: #f1f3f7;
  color: #6e7687;
}

.td-status-dot {
  width: 4px;
  height: 4px;
  border-radius: 50%;
}

.td-status.active .td-status-dot {
  background: #00b34d;
}

.td-status.inactive .td-status-dot {
  background: #9aa0b3;
}

.td-schedule,
.td-date {
  font-size: 12px;
  color: #3e465a;
}

.td-actions {
  display: flex;
  gap: 2px;
  justify-content: flex-end;
}

.td-action-btn {
  display: inline-grid;
  width: 28px;
  height: 28px;
  place-items: center;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: #8a91a6;
  cursor: pointer;
  transition: all .15s;
}

.td-action-btn:hover {
  background: var(--primary-soft);
  color: var(--primary);
}

.td-action-btn.delete:hover {
  background: #fef0f0;
  color: #dc2626;
}

.td-action-btn.deactivate:hover {
  background: #fef0f0;
  color: #dc2626;
}

.td-action-btn.activate:hover {
  background: #e6f7ed;
  color: #16a34a;
}

/* ══════════════════════════════════════════════════════════════
   PAGINATION
   ══════════════════════════════════════════════════════════════ */
.pagination-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 20px;
  border-top: 1px solid #eaeef6;
  background: #fafcff;
}

.pagination-info {
  font-size: 12px;
  color: var(--muted);
}

.pagination-controls {
  display: flex;
  align-items: center;
  gap: 4px;
}

.page-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border: 1px solid #e0e4ef;
  border-radius: 7px;
  background: #fff;
  color: #4a5268;
  cursor: pointer;
  transition: all .15s;
}

.page-btn:hover:not(:disabled) {
  border-color: var(--primary);
  color: var(--primary);
  background: var(--primary-soft);
}

.page-btn:disabled {
  opacity: .35;
  cursor: default;
}

.page-num {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 30px;
  height: 30px;
  border: 1px solid #e0e4ef;
  border-radius: 7px;
  background: #fff;
  color: #4a5268;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all .15s;
  padding: 0 3px;
}

.page-num:hover {
  border-color: var(--primary);
  color: var(--primary);
}

.page-num.active {
  background: var(--primary);
  border-color: var(--primary);
  color: #fff;
}

/* ══════════════════════════════════════════════════════════════
   LOADING & EMPTY STATES
   ══════════════════════════════════════════════════════════════ */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 64px 20px;
  color: var(--muted);
}

.loading-state p {
  font-size: 14px;
  color: var(--muted);
}

/* Spinner ring animation */
.spinner-ring {
  display: inline-block;
  position: relative;
  width: 36px;
  height: 36px;
}

.spinner-ring div {
  box-sizing: border-box;
  display: block;
  position: absolute;
  width: 30px;
  height: 30px;
  margin: 3px;
  border: 3px solid var(--primary);
  border-radius: 50%;
  animation: spin-ring 1.2s cubic-bezier(.5,0,.5,1) infinite;
  border-color: var(--primary) transparent transparent transparent;
}

.spinner-ring div:nth-child(1) { animation-delay: -.45s; }
.spinner-ring div:nth-child(2) { animation-delay: -.3s; }
.spinner-ring div:nth-child(3) { animation-delay: -.15s; }

@keyframes spin-ring {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 60px 20px;
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 12px;
  text-align: center;
}

.empty-illustration {
  margin-bottom: 4px;
}

.empty-state h3 {
  margin: 0;
  font-size: 17px;
  font-weight: 800;
  color: var(--ink);
}

.empty-state p {
  margin: 0;
  font-size: 14px;
  color: var(--muted);
  max-width: 300px;
}

/* ══════════════════════════════════════════════════════════════
   MODALS
   ══════════════════════════════════════════════════════════════ */
.delete-content {
  text-align: center;
  padding: 8px 0 16px;
}

.delete-icon {
  color: var(--red);
  margin-bottom: 12px;
}

.delete-content p {
  margin: 8px 0;
  font-size: 15px;
  color: var(--ink);
}

.delete-warning {
  font-size: 13px !important;
  color: var(--muted) !important;
}

/* ══════════════════════════════════════════════════════════════
   RESPONSIVE
   ══════════════════════════════════════════════════════════════ */
@media (max-width:1280px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .table-head,
  .table-row {
    grid-template-columns: minmax(150px,2fr) minmax(80px,0.8fr) minmax(90px,0.8fr) 66px 80px minmax(100px,1fr) 80px 60px;
  }
}

@media (max-width:980px) {
  .classes-grid {
    grid-template-columns: repeat(auto-fill, minmax(280px,1fr));
  }
  .table-head,
  .table-row {
    grid-template-columns: 1fr 1fr;
    min-height: auto;
    padding: 14px 16px;
    gap: 8px;
  }
  .table-head {
    display: none;
  }
  .td-col {
    padding: 0;
  }
  .td-col--actions {
    grid-column: 1 / -1;
    display: flex;
    justify-content: flex-end;
  }
}

@media (max-width:720px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
  .classes-grid {
    grid-template-columns: 1fr;
  }
  .filter-bar-row {
    flex-direction: column;
    align-items: stretch;
  }
  .filter-actions {
    justify-content: flex-end;
  }
  .filters-row {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
  }
  .card-meta-grid {
    grid-template-columns: 1fr;
  }
  .table-head,
  .table-row {
    grid-template-columns: 1fr;
    gap: 6px;
  }
}
</style>
