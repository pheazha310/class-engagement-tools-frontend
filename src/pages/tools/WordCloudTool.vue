<script setup lang="ts">
import { ref, computed } from 'vue'


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

    <section class="tool-hero">
      <div class="container">
          <RouterLink to="/teacher/dashboard" class="back-to-dashboard">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            Back to Dashboard
          </RouterLink>
        <div class="tool-hero-content">
          <div class="tool-icon">☁️</div>
          <h1>Word Cloud</h1>
          <p>Visualize word frequency and student responses in a beautiful cloud layout.</p>
        </div>
      </div>
    </section>

    <section class="tool-main">
      <div class="container">
        <div class="wc-layout">
          <!-- Input Panel -->
          <div class="wc-panel">
            <h2>Add Responses</h2>
            <p class="wc-panel-sub">Type a response or use the sample data below</p>

            <div class="wc-input-row">
              <input
                v-model="inputText"
                type="text"
                placeholder="Type a student response..."
                class="wc-input"
                @keyup.enter="addResponse"
              />
              <button class="wc-add-btn" :disabled="!inputText.trim()" @click="addResponse">Add</button>
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
              <div class="wc-stat"><strong>{{ submittedWords.length }}</strong> responses</div>
              <div class="wc-stat"><strong>{{ wordItems.length }}</strong> unique words</div>
              <button v-if="submittedWords.length > 0" class="wc-clear-btn" @click="clearAll">Clear All</button>
            </div>
          </div>

          <!-- Cloud Display -->
          <div class="wc-cloud-area">
            <div v-if="!showCloud || wordItems.length === 0" class="wc-empty">
              <div class="wc-empty-icon">☁️</div>
              <h3>No Data Yet</h3>
              <p>Add responses to generate a word cloud visualization.</p>
            </div>
            <div v-else class="wc-cloud">
              <span
                v-for="(word, i) in wordItems"
                :key="word.text"
                class="wc-word"
                :style="{
                  fontSize: word.fontSize + 'px',
                  color: colors[i % colors.length],
                  backgroundColor: colors[i % colors.length] + '15',
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
.container { max-width: 1060px; margin: 0 auto; padding: 0 20px; }

.tool-hero {
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
  color: #fff; padding: 120px 20px 60px; text-align: center;
}
.tool-hero-content { max-width: 640px; margin: 0 auto; }
.tool-icon { font-size: 60px; margin-bottom: 16px; }
.tool-hero h1 { font-size: 40px; font-weight: 800; margin-bottom: 12px; }
.tool-hero p { font-size: 17px; opacity: .92; line-height: 1.6; }

.tool-main { padding: 40px 20px 60px; }

.wc-layout { display: grid; grid-template-columns: 340px 1fr; gap: 24px; align-items: start; }
@media (max-width: 820px) { .wc-layout { grid-template-columns: 1fr; } }

.wc-panel {
  background: #fff; border-radius: 14px; padding: 24px;
  border: 1px solid #e2e8f0; box-shadow: 0 4px 16px rgba(0,0,0,.04);
}
.wc-panel h2 { font-size: 18px; font-weight: 800; color: #0f172a; margin-bottom: 4px; }
.wc-panel-sub { font-size: 13px; color: #64748b; margin-bottom: 20px; }

.wc-input-row { display: flex; gap: 8px; margin-bottom: 16px; }
.wc-input {
  flex: 1; min-height: 42px; border: 2px solid #e2e8f0; border-radius: 10px;
  padding: 0 14px; font-size: 14px; transition: border-color .15s;
}
.wc-input:focus { outline: none; border-color: #8b5cf6; }
.wc-add-btn {
  min-height: 42px; border: none; border-radius: 10px; background: #8b5cf6; color: #fff;
  font-weight: 700; font-size: 14px; padding: 0 20px; cursor: pointer; transition: all .15s;
}
.wc-add-btn:hover { background: #7c3aed; }
.wc-add-btn:disabled { opacity: .4; cursor: not-allowed; }

.wc-presets { margin-bottom: 20px; }
.wc-presets-label { font-size: 12px; font-weight: 700; color: #64748b; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px; }
.wc-preset-chips { display: flex; flex-wrap: wrap; gap: 6px; }
.wc-preset-chip {
  min-height: 30px; border: 1px solid #e2e8f0; border-radius: 999px; background: #fff;
  padding: 0 12px; font-size: 12px; font-weight: 600; color: #475569; cursor: pointer; transition: all .15s;
}
.wc-preset-chip:hover { border-color: #8b5cf6; color: #8b5cf6; }
.wc-preset-chip:disabled { opacity: .3; cursor: not-allowed; }

.wc-stats { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.wc-stat { font-size: 13px; color: #64748b; }
.wc-stat strong { color: #0f172a; }
.wc-clear-btn {
  margin-left: auto; border: none; background: #fef2f2; color: #dc2626;
  border-radius: 6px; padding: 6px 12px; font-size: 12px; font-weight: 700; cursor: pointer;
}
.wc-clear-btn:hover { background: #fee2e2; }

.wc-cloud-area {
  background: #fff; border-radius: 14px; padding: 32px;
  border: 1px solid #e2e8f0; box-shadow: 0 4px 16px rgba(0,0,0,.04);
  min-height: 400px; display: flex; align-items: center; justify-content: center;
}

.wc-empty { text-align: center; color: #94a3b8; }
.wc-empty-icon { font-size: 56px; margin-bottom: 12px; }
.wc-empty h3 { font-size: 18px; font-weight: 700; color: #64748b; margin-bottom: 6px; }
.wc-empty p { font-size: 14px; }

.wc-cloud { display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: 8px; padding: 16px; }
.wc-word {
  display: inline-block; border-radius: 999px; padding: 4px 14px;
  font-weight: 600; line-height: 1.4; transition: all .15s; cursor: default;
}
.wc-word:hover { transform: scale(1.08); }

@media (max-width:640px) {
  .tool-hero h1 { font-size: 28px; }
}
</style>
