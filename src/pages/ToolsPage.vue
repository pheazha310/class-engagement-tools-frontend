<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { categories, allTools } from '@/data/toolsData'
import Navbar from '@/components/Navbar.vue'

const groupedTools = computed(() => categories)
</script>

<template>
  <div class="tools-page">
    <Navbar />

    <section class="tools-hero" style="padding-top: 120px;">
      <div class="container">
        <h1 class="tools-hero-title">All Tools</h1>
        <p class="tools-hero-subtitle">
          Explore our complete collection of classroom engagement tools designed to enhance student participation and learning outcomes.
        </p>
      </div>
    </section>

    <section class="tools-content">
      <div class="container">
        <div class="categories-grid">
          <div class="category-card" v-for="category in groupedTools" :key="category.name">
            <h3 class="category-title">{{ category.icon }} {{ category.name }}</h3>
            <div class="category-tools">
              <RouterLink
                v-for="tool in category.tools"
                :key="tool.title"
                :to="tool.route || `/tools/${tool.slug}`"
                class="category-tool-link"
              >
                <span class="category-tool-icon">{{ tool.icon }}</span>
                <div class="category-tool-content">
                  <span class="category-tool-title">{{ tool.title }}</span>
                  <span class="category-tool-desc">{{ tool.description }}</span>
                </div>
              </RouterLink>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.tools-page {
  min-height: 100vh;
}

.tools-hero {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 120px 20px 80px;
  text-align: center;
}

.tools-hero-title {
  font-size: 48px;
  font-weight: 800;
  margin-bottom: 16px;
  letter-spacing: -0.02em;
}

.tools-hero-subtitle {
  font-size: 18px;
  opacity: 0.95;
  max-width: 700px;
  margin: 0 auto;
  line-height: 1.6;
}

.tools-content {
  padding: 60px 20px;
  background: linear-gradient(to bottom, #f8fafc, #f1f5f9);
}

.categories-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 24px;
}

.category-card {
  background: white;
  border-radius: 16px;
  padding: 28px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  border: 1px solid #e2e8f0;
  transition: all 0.3s ease;
}

.category-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.12);
  border-color: #cbd5e1;
}

.category-title {
  font-size: 20px;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 20px;
  padding-bottom: 14px;
  border-bottom: 2px solid #e2e8f0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.category-tools {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.category-tool-link {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px;
  border-radius: 10px;
  text-decoration: none;
  color: #1e293b;
  transition: all 0.2s ease;
  border: 1px solid transparent;
}

.category-tool-link:hover {
  background: #f8fafc;
  border-color: #e2e8f0;
  transform: translateX(4px);
}

.category-tool-icon {
  font-size: 24px;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
  border-radius: 10px;
  flex-shrink: 0;
}

.category-tool-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  flex: 1;
}

.category-tool-title {
  font-weight: 600;
  font-size: 15px;
  color: #0f172a;
}

.category-tool-desc {
  font-size: 13px;
  color: #64748b;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

@media (max-width: 768px) {
  .tools-hero {
    padding: 100px 20px 60px;
  }

  .tools-hero-title {
    font-size: 32px;
  }

  .tools-hero-subtitle {
    font-size: 16px;
  }

  .categories-grid {
    grid-template-columns: 1fr;
  }
}

@media (min-width: 769px) and (max-width: 1024px) {
  .categories-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
