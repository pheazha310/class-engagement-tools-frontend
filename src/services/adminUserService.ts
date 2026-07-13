import api from './api'
import type { AdminUserListItem, AdminUserFormData, PaginatedResponse } from '@/types/admin'

export const adminUserService = {
  async getUsers(search = '', page = 1): Promise<PaginatedResponse<AdminUserListItem>> {
    const response = await api.get('/api/admin/users', {
      params: { search, page },
    })
    return response.data
  },

  async getUser(id: number): Promise<AdminUserListItem> {
    const response = await api.get(`/api/admin/users/${id}`)
    return response.data
  },

  async createUser(data: AdminUserFormData): Promise<{ message: string; user: AdminUserListItem }> {
    const response = await api.post('/api/admin/users', data)
    return response.data
  },

  async updateUser(id: number, data: AdminUserFormData): Promise<{ message: string; user: AdminUserListItem }> {
    const response = await api.put(`/api/admin/users/${id}`, data)
    return response.data
  },

  async deleteUser(id: number): Promise<{ message: string }> {
    const response = await api.delete(`/api/admin/users/${id}`)
    return response.data
  },

  async getRoles(): Promise<string[]> {
    const response = await api.get('/api/admin/roles')
    return response.data
  },
}
