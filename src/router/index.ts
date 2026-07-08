import { createRouter, createWebHistory } from 'vue-router'
import StudentPickerView from '@/views/StudentPickerView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'student-picker',
      component: StudentPickerView,
    },
  ],
})

export default router
