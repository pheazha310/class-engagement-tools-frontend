<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useClassroomQuizStore } from '@/stores/classroomQuizStore'
import { useAuthStore } from '@/stores/auth'
import type { SeededQuestion } from '@/data/quizData'

const router = useRouter()
const route = useRoute()
const store = useClassroomQuizStore()
const authStore = useAuthStore()

const quizId = route.params.quizId as string
const quiz = computed(() => store.getQuizById(quizId))

const questions = ref<SeededQuestion[]>([])
const currentIndex = ref(0)
const answers = ref<Record<string, string[]>>({})
const quizStarted = ref(false)
const quizFinished = ref(false)
const timeRemaining = ref(0)
const result = ref<{ score: number; total: number; percentage: number; status: string; passingScore: number } | null>(null)
const startTime = ref(0)
const timeTaken = ref(0)
let timerInterval: ReturnType<typeof setInterval> | null = null

const currentQuestion = computed(() => questions.value[currentIndex.value] || null)
const totalQuestions = computed(() => questions.value.length)
const progress = computed(() => totalQuestions.value > 0 ? ((currentIndex.value + 1) / totalQuestions.value) * 100 : 0)
const isCurrentQuestionAnswered = computed(() => {
  if (!currentQuestion.value) return false
  return answers.value[currentQuestion.value.id] != null
})
onMounted(() => {
  store.init()
  if (!quiz.value) {
    router.push('/classroom')
    return
  }

  questions.value = store.getQuestionsForQuiz(quizId)
  timeRemaining.value = quiz.value.duration * 60

  if (!store.currentStudentName && authStore.user?.name && authStore.user?.email?.includes('@student')) {
    store.setStudentInfo(authStore.user.name, authStore.user.school || '')
  }
})

function startQuiz() {
  quizStarted.value = true
  startTime.value = Date.now()
  // Start timer
  timerInterval = setInterval(() => {
    if (timeRemaining.value <= 1) {
      timeRemaining.value = 0
      finishQuiz()
    } else {
      timeRemaining.value -= 1
    }
  }, 1000)
}

function selectAnswer(questionId: string, choiceId: string) {
  const current = answers.value[questionId] || []
  const question = questions.value.find(q => q.id === questionId)

  if (question && question.question_type === 'multiple_answer') {
    const index = current.indexOf(choiceId)
    if (index === -1) {
      answers.value[questionId] = [...current, choiceId]
    } else {
      answers.value[questionId] = current.filter(id => id !== choiceId)
    }
  } else {
    answers.value[questionId] = [choiceId]
  }

  // Auto advance after selection for non-multiple-answer questions
  if (!question || question.question_type !== 'multiple_answer') {
    setTimeout(() => {
      if (currentIndex.value < totalQuestions.value - 1) {
        currentIndex.value++
      }
    }, 300)
  }
}

function nextQuestion() {
  if (currentIndex.value < totalQuestions.value - 1) {
    currentIndex.value++
  }
}

function prevQuestion() {
  if (currentIndex.value > 0) {
    currentIndex.value--
  }
}

function goToQuestion(index: number) {
  if (index >= 0 && index < totalQuestions.value) {
    currentIndex.value = index
  }
}

function finishQuiz() {
  if (timerInterval) {
    clearInterval(timerInterval)
    timerInterval = null
  }

  const timeTakenSeconds = Math.round((Date.now() - startTime.value) / 1000)
  timeTaken.value = timeTakenSeconds

  const answersArr = questions.value.map(q => {
    const selected = answers.value[q.id]
    return {
      questionId: q.id,
      selectedChoiceId: Array.isArray(selected) ? selected.join(',') : (selected || null),
    }
  })

  const submission = store.submitQuiz(
    quizId,
    store.currentStudentName,
    store.currentStudentClass,
    answersArr,
    timeTakenSeconds
  )

  result.value = {
    score: submission.score,
    total: submission.totalPoints,
    percentage: submission.percentage,
    status: submission.status,
    passingScore: submission.passingScore,
  }

  quizFinished.value = true
}

function viewRankings() {
  router.push(`/classroom/rankings/${quizId}`)
}

function goHome() {
  router.push('/classroom')
}

function formatTimer(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

const timerWarning = computed(() => timeRemaining.value <= 60)
const timerDanger = computed(() => timeRemaining.value <= 30)

onUnmounted(() => {
  if (timerInterval) clearInterval(timerInterval)
})
</script>

<template>
  <div class="quiz-play-page">
    <div class="quiz-play-bg" aria-hidden="true"></div>

    <div class="quiz-play-container">
      <!-- Not started - Quiz Intro -->
      <div v-if="!quizStarted && !quizFinished && quiz" class="intro-section">
        <div class="intro-card">
          <div class="intro-header">
            <div class="intro-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
            <h1 class="intro-title">{{ quiz.title }}</h1>
            <p class="intro-desc">{{ quiz.description }}</p>
          </div>

          <div class="intro-details">
            <div class="intro-detail-item">
              <span class="detail-label">Subject</span>
              <span class="detail-value">{{ quiz.subject }}</span>
            </div>
            <div class="intro-detail-item">
              <span class="detail-label">Class</span>
              <span class="detail-value">{{ quiz.class_name }}</span>
            </div>
            <div class="intro-detail-item">
              <span class="detail-label">Questions</span>
              <span class="detail-value">{{ quiz.questions.length }}</span>
            </div>
            <div class="intro-detail-item">
              <span class="detail-label">Duration</span>
              <span class="detail-value">{{ quiz.duration }} minutes</span>
            </div>
            <div class="intro-detail-item">
              <span class="detail-label">Passing Score</span>
              <span class="detail-value">{{ quiz.passing_score }}%</span>
            </div>
          </div>

          <div class="intro-student">
            <svg class="intro-student-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
            </svg>
            <span>{{ store.currentStudentName }}</span>
            <span v-if="store.currentStudentClass">· {{ store.currentStudentClass }}</span>
          </div>

          <div class="intro-actions">
            <button class="btn btn-back-quiz" @click="goHome">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
              </svg>
              Back
            </button>
            <button class="btn btn-start-quiz" @click="startQuiz">
              <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
              Start Quiz
            </button>
          </div>
        </div>
      </div>

      <!-- Quiz in progress -->
      <div v-else-if="quizStarted && !quizFinished && currentQuestion" class="quiz-active">
        <!-- Top bar -->
        <div class="quiz-top-bar">
          <div class="quiz-top-left">
            <button class="btn btn-back" @click="goHome" title="Exit quiz">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
              </svg>
            </button>
            <div class="quiz-title-bar">{{ quiz?.title }}</div>
          </div>
          <div class="quiz-top-right">
            <div class="timer-display" :class="{ 'timer-warning': timerWarning, 'timer-danger': timerDanger }">
              <svg class="timer-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
              </svg>
              {{ formatTimer(timeRemaining) }}
            </div>
            <div class="progress-text">{{ currentIndex + 1 }} / {{ totalQuestions }}</div>
          </div>
        </div>

        <!-- Progress bar -->
        <div class="progress-bar-container">
          <div class="progress-bar-fill" :style="{ width: `${progress}%` }"></div>
        </div>

        <!-- Question area -->
        <div class="question-area">
          <div class="question-number">Question {{ currentIndex + 1 }} of {{ totalQuestions }}</div>
          <h2 class="question-text">{{ currentQuestion.question_text }}</h2>
          <div class="question-points">{{ currentQuestion.points }} pts</div>

          <!-- Multiple Choice / Multiple Answer / True False -->
          <div v-if="currentQuestion.question_type === 'multiple_choice' || currentQuestion.question_type === 'multiple_answer' || currentQuestion.question_type === 'true_false'" class="choices-grid">
            <button
              v-for="choice in currentQuestion.choices"
              :key="choice.id"
              class="choice-btn"
              :class="{
                'choice-btn--selected': currentQuestion.question_type === 'multiple_answer'
                  ? (answers[currentQuestion.id] || []).includes(choice.id)
                  : answers[currentQuestion.id]?.[0] === choice.id,
                'choice-btn--checkbox': currentQuestion.question_type === 'multiple_answer'
              }"
              @click="selectAnswer(currentQuestion.id, choice.id)"
            >
              <span class="choice-letter">
                <svg v-if="currentQuestion.question_type === 'multiple_answer' && (answers[currentQuestion.id] || []).includes(choice.id)" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span v-else>{{ choice.id.toUpperCase() }}</span>
              </span>
              <span class="choice-text">{{ choice.choice_text }}</span>
            </button>
          </div>
        </div>

        <!-- Navigation -->
        <div class="nav-bar">
          <button class="btn btn-nav" @click="prevQuestion" :disabled="currentIndex === 0">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
            </svg>
            Previous
          </button>

          <div class="question-dots">
            <button
              v-for="(q, i) in questions"
              :key="q.id"
              class="dot-btn"
              :class="{
                'dot-btn--current': i === currentIndex,
                'dot-btn--answered': answers[q.id] != null,
                'dot-btn--unanswered': answers[q.id] == null && i !== currentIndex,
              }"
              @click="goToQuestion(i)"
            >
              {{ i + 1 }}
            </button>
          </div>

          <button
            v-if="currentIndex < totalQuestions - 1 || !isCurrentQuestionAnswered"
            class="btn btn-nav"
            @click="nextQuestion"
          >
            Next
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
            </svg>
          </button>
          <button
            v-else
            class="btn btn-finish"
            @click="finishQuiz"
          >
            <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            Submit Quiz
          </button>
        </div>
      </div>

      <!-- Quiz finished - Results -->
      <div v-else-if="quizFinished && result" class="results-section">
        <div class="results-card" :class="{ 'results-card--pass': result.status === 'pass', 'results-card--fail': result.status === 'fail' }">
          <div class="results-status-icon">
            <span v-if="result.status === 'pass'">🎉</span>
            <span v-else>😔</span>
          </div>

          <h1 v-if="result.status === 'pass'" class="results-title">Congratulations!</h1>
          <h1 v-else class="results-title">Keep Trying!</h1>

          <p class="results-student-name">{{ store.currentStudentName }}</p>

          <div class="score-circle">
            <svg viewBox="0 0 120 120" class="score-svg">
              <circle cx="60" cy="60" r="54" fill="none" stroke="#e2e8f0" stroke-width="8" />
              <circle
                cx="60" cy="60" r="54"
                fill="none"
                :stroke="result.status === 'pass' ? '#16a34a' : '#ef4444'"
                stroke-width="8"
                stroke-linecap="round"
                :stroke-dasharray="2 * Math.PI * 54"
                :stroke-dashoffset="2 * Math.PI * 54 * (1 - result.percentage / 100)"
                transform="rotate(-90 60 60)"
                class="score-ring"
              />
            </svg>
            <div class="score-text">
              <span class="score-number">{{ Math.round(result.percentage) }}%</span>
              <span class="score-label">{{ result.score }} / {{ result.total }} pts</span>
            </div>
          </div>

          <div class="results-details">
            <div class="result-stat">
              <span class="result-stat-label">Status</span>
              <span class="result-stat-value" :class="result.status === 'pass' ? 'text-pass' : 'text-fail'">
                {{ result.status === 'pass' ? 'Passed' : 'Failed' }}
              </span>
            </div>
            <div class="result-stat">
              <span class="result-stat-label">Time Taken</span>
              <span class="result-stat-value">{{ Math.floor(timeTaken / 60) }}m {{ timeTaken % 60 }}s</span>
            </div>
            <div class="result-stat">
              <span class="result-stat-label">Passing Score</span>
              <span class="result-stat-value">{{ result.passingScore }}%</span>
            </div>
          </div>

          <div class="results-actions">
            <button class="btn btn-primary-action" @click="viewRankings">
              <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5C7 4 9 6 9 8.5V15a2 2 0 0 1-2 2H4" />
                <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5C17 4 15 6 15 8.5V15a2 2 0 0 0 2 2h3" />
                <path d="M12 3v18" />
              </svg>
              View Rankings
            </button>
            <button class="btn btn-review" @click="router.push(`/classroom/review/${quizId}`)">
              <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              Review Answers
            </button>
            <button class="btn btn-secondary-action" @click="goHome">
              <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
              Back to Quizzes
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
.quiz-play-page {
  position: relative;
  min-height: 100vh;
  padding: 1.5rem 1rem 3rem;
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
}

.quiz-play-bg {
  position: fixed;
  inset: 0;
  pointer-events: none;
  background:
    radial-gradient(ellipse 70% 50% at 50% -15%, rgba(37, 99, 235, 0.07), transparent),
    radial-gradient(ellipse 50% 40% at 20% 90%, rgba(59, 130, 246, 0.04), transparent);
  z-index: 0;
}

.quiz-play-container {
  position: relative;
  z-index: 1;
  max-width: 600px;
  margin: 0 auto;
}

/* ============================================================
   INTRO SECTION
   ============================================================ */
.intro-section {
  display: flex;
  justify-content: center;
  padding-top: 1.5rem;
}

.intro-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 1.25rem;
  max-width: 100%;
  width: 100%;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  text-align: center;
}

.intro-header {
  margin-bottom: 0.75rem;
}

.intro-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: linear-gradient(135deg, #2563eb, #3b82f6);
  box-shadow: 0 6px 20px rgba(37, 99, 235, 0.25);
  margin-bottom: 0.75rem;
}

.intro-icon svg {
  width: 22px;
  height: 22px;
  color: #fff;
}

.intro-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 0.4rem;
}

.intro-desc {
  font-size: 0.9rem;
  color: #64748b;
  margin: 0;
  line-height: 1.4;
}

.intro-details {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.5rem;
  padding: 0.75rem;
  background: #f8fafc;
  border-radius: 10px;
  margin-bottom: 0.75rem;
}

.intro-detail-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
}

.detail-label {
  font-size: 0.65rem;
  font-weight: 600;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.detail-value {
  font-size: 0.85rem;
  font-weight: 700;
  color: #1e293b;
}

.intro-student {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.5rem;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 8px;
  font-size: 0.8rem;
  font-weight: 600;
  color: #1e40af;
  margin-bottom: 1rem;
}

.intro-student-icon {
  width: 16px;
  height: 16px;
  color: #3b82f6;
}

.intro-actions {
  display: flex;
  gap: 0.5rem;
}

.btn-back-quiz {
  flex: 1;
  padding: 0.75rem;
  background: #ffffff;
  color: #475569;
  font-size: 0.95rem;
  font-weight: 700;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: all 0.2s ease;
  font-family: inherit;
}

.btn-back-quiz:hover {
  background: #f8fafc;
  border-color: #94a3b8;
}

.btn-back-quiz svg {
  width: 18px;
  height: 18px;
}

.btn-start-quiz {
  flex: 2;
  padding: 0.75rem;
  background: linear-gradient(135deg, #2563eb, #3b82f6);
  color: #fff;
  font-size: 0.95rem;
  font-weight: 700;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: all 0.2s ease;
  box-shadow: 0 4px 14px rgba(37, 99, 235, 0.25);
  font-family: inherit;
}

.btn-start-quiz:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(37, 99, 235, 0.4);
}

.btn-icon {
  width: 18px;
  height: 18px;
}

/* ============================================================
   ACTIVE QUIZ
   ============================================================ */
.quiz-active {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.quiz-top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.6rem 0.75rem;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
}

.quiz-top-left {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.quiz-title-bar {
  font-weight: 700;
  font-size: 0.85rem;
  color: #1e293b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 200px;
}

.quiz-top-right {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.timer-display {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.4rem 0.75rem;
  background: #f1f5f9;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 700;
  font-family: 'SF Mono', 'Fira Code', monospace;
  color: #475569;
  transition: all 0.3s ease;
}

.timer-icon {
  width: 16px;
  height: 16px;
}

.timer-warning {
  background: #fef3c7;
  color: #92400e;
}

.timer-danger {
  background: #fee2e2;
  color: #991b1b;
  animation: timerPulse 0.8s ease-in-out infinite;
}

@keyframes timerPulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.65; }
}

.progress-text {
  font-size: 0.8rem;
  font-weight: 600;
  color: #64748b;
}

.btn-back {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: 1px solid #cbd5e1;
  background: #ffffff;
  color: #64748b;
  cursor: pointer;
  padding: 0;
  transition: all 0.2s ease;
}

.btn-back svg {
  width: 16px;
  height: 16px;
}

.btn-back:hover {
  border-color: #3b82f6;
  color: #2563eb;
  background: #eff6ff;
}

/* Progress bar */
.progress-bar-container {
  height: 6px;
  background: #f1f5f9;
  border-radius: 999px;
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #2563eb, #1d4ed8);
  border-radius: 999px;
  transition: width 0.3s ease;
}

/* Question area */
.question-area {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 1.25rem;
  min-height: auto;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.question-number {
  font-size: 0.75rem;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-bottom: 0.5rem;
}

.question-text {
  font-size: 1.1rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 0.4rem;
  line-height: 1.4;
}

.question-points {
  display: inline-flex;
  align-items: center;
  padding: 0.15rem 0.5rem;
  background: #eff6ff;
  color: #2563eb;
  border-radius: 6px;
  font-size: 0.7rem;
  font-weight: 600;
  margin-bottom: 0.75rem;
}

/* Choices */
.choices-grid {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.choice-btn {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  padding: 0.75rem 1rem;
  background: #ffffff;
  border: 2px solid #e2e8f0;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
  font-family: inherit;
  font-size: 0.9rem;
}

.choice-btn:hover {
  border-color: #94a3b8;
  background: #f8fafc;
}

.choice-btn--selected {
  border-color: #2563eb;
  background: #eff6ff;
  box-shadow: 0 0 0 1px rgba(37, 99, 235, 0.1);
}

.choice-letter {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  background: #f1f5f9;
  font-weight: 700;
  font-size: 0.8rem;
  color: #64748b;
  flex-shrink: 0;
  transition: all 0.2s ease;
}

.choice-btn--selected .choice-letter {
  background: #2563eb;
  color: #fff;
}

.choice-text {
  flex: 1;
  color: #334155;
  font-weight: 500;
}

.choice-check {
  color: #2563eb;
  flex-shrink: 0;
}

.choice-check svg {
  width: 18px;
  height: 18px;
}

/* Navigation bar */
.nav-bar {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
}

.question-dots {
  display: flex;
  gap: 0.25rem;
  flex: 1;
  justify-content: center;
  flex-wrap: wrap;
}

.dot-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
  background: #ffffff;
  color: #64748b;
  font-size: 0.7rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: inherit;
}

.dot-btn:hover {
  border-color: #94a3b8;
}

.dot-btn--current {
  border-color: #2563eb;
  background: #2563eb;
  color: #fff;
}

.dot-btn--answered {
  border-color: #16a34a;
  background: #d1fae5;
  color: #065f46;
}

.dot-btn--unanswered {
  border-color: #e2e8f0;
  background: #ffffff;
  color: #94a3b8;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-size: 0.8rem;
  font-weight: 600;
  font-family: inherit;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.btn-nav {
  background: #f1f5f9;
  color: #475569;
}

.btn-nav:hover:not(:disabled) {
  background: #e2e8f0;
}

.btn-nav svg {
  width: 14px;
  height: 14px;
}

.btn-finish {
  background: linear-gradient(135deg, #16a34a, #22c55e);
  color: #ffffff;
  box-shadow: 0 4px 14px rgba(22, 163, 74, 0.25);
}

.btn-finish:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(22, 163, 74, 0.4);
}

/* ============================================================
   RESULTS SECTION
   ============================================================ */
.results-section {
  display: flex;
  justify-content: center;
  padding-top: 1.5rem;
}

.results-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 1.5rem;
  max-width: 100%;
  width: 100%;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  text-align: center;
}

.results-card--pass {
  border-color: #86efac;
}

.results-card--fail {
  border-color: #fca5a5;
}

.results-status-icon {
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
}

.results-title {
  font-size: 1.5rem;
  font-weight: 800;
  color: #1e293b;
  margin: 0 0 0.25rem;
}

.results-student-name {
  font-size: 0.9rem;
  color: #64748b;
  margin: 0 0 1rem;
}

/* Score circle */
.score-circle {
  position: relative;
  width: 120px;
  height: 120px;
  margin: 0 auto 1rem;
}

.score-svg {
  width: 100%;
  height: 100%;
  transform: rotate(0deg);
}

.score-ring {
  transition: stroke-dashoffset 1s ease;
}

.score-text {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.score-number {
  font-size: 1.6rem;
  font-weight: 800;
  color: #1e293b;
  line-height: 1;
}

.score-label {
  font-size: 0.7rem;
  color: #94a3b8;
  margin-top: 0.15rem;
}

/* Result details */
.results-details {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.5rem;
  padding: 0.75rem;
  background: #f8fafc;
  border-radius: 10px;
  margin-bottom: 1rem;
}

.result-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
}

.result-stat-label {
  font-size: 0.65rem;
  font-weight: 600;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.result-stat-value {
  font-size: 0.85rem;
  font-weight: 700;
  color: #1e293b;
}

.text-pass { color: #16a34a; }
.text-fail { color: #ef4444; }

/* Results actions */
.results-actions {
  display: flex;
  flex-direction: row;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.btn-primary-action,
.btn-review,
.btn-secondary-action {
  min-width: 0;
  flex-shrink: 1;
}

.btn-primary-action {
  flex: 1;
  padding: 0.75rem;
  background: linear-gradient(135deg, #f59e0b, #facc15);
  color: #78350f;
  font-size: 0.9rem;
  font-weight: 700;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: all 0.2s ease;
  box-shadow: 0 4px 14px rgba(245, 158, 11, 0.25);
  font-family: inherit;
}

.btn-primary-action:hover {
  transform: translateY(-1px);
  box-shadow: 0 8px 24px rgba(245, 158, 11, 0.4);
}

.btn-review {
  flex: 1;
  padding: 0.75rem;
  background: #ffffff;
  color: #2563eb;
  font-size: 0.9rem;
  font-weight: 700;
  border: 2px solid #2563eb;
  border-radius: 10px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: all 0.2s ease;
  font-family: inherit;
}

.btn-review:hover {
  background: #eff6ff;
  transform: translateY(-1px);
}

.btn-secondary-action {
  flex: 1;
  padding: 0.75rem;
  background: #ffffff;
  color: #64748b;
  font-size: 0.9rem;
  font-weight: 600;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: all 0.2s ease;
  font-family: inherit;
}

.btn-secondary-action:hover {
  background: #f8fafc;
  border-color: #94a3b8;
}

/* ============================================================
   RESPONSIVE
   ============================================================ */
@media (max-width: 768px) {
  .quiz-play-page {
    padding: 1.25rem 0.75rem 2rem;
  }

  .intro-card {
    padding: 1.25rem;
  }

  .intro-details {
    grid-template-columns: repeat(2, 1fr);
  }

  .question-area {
    padding: 1rem;
  }

  .nav-bar {
    flex-wrap: wrap;
  }

  .question-dots {
    order: -1;
    width: 100%;
    justify-content: center;
  }

  .quiz-title-bar {
    max-width: 120px;
  }

  .results-details {
    grid-template-columns: repeat(3, 1fr);
  }

  .results-actions {
    flex-wrap: wrap;
  }

  .results-actions .btn {
    flex: 1 1 auto;
    min-width: 120px;
    text-align: center;
  }
}
</style>
