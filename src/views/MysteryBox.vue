<script setup lang="ts">
import { ref, computed } from 'vue'
import { RouterLink } from 'vue-router'

import StickyBottomNav from '@/components/StickyBottomNav.vue'

interface MysteryContent {
  id: number
  title: string
  description: string
  type: 'Question' | 'Challenge' | 'Task' | 'Bonus'
  icon: string
  points: number
}

const gamePhase = ref<'ready' | 'selecting' | 'revealed'>('ready')
const selectedBoxIndex = ref<number | null>(null)
const revealedContent = ref<MysteryContent | null>(null)
const isRevealing = ref(false)
const boxesOpened = ref(0)
const totalPoints = ref(0)

const mysteryContents: MysteryContent[] = [
  { id: 1, title: 'Secret Question', description: 'If you could invent a new school subject, what would it be and why?', type: 'Question', icon: '🤔', points: 10 },
  { id: 2, title: 'Dare Challenge', description: 'Stand up and introduce yourself using only three words! The class votes if you succeeded.', type: 'Challenge', icon: '🎯', points: 20 },
  { id: 3, title: 'Bonus Round', description: 'Everyone in the class who is wearing something blue gets a bonus point!', type: 'Bonus', icon: '🎁', points: 15 },
  { id: 4, title: 'Quick Task', description: 'Find something in your bag that represents your personality and show it to the class in 10 seconds!', type: 'Task', icon: '📦', points: 25 },
  { id: 5, title: 'Mystery Question', description: 'What is the most interesting fact you know that nobody else in this room knows?', type: 'Question', icon: '🔮', points: 10 },
  { id: 6, title: 'Group Challenge', description: 'The class has 30 seconds to organize themselves in alphabetical order by first name without talking!', type: 'Challenge', icon: '👥', points: 30 },
  { id: 7, title: 'Hidden Treasure', description: 'Describe your ideal dream day in 30 seconds. The most creative description gets a round of applause!', type: 'Task', icon: '💎', points: 20 },
  { id: 8, title: 'Power Question', description: 'If you could switch lives with anyone in this room for a day, who would it be and what would you do?', type: 'Question', icon: '⚡', points: 15 },
  { id: 9, title: 'Surprise Mission', description: 'Compliment the person next to you with the most creative compliment you can think of!', type: 'Challenge', icon: '🌟', points: 25 },
]

const getBoxColor = (index: number): string => {
  const colors: string[] = ['#ec4899', '#f43f5e', '#a855f7', '#d946ef', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#6366f1']
  return colors[index % colors.length]!
}

const getBoxGradient = (index: number): string => {
  const gradients: string[] = [
    'linear-gradient(135deg, #ec4899, #db2777)',
    'linear-gradient(135deg, #f43f5e, #e11d48)',
    'linear-gradient(135deg, #a855f7, #9333ea)',
    'linear-gradient(135deg, #d946ef, #c026d3)',
    'linear-gradient(135deg, #f97316, #ea580c)',
    'linear-gradient(135deg, #eab308, #ca8a04)',
    'linear-gradient(135deg, #22c55e, #16a34a)',
    'linear-gradient(135deg, #06b6d4, #0891b2)',
    'linear-gradient(135deg, #6366f1, #4f46e5)',
  ]
  return gradients[index % gradients.length]!
}

const selectBox = (index: number) => {
  if (isRevealing.value || gamePhase.value === 'revealed') return
  selectedBoxIndex.value = index
  isRevealing.value = true
  gamePhase.value = 'selecting'

  setTimeout(() => {
    const randomIndex = Math.floor(Math.random() * mysteryContents.length)
    const content = mysteryContents[randomIndex]
    revealedContent.value = content ?? null
    isRevealing.value = false
    gamePhase.value = 'revealed'
    boxesOpened.value++
    totalPoints.value += content?.points ?? 0
  }, 1200)
}

const openAnotherBox = () => {
  gamePhase.value = 'ready'
  selectedBoxIndex.value = null
  revealedContent.value = null
}

const getTypeColor = (type: string): string => {
  switch (type) {
    case 'Question': return '#6366f1'
    case 'Challenge': return '#f97316'
    case 'Task': return '#06b6d4'
    case 'Bonus': return '#22c55e'
    default: return '#6b7280'
  }
}

const boxItems = computed(() => {
  if (gamePhase.value === 'ready') {
    return Array.from({ length: 9 }, (_, i) => ({
      index: i,
      open: false,
      color: getBoxColor(i),
      gradient: getBoxGradient(i),
    }))
  }
  return Array.from({ length: 9 }, (_, i) => ({
    index: i,
    open: i === selectedBoxIndex.value,
    color: getBoxColor(i),
    gradient: getBoxGradient(i),
  }))
})
</script>

<template>
  <div class="mystery-box-page">

    <!-- Activity Header -->
    <section class="activity-header">
      <div class="container">
          <RouterLink to="/teacher/dashboard" class="back-to-dashboard">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            Back to Dashboard
          </RouterLink>
        <div class="header-content">

          <div class="badge">CLASSROOM ENGAGEMENT</div>
          <div class="time-badge">3-8 Minutes</div>
          <h1 class="activity-title">Mystery Box</h1>
          <p class="activity-description">
            Let students pick a mystery box to reveal a surprise question, challenge, or fun task.
            Perfect for sparking curiosity and keeping your class engaged!
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
                  <span class="card-main-icon">📦</span>
                </div>
                <h2 class="card-title">Choose a Mystery Box!</h2>
                <p class="card-description">
                  Pick any box below to reveal a surprise question, challenge, or fun task.
                  Each box contains something different — choose wisely!
                </p>

                <div class="box-grid">
                  <button
                    v-for="box in boxItems"
                    :key="box.index"
                    class="mystery-box"
                    :style="{ background: box.gradient }"
                    @click="selectBox(box.index)"
                  >
                    <span class="box-icon">📦</span>
                    <span class="box-number">Box {{ box.index + 1 }}</span>
                    <span class="box-shine"></span>
                  </button>
                </div>

                <p class="box-hint">
                  <span class="hint-icon">💡</span>
                  Tap a box to reveal what's inside!
                </p>
              </div>
            </div>

            <!-- Selecting / Revealing Phase -->
            <div v-if="gamePhase === 'selecting'" class="selecting-phase">
              <div class="card selecting-card">
                <div class="box-grid">
                  <div
                    v-for="box in boxItems"
                    :key="box.index"
                    class="mystery-box"
                    :class="{ 'selected': box.open, 'faded': gamePhase === 'selecting' && !box.open }"
                    :style="{ background: box.gradient }"
                  >
                    <span v-if="!box.open" class="box-icon">📦</span>
                    <span v-if="!box.open" class="box-number">Box {{ box.index + 1 }}</span>
                    <div v-if="box.open" class="box-opening">
                      <span class="opening-icon">✨</span>
                      <div class="opening-sparks">
                        <span class="spark"></span>
                        <span class="spark"></span>
                        <span class="spark"></span>
                        <span class="spark"></span>
                      </div>
                    </div>
                    <span class="box-shine"></span>
                  </div>
                </div>
                <div class="revealing-status">
                  <div class="revealing-spinner"></div>
                  <p class="revealing-text">Opening mystery box...</p>
                </div>
              </div>
            </div>

            <!-- Revealed Phase -->
            <div v-if="gamePhase === 'revealed' && revealedContent" class="revealed-phase">
              <div class="card revealed-card">
                <div class="revealed-badge" :style="{ background: getTypeColor(revealedContent.type) }">
                  <span class="revealed-badge-icon">{{ revealedContent.icon }}</span>
                  <span class="revealed-badge-text">{{ revealedContent.type }}</span>
                  <span class="revealed-badge-points">+{{ revealedContent.points }} pts</span>
                </div>

                <h2 class="revealed-title">{{ revealedContent.title }}</h2>
                <p class="revealed-description">{{ revealedContent.description }}</p>

                <div class="revealed-points-badge">
                  <span class="points-icon">🏆</span>
                  <span class="points-value">{{ revealedContent.points }}</span>
                  <span class="points-label">Points Awarded</span>
                </div>

                <div class="action-buttons">
                  <button class="btn-another-box" @click="openAnotherBox">
                    <span class="icon">📦</span>
                    Pick Another Box
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
                How to Play
              </h3>
              <div class="instructions-content">
                <ul class="instructions-list">
                  <li>
                    <span class="step-number">1</span>
                    <div class="step-content">
                      <strong>Pick a mystery box</strong>
                      <p>from the selection of colorful boxes.</p>
                    </div>
                  </li>
                  <li>
                    <span class="step-number">2</span>
                    <div class="step-content">
                      <strong>Watch the reveal</strong>
                      <p>as the box opens with a fun animation!</p>
                    </div>
                  </li>
                  <li>
                    <span class="step-number">3</span>
                    <div class="step-content">
                      <strong>Complete the challenge</strong>
                      <p>or answer the question as a class.</p>
                    </div>
                  </li>
                  <li>
                    <span class="step-number">4</span>
                    <div class="step-content">
                      <strong>Pick another box</strong>
                      <p>to keep the excitement going!</p>
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
                  <div class="stat-value">{{ boxesOpened }}</div>
                  <div class="stat-label">Boxes Opened</div>
                </div>
                <div class="stat-item">
                  <div class="stat-value">{{ totalPoints }}</div>
                  <div class="stat-label">Total Points</div>
                </div>
              </div>
            </div>

            <!-- Content Types Card -->
            <div class="content-types-card">
              <h3 class="content-types-title">
                <span class="icon">🏷️</span>
                Box Contents
              </h3>
              <div class="content-types-list">
                <div class="content-type-item">
                  <span class="type-dot" :style="{ background: '#6366f1' }"></span>
                  <div class="type-info">
                    <span class="type-name">Questions</span>
                    <span class="type-desc">Thought-provoking prompts</span>
                  </div>
                </div>
                <div class="content-type-item">
                  <span class="type-dot" :style="{ background: '#f97316' }"></span>
                  <div class="type-info">
                    <span class="type-name">Challenges</span>
                    <span class="type-desc">Fun class activities</span>
                  </div>
                </div>
                <div class="content-type-item">
                  <span class="type-dot" :style="{ background: '#06b6d4' }"></span>
                  <div class="type-info">
                    <span class="type-name">Tasks</span>
                    <span class="type-desc">Quick class missions</span>
                  </div>
                </div>
                <div class="content-type-item">
                  <span class="type-dot" :style="{ background: '#22c55e' }"></span>
                  <div class="type-info">
                    <span class="type-name">Bonus</span>
                    <span class="type-desc">Special rewards</span>
                  </div>
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

.mystery-box-page {
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
  background:  linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
  color: white;
  padding: 60px 20px;
}

.header-content {
  max-width: 800px;
  margin: 0 auto;
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
  background: linear-gradient(135deg, #ec4899, #db2777);
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 24px;
  box-shadow: 0 8px 24px rgba(236, 72, 153, 0.3);
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

/* Box Grid */
.box-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  max-width: 480px;
  margin: 0 auto 28px;
}

.mystery-box {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 24px 16px;
  border: none;
  border-radius: 16px;
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.mystery-box:hover {
  transform: translateY(-6px) scale(1.03);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
}

.mystery-box:active {
  transform: translateY(-2px) scale(1.01);
}

.mystery-box.faded {
  opacity: 0.3;
  transform: scale(0.95);
  cursor: default;
  pointer-events: none;
}

.mystery-box.selected {
  cursor: default;
  pointer-events: none;
  animation: boxPop 0.6s ease forwards;
}

@keyframes boxPop {
  0% {
    transform: scale(1);
  }
  30% {
    transform: scale(1.2);
  }
  60% {
    transform: scale(0.95);
  }
  100% {
    transform: scale(1.05);
  }
}

.box-icon {
  font-size: 36px;
  position: relative;
  z-index: 1;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
}

.box-number {
  font-size: 13px;
  font-weight: 600;
  position: relative;
  z-index: 1;
  letter-spacing: 0.5px;
  opacity: 0.9;
}

.box-shine {
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.2) 0%, transparent 60%);
  opacity: 0;
  transition: opacity 0.3s ease;
  pointer-events: none;
}

.mystery-box:hover .box-shine {
  opacity: 1;
}

.box-hint {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #9ca3af;
  font-size: 14px;
  font-style: italic;
  margin-top: 8px;
}

.hint-icon {
  font-size: 16px;
}

/* Box Opening Animation */
.box-opening {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  position: relative;
  z-index: 1;
}

.opening-icon {
  font-size: 42px;
  animation: sparkle 0.8s ease-in-out infinite alternate;
}

@keyframes sparkle {
  from {
    transform: scale(1) rotate(0deg);
    filter: brightness(1);
  }
  to {
    transform: scale(1.2) rotate(15deg);
    filter: brightness(1.3);
  }
}

.opening-sparks {
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
}

.spark {
  position: absolute;
  width: 8px;
  height: 8px;
  background: white;
  border-radius: 50%;
  animation: sparkFly 1.2s ease-out infinite;
}

.spark:nth-child(1) {
  top: -10px;
  left: 50%;
  --tx: 20px;
  --ty: -30px;
  animation-delay: 0s;
}

.spark:nth-child(2) {
  top: 50%;
  right: -10px;
  --tx: 30px;
  --ty: -10px;
  animation-delay: 0.3s;
}

.spark:nth-child(3) {
  bottom: -10px;
  left: 50%;
  --tx: -20px;
  --ty: 30px;
  animation-delay: 0.6s;
}

.spark:nth-child(4) {
  top: 50%;
  left: -10px;
  --tx: -30px;
  --ty: 10px;
  animation-delay: 0.9s;
}

@keyframes sparkFly {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  100% {
    transform: scale(0) translate(var(--tx), var(--ty));
    opacity: 0;
  }
}

/* Selecting Phase */
.selecting-card {
  padding: 40px;
}

.revealing-status {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-top: 24px;
  animation: fadeInUp 0.5s ease;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.revealing-spinner {
  width: 20px;
  height: 20px;
  border: 3px solid #f3f4f6;
  border-top-color: #ec4899;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.revealing-text {
  font-size: 16px;
  font-weight: 600;
  color: #ec4899;
}

/* Revealed Phase */
.revealed-card {
  animation: revealSlideUp 0.5s ease-out;
}

@keyframes revealSlideUp {
  from {
    opacity: 0;
    transform: translateY(30px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.revealed-badge {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 10px 24px;
  border-radius: 100px;
  color: white;
  font-weight: 600;
  font-size: 14px;
  margin-bottom: 28px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.revealed-badge-icon {
  font-size: 22px;
}

.revealed-badge-text {
  text-transform: uppercase;
  letter-spacing: 1px;
}

.revealed-badge-points {
  background: rgba(255, 255, 255, 0.25);
  padding: 2px 10px;
  border-radius: 12px;
  font-size: 12px;
}

.revealed-title {
  font-size: 32px;
  font-weight: 800;
  color: #1f2937;
  margin-bottom: 20px;
  line-height: 1.3;
}

.revealed-description {
  font-size: 17px;
  color: #4b5563;
  line-height: 1.8;
  max-width: 560px;
  margin: 0 auto 32px;
}

.revealed-points-badge {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 12px 28px;
  background: linear-gradient(135deg, #fbbf24, #f59e0b);
  border-radius: 12px;
  color: white;
  margin-bottom: 32px;
  box-shadow: 0 4px 16px rgba(245, 158, 11, 0.3);
}

.points-icon {
  font-size: 24px;
}

.points-value {
  font-size: 28px;
  font-weight: 800;
}

.points-label {
  font-size: 14px;
  font-weight: 500;
  opacity: 0.9;
}

.action-buttons {
  display: flex;
  gap: 12px;
  justify-content: center;
  flex-wrap: wrap;
}

.btn-another-box {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 16px 40px;
  background: linear-gradient(135deg, #ec4899, #db2777);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 17px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(236, 72, 153, 0.3);
}

.btn-another-box:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 24px rgba(236, 72, 153, 0.4);
}

.btn-another-box:active {
  transform: translateY(-1px);
}

.btn-another-box .icon {
  font-size: 22px;
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
  border-left: 4px solid #ec4899;
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
  background: #ec4899;
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
  background: #fdf2f8;
  border-radius: 12px;
  border: 1px solid #fbcfe8;
}

.stat-value {
  font-size: 32px;
  font-weight: 800;
  color: #ec4899;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 13px;
  color: #6b7280;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 1px;
}

/* Content Types Card */
.content-types-card {
  background: white;
  border-radius: 16px;
  padding: 32px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.content-types-title {
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 20px;
  color: #1f2937;
  display: flex;
  align-items: center;
  gap: 10px;
}

.content-types-title .icon {
  font-size: 24px;
}

.content-types-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.content-type-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 14px;
  background: #f9fafb;
  border-radius: 10px;
  transition: all 0.3s ease;
}

.content-type-item:hover {
  background: #f3f4f6;
  transform: translateX(4px);
}

.type-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex-shrink: 0;
}

.type-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.type-name {
  font-size: 14px;
  font-weight: 700;
  color: #1f2937;
}

.type-desc {
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
    border-top: 4px solid #ec4899;
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

  .box-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
    max-width: 360px;
  }

  .mystery-box {
    padding: 18px 12px;
  }

  .box-icon {
    font-size: 28px;
  }

  .box-number {
    font-size: 11px;
  }

  .revealed-title {
    font-size: 26px;
  }

  .revealed-description {
    font-size: 15px;
  }

  .action-buttons {
    flex-direction: column;
    align-items: stretch;
  }

  .btn-another-box {
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

  .box-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
    max-width: 100%;
  }

  .mystery-box {
    padding: 14px 8px;
    border-radius: 12px;
  }

  .box-icon {
    font-size: 24px;
  }

  .box-number {
    font-size: 10px;
  }

  .revealed-title {
    font-size: 22px;
  }

  .revealed-badge {
    font-size: 12px;
    padding: 8px 16px;
  }
}
</style>
