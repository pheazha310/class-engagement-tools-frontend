import axios from 'axios'
import { useAuthStore } from '@/stores/auth'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  withCredentials: true,
  withXSRFToken: true,
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status
    const detail = error.response?.data?.message
      || error.response?.data?.error
      || (error.response?.data?.errors ? Object.values(error.response.data.errors).flat().join(', ') : null)
      || error.message
      || 'An unexpected error occurred.'

    console.error('API Error:', detail, error.response?.data)

    if (status === 401) {
      try {
        const auth = useAuthStore()
        auth.clearUser()
      } catch {
        // ignore
      }
    }

    return Promise.reject(error)
  },
)

/**
 * Fetch the CSRF cookie from the Sanctum endpoint.
 *
 * The Sanctum CSRF cookie endpoint is at the app root, NOT under the /api prefix.
 * Build an absolute URL so axios doesn't prepend any baseURL.
 */
export async function ensureCsrfCookie(): Promise<void> {
  const raw = import.meta.env.VITE_API_URL || window.location.origin
  const base = raw.replace(/\/api$/, '').replace(/\/+$/, '')
  await api.get(`${base}/sanctum/csrf-cookie`)
}

export default api
