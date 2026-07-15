import api from './api'
import type { School, SchoolRequestPayload } from '@/types/location'

export const schoolService = {
  async getSchools(provinceId: number, search?: string): Promise<School[]> {
    const params: Record<string, any> = { province_id: provinceId }
    if (search) params.search = search
    const { data } = await api.get('/api/schools', { params })
    return data.data
  },

  async getLocationSchools(provinceId: number, search?: string): Promise<School[]> {
    const params: Record<string, any> = { province_id: provinceId }
    if (search) params.search = search
    const { data } = await api.get('/api/location-schools', { params })
    return data
  },

  async requestSchool(payload: SchoolRequestPayload) {
    const { data } = await api.post('/api/school-requests', payload)
    return data.data
  },
}
