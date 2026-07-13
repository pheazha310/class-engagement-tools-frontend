import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'

import StudentPickerView from '@/views/StudentPickerView.vue'
import SingleStudentPickerView from '@/views/SingleStudentPickerView.vue'
import MultipleStudentPickerView from '@/views/MultipleStudentPickerView.vue'
import HomepageView from '@/views/Homepage.vue'
import ToolsPage from '@/pages/ToolsPage.vue'
import ToolDetailPage from '@/pages/ToolDetailPage.vue'
import GroupGeneratorView from '@/views/GroupGeneratorView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
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
      path: '/login',
      name: 'login',
      component: () => import('@/pages/LoginPage.vue'),
      meta: { guest: true },
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('@/pages/Register.vue'),
      meta: { guest: true },
    },
    {
      path: '/teacher/dashboard',
      name: 'teacher-dashboard',
      component: () => import('@/pages/TeacherPollList.vue'),
      meta: { requiresAuth: true, role: 'teacher' },
    },
    {
      path: '/student/dashboard',
      name: 'student-dashboard',
      component: () => import('@/pages/ActivePoll.vue'),
      meta: { requiresAuth: true, role: 'student' },
    },
    {
      path: '/live-voting',
      name: 'live-voting',
      component: () => import('@/pages/LiveClassroomVoting.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/polls',
      name: 'teacher-polls',
      component: () => import('@/pages/TeacherPollList.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/polls/create',
      name: 'create-poll',
      component: () => import('@/pages/CreatePoll.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/polls/:id/edit',
      name: 'edit-poll',
      component: () => import('@/pages/CreatePoll.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/polls/:id/results',
      name: 'poll-results',
      component: () => import('@/pages/LiveResults.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/active-poll',
      name: 'active-poll',
      component: () => import('@/pages/ActivePoll.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/admin/users',
      name: 'admin-users',
      component: () => import('@/pages/admin/UserList.vue'),
      meta: { requiresAuth: true, role: 'admin' },
    },
    {
      path: '/admin/users/create',
      name: 'admin-users-create',
      component: () => import('@/pages/admin/UserForm.vue'),
      meta: { requiresAuth: true, role: 'admin' },
    },
    {
      path: '/admin/users/:id/edit',
      name: 'admin-users-edit',
      component: () => import('@/pages/admin/UserForm.vue'),
      meta: { requiresAuth: true, role: 'admin' },
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
    path: '/multiple-student-picker',
    name: 'multiple-student-picker',
    component: MultipleStudentPickerView,
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
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('@/pages/NotFound.vue'),
    },
  ],
})

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()

  // Allow access to public routes without authentication
  const publicRoutes = ['home', 'about', 'contact', 'login', 'register', 'not-found',
    'wheel', 'student-picker', 'single-student-picker', 'multiple-student-picker', 'tools', 'category-tools',
    'tool-detail', 'group-generator']
  if (publicRoutes.includes(to.name as string)) {
    next()
    return
  }

  if (to.meta.requiresAuth && !authStore.user) {
    next('/login')
  } else if (to.meta.guest && authStore.user) {
    if (authStore.user.role === 'admin') {
      next('/admin/users')
    } else if (authStore.user.role === 'teacher') {
      next('/teacher/dashboard')
    } else if (authStore.user.role === 'student') {
      next('/student/dashboard')
    } else {
      next('/polls')
    }
  } else if (to.meta.role && authStore.user?.role !== to.meta.role) {
    if (authStore.user?.role === 'admin') {
      next('/admin/users')
    } else if (authStore.user?.role === 'teacher') {
      next('/teacher/dashboard')
    } else if (authStore.user?.role === 'student') {
      next('/student/dashboard')
    } else {
      next('/polls')
    }
  } else {
    next()
  }
})

export default router
