<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useClassroomQuizStore } from '@/stores/classroomQuizStore'
import type { SeededQuestion } from '@/data/quizData'

const router = useRouter()
const route = useRoute()
const store = useClassroomQuizStore()

const quizId = computed(() => route.params.quizId as string)
const quiz = computed(() => store.getQuizById(quizId.value))
const submission = computed(() =>
  store.submissions.find(
    s => s.quizId === quizId.value && s.studentName === store.currentStudentName
  )
)

onMounted(() => {
  store.init()
  if (!quiz.value || !submission.value) {
    router.push('/classroom')
  }
})

function getAnswerText(question: SeededQuestion, selectedChoiceId: string | null | undefined): string {
  if (!selectedChoiceId) return 'No answer'
  const choice = question.choices.find((c: { id: string; choice_text: string }) => c.id === selectedChoiceId)
  return choice ? choice.choice_text : 'No answer'
}

function getCorrectAnswerText(question: SeededQuestion): string {
  return question.correct_answer || ''
}

function isCorrect(question: SeededQuestion, selectedChoiceId: string | null | undefined): boolean {
  if (!selectedChoiceId) return false
  const choice = question.choices.find((c: { id: string; is_correct: boolean }) => c.id === selectedChoiceId)
  return choice ? choice.is_correct : false
}

function goBack() {
  router.push('/classroom')
}

function retakeQuiz() {
  router.push(`/classroom/quiz/${quizId.value}`)
}
</script>

<template>
  <div class="review-page">
    <div class="review-bg" aria-hidden="true"></div>

    <div class="review-container">
      <!-- Header -->
      <header class="review-header">
        <button class="btn-back-icon" @click="goBack" title="Back to quizzes">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
        </button>
        <div class="review-header-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        </div>
        <div>
          <h1 class="review-header-title">Review: {{ quiz?.title }}</h1>
          <p class="review-header-subtitle" v-if="submission">
            Score: {{ submission.score }} / {{ submission.totalPoints }} ({{ Math.round(submission.percentage) }}%)
          </p>
        </div>
      </header>

      <!-- Summary card -->
      <div class="summary-card" v-if="submission">
        <div class="summary-item">
          <span class="summary-label">Status</span>
          <span class="summary-value" :class="submission.status === 'pass' ? 'text-pass' : 'text-fail'">
            {{ submission.status === 'pass' ? 'Passed' : 'Failed' }}
          </span>
        </div>
        <div class="summary-item">
          <span class="summary-label">Time Taken</span>
          <span class="summary-value">{{ Math.floor(submission.timeTaken / 60) }}m {{ submission.timeTaken % 60 }}s</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">Passing Score</span>
          <span class="summary-value">{{ submission.passingScore }}%</span>
        </div>
      </div>

      <!-- Questions review -->
      <div class="questions-review">
        <div
          v-for="(question, index) in quiz?.questions"
          :key="question.id"
          class="question-review-card"
          :class="{
            'question-review-card--correct': isCorrect(
              question,
              submission?.answers.find(a => a.questionId === question.id)?.selectedChoiceId
            ),
            'question-review-card--wrong': !isCorrect(
              question,
              submission?.answers.find(a => a.questionId === question.id)?.selectedChoiceId
            ),
          }"
        >
          <div class="question-review-header">
            <span class="question-number">Question {{ index + 1 }}</span>
            <span
              class="question-status"
              :class="
                isCorrect(
                  question,
                  submission?.answers.find(a => a.questionId === question.id)?.selectedChoiceId
                )
                  ? 'status-correct'
                  : 'status-wrong'
              "
            >
              {{
                isCorrect(
                  question,
                  submission?.answers.find(a => a.questionId === question.id)?.selectedChoiceId
                )
                  ? 'Correct'
                  : 'Wrong'
              }}
            </span>
          </div>

          <h3 class="question-review-text">{{ question.question_text }}</h3>

          <div class="answers-review">
            <div class="answer-row answer-row--your">
              <span class="answer-label">Your Answer</span>
              <span class="answer-text">
                {{
                  getAnswerText(
                    question,
                    submission?.answers.find(a => a.questionId === question.id)?.selectedChoiceId
                  )
                }}
              </span>
            </div>
            <div class="answer-row answer-row--correct">
              <span class="answer-label">Correct Answer</span>
              <span class="answer-text">{{ getCorrectAnswerText(question) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="review-actions">
        <button class="btn btn-retake" @click="retakeQuiz">
          <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
          Retake Quiz
        </button>
        <button class="btn btn-back-home" @click="goBack">
          <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          Back to Quizzes
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ============================================================
   PAGE CONTAINER
   ============================================================ */
.review-page {
  position: relative;
  min-height: 100vh;
  padding: calc(68px + 3rem) 1rem 4rem;
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
}

.review-bg {
  position: fixed;
  inset: 0;
  pointer-events: none;
  background:
    radial-gradient(ellipse 70% 50% at 50% -15%, rgba(37, 99, 235, 0.06), transparent),
    radial-gradient(ellipse 50% 40% at 20% 90%, rgba(59, 130, 246, 0.04), transparent);
  z-index: 0;
}

.review-container {
  position: relative;
  z-index: 1;
  max-width: 800px;
  margin: 0 auto;
}

/* ============================================================
   HEADER
   ============================================================ */
.review-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
  padding: 0 0.25rem;
}

.btn-back-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  background: #ffffff;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s ease;
  padding: 0;
  flex-shrink: 0;
}

.btn-back-icon svg {
  width: 20px;
  height: 20px;
}

.btn-back-icon:hover {
  border-color: #3b82f6;
  color: #2563eb;
  background: #eff6ff;
}

.review-header-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: linear-gradient(135deg, #2563eb, #3b82f6);
  box-shadow: 0 6px 20px rgba(37, 99, 235, 0.25);
  flex-shrink: 0;
}

.review-header-icon svg {
  width: 22px;
  height: 22px;
  color: #fff;
}

.review-header-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
  line-height: 1.3;
}

.review-header-subtitle {
  font-size: 0.9rem;
  color: #64748b;
  margin: 0.2rem 0 0;
}

/* ============================================================
   SUMMARY CARD
   ============================================================ */
.summary-card {
  display: flex;
  gap: 1rem;
  padding: 1rem 1.25rem;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  margin-bottom: 1.5rem;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
}

.summary-item {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  flex: 1;
}

.summary-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.summary-value {
  font-size: 1.1rem;
  font-weight: 700;
  color: #1e293b;
}

.text-pass {
  color: #16a34a;
}

.text-fail {
  color: #ef4444;
}

/* ============================================================
   QUESTIONS REVIEW
   ============================================================ */
.question-review-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 1.25rem;
  margin-bottom: 1rem;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
}

.question-review-card--correct {
  border-left: 4px solid #16a34a;
}

.question-review-card--wrong {
  border-left: 4px solid #ef4444;
}

.question-review-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;
}

.question-number {
  font-size: 0.8rem;
  font-weight: 700;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.question-status {
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0.2rem 0.6rem;
  border-radius: 999px;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.status-correct {
  background: #d1fae5;
  color: #065f46;
}

.status-wrong {
  background: #fee2e2;
  color: #991b1b;
}

.question-review-text {
  font-size: 1.05rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 1rem;
  line-height: 1.5;
}

.answers-review {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.answer-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.65rem 0.85rem;
  border-radius: 8px;
  font-size: 0.9rem;
}

.answer-row--your {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
}

.answer-row--correct {
  background: #f0fdf4;
  border: 1px solid #86efac;
}

.answer-label {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #64748b;
  min-width: 100px;
}

.answer-text {
  font-weight: 600;
  color: #1e293b;
}

/* ============================================================
   ACTIONS
   ============================================================ */
.review-actions {
  display: flex;
  gap: 0.75rem;
  margin-top: 1.5rem;
  padding-top: 1.25rem;
  border-top: 1px solid #f1f5f9;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.7rem 1.25rem;
  border-radius: 10px;
  font-size: 0.9rem;
  font-weight: 600;
  font-family: inherit;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.btn-icon {
  width: 16px;
  height: 16px;
}

.btn-retake {
  background: linear-gradient(135deg, #2563eb, #3b82f6);
  color: #ffffff;
  box-shadow: 0 4px 14px rgba(37, 99, 235, 0.25);
}

.btn-retake:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(37, 99, 235, 0.4);
}

.btn-back-home {
  background: #f1f5f9;
  color: #64748b;
}

.btn-back-home:hover {
  background: #e2e8f0;
}

/* ============================================================
   RESPONSIVE
   ============================================================ */
@media (max-width: 768px) {
  .review-page {
    padding: calc(68px + 1.25rem) 0.75rem 3rem;
  }

  .review-header {
    flex-wrap: wrap;
  }

  .review-header-title {
    font-size: 1.1rem;
  }

  .summary-card {
    flex-direction: column;
    gap: 0.75rem;
  }

  .review-actions {
    flex-direction: column;
  }

  .btn {
    width: 100%;
    justify-content: center;
  }
}
</style>
