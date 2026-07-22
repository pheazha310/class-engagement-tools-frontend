<script setup lang="ts">
import { ref, computed } from 'vue'
import Navbar from '@/components/Navbar.vue'

const gridSize = 5
const topic = ref('Math Vocabulary')
const centerFree = ref(true)
const generated = ref(false)
const cells = ref<string[][]>([])

const subjectPresets = [
  {
    name: 'Math Vocabulary',
    words: ['Algebra', 'Geometry', 'Calculus', 'Fraction', 'Decimal', 'Equation', 'Variable', 'Coefficient', 'Theorem', 'Probability', 'Quadratic', 'Matrix', 'Derivative', 'Integral', 'Logarithm', 'Exponent', 'Permutation', 'Combination', 'Hypotenuse', 'Tangent', 'Asymptote', 'Parabola', 'Ellipse', 'Vector', 'Domain'],
  },
  {
    name: 'Science Terms',
    words: ['Mitosis', 'Photosynthesis', 'Ecosystem', 'Gravity', 'Molecule', 'Atom', 'Electron', 'Neutron', 'Friction', 'Velocity', 'Acceleration', 'Inertia', 'Erosion', 'Evaporation', 'Condensation', 'Fossil', 'Gene', 'Chromosome', 'Species', 'Habitat', 'Mutualism', 'Parasitism', 'Symbiosis', 'Predator'],
  },
  {
    name: 'History Dates',
    words: ['1776', '1492', '1789', '1945', '1066', '1215', '1914', '1939', '1969', '1989', '1804', '1865', '1941', '1957', '1963', '2001', '1517', '1770', '1861', '1917', '1929', '1947', '1955', '1991'],
  },
  {
    name: 'Geography',
    words: ['Amazon', 'Himalayas', 'Sahara', 'Nile', 'Andes', 'Pacific', 'Atlantic', 'Alps', 'Gobi', 'Everest', 'Kilimanjaro', 'Caspian', 'Siberia', 'Great Barrier', 'Yangtze', 'Danube', 'Mekong', 'Patagonia', 'Antarctica', 'Arctic', 'Suez', 'Panama', 'Gibraltar', 'Balkans'],
  },
  {
    name: 'Custom',
    words: ['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
  },
]

function generateBingo() {
  const preset = subjectPresets.find(p => p.name === topic.value)
  if (!preset || preset.words.some(w => !w)) return

  const shuffled = [...preset.words].sort(() => Math.random() - 0.5)
  const board: string[][] = []
  let idx = 0
  for (let r = 0; r < gridSize; r++) {
    const row: string[] = []
    for (let c = 0; c < gridSize; c++) {
      if (centerFree && r === 2 && c === 2) {
        row.push('★ FREE ★')
      } else if (idx < shuffled.length) {
        row.push(shuffled[idx++])
      }
    }
    board.push(row)
  }
  cells.value = board
  generated.value = true
}

const marked = ref<Set<string>>(new Set())

function toggleCell(row: number, col: number) {
  const key = `${row}-${col}`
  if (marked.value.has(key)) {
    marked.value.delete(key)
  } else {
    marked.value.add(key)
  }
  // Force reactivity
  marked.value = new Set(marked.value)
}

function isMarked(row: number, col: number) {
  return marked.value.has(`${row}-${col}`)
}

function generateNew() {
  marked.value = new Set()
  generateBingo()
}

function printCard() {
  window.print()
}
</script>

<template>
  <div class="tool-page">
    <Navbar />

    <section class="tool-hero">
      <div class="container">
        <div class="tool-hero-content">
          <div class="tool-icon">🎱</div>
          <h1>Bingo Generator</h1>
          <p>Create custom bingo games for any subject — math, science, history, and more.</p>
        </div>
      </div>
    </section>

    <section class="tool-main">
      <div class="container">
        <div class="bingo-layout">
          <!-- Controls -->
          <div class="bingo-controls">
            <h2>Generate a Bingo Card</h2>

            <div class="bingo-field">
              <label>Subject</label>
              <select v-model="topic" class="bingo-select">
                <option v-for="p in subjectPresets" :key="p.name" :value="p.name">{{ p.name }}</option>
              </select>
            </div>

            <label class="bingo-check">
              <input type="checkbox" v-model="centerFree" />
              <span>Free space in center</span>
            </label>

            <button class="bingo-generate-btn" @click="generateNew">Generate Card</button>

            <div v-if="generated" class="bingo-actions">
              <button class="bingo-action-btn" @click="generateNew">🔄 New Card</button>
              <button class="bingo-action-btn" @click="printCard">🖨️ Print</button>
            </div>
          </div>

          <!-- Bingo Card -->
          <div class="bingo-card-area">
            <div v-if="!generated || cells.length === 0" class="bingo-empty">
              <div class="bingo-empty-icon">🎱</div>
              <h3>No Card Yet</h3>
              <p>Select a subject and generate a bingo card.</p>
            </div>

            <div v-else class="bingo-card">
              <div class="bingo-card-title">{{ topic }} Bingo</div>
              <div class="bingo-grid">
                <div class="bingo-header-cell" v-for="col in gridSize" :key="'h' + col">
                  {{ ['B', 'I', 'N', 'G', 'O'][col - 1] }}
                </div>
                <template v-for="(row, r) in cells" :key="'r' + r">
                  <button
                    v-for="(cell, c) in row"
                    :key="`${r}-${c}`"
                    class="bingo-cell"
                    :class="{ marked: isMarked(r, c), free: cell === '★ FREE ★' }"
                    @click="toggleCell(r, c)"
                  >
                    <span class="bingo-cell-text">{{ cell }}</span>
                  </button>
                </template>
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
  background: linear-gradient(135deg, #ec4899 0%, #db2777 100%);
  color: #fff; padding: 120px 20px 60px; text-align: center;
}
.tool-hero-content { max-width: 640px; margin: 0 auto; }
.tool-icon { font-size: 60px; margin-bottom: 16px; }
.tool-hero h1 { font-size: 40px; font-weight: 800; margin-bottom: 12px; }
.tool-hero p { font-size: 17px; opacity: .92; line-height: 1.6; }

.tool-main { padding: 40px 20px 60px; }

.bingo-layout { display: grid; grid-template-columns: 280px 1fr; gap: 24px; align-items: start; }
@media (max-width: 820px) { .bingo-layout { grid-template-columns: 1fr; } }

.bingo-controls {
  background: #fff; border-radius: 14px; padding: 24px;
  border: 1px solid #e2e8f0; box-shadow: 0 4px 16px rgba(0,0,0,.04);
}
.bingo-controls h2 { font-size: 18px; font-weight: 800; color: #0f172a; margin-bottom: 20px; }

.bingo-field { margin-bottom: 16px; }
.bingo-field label { display: block; font-size: 13px; font-weight: 700; color: #475569; margin-bottom: 6px; }
.bingo-select { width: 100%; min-height: 42px; border: 2px solid #e2e8f0; border-radius: 10px; padding: 0 12px; font-size: 14px; font-weight: 600; color: #0f172a; background: #fff; cursor: pointer; }
.bingo-select:focus { outline: none; border-color: #ec4899; }

.bingo-check { display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 600; color: #475569; margin-bottom: 20px; cursor: pointer; }
.bingo-check input { width: 18px; height: 18px; accent-color: #ec4899; }

.bingo-generate-btn {
  width: 100%; padding: 14px; border: none; border-radius: 10px;
  background: linear-gradient(135deg,#ec4899,#db2777); color: #fff;
  font-size: 15px; font-weight: 700; cursor: pointer; transition: all .15s;
}
.bingo-generate-btn:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(236,72,153,.3); }

.bingo-actions { display: flex; gap: 8px; margin-top: 12px; }
.bingo-action-btn {
  flex: 1; padding: 10px; border: 1px solid #e2e8f0; border-radius: 8px;
  background: #fff; font-size: 13px; font-weight: 700; color: #475569; cursor: pointer; transition: all .15s;
}
.bingo-action-btn:hover { border-color: #ec4899; color: #ec4899; }

.bingo-card-area {
  background: #fff; border-radius: 14px; padding: 28px;
  border: 1px solid #e2e8f0; box-shadow: 0 4px 16px rgba(0,0,0,.04);
  min-height: 400px; display: flex; align-items: center; justify-content: center;
}

.bingo-empty { text-align: center; color: #94a3b8; }
.bingo-empty-icon { font-size: 56px; margin-bottom: 12px; }
.bingo-empty h3 { font-size: 18px; font-weight: 700; color: #64748b; margin-bottom: 6px; }
.bingo-empty p { font-size: 14px; }

.bingo-card-title { text-align: center; font-size: 20px; font-weight: 800; color: #0f172a; margin-bottom: 16px; letter-spacing: 2px; text-transform: uppercase; }
.bingo-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 4px; max-width: 460px; margin: 0 auto; }
.bingo-header-cell { text-align: center; font-size: 22px; font-weight: 800; color: #ec4899; padding: 6px 0; }
.bingo-cell {
  aspect-ratio: 1; display: flex; align-items: center; justify-content: center;
  border: 2px solid #e2e8f0; border-radius: 8px; background: #fff;
  font-size: 11px; font-weight: 600; color: #334155; cursor: pointer;
  transition: all .1s; padding: 2px; text-align: center; line-height: 1.2; word-break: break-word;
}
.bingo-cell:hover { border-color: #ec4899; background: #fdf2f8; }
.bingo-cell.marked { border-color: #ec4899; background: #fdf2f8; }
.bingo-cell.free { background: linear-gradient(135deg,#ec4899,#db2777); color: #fff; border-color: #db2777; font-weight: 800; font-size: 13px; cursor: default; }

@media (max-width:640px) {
  .tool-hero h1 { font-size: 28px; }
  .bingo-cell { font-size: 9px; }
}
@media print {
  .tool-hero, .bingo-controls, .navbar { display: none !important; }
  .bingo-card-area { border: none; box-shadow: none; }
  .bingo-card { transform: scale(1.2); transform-origin: top center; }
}
</style>
