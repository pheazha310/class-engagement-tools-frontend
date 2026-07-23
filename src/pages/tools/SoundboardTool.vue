<script setup lang="ts">
import { ref } from 'vue'


interface Sound {
  id: string
  name: string
  emoji: string
  color: string
  frequency?: number
}

const activeSound = ref<string | null>(null)
const volume = ref(80)

const sounds: Sound[] = [
  { id: 'applause', name: 'Applause', emoji: '👏', color: '#6366f1', frequency: 600 },
  { id: 'bell', name: 'School Bell', emoji: '🔔', color: '#059669', frequency: 800 },
  { id: 'success', name: 'Success', emoji: '🎉', color: '#f59e0b', frequency: 1000 },
  { id: 'chime', name: 'Chime', emoji: '✨', color: '#06b6d4', frequency: 1200 },
  { id: 'drum', name: 'Drum Roll', emoji: '🥁', color: '#ec4899', frequency: 200 },
  { id: 'whistle', name: 'Whistle', emoji: '📣', color: '#f97316', frequency: 1600 },
  { id: 'clap', name: 'Single Clap', emoji: '👏', color: '#8b5cf6', frequency: 500 },
  { id: 'boing', name: 'Boing', emoji: '🦘', color: '#14b8a6', frequency: 400 },
  { id: 'ding', name: 'Ding', emoji: '🔔', color: '#eab308', frequency: 1400 },
  { id: 'tada', name: 'Ta-Da', emoji: '🎺', color: '#ef4444', frequency: 900 },
  { id: 'click', name: 'Click', emoji: '🖱️', color: '#64748b', frequency: 1100 },
  { id: 'alert', name: 'Alert', emoji: '⚠️', color: '#dc2626', frequency: 700 },
]

function playSound(sound: Sound) {
  activeSound.value = sound.id
  try {
    const ctx = new AudioContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.setValueAtTime(sound.frequency || 600, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime((sound.frequency || 600) * 1.5, ctx.currentTime + 0.15)
    osc.type = 'triangle'
    const vol = volume.value / 100
    gain.gain.setValueAtTime(vol * 0.3, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.6)
    setTimeout(() => {
      ctx.close()
      if (activeSound.value === sound.id) activeSound.value = null
    }, 700)
  } catch {
    activeSound.value = null
  }
}
</script>

<template>
  <div class="tool-page">

    <section class="tool-hero">
      <div class="container">
          <RouterLink to="/teacher/dashboard" class="back-to-dashboard">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            Back to Dashboard
          </RouterLink>
        <div class="tool-hero-content">
          <div class="tool-icon">🔊</div>
          <h1>Soundboard</h1>
          <p>Bring excitement to lessons with applause, countdown, and success sounds.</p>
        </div>
      </div>
    </section>

    <section class="tool-main">
      <div class="container">
        <!-- Volume Control -->
        <div class="soundboard-controls">
          <div class="volume-control">
            <span>🔊 Volume</span>
            <input type="range" min="0" max="100" v-model.number="volume" class="volume-slider" />
            <span class="volume-value">{{ volume }}%</span>
          </div>
        </div>

        <!-- Sound Grid -->
        <div class="sound-grid">
          <button
            v-for="sound in sounds"
            :key="sound.id"
            class="sound-card"
            :class="{ playing: activeSound === sound.id }"
            :style="{ '--accent': sound.color }"
            @click="playSound(sound)"
          >
            <div class="sound-emoji">{{ sound.emoji }}</div>
            <div class="sound-name">{{ sound.name }}</div>
            <div v-if="activeSound === sound.id" class="sound-wave">
              <span></span><span></span><span></span>
            </div>
          </button>
        </div>

        <div class="soundboard-hint">
          <p>Click any sound to play. Adjust volume with the slider above.</p>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.tool-page { min-height: 100vh; background: #f8fafc; }
.container { max-width: 800px; margin: 0 auto; padding: 0 20px; }

.tool-hero {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: #fff; padding: 120px 20px 60px; text-align: center;
}
.tool-hero-content { max-width: 640px; margin: 0 auto; }
.tool-icon { font-size: 60px; margin-bottom: 16px; }
.tool-hero h1 { font-size: 40px; font-weight: 800; margin-bottom: 12px; }
.tool-hero p { font-size: 17px; opacity: .92; line-height: 1.6; }

.tool-main { padding: 40px 20px 60px; }

.soundboard-controls {
  background: #fff; border-radius: 12px; padding: 20px 24px; margin-bottom: 24px;
  border: 1px solid #e2e8f0; display: flex; justify-content: center;
}
.volume-control {
  display: flex; align-items: center; gap: 16px;
  font-size: 14px; font-weight: 600; color: #334155;
}
.volume-slider { width: 200px; accent-color: #f59e0b; cursor: pointer; }
.volume-value { font-weight: 800; color: #f59e0b; min-width: 40px; text-align: right; font-size: 13px; }

.sound-grid {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 16px;
}

.sound-card {
  display: flex; flex-direction: column; align-items: center; gap: 10px;
  padding: 24px 16px; border-radius: 14px; border: 2px solid #e2e8f0;
  background: #fff; cursor: pointer; transition: all .2s;
  position: relative; overflow: hidden;
}
.sound-card:hover { transform: translateY(-3px); box-shadow: 0 8px 20px rgba(0,0,0,.08); border-color: var(--accent); }
.sound-card.playing { border-color: var(--accent); background: linear-gradient(135deg, #fff, color-mix(in srgb, var(--accent) 8%, #fff)); box-shadow: 0 4px 16px color-mix(in srgb, var(--accent) 20%, transparent); }
.sound-emoji { font-size: 36px; line-height: 1; }
.sound-name { font-size: 13px; font-weight: 700; color: #334155; }

.sound-wave {
  position: absolute; bottom: 12px; display: flex; gap: 3px; align-items: center;
}
.sound-wave span {
  display: block; width: 4px; border-radius: 999px; background: var(--accent);
  animation: wave 0.5s ease-in-out infinite;
}
.sound-wave span:nth-child(1) { height: 12px; animation-delay: 0s; }
.sound-wave span:nth-child(2) { height: 18px; animation-delay: 0.1s; }
.sound-wave span:nth-child(3) { height: 10px; animation-delay: 0.2s; }

@keyframes wave {
  0%, 100% { transform: scaleY(0.5); }
  50% { transform: scaleY(1); }
}

.soundboard-hint { text-align: center; margin-top: 32px; color: #94a3b8; font-size: 13px; }

@media (max-width:640px) {
  .tool-hero h1 { font-size: 28px; }
  .sound-grid { grid-template-columns: repeat(3, 1fr); }
  .sound-card { padding: 18px 12px; }
  .sound-emoji { font-size: 28px; }
}
</style>
