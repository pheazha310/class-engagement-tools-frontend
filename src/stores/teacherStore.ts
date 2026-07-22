import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { teacherDashboardService } from '@/services/teacher-api'
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
} from '@/services/teacher-api'

export const useTeacherDashboardStore = defineStore('teacherDashboard', () => {
  // State
  const loading = ref(false)
  const error = ref<string | null>(null)
  const success = ref<string | null>(null)

  const classConfigurations = ref<ClassConfiguration[]>([])
  const activityHistory = ref<ActivityHistoryResponse | null>(null)
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

  // Computed properties
  const totalActivities = computed(() => dashboardStats.value?.total_activities ?? 0)
  const uniqueStudents = computed(() => dashboardStats.value?.unique_students ?? 0)
  const activeQuizzes = computed(() => dashboardStats.value?.active_quizzes ?? 0)
  const totalClasses = computed(() => dashboardStats.value?.total_classes ?? 0)

  // Actions
  const fetchClassConfigurations = async () => {
    loading.value = true
    error.value = null
    try {
      const response = await teacherDashboardService.getClassConfigurations()
      classConfigurations.value = response.data || []
      success.value = 'Class configurations loaded successfully'
      setTimeout(() => (success.value = null), 3000)
      return response.data
    } catch (err) {
      error.value = 'Failed to load class configurations'
      setTimeout(() => (error.value = null), 5000)
      throw err
    } finally {
      loading.value = false
    }
  }

  const createClassConfiguration = async (data: CreateClassConfigurationRequest) => {
    loading.value = true
    error.value = null
    try {
      const response = await teacherDashboardService.createClassConfiguration(data)
      classConfigurations.value.unshift(response.data)
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

  const updateClassConfiguration = async (id: number, data: UpdateClassConfigurationRequest) => {
    loading.value = true
    error.value = null
    try {
      const response = await teacherDashboardService.updateClassConfiguration(id, data)
      const index = classConfigurations.value.findIndex(c => c.id === id)
      if (index !== -1) {
        classConfigurations.value[index] = response.data
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

  const deleteClassConfiguration = async (id: number) => {
    loading.value = true
    error.value = null
    try {
      const response = await teacherDashboardService.deleteClassConfiguration(id)
      classConfigurations.value = classConfigurations.value.filter(c => c.id !== id)
      success.value = 'Class configuration deleted successfully'
      setTimeout(() => (success.value = null), 3000)
      return response.data
    } catch (err) {
      error.value = 'Failed to delete class configuration'
      setTimeout(() => (error.value = null), 5000)
      throw err
    } finally {
      loading.value = false
    }
  }

  const fetchActivityHistory = async (params: ActivityHistoryParams = {}) => {
    loading.value = true
    error.value = null
    try {
      const response = await teacherDashboardService.getActivityHistory(params)
      activityHistory.value = response.data
      pagination.value.activityHistory = {
        page: response.data.current_page || 1,
        perPage: response.data.per_page || 10,
        total: response.data.total || 0,
        lastPage: response.data.last_page || 1,
      }
      success.value = 'Activity history loaded successfully'
      setTimeout(() => (success.value = null), 3000)
      return response.data
    } catch (err) {
      error.value = 'Failed to load activity history'
      setTimeout(() => (error.value = null), 5000)
      throw err
    } finally {
      loading.value = false
    }
  }

  const createActivity = async (data: CreateActivityRequest) => {
    loading.value = true
    error.value = null
    try {
      const response = await teacherDashboardService.createActivity(data)
      recentActivities.value.unshift(response.data)
      success.value = 'Activity created successfully'
      setTimeout(() => (success.value = null), 3000)
      return response.data
    } catch (err) {
      error.value = 'Failed to create activity'
      setTimeout(() => (error.value = null), 5000)
      throw err
    } finally {
      loading.value = false
    }
  }

  const fetchDashboardStats = async (params?: DashboardStatsParams) => {
    loading.value = true
    error.value = null
    try {
      const response = await teacherDashboardService.getDashboardStats(params)
      dashboardStats.value = response.data
      success.value = 'Dashboard stats loaded successfully'
      setTimeout(() => (success.value = null), 3000)
      return response.data
    } catch (err) {
      error.value = 'Failed to load dashboard stats'
      setTimeout(() => (error.value = null), 5000)
      throw err
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
      return response.data
    } catch (err) {
      error.value = 'Failed to load recent activities'
      setTimeout(() => (error.value = null), 5000)
      throw err
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
      return response.data
    } catch (err) {
      error.value = 'Failed to load top quizzes'
      setTimeout(() => (error.value = null), 5000)
      throw err
    } finally {
      loading.value = false
    }
  }

  const clearMessages = () => {
    error.value = null
    success.value = null
  }

  const loadInitialData = async () => {
    await Promise.all([
      fetchClassConfigurations(),
      fetchDashboardStats(),
      fetchRecentActivities(),
      fetchTopQuizzes(),
    ])
  }

  return {
    // State
    loading,
    error,
    success,
    classConfigurations,
    activityHistory,
    dashboardStats,
    recentActivities,
    topQuizzes,
    pagination,

    // Computed
    totalActivities,
    uniqueStudents,
    activeQuizzes,
    totalClasses,

    // Actions
    fetchClassConfigurations,
    createClassConfiguration,
    updateClassConfiguration,
    deleteClassConfiguration,
    fetchActivityHistory,
    createActivity,
    fetchDashboardStats,
    fetchRecentActivities,
    fetchTopQuizzes,
    clearMessages,
    loadInitialData,
  }
})
