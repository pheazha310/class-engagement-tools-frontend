<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useClassroomQuizStore } from '@/stores/classroomQuizStore'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const store = useClassroomQuizStore()
const authStore = useAuthStore()

const searchQuery = ref('')
const studentName = ref(store.currentStudentName || '')
const studentClass = ref(store.currentStudentClass || '')
const showNameModal = ref(false)

onMounted(() => {
  store.init()

  // For logged-in students, use their account info by default and hide the modal.
  // Only prompt if we don't already have a saved name/class.
  if (authStore.user?.name && authStore.user?.email?.includes('@student')) {
    if (!store.currentStudentName) {
      store.setStudentInfo(authStore.user.name, authStore.user.school || '')
    }
    showNameModal.value = false
  } else {
    showNameModal.value = !store.currentStudentName
  }
})

const filteredQuizzes = computed(() => {
  let result = store.quizzes
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase()
    result = result.filter(
      (quiz) =>
        quiz.title.toLowerCase().includes(q) ||
        quiz.subject.toLowerCase().includes(q) ||
        quiz.class_name.toLowerCase().includes(q)
    )
  }
  return result
})

function saveName() {
  if (!studentName.value.trim()) return
  store.setStudentInfo(studentName.value.trim(), studentClass.value.trim())
  showNameModal.value = false
}

function startQuiz(quizId: string) {
  if (!store.currentStudentName) {
    showNameModal.value = true
    return
  }
  router.push(`/classroom/quiz/${quizId}`)
}

function viewRankings(quizId: string) {
  router.push(`/classroom/rankings/${quizId}`)
}

function hasSubmitted(quizId: string): boolean {
  if (!store.currentStudentName) return false
  return store.hasStudentSubmitted(quizId, store.currentStudentName)
}

function getTotalQuestions(quizId: string): number {
  const quiz = store.getQuizById(quizId)
  return quiz ? quiz.questions.length : 0
}
</script>

<template>
  <div class="classroom-page">
    <div class="classroom-bg" aria-hidden="true"></div>

    <!-- Name registration modal -->
    <div v-if="showNameModal" class="modal-overlay">
      <div class="modal-card">
        <div class="modal-icon">👋</div>
        <h2 class="modal-title">Welcome to Classroom Quiz!</h2>
        <p class="modal-desc">Enter your name to get started</p>
        <form @submit.prevent="saveName" class="modal-form">
          <div class="form-group">
            <label class="form-label">Your Name</label>
            <input
              v-model="studentName"
              type="text"
              placeholder="e.g. John Doe"
              class="form-input"
              required
            />
          </div>
          <div class="form-group">
            <label class="form-label">Class (optional)</label>
            <input
              v-model="studentClass"
              type="text"
              placeholder="e.g. Grade 10A"
              class="form-input"
            />
          </div>
          <button type="submit" class="btn btn-primary" :disabled="!studentName.trim()">
            <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M5 12h14" /><path d="M12 5l7 7-7 7" />
            </svg>
            Start Learning
          </button>
        </form>
      </div>
    </div>

    <div class="classroom-container">
      <!-- Header -->
      <header class="classroom-header">
        <div class="classroom-header-left">
          <div class="classroom-header-icon">
            <svg class="classroom-header-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
              <path d="M6 12v5c3 3 9 3 12 0v-5" />
            </svg>
          </div>
          <div>
            <h1 class="classroom-header-title">Classroom Quiz</h1>
            <p class="classroom-header-subtitle">
              Welcome, <strong>{{ store.currentStudentName || 'Student' }}</strong>!
              Pick a quiz and test your knowledge.
            </p>
          </div>
        </div>
        <div class="classroom-header-right">
          <button class="btn btn-create-quiz" @click="router.push('/classroom/create')">
            <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 5v14" /><path d="M5 12h14" />
            </svg>
            Create Quiz
          </button>
          <span class="student-badge" @click="showNameModal = true" title="Change name">
            <svg class="badge-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            {{ store.currentStudentName }}
            <span v-if="store.currentStudentClass" class="badge-class">· {{ store.currentStudentClass }}</span>
          </span>
        </div>
      </header>

      <!-- Stats -->
      <div class="stats-row">
        <div class="stat-card">
          <span class="stat-value">{{ store.quizzes.length }}</span>
          <span class="stat-label">Available Quizzes</span>
        </div>
        <div class="stat-card">
          <span class="stat-value">{{ store.submissions.length }}</span>
          <span class="stat-label">Total Submissions</span>
        </div>
        <div class="stat-card">
          <span class="stat-value">{{ store.quizzes.reduce((acc, q) => acc + q.questions.length, 0) }}</span>
          <span class="stat-label">Total Questions</span>
        </div>
      </div>

      <!-- Search -->
      <div class="search-section">
        <div class="search-wrapper">
          <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search quizzes by title, subject, or class..."
            class="search-input"
          />
        </div>
      </div>

      <!-- Quiz grid -->
      <div v-if="filteredQuizzes.length === 0" class="empty-state">
        <div class="empty-icon">🔍</div>
        <h3 class="empty-title">No quizzes found</h3>
        <p class="empty-desc">Try a different search term.</p>
      </div>

      <div v-else class="quiz-grid">
        <div
          v-for="quiz in filteredQuizzes"
          :key="quiz.id"
          class="quiz-card"
        >
          <div class="quiz-card-top">
            <div class="quiz-card-badge-row">
              <span class="badge badge--subject">{{ quiz.subject }}</span>
              <span class="badge badge--class">{{ quiz.class_name }}</span>
            </div>
            <h3 class="quiz-card-title">{{ quiz.title }}</h3>
            <p class="quiz-card-desc">{{ quiz.description }}</p>
          </div>

          <div class="quiz-card-meta">
            <div class="meta-item">
              <svg class="meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
              </svg>
              <span>{{ quiz.duration }} min</span>
            </div>
            <div class="meta-item">
              <svg class="meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              <span>{{ getTotalQuestions(quiz.id) }} questions</span>
            </div>
            <div class="meta-item">
              <svg class="meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
              </svg>
              <span>Pass: {{ quiz.passing_score }}%</span>
            </div>
          </div>

          <div class="quiz-card-actions">
            <button
              v-if="!hasSubmitted(quiz.id)"
              class="btn btn-start"
              @click="startQuiz(quiz.id)"
            >
              <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
              Take Quiz
            </button>
            <div v-else class="completed-badge">
              <svg class="completed-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              Completed
            </div>
            <button
              class="btn btn-review-small"
              @click="router.push(`/classroom/review/${quiz.id}`)"
              v-if="hasSubmitted(quiz.id)"
              title="Review your answers"
            >
              <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              Review
            </button>
            <button
              class="btn btn-rankings"
              @click="viewRankings(quiz.id)"
            >
              <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5C7 4 9 6 9 8.5V15a2 2 0 0 1-2 2H4" />
                <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5C17 4 15 6 15 8.5V15a2 2 0 0 0 2 2h3" />
                <path d="M12 3v18" />
              </svg>
              Rankings
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ============================================================
   PAGE CONTAINER
   ============================================================ */
.classroom-page {
  position: relative;
  min-height: 100vh;
  padding: 2rem 1rem 4rem;
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
}

.classroom-bg {
  position: fixed;
  inset: 0;
  pointer-events: none;
  background:
    radial-gradient(ellipse 70% 50% at 50% -15%, rgba(20, 184, 166, 0.07), transparent),
    radial-gradient(ellipse 50% 40% at 20% 90%, rgba(99, 102, 241, 0.04), transparent);
  z-index: 0;
}

.classroom-container {
  position: relative;
  z-index: 1;
  max-width: 1100px;
  margin: 0 auto;
}

/* ============================================================
   MODAL
   ============================================================ */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
  backdrop-filter: blur(4px);
}

.modal-card {
  background: #ffffff;
  border-radius: 20px;
  padding: 2.5rem;
  max-width: 440px;
  width: 100%;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.2);
  text-align: center;
  animation: modalSlideIn 0.3s ease;
}

@keyframes modalSlideIn {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

.modal-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.modal-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 0.5rem;
}

.modal-desc {
  color: #64748b;
  margin: 0 0 1.5rem;
  font-size: 0.95rem;
}

.modal-form {
  text-align: left;
}

.form-group {
  margin-bottom: 1rem;
}

.form-label {
  display: block;
  font-size: 0.85rem;
  font-weight: 600;
  color: #475569;
  margin-bottom: 0.4rem;
}

.form-input {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  font-size: 0.95rem;
  font-family: inherit;
  outline: none;
  transition: all 0.2s ease;
  box-sizing: border-box;
}

.form-input:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

/* ============================================================
   HEADER
   ============================================================ */
.classroom-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.75rem;
  padding: 0 0.25rem;
  flex-wrap: wrap;
}

.classroom-header-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.classroom-header-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 52px;
  height: 52px;
  border-radius: 14px;
  background: linear-gradient(135deg, #2563eb 0%, #3b82f6 100%);
  box-shadow: 0 8px 24px rgba(37, 99, 235, 0.25);
  flex-shrink: 0;
}

.classroom-header-svg {
  width: 26px;
  height: 26px;
  color: #fff;
}

.classroom-header-title {
  font-size: 1.625rem;
  font-weight: 700;
  color: #1e293b;
  letter-spacing: -0.02em;
  margin: 0;
  line-height: 1.3;
}

.classroom-header-subtitle {
  font-size: 0.9rem;
  color: #64748b;
  margin: 0.2rem 0 0;
  line-height: 1.4;
}

.classroom-header-right {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.student-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 999px;
  font-size: 0.85rem;
  font-weight: 600;
  color: #1e293b;
  cursor: pointer;
  transition: all 0.2s ease;
}

.student-badge:hover {
  border-color: #2563eb;
  box-shadow: 0 2px 8px rgba(37, 99, 235, 0.12);
}

.badge-icon {
  width: 16px;
  height: 16px;
  color: #2563eb;
}

.badge-class {
  color: #94a3b8;
  font-weight: 500;
}

/* ============================================================
   STATS
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
  color: #2563eb;
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
   SEARCH
   ============================================================ */
.search-section {
  margin-bottom: 1.75rem;
}

.search-wrapper {
  position: relative;
  max-width: 500px;
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
  box-sizing: border-box;
}

.search-input::placeholder {
  color: #94a3b8;
}

.search-input:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
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
  flex-wrap: wrap;
}

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

.badge--subject {
  background: #dbeafe;
  color: #1e40af;
}

.badge--class {
  background: #fef3c7;
  color: #92400e;
}

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

/* Meta */
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

/* Actions */
.quiz-card-actions {
  display: flex;
  gap: 0.4rem;
  padding-top: 0.75rem;
  border-top: 1px solid #f1f5f9;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.45rem 0.8rem;
  border-radius: 8px;
  font-size: 0.8rem;
  font-weight: 600;
  font-family: inherit;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  text-decoration: none;
  flex: 1;
  justify-content: center;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-icon {
  width: 16px;
  height: 16px;
}

.btn-primary {
  background: linear-gradient(135deg, #2563eb, #3b82f6);
  color: #ffffff;
  box-shadow: 0 4px 14px rgba(37, 99, 235, 0.25);
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(37, 99, 235, 0.4);
}

.btn-start {
  background: linear-gradient(135deg, #2563eb, #3b82f6);
  color: #ffffff;
  box-shadow: 0 4px 14px rgba(37, 99, 235, 0.25);
  flex: 1;
  justify-content: center;
  padding: 0.5rem 0.85rem;
  font-size: 0.8rem;
}

.btn-start:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(37, 99, 235, 0.4);
}

.btn-rankings {
  background: transparent;
  color: #64748b;
  border: 1px solid #cbd5e1;
  padding: 0.45rem 0.8rem;
  font-size: 0.8rem;
}

.btn-rankings:hover {
  border-color: #f59e0b;
  color: #a16207;
  background: #fefce8;
}

.completed-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.45rem 0.8rem;
  border-radius: 8px;
  font-size: 0.8rem;
  font-weight: 600;
  background: #d1fae5;
  color: #065f46;
  flex: 1;
  justify-content: center;
}

.btn-create-quiz {
  background: linear-gradient(135deg, #2563eb, #3b82f6);
  color: #ffffff;
  box-shadow: 0 4px 14px rgba(37, 99, 235, 0.25);
  white-space: nowrap;
}

.btn-create-quiz:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(37, 99, 235, 0.4);
}

.completed-icon {
  width: 14px;
  height: 14px;
}

.btn-review-small {
  padding: 0.45rem 0.8rem;
  background: #ffffff;
  color: #2563eb;
  border: 1px solid #2563eb;
  font-size: 0.8rem;
  font-weight: 600;
  border-radius: 8px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.btn-review-small:hover {
  background: #eff6ff;
  transform: translateY(-1px);
}

/* Empty state */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  border: 2px dashed #cbd5e1;
  border-radius: 16px;
  background: #ffffff;
  text-align: center;
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.empty-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 0.5rem;
}

.empty-desc {
  font-size: 1rem;
  color: #64748b;
  margin: 0;
}

/* ============================================================
   RESPONSIVE
   ============================================================ */
@media (max-width: 768px) {
  .classroom-page {
    padding: 1.25rem 0.75rem 3rem;
  }

  .classroom-header {
    flex-direction: column;
    align-items: stretch;
    gap: 0.75rem;
  }

  .classroom-header-left {
    flex-direction: column;
    text-align: center;
    gap: 0.6rem;
  }

  .classroom-header-right {
    justify-content: center;
  }

  .classroom-header-icon {
    width: 48px;
    height: 48px;
  }

  .classroom-header-title {
    font-size: 1.3rem;
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

  .search-wrapper {
    max-width: 100%;
  }

  .quiz-grid {
    grid-template-columns: 1fr;
  }
}
</style>
