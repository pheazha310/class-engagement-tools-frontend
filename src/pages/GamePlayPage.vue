<script setup lang="ts">
import { ref, reactive, computed, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import CountdownTimer from '@/components/CountdownTimer.vue'
import QuestionDisplay from '@/components/QuestionDisplay.vue'
import LiveLeaderboard from '@/components/LiveLeaderboard.vue'
import { fetchGameQuestions, submitAnswer, fetchGameResults, type SubmitAnswerResponse, type GameResultResponse } from '@/services/game'
import { subscribeToGameSession, type ScoreUpdatedPayload } from '@/services/websocket'
import type { AnswerSubmission, Question, QuestionOption } from '@/types/game'

const route = useRoute()
const router = useRouter()

const joinCode = computed(() => route.params.joinCode as string)
const studentName = ref(route.query.studentName as string || '')

const gameStatus = ref<'loading' | 'waiting' | 'playing' | 'question-result' | 'finished'>('loading')
const errorMessage = ref('')
const gameType = ref('quiz-battle')
const settings = reactive<Record<string, unknown>>({ timePerQuestion: 30 })

const questions = ref<Question[]>([])
const currentIndex = ref(0)
const answers = ref<AnswerSubmission[]>([])
const score = ref(0)
const isAnswerSubmitted = ref(false)
const lastResult = ref<SubmitAnswerResponse | null>(null)
const gameResults = ref<GameResultResponse['answers']>([])
const totalGameScore = ref(0)
const totalMaxScore = ref(0)
const questionStartTime = ref(Date.now())
const gameSessionId = ref<number | null>(null)

let unsubscribeScoreUpdates: (() => void) | null = null

const currentQuestion = computed(() => questions.value[currentIndex.value] ?? null)
const timePerQuestion = computed(() => (settings.timePerQuestion as number) || 30)
const progressPercent = computed(() => {
  if (questions.value.length === 0) return 0
  return Math.round((currentIndex.value / questions.value.length) * 100)
})

const correctAnswerLabel = computed(() => {
  const q = currentQuestion.value
  if (!q || !q.options || !q.correctAnswer) return ''
  return q.options.find(o => o.id === q.correctAnswer)?.label ?? ''
})

const DEMO_QUESTIONS: Question[] = [
  {
    id: 'q1',
    text: 'What is the capital of France?',
    type: 'multiple_choice',
    options: [
      { id: 'a', label: 'London' },
      { id: 'b', label: 'Berlin' },
      { id: 'c', label: 'Paris' },
      { id: 'd', label: 'Madrid' },
    ],
    correctAnswer: 'c',
    points: 10,
  },
  {
    id: 'q2',
    text: 'Which planet is known as the Red Planet?',
    type: 'multiple_choice',
    options: [
      { id: 'a', label: 'Venus' },
      { id: 'b', label: 'Mars' },
      { id: 'c', label: 'Jupiter' },
      { id: 'd', label: 'Saturn' },
    ],
    correctAnswer: 'b',
    points: 10,
  },
  {
    id: 'q3',
    text: 'What is 7 × 8?',
    type: 'text_input',
    points: 10,
  },
  {
    id: 'q4',
    text: 'Who wrote "Romeo and Juliet"?',
    type: 'multiple_choice',
    options: [
      { id: 'a', label: 'Charles Dickens' },
      { id: 'b', label: 'William Shakespeare' },
      { id: 'c', label: 'Jane Austen' },
      { id: 'd', label: 'Mark Twain' },
    ],
    correctAnswer: 'b',
    points: 10,
  },
  {
    id: 'q5',
    text: 'What is the largest ocean on Earth?',
    type: 'multiple_choice',
    options: [
      { id: 'a', label: 'Atlantic Ocean' },
      { id: 'b', label: 'Indian Ocean' },
      { id: 'c', label: 'Arctic Ocean' },
      { id: 'd', label: 'Pacific Ocean' },
    ],
    correctAnswer: 'd',
    points: 10,
  },
]

function normalise(raw: unknown): Record<string, unknown> {
  return typeof raw === 'object' && raw !== null ? raw as Record<string, unknown> : {}
}

function readSetting(obj: Record<string, unknown>, key: string, fallback: number): number {
  const raw = obj[key]
  return typeof raw === 'number' ? raw : fallback
}

function extractGameSettings(session: Record<string, unknown>): Record<string, unknown> {
  const sessionSettings = normalise(session.settings)
  const gameTypeVal = typeof session.game_type === 'string' ? session.game_type : 'quiz-battle'
  gameType.value = gameTypeVal

  if (gameTypeVal === 'math-challenge') {
    const mathSettings = normalise(sessionSettings.math)
    return { timePerQuestion: readSetting(mathSettings, 'timePerQuestion', 30) }
  }

  if (gameTypeVal === 'vocabulary-race') {
    const vocabSettings = normalise(sessionSettings)
    return { timePerQuestion: readSetting(vocabSettings, 'timeLimit', 60) }
  }

  if (gameTypeVal === 'memory-game') {
    const memSettings = normalise(sessionSettings)
    return { timePerQuestion: readSetting(memSettings, 'timeLimit', 120) }
  }

  return { timePerQuestion: readSetting(sessionSettings, 'timePerQuestion', 30) }
}

function handleScoreUpdate(payload: ScoreUpdatedPayload) {
  const participantName = studentName.value || ''
  const matchesCurrentUser = payload.participantName === participantName

  if (matchesCurrentUser) {
    score.value = payload.score
    totalGameScore.value = payload.score
  }
}

async function subscribeToScoreUpdates() {
  try {
    if (!gameSessionId.value) return
    unsubscribeScoreUpdates = await subscribeToGameSession(
      gameSessionId.value,
      handleScoreUpdate,
    )
  } catch {
    // WebSocket connection failed, continue with HTTP-only mode
  }
}

async function resolveGameSessionId() {
  try {
    const baseUrl = typeof import.meta.env.VITE_API_URL === 'string' ? import.meta.env.VITE_API_URL.trim() : ''
    const normalizedBase = baseUrl.replace(/\/$/, '')
    const path = normalizedBase ? `${normalizedBase}/api/game-sessions/join/${encodeURIComponent(joinCode.value)}` : `/api/game-sessions/join/${encodeURIComponent(joinCode.value)}`
    const response = await fetch(path, { method: 'GET', headers: { Accept: 'application/json' } })
    if (response.ok) {
      const data = await response.json()
      const session = (data as { game_session?: Record<string, unknown> }).game_session as Record<string, unknown> | undefined
      const id = session?.id
      if (id !== undefined) {
        gameSessionId.value = typeof id === 'string' ? Number.parseInt(id, 10) : Number(id)
      }
    }
  } catch {
    // Failed to resolve game session ID, skip WebSocket subscription
  }
}

async function loadQuestions() {
  errorMessage.value = ''
  try {
    const data = await fetchGameQuestions(joinCode.value)
    questions.value = data.questions?.length ? data.questions : DEMO_QUESTIONS
    if (data.timePerQuestion) {
      settings.timePerQuestion = data.timePerQuestion
    }
    gameStatus.value = 'waiting'
  } catch {
    questions.value = DEMO_QUESTIONS
    gameStatus.value = 'waiting'
  }

  await resolveGameSessionId()
  await subscribeToScoreUpdates()
}

function startGame() {
  if (!currentQuestion.value) return
  currentIndex.value = 0
  answers.value = []
  score.value = 0
  gameResults.value = []
  totalGameScore.value = 0
  totalMaxScore.value = 0
  isAnswerSubmitted.value = false
  lastResult.value = null
  questionStartTime.value = Date.now()
  gameStatus.value = 'playing'
}

function handleAnswerSubmit(answerText: string) {
  if (!currentQuestion.value || isAnswerSubmitted.value) return

  const timeSpent = Math.round((Date.now() - questionStartTime.value) / 1000)
  const submission: AnswerSubmission = {
    questionId: currentQuestion.value.id,
    answer: answerText,
    timeSpent,
  }

  const q = currentQuestion.value
  const isCorrect =
    q.type === 'text_input'
      ? answerText.trim().toLowerCase() === (q.correctAnswer || '').toLowerCase()
      : answerText === (q.correctAnswer || '')

  totalMaxScore.value += q.points
  if (isCorrect) {
    score.value += q.points
    totalGameScore.value += q.points
  }

  answers.value.push(submission)
  gameResults.value.push({
    questionId: q.id,
    isCorrect,
    pointsEarned: isCorrect ? q.points : 0,
  })

  lastResult.value = {
    score: score.value,
    totalScore: totalMaxScore.value,
    isCorrect,
    correctAnswer: q.correctAnswer,
  }

  isAnswerSubmitted.value = true
  gameStatus.value = 'question-result'

  submitAnswer(joinCode.value, submission).then((response) => {
    if (typeof response.total_score === 'number') {
      score.value = response.total_score
      totalGameScore.value = response.total_score
    }
  }).catch(() => {})
}

function nextQuestion() {
  if (currentIndex.value >= questions.value.length - 1) {
    finishGame()
  } else {
    currentIndex.value += 1
    isAnswerSubmitted.value = false
    lastResult.value = null
    questionStartTime.value = Date.now()
    gameStatus.value = 'playing'
  }
}

async function finishGame() {
  gameStatus.value = 'finished'
  try {
    const data = await fetchGameResults(joinCode.value)
    if (data.totalScore !== undefined) score.value = data.totalScore
    if (data.maxScore !== undefined) totalMaxScore.value = data.maxScore
    if (data.answers?.length) gameResults.value = data.answers
  } catch {
    if (!totalMaxScore.value && questions.value.length) {
      totalMaxScore.value = questions.value.reduce((sum: number, q: Question) => sum + q.points, 0)
    }
  }
}

function handleTimerExpire() {
  if (gameStatus.value === 'playing' && !isAnswerSubmitted.value && currentQuestion.value) {
    handleAnswerSubmit('')
  }
}

function playAgain() {
  router.replace({ name: 'create-game' })
}

function leaveGame() {
  router.replace('/')
}

watch(joinCode, () => {
  if (joinCode.value) loadQuestions()
})

onUnmounted(() => {
  if (unsubscribeScoreUpdates) {
    unsubscribeScoreUpdates()
    unsubscribeScoreUpdates = null
  }
})
</script>

<template>
  <div class="game-play-page">
    <div class="game-play-container">
      <div class="game-play-header">
        <button v-if="gameStatus !== 'loading'" class="back-btn" @click="leaveGame">
          ← Leave Game
        </button>
        <div class="game-info">
          <span class="game-code-label">Game Code:</span>
          <span class="game-code-value">{{ joinCode }}</span>
        </div>
        <div v-if="studentName" class="player-name">Player: {{ studentName }}</div>
      </div>

      <div v-if="errorMessage" class="alert alert-error">{{ errorMessage }}</div>

      <div v-if="gameStatus === 'loading'" class="loading-state">
        <div class="loading-spinner"></div>
        <p class="loading-text">Loading questions…</p>
      </div>

      <template v-else-if="gameStatus === 'waiting'">
        <div class="game-play-layout">
          <div class="game-sidebar">
            <LiveLeaderboard
              :game-session-id="gameSessionId"
              :current-player-name="studentName || undefined"
            />
          </div>
          <div class="game-main">
            <div class="waiting-state">
              <div class="waiting-icon">
                <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <h2 class="waiting-title">Waiting for the Host</h2>
              <p class="waiting-text">Your teacher will start the game shortly. Get ready to answer!</p>
              <div class="questions-preview">
                <span class="preview-label">{{ questions.length }} question{{ questions.length !== 1 ? 's' : '' }} loaded</span>
              </div>
              <button class="btn-start" @click="startGame">Start Now (Demo)</button>
            </div>
          </div>
        </div>
      </template>

      <template v-else-if="gameStatus === 'playing' && currentQuestion">
        <div class="game-play-layout">
          <div class="game-sidebar">
            <CountdownTimer
              :seconds="timePerQuestion"
              label="Time Left"
              :size="120"
              :stroke-width="7"
              :warning-threshold="10"
              :danger-threshold="5"
              :on-expire="handleTimerExpire"
            />
            <div class="progress-section">
              <div class="progress-bar-bg">
                <div class="progress-bar-fill" :style="{ width: `${progressPercent}%` }"></div>
              </div>
              <span class="progress-text">{{ currentIndex + 1 }} / {{ questions.length }}</span>
            </div>
            <div class="score-display">
              <span class="score-label">Score</span>
              <span class="score-value">{{ score }}</span>
            </div>
            <LiveLeaderboard
              :game-session-id="gameSessionId"
              :current-player-name="studentName || undefined"
            />
          </div>

          <div class="game-main">
            <QuestionDisplay
              :question="currentQuestion"
              :question-number="currentIndex + 1"
              :total-questions="questions.length"
              :disabled="isAnswerSubmitted"
              :submitted="isAnswerSubmitted"
              @submit="handleAnswerSubmit"
            />
          </div>
        </div>
      </template>

      <template v-else-if="gameStatus === 'question-result' && currentQuestion">
        <div class="game-play-layout">
          <div class="game-sidebar">
            <LiveLeaderboard
              :game-session-id="gameSessionId"
              :current-player-name="studentName || undefined"
            />
          </div>
          <div class="game-main">
            <div class="result-state">
              <div class="result-card">
                <div class="result-icon" :class="lastResult?.isCorrect ? 'result-icon--correct' : 'result-icon--wrong'">
                  <svg v-if="lastResult?.isCorrect" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <svg v-else width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </div>
                <h2 class="result-title">{{ lastResult?.isCorrect ? 'Correct!' : 'Not quite right' }}</h2>
                <p class="result-score">+{{ currentQuestion.points }} points for this question</p>
                <div v-if="!lastResult?.isCorrect && currentQuestion.correctAnswer && currentQuestion.options" class="correct-answer">
                  <span class="correct-label">Correct answer:</span>
                  <span class="correct-value">{{ correctAnswerLabel }}</span>
                </div>
                <button class="btn-next" @click="nextQuestion">
                  {{ currentIndex < questions.length - 1 ? 'Next Question →' : 'See Results →' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </template>

      <template v-else-if="gameStatus === 'finished'">
        <div class="game-play-layout">
          <div class="game-sidebar">
            <LiveLeaderboard
              :game-session-id="gameSessionId"
              :current-player-name="studentName || undefined"
            />
          </div>
          <div class="game-main">
            <div class="results-state">
              <div class="results-card">
                <div class="results-icon">
                  <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M6 9H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2h-2" />
                    <rect x="6" y="14" width="12" height="6" rx="1" />
                    <circle cx="12" cy="20" r="1" />
                  </svg>
                </div>
                <h2 class="results-title">Game Over!</h2>
                <div class="final-score">
                  <span class="final-score-value">{{ score }}</span>
                  <span class="final-score-total">/ {{ totalMaxScore }} pts</span>
                </div>

                <div class="results-breakdown">
                  <h3 class="breakdown-title">Question Breakdown</h3>
                  <div class="breakdown-list">
                    <div
                      v-for="(item, idx) in gameResults"
                      :key="idx"
                      class="breakdown-item"
                      :class="item.isCorrect ? 'breakdown-item--correct' : 'breakdown-item--wrong'"
                    >
                      <span class="breakdown-num">Q{{ idx + 1 }}</span>
                      <span class="breakdown-status">{{ item.isCorrect ? '✓' : '✗' }}</span>
                      <span class="breakdown-points">+{{ item.pointsEarned }} pts</span>
                    </div>
                  </div>
                </div>

                <div class="results-actions">
                  <button class="btn-play-again" @click="playAgain">Play Again</button>
                  <button class="btn-leave" @click="leaveGame">Back to Home</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.game-play-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #eef2ff 0%, #e0e7ff 50%, #fae8ff 100%);
  padding: 32px 24px 48px;
}

.game-play-container {
  max-width: 960px;
  margin: 0 auto;
}

.game-play-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 12px 20px;
  background: #ffffff;
  border-radius: 14px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.back-btn {
  background: none;
  border: none;
  color: #6366f1;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  padding: 6px 12px;
  border-radius: 8px;
  transition: background 0.15s;
}

.back-btn:hover {
  background: #eef2ff;
}

.game-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.game-code-label {
  font-size: 12px;
  font-weight: 700;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.game-code-value {
  font-size: 16px;
  font-weight: 800;
  color: #0f172a;
  font-family: 'SF Mono', 'Fira Code', Consolas, monospace;
  letter-spacing: 0.12em;
}

.player-name {
  font-size: 13px;
  font-weight: 600;
  color: #6366f1;
  background: #eef2ff;
  padding: 4px 12px;
  border-radius: 999px;
}

.alert {
  padding: 14px 18px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 20px;
}

.alert-error {
  background: #fef2f2;
  color: #b91c1c;
  border: 1px solid #fecaca;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  gap: 20px;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 4px solid #e2e8f0;
  border-top-color: #6366f1;
  animation: spin 0.8s linear infinite;
}

.loading-text {
  font-size: 15px;
  font-weight: 600;
  color: #64748b;
}

.waiting-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 16px;
  padding: 64px 20px;
  background: #ffffff;
  border-radius: 20px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.07);
}

.waiting-icon {
  color: #6366f1;
  animation: pulse 2s ease-in-out infinite;
}

.waiting-title {
  font-size: 24px;
  font-weight: 800;
  color: #0f172a;
  margin: 0;
}

.waiting-text {
  font-size: 15px;
  color: #64748b;
  max-width: 400px;
  line-height: 1.5;
  margin: 0;
}

.questions-preview {
  font-size: 13px;
  font-weight: 600;
  color: #15803d;
  background: #f0fdf4;
  padding: 6px 16px;
  border-radius: 999px;
  border: 1px solid #bbf7d0;
}

.btn-start {
  margin-top: 8px;
  padding: 14px 32px;
  border: none;
  border-radius: 12px;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: #fff;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(99, 102, 241, 0.4);
  transition: transform 0.15s, box-shadow 0.15s;
}

.btn-start:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(99, 102, 241, 0.5);
}

.game-play-layout {
  display: grid;
  grid-template-columns: 200px 1fr;
  gap: 24px;
  align-items: start;
}

.game-sidebar {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  position: sticky;
  top: 88px;
}

.progress-section {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.progress-bar-bg {
  width: 100%;
  height: 8px;
  background: #e2e8f0;
  border-radius: 999px;
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #6366f1 0%, #8b5cf6 100%);
  border-radius: 999px;
  transition: width 0.4s ease;
}

.progress-text {
  font-size: 12px;
  font-weight: 700;
  color: #64748b;
  text-align: center;
}

.score-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 12px 16px;
  background: #ffffff;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  width: 100%;
}

.score-label {
  font-size: 11px;
  font-weight: 700;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.score-value {
  font-size: 24px;
  font-weight: 800;
  color: #6366f1;
}

.result-state {
  display: flex;
  justify-content: center;
  padding: 40px 20px;
}

.result-card {
  background: #ffffff;
  border-radius: 20px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.07);
  padding: 40px 32px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 16px;
  max-width: 440px;
  width: 100%;
}

.result-icon {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.result-icon--correct {
  background: #dcfce7;
  color: #15803d;
}

.result-icon--wrong {
  background: #fef2f2;
  color: #dc2626;
}

.result-title {
  font-size: 24px;
  font-weight: 800;
  color: #0f172a;
  margin: 0;
}

.result-score {
  font-size: 14px;
  font-weight: 600;
  color: #475569;
  margin: 0;
}

.correct-answer {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: #fefce8;
  border-radius: 10px;
  border: 1px solid #fef08a;
}

.correct-label {
  font-size: 13px;
  font-weight: 700;
  color: #92400e;
}

.correct-value {
  font-size: 14px;
  font-weight: 700;
  color: #78350f;
}

.btn-next {
  padding: 12px 28px;
  border: none;
  border-radius: 12px;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: #fff;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(99, 102, 241, 0.35);
  transition: transform 0.15s, box-shadow 0.15s;
}

.btn-next:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(99, 102, 241, 0.45);
}

.results-state {
  display: flex;
  justify-content: center;
  padding: 40px 20px;
}

.results-card {
  background: #ffffff;
  border-radius: 20px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.07);
  padding: 40px 32px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 20px;
  max-width: 520px;
  width: 100%;
}

.results-icon {
  color: #6366f1;
}

.results-title {
  font-size: 28px;
  font-weight: 800;
  color: #0f172a;
  margin: 0;
}

.final-score {
  display: flex;
  align-items: baseline;
  gap: 6px;
  padding: 16px 28px;
  background: #eef2ff;
  border-radius: 16px;
  border: 2px solid #c7d2fe;
}

.final-score-value {
  font-size: 48px;
  font-weight: 900;
  color: #6366f1;
  line-height: 1;
}

.final-score-total {
  font-size: 18px;
  font-weight: 700;
  color: #6366f1;
  opacity: 0.7;
}

.results-breakdown {
  width: 100%;
  text-align: left;
}

.breakdown-title {
  font-size: 14px;
  font-weight: 700;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin: 0 0 12px;
}

.breakdown-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.breakdown-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
}

.breakdown-item--correct {
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  color: #15803d;
}

.breakdown-item--wrong {
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #dc2626;
}

.breakdown-num {
  font-weight: 700;
  min-width: 28px;
}

.breakdown-status {
  font-size: 18px;
}

.breakdown-points {
  margin-left: auto;
  font-weight: 700;
}

.results-actions {
  display: flex;
  gap: 12px;
  width: 100%;
  flex-wrap: wrap;
  justify-content: center;
}

.btn-play-again {
  padding: 12px 24px;
  border: none;
  border-radius: 10px;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: #fff;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(99, 102, 241, 0.35);
  transition: transform 0.15s, box-shadow 0.15s;
}

.btn-play-again:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(99, 102, 241, 0.45);
}

.btn-leave {
  padding: 12px 24px;
  border: 1.5px solid #e2e8f0;
  border-radius: 10px;
  background: #ffffff;
  color: #475569;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-leave:hover:not(:disabled) {
  border-color: #cbd5e1;
  background: #f8fafc;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.7; transform: scale(0.96); }
}

@media (max-width: 768px) {
  .game-play-page {
    padding: 24px 16px 40px;
  }

  .game-play-header {
    padding: 10px 14px;
    gap: 10px;
  }

  .game-play-layout {
    grid-template-columns: 1fr;
  }

  .game-sidebar {
    position: static;
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: center;
  }

  .progress-section {
    width: auto;
    flex: 1;
    min-width: 140px;
  }

  .score-display {
    width: auto;
    flex-direction: row;
    gap: 8px;
    padding: 8px 14px;
  }
}

@media (max-width: 480px) {
  .back-btn {
    font-size: 13px;
  }

  .game-code-value {
    font-size: 14px;
  }

  .waiting-state {
    padding: 48px 16px;
  }

  .result-card,
  .results-card {
    padding: 28px 20px;
  }

  .final-score-value {
    font-size: 36px;
  }
}
</style>
