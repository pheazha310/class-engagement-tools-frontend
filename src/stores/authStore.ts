import { defineStore } from 'pinia'
import { ref } from 'vue'
import { authService } from '@/services/authService'
import { ensureCsrfCookie } from '@/services/api'
import type { User, LoginCredentials, RegisterCredentials } from '@/services/authService'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function login(credentials: LoginCredentials) {
    loading.value = true
    error.value = null
    try {
      await ensureCsrfCookie()
      await authService.login(credentials)
      await fetchUser()
    } catch (e: any) {
      error.value = e.response?.data?.message || 'Login failed.'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function register(credentials: RegisterCredentials) {
    loading.value = true
    error.value = null
    try {
      await authService.register(credentials)
      await fetchUser()
    } catch (e: any) {
      const errors = e.response?.data?.errors
      if (errors) {
        error.value = Object.values(errors).flat().join(', ')
      } else {
        error.value = e.response?.data?.message || 'Registration failed.'
      }
      throw e
    } finally {
      loading.value = false
    }
  }

  async function fetchUser() {
    loading.value = true
    error.value = null
    try {
      const response = await authService.getUser()
      user.value = response.user
    } catch (e: any) {
      user.value = null
      if (e.response?.status !== 401) {
        error.value = e.response?.data?.message || 'Failed to fetch user.'
      }
    } finally {
      loading.value = false
    }
  }

  async function logout() {
    loading.value = true
    error.value = null
    try {
      await authService.logout()
      user.value = null
    } catch (e: any) {
      error.value = e.response?.data?.message || 'Logout failed.'
      throw e
    } finally {
      loading.value = false
    }
  }

  function clearError() {
    error.value = null
  }

  return {
    user,
    loading,
    error,
    login,
    register,
    fetchUser,
    logout,
    clearError,
  }
})
