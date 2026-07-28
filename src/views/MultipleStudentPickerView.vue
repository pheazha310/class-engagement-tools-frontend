<script setup lang="ts">
import { ref, computed, onUnmounted, onMounted, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { jsPDF } from 'jspdf'
import * as XLSX from 'xlsx'
import { playSynthSound } from '@/utils/soundSynthesizer'
import {
  getPickedStudentNames,
  savePickedStudentNames,
  isStudentPicked,
  resetPickedStudents,
  getPickedCount,
  saveStudentPool,
  restoreStudentPool,
  clearAllStudentData,
} from '@/utils/studentPickerStorage'

interface Student {
  id: number
  name: string
  initials: string
  color: string
  previouslyPicked: boolean
}

interface Toast {
  id: number
  message: string
  type: 'success' | 'info' | 'warning' | 'error'
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
  const trimmed = name.trim()
  return {
    id: Date.now() + index,
    name: trimmed,
    initials: trimmed.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2),
    color: getColor(index),
    previouslyPicked: isStudentPicked(trimmed),
  }
}

// ─── Sound Engine ───
let audioCtx: AudioContext | null = null

function getAudioContext(): AudioContext {
  if (!audioCtx) audioCtx = new AudioContext()
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

// ─── State ───
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
  } catch { /* full */ }
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
const soundEnabled = ref(true)
const showPickedInfo = ref(true)
const toasts = ref<Toast[]>([])

const selectedNames = ref<string[]>(loadSelectedNames())
const fileInputRef = ref<HTMLInputElement | null>(null)
const isImporting = ref(false)
const importFileName = ref('')

const particles = ref<Particle[]>([])
const showConfetti = ref(false)
const cardGlowIntensity = ref(0)

let toastIdCounter = 0
function addToast(message: string, type: Toast['type'] = 'info') {
  const id = ++toastIdCounter
  toasts.value.push({ id, message, type })
  setTimeout(() => {
    toasts.value = toasts.value.filter(t => t.id !== id)
  }, 3500)
}

let flashInterval: ReturnType<typeof setInterval> | null = null
let confettiInterval: ReturnType<typeof setInterval> | null = null
let glowInterval: ReturnType<typeof setInterval> | null = null
let particleIdCounter = 0

onMounted(() => {
  const savedPool = restoreStudentPool()
  if (savedPool) {
    const startIndex = students.value.length
    const newStudents = savedPool.map((name, i) => createStudent(name, startIndex + i))
    students.value.push(...newStudents)
    if (students.value.length > 0) {
      addToast(`Restored ${students.value.length} student${students.value.length !== 1 ? 's' : ''} from previous session`, 'info')
    }
  }
})

onUnmounted(() => {
  if (flashInterval) clearInterval(flashInterval)
  if (confettiInterval) clearInterval(confettiInterval)
  if (glowInterval) clearInterval(glowInterval)
  if (audioCtx) {
    audioCtx.close().catch(() => {})
    audioCtx = null
  }
})

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

watch(showResults, (val) => {
  if (!val) {
    stopCardGlow()
    particles.value = []
    showConfetti.value = false
  }
})

const pickedCount = computed(() => getPickedCount())

const remainingCount = computed(() => {
  const pickedNames = getPickedStudentNames()
  return students.value.filter(s => !pickedNames.has(s.name)).length
})

const allPicked = computed(() => remainingCount.value === 0 && students.value.length > 0)

// ─── Student Management ───
function addAllStudents() {
  const raw = namesInput.value.trim()
  if (!raw) return
  const names = raw
    .split(/[\n,]+/)
    .map(n => n.trim())
    .filter(n => n.length > 0)
  if (names.length === 0) return
  const startIndex = students.value.length
  const pickedNames = getPickedStudentNames()
  const newStudents = names.map((name, i) => {
    const s = createStudent(name, startIndex + i)
    s.previouslyPicked = pickedNames.has(name)
    return s
  })
  students.value.push(...newStudents)
  namesInput.value = ''
  saveStudentPool(students.value.map(s => s.name))
  addToast(`Added ${names.length} student${names.length !== 1 ? 's' : ''} to the pool`, 'success')
}

function clearAllStudents() {
  if (students.value.length === 0) return
  students.value = []
  selectedStudents.value = []
  showResults.value = false
  pickCount.value = 1
  selectedNames.value = []
  particles.value = []
  showConfetti.value = false
  stopCardGlow()
  persistSelectedNames([])
  saveStudentPool([])
  addToast('Pool cleared', 'info')
}

function resetSelectionHistory() {
  selectedNames.value = []
  persistSelectedNames([])
  addToast('Selection history reset', 'info')
}

function removeStudent(id: number) {
  students.value = students.value.filter(s => s.id !== id)
  selectedStudents.value = selectedStudents.value.filter(s => s.id !== id)
  if (selectedStudents.value.length === 0) {
    showResults.value = false
    particles.value = []
    showConfetti.value = false
    stopCardGlow()
  }
  clampCount()
  saveStudentPool(students.value.map(s => s.name))
}

function clampCount() {
  if (pickCount.value < 1) pickCount.value = 1
  if (pickCount.value > students.value.length && students.value.length > 0) {
    pickCount.value = students.value.length
  }
}

function toggleSound() {
  soundEnabled.value = !soundEnabled.value
  addToast(soundEnabled.value ? 'Sound effects on' : 'Sound effects off', 'info')
}

function resetHistory() {
  resetPickedStudents()
  students.value = students.value.map(s => ({ ...s, previouslyPicked: false }))
  addToast('Selection history reset — all students can be picked again', 'success')
}

function resetAllData() {
  clearAllStudentData()
  students.value = []
  selectedStudents.value = []
  showResults.value = false
  pickLog.value = []
  pickCount.value = 1
  addToast('All data cleared', 'info')
}

function openFilePicker() {
  fileInputRef.value?.click()
}

async function handleFileImport(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  isImporting.value = true
  importFileName.value = file.name

  try {
    const data = await file.arrayBuffer()
    const workbook = XLSX.read(data, { type: 'array' })
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]!]
    const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(firstSheet, { header: 1 })

    const names: string[] = []
    for (const row of jsonData) {
      if (!Array.isArray(row)) continue
      const cellStr = String(row[0] ?? '').trim()
      if (cellStr.length > 0 && !/^(name|student name|full name|fullname|id|student id|no\.?|#)$/i.test(cellStr)) {
        names.push(cellStr)
      }
    }

    if (names.length === 0) {
      addToast('No student names found in the file', 'warning')
      return
    }

    const startIndex = students.value.length
    const pickedNames = getPickedStudentNames()
    for (let i = 0; i < names.length; i++) {
      const name = names[i]!.trim()
      if (!name) continue
      if (students.value.some(s => s.name.toLowerCase() === name.toLowerCase())) {
        continue
      }
      const s = createStudent(name, startIndex + i)
      s.previouslyPicked = pickedNames.has(name)
      students.value.push(s)
    }

    saveStudentPool(students.value.map(s => s.name))
    addToast(`Imported ${names.length} student${names.length !== 1 ? 's' : ''} from "${file.name}"`, 'success')
  } catch (err) {
    console.error('Import error:', err)
    addToast('Failed to import file. Make sure it is a valid .xlsx, .xls, or .csv file.', 'error')
  } finally {
    isImporting.value = false
    importFileName.value = ''
    target.value = ''
  }
}

async function pickMultiple() {
  if (isPicking.value || isEmpty.value) return

  const pickedNames = getPickedStudentNames()
  const pool = students.value.filter(s => !pickedNames.has(s.name))

  if (pool.length === 0) {
    addToast('All students have been picked! Reset history to pick again.', 'warning')
    return
  }

  const count = Math.min(pickCount.value, pool.length)
  if (count < 1) return

  isPicking.value = true
  showResults.value = false
  selectedStudents.value = []
  highlightIds.value = new Set()
  particles.value = []
  showConfetti.value = false
  stopCardGlow()

  if (soundEnabled.value) {
    playSynthSound('Drum Roll').catch(() => {})
  }
  playDrumRollSound()

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

  const pickedNamesToSave = finalPicks.map(s => s.name)
  savePickedStudentNames(pickedNamesToSave)

  const updatedPickedNames = getPickedStudentNames()
  students.value = students.value.map(s => ({
    ...s,
    previouslyPicked: updatedPickedNames.has(s.name),
  }))

  playSelectedSound()
  spawnConfetti(60, finalPicks.length > 0 ? finalPicks[0]!.color : undefined)
  animateCardGlow()

  finalPicks.forEach(s => {
    if (!selectedNames.value.includes(s.name)) {
      selectedNames.value.push(s.name)
    }
  })
  persistSelectedNames(selectedNames.value)

  pickLog.value.unshift({
    students: pickedNamesToSave,
    time: new Date(),
  })

  isPicking.value = false

  if (soundEnabled.value) {
    setTimeout(() => {
      playSynthSound('Celebration').catch(() => {})
    }, 200)
  }

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
    doc.text(`Previously picked: ${pickedCount.value}`, 20, poolY + 7)

    if (latestPick) {
      const timeStr = formatTime(latestPick.time)
      doc.text(`Pick time: ${formatDate(latestPick.time)} at ${timeStr}`, 20, poolY + 14)
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
  <div class="page">
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

    <div class="container">
      <RouterLink to="/tools" class="btn-back">← Back to all tools</RouterLink>
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

      <!-- Toolbar -->
      <div class="toolbar">
        <button class="toolbar__btn" @click="toggleSound" :title="soundEnabled ? 'Mute sounds' : 'Enable sounds'">
          <svg v-if="soundEnabled" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
          </svg>
          <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <line x1="23" y1="9" x2="17" y2="15" />
            <line x1="17" y1="9" x2="23" y2="15" />
          </svg>
          <span>{{ soundEnabled ? 'Sound On' : 'Sound Off' }}</span>
        </button>

        <button class="toolbar__btn" @click="openFilePicker" :disabled="isImporting">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          <span v-if="!isImporting">Import File</span>
          <span v-else>Importing...</span>
        </button>
        <input
          ref="fileInputRef"
          type="file"
          accept=".xlsx,.xls,.csv"
          style="display:none"
          @change="handleFileImport"
        />

        <button class="toolbar__btn" @click="showPickedInfo = !showPickedInfo">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          <span>{{ showPickedInfo ? 'Hide Stats' : 'Show Stats' }}</span>
        </button>
      </div>

      <!-- Stats Bar -->
      <Transition name="slide-up">
        <div v-if="showPickedInfo && students.length > 0" class="stats-bar">
          <div class="stats-bar__item">
            <span class="stats-bar__value">{{ students.length }}</span>
            <span class="stats-bar__label">Total</span>
          </div>
          <div class="stats-bar__item stats-bar__item--success">
            <span class="stats-bar__value">{{ remainingCount }}</span>
            <span class="stats-bar__label">Available</span>
          </div>
          <div class="stats-bar__item stats-bar__item--warning">
            <span class="stats-bar__value">{{ pickedCount }}</span>
            <span class="stats-bar__label">Picked</span>
          </div>
          <div class="stats-bar__item stats-bar__item--info">
            <span class="stats-bar__value">{{ pickLog.length }}</span>
            <span class="stats-bar__label">Rounds</span>
          </div>
          <div class="stats-bar__progress">
            <div class="stats-bar__progress-track">
              <div
                class="stats-bar__progress-fill"
                :style="{ width: `${students.length > 0 ? (pickedCount / students.length) * 100 : 0}%` }"
              ></div>
            </div>
            <span class="stats-bar__progress-label">
              {{ students.length > 0 ? Math.round((pickedCount / students.length) * 100) : 0 }}% picked
            </span>
          </div>
        </div>
      </Transition>

      <section class="card">
        <div class="card-heading">
          <span class="step-badge">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="margin-right:6px;vertical-align:middle;"><path d="M12 5v14M5 12h14"/></svg>
            Add Students
          </span>
          <h2 class="card-title">Build Your Pool</h2>
          <span v-if="students.length > 0" class="chip-count">{{ students.length }} student{{ students.length !== 1 ? 's' : '' }}</span>
          <span v-if="selectedNames.length > 0" class="picked-badge">{{ selectedNames.length }} picked</span>
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
              class="btn btn--ghost-outline"
              @click="openFilePicker"
              :disabled="isImporting"
              title="Import from Excel or CSV"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              Import
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

        <div v-if="!isEmpty" class="chips">
          <TransitionGroup name="chip">
            <div
              v-for="student in students"
              :key="student.id"
              class="chip"
              :class="{
                'chip--active': highlightIds.has(student.id),
                'chip--picked': selectedStudents.some(s => s.id === student.id) && showResults,
                'chip--used': student.previouslyPicked && !highlightIds.has(student.id) && !(selectedStudents.some(s => s.id === student.id) && showResults),
              }"
            >
              <div class="chip__avatar" :style="{ background: student.color }">
                {{ student.initials }}
              </div>
              <span class="chip__name">{{ student.name }}</span>
              <span v-if="student.previouslyPicked && !(selectedStudents.some(s => s.id === student.id) && showResults)" class="chip__used-badge" title="Previously picked">✓</span>
              <button class="chip__remove" @click="removeStudent(student.id)" title="Remove">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          </TransitionGroup>
        </div>

        <div v-else class="empty">
          <div class="empty__icon-wrap">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <line x1="19" y1="8" x2="19" y2="14" />
              <line x1="22" y1="11" x2="16" y2="11" />
            </svg>
          </div>
          <p class="empty__text">No students added yet</p>
          <p class="empty__hint">Type names above, click "Add to pool", or <button class="empty__link" @click="openFilePicker">import from file</button></p>
        </div>
      </section>

      <section class="card card--step2" :class="{ 'card--disabled': isEmpty || (students.length > 0 && remainingCount === 0) }">
        <div class="card-heading">
          <span class="step-badge step-badge--gold">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="margin-right:6px;vertical-align:middle;"><path d="M12 5v14M5 12h14"/></svg>
            Pick Students
          </span>
          <h2 class="card-title">Select Randomly</h2>
          <div v-if="students.length > 0 && pickedCount > 0" class="card-heading__actions">
            <button class="btn btn--ghost btn--xs" @click="resetHistory" title="Reset pick history">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="1 4 1 10 7 10" />
                <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
              </svg>
              Reset history
            </button>
          </div>
        </div>

        <div v-if="allPicked" class="all-picked-notice">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>All students have been picked. <button class="empty__link" @click="resetHistory">Reset history</button> to pick again.</span>
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
                :disabled="pickCount >= remainingCount || remainingCount === 0 || isPicking"
                @click="pickCount = Math.min(remainingCount, pickCount + 1)"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </button>
            </div>
            <span v-if="remainingCount > 0" class="counter__hint">{{ remainingCount }} available</span>
            <span v-else class="counter__hint counter__hint--warn">All picked</span>
          </div>

          <button
            class="pick-btn"
            :class="{ 'pick-btn--loading': isPicking }"
            :disabled="isPicking || isEmpty || isPoolExhausted"
            @click="pickMultiple"
          >
            <span v-if="isPicking" class="pick-btn__inner">
              <span class="spinner"></span>
              Picking...
            </span>
            <span v-else-if="isPoolExhausted && !isEmpty" class="pick-btn__inner">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 16v-4M12 8h.01" />
              </svg>
              All Students Selected
            </span>
            <span v-else class="pick-btn__inner">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
              Pick {{ Math.min(pickCount, remainingCount) }} student{{ Math.min(pickCount, remainingCount) !== 1 ? 's' : '' }}
            </span>
          </button>
        </div>
      </section>

      <Transition name="slide-up">
        <section v-if="showResults && selectedStudents.length > 0" class="card card--result" :class="{ 'card--glowing': cardGlowIntensity > 0 }" :style="{ '--glow-opacity': cardGlowIntensity, '--glow-color': selectedStudents[0]?.color || '#22c55e' }">
          <div class="card-heading">
            <div class="card-heading__left">
              <span class="step-badge step-badge--success">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="margin-right:6px;vertical-align:middle;"><polyline points="20 6 9 17 4 12"/></svg>
                Results
              </span>
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
              <button class="btn btn--ghost btn--sm" @click="pickMultiple" :disabled="isPicking || isEmpty || isPoolExhausted">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="1 4 1 10 7 10" />
                  <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                </svg>
                Pick again
              </button>
            </div>
          </div>

          <div class="confetti-burst">
            <div v-for="i in 24" :key="i" class="confetti-particle" :style="{ '--i': i, '--confetti-color': COLORS[i % COLORS.length] }"></div>
          </div>

          <div class="results-grid">
            <div
              v-for="(student, idx) in selectedStudents"
              :key="student.id"
              class="result-tile"
              :style="{ '--tile-color': student.color, '--tile-delay': idx * 0.06 + 's' }"
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

          <div class="results-footer">
            <span class="results-footer__text">
              Round #{{ pickLog.length }} · {{ remainingCount }} student{{ remainingCount !== 1 ? 's' : '' }} remaining in pool
            </span>
          </div>
        </section>
      </Transition>

      <section v-if="pickLog.length > 0 || selectedNames.length > 0" class="card card--history">
        <div class="card-heading">
          <div class="card-heading__left">
            <span class="step-badge step-badge--history">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="margin-right:6px;vertical-align:middle;"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              History
            </span>
            <h2 class="card-title">Previous Picks</h2>
          </div>
          <div class="card-heading__actions">
            <span class="history-total">{{ pickLog.length }} round{{ pickLog.length !== 1 ? 's' : '' }}</span>
            <button v-if="selectedNames.length > 0" class="reset-btn" @click="resetSelectionHistory">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                <polyline points="1 4 1 10 7 10" />
                <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
              </svg>
              Reset
            </button>
          </div>
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
        <div v-if="pickLog.length > 0" class="history-footer">
          <button class="btn btn--ghost btn--xs" @click="resetHistory">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="1 4 1 10 7 10" />
              <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
            </svg>
            Reset pick history
          </button>
        </div>
      </section>
    </div>

    <!-- Toast Notifications -->
    <div class="toast-container">
      <TransitionGroup name="toast">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          class="toast"
          :class="`toast--${toast.type}`"
        >
          <svg v-if="toast.type === 'success'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <svg v-else-if="toast.type === 'warning'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <svg v-else-if="toast.type === 'error'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
          <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
          <span>{{ toast.message }}</span>
        </div>
      </TransitionGroup>
    </div>
  </div>
</template>

<style scoped>
.page {
  margin-top: 70px;
  min-height: 100vh;
  background: #f8fafc;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  position: relative;
}

.container {
  max-width: 48rem;
  margin: 0 auto;
  padding: 2rem 1.5rem 3rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

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

.confetti-particle--circle { border-radius: 50%; }
.confetti-particle--star {
  clip-path: polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%);
}
.confetti-particle--square { border-radius: 2px; }

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
  background: linear-gradient(135deg, #6366f1, #4f46e5);
  color: white;
  border-radius: 0.875rem;
  flex-shrink: 0;
  margin-top: 0.125rem;
  box-shadow: 0 8px 20px rgba(99, 102, 241, 0.25);
}

.header-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
  line-height: 1.3;
  letter-spacing: -0.025em;
}

.header-subtitle {
  font-size: 0.875rem;
  color: #64748b;
  margin: 0.25rem 0 0;
  line-height: 1.6;
}

.btn-back {
  display: inline-flex;
  align-items: center;
  padding: 10px 20px;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 600;
  font-size: 14px;
  border: 1.5px solid #e2e8f0;
  color: #334155;
  transition: all 0.2s ease;
  margin-bottom: 24px;
}

.btn-back:hover {
  border-color: #2563eb;
  color: #2563eb;
}

.toolbar {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.toolbar__btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.45rem 0.85rem;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 0.625rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: #475569;
  cursor: pointer;
  transition: all 0.15s ease;
  font-family: inherit;
}

.toolbar__btn:hover:not(:disabled) {
  border-color: #6366f1;
  color: #6366f1;
  background: #fafbff;
  box-shadow: 0 2px 8px rgba(99, 102, 241, 0.08);
}

.toolbar__btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.stats-bar {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.85rem 1.25rem;
  background: white;
  border-radius: 0.875rem;
  border: 1px solid #eef2ff;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.02);
  flex-wrap: wrap;
}

.stats-bar__item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.1rem;
  min-width: 3rem;
}

.stats-bar__value {
  font-size: 1.25rem;
  font-weight: 700;
  color: #0f172a;
  line-height: 1.2;
  font-variant-numeric: tabular-nums;
}

.stats-bar__label {
  font-size: 0.6rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #94a3b8;
}

.stats-bar__item--success .stats-bar__value { color: #16a34a; }
.stats-bar__item--warning .stats-bar__value { color: #d97706; }
.stats-bar__item--info .stats-bar__value { color: #6366f1; }

.stats-bar__progress {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 0.6rem;
  min-width: 8rem;
  margin-left: auto;
}

.stats-bar__progress-track {
  flex: 1;
  height: 0.375rem;
  background: #f1f5f9;
  border-radius: 999px;
  overflow: hidden;
}

.stats-bar__progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #6366f1, #8b5cf6);
  border-radius: 999px;
  transition: width 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.stats-bar__progress-label {
  font-size: 0.65rem;
  font-weight: 600;
  color: #64748b;
  white-space: nowrap;
}

.card {
  background: white;
  border-radius: 1rem;
  padding: 1.25rem 1.5rem;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04), 0 4px 16px rgba(0, 0, 0, 0.02);
  border: 1px solid #f1f5f9;
  transition: opacity 0.25s, border-color 0.25s, box-shadow 0.25s;
}

.card:hover {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04), 0 8px 24px rgba(0, 0, 0, 0.04);
}

.card--disabled {
  opacity: 0.45;
  pointer-events: none;
}

.card--step2 {
  background: linear-gradient(to bottom, #fafbff, white);
  border-color: #eef2ff;
}

.card--result {
  border-color: #bbf7d0;
  background: linear-gradient(to bottom, #fafefc, white);
  box-shadow: 0 4px 24px rgba(34, 197, 94, 0.08);
  position: relative;
  overflow: hidden;
}

.card--history {
  background: white;
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
  font-size: 0.9375rem;
  font-weight: 600;
  color: #0f172a;
  margin: 0;
  white-space: nowrap;
}

.step-badge {
  font-size: 0.65rem;
  font-weight: 700;
  color: #6366f1;
  background: #eef2ff;
  padding: 0.25rem 0.65rem;
  border-radius: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  white-space: nowrap;
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
}

.step-badge--gold {
  color: #6366f1;
  background: #eef2ff;
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
  color: #6366f1;
  background: #eef2ff;
  padding: 0.2rem 0.65rem;
  border-radius: 999px;
  white-space: nowrap;
}

.picked-badge {
  font-size: 0.7rem;
  font-weight: 700;
  color: #16a34a;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  padding: 0.2rem 0.55rem;
  border-radius: 999px;
  white-space: nowrap;
}

.picked-badge--available {
  color: #6366f1;
  background: #eef2ff;
  border-color: #c7d2fe;
}

.input-area {
  border: 1.5px solid #e2e8f0;
  border-radius: 0.875rem;
  padding: 0.5rem;
  transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
  background: #fafafa;
}

.input-area--focused {
  border-color: #6366f1;
  box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.08);
  background: white;
}

.input-area__textarea {
  width: 100%;
  border: none;
  outline: none;
  padding: 0.5rem 0.6rem;
  font-size: 0.875rem;
  font-family: inherit;
  color: #0f172a;
  background: transparent;
  resize: vertical;
  min-height: 3rem;
  line-height: 1.7;
}

.input-area__textarea::placeholder {
  color: #94a3b8;
  white-space: pre-line;
}

.input-area__actions {
  display: flex;
  gap: 0.5rem;
  padding: 0.35rem 0.5rem 0.15rem;
  flex-wrap: wrap;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  border: none;
  border-radius: 0.625rem;
  padding: 0.5rem 1rem;
  font-size: 0.8125rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;
  font-family: inherit;
  position: relative;
  overflow: hidden;
}

.btn--primary {
  background: linear-gradient(135deg, #6366f1, #4f46e5);
  color: white;
  box-shadow: 0 2px 8px rgba(99, 102, 241, 0.2);
}

.btn--primary:hover:not(:disabled) {
  background: linear-gradient(135deg, #4f46e5, #4338ca);
  transform: translateY(-1px);
  box-shadow: 0 4px 14px rgba(99, 102, 241, 0.3);
}

.btn--primary:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  transform: none;
}

.btn--ghost-outline {
  background: transparent;
  color: #6366f1;
  border: 1.5px solid #c7d2fe;
}

.btn--ghost-outline:hover:not(:disabled) {
  background: #eef2ff;
  border-color: #6366f1;
}

.btn--ghost-outline:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn--ghost {
  background: transparent;
  color: #94a3b8;
  border: 1px solid transparent;
}

.btn--ghost:hover:not(:disabled) {
  background: #f1f5f9;
  color: #ef4444;
  border-color: #fecaca;
}

.btn--export {
  background: linear-gradient(135deg, #059669, #047857);
  color: white;
  font-size: 0.75rem;
  padding: 0.4rem 0.8rem;
  box-shadow: 0 2px 8px rgba(5, 150, 105, 0.2);
}

.btn--export:hover:not(:disabled) {
  background: linear-gradient(135deg, #047857, #065f46);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(5, 150, 105, 0.3);
}

.btn--export:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn--sm {
  font-size: 0.75rem;
  padding: 0.35rem 0.7rem;
}

.btn--xs {
  font-size: 0.7rem;
  padding: 0.25rem 0.55rem;
  border-radius: 0.4rem;
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.75rem;
}

.chip {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  background: #fafafa;
  border: 1px solid #e2e8f0;
  border-radius: 999px;
  padding: 0.3rem 0.55rem 0.3rem 0.3rem;
  transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
  position: relative;
}

.chip:hover {
  background: #f8fafc;
  border-color: #cbd5e1;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.chip--active {
  border-color: #6366f1;
  background: #eef2ff;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.12), 0 2px 8px rgba(99, 102, 241, 0.08);
  transform: translateY(-2px) scale(1.03);
}

.chip--picked {
  border-color: #22c55e;
  background: #f0fdf4;
  box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.12);
}

.chip--used {
  opacity: 0.55;
  filter: grayscale(0.4);
}

.chip--used .chip__name {
  text-decoration: line-through;
  text-decoration-color: #94a3b8;
}

.chip__avatar {
  width: 1.8rem;
  height: 1.8rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.6rem;
  font-weight: 700;
  color: white;
  flex-shrink: 0;
  text-shadow: 0 1px 2px rgba(0,0,0,0.15);
  letter-spacing: 0.03em;
}

.chip__name {
  font-size: 0.8rem;
  font-weight: 500;
  color: #1e293b;
  max-width: 8rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.chip__used-badge {
  font-size: 0.55rem;
  font-weight: 700;
  color: #94a3b8;
  background: #f1f5f9;
  padding: 0.08rem 0.3rem;
  border-radius: 999px;
  line-height: 1.2;
}

.chip__remove {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.2rem;
  height: 1.2rem;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: #94a3b8;
  cursor: pointer;
  opacity: 0;
  transition: all 0.15s;
  padding: 0;
  flex-shrink: 0;
}

.chip:hover .chip__remove {
  opacity: 1;
}

.chip__remove:hover {
  background: #fee2e2;
  color: #ef4444;
  transform: scale(1.15);
}

.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2.5rem 1rem;
  text-align: center;
}

.empty__icon-wrap {
  width: 4.5rem;
  height: 4.5rem;
  background: #f8fafc;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1rem;
}

.empty__text {
  font-size: 0.95rem;
  font-weight: 600;
  color: #64748b;
  margin: 0 0 0.35rem;
}

.empty__hint {
  font-size: 0.8rem;
  color: #94a3b8;
  margin: 0;
}

.empty__link {
  background: none;
  border: none;
  color: #6366f1;
  font-weight: 600;
  cursor: pointer;
  padding: 0;
  font-family: inherit;
  font-size: inherit;
  text-decoration: underline;
  text-underline-offset: 2px;
}

.empty__link:hover {
  color: #4f46e5;
}

.all-picked-notice {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 0.9rem;
  background: #fffbeb;
  border: 1px solid #fde68a;
  border-radius: 0.625rem;
  font-size: 0.85rem;
  color: #92400e;
  margin-bottom: 1rem;
}

.picker-controls {
  display: flex;
  align-items: flex-end;
  gap: 1.25rem;
  flex-wrap: wrap;
}

.counter {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.counter__label {
  font-size: 0.75rem;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.counter__group {
  display: flex;
  align-items: center;
  gap: 0;
  background: #f8fafc;
  border: 1.5px solid #e2e8f0;
  border-radius: 0.75rem;
  overflow: hidden;
}

.counter__btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.4rem;
  height: 2.6rem;
  border: none;
  background: transparent;
  color: #475569;
  cursor: pointer;
  transition: all 0.1s;
  padding: 0;
}

.counter__btn:hover:not(:disabled) {
  background: #eef2ff;
  color: #6366f1;
}

.counter__btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.counter__value {
  min-width: 2.5rem;
  text-align: center;
  padding: 0 0.25rem;
}

.counter__num {
  font-size: 1.25rem;
  font-weight: 700;
  color: #0f172a;
  font-variant-numeric: tabular-nums;
}

.counter__hint {
  font-size: 0.7rem;
  font-weight: 500;
  color: #94a3b8;
}

.counter__hint--warn {
  color: #f59e0b;
}

.pick-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  flex: 1;
  min-width: 10rem;
  padding: 0.8rem 1.5rem;
  background: linear-gradient(135deg, #6366f1, #4f46e5);
  color: white;
  border: none;
  border-radius: 0.875rem;
  font-size: 0.9375rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
  box-shadow: 0 4px 16px rgba(99, 102, 241, 0.3);
  font-family: inherit;
  position: relative;
  overflow: hidden;
}

.pick-btn:hover:not(:disabled) {
  transform: translateY(-2px) scale(1.02);
  box-shadow: 0 6px 24px rgba(99, 102, 241, 0.4);
  background: linear-gradient(135deg, #4f46e5, #4338ca);
}

.pick-btn:active:not(:disabled) {
  transform: translateY(0) scale(0.98);
}

.pick-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
  transform: none;
}

.pick-btn--loading {
  pointer-events: none;
  opacity: 0.8;
}

.pick-btn__inner {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.spinner {
  width: 1rem;
  height: 1rem;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.card--result {
  animation: result-in 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes result-in {
  from { opacity: 0; transform: translateY(16px) scale(0.97); }
}

.card--glowing {
  box-shadow: 0 0 20px var(--glow-color, #22c55e), 0 4px 24px rgba(34, 197, 94, 0.08);
  border-color: var(--glow-color, #22c55e);
  transition: box-shadow 0.1s, border-color 0.1s;
}

.confetti-burst {
  position: absolute;
  top: 50%;
  left: 50%;
  pointer-events: none;
}

.confetti-burst .confetti-particle {
  position: absolute;
  width: 6px;
  height: 6px;
  border-radius: 2px;
  background: var(--confetti-color);
  animation: confetti-burst 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
  animation-delay: calc(var(--i) * 0.02s);
  opacity: 0;
}

@keyframes confetti-burst {
  0% {
    opacity: 1;
    transform: translate(0, 0) rotate(0deg) scale(1);
  }
  100% {
    opacity: 0;
    transform:
      translate(
        calc(cos(var(--i) * 1.2rad) * 120px),
        calc(sin(var(--i) * 1.2rad) * 120px - 60px)
      )
      rotate(calc(var(--i) * 45deg))
      scale(0.3);
  }
}

.results-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  padding: 0.5rem 0;
}

.result-tile {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem 0.5rem 0.5rem;
  background: #f8fafc;
  border: 1.5px solid #e2e8f0;
  border-radius: 0.75rem;
  animation: tile-in 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) both;
  animation-delay: var(--tile-delay, 0s);
  position: relative;
  overflow: hidden;
}

.result-tile::before {
  content: '';
  position: absolute;
  inset: 0;
  background: var(--tile-color, #6366f1);
  opacity: 0.06;
}

@keyframes tile-in {
  from { opacity: 0; transform: translateY(10px) scale(0.9); }
}

.result-tile__check {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.4rem;
  height: 1.4rem;
  background: var(--tile-color, #22c55e);
  color: white;
  border-radius: 50%;
  flex-shrink: 0;
}

.result-tile__avatar {
  width: 1.8rem;
  height: 1.8rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.6rem;
  font-weight: 700;
  color: white;
  flex-shrink: 0;
}

.result-tile__name {
  font-size: 0.85rem;
  font-weight: 600;
  color: #1e293b;
}

.results-footer {
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid #e2e8f0;
}

.results-footer__text {
  font-size: 0.75rem;
  color: #94a3b8;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.history-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 0.6rem;
  border-radius: 0.5rem;
  transition: background 0.15s;
}

.history-row:hover {
  background: #f8fafc;
}

.history-row__index {
  font-size: 0.7rem;
  font-weight: 700;
  color: #cbd5e1;
  min-width: 1.8rem;
  font-variant-numeric: tabular-nums;
}

.history-row__info {
  flex: 1;
  min-width: 0;
}

.history-row__names {
  display: flex;
  flex-wrap: wrap;
  gap: 0;
}

.history-row__name {
  font-size: 0.8rem;
  font-weight: 500;
  color: #334155;
}

.history-row__meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
}

.history-row__count {
  font-size: 0.7rem;
  font-weight: 700;
  color: #6366f1;
  background: #eef2ff;
  padding: 0.1rem 0.45rem;
  border-radius: 999px;
  min-width: 1.4rem;
  text-align: center;
}

.history-row__time {
  font-size: 0.65rem;
  color: #94a3b8;
  white-space: nowrap;
}

.history-total {
  font-size: 0.75rem;
  font-weight: 600;
  color: #94a3b8;
}

.reset-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  background: none;
  border: 1px solid #e2e8f0;
  border-radius: 0.4rem;
  padding: 0.25rem 0.55rem;
  font-size: 0.7rem;
  font-weight: 600;
  color: #94a3b8;
  cursor: pointer;
  transition: all 0.15s;
  font-family: inherit;
}

.reset-btn:hover {
  background: #fef2f2;
  border-color: #fecaca;
  color: #ef4444;
}

.history-footer {
  margin-top: 0.5rem;
  padding-top: 0.5rem;
  border-top: 1px solid #f1f5f9;
  display: flex;
  justify-content: center;
}

.toast-container {
  position: fixed;
  top: 5rem;
  right: 1rem;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  pointer-events: none;
}

.toast {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.7rem 1rem;
  border-radius: 0.75rem;
  font-size: 0.85rem;
  font-weight: 500;
  color: #1e293b;
  background: white;
  border: 1px solid #e2e8f0;
  box-shadow: 0 4px 20px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04);
  pointer-events: auto;
  max-width: 24rem;
  backdrop-filter: blur(8px);
}

.toast--success { border-left: 3px solid #22c55e; }
.toast--success svg { color: #22c55e; flex-shrink: 0; }
.toast--warning { border-left: 3px solid #f59e0b; }
.toast--warning svg { color: #f59e0b; flex-shrink: 0; }
.toast--error { border-left: 3px solid #ef4444; }
.toast--error svg { color: #ef4444; flex-shrink: 0; }
.toast--info { border-left: 3px solid #6366f1; }
.toast--info svg { color: #6366f1; flex-shrink: 0; }

.toast-enter-active { transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }
.toast-leave-active { transition: all 0.2s ease; }
.toast-enter-from { opacity: 0; transform: translateX(30px) scale(0.95); }
.toast-leave-to { opacity: 0; transform: translateX(30px); }

.chip-enter-active { transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }
.chip-leave-active { transition: all 0.2s ease; position: absolute; }
.chip-enter-from { opacity: 0; transform: scale(0.7); }
.chip-leave-to { opacity: 0; transform: scale(0.7); }
.chip-move { transition: transform 0.3s ease; }

.slide-up-enter-active { transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }
.slide-up-leave-active { transition: all 0.2s ease; }
.slide-up-enter-from { opacity: 0; transform: translateY(16px); }
.slide-up-leave-to { opacity: 0; transform: translateY(-8px); }

.history-item-enter-active { transition: all 0.3s ease; }
.history-item-leave-active { transition: all 0.2s ease; position: absolute; }
.history-item-enter-from { opacity: 0; transform: translateX(-10px); }
.history-item-leave-to { opacity: 0; transform: translateX(10px); }
.history-item-move { transition: transform 0.3s ease; }

/* ── Responsive ── */
@media (max-width: 640px) {
  .container { padding: 1rem 1rem 2rem; }
  .header { flex-direction: column; align-items: stretch; }
  .btn-back { width: 100%; justify-content: center; margin-bottom: 12px; }
  .card { padding: 1rem; }
  .input-area__actions { flex-direction: column; }
  .input-area__actions .btn { width: 100%; justify-content: center; }
  .picker-controls { flex-direction: column; }
  .pick-btn { width: 100%; }
  .stats-bar { flex-direction: column; align-items: stretch; text-align: center; }
  .stats-bar__progress { margin-left: 0; }
  .results-grid { justify-content: center; }
  .toast-container { left: 0.5rem; right: 0.5rem; }
  .toast { max-width: none; }
}
</style>
