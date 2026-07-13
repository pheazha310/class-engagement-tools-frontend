import type { GameSessionPayload, GameSessionResponse } from '@/types/game'

function getApiUrl(path: string): string {
  const baseUrl = typeof import.meta.env.VITE_API_URL === 'string' ? import.meta.env.VITE_API_URL.trim() : ''
  const normalizedBase = baseUrl.replace(/\/$/, '')
  if (normalizedBase) {
    return `${normalizedBase}${path}`
  }
  return path
}

export async function createGameSession(
  payload: GameSessionPayload,
): Promise<GameSessionResponse> {
  const response = await fetch(getApiUrl('/api/game-sessions'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const data = await response.json().catch(() => ({}))
    throw new Error(data.message || `Failed to create game session: ${response.status}`)
  }

  return response.json()
}
