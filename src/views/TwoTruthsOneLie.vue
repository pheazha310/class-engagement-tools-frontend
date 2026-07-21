<script setup lang="ts">
import { ref, computed } from 'vue'
import { RouterLink } from 'vue-router'
import Navbar from '@/components/Navbar.vue'

// Game state
const gamePhase = ref<'setup' | 'playing' | 'revealed'>('setup')

// Statement data
const statements = ref([
  { id: 1, text: '', isLie: false },
  { id: 2, text: '', isLie: false },
  { id: 3, text: '', isLie: false },
])

// Modal ref
const ideasModal = ref<HTMLDialogElement | null>(null)

// Computed property to check if all statements are filled
const allStatementsFilled = computed(() => {
  return statements.value.every(statement => statement.text.trim() !== '')
})

// Computed property to check if a lie is selected
const lieSelected = computed(() => {
  return statements.value.some(statement => statement.isLie)
})

// Computed property to check if game can start
const canStartGame = computed(() => {
  return allStatementsFilled.value && lieSelected.value
})

// Start the game
const startGame = () => {
  if (canStartGame.value) {
    gamePhase.value = 'playing'
  }
}

// Reveal the answer
const revealAnswer = () => {
  gamePhase.value = 'revealed'
}

// Reset the game
const resetGame = () => {
  gamePhase.value = 'setup'
  statements.value = [
    { id: 1, text: '', isLie: false },
    { id: 2, text: '', isLie: false },
    { id: 3, text: '', isLie: false },
  ]
}

// Next student (same as reset)
const nextStudent = () => {
  resetGame()
}

// Update statement text
const updateStatementText = (id: number, text: string) => {
  const statement = statements.value.find(s => s.id === id)
  if (statement) {
    statement.text = text
  }
}

// Toggle lie selection
const toggleLie = (id: number) => {
  statements.value.forEach(statement => {
    statement.isLie = statement.id === id
  })
}
</script>

<template>
  <div class="two-truths-one-lie-page">
    <Navbar />

    <!-- Activity Header -->
    <section class="activity-header">
      <div class="container">
        <div class="header-content">
          <RouterLink to="/tools/icebreakers" class="back-link">
            ← Back to Icebreakers
          </RouterLink>
          <div class="badge">SOCIAL-EMOTIONAL LEARNING</div>
          <div class="time-badge">5-10 Minutes</div>
          <h1 class="activity-title">Two Truths and One Lie</h1>
          <p class="activity-description">
            A classic icebreaker reimagined for the modern classroom. Enter three statements about yourself, designate the lie, and challenge your peers to find the fiction!
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
            <!-- Setup Phase: Create Statements -->
            <div v-if="gamePhase === 'setup'" class="setup-phase">
              <div class="card">
                <h2 class="card-title">
                  <span class="icon">✏️</span>
                  Create Your Statements
                </h2>

                <div class="statements-list">
                  <div
                    v-for="statement in statements"
                    :key="statement.id"
                    class="statement-item"
                    :class="{ 'selected-lie': statement.isLie }"
                  >
                    <div class="statement-header">
                      <label class="statement-label">Statement 0{{ statement.id }}</label>
                      <div class="lie-selector">
                        <span class="lie-label">Is this the lie?</span>
                        <input
                          type="radio"
                          :id="`lie-${statement.id}`"
                          :name="'lie-selector'"
                          :checked="statement.isLie"
                          @change="toggleLie(statement.id)"
                        />
                        <label :for="`lie-${statement.id}`" class="radio-custom"></label>
                      </div>
                    </div>
                    <input
                      v-model="statement.text"
                      type="text"
                      class="statement-input"
                      :placeholder="`I have a pet tortoise named Sheldon...`"
                      @input="updateStatementText(statement.id, ($event.target as HTMLInputElement).value)"
                    />
                  </div>
                </div>

                <div class="action-buttons">
                  <button class="btn-ideas" @click="ideasModal?.showModal()">
                    <span class="icon">💡</span>
                    Need ideas?
                  </button>
                  <button
                    class="btn-start"
                    :disabled="!canStartGame"
                    :class="{ 'btn-disabled': !canStartGame }"
                    @click="startGame"
                  >
                    Start Game
                    <span class="arrow">▶</span>
                  </button>
                </div>
              </div>
            </div>

            <!-- Playing Phase: Students Guess -->
            <div v-if="gamePhase === 'playing'" class="playing-phase">
              <div class="card">
                <h2 class="card-title">
                  <span class="icon">🎮</span>
                  Class Activity
                </h2>

                <div class="statements-display">
                  <div
                    v-for="statement in statements"
                    :key="statement.id"
                    class="statement-card"
                  >
                    <div class="statement-number">Statement 0{{ statement.id }}</div>
                    <div class="statement-text">{{ statement.text }}</div>
                  </div>
                </div>

                <div class="action-buttons">
                  <button class="btn-reveal" @click="revealAnswer">
                    Reveal the Lie
                    <span class="icon">🔍</span>
                  </button>
                </div>
              </div>
            </div>

            <!-- Revealed Phase: Show Results -->
            <div v-if="gamePhase === 'revealed'" class="revealed-phase">
              <div class="card">
                <h2 class="card-title">
                  <span class="icon">📊</span>
                  Class Results
                </h2>

                <div class="results-list">
                  <div
                    v-for="statement in statements"
                    :key="statement.id"
                    class="result-item"
                    :class="{
                      'truth': !statement.isLie,
                      'lie': statement.isLie
                    }"
                  >
                    <div class="result-header">
                      <span class="statement-number">Statement 0{{ statement.id }}</span>
                      <div class="result-badge" :class="statement.isLie ? 'badge-lie' : 'badge-truth'">
                        {{ statement.isLie ? 'THE LIE' : 'TRUTH' }}
                      </div>
                      <span class="result-icon">
                        {{ statement.isLie ? '❌' : '✓' }}
                      </span>
                    </div>
                    <div class="statement-text">{{ statement.text }}</div>
                  </div>
                </div>

                <div class="action-buttons">
                  <button class="btn-play-again" @click="resetGame">
                    <span class="icon">🔄</span>
                    Play Again
                  </button>
                  <button class="btn-next" @click="nextStudent">
                    Next Student
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

              <!-- Setup Instructions -->
              <div v-if="gamePhase === 'setup'" class="instructions-content">
                <ul class="instructions-list">
                  <li>Type three facts about yourself in the boxes.</li>
                  <li>Use the selector to indicate which one is false.</li>
                  <li>Keep it clean and classroom-friendly!</li>
                  <li>The lie will be hidden until you click reveal.</li>
                </ul>
              </div>

              <!-- Playing Instructions -->
              <div v-if="gamePhase === 'playing'" class="instructions-content">
                <ul class="instructions-list">
                  <li>Share your three statements with the class.</li>
                  <li>Have students discuss and vote on which they think is the lie.</li>
                  <li>Click "Reveal the Lie" when ready to show the answer.</li>
                  <li>Discuss with students why they chose their answers.</li>
                </ul>
              </div>

              <!-- Revealed Instructions -->
              <div v-if="gamePhase === 'revealed'" class="instructions-content">
                <ul class="instructions-list">
                  <li>The lie has been revealed!</li>
                  <li>Discuss with the student why they chose these statements.</li>
                  <li>Click 'Next Student' to continue the activity with someone else.</li>
                  <li>Use 'Play Again' to reset the current session.</li>
                </ul>
              </div>
            </div>

            <div class="image-card">
              <img src="@/assets/images/Two.webp" alt="Students collaborating" class="sidebar-image" />
              <div class="image-overlay">
                <p class="image-text">Build classroom community through sharing!</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Ideas Modal -->
    <dialog ref="ideasModal" class="modal">
      <div class="modal-content">
        <h3 class="modal-title">💡 Statement Ideas</h3>
        <div class="ideas-grid">
          <div class="idea-category">
            <h4>Travel & Places</h4>
            <ul>
              <li>"I've visited 5 different countries"</li>
              <li>"I've been to the beach 20+ times"</li>
              <li>"I've seen the Northern Lights"</li>
            </ul>
          </div>
          <div class="idea-category">
            <h4>Food & Drinks</h4>
            <ul>
              <li>"I can eat 10 burgers in one sitting"</li>
              <li>"I've never tried pizza"</li>
              <li>"I make my own ice cream"</li>
            </ul>
          </div>
          <div class="idea-category">
            <h4>Hobbies & Skills</h4>
            <ul>
              <li>"I can solve a Rubik's cube in under a minute"</li>
              <li>"I play three musical instruments"</li>
              <li>"I've never played video games"</li>
            </ul>
          </div>
          <div class="idea-category">
            <h4>Family & Pets</h4>
            <ul>
              <li>"I have a pet tortoise named Sheldon"</li>
              <li>"I have 3 siblings"</li>
              <li>"I was born in a different country"</li>
            </ul>
          </div>
        </div>
        <button class="btn-close-modal" @click="ideasModal?.close()">Close</button>
      </div>
    </dialog>
  </div>
</template>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.two-truths-one-lie-page {
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

/* Setup Phase */
.statements-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-bottom: 32px;
}

.statement-item {
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  padding: 20px;
  transition: all 0.3s ease;
}

.statement-item:hover {
  border-color: #6366f1;
}

.statement-item.selected-lie {
  border-color: #ef4444;
  background: #fef2f2;
}

.statement-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.statement-label {
  font-size: 14px;
  font-weight: 600;
  color: #4b5563;
}

.lie-selector {
  display: flex;
  align-items: center;
  gap: 8px;
}

.lie-label {
  font-size: 13px;
  color: #6b7280;
  font-weight: 500;
}

.lie-selector input[type="radio"] {
  position: absolute;
  opacity: 0;
  cursor: pointer;
}

.radio-custom {
  width: 20px;
  height: 20px;
  border: 2px solid #d1d5db;
  border-radius: 50%;
  cursor: pointer;
  position: relative;
  transition: all 0.3s ease;
}

.lie-selector input[type="radio"]:checked + .radio-custom {
  border-color: #ef4444;
  background: #ef4444;
}

.lie-selector input[type="radio"]:checked + .radio-custom::after {
  content: '✓';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: white;
  font-size: 14px;
  font-weight: bold;
}

.statement-input {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 15px;
  font-family: inherit;
  transition: all 0.3s ease;
}

.statement-input:focus {
  outline: none;
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.statement-input::placeholder {
  color: #9ca3af;
}

/* Action Buttons */
.action-buttons {
  display: flex;
  gap: 12px;
  justify-content: space-between;
  align-items: center;
}

.btn-ideas {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: #f3f4f6;
  color: #4b5563;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-ideas:hover {
  background: #e5e7eb;
}

.btn-ideas .icon {
  font-size: 18px;
}

.btn-start {
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
  margin-left: auto;
}

.btn-start:hover:not(.btn-disabled) {
  background: #4f46e5;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
}

.btn-disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-start .arrow {
  font-size: 12px;
}

/* Playing Phase */
.statements-display {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 32px;
}

.statement-card {
  background: #f9fafb;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  padding: 24px;
  transition: all 0.3s ease;
}

.statement-card:hover {
  border-color: #6366f1;
  transform: translateX(4px);
}

.statement-number {
  font-size: 13px;
  font-weight: 600;
  color: #6366f1;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 8px;
}

.statement-text {
  font-size: 18px;
  color: #1f2937;
  line-height: 1.6;
}

.btn-reveal {
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
  margin: 0 auto;
}

.btn-reveal:hover {
  background: #4f46e5;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
}

.btn-reveal .icon {
  font-size: 20px;
}

/* Revealed Phase */
.results-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 32px;
}

.result-item {
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  padding: 20px;
  transition: all 0.3s ease;
}

.result-item.truth {
  border-color: #10b981;
  background: #f0fdf4;
}

.result-item.lie {
  border-color: #ef4444;
  background: #fef2f2;
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.result-badge {
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.badge-truth {
  background: #10b981;
  color: white;
}

.badge-lie {
  background: #ef4444;
  color: white;
}

.result-icon {
  font-size: 24px;
  font-weight: bold;
}

.btn-play-again {
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

.btn-play-again:hover {
  background: #e5e7eb;
}

.btn-play-again .icon {
  font-size: 18px;
}

.btn-next {
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
  margin-left: auto;
}

.btn-next:hover {
  background: #4f46e5;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
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
  color: #6366f1;
  font-weight: bold;
  font-size: 20px;
}

.image-card {
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  position: relative;
  height: 280px;
}

.sidebar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.7), transparent);
  padding: 24px;
  color: white;
}

.image-text {
  font-size: 16px;
  font-weight: 600;
  line-height: 1.5;
}

/* Modal */
.modal {
  border: none;
  border-radius: 16px;
  padding: 0;
  max-width: 800px;
  width: 90%;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.modal::backdrop {
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
}

.modal-content {
  padding: 40px;
}

.modal-title {
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 24px;
  color: #1f2937;
}

.ideas-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
  margin-bottom: 24px;
}

.idea-category h4 {
  font-size: 16px;
  font-weight: 600;
  color: #6366f1;
  margin-bottom: 12px;
}

.idea-category ul {
  list-style: none;
  padding: 0;
}

.idea-category li {
  padding: 8px 0;
  padding-left: 20px;
  position: relative;
  color: #4b5563;
  font-size: 14px;
  line-height: 1.5;
}

.idea-category li::before {
  content: '→';
  position: absolute;
  left: 0;
  color: #6366f1;
}

.btn-close-modal {
  width: 100%;
  padding: 14px;
  background: #6366f1;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-close-modal:hover {
  background: #4f46e5;
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
    border-top: 4px solid #6366f1;
  }

  .image-card {
    height: 240px;
  }
}

@media (max-width: 768px) {
  .activity-title {
    font-size: 32px;
  }

  .activity-description {
    font-size: 16px;
  }

  .card {
    padding: 24px;
  }

  .card-title {
    font-size: 20px;
  }

  .statement-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .ideas-grid {
    grid-template-columns: 1fr;
  }

  .action-buttons {
    flex-direction: column;
  }

  .btn-start,
  .btn-next {
    width: 100%;
    justify-content: center;
  }

  .btn-ideas {
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

  .statement-text {
    font-size: 16px;
  }

  .modal-content {
    padding: 24px;
  }
}
</style>
