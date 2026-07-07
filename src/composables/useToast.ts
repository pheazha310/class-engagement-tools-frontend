import { ref, onBeforeUnmount } from 'vue'

type ToastType = 'success' | 'info' | 'error'

const toastVisible = ref(false)
const toastMessage = ref('')
const toastType = ref<ToastType>('info')
let toastTimer: number | undefined

const showToast = (message: string, type: ToastType = 'info') => {
  toastMessage.value = message
  toastType.value = type
  toastVisible.value = true
  if (toastTimer) window.clearTimeout(toastTimer)
  toastTimer = window.setTimeout(() => {
    toastVisible.value = false
  }, 3000)
}

onBeforeUnmount(() => {
  if (toastTimer) window.clearTimeout(toastTimer)
})

export function useToast() {
  return {
    toastVisible,
    toastMessage,
    toastType,
    showToast,
  }
}
