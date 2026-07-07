import { createRouter, createWebHistory } from 'vue-router'
import JoinPage from '@/pages/students/JoinPage.vue'
import SessionPage from '@/pages/students/SessionPage.vue'

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
    {
      path: '/session',
      name: 'Session',
      component: SessionPage,
    },
  ],
})

export default router
