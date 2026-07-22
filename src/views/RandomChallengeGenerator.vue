<script setup lang="ts">
import { ref, computed } from 'vue'
import { RouterLink } from 'vue-router'
import Navbar from '@/components/Navbar.vue'

interface Challenge {
  id: number
  title: string
  description: string
  category: string
  icon: string
  time: string
  difficulty: 'Easy' | 'Medium' | 'Hard'
}

const gamePhase = ref<'ready' | 'generating' | 'displayed'>('ready')

const currentChallenge = ref<Challenge | null>(null)
const challengesCompleted = ref(0)
const engagement = ref(82)
const isGenerating = ref(false)

const challenges: Challenge[] = [
  // Physical Challenges
  { id: 1, title: 'Dance Break', description: 'Stand up and do your best dance move for 10 seconds! Bonus points if you get the class to join in.', category: 'Physical', icon: '💃', time: '30s', difficulty: 'Easy' },
  { id: 2, title: 'Silent Wave', description: 'Stand up and create a silent wave across the classroom. Start with your right hand and pass it to the next person without making a sound!', category: 'Physical', icon: '🌊', time: '30s', difficulty: 'Easy' },
  { id: 3, title: 'Jumping Jacks', description: 'Everyone stand up and do 10 jumping jacks together! Count out loud as a class.', category: 'Physical', icon: '🏃', time: '30s', difficulty: 'Easy' },
  { id: 4, title: 'Balance Challenge', description: 'Stand on one foot for 15 seconds without wobbling. If you wobble, you are out! Last person standing wins.', category: 'Physical', icon: '🧘', time: '30s', difficulty: 'Medium' },
  { id: 5, title: 'Stretch Circle', description: 'Lead the class in a 30-second stretching routine. Reach for the sky, touch your toes, and roll your shoulders!', category: 'Physical', icon: '🤸', time: '45s', difficulty: 'Easy' },
  { id: 6, title: 'Air Guitar Solo', description: 'Play an epic air guitar solo for 15 seconds while making guitar sounds with your mouth!', category: 'Physical', icon: '🎸', time: '20s', difficulty: 'Medium' },

  // Speaking Challenges
  { id: 7, title: 'Tongue Twister', description: 'Say "She sells seashells by the seashore" 3 times fast without making a mistake!', category: 'Speaking', icon: '🗣️', time: '20s', difficulty: 'Medium' },
  { id: 8, title: 'Accent Challenge', description: 'Speak in your best British accent for the next 20 seconds. Say anything you like!', category: 'Speaking', icon: '🇬🇧', time: '20s', difficulty: 'Medium' },
  { id: 9, title: 'One-Minute Speech', description: 'Give a one-minute speech about your favorite food. You cannot stop talking or say "um"!', category: 'Speaking', icon: '🎤', time: '60s', difficulty: 'Hard' },
  { id: 10, title: 'Whisper Challenge', description: 'Whisper a message to the person next to you. They must pass it along. See if the message stays the same at the end!', category: 'Speaking', icon: '🤫', time: '45s', difficulty: 'Medium' },
  { id: 11, title: 'Robot Voice', description: 'Introduce yourself using only a robot voice for 15 seconds. Beep boop boop beep!', category: 'Speaking', icon: '🤖', time: '20s', difficulty: 'Easy' },

  // Creative Challenges
  { id: 12, title: 'Quick Sketch', description: 'Draw a picture of your dream vacation destination in 30 seconds. Show your masterpiece to the class!', category: 'Creative', icon: '🎨', time: '30s', difficulty: 'Medium' },
  { id: 13, title: 'Story Starter', description: 'Start a story with "It was a dark and stormy night when..." Each student adds one sentence to continue the story!', category: 'Creative', icon: '📖', time: '60s', difficulty: 'Hard' },
  { id: 14, title: 'Invent a Word', description: 'Create a brand new word and its definition. Use it in a sentence for the class!', category: 'Creative', icon: '📚', time: '30s', difficulty: 'Medium' },
  { id: 15, title: 'Airport Game', description: 'Mime being at an airport for 20 seconds. Show us checking in, going through security, and boarding your flight!', category: 'Creative', icon: '✈️', time: '25s', difficulty: 'Medium' },
  { id: 16, title: 'Commercial Pitch', description: 'Invent a silly product and pitch it to the class in 30 seconds like a TV commercial!', category: 'Creative', icon: '📺', time: '30s', difficulty: 'Hard' },

  // Brain Challenges
  { id: 17, title: 'Count Backwards', description: 'Count backwards from 100 by 7s as fast as you can! Ready, set, go!', category: 'Brain', icon: '🧮', time: '45s', difficulty: 'Hard' },
  { id: 18, title: 'Name the Categories', description: 'Name 5 countries, 5 animals, and 5 colors in 30 seconds! Go!', category: 'Brain', icon: '🧠', time: '30s', difficulty: 'Medium' },
  { id: 19, title: 'Riddle Me This', description: '"I speak without a mouth and hear without ears. I have no body, but I come alive with the wind. What am I?" (Echo)', category: 'Brain', icon: '🤔', time: '30s', difficulty: 'Medium' },
  { id: 20, title: 'Memory Challenge', description: 'Look around the room for 10 seconds, then close your eyes. How many blue objects can you remember seeing?', category: 'Brain', icon: '👁️', time: '30s', difficulty: 'Easy' },
  { id: 21, title: 'Spell Backwards', description: 'Spell "EXTRAORDINARY" backwards! Take your time, you have 30 seconds.', category: 'Brain', icon: '🔤', time: '30s', difficulty: 'Hard' },

  // Fun Challenges
  { id: 22, title: 'Animal Impression', description: 'Make your best animal sound and movement. Classmates must guess which animal you are!', category: 'Fun', icon: '🐘', time: '20s', difficulty: 'Easy' },
  { id: 23, title: 'Celebrity Walk', description: 'Walk across the front of the class like you are a famous celebrity. Everyone guesses who you are!', category: 'Fun', icon: '🌟', time: '20s', difficulty: 'Medium' },
  { id: 24, title: 'Freeze Dance', description: 'The teacher hums a tune. Everyone dances. When the humming stops, FREEZE! Anyone who moves is out.', category: 'Fun', icon: '🕺', time: '45s', difficulty: 'Easy' },
  { id: 25, title: 'Joke Time', description: 'Tell your best (school-appropriate) joke to the class. If no one laughs, try again!', category: 'Fun', icon: '😂', time: '20s', difficulty: 'Easy' },
  { id: 26, title: 'Mirror Mirror', description: 'Pair up with a classmate. One person makes faces and movements, the other must mirror them perfectly for 20 seconds!', category: 'Fun', icon: '🪞', time: '25s', difficulty: 'Medium' },

  // Team Challenges
  { id: 27, title: 'Group Count', description: 'As a class, count to 20. But only one person can say each number. If two people speak at once, start over!', category: 'Team', icon: '👥', time: '60s', difficulty: 'Hard' },
  { id: 28, title: 'Human Knot', description: 'In groups of 4-6, stand in a circle, grab hands with people across from you, and untangle without letting go!', category: 'Team', icon: '🪢', time: '90s', difficulty: 'Hard' },
  { id: 29, title: 'Line Up!', description: 'Without speaking, line up in order of your birthdays (month and day). You can only use hand gestures!', category: 'Team', icon: '📏', time: '60s', difficulty: 'Medium' },
  { id: 30, title: 'Group Cheer', description: 'Create a 3-second team cheer with a chant and a pose! Perform it for the class together.', category: 'Team', icon: '🎉', time: '45s', difficulty: 'Medium' },
]

const difficultyColors: Record<string, string> = {
  Easy: '#10b981',
  Medium: '#f59e0b',
  Hard: '#ef4444',
}

const categoryBadges: Record<string, string> = {
  Physical: '#6366f1',
  Speaking: '#8b5cf6',
  Creative: '#ec4899',
  Brain: '#06b6d4',
  Fun: '#f59e0b',
  Team: '#22c55e',
}

const generateChallenge = () => {
  if (isGenerating.value) return
  isGenerating.value = true
  gamePhase.value = 'generating'

  // Simulate a "spinning" effect
  setTimeout(() => {
    const randomIndex = Math.floor(Math.random() * challenges.length)
    currentChallenge.value = challenges[randomIndex]
    isGenerating.value = false
    gamePhase.value = 'displayed'
    challengesCompleted.value++
    engagement.value = Math.min(100, engagement.value + Math.floor(Math.random() * 3) + 1)
  }, 1500)
}

const generateNew = () => {
  gamePhase.value = 'ready'
  currentChallenge.value = null
}

const getCategoryColor = (category: string): string => {
  return categoryBadges[category] || '#6366f1'
}

const getDifficultyColor = (difficulty: string): string => {
  return difficultyColors[difficulty] || '#6b7280'
}

const categoriesList = [
  { name: 'Physical', icon: '💃', desc: 'Get moving with active challenges' },
  { name: 'Speaking', icon: '🗣️', desc: 'Practice communication skills' },
  { name: 'Creative', icon: '🎨', desc: 'Unleash your imagination' },
  { name: 'Brain', icon: '🧠', desc: 'Test your mental agility' },
  { name: 'Fun', icon: '😂', desc: 'Light-hearted classroom fun' },
  { name: 'Team', icon: '👥', desc: 'Collaborate with classmates' },
]
</script>

<template>
  <div class="random-challenge-page">
    <Navbar />

    <!-- Activity Header -->
    <section class="activity-header">
      <div class="container">
        <div class="header-content">
          <RouterLink to="/tools/icebreakers" class="back-link">
            ← Back to Icebreakers
          </RouterLink>
          <div class="badge">CLASSROOM ENGAGEMENT</div>
          <div class="time-badge">2-5 Minutes</div>
          <h1 class="activity-title">Random Challenge Generator</h1>
          <p class="activity-description">
            Generate fun, interactive challenges to energize your classroom.
            Perfect for brain breaks, transitions, or building class community!
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
            <!-- Ready Phase -->
            <div v-if="gamePhase === 'ready'" class="ready-phase">
              <div class="card">
                <div class="card-icon-wrapper">
                  <span class="card-main-icon">⚡</span>
                </div>
                <h2 class="card-title">Ready for a Challenge?</h2>
                <p class="card-description">
                  Click the button below to generate a random classroom challenge.
                  Each challenge has a category, difficulty level, and time limit!
                </p>
                <button class="btn-generate" @click="generateChallenge">
                  <span class="btn-icon">🎲</span>
                  Generate Challenge
                </button>
              </div>
            </div>

            <!-- Generating Phase -->
            <div v-if="gamePhase === 'generating'" class="generating-phase">
              <div class="card generating-card">
                <div class="spinner-container">
                  <div class="challenge-spinner">
                    <span class="spinner-icon">⚡</span>
                  </div>
                </div>
                <h2 class="card-title generating-title">Finding Your Challenge...</h2>
                <div class="generating-bar">
                  <div class="progress-bar"></div>
                </div>
                <p class="generating-hint">Picking the perfect challenge for your class!</p>
              </div>
            </div>

            <!-- Displayed Phase -->
            <div v-if="gamePhase === 'displayed' && currentChallenge" class="displayed-phase">
              <div class="card challenge-card">
                <div class="challenge-header">
                  <div class="challenge-icon-wrapper">
                    <span class="challenge-icon">{{ currentChallenge.icon }}</span>
                  </div>
                  <div class="challenge-meta">
                    <span
                      class="challenge-category"
                      :style="{ backgroundColor: getCategoryColor(currentChallenge.category) }"
                    >
                      {{ currentChallenge.category }}
                    </span>
                    <span
                      class="challenge-difficulty"
                      :style="{
                        backgroundColor: getDifficultyColor(currentChallenge.difficulty) + '20',
                        color: getDifficultyColor(currentChallenge.difficulty),
                        borderColor: getDifficultyColor(currentChallenge.difficulty)
                      }"
                    >
                      {{ currentChallenge.difficulty }}
                    </span>
                    <span class="challenge-time">
                      ⏱️ {{ currentChallenge.time }}
                    </span>
                  </div>
                </div>

                <h2 class="challenge-title">{{ currentChallenge.title }}</h2>
                <p class="challenge-description">{{ currentChallenge.description }}</p>

                <div class="challenge-timer-bar">
                  <div class="timer-fill" :style="{ animationDuration: currentChallenge.time }"></div>
                </div>

                <div class="action-buttons">
                  <button class="btn-new-challenge" @click="generateNew">
                    <span class="icon">🎲</span>
                    New Challenge
                  </button>
                  <button class="btn-generate-again" @click="generateChallenge">
                    Generate Another
                    <span class="arrow">→</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Right Column: Sidebar -->
          <div class="sidebar">
            <!-- Instructions Card -->
            <div class="instructions-card">
              <h3 class="instructions-title">
                <span class="icon">ℹ️</span>
                How It Works
              </h3>
              <div class="instructions-content">
                <ul class="instructions-list">
                  <li>
                    <span class="step-number">1</span>
                    <div class="step-content">
                      <strong>Click the button</strong>
                      <p>to generate a random classroom challenge.</p>
                    </div>
                  </li>
                  <li>
                    <span class="step-number">2</span>
                    <div class="step-content">
                      <strong>Read the challenge</strong>
                      <p>and prepare your students for the activity.</p>
                    </div>
                  </li>
                  <li>
                    <span class="step-number">3</span>
                    <div class="step-content">
                      <strong>Complete the task</strong>
                      <p>within the suggested time limit.</p>
                    </div>
                  </li>
                  <li>
                    <span class="step-number">4</span>
                    <div class="step-content">
                      <strong>Generate another</strong>
                      <p>when you are ready for a new challenge!</p>
                    </div>
                  </li>
                </ul>
              </div>
            </div>

            <!-- Stats Card -->
            <div class="stats-card">
              <h3 class="stats-title">
                <span class="icon">📊</span>
                Session Stats
              </h3>
              <div class="stats-grid">
                <div class="stat-item">
                  <div class="stat-value">{{ challengesCompleted }}</div>
                  <div class="stat-label">Challenges Done</div>
                </div>
                <div class="stat-item">
                  <div class="stat-value">{{ engagement }}%</div>
                  <div class="stat-label">Engagement</div>
                </div>
              </div>
            </div>

            <!-- Categories Card -->
            <div class="categories-card">
              <h3 class="categories-title">
                <span class="icon">🏷️</span>
                Challenge Categories
              </h3>
              <div class="categories-list">
                <div
                  v-for="cat in categoriesList"
                  :key="cat.name"
                  class="category-item"
                  :style="{ borderLeftColor: getCategoryColor(cat.name) }"
                >
                  <span class="category-icon">{{ cat.icon }}</span>
                  <div class="category-info">
                    <span class="category-name">{{ cat.name }}</span>
                    <span class="category-desc">{{ cat.desc }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.random-challenge-page {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  line-height: 1.6;
  color: #1f2937;
  background: #f9fafb;
  min-height: 100vh;
  padding-top: 64px;
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

/* Main Content Layout */
.main-content {
  padding: 60px 20px;
}

.content-wrapper {
  display: grid;
  grid-template-columns: 1fr 380px;
  gap: 32px;
  align-items: start;
}

.activity-area {
  min-width: 0;
}

/* Card Base */
.card {
  background: white;
  border-radius: 16px;
  padding: 48px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.card-icon-wrapper {
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #fbbf24, #f59e0b);
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 24px;
  box-shadow: 0 8px 24px rgba(245, 158, 11, 0.3);
}

.card-main-icon {
  font-size: 40px;
}

.card-title {
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 16px;
  color: #1f2937;
}

.card-description {
  font-size: 16px;
  color: #6b7280;
  line-height: 1.7;
  max-width: 480px;
  margin: 0 auto 32px;
}

/* Ready Phase */
.btn-generate {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  padding: 18px 48px;
  background: linear-gradient(135deg, #f59e0b, #d97706);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 18px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
}

.btn-generate:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 24px rgba(245, 158, 11, 0.4);
}

.btn-generate:active {
  transform: translateY(-1px);
}

.btn-icon {
  font-size: 24px;
}

/* Generating Phase */
.generating-card {
  padding: 60px 48px;
}

.spinner-container {
  display: flex;
  justify-content: center;
  margin-bottom: 32px;
}

.challenge-spinner {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: linear-gradient(135deg, #fbbf24, #f59e0b);
  display: flex;
  align-items: center;
  justify-content: center;
  animation: pulse 1.5s ease-in-out infinite;
  box-shadow: 0 8px 32px rgba(245, 158, 11, 0.3);
}

.spinner-icon {
  font-size: 48px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
    box-shadow: 0 8px 32px rgba(245, 158, 11, 0.3);
  }
  50% {
    transform: scale(1.1);
    box-shadow: 0 12px 48px rgba(245, 158, 11, 0.5);
  }
}

.generating-title {
  color: #f59e0b;
}

.generating-bar {
  width: 100%;
  max-width: 320px;
  height: 6px;
  background: #f3f4f6;
  border-radius: 3px;
  margin: 24px auto;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #fbbf24, #f59e0b, #d97706);
  border-radius: 3px;
  animation: progress 1.5s ease-in-out;
  width: 100%;
}

@keyframes progress {
  from {
    width: 0%;
  }
  to {
    width: 100%;
  }
}

.generating-hint {
  color: #9ca3af;
  font-size: 14px;
  font-style: italic;
  animation: fadeInOut 1.5s ease-in-out;
}

@keyframes fadeInOut {
  0%, 100% {
    opacity: 0.5;
  }
  50% {
    opacity: 1;
  }
}

/* Displayed Phase */
.challenge-card {
  animation: slideUp 0.5s ease-out;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.challenge-header {
  display: flex;
  align-items: center;
  gap: 24px;
  margin-bottom: 24px;
  justify-content: center;
  flex-wrap: wrap;
}

.challenge-icon-wrapper {
  width: 72px;
  height: 72px;
  background: #fffbeb;
  border-radius: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border: 2px solid #fde68a;
}

.challenge-icon {
  font-size: 36px;
}

.challenge-meta {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  align-items: center;
}

.challenge-category {
  display: inline-block;
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 700;
  color: white;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.challenge-difficulty {
  display: inline-block;
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 700;
  border: 1px solid;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.challenge-time {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 14px;
  background: #f3f4f6;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
  color: #4b5563;
}

.challenge-title {
  font-size: 32px;
  font-weight: 800;
  color: #1f2937;
  margin-bottom: 20px;
  line-height: 1.3;
}

.challenge-description {
  font-size: 17px;
  color: #4b5563;
  line-height: 1.8;
  max-width: 600px;
  margin: 0 auto 28px;
}

.challenge-timer-bar {
  width: 100%;
  max-width: 400px;
  height: 4px;
  background: #f3f4f6;
  border-radius: 2px;
  margin: 0 auto 32px;
  overflow: hidden;
}

.timer-fill {
  height: 100%;
  background: linear-gradient(90deg, #10b981, #f59e0b, #ef4444);
  border-radius: 2px;
  animation-name: timerShrink;
  animation-timing-function: linear;
  animation-fill-mode: forwards;
  width: 100%;
}

@keyframes timerShrink {
  from {
    width: 100%;
  }
  to {
    width: 0%;
  }
}

.action-buttons {
  display: flex;
  gap: 12px;
  justify-content: center;
  flex-wrap: wrap;
}

.btn-new-challenge {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 14px 28px;
  background: white;
  color: #f59e0b;
  border: 2px solid #f59e0b;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-new-challenge:hover {
  background: #f59e0b;
  color: white;
  transform: translateY(-2px);
}

.btn-new-challenge .icon {
  font-size: 20px;
}

.btn-generate-again {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 14px 32px;
  background: linear-gradient(135deg, #f59e0b, #d97706);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
}

.btn-generate-again:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(245, 158, 11, 0.4);
}

.btn-generate-again .arrow {
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
  border-left: 4px solid #f59e0b;
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
  background: #f59e0b;
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

/* Stats Card */
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
  background: #fffbeb;
  border-radius: 12px;
  border: 1px solid #fde68a;
}

.stat-value {
  font-size: 32px;
  font-weight: 800;
  color: #f59e0b;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 13px;
  color: #6b7280;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 1px;
}

/* Categories Card */
.categories-card {
  background: white;
  border-radius: 16px;
  padding: 32px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.categories-title {
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 20px;
  color: #1f2937;
  display: flex;
  align-items: center;
  gap: 10px;
}

.categories-title .icon {
  font-size: 24px;
}

.categories-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.category-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 14px;
  background: #f9fafb;
  border-radius: 10px;
  border-left: 4px solid #f59e0b;
  transition: all 0.3s ease;
}

.category-item:hover {
  background: #f3f4f6;
  transform: translateX(4px);
}

.category-icon {
  font-size: 22px;
  flex-shrink: 0;
}

.category-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.category-name {
  font-size: 14px;
  font-weight: 700;
  color: #1f2937;
}

.category-desc {
  font-size: 12px;
  color: #6b7280;
  line-height: 1.4;
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
    border-top: 4px solid #f59e0b;
  }

  .activity-title {
    font-size: 36px;
  }
}

@media (max-width: 768px) {
  .activity-header {
    padding: 50px 20px;
  }

  .activity-title {
    font-size: 32px;
  }

  .activity-description {
    font-size: 16px;
  }

  .main-content {
    padding: 40px 20px;
  }

  .card {
    padding: 32px 24px;
  }

  .card-title {
    font-size: 24px;
  }

  .challenge-title {
    font-size: 26px;
  }

  .challenge-description {
    font-size: 15px;
  }

  .challenge-header {
    flex-direction: column;
    gap: 16px;
  }

  .action-buttons {
    flex-direction: column;
    align-items: stretch;
  }

  .btn-generate {
    width: 100%;
    justify-content: center;
  }

  .btn-new-challenge,
  .btn-generate-again {
    width: 100%;
    justify-content: center;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 480px) {
  .activity-header {
    padding: 40px 20px;
  }

  .activity-title {
    font-size: 28px;
  }

  .badge {
    font-size: 10px;
  }

  .main-content {
    padding: 32px 20px;
  }

  .card {
    padding: 24px 16px;
  }

  .card-title {
    font-size: 22px;
  }

  .challenge-title {
    font-size: 22px;
  }

  .challenge-meta {
    justify-content: center;
  }

  .generating-card {
    padding: 40px 24px;
  }

  .challenge-spinner {
    width: 80px;
    height: 80px;
  }

  .spinner-icon {
    font-size: 36px;
  }
}
</style>
