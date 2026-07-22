import { ref, computed } from 'vue'

export function showNotification(message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info', duration: number = 5000) {
  const notifications = ref<{
    id: number
    message: string
    type: 'success' | 'error' | 'warning' | 'info'
  }[]>([])

  const uniqueId = Date.now()
  notifications.value.push({ id: uniqueId, message, type })

  if (duration > 0) {
    setTimeout(() => {
      const index = notifications.value.findIndex(n => n.id === uniqueId)
      if (index !== -1) {
        notifications.value.splice(index, 1)
      }
    }, duration)
  }

  return {
    notifications,
    removeNotification: (id: number) => {
      const index = notifications.value.findIndex(n => n.id === id)
      if (index !== -1) {
        notifications.value.splice(index, 1)
      }
    }
  }
}
