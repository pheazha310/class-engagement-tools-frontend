import { createRouter, createWebHistory } from 'vue-router'
import JoinPage from '@/pages/students/JoinPage.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      redirect: '/join',
    },
    {
      path: '/join',
      name: 'Join',
      component: JoinPage,
    },
  ],
})

export default router
