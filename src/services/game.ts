import type { GameSessionPayload, GameSessionResponse } from '@/types/game'

export interface JoinGameSessionPayload {
  name: string
}

export interface JoinGameSessionResponse {
  message: string
  participant: Record<string, unknown>
}

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

export async function joinGameSession(
  joinCode: string,
  payload: JoinGameSessionPayload,
): Promise<JoinGameSessionResponse> {
  const response = await fetch(getApiUrl(`/api/game-sessions/${encodeURIComponent(joinCode)}/join`), {
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
    throw new Error(data.message || `Failed to join game session: ${response.status}`)
  }

  return response.json()
}
