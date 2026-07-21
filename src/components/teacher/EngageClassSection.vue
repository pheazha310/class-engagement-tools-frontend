<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

interface EngageAction {
  id: string
  icon: string
  label: string
  color: string
  route?: string
}

const actions: EngageAction[] = [
  {
    id: 'live-vote',
    icon: '🗳️',
    label: 'Live Vote',
    color: '#667eea'
  },
  {
    id: 'create-quiz',
    icon: '📝',
    label: 'Create Quiz',
    color: '#9f7aea'
  },
  {
    id: 'groups',
    icon: '👥',
    label: 'Get Groups',
    color: '#48bb78'
  },
  {
    id: 'spin-wheel',
    icon: '🎡',
    label: 'Spin Wheel',
    color: '#ed8936'
  },
  {
    id: 'timer',
    icon: '⏱️',
    label: 'Start Timer',
    color: '#f56565'
  },
  {
    id: 'game',
    icon: '🎮',
    label: 'Launch Game',
    color: '#4299e1'
  }
]

const handleActionClick = (action: EngageAction) => {
  // Navigate or trigger action based on the action id
  console.log('Action clicked:', action.id)
}
</script>

<template>
  <div class="engage-section">
    <h2 class="section-title">Engage Your Class</h2>
    <div class="actions-grid">
      <button
        v-for="action in actions"
        :key="action.id"
        :class="['action-button', `color-${action.id}`]"
        :style="{ '--color': action.color }"
        @click="handleActionClick(action)"
      >
        <div class="action-icon">{{ action.icon }}</div>
        <div class="action-label">{{ action.label }}</div>
      </button>
    </div>
  </div>
</template>

<style scoped>
.engage-section {
  margin: 32px 0;
}

.section-title {
  font-size: 18px;
  font-weight: 700;
  color: #1a202c;
  margin: 0 0 20px 0;
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 16px;
}

.action-button {
  aspect-ratio: 1;
  background: var(--color);
  border: none;
  border-radius: 12px;
  padding: 16px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: white;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  text-decoration: none;
  font-family: inherit;
  font-weight: 600;
}

.action-button:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
}

.action-button:active {
  transform: translateY(-2px);
}

.action-icon {
  font-size: 32px;
}

.action-label {
  font-size: 13px;
  font-weight: 600;
  text-align: center;
  line-height: 1.2;
}

@media (max-width: 1200px) {
  .actions-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 768px) {
  .actions-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 480px) {
  .actions-grid {
    grid-template-columns: 1fr;
  }
}
</style>
