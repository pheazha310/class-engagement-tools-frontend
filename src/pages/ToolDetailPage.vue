<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { allTools } from '@/data/toolsData'
import Navbar from '@/components/Navbar.vue'
import TimerCountdown from '@/components/TimerCountdown.vue'

const route = useRoute()

const tool = computed(() => allTools.find((item) => item.slug === route.params.slug))

const relatedTools = computed(() => {
  if (!tool.value) return []
  return allTools.filter((item) => item.category === tool.value!.category && item.slug !== tool.value!.slug).slice(0, 3)
})
</script>

<template>
   <div class="tool-page" v-if="tool">
    <section class="tool-hero">
      <div class="container">
        <div class="tool-hero-content">
          <div class="tool-icon">{{ tool.icon }}</div>
          <h1 class="tool-hero-title">{{ tool.title }}</h1>
          <p class="tool-hero-category">{{ tool.category }}</p>
        </div>
      </div>
    </section>

    <section class="tool-content">
      <div class="container">
        <div class="tool-card">
          <h2 class="tool-section-title">About this tool</h2>
          <p class="tool-description">{{ tool.description }}</p>
        </div>

        <TimerCountdown v-if="tool.slug === 'timer'" />

        <div class="tool-card" v-if="relatedTools.length">
          <h2 class="tool-section-title">Related tools</h2>
          <div class="related-tools">
            <RouterLink
              v-for="related in relatedTools"
              :key="related.title"
              :to="'/tools/' + related.slug"
              class="related-tool-card"
            >
              <span class="related-tool-icon">{{ related.icon }}</span>
              <span class="related-tool-name">{{ related.title }}</span>
            </RouterLink>
          </div>
        </div>
      </div>
    </section>

    <div class="container">
      <RouterLink to="/tools" class="btn-back">← Back to all tools</RouterLink>
    </div>
  </div>
  <div v-else class="tool-page">
    <div class="container not-found" style="padding: 160px 20px 60px; text-align: center;">
      <h1 style="font-size: 48px; font-weight: 800; color: #0f172a; margin-bottom: 16px;">Tool not found</h1>
      <p style="font-size: 18px; color: #475569; margin-bottom: 32px;">The tool you are looking for does not exist.</p>
      <RouterLink to="/tools" class="btn-back">← Back to all tools</RouterLink>
    </div>
  </div>
</template>

<style scoped>
.tool-page {
  min-height: 100vh;
}

.tool-hero {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 120px 20px 80px;
  text-align: center;
}

.tool-hero-content {
  max-width: 800px;
  margin: 0 auto;
  position: relative;
  z-index: 1;
}

.tool-icon {
  font-size: 60px;
  margin-bottom: 16px;
}

.tool-hero-title {
  font-size: 40px;
  font-weight: 800;
  margin-bottom: 12px;
  letter-spacing: -0.02em;
}

.tool-hero-category {
  font-size: 18px;
  opacity: 0.9;
}

.tool-content {
  padding: 60px 20px;
  background: linear-gradient(to bottom, #f8fafc, #f1f5f9);
}

.tool-card {
  background: white;
  border-radius: 16px;
  padding: 28px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  border: 1px solid #e2e8f0;
  margin-bottom: 24px;
}

.tool-section-title {
  font-size: 22px;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 16px;
}

.tool-description {
  font-size: 16px;
  color: #475569;
  line-height: 1.8;
}

.related-tools {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 16px;
}

.related-tool-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 18px;
  border-radius: 12px;
  text-decoration: none;
  border: 1px solid #e2e8f0;
  background: #f8fafc;
  transition: all 0.2s ease;
}

.related-tool-card:hover {
  border-color: #2563eb;
  background: #f0f9ff;
}

.related-tool-icon {
  font-size: 32px;
}

.related-tool-name {
  font-weight: 600;
  font-size: 14px;
  color: #0f172a;
  text-align: center;
}

.btn-back {
  display: inline-flex;
  align-items: center;
  padding: 12px 24px;
  border-radius: 10px;
  text-decoration: none;
  font-weight: 700;
  font-size: 15px;
  border: 1.5px solid #e6eef8;
  color: #0f172a;
  background: #ffffff;
  margin-top: 24px;
  margin-bottom: 32px;
  transition: all 0.15s ease;
}

.btn-back:hover {
  border-color: #c7ddfb;
  background: #f8fbff;
  color: #0f172a;
}

@media (max-width: 768px) {
  .tool-hero {
    padding: 100px 20px 60px;
  }

  .tool-hero-title {
    font-size: 28px;
  }
}
</style>
