<script setup lang="ts">
import Navbar from '@/components/Navbar.vue'
import Stopwatch from '@/components/Stopwatch.vue'
</script>

<template>
  <div class="stopwatch-view">
    <Navbar />

    <section class="stopwatch-hero">
      <div class="container">
        <div class="hero-copy">
          <h1>Stopwatch</h1>
        </div>
      </div>
    </section>

    <div class="container">
      <Stopwatch />
      <div class="back-link">
        <RouterLink to="/tools" class="btn-back">← Back to all tools</RouterLink>
      </div>
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

.hero-copy {
  max-width: 720px;
  margin: 0 auto;
}

.back-link {
  display: flex;
  justify-content: flex-start;
  margin: 32px 0 48px;
}

.btn-back {
  display: inline-flex;
  align-items: center;
  padding: 12px 22px;
  border-radius: 10px;
  border: 1.5px solid #cbd5e1;
  color: #1e293b;
  text-decoration: none;
  background: #f1f5f9;
  transition: all 0.2s ease;
}

.btn-back:hover {
  background: rgba(255, 255, 255, 0.18);
}
</style>
