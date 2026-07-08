import { createRouter, createWebHistory } from 'vue-router'
import WheelPage from '@/pages/WheelPage.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'wheel',
      component: WheelPage,
    },
  ],
})

export default router
