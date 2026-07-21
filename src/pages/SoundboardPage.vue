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

const currentCategoryColor = computed(() => {
  if (!currentSound.value) return '#3B82F6'
  return getCategoryColor(currentSound.value.category || '')
})

async function loadSounds() {
  loading.value = true
  error.value = null
  try {
    sounds.value = await fetchSounds()
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

  // 3. Update UI state
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
/* ═══════════════════════════════════
   Root
   ═══════════════════════════════════ */
.soundboard {
  min-height: 100vh;
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
  width: 400px;
  height: 400px;
  background: radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%);
  pointer-events: none;
}

.sb-header__inner {
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

.sb-header__title {
  font-size: 1.5rem;
  font-weight: 800;
  color: #F8FAFC;
  margin: 0;
  letter-spacing: -0.03em;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.sb-header__icon { font-size: 1.4rem; }

.sb-header__desc {
  margin: 0.35rem 0 0;
  color: #94A3B8;
  font-size: 0.9rem;
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
  font-size: 0.85rem;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
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
  padding: 1rem 2rem;
}

.sb-history__title {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.9rem;
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
  padding: 2rem 2rem 7rem;
  transition: padding-bottom 0.3s;
}

/* Extra space when now-playing bar is visible */
.soundboard:has(.sb-now-playing) .sb-main {
  padding-bottom: 7rem;
}

/* ═══════════════════════════════════
   Loading & Error
   ═══════════════════════════════════ */
.sb-loading, .sb-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 5rem 2rem;
  text-align: center;
}

.sb-error__icon { font-size: 2.5rem; }
.sb-error__title { font-size: 1.1rem; font-weight: 700; color: #1F2937; margin: 0; }
.sb-error__text { color: #6B7280; font-size: 0.9rem; margin: 0 0 0.5rem; }

.sb-spinner {
  width: 1.2rem;
  height: 1.2rem;
  border: 2px solid #E5E7EB;
  border-top-color: #3B82F6;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

.sb-spinner--lg { width: 2rem; height: 2rem; border-width: 3px; }

@keyframes spin { to { transform: rotate(360deg); } }

/* ═══════════════════════════════════
   Category Section
   ═══════════════════════════════════ */
.sb-content { display: flex; flex-direction: column; gap: 2rem; }

.sb-category__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.sb-category__title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.15rem;
  font-weight: 700;
  color: #1F2937;
  margin: 0;
}

.sb-category__emoji { font-size: 1.2rem; }

.sb-category__count {
  font-size: 0.8rem;
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
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 0.85rem;
}

@media (min-width: 1024px) { .sb-grid { grid-template-columns: repeat(5, 1fr); } }
@media (max-width: 1023px) and (min-width: 640px) { .sb-grid { grid-template-columns: repeat(3, 1fr); } }
@media (max-width: 380px) { .sb-grid { grid-template-columns: repeat(2, 1fr); gap: 0.65rem; } }

/* ═══════════════════════════════════
   Sound Button
   ═══════════════════════════════════ */
.sb-sound-btn {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 1.25rem 0.75rem 0.85rem;
  background: white;
  border: 1px solid #E5E7EB;
  border-radius: 14px;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  outline: none;
  text-align: center;
  min-height: 130px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02);
  overflow: hidden;
}

.sb-sound-btn:hover:not(:disabled) {
  border-color: var(--accent, #3B82F6);
  transform: translateY(-4px);
  box-shadow: 0 8px 20px rgba(0,0,0,0.08), 0 4px 8px rgba(0,0,0,0.04);
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
  width: 3rem;
  height: 3rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.3s;
}

.sb-sound-btn__icon { font-size: 1.6rem; transition: transform 0.3s; }

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
  height: 12px;
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
  font-size: 0.85rem;
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
  font-size: 0.7rem;
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
  border-radius: 14px;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--accent, #3B82F6);
  backdrop-filter: blur(4px);
}

.sb-sound-btn__pulse { animation: pulse-icon 0.8s ease-in-out infinite; }

@keyframes pulse-icon {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.2); opacity: 0.7; }
}

/* ═══════════════════════════════════
   Empty State
   ═══════════════════════════════════ */
.sb-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 5rem 2rem;
  text-align: center;
}

.sb-empty__icon { font-size: 2.5rem; }
.sb-empty__title { font-size: 1.1rem; font-weight: 700; color: #1F2937; margin: 0; }
.sb-empty__text { color: #6B7280; font-size: 0.9rem; margin: 0; }

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
  padding: 0.85rem 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;
}

/* Info */
.sb-now-playing__info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-width: 0;
  flex: 1;
}

.sb-now-playing__icon {
  font-size: 1.6rem;
  flex-shrink: 0;
}

.sb-now-playing__meta {
  display: flex;
  flex-direction: column;
  gap: 0.05rem;
  min-width: 0;
}

.sb-now-playing__name {
  font-size: 0.95rem;
  font-weight: 700;
  color: #F1F5F9;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sb-now-playing__status {
  font-size: 0.7rem;
  font-weight: 500;
  color: var(--accent, #60A5FA);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

/* Controls */
.sb-now-playing__controls {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  flex-shrink: 0;
}

.sb-ctrl-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.4rem;
  height: 2.4rem;
  border: none;
  border-radius: 50%;
  background: rgba(255,255,255,0.08);
  color: #CBD5E1;
  cursor: pointer;
  transition: all 0.15s;
}

.sb-ctrl-btn:hover:not(:disabled) {
  background: rgba(255,255,255,0.16);
  color: #F1F5F9;
  transform: scale(1.05);
}

.sb-ctrl-btn:active:not(:disabled) { transform: scale(0.93); }

.sb-ctrl-btn:disabled { opacity: 0.3; cursor: not-allowed; }

.sb-ctrl-btn--play {
  width: 2.8rem;
  height: 2.8rem;
  background: var(--accent, #3B82F6);
  color: white;
  box-shadow: 0 3px 10px rgba(0,0,0,0.3);
}

.sb-ctrl-btn--play:hover:not(:disabled) {
  background: var(--accent, #2563EB);
  filter: brightness(1.1);
}

.sb-ctrl-btn--vol { width: 2.2rem; height: 2.2rem; }

/* Volume */
.sb-volume {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-left: 0.3rem;
}

.sb-volume__slider {
  width: 5rem;
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
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: var(--accent, #3B82F6);
  border: 2px solid white;
  box-shadow: 0 1px 4px rgba(0,0,0,0.3);
  cursor: pointer;
  transition: transform 0.12s;
}

.sb-volume__slider::-webkit-slider-thumb:hover { transform: scale(1.15); }

.sb-volume__slider::-moz-range-thumb {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: var(--accent, #3B82F6);
  border: 2px solid white;
  box-shadow: 0 1px 4px rgba(0,0,0,0.3);
  cursor: pointer;
}

.sb-volume__label {
  font-size: 0.75rem;
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

.bar-up-enter-active { transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }
.bar-up-leave-active { transition: all 0.2s ease; }
.bar-up-enter-from { transform: translateY(100%); opacity: 0; }
.bar-up-leave-to { transform: translateY(100%); opacity: 0; }

/* ═══════════════════════════════════
   Responsive
   ═══════════════════════════════════ */
@media (max-width: 640px) {
  .sb-header__inner { padding: 1.5rem 1.25rem; flex-wrap: wrap; }
  .sb-header__title { font-size: 1.25rem; }

  .sb-main { padding: 1.5rem 1.25rem; }

  .sb-sound-btn {
    min-height: 115px;
    padding: 1rem 0.6rem 0.7rem;
  }
  .sb-sound-btn__icon-wrap { width: 2.5rem; height: 2.5rem; }
  .sb-sound-btn__icon { font-size: 1.3rem; }
  .sb-sound-btn__name { font-size: 0.8rem; }

  .sb-now-playing__inner {
    padding: 0.7rem 1rem;
    flex-direction: column;
    gap: 0.6rem;
  }
  .sb-now-playing__controls { width: 100%; justify-content: center; }
  .sb-volume__slider { width: 4rem; }
}
</style>
