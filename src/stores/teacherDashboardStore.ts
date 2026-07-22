import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { teacherDashboardService } from '@/services/teacherDashboardService'
import type {
  ClassConfiguration,
  CreateClassConfigurationRequest,
  UpdateClassConfigurationRequest,
  TeacherActivity,
  CreateActivityRequest,
  DashboardStats,
  DashboardStatsParams,
  ActivityHistoryParams,
  ActivityHistoryResponse,
} from '@/services/teacherDashboardService'

export const useTeacherDashboardStore = defineStore('teacherDashboard', () => {
  // State
  const loading = ref(false)
  const error = ref<string | null>(null)
  const success = ref<string | null>(null)

  const classConfigs = ref<ClassConfiguration[]>([])
  const activities = ref<TeacherActivity[]>([])
  const dashboardStats = ref<DashboardStats | null>(null)
  const recentActivities = ref<TeacherActivity[]>([])
  const topQuizzes = ref<any[]>([])

  const pagination = ref({
    classConfigurations: {
      page: 1,
      perPage: 10,
      total: 0,
      lastPage: 1,
    },
    activityHistory: {
      page: 1,
      perPage: 10,
      total: 0,
      lastPage: 1,
    },
  })

  // Actions
  const fetchClassConfigurations = async () => {
    loading.value = true
    error.value = null
    try {
      const response = await teacherDashboardService.getClassConfigurations()
      classConfigs.value = response.data || []
      success.value = 'Class configurations loaded successfully'
      setTimeout(() => (success.value = null), 3000)
    } catch (err) {
      error.value = 'Failed to load class configurations'
      setTimeout(() => (error.value = null), 5000)
    } finally {
      loading.value = false
    }
  }

  const createConfig = async (data: CreateClassConfigurationRequest) => {
    loading.value = true
    error.value = null
    try {
      const response = await teacherDashboardService.createClassConfiguration(data)
      classConfigs.value.unshift(response.data)
      success.value = 'Class configuration created successfully'
      setTimeout(() => (success.value = null), 3000)
      return response.data
    } catch (err) {
      error.value = 'Failed to create class configuration'
      setTimeout(() => (error.value = null), 5000)
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateConfig = async (id: number, data: UpdateClassConfigurationRequest) => {
    loading.value = true
    error.value = null
    try {
      const response = await teacherDashboardService.updateClassConfiguration(id, data)
      const index = classConfigs.value.findIndex((c) => c.id === id)
      if (index !== -1) {
        classConfigs.value[index] = response.data
      }
      success.value = 'Class configuration updated successfully'
      setTimeout(() => (success.value = null), 3000)
      return response.data
    } catch (err) {
      error.value = 'Failed to update class configuration'
      setTimeout(() => (error.value = null), 5000)
      throw err
    } finally {
      loading.value = false
    }
  }

  const deleteConfig = async (id: number) => {
    loading.value = true
    error.value = null
    try {
      await teacherDashboardService.deleteClassConfiguration(id)
      classConfigs.value = classConfigs.value.filter((c) => c.id !== id)
      success.value = 'Class configuration deleted successfully'
      setTimeout(() => (success.value = null), 3000)
    } catch (err) {
      error.value = 'Failed to delete class configuration'
      setTimeout(() => (error.value = null), 5000)
      throw err
    } finally {
      loading.value = false
    }
  }

  const fetchDashboardStats = async (params: DashboardStatsParams = {}) => {
    loading.value = true
    error.value = null
    try {
      const response = await teacherDashboardService.getDashboardStats(params)
      dashboardStats.value = response.data
      success.value = 'Dashboard stats loaded successfully'
      setTimeout(() => (success.value = null), 3000)
    } catch (err) {
      error.value = 'Failed to load dashboard stats'
      setTimeout(() => (error.value = null), 5000)
    } finally {
      loading.value = false
    }
  }

  const createActivity = async (data: CreateActivityRequest) => {
    loading.value = true
    error.value = null
    try {
      const response = await teacherDashboardService.createActivity(data)
      activities.value.unshift(response.data)
      success.value = 'Activity created successfully'
      setTimeout(() => (success.value = null), 3000)
    } catch (err) {
      error.value = 'Failed to create activity'
      setTimeout(() => (error.value = null), 5000)
    } finally {
      loading.value = false
    }
  }

  const fetchRecentActivities = async () => {
    loading.value = true
    error.value = null
    try {
      const response = await teacherDashboardService.getRecentActivities()
      recentActivities.value = response.data || []
      success.value = 'Recent activities loaded successfully'
      setTimeout(() => (success.value = null), 3000)
    } catch (err) {
      error.value = 'Failed to load recent activities'
      setTimeout(() => (error.value = null), 5000)
    } finally {
      loading.value = false
    }
  }

  const fetchTopQuizzes = async () => {
    loading.value = true
    error.value = null
    try {
      const response = await teacherDashboardService.getTopQuizzes()
      topQuizzes.value = response.data || []
      success.value = 'Top quizzes loaded successfully'
      setTimeout(() => (success.value = null), 3000)
    } catch (err) {
      error.value = 'Failed to load top quizzes'
      setTimeout(() => (error.value = null), 5000)
    } finally {
      loading.value = false
    }
  }

  const clearMessages = () => {
    error.value = null
    success.value = null
  }

  const loadInitialDashboard = async () => {
    await Promise.all([
      fetchClassConfigurations(),
      fetchDashboardStats(),
      fetchRecentActivities(),
      fetchTopQuizzes(),
    ])
  }

  // Computed properties
  const isLoading = computed(() => loading.value)
  const totalActivities = computed(() => dashboardStats.value?.total_activities || 0)
  const uniqueStudents = computed(() => dashboardStats.value?.unique_students || 0)
  const activeQuizzes = computed(() => dashboardStats.value?.active_quizzes || 0)
  const totalClasses = computed(() => dashboardStats.value?.total_classes || 0)

  return {
    // State
    loading,
    error,
    success,
    classConfigs,
    activities,
    dashboardStats,
    recentActivities,
    topQuizzes,
    pagination,

    // Computed
    isLoading,
    totalActivities,
    uniqueStudents,
    activeQuizzes,
    totalClasses,

    // Actions
    fetchClassConfigurations,
    createConfig,
    updateConfig,
    deleteConfig,
    fetchDashboardStats,
    createActivity,
    fetchRecentActivities,
    fetchTopQuizzes,
    clearMessages,
    loadInitialDashboard,
  }
})
