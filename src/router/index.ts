import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'

import StudentPickerView from '@/views/StudentPickerView.vue'
import SingleStudentPickerView from '@/views/SingleStudentPickerView.vue'

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'login',
    component: () => import('@/pages/LoginPage.vue'),
  },
  {
    path: '/',
    name: 'wheel',
    component: () => import('@/pages/WheelPage.vue'),
  },
  {
    path: '/student-picker',
    name: 'student-picker',
    component: StudentPickerView,
  },
  {
    path: '/single-student-picker',
    name: 'single-student-picker',
    component: SingleStudentPickerView,
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/pages/NotFound.vue'),
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

export default router
