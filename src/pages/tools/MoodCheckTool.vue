<script setup lang="ts">
import { ref, computed } from 'vue'


interface Mood {
  emoji: string
  label: string
  color: string
  bgColor: string
}

const moods: Mood[] = [
  { emoji: '😄', label: 'Great', color: '#059669', bgColor: '#ecfdf5' },
  { emoji: '🙂', label: 'Good', color: '#0284c7', bgColor: '#e0f2fe' },
  { emoji: '😐', label: 'Okay', color: '#f59e0b', bgColor: '#fffbeb' },
  { emoji: '😔', label: 'Down', color: '#f97316', bgColor: '#fff7ed' },
  { emoji: '😢', label: 'Struggling', color: '#dc2626', bgColor: '#fef2f2' },
]

const selectedMood = ref<string | null>(null)
const submitted = ref(false)
const note = ref('')
const classMoodHistory = ref<Array<{ emoji: string; label: string; note: string; time: Date }>>([
  { emoji: '😄', label: 'Great', note: '', time: new Date(Date.now() - 3600000) },
  { emoji: '🙂', label: 'Good', note: 'A bit tired', time: new Date(Date.now() - 7200000) },
  { emoji: '😐', label: 'Okay', note: 'Math was hard', time: new Date(Date.now() - 10800000) },
  { emoji: '😄', label: 'Great', note: 'Loved the group work', time: new Date(Date.now() - 14400000) },
])

const moodCounts = computed(() => {
  const counts: Record<string, number> = {}
  classMoodHistory.value.forEach(m => { counts[m.label] = (counts[m.label] || 0) + 1 })
  return counts
})

const totalCheckIns = computed(() => classMoodHistory.value.length)

function submitMood() {
  if (!selectedMood.value) return
  const mood = moods.find(m => m.label === selectedMood.value)
  if (!mood) return
  classMoodHistory.value.unshift({ emoji: mood.emoji, label: mood.label, note: note.value, time: new Date() })
  submitted.value = true
}

function resetCheck() {
  selectedMood.value = null
  note.value = ''
  submitted.value = false
}

function formatTime(date: Date) {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
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
          <div class="tool-icon">😊</div>
          <h1>Mood Check</h1>
          <p>Check student mood and engagement levels with quick emotional check-ins.</p>
        </div>
      </div>
    </section>

    <section class="tool-main">
      <div class="container">
        <div class="mood-layout">
          <!-- Current Check-In -->
          <div class="mood-card">
            <div v-if="!submitted">
              <h2 class="mood-card-title">How are you feeling today?</h2>
              <p class="mood-card-sub">Select a mood to check in</p>

              <div class="mood-selector">
                <button
                  v-for="mood in moods"
                  :key="mood.label"
                  class="mood-btn"
                  :class="{ active: selectedMood === mood.label }"
                  :style="{ '--mood-color': mood.color, '--mood-bg': mood.bgColor }"
                  @click="selectedMood = mood.label"
                >
                  <span class="mood-emoji">{{ mood.emoji }}</span>
                  <span class="mood-label">{{ mood.label }}</span>
                </button>
              </div>

              <div class="mood-note">
                <textarea
                  v-model="note"
                  placeholder="Optional: add a note about how you're feeling..."
                  rows="2"
                  class="mood-textarea"
                ></textarea>
              </div>

              <button class="submit-btn" :disabled="!selectedMood" @click="submitMood">Check In ✓</button>
            </div>

            <div v-else class="mood-submitted">
              <div class="submitted-mood-emoji">{{ moods.find(m => m.label === selectedMood)?.emoji }}</div>
              <h2>Checked In!</h2>
              <p class="mood-card-sub">Your mood has been recorded.</p>
              <div class="submitted-actions">
                <button class="submit-btn outline" @click="resetCheck">Check In Again</button>
              </div>
            </div>
          </div>

          <!-- History / Stats -->
          <div class="mood-sidebar">
            <div class="mood-stats-card">
              <h3>Today's Check-Ins</h3>
              <div class="mood-stat-number">{{ totalCheckIns }}</div>
              <div class="mood-distribution">
                <div v-for="mood in moods" :key="mood.label" class="mood-dist-item">
                  <span class="dist-label">{{ mood.emoji }} {{ mood.label }}</span>
                  <div class="dist-bar-wrap">
                    <div
                      class="dist-bar"
                      :style="{
                        width: totalCheckIns > 0 ? (moodCounts[mood.label] || 0) / totalCheckIns * 100 + '%' : '0%',
                        background: mood.color
                      }"
                    ></div>
                  </div>
                  <span class="dist-count">{{ moodCounts[mood.label] || 0 }}</span>
                </div>
              </div>
            </div>

            <div class="mood-history-card">
              <h3>Recent Check-Ins</h3>
              <div class="mood-history-list">
                <div v-for="(item, i) in classMoodHistory.slice(0, 6)" :key="i" class="history-item">
                  <span class="history-emoji">{{ item.emoji }}</span>
                  <div class="history-info">
                    <strong>{{ item.label }}</strong>
                    <span v-if="item.note" class="history-note">{{ item.note }}</span>
                  </div>
                  <span class="history-time">{{ formatTime(item.time) }}</span>
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
.tool-page { min-height: 100vh; background: #f8fafc; }
.container { max-width: 960px; margin: 0 auto; padding: 0 20px; }

.tool-hero {
  background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%);
  color: #fff; padding: 120px 20px 60px; text-align: center;
}
.tool-hero-content { max-width: 640px; margin: 0 auto; }
.tool-icon { font-size: 60px; margin-bottom: 16px; }
.tool-hero h1 { font-size: 40px; font-weight: 800; margin-bottom: 12px; }
.tool-hero p { font-size: 17px; opacity: .92; line-height: 1.6; }

.tool-main { padding: 40px 20px 60px; }

.mood-layout { display: grid; grid-template-columns: 1fr 320px; gap: 24px; }
@media (max-width: 820px) { .mood-layout { grid-template-columns: 1fr; } }

.mood-card, .mood-stats-card, .mood-history-card {
  background: #fff; border-radius: 14px; padding: 28px;
  border: 1px solid #e2e8f0; box-shadow: 0 4px 16px rgba(0,0,0,.04);
}

.mood-card-title { font-size: 22px; font-weight: 800; color: #0f172a; margin-bottom: 6px; }
.mood-card-sub { font-size: 14px; color: #64748b; margin-bottom: 24px; }

.mood-selector { display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; margin-bottom: 20px; }
.mood-btn {
  display: flex; flex-direction: column; align-items: center; gap: 8px;
  padding: 20px 8px; border: 2px solid #e2e8f0; border-radius: 14px;
  background: #fff; cursor: pointer; transition: all .15s;
}
.mood-btn:hover { border-color: var(--mood-color); background: var(--mood-bg); }
.mood-btn.active { border-color: var(--mood-color); background: var(--mood-bg); box-shadow: 0 0 0 3px color-mix(in srgb, var(--mood-color) 20%, transparent); }
.mood-emoji { font-size: 36px; line-height: 1; }
.mood-label { font-size: 12px; font-weight: 700; color: #334155; }

.mood-note { margin-bottom: 20px; }
.mood-textarea {
  width: 100%; border: 2px solid #e2e8f0; border-radius: 10px; padding: 12px 16px;
  font-size: 14px; line-height: 1.5; resize: vertical; font-family: inherit;
}
.mood-textarea:focus { outline: none; border-color: #06b6d4; }

.submit-btn {
  width: 100%; padding: 14px 24px; border: none; border-radius: 10px;
  background: #06b6d4; color: #fff; font-size: 16px; font-weight: 700;
  cursor: pointer; transition: all .15s;
}
.submit-btn:hover { background: #0891b2; }
.submit-btn:disabled { opacity: .4; cursor: not-allowed; }
.submit-btn.outline { background: transparent; border: 2px solid #06b6d4; color: #06b6d4; }
.submit-btn.outline:hover { background: #ecfeff; }

.mood-submitted { text-align: center; padding: 32px 0; }
.submitted-mood-emoji { font-size: 72px; margin-bottom: 16px; }
.mood-submitted h2 { font-size: 24px; font-weight: 800; color: #0f172a; margin-bottom: 8px; }
.submitted-actions { margin-top: 20px; }

.mood-stats-card, .mood-history-card { margin-bottom: 20px; }
.mood-stats-card h3, .mood-history-card h3 { font-size: 14px; font-weight: 800; color: #334155; margin-bottom: 16px; text-transform: uppercase; letter-spacing: 0.5px; }

.mood-stat-number { font-size: 48px; font-weight: 800; color: #06b6d4; margin-bottom: 20px; }

.mood-dist-item { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; font-size: 12px; }
.dist-label { font-weight: 600; color: #475569; min-width: 70px; }
.dist-bar-wrap { flex: 1; height: 6px; border-radius: 999px; background: #f1f5f9; overflow: hidden; }
.dist-bar { height: 100%; border-radius: 999px; transition: width .4s; }
.dist-count { font-weight: 700; color: #334155; min-width: 20px; text-align: right; }

.history-item { display: flex; align-items: center; gap: 10px; padding: 10px 0; border-bottom: 1px solid #f1f5f9; }
.history-item:last-child { border-bottom: 0; }
.history-emoji { font-size: 22px; }
.history-info { flex: 1; }
.history-info strong { display: block; font-size: 13px; color: #0f172a; }
.history-note { font-size: 11px; color: #94a3b8; display: block; margin-top: 2px; }
.history-time { font-size: 11px; color: #94a3b8; font-weight: 600; }

@media (max-width:640px) {
  .tool-hero h1 { font-size: 28px; }
  .mood-selector { grid-template-columns: repeat(3, 1fr); }
  .mood-btn { padding: 16px 6px; }
}
</style>
