<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { fetchSounds, playSound, fetchPlayHistory, type Sound, type SoundPlayHistory } from '@/services/sound'
import { playSynthSound, stopAll, setVolume, getVolume } from '@/utils/soundSynthesizer'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()

const sounds = ref<Sound[]>([])
const history = ref<SoundPlayHistory[]>([])
const loading = ref(true)
const error = ref<string | null>(null)
const showHistory = ref(false)
const historyLoading = ref(false)

// Playback state
const currentSound = ref<Sound | null>(null)
const isPlaying = ref(false)
const volume = ref(getVolume())
const volumeBeforeMute = ref(0.5)
const progress = ref(0)

// Local play count for favorites (tracked even without history API)
const localPlayCount = ref<Map<string, number>>(new Map())

// Manually pinned sound IDs (always shown in Favorites)
const pinnedIds = ref<Set<string>>(new Set())

function togglePin(soundId: string) {
  const next = new Set(pinnedIds.value)
  if (next.has(soundId)) {
    next.delete(soundId)
  } else {
    next.add(soundId)
  }
  pinnedIds.value = next
}

function isPinned(soundId: string): boolean {
  return pinnedIds.value.has(soundId)
}

let progressInterval: ReturnType<typeof setInterval> | null = null

const categories = computed(() => {
  const map = new Map<string, Sound[]>()
  for (const sound of sounds.value) {
    const cat = sound.category || 'Uncategorized'
    if (!map.has(cat)) map.set(cat, [])
    map.get(cat)!.push(sound)
  }
  return Array.from(map.entries())
})

// Derive favorites from play history + local plays + manual pins
const favoriteSounds = computed(() => {
  const countMap = new Map<string, number>()

  // Count from API history
  for (const entry of history.value) {
    const sid = entry.sound_id
    countMap.set(sid, (countMap.get(sid) || 0) + 1)
  }

  // Merge with local plays (higher weight for recent local plays)
  for (const [sid, count] of localPlayCount.value) {
    countMap.set(sid, (countMap.get(sid) || 0) + count)
  }

  // Manually pinned sounds get a high base score so they always appear
  for (const sid of pinnedIds.value) {
    const current = countMap.get(sid) || 0
    // Give pinned sounds at least 1000 to float to the top
    if (current < 1000) {
      countMap.set(sid, 1000 + current)
    }
  }

  // Sort by count descending, take top 8
  const sorted = Array.from(countMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)

  // Map back to Sound objects
  return sorted
    .map(([sid, count]) => {
      const sound = sounds.value.find(s => s.id === sid)
      return sound ? { sound, count } : null
    })
    .filter((s): s is { sound: Sound; count: number } => s !== null)
})

// Manual reorder state for drag-and-drop
const favoriteOrder = ref<string[]>([])
const dragIndex = ref<number | null>(null)
const dragOverIndex = ref<number | null>(null)
let touchStartY = 0
let touchDragIndex: number | null = null

// Apply manual order on top of the computed favorites
const orderedFavorites = computed(() => {
  const favs = favoriteSounds.value
  if (favoriteOrder.value.length === 0) return favs

  // Build ordered list by the manual order, keeping any auto-added sounds at the end
  const ordered: { sound: Sound; count: number }[] = []
  const added = new Set<string>()

  for (const id of favoriteOrder.value) {
    const found = favs.find(f => f.sound.id === id)
    if (found) {
      ordered.push(found)
      added.add(id)
    }
  }

  // Append any new auto-added sounds not yet in the manual order
  for (const f of favs) {
    if (!added.has(f.sound.id)) {
      ordered.push(f)
    }
  }

  return ordered
})

function moveFavorite(fromIndex: number, toIndex: number) {
  if (fromIndex === toIndex) return
  const items = orderedFavorites.value.map(f => f.sound.id)
  const [moved] = items.splice(fromIndex, 1)
  items.splice(toIndex, 0, moved!)
  favoriteOrder.value = items
}

// Mouse drag-and-drop (desktop)
function onDragStart(index: number) {
  dragIndex.value = index
}

function onDragOver(event: DragEvent, index: number) {
  event.preventDefault()
  if (dragIndex.value === null || dragIndex.value === index) return
  dragOverIndex.value = index
}

function onDragLeave() {
  dragOverIndex.value = null
}

function onDropIndex(index: number) {
  if (dragIndex.value === null || dragIndex.value === index) {
    dragIndex.value = null
    dragOverIndex.value = null
    return
  }
  moveFavorite(dragIndex.value, index)
  dragIndex.value = null
  dragOverIndex.value = null
}

function onDragEnd() {
  dragIndex.value = null
  dragOverIndex.value = null
}

// Touch drag-and-drop (mobile/tablet)
function onTouchStart(event: TouchEvent, index: number) {
  if (isPlaying.value) return
  dragIndex.value = index
  touchDragIndex = index
  const touch = event.touches[0]
  if (touch) {
    touchStartY = touch.clientY
  }
}

function onTouchMove(event: TouchEvent) {
  if (touchDragIndex === null || dragIndex.value === null) return
  event.preventDefault()

  const touch = event.touches[0]
  if (!touch) return
  const elements = document.elementsFromPoint(touch.clientX, touch.clientY)
  const btn = elements.find(el =>
    el instanceof HTMLElement && el.closest('.sb-sound-btn--fav')
  )
  if (btn) {
    const favEl = btn instanceof HTMLElement ? btn.closest('.sb-sound-btn--fav') as HTMLElement : null
    if (favEl) {
      const allFavs = Array.from(document.querySelectorAll('.sb-sound-btn--fav'))
      const idx = allFavs.indexOf(favEl)
      if (idx >= 0 && idx !== dragIndex.value) {
        dragOverIndex.value = idx
      } else {
        dragOverIndex.value = null
      }
    }
  }
}

function onTouchEnd() {
  if (touchDragIndex === null || dragIndex.value === null) return
  if (dragOverIndex.value !== null && dragOverIndex.value !== dragIndex.value) {
    moveFavorite(dragIndex.value, dragOverIndex.value)
  }
  touchDragIndex = null
  dragIndex.value = null
  dragOverIndex.value = null
}

const currentCategoryColor = computed(() => {
  if (!currentSound.value) return '#3B82F6'
  return getCategoryColor(currentSound.value.category || '')
})

async function loadSounds() {
  loading.value = true
  error.value = null
  try {
    sounds.value = await fetchSounds()
    // Also fetch recent play history for favorites calculation
    try {
      const result = await fetchPlayHistory(1, 100)
      history.value = result.data
    } catch {
      // History is optional — favorites will just be empty
    }
  } catch (e) {
    error.value = 'Failed to load sounds. Please try again.'
    console.error(e)
  } finally {
    loading.value = false
  }
}

onMounted(loadSounds)

onUnmounted(() => {
  stopAll()
  if (progressInterval) clearInterval(progressInterval)
})

function startProgress(durationMs: number) {
  const start = Date.now()
  if (progressInterval) clearInterval(progressInterval)
  progress.value = 0
  progressInterval = setInterval(() => {
    const elapsed = Date.now() - start
    progress.value = Math.min(100, (elapsed / durationMs) * 100)
    if (progress.value >= 100) {
      if (progressInterval) clearInterval(progressInterval)
      progressInterval = null
    }
  }, 30)
}

function stopProgress() {
  if (progressInterval) {
    clearInterval(progressInterval)
    progressInterval = null
  }
  progress.value = 0
}

async function handlePlay(sound: Sound) {
  if (isPlaying.value && currentSound.value?.id === sound.id) return

  // 1. Play locally via synthesized sound
  const { duration } = playSynthSound(sound.name)

  // 2. Broadcast to classroom via API
  try {
    await playSound(sound.id)
  } catch (e) {
    console.error('Failed to trigger sound broadcast:', e)
  }

  // 3. Track local play for favorites
  const newMap = new Map(localPlayCount.value)
  newMap.set(sound.id, (newMap.get(sound.id) || 0) + 1)
  localPlayCount.value = newMap

  // 4. Update UI state
  currentSound.value = sound
  isPlaying.value = true
  startProgress(duration)
}

function handleStop() {
  stopAll()
  isPlaying.value = false
  stopProgress()
  // Keep currentSound visible so users can replay
}

function handleReplay() {
  if (!currentSound.value) return
  handlePlay(currentSound.value)
}

function handleVolumeChange(event: Event) {
  const input = event.target as HTMLInputElement
  const val = parseFloat(input.value)
  volume.value = val
  setVolume(val)
}

function toggleMute() {
  if (volume.value === 0) {
    volume.value = volumeBeforeMute.value
    setVolume(volumeBeforeMute.value)
  } else {
    volumeBeforeMute.value = volume.value
    volume.value = 0
    setVolume(0)
  }
}

function isSoundPlaying(soundId: string): boolean {
  return isPlaying.value && currentSound.value?.id === soundId
}

function getCategoryEmoji(category: string): string {
  const emojiMap: Record<string, string> = {
    'Rewards': '🎉',
    'Quiz': '📝',
    'Suspense': '🎭',
    'Transitions': '🔄',
    'Timers': '⏰',
    'Fun': '😄',
  }
  return emojiMap[category] || '🔊'
}

function getCategoryColor(category: string): string {
  const colorMap: Record<string, string> = {
    'Rewards': '#F59E0B',
    'Quiz': '#3B82F6',
    'Suspense': '#8B5CF6',
    'Transitions': '#10B981',
    'Timers': '#EF4444',
    'Fun': '#EC4899',
  }
  return colorMap[category] || '#6B7280'
}

async function toggleHistory() {
  showHistory.value = !showHistory.value
  if (showHistory.value && history.value.length === 0) {
    historyLoading.value = true
    try {
      const result = await fetchPlayHistory()
      history.value = result.data
    } catch (e) {
      console.error('Failed to load history:', e)
    } finally {
      historyLoading.value = false
    }
  }
}
</script>

<template>
  <div class="soundboard">
    <!-- Header -->
    <div class="sb-header">
      <div class="sb-header__inner">
        <div>
          <h1 class="sb-header__title">
            <span class="sb-header__icon">🔊</span>
            Soundboard
          </h1>
          <p class="sb-header__desc">Click any sound to play it in the classroom</p>
        </div>
        <div class="sb-header__actions">
          <button
            v-if="authStore.user"
            class="sb-btn sb-btn--ghost"
            @click="toggleHistory"
            :aria-label="showHistory ? 'Hide history' : 'Show history'"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            {{ showHistory ? 'Hide History' : 'Play History' }}
          </button>
        </div>
      </div>
    </div>

    <!-- History panel -->
    <Transition name="slide">
      <div v-if="showHistory" class="sb-history">
        <div class="sb-history__inner">
          <h3 class="sb-history__title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            Recently Played
          </h3>
          <div v-if="historyLoading" class="sb-history__loading">
            <div class="sb-spinner" />
            Loading history...
          </div>
          <div v-else-if="history.length === 0" class="sb-history__empty">
            <p>No sounds played yet. Click a sound to start!</p>
          </div>
          <div v-else class="sb-history__list">
            <div v-for="entry in history" :key="entry.id" class="sb-history__item">
              <span class="sb-history__icon">{{ entry.icon || '🔊' }}</span>
              <div class="sb-history__info">
                <span class="sb-history__name">{{ entry.sound_name }}</span>
                <span class="sb-history__time">{{ new Date(entry.played_at).toLocaleTimeString() }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Main content -->
    <main class="sb-main">
      <!-- Loading state -->
      <div v-if="loading" class="sb-loading">
        <div class="sb-spinner sb-spinner--lg" />
        <p class="sb-loading__text">Loading sounds...</p>
      </div>

      <!-- Error state -->
      <div v-else-if="error" class="sb-error">
        <div class="sb-error__icon">⚠️</div>
        <h3 class="sb-error__title">Something went wrong</h3>
        <p class="sb-error__text">{{ error }}</p>
        <button class="sb-btn sb-btn--primary" @click="loadSounds()">Try Again</button>
      </div>

      <!-- Sound grid -->
      <div v-else class="sb-content">
        <!-- Favorites section (top of page) — drag-and-drop reorderable -->
        <div v-if="orderedFavorites.length > 0" class="sb-favorites">
          <div class="sb-favorites__header">
            <h2 class="sb-favorites__title">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="none" class="sb-favorites__star">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
              Favorites
            </h2>
            <div class="sb-favorites__actions">
              <span class="sb-category__count">{{ orderedFavorites.length }} most played</span>
              <span class="sb-favorites__hint">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
                </svg>
                Drag to reorder
              </span>
            </div>
          </div>

          <div class="sb-grid sb-favorites__grid">
            <button
              v-for="{ sound, count }, index in orderedFavorites"
              :key="sound.id"
              class="sb-sound-btn sb-sound-btn--fav sb-sound-btn--drag"
              :class="{
                'sb-sound-btn--playing': isSoundPlaying(sound.id),
                'sb-sound-btn--was-playing': !isPlaying && currentSound?.id === sound.id,
                'sb-sound-btn--dragging': dragIndex === index,
                'sb-sound-btn--drag-over': dragOverIndex === index && dragIndex !== index,
              }"
              :style="{ '--accent': getCategoryColor(sound.category || '') }"
              :draggable="!isPlaying"
               @click="handlePlay(sound)"
               @dragstart="onDragStart(index)"
              @dragover="onDragOver($event, index)"
              @dragleave="onDragLeave"
              @drop="onDropIndex(index)"
              @dragend="onDragEnd"
              @touchstart.passive="onTouchStart($event, index)"
              @touchmove="onTouchMove($event)"
              @touchend="onTouchEnd"
              :disabled="isPlaying && currentSound?.id !== sound.id"
              :aria-label="'Play ' + sound.name"
            >
              <!-- Drag handle -->
              <span class="sb-drag-handle" :class="{ 'sb-drag-handle--hidden': isPlaying }">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                  <circle cx="9" cy="5" r="2" /><circle cx="15" cy="5" r="2" />
                  <circle cx="9" cy="12" r="2" /><circle cx="15" cy="12" r="2" />
                  <circle cx="9" cy="19" r="2" /><circle cx="15" cy="19" r="2" />
                </svg>
              </span>

              <!-- Pinned indicator -->
              <span v-if="isPinned(sound.id)" class="sb-pin-indicator" title="Manually pinned">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                  <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2z" />
                </svg>
              </span>

              <!-- Play count badge -->
              <span class="sb-fav-badge" :style="{ '--accent': getCategoryColor(sound.category || '') }">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
                {{ count }}
              </span>

              <div class="sb-sound-btn__icon-wrap">
                <span class="sb-sound-btn__icon">{{ sound.icon || '🔊' }}</span>
                <div v-if="isSoundPlaying(sound.id)" class="sb-sound-btn__wave">
                  <span /><span /><span /><span />
                </div>
              </div>
              <span class="sb-sound-btn__name">{{ sound.name }}</span>
              <span v-if="sound.duration_seconds" class="sb-sound-btn__duration">
                {{ sound.duration_seconds }}s
              </span>

              <!-- Playing overlay -->
              <Transition name="fade">
                <div v-if="isSoundPlaying(sound.id)" class="sb-sound-btn__overlay">
                  <svg class="sb-sound-btn__pulse" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                  <span>Playing...</span>
                </div>
              </Transition>
            </button>
          </div>
        </div>

        <div
          v-for="[category, categorySounds] in categories"
          :key="category"
          class="sb-category"
          :class="{ 'sb-category--now-playing': currentSound && categorySounds.some(s => s.id === currentSound?.id) }"
        >
          <div class="sb-category__header">
            <h2 class="sb-category__title">
              <span class="sb-category__emoji">{{ getCategoryEmoji(category) }}</span>
              {{ category }}
            </h2>
            <span class="sb-category__count">{{ categorySounds.length }} sound{{ categorySounds.length !== 1 ? 's' : '' }}</span>
          </div>

          <div class="sb-grid">
            <button
              v-for="sound in categorySounds"
              :key="sound.id"
              class="sb-sound-btn"
              :class="{
                'sb-sound-btn--playing': isSoundPlaying(sound.id),
                'sb-sound-btn--was-playing': !isPlaying && currentSound?.id === sound.id,
              }"
              :style="{ '--accent': getCategoryColor(category) }"
              @click="handlePlay(sound)"
              :disabled="isPlaying && currentSound?.id !== sound.id"
              :aria-label="'Play ' + sound.name"
            >
              <!-- Pin button (uses span with role=button to avoid nested <button> DOM) -->
              <span
                class="sb-pin-btn"
                :class="{ 'sb-pin-btn--pinned': isPinned(sound.id) }"
                role="button"
                tabindex="0"
                @click.stop="togglePin(sound.id)"
                @keydown.enter.prevent="togglePin(sound.id)"
                @keydown.space.prevent="togglePin(sound.id)"
                :title="isPinned(sound.id) ? 'Unpin from favorites' : 'Pin to favorites'"
                :aria-label="isPinned(sound.id) ? 'Unpin from favorites' : 'Pin to favorites'"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2z" />
                </svg>
              </span>

              <div class="sb-sound-btn__icon-wrap">
                <span class="sb-sound-btn__icon">{{ sound.icon || '🔊' }}</span>
                <div v-if="isSoundPlaying(sound.id)" class="sb-sound-btn__wave">
                  <span /><span /><span /><span />
                </div>
              </div>
              <span class="sb-sound-btn__name">{{ sound.name }}</span>
              <span v-if="sound.duration_seconds" class="sb-sound-btn__duration">
                {{ sound.duration_seconds }}s
              </span>

              <!-- Playing overlay -->
              <Transition name="fade">
                <div v-if="isSoundPlaying(sound.id)" class="sb-sound-btn__overlay">
                  <svg class="sb-sound-btn__pulse" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                  <span>Playing...</span>
                </div>
              </Transition>
            </button>
          </div>
        </div>

        <!-- Empty state -->
        <div v-if="sounds.length === 0 && !loading" class="sb-empty">
          <div class="sb-empty__icon">🔇</div>
          <h3 class="sb-empty__title">No sounds available</h3>
          <p class="sb-empty__text">Sounds will appear here once they are added to the system.</p>
        </div>
      </div>
    </main>

    <!-- ═══════════════════════════════════
         Now Playing Bar
         ═══════════════════════════════════ -->
    <Transition name="bar-up">
      <div v-if="currentSound" class="sb-now-playing" :style="{ '--accent': currentCategoryColor }">
        <div class="sb-now-playing__bg" />

        <!-- Progress bar -->
        <div class="sb-now-playing__progress-track">
          <div class="sb-now-playing__progress-fill" :style="{ width: progress + '%' }" />
        </div>

        <div class="sb-now-playing__inner">
          <!-- Sound info -->
          <div class="sb-now-playing__info">
            <span class="sb-now-playing__icon">{{ currentSound.icon || '🔊' }}</span>
            <div class="sb-now-playing__meta">
              <span class="sb-now-playing__name">{{ currentSound.name }}</span>
              <span class="sb-now-playing__status">
                {{ isPlaying ? 'Now Playing' : 'Ready' }}
              </span>
            </div>
          </div>

          <!-- Controls -->
          <div class="sb-now-playing__controls">
            <!-- Replay -->
            <button
              class="sb-ctrl-btn"
              :disabled="isPlaying"
              @click="handleReplay"
              title="Replay"
              aria-label="Replay"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="1 4 1 10 7 10" />
                <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
              </svg>
            </button>

            <!-- Play / Stop -->
            <button
              class="sb-ctrl-btn sb-ctrl-btn--play"
              @click="isPlaying ? handleStop() : handleReplay()"
              :title="isPlaying ? 'Stop' : 'Play'"
              :aria-label="isPlaying ? 'Stop' : 'Play'"
            >
              <svg v-if="isPlaying" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="4" width="4" height="16" rx="1" />
                <rect x="14" y="4" width="4" height="16" rx="1" />
              </svg>
              <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
            </button>

            <!-- Volume -->
            <div class="sb-volume">
              <button
                class="sb-ctrl-btn sb-ctrl-btn--vol"
                @click="toggleMute"
                :title="volume === 0 ? 'Unmute' : 'Mute'"
                :aria-label="volume === 0 ? 'Unmute' : 'Mute'"
              >
                <svg v-if="volume === 0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                  <line x1="23" y1="9" x2="17" y2="15" />
                  <line x1="17" y1="9" x2="23" y2="15" />
                </svg>
                <svg v-else-if="volume < 0.5" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                </svg>
                <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
                </svg>
              </button>
              <input
                type="range"
                class="sb-volume__slider"
                min="0"
                max="1"
                step="0.01"
                :value="volume"
                @input="handleVolumeChange"
                aria-label="Volume"
              />
              <span class="sb-volume__label">{{ Math.round(volume * 100) }}%</span>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
/* ═══════════════════════════════════════════════
   CSS Custom Properties
   ═══════════════════════════════════════════════ */
.soundboard {
  --header-pad-y: 2rem;
  --header-pad-x: 2rem;
  --content-pad: 2rem;
  --grid-gap: 0.85rem;
  --btn-min-h: 130px;
  --btn-pad: 1.25rem 0.75rem 0.85rem;
  --icon-size: 1.6rem;
  --icon-wrap: 3rem;
  --name-size: 0.85rem;
}

/* ═══════════════════════════════════
   Root
   ═══════════════════════════════════ */
.soundboard {
  min-height: 100vh;
  min-height: 100dvh;
  padding-top: 64px;
  background: #F8FAFC;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
}

/* ═══════════════════════════════════
   Header
   ═══════════════════════════════════ */
.sb-header {
  background: linear-gradient(135deg, #0F172A 0%, #1E293B 100%);
  border-bottom: 1px solid #334155;
  position: relative;
  overflow: hidden;
}

.sb-header::before {
  content: '';
  position: absolute;
  top: -50%;
  right: -10%;
  width: clamp(250px, 40vw, 400px);
  height: clamp(250px, 40vw, 400px);
  background: radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%);
  pointer-events: none;
}

.sb-header__inner {
  max-width: 80rem;
  margin: 0 auto;
  padding: var(--header-pad-y) var(--header-pad-x);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  position: relative;
  z-index: 1;
}

.sb-header__title {
  font-size: clamp(1.1rem, 3vw, 1.5rem);
  font-weight: 800;
  color: #F8FAFC;
  margin: 0;
  letter-spacing: -0.03em;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.sb-header__icon { font-size: clamp(1.1rem, 3vw, 1.4rem); }

.sb-header__desc {
  margin: 0.35rem 0 0;
  color: #94A3B8;
  font-size: clamp(0.8rem, 1.5vw, 0.9rem);
  font-weight: 400;
}

.sb-header__actions { flex-shrink: 0; }

/* ═══════════════════════════════════
   Buttons
   ═══════════════════════════════════ */
.sb-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.5rem 0.9rem;
  border: none;
  border-radius: 10px;
  font-size: clamp(0.78rem, 1.5vw, 0.85rem);
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
  -webkit-tap-highlight-color: transparent;
}

.sb-btn:active { transform: scale(0.97); }

.sb-btn--primary {
  background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%);
  color: white;
  box-shadow: 0 2px 8px rgba(59,130,246,0.3);
}

.sb-btn--primary:hover {
  background: linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%);
  box-shadow: 0 4px 12px rgba(59,130,246,0.4);
  transform: translateY(-1px);
}

.sb-btn--ghost {
  background: rgba(255,255,255,0.08);
  color: #CBD5E1;
  border: 1px solid rgba(255,255,255,0.12);
  backdrop-filter: blur(8px);
}

.sb-btn--ghost:hover {
  background: rgba(255,255,255,0.14);
  color: #F1F5F9;
  border-color: rgba(255,255,255,0.2);
}

/* ═══════════════════════════════════
   History Panel
   ═══════════════════════════════════ */
.sb-history {
  background: white;
  border-bottom: 1px solid #E5E7EB;
  box-shadow: 0 4px 12px rgba(0,0,0,0.06);
}

.sb-history__inner {
  max-width: 80rem;
  margin: 0 auto;
  padding: 1rem var(--content-pad);
}

.sb-history__title {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: clamp(0.82rem, 1.5vw, 0.9rem);
  font-weight: 700;
  color: #1F2937;
  margin: 0 0 0.75rem;
}

.sb-history__loading {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #6B7280;
  font-size: 0.85rem;
}

.sb-history__empty { color: #9CA3AF; font-size: 0.85rem; }

.sb-history__list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.sb-history__item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem 0.75rem;
  background: #F9FAFB;
  border: 1px solid #E5E7EB;
  border-radius: 8px;
  animation: fade-in 0.3s ease-out;
}

.sb-history__icon { font-size: 1rem; }

.sb-history__info {
  display: flex;
  flex-direction: column;
  gap: 0.05rem;
}

.sb-history__name { font-size: 0.8rem; font-weight: 600; color: #1F2937; }

.sb-history__time {
  font-size: 0.7rem;
  color: #9CA3AF;
  font-variant-numeric: tabular-nums;
}

@keyframes fade-in {
  from { opacity: 0; transform: translateY(-4px); }
  to { opacity: 1; transform: translateY(0); }
}

/* ═══════════════════════════════════
   Main Content
   ═══════════════════════════════════ */
.sb-main {
  max-width: 80rem;
  margin: 0 auto;
  padding: var(--content-pad) var(--content-pad) calc(var(--content-pad) * 3.5);
  transition: padding-bottom 0.3s;
}

/* ═══════════════════════════════════
   Loading & Error
   ═══════════════════════════════════ */
.sb-loading, .sb-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: clamp(3rem, 10vh, 5rem) var(--content-pad);
  text-align: center;
}

.sb-error__icon { font-size: clamp(1.8rem, 5vw, 2.5rem); }
.sb-error__title { font-size: clamp(1rem, 2.5vw, 1.1rem); font-weight: 700; color: #1F2937; margin: 0; }
.sb-error__text { color: #6B7280; font-size: clamp(0.82rem, 1.5vw, 0.9rem); margin: 0 0 0.5rem; }

.sb-spinner {
  width: 1.2rem;
  height: 1.2rem;
  border: 2px solid #E5E7EB;
  border-top-color: #3B82F6;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

.sb-spinner--lg { width: clamp(1.5rem, 4vw, 2rem); height: clamp(1.5rem, 4vw, 2rem); border-width: 3px; }

@keyframes spin { to { transform: rotate(360deg); } }

/* ═══════════════════════════════════
   Category Section
   ═══════════════════════════════════ */
.sb-content { display: flex; flex-direction: column; gap: clamp(1.25rem, 3vw, 2rem); }

.sb-category__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: clamp(0.6rem, 1.5vw, 1rem);
}

.sb-category__title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: clamp(1rem, 2vw, 1.15rem);
  font-weight: 700;
  color: #1F2937;
  margin: 0;
}

.sb-category__emoji { font-size: clamp(1rem, 2.5vw, 1.2rem); }

.sb-category__count {
  font-size: clamp(0.72rem, 1.2vw, 0.8rem);
  font-weight: 500;
  color: #9CA3AF;
  background: #F3F4F6;
  padding: 0.2rem 0.6rem;
  border-radius: 999px;
  white-space: nowrap;
}

/* ═══════════════════════════════════
   Sound Grid
   ═══════════════════════════════════ */
.sb-grid {
  display: grid;
  gap: var(--grid-gap);
}

/* Desktop: 5 columns */
@media (min-width: 1024px) {
  .sb-grid {
    grid-template-columns: repeat(5, 1fr);
  }
}

/* Small desktop / large tablet: 4 columns */
@media (max-width: 1023px) and (min-width: 820px) {
  .sb-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

/* Tablet portrait: 3 columns */
@media (max-width: 819px) and (min-width: 481px) {
  .sb-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

/* Large phone / small tablet landscape: 3 columns */
@media (max-width: 680px) and (min-width: 481px) and (orientation: landscape) {
  .sb-grid {
    grid-template-columns: repeat(4, 1fr);
    gap: 0.6rem;
  }
}

/* Phone portrait: 2 columns */
@media (max-width: 480px) {
  .sb-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.65rem;
  }
}

/* Very small phone */
@media (max-width: 360px) {
  .sb-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.5rem;
  }
}

/* ═══════════════════════════════════
   Sound Button
   ═══════════════════════════════════ */
.sb-sound-btn {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: var(--btn-pad);
  background: white;
  border: 1px solid #E5E7EB;
  border-radius: clamp(12px, 2vw, 14px);
  cursor: pointer;
  font-family: inherit;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  outline: none;
  text-align: center;
  min-height: var(--btn-min-h);
  min-width: 0;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02);
  overflow: hidden;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
}

/* Touch devices: no hover lift, but subtle scale */
@media (hover: hover) {
  .sb-sound-btn:hover:not(:disabled) {
    border-color: var(--accent, #3B82F6);
    transform: translateY(-4px);
    box-shadow: 0 8px 20px rgba(0,0,0,0.08), 0 4px 8px rgba(0,0,0,0.04);
  }
}

@media (hover: none) {
  .sb-sound-btn:hover:not(:disabled) {
    border-color: #D1D5DB;
  }
  .sb-sound-btn:active:not(:disabled) {
    transform: scale(0.96);
  }
}

.sb-sound-btn:active:not(:disabled) { transform: translateY(-2px) scale(0.97); }

.sb-sound-btn:disabled { cursor: not-allowed; opacity: 0.7; }

.sb-sound-btn--playing {
  border-color: var(--accent, #3B82F6) !important;
  background: linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%) !important;
  box-shadow: 0 0 0 2px var(--accent, #3B82F6), 0 12px 28px rgba(0,0,0,0.1) !important;
  transform: translateY(-4px) scale(1.02);
}

.sb-sound-btn--was-playing {
  border-color: var(--accent, #3B82F6) !important;
  background: linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%) !important;
}

/* Icon */
.sb-sound-btn__icon-wrap {
  position: relative;
  width: var(--icon-wrap);
  height: var(--icon-wrap);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.3s;
  flex-shrink: 0;
}

.sb-sound-btn__icon { font-size: var(--icon-size); transition: transform 0.3s; }

.sb-sound-btn--playing .sb-sound-btn__icon { transform: scale(1.2); }

/* Wave animation */
.sb-sound-btn__wave {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 3px;
}

.sb-sound-btn__wave span {
  width: 3px;
  height: clamp(10px, 2.5vw, 12px);
  background: var(--accent, #3B82F6);
  border-radius: 3px;
  animation: wave 0.6s ease-in-out infinite;
}

.sb-sound-btn__wave span:nth-child(1) { animation-delay: 0s; height: 10px; }
.sb-sound-btn__wave span:nth-child(2) { animation-delay: 0.1s; height: 18px; }
.sb-sound-btn__wave span:nth-child(3) { animation-delay: 0.2s; height: 14px; }
.sb-sound-btn__wave span:nth-child(4) { animation-delay: 0.3s; height: 8px; }

@keyframes wave {
  0%, 100% { transform: scaleY(0.5); opacity: 0.5; }
  50% { transform: scaleY(1.2); opacity: 1; }
}

.sb-sound-btn__name {
  font-size: var(--name-size);
  font-weight: 600;
  color: #1F2937;
  line-height: 1.3;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sb-sound-btn--playing .sb-sound-btn__name { color: var(--accent, #3B82F6); }

.sb-sound-btn__duration {
  font-size: clamp(0.65rem, 1.2vw, 0.7rem);
  font-weight: 500;
  color: #9CA3AF;
  background: #F3F4F6;
  padding: 0.1rem 0.45rem;
  border-radius: 4px;
  font-variant-numeric: tabular-nums;
  transition: all 0.3s;
}

.sb-sound-btn--playing .sb-sound-btn__duration { background: var(--accent, #3B82F6); color: white; }

/* Playing overlay */
.sb-sound-btn__overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.3rem;
  background: rgba(255,255,255,0.92);
  border-radius: inherit;
  font-size: clamp(0.7rem, 1.3vw, 0.75rem);
  font-weight: 600;
  color: var(--accent, #3B82F6);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
}

.sb-sound-btn__pulse { animation: pulse-icon 0.8s ease-in-out infinite; }

@keyframes pulse-icon {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.2); opacity: 0.7; }
}

/* ═══════════════════════════════════
   Favorites Section
   ═══════════════════════════════════ */
.sb-favorites {
  background: linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%);
  border: 1px solid #FDE68A;
  border-radius: 16px;
  padding: 1.25rem 1.25rem 1.5rem;
  transition: all 0.3s;
}

.sb-favorites__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.sb-favorites__title {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: clamp(1rem, 2vw, 1.15rem);
  font-weight: 700;
  color: #92400E;
  margin: 0;
}

.sb-favorites__star {
  color: #F59E0B;
  animation: star-glow 2s ease-in-out infinite;
  flex-shrink: 0;
}

@keyframes star-glow {
  0%, 100% { opacity: 0.7; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.15); filter: brightness(1.2); }
}

.sb-fav-badge {
  position: absolute;
  top: 0.4rem;
  right: 0.4rem;
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 0.15rem 0.45rem;
  background: linear-gradient(135deg, var(--accent, #3B82F6) 0%, color-mix(in srgb, var(--accent, #3B82F6) 80%, black) 100%);
  color: white;
  font-size: 0.65rem;
  font-weight: 700;
  border-radius: 999px;
  z-index: 2;
  line-height: 1;
  font-variant-numeric: tabular-nums;
  box-shadow: 0 2px 6px rgba(0,0,0,0.15);
  animation: badge-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes badge-in {
  0% { transform: scale(0); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}

.sb-fav-badge svg {
  width: 8px;
  height: 8px;
}

.sb-favorites__actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.sb-favorites__hint {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.72rem;
  font-weight: 500;
  color: #B45309;
  opacity: 0.7;
  transition: opacity 0.2s;
  user-select: none;
}

.sb-favorites:hover .sb-favorites__hint {
  opacity: 1;
}

.sb-sound-btn--fav {
  border-color: #FDE68A;
}

.sb-sound-btn--fav:hover:not(:disabled) {
  border-color: #F59E0B !important;
  box-shadow: 0 8px 20px rgba(245,158,11,0.15), 0 4px 8px rgba(0,0,0,0.04) !important;
}

/* ── Drag handle ── */
.sb-drag-handle {
  position: absolute;
  top: 0.35rem;
  left: 0.35rem;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.4rem;
  height: 1.4rem;
  border-radius: 6px;
  color: #D4A574;
  opacity: 0;
  transition: all 0.2s;
  z-index: 5;
  cursor: grab;
  touch-action: none;
}

.sb-sound-btn--fav:hover .sb-drag-handle:not(.sb-drag-handle--hidden),
.sb-sound-btn--fav:focus-within .sb-drag-handle:not(.sb-drag-handle--hidden) {
  opacity: 0.7;
}

.sb-drag-handle:hover {
  opacity: 1 !important;
  background: rgba(245,158,11,0.12);
}

.sb-drag-handle--hidden {
  display: none;
}

.sb-drag-handle svg {
  width: 12px;
  height: 12px;
}

/* ═══════════════════════════════════
   Pin Button (on regular sound buttons)
   ═══════════════════════════════════ */
.sb-pin-btn {
  position: absolute;
  top: 0.35rem;
  left: 0.35rem;
  z-index: 5;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.6rem;
  height: 1.6rem;
  min-width: 0;
  min-height: 0;
  padding: 0;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: #D1D5DB;
  cursor: pointer;
  opacity: 0;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
}

.sb-sound-btn:hover .sb-pin-btn,
.sb-sound-btn:focus-within .sb-pin-btn,
.sb-pin-btn--pinned {
  opacity: 1;
}

.sb-pin-btn:hover {
  background: rgba(59,130,246,0.1);
  color: #3B82F6;
  transform: scale(1.1);
}

.sb-pin-btn:active {
  transform: scale(0.9);
}

.sb-pin-btn--pinned {
  color: #F59E0B;
  opacity: 1;
}

.sb-pin-btn--pinned:hover {
  background: rgba(245,158,11,0.12);
  color: #D97706;
}

.sb-pin-btn svg {
  width: 12px;
  height: 12px;
  transition: transform 0.2s;
}

.sb-pin-btn:hover svg {
  transform: scale(1.1);
}

/* Pin indicator on favorite buttons */
.sb-pin-indicator {
  position: absolute;
  top: 0.5rem;
  left: 0.5rem;
  z-index: 3;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1rem;
  height: 1rem;
  color: #F59E0B;
  opacity: 0.8;
  pointer-events: none;
  animation: badge-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.sb-pin-indicator svg {
  width: 10px;
  height: 10px;
}

@media (prefers-color-scheme: dark) {
  .sb-pin-btn {
    color: #64748B;
  }

  .sb-pin-btn:hover {
    background: rgba(96,165,250,0.15);
    color: #60A5FA;
  }

  .sb-pin-btn--pinned {
    color: #FBBF24;
  }

  .sb-pin-btn--pinned:hover {
    background: rgba(251,191,36,0.15);
    color: #F59E0B;
  }

  .sb-pin-indicator {
    color: #FBBF24;
  }
}

/* ── Dragging state ── */
.sb-sound-btn--dragging {
  opacity: 0.4 !important;
  transform: scale(0.95) !important;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15) !important;
}

.sb-sound-btn--drag-over {
  border-color: #F59E0B !important;
  box-shadow: 0 0 0 2px #F59E0B, 0 8px 20px rgba(245,158,11,0.2) !important;
  transform: translateY(-2px) scale(1.02) !important;
}

/* Phasing out the drop zone indicator */
.sb-favorites__grid {
  transition: gap 0.2s;
}

@media (prefers-color-scheme: dark) {
  .sb-drag-handle {
    color: #B45309;
  }

  .sb-drag-handle:hover {
    background: rgba(245,158,11,0.15);
  }

  .sb-favorites__hint {
    color: #FDE68A;
  }
}

@media (prefers-color-scheme: dark) {
  .sb-favorites {
    background: linear-gradient(135deg, #451A03 0%, #78350F 100%);
    border-color: #92400E;
  }

  .sb-favorites__title {
    color: #FDE68A;
  }

  .sb-sound-btn--fav {
    border-color: #78350F;
    background: #1C1917;
  }

  .sb-sound-btn--fav:hover:not(:disabled) {
    border-color: #F59E0B !important;
    box-shadow: 0 8px 20px rgba(245,158,11,0.2), 0 4px 8px rgba(0,0,0,0.2) !important;
  }
}

/* ═══════════════════════════════════
   Empty State
   ═══════════════════════════════════ */
.sb-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: clamp(3rem, 10vh, 5rem) var(--content-pad);
  text-align: center;
}

.sb-empty__icon { font-size: clamp(1.8rem, 5vw, 2.5rem); }
.sb-empty__title { font-size: clamp(1rem, 2.5vw, 1.1rem); font-weight: 700; color: #1F2937; margin: 0; }
.sb-empty__text { color: #6B7280; font-size: clamp(0.82rem, 1.5vw, 0.9rem); margin: 0; }

/* ═══════════════════════════════════
   Now Playing Bar
   ═══════════════════════════════════ */
.sb-now-playing {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 100;
  background: #0F172A;
  border-top: 1px solid #1E293B;
  color: white;
  box-shadow: 0 -8px 30px rgba(0,0,0,0.25);
  padding-bottom: env(safe-area-inset-bottom, 0px);
}

.sb-now-playing__bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(15,23,42,0.98) 0%, rgba(30,41,59,0.98) 100%);
  pointer-events: none;
}

/* Progress bar */
.sb-now-playing__progress-track {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: rgba(255,255,255,0.08);
  overflow: hidden;
}

.sb-now-playing__progress-fill {
  height: 100%;
  background: var(--accent, #3B82F6);
  transition: width 0.03s linear;
  border-radius: 0 2px 2px 0;
}

.sb-now-playing__inner {
  position: relative;
  z-index: 1;
  max-width: 80rem;
  margin: 0 auto;
  padding: 0.85rem clamp(1rem, 3vw, 2rem);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: clamp(0.6rem, 2vw, 1.5rem);
}

/* Info */
.sb-now-playing__info {
  display: flex;
  align-items: center;
  gap: clamp(0.5rem, 1.5vw, 0.75rem);
  min-width: 0;
  flex: 1;
}

.sb-now-playing__icon {
  font-size: clamp(1.2rem, 3vw, 1.6rem);
  flex-shrink: 0;
}

.sb-now-playing__meta {
  display: flex;
  flex-direction: column;
  gap: 0.05rem;
  min-width: 0;
}

.sb-now-playing__name {
  font-size: clamp(0.82rem, 1.8vw, 0.95rem);
  font-weight: 700;
  color: #F1F5F9;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sb-now-playing__status {
  font-size: clamp(0.65rem, 1.2vw, 0.7rem);
  font-weight: 500;
  color: var(--accent, #60A5FA);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

/* Controls */
.sb-now-playing__controls {
  display: flex;
  align-items: center;
  gap: clamp(0.25rem, 0.7vw, 0.4rem);
  flex-shrink: 0;
}

.sb-ctrl-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: clamp(2.2rem, 4.5vw, 2.4rem);
  height: clamp(2.2rem, 4.5vw, 2.4rem);
  min-width: 44px;
  min-height: 44px;
  border: none;
  border-radius: 50%;
  background: rgba(255,255,255,0.08);
  color: #CBD5E1;
  cursor: pointer;
  transition: all 0.15s;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
}

@media (hover: hover) {
  .sb-ctrl-btn:hover:not(:disabled) {
    background: rgba(255,255,255,0.16);
    color: #F1F5F9;
    transform: scale(1.05);
  }
}

.sb-ctrl-btn:active:not(:disabled) { transform: scale(0.93); }

.sb-ctrl-btn:disabled { opacity: 0.3; cursor: not-allowed; }

.sb-ctrl-btn--play {
  width: clamp(2.6rem, 5vw, 2.8rem);
  height: clamp(2.6rem, 5vw, 2.8rem);
  min-width: 48px;
  min-height: 48px;
  background: var(--accent, #3B82F6);
  color: white;
  box-shadow: 0 3px 10px rgba(0,0,0,0.3);
}

.sb-ctrl-btn--play:active:not(:disabled) { transform: scale(0.93); }

@media (hover: hover) {
  .sb-ctrl-btn--play:hover:not(:disabled) {
    background: var(--accent, #2563EB);
    filter: brightness(1.1);
  }
}

.sb-ctrl-btn--vol { min-width: 44px; min-height: 44px; }

/* Volume */
.sb-volume {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-left: clamp(0.1rem, 0.5vw, 0.3rem);
}

.sb-volume__slider {
  width: clamp(3rem, 8vw, 5rem);
  height: 4px;
  -webkit-appearance: none;
  appearance: none;
  background: rgba(255,255,255,0.15);
  border-radius: 2px;
  outline: none;
  cursor: pointer;
  transition: opacity 0.15s;
}

.sb-volume__slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: clamp(12px, 2.5vw, 14px);
  height: clamp(12px, 2.5vw, 14px);
  border-radius: 50%;
  background: var(--accent, #3B82F6);
  border: 2px solid white;
  box-shadow: 0 1px 4px rgba(0,0,0,0.3);
  cursor: pointer;
  transition: transform 0.12s;
}

@media (hover: hover) {
  .sb-volume__slider::-webkit-slider-thumb:hover { transform: scale(1.15); }
}

.sb-volume__slider::-moz-range-thumb {
  width: clamp(12px, 2.5vw, 14px);
  height: clamp(12px, 2.5vw, 14px);
  border-radius: 50%;
  background: var(--accent, #3B82F6);
  border: 2px solid white;
  box-shadow: 0 1px 4px rgba(0,0,0,0.3);
  cursor: pointer;
}

.sb-volume__label {
  font-size: clamp(0.7rem, 1.3vw, 0.75rem);
  font-weight: 600;
  color: #94A3B8;
  min-width: 2.5rem;
  font-variant-numeric: tabular-nums;
}

/* ═══════════════════════════════════
   Transitions
   ═══════════════════════════════════ */
.slide-enter-active, .slide-leave-active { transition: all 0.2s ease; }
.slide-enter-from, .slide-leave-to { opacity: 0; transform: translateY(-8px); }

.fade-enter-active, .fade-leave-active { transition: opacity 0.15s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.bar-up-enter-active { transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1); }
.bar-up-leave-active { transition: all 0.2s ease; }
.bar-up-enter-from { transform: translateY(100%); opacity: 0; }
.bar-up-leave-to { transform: translateY(100%); opacity: 0; }

/* ═══════════════════════════════════
   Responsive Overrides
   ═══════════════════════════════════ */

/* ── Large screens (>1200px) ── */
@media (min-width: 1200px) {
  .soundboard {
    --content-pad: 2.5rem;
  }
}

/* ── Tablet landscape / small desktop (820-1023px) ── */
@media (max-width: 1023px) and (min-width: 820px) {
  .soundboard {
    --content-pad: 1.75rem;
    --grid-gap: 0.75rem;
  }
}

/* ── Tablet portrait (640-819px) ── */
@media (max-width: 819px) and (min-width: 640px) {
  .soundboard {
    --header-pad-y: 1.75rem;
    --header-pad-x: 1.75rem;
    --content-pad: 1.5rem;
    --grid-gap: 0.7rem;
    --btn-min-h: 125px;
    --btn-pad: 1.15rem 0.65rem 0.8rem;
    --icon-size: 1.5rem;
    --icon-wrap: 2.8rem;
    --name-size: 0.82rem;
  }

  .sb-header__inner {
    flex-wrap: wrap;
  }
}

/* ── Large phones / small tablets in landscape (480-639px) ── */
@media (max-width: 639px) and (min-width: 480px) {
  .soundboard {
    --header-pad-y: 1.25rem;
    --header-pad-x: 1.25rem;
    --content-pad: 1.25rem;
    --grid-gap: 0.65rem;
    --btn-min-h: 120px;
    --btn-pad: 1rem 0.55rem 0.7rem;
    --icon-size: 1.35rem;
    --icon-wrap: 2.5rem;
    --name-size: 0.8rem;
  }

  .sb-header__inner {
    flex-wrap: wrap;
  }

  .sb-now-playing__inner {
    flex-direction: column;
    gap: 0.5rem;
    padding: 0.65rem 1rem;
  }
  .sb-now-playing__controls {
    width: 100%;
    justify-content: center;
  }
  .sb-volume__slider {
    width: 4rem;
  }
}

/* ── Small phone landscape orientation ── */
@media (max-width: 639px) and (orientation: landscape) {
  .sb-grid {
    grid-template-columns: repeat(4, 1fr) !important;
    gap: 0.5rem;
  }
  .sb-sound-btn {
    min-height: 105px;
    padding: 0.85rem 0.5rem 0.6rem;
  }
  .sb-sound-btn__icon-wrap {
    width: 2.2rem;
    height: 2.2rem;
  }
  .sb-sound-btn__icon {
    font-size: 1.15rem;
  }
}

/* ── Phone portrait (≤479px) ── */
@media (max-width: 479px) {
  .soundboard {
    --header-pad-y: 1.25rem;
    --header-pad-x: 1rem;
    --content-pad: 1rem;
    --grid-gap: 0.6rem;
    --btn-min-h: 115px;
    --btn-pad: 1rem 0.5rem 0.65rem;
    --icon-size: 1.3rem;
    --icon-wrap: 2.5rem;
    --name-size: 0.78rem;
  }

  .sb-header__inner {
    flex-wrap: wrap;
    gap: 0.75rem;
  }

  .sb-header__title {
    gap: 0.35rem;
  }

  .sb-history__inner {
    padding: 0.75rem 1rem;
  }

  .sb-history__list {
    flex-direction: column;
    max-height: 240px;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
  }

  .sb-now-playing__inner {
    flex-direction: column;
    gap: 0.4rem;
    padding: 0.6rem 0.85rem;
  }
  .sb-now-playing__info {
    width: 100%;
  }
  .sb-now-playing__controls {
    width: 100%;
    justify-content: center;
    flex-wrap: wrap;
  }
  .sb-volume {
    gap: 0.3rem;
  }
  .sb-volume__slider {
    width: 3.5rem;
  }
  .sb-volume__label {
    min-width: 2rem;
  }
}

/* ── Very small phones (≤360px) ── */
@media (max-width: 360px) {
  .soundboard {
    --btn-min-h: 105px;
    --btn-pad: 0.85rem 0.4rem 0.6rem;
    --icon-size: 1.15rem;
    --icon-wrap: 2.2rem;
    --name-size: 0.72rem;
  }

  .sb-sound-btn {
    border-radius: 10px;
    gap: 0.35rem;
  }
}

/* ── Dark mode support ── */
@media (prefers-color-scheme: dark) {
  .soundboard {
    background: #0F172A;
  }

  .sb-category__title {
    color: #F1F5F9;
  }

  .sb-sound-btn {
    background: #1E293B;
    border-color: #334155;
    box-shadow: 0 1px 3px rgba(0,0,0,0.2);
  }

  .sb-sound-btn__name {
    color: #F1F5F9;
  }

  .sb-sound-btn__duration {
    color: #94A3B8;
    background: #334155;
  }

  .sb-sound-btn--playing {
    background: linear-gradient(135deg, #064E3B 0%, #065F46 100%) !important;
  }

  .sb-sound-btn--was-playing {
    background: linear-gradient(135deg, #064E3B 0%, #065F46 100%) !important;
  }

  .sb-category__count {
    color: #94A3B8;
    background: #1E293B;
  }

  .sb-history {
    background: #1E293B;
    border-color: #334155;
  }

  .sb-history__title {
    color: #F1F5F9;
  }

  .sb-history__item {
    background: #0F172A;
    border-color: #334155;
  }

  .sb-history__name {
    color: #F1F5F9;
  }

  .sb-sound-btn__overlay {
    background: rgba(30,41,59,0.92);
  }

  .sb-empty__title {
    color: #F1F5F9;
  }

  .sb-loading__text {
    color: #94A3B8;
  }

  .sb-error__title {
    color: #F1F5F9;
  }

  .sb-error__text {
    color: #94A3B8;
  }
}
</style>
