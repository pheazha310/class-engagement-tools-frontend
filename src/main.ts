import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import { ensureCsrfCookie } from './services/api'
import './style.css'

const app = createApp(App)

app.use(createPinia())
app.use(router)

// Mount the app immediately without waiting for CSRF cookie
app.mount('#app')

// Initialize CSRF cookie in the background (non-blocking)
ensureCsrfCookie().catch((error) => {
  console.warn('Failed to initialize CSRF cookie:', error)
})
