<script setup lang="ts">
import { computed, ref, onMounted, onBeforeUnmount } from 'vue'
import { RouterLink } from 'vue-router'
import { categories } from '@/data/toolsData'
import ToolIcon from '@/components/ToolIcon.vue'

const groupedTools = computed(() => categories)

const observer = ref<IntersectionObserver | null>(null)

onMounted(() => {
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
  <div class="all-tools-page">
    <section class="tools-hero">
      <div class="hero-orb hero-orb--1" />
      <div class="hero-orb hero-orb--2" />
      <div class="hero-grid" />
      <div class="container">
        <span class="hero-eyebrow reveal">TOOLS</span>
        <h1 class="tools-hero-title reveal">All Tools</h1>
        <p class="tools-hero-subtitle reveal">
          Explore our complete collection of classroom engagement tools designed to enhance student participation and learning outcomes.
        </p>
      </div>
    </section>

    <section class="tools-content">
      <div class="container">
        <div class="categories-grid">
          <div class="category-card reveal" v-for="(category, idx) in groupedTools" :key="category.name" :style="{ transitionDelay: `${idx * 0.08}s` }">
            <div class="category-card-inner">
              <h3 class="category-title">
                <span class="category-icon"><ToolIcon :name="category.icon" :size="22" /></span>
                <span>{{ category.name }}</span>
              </h3>
              <div class="category-tools">
                <RouterLink
                  v-for="tool in category.tools"
                  :key="tool.title"
                  :to="tool.route || `/tools/${tool.slug}`"
                  class="category-tool-link"
                >
                  <span class="category-tool-icon"><ToolIcon :name="tool.icon" :size="22" /></span>
                  <div class="category-tool-content">
                    <span class="category-tool-title">{{ tool.title }}</span>
                    <span class="category-tool-desc">{{ tool.description }}</span>
                  </div>
                </RouterLink>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
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

.all-tools-page {
  min-height: 100vh;
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

/* Hero */
.tools-hero {
  background: linear-gradient(135deg, #001f9e 0%, #2547bc 50%, #3b5bf6 100%);
  color: white;
  padding: 120px 20px 100px;
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
  background-size: 64px 64px;
  mask-image: radial-gradient(ellipse 80% 60% at 50% 50%, black 40%, transparent 100%);
  pointer-events: none;
  animation: gridDrift 20s linear infinite;
}

.hero-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(70px);
  pointer-events: none;
  opacity: 0.2;
}

.hero-orb--1 {
  width: 420px;
  height: 420px;
  background: #ffffff;
  top: -120px;
  left: -80px;
  animation: orbFloat 10s ease-in-out infinite alternate;
}

.hero-orb--2 {
  width: 360px;
  height: 360px;
  background: #93c5fd;
  bottom: -120px;
  right: -60px;
  animation: orbFloat 12s ease-in-out infinite alternate-reverse;
}

@keyframes orbFloat {
  from { transform: translate(0, 0) scale(1); }
  to { transform: translate(32px, -28px) scale(1.08); }
}

@keyframes gridDrift {
  from { transform: translate(0, 0); }
  to { transform: translate(64px, 64px); }
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

.tools-hero-title {
  font-size: 52px;
  font-weight: 830;
  margin-bottom: 20px;
  letter-spacing: -0.03em;
  line-height: 1.1;
}

.tools-hero-subtitle {
  font-size: 18px;
  opacity: 0.95;
  max-width: 700px;
  margin: 0 auto;
  line-height: 1.7;
}

/* Tools */
.tools-content {
  padding: 80px 20px;
  background: linear-gradient(to bottom, #f8fafc, #f1f5f9);
}

.categories-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 24px;
}

.category-card {
  background: white;
  border-radius: 20px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04);
  overflow: hidden;
  transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
}

.category-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 22px 42px rgba(0, 31, 158, 0.12);
  border-color: #cbd5e1;
}

.category-card-inner {
  padding: 28px;
}

.category-title {
  font-size: 20px;
  font-weight: 800;
  color: #0f172a;
  margin-bottom: 18px;
  padding-bottom: 14px;
  border-bottom: 2px solid #e2e8f0;
  display: flex;
  align-items: center;
  gap: 10px;
  letter-spacing: -0.01em;
}

.category-icon {
  font-size: 28px;
}

.category-tools {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.category-tool-link {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 14px;
  border-radius: 14px;
  text-decoration: none;
  color: #1e293b;
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  border: 1px solid transparent;
  background: transparent;
  position: relative;
}

.category-tool-link::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.06), rgba(139, 92, 246, 0.06));
  opacity: 0;
  transition: opacity 0.25s ease;
  border-radius: 14px;
}

.category-tool-link:hover {
  transform: translateX(6px);
  border-color: #e2e8f0;
  background: white;
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.04);
}

.category-tool-link:hover::before {
  opacity: 1;
}

.category-tool-icon {
  font-size: 24px;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f5f7ff 0%, #e5ecff 55%, #f5edff 100%);
  border-radius: 12px;
  border: 1px solid rgba(129, 140, 248, 0.12);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.9), 0 5px 12px rgba(99, 102, 241, 0.09);
  flex-shrink: 0;
  transition: transform 0.25s ease;
  position: relative;
}

.category-tool-link:hover .category-tool-icon {
  transform: scale(1.08) rotate(3deg);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.95), 0 8px 18px rgba(99, 102, 241, 0.18);
}

.category-tool-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
  flex: 1;
  position: relative;
}

.category-tool-title {
  font-weight: 700;
  font-size: 15px;
  color: #0f172a;
  letter-spacing: -0.01em;
}

.category-tool-desc {
  font-size: 13px;
  color: #64748b;
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-orientation: vertical;
  overflow: hidden;
}

@media (max-width: 768px) {
  .tools-hero {
    padding: 110px 20px 80px;
  }

  .tools-hero-title {
    font-size: 36px;
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
