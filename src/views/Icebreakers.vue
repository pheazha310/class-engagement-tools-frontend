<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink } from 'vue-router'

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
    <!-- Navigation Bar -->
    <nav class="navbar">
      <div class="nav-container">
        <div class="nav-logo">
          <RouterLink to="/" class="logo-link">
            <img src="@/assets/photo_logo.jpg" alt="Graduation" class="image" />
          </RouterLink>
        </div>

        <ul class="nav-menu">
          <li><RouterLink to="/" class="nav-link">Home</RouterLink></li>
          <li><RouterLink to="/about" class="nav-link">About</RouterLink></li>
          <li><RouterLink to="/" class="nav-link">Tools</RouterLink></li>
          <li><RouterLink to="/contact" class="nav-link">Contact</RouterLink></li>
        </ul>

        <div class="nav-buttons">
          <RouterLink to="/login" class="btn btn-login">Login</RouterLink>
          <RouterLink to="/register" class="btn btn-register">Register</RouterLink>
        </div>
      </div>
    </nav>

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
              <button class="launch-btn" :style="{ backgroundColor: activity.color }">
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

    <!-- Footer -->
    <footer class="footer">
      <div class="container">
        <div class="footer-content">
          <div class="footer-section">
            <div class="footer-logo">
              <span class="logo-icon">🎓</span>
              <span class="logo-text">ClassTools</span>
            </div>
            <p class="footer-description">Empowering educators with innovative classroom engagement tools.</p>
          </div>

          <div class="footer-section">
            <h4 class="footer-title">Product</h4>
            <ul class="footer-links">
              <li><RouterLink to="/">Features</RouterLink></li>
              <li><RouterLink to="/">Tools</RouterLink></li>
              <li><RouterLink to="/">Pricing</RouterLink></li>
            </ul>
          </div>

          <div class="footer-section">
            <h4 class="footer-title">Company</h4>
            <ul class="footer-links">
              <li><RouterLink to="/about">About</RouterLink></li>
              <li><RouterLink to="/contact">Contact</RouterLink></li>
              <li><RouterLink to="/">Careers</RouterLink></li>
            </ul>
          </div>

          <div class="footer-section">
            <h4 class="footer-title">Support</h4>
            <ul class="footer-links">
              <li><RouterLink to="/">Help Center</RouterLink></li>
              <li><RouterLink to="/">Documentation</RouterLink></li>
              <li><RouterLink to="/">Privacy Policy</RouterLink></li>
            </ul>
          </div>
        </div>

        <div class="footer-bottom">
          <p>&copy; 2024 ClassTools. All rights reserved.</p>
        </div>
      </div>
    </footer>
  </div>
</template>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.image {
  width: 180px;
  height: auto;
  display: block;
}

.icebreakers-page {
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

/* Buttons */
.btn {
  display: inline-block;
  padding: 12px 24px;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 600;
  font-size: 16px;
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-login {
  background: transparent;
  color: #6366f1;
  border: 1px solid #6366f1;
}

.btn-login:hover {
  background: #6366f1;
  color: white;
}

.btn-register {
  background: #6366f1;
  color: white;
}

.btn-register:hover {
  background: #4f46e5;
}

/* Navigation Bar */
.navbar {
  background: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 1000;
}

.nav-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 16px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.nav-logo {
  display: flex;
  align-items: center;
}

.logo-link {
  text-decoration: none;
}

.nav-menu {
  display: flex;
  list-style: none;
  gap: 32px;
}

.nav-link {
  color: #6b7280;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.3s ease;
}

.nav-link:hover {
  color: #6366f1;
}

.nav-buttons {
  display: flex;
  gap: 12px;
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
  border-radius: 16px;
  padding: 32px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  display: flex;
  flex-direction: column;
}

.activity-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
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
}

.icon-emoji {
  font-size: 32px;
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
}

.activity-description {
  color: #4b5563;
  font-size: 14px;
  line-height: 1.6;
  margin-bottom: 20px;
  flex: 1;
}

.launch-btn {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  color: white;
  font-weight: 600;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  align-self: flex-start;
}

.launch-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

/* Stats Section */
.stats-section {
  padding: 60px 20px 80px;
  background: white;
}

/* Footer */
.footer {
  background: #1f2937;
  color: white;
  padding: 60px 20px 20px;
}

.footer-content {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr;
  gap: 48px;
  margin-bottom: 40px;
}

.footer-logo {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 16px;
}

.logo-icon {
  font-size: 24px;
}

.footer-description {
  color: #9ca3af;
  font-size: 14px;
  line-height: 1.6;
}

.footer-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 16px;
}

.footer-links {
  list-style: none;
}

.footer-links li {
  margin-bottom: 8px;
}

.footer-links a {
  color: #9ca3af;
  text-decoration: none;
  font-size: 14px;
  transition: color 0.3s ease;
}

.footer-links a:hover {
  color: white;
}

.footer-bottom {
  border-top: 1px solid #374151;
  padding-top: 20px;
  text-align: center;
  color: #9ca3af;
  font-size: 14px;
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
  .nav-menu {
    display: none;
  }

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

  .footer-content {
    grid-template-columns: 1fr;
    gap: 32px;
  }
}

@media (max-width: 480px) {
  .nav-buttons {
    gap: 8px;
  }

  .btn {
    padding: 10px 16px;
    font-size: 14px;
  }

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
