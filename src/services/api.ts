import axios from 'axios'
import router from '@/router'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
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
    if (error.response?.status === 401) {
      router.push('/login')
      return Promise.reject(error)
    }
    const detail = error.response?.data?.message
      || error.response?.data?.error
      || (error.response?.data?.errors ? Object.values(error.response.data.errors).flat().join(', ') : null)
      || error.message
      || 'An unexpected error occurred.'
    console.error('API Error:', detail, error.response?.data)
    return Promise.reject(error)
  },
)

export async function ensureCsrfCookie() {
  await api.get('/sanctum/csrf-cookie')
}

export default api
