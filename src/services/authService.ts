import api from './api'

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterCredentials {
  name: string
  email: string
  password: string
  password_confirmation: string
  role: 'teacher' | 'student'
}

export interface User {
  id: number
  name: string
  email: string
  role: 'teacher' | 'student'
  created_at: string
  updated_at: string
}

export const authService = {
  async login(credentials: LoginCredentials) {
    const response = await api.post('/login', credentials)
    return response.data
  },

  async register(credentials: RegisterCredentials) {
    const response = await api.post('/register', credentials)
    return response.data
  },

  async logout() {
    const response = await api.post('/logout')
    return response.data
  },

  async getUser(): Promise<User> {
    const response = await api.get('/api/user')
    return response.data
  },
}
