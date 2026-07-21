<script setup lang="ts">
interface PollOption {
  label: string
  percentage: number
}

interface LivePoll {
  title: string
  question: string
  options: PollOption[]
  responses: number
}

defineProps<{
  poll: LivePoll
}>()
</script>

<template>
  <div class="live-poll">
    <div class="poll-header">
      <h3 class="poll-title">{{ poll.title }}</h3>
      <div class="poll-badge">Live</div>
    </div>

    <div class="poll-question">{{ poll.question }}</div>

    <div class="options-container">
      <div v-for="(option, index) in poll.options" :key="index" class="poll-option">
        <div class="option-label-row">
          <span class="option-label">{{ option.label }}</span>
          <span class="option-percentage">{{ option.percentage }}%</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: option.percentage + '%' }"></div>
        </div>
      </div>
    </div>

    <div class="poll-footer">
      <span class="response-count">{{ poll.responses }} responses</span>
    </div>
  </div>
</template>

<style scoped>
.live-poll {
  background: white;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  border: 1px solid #e2e8f0;
}

.poll-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.poll-title {
  font-size: 16px;
  font-weight: 700;
  color: #1a202c;
  margin: 0;
}

.poll-badge {
  display: inline-block;
  background: #48bb78;
  color: white;
  font-size: 12px;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 12px;
}

.poll-question {
  font-size: 14px;
  font-weight: 600;
  color: #2d3748;
  margin-bottom: 20px;
  line-height: 1.5;
}

.options-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 20px;
}

.poll-option {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.option-label-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.option-label {
  font-size: 13px;
  font-weight: 500;
  color: #2d3748;
}

.option-percentage {
  font-size: 13px;
  font-weight: 700;
  color: #667eea;
}

.progress-bar {
  height: 8px;
  background: #e2e8f0;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
  transition: width 0.3s ease;
  border-radius: 4px;
}

.poll-footer {
  padding-top: 16px;
  border-top: 1px solid #e2e8f0;
}

.response-count {
  font-size: 12px;
  color: #718096;
  font-weight: 500;
}

@media (max-width: 768px) {
  .live-poll {
    padding: 16px;
  }

  .poll-question {
    font-size: 13px;
  }
}
</style>
