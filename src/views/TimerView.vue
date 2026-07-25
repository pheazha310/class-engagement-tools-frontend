<script setup lang="ts">
import Navbar from '@/components/Navbar.vue'
import TimerCountdown from '@/components/TimerCountdown.vue'
import { RouterLink } from 'vue-router'
</script>

<template>
  <div class="timer-view">
    <Navbar />

    <section class="timer-hero">
      <div class="hero-orb hero-orb--1" />
      <div class="hero-orb hero-orb--2" />
      <div class="hero-grid" />
      <div class="container">
        <RouterLink to="/tools" class="hero-back">
          <span class="back-icon">←</span>
          <span>Back to all tools</span>
        </RouterLink>
        <div class="hero-copy">
          <span class="hero-eyebrow reveal">CLASSROOM</span>
          <h1 class="hero-title">Countdown Timer</h1>
          <p class="hero-subtitle reveal">
            Keep your class on track with animated countdowns, quick presets, and fullscreen mode.
          </p>
        </div>
      </div>
    </section>

    <div class="container">
      <div class="timer-wrap reveal">
        <TimerCountdown />
      </div>
    </div>
  </div>
</template>

<style scoped>
.timer-view {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background: #ffffff;
}

.timer-hero {
  background: linear-gradient(135deg, #4f46e5 0%, #6366f1 50%, #818cf8 100%);
  color: white;
  padding: 100px 20px 80px;
  text-align: center;
  position: relative;
  overflow: hidden;
}

.hero-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px);
  background-size: 56px 56px;
  mask-image: radial-gradient(ellipse 80% 60% at 50% 50%, black 40%, transparent 100%);
  pointer-events: none;
  animation: gridDrift 22s linear infinite;
}

.hero-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  pointer-events: none;
  opacity: 0.22;
}

.hero-orb--1 {
  width: 360px;
  height: 360px;
  background: #ffffff;
  top: -100px;
  left: -80px;
  animation: orbFloat 10s ease-in-out infinite alternate;
}

.hero-orb--2 {
  width: 300px;
  height: 300px;
  background: #c7d2fe;
  bottom: -90px;
  right: -60px;
  animation: orbFloat 12s ease-in-out infinite alternate-reverse;
}

@keyframes orbFloat {
  from { transform: translate(0, 0) scale(1); }
  to { transform: translate(28px, -24px) scale(1.06); }
}

@keyframes gridDrift {
  from { transform: translate(0, 0); }
  to { transform: translate(56px, 56px); }
}

.hero-back {
  position: absolute;
  left: 24px;
  top: 24px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 9px 16px;
  border-radius: 999px;
  text-decoration: none;
  font-weight: 700;
  font-size: 13px;
  letter-spacing: 0.02em;
  border: 1.5px solid rgba(255, 255, 255, 0.45);
  color: rgba(255, 255, 255, 0.95);
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(8px);
  transition: all 0.25s ease;
  white-space: nowrap;
}

.hero-back:hover {
  border-color: #22d3ee;
  color: #22d3ee;
  background: rgba(255, 255, 255, 0.16);
  transform: translateY(-1px);
}

.back-icon {
  font-size: 16px;
  line-height: 1;
}

.hero-copy {
  position: relative;
  z-index: 1;
  max-width: 720px;
  margin: 0 auto;
}

.hero-eyebrow {
  display: inline-block;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.14em;
  padding: 6px 14px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.14);
  border: 1px solid rgba(255, 255, 255, 0.18);
  color: rgba(255, 255, 255, 0.95);
  margin-bottom: 16px;
}

.hero-title {
  font-size: 44px;
  font-weight: 830;
  margin: 0 0 16px;
  letter-spacing: -0.03em;
  line-height: 1.1;
}

.hero-subtitle {
  font-size: 18px;
  line-height: 1.7;
  opacity: 0.95;
  margin: 0;
}

.timer-wrap {
  position: relative;
  z-index: 1;
  margin-top: -36px;
  margin-bottom: 40px;
  animation: floatUp 0.75s cubic-bezier(0.16, 1, 0.3, 1) both;
}

@keyframes floatUp {
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
}

@media (max-width: 640px) {
  .timer-hero {
    padding: 100px 20px 68px;
  }

  .hero-title {
    font-size: 32px;
  }

  .hero-subtitle {
    font-size: 16px;
  }

  .timer-wrap {
    margin-top: -28px;
  }
}
</style>