import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/polls',
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('@/pages/Login.vue'),
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('@/pages/Register.vue'),
    },
    {
      path: '/live-voting',
      name: 'live-voting',
      component: () => import('@/pages/LiveClassroomVoting.vue'),
    },
    {
      path: '/polls',
      name: 'teacher-polls',
      component: () => import('@/pages/TeacherPollList.vue'),
    },
    {
      path: '/polls/create',
      name: 'create-poll',
      component: () => import('@/pages/CreatePoll.vue'),
    },
    {
      path: '/polls/:id/edit',
      name: 'edit-poll',
      component: () => import('@/pages/CreatePoll.vue'),
    },
    {
      path: '/polls/:id/results',
      name: 'poll-results',
      component: () => import('@/pages/LiveResults.vue'),
    },
    {
      path: '/active-poll',
      name: 'active-poll',
      component: () => import('@/pages/ActivePoll.vue'),
    },
  ],
})

export default router
