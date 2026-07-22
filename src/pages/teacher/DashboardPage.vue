import { ref, computed } from 'vue'
import { useTeacherDashboardStore } from '@/stores/teacherDashboardStore'

export default {
  name: 'TeacherDashboard',

  setup() {
    const store = useTeacherDashboardStore()

    const newConfigForm = ref({
      name: '',
      class_name: '',
      subject: '',
      settings: {},
      is_active: true,
    })

    const isFormValid = computed(() => {
      return newConfigForm.value.name && newConfigForm.value.class_name && newConfigForm.value.subject
    })

    const createNewConfig = async () => {
      if (!isFormValid.value) return

      try {
        await store.createConfig(newConfigForm.value)
        newConfigForm.value = {
          name: '',
          class_name: '',
          subject: '',
          settings: {},
          is_active: true,
        }
      } catch (error) {
        console.error('Failed to create class configuration:', error)
      }
    }

    const navigateToLivePolls = () => {
      window.location.href = '/teacher/live-polls/create'
    }

    const navigateToQuizzes = () => {
      window.location.href = '/quizzes/create'
    }

    const navigateToActivityHistory = () => {
      window.location.href = '/teacher/activity-history'
    }

    return {
      store,
      newConfigForm,
      isFormValid,
      createNewConfig,
      navigateToLivePolls,
      navigateToQuizzes,
      navigateToActivityHistory,
    }
  },
}
