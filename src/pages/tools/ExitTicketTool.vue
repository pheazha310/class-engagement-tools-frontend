<script setup lang="ts">
import { ref, computed } from 'vue'


interface Question {
  id: number
  text: string
  type: 'rating' | 'text' | 'choice'
  options?: string[]
}

const step = ref<'input' | 'results'>('input')
const currentQuestion = ref(0)
const responses = ref<Record<number, string | number>>({})
const submitted = ref(false)

const questions: Question[] = [
  { id: 1, text: 'How well did you understand today\'s lesson?', type: 'rating', options: ['1', '2', '3', '4', '5'] },
  { id: 2, text: 'What was the most important thing you learned today?', type: 'text' },
  { id: 3, text: 'Do you have any questions about the material?', type: 'choice', options: ['Yes, I need help', 'I understand most of it', 'I feel confident'] },
  { id: 4, text: 'How was the pace of the lesson?', type: 'choice', options: ['Too fast', 'Just right', 'Too slow'] },
  { id: 5, text: 'Rate your engagement level today:', type: 'rating', options: ['1', '2', '3', '4', '5'] },
]

const allQuestionsAnswered = computed(() => {
  return responses.value[currentQuestion.value] !== undefined && responses.value[currentQuestion.value] !== ''
})

const progressPercent = computed(() => ((currentQuestion.value + 1) / questions.length) * 100)

function selectRating(qId: number, val: string) {
  responses.value[qId] = parseInt(val)
}

function selectChoice(qId: number, val: string) {
  responses.value[qId] = val
}

function nextQuestion() {
  if (currentQuestion.value < questions.length - 1) {
    currentQuestion.value++
  } else {
    submitted.value = true
  }
}

function prevQuestion() {
  if (currentQuestion.value > 0) {
    currentQuestion.value--
  }
}

function resetAll() {
  currentQuestion.value = 0
  responses.value = {}
  submitted.value = false
}
</script>

<template>
  <div class="tool-page">

    <section class="tool-hero">
      <div class="container">
          <RouterLink to="/teacher/dashboard" class="back-to-dashboard">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            Back to Dashboard
          </RouterLink>
        <div class="tool-hero-content">
          <div class="tool-icon">🎫</div>
          <h1>Exit Ticket</h1>
          <p>Quick formative assessments to check student understanding before they leave.</p>
        </div>
      </div>
    </section>

    <section class="tool-main">
      <div class="container">
        <div v-if="!submitted" class="exit-ticket-card">
          <!-- Progress -->
          <div class="et-progress">
            <div class="et-progress-bar"><div class="et-progress-fill" :style="{ width: progressPercent + '%' }"></div></div>
            <span class="et-progress-text">{{ currentQuestion + 1 }} of {{ questions.length }}</span>
          </div>

          <!-- Question -->
          <div class="et-question">
             <h2>{{ questions[currentQuestion]!.text }}</h2>

            <!-- Rating -->
             <div v-if="questions[currentQuestion]!.type === 'rating'" class="et-rating">
               <button
                  v-for="opt in questions[currentQuestion]!.options"
                  :key="opt"
                  class="rating-btn"
                  :class="{ active: responses[questions[currentQuestion]!.id] === parseInt(opt) }"
                  @click="selectRating(questions[currentQuestion]!.id, opt)"
                >
                {{ opt }}
              </button>
              <div class="rating-labels">
                <span>Not at all</span>
                <span>Very much</span>
              </div>
            </div>

            <!-- Text -->
             <div v-if="questions[currentQuestion]!.type === 'text'" class="et-text">
               <textarea
                  v-model="responses[questions[currentQuestion]!.id]"
                 placeholder="Type your answer here..."
                 rows="4"
                 class="et-textarea"
               ></textarea>
             </div>

            <!-- Choice -->
             <div v-if="questions[currentQuestion]!.type === 'choice'" class="et-choice">
               <button
                 v-for="opt in questions[currentQuestion]!.options"
                 :key="opt"
                 class="choice-btn"
                  :class="{ active: responses[questions[currentQuestion]!.id] === opt }"
                  @click="selectChoice(questions[currentQuestion]!.id, opt)"
               >
                {{ opt }}
              </button>
            </div>
          </div>

          <!-- Navigation -->
          <div class="et-nav">
            <button v-if="currentQuestion > 0" class="btn btn-secondary" @click="prevQuestion">← Previous</button>
            <div></div>
            <button class="btn btn-primary" :disabled="!allQuestionsAnswered" @click="nextQuestion">
              {{ currentQuestion < questions.length - 1 ? 'Next →' : 'Submit ✓' }}
            </button>
          </div>
        </div>

        <!-- Summary Results -->
        <div v-else class="exit-ticket-card results-card">
          <div class="results-icon">🎉</div>
          <h2>Exit Ticket Submitted!</h2>
          <p class="results-sub">Responses recorded for {{ questions.length }} questions.</p>

          <div class="results-summary">
            <div v-for="q in questions" :key="q.id" class="result-item">
              <div class="result-q">{{ q.text }}</div>
              <div class="result-a">
                <template v-if="q.type === 'rating'">
                  <span class="result-rating">{{ responses[q.id] }} / 5</span>
                  <div class="result-bar-wrap"><div class="result-bar" :style="{ width: ((responses[q.id] as number) / 5) * 100 + '%' }"></div></div>
                </template>
                <template v-else-if="q.type === 'text'">
                  <em>{{ responses[q.id] || '—' }}</em>
                </template>
                <template v-else>
                  <span class="result-choice">{{ responses[q.id] }}</span>
                </template>
              </div>
            </div>
          </div>

          <div class="et-nav">
            <button class="btn btn-secondary" @click="resetAll">Start Over</button>
            <button class="btn btn-primary" @click="resetAll">New Exit Ticket</button>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.tool-page { min-height: 100vh; background: #f8fafc; }
.container { max-width: 800px; margin: 0 auto; padding: 0 20px; }

.tool-hero {
  background: linear-gradient(135deg, #059669 0%, #047857 100%);
  color: #fff; padding: 120px 20px 60px; text-align: center;
}
.tool-hero-content { max-width: 640px; margin: 0 auto; }
.tool-icon { font-size: 60px; margin-bottom: 16px; }
.tool-hero h1 { font-size: 40px; font-weight: 800; margin-bottom: 12px; }
.tool-hero p { font-size: 17px; opacity: .92; line-height: 1.6; }

.tool-main { padding: 40px 20px 60px; }

.exit-ticket-card {
  background: #fff; border-radius: 16px; padding: 36px;
  box-shadow: 0 4px 20px rgba(0,0,0,.06); border: 1px solid #e2e8f0;
}
.results-card { text-align: center; }
.results-icon { font-size: 56px; margin-bottom: 16px; }
.results-card h2 { font-size: 28px; font-weight: 800; color: #0f172a; margin-bottom: 8px; }
.results-sub { color: #64748b; font-size: 15px; margin-bottom: 32px; }

.et-progress { display: flex; align-items: center; gap: 14px; margin-bottom: 32px; }
.et-progress-bar { flex: 1; height: 6px; border-radius: 999px; background: #e2e8f0; overflow: hidden; }
.et-progress-fill { height: 100%; border-radius: 999px; background: linear-gradient(90deg,#059669,#10b981); transition: width .3s; }
.et-progress-text { font-size: 13px; font-weight: 700; color: #64748b; white-space: nowrap; }

.et-question h2 { font-size: 20px; font-weight: 700; color: #0f172a; margin-bottom: 24px; line-height: 1.4; }

.et-rating { display: flex; flex-direction: column; align-items: center; gap: 8px; }
.et-rating .rating-btn {
  width: 56px; height: 56px; border: 2px solid #e2e8f0; border-radius: 50%;
  background: #fff; font-size: 20px; font-weight: 800; color: #334155;
  cursor: pointer; transition: all .15s;
}
.et-rating .rating-btn:hover { border-color: #059669; background: #ecfdf5; }
.et-rating .rating-btn.active { border-color: #059669; background: #059669; color: #fff; box-shadow: 0 4px 12px rgba(5,150,105,.3); }
.rating-labels { display: flex; justify-content: space-between; width: 100%; max-width: 360px; font-size: 11px; color: #94a3b8; font-weight: 600; }

.et-textarea {
  width: 100%; border: 2px solid #e2e8f0; border-radius: 12px; padding: 16px;
  font-size: 15px; line-height: 1.6; resize: vertical; transition: border-color .15s;
  font-family: inherit;
}
.et-textarea:focus { outline: none; border-color: #059669; }

.et-choice { display: flex; flex-direction: column; gap: 10px; }
.choice-btn {
  width: 100%; min-height: 52px; border: 2px solid #e2e8f0; border-radius: 12px;
  background: #fff; font-size: 15px; font-weight: 600; color: #334155;
  cursor: pointer; transition: all .15s; padding: 0 20px; text-align: left;
}
.choice-btn:hover { border-color: #059669; background: #ecfdf5; }
.choice-btn.active { border-color: #059669; background: #059669; color: #fff; }

.et-nav { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 32px; padding-top: 24px; border-top: 1px solid #e2e8f0; }
.btn {
  padding: 12px 24px; border-radius: 10px; font-weight: 700; font-size: 15px;
  border: none; cursor: pointer; transition: all .15s;
}
.btn-primary { background: #059669; color: #fff; }
.btn-primary:disabled { opacity: .4; cursor: not-allowed; }
.btn-primary:hover:not(:disabled) { background: #047857; }
.btn-secondary { background: #f1f5f9; color: #334155; }
.btn-secondary:hover { background: #e2e8f0; }
.et-nav > :last-child { text-align: right; }
.et-nav > :first-child { text-align: left; }

.results-summary { text-align: left; margin-bottom: 24px; }
.result-item { padding: 16px 0; border-bottom: 1px solid #f1f5f9; }
.result-item:last-child { border-bottom: 0; }
.result-q { font-size: 14px; font-weight: 700; color: #0f172a; margin-bottom: 8px; }
.result-a { font-size: 14px; color: #475569; }
.result-rating { font-weight: 800; color: #059669; font-size: 18px; display: block; margin-bottom: 6px; }
.result-bar-wrap { height: 8px; border-radius: 999px; background: #e2e8f0; overflow: hidden; }
.result-bar { height: 100%; border-radius: 999px; background: linear-gradient(90deg,#059669,#10b981); }
.result-choice { display: inline-block; background: #ecfdf5; color: #059669; padding: 6px 14px; border-radius: 999px; font-weight: 700; font-size: 13px; }

@media (max-width:640px) {
  .tool-hero h1 { font-size: 28px; }
  .et-rating { flex-direction: row; }
  .et-nav { grid-template-columns: 1fr; }
}
</style>
