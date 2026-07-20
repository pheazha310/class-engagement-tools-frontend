import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

import StudentPickerView from '@/views/StudentPickerView.vue'
import SingleStudentPickerView from '@/views/SingleStudentPickerView.vue'
import MultipleStudentPickerView from '@/views/MultipleStudentPickerView.vue'
import LuckyDrawView from '@/views/LuckyDrawView.vue'
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
  // Home
  {
    path: '/',
    name: 'home',
    component: HomepageView,
  },

  // Teacher
  {
    path: '/teacher/dashboard',
    name: 'teacher-dashboard',
    component: () => import('@/pages/TeacherPollList.vue'),
    meta: { requiresAuth: true, role: 'teacher' },
  },

  // Student
  {
    path: '/student/dashboard',
    name: 'student-dashboard',
    component: () => import('@/pages/ActivePoll.vue'),
    meta: { requiresAuth: true, role: 'student' },
  },

  // Quizzes
  {
    path: '/quizzes',
    name: 'teacher-quizzes',
    component: () => import('@/pages/TeacherQuizList.vue'),
  },
  {
    path: '/quizzes/create',
    name: 'create-quiz',
    component: () => import('@/pages/CreateQuiz.vue'),
  },
  {
    path: '/quizzes/:id/edit',
    name: 'edit-quiz',
    component: () => import('@/pages/CreateQuiz.vue'),
  },

  // Questions
  {
    path: '/quizzes/:quizId/questions',
    name: 'question-list',
    component: () => import('@/views/QuestionListView.vue'),
  },
  {
    path: '/quizzes/:quizId/questions/create',
    name: 'question-create',
    component: () => import('@/views/QuestionFormView.vue'),
  },
  {
    path: '/quizzes/:quizId/questions/:questionId/edit',
    name: 'question-edit',
    component: () => import('@/views/QuestionFormView.vue'),
  },

  // Rankings
  {
    path: '/quizzes/:quizId/rankings',
    name: 'quiz-rankings',
    component: () => import('@/views/RankingView.vue'),
  },

  // Reports
  {
    path: '/quizzes/:quizId/report',
    name: 'quiz-report',
    component: () => import('@/views/ReportView.vue'),
  },

  // Polls
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
  },

  // Admin
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

  // Other pages from your friend
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
    path: '/card-picker',
    name: 'card-picker',
    component: () => import('@/pages/CardPicker.vue'),
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
    path: '/lucky-draw',
    name: 'lucky-draw',
    component: LuckyDrawView,
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
    path: '/timer',
    name: 'timer',
    component: () => import('@/views/TimerView.vue'),
  },
  {
    path: '/stopwatch',
    name: 'stopwatch',
    component: () => import('@/views/StopwatchView.vue'),
  },
  {
    path: '/tools/:slug',
    name: 'tool-detail',
    component: ToolDetailPage,
  },

  // 404
  {
    path: '/group-generator',
    name: 'group-generator',
    component: GroupGeneratorView,
    meta: { hideNavbar: true },
  },
  {
    path: '/live-voting',
    name: 'live-voting',
    component: () => import('@/pages/LiveVotingPage.vue'),
  },
  {
    path: '/vote',
    name: 'vote',
    component: () => import('@/pages/VotePage.vue'),
  },
  {
    path: '/results',
    name: 'results',
    component: () => import('@/pages/ResultsPage.vue'),
  },
  {
    path: '/create-voting-poll',
    name: 'create-voting-poll',
    component: () => import('@/pages/CreateVotingPoll.vue'),
    meta: { requiresAuth: true, role: 'teacher' },
  },
  {
    path: '/teacher/polls',
    name: 'teacher-polls',
    component: () => import('@/pages/teacher/PollDashboard.vue'),
  },
  {
    path: '/teacher/polls/create',
    name: 'teacher-polls-create',
    component: () => import('@/pages/teacher/PollCreatePage.vue'),
  },
  {
    path: '/student/polls/:id',
    name: 'student-poll-vote',
    component: () => import('@/pages/student/PollVotePage.vue'),
  },
  {
    path: '/profile',
    name: 'profile',
    component: () => import('@/pages/ProfilePage.vue'),
  },
  {
    path: '/settings',
    name: 'settings',
    component: () => import('@/pages/ProfilePage.vue'),
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

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()

  if (to.meta.requiresAuth && !authStore.user) {
    next('/login')
    return
  }

  if (to.meta.guest && authStore.user) {
    switch (authStore.user.role) {
      case 'admin':
        next('/admin/users')
        break
      case 'teacher':
        next('/teacher/dashboard')
        break
      case 'student':
        next('/student/dashboard')
        break
      default:
        next('/polls')
    }
    return
  }

  if (to.meta.role && authStore.user?.role !== to.meta.role) {
    switch (authStore.user?.role) {
      case 'admin':
        next('/admin/users')
        break
      case 'teacher':
        next('/teacher/dashboard')
        break
      case 'student':
        next('/student/dashboard')
        break
      default:
        next('/polls')
    }
    return
  }

  next()
})

export default router
