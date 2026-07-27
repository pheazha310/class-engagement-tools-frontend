<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { computed } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { categories } from '@/data/toolsData'
import ToolIcon from '@/components/ToolIcon.vue'

const route = useRoute()

const category = computed(() => {
  const slug = route.params.slug
  if (typeof slug !== 'string') return undefined
  return categories.find((c) => c.slug === slug)
})

const observer = ref<IntersectionObserver | null>(null)

onMounted(async () => {
  await nextTick()
  observer.value = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view')
        }
      })
    },
    { threshold: 0.08, rootMargin: '0px 0px -40px 0px' },
  )

  document.querySelectorAll('.reveal').forEach((el) => observer.value?.observe(el))
})

onBeforeUnmount(() => {
  observer.value?.disconnect()
})
</script>

<template>
  <div class="category-page" v-if="category">
    <section class="category-hero">
      <div class="hero-orb hero-orb--1" />
      <div class="hero-orb hero-orb--2" />
      <div class="hero-grid" />
      <div class="container">
        <div class="category-hero-content">
          <span class="hero-eyebrow reveal">CATEGORY</span>
          <div class="category-icon reveal"><ToolIcon :name="category.icon" :size="60" /></div>
          <h1 class="category-hero-title reveal">{{ category.name }}</h1>
          <p class="category-hero-subtitle reveal">{{ category.tools.length }} tools in this category</p>
        </div>
      </div>
    </section>

    <section class="category-content">
      <div class="container">
      <div class="tools-grid">
        <RouterLink
          v-for="(tool, idx) in category.tools"
          :key="tool.title"
          :to="tool.route || `/tools/${tool.slug}`"
          class="tool-card"
          :style="{ animationDelay: `${idx * 0.1}s` }"
        >
          <div class="tool-card-icon"><ToolIcon :name="tool.icon" :size="28" /></div>
          <div class="tool-card-content">
            <h2 class="tool-card-title">{{ tool.title }}</h2>
            <p class="tool-card-description">{{ tool.description }}</p>
          </div>
        </RouterLink>
      </div>

        <RouterLink to="/tools" class="btn-back reveal">← Back to all tools</RouterLink>
      </div>
    </section>
  </div>

  <div v-else class="category-page">
    <div class="container not-found">
      <h1>Category not found</h1>
      <p>The category you are looking for does not exist.</p>
      <RouterLink to="/tools" class="btn-back">← Back to all tools</RouterLink>
    </div>
  </div>
</template>

<style scoped>
.reveal {
  opacity: 0;
  transform: translateY(28px);
  transition: opacity 0.75s cubic-bezier(0.16, 1, 0.3, 1), transform 0.75s cubic-bezier(0.16, 1, 0.3, 1);
}

.reveal.in-view {
  opacity: 1;
  transform: translateY(0);
}

.category-page {
  min-height: 100vh;
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

.category-hero {
  background: linear-gradient(135deg, #001f9e 0%, #2547bc 50%, #3b5bf6 100%);
  color: white;
  padding: 110px 20px 90px;
  text-align: center;
  position: relative;
  overflow: hidden;
}

.hero-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(70px);
  pointer-events: none;
  opacity: 0.2;
}

.hero-orb--1 {
  width: 340px;
  height: 340px;
  background: #ffffff;
  top: -100px;
  left: -60px;
  animation: orbFloat 10s ease-in-out infinite alternate;
}

.hero-orb--2 {
  width: 280px;
  height: 280px;
  background: #93c5fd;
  bottom: -80px;
  right: -40px;
  animation: orbFloat 12s ease-in-out infinite alternate-reverse;
}

.hero-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px);
  background-size: 64px 64px;
  mask-image: radial-gradient(ellipse 80% 60% at 50% 50%, black 40%, transparent 100%);
  pointer-events: none;
  animation: gridDrift 20s linear infinite;
}

@keyframes orbFloat {
  from { transform: translate(0, 0) scale(1); }
  to { transform: translate(32px, -28px) scale(1.08); }
}

@keyframes gridDrift {
  from { transform: translate(0, 0); }
  to { transform: translate(64px, 64px); }
}

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.category-hero-content {
  max-width: 800px;
  margin: 0 auto;
  position: relative;
  z-index: 1;
}

.hero-eyebrow {
  display: inline-block;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.14em;
  padding: 7px 16px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.16);
  color: rgba(255, 255, 255, 0.95);
  margin-bottom: 20px;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.category-icon {
  font-size: 60px;
  margin-bottom: 14px;
}

.category-hero-title {
  font-size: 40px;
  font-weight: 830;
  margin-bottom: 12px;
  letter-spacing: -0.02em;
  line-height: 1.15;
}

.category-hero-subtitle {
  font-size: 18px;
  opacity: 0.9;
  line-height: 1.7;
}

.category-content {
  padding: 70px 20px;
  background: linear-gradient(to bottom, #f8fafc, #f1f5f9);
}

.tools-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 24px;
  margin-bottom: 24px;
}

.tool-card {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  background: white;
  border-radius: 18px;
  padding: 22px;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04);
  border: 1px solid #e2e8f0;
  text-decoration: none;
  transition: all 0.32s cubic-bezier(0.16, 1, 0.3, 1);
  animation: fadeInUp 0.55s cubic-bezier(0.16, 1, 0.3, 1) both;
}

.tool-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 20px 40px rgba(0, 31, 158, 0.12);
  border-color: #cbd5e1;
}

.tool-card-icon {
  font-size: 32px;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%);
  border-radius: 14px;
  flex-shrink: 0;
  transition: transform 0.3s ease;
}

.tool-card:hover .tool-card-icon {
  transform: scale(1.08) rotate(-3deg);
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
  font-weight: 800;
  color: #0f172a;
  letter-spacing: -0.01em;
}

.tool-card-description {
  font-size: 14px;
  color: #64748b;
  line-height: 1.6;
}

.btn-back {
  display: inline-flex;
  align-items: center;
  padding: 12px 24px;
  border-radius: 10px;
  text-decoration: none;
  font-weight: 600;
  font-size: 14px;
  border: 1.5px solid #e2e8f0;
  color: #334155;
  transition: all 0.25s ease;
}

.btn-back:hover {
  border-color: #2563eb;
  color: #2563eb;
  transform: translateY(-1px);
}

.not-found {
  padding: 140px 20px 60px;
  text-align: center;
}

.not-found h1 {
  font-size: 40px;
  font-weight: 830;
  color: #0f172a;
  margin-bottom: 16px;
  letter-spacing: -0.02em;
}

.not-found p {
  font-size: 18px;
  color: #475569;
  margin-bottom: 32px;
}

@media (max-width: 768px) {
  .category-hero {
    padding: 110px 20px 70px;
  }

  .category-hero-title {
    font-size: 30px;
  }

  .category-hero-subtitle {
    font-size: 16px;
  }

  .tools-grid {
    grid-template-columns: 1fr;
  }

  .category-content {
    padding: 50px 18px;
  }
}

@media (min-width: 769px) and (max-width: 1024px) {
  .tools-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
