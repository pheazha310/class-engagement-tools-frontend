<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { categories } from '@/data/toolsData'

const route = useRoute()

const category = computed(() => {
  const slug = route.params.slug
  if (typeof slug !== 'string') return undefined
  return categories.find((c) => c.slug === slug)
})
</script>

<template>
  <div class="category-page" v-if="category">
    <section class="category-hero">
      <div class="container">
        <div class="category-hero-content">
          <div class="category-icon">{{ category.icon }}</div>
          <h1 class="category-hero-title">{{ category.name }}</h1>
          <p class="category-hero-subtitle">{{ category.tools.length }} tools in this category</p>
        </div>
      </div>
    </section>

    <section class="category-content">
      <div class="container">
        <div class="tools-grid">
          <RouterLink
            v-for="tool in category.tools"
            :key="tool.title"
            :to="tool.route || `/tools/${tool.slug}`"
            class="tool-card"
          >
            <div class="tool-card-icon">{{ tool.icon }}</div>
            <div class="tool-card-content">
              <h2 class="tool-card-title">{{ tool.title }}</h2>
              <p class="tool-card-description">{{ tool.description }}</p>
            </div>
          </RouterLink>
        </div>
      </div>
    </section>

    <div class="container">
      <RouterLink to="/tools" class="btn-back">← Back to all tools</RouterLink>
    </div>
  </div>

  <div v-else class="category-page">
    <div class="container not-found" style="padding: 160px 20px 60px; text-align: center;">
      <h1 style="font-size: 48px; font-weight: 800; color: #0f172a; margin-bottom: 16px;">Category not found</h1>
      <p style="font-size: 18px; color: #475569; margin-bottom: 32px;">The category you are looking for does not exist.</p>
      <RouterLink to="/tools" class="btn-back">← Back to all tools</RouterLink>
    </div>
  </div>
</template>

<style scoped>
.category-page {
  min-height: 100vh;
}

.category-hero {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 120px 20px 80px;
  text-align: center;
}

.category-hero-content {
  max-width: 800px;
  margin: 0 auto;
  position: relative;
  z-index: 1;
}

.category-icon {
  font-size: 60px;
  margin-bottom: 16px;
}

.category-hero-title {
  font-size: 40px;
  font-weight: 800;
  margin-bottom: 12px;
  letter-spacing: -0.02em;
}

.category-hero-subtitle {
  font-size: 18px;
  opacity: 0.9;
}

.category-content {
  padding: 60px 20px;
  background: linear-gradient(to bottom, #f8fafc, #f1f5f9);
}

.tools-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 24px;
}

.tool-card {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  border: 1px solid #e2e8f0;
  text-decoration: none;
  transition: all 0.2s ease;
}

.tool-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  border-color: #cbd5e1;
}

.tool-card-icon {
  font-size: 32px;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
  border-radius: 12px;
  flex-shrink: 0;
}

.tool-card-content {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
  min-width: 0;
}

.tool-card-title {
  font-size: 16px;
  font-weight: 700;
  color: #0f172a;
}

.tool-card-description {
  font-size: 14px;
  color: #475569;
  line-height: 1.6;
}

.btn-back {
  display: inline-flex;
  align-items: center;
  padding: 12px 24px;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 600;
  font-size: 14px;
  border: 1.5px solid #e2e8f0;
  color: #334155;
  margin-top: 24px;
  margin-bottom: 32px;
  transition: all 0.2s ease;
}

.btn-back:hover {
  border-color: #2563eb;
  color: #2563eb;
}

@media (max-width: 768px) {
  .category-hero {
    padding: 100px 20px 60px;
  }

  .category-hero-title {
    font-size: 28px;
  }

  .tools-grid {
    grid-template-columns: 1fr;
  }
}
</style>
