import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import api, { ensureCsrfCookie } from '@/services/api'
import { AxiosError } from 'axios'

export interface AuthUser {
  id: number
  name: string
  email: string
  role: string
  avatar?: string | null
  profile_image?: string | null
  profile_image_url?: string | null
  school?: string | null
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<AuthUser | null>(null)
  const loading = ref(false)
  const initialized = ref(false)

  const isAuthenticated = computed(() => user.value !== null)
  const userName = computed(() => user.value?.name ?? '')
  const profileImageUrl = computed(() => user.value?.profile_image_url ?? user.value?.avatar ?? '')

  const userInitials = computed(() => {
    const name = user.value?.name ?? ''
    const parts = name.trim().split(/\s+/).filter(Boolean)
    if (parts.length === 0) return '?'
    if (parts.length === 1) return (parts[0]?.[0] ?? '').toUpperCase() || '?'
    return ((parts[0]?.[0] ?? '') + (parts[parts.length - 1]?.[0] ?? '')).toUpperCase()
  })

  function setUser(nextUser: AuthUser | null) {
    user.value = nextUser
  }

  function clearUser() {
    user.value = null
  }

  function normalizeUser(payload: unknown): AuthUser | null {
    if (!payload || typeof payload !== 'object') {
      return null
    }

    const record = payload as Record<string, unknown>
    const candidate = record.user ?? record.data ?? payload

    if (!candidate || typeof candidate !== 'object') {
      return null
    }

    const candidateRecord = candidate as Record<string, unknown>

    const rawId = candidateRecord.id
    if (
      rawId === null || rawId === undefined ||
      typeof candidateRecord.name !== 'string' ||
      typeof candidateRecord.email !== 'string'
    ) {
      return null
    }

    return {
      id: Number(rawId),
      name: candidateRecord.name,
      email: candidateRecord.email,
      role: typeof candidateRecord.role === 'string' ? candidateRecord.role : 'student',
      avatar: typeof candidateRecord.avatar === 'string' ? candidateRecord.avatar : null,
      profile_image: typeof candidateRecord.profile_image === 'string' ? candidateRecord.profile_image : null,
      profile_image_url: typeof candidateRecord.profile_image_url === 'string' ? candidateRecord.profile_image_url : null,
      school: typeof candidateRecord.school === 'string' ? candidateRecord.school : null,
    }
  }

  async function fetchUser() {
    loading.value = true
    try {
      const { data } = await api.get('/api/user')
      setUser(normalizeUser(data))
    } catch (err) {
      // Only clear user on 401 (unauthenticated) — not on transient network/server errors
      if (err instanceof AxiosError && err.response?.status === 401) {
        clearUser()
      }
      // For other errors, keep the existing user state
    } finally {
      loading.value = false
      initialized.value = true
    }
  }

  async function login(email: string, password: string): Promise<string | null> {
    loading.value = true
    try {
      await ensureCsrfCookie()
      const { data } = await api.post('/api/login', { email: email.trim(), password })
      const authenticatedUser = normalizeUser(data)
      if (authenticatedUser) {
        setUser(authenticatedUser)
        initialized.value = true
      } else {
        await fetchUser()
      }
      return null
    } catch (err) {
      if (err instanceof AxiosError) {
        return err.response?.data?.message || err.message || 'Login failed'
      }
      return err instanceof Error ? err.message : 'Login failed'
    } finally {
      loading.value = false
    }
  }

  async function register(payload: Record<string, unknown>): Promise<string | null> {
    loading.value = true
    try {
      await ensureCsrfCookie()
      const { data } = await api.post('/api/auth/register', payload)
      const authenticatedUser = normalizeUser(data)
      if (authenticatedUser) {
        setUser(authenticatedUser)
        initialized.value = true
      } else {
        await fetchUser()
      }
      return null
    } catch (err) {
      if (err instanceof AxiosError) {
        return err.response?.data?.message || err.message || 'Registration failed'
      }
      return err instanceof Error ? err.message : 'Registration failed'
    } finally {
      loading.value = false
    }
  }

  async function logout() {
    try {
      await api.post('/api/logout')
    } catch {
      // ignore
    }
    clearUser()
  }

  return {
    user,
    loading,
    isAuthenticated,
    userName,
    userInitials,
    profileImageUrl,
    fetchUser,
    initialized,
    login,
    register,
    logout,
    setUser,
    clearUser,
  }
})
