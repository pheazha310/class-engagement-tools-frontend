<script setup lang="ts">
import ConfirmationDialog from './ConfirmationDialog.vue'

defineProps<{
  show: boolean
  deleting?: boolean
}>()

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()
</script>

<template>
  <ConfirmationDialog
    :show="show"
    title="Delete Question"
    message="Are you sure you want to delete this question? This action cannot be undone and will remove all associated data."
    confirm-text="Delete Question"
    variant="danger"
    @confirm="emit('confirm')"
    @cancel="emit('cancel')"
  />
</template>
