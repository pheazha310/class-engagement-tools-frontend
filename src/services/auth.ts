function getApiUrl(path: string): string {
  const baseUrl = typeof import.meta.env.VITE_API_URL === 'string' ? import.meta.env.VITE_API_URL.trim() : ''
  const normalizedBase = baseUrl.replace(/\/$/, '')
  if (normalizedBase) {
    return `${normalizedBase}${path}`
  }
  return path
}

export async function checkAuth(): Promise<boolean> {
  try {
    const response = await fetch(getApiUrl('/api/user'), {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      credentials: 'include',
    })

    return response.ok
  } catch {
    return false
  }
}
