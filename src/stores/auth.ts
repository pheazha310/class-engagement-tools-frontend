import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import api, { ensureCsrfCookie } from '@/services/api'
import { AxiosError } from 'axios'

export interface AuthUser {
  id: string
  name: string
  email: string
  role: string
  avatar?: string | null
  profile_image?: string | null
  profile_image_url?: string | null
  school?: string | null
  token?: string
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<AuthUser | null>(null)
  const loading = ref(false)
  const initialized = ref(false)

  const isAuthenticated = computed(() => user.value !== null)
  const userName = computed(() => user.value?.name ?? '')
  const profileImageCachedUrl = ref('')
  const profileImageVersion = ref(0)

  const profileImageUrl = computed(() => {
    const url = user.value?.profile_image_url ?? user.value?.profile_image ?? user.value?.avatar ?? ''
    if (!url) return ''
    if (profileImageCachedUrl.value !== url) {
      profileImageCachedUrl.value = url
      profileImageVersion.value++
    }
    const separator = url.includes('?') ? '&' : '?'
    return `${url}${separator}v=${profileImageVersion.value}`
  })

  function bumpProfileImageVersion() {
    profileImageVersion.value++
  }

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
      id: String(rawId),
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

  /** Extract the most specific error message from an API error response */
  function extractError(err: unknown, fallback: string): string {
    if (!(err instanceof AxiosError) || !err.response?.data) {
      return err instanceof Error ? err.message : fallback
    }

    const data = err.response.data as Record<string, unknown>

    // 1. Try field-level validation errors first (most specific)
    const errors = data.errors
    if (errors && typeof errors === 'object') {
      const errObj = errors as Record<string, string[]>
      const firstKey = Object.keys(errObj)[0]
      const firstMsgs = firstKey ? errObj[firstKey] : null
      if (Array.isArray(firstMsgs) && firstMsgs.length > 0 && firstMsgs[0]) {
        return firstMsgs[0]
      }
    }

    // 2. Try top-level message
    if (typeof data.message === 'string' && data.message) {
      return data.message
    }

    // 3. Try error field
    if (typeof data.error === 'string' && data.error) {
      return data.error
    }

    return fallback
  }

  async function login(email: string, password: string, remember: boolean = false): Promise<string | null> {
    loading.value = true
    try {
      await ensureCsrfCookie()
      const { data } = await api.post('/api/login', { email: email.trim(), password, remember })
      const authenticatedUser = normalizeUser(data)
      if (authenticatedUser) {
        setUser(authenticatedUser)
        initialized.value = true
      } else {
        await fetchUser()
      }
      return null
    } catch (err) {
      return extractError(err, 'Login failed. Please check your credentials.')
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
      return extractError(err, 'Registration failed. Please try again.')
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
    bumpProfileImageVersion,
    setUser,
    clearUser,
  }
})
