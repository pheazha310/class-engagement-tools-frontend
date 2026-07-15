<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue'
import { jsPDF } from 'jspdf'

interface Student {
  id: number
  name: string
  initials: string
  color: string
}

const COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f59e0b',
  '#14b8a6', '#22c55e', '#ef4444', '#06b6d4',
  '#f97316', '#84cc16', '#10b981', '#e11d48',
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
const pickCount = ref(2)
const selectedStudents = ref<Student[]>([])
const isPicking = ref(false)
const showResults = ref(false)
const pickLog = ref<{ students: string[]; time: Date }[]>([])
const highlightIds = ref<Set<number>>(new Set())
const inputFocused = ref(false)
const isExporting = ref(false)
let flashInterval: ReturnType<typeof setInterval> | null = null

onUnmounted(() => {
  if (flashInterval) {
    clearInterval(flashInterval)
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
}

function clearAllStudents() {
  students.value = []
  selectedStudents.value = []
  showResults.value = false
  pickCount.value = 1
}

function removeStudent(id: number) {
  students.value = students.value.filter(s => s.id !== id)
  selectedStudents.value = selectedStudents.value.filter(s => s.id !== id)
  if (selectedStudents.value.length === 0) {
    showResults.value = false
  }
  clampCount()
}

function clampCount() {
  if (pickCount.value < 1) pickCount.value = 1
  if (pickCount.value > students.value.length && students.value.length > 0) {
    pickCount.value = students.value.length
  }
}

async function pickMultiple() {
  if (isPicking.value || isEmpty.value) return

  const count = Math.min(pickCount.value, students.value.length)
  if (count < 1) return

  isPicking.value = true
  showResults.value = false
  selectedStudents.value = []
  highlightIds.value = new Set()

  const flashDuration = 1200
  const flashIntervalMs = 80
  const start = Date.now()

  await new Promise<void>((resolve) => {
    flashInterval = setInterval(() => {
      const elapsed = Date.now() - start
      if (elapsed >= flashDuration) {
        clearInterval(flashInterval!)
        flashInterval = null
        resolve()
        return
      }
      const shuffled = [...students.value].sort(() => Math.random() - 0.5)
      const flashSet = new Set(shuffled.slice(0, count).map(s => s.id))
      highlightIds.value = flashSet
    }, flashIntervalMs)
  })

  const shuffled = [...students.value].sort(() => Math.random() - 0.5)
  const finalPicks = shuffled.slice(0, count)

  selectedStudents.value = finalPicks
  highlightIds.value = new Set(finalPicks.map(s => s.id))
  showResults.value = true

  pickLog.value.unshift({
    students: finalPicks.map(s => s.name),
    time: new Date(),
  })

  isPicking.value = false

  setTimeout(() => {
    highlightIds.value = new Set()
  }, 2500)
}

function formatTime(date: Date) {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function formatDate(date: Date) {
  return date.toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' })
}

function exportToPDF() {
  if (selectedStudents.value.length === 0) return

  isExporting.value = true

  try {
    const doc = new jsPDF()
    const now = new Date()
    const pageWidth = doc.internal.pageSize.getWidth()

    // Header bar
    doc.setFillColor(37, 99, 235)
    doc.rect(0, 0, pageWidth, 28, 'F')

    // Title
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('Multiple Student Picker — Results', pageWidth / 2, 18, { align: 'center' })

    // Date & round info
    doc.setTextColor(100, 116, 139)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(`Exported: ${formatDate(now)} at ${formatTime(now)}`, pageWidth / 2, 38, { align: 'center' })

    const latestPick = pickLog.value[0]
    doc.text(`Round #${pickLog.value.length} — ${selectedStudents.value.length} student${selectedStudents.value.length !== 1 ? 's' : ''} selected`, pageWidth / 2, 46, { align: 'center' })

    // Separator
    doc.setDrawColor(226, 232, 240)
    doc.line(20, 53, pageWidth - 20, 53)

    // Student list header
    doc.setTextColor(37, 99, 235)
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text('Selected Students', 20, 64)

    // Student names
    doc.setTextColor(30, 41, 59)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')

    selectedStudents.value.forEach((student, index) => {
      const yPos = 76 + index * 8
      doc.circle(24, yPos - 2, 1.5, 'F')
      doc.text(`${index + 1}.  ${student.name}`, 30, yPos)
    })

    // Pool info
    const poolY = 76 + selectedStudents.value.length * 8 + 14
    doc.setDrawColor(226, 232, 240)
    doc.line(20, poolY - 4, pageWidth - 20, poolY - 4)

    doc.setTextColor(100, 116, 139)
    doc.setFontSize(9)
    doc.text(`Total students in pool: ${students.value.length}`, 20, poolY)

    if (latestPick) {
      const timeStr = formatTime(latestPick.time)
      doc.text(`Pick time: ${formatDate(latestPick.time)} at ${timeStr}`, 20, poolY + 7)
    }

    // Footer
    doc.setFillColor(248, 250, 252)
    doc.rect(0, doc.internal.pageSize.getHeight() - 16, pageWidth, 16, 'F')
    doc.setTextColor(148, 163, 184)
    doc.setFontSize(8)
    doc.text('Generated by ClassTools — EngageClassKH', pageWidth / 2, doc.internal.pageSize.getHeight() - 6, { align: 'center' })

    doc.save('selected-students.pdf')
  } finally {
    isExporting.value = false
  }
}
</script>

<template>
  <div class="page">
    <div class="container">
      <!-- Page Header -->
      <header class="header">
        <div class="header-icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        </div>
        <div>
          <h1 class="header-title">Pick Multiple Students</h1>
          <p class="header-subtitle">Select a group of students at once for team activities and group tasks. Choose how many to pick and let the system randomly select them.</p>
        </div>
      </header>

      <!-- Step 1: Add Students -->
      <section class="card">
        <div class="card-heading">
          <span class="step-badge">Step 1</span>
          <h2 class="card-title">Add Students</h2>
          <span v-if="students.length > 0" class="chip-count">{{ students.length }} student{{ students.length !== 1 ? 's' : '' }}</span>
        </div>

        <div class="input-area" :class="{ 'input-area--focused': inputFocused }">
          <textarea
            v-model="namesInput"
            class="input-area__textarea"
            placeholder="Paste or type student names, one per line&#10;e.g.&#10;Alice&#10;Bob&#10;Charlie"
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
              Add to pool
            </button>
            <button
              v-if="students.length > 0"
              class="btn btn--ghost"
              @click="clearAllStudents"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
              Clear all
            </button>
          </div>
        </div>

        <!-- Student Chips -->
        <div v-if="!isEmpty" class="chips">
          <TransitionGroup name="chip">
            <div
              v-for="student in students"
              :key="student.id"
              class="chip"
              :class="{
                'chip--active': highlightIds.has(student.id),
                'chip--picked': selectedStudents.some(s => s.id === student.id) && showResults,
              }"
              :style="{ '--chip-color': student.color }"
            >
              <div class="chip__avatar" :style="{ background: student.color }">
                {{ student.initials }}
              </div>
              <span class="chip__name">{{ student.name }}</span>
              <button class="chip__remove" @click="removeStudent(student.id)" title="Remove">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          </TransitionGroup>
        </div>

        <!-- Empty State -->
        <div v-else class="empty">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <line x1="19" y1="8" x2="19" y2="14" />
            <line x1="22" y1="11" x2="16" y2="11" />
          </svg>
          <p class="empty__text">No students added yet</p>
          <p class="empty__hint">Type names above and click "Add to pool"</p>
        </div>
      </section>

      <!-- Step 2: Pick -->
      <section class="card" :class="{ 'card--disabled': isEmpty }">
        <div class="card-heading">
          <span class="step-badge">Step 2</span>
          <h2 class="card-title">Pick Students</h2>
        </div>

        <div class="picker-controls">
          <div class="counter">
            <label class="counter__label">How many to pick?</label>
            <div class="counter__group">
              <button
                class="counter__btn"
                :disabled="pickCount <= 1 || isPicking"
                @click="pickCount = Math.max(1, pickCount - 1)"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round">
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </button>
              <div class="counter__value">
                <span class="counter__num">{{ pickCount }}</span>
              </div>
              <button
                class="counter__btn"
                :disabled="pickCount >= students.length || students.length === 0 || isPicking"
                @click="pickCount = Math.min(students.length, pickCount + 1)"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </button>
            </div>
            <span v-if="students.length > 0" class="counter__hint">Max {{ students.length }} student{{ students.length !== 1 ? 's' : '' }}</span>
          </div>

          <button
            class="pick-btn"
            :class="{ 'pick-btn--loading': isPicking }"
            :disabled="isPicking || isEmpty"
            @click="pickMultiple"
          >
            <span v-if="isPicking" class="pick-btn__inner">
              <span class="spinner"></span>
              Picking...
            </span>
            <span v-else class="pick-btn__inner">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
              Pick {{ pickCount }} student{{ pickCount !== 1 ? 's' : '' }}
            </span>
          </button>
        </div>
      </section>

      <!-- Results -->
      <Transition name="slide-up">
        <section v-if="showResults && selectedStudents.length > 0" class="card card--result">
          <div class="card-heading">
            <div class="card-heading__left">
              <span class="step-badge step-badge--success">Results</span>
              <h2 class="card-title">{{ selectedStudents.length }} Student{{ selectedStudents.length !== 1 ? 's' : '' }} Selected</h2>
            </div>
            <div class="card-heading__actions">
              <button
                class="btn btn--export"
                :disabled="isExporting"
                @click="exportToPDF"
              >
                <svg v-if="!isExporting" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="12" y1="18" x2="12" y2="12" />
                  <line x1="9" y1="15" x2="15" y2="15" />
                </svg>
                <span v-if="isExporting" class="spinner spinner--sm"></span>
                {{ isExporting ? 'Exporting...' : 'Export PDF' }}
              </button>
              <button class="btn btn--ghost btn--sm" @click="pickMultiple" :disabled="isPicking || isEmpty">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="1 4 1 10 7 10" />
                  <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                </svg>
                Pick again
              </button>
            </div>
          </div>
          <div class="results-grid">
            <div
              v-for="student in selectedStudents"
              :key="student.id"
              class="result-tile"
              :style="{ '--tile-color': student.color }"
            >
              <div class="result-tile__check">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <div class="result-tile__avatar" :style="{ background: student.color }">
                {{ student.initials }}
              </div>
              <span class="result-tile__name">{{ student.name }}</span>
            </div>
          </div>
        </section>
      </Transition>

      <!-- History -->
      <section v-if="pickLog.length > 0" class="card">
        <div class="card-heading">
          <div class="card-heading__left">
            <span class="step-badge step-badge--history">History</span>
            <h2 class="card-title">Previous Picks</h2>
          </div>
          <span class="history-total">{{ pickLog.length }} round{{ pickLog.length !== 1 ? 's' : '' }}</span>
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
                    {{ name }}<span v-if="i < entry.students.length - 1">,&nbsp;</span>
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
  background: #f5f5f7;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.container {
  max-width: 48rem;
  margin: 0 auto;
  padding: 2rem 1.5rem 3rem;
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
  width: 2.75rem;
  height: 2.75rem;
  background: #2563eb;
  color: white;
  border-radius: 0.75rem;
  flex-shrink: 0;
  margin-top: 0.125rem;
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2);
}

.header-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
  line-height: 1.3;
  letter-spacing: -0.02em;
}

.header-subtitle {
  font-size: 0.85rem;
  color: #64748b;
  margin: 0.25rem 0 0;
  line-height: 1.6;
}

/* ── Card ── */
.card {
  background: white;
  border-radius: 1rem;
  padding: 1.25rem 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.03);
  border: 1px solid #f1f5f9;
  transition: opacity 0.2s, border-color 0.2s;
}

.card--disabled {
  opacity: 0.45;
  pointer-events: none;
}

.card--result {
  border-color: #bbf7d0;
  background: linear-gradient(to bottom, #fafefc, white);
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

.card-heading__actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
}

.card-title {
  font-size: 0.95rem;
  font-weight: 600;
  color: #0f172a;
  margin: 0;
  white-space: nowrap;
}

.step-badge {
  font-size: 0.6rem;
  font-weight: 700;
  color: #2563eb;
  background: #eff6ff;
  padding: 0.2rem 0.55rem;
  border-radius: 0.375rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  white-space: nowrap;
  flex-shrink: 0;
}

.step-badge--success {
  color: #16a34a;
  background: #f0fdf4;
}

.step-badge--history {
  color: #64748b;
  background: #f1f5f9;
}

.chip-count {
  margin-left: auto;
  font-size: 0.75rem;
  font-weight: 600;
  color: #64748b;
  background: #f1f5f9;
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
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.08);
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
  background: #2563eb;
  color: white;
}

.btn--primary:hover:not(:disabled) {
  background: #1d4ed8;
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

.btn--ghost:hover:not(:disabled) {
  background: #f8fafc;
  color: #ef4444;
  border-color: #fca5a5;
}

.btn--sm {
  padding: 0.35rem 0.7rem;
  font-size: 0.75rem;
}

.btn--export {
  background: #0f172a;
  color: white;
}

.btn--export:hover:not(:disabled) {
  background: #1e293b;
}

.btn--export:disabled {
  opacity: 0.5;
  cursor: not-allowed;
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
  background: #fafafa;
  border: 1px solid #e2e8f0;
  border-radius: 999px;
  padding: 0.25rem 0.5rem 0.25rem 0.25rem;
  transition: all 0.2s ease;
}

.chip:hover {
  background: #f1f5f9;
  border-color: #cbd5e1;
}

.chip--active {
  border-color: var(--chip-color);
  background: color-mix(in srgb, var(--chip-color) 8%, white);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--chip-color) 20%, transparent);
  transform: scale(1.04);
}

.chip--picked {
  border-color: var(--chip-color);
  background: color-mix(in srgb, var(--chip-color) 12%, white);
  border-width: 1.5px;
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

/* ── Picker Controls ── */
.picker-controls {
  display: flex;
  align-items: center;
  gap: 1.25rem;
  flex-wrap: wrap;
}

.counter {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.4rem;
  flex: 1;
  min-width: 8rem;
}

.counter__label {
  font-size: 0.75rem;
  font-weight: 600;
  color: #64748b;
  margin: 0;
}

.counter__group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 0.625rem;
  padding: 0.35rem;
}

.counter__btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.75rem;
  height: 1.75rem;
  border: none;
  border-radius: 0.375rem;
  background: white;
  color: #64748b;
  cursor: pointer;
  transition: all 0.15s;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}

.counter__btn:not(:disabled):hover {
  background: #2563eb;
  color: white;
}

.counter__btn:disabled {
  opacity: 0.25;
  cursor: not-allowed;
}

.counter__value {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 2.5rem;
  padding: 0 0.25rem;
}

.counter__num {
  font-size: 1.5rem;
  font-weight: 700;
  color: #0f172a;
  line-height: 1;
}

.counter__hint {
  font-size: 0.65rem;
  color: #94a3b8;
  font-weight: 500;
}

/* ── Pick Button ── */
.pick-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #2563eb;
  color: white;
  border: none;
  border-radius: 0.75rem;
  padding: 0.875rem 2rem;
  font-size: 0.9375rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  flex: 1;
  min-width: 10rem;
  font-family: inherit;
}

.pick-btn:not(:disabled):hover {
  background: #1d4ed8;
  transform: translateY(-1px);
  box-shadow: 0 4px 14px rgba(37, 99, 235, 0.25);
}

.pick-btn:not(:disabled):active {
  transform: translateY(0);
}

.pick-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.pick-btn--loading {
  background: #3b82f6;
}

.pick-btn__inner {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.spinner {
  width: 1rem;
  height: 1rem;
  border: 2px solid rgba(255, 255, 255, 0.25);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

.spinner--sm {
  width: 0.85rem;
  height: 0.85rem;
  border-width: 1.5px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ── Results Grid ── */
.results-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.625rem;
}

.result-tile {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem 0.5rem 0.5rem;
  border-radius: 0.625rem;
  background: #fafafa;
  border: 1px solid #e2e8f0;
  position: relative;
  animation: tile-in 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}

.result-tile:nth-child(1) { animation-delay: 0s; }
.result-tile:nth-child(2) { animation-delay: 0.05s; }
.result-tile:nth-child(3) { animation-delay: 0.1s; }
.result-tile:nth-child(4) { animation-delay: 0.15s; }
.result-tile:nth-child(5) { animation-delay: 0.2s; }
.result-tile:nth-child(6) { animation-delay: 0.25s; }
.result-tile:nth-child(7) { animation-delay: 0.3s; }
.result-tile:nth-child(8) { animation-delay: 0.35s; }
.result-tile:nth-child(9) { animation-delay: 0.4s; }
.result-tile:nth-child(10) { animation-delay: 0.45s; }
.result-tile:nth-child(11) { animation-delay: 0.5s; }
.result-tile:nth-child(12) { animation-delay: 0.55s; }

.result-tile:hover {
  border-color: var(--tile-color);
  background: color-mix(in srgb, var(--tile-color) 5%, white);
}

@keyframes tile-in {
  0% { opacity: 0; transform: scale(0.7) translateY(8px); }
  100% { opacity: 1; transform: scale(1) translateY(0); }
}

.result-tile__check {
  position: absolute;
  top: -5px;
  right: -5px;
  width: 1.1rem;
  height: 1.1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #22c55e;
  color: white;
  border-radius: 50%;
  box-shadow: 0 2px 6px rgba(34, 197, 94, 0.35);
  animation: pop-in 0.25s cubic-bezier(0.34, 1.56, 0.64, 1) 0.3s both;
}

@keyframes pop-in {
  0% { transform: scale(0); }
  60% { transform: scale(1.2); }
  100% { transform: scale(1); }
}

.result-tile__avatar {
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 0.6rem;
  font-weight: 700;
  flex-shrink: 0;
  box-shadow: 0 2px 8px color-mix(in srgb, var(--tile-color) 25%, transparent);
}

.result-tile__name {
  font-size: 0.825rem;
  font-weight: 500;
  color: #334155;
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
  color: #2563eb;
  background: #eff6ff;
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

.slide-up-enter-active {
  transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.slide-up-leave-active {
  transition: all 0.2s ease;
}

.slide-up-enter-from {
  opacity: 0;
  transform: translateY(12px) scale(0.97);
}

.slide-up-leave-to {
  opacity: 0;
  transform: translateY(-8px);
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
@media (max-width: 768px) {
  .container {
    padding: 1.25rem 1rem 2rem;
    gap: 1rem;
  }

  .card {
    padding: 1rem 1.25rem;
  }

  .header-title {
    font-size: 1.25rem;
  }

  .header-subtitle {
    font-size: 0.8rem;
  }

  .picker-controls {
    flex-direction: column;
    align-items: stretch;
  }

  .counter {
    align-items: center;
  }

  .pick-btn {
    padding: 0.75rem 1.5rem;
  }

  .card-heading__actions {
    width: 100%;
    justify-content: flex-end;
  }
}

@media (max-width: 480px) {
  .header-icon {
    width: 2.25rem;
    height: 2.25rem;
  }

  .header-icon svg {
    width: 18px;
    height: 18px;
  }

  .card-heading__actions {
    flex-direction: column;
    align-items: stretch;
    gap: 0.4rem;
  }

  .btn--export {
    justify-content: center;
  }
}
</style>
