import api from './api'

export async function checkAuth(): Promise<boolean> {
  try {
    const { data } = await api.get('/api/user')
    return !!data?.user
  } catch {
    return false
  }
}
