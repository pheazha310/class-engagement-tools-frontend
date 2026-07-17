<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue'
import * as XLSX from 'xlsx'

interface Student {
  id: number
  name: string
  initials: string
  color: string
}

const COLORS = [
  '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4',
  '#22c55e', '#f97316', '#ec4899', '#14b8a6',
  '#6366f1', '#84cc16', '#10b981', '#e11d48',
]

function getColor(index: number): string {
  return COLORS[index % COLORS.length]!
}

function createStudent(name: string, index: number): Student {
  return {
    id: Date.now() + index,
    name,
    initials: name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2),
    color: getColor(index),
  }
}

const students = ref<Student[]>([])
const namesInput = ref('')
const winners = ref<Student[]>([])
const showResult = ref(false)
const isSpinning = ref(false)
const spinningName = ref('')
const inputFocused = ref(false)
const pickLog = ref<{ students: string[]; time: Date }[]>([])
const showConfetti = ref(false)
const fileInputRef = ref<HTMLInputElement | null>(null)
const importError = ref('')

let spinInterval: ReturnType<typeof setInterval> | null = null

function playSound(soundFile: string) {
  const audio = new Audio(`/sounds/${soundFile}`)
  audio.volume = 0.5
  audio.play().catch(() => {
    // Ignore autoplay errors
  })
}

onUnmounted(() => {
  if (spinInterval) {
    clearInterval(spinInterval)
  }
})

const isEmpty = computed(() => students.value.length === 0)

function addAllStudents() {
  const raw = namesInput.value.trim()
  if (!raw) return

  const names = raw
    .split(/[\n,]+/)
    .map(n => n.trim())
    .filter(n => n.length > 0)

  if (names.length === 0) return

  const startIndex = students.value.length
  const newStudents = names.map((name, i) => createStudent(name, startIndex + i))
  students.value.push(...newStudents)
  namesInput.value = ''
  importError.value = ''
}

function triggerFileImport() {
  fileInputRef.value?.click()
}

async function handleFileImport(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  importError.value = ''

  try {
    const isExcel = file.name.match(/\.xlsx?$/i)

    if (isExcel) {
      // Parse Excel file
      const buffer = await file.arrayBuffer()
      const workbook = XLSX.read(buffer, { type: 'array' })
      const sheetName = workbook.SheetNames[0]
      if (!sheetName) {
        importError.value = 'No sheets found in the Excel file'
        return
      }
      const firstSheet = workbook.Sheets[sheetName]
      if (!firstSheet) {
        importError.value = 'No sheets found in the Excel file'
        return
      }

      // Convert sheet to JSON (array of arrays)
      const data: string[][] = XLSX.utils.sheet_to_json(firstSheet, { header: 1 })

      // Flatten all cells, filter out empty/non-string values, trim
      const names: string[] = []
      for (const row of data) {
        for (const cell of row) {
          if (cell && typeof cell === 'string' && cell.trim()) {
            names.push(cell.trim())
          }
        }
      }

      if (names.length === 0) {
        importError.value = 'No valid names found in the Excel file'
        return
      }

      const startIndex = students.value.length
      const newStudents = names.map((name, i) => createStudent(name, startIndex + i))
      students.value.push(...newStudents)
    } else {
      // Parse text/csv file
      const text = await file.text()
      const names = text
        .split(/[\n,;]+/)
        .map(n => n.trim())
        .filter(n => n.length > 0)

      if (names.length === 0) {
        importError.value = 'No valid names found in the file'
        return
      }

      const startIndex = students.value.length
      const newStudents = names.map((name, i) => createStudent(name, startIndex + i))
      students.value.push(...newStudents)
    }
  } catch (error) {
    importError.value = 'Failed to read file. Please try again.'
  }

  // Reset file input
  if (target) {
    target.value = ''
  }
}

function exportStudentList() {
  if (students.value.length === 0) return

  const names = students.value.map(s => s.name).join('\n')
  const blob = new Blob([names], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'student-list.txt'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function clearAllStudents() {
  students.value = []
  winners.value = []
  showResult.value = false
}

function removeStudent(id: number) {
  students.value = students.value.filter(s => s.id !== id)
  winners.value = winners.value.filter(s => s.id !== id)
  if (winners.value.length === 0) {
    showResult.value = false
  }
}

async function startDraw() {
  if (isSpinning.value || isEmpty.value) return

  const pool = students.value
  isSpinning.value = true
  showResult.value = false
  winners.value = []
  spinningName.value = ''

  // Play spin sound
  playSound('school-bell.wav')

  // Spin animation: rapidly cycle through student names
  const spinDuration = 2000
  const spinIntervalMs = 60
  const start = Date.now()

  await new Promise<void>((resolve) => {
    spinInterval = setInterval(() => {
      const elapsed = Date.now() - start
      if (elapsed >= spinDuration) {
        clearInterval(spinInterval!)
        spinInterval = null
        resolve()
        return
      }
      const randomStudent = pool[Math.floor(Math.random() * pool.length)]
      if (randomStudent) {
        spinningName.value = randomStudent.name
      }
    }, spinIntervalMs)
  })

  // Pick 1 winner
  const shuffled = [...pool].sort(() => Math.random() - 0.5)
  const finalWinners = shuffled.slice(0, 1)

  winners.value = finalWinners
  showResult.value = true
  spinningName.value = ''
  showConfetti.value = true

  // Play winner sound
  playSound('alarm.wav')

  pickLog.value.unshift({
    students: finalWinners.map(s => s.name),
    time: new Date(),
  })

  isSpinning.value = false

  // Hide confetti after 3 seconds
  setTimeout(() => {
    showConfetti.value = false
  }, 3000)
}

function formatTime(date: Date) {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function getConfettiStyle(index: number) {
  const colors = ['#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#22c55e', '#f97316', '#ec4899', '#14b8a6']
  const color = colors[index % colors.length]
  const left = Math.random() * 100
  const animationDelay = Math.random() * 2
  const duration = 2 + Math.random() * 2
  return {
    '--confetti-color': color,
    left: `${left}%`,
    animationDelay: `${animationDelay}s`,
    animationDuration: `${duration}s`,
  }
}
</script>

<template>
  <div class="page">
    <div class="container">
      <!-- Page Header -->
      <header class="header">
        <div class="header-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 2v4" />
            <path d="M12 18v4" />
            <path d="M2 12h4" />
            <path d="M18 12h4" />
            <path d="m4.93 4.93 2.83 2.83" />
            <path d="m16.24 16.24 2.83 2.83" />
            <path d="m4.93 19.07 2.83-2.83" />
            <path d="m16.24 7.76 2.83-2.83" />
            <path d="M12 6a6 6 0 1 0 0 12 6 6 0 0 0 0-12Z" />
          </svg>
        </div>
        <div>
          <h1 class="header-title">Lucky Draw</h1>
          <p class="header-subtitle">Add participants and draw one lucky winner with a fun spinning animation!</p>
        </div>
      </header>

      <!-- Step 1: Add Participants -->
      <section class="card">
        <div class="card-heading">
          <span class="step-badge">Step 1</span>
          <h2 class="card-title">Add Participants</h2>
          <span v-if="students.length > 0" class="chip-count">{{ students.length }} participant{{ students.length !== 1 ? 's' : '' }}</span>
        </div>

        <div class="input-area" :class="{ 'input-area--focused': inputFocused }">
          <textarea
            v-model="namesInput"
            class="input-area__textarea"
            placeholder="Enter names, one per line&#10;e.g.&#10;Alice&#10;Bob&#10;Charlie"
            @focus="inputFocused = true"
            @blur="inputFocused = false"
            rows="4"
          ></textarea>
          <div class="input-area__actions">
            <button
              class="btn btn--primary"
              :disabled="!namesInput.trim()"
              @click="addAllStudents"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Add to list
            </button>
            <button
              class="btn btn--secondary"
              @click="triggerFileImport"
              title="Import from file"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              Import
            </button>
            <input
              ref="fileInputRef"
              type="file"
              accept=".txt,.csv,.xlsx,.xls"
              style="display: none"
              @change="handleFileImport"
            />
            <button
              v-if="students.length > 0"
              class="btn btn--ghost"
              @click="exportStudentList"
              title="Export list"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Export
            </button>
            <button
              v-if="students.length > 0"
              class="btn btn--ghost btn--danger"
              @click="clearAllStudents"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
              Clear all
            </button>
          </div>
          <div v-if="importError" class="import-error">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            {{ importError }}
          </div>
        </div>

        <!-- Student Chips -->
        <div v-if="!isEmpty" class="chips">
          <TransitionGroup name="chip">
            <div
              v-for="student in students"
              :key="student.id"
              class="chip"
              :class="{ 'chip--winner': winners.some(s => s.id === student.id) && showResult }"
              :style="{ '--chip-color': student.color }"
            >
              <div class="chip__avatar" :style="{ background: student.color }">
                {{ student.initials }}
              </div>
              <span class="chip__name">{{ student.name }}</span>
              <button class="chip__remove" @click="removeStudent(student.id)" title="Remove">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
              <div v-if="winners.some(s => s.id === student.id) && showResult" class="chip__crown">👑</div>
            </div>
          </TransitionGroup>
        </div>

        <div v-else class="empty">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <line x1="19" y1="8" x2="19" y2="14" />
            <line x1="22" y1="11" x2="16" y2="11" />
          </svg>
          <p class="empty__text">No participants added yet</p>
          <p class="empty__hint">Add names above, then click the Lucky Draw button</p>
        </div>
      </section>

      <!-- Step 2: Lucky Draw -->
      <section class="card draw-card" :class="{ 'card--disabled': isEmpty }">
        <div class="card-heading">
          <span class="step-badge step-badge--gold">Step 2</span>
          <h2 class="card-title">Spin the Wheel</h2>
        </div>

        <!-- Draw Result Area -->
        <div class="draw-area">
          <!-- Spinning state -->
          <div v-if="isSpinning" class="wheel-circle wheel-circle--spinning">
            <div class="wheel-circle__ring"></div>
            <div class="wheel-circle__ring wheel-circle__ring--2"></div>
            <div class="wheel-circle__ring wheel-circle__ring--3"></div>
            <div class="wheel-circle__inner">
              <div class="wheel-circle__label">Drawing...</div>
              <div class="wheel-circle__name">{{ spinningName }}</div>
            </div>
          </div>

          <!-- Results state: winner inside circle -->
          <div v-else-if="showResult && winners.length > 0" class="wheel-circle wheel-circle--result">
            <div class="wheel-circle__ring wheel-circle__ring--pulse"></div>
            <div class="wheel-circle__inner">
              <div class="wheel-circle__winner">
                <div class="wheel-circle__prize">🎉</div>
                <div class="wheel-circle__winner-avatar" :style="{ background: winners[0]?.color }">
                  {{ winners[0]?.initials }}
                </div>
                <div class="wheel-circle__winner-name">{{ winners[0]?.name }}</div>
              </div>
            </div>
          </div>

          <!-- Placeholder state -->
          <div v-else class="wheel-circle">
            <div class="wheel-circle__ring"></div>
            <div class="wheel-circle__inner">
              <svg class="wheel-circle__placeholder-icon" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 2v4" />
                <path d="M12 18v4" />
                <path d="M2 12h4" />
                <path d="M18 12h4" />
                <path d="m4.93 4.93 2.83 2.83" />
                <path d="m16.24 16.24 2.83 2.83" />
                <path d="m4.93 19.07 2.83-2.83" />
                <path d="m16.24 7.76 2.83-2.83" />
                <path d="M12 6a6 6 0 1 0 0 12 6 6 0 0 0 0-12Z" />
              </svg>
              <div class="wheel-circle__placeholder-text">
                {{ isEmpty ? 'Add participants' : 'Click Draw!' }}
              </div>
            </div>
          </div>
        </div>

        <!-- Draw Button -->
        <button
          class="draw-btn"
          :class="{ 'draw-btn--spinning': isSpinning }"
          :disabled="isSpinning || isEmpty"
          @click="startDraw"
        >
          <span v-if="isSpinning" class="draw-btn__inner">
            <span class="spinner"></span>
            Drawing...
          </span>
          <span v-else class="draw-btn__inner">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 2v4" />
              <path d="M12 18v4" />
              <path d="M2 12h4" />
              <path d="M18 12h4" />
              <path d="m4.93 4.93 2.83 2.83" />
              <path d="m16.24 16.24 2.83 2.83" />
              <path d="m4.93 19.07 2.83-2.83" />
              <path d="m16.24 7.76 2.83-2.83" />
            </svg>
            Lucky Draw!
          </span>
        </button>
      </section>

      <!-- Confetti -->
      <div v-if="showConfetti" class="confetti-container">
        <div v-for="i in 50" :key="i" class="confetti" :style="getConfettiStyle(i)"></div>
      </div>

      <!-- History -->
      <section v-if="pickLog.length > 0" class="card">
        <div class="card-heading">
          <div class="card-heading__left">
            <span class="step-badge step-badge--history">History</span>
            <h2 class="card-title">Previous Draws</h2>
          </div>
          <span class="history-total">{{ pickLog.length }} draw{{ pickLog.length !== 1 ? 's' : '' }}</span>
        </div>
        <div class="history-list">
          <TransitionGroup name="history-item">
            <div
              v-for="(entry, index) in pickLog"
              :key="entry.time.getTime() + entry.students.join(',')"
              class="history-row"
            >
              <span class="history-row__index">#{{ pickLog.length - index }}</span>
              <div class="history-row__info">
                <div class="history-row__names">
                  <span v-for="(name, i) in entry.students" :key="name" class="history-row__name">
                    {{ name }}<span v-if="i < entry.students.length - 1">&nbsp;🎉&nbsp;</span>
                  </span>
                </div>
              </div>
              <div class="history-row__meta">
                <span class="history-row__count">{{ entry.students.length }}</span>
                <span class="history-row__time">{{ formatTime(entry.time) }}</span>
              </div>
            </div>
          </TransitionGroup>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
/* ── Page ── */
.page {
  min-height: 100vh;
  background: linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #2563eb 100%);
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  position: relative;
  overflow-x: hidden;
}

.page::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: 
    radial-gradient(circle at 20% 80%, rgba(59, 130, 246, 0.15) 0%, transparent 50%),
    radial-gradient(circle at 80% 20%, rgba(139, 92, 246, 0.15) 0%, transparent 50%);
  pointer-events: none;
}

.container {
  max-width: 48rem;
  margin: 0 auto;
  padding: 2.5rem 1.5rem 3rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

/* ── Header ── */
.header {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 0 0.25rem;
}

.header-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 3.5rem;
  height: 3.5rem;
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  color: white;
  border-radius: 1rem;
  flex-shrink: 0;
  box-shadow: 
    0 4px 16px rgba(59, 130, 246, 0.3),
    0 0 0 1px rgba(255, 255, 255, 0.1);
  animation: pulse-glow 2s ease-in-out infinite;
  position: relative;
}

.header-icon::after {
  content: '';
  position: absolute;
  inset: -4px;
  border-radius: 1.25rem;
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  opacity: 0.3;
  filter: blur(12px);
  z-index: -1;
  animation: pulse-glow 2s ease-in-out infinite;
}

@keyframes pulse-glow {
  0%, 100% { box-shadow: 0 4px 16px rgba(59, 130, 246, 0.3); }
  50% { box-shadow: 0 4px 24px rgba(59, 130, 246, 0.5); }
}

.header-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: white;
  margin: 0;
  line-height: 1.3;
  letter-spacing: -0.02em;
}

.header-subtitle {
  font-size: 0.85rem;
  color: #bfdbfe;
  margin: 0.25rem 0 0;
  line-height: 1.6;
}

/* ── Card ── */
.card {
  background: white;
  border-radius: 1rem;
  padding: 1.25rem 1.5rem;
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
  transition: opacity 0.2s, border-color 0.2s;
}

.card--disabled {
  opacity: 0.4;
  pointer-events: none;
}

.draw-card {
  background: linear-gradient(135deg, #f8fbff 0%, #f0f7ff 100%);
  border-color: rgba(59, 130, 246, 0.3);
  box-shadow: 
    0 1px 3px rgba(0,0,0,0.04),
    0 0 0 1px rgba(59, 130, 246, 0.05);
  position: relative;
  overflow: hidden;
}

.draw-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, #3b82f6, #8b5cf6, #3b82f6);
  background-size: 200% 100%;
  animation: gradient-shift 3s ease-in-out infinite;
}

@keyframes gradient-shift {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}

.card-heading {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.card-heading__left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1;
  min-width: 0;
}

.card-title {
  font-size: 0.95rem;
  font-weight: 600;
  color: #0f172a;
  margin: 0;
}

.step-badge {
  font-size: 0.6rem;
  font-weight: 700;
  color: #60a5fa;
  background: rgba(59, 130, 246, 0.15);
  padding: 0.2rem 0.55rem;
  border-radius: 0.375rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  white-space: nowrap;
  flex-shrink: 0;
}

.step-badge--gold {
  color: #60a5fa;
  background: rgba(59, 130, 246, 0.15);
}

.step-badge--history {
  color: #94a3b8;
  background: rgba(148, 163, 184, 0.15);
}

.chip-count {
  margin-left: auto;
  font-size: 0.75rem;
  font-weight: 600;
  color: #60a5fa;
  background: rgba(59, 130, 246, 0.15);
  padding: 0.2rem 0.6rem;
  border-radius: 999px;
  white-space: nowrap;
}

/* ── Input Area ── */
.input-area {
  border: 1.5px solid #e2e8f0;
  border-radius: 0.75rem;
  padding: 0.5rem;
  transition: border-color 0.2s, box-shadow 0.2s;
  background: #fafafa;
}

.input-area--focused {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.12);
  background: white;
}

.input-area__textarea {
  width: 100%;
  border: none;
  outline: none;
  padding: 0.4rem 0.5rem;
  font-size: 0.875rem;
  font-family: inherit;
  color: #0f172a;
  background: transparent;
  resize: vertical;
  min-height: 3rem;
  line-height: 1.6;
}

.input-area__textarea::placeholder {
  color: #94a3b8;
  white-space: pre-line;
}

.input-area__actions {
  display: flex;
  gap: 0.5rem;
  padding: 0.3rem 0.4rem 0.1rem;
}

/* ── Buttons ── */
.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  border: none;
  border-radius: 0.5rem;
  padding: 0.45rem 0.85rem;
  font-size: 0.8125rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;
  font-family: inherit;
}

.btn--primary {
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
  color: white;
}

.btn--primary:hover:not(:disabled) {
  background: linear-gradient(135deg, #60a5fa, #3b82f6);
  transform: translateY(-1px);
}

.btn--primary:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.btn--ghost {
  background: transparent;
  color: #64748b;
  border: 1px solid #e2e8f0;
}

.btn--secondary {
  background: #f8fafc;
  color: #475569;
  border: 1px solid #e2e8f0;
}

.btn--secondary:hover:not(:disabled) {
  background: #f1f5f9;
  color: #0f172a;
  border-color: #cbd5e1;
}

.btn--ghost:hover:not(:disabled) {
  background: #f8fafc;
  color: #ef4444;
  border-color: #fca5a5;
}

.btn--danger:hover:not(:disabled) {
  background: #fef2f2;
  color: #dc2626;
  border-color: #fecaca;
}

/* ── Student Chips ── */
.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-top: 1rem;
}

.chip {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 999px;
  padding: 0.25rem 0.5rem 0.25rem 0.25rem;
  transition: all 0.2s ease;
  position: relative;
}

.chip:hover {
  background: #f1f5f9;
  border-color: #cbd5e1;
}

.chip--winner {
  border-color: var(--chip-color);
  background: color-mix(in srgb, var(--chip-color) 15%, transparent);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--chip-color) 30%, transparent);
  padding-right: 1.4rem;
}

.chip__crown {
  position: absolute;
  right: 0.25rem;
  font-size: 0.75rem;
  animation: bounce-crown 1s ease-in-out infinite;
}

@keyframes bounce-crown {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-3px); }
}

.chip__avatar {
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 0.55rem;
  font-weight: 700;
  flex-shrink: 0;
}

.chip__name {
  font-size: 0.8rem;
  font-weight: 500;
  color: #334155;
}

.chip__remove {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.1rem;
  height: 1.1rem;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: #94a3b8;
  cursor: pointer;
  opacity: 0;
  transition: all 0.15s;
  flex-shrink: 0;
  padding: 0;
}

.chip:hover .chip__remove {
  opacity: 1;
}

.chip__remove:hover {
  background: #fee2e2;
  color: #ef4444;
}

/* ── Empty State ── */
.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1.5rem 1rem 0.5rem;
  gap: 0.25rem;
}

.empty__text {
  font-size: 0.875rem;
  font-weight: 600;
  color: #94a3b8;
  margin: 0.5rem 0 0;
}

.empty__hint {
  font-size: 0.75rem;
  color: #b0bccf;
  margin: 0;
}

/* ── Import Error ── */
.import-error {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 0.5rem;
  font-size: 0.75rem;
  color: #dc2626;
  font-weight: 500;
}

.import-error svg {
  flex-shrink: 0;
  color: #dc2626;
}

/* ── Draw Area ── */
.draw-area {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin-bottom: 1rem;
  padding: 0.75rem 0;
  min-height: 8rem;
}

/* ── Wheel Circle ── */
.wheel-circle {
  width: 15rem;
  height: 15rem;
  border-radius: 50%;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.3s ease;
}

.wheel-circle__ring {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 2px solid rgba(59, 130, 246, 0.15);
  transition: all 0.4s ease;
  box-shadow: 
    0 0 0 1px rgba(59, 130, 246, 0.05),
    inset 0 0 20px rgba(59, 130, 246, 0.02);
}

.wheel-circle--spinning .wheel-circle__ring {
  border-color: rgba(59, 130, 246, 0.3);
  border-top-color: #3b82f6;
  border-right-color: #8b5cf6;
  animation: spin-ring 1s linear infinite;
  box-shadow: 
    0 0 30px rgba(59, 130, 246, 0.2),
    inset 0 0 30px rgba(59, 130, 246, 0.05);
}

.wheel-circle--spinning .wheel-circle__ring--2 {
  inset: 0.75rem;
  border-color: rgba(139, 92, 246, 0.2);
  border-left-color: #8b5cf6;
  border-bottom-color: #a78bfa;
  animation: spin-ring 1.5s linear infinite reverse;
}

.wheel-circle--spinning .wheel-circle__ring--3 {
  inset: 1.5rem;
  border-color: rgba(59, 130, 246, 0.15);
  border-top-color: #60a5fa;
  animation: spin-ring 2s linear infinite;
}

.wheel-circle__ring--pulse {
  border-color: rgba(59, 130, 246, 0.4);
  box-shadow:
    0 0 30px rgba(59, 130, 246, 0.25),
    0 0 60px rgba(139, 92, 246, 0.15),
    inset 0 0 30px rgba(59, 130, 246, 0.08);
  animation: pulse-ring 1.5s ease-in-out infinite;
}

.wheel-circle__inner {
  position: relative;
  z-index: 1;
  width: calc(100% - 3.5rem);
  height: calc(100% - 3.5rem);
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  background: radial-gradient(circle at 35% 35%, rgba(59, 130, 246, 0.08), rgba(139, 92, 246, 0.04), rgba(0, 0, 0, 0.02));
  backdrop-filter: blur(8px);
  transition: all 0.3s ease;
  box-shadow: inset 0 2px 10px rgba(0, 0, 0, 0.05);
}

.wheel-circle--spinning .wheel-circle__inner {
  background: radial-gradient(circle at 35% 35%, rgba(59, 130, 246, 0.12), rgba(139, 92, 246, 0.08), rgba(0, 0, 0, 0.04));
  animation: inner-glow 0.6s ease-in-out infinite alternate;
}

.wheel-circle--result .wheel-circle__inner {
  background: radial-gradient(circle at 35% 35%, rgba(59, 130, 246, 0.16), rgba(139, 92, 246, 0.1), rgba(0, 0, 0, 0.05));
  box-shadow: inset 0 2px 20px rgba(59, 130, 246, 0.15);
}

.wheel-circle__label {
  font-size: 0.6rem;
  font-weight: 700;
  color: #3b82f6;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.wheel-circle__name {
  font-size: 1.25rem;
  font-weight: 800;
  color: #0f172a;
  animation: flicker 0.06s linear infinite;
  text-align: center;
  padding: 0 0.75rem;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@keyframes flicker {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.8; }
}

.wheel-circle__winner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.3rem;
  animation: winner-appear 0.4s ease-out;
}

@keyframes winner-appear {
  from { opacity: 0; transform: scale(0.8); }
  to { opacity: 1; transform: scale(1); }
}

.wheel-circle__prize {
  font-size: 1.5rem;
  animation: bounce 1.5s ease-in-out infinite;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0) scale(1); }
  50% { transform: translateY(-4px) scale(1.1); }
}

.wheel-circle__winner-avatar {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 0.75rem;
  font-weight: 700;
  box-shadow: 0 3px 14px color-mix(in srgb, var(--w-color) 40%, transparent);
}

.wheel-circle__winner-name {
  font-size: 1rem;
  font-weight: 700;
  color: #0f172a;
  text-align: center;
  max-width: 8rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.wheel-circle__placeholder-icon {
  width: 1.75rem;
  height: 1.75rem;
  color: #94a3b8;
  margin-bottom: 0.25rem;
}

.wheel-circle__placeholder-text {
  font-size: 0.75rem;
  font-weight: 500;
  color: #94a3b8;
  text-align: center;
}

@keyframes spin-ring {
  to { transform: rotate(360deg); }
}

@keyframes pulse-ring {
  0%, 100% { transform: scale(1); opacity: 0.6; }
  50% { transform: scale(1.06); opacity: 1; }
}

@keyframes inner-glow {
  from { box-shadow: 0 0 8px rgba(59, 130, 246, 0.06); }
  to { box-shadow: 0 0 30px rgba(59, 130, 246, 0.18); }
}

@keyframes bounce-crown {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-3px); }
}

/* ── Draw Button ── */
.draw-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  color: white;
  border: none;
  border-radius: 1rem;
  padding: 1.1rem 2.5rem;
  font-size: 1.125rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  width: 100%;
  max-width: 24rem;
  margin: 0 auto;
  font-family: inherit;
  box-shadow: 
    0 4px 20px rgba(59, 130, 246, 0.35),
    0 0 0 1px rgba(255, 255, 255, 0.1);
  position: relative;
  overflow: hidden;
}

.draw-btn::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, #60a5fa, #a78bfa);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.draw-btn:not(:disabled):hover {
  transform: translateY(-3px) scale(1.02);
  box-shadow: 
    0 8px 32px rgba(59, 130, 246, 0.45),
    0 0 0 1px rgba(255, 255, 255, 0.2);
}

.draw-btn:not(:disabled):hover::before {
  opacity: 1;
}

.draw-btn:not(:disabled):active {
  transform: translateY(-1px) scale(1.01);
  box-shadow: 
    0 4px 20px rgba(59, 130, 246, 0.35),
    0 0 0 1px rgba(255, 255, 255, 0.1);
}

.draw-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  box-shadow: none;
}

.draw-btn--spinning {
  background: linear-gradient(135deg, #1e40af, #5b21b6);
  color: #93c5fd;
  cursor: not-allowed;
  transform: none;
  box-shadow: 
    0 4px 20px rgba(30, 64, 175, 0.3),
    0 0 0 1px rgba(255, 255, 255, 0.05);
}

.draw-btn__inner {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.spinner {
  width: 1.1rem;
  height: 1.1rem;
  border: 2px solid rgba(147, 197, 253, 0.25);
  border-top-color: #93c5fd;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ── History ── */
.history-total {
  margin-left: auto;
  font-size: 0.75rem;
  font-weight: 600;
  color: #64748b;
  background: #f1f5f9;
  padding: 0.2rem 0.6rem;
  border-radius: 999px;
  white-space: nowrap;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.history-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 0.7rem;
  border-radius: 0.5rem;
  transition: background 0.15s;
}

.history-row:hover {
  background: #f8fafc;
}

.history-row__index {
  font-size: 0.7rem;
  font-weight: 700;
  color: #94a3b8;
  min-width: 1.5rem;
  flex-shrink: 0;
}

.history-row__info {
  flex: 1;
  min-width: 0;
}

.history-row__names {
  font-size: 0.8rem;
  color: #475569;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.history-row__name {
  font-weight: 500;
}

.history-row__meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
}

.history-row__count {
  font-size: 0.65rem;
  font-weight: 700;
  color: #60a5fa;
  background: rgba(59, 130, 246, 0.12);
  padding: 0.1rem 0.45rem;
  border-radius: 0.25rem;
}

.history-row__time {
  font-size: 0.7rem;
  color: #94a3b8;
  font-weight: 500;
}

/* ── Transitions ── */
.chip-enter-active,
.chip-leave-active {
  transition: all 0.25s ease;
}

.chip-enter-from {
  opacity: 0;
  transform: scale(0.75);
}

.chip-leave-to {
  opacity: 0;
  transform: scale(0.75);
}

.chip-move {
  transition: transform 0.25s ease;
}

.history-item-enter-active {
  transition: all 0.3s ease;
}

.history-item-leave-active {
  transition: all 0.2s ease;
}

.history-item-enter-from {
  opacity: 0;
  transform: translateX(-8px);
}

.history-item-leave-to {
  opacity: 0;
  transform: translateX(8px);
}

/* ── Responsive ── */
@media (max-width: 640px) {
  .container {
    padding: 1.5rem 1rem 2rem;
    gap: 1rem;
  }

  .card {
    padding: 1rem 1.25rem;
  }

  .header-title {
    font-size: 1.25rem;
  }

  .wheel-circle {
    width: 12rem;
    height: 12rem;
  }

  .wheel-circle__name {
    font-size: 1.05rem;
  }

  .wheel-circle__winner-name {
    font-size: 0.85rem;
    max-width: 6rem;
  }

  .wheel-circle__winner-avatar {
    width: 2rem;
    height: 2rem;
    font-size: 0.65rem;
  }

  .draw-btn {
    padding: 0.85rem 1.5rem;
    font-size: 1rem;
  }

  .input-area__actions {
    flex-wrap: wrap;
  }
}

/* ── Confetti ── */
.confetti-container {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 1000;
  overflow: hidden;
}

.confetti {
  position: absolute;
  top: -10px;
  width: 8px;
  height: 8px;
  background: var(--confetti-color);
  border-radius: 2px;
  animation: confetti-fall var(--animation-duration, 3s) ease-in-out var(--animation-delay, 0s) forwards;
}

@keyframes confetti-fall {
  0% {
    transform: translateY(0) rotate(0deg);
    opacity: 1;
  }
  100% {
    transform: translateY(100vh) rotate(720deg);
    opacity: 0;
  }
}
</style>
