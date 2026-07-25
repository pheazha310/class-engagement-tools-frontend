<script setup lang="ts">

import Stopwatch from '@/components/Stopwatch.vue'
import { RouterLink } from 'vue-router'
</script>

<template>
  <div class="stopwatch-view">

    <section class="stopwatch-hero">
      <div class="container">
<<<<<<< HEAD
          <RouterLink to="/teacher/dashboard" class="back-to-dashboard">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            Back to Dashboard
          </RouterLink>
        <!-- <div class="hero-copy">
=======
        <RouterLink to="/tools" class="hero-back">← Back to all tools</RouterLink>
        <div class="hero-content">
>>>>>>> 6acf3de (fix: fixed style that brokend after merge)
          <h1>Stopwatch</h1>
          <p>Measure elapsed time with precision. Start, pause, and reset as needed.</p>
        </div>
      </div>
    </section>

    <div class="container">
      <Stopwatch />
    </div>
  </div>
</template>

<style scoped>
.stopwatch-hero {
  background: linear-gradient(135deg, #4f46e5 0%, #64748b 100%);
  color: white;
  padding: 90px 20px 60px;
  text-align: center;
}

.hero-back {
  display: inline-flex;
  align-items: center;
  padding: 8px 16px;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 600;
  font-size: 13px;
  border: 1.5px solid rgba(255, 255, 255, 0.45);
  color: rgba(255, 255, 255, 0.95);
  background: rgba(255, 255, 255, 0.08);
  transition: all 0.2s ease;
  white-space: nowrap;
  margin-bottom: 1.5rem;
}

.hero-back:hover {
  border-color: #22d3ee;
  color: #22d3ee;
  background: rgba(255, 255, 255, 0.14);
}

.hero-content h1 {
  font-size: 44px;
  margin: 0 0 12px;
  font-weight: 800;
  letter-spacing: -0.02em;
}

.hero-content p {
  font-size: 18px;
  line-height: 1.6;
  opacity: 0.9;
  margin: 0 auto;
  max-width: 30rem;
}

@media (max-width: 640px) {
  .stopwatch-hero {
    padding: 70px 16px 40px;
  }

  .hero-content h1 {
    font-size: 2rem;
  }

  .hero-content p {
    font-size: 0.95rem;
  }

  .hero-back {
    font-size: 0.8rem;
    padding: 6px 12px;
  }
}
</style>