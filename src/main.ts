import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import { ensureCsrfCookie } from './services/api'
import './style.css'

const app = createApp(App)

app.use(createPinia())
app.use(router)

ensureCsrfCookie().finally(() => {
  app.mount('#app')
})
