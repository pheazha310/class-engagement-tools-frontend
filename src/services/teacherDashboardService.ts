import api from './api'
import { AxiosError } from 'axios'
import { useAuthStore } from '@/stores/auth'
import { showNotification } from '@/utils/notifications'

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
  private maxRetries = 3
  private baseTimeout = 10000

  private getAuthHeaders() {
    const authStore = useAuthStore()
    return {
      Authorization: `Bearer ${authStore.user?.token || ''}`, // Adjust if your token structure is different
      'X-Requested-With': 'XMLHttpRequest',
    }
  }

  private async handleRequest<T>(promise: Promise<T>): Promise<T> {
    const config = {
      timeout: this.baseTimeout,
      headers: this.getAuthHeaders(),
    }

    return this.retryRequest<T>(promise, config)
  }

  private async retryRequest<T>(promise: Promise<T>, config: any): Promise<T> {
    try {
      return await promise
    } catch (error) {
      const err = error as AxiosError

      if (err.response?.status === 401 && this.retryCount < this.maxRetries) {
        try {
          await this.refreshToken()
          this.retryCount++

          const retryPromise = this.createAuthenticatedRequest<T>(config)
          return await retryPromise
        } catch (refreshError) {
          const authStore = useAuthStore()
          authStore.clearUser()
          throw refreshError
        }
      }

      this.handleApiError(error)
      throw error
    }
  }

  private createAuthenticatedRequest<T>(_config: any): Promise<T> {
    return new Promise(() => {})
  }

  private retryCount = 0

  private async refreshToken(): Promise<void> {
    const authStore = useAuthStore()
    try {
      const { data } = await api.post('/api/auth/refresh', { token: authStore.user?.token })
      authStore.setUser({ ...authStore.user, token: data.token })
    } catch {
      throw new Error('Failed to refresh token')
    }
  }

  private handleApiError(error: any): void {
    let message = 'An unexpected error occurred'

    if (error instanceof AxiosError) {
      const status = error.response?.status
      const responseData = error.response?.data

      if (status === 401) {
        message = 'Authentication failed. Please log in again.'
      } else if (status === 403) {
        message = 'You do not have permission to perform this action.'
      } else if (status === 404) {
        message = 'The requested resource was not found.'
      } else if (status === 422) {
        message = responseData?.message || 'Validation failed.'
      } else if (status >= 500) {
        message = 'Server error. Please try again later.'
      } else {
        message = responseData?.message || responseData?.error || error.message || message
      }

      showNotification(message, 'error')
    }
  }

  async getClassConfigurations(): Promise<ApiResponse<ClassConfiguration[]>> {
    return this.handleRequest(api.get('/api/teacher/class-configurations'))
  }

  async createClassConfiguration(data: CreateClassConfigurationRequest): Promise<ApiResponse<ClassConfiguration>> {
    return this.handleRequest(api.post('/api/teacher/class-configurations', data))
  }

  async updateClassConfiguration(id: number, data: UpdateClassConfigurationRequest): Promise<ApiResponse<ClassConfiguration>> {
    return this.handleRequest(api.put(`/api/teacher/class-configurations/${id}`, data))
  }

  async deleteClassConfiguration(id: number): Promise<ApiResponse<void>> {
    return this.handleRequest(api.delete(`/api/teacher/class-configurations/${id}`))
  }

  async getActivityHistory(params: ActivityHistoryParams): Promise<ApiResponse<ActivityHistoryResponse>> {
    return this.handleRequest(api.get('/api/teacher/activity-history', { params }))
  }

  async createActivity(data: CreateActivityRequest): Promise<ApiResponse<TeacherActivity>> {
    return this.handleRequest(api.post('/api/teacher/activities', data))
  }

  async getDashboardStats(params?: DashboardStatsParams): Promise<ApiResponse<DashboardStats>> {
    return this.handleRequest(api.get('/api/teacher/dashboard-stats', { params }))
  }

  async getRecentActivities(): Promise<ApiResponse<TeacherActivity[]>> {
    return this.handleRequest(api.get('/api/teacher/recent-activities'))
  }

  async getTopQuizzes(): Promise<ApiResponse<any[]>> {
    return this.handleRequest(api.get('/api/teacher/top-quizzes'))
  }

  private resetRetryCount(): void {
    this.retryCount = 0
  }
}

export const teacherDashboardService = new TeacherDashboardAPIService()
export default teacherDashboardService
