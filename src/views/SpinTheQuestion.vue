<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import Navbar from '@/components/Navbar.vue'
import StickyBottomNav from '@/components/StickyBottomNav.vue'

const router = useRouter()

const gamePhase = ref<'ready' | 'spinning' | 'selected'>('ready')

const questions = ref([
  { id: 1, text: 'What is your favorite subject and why?', category: 'Academic' },
  { id: 2, text: 'If you could have any superpower, what would it be?', category: 'Imagination' },
  { id: 3, text: 'What is the most interesting thing you learned this week?', category: 'Learning' },
  { id: 4, text: 'If you could travel anywhere, where would you go?', category: 'Travel' },
  { id: 5, text: 'What is your favorite way to help others?', category: 'Values' },
  { id: 6, text: 'Describe a challenge you overcame recently.', category: 'Personal' },
  { id: 7, text: 'What are you most proud of accomplishing?', category: 'Achievement' },
  { id: 8, text: 'If you could meet any historical figure, who would it be?', category: 'History' },
  { id: 9, text: 'What is your dream job and why?', category: 'Career' },
  { id: 10, text: 'What makes you unique?', category: 'Personal' },
  { id: 11, text: 'If you could change one thing about the world, what would it be?', category: 'Values' },
  { id: 12, text: 'What is your favorite memory from this school year?', category: 'Memories' },
])

const selectedQuestion = ref<typeof questions.value[0] | null>(null)
const wheelRotation = ref(0)
const isSpinning = ref(false)
const spinsToday = ref(12)
const engagement = ref(84)

const wheelColors = ['#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e', '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16', '#22c55e']

const spinWheel = () => {
  if (isSpinning.value) return
  isSpinning.value = true
  gamePhase.value = 'spinning'
  const randomRotation = Math.floor(Math.random() * 720) + 720
  wheelRotation.value += randomRotation
  setTimeout(() => {
    const randomIndex = Math.floor(Math.random() * questions.value.length)
    const question = questions.value[randomIndex]
    if (question) {
      selectedQuestion.value = question
    }
    isSpinning.value = false
    gamePhase.value = 'selected'
    spinsToday.value++
    engagement.value = Math.min(100, engagement.value + Math.floor(Math.random() * 5) + 1)
  }, 3000)
}

const spinAgain = () => {
  gamePhase.value = 'ready'
  selectedQuestion.value = null
}

onMounted(() => {
  // Stats are pre-populated for demo
})
</script>

<template>
  <div class="spin-the-question-page">
    <Navbar />

    <section class="activity-header">
      <div class="container">
        <div class="header-content">
          
          <div class="badge">SOCIAL-EMOTIONAL LEARNING</div>
          <div class="time-badge">5-10 Minutes</div>
          <h1 class="activity-title">Spin the Question</h1>
          <p class="activity-description">
            An interactive tool to foster classroom engagement through randomized prompts.
            Perfect for starting deep discussions or checking in after a lecture.
          </p>
        </div>
      </div>
    </section>

    <section class="main-content">
      <div class="container">
        <div class="content-wrapper">
          <div class="activity-area">
            <div class="card">
              <h2 class="card-title">
                <span class="icon">🎯</span>
                Question Wheel
              </h2>

              <div class="wheel-container">
                <div class="wheel-wrapper">
                  <div class="wheel-pointer"></div>
                  <div class="wheel" :style="{ transform: `rotate(${wheelRotation}deg)` }">
                    <div v-for="(question, index) in questions" :key="question.id" class="wheel-segment" :style="{ transform: `rotate(${(index * 360) / questions.length}deg)`, background: wheelColors[index % wheelColors.length] }">
                      <span class="segment-text">{{ question.text }}</span>
                    </div>
                  </div>
                  <button class="spin-button" :disabled="isSpinning" :class="{ 'disabled': isSpinning }" @click="spinWheel">
                    <span class="spin-text">SPIN</span>
                  </button>
                </div>
              </div>

              <div v-if="gamePhase === 'selected' && selectedQuestion" class="selected-question">
                <div class="selected-card">
                  <div class="selection-confirmed">
                    <span class="confirmed-icon">✓</span>
                    Selection Confirmed
                  </div>

                  <h2 class="selected-question-text">{{ selectedQuestion.text }}</h2>

                  <div class="action-buttons">
                    <button class="btn-next-student" @click="spinAgain">
                      Next Student
                      <span class="arrow">→</span>
                    </button>
                    <RouterLink to="/tools/icebreakers/spin-the-question/results" class="btn-view-results">
                      View Results
                      <span class="icon">📊</span>
                    </RouterLink>
                    <button class="btn-spin-again" @click="spinAgain">
                      <span class="icon">🔄</span>
                      Spin Again
                    </button>
                  </div>

                  <div class="session-info">
                    <div class="info-item">
                      <span class="info-label">TIME LIMIT</span>
                      <span class="info-value">02:00</span>
                    </div>
                    <div class="info-item">
                      <span class="info-label">QUEUE</span>
                      <span class="info-value">14/28</span>
                    </div>
                  </div>
                </div>
              </div>

              <div v-if="gamePhase === 'ready'" class="waiting-state">
                <p class="waiting-text">Click the SPIN button to select a random question!</p>
              </div>
            </div>
          </div>

          <div class="sidebar">
            <div class="instructions-card">
              <h3 class="instructions-title">
                <span class="icon">ℹ️</span>
                How to Play
              </h3>
              <div class="instructions-content">
                <ul class="instructions-list">
                  <li>
                    <span class="step-number">1</span>
                    <div class="step-content">
                      <strong>Click the SPIN button</strong>
                      <p>in the center of the wheel.</p>
                    </div>
                  </li>
                  <li>
                    <span class="step-number">2</span>
                    <div class="step-content">
                      <strong>Observe the animation</strong>
                      <p>as it selects a random engagement prompt.</p>
                    </div>
                  </li>
                  <li>
                    <span class="step-number">3</span>
                    <div class="step-content">
                      <strong>Invite a student</strong>
                      <p>to share their thoughts on the selected question.</p>
                    </div>
                  </li>
                </ul>
              </div>
            </div>

            <div class="stats-card">
              <h3 class="stats-title">
                <span class="icon">📊</span>
                Session Stats
              </h3>
              <div class="stats-grid">
                <div class="stat-item">
                  <div class="stat-value">{{ spinsToday }}</div>
                  <div class="stat-label">Spins Today</div>
                </div>
                <div class="stat-item">
                  <div class="stat-value">{{ engagement }}%</div>
                  <div class="stat-label">Engagement</div>
                </div>
              </div>
            </div>

            <div class="results-card">
              <h3 class="results-title">
                <span class="icon">📝</span>
                Previous Results
              </h3>
              <div class="results-list">
                <div class="result-item">
                  <span class="result-icon">💬</span>
                  <p class="result-text">"What is one thing you learned today?"</p>
                </div>
                <div class="result-item">
                  <span class="result-icon">💬</span>
                  <p class="result-text">"Describe your current mood using colors."</p>
                </div>
                <div class="result-item">
                  <span class="result-icon">💬</span>
                  <p class="result-text">"What's a goal you have for this week?"</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
    <StickyBottomNav
      to="/tools/icebreakers"
      label="Back to Icebreakers"
    />
  </div>
</template>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.spin-the-question-page {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  line-height: 1.6;
  color: #1f2937;
  background: #f9fafb;
  min-height: 100vh;
  padding-top: 64px;
  padding-bottom: calc(80px + env(safe-area-inset-bottom));
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

/* Activity Header */
.activity-header {
  background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
  color: white;
  padding: 60px 20px;
}

.header-content {
  max-width: 800px;
  margin: 0 auto;
}

.back-link {
  display: inline-block;
  color: rgba(255, 255, 255, 0.9);
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 20px;
  transition: color 0.3s ease;
}

.back-link:hover {
  color: white;
}

.badge {
  display: inline-block;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 16px;
}

.time-badge {
  display: inline-block;
  background: rgba(255, 255, 255, 0.15);
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
  margin-left: 12px;
  margin-bottom: 16px;
}

.activity-title {
  font-size: 42px;
  font-weight: 800;
  margin-bottom: 20px;
  line-height: 1.2;
}

.activity-description {
  font-size: 18px;
  opacity: 0.9;
  line-height: 1.6;
}

/* Main Content */
.main-content {
  padding: 60px 20px;
}

.content-wrapper {
  display: grid;
  grid-template-columns: 1fr 380px;
  gap: 32px;
  align-items: start;
}

/* Activity Area */
.activity-area {
  min-width: 0;
}

.card {
  background: white;
  border-radius: 16px;
  padding: 40px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.card-title {
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 32px;
  color: #1f2937;
  display: flex;
  align-items: center;
  gap: 12px;
}

.card-title .icon {
  font-size: 28px;
}

/* Wheel */
.wheel-container {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 40px 0;
}

.wheel-wrapper {
  position: relative;
  width: 400px;
  height: 400px;
}

.wheel-pointer {
  position: absolute;
  top: -10px;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 20px solid transparent;
  border-right: 20px solid transparent;
  border-top: 40px solid #1f2937;
  z-index: 20;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
}

.wheel {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  position: relative;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(99, 102, 241, 0.3);
  border: 8px solid #6366f1;
  transition: transform 3s cubic-bezier(0.17, 0.67, 0.12, 0.99);
}

.wheel-segment {
  position: absolute;
  width: 50%;
  height: 50%;
  top: 0;
  right: 0;
  transform-origin: bottom left;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.segment-text {
  position: absolute;
  transform: rotate(90deg) translateX(-50%);
  color: white;
  font-size: 13px;
  font-weight: 700;
  text-align: center;
  width: 120px;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.4);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.spin-button {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: white;
  border: 4px solid white;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
  cursor: pointer;
  font-weight: 800;
  font-size: 18px;
  letter-spacing: 2px;
  transition: all 0.3s ease;
  z-index: 10;
}

.spin-button:hover:not(.disabled) {
  transform: translate(-50%, -50%) scale(1.1);
  box-shadow: 0 6px 24px rgba(239, 68, 68, 0.5);
}

.spin-button.disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.spin-text {
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.selected-question {
  margin-top: 32px;
  padding-top: 32px;
  animation: fadeIn 0.5s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.selected-card {
  background: white;
  border-radius: 16px;
  padding: 40px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.selection-confirmed {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  padding: 8px 20px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 24px;
}

.confirmed-icon {
  font-size: 16px;
  font-weight: bold;
}

.selected-question-text {
  font-size: 28px;
  font-weight: 700;
  color: #1f2937;
  line-height: 1.4;
  margin-bottom: 32px;
  padding: 0 20px;
}

.action-buttons {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-bottom: 24px;
}

.btn-next-student {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 14px 32px;
  background: #6366f1;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-next-student:hover {
  background: #4f46e5;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
}

.btn-next-student .arrow {
  font-size: 18px;
}

.btn-spin-again {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 14px 32px;
  background: white;
  color: #6366f1;
  border: 2px solid #6366f1;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-spin-again:hover {
  background: #6366f1;
  color: white;
}

.btn-spin-again .icon {
  font-size: 20px;
}

.btn-view-results {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 14px 32px;
  background: #10b981;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.3s ease;
}

.btn-view-results:hover {
  background: #059669;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.btn-view-results .icon {
  font-size: 20px;
}

.session-info {
  display: flex;
  justify-content: center;
  gap: 48px;
  padding-top: 24px;
  border-top: 1px solid #e5e7eb;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: center;
}

.info-label {
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.info-value {
  font-size: 24px;
  font-weight: 800;
  color: #6366f1;
}

.waiting-state {
  text-align: center;
  padding: 40px 20px;
}

.waiting-text {
  font-size: 18px;
  color: #6b7280;
  font-style: italic;
}

.sidebar {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.instructions-card {
  background: white;
  border-radius: 16px;
  padding: 32px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border-left: 4px solid #6366f1;
}

.instructions-title {
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 20px;
  color: #1f2937;
  display: flex;
  align-items: center;
  gap: 10px;
}

.instructions-title .icon {
  font-size: 24px;
}

.instructions-list {
  list-style: none;
  padding: 0;
}

.instructions-list li {
  display: flex;
  gap: 16px;
  padding: 16px 0;
  border-bottom: 1px solid #f3f4f6;
  align-items: flex-start;
}

.instructions-list li:last-child {
  border-bottom: none;
}

.step-number {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: #6366f1;
  color: white;
  border-radius: 50%;
  font-weight: 700;
  font-size: 14px;
  flex-shrink: 0;
}

.step-content {
  flex: 1;
}

.step-content strong {
  display: block;
  color: #1f2937;
  font-size: 15px;
  margin-bottom: 4px;
}

.step-content p {
  color: #6b7280;
  font-size: 14px;
  margin: 0;
}

.stats-card {
  background: white;
  border-radius: 16px;
  padding: 32px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.stats-title {
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 20px;
  color: #1f2937;
  display: flex;
  align-items: center;
  gap: 10px;
}

.stats-title .icon {
  font-size: 24px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.stat-item {
  text-align: center;
  padding: 20px;
  background: #f9fafb;
  border-radius: 12px;
}

.stat-value {
  font-size: 32px;
  font-weight: 800;
  color: #6366f1;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 13px;
  color: #6b7280;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.results-card {
  background: white;
  border-radius: 16px;
  padding: 32px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.results-title {
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 20px;
  color: #1f2937;
  display: flex;
  align-items: center;
  gap: 10px;
}

.results-title .icon {
  font-size: 24px;
}

.results-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.result-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px;
  background: #f9fafb;
  border-radius: 8px;
  border-left: 3px solid #6366f1;
}

.result-icon {
  font-size: 20px;
  flex-shrink: 0;
}

.result-text {
  font-size: 14px;
  color: #4b5563;
  line-height: 1.5;
  margin: 0;
}

@media (max-width: 968px) {
  .content-wrapper {
    grid-template-columns: 1fr;
  }

  .sidebar {
    order: -1;
  }

  .activity-title {
    font-size: 32px;
  }

  .wheel-wrapper {
    width: 300px;
    height: 300px;
  }

  .spin-button {
    width: 90px;
    height: 90px;
    font-size: 18px;
  }
}

@media (max-width: 640px) {
  .activity-header {
    padding: 40px 20px;
  }

  .activity-title {
    font-size: 28px;
  }

  .activity-description {
    font-size: 16px;
  }

  .main-content {
    padding: 40px 20px;
  }

  .card {
    padding: 24px;
  }

  .wheel-wrapper {
    width: 280px;
    height: 280px;
  }

  .spin-button {
    width: 80px;
    height: 80px;
    font-size: 16px;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>
