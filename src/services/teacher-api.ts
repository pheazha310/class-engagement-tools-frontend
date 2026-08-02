import axios from 'axios'
import { useAuthStore } from '@/stores/auth'
import { showNotification } from '@/utils/notifications'
import api from './api'

// API Response Types
export interface ApiResponse<T> {
  data: T
  message?: string
  success: boolean
}

export interface ClassConfiguration {
  id: number
  teacher_id: number
  name: string
  class_name: string
  subject: string
  settings: Record<string, any>
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface TeacherActivity {
  id: number
  teacher_id: number
  activity_type: string
  activity_data: Record<string, any>
  created_at: string
}

export interface DashboardStats {
  total_activities: number
  unique_students: number
  active_quizzes: number
  total_classes: number
}

export interface ActivityHistoryResponse {
  data: TeacherActivity[]
  current_page: number
  last_page: number
  per_page: number
  total: number
}

export type CreateClassConfigurationRequest = Omit<ClassConfiguration, 'id' | 'teacher_id' | 'created_at' | 'updated_at'>

export type UpdateClassConfigurationRequest = Partial<CreateClassConfigurationRequest>

export interface ActivityHistoryParams {
  page?: number
  per_page?: number
  start_date?: string
  end_date?: string
  activity_type?: string
}

export interface DashboardStatsParams {
  start_date?: string
  end_date?: string
}

export interface CreateActivityRequest {
  activity_type: string
  activity_data: Record<string, any>
}

class TeacherDashboardAPIService {
  private retryCount = 0
  private maxRetries = 2

  private getAuthHeaders() {
    const authStore = useAuthStore()
    return {
      Authorization: `Bearer ${authStore.user?.token || ''}`,
      'X-Requested-With': 'XMLHttpRequest',
    }
  }

  private async request<T>(promise: Promise<T>): Promise<T> {
    this.retryCount = 0
    return this.executeWithRetry(promise)
  }

  private async executeWithRetry<T>(promise: Promise<T>): Promise<T> {
    try {
      return await promise
    } catch (error: any) {
      if (error?.response?.status === 401 && this.retryCount < this.maxRetries) {
        this.retryCount++
        try {
          await this.refreshToken()
          return await this.executeWithRetry(promise)
        } catch {
          const authStore = useAuthStore()
          authStore.clearUser()
          throw error
        }
      }
      this.handleApiError(error)
      throw error
    }
  }

  private async refreshToken(): Promise<void> {
    const authStore = useAuthStore()
    try {
      const { data } = await api.post('/api/auth/refresh', { token: authStore.user?.token })
      if (authStore.user && data.token) {
        authStore.setUser({ ...authStore.user, token: data.token })
      }
    } catch {
      throw new Error('Failed to refresh token')
    }
  }

  private handleApiError(error: any): void {
    let message = 'An unexpected error occurred'
    if (error?.response?.status === 401) {
      message = 'Authentication failed. Please log in again.'
    } else if (error?.response?.status === 403) {
      message = 'You do not have permission to perform this action.'
    } else if (error?.response?.status === 404) {
      message = 'The requested resource was not found.'
    } else if (error?.response?.status === 422) {
      message = error?.response?.data?.message || 'Validation failed.'
    } else if (error?.response?.status >= 500) {
      message = 'Server error. Please try again later.'
    } else {
      message = error?.response?.data?.message || error?.response?.data?.error || error.message || message
    }
    showNotification(message, 'error')
  }

  async getClassConfigurations(): Promise<ApiResponse<ClassConfiguration[]>> {
    return this.request(api.get('/api/teacher/class-configurations'))
  }

  async createClassConfiguration(data: CreateClassConfigurationRequest): Promise<ApiResponse<ClassConfiguration>> {
    return this.request(api.post('/api/teacher/class-configurations', data))
  }

  async updateClassConfiguration(id: number, data: UpdateClassConfigurationRequest): Promise<ApiResponse<ClassConfiguration>> {
    return this.request(api.put(`/api/teacher/class-configurations/${id}`, data))
  }

  async deleteClassConfiguration(id: number): Promise<ApiResponse<void>> {
    return this.request(api.delete(`/api/teacher/class-configurations/${id}`))
  }

  async getActivityHistory(params: ActivityHistoryParams): Promise<ApiResponse<ActivityHistoryResponse>> {
    return this.request(api.get('/api/teacher/activity-history', { params }))
  }

  async createActivity(data: CreateActivityRequest): Promise<ApiResponse<TeacherActivity>> {
    return this.request(api.post('/api/teacher/activities', data))
  }

  async getDashboardStats(params?: DashboardStatsParams): Promise<ApiResponse<DashboardStats>> {
    return this.request(api.get('/api/teacher/dashboard-stats', { params }))
  }

  async getRecentActivities(): Promise<ApiResponse<TeacherActivity[]>> {
    return this.request(api.get('/api/teacher/recent-activities'))
  }

  async getTopQuizzes(): Promise<ApiResponse<any[]>> {
    return this.request(api.get('/api/teacher/top-quizzes'))
  }
}

export const teacherDashboardService = new TeacherDashboardAPIService()
export default teacherDashboardService
