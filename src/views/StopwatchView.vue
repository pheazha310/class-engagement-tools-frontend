<script setup lang="ts">
import Navbar from '@/components/Navbar.vue'
import Stopwatch from '@/components/Stopwatch.vue'
</script>

<template>
  <div class="stopwatch-view">
    <Navbar />

    <section class="stopwatch-hero">
      <div class="container">
        <div class="hero-content" />
      </div>
    </section>

    <div class="container">
      <Stopwatch />
    </div>
  </div>
</template>

<style scoped>
.stopwatch-hero {
  color: white;
  padding: 90px 20px 60px;
  text-align: center;
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
}
</style>
