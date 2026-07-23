<script setup lang="ts">
import { ref, computed, onUnmounted, watch } from 'vue'
import { jsPDF } from 'jspdf'
import * as XLSX from 'xlsx'

interface Student {
  id: number
  name: string
  initials: string
  studentId: string
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

const SELECTED_NAMES_KEY = 'card-picker-selected-names'

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

const AVATAR_COLORS = [
  '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
  '#EC4899', '#06B6D4', '#F97316', '#6366F1', '#14B8A6',
  '#22C55E', '#D946EF', '#0EA5E9', '#84CC16', '#E11D48',
  '#7C3AED', '#0891B2', '#DB2777', '#CA8A04', '#059669',
]

const COLORS = [
  '#6366f1', '#ec4899', '#f59e0b', '#14b8a6',
  '#22c55e', '#ef4444', '#8b5cf6', '#06b6d4',
  '#f97316', '#10b981',
]

function getColor(index: number): string {
  return COLORS[index % COLORS.length]!
}

function getAvatarColor(id: number): string {
  return AVATAR_COLORS[(id - 1) % AVATAR_COLORS.length] ?? '#3B82F6'
}

const students = ref<Student[]>(
  [
    'Alice Johnson', 'Bob Smith', 'Carol Williams', 'David Brown',
    'Eve Davis', 'Frank Miller', 'Grace Wilson',
  ].map((name, i) => ({
    id: i + 1,
    name,
    initials: name.split(' ').map(w => w[0]).join(''),
    studentId: `STU-${String(i + 1).padStart(3, '0')}`,
    color: getColor(i),
  }))
)

const selectedIds = ref<Set<number>>(new Set())
const selectedNames = ref<string[]>(loadSelectedNames())
const searchQuery = ref('')
const isPicking = ref(false)
const isPickingGroup = ref(false)
const pickedId = ref<number | null>(null)
const pickedGroupIds = ref<Set<number>>(new Set())
const lastPickedIds = ref<Set<number>>(new Set())
const groupSize = ref(2)
const showConfetti = ref(false)
const particles = ref<Particle[]>([])
const cardGlowIntensity = ref(0)
const namesInput = ref('')
const inputFocused = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)
const importError = ref<string | null>(null)
const importSuccess = ref<string | null>(null)
const importWarning = ref<string | null>(null)
const isExporting = ref(false)
const showImportPanel = ref(false)

let pickTimeout: ReturnType<typeof setTimeout> | null = null
let groupTimeouts: ReturnType<typeof setTimeout>[] = []
let confettiInterval: ReturnType<typeof setInterval> | null = null
let glowInterval: ReturnType<typeof setInterval> | null = null
let importSuccessTimeout: ReturnType<typeof setTimeout> | null = null
let importWarningTimeout: ReturnType<typeof setTimeout> | null = null
let importErrorTimeout: ReturnType<typeof setTimeout> | null = null
let particleIdCounter = 0

// ─── Sound Engine ───
let audioCtx: AudioContext | null = null

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext()
    audioCtx.resume()
  }
  return audioCtx
}

/** Quick percussive tick — like a laser blip */
function playTickSound() {
  try {
    const ctx = getAudioContext()
    const now = ctx.currentTime

    // Bright short blip
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = 'square'
    osc.frequency.setValueAtTime(1200 + Math.random() * 600, now)
    osc.frequency.exponentialRampToValueAtTime(400, now + 0.04)
    gain.gain.setValueAtTime(0.06, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04)
    osc.start(now)
    osc.stop(now + 0.04)

    // Subtle sub click
    const sub = ctx.createOscillator()
    const subGain = ctx.createGain()
    sub.connect(subGain)
    subGain.connect(ctx.destination)
    sub.type = 'sine'
    sub.frequency.value = 150
    subGain.gain.setValueAtTime(0.04, now)
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.03)
    sub.start(now)
    sub.stop(now + 0.03)
  } catch { /* audio not supported */ }
}

/** Celebratory ascending chime — major triad arpeggio */
function playSelectedSound() {
  try {
    const ctx = getAudioContext()
    const now = ctx.currentTime
    const notes = [523.25, 659.25, 783.99, 1046.5] // C5, E5, G5, C6

    notes.forEach((freq, i) => {
      const delay = i * 0.07

      // Main tone
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.type = 'sine'
      osc.frequency.value = freq
      gain.gain.setValueAtTime(0, now + delay)
      gain.gain.linearRampToValueAtTime(0.14, now + delay + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.6)
      osc.start(now + delay)
      osc.stop(now + delay + 0.6)

      // Sparkle overtone
      if (i === notes.length - 1) {
        const spark = ctx.createOscillator()
        const sparkGain = ctx.createGain()
        spark.connect(sparkGain)
        sparkGain.connect(ctx.destination)
        spark.type = 'triangle'
        spark.frequency.value = freq * 2
        sparkGain.gain.setValueAtTime(0, now + delay)
        sparkGain.gain.linearRampToValueAtTime(0.05, now + delay + 0.02)
        sparkGain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.3)
        spark.start(now + delay)
        spark.stop(now + delay + 0.3)
      }
    })
  } catch { /* audio not supported */ }
}

/** Dramatic rising tension — builds anticipation */
function playDrumRollSound() {
  try {
    const ctx = getAudioContext()
    const now = ctx.currentTime
    const hitCount = 14

    for (let i = 0; i < hitCount; i++) {
      const time = now + i * 0.05
      const t = i / hitCount

      // Noise-like hit using triangle wave with random frequency
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.type = 'triangle'
      osc.frequency.value = 80 + Math.random() * 150 * (1 + t * 2)
      gain.gain.setValueAtTime(0.035 * (1 + t * 1.5), time)
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.035)
      osc.start(time)
      osc.stop(time + 0.035)

      // Secondary hit for texture
      if (i % 2 === 0) {
        const hit = ctx.createOscillator()
        const hitGain = ctx.createGain()
        hit.connect(hitGain)
        hitGain.connect(ctx.destination)
        hit.type = 'sawtooth'
        hit.frequency.value = 60 + Math.random() * 80
        hitGain.gain.setValueAtTime(0.02 * (1 + t * 2), time)
        hitGain.gain.exponentialRampToValueAtTime(0.001, time + 0.03)
        hit.start(time)
        hit.stop(time + 0.03)
      }

      // Rising pitch sweep in background
      const sweep = ctx.createOscillator()
      const sweepGain = ctx.createGain()
      sweep.connect(sweepGain)
      sweepGain.connect(ctx.destination)
      sweep.type = 'sine'
      sweep.frequency.setValueAtTime(200 + t * 600, time)
      sweepGain.gain.setValueAtTime(0.008, time)
      sweepGain.gain.exponentialRampToValueAtTime(0.001, time + 0.06)
      sweep.start(time)
      sweep.stop(time + 0.06)
    }
  } catch { /* audio not supported */ }
}

/** Triumphant fanfare when pick completes */
function playEndSound(frequency: number, duration = 180) {
  const AudioContext = window.AudioContext || (window as any).webkitAudioContext
  if (!AudioContext) return

  const ctx = new AudioContext()
  const now = ctx.currentTime
  const dur = duration / 1000

  // Bright major chord: root, 3rd, 5th, octave
  const root = frequency * 0.8
  const chord = [root, root * 1.25, root * 1.5, root * 2]

  chord.forEach((freq, i) => {
    const delay = i * 0.04

    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = i === 2 ? 'triangle' : 'sine'
    osc.frequency.value = freq
    gain.gain.setValueAtTime(0, now + delay)
    gain.gain.linearRampToValueAtTime(0.1 - i * 0.015, now + delay + 0.02)
    gain.gain.linearRampToValueAtTime(0.08 - i * 0.01, now + delay + 0.1)
    gain.gain.exponentialRampToValueAtTime(0.001, now + delay + dur)
    osc.start(now + delay)
    osc.stop(now + delay + dur + 0.05)
  })

  // Sparkle on top
  const sparkle = ctx.createOscillator()
  const sparkGain = ctx.createGain()
  sparkle.connect(sparkGain)
  sparkGain.connect(ctx.destination)
  sparkle.type = 'sine'
  sparkle.frequency.setValueAtTime(root * 2.5, now)
  sparkle.frequency.exponentialRampToValueAtTime(root * 3, now + dur * 0.5)
  sparkGain.gain.setValueAtTime(0.03, now)
  sparkGain.gain.exponentialRampToValueAtTime(0.001, now + dur * 0.6)
  sparkle.start(now)
  sparkle.stop(now + dur)

  // Cleanup
  setTimeout(() => {
    ctx.close().catch(() => {})
  }, (dur + 0.1) * 1000)
}

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

const filteredStudents = computed(() => {
  let list = students.value
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter(s => s.name.toLowerCase().includes(q) || s.studentId.toLowerCase().includes(q))
  }
  return list
})

const selectedCount = computed(() => selectedIds.value.size)
const groupSizeOpen = ref(false)

// Students that match the search AND haven't been picked yet
const pickableStudents = computed(() =>
  filteredStudents.value.filter(s => !selectedNames.value.includes(s.name))
)
const isPoolExhausted = computed(() =>
  pickableStudents.value.length === 0 && filteredStudents.value.length > 0
)

const maxGroupSize = computed(() => Math.min(pickableStudents.value.length, 10))
const groupSizeOptions = computed(() => {
  const max = maxGroupSize.value
  const options: number[] = []
  for (let i = 2; i <= max; i++) {
    options.push(i)
  }
  return options
})

function toggleCard(id: number) {
  const set = new Set(selectedIds.value)
  if (set.has(id)) {
    set.delete(id)
  } else {
    set.add(id)
  }
  selectedIds.value = set
}

function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const a = shuffled[i]!
    const b = shuffled[j]!
    shuffled[i] = b
    shuffled[j] = a
  }
  return shuffled
}

async function pickRandom() {
  if (isPicking.value || pickableStudents.value.length === 0) return
  isPicking.value = true
  pickedId.value = null
  lastPickedIds.value = new Set()
  pickedGroupIds.value = new Set()
  selectedIds.value = new Set()
  stopCardGlow()
  particles.value = []
  showConfetti.value = false

  playDrumRollSound()

  const flashDuration = 900
  const start = Date.now()

  await new Promise<void>((resolve) => {
    const interval = setInterval(() => {
      const elapsed = Date.now() - start
      if (elapsed >= flashDuration) {
        clearInterval(interval)
        resolve()
        return
      }
      const list = pickableStudents.value
      const randomIdx = Math.floor(Math.random() * list.length)
      const student = list[randomIdx]!
      pickedId.value = student.id
      playTickSound()
    }, 60)
  })

  const finalStudent = pickableStudents.value[Math.floor(Math.random() * pickableStudents.value.length)]!
  pickedId.value = finalStudent.id
  const set = new Set(selectedIds.value)
  set.add(finalStudent.id)
  selectedIds.value = set

  // Persist to localStorage
  if (!selectedNames.value.includes(finalStudent.name)) {
    selectedNames.value.push(finalStudent.name)
    persistSelectedNames(selectedNames.value)
  }

  isPicking.value = false
  if (pickTimeout) clearTimeout(pickTimeout)
  pickTimeout = setTimeout(() => { pickedId.value = null }, 2000)
  lastPickedIds.value = new Set([finalStudent.id])
  
  playSelectedSound()
  spawnConfetti(50, finalStudent.color)
  animateCardGlow()
  playEndSound(1080, 190)
}

async function pickGroup() {
  if (isPickingGroup.value || pickableStudents.value.length < groupSize.value) return

  // Cancel any pending timeouts from previous group picks
  groupTimeouts.forEach(t => clearTimeout(t))
  groupTimeouts = []

  isPickingGroup.value = true
  pickedGroupIds.value = new Set()
  lastPickedIds.value = new Set()
  selectedIds.value = new Set()
  stopCardGlow()
  particles.value = []
  showConfetti.value = false

  const shuffled = shuffleArray(pickableStudents.value)
  const picked = shuffled.slice(0, groupSize.value)

  playDrumRollSound()

  const flashDuration = 600
  const start = Date.now()

  await new Promise<void>((resolve) => {
    const interval = setInterval(() => {
      const elapsed = Date.now() - start
      if (elapsed >= flashDuration) {
        clearInterval(interval)
        resolve()
        return
      }
      const list = pickableStudents.value
      const previewSet = new Set<number>()
      for (let i = 0; i < groupSize.value; i++) {
        const randomIdx = Math.floor(Math.random() * list.length)
        const student = list[randomIdx]!
        previewSet.add(student.id)
      }
      pickedGroupIds.value = previewSet
      playTickSound()
    }, 80)
  })

  const revealDelay = 350
  for (let i = 0; i < picked.length; i++) {
    await new Promise<void>((resolve) => {
      const t = setTimeout(() => {
        const student = picked[i]!
        const newSet = new Set(selectedIds.value)
        newSet.add(student.id)
        selectedIds.value = newSet
        pickedGroupIds.value = new Set([student.id])
        resolve()
      }, i === 0 ? 0 : revealDelay)
      groupTimeouts.push(t)
    })
  }

  const finalSet = new Set(picked.map(s => s.id))
  pickedGroupIds.value = finalSet

  // Persist to localStorage
  for (const student of picked) {
    if (!selectedNames.value.includes(student.name)) {
      selectedNames.value.push(student.name)
    }
  }
  persistSelectedNames(selectedNames.value)

  groupTimeouts.push(setTimeout(() => {
    pickedGroupIds.value = new Set()
    isPickingGroup.value = false
    lastPickedIds.value = finalSet
    playSelectedSound()
    spawnConfetti(40, picked[0]?.color)
    animateCardGlow()
    playEndSound(840, 260)
  }, 1500))
}

function setGroupSize(size: number) {
  groupSize.value = size
  groupSizeOpen.value = false
}

function deleteSelected() {
  if (selectedIds.value.size === 0) return
  const deletedNames = students.value
    .filter(student => selectedIds.value.has(student.id))
    .map(s => s.name)
  students.value = students.value.filter(student => !selectedIds.value.has(student.id))
  selectedNames.value = selectedNames.value.filter(n => !deletedNames.includes(n))
  persistSelectedNames(selectedNames.value)
  selectedIds.value = new Set()
  pickedGroupIds.value = new Set()
  lastPickedIds.value = new Set()
  pickedId.value = null
}

function clearAll() {
  selectedIds.value = new Set()
  pickedGroupIds.value = new Set()
  lastPickedIds.value = new Set()
}

function resetSelectionHistory() {
  selectedNames.value = []
  persistSelectedNames([])
}

function clearSelection() {
  // Cancel any pending group animation timeouts
  groupTimeouts.forEach(t => clearTimeout(t))
  groupTimeouts = []

  const set = new Set(selectedIds.value)
  for (const id of lastPickedIds.value) {
    set.delete(id)
  }
  selectedIds.value = set
  lastPickedIds.value = new Set()
  pickedGroupIds.value = new Set()
  pickedId.value = null
}

function formatTime(date: Date) {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function formatDate(date: Date) {
  return date.toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' })
}

function exportToPDF() {
  if (selectedNames.value.length === 0) return

  isExporting.value = true

  try {
    const doc = new jsPDF()
    const now = new Date()
    const pageWidth = doc.internal.pageSize.getWidth()

    // Header bar
    doc.setFillColor(30, 64, 175)
    doc.rect(0, 0, pageWidth, 28, 'F')

    doc.setTextColor(255, 255, 255)
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('Card Picker — Results', pageWidth / 2, 18, { align: 'center' })

    doc.setTextColor(100, 116, 139)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(`Exported: ${formatDate(now)} at ${formatTime(now)}`, pageWidth / 2, 38, { align: 'center' })

    doc.text(`${selectedNames.value.length} student${selectedNames.value.length !== 1 ? 's' : ''} picked`, pageWidth / 2, 46, { align: 'center' })

    // Separator line
    doc.setDrawColor(226, 232, 240)
    doc.line(20, 53, pageWidth - 20, 53)

    // Picked students header
    doc.setTextColor(30, 64, 175)
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text('Picked Students', 20, 64)

    // List picked students
    doc.setTextColor(30, 41, 59)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')

    selectedNames.value.forEach((name, index) => {
      const yPos = 76 + index * 8
      doc.circle(24, yPos - 2, 1.5, 'F')
      doc.text(`${index + 1}.  ${name}`, 30, yPos)
    })

    // Total count at bottom
    const totalY = 76 + selectedNames.value.length * 8 + 14
    doc.setDrawColor(226, 232, 240)
    doc.line(20, totalY - 4, pageWidth - 20, totalY - 4)

    doc.setTextColor(100, 116, 139)
    doc.setFontSize(9)
    doc.text(`Total picked: ${selectedNames.value.length}`, 20, totalY)
    doc.text(`Export date: ${formatDate(now)} at ${formatTime(now)}`, 20, totalY + 7)

    // Footer
    doc.setFillColor(248, 250, 252)
    doc.rect(0, doc.internal.pageSize.getHeight() - 16, pageWidth, 16, 'F')
    doc.setTextColor(148, 163, 184)
    doc.setFontSize(8)
    doc.text('Generated by ClassTools — EngageClassKH', pageWidth / 2, doc.internal.pageSize.getHeight() - 6, { align: 'center' })

    doc.save('card-picker-results.pdf')
  } finally {
    isExporting.value = false
  }
}

function confirmSelection() {
  alert(`Selected ${selectedCount.value} student${selectedCount.value !== 1 ? 's' : ''}`)
}

onUnmounted(() => {
  if (pickTimeout) clearTimeout(pickTimeout)
  groupTimeouts.forEach(t => clearTimeout(t))
  groupTimeouts = []
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

// ─── Import Functions ───
function addAllStudents() {
  const raw = namesInput.value.trim()
  if (!raw) return

  const names = raw
    .split(/[\n,]+/)
    .map(n => n.trim())
    .filter(n => n.length > 0)

  if (names.length === 0) return

  const startIndex = students.value.length
  const newStudents = names.map((name, i) => ({
    id: Date.now() + i,
    name,
    initials: name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2),
    studentId: `STU-${String(startIndex + i + 1).padStart(3, '0')}`,
    color: getColor(startIndex + i),
  }))
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
      const newStudents = newNames.map((name, i) => ({
        id: Date.now() + i,
        name,
        initials: name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2),
        studentId: `STU-${String(startIndex + i + 1).padStart(3, '0')}`,
        color: getColor(startIndex + i),
      }))
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
  selectedIds.value = new Set()
  pickedGroupIds.value = new Set()
  lastPickedIds.value = new Set()
  pickedId.value = null
  selectedNames.value = []
  persistSelectedNames([])
  stopCardGlow()
  particles.value = []
  showConfetti.value = false
}

function removeStudent(id: number) {
  const removed = students.value.find(s => s.id === id)
  students.value = students.value.filter(s => s.id !== id)
  if (removed) {
    selectedNames.value = selectedNames.value.filter(n => n !== removed.name)
    persistSelectedNames(selectedNames.value)
  }
  if (pickedId.value === id) {
    pickedId.value = null
    stopCardGlow()
    particles.value = []
    showConfetti.value = false
  }
}

watch(showConfetti, (val) => {
  if (!val) {
    stopCardGlow()
  }
})
</script>

<template>
  <div class="picker">
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

    <!-- ─── Header ─── -->
    <div class="header">
      <div class="header__inner">
        <div>
          <h1 class="header__title">Card Picker</h1>
          <p class="header__desc">Select one or more students by tapping their cards.</p>
        </div>
        <div class="header__actions">
          <div class="header__counter" v-if="selectedCount > 0">
            <span class="header__count">{{ selectedCount }}</span>
            <span class="header__count-label">selected</span>
          </div>
          <button class="header__import-btn" @click="showImportPanel = !showImportPanel" :class="{ active: showImportPanel }">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            <span>Import</span>
          </button>
        </div>
      </div>
    </div>

    <!-- ─── Import Panel ─── -->
    <Transition name="slide">
      <div v-if="showImportPanel" class="import-panel">
        <div class="import-panel__inner">
          <div class="import-panel__section">
            <h3 class="import-panel__title">Add Students Manually</h3>
            <div class="bulk-form" :class="{ 'bulk-form--focused': inputFocused }">
              <textarea
                v-model="namesInput"
                class="bulk-form__textarea"
                placeholder="Enter student names, one per line&#10;e.g.:&#10;Alice&#10;Bob&#10;Charlie"
                @focus="inputFocused = true"
                @blur="inputFocused = false"
                rows="3"
              ></textarea>
              <div class="bulk-form__actions">
                <button
                  class="bulk-form__btn"
                  :disabled="!namesInput.trim()"
                  @click="addAllStudents"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  Add All
                </button>
              </div>
            </div>
          </div>

          <div class="import-panel__divider">
            <span>or</span>
          </div>

          <div class="import-panel__section">
            <h3 class="import-panel__title">Import from File</h3>
            <p class="import-panel__desc">Supports Excel (.xlsx, .xls), CSV, TXT, and JSON files</p>
            <button class="import-panel__file-btn" @click="triggerFileImport">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="12" y1="18" x2="12" y2="12" />
                <line x1="9" y1="15" x2="15" y2="15" />
              </svg>
              <span>Choose File</span>
            </button>
            <input
              ref="fileInput"
              type="file"
              accept=".txt,.csv,.tsv,.json,.xlsx,.xls,.xlsm,.xlsb,.ods"
              class="file-input"
              @change="handleFileImport"
            />
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

          <div class="import-panel__info">
            <span>{{ students.length }} student{{ students.length !== 1 ? 's' : '' }} in pool</span>
            <button v-if="students.length > 0" class="import-panel__clear-btn" @click="clearAllStudents">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
              Clear All
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- ─── Toolbar ─── -->
    <div class="toolbar">
      <div class="toolbar__inner">
        <!-- Search -->
        <div class="toolbar__search">
          <svg class="toolbar__search-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input v-model="searchQuery" type="text" class="toolbar__input" placeholder="Search student..." aria-label="Search student" />
          <button v-if="searchQuery" class="toolbar__clear" @click="searchQuery = ''" aria-label="Clear search">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
        </div>

        <!-- Actions -->
        <div class="toolbar__actions">
          <button class="toolbar__btn toolbar__btn--primary" @click="pickRandom" :disabled="isPicking || isPickingGroup || pickableStudents.length === 0" aria-label="Pick random student">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
              <path d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z" />
            </svg>
            <span v-if="isPicking">Picking...</span>
            <span v-else-if="isPoolExhausted && filteredStudents.length > 0">All Picked</span>
            <span v-else>Pick</span>
          </button>

          <div class="toolbar__group" v-if="filteredStudents.length >= 2">
            <div class="toolbar__group-size" @click.stop="groupSizeOpen = !groupSizeOpen" @mouseleave="groupSizeOpen = false">
              <button class="toolbar__group-btn" type="button" :disabled="isPickingGroup" aria-label="Group size">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
                <span class="toolbar__group-val">{{ groupSize }}</span>
                <svg class="toolbar__chevron" :class="{ open: groupSizeOpen }" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
              <Transition name="drop">
                <div v-if="groupSizeOpen" class="toolbar__menu toolbar__menu--right">
                  <button v-for="size in groupSizeOptions" :key="size" class="toolbar__menu-item" :class="{ active: size === groupSize }" @click="setGroupSize(size)">{{ size }} Students</button>
                </div>
              </Transition>
            </div>
            <button class="toolbar__btn toolbar__btn--outline" @click="pickGroup" :disabled="isPickingGroup || isPicking || pickableStudents.length < groupSize" aria-label="Pick group of students">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                <line x1="16" y1="8" x2="16" y2="14" />
                <line x1="19" y1="11" x2="13" y2="11" />
              </svg>
              <span>{{ isPickingGroup ? 'Picking...' : 'Group' }}</span>
            </button>
          </div>
          <button v-if="selectedCount > 0" class="toolbar__btn toolbar__btn--ghost" @click="clearAll" aria-label="Clear selection">
            Clear
          </button>
          <button v-if="selectedCount > 0" class="toolbar__btn toolbar__btn--danger" @click="deleteSelected" aria-label="Delete selected students">
            Delete Selected
          </button>
          <button v-if="selectedNames.length > 0" class="toolbar__btn toolbar__btn--export" @click="exportToPDF" :disabled="isExporting" aria-label="Export as PDF">
            <svg v-if="!isExporting" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="12" y1="18" x2="12" y2="12" />
              <line x1="9" y1="15" x2="15" y2="15" />
            </svg>
            <span v-if="isExporting" class="toolbar__btn-spinner"></span>
            <span>{{ isExporting ? 'Exporting...' : 'PDF' }}</span>
          </button>
          <button v-if="selectedNames.length > 0" class="toolbar__btn toolbar__btn--reset" @click="resetSelectionHistory" aria-label="Reset selection history">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <polyline points="1 4 1 10 7 10" />
              <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
            </svg>
            Reset ({{ selectedNames.length }})
          </button>

        </div>
      </div>
    </div>

    <!-- ─── Grid ─── -->
    <main class="main">
      <TransitionGroup name="grid" tag="div" class="grid">
        <button
          v-for="student in filteredStudents"
          :key="student.id"
          class="card"
          :class="{
            'card--sel': selectedIds.has(student.id),
            'card--pick': pickedId === student.id,
            'card--group': pickedGroupIds.has(student.id),
            'card--disabled': selectedNames.includes(student.name),
          }"
          :style="pickedId === student.id ? { '--glow-intensity': cardGlowIntensity } : {}"
          :disabled="selectedNames.includes(student.name)"
          @click="selectedNames.includes(student.name) ? undefined : toggleCard(student.id)"
          :aria-label="selectedNames.includes(student.name) ? student.name + ' (already picked)' : 'Select ' + student.name"
          :aria-pressed="selectedIds.has(student.id)"
        >
          <div class="card__check" v-if="selectedIds.has(student.id)">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
          </div>
          <div class="card__avatar" :style="{ background: getAvatarColor(student.id) }">
            <span class="card__initials">{{ student.initials }}</span>
          </div>
          <div class="card__info">
            <h3 class="card__name">{{ student.name }}</h3>
            <span class="card__id">{{ student.studentId }}</span>
          </div>
          <div v-if="selectedNames.includes(student.name)" class="card__picked-badge">Picked</div>
          <button
            class="card__remove"
            title="Remove student"
            @click.stop="removeStudent(student.id)"
            :aria-label="'Remove ' + student.name"
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </button>
      </TransitionGroup>

      <Transition name="fade">
        <div v-if="filteredStudents.length === 0" class="empty">
          <div class="empty__icon">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
              <line x1="8" y1="11" x2="14" y2="11" />
            </svg>
          </div>
          <h3 class="empty__title">No students found</h3>
          <p class="empty__text">Try a different search term or import students</p>
          <button class="empty__action" @click="showImportPanel = true">Import Students</button>
        </div>
      </Transition>
    </main>

    <!-- ─── Bottom Bar ─── -->
    <Transition name="up">
      <div v-if="selectedCount > 0" class="bar">
        <div class="bar__inner">
          <div class="bar__left">
            <div class="bar__num">{{ selectedCount }}</div>
            <span class="bar__label">student{{ selectedCount !== 1 ? 's' : '' }} selected</span>
          </div>
          <div class="bar__right">
            <button class="bar__btn bar__btn--ghost" @click="clearSelection">Clear</button>
            <button class="bar__btn bar__btn--solid" @click="confirmSelection">Confirm</button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
/* ═══════════════════════════════════
   Root
   ═══════════════════════════════════ */
.picker {
  min-height: 100vh;
  padding-top: 64px;
  background: #F8FAFC;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
}

/* ═══════════════════════════════════
   Confetti
   ═══════════════════════════════════ */
.confetti-overlay {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 100;
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

/* ═══════════════════════════════════
   Header
   ═══════════════════════════════════ */
.header {
  background: linear-gradient(135deg, #1E40AF 0%, #3B82F6 50%, #2563EB 100%);
  border-bottom: 1px solid rgba(255,255,255,0.1);
  position: relative;
  overflow: hidden;
}

.header::before {
  content: '';
  position: absolute;
  top: -50%;
  right: -10%;
  width: 500px;
  height: 500px;
  background: radial-gradient(circle, rgba(255,255,255,0.12) 0%, transparent 70%);
  pointer-events: none;
}

.header__inner {
  max-width: 80rem;
  margin: 0 auto;
  padding: 2rem 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  position: relative;
  z-index: 1;
}

.header__title {
  font-size: 1.5rem;
  font-weight: 800;
  color: #FFFFFF;
  margin: 0;
  letter-spacing: -0.03em;
  text-shadow: 0 1px 3px rgba(0,0,0,0.15);
}

.header__desc {
  margin: 0.35rem 0 0;
  color: #94A3B8;
  font-size: 0.9rem;
  font-weight: 400;
}

.header__actions {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.header__counter {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem 0.85rem;
  background: rgba(255,255,255,0.15);
  border: 1px solid rgba(255,255,255,0.25);
  border-radius: 999px;
  backdrop-filter: blur(8px);
}

.header__count {
  font-size: 0.9rem;
  font-weight: 700;
  color: #BFDBFE;
  font-variant-numeric: tabular-nums;
  line-height: 1;
}

.header__count-label {
  font-size: 0.8rem;
  font-weight: 500;
  color: #E0E7FF;
}

.header__import-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.5rem 1rem;
  background: rgba(255,255,255,0.15);
  border: 1px solid rgba(255,255,255,0.25);
  border-radius: 10px;
  color: #E0E7FF;
  font-size: 0.85rem;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s;
  backdrop-filter: blur(4px);
}

.header__import-btn:hover,
.header__import-btn.active {
  background: rgba(255,255,255,0.25);
  border-color: rgba(255,255,255,0.4);
  color: #FFFFFF;
}

/* ═══════════════════════════════════
   Import Panel
   ═══════════════════════════════════ */
.import-panel {
  background: white;
  border-bottom: 1px solid #E5E7EB;
  box-shadow: 0 4px 12px rgba(0,0,0,0.06);
}

.import-panel__inner {
  max-width: 80rem;
  margin: 0 auto;
  padding: 1.25rem 2rem;
  display: flex;
  align-items: flex-start;
  gap: 1.5rem;
  flex-wrap: wrap;
}

.import-panel__section {
  flex: 1;
  min-width: 200px;
}

.import-panel__title {
  font-size: 0.85rem;
  font-weight: 700;
  color: #1F2937;
  margin: 0 0 0.5rem;
}

.import-panel__desc {
  font-size: 0.75rem;
  color: #9CA3AF;
  margin: 0 0 0.75rem;
}

.import-panel__divider {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding-top: 1.5rem;
  color: #9CA3AF;
  font-size: 0.8rem;
  font-weight: 500;
}

.import-panel__divider::before,
.import-panel__divider::after {
  content: '';
  width: 1px;
  height: 3rem;
  background: #E5E7EB;
}

.import-panel__file-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 1.2rem;
  background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 0.85rem;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 3px 10px rgba(59,130,246,0.3);
}

.import-panel__file-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 5px 15px rgba(59,130,246,0.4);
}

.import-panel__info {
  display: flex;
  align-items: center;
  gap: 1rem;
  font-size: 0.8rem;
  color: #6B7280;
  font-weight: 500;
  padding-top: 0.5rem;
  width: 100%;
}

.import-panel__clear-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.35rem 0.7rem;
  background: #FEF2F2;
  color: #DC2626;
  border: 1px solid #FECACA;
  border-radius: 8px;
  font-size: 0.75rem;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.15s;
}

.import-panel__clear-btn:hover {
  background: #FEE2E2;
}

/* ── Bulk Form ── */
.bulk-form {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.bulk-form__textarea {
  width: 100%;
  padding: 0.6rem 0.8rem;
  border: 1px solid #E5E7EB;
  border-radius: 10px;
  font-size: 0.8rem;
  font-family: inherit;
  background: #F9FAFB;
  color: #1F2937;
  outline: none;
  transition: all 0.15s;
  resize: vertical;
  min-height: 4rem;
}

.bulk-form__textarea:focus {
  border-color: #3B82F6;
  background: white;
  box-shadow: 0 0 0 3px rgba(59,130,246,0.1);
}

.bulk-form__textarea::placeholder {
  color: #9CA3AF;
}

.bulk-form__actions {
  display: flex;
  gap: 0.4rem;
}

.bulk-form__btn {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.4rem 0.85rem;
  background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.8rem;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.15s;
}

.bulk-form__btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.bulk-form__btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 3px 8px rgba(59,130,246,0.3);
}

/* ── Import Status ── */
.import-status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.85rem;
  border-radius: 8px;
  font-size: 0.8rem;
  font-weight: 500;
  width: 100%;
  animation: status-in 0.25s ease;
}

@keyframes status-in {
  from { opacity: 0; transform: translateY(-4px); }
  to { opacity: 1; transform: translateY(0); }
}

.import-status--success {
  background: #F0FDF4;
  color: #16A34A;
  border: 1px solid #BBF7D0;
}

.import-status--warning {
  background: #FFFBEB;
  color: #D97706;
  border: 1px solid #FDE68A;
}

.import-status--error {
  background: #FEF2F2;
  color: #DC2626;
  border: 1px solid #FECACA;
}

.file-input {
  display: none;
}

/* ═══════════════════════════════════
   Toolbar
   ═══════════════════════════════════ */
.toolbar {
  background: white;
  border-bottom: 1px solid #E5E7EB;
  position: sticky;
  top: 64px;
  z-index: 20;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
}

.toolbar__inner {
  max-width: 80rem;
  margin: 0 auto;
  padding: 0.75rem 2rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

/* ── Dropdown ── */
.toolbar__dropdown {
  position: relative;
  flex-shrink: 0;
}

.toolbar__dropdown-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.5rem 0.85rem;
  border: 1px solid #E5E7EB;
  border-radius: 10px;
  background: white;
  color: #1F2937;
  font-size: 0.85rem;
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.15s;
  box-shadow: 0 1px 2px rgba(0,0,0,0.04);
}

.toolbar__dropdown-btn:hover {
  border-color: #3B82F6;
  box-shadow: 0 2px 4px rgba(59,130,246,0.1);
}

.toolbar__chevron {
  transition: transform 0.2s;
  color: #9CA3AF;
}

.toolbar__chevron.open {
  transform: rotate(180deg);
}

.toolbar__menu {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  min-width: 100%;
  width: max-content;
  background: white;
  border: 1px solid #E5E7EB;
  border-radius: 10px;
  padding: 5px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.1);
  z-index: 30;
}

.toolbar__menu--right {
  left: auto;
  right: 0;
}

.toolbar__menu-item {
  display: block;
  width: 100%;
  text-align: left;
  padding: 0.45rem 0.85rem;
  border: none;
  border-radius: 7px;
  background: transparent;
  color: #4B5563;
  font-size: 0.85rem;
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.12s;
}

.toolbar__menu-item:hover {
  background: #F3F4F6;
}

.toolbar__menu-item.active {
  background: #EFF6FF;
  color: #3B82F6;
  font-weight: 600;
}

/* ── Search ── */
.toolbar__search {
  position: relative;
  flex: 1;
  max-width: 18rem;
}

.toolbar__search-icon {
  position: absolute;
  left: 0.7rem;
  top: 50%;
  transform: translateY(-50%);
  color: #9CA3AF;
  pointer-events: none;
}

.toolbar__input {
  width: 100%;
  padding: 0.5rem 1.8rem 0.5rem 2.15rem;
  border: 1px solid #E5E7EB;
  border-radius: 10px;
  font-size: 0.85rem;
  font-family: inherit;
  background: #F9FAFB;
  color: #1F2937;
  outline: none;
  transition: all 0.15s;
}

.toolbar__input::placeholder {
  color: #9CA3AF;
}

.toolbar__input:focus {
  border-color: #3B82F6;
  background: white;
  box-shadow: 0 0 0 3px rgba(59,130,246,0.1);
}

.toolbar__clear {
  position: absolute;
  right: 0.4rem;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.3rem;
  height: 1.3rem;
  border: none;
  background: #E5E7EB;
  border-radius: 50%;
  color: #6B7280;
  cursor: pointer;
  transition: all 0.12s;
}

.toolbar__clear:hover {
  background: #D1D5DB;
  color: #1F2937;
}

/* ── Actions ── */
.toolbar__actions {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin-left: auto;
  flex-shrink: 0;
}

.toolbar__btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.5rem 0.9rem;
  border: none;
  border-radius: 10px;
  font-size: 0.85rem;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
}

.toolbar__btn:active {
  transform: scale(0.97);
}

.toolbar__btn--primary {
  background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%);
  color: white;
  box-shadow: 0 2px 8px rgba(59,130,246,0.3);
}

.toolbar__btn--primary:hover:not(:disabled) {
  background: linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%);
  box-shadow: 0 4px 12px rgba(59,130,246,0.4);
  transform: translateY(-1px);
}

.toolbar__btn--primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.toolbar__btn--outline {
  background: white;
  color: #3B82F6;
  border: 1px solid #3B82F6;
  border-radius: 0 10px 10px 0;
}

.toolbar__btn--outline:hover:not(:disabled) {
  background: #EFF6FF;
  border-color: #2563EB;
  color: #2563EB;
  z-index: 1;
}

.toolbar__btn--outline:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.toolbar__btn--ghost {
  background: #F3F4F6;
  color: #4B5563;
  border: 1px solid #E5E7EB;
}

.toolbar__btn--ghost:hover:not(:disabled) {
  background: #E5E7EB;
  color: #1F2937;
}

.toolbar__btn--danger {
  background: #FEF2F2;
  color: #DC2626;
  border: 1px solid #FECACA;
}

.toolbar__btn--danger:hover:not(:disabled) {
  background: #FEE2E2;
  border-color: #FCA5A5;
  color: #B91C1C;
}

.toolbar__btn--export {
  background: #F0FDF4;
  color: #16A34A;
  border: 1px solid #BBF7D0;
}

.toolbar__btn--export:hover:not(:disabled) {
  background: #DCFCE7;
  border-color: #86EFAC;
  color: #15803D;
}

.toolbar__btn--export:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.toolbar__btn-spinner {
  width: 0.85rem;
  height: 0.85rem;
  border: 2px solid rgba(22, 163, 74, 0.25);
  border-top-color: #16A34A;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.toolbar__btn--reset {
  background: #FFFBEB;
  color: #D97706;
  border: 1px solid #FDE68A;
}

.toolbar__btn--reset:hover:not(:disabled) {
  background: #FEF3C7;
  border-color: #FCD34D;
  color: #B45309;
}

/* ── Group size ── */
.toolbar__group {
  display: flex;
  align-items: center;
}

.toolbar__group-size {
  position: relative;
}

.toolbar__group-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.5rem 0.6rem;
  border: 1px solid #3B82F6;
  border-right: none;
  border-radius: 10px 0 0 10px;
  background: white;
  color: #1F2937;
  font-size: 0.85rem;
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.12s;
}

.toolbar__group-btn:hover:not(:disabled) {
  background: #F8FAFC;
}

.toolbar__group-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.toolbar__group-val {
  min-width: 1.2rem;
  text-align: center;
  font-weight: 700;
  color: #3B82F6;
  font-variant-numeric: tabular-nums;
  font-size: 0.9rem;
}

/* ═══════════════════════════════════
   Grid
   ═══════════════════════════════════ */
.main {
  max-width: 80rem;
  margin: 0 auto;
  padding: 1.5rem 2rem 7rem;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
  gap: 1rem;
}

@media (min-width: 1024px) {
  .grid { grid-template-columns: repeat(5, 1fr); }
}
@media (max-width: 1023px) and (min-width: 640px) {
  .grid { grid-template-columns: repeat(3, 1fr); }
}
@media (max-width: 639px) {
  .grid { grid-template-columns: repeat(2, 1fr); gap: 0.75rem; }
}

/* ═══════════════════════════════════
   Card
   ═══════════════════════════════════ */
.card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.7rem;
  padding: 1.4rem 0.9rem 0.9rem;
  background: white;
  border: 1px solid #E5E7EB;
  border-radius: 16px;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  outline: none;
  text-align: center;
  min-height: 155px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02);
}

.card:hover {
  border-color: #D1D5DB;
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0,0,0,0.08), 0 4px 8px rgba(0,0,0,0.04);
}

.card:active {
  transform: translateY(-2px) scale(0.98);
}

/* Selected */
.card--sel {
  border-color: #3B82F6;
  background: linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%);
  box-shadow: 0 0 0 1px rgba(59,130,246,0.15), 0 8px 20px rgba(59,130,246,0.12);
  transform: translateY(-4px);
}

.card--sel:hover {
  border-color: #2563EB;
  box-shadow: 0 0 0 2px rgba(59,130,246,0.2), 0 12px 28px rgba(59,130,246,0.15);
}

/* Picked (single) */
.card--pick {
  border-color: #3B82F6 !important;
  background: linear-gradient(135deg, #DBEAFE 0%, #BFDBFE 100%) !important;
  box-shadow: 0 0 0 3px rgba(59,130,246,0.25), 0 12px 28px rgba(59,130,246,0.2) !important;
  transform: translateY(-6px) scale(1.04) !important;
  animation: pop-in 0.5s cubic-bezier(0.34,1.56,0.64,1);
  will-change: transform;
}

@keyframes pop-in {
  0% { transform: translateY(-4px) scale(1); }
  40% { transform: translateY(-8px) scale(1.06); }
  100% { transform: translateY(-6px) scale(1.04); }
}

/* Disabled (already picked / persisted) */
.card--disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: #F9FAFB;
  border-color: #E5E7EB;
  filter: grayscale(0.6);
  pointer-events: auto;
}

.card--disabled:hover {
  transform: none;
  border-color: #E5E7EB;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
}

.card--disabled:active {
  transform: none;
}

.card--disabled .card__name {
  color: #9CA3AF;
}

.card--disabled .card__id {
  color: #D1D5DB;
}

.card--disabled .card__avatar {
  filter: saturate(0.3);
  opacity: 0.6;
}

.card--disabled .card__initials {
  opacity: 0.7;
}

/* Picked badge on disabled cards */
.card__picked-badge {
  position: absolute;
  top: 0.5rem;
  left: 0.5rem;
  font-size: 0.6rem;
  font-weight: 700;
  color: #9CA3AF;
  background: #F3F4F6;
  padding: 0.15rem 0.45rem;
  border-radius: 6px;
  letter-spacing: 0.02em;
  z-index: 2;
}

/* ── Remove button ── */
.card__remove {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  width: 1.4rem;
  height: 1.4rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #FEF2F2;
  border: 1px solid #FECACA;
  border-radius: 50%;
  color: #DC2626;
  cursor: pointer;
  opacity: 0;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 5;
  padding: 0;
}

.card:hover .card__remove {
  opacity: 1;
}

.card--disabled .card__remove {
  opacity: 0 !important;
  pointer-events: none;
}

.card__remove:hover {
  background: #FEE2E2;
  border-color: #EF4444;
  transform: scale(1.15);
}

.card__remove:active {
  transform: scale(0.95);
}

.card--sel .card__remove {
  right: 2.3rem;
}



/* Picked (group) */
.card--group {
  border-color: #3B82F6 !important;
  background: linear-gradient(135deg, #DBEAFE 0%, #BFDBFE 100%) !important;
  box-shadow: 0 0 0 3px rgba(59,130,246,0.25), 0 12px 28px rgba(59,130,246,0.2) !important;
  transform: translateY(-6px) scale(1.04) !important;
  animation: group-pop 0.4s cubic-bezier(0.34,1.56,0.64,1);
  will-change: transform;
}

@keyframes group-pop {
  0% { transform: translateY(-4px) scale(1); opacity: 0.7; }
  50% { transform: translateY(-8px) scale(1.06); opacity: 1; }
  100% { transform: translateY(-6px) scale(1.04); opacity: 1; }
}

/* Check icon */
.card__check {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  width: 1.4rem;
  height: 1.4rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #22C55E 0%, #16A34A 100%);
  border-radius: 50%;
  animation: check-pop 0.3s cubic-bezier(0.34,1.56,0.64,1);
  z-index: 2;
  box-shadow: 0 3px 8px rgba(34,197,94,0.35);
}

@keyframes check-pop {
  0% { transform: scale(0); opacity: 0; }
  50% { transform: scale(1.25); }
  100% { transform: scale(1); opacity: 1; }
}

/* Avatar */
.card__avatar {
  width: 3rem;
  height: 3rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(0,0,0,0.12);
}

.card--sel .card__avatar,
.card--pick .card__avatar,
.card--group .card__avatar {
  transform: scale(1.1);
  box-shadow: 0 6px 16px rgba(0,0,0,0.18);
}

.card__initials {
  font-size: 0.85rem;
  font-weight: 700;
  color: white;
  text-shadow: 0 1px 2px rgba(0,0,0,0.15);
}

.card__info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.2rem;
  min-width: 0;
  width: 100%;
}

.card__name {
  margin: 0;
  font-size: 0.85rem;
  font-weight: 600;
  color: #1F2937;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card--sel .card__name,
.card--pick .card__name,
.card--group .card__name {
  color: #1D4ED8;
}

.card__id {
  font-size: 0.7rem;
  font-weight: 500;
  color: #9CA3AF;
  font-variant-numeric: tabular-nums;
}

/* ═══════════════════════════════════
   Empty
   ═══════════════════════════════════ */
.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 5rem 2rem;
  text-align: center;
}

.empty__icon {
  width: 3.5rem;
  height: 3.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  border-radius: 14px;
  border: 1px solid #E5E7EB;
  box-shadow: 0 4px 12px rgba(0,0,0,0.04);
}

.empty__title {
  font-size: 1rem;
  font-weight: 600;
  color: #4B5563;
  margin: 0;
}

.empty__text {
  font-size: 0.85rem;
  color: #9CA3AF;
  margin: 0;
}

.empty__action {
  padding: 0.5rem 1.2rem;
  background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 0.85rem;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 3px 10px rgba(59,130,246,0.3);
}

.empty__action:hover {
  transform: translateY(-1px);
  box-shadow: 0 5px 15px rgba(59,130,246,0.4);
}

/* ═══════════════════════════════════
   Bottom Bar
   ═══════════════════════════════════ */
.bar {
  position: fixed;
  bottom: 1.5rem;
  left: 50%;
  transform: translateX(-50%);
  z-index: 50;
  max-width: 36rem;
  width: calc(100% - 2rem);
}

.bar__inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.85rem 1.25rem;
  background: white;
  border: 1px solid #E5E7EB;
  border-radius: 16px;
  box-shadow: 0 20px 50px rgba(0,0,0,0.12), 0 8px 16px rgba(0,0,0,0.06);
  animation: bar-in 0.35s cubic-bezier(0.34,1.56,0.64,1);
}

@keyframes bar-in {
  0% { opacity: 0; transform: scale(0.95) translateY(12px); }
  100% { opacity: 1; transform: scale(1) translateY(0); }
}

.bar__left {
  display: flex;
  align-items: center;
  gap: 0.7rem;
}

.bar__num {
  width: 2.2rem;
  height: 2.2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%);
  color: white;
  font-size: 0.9rem;
  font-weight: 700;
  border-radius: 10px;
  flex-shrink: 0;
  box-shadow: 0 3px 8px rgba(59,130,246,0.3);
}

.bar__label {
  font-size: 0.9rem;
  font-weight: 600;
  color: #1F2937;
}

.bar__right {
  display: flex;
  gap: 0.45rem;
  flex-shrink: 0;
}

.bar__btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.5rem 0.95rem;
  border: none;
  border-radius: 10px;
  font-size: 0.85rem;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
}

.bar__btn:active {
  transform: scale(0.97);
}

.bar__btn--ghost {
  background: #F3F4F6;
  color: #4B5563;
  border: 1px solid #E5E7EB;
}

.bar__btn--ghost:hover {
  background: #E5E7EB;
  color: #1F2937;
}

.bar__btn--warn {
  background: #FEF2F2;
  color: #DC2626;
  border: 1px solid #FECACA;
}

.bar__btn--warn:hover {
  background: #FEE2E2;
  border-color: #FCA5A5;
}

.bar__btn--solid {
  background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%);
  color: white;
  box-shadow: 0 3px 10px rgba(59,130,246,0.3);
}

.bar__btn--solid:hover {
  background: linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%);
  box-shadow: 0 4px 14px rgba(59,130,246,0.4);
}

/* ═══════════════════════════════════
   Transitions
   ═══════════════════════════════════ */
.grid-move {
  transition: transform 0.3s;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.drop-enter-active,
.drop-leave-active {
  transition: all 0.12s;
}
.drop-enter-from,
.drop-leave-to {
  opacity: 0;
  transform: translateY(-3px);
}

.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}
.slide-enter-from,
.slide-leave-to {
  max-height: 0;
  opacity: 0;
  padding-top: 0;
  padding-bottom: 0;
}
.slide-enter-to,
.slide-leave-from {
  max-height: 500px;
  opacity: 1;
}

.up-enter-active {
  transition: all 0.3s cubic-bezier(0.34,1.56,0.64,1);
}
.up-leave-active {
  transition: all 0.15s;
}
.up-enter-from {
  opacity: 0;
  transform: translateX(-50%) translateY(16px);
}
.up-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(8px);
}

/* ═══════════════════════════════════
   Responsive
   ═══════════════════════════════════ */
@media (max-width: 639px) {
  .header__inner {
    padding: 1.5rem 1.25rem;
    flex-wrap: wrap;
  }
  .header__title {
    font-size: 1.25rem;
  }
  .header__desc {
    font-size: 0.85rem;
  }

  .import-panel__inner {
    padding: 1rem 1.25rem;
    flex-direction: column;
  }
  .import-panel__divider {
    padding-top: 0;
    width: 100%;
  }
  .import-panel__divider::before,
  .import-panel__divider::after {
    flex: 1;
    height: 1px;
    width: auto;
  }

  .toolbar__inner {
    padding: 0.65rem 1.25rem;
    flex-wrap: wrap;
    gap: 0.6rem;
  }
  .toolbar__search {
    max-width: 100%;
    order: 1;
    flex-basis: 100%;
  }
  .toolbar__actions {
    margin-left: 0;
    width: 100%;
    justify-content: flex-end;
  }

  .main {
    padding: 1rem 1.25rem 6rem;
  }

  .card {
    min-height: 140px;
    padding: 1.2rem 0.7rem 0.8rem;
    border-radius: 14px;
  }
  .card__avatar {
    width: 2.6rem;
    height: 2.6rem;
  }
  .card__initials {
    font-size: 0.78rem;
  }
  .card__name {
    font-size: 0.8rem;
  }

  .bar {
    bottom: 1rem;
    width: calc(100% - 1.5rem);
  }
  .bar__inner {
    flex-direction: column;
    gap: 0.7rem;
    padding: 0.75rem 1rem;
  }
  .bar__right {
    width: 100%;
  }
  .bar__btn {
    flex: 1;
    justify-content: center;
  }
}

@media (max-width: 380px) {
  .grid {
    gap: 0.6rem;
  }
  .card {
    min-height: 125px;
    padding: 1rem 0.6rem 0.7rem;
  }
  .card__avatar {
    width: 2.3rem;
    height: 2.3rem;
  }
  .card__initials {
    font-size: 0.72rem;
  }
  .card__name {
    font-size: 0.75rem;
  }
}
</style>