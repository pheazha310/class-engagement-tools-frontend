<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { RouterLink } from 'vue-router'
import * as XLSX from 'xlsx'

interface Student {
  id: number
  name: string
  initials: string
  photo: string | null
}

import Mary from '@/assets/images/Mary.jpg'
import Me from '@/assets/images/Me.jpg'
import Nita from '@/assets/images/Nita.jpg'
import Oun from '@/assets/images/oun.jpg'
import San from '@/assets/images/San.jpg'
import Sophea from '@/assets/images/Sophea.jpg'
import Two from '@/assets/images/Two.webp'
import Vanna from '@/assets/images/Vanna.jpg'

const AVATAR_COLORS = [
  '#8B5CF6', '#EC4899', '#22C55E', '#F59E0B',
  '#6366F1', '#14B8A6', '#F97316', '#06B6D4',
  '#10B981', '#D946EF', '#0EA5E9', '#84CC16',
]

const DEFAULT_PHOTOS = [
  Mary, Me, Nita, Oun, San, Sophea, Two, Vanna,
]

const students = ref<Student[]>(
  [
    'Alice Johnson', 'Bob Smith', 'Carol Williams', 'David Brown',
    'Emma Davis', 'Frank Miller', 'Grace Wilson', 'Henry Taylor',
  ].map((name, i) => ({
    id: i + 1,
    name,
    initials: name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2),
    photo: DEFAULT_PHOTOS[i] ?? null,
  }))
)

const selectedIds = ref<Set<number>>(new Set())
const searchQuery = ref('')
const isPicking = ref(false)
const isPickingGroup = ref(false)
const pickedId = ref<number | null>(null)
const pickedGroupIds = ref<Set<number>>(new Set())
const lastPickedIds = ref<Set<number>>(new Set())
const groupSize = ref(2)
const fileInputRef = ref<HTMLInputElement | null>(null)
const addPhotoInputRef = ref<HTMLInputElement | null>(null)
const pickedHistory = ref<Set<number>>(new Set())
const pendingAddStudentId = ref<number | null>(null)
let pickTimeout: ReturnType<typeof setTimeout> | null = null
let groupTimeouts: ReturnType<typeof setTimeout>[] = []
let pickSoundContext: AudioContext | null = null
let pickSoundOscillator: OscillatorNode | null = null
let pickSoundGain: GainNode | null = null

interface Toast {
  id: number
  message: string
  type: 'success' | 'info' | 'warning'
}
const toasts = ref<Toast[]>([])
let toastCounter = 0

function addToast(message: string, type: Toast['type'] = 'info') {
  const id = ++toastCounter
  toasts.value.push({ id, message, type })
  setTimeout(() => {
    toasts.value = toasts.value.filter(t => t.id !== id)
  }, 3000)
}

interface ConfettiParticle {
  id: number
  x: number
  color: string
  delay: number
  rotation: number
}
const confettiParticles = ref<ConfettiParticle[]>([])
let confettiCounter = 0

function burstConfetti(count = 24) {
  const colors = ['#22C55E', '#10B981', '#8B5CF6', '#EC4899', '#F59E0B', '#06B6D4', '#6366F1']
  const particles: ConfettiParticle[] = []
  for (let i = 0; i < count; i++) {
    particles.push({
      id: ++confettiCounter,
      x: 10 + Math.random() * 80,
      color: colors[i % colors.length]!,
      delay: Math.random() * 0.4,
      rotation: Math.random() * 360,
    })
  }
  confettiParticles.value = particles
  setTimeout(() => { confettiParticles.value = [] }, 2500)
}

const newStudentIds = ref<Set<number>>(new Set())

function markStudentsAsNew(ids: number[]) {
  ids.forEach(id => newStudentIds.value.add(id))
  setTimeout(() => {
    ids.forEach(id => newStudentIds.value.delete(id))
  }, 1200)
}

const filteredStudents = computed(() => {
  let list = students.value
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter(s => s.name.toLowerCase().includes(q))
  }
  return list
})

const selectedCount = computed(() => selectedIds.value.size)
const pickedCount = computed(() => pickedHistory.value.size)
const groupSizeOpen = ref(false)

const maxGroupSize = computed(() => Math.min(filteredStudents.value.length, 10))
const groupSizeOptions = computed(() => {
  const max = maxGroupSize.value
  const options: number[] = []
  for (let i = 2; i <= max; i++) {
    options.push(i)
  }
  return options
})

function getAvatarColor(id: number): string {
  return AVATAR_COLORS[(id - 1) % AVATAR_COLORS.length] ?? '#8B5CF6'
}

function toggleCard(id: number) {
  const set = new Set(selectedIds.value)
  if (set.has(id)) {
    set.delete(id)
  } else {
    set.add(id)
  }
  selectedIds.value = set
}

function deleteStudent(id: number) {
  const student = students.value.find(s => s.id === id)
  students.value = students.value.filter(s => s.id !== id)
  selectedIds.value = new Set([...selectedIds.value].filter(sid => sid !== id))
  pickedGroupIds.value = new Set([...pickedGroupIds.value].filter(pid => pid !== id))
  lastPickedIds.value = new Set([...lastPickedIds.value].filter(lid => lid !== id))
  if (pickedId.value === id) pickedId.value = null
  if (student) addToast(`Removed ${student.name}`, 'info')
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

const STORAGE_KEY = 'image-picker-picked-history'

function loadPickedHistory() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      pickedHistory.value = new Set(parsed)
    }
  } catch {
    // ignore parse errors
  }
}

function savePickedHistory() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...pickedHistory.value]))
}

function addToPickedHistory(ids: number[]) {
  ids.forEach(id => pickedHistory.value.add(id))
  savePickedHistory()
}

function resetPickedHistory() {
  pickedHistory.value = new Set()
  savePickedHistory()
  addToast('Pick history reset — all students can be picked again', 'info')
}

function isPickedBefore(id: number): boolean {
  return pickedHistory.value.has(id)
}

watch(pickedHistory, () => {
  savePickedHistory()
}, { deep: true })

function stopPickSound() {
  if (!pickSoundContext || !pickSoundGain || !pickSoundOscillator) return
  const now = pickSoundContext.currentTime
  pickSoundGain.gain.cancelScheduledValues(now)
  pickSoundGain.gain.setValueAtTime(Math.max(pickSoundGain.gain.value, 0.0001), now)
  pickSoundGain.gain.exponentialRampToValueAtTime(0.00001, now + 0.06)
  pickSoundOscillator.stop(now + 0.08)
  pickSoundContext.close().catch(() => {})
  pickSoundContext = null
  pickSoundOscillator = null
  pickSoundGain = null
}

function startPickSound(frequency: number) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!window.AudioContext && !(window as any).webkitAudioContext) return
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
  pickSoundContext = ctx
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  pickSoundOscillator = osc
  pickSoundGain = gain

  osc.type = 'triangle'
  osc.frequency.value = frequency
  gain.gain.setValueAtTime(0.08, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.08)

  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.start()
}

function playEndSound(frequency: number, duration = 180) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const AudioContext = window.AudioContext || (window as any).webkitAudioContext
  if (!AudioContext) return

  const ctx = new AudioContext()
  const tone = ctx.createOscillator()
  const bell = ctx.createOscillator()
  const toneGain = ctx.createGain()
  const bellGain = ctx.createGain()
  const master = ctx.createGain()

  tone.type = 'sine'
  tone.frequency.value = frequency * 0.9
  tone.frequency.exponentialRampToValueAtTime(frequency * 1.2, ctx.currentTime + 0.08)

  bell.type = 'triangle'
  bell.frequency.value = frequency * 1.6
  bellGain.gain.setValueAtTime(0.0005, ctx.currentTime)
  bellGain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.12)

  toneGain.gain.setValueAtTime(0.001, ctx.currentTime)
  toneGain.gain.linearRampToValueAtTime(0.14, ctx.currentTime + 0.03)
  toneGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration / 1000)

  master.gain.setValueAtTime(0.5, ctx.currentTime)

  tone.connect(toneGain)
  bell.connect(bellGain)
  toneGain.connect(master)
  bellGain.connect(master)
  master.connect(ctx.destination)

  tone.start()
  bell.start()
  bell.stop(ctx.currentTime + 0.12)
  tone.stop(ctx.currentTime + duration / 1000 + 0.05)

  tone.onended = () => {
    ctx.close().catch(() => {})
  }
}

function playTickSound() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext
    if (!AudioContext) return
    const ctx = new AudioContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.value = 600 + Math.random() * 300
    osc.type = 'sine'
    gain.gain.setValueAtTime(0.04, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.03)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.03)
    setTimeout(() => ctx.close().catch(() => {}), 100)
  } catch {
    // ignore
  }
}

async function pickRandom() {
  if (isPicking.value || filteredStudents.value.length === 0) return
  isPicking.value = true
  pickedId.value = null
  lastPickedIds.value = new Set()
  pickedGroupIds.value = new Set()
  selectedIds.value = new Set()

  const flashDuration = 900
  const start = Date.now()
  startPickSound(720)

  await new Promise<void>((resolve) => {
    const interval = setInterval(() => {
      const elapsed = Date.now() - start
      if (elapsed >= flashDuration) {
        clearInterval(interval)
        resolve()
        return
      }
      const list = filteredStudents.value
      const randomIdx = Math.floor(Math.random() * list.length)
      const student = list[randomIdx]!
      pickedId.value = student.id
      if (Math.random() > 0.6) playTickSound()
    }, 60)
  })

  stopPickSound()
  const finalStudent = filteredStudents.value[Math.floor(Math.random() * filteredStudents.value.length)]!
  pickedId.value = finalStudent.id
  const set = new Set(selectedIds.value)
  set.add(finalStudent.id)
  selectedIds.value = set

  addToPickedHistory([finalStudent.id])

  isPicking.value = false
  if (pickTimeout) clearTimeout(pickTimeout)
  pickTimeout = setTimeout(() => { pickedId.value = null }, 2000)
  lastPickedIds.value = new Set([finalStudent.id])
  playEndSound(1080, 190)
  burstConfetti(24)
  addToast(`Picked: ${finalStudent.name}`, 'success')
}

async function pickGroup() {
  if (isPickingGroup.value || filteredStudents.value.length < groupSize.value) return

  groupTimeouts.forEach(t => clearTimeout(t))
  groupTimeouts = []

  isPickingGroup.value = true
  pickedGroupIds.value = new Set()
  lastPickedIds.value = new Set()
  selectedIds.value = new Set()

  const shuffled = shuffleArray(filteredStudents.value)
  const picked = shuffled.slice(0, groupSize.value)

  const flashDuration = 600
  const start = Date.now()
  startPickSound(560)

  await new Promise<void>((resolve) => {
    const interval = setInterval(() => {
      const elapsed = Date.now() - start
      if (elapsed >= flashDuration) {
        clearInterval(interval)
        resolve()
        return
      }
      const list = filteredStudents.value
      const previewSet = new Set<number>()
      for (let i = 0; i < groupSize.value; i++) {
        const randomIdx = Math.floor(Math.random() * list.length)
        const student = list[randomIdx]!
        previewSet.add(student.id)
      }
      pickedGroupIds.value = previewSet
      if (Math.random() > 0.5) playTickSound()
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
  addToPickedHistory([...finalSet])

  const pickedNames = picked.map(s => s.name).join(', ')
  burstConfetti(32)
  addToast(`Group picked: ${pickedNames}`, 'success')

  groupTimeouts.push(setTimeout(() => {
    stopPickSound()
    pickedGroupIds.value = new Set()
    isPickingGroup.value = false
    lastPickedIds.value = finalSet
    playEndSound(840, 260)
  }, 1500))
}

function setGroupSize(size: number) {
  groupSize.value = size
  groupSizeOpen.value = false
}

function deleteSelected() {
  if (selectedIds.value.size === 0) return
  const count = selectedIds.value.size
  students.value = students.value.filter(student => !selectedIds.value.has(student.id))
  selectedIds.value = new Set()
  pickedGroupIds.value = new Set()
  lastPickedIds.value = new Set()
  pickedId.value = null
  addToast(`Deleted ${count} student${count !== 1 ? 's' : ''}`, 'warning')
}

function triggerFileImport() {
  fileInputRef.value?.click()
}

function handleFileImport(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  const isImage = file.type.startsWith('image/')
  const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls')

  if (isImage) {
    const reader = new FileReader()
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string
      const fileName = file.name.replace(/\.[^/.]+$/, '')
      const maxId = students.value.length > 0 ? Math.max(...students.value.map(s => s.id)) : 0
      const newStudent: Student = {
        id: maxId + 1,
        name: fileName,
        initials: fileName.split(/[\s_-]+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?',
        photo: dataUrl,
      }
      students.value.push(newStudent)
      markStudentsAsNew([newStudent.id])
      addToast(`Imported image: ${fileName}`, 'success')
      target.value = ''
    }
    reader.readAsDataURL(file)
    return
  }

  const reader = new FileReader()

  reader.onload = (e) => {
    try {
      const data = e.target?.result
      if (!data) return

      let names: string[] = []

      if (isExcel) {
        const workbook = XLSX.read(data, { type: 'array' })
        const firstSheetName = workbook.SheetNames[0]
        if (firstSheetName) {
          const firstSheet = workbook.Sheets[firstSheetName]
          if (firstSheet) {
            const jsonData = XLSX.utils.sheet_to_json<string[]>(firstSheet, { header: 1 })
            names = jsonData
              .map((row) => {
                const cell = Array.isArray(row) ? row[0] : row
                return cell != null ? String(cell).trim() : ''
              })
              .filter((name: string) => {
                if (!name || name.length === 0) return false
                return !/^(name|student name|full name|fullname|id|student id|no\.?|#)$/i.test(name)
              })
          }
        }
      } else if (file.name.endsWith('.csv') || file.type === 'text/csv' || file.type === 'text/plain') {
        const text = data as string
        const lines = text.split(/\r?\n/)
        names = lines
          .map(line => line.trim())
          .filter(line => {
            if (line.length === 0) return false
            return !/^(name|student name|full name|fullname|id|student id|no\.?|#)$/i.test(line)
          })
      } else if (file.type === 'application/json') {
        const json = JSON.parse(data as string)
        const arr = Array.isArray(json) ? json : [json]
        names = arr
          .map((item) => item.name || item.student || item.participant || item.fullName || item.firstName || '')
          .filter((name: string) => name.trim().length > 0)
      }

      if (names.length > 0) {
        const maxId = students.value.length > 0 ? Math.max(...students.value.map(s => s.id)) : 0
        const newStudents = names.map((name, i) => ({
          id: maxId + i + 1,
          name,
          initials: name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2),
          photo: null,
        }))
        const newIds = newStudents.map(s => s.id)
        students.value.push(...newStudents)
        markStudentsAsNew(newIds)
        addToast(`Imported ${names.length} student${names.length !== 1 ? 's' : ''}`, 'success')
      } else {
        addToast('No student names found in file. Check that names are in the first column.', 'warning')
      }
    } catch (err) {
      console.error('Failed to import file:', err)
      addToast('Failed to read file. Make sure it is a valid .csv or .xlsx file.', 'warning')
    } finally {
      target.value = ''
    }
  }

  if (isExcel) {
    reader.readAsArrayBuffer(file)
  } else {
    reader.readAsText(file)
  }
}

function clearAll() {
  selectedIds.value = new Set()
  pickedGroupIds.value = new Set()
  lastPickedIds.value = new Set()
}

function addStudent() {
  const name = prompt('Enter student name:')
  if (!name || !name.trim()) return
  const maxId = students.value.length > 0 ? Math.max(...students.value.map(s => s.id)) : 0
  const newId = maxId + 1
  const newStudent: Student = {
    id: newId,
    name: name.trim(),
    initials: name.trim().split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2),
    photo: null,
  }
  students.value.push(newStudent)
  markStudentsAsNew([newId])
  pendingAddStudentId.value = newId
  addToast(`Added ${newStudent.name}. Now select a photo.`, 'info')
  setTimeout(() => {
    addPhotoInputRef.value?.click()
  }, 0)
}

function handleAddPhoto(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file || !pendingAddStudentId.value) return

  const reader = new FileReader()
  reader.onload = (e) => {
    const dataUrl = e.target?.result as string
    const student = students.value.find(s => s.id === pendingAddStudentId.value)
    if (student) {
      student.photo = dataUrl
      addToast(`Photo added for ${student.name}`, 'success')
    }
    pendingAddStudentId.value = null
    input.value = ''
  }
  reader.readAsDataURL(file)
}

function triggerPhotoUpload(studentId: number, event: Event) {
  event.stopPropagation()
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/jpeg,image/png,image/jpg,image/gif,image/webp'
  input.onchange = (e) => {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (!file) return
    handlePhotoUpload(studentId, file)
    input.value = ''
  }
  input.click()
}

function handlePhotoUpload(studentId: number, file: File) {
  const reader = new FileReader()
  reader.onload = (e) => {
    const dataUrl = e.target?.result as string
    const student = students.value.find(s => s.id === studentId)
    if (student) {
      student.photo = dataUrl
      addToast(`Photo updated for ${student.name}`, 'success')
    }
  }
  reader.readAsDataURL(file)
}

function removePhoto(studentId: number, event: Event) {
  event.stopPropagation()
  const student = students.value.find(s => s.id === studentId)
  if (student) {
    student.photo = null
    addToast(`Photo removed for ${student.name}`, 'info')
  }
}

const observer = ref<IntersectionObserver | null>(null)
const mutationObserver = ref<MutationObserver | null>(null)

onMounted(() => {
  loadPickedHistory()
  nextTick(() => {
    observer.value = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view')
          }
        })
      },
      { threshold: 0.05, rootMargin: '0px 0px -30px 0px' },
    )

    const observeCards = () => {
      const cards = document.querySelectorAll('.avatar-card:not(.in-view)')
      cards.forEach((el) => observer.value?.observe(el))
    }

    observeCards()

    const grid = document.querySelector('.grid')
    if (grid) {
      mutationObserver.value = new MutationObserver(() => {
        observeCards()
      })
      mutationObserver.value.observe(grid, { childList: true, subtree: true })
    }
  })
})

onBeforeUnmount(() => {
  observer.value?.disconnect()
  mutationObserver.value?.disconnect()
  if (pickTimeout) clearTimeout(pickTimeout)
  groupTimeouts.forEach(t => clearTimeout(t))
  groupTimeouts = []
  stopPickSound()
})
</script>

<template>
  <div class="picker">
    <!-- Header -->
    <div class="header">
      <div class="header-orb header-orb--1" />
      <div class="header-orb header-orb--2" />
      <div class="header-grid" />
      <div class="header__inner">
        <div class="header__left">
          <div>
            <h1 class="header__title anim-fade-in-up">Image Picker</h1>
            <p class="header__desc anim-fade-in-up" style="animation-delay: 0.08s">Pick students by their photos or avatars displayed in a visual grid layout.</p>
          </div>
        </div>
        <div class="header__right anim-fade-in-up" style="animation-delay: 0.16s">
          <RouterLink to="/student-picker" class="btn-back">← Back</RouterLink>
          <div class="header__actions">
            <div class="header__counter" v-if="selectedCount > 0">
              <span class="header__count">{{ selectedCount }}</span>
              <span class="header__count-label">selected</span>
            </div>
            <div class="header__counter header__counter--picked" v-if="pickedCount > 0">
              <span class="header__count">{{ pickedCount }}</span>
              <span class="header__count-label">picked</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Toolbar -->
    <div class="toolbar">
      <div class="toolbar__inner">
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

        <div class="toolbar__actions">
          <button class="toolbar__btn toolbar__btn--primary" @click="pickRandom" :disabled="isPicking || isPickingGroup || filteredStudents.length === 0" aria-label="Pick random student">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
              <path d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z" />
            </svg>
            <span>{{ isPicking ? 'Picking...' : 'Pick' }}</span>
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
            <button class="toolbar__btn toolbar__btn--outline" @click="pickGroup" :disabled="isPickingGroup || isPicking || filteredStudents.length < groupSize" aria-label="Pick group of students">
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
          <button v-if="selectedCount > 0" class="toolbar__btn toolbar__btn--ghost" @click="clearAll" aria-label="Clear selection">Clear</button>
          <button v-if="selectedCount > 0" class="toolbar__btn toolbar__btn--danger" @click="deleteSelected" aria-label="Delete selected students">Delete Selected</button>
          <button class="toolbar__btn toolbar__btn--secondary" @click="addStudent" aria-label="Add student">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
              Add Photo
            </button>
            <button class="toolbar__btn toolbar__btn--secondary" @click="triggerFileImport" aria-label="Import students">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              Import Names / Images
            </button>
          <button v-if="pickedCount > 0" class="toolbar__btn toolbar__btn--warn" @click="resetPickedHistory" aria-label="Reset picked history">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="1 4 1 10 7 10" />
              <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
            </svg>
            Reset Picked
          </button>
        </div>
      </div>
    </div>

    <input
      ref="fileInputRef"
      type="file"
      accept=".csv,.xlsx,.xls,.json,.txt,image/jpeg,image/png,image/jpg,image/gif,image/webp"
      style="display: none"
      @change="handleFileImport"
    />

    <input
      ref="addPhotoInputRef"
      type="file"
      accept="image/jpeg,image/png,image/jpg,image/gif,image/webp"
      style="display: none"
      @change="handleAddPhoto"
    />

    <!-- Grid -->
    <main class="main">
      <TransitionGroup name="grid" tag="div" class="grid">
        <div
          v-for="(student, idx) in filteredStudents"
          :key="student.id"
          class="avatar-card"
          :style="{ transitionDelay: `${idx * 0.04}s` }"
          :class="{
            'avatar-card--sel': selectedIds.has(student.id),
            'avatar-card--pick': pickedId === student.id,
            'avatar-card--group': pickedGroupIds.has(student.id),
            'avatar-card--picked': isPickedBefore(student.id),
            'avatar-card--new': newStudentIds.has(student.id),
          }"
          @click="toggleCard(student.id)"
          :aria-label="'Select ' + student.name"
          :aria-pressed="selectedIds.has(student.id)"
          role="button"
          tabindex="0"
          @keydown.enter="toggleCard(student.id)"
          @keydown.space.prevent="toggleCard(student.id)"
        >
          <button class="avatar-card__delete" @click.stop="deleteStudent(student.id)" aria-label="Delete student" title="Remove student">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
          <div class="avatar-card__check" v-if="selectedIds.has(student.id)">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
          </div>
          <div class="avatar-card__avatar" :style="{ background: student.photo ? 'transparent' : getAvatarColor(student.id) }">
            <img v-if="student.photo" :src="student.photo" :alt="student.name" class="avatar-card__img" />
            <span v-else class="avatar-card__initials">{{ student.initials }}</span>
            <div class="avatar-card__photo-overlay" @click.stop="triggerPhotoUpload(student.id, $event)">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
            </div>
            <button v-if="student.photo" class="avatar-card__remove-photo" @click.stop="removePhoto(student.id, $event)" aria-label="Remove photo" title="Remove photo">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
          <div class="avatar-card__info">
            <h3 class="avatar-card__name">{{ student.name }}</h3>
          </div>
          <div v-if="isPickedBefore(student.id) && !newStudentIds.has(student.id)" class="avatar-card__picked-badge">Picked</div>
          <div v-if="newStudentIds.has(student.id)" class="avatar-card__new-badge">New</div>
        </div>
      </TransitionGroup>

      <!-- Empty State -->
      <Transition name="fade">
        <div v-if="filteredStudents.length === 0" class="empty">
          <div class="empty__icon">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
              <line x1="8" y1="11" x2="14" y2="11" />
            </svg>
          </div>
          <h3 class="empty__title">{{ searchQuery ? 'No students found' : 'No students yet' }}</h3>
          <p class="empty__text">
            <template v-if="searchQuery">Try a different search term</template>
            <template v-else>Add students to get started, or import a list</template>
          </p>
          <button v-if="!searchQuery" class="empty__btn" @click="addStudent">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add Student
          </button>
        </div>
      </Transition>
    </main>

    <!-- Confetti Overlay -->
    <Transition name="confetti-fade">
      <div v-if="confettiParticles.length > 0" class="confetti-overlay">
        <div
          v-for="p in confettiParticles"
          :key="p.id"
          class="confetti-particle"
          :style="{
            '--x': p.x,
            '--color': p.color,
            '--delay': p.delay,
            '--rotation': p.rotation,
          }"
        />
      </div>
    </Transition>

    <!-- Toast Container -->
    <div class="toast-container">
      <TransitionGroup name="toast">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          class="toast"
          :class="`toast--${toast.type}`"
        >
          <svg v-if="toast.type === 'success'" class="toast__icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          <svg v-else-if="toast.type === 'warning'" class="toast__icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <svg v-else class="toast__icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
          <span class="toast__msg">{{ toast.message }}</span>
        </div>
      </TransitionGroup>
    </div>
  </div>
</template>

<style scoped>
.picker {
  margin-top: 70px;
  min-height: 100vh;
  background: #F8FAFC;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
}

.header {
  background: linear-gradient(135deg, #16a34a 0%, #22c55e 50%, #10b981 100%);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  position: relative;
  overflow: hidden;
  padding: 0;
}

.header-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.04) 1px, transparent 1px);
  background-size: 64px 64px;
  mask-image: radial-gradient(ellipse 80% 60% at 50% 50%, black 40%, transparent 100%);
  pointer-events: none;
  animation: gridDrift 20s linear infinite;
}

.header-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(70px);
  pointer-events: none;
  opacity: 0.2;
}

.header-orb--1 {
  width: 420px;
  height: 420px;
  background: #22c55e;
  top: -120px;
  left: -80px;
  animation: orbFloat 10s ease-in-out infinite alternate;
}

.header-orb--2 {
  width: 360px;
  height: 360px;
  background: #10b981;
  bottom: -120px;
  right: -60px;
  animation: orbFloat 12s ease-in-out infinite alternate-reverse;
}

@keyframes orbFloat {
  from { transform: translate(0, 0) scale(1); }
  to { transform: translate(28px, -24px) scale(1.06); }
}

@keyframes gridDrift {
  from { transform: translate(0, 0); }
  to { transform: translate(64px, 64px); }
}

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(18px); }
  to { opacity: 1; transform: translateY(0); }
}

.anim-fade-in-up {
  opacity: 0;
  animation: fadeInUp 0.75s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

.header__inner {
  max-width: 80rem;
  margin: 0 auto;
  padding: 3rem 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  position: relative;
  z-index: 1;
  flex-wrap: wrap;
}

.header__left {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  min-width: 0;
}

.header__title {
  font-size: 1.5rem;
  font-weight: 800;
  color: #F8FAFC;
  margin: 0;
  letter-spacing: -0.03em;
}

.header__desc {
  margin: 0;
  color: #DCFCE7;
  font-size: 0.9rem;
  font-weight: 400;
}

.header__right {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-shrink: 0;
}

.header__actions {
  flex-shrink: 0;
}

.btn-back {
  display: inline-flex;
  align-items: center;
  padding: 10px 20px;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 600;
  font-size: 14px;
  border: 1.5px solid rgba(255, 255, 255, 0.3);
  color: rgba(255, 255, 255, 0.9);
  transition: all 0.2s ease;
  white-space: nowrap;
}

.btn-back:hover {
  border-color: #86efac;
  color: #86efac;
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
  color: #F0FDF4;
  font-variant-numeric: tabular-nums;
  line-height: 1;
}

.header__count-label {
  font-size: 0.8rem;
  font-weight: 500;
  color: #DCFCE7;
}

.header__counter--picked {
  background: rgba(245, 158, 11, 0.2);
  border: 1px solid rgba(245, 158, 11, 0.35);
}

.header__counter--picked .header__count {
  color: #FBBF24;
}

.header__counter--picked .header__count-label {
  color: #FCD34D;
}

/* Toolbar */
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
  flex-wrap: wrap;
}

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
  border-color: #22c55e;
  background: white;
  box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.1);
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

.toolbar__actions {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin-left: auto;
  flex-shrink: 0;
  flex-wrap: wrap;
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
  background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
  color: white;
  box-shadow: 0 2px 8px rgba(34, 197, 94, 0.3);
}

.toolbar__btn--primary:hover:not(:disabled) {
  background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
  box-shadow: 0 4px 12px rgba(34, 197, 94, 0.4);
  transform: translateY(-1px);
}

.toolbar__btn--primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.toolbar__btn--outline {
  background: white;
  color: #16a34a;
  border: 1px solid #22c55e;
  border-radius: 0 10px 10px 0;
}

.toolbar__btn--outline:hover:not(:disabled) {
  background: #F0FDF4;
  border-color: #16a34a;
  color: #15803d;
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

.toolbar__btn--secondary {
  background: linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%);
  color: #475569;
  border: 1px solid #E2E8F0;
  box-shadow: 0 1px 2px rgba(0,0,0,0.04);
}

.toolbar__btn--secondary:hover:not(:disabled) {
  background: linear-gradient(135deg, #F1F5F9 0%, #E2E8F0 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.06);
  border-color: #CBD5E1;
}

.toolbar__btn--secondary:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.toolbar__btn--warn {
  background: #FFFBEB;
  color: #B45309;
  border: 1px solid #FDE68A;
}

.toolbar__btn--warn:hover:not(:disabled) {
  background: #FEF3C7;
  border-color: #FCD34D;
  color: #92400E;
}

.toolbar__btn--warn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

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
  border: 1px solid #22c55e;
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
  color: #16a34a;
  font-variant-numeric: tabular-nums;
  font-size: 0.9rem;
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
  background: #F0FDF4;
  color: #16a34a;
  font-weight: 600;
}

/* Main Grid */
.main {
  max-width: 80rem;
  margin: 0 auto;
  padding: 2.5rem 2rem 10rem;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 1.5rem;
}

@media (min-width: 1024px) {
  .grid { grid-template-columns: repeat(6, 1fr); }
}
@media (max-width: 1023px) and (min-width: 640px) {
  .grid { grid-template-columns: repeat(4, 1fr); }
}
@media (max-width: 639px) {
  .grid { grid-template-columns: repeat(3, 1fr); gap: 1rem; }
}

/* Avatar Card */
.avatar-card {
  opacity: 0;
  transform: translateY(24px);
  transition: opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1),
              transform 0.6s cubic-bezier(0.16, 1, 0.3, 1),
              border-color 0.25s ease,
              background 0.25s ease,
              box-shadow 0.25s ease;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.6rem;
  padding: 1.2rem 0.75rem 0.85rem;
  background: white;
  border: 1px solid #E5E7EB;
  border-radius: 16px;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  outline: none;
  text-align: center;
  min-height: 140px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02);
}

.avatar-card.in-view {
  opacity: 1;
  transform: translateY(0);
}

.avatar-card:hover {
  border-color: #D1D5DB;
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0,0,0,0.08), 0 4px 8px rgba(0,0,0,0.04);
}

.avatar-card:active {
  transform: translateY(-2px) scale(0.98);
}

.avatar-card--sel {
  border-color: #22c55e;
  background: linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%);
  box-shadow: 0 0 0 1px rgba(34, 197, 94, 0.15), 0 8px 20px rgba(34, 197, 94, 0.12);
  transform: translateY(-4px);
}

.avatar-card--sel:hover {
  border-color: #16a34a;
  box-shadow: 0 0 0 2px rgba(34, 197, 94, 0.2), 0 12px 28px rgba(34, 197, 94, 0.15);
}

.avatar-card--pick {
  border-color: #22c55e !important;
  background: linear-gradient(135deg, #DCFCE7 0%, #BBF7D0 100%) !important;
  box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.25), 0 12px 28px rgba(34, 197, 94, 0.2) !important;
  transform: translateY(-6px) scale(1.04) !important;
  animation: pop-in 0.5s cubic-bezier(0.34,1.56,0.64,1);
  will-change: transform;
}

@keyframes pop-in {
  0% { transform: translateY(-4px) scale(1); }
  40% { transform: translateY(-8px) scale(1.06); }
  100% { transform: translateY(-6px) scale(1.04); }
}

.avatar-card--group {
  border-color: #22c55e !important;
  background: linear-gradient(135deg, #DCFCE7 0%, #BBF7D0 100%) !important;
  box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.25), 0 12px 28px rgba(34, 197, 94, 0.2) !important;
  transform: translateY(-6px) scale(1.04) !important;
  animation: group-pop 0.4s cubic-bezier(0.34,1.56,0.64,1);
  will-change: transform;
}

@keyframes group-pop {
  0% { transform: translateY(-4px) scale(1); opacity: 0.7; }
  50% { transform: translateY(-8px) scale(1.06); opacity: 1; }
  100% { transform: translateY(-6px) scale(1.04); opacity: 1; }
}

.avatar-card__check {
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

.avatar-card__avatar {
  width: 3.5rem;
  height: 3.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(0,0,0,0.12);
  position: relative;
  overflow: hidden;
}

.avatar-card--sel .avatar-card__avatar,
.avatar-card--pick .avatar-card__avatar,
.avatar-card--group .avatar-card__avatar,
.avatar-card--picked .avatar-card__avatar {
  transform: scale(1.1);
  box-shadow: 0 6px 16px rgba(0,0,0,0.18);
}

.avatar-card__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-card__initials {
  font-size: 0.9rem;
  font-weight: 700;
  color: white;
  text-shadow: 0 1px 2px rgba(0,0,0,0.15);
}

.avatar-card__info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.2rem;
  min-width: 0;
  width: 100%;
}

.avatar-card__name {
  margin: 0;
  font-size: 0.8rem;
  font-weight: 600;
  color: #1F2937;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.avatar-card--sel .avatar-card__name,
.avatar-card--pick .avatar-card__name,
.avatar-card--group .avatar-card__name {
  color: #15803d;
}

.avatar-card__photo-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.45);
  opacity: 0;
  transition: opacity 0.2s ease;
  color: white;
  border-radius: 50%;
  cursor: pointer;
}

.avatar-card__avatar:hover .avatar-card__photo-overlay {
  opacity: 1;
}

.avatar-card__remove-photo {
  position: absolute;
  top: 2px;
  right: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.1rem;
  height: 1.1rem;
  border: none;
  border-radius: 50%;
  background: rgba(239, 68, 68, 0.9);
  color: white;
  cursor: pointer;
  opacity: 0;
  transition: all 0.15s;
  padding: 0;
  z-index: 2;
}

.avatar-card__avatar:hover .avatar-card__remove-photo {
  opacity: 1;
}

.avatar-card__remove-photo:hover {
  background: #EF4444;
  transform: scale(1.15);
}

/* Picked badge */
.avatar-card--picked {
  opacity: 0.7;
  border-style: dashed;
  border-color: #CBD5E1;
  background: #F8FAFC;
}

.avatar-card--picked:hover {
  border-color: #94A3B8;
  transform: translateY(-2px);
  box-shadow: 0 8px 18px rgba(0,0,0,0.05);
}

.avatar-card--picked .avatar-card__name {
  color: #64748B;
}

.avatar-card--picked .avatar-card__avatar {
  filter: grayscale(0.4);
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.avatar-card__picked-badge {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  font-size: 0.6rem;
  font-weight: 700;
  color: #64748B;
  background: #E2E8F0;
  padding: 0.15rem 0.45rem;
  border-radius: 999px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  z-index: 2;
}

/* New badge */
.avatar-card--new {
  animation: card-entrance 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
  border-color: #22C55E !important;
  background: linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%) !important;
  box-shadow: 0 0 0 2px rgba(34, 197, 94, 0.25), 0 8px 20px rgba(34, 197, 94, 0.12) !important;
  transform: translateY(-4px) !important;
}

.avatar-card--new .avatar-card__name {
  color: #16A34A;
}

.avatar-card--new .avatar-card__avatar {
  transform: scale(1.1);
  box-shadow: 0 6px 16px rgba(34, 197, 94, 0.3);
}

@keyframes card-entrance {
  0% { transform: translateY(20px) scale(0.9); opacity: 0; }
  50% { transform: translateY(-6px) scale(1.05); opacity: 1; }
  100% { transform: translateY(-4px) scale(1); opacity: 1; }
}

.avatar-card__new-badge {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  font-size: 0.6rem;
  font-weight: 800;
  color: white;
  background: linear-gradient(135deg, #22C55E 0%, #16A34A 100%);
  padding: 0.15rem 0.45rem;
  border-radius: 999px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  z-index: 2;
  box-shadow: 0 2px 6px rgba(34, 197, 94, 0.4);
  animation: badge-pop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes badge-pop {
  0% { transform: scale(0); opacity: 0; }
  60% { transform: scale(1.3); }
  100% { transform: scale(1); opacity: 1; }
}

/* Delete button */
.avatar-card__delete {
  position: absolute;
  bottom: 0.5rem;
  right: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.3rem;
  height: 1.3rem;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: #94A3B8;
  cursor: pointer;
  opacity: 0;
  transition: all 0.15s;
  padding: 0;
  z-index: 2;
}

.avatar-card:hover .avatar-card__delete {
  opacity: 1;
}

.avatar-card__delete:hover {
  background: #FEE2E2;
  color: #EF4444;
  transform: scale(1.1);
}

/* Empty State */
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

.empty__btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.5rem;
  padding: 0.65rem 1.25rem;
  background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 0.9rem;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 12px rgba(34, 197, 94, 0.3);
}

.empty__btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 18px rgba(34, 197, 94, 0.4);
}

.empty__btn:active {
  transform: translateY(0) scale(0.98);
}

/* Confetti */
.confetti-overlay {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 1000;
  overflow: hidden;
}

.confetti-particle {
  position: absolute;
  top: -10px;
  left: calc(var(--x) * 1%);
  width: 8px;
  height: 8px;
  background: var(--color);
  border-radius: 2px;
  animation: confetti-fall 2s cubic-bezier(0.25, 0.46, 0.45, 0.94) var(--delay) both;
  transform: rotate(var(--rotation));
}

@keyframes confetti-fall {
  0% {
    opacity: 1;
    transform: translateY(0) rotate(0deg) scale(1);
  }
  50% {
    opacity: 1;
    transform: translateY(40vh) rotate(calc(var(--rotation) + 360deg)) scale(1.2);
  }
  100% {
    opacity: 0;
    transform: translateY(100vh) rotate(calc(var(--rotation) + 720deg)) scale(0.5);
  }
}

.confetti-fade-enter-active {
  transition: opacity 0.2s;
}
.confetti-fade-leave-active {
  transition: opacity 0.4s;
}
.confetti-fade-enter-from,
.confetti-fade-leave-to {
  opacity: 0;
}

/* Toast Notifications */
.toast-container {
  position: fixed;
  top: 5rem;
  right: 1.5rem;
  z-index: 999;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-width: 22rem;
}

.toast {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.75rem 1rem;
  background: white;
  border: 1px solid #E5E7EB;
  border-radius: 10px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.1);
  font-size: 0.85rem;
  font-weight: 500;
  color: #1F2937;
}

.toast--success {
  border-color: #BBF7D0;
  background: #F0FDF4;
  color: #166534;
}

.toast--warning {
  border-color: #FDE68A;
  background: #FFFBEB;
  color: #92400E;
}

.toast__icon {
  flex-shrink: 0;
}

.toast__msg {
  line-height: 1.4;
}

.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateX(40px);
}

/* Transitions */
.grid-enter-active,
.grid-leave-active {
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.grid-enter-from,
.grid-leave-to {
  opacity: 0;
  transform: translateY(20px) scale(0.95);
}

.grid-move {
  transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.fade-enter-active,
.fade-leave-active {
  transition: all 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

.drop-enter-active,
.drop-leave-active {
  transition: all 0.2s ease;
}

.drop-enter-from,
.drop-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
