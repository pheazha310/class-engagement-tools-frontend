<script setup lang="ts">
import { ref, computed } from 'vue'
import Navbar from '@/components/Navbar.vue'

interface WordItem {
  text: string
  count: number
  fontSize: number
}

const inputText = ref('')
const submittedWords = ref<string[]>([])
const showCloud = ref(false)

const wordItems = computed<WordItem[]>(() => {
  const wordMap = new Map<string, number>()
  const words = submittedWords.value
    .flatMap(response => response
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 2)
    )
  for (const word of words) {
    wordMap.set(word, (wordMap.get(word) || 0) + 1)
  }
  const items = Array.from(wordMap.entries())
    .map(([text, count]) => ({ text, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 60)
  const maxCount = items.length > 0 ? items[0]!.count : 1
  const minCount = items.length > 0 ? items[items.length - 1]!.count : 1
  return items.map(item => ({
    text: item.text,
    count: item.count,
    fontSize: 14 + ((item.count - minCount) / Math.max(maxCount - minCount, 1)) * 32,
  }))
})

const colors = ['#6366f1','#8b5cf6','#059669','#f59e0b','#ef4444','#06b6d4','#ec4899','#f97316','#14b8a6','#eab308']

function addResponse() {
  const trimmed = inputText.value.trim()
  if (!trimmed) return
  submittedWords.value.push(trimmed)
  inputText.value = ''
  showCloud.value = true
}

const presetResponses = [
  'I learned about photosynthesis and how plants convert sunlight into energy',
  'The water cycle involves evaporation condensation and precipitation',
  'Mitosis is the process of cell division with four main phases',
  'Gravity is a fundamental force that pulls objects toward each other',
  'The nervous system controls all body functions through signals',
  'Photosynthesis requires sunlight water and carbon dioxide',
  'Cells are the basic building blocks of all living organisms',
  'Ecosystems depend on the balance between producers and consumers',
]

function addPresetResponse(index: number) {
  const response = presetResponses[index]
  if (response) {
    submittedWords.value.push(response)
  }
  showCloud.value = true
  if (submittedWords.value.length >= 8) {
    submittedWords.value = []
  }
}

function clearAll() {
  submittedWords.value = []
  showCloud.value = false
}
</script>

<template>
  <div class="tool-page">
    <Navbar />

    <section class="wc-hero">
      <div class="container">
        <div class="wc-hero-content">
          <div class="wc-hero-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M17.5 19c0-1.7-1.3-3-3-3h-11" />
              <path d="M9 16c0 .6.4 1 1 1h7c.6 0 1-.4 1-1v-2.5c0-.6-.4-1-1-1h-7c-.6 0-1 .4-1 1V16z" />
              <path d="M18 13.5V10c0-1.1-.9-2-2-2h-2.5" />
              <path d="M6 13.5V10c0-1.1.9-2 2-2h2.5" />
              <path d="M4 8h16" />
              <path d="M6 8V6c0-1.1.9-2 2-2h8c1.1 0 2 .9 2 2v2" />
              <path d="M5 11v5" />
              <path d="M19 11v5" />
            </svg>
          </div>
          <h1>Word Cloud</h1>
          <p>Visualize word frequency and student responses in a beautiful cloud layout.</p>
        </div>
      </div>
    </section>

    <section class="wc-main">
      <div class="container">
        <div class="wc-layout">
          <div class="wc-panel">
            <div class="wc-panel-header">
              <h2>Add Responses</h2>
              <p class="wc-panel-sub">Type a response or use the sample data below</p>
            </div>

            <div class="wc-input-row">
              <input
                v-model="inputText"
                type="text"
                placeholder="Type a student response..."
                class="wc-input"
                @keyup.enter="addResponse"
              />
              <button class="wc-add-btn" :disabled="!inputText.trim()" @click="addResponse">
                <svg class="wc-add-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M12 4v16m8-8H4" />
                </svg>
                Add
              </button>
            </div>

            <div class="wc-presets">
              <p class="wc-presets-label">Quick add sample responses:</p>
              <div class="wc-preset-chips">
                <button
                  v-for="(_, i) in presetResponses"
                  :key="i"
                  class="wc-preset-chip"
                  :disabled="submittedWords.length >= 8"
                  @click="addPresetResponse(i)"
                >
                  Response {{ i + 1 }}
                </button>
              </div>
            </div>

            <div class="wc-stats">
              <div class="wc-stat">
                <span class="wc-stat-value">{{ submittedWords.length }}</span>
                <span class="wc-stat-label">responses</span>
              </div>
              <div class="wc-stat-divider" />
              <div class="wc-stat">
                <span class="wc-stat-value">{{ wordItems.length }}</span>
                <span class="wc-stat-label">unique words</span>
              </div>
              <button v-if="submittedWords.length > 0" class="wc-clear-btn" @click="clearAll">
                <svg class="wc-clear-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M3 6h18" />
                  <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6" />
                  <path d="M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                </svg>
                Clear All
              </button>
            </div>
          </div>

          <div class="wc-cloud-area">
            <div v-if="!showCloud || wordItems.length === 0" class="wc-empty">
              <div class="wc-empty-visual">
                <svg viewBox="0 0 120 120" fill="none">
                  <defs>
                    <linearGradient id="cloudGrad" x1="0" y1="0" x2="120" y2="120" gradientUnits="userSpaceOnUse">
                      <stop stop-color="#a78bfa" />
                      <stop offset="1" stop-color="#6366f1" />
                    </linearGradient>
                  </defs>
                  <circle cx="42" cy="62" r="22" fill="#ede9fe" />
                  <circle cx="72" cy="48" r="32" fill="url(#cloudGrad)" opacity="0.18" />
                  <circle cx="62" cy="78" r="18" fill="#ddd6fe" opacity="0.6" />
                  <path d="M48 76c6 8 14 10 22 6" stroke="#7c3aed" stroke-width="3" stroke-linecap="round" opacity="0.25" />
                </svg>
                <div class="wc-empty-text">
                  <h3>No Data Yet</h3>
                  <p>Add responses to generate a word cloud visualization.</p>
                </div>
              </div>
            </div>
            <div v-else class="wc-cloud">
              <span
                v-for="(word, i) in wordItems"
                :key="word.text"
                class="wc-word"
                :style="{
                  fontSize: word.fontSize + 'px',
                  color: colors[i % colors.length],
                  backgroundColor: colors[i % colors.length] + '18',
                  animationDelay: i * 30 + 'ms',
                }"
                :title="`${word.text}: ${word.count} mention${word.count !== 1 ? 's' : ''}`"
              >
                {{ word.text }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.tool-page { min-height: 100vh; background: #f8fafc; }
.container { max-width: 1100px; margin: 0 auto; padding: 0 24px; }

.wc-hero {
  background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 40%, #3b82f6 100%);
  color: #fff; padding: 128px 20px 72px; text-align: center; position: relative; overflow: hidden;
}
.wc-hero::before {
  content: ''; position: absolute; inset: 0; pointer-events: none;
  background-image: radial-gradient(circle at 1px 1px, rgba(255,255,255,0.1) 1px, transparent 0);
  background-size: 28px 28px; mask-image: linear-gradient(180deg, rgba(0,0,0,0.4), transparent 70%);
  -webkit-mask-image: linear-gradient(180deg, rgba(0,0,0,0.4), transparent 70%);
}
.wc-hero::after {
  content: ''; position: absolute; bottom: -60px; left: 50%; transform: translateX(-50%);
  width: 600px; height: 120px; border-radius: 50%;
  background: rgba(255,255,255,0.06); filter: blur(40px);
}
.wc-hero-content { max-width: 640px; margin: 0 auto; position: relative; }
.wc-hero-icon {
  width: 80px; height: 80px; margin: 0 auto 24px; display: flex; align-items: center; justify-content: center;
  background: rgba(255,255,255,0.12); border-radius: 24px; backdrop-filter: blur(8px);
  border: 1px solid rgba(255,255,255,0.15);
  animation: wc-icon-bob 3s ease-in-out infinite;
}
@keyframes wc-icon-bob {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50% { transform: translateY(-5px) rotate(3deg); }
}
.wc-hero-icon svg { width: 40px; height: 40px; color: white; filter: drop-shadow(0 4px 12px rgba(0,0,0,.2)); }
.wc-hero h1 { font-size: 44px; font-weight: 800; margin-bottom: 14px; letter-spacing: -0.03em; text-shadow: 0 2px 24px rgba(0,0,0,.18); }
.wc-hero p { font-size: 17px; opacity: .92; line-height: 1.65; max-width: 480px; margin: 0 auto; }

.wc-main { padding: 40px 20px 72px; }

.wc-layout {
  display: grid; grid-template-columns: 380px 1fr; gap: 24px; align-items: start;
}
@media (max-width: 900px) { .wc-layout { grid-template-columns: 1fr; } }

.wc-panel {
  background: #fff; border-radius: 20px; padding: 28px;
  border: 1px solid #e2e8f0; box-shadow: 0 10px 30px rgba(0,0,0,.04);
}
.wc-panel-header { margin-bottom: 22px; }
.wc-panel h2 { font-size: 19px; font-weight: 800; color: #0f172a; margin-bottom: 4px; }
.wc-panel-sub { font-size: 13px; color: #64748b; margin-top: 4px; }

.wc-input-row { display: flex; gap: 10px; margin-bottom: 20px; }
.wc-input {
  flex: 1; min-height: 48px; border: 2px solid #e2e8f0; border-radius: 12px;
  padding: 0 18px; font-size: 14px; transition: border-color .2s, box-shadow .2s, background .2s; background: #f8fafc;
  font-family: inherit;
}
.wc-input:focus { outline: none; border-color: #8b5cf6; background: #fff; box-shadow: 0 0 0 4px rgba(139,92,246,.1); }
.wc-input::placeholder { color: #94a3b8; }
.wc-add-btn {
  min-height: 48px; border: none; border-radius: 12px; background: linear-gradient(135deg, #8b5cf6, #7c3aed); color: #fff;
  font-weight: 700; font-size: 14px; padding: 0 22px; cursor: pointer; transition: all .2s; display: inline-flex; align-items: center; gap: 8px;
  box-shadow: 0 6px 20px rgba(124,58,237,.3); font-family: inherit;
}
.wc-add-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 10px 24px rgba(124,58,237,.35); }
.wc-add-btn:active:not(:disabled) { transform: translateY(0); }
.wc-add-btn:disabled { opacity: .4; cursor: not-allowed; transform: none; }
.wc-add-icon { width: 18px; height: 18px; }

.wc-presets { margin-bottom: 22px; }
.wc-presets-label { font-size: 12px; font-weight: 700; color: #64748b; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 0.6px; }
.wc-preset-chips { display: flex; flex-wrap: wrap; gap: 8px; }
.wc-preset-chip {
  min-height: 34px; border: 1.5px solid #e2e8f0; border-radius: 999px; background: #fff;
  padding: 0 16px; font-size: 12px; font-weight: 600; color: #475569; cursor: pointer; transition: all .2s;
  font-family: inherit;
}
.wc-preset-chip:hover:not(:disabled) { border-color: #8b5cf6; color: #7c3aed; background: #f5f3ff; transform: translateY(-1px); }
.wc-preset-chip:active:not(:disabled) { transform: translateY(0); }
.wc-preset-chip:disabled { opacity: .35; cursor: not-allowed; }

.wc-stats { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; padding-top: 20px; border-top: 1px solid #f1f5f9; }
.wc-stat { display: flex; align-items: baseline; gap: 6px; font-size: 13px; color: #64748b; }
.wc-stat-value { font-size: 18px; font-weight: 800; color: #0f172a; }
.wc-stat-label { font-weight: 500; }
.wc-stat-divider { width: 1px; height: 22px; background: #e2e8f0; }
.wc-clear-btn {
  margin-left: auto; border: none; background: #fef2f2; color: #dc2626;
  border-radius: 10px; padding: 8px 16px; font-size: 12px; font-weight: 700; cursor: pointer; transition: all .2s;
  display: inline-flex; align-items: center; gap: 6px; font-family: inherit;
}
.wc-clear-btn:hover { background: #fee2e2; transform: translateY(-1px); }
.wc-clear-btn:active { transform: translateY(0); }
.wc-clear-icon { width: 14px; height: 14px; }

.wc-cloud-area {
  background: #fff; border-radius: 22px; padding: 36px;
  border: 1px solid #e2e8f0; box-shadow: 0 10px 30px rgba(0,0,0,.04);
  min-height: 560px; display: flex; align-items: center; justify-content: center; position: relative; overflow: hidden;
}
.wc-cloud-area::before {
  content: ''; position: absolute; inset: 0; pointer-events: none; opacity: .25;
  background-image: radial-gradient(circle at 1px 1px, rgba(148,163,184,.15) 1px, transparent 0);
  background-size: 28px 28px; mask-image: linear-gradient(180deg, rgba(0,0,0,0.35), transparent 75%);
  -webkit-mask-image: linear-gradient(180deg, rgba(0,0,0,0.35), transparent 75%);
}
.wc-cloud-area::after {
  content: ''; position: absolute; top: -40px; right: -40px; width: 160px; height: 160px;
  border-radius: 50%; background: radial-gradient(circle, rgba(139,92,246,.08), transparent 70%);
  pointer-events: none;
}

.wc-empty { text-align: center; color: #94a3b8; position: relative; }
.wc-empty-visual { display: flex; flex-direction: column; align-items: center; gap: 18px; }
.wc-empty-visual svg { width: 130px; height: 130px; animation: wc-float 3s ease-in-out infinite; }
.wc-empty-text h3 { font-size: 21px; font-weight: 700; color: #475569; margin-bottom: 6px; }
.wc-empty-text p { font-size: 14px; color: #94a3b8; max-width: 280px; line-height: 1.5; }

.wc-cloud { display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: 12px; padding: 24px 8px; position: relative; }
.wc-word {
  display: inline-block; border-radius: 999px; padding: 6px 20px;
  font-weight: 700; line-height: 1.4; transition: all .25s cubic-bezier(.4,0,.2,1); cursor: default; border: 1px solid transparent; position: relative;
  animation: wc-appear .4s ease-out both;
}
.wc-word:hover { transform: scale(1.12); border-color: currentColor; box-shadow: 0 10px 28px rgba(0,0,0,.1); z-index: 2; }

@media (max-width: 640px) {
  .wc-hero { padding: 104px 20px 56px; }
  .wc-hero h1 { font-size: 30px; }
  .wc-hero p { font-size: 15px; }
  .wc-layout { gap: 16px; }
  .wc-panel { padding: 22px; }
  .wc-cloud-area { padding: 24px; min-height: 400px; }
  .wc-hero-icon { width: 64px; height: 64px; }
  .wc-hero-icon svg { width: 32px; height: 32px; }
}
</style>
