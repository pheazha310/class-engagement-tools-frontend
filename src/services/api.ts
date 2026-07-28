import axios from 'axios'

function normalizeApiBaseUrl(rawUrl: string | undefined): string {
  if (!rawUrl) {
    return ''
  }

  return rawUrl.trim().replace(/\/api\/?$/, '').replace(/\/+$/, '')
}

const apiBaseUrl = normalizeApiBaseUrl(import.meta.env.VITE_API_URL)

const api = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
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

    // Don't auto-clear user on every 401 — only fetchUser() should do that
    // when the /api/user endpoint itself returns 401.
    // Otherwise stale sessions just mean one failed API call; the router guard
    // will handle redirection on the next navigation.

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
  const base = apiBaseUrl || window.location.origin
  await api.get(`${base}/sanctum/csrf-cookie`)
}

export default api
