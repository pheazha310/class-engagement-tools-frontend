import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

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

    if (
      typeof candidateRecord.id !== 'number' ||
      typeof candidateRecord.name !== 'string' ||
      typeof candidateRecord.email !== 'string'
    ) {
      return null
    }

    return {
      id: candidateRecord.id,
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
    try {
      const res = await fetch('/api/user', { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        setUser(normalizeUser(data))
      } else {
        clearUser()
      }
    } catch {
      clearUser()
    }
  }

  async function login(email: string, password: string): Promise<string | null> {
    loading.value = true
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: email.trim(), password }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        return data.message || `Login failed: ${res.status}`
      }
      const data = await res.json().catch(() => ({}))
      const authenticatedUser = normalizeUser(data)
      if (authenticatedUser) {
        setUser(authenticatedUser)
      } else {
        await fetchUser()
      }
      return null
    } catch (err) {
      return err instanceof Error ? err.message : 'Login failed'
    } finally {
      loading.value = false
    }
  }

  async function register(payload: Record<string, unknown>): Promise<string | null> {
    loading.value = true
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        return data.message || `Registration failed: ${res.status}`
      }
      const data = await res.json().catch(() => ({}))
      const authenticatedUser = normalizeUser(data)
      if (authenticatedUser) {
        setUser(authenticatedUser)
      } else {
        await fetchUser()
      }
      return null
    } catch (err) {
      return err instanceof Error ? err.message : 'Registration failed'
    } finally {
      loading.value = false
    }
  }

  async function logout() {
    try {
      await fetch('/api/logout', {
        method: 'POST',
        credentials: 'include',
        headers: { Accept: 'application/json' },
      })
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
    login,
    register,
    logout,
    setUser,
    clearUser,
  }
})
