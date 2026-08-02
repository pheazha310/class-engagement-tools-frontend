import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import { ensureCsrfCookie } from './services/api'
import { useAuthStore } from './stores/auth'
import './style.css'

const app = createApp(App)

const pinia = createPinia()
app.use(pinia)
app.use(router)

// Initialize auth BEFORE mounting app to ensure user state is ready
async function initializeApp() {
  try {
    await ensureCsrfCookie()
  } catch (error) {
    console.warn('CSRF cookie init failed, proceeding to restore session:', error)
  }

  try {
    const authStore = useAuthStore()
    await authStore.fetchUser()
  } catch (error) {
    console.warn('Auth session restore failed:', error)
  }
}

// Wait for auth initialization before mounting
initializeApp().finally(() => {
  app.mount('#app')
})
