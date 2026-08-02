import { ref, computed, onMounted } from 'vue'
import { useTeacherDashboardStore } from '@/stores/teacherStore'

export default {
  name: 'TeacherDashboard',

  setup() {
    const store = useTeacherDashboardStore()

    onMounted(() => {
      store.loadInitialData()
    })

    return {
      store,
    }
  },
}
