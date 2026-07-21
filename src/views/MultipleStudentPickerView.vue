<script setup lang="ts">
import { ref, computed, onUnmounted, watch } from 'vue'
import { jsPDF } from 'jspdf'
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

// ─── localStorage persistence ───
const SELECTED_NAMES_KEY = 'multiple-picker-selected-names'

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
      const time = ctx.currentTime + i * 0.05
      gain.gain.setValueAtTime(0.04, time)
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.04)
      osc.start(time)
      osc.stop(time + 0.04)
    }
  } catch { /* audio not supported */ }
}

const students = ref<Student[]>([])
const namesInput = ref('')
const pickCount = ref(2)
const isPicking = ref(false)
const showResults = ref(false)
const selectedStudents = ref<Student[]>([])
const pickLog = ref<{ students: string[]; time: Date }[]>([])
const highlightIds = ref<Set<number>>(new Set())
const inputFocused = ref(false)
const isExporting = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)
const importError = ref<string | null>(null)
const importSuccess = ref<string | null>(null)
const importWarning = ref<string | null>(null)
const particles = ref<Particle[]>([])
const showConfetti = ref(false)
const cardGlowIntensity = ref(0)
const selectedNames = ref<string[]>(loadSelectedNames())
const activeTab = ref<'add' | 'import'>('add')

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

const isEmpty = computed(() => students.value.length === 0)
const availableStudents = computed(() =>
  students.value.filter(s => !selectedNames.value.includes(s.name))
)
const progressPercent = computed(() =>
  students.value.length > 0 ? Math.round((selectedNames.value.length / students.value.length) * 100) : 0
)

// ─── Confetti System ───
function spawnConfetti(count: number) {
  const colors = COLORS
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

watch(showResults, (val) => {
  if (!val) {
    stopCardGlow()
    particles.value = []
    showConfetti.value = false
  }
})

// ─── Student Management ───
function addAllStudents() {
  const raw = namesInput.value.trim()
  if (!raw) return

  const names = raw
    .split(/[\n,]+/)
    .map(n => n.trim())
    .filter(n => n.length > 0)

  if (names.length === 0) return

  const newNames = names.filter(n => {
    const lowered = n.toLowerCase()
    return !students.value.some(s => s.name.toLowerCase() === lowered)
  })

  const duplicates = names.filter(n => {
    const lowered = n.toLowerCase()
    return students.value.some(s => s.name.toLowerCase() === lowered)
  })

  if (duplicates.length > 0) {
    importWarning.value = `Skipped ${duplicates.length} duplicate${duplicates.length !== 1 ? 's' : ''}: ${duplicates.slice(0, 3).join(', ')}${duplicates.length > 3 ? '...' : ''}`
    if (importWarningTimeout) clearTimeout(importWarningTimeout)
    importWarningTimeout = setTimeout(() => {
      importWarning.value = null
      importWarningTimeout = null
    }, 4000)
  }

  if (newNames.length > 0) {
    const startIndex = students.value.length
    const newStudents = newNames.map((name, i) => createStudent(name, startIndex + i))
    students.value.push(...newStudents)
    importSuccess.value = `Added ${newStudents.length} student${newStudents.length !== 1 ? 's' : ''}`
    if (importSuccessTimeout) clearTimeout(importSuccessTimeout)
    importSuccessTimeout = setTimeout(() => {
      importSuccess.value = null
      importSuccessTimeout = null
    }, 3000)
  }

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

          const rows: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' })

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
      // Fall through
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

    const existingNames = new Set(students.value.map((s) => s.name.toLowerCase()))
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
  selectedStudents.value = []
  showResults.value = false
  pickCount.value = 1
  selectedNames.value = []
  persistSelectedNames([])
  particles.value = []
  showConfetti.value = false
  stopCardGlow()
}

function removeStudent(id: number) {
  students.value = students.value.filter(s => s.id !== id)
  selectedStudents.value = selectedStudents.value.filter(s => s.id !== id)
  if (selectedStudents.value.length === 0) {
    showResults.value = false
    stopCardGlow()
  }
  clampCount()
}

function resetSelectionHistory() {
  selectedNames.value = []
  persistSelectedNames([])
}

function clampCount() {
  if (pickCount.value < 1) pickCount.value = 1
  const available = availableStudents.value.length
  if (available > 0 && pickCount.value > available) {
    pickCount.value = available
  }
}

async function pickMultiple() {
  if (isPicking.value || isEmpty.value) return

  const pool = availableStudents.value
  if (pool.length === 0) return

  const count = Math.min(pickCount.value, pool.length)
  if (count < 1) return

  isPicking.value = true
  showResults.value = false
  selectedStudents.value = []
  highlightIds.value = new Set()
  stopCardGlow()
  particles.value = []
  showConfetti.value = false

  playDrumRollSound()

  const flashDuration = 500
  const flashIntervalMs = 50
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
      const shuffled = [...pool].sort(() => Math.random() - 0.5)
      const flashSet = new Set(shuffled.slice(0, count).map(s => s.id))
      highlightIds.value = flashSet
      playTickSound()
    }, flashIntervalMs)
  })

  const shuffled = [...pool].sort(() => Math.random() - 0.5)
  const finalPicks = shuffled.slice(0, count)

  selectedStudents.value = finalPicks
  highlightIds.value = new Set(finalPicks.map(s => s.id))
  showResults.value = true

  playSelectedSound()
  spawnConfetti(40)
  animateCardGlow()

  pickLog.value.unshift({
    students: finalPicks.map(s => s.name),
    time: new Date(),
  })

  const newSelectedNames = finalPicks.map(s => s.name)
  selectedNames.value = [...new Set([...selectedNames.value, ...newSelectedNames])]
  persistSelectedNames(selectedNames.value)

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

    doc.setFillColor(37, 99, 235)
    doc.rect(0, 0, pageWidth, 28, 'F')

    doc.setTextColor(255, 255, 255)
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('Multiple Student Picker — Results', pageWidth / 2, 18, { align: 'center' })

    doc.setTextColor(100, 116, 139)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(`Exported: ${formatDate(now)} at ${formatTime(now)}`, pageWidth / 2, 38, { align: 'center' })

    const latestPick = pickLog.value[0]
    doc.text(`Round #${pickLog.value.length} — ${selectedStudents.value.length} student${selectedStudents.value.length !== 1 ? 's' : ''} selected`, pageWidth / 2, 46, { align: 'center' })

    doc.setDrawColor(226, 232, 240)
    doc.line(20, 53, pageWidth - 20, 53)

    doc.setTextColor(37, 99, 235)
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text('Selected Students', 20, 64)

    doc.setTextColor(30, 41, 59)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')

    selectedStudents.value.forEach((student, index) => {
      const yPos = 76 + index * 8
      doc.circle(24, yPos - 2, 1.5, 'F')
      doc.text(`${index + 1}.  ${student.name}`, 30, yPos)
    })

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
  <div class="app">
    <!-- Confetti -->
    <div v-if="showConfetti" class="confetti">
      <div
        v-for="p in particles"
        :key="p.id"
        class="confetti__particle"
        :class="[`confetti__particle--${p.shape}`]"
        :style="{
          left: p.x + '%',
          top: p.y + '%',
          width: p.size + 'px',
          height: p.size + 'px',
          background: p.color,
          transform: `rotate(${p.rotation}deg)`,
          opacity: Math.max(0, 1 - p.life / p.maxLife),
        }"
      />
    </div>

    <div class="container">
      <!-- Header -->
      <header class="header">
        <div class="header__brand">
          <div class="header__icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <div class="header__text">
            <h1 class="header__title">Multiple Student Picker</h1>
            <p class="header__sub">Select groups randomly — without repeats</p>
          </div>
        </div>
        <div class="header__stats">
          <div class="stat" v-if="students.length > 0">
            <span class="stat__value">{{ students.length }}</span>
            <span class="stat__label">Pool</span>
          </div>
          <div class="stat" v-if="selectedNames.length > 0">
            <span class="stat__value">{{ selectedNames.length }}</span>
            <span class="stat__label">Picked</span>
          </div>
          <div class="stat" v-if="students.length > 0">
            <span class="stat__value">{{ availableStudents.length }}</span>
            <span class="stat__label">Left</span>
          </div>
        </div>
      </header>

      <!-- Status messages -->
      <Transition name="msg">
        <div v-if="importSuccess" class="msg msg--success">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
          {{ importSuccess }}
        </div>
      </Transition>
      <Transition name="msg">
        <div v-if="importWarning" class="msg msg--warn">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
          {{ importWarning }}
        </div>
      </Transition>
      <Transition name="msg">
        <div v-if="importError" class="msg msg--error">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>
          {{ importError }}
        </div>
      </Transition>

      <!-- Step 1: Add Students -->
      <section class="card">
        <div class="card__head">
          <div class="card__step">Step 1</div>
          <h2 class="card__title">Add Students</h2>
          <div class="card__badges">
            <span v-if="students.length" class="card__badge card__badge--blue">{{ students.length }}</span>
            <span v-if="selectedNames.length" class="card__badge card__badge--green">{{ selectedNames.length }} picked</span>
          </div>
        </div>

        <!-- Tabs -->
        <div class="tabs">
          <button
            class="tabs__btn"
            :class="{ 'tabs__btn--active': activeTab === 'add' }"
            @click="activeTab = 'add'"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
            Type Names
          </button>
          <button
            class="tabs__btn"
            :class="{ 'tabs__btn--active': activeTab === 'import' }"
            @click="triggerFileImport"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
            Import File
          </button>
          <input ref="fileInput" type="file" accept=".txt,.csv,.tsv,.json,.xlsx,.xls,.xlsm,.xlsb,.ods" class="file-input" @change="handleFileImport" />
        </div>

        <!-- Textarea -->
        <div v-show="activeTab === 'add'" class="input-group" :class="{ 'input-group--focus': inputFocused }">
          <textarea
            v-model="namesInput"
            class="input-group__field"
            placeholder="Enter names — one per line&#10;e.g.&#10;Alice&#10;Bob&#10;Charlie"
            @focus="inputFocused = true"
            @blur="inputFocused = false"
            rows="4"
          />
          <div class="input-group__actions">
            <button class="btn btn--primary" :disabled="!namesInput.trim()" @click="addAllStudents">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
              Add to Pool
            </button>
            <button v-if="students.length" class="btn btn--outline btn--outline-red" @click="clearAllStudents">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
              Clear All
            </button>
          </div>
        </div>

        <!-- Student List -->
        <div v-if="students.length" class="pool">
          <TransitionGroup name="chip">
            <div
              v-for="s in students"
              :key="s.id"
              class="chip"
              :class="{
                'chip--flash': highlightIds.has(s.id),
                'chip--picked': showResults && selectedStudents.some(x => x.id === s.id),
                'chip--used': selectedNames.includes(s.name),
              }"
              :style="{ '--c': s.color }"
            >
              <div class="chip__av" :style="{ background: s.color }">{{ s.initials }}</div>
              <span class="chip__name">{{ s.name }}</span>
              <span v-if="selectedNames.includes(s.name)" class="chip__tick">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
              </span>
              <button class="chip__remove" @click="removeStudent(s.id)" title="Remove">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>
          </TransitionGroup>
        </div>

        <!-- Empty state -->
        <div v-else class="empty">
          <div class="empty__icon">
            <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <line x1="19" y1="8" x2="19" y2="14" />
              <line x1="22" y1="11" x2="16" y2="11" />
            </svg>
          </div>
          <p class="empty__text">Your student pool is empty</p>
          <p class="empty__sub">Type names above or import a file to get started</p>
        </div>
      </section>

      <!-- Step 2: Pick -->
      <section class="card card--pick" :class="{ 'card--disabled': !students.length || !availableStudents.length }">
        <div class="card__head">
          <div class="card__step">Step 2</div>
          <h2 class="card__title">Pick Students</h2>
          <span v-if="availableStudents.length" class="card__badge card__badge--amber">{{ availableStudents.length }} available</span>
        </div>

        <div class="pick-area">
          <div class="counter">
            <label class="counter__label">How many to select?</label>
            <div class="counter__ctrl">
              <button class="counter__btn" :disabled="pickCount <= 1 || isPicking" @click="pickCount = Math.max(1, pickCount - 1)">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><line x1="5" y1="12" x2="19" y2="12" /></svg>
              </button>
              <div class="counter__val">
                <span class="counter__num">{{ pickCount }}</span>
              </div>
              <button class="counter__btn" :disabled="pickCount >= availableStudents.length || !availableStudents.length || isPicking" @click="pickCount = Math.min(availableStudents.length || 1, pickCount + 1)">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
              </button>
            </div>
          </div>

          <button
            class="pick-btn"
            :class="{ 'pick-btn--loading': isPicking }"
            :disabled="isPicking || !students.length || !availableStudents.length"
            @click="pickMultiple"
          >
            <span v-if="isPicking" class="pick-btn__inner">
              <span class="spinner"></span>
              Picking...
            </span>
            <span v-else-if="!availableStudents.length && students.length" class="pick-btn__inner">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" /></svg>
              All Picked
            </span>
            <span v-else class="pick-btn__inner">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
              Pick {{ pickCount }} Student{{ pickCount > 1 ? 's' : '' }}
            </span>
          </button>
        </div>

        <!-- Progress -->
        <div v-if="students.length" class="progress">
          <div class="progress__bar">
            <div class="progress__fill" :style="{ width: progressPercent + '%' }"></div>
          </div>
          <div class="progress__info">
            <span class="progress__pct">{{ progressPercent }}%</span>
            <span class="progress__sep">·</span>
            <span class="progress__txt">{{ selectedNames.length }} of {{ students.length }}</span>
          </div>
        </div>
      </section>

      <!-- Results -->
      <Transition name="slide">
        <section v-if="showResults && selectedStudents.length" class="card card--result" :style="{ '--gl': cardGlowIntensity }">
          <div class="card__head">
            <div class="card__step card__step--green">Result</div>
            <h2 class="card__title">{{ selectedStudents.length }} Selected</h2>
            <div class="card__actions">
              <button class="btn btn--sm btn--dark" :disabled="isExporting" @click="exportToPDF">
                <svg v-if="!isExporting" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="12" y1="18" x2="12" y2="12" /><line x1="9" y1="15" x2="15" y2="15" /></svg>
                <span v-if="isExporting" class="spinner spinner--sm"></span>
                {{ isExporting ? 'Exporting...' : 'PDF' }}
              </button>
              <button class="btn btn--sm btn--ghost" :disabled="isPicking || !availableStudents.length" @click="pickMultiple">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" /></svg>
                Pick Again
              </button>
            </div>
          </div>
          <div class="result-grid">
            <div v-for="s in selectedStudents" :key="s.id" class="result-tile" :style="{ '--c': s.color }">
              <div class="result-tile__check">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
              </div>
              <div class="result-tile__av" :style="{ background: s.color }">{{ s.initials }}</div>
              <span class="result-tile__name">{{ s.name }}</span>
            </div>
          </div>
        </section>
      </Transition>

      <!-- Reset -->
      <div v-if="selectedNames.length" class="reset-area">
        <button class="reset-btn" @click="resetSelectionHistory">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" /></svg>
          Clear Pick History ({{ selectedNames.length }} names)
        </button>
      </div>

      <!-- History -->
      <section v-if="pickLog.length" class="card">
        <div class="card__head">
          <div class="card__step card__step--gray">History</div>
          <h2 class="card__title">Previous Rounds</h2>
          <span class="card__badge card__badge--gray">{{ pickLog.length }} round{{ pickLog.length > 1 ? 's' : '' }}</span>
        </div>
        <div class="history">
          <TransitionGroup name="h-row">
            <div v-for="(e, i) in pickLog" :key="e.time.getTime() + e.students.join(',')" class="history__row" :class="{ 'history__row--new': i === 0 }">
              <span class="history__idx">#{{ pickLog.length - i }}</span>
              <div class="history__names">
                <span v-for="(n, j) in e.students" :key="n" class="history__name">{{ n }}<span v-if="j < e.students.length - 1">,&nbsp;</span></span>
              </div>
              <div class="history__meta">
                <span class="history__cnt">{{ e.students.length }}</span>
                <span class="history__time">{{ formatTime(e.time) }}</span>
              </div>
            </div>
          </TransitionGroup>
        </div>
      </section>

      <!-- Footer -->
      <footer class="footer">
        <p>All selections are saved locally — your data stays private</p>
      </footer>
    </div>
  </div>
</template>

<style scoped>
/* ═══════════════════════════════════════
   RESET & BASE
   ═══════════════════════════════════════ */
*, *::before, *::after { box-sizing: border-box; }

.app {
  min-height: 100vh;
  width: 100%;
  background: linear-gradient(160deg, #f0f4ff 0%, #f8fafc 40%, #fefefe 100%);
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  padding-top: 64px;
  color: #0f172a;
}

.container {
  width: 50%;
  max-width: 50%;
  margin: 0 auto;
  padding: 1.5rem 0 3rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* ── Confetti ── */
.confetti {
  position: fixed; inset: 0; pointer-events: none; z-index: 1000; overflow: hidden;
}
.confetti__particle {
  position: absolute; border-radius: 2px; will-change: transform, opacity;
}
.confetti__particle--circle { border-radius: 50%; }
.confetti__particle--star {
  clip-path: polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%);
}
.confetti__particle--square { border-radius: 2px; }

/* ═══════════════════════════════════════
   HEADER
   ═══════════════════════════════════════ */
.header {
  display: flex; align-items: center; justify-content: space-between; gap: 1rem;
  padding: 0.25rem 0; flex-wrap: wrap;
}
.header__brand {
  display: flex; align-items: center; gap: 0.75rem;
}
.header__icon {
  width: 2.5rem; height: 2.5rem;
  background: linear-gradient(135deg, #6366f1, #4f46e5);
  color: #fff; border-radius: 0.75rem;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  box-shadow: 0 6px 16px rgba(99, 102, 241, 0.25);
}
.header__title {
  font-size: 1.35rem; font-weight: 700; margin: 0; line-height: 1.25; letter-spacing: -0.02em;
}
.header__sub {
  font-size: 0.8rem; color: #64748b; margin: 0.1rem 0 0;
}
.header__stats {
  display: flex; gap: 0.75rem;
}
.stat {
  display: flex; flex-direction: column; align-items: center;
  background: #fff; padding: 0.35rem 0.65rem; border-radius: 0.5rem;
  border: 1px solid #f1f5f9;
}
.stat__value { font-size: 1.1rem; font-weight: 700; line-height: 1; color: #0f172a; }
.stat__label { font-size: 0.6rem; color: #94a3b8; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; margin-top: 2px; }

/* ═══════════════════════════════════════
   MESSAGES
   ═══════════════════════════════════════ */
.msg {
  display: flex; align-items: center; gap: 0.5rem;
  padding: 0.5rem 0.75rem; border-radius: 0.5rem;
  font-size: 0.8rem; font-weight: 600;
}
.msg--success { background: #ecfdf5; color: #059669; border: 1px solid #a7f3d0; }
.msg--warn { background: #fffbeb; color: #d97706; border: 1px solid #fcd34d; }
.msg--error { background: #fef2f2; color: #dc2626; border: 1px solid #fca5a5; }

.msg-enter-active, .msg-leave-active { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
.msg-enter-from, .msg-leave-to { opacity: 0; transform: translateY(-6px); }

/* ═══════════════════════════════════════
   CARD
   ═══════════════════════════════════════ */
.card {
  background: #fff; border-radius: 1rem; padding: 1.25rem 1.5rem;
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 3px rgba(0,0,0,.04);
  transition: box-shadow 0.2s, opacity 0.25s;
}
.card:hover { box-shadow: 0 4px 12px rgba(0,0,0,.06); }
.card--disabled { opacity: 0.4; pointer-events: none; }
.card--pick { border-color: #e0e7ff; background: linear-gradient(180deg, #fafbff 0%, #fff 100%); }
.card--result {
  border-color: #86efac; background: linear-gradient(180deg, #fafefc 0%, #fff 100%);
  box-shadow: 0 4px 20px rgba(34,197,94,.08);
}

.card__head {
  display: flex; align-items: center; gap: 0.6rem; margin-bottom: 1rem; flex-wrap: wrap;
}
.card__step {
  font-size: 0.6rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em;
  color: #6366f1; background: #eef2ff; padding: 0.2rem 0.55rem; border-radius: 0.375rem;
  flex-shrink: 0;
}
.card__step--green { color: #16a34a; background: #f0fdf4; }
.card__step--gray { color: #64748b; background: #f1f5f9; }
.card__title { font-size: 0.9rem; font-weight: 600; margin: 0; flex: 1; }
.card__badges { display: flex; gap: 0.35rem; margin-left: auto; }
.card__badge {
  font-size: 0.65rem; font-weight: 700; padding: 0.15rem 0.5rem; border-radius: 999px;
}
.card__badge--blue { color: #6366f1; background: #eef2ff; }
.card__badge--green { color: #059669; background: #ecfdf5; }
.card__badge--amber { color: #d97706; background: #fffbeb; }
.card__badge--gray { color: #64748b; background: #f1f5f9; }
.card__actions { display: flex; gap: 0.4rem; flex-shrink: 0; }

/* ═══════════════════════════════════════
   TABS
   ═══════════════════════════════════════ */
.tabs {
  display: flex; gap: 0.5rem; margin-bottom: 0.75rem;
}
.tabs__btn {
  display: inline-flex; align-items: center; gap: 0.35rem;
  padding: 0.4rem 0.85rem; border-radius: 0.5rem;
  font-size: 0.78rem; font-weight: 600; border: 1.5px solid #e2e8f0;
  background: #fff; color: #64748b; cursor: pointer; transition: all 0.15s;
  font-family: inherit;
}
.tabs__btn:hover { border-color: #cbd5e1; background: #f8fafc; }
.tabs__btn--active { border-color: #6366f1; color: #6366f1; background: #eef2ff; }
.file-input { display: none; }

/* ═══════════════════════════════════════
   INPUT GROUP
   ═══════════════════════════════════════ */
.input-group {
  border: 1.5px solid #e2e8f0; border-radius: 0.75rem; padding: 0.3rem;
  transition: border-color 0.2s, box-shadow 0.2s; background: #fafafa;
}
.input-group--focus { border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99,102,241,.08); background: #fff; }
.input-group__field {
  width: 100%; border: none; outline: none; padding: 0.5rem 0.6rem;
  font-size: 0.85rem; font-family: inherit; color: #0f172a;
  background: transparent; resize: vertical; min-height: 3rem; line-height: 1.6;
}
.input-group__field::placeholder { color: #94a3b8; white-space: pre-line; }
.input-group__actions {
  display: flex; gap: 0.4rem; padding: 0.25rem 0.4rem 0.35rem;
}

/* ═══════════════════════════════════════
   BUTTONS
   ═══════════════════════════════════════ */
.btn {
  display: inline-flex; align-items: center; gap: 0.35rem;
  border: none; border-radius: 0.5rem; padding: 0.45rem 0.85rem;
  font-size: 0.78rem; font-weight: 600; cursor: pointer;
  transition: all 0.15s; white-space: nowrap; font-family: inherit;
}
.btn--primary {
  background: linear-gradient(135deg, #6366f1, #4f46e5); color: #fff;
  box-shadow: 0 2px 6px rgba(99,102,241,.2);
}
.btn--primary:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(99,102,241,.3); }
.btn--primary:disabled { opacity: 0.35; cursor: default; }
.btn--outline { background: transparent; border: 1px solid #e2e8f0; color: #64748b; }
.btn--outline-red:hover:not(:disabled) { background: #fef2f2; color: #dc2626; border-color: #fca5a5; }
.btn--sm { padding: 0.35rem 0.65rem; font-size: 0.72rem; }
.btn--dark { background: #0f172a; color: #fff; }
.btn--dark:hover:not(:disabled) { background: #1e293b; }
.btn--ghost { background: transparent; border: 1px solid #e2e8f0; color: #64748b; }
.btn--ghost:hover:not(:disabled) { background: #f8fafc; border-color: #cbd5e1; }

/* ═══════════════════════════════════════
   POOL (student chips)
   ═══════════════════════════════════════ */
.pool { display: flex; flex-wrap: wrap; gap: 0.4rem; margin-top: 0.75rem; }

.chip {
  display: flex; align-items: center; gap: 0.3rem;
  background: #f8fafc; border: 1px solid #e2e8f0;
  border-radius: 999px; padding: 0.2rem 0.45rem 0.2rem 0.2rem;
  transition: all 0.25s cubic-bezier(.34,1.56,.64,1);
}
.chip:hover { border-color: #cbd5e1; background: #f1f5f9; transform: translateY(-1px); }
.chip--flash {
  border-color: var(--c) !important;
  background: color-mix(in srgb, var(--c) 10%, #fff) !important;
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--c) 20%, transparent) !important;
  transform: scale(1.06);
}
.chip--picked {
  border-color: var(--c) !important;
  background: color-mix(in srgb, var(--c) 14%, #fff) !important;
  border-width: 1.5px;
}
.chip--used { opacity: 0.5; pointer-events: none; border-color: #d1d5db; background: #f9fafb; }
.chip--used .chip__name { text-decoration: line-through; color: #9ca3af; }
.chip--used .chip__remove { opacity: 0; pointer-events: none; }
.chip__av {
  width: 1.4rem; height: 1.4rem; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  color: #fff; font-size: 0.55rem; font-weight: 700; flex-shrink: 0;
}
.chip__name { font-size: 0.78rem; font-weight: 500; color: #334155; }
.chip__tick { display: flex; color: #22c55e; flex-shrink: 0; }
.chip__remove {
  display: flex; align-items: center; justify-content: center;
  width: 1rem; height: 1rem; border: none; border-radius: 50%;
  background: transparent; color: #94a3b8; cursor: pointer;
  opacity: 0; transition: all 0.15s; padding: 0; flex-shrink: 0;
}
.chip:hover .chip__remove { opacity: 1; }
.chip__remove:hover { background: #fee2e2; color: #ef4444; }

/* chip transitions */
.chip-enter-active, .chip-leave-active { transition: all 0.3s cubic-bezier(.34,1.56,.64,1); }
.chip-enter-from, .chip-leave-to { opacity: 0; transform: scale(0.6); }
.chip-move { transition: transform 0.3s cubic-bezier(.34,1.56,.64,1); }

/* ═══════════════════════════════════════
   EMPTY STATE
   ═══════════════════════════════════════ */
.empty {
  display: flex; flex-direction: column; align-items: center;
  padding: 2rem 1rem 1rem; gap: 0.35rem;
}
.empty__icon {
  width: 64px; height: 64px; display: flex; align-items: center; justify-content: center;
  background: #f8fafc; border-radius: 50%; border: 1px dashed #e2e8f0;
}
.empty__text { font-size: 0.85rem; font-weight: 600; color: #94a3b8; margin: 0.5rem 0 0; }
.empty__sub { font-size: 0.72rem; color: #b0bccf; margin: 0; }

/* ═══════════════════════════════════════
   PICK AREA
   ═══════════════════════════════════════ */
.pick-area {
  display: flex; align-items: center; gap: 1.25rem; flex-wrap: wrap;
}

.counter { display: flex; flex-direction: column; gap: 0.35rem; flex: 1; min-width: 7rem; }
.counter__label { font-size: 0.72rem; font-weight: 600; color: #64748b; letter-spacing: 0.01em; }
.counter__ctrl {
  display: flex; align-items: center; gap: 0.4rem;
  background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 0.65rem; padding: 0.35rem;
}
.counter__btn {
  display: flex; align-items: center; justify-content: center;
  width: 1.65rem; height: 1.65rem; border: none; border-radius: 0.4rem;
  background: #fff; color: #64748b; cursor: pointer; transition: all 0.15s;
  box-shadow: 0 1px 2px rgba(0,0,0,.04);
}
.counter__btn:not(:disabled):hover { background: #6366f1; color: #fff; box-shadow: 0 2px 6px rgba(99,102,241,.25); }
.counter__btn:disabled { opacity: 0.2; cursor: default; }
.counter__val { display: flex; align-items: center; justify-content: center; min-width: 2.25rem; }
.counter__num { font-size: 1.6rem; font-weight: 700; line-height: 1; font-variant-numeric: tabular-nums; }

/* ═══════════════════════════════════════
   PICK BUTTON
   ═══════════════════════════════════════ */
.pick-btn {
  display: inline-flex; align-items: center; justify-content: center;
  background: linear-gradient(135deg, #6366f1, #4f46e5); color: #fff;
  border: none; border-radius: 0.75rem; padding: 0.9rem 2rem;
  font-size: 0.95rem; font-weight: 600; cursor: pointer;
  transition: all 0.2s; flex: 1; min-width: 10rem;
  font-family: inherit; box-shadow: 0 4px 14px rgba(99,102,241,.25);
  position: relative; overflow: hidden;
}
.pick-btn::before {
  content: ''; position: absolute; inset: 0;
  background: linear-gradient(135deg, transparent 30%, rgba(255,255,255,.15) 50%, transparent 70%);
  transform: translateX(-100%); transition: transform 0.5s;
}
.pick-btn:hover::before { transform: translateX(100%); }
.pick-btn:not(:disabled):hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(99,102,241,.35); }
.pick-btn:not(:disabled):active { transform: translateY(0); }
.pick-btn:disabled { opacity: 0.35; cursor: default; }
.pick-btn--loading { background: linear-gradient(135deg, #818cf8, #6366f1); animation: rumble .12s ease-in-out infinite; }
@keyframes rumble { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-1px)} 75%{transform:translateX(1px)} }
.pick-btn__inner { display: flex; align-items: center; gap: 0.5rem; position: relative; z-index: 1; }

.spinner { width: 1.1rem; height: 1.1rem; border: 2px solid rgba(255,255,255,.25); border-top-color: #fff; border-radius: 50%; animation: spin .6s linear infinite; }
.spinner--sm { width: 0.8rem; height: 0.8rem; border-width: 1.5px; }
@keyframes spin { to { transform: rotate(360deg); } }

/* ═══════════════════════════════════════
   PROGRESS
   ═══════════════════════════════════════ */
.progress {
  display: flex; align-items: center; gap: 0.75rem;
  margin-top: 1rem; padding-top: 0.75rem; border-top: 1px solid #f1f5f9;
}
.progress__bar { flex: 1; height: 0.4rem; background: #f1f5f9; border-radius: 999px; overflow: hidden; }
.progress__fill { height: 100%; background: linear-gradient(90deg, #6366f1, #8b5cf6); border-radius: 999px; transition: width 0.5s cubic-bezier(.4,0,.2,1); }
.progress__info { display: flex; align-items: center; gap: 0.25rem; flex-shrink: 0; }
.progress__pct { font-size: 0.7rem; font-weight: 700; color: #6366f1; }
.progress__sep { color: #d1d5db; font-size: 0.7rem; }
.progress__txt { font-size: 0.65rem; color: #94a3b8; font-weight: 500; }

/* ═══════════════════════════════════════
   RESULT GRID
   ═══════════════════════════════════════ */
.result-grid { display: flex; flex-wrap: wrap; gap: 0.6rem; }

.result-tile {
  display: flex; align-items: center; gap: 0.5rem;
  padding: 0.5rem 0.75rem 0.5rem 0.5rem;
  border-radius: 0.65rem; background: #fafafa; border: 1px solid #e2e8f0;
  position: relative;
  animation: tile-in .4s cubic-bezier(.34,1.56,.64,1) both;
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

.result-tile:hover { border-color: var(--c); background: color-mix(in srgb, var(--c) 5%, #fff); transform: translateY(-2px); }

@keyframes tile-in { 0%{opacity:0;transform:scale(.7) translateY(8px)} 100%{opacity:1;transform:scale(1) translateY(0)} }

.result-tile__check {
  position: absolute; top: -5px; right: -5px;
  width: 1.15rem; height: 1.15rem; display: flex; align-items: center; justify-content: center;
  background: #22c55e; color: #fff; border-radius: 50%;
  box-shadow: 0 2px 8px rgba(34,197,94,.35);
  animation: pop-in .35s cubic-bezier(.34,1.56,.64,1) .3s both;
}
@keyframes pop-in { 0%{transform:scale(0)} 60%{transform:scale(1.2)} 100%{transform:scale(1)} }

.result-tile__av {
  width: 2rem; height: 2rem; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  color: #fff; font-size: 0.6rem; font-weight: 700; flex-shrink: 0;
}
.result-tile__name { font-size: 0.82rem; font-weight: 600; color: #334155; }

/* slide transition for result card */
.slide-enter-active { transition: all .4s cubic-bezier(.34,1.56,.64,1); }
.slide-leave-active { transition: all .25s ease; }
.slide-enter-from { opacity: 0; transform: translateY(14px) scale(.97); }
.slide-leave-to { opacity: 0; transform: translateY(-8px); }

/* ═══════════════════════════════════════
   RESET
   ═══════════════════════════════════════ */
.reset-area { display: flex; justify-content: center; }
.reset-btn {
  display: inline-flex; align-items: center; gap: 0.35rem;
  background: #fef2f2; color: #dc2626; border: 1px solid #fca5a5;
  border-radius: 0.5rem; padding: 0.35rem 0.7rem; font-size: 0.72rem;
  font-weight: 600; cursor: pointer; transition: all 0.2s;
}
.reset-btn:hover { background: #fee2e2; border-color: #ef4444; transform: translateY(-1px); }

/* ═══════════════════════════════════════
   HISTORY
   ═══════════════════════════════════════ */
.history { display: flex; flex-direction: column; gap: 0.25rem; }
.history__row {
  display: flex; align-items: center; gap: 0.6rem;
  padding: 0.5rem 0.65rem; border-radius: 0.5rem;
  transition: background 0.15s;
}
.history__row:hover { background: #f8fafc; }
.history__row--new { background: linear-gradient(135deg, #eef2ff, #f5f3ff); border: 1px solid #c7d2fe; }
.history__idx { font-size: 0.65rem; font-weight: 700; color: #94a3b8; min-width: 1.4rem; flex-shrink: 0; }
.history__row--new .history__idx { color: #6366f1; }
.history__names { flex: 1; min-width: 0; font-size: 0.78rem; color: #475569; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.history__name { font-weight: 500; }
.history__row--new .history__name { color: #4338ca; font-weight: 600; }
.history__meta { display: flex; align-items: center; gap: 0.4rem; flex-shrink: 0; }
.history__cnt {
  font-size: 0.6rem; font-weight: 700; color: #6366f1;
  background: #eef2ff; padding: 0.1rem 0.45rem; border-radius: 0.3rem;
}
.history__row--new .history__cnt { background: #6366f1; color: #fff; }
.history__time { font-size: 0.65rem; color: #94a3b8; font-weight: 500; }
.history__row--new .history__time { color: #818cf8; }

.h-row-enter-active { transition: all .3s ease; }
.h-row-leave-active { transition: all .2s ease; }
.h-row-enter-from, .h-row-leave-to { opacity: 0; transform: translateX(-10px); }

/* ═══════════════════════════════════════
   FOOTER
   ═══════════════════════════════════════ */
.footer { text-align: center; padding: 1rem 0 0; }
.footer p { font-size: 0.7rem; color: #94a3b8; margin: 0; }

/* ═══════════════════════════════════════
   RESPONSIVE
   ═══════════════════════════════════════ */
@media (max-width: 640px) {
  .container { padding: 1.25rem 1rem 2rem; gap: 0.75rem; }
  .header { flex-direction: column; align-items: stretch; gap: 0.5rem; }
  .header__stats { justify-content: flex-end; }
  .card { padding: 1rem 1.1rem; }
  .pick-area { flex-direction: column; align-items: stretch; gap: 0.75rem; }
  .counter { align-items: center; }
  .counter__ctrl { width: fit-content; margin: 0 auto; }
  .card__actions { width: 100%; justify-content: flex-end; }
}
</style>