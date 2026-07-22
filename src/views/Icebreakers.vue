<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import Navbar from '@/components/Navbar.vue'

const activities = [
  {
    id: 1,
    title: 'Two Truths and One Lie',
    description: 'The classic social game reimagined for the digital classroom. Students share three statements about themselves and classmates guess which one is false.',
    icon: '🎯',
    color: '#6366f1',
    colorDark: '#4f46e5',
    bgColor: '#eef2ff',
  },
  {
    id: 2,
    title: 'Would You Rather',
    description: 'Provocative and fun dilemmas to spark lively classroom debate. Perfect for breaking the ice and getting to know your students better.',
    icon: '⚖️',
    color: '#8b5cf6',
    colorDark: '#7c3aed',
    bgColor: '#f5f3ff',
  },
  {
    id: 3,
    title: 'Spin the Question',
    description: 'A virtual wheel of thought-provoking questions to spark conversation and help students share about themselves in a fun way.',
    icon: '🔄',
    color: '#06b6d4',
    colorDark: '#0891b2',
    bgColor: '#ecfeff',
  },
  {
    id: 4,
    title: 'Random Challenge Generator',
    description: 'Quick 30-60 second challenges to boost energy and focus. Great for transitions between activities or waking up sleepy classes.',
    icon: '⚡',
    color: '#f59e0b',
    colorDark: '#d97706',
    bgColor: '#fffbeb',
  },
  {
    id: 5,
    title: 'Mystery Box',
    description: 'Hidden objects or prompts that reveal themselves based on student choice. Creates anticipation and excitement in the classroom.',
    icon: '📦',
    color: '#ec4899',
    colorDark: '#db2777',
    bgColor: '#fdf2f8',
  },
]

const stats = [
  { value: '12.4k', label: 'Activities Launched This Term' },
  { value: '94%', label: 'Engagement Rate Average' },
  { value: '15 Min', label: 'Average Session Time' },
]
</script>

<template>
  <div class="icebreakers-page">
    <Navbar />

    <!-- Module Header -->
    <section class="module-header">
      <div class="container">
        <div class="header-content">
          <div class="module-badge">
            <span class="module-number">Module 8</span>
          </div>
          <h1 class="module-title">Icebreaker Activities</h1>
          <p class="module-description">
            Quickly engage your students with these fun and interactive classroom icebreakers.
            Choose an activity to get started!
          </p>
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
              <span class="icon-emoji">{{ activity.icon }}</span>
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
                  v-else-if="activity.id === 3"
                  to="/tools/icebreakers/spin-the-question/results"
                  class="results-btn"
                  :style="{ backgroundColor: activity.color }"
                >
                  See Results
                </RouterLink>
                <RouterLink
                  v-else-if="activity.id === 4"
                  to="/tools/icebreakers/random-challenge-generator"
                  class="launch-btn"
                  :style="{ backgroundColor: activity.color }"
                >
                  Launch
                </RouterLink>
                <button
                  v-else
                  class="launch-btn"
                  :style="{ backgroundColor: activity.color }"
                >
                  Launch
                </button>
              </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Stats Section -->
    <section class="stats-section">
      <div class="container">
        <div class="stats-grid">
          <div v-for="stat in stats" :key="stat.label" class="stat-card">
            <div class="stat-value">{{ stat.value }}</div>
            <div class="stat-label">{{ stat.label }}</div>
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
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  line-height: 1.6;
  color: #1f2937;
  background: #f9fafb;
  min-height: 100vh;
  padding-top: 64px;
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
  width: 64px;
  height: 64px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
  color: white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
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
