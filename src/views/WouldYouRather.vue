<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import Navbar from '@/components/Navbar.vue'
import StickyBottomNav from '@/components/StickyBottomNav.vue'

// Game state
const gamePhase = ref<'selecting' | 'discussing' | 'results'>('selecting')

// Current question
const currentQuestion = ref({
  id: 1,
  optionA: {
    text: '',
    image: '',
  },
  optionB: {
    text: '',
    image: '',
  },
  discussionPrompt: '',
})

// User's selection
const userSelection = ref<'A' | 'B' | null>(null)

// Image error handling
const imageErrors = ref<Set<string>>(new Set())

const handleImageError = (errorKey: string) => {
  imageErrors.value.add(errorKey)
}

// Voting results
const votes = ref({
  A: 0,
  B: 0,
})

const totalVotes = computed(() => votes.value.A + votes.value.B)

const percentageA = computed(() => {
  if (totalVotes.value === 0) return 0
  return Math.round((votes.value.A / totalVotes.value) * 100)
})

const percentageB = computed(() => {
  if (totalVotes.value === 0) return 0
  return Math.round((votes.value.B / totalVotes.value) * 100)
})

// Questions database
const questions = [
  {
    id: 1,
    optionA: {
      text: 'Have the ability to fly',
      image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop',
    },
    optionB: {
      text: 'Be invisible',
      image: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&h=600&fit=crop',
    },
    discussionPrompt: 'Why did you choose your option? Think about the practical and fun aspects of each superpower.',
  },
  {
    id: 2,
    text: '',
    optionA: {
      text: 'Explore unknown species in the deep sea floor',
      image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&h=600&fit=crop',
    },
    optionB: {
      text: 'Help build the first human civilization on a new planet',
      image: 'https://images.unsplash.com/photo-1614728853913-1e2203d9d73e?w=800&h=600&fit=crop',
    },
    discussionPrompt: 'Why did you choose Ocean Exploration over Space Settlement? Share your reasoning with the class.',
  },
  {
    id: 3,
    optionA: {
      text: 'Live in a world without music',
      image: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=800&h=600&fit=crop',
    },
    optionB: {
      text: 'Live in a world without movies',
      image: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&h=600&fit=crop',
    },
    discussionPrompt: 'Which entertainment medium is more essential to you? Discuss the role of music and movies in your life.',
  },
  {
    id: 4,
    optionA: {
      text: 'Travel to the past',
      image: 'https://images.unsplash.com/photo-1461360370896-922624d12a74?w=800&h=600&fit=crop',
    },
    optionB: {
      text: 'Travel to the future',
      image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&h=600&fit=crop',
    },
    discussionPrompt: 'Would you rather visit the past or see the future? What would you do first in your chosen time period?',
  },
  {
    id: 5,
    optionA: {
      text: 'Have unlimited money but no free time',
      image: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=800&h=600&fit=crop',
    },
    optionB: {
      text: 'Have unlimited free time but no money',
      image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&h=600&fit=crop',
    },
    discussionPrompt: 'Is time or money more valuable? How would you use your chosen resource?',
  },
  {
    id: 6,
    optionA: {
      text: 'Be famous for something you\'re proud of',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=600&fit=crop',
    },
    optionB: {
      text: 'Be incredibly wealthy but completely anonymous',
      image: 'https://images.unsplash.com/photo-1553729459-afea7b487dba?w=800&h=600&fit=crop',
    },
    discussionPrompt: 'Would you rather be known for your achievements or have the freedom that comes with anonymity?',
  },
]

// Load random question
const loadRandomQuestion = () => {
  const randomIndex = Math.floor(Math.random() * questions.length)
  const question = questions[randomIndex]
  if (question) {
    currentQuestion.value = {
      id: question.id,
      optionA: { ...question.optionA },
      optionB: { ...question.optionB },
      discussionPrompt: question.discussionPrompt,
    }
  }
  userSelection.value = null
  gamePhase.value = 'selecting'
}

// Make a selection
const makeSelection = (option: 'A' | 'B') => {
  userSelection.value = option
  votes.value[option]++
  gamePhase.value = 'discussing'
}

// Continue to results
const showResults = () => {
  gamePhase.value = 'results'
}

// Next question
const nextQuestion = () => {
  loadRandomQuestion()
}

// Initialize with a random question
onMounted(() => {
  loadRandomQuestion()
})
</script>

<template>
  <div class="would-you-rather-page">
    <Navbar />

    <!-- Activity Header -->
    <section class="activity-header">
      <div class="container">
        <div class="header-content">

          <div class="badge">SOCIAL-EMOTIONAL LEARNING</div>
          <div class="time-badge">5-10 Minutes</div>
          <h1 class="activity-title">Would You Rather...</h1>
          <p class="activity-description">
            Choose between two intriguing options and discuss your choice with the class.
            There are no wrong answers!
          </p>
        </div>
      </div>
    </section>

    <!-- Main Content -->
    <section class="main-content">
      <div class="container">
        <div class="content-wrapper">
          <!-- Left Column: Activity Area -->
          <div class="activity-area">
            <!-- Selecting Phase -->
            <div v-if="gamePhase === 'selecting'" class="selecting-phase">
              <div class="card">
                <h2 class="card-title">
                  <span class="icon">🤔</span>
                  Make Your Choice
                </h2>

                <div class="options-grid">
                  <!-- Option A -->
                  <div
                    class="option-card"
                    :class="{ 'selected': userSelection === 'A' }"
                    @click="makeSelection('A')"
                  >
                    <div class="option-image-wrapper">
                      <img
                        v-if="!imageErrors.has(currentQuestion.id + 'A')"
                        :src="currentQuestion.optionA.image"
                        :alt="currentQuestion.optionA.text"
                        class="option-image"
                        @error="handleImageError(currentQuestion.id + 'A')"
                      />
                      <div v-else class="option-image-placeholder">
                        <span class="placeholder-icon">🅰️</span>
                      </div>
                      <div class="option-badge">OPTION A</div>
                    </div>
                    <div class="option-content">
                      <p class="option-text">{{ currentQuestion.optionA.text }}</p>
                      <button class="btn-select">
                        <span class="check-icon">✓</span>
                        Select this choice
                      </button>
                    </div>
                  </div>

                  <!-- Option B -->
                  <div
                    class="option-card"
                    :class="{ 'selected': userSelection === 'B' }"
                    @click="makeSelection('B')"
                  >
                    <div class="option-image-wrapper">
                      <img
                        v-if="!imageErrors.has(currentQuestion.id + 'B')"
                        :src="currentQuestion.optionB.image"
                        :alt="currentQuestion.optionB.text"
                        class="option-image"
                        @error="handleImageError(currentQuestion.id + 'B')"
                      />
                      <div v-else class="option-image-placeholder">
                        <span class="placeholder-icon">🅱️</span>
                      </div>
                      <div class="option-badge">OPTION B</div>
                    </div>
                    <div class="option-content">
                      <p class="option-text">{{ currentQuestion.optionB.text }}</p>
                      <button class="btn-select">
                        <span class="check-icon">✓</span>
                        Select this choice
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Discussing Phase -->
            <div v-if="gamePhase === 'discussing'" class="discussing-phase">
              <div class="card">
                <h2 class="card-title">
                  <span class="icon">💬</span>
                  Discussion Prompt
                </h2>

                <div class="selection-summary">
                  <div class="selected-option" :class="`option-${userSelection}`">
                    <span class="selection-label">You chose:</span>
                    <span class="selection-text">
                      {{ userSelection === 'A' ? currentQuestion.optionA.text : currentQuestion.optionB.text }}
                    </span>
                  </div>
                </div>

                <div class="discussion-prompt">
                  <p class="prompt-text">{{ currentQuestion.discussionPrompt }}</p>
                </div>

                <div class="action-buttons">
                  <button class="btn-generate" @click="nextQuestion">
                    <span class="icon">🔄</span>
                    Generate New Question
                  </button>
                  <button class="btn-results" @click="showResults">
                    <span class="icon">📊</span>
                    View Results
                  </button>
                </div>
              </div>
            </div>

            <!-- Results Phase -->
            <div v-if="gamePhase === 'results'" class="results-phase">
              <div class="card">
                <h2 class="card-title">
                  <span class="icon">📊</span>
                  Class Results
                </h2>

                <div class="results-summary">
                  <div class="result-item" :class="`result-${userSelection}`">
                    <div class="result-header">
                      <span class="result-label">Your Choice</span>
                      <span class="result-badge">
                        {{ userSelection === 'A' ? currentQuestion.optionA.text : currentQuestion.optionB.text }}
                      </span>
                    </div>
                  </div>
                </div>

                <div class="vote-chart">
                  <div class="vote-item">
                    <div class="vote-header">
                      <span class="vote-label">Option A</span>
                      <span class="vote-percentage">{{ percentageA }}%</span>
                    </div>
                    <div class="vote-bar-container">
                      <div class="vote-bar" :style="{ width: percentageA + '%' }"></div>
                    </div>
                    <div class="vote-count">{{ votes.A }} vote{{ votes.A !== 1 ? 's' : '' }}</div>
                  </div>

                  <div class="vote-item">
                    <div class="vote-header">
                      <span class="vote-label">Option B</span>
                      <span class="vote-percentage">{{ percentageB }}%</span>
                    </div>
                    <div class="vote-bar-container">
                      <div class="vote-bar" :style="{ width: percentageB + '%' }"></div>
                    </div>
                    <div class="vote-count">{{ votes.B }} vote{{ votes.B !== 1 ? 's' : '' }}</div>
                  </div>
                </div>

                <div class="action-buttons">
                  <button class="btn-next" @click="nextQuestion">
                    Next Question
                    <span class="arrow">→</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Right Column: Instructions -->
          <div class="sidebar">
            <div class="instructions-card">
              <h3 class="instructions-title">
                <span class="icon">ℹ️</span>
                Instructions
              </h3>

              <!-- Selecting Instructions -->
              <div v-if="gamePhase === 'selecting'" class="instructions-content">
                <ul class="instructions-list">
                  <li>Read both options carefully.</li>
                  <li>Think about which option you prefer.</li>
                  <li>Click on the option that appeals to you most.</li>
                  <li>There are no wrong answers - be honest!</li>
                </ul>
              </div>

              <!-- Discussing Instructions -->
              <div v-if="gamePhase === 'discussing'" class="instructions-content">
                <ul class="instructions-list">
                  <li>Share your choice with the class.</li>
                  <li>Explain why you chose that option.</li>
                  <li>Listen to others' perspectives.</li>
                  <li>Respect different opinions and choices.</li>
                </ul>
              </div>

              <!-- Results Instructions -->
              <div v-if="gamePhase === 'results'" class="instructions-content">
                <ul class="instructions-list">
                  <li>View the class voting results.</li>
                  <li>Discuss which option was more popular.</li>
                  <li>Talk about why the majority chose that way.</li>
                  <li>Click 'Next Question' to continue.</li>
                </ul>
              </div>
            </div>

            <div class="discussion-tips-card">
              <h3 class="tips-title">
                <span class="icon">💡</span>
                Discussion Tips
              </h3>
              <div class="tips-list">
                <div class="tip-item">
                  <span class="tip-number">1</span>
                  <p class="tip-text">The "Why" Factor: Always ask students to explain their reasoning.</p>
                </div>
                <div class="tip-item">
                  <span class="tip-number">2</span>
                  <p class="tip-text">Connect to Learning: Relate choices to curriculum topics.</p>
                </div>
                <div class="tip-item">
                  <span class="tip-number">3</span>
                  <p class="tip-text">Challenge Peers: Encourage students to respectfully debate different viewpoints.</p>
                </div>
              </div>
            </div>

            <div class="live-indicator">
              <span class="live-dot"></span>
              <span class="live-text">Students are voting • Live</span>
            </div>
          </div>
        </div>
      </div>
    </section>
    <StickyBottomNav
      to="/tools/icebreakers"
      label="Back to Icebreakers"
      gradient="linear-gradient(135deg, #8b5cf6, #7c3aed)"
      border-color="rgba(139, 92, 246, 0.15)"
      shadow-color="rgba(139, 92, 246, 0.3)"
    />
  </div>
</template>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.would-you-rather-page {
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

/* Buttons */
.btn {
  display: inline-block;
  padding: 12px 24px;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 600;
  font-size: 16px;
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
}

/* Activity Header */
.activity-header {
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
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

/* Options Grid */
.options-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
}

.option-card {
  border: 3px solid #e5e7eb;
  border-radius: 16px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
  background: white;
}

.option-card:hover {
  border-color: #8b5cf6;
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(139, 92, 246, 0.2);
}

.option-card.selected {
  border-color: #8b5cf6;
  background: #f5f3ff;
  box-shadow: 0 8px 16px rgba(139, 92, 246, 0.3);
}

.option-image-wrapper {
  position: relative;
  width: 100%;
  height: 200px;
  overflow: hidden;
  background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
}

.option-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.option-image-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
}

.placeholder-icon {
  font-size: 64px;
  opacity: 0.8;
}

.option-card:hover .option-image {
  transform: scale(1.05);
}

.option-badge {
  position: absolute;
  top: 12px;
  left: 12px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 1px;
}

.option-content {
  padding: 24px;
}

.option-text {
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 16px;
  line-height: 1.5;
}

.btn-select {
  width: 100%;
  padding: 12px 20px;
  background: #8b5cf6;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.btn-select:hover {
  background: #7c3aed;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
}

.check-icon {
  font-size: 16px;
}

/* Discussing Phase */
.selection-summary {
  background: #f5f3ff;
  border-left: 4px solid #8b5cf6;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 24px;
}

.selected-option {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.selection-label {
  font-size: 14px;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.selection-text {
  font-size: 20px;
  font-weight: 700;
  color: #1f2937;
}

.discussion-prompt {
  background: #fef3c7;
  border-left: 4px solid #f59e0b;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 32px;
}

.prompt-text {
  font-size: 16px;
  color: #1f2937;
  line-height: 1.6;
  font-weight: 500;
}

/* Action Buttons */
.action-buttons {
  display: flex;
  gap: 12px;
  justify-content: space-between;
  align-items: center;
}

.btn-generate {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: #f3f4f6;
  color: #4b5563;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-generate:hover {
  background: #e5e7eb;
}

.btn-generate .icon {
  font-size: 18px;
}

.btn-results {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 14px 32px;
  background: #8b5cf6;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-left: auto;
}

.btn-results:hover {
  background: #7c3aed;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
}

.btn-results .icon {
  font-size: 20px;
}

/* Results Phase */
.results-summary {
  margin-bottom: 32px;
}

.result-item {
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  padding: 20px;
  transition: all 0.3s ease;
}

.result-A {
  border-color: #8b5cf6;
  background: #f5f3ff;
}

.result-B {
  border-color: #06b6d4;
  background: #ecfeff;
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.result-label {
  font-size: 14px;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.result-badge {
  font-size: 16px;
  font-weight: 700;
  color: #1f2937;
}

/* Vote Chart */
.vote-chart {
  display: flex;
  flex-direction: column;
  gap: 24px;
  margin-bottom: 32px;
}

.vote-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.vote-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.vote-label {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
}

.vote-percentage {
  font-size: 18px;
  font-weight: 700;
  color: #8b5cf6;
}

.vote-bar-container {
  width: 100%;
  height: 24px;
  background: #f3f4f6;
  border-radius: 12px;
  overflow: hidden;
}

.vote-bar {
  height: 100%;
  background: linear-gradient(90deg, #8b5cf6 0%, #7c3aed 100%);
  border-radius: 12px;
  transition: width 0.5s ease;
}

.vote-count {
  font-size: 14px;
  color: #6b7280;
  text-align: right;
}

.btn-next {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 14px 32px;
  background: #8b5cf6;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-left: auto;
}

.btn-next:hover {
  background: #7c3aed;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
}

.btn-next .arrow {
  font-size: 18px;
}

/* Sidebar */
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
  border-left: 4px solid #8b5cf6;
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
  padding: 12px 0;
  padding-left: 28px;
  position: relative;
  color: #4b5563;
  line-height: 1.6;
  border-bottom: 1px solid #f3f4f6;
}

.instructions-list li:last-child {
  border-bottom: none;
}

.instructions-list li::before {
  content: '•';
  position: absolute;
  left: 8px;
  color: #8b5cf6;
  font-weight: bold;
  font-size: 20px;
}

.discussion-tips-card {
  background: white;
  border-radius: 16px;
  padding: 32px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border-left: 4px solid #f59e0b;
}

.tips-title {
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 20px;
  color: #1f2937;
  display: flex;
  align-items: center;
  gap: 10px;
}

.tips-title .icon {
  font-size: 24px;
}

.tips-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.tip-item {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.tip-number {
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  background: #f59e0b;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 700;
}

.tip-text {
  font-size: 14px;
  color: #4b5563;
  line-height: 1.5;
}

.live-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.live-dot {
  width: 8px;
  height: 8px;
  background: #10b981;
  border-radius: 50%;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.live-text {
  font-size: 14px;
  color: #6b7280;
  font-weight: 500;
}

/* Responsive Design */
@media (max-width: 1024px) {
  .content-wrapper {
    grid-template-columns: 1fr;
  }

  .sidebar {
    order: -1;
  }

  .instructions-card {
    border-left: none;
    border-top: 4px solid #8b5cf6;
  }
}

@media (max-width: 768px) {
  .activity-title {
    font-size: 32px;
  }

  .activity-description {
    font-size: 16px;
  }

  .options-grid {
    grid-template-columns: 1fr;
  }

  .card {
    padding: 24px;
  }

  .card-title {
    font-size: 20px;
  }

  .action-buttons {
    flex-direction: column;
  }

  .btn-generate,
  .btn-results,
  .btn-next {
    width: 100%;
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .activity-header {
    padding: 40px 20px;
  }

  .activity-title {
    font-size: 28px;
  }

  .main-content {
    padding: 40px 20px;
  }

  .card {
    padding: 20px;
  }

  .option-image-wrapper {
    height: 160px;
  }

  .option-text {
    font-size: 16px;
  }
}
</style>
