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
import CreateGamePage from '@/pages/CreateGamePage.vue'
import JoinGamePage from '@/pages/JoinGamePage.vue'
import GamePlayPage from '@/pages/GamePlayPage.vue'

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
    component: () => import('@/pages/teacher/TeacherDashboard.vue'),
    meta: { requiresAuth: true, role: 'teacher' },
  },

  // Student
  {
    path: '/student/dashboard',
    name: 'student-dashboard',
    component: () => import('@/pages/public/ActivePolls.vue'),
    meta: { requiresAuth: true, role: 'student' },
  },

  // Classroom Quiz (frontend-only)
  {
    path: '/classroom',
    name: 'classroom-quizzes',
    component: () => import('@/pages/ClassroomQuizList.vue'),
  },
  {
    path: '/classroom/create',
    name: 'classroom-create-quiz',
    component: () => import('@/pages/ClassroomCreateQuiz.vue'),
  },
  {
    path: '/classroom/quiz/:quizId',
    name: 'classroom-quiz-play',
    component: () => import('@/pages/ClassroomQuizPlay.vue'),
  },
  {
    path: '/classroom/review/:quizId',
    name: 'classroom-quiz-review',
    component: () => import('@/pages/ClassroomReview.vue'),
  },
  {
    path: '/classroom/rankings/:quizId',
    name: 'classroom-quiz-rankings',
    component: () => import('@/pages/ClassroomRankings.vue'),
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

  // Live Polls (API-backed)
  {
    path: '/teacher/live-polls',
    name: 'live-poll-list',
    component: () => import('@/pages/teacher/LivePollList.vue'),
    meta: { requiresAuth: true, role: 'teacher' },
  },
  {
    path: '/teacher/live-polls/create',
    name: 'live-poll-create',
    component: () => import('@/pages/teacher/LivePollCreate.vue'),
    meta: { requiresAuth: true, role: 'teacher' },
  },
  {
    path: '/teacher/live-polls/:id/edit',
    name: 'live-poll-edit',
    component: () => import('@/pages/teacher/LivePollCreate.vue'),
    meta: { requiresAuth: true, role: 'teacher' },
  },
  {
    path: '/teacher/live-polls/:id/results',
    name: 'live-poll-results',
    component: () => import('@/pages/teacher/LivePollResults.vue'),
    meta: { requiresAuth: true, role: 'teacher' },
  },
  {
    path: '/vote/:token',
    name: 'live-vote-public',
    component: () => import('@/pages/public/LiveVote.vue'),
  },
  {
    path: '/polls/active',
    name: 'active-polls-list',
    component: () => import('@/pages/public/ActivePolls.vue'),
  },

  // 404
  {
    path: '/group-generator',
    name: 'group-generator',
    component: GroupGeneratorView,
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
    path: '/live-voting',
    name: 'live-voting-list',
    component: () => import('@/pages/VotingList.vue'),
  },
  {
    path: '/live-voting/create',
    name: 'live-voting-create',
    component: () => import('@/pages/CreateLiveVoting.vue'),
    meta: { requiresAuth: true, role: 'teacher' },
  },
  {
    path: '/live-voting/:id/edit',
    name: 'live-voting-edit',
    component: () => import('@/pages/CreateLiveVoting.vue'),
    meta: { requiresAuth: true, role: 'teacher' },
  },
  {
    path: '/vote/live',
    name: 'student-live-vote',
    component: () => import('@/pages/StudentLiveVote.vue'),
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
    meta: { requiresAuth: true, role: 'teacher' },
  },
  {
    path: '/teacher/polls/create',
    name: 'teacher-polls-create',
    component: () => import('@/pages/teacher/PollCreatePage.vue'),
    meta: { requiresAuth: true, role: 'teacher' },
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
    meta: { requiresAuth: true },
  },
  {
    path: '/settings',
    name: 'settings',
    component: () => import('@/pages/ProfilePage.vue'),
    meta: { requiresAuth: true },
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
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/pages/NotFound.vue'),
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

router.beforeEach((to) => {
  const authStore = useAuthStore()

  if (to.meta.requiresAuth && !authStore.user) {
    return '/login'
  }

  if (to.meta.guest && authStore.user) {
    switch (authStore.user.role) {
      case 'admin':
        return '/admin/users'
      case 'teacher':
        return '/teacher/dashboard'
      case 'student':
        return '/student/dashboard'
      default:
        return '/polls'
    }
  }

  if (to.meta.role && authStore.user?.role !== to.meta.role) {
    switch (authStore.user?.role) {
      case 'admin':
        return '/admin/users'
      case 'teacher':
        return '/teacher/dashboard'
      case 'student':
        return '/student/dashboard'
      default:
        return '/polls'
    }
  }

  return true
})

export default router
