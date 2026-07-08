import { createRouter, createWebHistory } from 'vue-router'
import StudentPickerView from '@/views/StudentPickerView.vue'
import SingleStudentPickerView from '@/views/SingleStudentPickerView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'student-picker',
      component: StudentPickerView,
    },
    {
      path: '/single-student-picker',
      name: 'single-student-picker',
      component: SingleStudentPickerView,
    },
  ],
})

export default router
