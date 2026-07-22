<script setup lang="ts">
import { ref, computed } from 'vue'
import Navbar from '@/components/Navbar.vue'

interface Flashcard {
  id: number
  question: string
  answer: string
  category: string
}

const allCards: Flashcard[] = [
  { id: 1, question: 'What is the capital of France?', answer: 'Paris', category: 'Geography' },
  { id: 2, question: 'What is 7 × 8?', answer: '56', category: 'Math' },
  { id: 3, question: 'What planet is known as the Red Planet?', answer: 'Mars', category: 'Science' },
  { id: 4, question: 'Who wrote "Romeo and Juliet"?', answer: 'William Shakespeare', category: 'Literature' },
  { id: 5, question: 'What is H₂O?', answer: 'Water', category: 'Science' },
  { id: 6, question: 'What year did World War II end?', answer: '1945', category: 'History' },
  { id: 7, question: 'What is the largest ocean?', answer: 'Pacific Ocean', category: 'Geography' },
  { id: 8, question: 'What is the square root of 144?', answer: '12', category: 'Math' },
  { id: 9, question: 'What gas do plants absorb from the atmosphere?', answer: 'Carbon Dioxide (CO₂)', category: 'Science' },
  { id: 10, question: 'What is the chemical symbol for gold?', answer: 'Au', category: 'Science' },
  { id: 11, question: 'Who painted the Mona Lisa?', answer: 'Leonardo da Vinci', category: 'Art' },
  { id: 12, question: 'What is the speed of light?', answer: '299,792,458 m/s', category: 'Science' },
  { id: 13, question: 'What is the longest river in the world?', answer: 'The Nile', category: 'Geography' },
  { id: 14, question: 'What element has the atomic number 1?', answer: 'Hydrogen', category: 'Science' },
  { id: 15, question: 'What is the main language spoken in Brazil?', answer: 'Portuguese', category: 'Geography' },
]

const orderedCards = ref<Flashcard[]>([...allCards])

const currentIndex = ref(0)
const flipped = ref(false)
const knownCards = ref<Set<number>>(new Set())
const studyMode = ref<'all' | 'unknown' | 'known'>('all')
const showAnswer = ref(false)

const categories = computed(() => ['All', ...Array.from(new Set(allCards.map(c => c.category)))])
const selectedCategory = ref('All')

const filteredCards = computed(() => {
  let cards = orderedCards.value
  if (selectedCategory.value !== 'All') {
    cards = cards.filter(c => c.category === selectedCategory.value)
  }
  if (studyMode.value === 'known') {
    cards = cards.filter(c => knownCards.value.has(c.id))
  } else if (studyMode.value === 'unknown') {
    cards = cards.filter(c => !knownCards.value.has(c.id))
  }
  return cards
})

const currentCard = computed(() => filteredCards.value[currentIndex.value] || null)
const totalCards = computed(() => filteredCards.value.length)
const progressPercent = computed(() => totalCards.value > 0 ? ((currentIndex.value + 1) / totalCards.value) * 100 : 0)

function flipCard() {
  flipped.value = !flipped.value
  setTimeout(() => { showAnswer.value = flipped.value }, 100)
}

function markKnown() {
  if (!currentCard.value) return
  knownCards.value.add(currentCard.value.id)
  nextCard()
}

function markUnknown() {
  if (!currentCard.value) return
  knownCards.value.delete(currentCard.value.id)
  nextCard()
}

function nextCard() {
  flipped.value = false
  showAnswer.value = false
  if (currentIndex.value < filteredCards.value.length - 1) {
    currentIndex.value++
  }
}

function prevCard() {
  flipped.value = false
  showAnswer.value = false
  if (currentIndex.value > 0) {
    currentIndex.value--
  }
}

function shuffleCards() {
  orderedCards.value = [...allCards].sort(() => Math.random() - 0.5)
  currentIndex.value = 0
  flipped.value = false
  showAnswer.value = false
}

function resetProgress() {
  knownCards.value = new Set()
  currentIndex.value = 0
  flipped.value = false
  showAnswer.value = false
}
</script>

<template>
  <div class="tool-page">
    <Navbar />

    <section class="tool-hero">
      <div class="container">
        <div class="tool-hero-content">
          <div class="tool-icon">📖</div>
          <h1>Flashcards</h1>
          <p>Interactive flashcards for vocabulary and concept review with flip animations.</p>
        </div>
      </div>
    </section>

    <section class="tool-main">
      <div class="container">
        <div class="fc-layout">
          <!-- Controls Sidebar -->
          <div class="fc-controls">
            <h2>Study Options</h2>

            <div class="fc-field">
              <label>Category</label>
              <select v-model="selectedCategory" class="fc-select" @change="currentIndex = 0; flipped = false">
                <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
              </select>
            </div>

            <div class="fc-field">
              <label>Study Mode</label>
              <div class="fc-mode-chips">
                <button class="fc-mode-chip" :class="{ active: studyMode === 'all' }" @click="studyMode = 'all'; currentIndex = 0">All</button>
                <button class="fc-mode-chip" :class="{ active: studyMode === 'unknown' }" @click="studyMode = 'unknown'; currentIndex = 0">{{ totalCards }} Unknown</button>
                <button class="fc-mode-chip" :class="{ active: studyMode === 'known' }" @click="studyMode = 'known'; currentIndex = 0">{{ knownCards.size }} Known</button>
              </div>
            </div>

            <div class="fc-stats">
              <div class="fc-stat"><span class="fc-stat-val">{{ knownCards.size }}</span> Known</div>
              <div class="fc-stat"><span class="fc-stat-val">{{ allCards.length - knownCards.size }}</span> To Review</div>
              <div class="fc-stat"><span class="fc-stat-val">{{ totalCards }}</span> Showing</div>
            </div>

            <div class="fc-side-actions">
              <button class="fc-side-btn" @click="shuffleCards">🔀 Shuffle</button>
              <button class="fc-side-btn secondary" @click="resetProgress">🔄 Reset Progress</button>
            </div>
          </div>

          <!-- Card Area -->
          <div class="fc-card-area">
            <div v-if="totalCards === 0" class="fc-empty">
              <div class="fc-empty-icon">📖</div>
              <h3>No cards to review</h3>
              <p>All cards in this category are marked as known!</p>
              <button class="fc-reset-btn" @click="resetProgress">Reset Progress</button>
            </div>

            <template v-else-if="currentCard">
              <!-- Progress -->
              <div class="fc-progress">
                <div class="fc-progress-bar"><div class="fc-progress-fill" :style="{ width: progressPercent + '%' }"></div></div>
                <span class="fc-progress-text">{{ currentIndex + 1 }} / {{ totalCards }}</span>
              </div>

              <!-- Card -->
              <div class="fc-card-container" @click="flipCard">
                <div class="fc-card" :class="{ flipped: flipped }">
                  <div class="fc-card-front">
                    <div class="fc-card-label">Question</div>
                    <div class="fc-card-text">{{ currentCard.question }}</div>
                    <div class="fc-card-category">{{ currentCard.category }}</div>
                  </div>
                  <div class="fc-card-back">
                    <div class="fc-card-label">Answer</div>
                    <div class="fc-card-text answer">{{ currentCard.answer }}</div>
                    <div class="fc-card-hint">Click to flip back</div>
                  </div>
                </div>
              </div>

              <!-- Actions -->
              <div class="fc-actions">
                <button class="fc-action-btn danger" @click.stop="markUnknown">✗ Still Learning</button>
                <button class="fc-action-btn secondary" @click.stop="prevCard" :disabled="currentIndex === 0">← Back</button>
                <button class="fc-action-btn secondary" @click.stop="nextCard" :disabled="currentIndex >= totalCards - 1">Next →</button>
                <button class="fc-action-btn success" @click.stop="markKnown">✓ Got It</button>
              </div>
            </template>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.tool-page { min-height: 100vh; background: #f8fafc; }
.container { max-width: 960px; margin: 0 auto; padding: 0 20px; }

.tool-hero {
  background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
  color: #fff; padding: 120px 20px 60px; text-align: center;
}
.tool-hero-content { max-width: 640px; margin: 0 auto; }
.tool-icon { font-size: 60px; margin-bottom: 16px; }
.tool-hero h1 { font-size: 40px; font-weight: 800; margin-bottom: 12px; }
.tool-hero p { font-size: 17px; opacity: .92; line-height: 1.6; }

.tool-main { padding: 40px 20px 60px; }

.fc-layout { display: grid; grid-template-columns: 260px 1fr; gap: 24px; align-items: start; }
@media (max-width: 820px) { .fc-layout { grid-template-columns: 1fr; } }

.fc-controls {
  background: #fff; border-radius: 14px; padding: 24px;
  border: 1px solid #e2e8f0; box-shadow: 0 4px 16px rgba(0,0,0,.04);
}
.fc-controls h2 { font-size: 18px; font-weight: 800; color: #0f172a; margin-bottom: 20px; }

.fc-field { margin-bottom: 16px; }
.fc-field label { display: block; font-size: 12px; font-weight: 700; color: #64748b; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px; }
.fc-select { width: 100%; min-height: 38px; border: 2px solid #e2e8f0; border-radius: 8px; padding: 0 10px; font-size: 13px; font-weight: 600; color: #0f172a; background: #fff; cursor: pointer; }
.fc-select:focus { outline: none; border-color: #6366f1; }

.fc-mode-chips { display: flex; flex-wrap: wrap; gap: 6px; }
.fc-mode-chip {
  min-height: 30px; border: 1px solid #e2e8f0; border-radius: 999px; background: #fff;
  padding: 0 12px; font-size: 12px; font-weight: 700; color: #475569; cursor: pointer; transition: all .15s;
}
.fc-mode-chip.active { background: #6366f1; color: #fff; border-color: #6366f1; }
.fc-mode-chip:hover:not(.active) { border-color: #6366f1; }

.fc-stats { margin-bottom: 20px; }
.fc-stat { display: flex; align-items: center; gap: 6px; font-size: 13px; color: #64748b; padding: 6px 0; border-bottom: 1px solid #f1f5f9; }
.fc-stat:last-child { border-bottom: 0; }
.fc-stat-val { font-weight: 800; color: #0f172a; min-width: 20px; }

.fc-side-actions { display: flex; flex-direction: column; gap: 8px; }
.fc-side-btn {
  width: 100%; padding: 10px; border: 1px solid #e2e8f0; border-radius: 8px;
  background: #fff; font-size: 13px; font-weight: 700; color: #475569; cursor: pointer; text-align: center; transition: all .15s;
}
.fc-side-btn:hover { border-color: #6366f1; color: #6366f1; }
.fc-side-btn.secondary { background: #f8fafc; }

.fc-card-area { display: flex; flex-direction: column; align-items: center; }

.fc-empty { text-align: center; padding: 80px 20px; color: #94a3b8; }
.fc-empty-icon { font-size: 56px; margin-bottom: 12px; }
.fc-empty h3 { font-size: 18px; font-weight: 700; color: #64748b; margin-bottom: 6px; }
.fc-empty p { font-size: 14px; margin-bottom: 16px; }
.fc-reset-btn { padding: 10px 20px; border: none; border-radius: 8px; background: #6366f1; color: #fff; font-weight: 700; cursor: pointer; }

.fc-progress { display: flex; align-items: center; gap: 12px; width: 100%; margin-bottom: 20px; }
.fc-progress-bar { flex: 1; height: 6px; border-radius: 999px; background: #e2e8f0; overflow: hidden; }
.fc-progress-fill { height: 100%; border-radius: 999px; background: linear-gradient(90deg,#6366f1,#8b5cf6); transition: width .3s; }
.fc-progress-text { font-size: 13px; font-weight: 700; color: #64748b; white-space: nowrap; }

.fc-card-container {
  width: 100%; max-width: 400px; height: 260px; perspective: 800px;
  margin-bottom: 20px; cursor: pointer;
}
.fc-card {
  width: 100%; height: 100%; position: relative; transform-style: preserve-3d;
  transition: transform 0.5s ease;
}
.fc-card.flipped { transform: rotateY(180deg); }

.fc-card-front, .fc-card-back {
  position: absolute; inset: 0; border-radius: 16px;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  padding: 32px; backface-visibility: hidden; text-align: center;
}
.fc-card-front {
  background: #fff; border: 2px solid #e2e8f0; box-shadow: 0 8px 24px rgba(0,0,0,.06);
}
.fc-card-back {
  background: linear-gradient(135deg,#6366f1,#4f46e5); color: #fff;
  transform: rotateY(180deg);
}
.fc-card-label { font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 16px; opacity: .7; }
.fc-card-text { font-size: 22px; font-weight: 700; line-height: 1.4; }
.fc-card-text.answer { font-size: 28px; font-weight: 800; }
.fc-card-category { margin-top: 16px; font-size: 11px; color: #94a3b8; font-weight: 600; background: #f1f5f9; padding: 4px 12px; border-radius: 999px; }
.fc-card-hint { margin-top: 20px; font-size: 12px; opacity: .6; }

.fc-actions { display: flex; gap: 8px; flex-wrap: wrap; justify-content: center; width: 100%; }
.fc-action-btn {
  padding: 10px 18px; border: none; border-radius: 10px; font-weight: 700; font-size: 13px; cursor: pointer; transition: all .15s;
}
.fc-action-btn.success { background: #059669; color: #fff; }
.fc-action-btn.success:hover { background: #047857; }
.fc-action-btn.danger { background: #dc2626; color: #fff; }
.fc-action-btn.danger:hover { background: #b91c1c; }
.fc-action-btn.secondary { background: #e2e8f0; color: #475569; }
.fc-action-btn.secondary:hover { background: #cbd5e1; }
.fc-action-btn:disabled { opacity: .4; cursor: not-allowed; }

@media (max-width:640px) {
  .tool-hero h1 { font-size: 28px; }
  .fc-card-text { font-size: 18px; }
  .fc-card-text.answer { font-size: 22px; }
}
</style>
