<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useQuizStore } from '@/stores/quizStore'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import EmptyState from '@/components/EmptyState.vue'
import ConfirmationDialog from '@/components/ConfirmationDialog.vue'
import ToastNotification from '@/components/ToastNotification.vue'

const router = useRouter()
const store = useQuizStore()

const searchQuery = ref('')
const showDeleteDialog = ref(false)
const quizToDelete = ref<string | null>(null)
const toastMessage = ref<string | null>(null)
const toastType = ref<'success' | 'error'>('success')
const filterStatus = ref<'all' | 'draft' | 'published'>('all')

const filteredQuizzes = computed(() => {
  let result = store.quizzes

  // Filter by status
  if (filterStatus.value !== 'all') {
    result = result.filter((q) => q.status === filterStatus.value)
  }

  // Search
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase()
    result = result.filter(
      (quiz) =>
        quiz.title.toLowerCase().includes(q) ||
        quiz.subject.toLowerCase().includes(q) ||
        quiz.class_name.toLowerCase().includes(q),
    )
  }

  return result
})

onMounted(async () => {
  try {
    await store.fetchQuizzes()
  } catch {
    toastMessage.value = 'Failed to load quizzes.'
    toastType.value = 'error'
  }
})

function navigateToCreate() {
  router.push('/quizzes/create')
}

function editQuiz(id: string) {
  router.push(`/quizzes/${id}/edit`)
}

function viewQuestions(id: string) {
  router.push(`/quizzes/${id}/questions`)
}

function viewRankings(id: string) {
  router.push(`/quizzes/${id}/rankings`)
}

function viewReport(id: string) {
  router.push(`/quizzes/${id}/report`)
}

function confirmDelete(id: string) {
  quizToDelete.value = id
  showDeleteDialog.value = true
}

async function executeDelete() {
  if (!quizToDelete.value) return
  try {
    await store.deleteQuiz(quizToDelete.value)
    toastMessage.value = 'Quiz deleted successfully.'
    toastType.value = 'success'
  } catch {
    toastMessage.value = 'Failed to delete quiz.'
    toastType.value = 'error'
  } finally {
    showDeleteDialog.value = false
    quizToDelete.value = null
  }
}

function getStatusBadgeClasses(status: string) {
  switch (status) {
    case 'draft':
      return 'badge badge--draft'
    case 'published':
      return 'badge badge--published'
    default:
      return 'badge'
  }
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function isOverdue(dueDate: string) {
  return new Date(dueDate) < new Date()
}
</script>

<template>
  <div class="quiz-dashboard">
    <!-- Background -->
    <div class="quiz-dash-bg" aria-hidden="true"></div>

    <div class="quiz-dash-container">
      <!-- ===================== HEADER ===================== -->
      <header class="dash-header">
        <div class="dash-header-left">
          <div class="dash-header-icon">
            <svg class="dash-header-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5A2.5 2.5 0 0 1 4 19.5z" />
              <line x1="8" y1="7" x2="16" y2="7" />
              <line x1="8" y1="11" x2="14" y2="11" />
              <line x1="8" y1="15" x2="12" y2="15" />
            </svg>
          </div>
          <div>
            <h1 class="dash-header-title">Quiz Dashboard</h1>
            <p class="dash-header-subtitle">Manage and monitor your classroom quizzes</p>
          </div>
        </div>
        <button class="btn btn-primary" @click="navigateToCreate">
          <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M12 5v14" /><path d="M5 12h14" />
          </svg>
          Create New Quiz
        </button>
      </header>

      <!-- ===================== STATS ROW ===================== -->
      <div class="stats-row">
        <div class="stat-card">
          <span class="stat-value">{{ store.quizzes.length }}</span>
          <span class="stat-label">Total Quizzes</span>
        </div>
        <div class="stat-card">
          <span class="stat-value">{{ store.quizzes.filter(q => q.status === 'published').length }}</span>
          <span class="stat-label">Published</span>
        </div>
        <div class="stat-card">
          <span class="stat-value">{{ store.quizzes.filter(q => q.status === 'draft').length }}</span>
          <span class="stat-label">Drafts</span>
        </div>
      </div>

      <!-- ===================== TOOLBAR ===================== -->
      <div class="dash-toolbar">
        <!-- Search -->
        <div class="search-wrapper">
          <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search quizzes by title, subject, or class..."
            class="search-input"
          />
        </div>

        <!-- Status filter -->
        <div class="filter-group" role="radiogroup" aria-label="Filter by status">
          <button
            class="filter-btn"
            :class="{ 'filter-btn--active filter-btn--all': filterStatus === 'all' }"
            @click="filterStatus = 'all'"
          >
            All
          </button>
          <button
            class="filter-btn"
            :class="{ 'filter-btn--active filter-btn--draft': filterStatus === 'draft' }"
            @click="filterStatus = 'draft'"
          >
            Draft
          </button>
          <button
            class="filter-btn"
            :class="{ 'filter-btn--active filter-btn--published': filterStatus === 'published' }"
            @click="filterStatus = 'published'"
          >
            Published
          </button>
        </div>
      </div>

      <!-- ===================== QUIZ LIST ===================== -->
      <LoadingSpinner v-if="store.loading && store.quizzes.length === 0" />

      <EmptyState
        v-else-if="store.quizzes.length === 0"
        title="No quizzes yet"
        description="Create your first quiz to engage with your students."
        icon="📝"
      >
        <button class="btn btn-primary mt-4" @click="navigateToCreate">
          + Create Quiz
        </button>
      </EmptyState>

      <EmptyState
        v-else-if="filteredQuizzes.length === 0"
        title="No results"
        description="Try a different search term or filter."
        icon="🔍"
      />

      <!-- Quiz cards grid -->
      <div v-else class="quiz-grid">
        <div
          v-for="quiz in filteredQuizzes"
          :key="quiz.id"
          class="quiz-card"
        >
          <div class="quiz-card-top">
            <div class="quiz-card-badge-row">
              <span :class="getStatusBadgeClasses(quiz.status)">
                {{ quiz.status }}
              </span>
              <span v-if="isOverdue(quiz.due_date) && quiz.status === 'published'" class="badge badge--overdue">
                Overdue
              </span>
            </div>
            <h3 class="quiz-card-title">{{ quiz.title }}</h3>
            <p v-if="quiz.description" class="quiz-card-desc">{{ quiz.description }}</p>
          </div>

          <div class="quiz-card-meta">
            <div class="meta-item">
              <svg class="meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c3 3 9 3 12 0v-5" />
              </svg>
              <span>{{ quiz.subject }}</span>
            </div>
            <div class="meta-item">
              <svg class="meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
              </svg>
              <span>{{ quiz.class_name }}</span>
            </div>
            <div class="meta-item">
              <svg class="meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
              </svg>
              <span>{{ quiz.duration }} min</span>
            </div>
            <div class="meta-item" :class="{ 'meta-item--warning': isOverdue(quiz.due_date) && quiz.status === 'published' }">
              <svg class="meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <span>{{ formatDate(quiz.due_date) }}</span>
            </div>
          </div>

          <!-- ===== MAIN ACTIONS ===== -->
          <div class="quiz-card-actions">
            <button
              class="card-action-btn card-action-btn--view"
              title="Edit quiz"
              @click="editQuiz(quiz.id)"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              Edit
            </button>
            <button
              class="card-action-btn card-action-btn--delete"
              title="Delete quiz"
              @click="confirmDelete(quiz.id)"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
              Delete
            </button>
          </div>

          <!-- ===== NAVIGATION ACTIONS ===== -->
          <div class="quiz-card-nav">
            <button
              class="nav-btn nav-btn--questions"
              title="Manage questions"
              @click="viewQuestions(quiz.id)"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              Questions
            </button>
            <button
              class="nav-btn nav-btn--rankings"
              title="View rankings"
              @click="viewRankings(quiz.id)"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5C7 4 9 6 9 8.5V15a2 2 0 0 1-2 2H4" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5C17 4 15 6 15 8.5V15a2 2 0 0 0 2 2h3" /><path d="M12 3v18" />
              </svg>
              Rankings
            </button>
            <button
              class="nav-btn nav-btn--report"
              title="Export report"
              @click="viewReport(quiz.id)"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" />
              </svg>
              Report
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Delete confirmation dialog -->
    <ConfirmationDialog
      :show="showDeleteDialog"
      title="Delete Quiz"
      message="Are you sure you want to delete this quiz? This action cannot be undone and will remove all associated questions and submissions."
      confirm-text="Delete"
      variant="danger"
      @confirm="executeDelete"
      @cancel="showDeleteDialog = false"
    />

    <!-- Toast -->
    <ToastNotification
      :message="toastMessage"
      :type="toastType"
      @close="toastMessage = null"
    />
  </div>
</template>

<style scoped>
/* ============================================================
   PAGE CONTAINER
   ============================================================ */
.quiz-dashboard {
  position: relative;
  min-height: 100vh;
  padding: 7rem 1rem 4rem;
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
}

.quiz-dash-bg {
  position: fixed;
  inset: 0;
  pointer-events: none;
  background:
    radial-gradient(ellipse 70% 50% at 50% -15%, rgba(13, 148, 136, 0.07), transparent),
    radial-gradient(ellipse 50% 40% at 20% 90%, rgba(99, 102, 241, 0.04), transparent);
  z-index: 0;
}

.quiz-dash-container {
  position: relative;
  z-index: 1;
  max-width: 1100px;
  margin: 0 auto;
}

/* ============================================================
   HEADER
   ============================================================ */
.dash-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.75rem;
  padding: 0 0.25rem;
  flex-wrap: wrap;
}

.dash-header-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.dash-header-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 52px;
  height: 52px;
  border-radius: 14px;
  background: linear-gradient(135deg, #0d9488 0%, #14b8a6 100%);
  box-shadow: 0 8px 24px rgba(13, 148, 136, 0.25);
  flex-shrink: 0;
}

.dash-header-svg {
  width: 26px;
  height: 26px;
  color: #fff;
}

.dash-header-title {
  font-size: 1.625rem;
  font-weight: 700;
  color: #1e293b;
  letter-spacing: -0.02em;
  margin: 0;
  line-height: 1.3;
}

.dash-header-subtitle {
  font-size: 0.9rem;
  color: #64748b;
  margin: 0.2rem 0 0;
  line-height: 1.4;
}

/* ============================================================
   BUTTONS
   ============================================================ */
.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.7rem 1.5rem;
  border-radius: 10px;
  font-size: 0.875rem;
  font-weight: 600;
  font-family: inherit;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  text-decoration: none;
}

.btn:focus-visible {
  outline: 2px solid #14b8a6;
  outline-offset: 2px;
}

.btn-primary {
  background: linear-gradient(135deg, #0d9488, #14b8a6);
  color: #ffffff;
  box-shadow: 0 4px 14px rgba(13, 148, 136, 0.25);
}

.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(13, 148, 136, 0.4);
  background: linear-gradient(135deg, #0f766e, #0d9488);
}

.btn-primary:active {
  transform: translateY(0);
  box-shadow: 0 2px 8px rgba(13, 148, 136, 0.3);
}

.btn-icon {
  width: 18px;
  height: 18px;
}

/* ============================================================
   STATS ROW
   ============================================================ */
.stats-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-bottom: 1.75rem;
}

.stat-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  padding: 1.25rem 1rem;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08);
}

.stat-value {
  font-size: 1.75rem;
  font-weight: 800;
  color: #0d9488;
  line-height: 1.1;
}

.stat-label {
  font-size: 0.8rem;
  font-weight: 500;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

/* ============================================================
   TOOLBAR
   ============================================================ */
.dash-toolbar {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.75rem;
  flex-wrap: wrap;
}

/* Search */
.search-wrapper {
  position: relative;
  flex: 1;
  min-width: 200px;
}

.search-icon {
  position: absolute;
  left: 13px;
  top: 50%;
  transform: translateY(-50%);
  width: 18px;
  height: 18px;
  color: #94a3b8;
  pointer-events: none;
}

.search-input {
  width: 100%;
  padding: 0.7rem 0.85rem 0.7rem 2.5rem;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  color: #1e293b;
  font-size: 0.875rem;
  font-family: inherit;
  outline: none;
  transition: all 0.2s ease;
}

.search-input::placeholder {
  color: #94a3b8;
}

.search-input:hover {
  border-color: #94a3b8;
}

.search-input:focus {
  border-color: #14b8a6;
  box-shadow: 0 0 0 3px rgba(20, 184, 166, 0.1);
}

/* Filter buttons */
.filter-group {
  display: flex;
  gap: 0.35rem;
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 0.3rem;
}

.filter-btn {
  padding: 0.45rem 1rem;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: #64748b;
  font-size: 0.8rem;
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s ease;
}

.filter-btn:hover {
  color: #475569;
}

.filter-btn--active {
  font-weight: 600;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
}

.filter-btn--all.filter-btn--active {
  background: #ffffff;
  color: #1e293b;
}

.filter-btn--draft.filter-btn--active {
  background: linear-gradient(135deg, #fef3c7, #fde68a);
  color: #92400e;
}

.filter-btn--published.filter-btn--active {
  background: linear-gradient(135deg, #d1fae5, #a7f3d0);
  color: #065f46;
}

/* ============================================================
   QUIZ GRID
   ============================================================ */
.quiz-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 1.25rem;
}

.quiz-card {
  display: flex;
  flex-direction: column;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 1.25rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.quiz-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
}

.quiz-card-top {
  flex: 1;
}

.quiz-card-badge-row {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

/* Badges */
.badge {
  display: inline-flex;
  align-items: center;
  padding: 0.2rem 0.65rem;
  border-radius: 999px;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.badge--draft {
  background: #fef3c7;
  color: #92400e;
}

.badge--published {
  background: #d1fae5;
  color: #065f46;
}

.badge--overdue {
  background: #fee2e2;
  color: #991b1b;
}

/* Card title */
.quiz-card-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 0.35rem;
  line-height: 1.35;
}

.quiz-card-desc {
  font-size: 0.85rem;
  color: #64748b;
  margin: 0 0 0.75rem;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Meta row */
.quiz-card-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem 1rem;
  margin: 0.75rem 0 1rem;
  padding-top: 0.75rem;
  border-top: 1px solid #f1f5f9;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.8rem;
  color: #64748b;
}

.meta-icon {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
  color: #94a3b8;
}

.meta-item--warning {
  color: #dc2626;
}

.meta-item--warning .meta-icon {
  color: #dc2626;
}

/* Card actions */
.quiz-card-actions {
  display: flex;
  gap: 0.5rem;
  padding-top: 0.75rem;
  border-top: 1px solid #f1f5f9;
}

.card-action-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.4rem 0.85rem;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  background: transparent;
  color: #64748b;
  font-size: 0.78rem;
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s ease;
}

.card-action-btn svg {
  width: 14px;
  height: 14px;
}

.card-action-btn:hover {
  background: #f8fafc;
}

.card-action-btn--view:hover {
  border-color: #14b8a6;
  color: #0d9488;
}

.card-action-btn--delete:hover {
  border-color: #f43f5e;
  color: #e11d48;
  background: #fef2f2;
}

/* ============================================================
   CARD NAVIGATION (Questions / Rankings / Report)
   ============================================================ */
.quiz-card-nav {
  display: flex;
  gap: 0.35rem;
  padding-top: 0.6rem;
  margin-top: 0.6rem;
  border-top: 1px dashed #e2e8f0;
}

.nav-btn {
  flex: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.3rem;
  padding: 0.35rem 0.5rem;
  border: none;
  border-radius: 7px;
  background: transparent;
  color: #64748b;
  font-size: 0.7rem;
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.nav-btn svg {
  width: 13px;
  height: 13px;
  flex-shrink: 0;
}

.nav-btn:hover {
  transform: translateY(-1px);
}

.nav-btn--questions:hover {
  background: #f0fdfa;
  color: #0d9488;
}

.nav-btn--rankings:hover {
  background: #fefce8;
  color: #a16207;
}

.nav-btn--report:hover {
  background: #f0f9ff;
  color: #0369a1;
}

/* ============================================================
   RESPONSIVE
   ============================================================ */
@media (max-width: 768px) {
  .quiz-dashboard {
    padding: 1.25rem 0.75rem 3rem;
  }

  .dash-header {
    flex-direction: column;
    align-items: stretch;
    gap: 0.75rem;
  }

  .dash-header-left {
    flex-direction: column;
    text-align: center;
    gap: 0.6rem;
  }

  .dash-header-icon {
    width: 48px;
    height: 48px;
  }

  .dash-header-svg {
    width: 24px;
    height: 24px;
  }

  .dash-header-title {
    font-size: 1.3rem;
  }

  .dash-header-subtitle {
    font-size: 0.85rem;
  }

  .btn {
    width: 100%;
    justify-content: center;
  }

  .stats-row {
    grid-template-columns: repeat(3, 1fr);
    gap: 0.6rem;
  }

  .stat-card {
    padding: 1rem 0.5rem;
  }

  .stat-value {
    font-size: 1.4rem;
  }

  .stat-label {
    font-size: 0.7rem;
  }

  .dash-toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .search-wrapper {
    min-width: 0;
  }

  .filter-group {
    align-self: stretch;
    justify-content: center;
  }

  .quiz-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 480px) {
  .quiz-dashboard {
    padding: 1rem 0.5rem 2.5rem;
  }

  .dash-header-title {
    font-size: 1.15rem;
  }

  .stats-row {
    grid-template-columns: 1fr 1fr 1fr;
    gap: 0.4rem;
  }

  .stat-card {
    padding: 0.8rem 0.4rem;
  }

  .stat-value {
    font-size: 1.25rem;
  }

  .quiz-grid {
    grid-template-columns: 1fr;
  }
}
</style>
