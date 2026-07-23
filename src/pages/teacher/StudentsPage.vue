<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import TeacherLayout from '@/components/teacher/TeacherLayout.vue'
import TeacherIcon from '@/components/teacher/TeacherIcon.vue'
import * as XLSX from 'xlsx'
import { showNotification } from '@/utils/notifications'

const router = useRouter()
const authStore = useAuthStore()

interface Student {
  id: number
  name: string
  email: string
  class: string
  classCode: string
  status: 'active' | 'inactive'
  joinDate: string
  lastActive: string
  engagement: number
  totalPolls: number
  totalQuizzes: number
  averageScore: number
  avatarInitials: string
}

const loading = ref(false)
const searchQuery = ref('')
const selectedClassFilter = ref('all')
const selectedStatusFilter = ref<'all' | 'active' | 'inactive'>('all')
const students = ref<Student[]>([])
const studentDetail = ref<Student | null>(null)
const showDetailModal = ref(false)

// ── Import state ──
const fileInput = ref<HTMLInputElement | null>(null)
const showImportModal = ref(false)
const importStatus = ref<'idle' | 'parsing' | 'done'>('idle')
const importResult = ref<{ added: number; skipped: number; total: number } | null>(null)

// ── Edit state ──
const showEditModal = ref(false)
const editingStudent = ref<Student | null>(null)
const editForm = ref({ name: '', email: '', class: '', classCode: '', status: 'active' as 'active' | 'inactive' })

// ── Delete state ──
const showDeleteModal = ref(false)
const deletingStudent = ref<Student | null>(null)

// ── Invite state ──
const showInviteModal = ref(false)
const inviteEmail = ref('')
const inviteClass = ref('')

// ── LocalStorage key ──
const STORAGE_KEY = 'teacher-students-list'

function saveStudentsToStorage() {
  try {
    // Only persist actual data to storage; strip out generated random stats
    // to keep the storage lean — they'll be regenerated on load.
    const minimal = students.value.map((s) => ({
      id: s.id,
      name: s.name,
      email: s.email,
      class: s.class,
      classCode: s.classCode,
      status: s.status,
      joinDate: s.joinDate,
      lastActive: s.lastActive,
    }))
    localStorage.setItem(STORAGE_KEY, JSON.stringify(minimal))
  } catch {
    // localStorage full or unavailable — silently ignore
  }
}

function loadStudentsFromStorage(): Student[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed) || parsed.length === 0) return null
    // Hydrate with generated stats for richer display
    return parsed.map((s: any) => ({
      id: s.id || Date.now() + Math.random(),
      name: s.name || '',
      email: s.email || s.name?.toLowerCase().replace(/ /g, '.') + '@university.edu',
      class: s.class || '',
      classCode: s.classCode || '',
      status: (s.status === 'inactive' ? 'inactive' : 'active') as 'active' | 'inactive',
      joinDate: s.joinDate || new Date().toISOString(),
      lastActive: s.lastActive || new Date().toISOString(),
      engagement: Math.floor(50 + Math.random() * 50),
      totalPolls: Math.floor(Math.random() * 15),
      totalQuizzes: Math.floor(Math.random() * 10),
      averageScore: Math.floor(60 + Math.random() * 40),
      avatarInitials: getInitials(s.name || ''),
    }))
  } catch {
    return null
  }
}

// ── Demo data (fallback) ──
const DEMO_CLASSES = [
  { name: 'Biology 101 - Section A', code: 'BIOL-101-A' },
  { name: 'Advanced Chemistry', code: 'CHEM-201' },
  { name: 'Physics for Engineers', code: 'PHYS-210' },
  { name: 'Calculus III', code: 'MATH-301' },
  { name: 'English Literature', code: 'ENGL-201' },
]

function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

function generateDemoStudents(): Student[] {
  const names = [
    'Emma Thompson', 'Liam Chen', 'Sophia Patel', 'Noah Williams',
    'Olivia Martinez', 'Ethan Kim', 'Ava Johnson', 'Mason Brown',
    'Isabella Garcia', 'Lucas Lee', 'Mia Rodriguez', 'James Wilson',
    'Charlotte Anderson', 'Benjamin Taylor', 'Amelia Thomas',
    'Elijah Jackson', 'Harper White', 'Alexander Harris',
    'Evelyn Martin', 'Daniel Moore',
  ]
  return names.map((name, i) => {
    const cls = DEMO_CLASSES[i % DEMO_CLASSES.length]!
    return {
      id: Date.now() + i,
      name,
      email: name.toLowerCase().replace(/ /g, '.') + '@university.edu',
      class: cls.name,
      classCode: cls.code,
      status: i < 16 ? 'active' : 'inactive' as 'active' | 'inactive',
      joinDate: new Date(2024, 0, 10 + i).toISOString(),
      lastActive: new Date(2024, 9, 20 - (i % 5)).toISOString(),
      engagement: Math.floor(50 + Math.random() * 50),
      totalPolls: Math.floor(5 + Math.random() * 20),
      totalQuizzes: Math.floor(3 + Math.random() * 15),
      averageScore: Math.floor(60 + Math.random() * 40),
      avatarInitials: getInitials(name),
    }
  })
}

// ── Computed ──
const classOptions = computed(() => ['all', ...Array.from(new Set(students.value.map((s) => s.class)))])

const filteredStudents = computed(() => {
  let r = students.value
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase()
    r = r.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        s.classCode.toLowerCase().includes(q) ||
        s.class.toLowerCase().includes(q),
    )
  }
  if (selectedClassFilter.value !== 'all') r = r.filter((s) => s.class === selectedClassFilter.value)
  if (selectedStatusFilter.value !== 'all') r = r.filter((s) => s.status === selectedStatusFilter.value)
  return r
})

const statsSummary = computed(() => ({
  total: students.value.length,
  active: students.value.filter((s) => s.status === 'active').length,
  avgEngagement: students.value.length
    ? Math.round(students.value.reduce((sum, s) => sum + s.engagement, 0) / students.value.length)
    : 0,
  avgScore: students.value.length
    ? Math.round(students.value.reduce((sum, s) => sum + s.averageScore, 0) / students.value.length)
    : 0,
}))

// ── Utility ──
function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function getEngColor(s: number) {
  return s >= 80 ? 'var(--green)' : s >= 60 ? 'var(--orange)' : 'var(--red)'
}

// ── Detail Modal ──
function viewStudentDetail(student: Student) {
  studentDetail.value = student
  showDetailModal.value = true
}

function closeDetail() {
  showDetailModal.value = false
  studentDetail.value = null
}

// ── Invite Modal ──
function openInviteModal() {
  inviteEmail.value = ''
  const available = classOptions.value.filter((c) => c !== 'all')
  inviteClass.value = available[0] || ''
  showInviteModal.value = true
}

function handleInvite() {
  if (!inviteEmail.value) return
  showNotification(`Invitation sent to ${inviteEmail.value}`, 'success')
  showInviteModal.value = false
}

// ── Import ──
function openImportModal() {
  importResult.value = null
  importStatus.value = 'idle'
  showImportModal.value = true
}

function triggerFileImport() {
  if (fileInput.value) fileInput.value.value = ''
  fileInput.value?.click()
}

function parseSpreadsheet(file: File): Promise<Student[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: 'array' })
        const parsed: Student[] = []
        const headerPatterns = /^(name|student|full.?name|first.?name|email|class|code|status)$/i

        for (const sheetName of workbook.SheetNames) {
          const sheet = workbook.Sheets[sheetName]
          if (!sheet) continue
          const rows: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' })
          if (rows.length < 2) continue

          // Detect header row
          const firstRow = (rows[0] ?? []) as string[]
          const headerMap: Record<string, number> = {}
          firstRow.forEach((cell: string, idx: number) => {
            const key = String(cell ?? '').trim().toLowerCase()
            if (key === 'name' || key === 'student' || key === 'full name' || key === 'student name' || key === 'fullname') headerMap.name = idx
            if (key === 'email' || key === 'e-mail') headerMap.email = idx
            if (key === 'class' || key === 'class name' || key === 'section') headerMap.class = idx
            if (key === 'code' || key === 'class code') headerMap.code = idx
            if (key === 'status') headerMap.status = idx
          })

          const hasHeader = Object.keys(headerMap).length > 0
          const startRow = hasHeader ? 1 : 0

          for (let rowIdx = startRow; rowIdx < rows.length; rowIdx++) {
            const row = rows[rowIdx] as string[]
            const name = hasHeader && headerMap.name !== undefined ? String(row[headerMap.name] ?? '').trim() : String(row[0] ?? '').trim()
            if (!name || name.length === 0 || /^\d+$/.test(name)) continue

            const email = hasHeader && headerMap.email !== undefined ? String(row[headerMap.email] ?? '').trim() : row.length > 1 ? String(row[1] ?? '').trim() : ''
            const className = hasHeader && headerMap.class !== undefined ? String(row[headerMap.class] ?? '').trim() : row.length > 2 ? String(row[2] ?? '').trim() : DEMO_CLASSES[0]!.name
            const classCode = hasHeader && headerMap.code !== undefined ? String(row[headerMap.code] ?? '').trim() : row.length > 3 ? String(row[3] ?? '').trim() : ''
            const statusRaw = hasHeader && headerMap.status !== undefined ? String(row[headerMap.status] ?? '').trim().toLowerCase() : ''
            const status = statusRaw === 'inactive' ? 'inactive' : 'active' as 'active' | 'inactive'

            parsed.push({
              id: Date.now() + parsed.length,
              name,
              email: email || name.toLowerCase().replace(/ /g, '.') + '@imported.edu',
              class: className,
              classCode: classCode || className.slice(0, 8).toUpperCase(),
              status,
              joinDate: new Date().toISOString(),
              lastActive: new Date().toISOString(),
              engagement: Math.floor(50 + Math.random() * 50),
              totalPolls: Math.floor(Math.random() * 15),
              totalQuizzes: Math.floor(Math.random() * 10),
              averageScore: Math.floor(60 + Math.random() * 40),
              avatarInitials: getInitials(name),
            })
          }
        }
        resolve(parsed)
      } catch {
        reject(new Error('Failed to parse file. Make sure it is a valid .xlsx or .csv format.'))
      }
    }
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsArrayBuffer(file)
  })
}

function parseTextFile(text: string, fileName?: string): Student[] {
  const parsed: Student[] = []

  // Try JSON
  if (fileName?.endsWith('.json') || text.trim().startsWith('[')) {
    try {
      const items = JSON.parse(text.trim())
      if (Array.isArray(items)) {
        items.forEach((item: any, i: number) => {
          const name = (item.name || item.student || '').trim()
          if (!name) return
          parsed.push({
            id: Date.now() + parsed.length,
            name,
            email: item.email || name.toLowerCase().replace(/ /g, '.') + '@imported.edu',
            class: item.class || item.class_name || DEMO_CLASSES[0]!.name,
            classCode: item.code || item.classCode || '',
            status: (item.status || 'active') as 'active' | 'inactive',
            joinDate: new Date().toISOString(),
            lastActive: new Date().toISOString(),
            engagement: Math.floor(50 + Math.random() * 50),
            totalPolls: Math.floor(Math.random() * 15),
            totalQuizzes: Math.floor(Math.random() * 10),
            averageScore: Math.floor(60 + Math.random() * 40),
            avatarInitials: getInitials(name),
          })
        })
      }
      return parsed
    } catch { /* fall through to CSV parsing */ }
  }

  // CSV / TXT parsing
  const lines = text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0)

  for (const line of lines) {
    // Try comma, tab, semicolon, pipe delimiters
    const parts = line.split(/[,\t;|]/).map((p) => p.trim())
    const name = parts[0]
    if (!name || name.length === 0 || /^\d+$/.test(name)) continue
    const email = parts[1] || ''
    const className = parts[2] || DEMO_CLASSES[0]!.name
    const classCode = parts[3] || className.slice(0, 8).toUpperCase()
    const statusRaw = (parts[4] || '').toLowerCase()
    const status = statusRaw === 'inactive' ? 'inactive' : 'active' as 'active' | 'inactive'

    parsed.push({
      id: Date.now() + parsed.length,
      name,
      email: email || name.toLowerCase().replace(/ /g, '.') + '@imported.edu',
      class: className,
      classCode,
      status,
      joinDate: new Date().toISOString(),
      lastActive: new Date().toISOString(),
      engagement: Math.floor(50 + Math.random() * 50),
      totalPolls: Math.floor(Math.random() * 15),
      totalQuizzes: Math.floor(Math.random() * 10),
      averageScore: Math.floor(60 + Math.random() * 40),
      avatarInitials: getInitials(name),
    })
  }

  return parsed
}

async function handleFileImport(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  const isSpreadsheet = !!file.name.match(/\.(xlsx|xls|xlsm|xlsb|ods)$/i)
  const isTextFile = !!file.name.match(/\.(txt|csv|json|tsv)$/i)

  if (!isSpreadsheet && !isTextFile) {
    showNotification('Unsupported file format. Use .xlsx, .csv, .txt, or .json', 'error')
    return
  }

  importStatus.value = 'parsing'

  try {
    let imported: Student[] = []

    if (isSpreadsheet) {
      imported = await parseSpreadsheet(file)
    } else {
      const text = await file.text()
      imported = parseTextFile(text, file.name)
    }

    if (imported.length === 0) {
      showNotification('No valid student records found in file', 'error')
      importStatus.value = 'idle'
      return
    }

    // Deduplicate against existing students
    const existingNames = new Set(students.value.map((s) => s.name.toLowerCase()))
    const newStudents = imported.filter((s) => !existingNames.has(s.name.toLowerCase()))
    const skipped = imported.length - newStudents.length

    if (newStudents.length > 0) {
      // Assign unique IDs
      newStudents.forEach((s, i) => { s.id = Date.now() + i })
      students.value.push(...newStudents)
    }

    importResult.value = { added: newStudents.length, skipped, total: imported.length }
    importStatus.value = 'done'
    showNotification(`Imported ${newStudents.length} student${newStudents.length !== 1 ? 's' : ''}${skipped > 0 ? ` (${skipped} skipped)` : ''}`, 'success')
  } catch (err: any) {
    showNotification(err.message || 'Failed to import file', 'error')
    importStatus.value = 'idle'
  }
}

// ── Edit ──
function openEditModal(student: Student) {
  editingStudent.value = student
  editForm.value = {
    name: student.name,
    email: student.email,
    class: student.class,
    classCode: student.classCode,
    status: student.status,
  }
  showEditModal.value = true
}

function saveEdit() {
  if (!editingStudent.value || !editForm.value.name.trim()) {
    showNotification('Name is required', 'error')
    return
  }
  const s = editingStudent.value
  s.name = editForm.value.name.trim()
  s.email = editForm.value.email.trim()
  s.class = editForm.value.class.trim()
  s.classCode = editForm.value.classCode.trim()
  s.status = editForm.value.status
  s.avatarInitials = getInitials(s.name)
  showNotification(`Updated ${s.name}`, 'success')
  showEditModal.value = false
  editingStudent.value = null
}

function closeEditModal() {
  showEditModal.value = false
  editingStudent.value = null
}

// ── Delete ──
function confirmDelete(student: Student) {
  deletingStudent.value = student
  showDeleteModal.value = true
}

function executeDelete() {
  if (!deletingStudent.value) return
  const name = deletingStudent.value.name
  students.value = students.value.filter((s) => s.id !== deletingStudent.value!.id)
  showNotification(`Removed ${name}`, 'success')
  showDeleteModal.value = false
  deletingStudent.value = null
}

function closeDeleteModal() {
  showDeleteModal.value = false
  deletingStudent.value = null
}

// ── Export ──
const exporting = ref(false)

function getExportData(source?: Student[]) {
  const list = source ?? students.value
  return list.map((s) => ({
    Name: s.name,
    Email: s.email,
    Class: s.class,
    'Class Code': s.classCode,
    Status: s.status,
    'Join Date': formatDate(s.joinDate),
    'Last Active': formatDate(s.lastActive),
    'Engagement (%)': s.engagement,
    'Avg Score (%)': s.averageScore,
    'Total Polls': s.totalPolls,
    'Total Quizzes': s.totalQuizzes,
  }))
}

function nameAndNotify(data: Record<string, any>[], format: string, filtered?: boolean) {
  const prefix = filtered ? 'filtered-' : ''
  const ext = format === 'Excel' ? 'xlsx' : format.toLowerCase()
  const fileName = `students-${prefix}export-${new Date().toISOString().slice(0, 10)}.${ext}`
  return { fileName, count: data.length, filtered } as const
}

function buildXLSX(data: Record<string, any>[], sheetName: string) {
  const ws = XLSX.utils.json_to_sheet(data)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, sheetName)
  // Auto-fit column widths
  const cols = Object.keys(data[0]!).map((key) => {
    const maxLen = Math.max(
      key.length,
      ...data.map((row) => String(row[key as keyof typeof row] || '').length),
    )
    return { wch: Math.min(maxLen + 3, 40) }
  })
  ws['!cols'] = cols
  return wb
}

function notifyExport({ count, filtered }: { count: number; filtered?: boolean }, format: string) {
  const label = filtered ? `visible ${count}` : `${count}`
  const plural = count !== 1
  showNotification(`Exported ${label} student${plural ? 's' : ''} to ${format}`, 'success')
}

function doExportXLSX(data: Record<string, any>[], filtered?: boolean) {
  const meta = nameAndNotify(data, 'Excel', filtered)
  XLSX.writeFile(buildXLSX(data, 'Students'), meta.fileName)
  notifyExport(meta, 'Excel')
}

function doExportCSV(data: Record<string, any>[], filtered?: boolean) {
  const meta = nameAndNotify(data, 'CSV', filtered)
  const ws = XLSX.utils.json_to_sheet(data)
  const csv = XLSX.utils.sheet_to_csv(ws)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', meta.fileName)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
  notifyExport(meta, 'CSV')
}

async function exportAllXLSX() {
  if (students.value.length === 0) { showNotification('No students to export', 'error'); return }
  exporting.value = true
  try { doExportXLSX(getExportData()) }
  catch { showNotification('Failed to export Excel file', 'error') }
  finally { exporting.value = false }
}

async function exportAllCSV() {
  if (students.value.length === 0) { showNotification('No students to export', 'error'); return }
  exporting.value = true
  try { doExportCSV(getExportData()) }
  catch { showNotification('Failed to export CSV file', 'error') }
  finally { exporting.value = false }
}

async function exportFilteredXLSX() {
  const list = filteredStudents.value
  if (list.length === 0) { showNotification('No matching students to export', 'error'); return }
  exporting.value = true
  try { doExportXLSX(getExportData(list), true) }
  catch { showNotification('Failed to export Excel file', 'error') }
  finally { exporting.value = false }
}

async function exportFilteredCSV() {
  const list = filteredStudents.value
  if (list.length === 0) { showNotification('No matching students to export', 'error'); return }
  exporting.value = true
  try { doExportCSV(getExportData(list), true) }
  catch { showNotification('Failed to export CSV file', 'error') }
  finally { exporting.value = false }
}

// ── Bulk Actions ──
function clearAllStudents() {
  if (students.value.length === 0) return
  students.value = []
  try { localStorage.removeItem(STORAGE_KEY) } catch { /* ignore */ }
  showNotification('All students removed', 'success')
}

// ── Auto-save on any change ──
watch(
  students,
  () => { saveStudentsToStorage() },
  { deep: true },
)

onMounted(() => {
  // Try loading saved students from localStorage first
  const saved = loadStudentsFromStorage()
  if (saved && saved.length > 0) {
    students.value = saved
  } else {
    // Fall back to demo data so the page isn't empty
    students.value = generateDemoStudents()
  }
})
</script>

<template>
  <TeacherLayout
    sidebar-active="students"
    page-title="Students"
    page-subtitle="Manage your students across all classes."
    v-model:search-value="searchQuery"
    search-placeholder="Search students..."
  >
    <template #actions>
      <div class="export-group">
        <button class="outline-button" type="button" :disabled="exporting || students.length === 0" @click="exportAllXLSX">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          <span>{{ exporting ? 'Exporting...' : 'Excel' }}</span>
        </button>
        <button class="outline-button" type="button" :disabled="exporting || students.length === 0" @click="exportAllCSV">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          <span>CSV</span>
        </button>
      </div>
      <button class="primary-button" type="button" @click="openImportModal">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
        <span>Import</span>
      </button>
      <button class="primary-button" type="button" @click="openInviteModal">
        <TeacherIcon icon="plus" :size="18" />
        <span>Invite</span>
      </button>
    </template>

    <!-- Stats -->
    <section class="stats-grid" aria-label="Student stats">
      <article class="stat-card tone-blue">
        <div class="stat-label-row"><span>Total Students</span><TeacherIcon icon="users" :size="19" /></div>
        <div class="stat-value-row"><strong>{{ statsSummary.total }}</strong></div>
      </article>
      <article class="stat-card tone-green">
        <div class="stat-label-row"><span>Active Students</span><TeacherIcon icon="check" :size="19" /></div>
        <div class="stat-value-row"><strong>{{ statsSummary.active }}</strong></div>
      </article>
      <article class="stat-card tone-blue">
        <div class="stat-label-row"><span>Avg Engagement</span><TeacherIcon icon="activity" :size="19" /></div>
        <div class="stat-value-row"><strong>{{ statsSummary.avgEngagement }}%</strong></div>
      </article>
      <article class="stat-card tone-orange">
        <div class="stat-label-row"><span>Avg Score</span><TeacherIcon icon="trophy" :size="19" /></div>
        <div class="stat-value-row"><strong>{{ statsSummary.avgScore }}%</strong></div>
      </article>
    </section>

    <!-- Filter -->
    <section class="filter-bar">
      <div class="filter-group">
        <label class="filter-label">Class</label>
        <select v-model="selectedClassFilter" class="form-select" style="min-height:36px;min-width:200px;font-size:13px;">
          <option value="all">All Classes</option>
          <option v-for="cls in classOptions.filter(c => c !== 'all')" :key="cls" :value="cls">{{ cls }}</option>
        </select>
      </div>
      <div class="filter-group">
        <label class="filter-label">Status</label>
        <div class="filter-chips">
          <button class="chip" :class="{ active: selectedStatusFilter === 'all' }" type="button" @click="selectedStatusFilter = 'all'">All</button>
          <button class="chip chip-green" :class="{ active: selectedStatusFilter === 'active' }" type="button" @click="selectedStatusFilter = 'active'">Active</button>
          <button class="chip chip-gray" :class="{ active: selectedStatusFilter === 'inactive' }" type="button" @click="selectedStatusFilter = 'inactive'">Inactive</button>
        </div>
      </div>
      <div class="filter-info">
        <span class="result-count">{{ filteredStudents.length }} student{{ filteredStudents.length !== 1 ? 's' : '' }}</span>
      </div>
    </section>

    <!-- Loading -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading students...</p>
    </div>

    <!-- Empty State -->
    <section v-else-if="filteredStudents.length === 0" class="empty-state">
      <div class="empty-icon"><TeacherIcon icon="users" :size="48" /></div>
      <h3>{{ students.length === 0 ? 'No students yet' : 'No matching students' }}</h3>
      <p v-if="students.length === 0">Import a student list or invite students to get started.</p>
      <p v-else>Try adjusting your search or filters.</p>
      <div v-if="students.length === 0" class="empty-actions" style="margin-top:16px;display:flex;gap:12px;">
        <button class="primary-button" type="button" @click="openImportModal">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          <span>Import Students</span>
        </button>
        <button class="outline-button" type="button" @click="openInviteModal">
          <TeacherIcon icon="plus" :size="18" />
          <span>Invite Student</span>
        </button>
      </div>
    </section>

    <!-- Student Table -->
    <section v-else class="table-wrapper">
      <div class="data-table">
        <div class="table-row table-heading">
          <span class="col-student">Student</span>
          <span class="col-class">Class</span>
          <span class="col-status">Status</span>
          <span class="col-engagement">Engagement</span>
          <span class="col-score">Avg Score</span>
          <span class="col-last">Last Active</span>
          <span class="col-actions">Actions</span>
        </div>
        <div v-for="student in filteredStudents" :key="student.id" class="table-row clickable" @click="viewStudentDetail(student)">
          <span class="col-student">
            <div class="student-avatar-sm">{{ student.avatarInitials }}</div>
            <div class="student-info">
              <strong>{{ student.name }}</strong>
              <span>{{ student.email }}</span>
            </div>
          </span>
          <span class="col-class">
            <code>{{ student.classCode }}</code>
            <small>{{ student.class }}</small>
          </span>
          <span class="col-status"><mark :class="student.status">{{ student.status }}</mark></span>
          <span class="col-engagement">
            <div class="engagement-bar-wrap">
              <div class="engagement-bar" :style="{ width: student.engagement + '%', background: getEngColor(student.engagement) }"></div>
              <span class="engagement-value">{{ student.engagement }}%</span>
            </div>
          </span>
          <span class="col-score"><strong :style="{ color: getEngColor(student.averageScore) }">{{ student.averageScore }}%</strong></span>
          <span class="col-last">{{ formatDate(student.lastActive) }}</span>
          <span class="col-actions">
            <div class="action-buttons">
              <button class="action-btn" type="button" title="Edit student" @click.stop="openEditModal(student)">
                <TeacherIcon icon="edit" :size="16" />
              </button>
              <button class="action-btn action-btn--delete" type="button" title="Remove student" @click.stop="confirmDelete(student)">
                <TeacherIcon icon="trash" :size="16" />
              </button>
            </div>
          </span>
        </div>
      </div>
      <div class="table-footer">
        <div class="footer-left">
          <span>Showing {{ filteredStudents.length }} of {{ students.length }} students</span>
        </div>
        <div class="footer-right">
          <div v-if="students.length > 0 && filteredStudents.length < students.length" class="export-group footer-export">
            <button class="footer-export-btn" type="button" :disabled="exporting || filteredStudents.length === 0" @click="exportFilteredXLSX" title="Export visible students as Excel">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              <span>Excel</span>
            </button>
            <button class="footer-export-btn" type="button" :disabled="exporting || filteredStudents.length === 0" @click="exportFilteredCSV" title="Export visible students as CSV">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              <span>CSV</span>
            </button>
          </div>
          <button v-if="students.length > 0" class="clear-btn" type="button" @click="clearAllStudents">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
            Clear All
          </button>
        </div>
      </div>
    </section>

    <!-- ── Import Modal ── -->
    <Teleport to="body">
      <div v-if="showImportModal" class="modal-overlay" @click.self="showImportModal = false">
        <div class="modal-container modal-sm">
          <div class="modal-header">
            <h2>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:8px;vertical-align:middle;">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              Import Students
            </h2>
            <button class="modal-close" type="button" @click="showImportModal = false"><TeacherIcon icon="x" :size="24" /></button>
          </div>
          <div class="modal-body">
            <!-- Idle state: show upload area -->
            <div v-if="importStatus === 'idle' && !importResult" class="import-upload-area">
              <div class="import-upload-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="12" y1="18" x2="12" y2="12" />
                  <polyline points="9 15 12 12 15 15" />
                </svg>
              </div>
              <p class="import-upload-title">Upload a student list</p>
              <p class="import-upload-desc">Supports .xlsx, .xls, .csv, .txt, and .json files</p>
              <button class="primary-button" type="button" @click="triggerFileImport" style="margin-top:8px;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                Choose File
              </button>
              <input ref="fileInput" type="file" accept=".txt,.csv,.tsv,.json,.xlsx,.xls,.xlsm,.xlsb,.ods" class="file-input" @change="handleFileImport" style="display:none" />

              <!-- Format tips -->
              <div class="import-tips">
                <p class="import-tips-title">Expected format:</p>
                <p class="import-tips-subtitle">CSV (one student per line):</p>
                <code class="import-tips-code">name,email,class,code,status</code>
                <code class="import-tips-code">John Doe,john@school.edu,Biology 101,BIOL-101,active</code>
                <code class="import-tips-code">Jane Smith,,Chemistry,CHEM-201,inactive</code>
                <p class="import-tips-subtitle" style="margin-top:10px;">JSON array format:</p>
                <code class="import-tips-code">[{"name":"John","email":"john@e.edu","class":"Biology"}]</code>
              </div>
            </div>

            <!-- Parsing state -->
            <div v-else-if="importStatus === 'parsing'" class="import-parsing">
              <div class="spinner" style="width:40px;height:40px;border-width:3px;margin:0 auto 16px;"></div>
              <p>Parsing file...</p>
            </div>

            <!-- Done state -->
            <div v-else-if="importResult" class="import-result">
              <div class="import-result-icon">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--green)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <p class="import-result-title">Import Complete</p>
              <div class="import-result-stats">
                <div class="import-stat-item">
                  <strong>{{ importResult.added }}</strong>
                  <span>Added</span>
                </div>
                <div class="import-stat-divider"></div>
                <div class="import-stat-item">
                  <strong>{{ importResult.skipped }}</strong>
                  <span>Skipped</span>
                </div>
                <div class="import-stat-divider"></div>
                <div class="import-stat-item">
                  <strong>{{ importResult.total }}</strong>
                  <span>Total</span>
                </div>
              </div>
              <button class="primary-button" type="button" @click="showImportModal = false" style="margin-top:16px;">Done</button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- ── Invite Modal ── -->
    <Teleport to="body">
      <div v-if="showInviteModal" class="modal-overlay" @click.self="showInviteModal = false">
        <div class="modal-container modal-sm">
          <div class="modal-header">
            <h2>Invite Student</h2>
            <button class="modal-close" type="button" @click="showInviteModal = false"><TeacherIcon icon="x" :size="24" /></button>
          </div>
          <form class="modal-body" @submit.prevent="handleInvite">
            <div class="form-group">
              <label>Student Email</label>
              <input v-model="inviteEmail" type="email" placeholder="student@university.edu" required />
            </div>
            <div class="form-group">
              <label>Assign to Class</label>
              <select v-model="inviteClass" class="form-select">
                <option v-for="cls in classOptions.filter(c => c !== 'all')" :key="cls" :value="cls">{{ cls }}</option>
              </select>
            </div>
            <div class="modal-actions">
              <button type="button" class="outline-button" @click="showInviteModal = false">Cancel</button>
              <button type="submit" class="primary-button">Send Invitation</button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>

    <!-- ── Edit Modal ── -->
    <Teleport to="body">
      <div v-if="showEditModal && editingStudent" class="modal-overlay" @click.self="closeEditModal">
        <div class="modal-container">
          <div class="modal-header">
            <h2>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:8px;vertical-align:middle;">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              Edit Student
            </h2>
            <button class="modal-close" type="button" @click="closeEditModal"><TeacherIcon icon="x" :size="24" /></button>
          </div>
          <form class="modal-body" @submit.prevent="saveEdit">
            <div class="form-row">
              <div class="form-group">
                <label>Full Name <span class="required">*</span></label>
                <input v-model="editForm.name" type="text" placeholder="e.g. John Doe" required />
              </div>
              <div class="form-group">
                <label>Email</label>
                <input v-model="editForm.email" type="email" placeholder="john@university.edu" />
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Class</label>
                <input v-model="editForm.class" type="text" placeholder="e.g. Biology 101" />
              </div>
              <div class="form-group">
                <label>Class Code</label>
                <input v-model="editForm.classCode" type="text" placeholder="e.g. BIOL-101-A" />
              </div>
            </div>
            <div class="form-group">
              <label>Status</label>
              <select v-model="editForm.status" class="form-select">
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div class="modal-actions">
              <button type="button" class="outline-button" @click="closeEditModal">Cancel</button>
              <button type="submit" class="primary-button">Save Changes</button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>

    <!-- ── Delete Confirmation Modal ── -->
    <Teleport to="body">
      <div v-if="showDeleteModal && deletingStudent" class="modal-overlay" @click.self="closeDeleteModal">
        <div class="modal-container modal-sm">
          <div class="modal-header">
            <h2>Remove Student</h2>
            <button class="modal-close" type="button" @click="closeDeleteModal"><TeacherIcon icon="x" :size="24" /></button>
          </div>
          <div class="modal-body">
            <div class="delete-content">
              <div class="delete-icon"><TeacherIcon icon="trash" :size="32" /></div>
              <p>Are you sure you want to remove <strong>{{ deletingStudent.name }}</strong>?</p>
              <p class="delete-warning">This action cannot be undone. All associated data will be permanently removed.</p>
            </div>
            <div class="modal-actions">
              <button type="button" class="outline-button" @click="closeDeleteModal">Cancel</button>
              <button type="button" class="danger-button" @click="executeDelete">Remove Student</button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- ── Detail Modal ── -->
    <Teleport to="body">
      <div v-if="showDetailModal && studentDetail" class="modal-overlay" @click.self="closeDetail">
        <div class="modal-container">
          <div class="modal-header">
            <h2>Student Profile</h2>
            <div style="display:flex;gap:8px;">
              <button class="modal-action-btn" type="button" title="Edit" @click="closeDetail; openEditModal(studentDetail)">
                <TeacherIcon icon="edit" :size="18" />
              </button>
              <button class="modal-close" type="button" @click="closeDetail"><TeacherIcon icon="x" :size="24" /></button>
            </div>
          </div>
          <div class="modal-body">
            <div class="detail-profile">
              <div class="detail-avatar">{{ studentDetail.avatarInitials }}</div>
              <div class="detail-info">
                <h3>{{ studentDetail.name }}</h3>
                <span>{{ studentDetail.email }}</span>
                <mark :class="studentDetail.status">{{ studentDetail.status }}</mark>
              </div>
            </div>
            <div class="detail-stats-grid">
              <div class="detail-stat">
                <span class="detail-stat-label">Engagement</span>
                <strong :style="{ color: getEngColor(studentDetail.engagement) }">{{ studentDetail.engagement }}%</strong>
              </div>
              <div class="detail-stat">
                <span class="detail-stat-label">Avg Score</span>
                <strong :style="{ color: getEngColor(studentDetail.averageScore) }">{{ studentDetail.averageScore }}%</strong>
              </div>
              <div class="detail-stat">
                <span class="detail-stat-label">Polls</span>
                <strong>{{ studentDetail.totalPolls }}</strong>
              </div>
              <div class="detail-stat">
                <span class="detail-stat-label">Quizzes</span>
                <strong>{{ studentDetail.totalQuizzes }}</strong>
              </div>
            </div>
            <div class="detail-meta">
              <div class="detail-meta-item"><span>Class</span><strong>{{ studentDetail.class }} ({{ studentDetail.classCode }})</strong></div>
              <div class="detail-meta-item"><span>Joined</span><strong>{{ formatDate(studentDetail.joinDate) }}</strong></div>
              <div class="detail-meta-item"><span>Last Active</span><strong>{{ formatDate(studentDetail.lastActive) }}</strong></div>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </TeacherLayout>
</template>

<style scoped>
/* ── Table ── */
.data-table { width: 100%; }
.table-row {
  display: grid;
  grid-template-columns: minmax(220px,2fr) minmax(160px,1.2fr) 80px minmax(130px,1fr) 90px 110px 80px;
  align-items: center;
  min-height: 68px;
  border-top: 1px solid #e0e4ef;
  padding: 0 20px;
  gap: 12px;
  transition: background .15s;
}
.table-row:hover { background: #f8faff; }
.table-row.clickable { cursor: pointer; }
.table-heading {
  min-height: 48px;
  background: #eef3ff;
  color: #596072;
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
}
.table-heading:hover { background: #eef3ff; }

/* ── Columns ── */
.col-student { display: flex; align-items: center; gap: 12px; }
.student-avatar-sm {
  display: grid;
  width: 36px; height: 36px;
  place-items: center;
  border-radius: 8px;
  background: var(--primary-soft);
  color: var(--primary);
  font-size: 12px;
  font-weight: 800;
  flex-shrink: 0;
}
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

/* ── Export Group ── */
.export-group { display: flex; gap: 6px; }
.export-group .outline-button { font-size: 12px; min-height: 34px; padding: 0 12px; white-space: nowrap; }
.export-group .outline-button:disabled { opacity: 0.5; cursor: not-allowed; }

/* ── Action Buttons ── */
.action-buttons { display: flex; gap: 4px; }
.action-btn {
  display: inline-grid; width: 30px; height: 30px;
  place-items: center; border: 0; border-radius: 6px;
  background: transparent; color: #646b7c;
  cursor: pointer; transition: all .15s;
}
.action-btn:hover { background: var(--primary-soft); color: var(--primary); }
.action-btn--delete:hover { background: var(--red-soft); color: var(--red); }

/* ── Table Footer ── */
.table-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 20px;
  border-top: 1px solid #e0e4ef;
  font-size: 12px;
  color: var(--muted);
}
.footer-left { min-width: 0; }
.footer-right { display: flex; align-items: center; gap: 8px; }
.footer-export { display: flex; gap: 4px; }
.footer-export-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border: 1px solid #b8d4fe;
  border-radius: 6px;
  background: transparent;
  color: var(--primary);
  padding: 6px 10px;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
  transition: all .15s;
}
.footer-export-btn:hover:not(:disabled) { background: var(--primary-soft); border-color: var(--primary); }
.footer-export-btn:disabled { opacity: .4; cursor: not-allowed; }
.clear-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: 1px solid #fca5a5;
  border-radius: 6px;
  background: transparent;
  color: var(--red);
  padding: 6px 12px;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
  transition: all .15s;
}
.clear-btn:hover { background: var(--red-soft); border-color: var(--red); }

/* ── Detail Modal ── */
.detail-profile { display: flex; align-items: center; gap: 18px; margin-bottom: 24px; }
.detail-avatar {
  display: grid; width: 64px; height: 64px;
  place-items: center; border-radius: 12px;
  background: var(--primary); color: #fff;
  font-size: 22px; font-weight: 800;
}
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
.modal-action-btn {
  display: inline-grid; width: 36px; height: 36px;
  place-items: center; border: 0; border-radius: 8px;
  background: transparent; color: var(--primary);
  cursor: pointer; transition: all .15s;
}
.modal-action-btn:hover { background: var(--primary-soft); }

/* ── Import Modal ── */
.file-input { display: none; }
.import-upload-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px 16px;
  text-align: center;
}
.import-upload-icon { color: var(--muted); opacity: .5; margin-bottom: 8px; }
.import-upload-title { font-size: 16px; font-weight: 700; color: var(--ink); margin: 0 0 4px; }
.import-upload-desc { font-size: 13px; color: var(--muted); margin: 0 0 8px; }
.import-tips {
  margin-top: 20px;
  padding: 16px;
  background: var(--surface-soft);
  border-radius: 8px;
  text-align: left;
  width: 100%;
}
.import-tips-title { font-size: 11px; font-weight: 800; text-transform: uppercase; color: var(--muted); margin: 0 0 8px; }
.import-tips-subtitle { font-size: 11px; font-weight: 700; color: var(--muted); margin: 0 0 4px; }
.import-tips-code {
  display: block;
  font-size: 12px;
  background: #f0f2f7;
  padding: 6px 10px;
  border-radius: 4px;
  color: var(--ink);
  margin-bottom: 4px;
  font-family: 'SF Mono', 'Fira Code', monospace;
  word-break: break-all;
}
.import-parsing { text-align: center; padding: 32px 16px; color: var(--muted); font-weight: 600; }
.import-result { text-align: center; padding: 16px; }
.import-result-icon { margin-bottom: 12px; }
.import-result-title { font-size: 18px; font-weight: 800; color: var(--ink); margin: 0 0 16px; }
.import-result-stats {
  display: inline-flex;
  align-items: center;
  gap: 20px;
  padding: 16px 24px;
  background: var(--surface-soft);
  border-radius: 10px;
}
.import-stat-item { display: flex; flex-direction: column; align-items: center; gap: 2px; }
.import-stat-item strong { font-size: 22px; color: var(--primary); }
.import-stat-item span { font-size: 11px; color: var(--muted); font-weight: 700; text-transform: uppercase; }
.import-stat-divider { width: 1px; height: 32px; background: #d0d6e8; }

/* ── Delete Content ── */
.delete-content { text-align: center; padding: 8px 0 16px; }
.delete-icon { color: var(--red); margin-bottom: 12px; }
.delete-content p { margin: 8px 0; font-size: 15px; color: var(--ink); }
.delete-warning { font-size: 13px !important; color: var(--muted) !important; }

/* ── Responsive ── */
@media (max-width:1280px) {
  .table-row { grid-template-columns: minmax(180px,2fr) minmax(130px,1.2fr) 80px minmax(110px,1fr) 80px 100px 70px; }
}
@media (max-width:980px) {
  .table-row { grid-template-columns: 1fr 1fr; min-height: auto; padding: 16px 20px; }
  .table-heading { display: none; }
}
@media (max-width:720px) {
  .table-row { grid-template-columns: 1fr; }
  .detail-stats-grid { grid-template-columns: repeat(2,1fr); }
}
</style>
