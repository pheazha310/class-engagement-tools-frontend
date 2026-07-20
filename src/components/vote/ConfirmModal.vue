<script setup lang="ts">
import { ref, watch } from 'vue'

const props = withDefaults(
  defineProps<{
    show: boolean
    selectedLabel: string
    questionType?: 'single' | 'multiple'
    selectedCount?: number
    loading?: boolean
  }>(),
  {
    questionType: 'single',
    selectedCount: 1,
    loading: false,
  },
)

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()

const visible = ref(false)

watch(
  () => props.show,
  (val) => {
    if (val) {
      visible.value = true
    } else {
      setTimeout(() => {
        visible.value = false
      }, 200)
    }
  },
)
</script>

<template>
  <Teleport to="body">
    <Transition name="vm-modal-fade">
      <div v-if="show" class="vm-modal-overlay" @click.self="emit('cancel')">
        <Transition name="vm-modal-scale" appear>
          <div v-if="visible" class="vm-modal" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
            <!-- Header -->
            <div class="vm-modal-header">
              <div class="vm-modal-icon-wrap vm-modal-icon-wrap--info">
                <svg class="vm-modal-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 16v-4" />
                  <path d="M12 8h.01" />
                </svg>
              </div>
              <h3 id="confirm-title" class="vm-modal-title">
                {{ questionType === 'multiple' ? 'Submit Multiple Choices?' : 'Submit Your Vote?' }}
              </h3>
            </div>

            <!-- Body -->
            <div class="vm-modal-body">
              <p class="vm-modal-text">
                <template v-if="questionType === 'multiple'">
                  You are about to submit <strong>{{ selectedCount }}</strong> selection{{ selectedCount !== 1 ? 's' : '' }}. This action cannot be undone.
                </template>
                <template v-else>
                  Please confirm your selection before submitting. This action cannot be undone.
                </template>
              </p>
              <div class="vm-modal-selection">
                <template v-if="questionType === 'multiple'">
                  {{ selectedCount }} option{{ selectedCount !== 1 ? 's' : '' }} selected
                </template>
                <template v-else>
                  {{ selectedLabel || 'Selected option' }}
                </template>
              </div>
            </div>

            <!-- Actions -->
            <div class="vm-modal-actions">
              <button class="vm-modal-btn vm-modal-btn--cancel" @click="emit('cancel')">
                Cancel
              </button>
              <button
                class="vm-modal-btn vm-modal-btn--confirm"
                :disabled="loading"
                @click="emit('confirm')"
              >
                <span v-if="loading" style="display:flex;align-items:center;gap:6px;justify-content:center;">
                  <svg class="vm-btn-spinner" viewBox="0 0 24 24" fill="none">
                    <circle class="vm-btn-spinner-track" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" />
                    <path class="vm-btn-spinner-path" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" fill="currentColor" />
                  </svg>
                  Submitting...
                </span>
                <span v-else>Confirm Vote</span>
              </button>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.vm-modal-fade-enter-active,
.vm-modal-fade-leave-active {
  transition: opacity 0.2s ease;
}
.vm-modal-fade-enter-from,
.vm-modal-fade-leave-to {
  opacity: 0;
}

.vm-modal-scale-enter-active {
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
.vm-modal-scale-leave-active {
  transition: all 0.15s ease;
}
.vm-modal-scale-enter-from {
  opacity: 0;
  transform: scale(0.95) translateY(10px);
}
.vm-modal-scale-leave-to {
  opacity: 0;
  transform: scale(0.95);
}
</style>
