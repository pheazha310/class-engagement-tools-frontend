<script setup lang="ts">
import { ref, computed, onMounted, h, type PropType } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import teacherDashboardService, {
  type ClassConfiguration,
  type CreateClassConfigurationRequest,
} from '@/services/teacherDashboardService'
import { showNotification } from '@/utils/notifications'

const router = useRouter()
const authStore = useAuthStore()

// ── Icon system (same as TeacherDashboard) ─────────────────────────
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
  chevronLeft: ['M15 18l-6-6 6-6'],
  plus: ['M12 5v14', 'M5 12h14'],
  edit: ['M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7'],
  trash: ['M3 6h18', 'M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2'],
  more: ['M12 12h.01', 'M19 12h.01', 'M5 12h.01'],
  external: ['M14 3h7v7', 'M21 3l-9 9', 'M20 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h5'],
  cap: ['M4 10l8-4 8 4-8 4-8-4z', 'M6 12v4c2 2 10 2 12 0v-4'],
  check: ['M5 13l4 4L19 7'],
  x: ['M18 6L6 18', 'M6 6l12 12'],
  refresh: ['M23 4v6h-6', 'M1 20v-6h6', 'M3.5 9a9 9 0 0 1 14.5-3.5L23 10M1 14l5 4.5A9 9 0 0 0 20.5 15'],
  book: ['M4 19.5A2.5 2.5 0 0 1 6.5 17H20', 'M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z'],
} as const

type IconName = keyof typeof iconPaths

const IconGlyph = {
  name: 'IconGlyph',
  props: {
    icon: { type: String as PropType<IconName>, required: true },
    size: { type: [Number, String], default: 20 },
    strokeWidth: { type: Number, default: 2 },
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

// ── Data ───────────────────────────────────────────────────────────
const classes = ref<ClassConfiguration[]>([])
const loading = ref(false)
const searchQuery = ref('')

// Modal state
const showModal = ref(false)
const isEditing = ref(false)
const editingId = ref<number | null>(null)
const formData = ref<CreateClassConfigurationRequest>({
  name: '',
  class_name: '',
  subject: '',
  settings: {},
  is_active: true,
})

// Delete confirmation
const showDeleteModal = ref(false)
const deletingId = ref<number | null>(null)
const deletingName = ref('')

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

const currentHour = ref(new Date().getHours())
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

const filteredClasses = computed(() => {
  if (!searchQuery.value.trim()) return classes.value
  const q = searchQuery.value.toLowerCase()
  return classes.value.filter(
    (c) =>
      c.name.toLowerCase().includes(q) ||
      c.class_name.toLowerCase().includes(q) ||
      c.subject.toLowerCase().includes(q),
  )
})

const statsSummary = computed(() => ({
  total: classes.value.length,
  active: classes.value.filter((c) => c.is_active).length,
  subjects: new Set(classes.value.map((c) => c.subject)).size,
}))

// ── API Methods ────────────────────────────────────────────────────
async function fetchClasses() {
  loading.value = true
  try {
    const response = await teacherDashboardService.getClassConfigurations()
    classes.value = response.data || []
  } catch (err: any) {
    console.error('Failed to fetch classes:', err)
    showNotification('Failed to load classes. Using demo data.', 'error')
    // Use demo data if API fails
    classes.value = getDemoClasses()
  } finally {
    loading.value = false
  }
}

function getDemoClasses(): ClassConfiguration[] {
  return [
    {
      id: 1,
      teacher_id: 1,
      name: 'Biology 101 - Section A',
      class_name: 'BIOL-101-A',
      subject: 'Biology',
      settings: { room: 'Science Hall 301', schedule: 'Mon/Wed 9:00 AM' },
      is_active: true,
      created_at: '2024-01-15T08:00:00Z',
      updated_at: '2024-03-10T14:00:00Z',
    },
    {
      id: 2,
      teacher_id: 1,
      name: 'Advanced Chemistry',
      class_name: 'CHEM-201',
      subject: 'Chemistry',
      settings: { room: 'Lab B-12', schedule: 'Tue/Thu 11:00 AM' },
      is_active: true,
      created_at: '2024-01-20T09:00:00Z',
      updated_at: '2024-03-08T10:00:00Z',
    },
    {
      id: 3,
      teacher_id: 1,
      name: 'Introduction to Economics',
      class_name: 'ECON-101',
      subject: 'Economics',
      settings: { room: 'Business Center 205', schedule: 'Mon/Wed/Fri 1:00 PM' },
      is_active: false,
      created_at: '2024-02-01T08:00:00Z',
      updated_at: '2024-02-28T16:00:00Z',
    },
    {
      id: 4,
      teacher_id: 1,
      name: 'Physics for Engineers',
      class_name: 'PHYS-210',
      subject: 'Physics',
      settings: { room: 'Engineering Wing 105', schedule: 'Tue/Thu 2:00 PM' },
      is_active: true,
      created_at: '2024-01-10T10:00:00Z',
      updated_at: '2024-03-12T09:00:00Z',
    },
  ]
}

async function openCreateModal() {
  isEditing.value = false
  editingId.value = null
  formData.value = {
    name: '',
    class_name: '',
    subject: '',
    settings: {},
    is_active: true,
  }
  showModal.value = true
}

async function openEditModal(classItem: ClassConfiguration) {
  isEditing.value = true
  editingId.value = classItem.id
  formData.value = {
    name: classItem.name,
    class_name: classItem.class_name,
    subject: classItem.subject,
    settings: classItem.settings || {},
    is_active: classItem.is_active,
  }
  showModal.value = true
}

async function submitForm() {
  if (!formData.value.name || !formData.value.class_name || !formData.value.subject) {
    showNotification('Please fill in all required fields', 'error')
    return
  }

  loading.value = true
  try {
    if (isEditing.value && editingId.value) {
      await teacherDashboardService.updateClassConfiguration(editingId.value, formData.value)
      showNotification('Class updated successfully!', 'success')
    } else {
      await teacherDashboardService.createClassConfiguration(formData.value)
      showNotification('Class created successfully!', 'success')
    }
    showModal.value = false
    await fetchClasses()
  } catch (err: any) {
    console.error('Failed to save class:', err)
    showNotification('Failed to save class. Using local update.', 'error')
    // Local fallback
    if (isEditing.value && editingId.value) {
      const idx = classes.value.findIndex((c) => c.id === editingId.value)
      if (idx !== -1) {
        classes.value[idx] = {
          ...classes.value[idx],
          ...formData.value,
          updated_at: new Date().toISOString(),
        }
      }
    } else {
      const newClass: ClassConfiguration = {
        id: Date.now(),
        teacher_id: 1,
        ...formData.value,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      classes.value.unshift(newClass)
    }
    showModal.value = false
  } finally {
    loading.value = false
  }
}

function confirmDelete(classItem: ClassConfiguration) {
  deletingId.value = classItem.id
  deletingName.value = classItem.name
  showDeleteModal.value = true
}

async function executeDelete() {
  if (!deletingId.value) return
  loading.value = true
  try {
    await teacherDashboardService.deleteClassConfiguration(deletingId.value)
    showNotification('Class deleted successfully!', 'success')
    showDeleteModal.value = false
    await fetchClasses()
  } catch (err: any) {
    console.error('Failed to delete class:', err)
    showNotification('Failed to delete class. Removing locally.', 'error')
    classes.value = classes.value.filter((c) => c.id !== deletingId.value)
    showDeleteModal.value = false
  } finally {
    loading.value = false
    deletingId.value = null
    deletingName.value = ''
  }
}

function toggleActive(classItem: ClassConfiguration) {
  const updated = { ...classItem, is_active: !classItem.is_active, updated_at: new Date().toISOString() }
  const idx = classes.value.findIndex((c) => c.id === classItem.id)
  if (idx !== -1) {
    classes.value[idx] = updated
  }
  teacherDashboardService.updateClassConfiguration(classItem.id, { is_active: !classItem.is_active }).catch(() => {
    // revert on failure
    if (idx !== -1) classes.value[idx] = classItem
  })
}

function navigateTo(route?: string) {
  if (route) router.push(route)
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

onMounted(() => {
  fetchClasses()
})
</script>

<template>
  <div class="teacher-dashboard">
    <!-- Sidebar -->
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
          :class="{ active: item.id === 'classes' }"
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

    <!-- Main Content -->
    <section class="dashboard-workspace">
      <header class="dashboard-topbar">
        <div class="greeting-block">
          <h1>{{ getGreeting() }}, {{ teacherName }}</h1>
          <p>Manage your classes and sections.</p>
        </div>

        <label class="search-field" aria-label="Search classes">
          <IconGlyph icon="search" :size="22" />
          <input v-model="searchQuery" type="search" placeholder="Search classes..." />
        </label>

        <div class="topbar-actions">
          <button class="primary-button" type="button" @click="openCreateModal">
            <IconGlyph icon="plus" :size="18" />
            <span>New Class</span>
          </button>
          <button class="icon-button notification-button" type="button" aria-label="Notifications">
            <IconGlyph icon="bell" :size="22" />
            <span></span>
          </button>
        </div>
      </header>

      <main class="dashboard-content">
        <!-- Stats Summary -->
        <section class="stats-grid" aria-label="Classes summary">
          <article class="stat-card tone-blue">
            <div class="stat-label-row">
              <span>Total Classes</span>
              <IconGlyph icon="cap" :size="19" />
            </div>
            <div class="stat-value-row">
              <strong>{{ statsSummary.total }}</strong>
            </div>
          </article>
          <article class="stat-card tone-green">
            <div class="stat-label-row">
              <span>Active Classes</span>
              <IconGlyph icon="check" :size="19" />
            </div>
            <div class="stat-value-row">
              <strong>{{ statsSummary.active }}</strong>
            </div>
          </article>
          <article class="stat-card tone-blue">
            <div class="stat-label-row">
              <span>Subjects</span>
              <IconGlyph icon="book" :size="19" />
            </div>
            <div class="stat-value-row">
              <strong>{{ statsSummary.subjects }}</strong>
            </div>
          </article>
        </section>

        <!-- Loading State -->
        <div v-if="loading && classes.length === 0" class="loading-state">
          <div class="spinner"></div>
          <p>Loading classes...</p>
        </div>

        <!-- Classes Table -->
        <section v-else class="classes-section">
          <div class="section-title-row">
            <h2>All Classes</h2>
            <button class="outline-button" type="button" @click="fetchClasses">
              <IconGlyph icon="refresh" :size="16" />
              <span>Refresh</span>
            </button>
          </div>

          <div v-if="filteredClasses.length === 0" class="empty-state">
            <div class="empty-icon">
              <IconGlyph icon="cap" :size="48" />
            </div>
            <h3>No classes found</h3>
            <p>Get started by creating your first class.</p>
            <button class="primary-button" type="button" @click="openCreateModal">
              <IconGlyph icon="plus" :size="18" />
              <span>Create Class</span>
            </button>
          </div>

          <div v-else class="classes-table-wrapper">
            <div class="classes-table">
              <div class="classes-row classes-heading">
                <span class="col-name">Class Name</span>
                <span class="col-code">Code</span>
                <span class="col-subject">Subject</span>
                <span class="col-status">Status</span>
                <span class="col-schedule">Schedule</span>
                <span class="col-date">Created</span>
                <span class="col-actions">Actions</span>
              </div>
              <div
                v-for="classItem in filteredClasses"
                :key="classItem.id"
                class="classes-row"
                :class="{ 'inactive-row': !classItem.is_active }"
              >
                <span class="col-name">
                  <strong>{{ classItem.name }}</strong>
                </span>
                <span class="col-code">
                  <code>{{ classItem.class_name }}</code>
                </span>
                <span class="col-subject">{{ classItem.subject }}</span>
                <span class="col-status">
                  <mark :class="classItem.is_active ? 'active' : 'inactive'">
                    {{ classItem.is_active ? 'Active' : 'Inactive' }}
                  </mark>
                </span>
                <span class="col-schedule">
                  {{ (classItem.settings as any)?.schedule || '—' }}
                </span>
                <span class="col-date">{{ formatDate(classItem.created_at) }}</span>
                <span class="col-actions">
                  <div class="action-buttons">
                    <button
                      class="action-btn edit-btn"
                      type="button"
                      title="Edit class"
                      @click="openEditModal(classItem)"
                    >
                      <IconGlyph icon="edit" :size="18" />
                    </button>
                    <button
                      class="action-btn toggle-btn"
                      :class="classItem.is_active ? 'deactivate' : 'activate'"
                      type="button"
                      :title="classItem.is_active ? 'Deactivate' : 'Activate'"
                      @click="toggleActive(classItem)"
                    >
                      <IconGlyph :icon="classItem.is_active ? 'x' : 'check'" :size="18" />
                    </button>
                    <button
                      class="action-btn delete-btn"
                      type="button"
                      title="Delete class"
                      @click="confirmDelete(classItem)"
                    >
                      <IconGlyph icon="trash" :size="18" />
                    </button>
                  </div>
                </span>
              </div>
            </div>
          </div>
        </section>
      </main>
    </section>

    <!-- Create/Edit Modal -->
    <Teleport to="body">
      <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
        <div class="modal-container">
          <div class="modal-header">
            <h2>{{ isEditing ? 'Edit Class' : 'Create New Class' }}</h2>
            <button class="modal-close" type="button" @click="showModal = false">
              <IconGlyph icon="x" :size="24" />
            </button>
          </div>

          <form class="modal-body" @submit.prevent="submitForm">
            <div class="form-group">
              <label for="className">Class Name</label>
              <input
                id="className"
                v-model="formData.name"
                type="text"
                placeholder="e.g. Biology 101 - Section A"
                required
              />
            </div>

            <div class="form-group">
              <label for="classCode">Class Code</label>
              <input
                id="classCode"
                v-model="formData.class_name"
                type="text"
                placeholder="e.g. BIOL-101-A"
                required
              />
            </div>

            <div class="form-group">
              <label for="subject">Subject</label>
              <input
                id="subject"
                v-model="formData.subject"
                type="text"
                placeholder="e.g. Biology"
                required
              />
            </div>

            <div class="form-group">
              <label for="schedule">Schedule (optional)</label>
              <input
                id="schedule"
                v-model="(formData.settings as any).schedule"
                type="text"
                placeholder="e.g. Mon/Wed 9:00 AM"
              />
            </div>

            <div class="form-group">
              <label for="room">Room (optional)</label>
              <input
                id="room"
                v-model="(formData.settings as any).room"
                type="text"
                placeholder="e.g. Science Hall 301"
              />
            </div>

            <div class="form-group checkbox-group">
              <label class="checkbox-label">
                <input v-model="formData.is_active" type="checkbox" />
                <span>Active</span>
              </label>
            </div>

            <div class="modal-actions">
              <button type="button" class="outline-button" @click="showModal = false">Cancel</button>
              <button type="submit" class="primary-button" :disabled="loading">
                {{ loading ? 'Saving...' : isEditing ? 'Update Class' : 'Create Class' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>

    <!-- Delete Confirmation Modal -->
    <Teleport to="body">
      <div v-if="showDeleteModal" class="modal-overlay" @click.self="showDeleteModal = false">
        <div class="modal-container modal-sm">
          <div class="modal-header">
            <h2>Delete Class</h2>
            <button class="modal-close" type="button" @click="showDeleteModal = false">
              <IconGlyph icon="x" :size="24" />
            </button>
          </div>
          <div class="modal-body">
            <p class="delete-warning">
              Are you sure you want to delete <strong>{{ deletingName }}</strong>? This action cannot be undone.
            </p>
            <div class="modal-actions">
              <button type="button" class="outline-button" @click="showDeleteModal = false">Cancel</button>
              <button type="button" class="danger-button" @click="executeDelete" :disabled="loading">
                {{ loading ? 'Deleting...' : 'Delete' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
/* ── Base / Layout ───────────────────────────────────────────── */
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
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

button,
input,
select {
  font: inherit;
}

button {
  cursor: pointer;
}

/* ── Sidebar ─────────────────────────────────────────────────── */
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

/* ── Top Bar ─────────────────────────────────────────────────── */
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

/* ── Buttons ─────────────────────────────────────────────────── */
.outline-button,
.primary-button,
.danger-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  font-weight: 700;
  gap: 8px;
}

.outline-button {
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

.danger-button {
  min-height: 38px;
  border: 1px solid var(--red);
  background: var(--red);
  color: #ffffff;
  padding: 0 18px;
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

/* ── Content ─────────────────────────────────────────────────── */
.dashboard-content {
  width: min(100%, 1020px);
  margin: 0 auto;
  padding: 42px 32px 40px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(120px, 1fr));
  gap: 24px;
  margin-bottom: 32px;
}

.stat-card {
  min-height: 110px;
  border: 1px solid transparent;
  border-left: 4px solid var(--primary);
  border-radius: 8px;
  background: #ffffff;
  box-shadow: 0 14px 24px rgba(21, 33, 72, 0.07);
  padding: 22px 24px 18px;
}

.stat-card.tone-green {
  border-left-color: var(--green);
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
  margin-top: 18px;
}

.stat-value-row strong {
  color: var(--primary);
  font-size: 31px;
  line-height: 0.9;
}

.stat-card.tone-green .stat-value-row strong {
  color: var(--green);
}

/* ── Section ─────────────────────────────────────────────────── */
.section-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;
}

.section-title-row h2 {
  margin: 0;
  font-size: 16px;
  font-weight: 800;
}

/* ── Table ───────────────────────────────────────────────────── */
.classes-table-wrapper {
  border: 1px solid var(--line);
  border-radius: 8px;
  background: #ffffff;
  box-shadow: 0 16px 24px rgba(21, 33, 72, 0.06);
  overflow: hidden;
}

.classes-table {
  width: 100%;
}

.classes-row {
  display: grid;
  grid-template-columns: minmax(180px, 2fr) minmax(110px, 1fr) minmax(110px, 1fr) 90px minmax(150px, 1.2fr) 110px 120px;
  align-items: center;
  min-height: 72px;
  border-top: 1px solid #e0e4ef;
  padding: 0 20px;
  gap: 12px;
  transition: background 0.15s;
}

.classes-row:hover {
  background: #f8faff;
}

.classes-heading {
  min-height: 50px;
  background: #eef3ff;
  color: #596072;
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
}

.classes-heading:hover {
  background: #eef3ff;
}

.inactive-row {
  opacity: 0.65;
}

.classes-row strong {
  color: var(--primary);
  font-size: 14px;
}

.classes-row code {
  background: #eef3ff;
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 12px;
  color: var(--primary);
  font-weight: 700;
}

.col-actions {
  display: flex;
  justify-content: flex-end;
}

.action-buttons {
  display: flex;
  gap: 4px;
}

.action-btn {
  display: inline-grid;
  width: 34px;
  height: 34px;
  place-items: center;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: #646b7c;
  transition: all 0.15s;
}

.action-btn:hover {
  background: var(--primary-soft);
  color: var(--primary);
}

.action-btn.delete-btn:hover {
  background: var(--red-soft);
  color: var(--red);
}

.action-btn.toggle-btn.deactivate:hover {
  background: #fff0f0;
  color: var(--red);
}

.action-btn.toggle-btn.activate:hover {
  background: var(--green-soft);
  color: var(--green);
}

mark {
  border-radius: 999px;
  font-size: 10px;
  font-weight: 800;
  padding: 3px 9px;
  text-transform: uppercase;
}

mark.active {
  background: var(--green-soft);
  color: var(--green);
}

mark.inactive {
  background: #e8e8ee;
  color: #62687a;
}

/* ── Loading & Empty State ───────────────────────────────────── */
.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: #ffffff;
  gap: 12px;
}

.empty-icon {
  color: var(--muted);
  opacity: 0.4;
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

.spinner {
  width: 36px;
  height: 36px;
  border: 3px solid var(--line);
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* ── Modal ───────────────────────────────────────────────────── */
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: grid;
  place-items: center;
  background: rgba(0, 0, 0, 0.45);
  padding: 20px;
}

.modal-container {
  width: min(100%, 520px);
  border-radius: 12px;
  background: #ffffff;
  box-shadow: 0 24px 48px rgba(0, 0, 0, 0.18);
}

.modal-sm {
  width: min(100%, 420px);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24px 28px 0;
}

.modal-header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 800;
  color: var(--ink);
}

.modal-close {
  display: grid;
  width: 36px;
  height: 36px;
  place-items: center;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: #6e7687;
  transition: background 0.15s;
}

.modal-close:hover {
  background: #f0f2f7;
}

.modal-body {
  padding: 24px 28px 28px;
}

.form-group {
  margin-bottom: 18px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  font-size: 13px;
  font-weight: 700;
  color: #3e4558;
}

.form-group input[type='text'],
.form-group input[type='text'] {
  width: 100%;
  min-height: 42px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: #ffffff;
  padding: 0 14px;
  font-size: 14px;
  color: var(--ink);
  box-sizing: border-box;
  transition: border-color 0.15s;
}

.form-group input:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(0, 31, 158, 0.12);
}

.checkbox-group {
  display: flex;
  align-items: center;
}

.checkbox-label {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  color: var(--ink);
}

.checkbox-label input[type='checkbox'] {
  width: 18px;
  height: 18px;
  accent-color: var(--primary);
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
}

.delete-warning {
  margin: 6px 0 0;
  line-height: 1.6;
  color: #2a3142;
}

/* ── Responsive ──────────────────────────────────────────────── */
@media (max-width: 1280px) {
  .dashboard-content {
    width: 100%;
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

  .classes-row {
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    min-height: auto;
    padding: 16px 20px;
  }

  .classes-heading {
    display: none;
  }

  .col-actions {
    grid-column: 1 / -1;
    justify-content: flex-start;
  }
}

@media (max-width: 720px) {
  .dashboard-content {
    padding: 24px 16px;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .topbar-actions {
    display: grid;
    grid-template-columns: 1fr;
    width: 100%;
  }

  .primary-button,
  .outline-button {
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

  .classes-row {
    grid-template-columns: 1fr;
    gap: 6px;
  }
}
</style>