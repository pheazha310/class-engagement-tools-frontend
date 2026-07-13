import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'

import StudentPickerView from '@/views/StudentPickerView.vue'
import SingleStudentPickerView from '@/views/SingleStudentPickerView.vue'
import HomepageView from '@/views/Homepage.vue'
import ToolsPage from '@/pages/ToolsPage.vue'
import ToolDetailPage from '@/pages/ToolDetailPage.vue'
import GroupGeneratorView from '@/views/GroupGeneratorView.vue'

const routes: RouteRecordRaw[] = [
  {
    path: '/register',
    name: 'register',
    component: () => import('@/pages/RegisterPage.vue'),
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('@/pages/LoginPage.vue'),
  },
  {
    path: '/',
    name: 'home',
    component: HomepageView,
  },
  {
    path: '/about',
    name: 'about',
    component: () => import('@/views/About.vue'),
  },
  {
    path: '/contact',
    name: 'contact',
    component: () => import('@/views/Contact.vue'),
  },
  {
    path: '/wheel',
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
    path: '/tools',
    name: 'tools',
    component: ToolsPage,
  },
  {
    path: '/tools/category/:slug',
    name: 'category-tools',
    component: () => import('@/pages/CategoryToolsPage.vue'),
  },
  {
    path: '/tools/:slug',
    name: 'tool-detail',
    component: ToolDetailPage,
  },
  {
    path: '/group-generator',
    name: 'group-generator',
    component: GroupGeneratorView,
  },
  {
    path: '/teacher/polls',
    name: 'teacher-polls',
    component: () => import('@/pages/teacher/PollDashboard.vue'),
  },
  {
    path: '/vote/:roomCode?',
    name: 'vote',
    component: () => import('@/pages/student/VotePage.vue'),
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
