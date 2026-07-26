<script setup lang="ts">
import { ref, computed, onUnmounted, onMounted } from 'vue'
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
const fileInputRef = ref<HTMLInputElement | null>(null)
const isImporting = ref(false)
const importFileName = ref('')


let toastIdCounter = 0
function addToast(message: string, type: Toast['type'] = 'info') {
  const id = ++toastIdCounter
  toasts.value.push({ id, message, type })
  setTimeout(() => {
    toasts.value = toasts.value.filter(t => t.id !== id)
  }, 3500)
}

let flashInterval: ReturnType<typeof setInterval> | null = null

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
  if (flashInterval) {
    clearInterval(flashInterval)
  }
})

const isEmpty = computed(() => students.value.length === 0)

const pickedCount = computed(() => getPickedCount())

const remainingCount = computed(() => {
  const pickedNames = getPickedStudentNames()
  return students.value.filter(s => !pickedNames.has(s.name)).length
})

const allPicked = computed(() => remainingCount.value === 0 && students.value.length > 0)

const availableCount = computed(() => {
  const pickedNames = getPickedStudentNames()
  return Math.min(pickCount.value, remainingCount.value)
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
  saveStudentPool([])
  addToast('Pool cleared', 'info')
}

function removeStudent(id: number) {
  students.value = students.value.filter(s => s.id !== id)
  selectedStudents.value = selectedStudents.value.filter(s => s.id !== id)
  if (selectedStudents.value.length === 0) {
    showResults.value = false
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
  addToast(
    soundEnabled.value ? 'Sound effects on' : 'Sound effects off',
    'info',
  )
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
      for (const cell of row) {
        const cellStr = String(cell ?? '').trim()
        if (cellStr && /^[a-zA-ZÀ-ÿ\s'-]+$/.test(cellStr) && cellStr.length > 0) {
          names.push(cellStr)
        }
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
        continue // skip duplicates already in the pool
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
    target.value = '' // reset file input
  }
}

async function pickMultiple() {
  if (isPicking.value || isEmpty.value) return

  const pickedNames = getPickedStudentNames()
  const availableStudents = students.value.filter(s => !pickedNames.has(s.name))

  if (availableStudents.length === 0) {
    addToast('All students have been picked! Reset history to pick again.', 'warning')
    return
  }

  const count = Math.min(pickCount.value, availableStudents.length)
  if (count < 1) return

  isPicking.value = true
  showResults.value = false
  selectedStudents.value = []
  highlightIds.value = new Set()

  // Play drum roll if sound is on
  if (soundEnabled.value) {
    playSynthSound('Drum Roll').catch(() => {})
  }

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
      const shuffled = [...availableStudents].sort(() => Math.random() - 0.5)
      const flashSet = new Set(shuffled.slice(0, count).map(s => s.id))
      highlightIds.value = flashSet
    }, flashIntervalMs)
  })

  const shuffled = [...availableStudents].sort(() => Math.random() - 0.5)
  const finalPicks = shuffled.slice(0, count)

  selectedStudents.value = finalPicks
  highlightIds.value = new Set(finalPicks.map(s => s.id))
  showResults.value = true

  // Save picked names to localStorage
  const pickedNamesToSave = finalPicks.map(s => s.name)
  savePickedStudentNames(pickedNamesToSave)

  // Update previouslyPicked flag on all students
  const updatedPickedNames = getPickedStudentNames()
  students.value = students.value.map(s => ({
    ...s,
    previouslyPicked: updatedPickedNames.has(s.name),
  }))

  pickLog.value.unshift({
    students: pickedNamesToSave,
    time: new Date(),
  })

  isPicking.value = false

  // Play celebration sound if sound is on
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
              :style="{ '--chip-color': student.color }"
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
            :disabled="isPicking || isEmpty || allPicked"
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
              Pick {{ Math.min(pickCount, remainingCount) }} student{{ Math.min(pickCount, remainingCount) !== 1 ? 's' : '' }}
            </span>
          </button>
        </div>
      </section>

      <Transition name="slide-up">
        <section v-if="showResults && selectedStudents.length > 0" class="card card--result">
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
              <button class="btn btn--ghost btn--sm" @click="pickMultiple" :disabled="isPicking || isEmpty || allPicked">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="1 4 1 10 7 10" />
                  <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                </svg>
                Pick again
              </button>
            </div>
          </div>

          <!-- Confetti burst -->
          <div class="confetti-burst">
            <div v-for="i in 24" :key="i" class="confetti-particle" :style="{ '--i': i, '--confetti-color': COLORS[i % COLORS.length] }"></div>
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

          <div class="results-footer">
            <span class="results-footer__text">
              Round #{{ pickLog.length }} · {{ remainingCount }} student{{ remainingCount !== 1 ? 's' : '' }} remaining in pool
            </span>
          </div>
        </section>
      </Transition>

      <section v-if="pickLog.length > 0" class="card card--history">
        <div class="card-heading">
          <div class="card-heading__left">
            <span class="step-badge step-badge--history">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="margin-right:6px;vertical-align:middle;"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              History
            </span>
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
/* ── Page ── */
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

/* ── Toolbar ── */
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

/* ── Stats Bar ── */
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

/* ── Cards ── */
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

/* ── Input Area ── */
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

/* ── Buttons ── */
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
  background: linear-gradient(135deg, #818cf8, #6366f1);
  transform: translateY(-1px);
  box-shadow: 0 4px 14px rgba(99, 102, 241, 0.3);
}

.btn--primary:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  transform: none;
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

.btn--ghost-outline {
  background: transparent;
  color: #6366f1;
  border: 1px solid #c7d2fe;
}

.btn--ghost-outline:hover:not(:disabled) {
  background: #eef2ff;
  border-color: #6366f1;
}

.btn--ghost-outline:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn--sm {
  padding: 0.4rem 0.75rem;
  font-size: 0.75rem;
}

.btn--xs {
  padding: 0.3rem 0.6rem;
  font-size: 0.675rem;
  border-radius: 0.5rem;
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
  gap: 0.5rem;
  margin-top: 1rem;
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
  border-color: var(--chip-color);
  background: color-mix(in srgb, var(--chip-color) 10%, white);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--chip-color) 18%, transparent);
  transform: scale(1.05) !important;
}

.chip--picked {
  border-color: var(--chip-color);
  background: color-mix(in srgb, var(--chip-color) 14%, white);
  border-width: 1.5px;
}

.chip--used {
  opacity: 0.55;
  border-color: #e2e8f0;
  background: #f8fafc;
}

.chip--used .chip__name {
  text-decoration: line-through;
  text-decoration-color: #94a3b8;
}

.chip__avatar {
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 0.6rem;
  font-weight: 700;
  flex-shrink: 0;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
}

.chip__name {
  font-size: 0.8rem;
  font-weight: 500;
  color: #334155;
}

.chip__used-badge {
  font-size: 0.55rem;
  font-weight: 700;
  color: #94a3b8;
  background: #f1f5f9;
  border-radius: 50%;
  width: 1rem;
  height: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
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
  padding: 1.75rem 1rem 0.75rem;
  gap: 0.35rem;
}

.empty__icon-wrap {
  width: 64px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8fafc;
  border-radius: 50%;
  border: 1px dashed #e2e8f0;
}

.empty__text {
  font-size: 0.875rem;
  font-weight: 600;
  color: #94a3b8;
  margin: 0.75rem 0 0;
}

.empty__hint {
  font-size: 0.75rem;
  color: #b0bccf;
  margin: 0;
}

.empty__link {
  background: none;
  border: none;
  padding: 0;
  color: #6366f1;
  font-weight: 600;
  cursor: pointer;
  text-decoration: underline;
  font-family: inherit;
  font-size: inherit;
}

.empty__link:hover {
  color: #4f46e5;
}

/* ── All Picked Notice ── */
.all-picked-notice {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.75rem 1rem;
  background: #fefce8;
  border: 1px solid #fde68a;
  border-radius: 0.75rem;
  color: #92400e;
  font-size: 0.85rem;
  font-weight: 500;
  margin-bottom: 1rem;
}

/* ── Picker Controls ── */
.picker-controls {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  flex-wrap: wrap;
}

.counter {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.5rem;
  flex: 1;
  min-width: 8rem;
}

.counter__label {
  font-size: 0.75rem;
  font-weight: 600;
  color: #64748b;
  margin: 0;
  letter-spacing: 0.01em;
}

.counter__group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 0.75rem;
  padding: 0.4rem;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02);
}

.counter__btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.75rem;
  height: 1.75rem;
  border: none;
  border-radius: 0.5rem;
  background: white;
  color: #64748b;
  cursor: pointer;
  transition: all 0.15s;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.counter__btn:not(:disabled):hover {
  background: #6366f1;
  color: white;
  box-shadow: 0 2px 8px rgba(99, 102, 241, 0.25);
}

.counter__btn:disabled {
  opacity: 0.2;
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
  font-size: 1.75rem;
  font-weight: 700;
  color: #0f172a;
  line-height: 1;
  font-variant-numeric: tabular-nums;
}

.counter__hint {
  font-size: 0.7rem;
  color: #94a3b8;
  font-weight: 500;
}

.counter__hint--warn {
  color: #d97706;
}

/* ── Pick Button ── */
.pick-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #6366f1, #4f46e5);
  color: white;
  border: none;
  border-radius: 0.875rem;
  padding: 1rem 2.25rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  flex: 1;
  min-width: 12rem;
  font-family: inherit;
  box-shadow: 0 4px 16px rgba(99, 102, 241, 0.25);
  position: relative;
  overflow: hidden;
}

.pick-btn:not(:disabled):hover {
  background: linear-gradient(135deg, #818cf8, #6366f1);
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(99, 102, 241, 0.35);
}

.pick-btn:not(:disabled):active {
  transform: translateY(0);
}

.pick-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.pick-btn--loading {
  background: linear-gradient(135deg, #818cf8, #6366f1);
}

.pick-btn__inner {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.spinner {
  width: 1.1rem;
  height: 1.1rem;
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

/* ── Confetti Burst ── */
.confetti-burst {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
}

.confetti-particle {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 6px;
  height: 6px;
  border-radius: 2px;
  background: var(--confetti-color);
  animation: confetti-fall 1.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) both;
  animation-delay: calc(var(--i) * 0.04s);
  opacity: 0;
}

@keyframes confetti-fall {
  0% {
    opacity: 1;
    transform: translate(-50%, -50%) translate(calc(cos(var(--i) * 15deg) * 0px), calc(sin(var(--i) * 15deg) * 0px)) rotate(0deg) scale(1);
  }
  20% {
    opacity: 1;
    transform: translate(-50%, -50%) translate(calc(cos(var(--i) * 15deg) * 80px), calc(sin(var(--i) * 15deg) * 60px - 40px)) rotate(180deg) scale(1.2);
  }
  100% {
    opacity: 0;
    transform: translate(-50%, -50%) translate(calc(cos(var(--i) * 15deg) * 160px), calc(sin(var(--i) * 15deg) * 120px + 200px)) rotate(720deg) scale(0.3);
  }
}

/* ── Results Grid ── */
.results-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  position: relative;
  z-index: 1;
}

.result-tile {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.6rem 0.85rem 0.6rem 0.6rem;
  border-radius: 0.75rem;
  background: #fafafa;
  border: 1px solid #e2e8f0;
  position: relative;
  animation: tile-in 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}

.result-tile:nth-child(1) { animation-delay: 0s; }
.result-tile:nth-child(2) { animation-delay: 0.06s; }
.result-tile:nth-child(3) { animation-delay: 0.12s; }
.result-tile:nth-child(4) { animation-delay: 0.18s; }
.result-tile:nth-child(5) { animation-delay: 0.24s; }
.result-tile:nth-child(6) { animation-delay: 0.3s; }
.result-tile:nth-child(7) { animation-delay: 0.36s; }
.result-tile:nth-child(8) { animation-delay: 0.42s; }
.result-tile:nth-child(9) { animation-delay: 0.48s; }
.result-tile:nth-child(10) { animation-delay: 0.54s; }
.result-tile:nth-child(11) { animation-delay: 0.6s; }
.result-tile:nth-child(12) { animation-delay: 0.66s; }

.result-tile:hover {
  border-color: var(--tile-color);
  background: color-mix(in srgb, var(--tile-color) 5%, white);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);
}

@keyframes tile-in {
  0% { opacity: 0; transform: scale(0.7) translateY(10px); }
  100% { opacity: 1; transform: scale(1) translateY(0); }
}

.result-tile__check {
  position: absolute;
  top: -6px;
  right: -6px;
  width: 1.25rem;
  height: 1.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #22c55e;
  color: white;
  border-radius: 50%;
  box-shadow: 0 3px 10px rgba(34, 197, 94, 0.4);
  animation: pop-in 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) 0.3s both;
}

@keyframes pop-in {
  0% { transform: scale(0); }
  60% { transform: scale(1.25); }
  100% { transform: scale(1); }
}

.result-tile__avatar {
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 0.65rem;
  font-weight: 700;
  flex-shrink: 0;
  box-shadow: 0 3px 10px color-mix(in srgb, var(--tile-color) 30%, transparent);
}

.result-tile__name {
  font-size: 0.875rem;
  font-weight: 600;
  color: #334155;
}

.results-footer {
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid #f1f5f9;
  position: relative;
  z-index: 1;
}

.results-footer__text {
  font-size: 0.75rem;
  color: #94a3b8;
  font-weight: 500;
}

/* ── History ── */
.history-total {
  margin-left: auto;
  font-size: 0.75rem;
  font-weight: 600;
  color: #64748b;
  background: #f1f5f9;
  padding: 0.2rem 0.65rem;
  border-radius: 999px;
  white-space: nowrap;
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
  padding: 0.6rem 0.75rem;
  border-radius: 0.625rem;
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
  color: #6366f1;
  background: #eef2ff;
  padding: 0.15rem 0.5rem;
  border-radius: 0.375rem;
}

.history-row__time {
  font-size: 0.7rem;
  color: #94a3b8;
  font-weight: 500;
}

.history-footer {
  margin-top: 0.5rem;
  padding-top: 0.5rem;
  border-top: 1px solid #f1f5f9;
  display: flex;
  justify-content: center;
}

/* ── Toast Notifications ── */
.toast-container {
  position: fixed;
  bottom: 1.5rem;
  right: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  z-index: 1000;
  pointer-events: none;
}

.toast {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.65rem 1rem;
  border-radius: 0.75rem;
  font-size: 0.8rem;
  font-weight: 500;
  color: white;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  pointer-events: auto;
  max-width: 22rem;
}

.toast--success {
  background: #16a34a;
}

.toast--info {
  background: #6366f1;
}

.toast--warning {
  background: #d97706;
}

.toast--error {
  background: #dc2626;
}

.toast-enter-active {
  transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.toast-leave-active {
  transition: all 0.25s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(40px) scale(0.9);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(40px) scale(0.9);
}

/* ── Transitions ── */
.chip-enter-active,
.chip-leave-active {
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.chip-enter-from {
  opacity: 0;
  transform: scale(0.7);
}

.chip-leave-to {
  opacity: 0;
  transform: scale(0.7);
}

.chip-move {
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.slide-up-enter-active {
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.slide-up-leave-active {
  transition: all 0.25s ease;
}

.slide-up-enter-from {
  opacity: 0;
  transform: translateY(16px) scale(0.97);
}

.slide-up-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.history-item-enter-active {
  transition: all 0.35s ease;
}

.history-item-leave-active {
  transition: all 0.25s ease;
}

.history-item-enter-from {
  opacity: 0;
  transform: translateX(-10px);
}

.history-item-leave-to {
  opacity: 0;
  transform: translateX(10px);
}

/* ── Responsive ── */
@media (max-width: 768px) {
  .container {
    padding: 1.25rem 1rem 2rem;
    gap: 1rem;
  }

  .card {
    padding: 1.1rem 1.25rem;
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
    gap: 1.1rem;
  }

  .counter {
    align-items: center;
  }

  .pick-btn {
    padding: 0.85rem 1.5rem;
  }

  .card-heading__actions {
    width: 100%;
    justify-content: flex-end;
  }

  .step-badge {
    font-size: 0.6rem;
    padding: 0.2rem 0.5rem;
  }

  .stats-bar {
    flex-wrap: wrap;
    justify-content: center;
  }

  .stats-bar__progress {
    width: 100%;
    margin-left: 0;
  }

  .toolbar {
    justify-content: center;
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

  .btn--ghost {
    justify-content: center;
  }

  .results-grid {
    gap: 0.5rem;
  }

  .result-tile {
    padding: 0.5rem 0.7rem 0.5rem 0.5rem;
  }

  .toast-container {
    left: 1rem;
    right: 1rem;
    bottom: 1rem;
  }

  .toast {
    max-width: 100%;
  }
}
</style>
