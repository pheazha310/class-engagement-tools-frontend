<script setup lang="ts">
import Navbar from '@/components/Navbar.vue'
import TimerCountdown from '@/components/TimerCountdown.vue'
</script>

<template>
  <div class="timer-view">
    <Navbar />

    <section class="timer-hero">
      <div class="container">
        <div class="hero-copy">
          <h1>Countdown Timer</h1>
        </div>
      </div>
    </section>

    <div class="container">
      <TimerCountdown />
      <div class="back-link">
        <RouterLink to="/tools" class="btn-back">← Back to all tools</RouterLink>
      </div>
    </div>
  </div>
</template>

<style scoped>
.timer-hero {
  background: linear-gradient(135deg, #4f46e5 0%, #64748b 100%);
  color: white;
  padding: 90px 20px 60px;
  text-align: center;
}

.hero-copy {
  max-width: 720px;
  margin: 0 auto;
}

.hero-copy h1 {
  font-size: 44px;
  margin-bottom: 16px;
  font-weight: 800;
}

.hero-copy p {
  font-size: 18px;
  line-height: 1.8;
  opacity: 0.95;
}

.back-link {
  display: flex;
  justify-content: center;
  margin: 32px 0 48px;
}

.btn-back {
  display: inline-flex;
  align-items: center;
  padding: 12px 22px;
  border-radius: 10px;
  border: 1.5px solid #e2e8f0;
  color: #fff;
  text-decoration: none;
  background: rgba(255, 255, 255, 0.12);
  transition: all 0.2s ease;
}

.btn-back:hover {
  background: rgba(255, 255, 255, 0.18);
}
</style>