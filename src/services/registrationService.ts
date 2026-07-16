import api from './api'
import type { RegistrationData } from '@/types/auth'

export const registrationService = {
  async register(data: RegistrationData) {
    const { data: response } = await api.post('/api/auth/register', data)
    return response
  },
}
