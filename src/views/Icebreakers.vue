<script setup lang="ts">
import { RouterLink } from 'vue-router'
import Navbar from '@/components/Navbar.vue'
import ToolIcon from '@/components/ToolIcon.vue'

const activities = [
  {
    id: 1,
    title: 'Two Truths and One Lie',
    description: 'The classic social game reimagined for the digital classroom. Students share three statements about themselves and classmates guess which one is false.',
    icon: 'gamepad',
    color: '#6366f1',
    colorDark: '#4f46e5',
    bgColor: '#eef2ff',
  },
  {
    id: 2,
    title: 'Would You Rather',
    description: 'Provocative and fun dilemmas to spark lively classroom debate. Perfect for breaking the ice and getting to know your students better.',
    icon: 'brain',
    color: '#8b5cf6',
    colorDark: '#7c3aed',
    bgColor: '#f5f3ff',
  },
  {
    id: 4,
    title: 'Random Challenge Generator',
    description: 'Quick 30-60 second challenges to boost energy and focus. Great for transitions between activities or waking up sleepy classes.',
    icon: 'timer',
    color: '#f59e0b',
    colorDark: '#d97706',
    bgColor: '#fffbeb',
  },
  {
    id: 5,
    title: 'Mystery Box',
    description: 'Hidden objects or prompts that reveal themselves based on student choice. Creates anticipation and excitement in the classroom.',
    icon: 'book',
    color: '#ec4899',
    colorDark: '#db2777',
    bgColor: '#fdf2f8',
  },
]
</script>

<template>
  <div class="icebreakers-page">
    <Navbar />

    <!-- Module Header -->
    <section class="module-header">
      <div class="container">
        <div class="header-content">
          <h1 class="module-title">Icebreaker Activities</h1>
          <p class="module-description">
            Quickly engage your students with these fun and interactive classroom icebreakers.
            Choose an activity to get started!
          </p>
          <RouterLink to="/tools" class="btn-back">← Back to all tools</RouterLink>
        </div>
      </div>
    </section>

    <!-- Activities Grid -->
    <section class="activities-section">
      <div class="container">
        <div class="activities-grid">
          <div
            v-for="activity in activities"
            :key="activity.id"
            class="activity-card"
            :style="{ backgroundColor: activity.bgColor }"
          >
            <div class="activity-icon" :style="{ backgroundColor: activity.color }">
              <ToolIcon :name="activity.icon" :size="36" />
            </div>
            <div class="activity-content">
              <h3 class="activity-title">{{ activity.title }}</h3>
              <p class="activity-description">{{ activity.description }}</p>
              <RouterLink
                v-if="activity.id === 1"
                to="/tools/icebreakers/two-truths-one-lie"
                class="launch-btn"
                :style="{ backgroundColor: activity.color }"
              >
                Launch
              </RouterLink>
              <RouterLink
                v-else-if="activity.id === 2"
                to="/tools/icebreakers/would-you-rather"
                class="launch-btn"
                :style="{ backgroundColor: activity.color }"
              >
                Launch
              </RouterLink>
              <RouterLink
                v-else-if="activity.id === 4"
                to="/tools/icebreakers/random-challenge-generator"
                class="launch-btn"
                :style="{ backgroundColor: activity.color }"
              >
                Launch
              </RouterLink>
              <RouterLink
                v-else-if="activity.id === 5"
                to="/tools/icebreakers/mystery-box"
                class="launch-btn"
                :style="{ backgroundColor: activity.color }"
              >
                Launch
              </RouterLink>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.icebreakers-page {
  margin-top: 60px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  line-height: 1.6;
  color: #1f2937;
  background: #f9fafb;
  min-height: 100vh;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

/* Module Header */
.module-header {
  background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
  color: white;
  padding: 80px 20px;
  text-align: center;
}

.header-content {
  max-width: 800px;
  margin: 0 auto;
}

.module-badge {
  display: inline-block;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  padding: 8px 20px;
  border-radius: 20px;
  margin-bottom: 24px;
}

.module-number {
  font-size: 14px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.module-title {
  font-size: 48px;
  font-weight: 800;
  margin-bottom: 24px;
  line-height: 1.2;
}

.module-description {
  font-size: 18px;
  opacity: 0.9;
  line-height: 1.6;
}

.btn-back {
  display: inline-flex;
  align-items: center;
  padding: 10px 20px;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 600;
  font-size: 14px;
  border: 1.5px solid rgba(255, 255, 255, 0.3);
  color: rgba(255, 255, 255, 0.9);
  transition: all 0.2s ease;
  margin-top: 16px;
}

.btn-back:hover {
  border-color: #22d3ee;
  color: #22d3ee;
}

/* Activities Section */
.activities-section {
  padding: 80px 20px;
}

.activities-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 24px;
}

.activity-card {
  border-radius: 20px;
  padding: 32px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  display: flex;
  flex-direction: column;
  border: 1px solid rgba(0, 0, 0, 0.04);
}

.activity-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.12);
}

.activity-icon {
  width: 80px;
  height: 80px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.25);
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  position: relative;
  overflow: hidden;
  animation: iconFloat 3s ease-in-out infinite;
  background: white;
}

.activity-icon::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.4));
  opacity: 0.3;
  border-radius: 20px;
}

.activity-icon::after {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.6) 0%, transparent 60%);
  opacity: 0.8;
  border-radius: 20px;
}

@keyframes iconFloat {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50% { transform: translateY(-8px) rotate(3deg); }
}

.activity-card:hover .activity-icon {
  transform: translateY(-10px) scale(1.12) rotate(-5deg);
  box-shadow: 0 16px 36px rgba(0, 0, 0, 0.35);
  animation-play-state: paused;
}

.tool-icon {
  position: relative;
  z-index: 2;
  filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.25));
  transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.activity-card:hover .tool-icon {
  transform: scale(1.1) rotate(-8deg);
}

.activity-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.activity-title {
  font-size: 22px;
  font-weight: 700;
  margin-bottom: 12px;
  color: #1f2937;
  line-height: 1.3;
}

.activity-description {
  color: #4b5563;
  font-size: 14px;
  line-height: 1.7;
  margin-bottom: 24px;
  flex: 1;
}

.launch-btn,
.results-btn {
  padding: 12px 24px;
  border: none;
  border-radius: 10px;
  color: white;
  font-weight: 600;
  font-size: 15px;
  cursor: pointer;
  transition: all 0.3s ease;
  align-self: flex-start;
  text-decoration: none;
  display: inline-block;
}

.launch-btn:hover,
.results-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
}

.activities-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 24px;
}

@media (max-width: 768px) {
  .activities-grid {
    grid-template-columns: 1fr;
  }
}

/* Stats Section */
.stats-section {
  padding: 60px 20px 80px;
  background: white;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 24px;
  max-width: 900px;
  margin: 0 auto;
}

.stat-card {
  text-align: center;
  padding: 32px 24px;
  background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
  border-radius: 16px;
  color: white;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
}

.stat-value {
  font-size: 36px;
  font-weight: 800;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 14px;
  opacity: 0.9;
  line-height: 1.4;
}

/* Responsive Design */
@media (max-width: 768px) {
  .module-title {
    font-size: 32px;
  }

  .module-description {
    font-size: 16px;
  }

  .activities-grid {
    grid-template-columns: 1fr;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .stat-value {
    font-size: 28px;
  }
}

@media (max-width: 480px) {
  .module-header {
    padding: 60px 20px;
  }

  .module-title {
    font-size: 28px;
  }

  .activities-section {
    padding: 40px 20px;
  }

  .activity-card {
    padding: 24px;
  }
}
</style>