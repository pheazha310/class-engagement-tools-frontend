<script setup lang="ts">
import { ref, computed, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import * as XLSX from 'xlsx'

interface Student {
  id: number
  name: string
  initials: string
  color: string
}

interface Particle {
  id: number
  x: number
  y: number
  color: string
  size: number
  speedX: number
  speedY: number
  life: number
  maxLife: number
  rotation: number
  rotationSpeed: number
  shape: 'circle' | 'star' | 'square'
}

const SELECTED_NAMES_KEY = 'single-picker-selected-names'

function loadSelectedNames(): string[] {
  try {
    const saved = localStorage.getItem(SELECTED_NAMES_KEY)
    if (!saved) return []
    const parsed = JSON.parse(saved)
    return Array.isArray(parsed) ? parsed.filter(n => typeof n === 'string') : []
  } catch {
    return []
  }
}

function persistSelectedNames(names: string[]) {
  try {
    localStorage.setItem(SELECTED_NAMES_KEY, JSON.stringify(names))
  } catch {
    // localStorage full or unavailable
  }
}

const COLORS = [
  '#6366f1', '#ec4899', '#f59e0b', '#14b8a6',
  '#22c55e', '#ef4444', '#8b5cf6', '#06b6d4',
  '#f97316', '#10b981',
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

// ─── Sound Engine ───
let audioCtx: AudioContext | null = null

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext()
  }
  return audioCtx
}

function playTickSound() {
  try {
    const ctx = getAudioContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = 'sine'
    osc.frequency.value = 800 + Math.random() * 400
    gain.gain.setValueAtTime(0.08, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.05)
  } catch { /* audio not supported */ }
}

function playSelectedSound() {
  try {
    const ctx = getAudioContext()
    const frequencies = [523.25, 659.25, 783.99]
    frequencies.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.type = 'sine'
      osc.frequency.value = freq
      gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.08)
      gain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + i * 0.08 + 0.01)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8)
      osc.start(ctx.currentTime + i * 0.08)
      osc.stop(ctx.currentTime + 0.8)
    })
  } catch { /* audio not supported */ }
}

function playDrumRollSound() {
  try {
    const ctx = getAudioContext()
    for (let i = 0; i < 12; i++) {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.type = 'triangle'
      osc.frequency.value = 100 + Math.random() * 200
      const time = ctx.currentTime + i * 0.06
      gain.gain.setValueAtTime(0.04, time)
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.04)
      osc.start(time)
      osc.stop(time + 0.04)
    }
  } catch { /* audio not supported */ }
}

const students = ref<Student[]>([])
const namesInput = ref('')
const pickedStudent = ref<Student | null>(null)
const isPicking = ref(false)
const showResult = ref(false)
const pickLog = ref<{ name: string; time: Date }[]>([])
const highlightId = ref<number | null>(null)
const inputFocused = ref(false)
const selectedNames = ref<string[]>(loadSelectedNames())
const fileInput = ref<HTMLInputElement | null>(null)
const importError = ref<string | null>(null)
const importSuccess = ref<string | null>(null)
const importWarning = ref<string | null>(null)
const particles = ref<Particle[]>([])
const showConfetti = ref(false)
const cardGlowIntensity = ref(0)
let flashInterval: ReturnType<typeof setInterval> | null = null
let confettiInterval: ReturnType<typeof setInterval> | null = null
let glowInterval: ReturnType<typeof setInterval> | null = null
let importSuccessTimeout: ReturnType<typeof setTimeout> | null = null
let importWarningTimeout: ReturnType<typeof setTimeout> | null = null
let importErrorTimeout: ReturnType<typeof setTimeout> | null = null
let particleIdCounter = 0

onUnmounted(() => {
  if (flashInterval) clearInterval(flashInterval)
  if (confettiInterval) clearInterval(confettiInterval)
  if (glowInterval) clearInterval(glowInterval)
  if (importSuccessTimeout) clearTimeout(importSuccessTimeout)
  if (importWarningTimeout) clearTimeout(importWarningTimeout)
  if (importErrorTimeout) clearTimeout(importErrorTimeout)
  if (audioCtx) {
    audioCtx.close().catch(() => {})
    audioCtx = null
  }
})

const totalPicks = computed(() => pickLog.value.length)
const isEmpty = computed(() => students.value.length === 0)
const availableStudents = computed(() =>
  students.value.filter(s => !selectedNames.value.includes(s.name))
)
const isPoolExhausted = computed(() => availableStudents.value.length === 0)

// ─── Confetti System ───
function spawnConfetti(count: number, targetColor?: string) {
  const colors = targetColor
    ? [targetColor, ...COLORS.filter(c => c !== targetColor).slice(0, 5)]
    : COLORS
  const newParticles: Particle[] = []

  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2
    const velocity = 80 + Math.random() * 160
    particleIdCounter++
    newParticles.push({
      id: particleIdCounter,
      x: 50,
      y: 50,
      color: colors[Math.floor(Math.random() * colors.length)]!,
      size: 4 + Math.random() * 8,
      speedX: Math.cos(angle) * velocity,
      speedY: Math.sin(angle) * velocity - 120,
      life: 0,
      maxLife: 40 + Math.random() * 40,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 10,
      shape: (['circle', 'star', 'square'] as const)[Math.floor(Math.random() * 3)]!,
    })
  }
  particles.value = [...particles.value, ...newParticles]
  showConfetti.value = true

  if (confettiInterval) clearInterval(confettiInterval)
  confettiInterval = setInterval(() => {
    particles.value = particles.value
      .map(p => ({
        ...p,
        x: p.x + p.speedX * 0.016,
        y: p.y + p.speedY * 0.016,
        speedY: p.speedY + 300 * 0.016,
        life: p.life + 1,
        rotation: p.rotation + p.rotationSpeed,
      }))
      .filter(p => p.life < p.maxLife)

    if (particles.value.length === 0) {
      showConfetti.value = false
      if (confettiInterval) {
        clearInterval(confettiInterval)
        confettiInterval = null
      }
    }
  }, 16)
}

// ─── Card Glow Animation ───
function animateCardGlow() {
  let direction = 1
  let intensity = 0
  if (glowInterval) clearInterval(glowInterval)
  glowInterval = setInterval(() => {
    intensity += direction * 0.04
    if (intensity >= 1) direction = -1
    if (intensity <= 0.2) direction = 1
    cardGlowIntensity.value = intensity
  }, 30)
}

function stopCardGlow() {
  if (glowInterval) {
    clearInterval(glowInterval)
    glowInterval = null
  }
  cardGlowIntensity.value = 0
}

watch(showResult, (val) => {
  if (!val) {
    stopCardGlow()
    particles.value = []
    showConfetti.value = false
  }
})

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

function triggerFileImport() {
  if (fileInput.value) {
    fileInput.value.value = ''
  }
  fileInput.value?.click()
}

function parseSpreadsheet(file: File): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: 'array' })

        const allNames: string[] = []
        const headerPatterns = /^(name|student|full.?name|first.?name|last.?name|participant)$/i

        for (const sheetName of workbook.SheetNames) {
          const sheet = workbook.Sheets[sheetName]
          if (!sheet) continue

          const rows: unknown[][] = XLSX.utils.sheet_to_json(sheet, {
            header: 1,
            defval: '',
          })

          for (let rowIdx = 0; rowIdx < rows.length; rowIdx++) {
            const cell = rows[rowIdx]?.[0]
            const value = String(cell ?? '').trim()
            if (!value || value.length === 0) continue
            if (/^\d+$/.test(value)) continue
            if (rowIdx === 0 && headerPatterns.test(value)) continue
            allNames.push(value)
          }
        }

        resolve(deduplicateNames(allNames))
      } catch {
        reject(new Error('Failed to parse spreadsheet'))
      }
    }

    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsArrayBuffer(file)
  })
}

function parseImportedText(text: string, fileName?: string): string[] {
  const trimmed = text.trim()

  if (fileName?.endsWith('.json') || trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed)
      if (Array.isArray(parsed)) {
        const names = parsed
          .map((item) => (typeof item === 'string' ? item.trim() : ''))
          .filter((n) => n.length > 0)
        if (names.length > 0) return deduplicateNames(names)
      }
    } catch {
      // Fall through to text parsing
    }
  }

  const entries = trimmed
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split(/[\n,;]+/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)

  return deduplicateNames(entries)
}

function deduplicateNames(names: string[]): string[] {
  const unique: string[] = []
  const seen = new Set<string>()
  for (const name of names) {
    const lowered = name.toLowerCase()
    if (!seen.has(lowered)) {
      seen.add(lowered)
      unique.push(name)
    }
  }
  return unique
}

async function handleFileImport(event: Event) {
  importError.value = null
  importSuccess.value = null
  importWarning.value = null

  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  const isSpreadsheet = file.name.match(/\.(xlsx|xls|xlsm|xlsb|ods)$/i)
  const isTextFile = file.name.match(/\.(txt|csv|json|tsv)$/i)

  if (!isSpreadsheet && !isTextFile) {
    importError.value = 'Unsupported file format. Use .txt, .csv, .json, .xlsx, .xls, or .ods'
    return
  }

  try {
    let names: string[]

    if (isSpreadsheet) {
      names = await parseSpreadsheet(file)
    } else {
      const text = await file.text()
      names = parseImportedText(text, file.name)
    }

    if (names.length === 0) {
      importError.value = 'No valid names found in file'
      return
    }

    const existingNames = new Set(
      students.value.map((s) => s.name.toLowerCase()),
    )
    const duplicates = names.filter((n) => existingNames.has(n.toLowerCase()))
    const newNames = names.filter((n) => !existingNames.has(n.toLowerCase()))

    if (duplicates.length > 0) {
      importWarning.value = `Skipped ${duplicates.length} duplicate${duplicates.length !== 1 ? 's' : ''}: ${duplicates.slice(0, 3).join(', ')}${duplicates.length > 3 ? '...' : ''}`
      if (importWarningTimeout) clearTimeout(importWarningTimeout)
      importWarningTimeout = setTimeout(() => {
        importWarning.value = null
        importWarningTimeout = null
      }, 5000)
    }

    if (newNames.length > 0) {
      const startIndex = students.value.length
      const newStudents = newNames.map((name, i) => createStudent(name, startIndex + i))
      students.value.push(...newStudents)
      importSuccess.value = `Imported ${newStudents.length} student${newStudents.length !== 1 ? 's' : ''} from ${file.name}`
      if (importSuccessTimeout) clearTimeout(importSuccessTimeout)
      importSuccessTimeout = setTimeout(() => {
        importSuccess.value = null
        importSuccessTimeout = null
      }, 3000)
    }
  } catch {
    importError.value = 'Failed to read file'
    if (importErrorTimeout) clearTimeout(importErrorTimeout)
    importErrorTimeout = setTimeout(() => {
      importError.value = null
      importErrorTimeout = null
    }, 5000)
  }
}

function clearAllStudents() {
  students.value = []
  pickedStudent.value = null
  showResult.value = false
  particles.value = []
  showConfetti.value = false
  stopCardGlow()
}

function resetSelectionHistory() {
  selectedNames.value = []
  persistSelectedNames([])
}

function removeStudent(id: number) {
  students.value = students.value.filter(s => s.id !== id)
  if (pickedStudent.value?.id === id) {
    pickedStudent.value = null
    showResult.value = false
    particles.value = []
    showConfetti.value = false
    stopCardGlow()
  }
}

async function pickRandom() {
  if (isPicking.value || isEmpty.value) return

  const pool = availableStudents.value
  if (pool.length === 0) return

  isPicking.value = true
  showResult.value = false
  pickedStudent.value = null
  stopCardGlow()
  particles.value = []
  showConfetti.value = false

  playDrumRollSound()

  // Flash through students rapidly
  const flashDuration = 400
  const flashIntervalMs = 40
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
      const randomIdx = Math.floor(Math.random() * pool.length)
      const student = pool[randomIdx]
      if (student) {
        highlightId.value = student.id
        playTickSound()
      }
    }, flashIntervalMs)
  })

  const finalIdx = Math.floor(Math.random() * pool.length)
  const finalStudent = pool[finalIdx]
  if (!finalStudent) {
    isPicking.value = false
    return
  }
  pickedStudent.value = finalStudent
  highlightId.value = finalStudent.id
  showResult.value = true

  playSelectedSound()
  spawnConfetti(50, finalStudent.color)
  animateCardGlow()

  pickLog.value.unshift({ name: finalStudent.name, time: new Date() })
  selectedNames.value.push(finalStudent.name)
  persistSelectedNames(selectedNames.value)

  isPicking.value = false

  setTimeout(() => {
    highlightId.value = null
  }, 2000)
}

function formatTime(date: Date) {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}
</script>

<template>
  <div class="picker-page">
    <!-- Confetti overlay -->
    <div v-if="showConfetti" class="confetti-overlay">
      <div
        v-for="particle in particles"
        :key="particle.id"
        class="confetti-particle"
        :class="[`confetti-particle--${particle.shape}`]"
        :style="{
          left: particle.x + '%',
          top: particle.y + '%',
          width: particle.size + 'px',
          height: particle.size + 'px',
          background: particle.color,
          transform: `rotate(${particle.rotation}deg)`,
          opacity: Math.max(0, 1 - particle.life / particle.maxLife),
        }"
      />
    </div>

    <div class="picker-content">
      <div class="picker-layout">
        <!-- Left Column: Student Pool -->
        <section class="pool-section">
          <div class="section-header">
            <h2 class="section-header__title">Student Pool</h2>
            <div class="section-header__right">
              <span class="section-header__count">{{ students.length }} enrolled</span>
              <span v-if="selectedNames.length > 0" class="section-header__selected-badge">
                {{ selectedNames.length }} picked
              </span>
            </div>
          </div>

          <!-- Bulk add students -->
          <div class="bulk-form" :class="{ 'bulk-form--focused': inputFocused }">
            <textarea
              v-model="namesInput"
              class="bulk-form__textarea"
              placeholder="Enter student names, one per line&#10;e.g.:&#10;Alice&#10;Bob&#10;Charlie"
              @focus="inputFocused = true"
              @blur="inputFocused = false"
              rows="4"
            ></textarea>
            <div class="bulk-form__actions">
              <button
                class="bulk-form__btn"
                :disabled="!namesInput.trim()"
                @click="addAllStudents"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Add All
              </button>
              <button
                class="bulk-form__btn bulk-form__btn--import"
                @click="triggerFileImport"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                Import File
              </button>
              <input
                ref="fileInput"
                type="file"
                accept=".txt,.csv,.tsv,.json,.xlsx,.xls,.xlsm,.xlsb,.ods"
                class="file-input"
                @change="handleFileImport"
              />
              <button
                v-if="students.length > 0"
                class="bulk-form__btn bulk-form__btn--clear"
                @click="clearAllStudents"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
                Clear All
              </button>
            </div>
          </div>

          <!-- Import status messages -->
          <div v-if="importSuccess" class="import-status import-status--success">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            {{ importSuccess }}
          </div>
          <div v-if="importWarning" class="import-status import-status--warning">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            {{ importWarning }}
          </div>
          <div v-if="importError" class="import-status import-status--error">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
            {{ importError }}
          </div>

          <!-- Student grid -->
          <div v-if="!isEmpty" class="student-grid">
            <TransitionGroup name="list">
              <div
                v-for="student in students"
                :key="student.id"
                class="student-chip"
                :class="{
                  'student-chip--highlighted': highlightId === student.id,
                  'student-chip--picked': pickedStudent?.id === student.id && showResult,
                  'student-chip--selected': selectedNames.includes(student.name),
                }"
                :style="{
                  '--chip-color': student.color,
                  '--chip-glow': student.color + '40',
                }"
              >
                <div class="student-chip__avatar" :style="{ background: student.color }">
                  {{ student.initials }}
                </div>
                <span class="student-chip__name">{{ student.name }}</span>
                <span v-if="selectedNames.includes(student.name)" class="student-chip__check">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </span>
                <button
                  class="student-chip__remove"
                  title="Remove student"
                  @click="removeStudent(student.id)"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            </TransitionGroup>
          </div>

          <!-- Empty state -->
          <div v-else class="empty-state">
            <div class="empty-state__icon">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <line x1="19" y1="8" x2="19" y2="14" />
                <line x1="22" y1="11" x2="16" y2="11" />
              </svg>
            </div>
            <p class="empty-state__text">No students yet</p>
            <p class="empty-state__hint">Type or paste student names above, one per line, then click "Add All" — or import a .txt, .csv, .json, .xlsx, or .xls file</p>
          </div>
        </section>

        <!-- Right Column: Picker & Result -->
        <section class="picker-section">
          <!-- Main pick area -->
          <div class="pick-area" :class="{ 'pick-area--celebrating': showResult && pickedStudent }">
            <div class="pick-area__label">Pick a Student</div>

            <!-- Result display -->
            <div
              class="result-card"
              :class="{
                'result-card--visible': showResult && pickedStudent,
                'result-card--glowing': cardGlowIntensity > 0,
              }"
              :style="{
                '--glow-opacity': cardGlowIntensity,
                '--glow-color': pickedStudent?.color || '#6366f1',
              }"
            >
              <Transition name="reveal" mode="out-in">
                <div v-if="showResult && pickedStudent" :key="pickedStudent.id" class="result-card__inner" :style="{ '--chip-color': pickedStudent.color }">
                  <div class="result-card__avatar-wrapper">
                    <div
                      class="result-card__avatar"
                      :style="{ background: pickedStudent.color }"
                    >
                      {{ pickedStudent.initials }}
                    </div>
                    <div class="result-card__avatar-ring" :style="{ borderColor: pickedStudent.color }"></div>
                  </div>
                  <div class="result-card__name">{{ pickedStudent.name }}</div>
                  <div class="result-card__badge" :style="{ background: pickedStudent.color + '18', color: pickedStudent.color }">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Selected!
                  </div>
                  <div class="result-card__stats">
                    <span>#{{ pickLog.length }}</span>
                    <span class="result-card__stats-dot">·</span>
                    <span>{{ formatTime(new Date()) }}</span>
                  </div>
                </div>
                <div v-else class="result-card__placeholder">
                  <div class="result-card__placeholder-icon">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 6v6l4 2" />
                    </svg>
                  </div>
                  <p class="result-card__placeholder-text">
                    {{ isEmpty ? 'Add students to the pool first' : 'Click the button to pick randomly' }}
                  </p>
                </div>
              </Transition>
            </div>

            <!-- Pick button -->
            <button
              class="pick-btn"
              :class="{ 'pick-btn--picking': isPicking }"
              :disabled="isPicking || isEmpty || isPoolExhausted"
              @click="pickRandom"
            >
              <span v-if="isPicking" class="pick-btn__content">
                <span class="pick-btn__spinner"></span>
                Picking...
              </span>
              <span v-else-if="isPoolExhausted && !isEmpty" class="pick-btn__content">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 16v-4M12 8h.01" />
                </svg>
                All Students Selected
              </span>
              <span v-else class="pick-btn__content">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.3-4.3" />
                </svg>
                Pick Random Student
              </span>
            </button>

            <!-- Quick stats below pick button -->
            <div v-if="students.length > 0" class="pick-stats">
              <div class="pick-stats__item">
                <span class="pick-stats__value">{{ availableStudents.length }}</span>
                <span class="pick-stats__label">Available</span>
              </div>
              <div class="pick-stats__item">
                <span class="pick-stats__value">{{ selectedNames.length }}</span>
                <span class="pick-stats__label">Picked</span>
              </div>
              <div class="pick-stats__item">
                <span class="pick-stats__value">{{ Math.round((selectedNames.length / students.length) * 100) }}%</span>
                <span class="pick-stats__label">Progress</span>
              </div>
            </div>
          </div>

          <!-- Pick History -->
          <div class="history-section" v-if="pickLog.length > 0 || selectedNames.length > 0">
            <div class="section-header">
              <h2 class="section-header__title">Pick History</h2>
              <span class="section-header__count">
                {{ pickLog.length }} pick{{ pickLog.length !== 1 ? 's' : '' }}
                · {{ selectedNames.length }} selected
              </span>
            </div>
            <div v-if="selectedNames.length > 0" class="history-actions">
              <button class="reset-btn" @click="resetSelectionHistory">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                  <polyline points="1 4 1 10 7 10" />
                  <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                </svg>
                Reset Selection History
              </button>
            </div>
            <div class="history-list">
              <TransitionGroup name="history">
                <div
                  v-for="(entry, index) in pickLog"
                  :key="entry.time.getTime() + entry.name"
                  class="history-item"
                  :class="{ 'history-item--latest': index === 0 }"
                >
                  <span class="history-item__index">#{{ pickLog.length - index }}</span>
                  <span class="history-item__name">{{ entry.name }}</span>
                  <span class="history-item__time">{{ formatTime(entry.time) }}</span>
                </div>
              </TransitionGroup>
            </div>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<style scoped>
.picker-page {
  min-height: 100vh;
  padding-top: 64px;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  position: relative;
}

/* ── Confetti Overlay ── */
.confetti-overlay {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 1000;
  overflow: hidden;
}

.confetti-particle {
  position: absolute;
  border-radius: 2px;
  will-change: transform, opacity;
}

.confetti-particle--circle {
  border-radius: 50%;
}

.confetti-particle--star {
  clip-path: polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%);
}

.confetti-particle--square {
  border-radius: 2px;
}

/* ── Content ── */
.picker-content {
  max-width: 80rem;
  margin: 0 auto;
  padding: 1.5rem 2rem;
}

.picker-layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  align-items: start;
}

/* ── Section Header ── */
.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.section-header__title {
  font-size: 1rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
}

.section-header__right {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.section-header__count {
  font-size: 0.75rem;
  color: #94a3b8;
  font-weight: 500;
}

.section-header__selected-badge {
  font-size: 0.7rem;
  font-weight: 700;
  color: #6366f1;
  background: #eef2ff;
  padding: 0.2rem 0.5rem;
  border-radius: 999px;
}

/* ── Pool Section ── */
.pool-section {
  background: white;
  border-radius: 1rem;
  border: 1px solid #e2e8f0;
  padding: 1.25rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

/* Bulk add form */
.bulk-form {
  margin-bottom: 1rem;
  border-radius: 0.75rem;
  border: 2px solid #e2e8f0;
  padding: 0.3rem;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.bulk-form--focused {
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.bulk-form__textarea {
  width: 100%;
  border: none;
  outline: none;
  padding: 0.5rem 0.75rem;
  font-size: 0.9rem;
  font-family: inherit;
  color: #0f172a;
  background: transparent;
  resize: vertical;
  min-height: 3.5rem;
  line-height: 1.5;
}

.bulk-form__textarea::placeholder {
  color: #94a3b8;
  white-space: pre-line;
}

.bulk-form__actions {
  display: flex;
  gap: 0.5rem;
  padding: 0.3rem 0.5rem 0.5rem;
}

.bulk-form__btn {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: white;
  border: none;
  border-radius: 0.6rem;
  padding: 0.5rem 1rem;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.bulk-form__btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.bulk-form__btn:not(:disabled):hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.35);
}

.bulk-form__btn:not(:disabled):active {
  transform: translateY(0);
}

.bulk-form__btn--clear {
  background: white;
  color: #ef4444;
  border: 1.5px solid #fca5a5;
  box-shadow: none;
}

.bulk-form__btn--clear:not(:disabled):hover {
  background: #fef2f2;
  box-shadow: 0 2px 8px rgba(239, 68, 68, 0.2);
  border-color: #ef4444;
}

.bulk-form__btn--clear:not(:disabled):active {
  transform: translateY(0);
}

.bulk-form__btn--import {
  background: white;
  color: #059669;
  border: 1.5px solid #6ee7b7;
  box-shadow: none;
}

.bulk-form__btn--import:not(:disabled):hover {
  background: #ecfdf5;
  box-shadow: 0 2px 8px rgba(5, 150, 105, 0.2);
  border-color: #10b981;
}

.bulk-form__btn--import:not(:disabled):active {
  transform: translateY(0);
}

.file-input {
  display: none;
}

/* Student grid */
.student-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.student-chip {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  background: #f8fafc;
  border: 1.5px solid #e2e8f0;
  border-radius: 0.6rem;
  padding: 0.3rem 0.5rem 0.3rem 0.3rem;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
}

.student-chip:hover {
  border-color: #cbd5e1;
  background: #f1f5f9;
}

.student-chip--highlighted {
  border-color: var(--chip-color);
  background: color-mix(in srgb, var(--chip-color) 8%, white);
  box-shadow: 0 0 12px var(--chip-glow);
  transform: scale(1.05);
  animation: chip-highlight-pulse 0.3s ease;
}

@keyframes chip-highlight-pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1.05); }
}

.student-chip--picked {
  border-color: var(--chip-color);
  background: color-mix(in srgb, var(--chip-color) 12%, white);
  box-shadow: 0 0 20px var(--chip-glow);
}

.student-chip--selected {
  opacity: 0.55;
  pointer-events: none;
  border-color: #d1d5db;
  background: #f9fafb;
}

/* Import status messages */
.import-status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  border-radius: 0.5rem;
  font-size: 0.8rem;
  font-weight: 600;
  margin-bottom: 0.75rem;
  animation: status-slide 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes status-slide {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.import-status--success {
  background: #ecfdf5;
  color: #059669;
  border: 1px solid #a7f3d0;
}

.import-status--warning {
  background: #fffbeb;
  color: #d97706;
  border: 1px solid #fcd34d;
}

.import-status--error {
  background: #fef2f2;
  color: #dc2626;
  border: 1px solid #fca5a5;
}

.student-chip--selected .student-chip__name {
  text-decoration: line-through;
  color: #9ca3af;
}

.student-chip--selected .student-chip__remove {
  opacity: 0;
  pointer-events: none;
}

.student-chip__check {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.2rem;
  height: 1.2rem;
  color: #22c55e;
  flex-shrink: 0;
}

.student-chip__avatar {
  width: 1.75rem;
  height: 1.75rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 0.6rem;
  font-weight: 700;
  flex-shrink: 0;
}

.student-chip__name {
  font-size: 0.8rem;
  font-weight: 600;
  color: #334155;
  white-space: nowrap;
}

.student-chip__remove {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.2rem;
  height: 1.2rem;
  background: transparent;
  border: none;
  border-radius: 50%;
  color: #94a3b8;
  cursor: pointer;
  opacity: 0;
  transition: all 0.15s;
  flex-shrink: 0;
  padding: 0;
}

.student-chip:hover .student-chip__remove {
  opacity: 1;
}

.student-chip__remove:hover {
  background: #fee2e2;
  color: #ef4444;
}

/* Empty state */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2.5rem 1rem;
}

.empty-state__icon {
  margin-bottom: 0.75rem;
  opacity: 0.6;
}

.empty-state__text {
  font-size: 0.95rem;
  font-weight: 700;
  color: #64748b;
  margin: 0;
}

.empty-state__hint {
  font-size: 0.8rem;
  color: #94a3b8;
  margin: 0.25rem 0 0;
  text-align: center;
  max-width: 24rem;
}

/* ── Picker Section ── */
.picker-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.pick-area {
  background: white;
  border-radius: 1rem;
  border: 1px solid #e2e8f0;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.25rem;
  transition: box-shadow 0.3s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.pick-area--celebrating {
  box-shadow: 0 4px 24px rgba(99, 102, 241, 0.1);
}

.pick-area__label {
  font-size: 0.7rem;
  font-weight: 700;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

/* Result card */
.result-card {
  width: 100%;
  max-width: 18rem;
  min-height: 14rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 1rem;
  background: #f8fafc;
  border: 2px dashed #e2e8f0;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.result-card--visible {
  border-style: solid;
  border-color: #cbd5e1;
  background: white;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
}

.result-card--glowing {
  border-color: var(--glow-color);
  box-shadow:
    0 0 20px color-mix(in srgb, var(--glow-color) calc(30% * var(--glow-opacity)), transparent),
    0 0 60px color-mix(in srgb, var(--glow-color) calc(15% * var(--glow-opacity)), transparent),
    0 0 100px color-mix(in srgb, var(--glow-color) calc(8% * var(--glow-opacity)), transparent);
  animation: result-card-breathe 2s ease-in-out infinite;
}

@keyframes result-card-breathe {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.01); }
}

.result-card__inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 2rem;
  text-align: center;
}

.result-card__avatar-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.result-card__avatar {
  width: 5rem;
  height: 5rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.5rem;
  font-weight: 800;
  box-shadow: 0 8px 24px color-mix(in srgb, var(--chip-color, #6366f1) 35%, transparent);
  animation: result-pop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
  position: relative;
  z-index: 1;
}

.result-card__avatar-ring {
  position: absolute;
  inset: -6px;
  border-radius: 50%;
  border: 2.5px solid var(--chip-color, #6366f1);
  opacity: 0.4;
  animation: ring-expand 0.8s ease-out forwards;
}

@keyframes ring-expand {
  0% {
    transform: scale(0.8);
    opacity: 0.6;
  }
  100% {
    transform: scale(1.2);
    opacity: 0;
  }
}

@keyframes result-pop {
  0% { transform: scale(0); opacity: 0; }
  60% { transform: scale(1.15); }
  100% { transform: scale(1); opacity: 1; }
}

.result-card__name {
  font-size: 1.35rem;
  font-weight: 800;
  color: #0f172a;
  animation: result-text-fade 0.3s ease 0.2s both;
}

@keyframes result-text-fade {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

.result-card__badge {
  font-size: 0.65rem;
  font-weight: 700;
  color: #6366f1;
  background: #eef2ff;
  padding: 0.3rem 0.8rem;
  border-radius: 999px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  display: flex;
  align-items: center;
  gap: 0.3rem;
  animation: badge-pop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) 0.3s both;
}

@keyframes badge-pop {
  0% { transform: scale(0); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}

.result-card__stats {
  font-size: 0.7rem;
  color: #94a3b8;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.3rem;
  animation: result-text-fade 0.3s ease 0.4s both;
}

.result-card__stats-dot {
  font-weight: 700;
}

.result-card__placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 2rem;
  text-align: center;
}

.result-card__placeholder-icon {
  opacity: 0.5;
  animation: placeholder-pulse 2s ease-in-out infinite;
}

@keyframes placeholder-pulse {
  0%, 100% { opacity: 0.5; transform: scale(1); }
  50% { opacity: 0.7; transform: scale(1.05); }
}

.result-card__placeholder-text {
  font-size: 0.85rem;
  color: #94a3b8;
  margin: 0;
}

/* Pick button */
.pick-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: white;
  border: none;
  border-radius: 999px;
  padding: 0.85rem 2.5rem;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 14px rgba(99, 102, 241, 0.4);
  width: 100%;
  max-width: 20rem;
  position: relative;
  overflow: hidden;
}

.pick-btn::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, transparent 30%, rgba(255,255,255,0.15) 50%, transparent 70%);
  transform: translateX(-100%);
  transition: transform 0.6s;
}

.pick-btn:hover::before {
  transform: translateX(100%);
}

.pick-btn:not(:disabled):hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(99, 102, 241, 0.5);
}

.pick-btn:not(:disabled):active {
  transform: translateY(0);
  box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3);
}

.pick-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pick-btn--picking {
  background: linear-gradient(135deg, #4f46e5, #7c3aed);
  animation: pick-btn-rumble 0.1s ease-in-out infinite;
}

@keyframes pick-btn-rumble {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-1px); }
  75% { transform: translateX(1px); }
}

.pick-btn__content {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  position: relative;
  z-index: 1;
}

.pick-btn__spinner {
  width: 1.1rem;
  height: 1.1rem;
  border: 2.5px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Pick stats */
.pick-stats {
  display: flex;
  gap: 1.5rem;
  padding: 0.5rem 0 0;
  border-top: 1px solid #f1f5f9;
  width: 100%;
  justify-content: center;
}

.pick-stats__item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.15rem;
}

.pick-stats__value {
  font-size: 1.1rem;
  font-weight: 800;
  color: #0f172a;
  line-height: 1;
}

.pick-stats__label {
  font-size: 0.65rem;
  color: #94a3b8;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* ── History Section ── */
.history-section {
  background: white;
  border-radius: 1rem;
  border: 1px solid #e2e8f0;
  padding: 1.25rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.history-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.55rem 0.75rem;
  border-radius: 0.5rem;
  background: #f8fafc;
  transition: background 0.15s;
}

.history-item:hover {
  background: #f1f5f9;
}

.history-item--latest {
  background: linear-gradient(135deg, #eef2ff, #f5f3ff);
  border: 1px solid #c7d2fe;
  font-weight: 700;
}

.history-item__index {
  font-size: 0.7rem;
  font-weight: 700;
  color: #94a3b8;
  min-width: 1.8rem;
}

.history-item--latest .history-item__index {
  color: #6366f1;
}

.history-item__name {
  flex: 1;
  font-size: 0.85rem;
  font-weight: 600;
  color: #334155;
}

.history-item--latest .history-item__name {
  color: #4338ca;
}

.history-item__time {
  font-size: 0.7rem;
  color: #94a3b8;
  font-weight: 500;
}

.history-item--latest .history-item__time {
  color: #818cf8;
}

/* History actions */
.history-actions {
  margin-bottom: 0.75rem;
}

.reset-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  background: #fef2f2;
  color: #dc2626;
  border: 1px solid #fca5a5;
  border-radius: 0.5rem;
  padding: 0.4rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.reset-btn:hover {
  background: #fee2e2;
  border-color: #ef4444;
  transform: translateY(-1px);
  box-shadow: 0 2px 6px rgba(239, 68, 68, 0.2);
}

.reset-btn:active {
  transform: translateY(0);
}

/* ── Transitions ── */
.list-enter-active,
.list-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.list-enter-from {
  opacity: 0;
  transform: scale(0.8);
}

.list-leave-to {
  opacity: 0;
  transform: scale(0.8);
}

.list-move {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.reveal-enter-active {
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.reveal-leave-active {
  transition: all 0.2s ease;
}

.reveal-enter-from {
  opacity: 0;
  transform: scale(0.7) translateY(10px);
}

.reveal-leave-to {
  opacity: 0;
  transform: scale(0.9) translateY(-5px);
}

.history-enter-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.history-leave-active {
  transition: all 0.2s ease;
}

.history-enter-from {
  opacity: 0;
  transform: translateX(-10px);
}

.history-leave-to {
  opacity: 0;
  transform: translateX(10px);
}

/* ── Responsive ── */
@media (max-width: 768px) {
  .picker-layout {
    grid-template-columns: 1fr;
  }

  .picker-content {
    padding: 1rem;
  }

  .pick-btn {
    padding: 0.75rem 1.5rem;
    font-size: 0.9rem;
  }

  .result-card__avatar {
    width: 4rem;
    height: 4rem;
    font-size: 1.25rem;
  }

  .pick-stats {
    gap: 1rem;
  }
}
</style>