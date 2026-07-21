<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import Navbar from '@/components/Navbar.vue'

const results = ref([
  { id: 1, question: 'If you could have dinner with any historical figure, who would it be and why?', spins: 24, topAnswer: 'Albert Einstein', time: '2 min ago', student: 'Alex Rivera' },
])
</script>

<template>
  <div class="results-page">
    <Navbar />

    <section class="results-header">
      <div class="container">
        <div class="header-content">
          <RouterLink to="/tools/icebreakers" class="back-link">← Back to Icebreakers</RouterLink>
          <h1 class="results-title">Spin the Question - Selected State</h1>
        </div>
      </div>
    </section>

    <section class="results-content">
      <div class="container">
        <div class="content-wrapper">
          <div class="main-area">
            <div class="selected-card">
              <div class="selected-badge">Selection Confirmed</div>
              <h2 class="selected-question">{{ results[0]?.question }}</h2>
              <div class="action-buttons">
                <RouterLink to="/tools/icebreakers/spin-the-question" class="btn-next-student">
                  Next Student
                  <span class="arrow">→</span>
                </RouterLink>
                <RouterLink to="/tools/icebreakers/spin-the-question" class="btn-spin-again">
                  <span class="icon">🔄</span>
                  Spin Again
                </RouterLink>
              </div>
              <div class="session-info">
                <div class="info-item">
                  <span class="info-label">TIME LIMIT</span>
                  <span class="info-value">02:00</span>
                </div>
                <div class="info-item">
                  <span class="info-label">QUEUE</span>
                  <span class="info-value">14/28</span>
                </div>
              </div>
            </div>

            <div class="discussion-card">
              <div class="discussion-header">
                <span class="discussion-icon">💬</span>
                <span class="discussion-title">Discussion Live</span>
              </div>
              <div class="engagement-section">
                <h3 class="engagement-title">Active Engagement</h3>
                <p class="student-name">Current student: <strong>Alex Rivera</strong> is explaining their choice.</p>
                <p class="encouragement">Encourage classmates to use the "Pass the Mic" feature if they have a similar answer.</p>
                <div class="engagement-actions">
                  <button class="btn-engage">
                    <span class="icon">⏸️</span>
                  </button>
                  <button class="btn-engage">
                    <span class="icon">⏺️</span>
                  </button>
                  <button class="btn-engage">
                    <span class="icon">✏️</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div class="sidebar">
            <div class="teacher-guide-card">
              <h3 class="sidebar-title">
                <span class="icon">👨‍🏫</span>
                Teacher's Guide
              </h3>
              <ul class="guide-list">
                <li>Allow 2-3 minutes for the student to elaborate on their choice.</li>
                <li>Ask follow-up questions to the rest of the class.</li>
              </ul>
              <RouterLink to="/tools/icebreakers/spin-the-question" class="btn-new-session">
                Start New Session
              </RouterLink>
            </div>

            <div class="followup-card">
              <h3 class="sidebar-title">
                <span class="icon">💡</span>
                Follow-up Ideas
              </h3>
              <div class="followup-list">
                <div class="followup-item">
                  <span class="followup-icon">💬</span>
                  <p class="followup-text">"What would be the first question you ask them at this dinner?"</p>
                </div>
                <div class="followup-item">
                  <span class="followup-icon">💭</span>
                  <p class="followup-text">"What kind of food do you think they would prefer?"</p>
                </div>
              </div>
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

.results-page {
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

.results-header {
  background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
  color: white;
  padding: 60px 20px;
}

.header-content {
  max-width: 800px;
  margin: 0 auto;
}

.back-link {
  display: inline-block;
  color: rgba(255, 255, 255, 0.9);
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 20px;
  transition: color 0.3s ease;
}

.back-link:hover {
  color: white;
}

.results-title {
  font-size: 42px;
  font-weight: 800;
  line-height: 1.2;
}

.results-content {
  padding: 60px 20px;
}

.content-wrapper {
  display: grid;
  grid-template-columns: 1fr 380px;
  gap: 32px;
  align-items: start;
}

.main-area {
  min-width: 0;
}

.selected-card {
  background: white;
  border-radius: 16px;
  padding: 40px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  text-align: center;
  margin-bottom: 24px;
}

.selected-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  padding: 8px 20px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 24px;
}

.selected-question {
  font-size: 28px;
  font-weight: 700;
  color: #1f2937;
  line-height: 1.4;
  margin-bottom: 32px;
  padding: 0 20px;
}

.action-buttons {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-bottom: 24px;
}

.btn-next-student {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 14px 32px;
  background: #6366f1;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.3s ease;
}

.btn-next-student:hover {
  background: #4f46e5;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
}

.btn-next-student .arrow {
  font-size: 18px;
}

.btn-spin-again {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 14px 32px;
  background: white;
  color: #6366f1;
  border: 2px solid #6366f1;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.3s ease;
}

.btn-spin-again:hover {
  background: #6366f1;
  color: white;
}

.btn-spin-again .icon {
  font-size: 20px;
}

.session-info {
  display: flex;
  justify-content: center;
  gap: 48px;
  padding-top: 24px;
  border-top: 1px solid #e5e7eb;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: center;
}

.info-label {
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.info-value {
  font-size: 24px;
  font-weight: 800;
  color: #6366f1;
}

.discussion-card {
  background: white;
  border-radius: 16px;
  padding: 32px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.discussion-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
}

.discussion-icon {
  font-size: 24px;
}

.discussion-title {
  font-size: 20px;
  font-weight: 700;
  color: #1f2937;
}

.engagement-section {
  border-top: 1px solid #f3f4f6;
  padding-top: 24px;
}

.engagement-title {
  font-size: 18px;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 16px;
}

.student-name {
  font-size: 14px;
  color: #4b5563;
  margin-bottom: 8px;
}

.encouragement {
  font-size: 14px;
  color: #6b7280;
  margin-bottom: 24px;
  line-height: 1.6;
}

.engagement-actions {
  display: flex;
  gap: 12px;
}

.btn-engage {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  background: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.btn-engage:hover {
  background: #f9fafb;
  border-color: #6366f1;
}

.btn-engage .icon {
  font-size: 20px;
}

.sidebar {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.teacher-guide-card {
  background: white;
  border-radius: 16px;
  padding: 32px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border-left: 4px solid #6366f1;
}

.sidebar-title {
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 20px;
  color: #1f2937;
  display: flex;
  align-items: center;
  gap: 10px;
}

.sidebar-title .icon {
  font-size: 24px;
}

.guide-list {
  list-style: none;
  padding: 0;
  margin-bottom: 24px;
}

.guide-list li {
  padding: 12px 0;
  padding-left: 28px;
  position: relative;
  color: #4b5563;
  line-height: 1.6;
  border-bottom: 1px solid #f3f4f6;
  font-size: 14px;
}

.guide-list li:last-child {
  border-bottom: none;
}

.guide-list li::before {
  content: '•';
  position: absolute;
  left: 8px;
  color: #6366f1;
  font-weight: bold;
  font-size: 20px;
}

.btn-new-session {
  display: block;
  width: 100%;
  padding: 12px 20px;
  background: #6366f1;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  text-decoration: none;
  text-align: center;
  transition: all 0.3s ease;
}

.btn-new-session:hover {
  background: #4f46e5;
}

.followup-card {
  background: white;
  border-radius: 16px;
  padding: 32px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border-left: 4px solid #f59e0b;
}

.followup-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.followup-item {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  padding: 12px;
  background: #f9fafb;
  border-radius: 8px;
  border-left: 3px solid #f59e0b;
}

.followup-icon {
  font-size: 20px;
  flex-shrink: 0;
}

.followup-text {
  font-size: 14px;
  color: #4b5563;
  line-height: 1.5;
  margin: 0;
}

@media (max-width: 1024px) {
  .content-wrapper {
    grid-template-columns: 1fr;
  }

  .sidebar {
    order: -1;
  }
}

@media (max-width: 768px) {
  .results-title {
    font-size: 32px;
  }

  .selected-question {
    font-size: 22px;
  }

  .action-buttons {
    flex-direction: column;
  }

  .btn-next-student,
  .btn-spin-again {
    width: 100%;
    justify-content: center;
  }

  .session-info {
    gap: 24px;
  }
}

@media (max-width: 480px) {
  .results-header {
    padding: 40px 20px;
  }

  .results-title {
    font-size: 28px;
  }

  .results-content {
    padding: 40px 20px;
  }

  .selected-card {
    padding: 24px;
  }

  .discussion-card {
    padding: 24px;
  }

  .teacher-guide-card,
  .followup-card {
    padding: 24px;
  }
}
</style>
