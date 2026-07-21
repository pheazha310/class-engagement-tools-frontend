import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'

import StudentPickerView from '@/views/StudentPickerView.vue'
import SingleStudentPickerView from '@/views/SingleStudentPickerView.vue'
import HomepageView from '@/views/Homepage.vue'
import ToolsPage from '@/pages/ToolsPage.vue'
import ToolDetailPage from '@/pages/ToolDetailPage.vue'
import CreateGamePage from '@/pages/CreateGamePage.vue'
import JoinGamePage from '@/pages/JoinGamePage.vue'
import GamePlayPage from '@/pages/GamePlayPage.vue'
import GameHistoryPage from '@/pages/GameHistoryPage.vue'

const routes: RouteRecordRaw[] = [
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
    path: '/wheel/shared/:shareToken',
    name: 'shared-wheel',
    component: () => import('@/views/SharedWheelView.vue'),
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
    path: '/games/create',
    name: 'create-game',
    component: CreateGamePage,
  },
  {
    path: '/join/:joinCode',
    name: 'join-game',
    component: JoinGamePage,
  },
  {
    path: '/game/:joinCode',
    name: 'game-play',
    component: GamePlayPage,
  },
  {
    path: '/games/history',
    name: 'game-history',
    component: GameHistoryPage,
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
