import type { AnswerSubmission, GameHistory, GameHistoryResponse, GameSessionPayload, GameSessionResponse, Question } from '@/types/game'

export interface JoinGameSessionPayload {
  name: string
}

export interface JoinGameSessionResponse {
  message: string
  participant: Record<string, unknown>
}

export interface QuestionsResponse {
  questions: Question[]
  timePerQuestion?: number
}

export interface SubmitAnswerResponse {
  is_correct: boolean
  points_awarded: number
  total_score: number
  score: number
  game_answer: Record<string, unknown>
}

export interface GameResultResponse {
  totalScore: number
  maxScore: number
  rank?: number
  answers: Array<{
    questionId: string
    isCorrect: boolean
    pointsEarned: number
  }>
}

export interface LeaderboardEntry {
  participantName: string
  score: number
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

export async function fetchGameQuestions(
  joinCode: string,
): Promise<QuestionsResponse> {
  const response = await fetch(getApiUrl(`/api/game-sessions/${encodeURIComponent(joinCode)}/questions`), {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
    credentials: 'include',
  })

  if (!response.ok) {
    const data = await response.json().catch(() => ({}))
    throw new Error(data.message || `Failed to load questions: ${response.status}`)
  }

  return response.json()
}

export async function submitAnswer(
  joinCode: string,
  payload: AnswerSubmission,
): Promise<SubmitAnswerResponse> {
  const response = await fetch(getApiUrl(`/api/game-sessions/${encodeURIComponent(joinCode)}/answers`), {
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
    throw new Error(data.message || `Failed to submit answer: ${response.status}`)
  }

  return response.json()
}

export async function fetchGameResults(
  joinCode: string,
): Promise<GameResultResponse> {
  const response = await fetch(getApiUrl(`/api/game-sessions/${encodeURIComponent(joinCode)}/results`), {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
    credentials: 'include',
  })

  if (!response.ok) {
    const data = await response.json().catch(() => ({}))
    throw new Error(data.message || `Failed to load results: ${response.status}`)
  }

  return response.json()
}

export interface LeaderboardResponse {
  leaderboard: LeaderboardEntry[]
}

export async function fetchLeaderboard(
  gameSessionId: number,
): Promise<LeaderboardResponse> {
  const response = await fetch(getApiUrl(`/api/game-sessions/${encodeURIComponent(String(gameSessionId))}/leaderboard`), {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
    credentials: 'include',
  })

  if (!response.ok) {
    const data = await response.json().catch(() => ({}))
    throw new Error(data.message || `Failed to load leaderboard: ${response.status}`)
  }

  return response.json()
}

export async function fetchGameHistories(): Promise<GameHistoryResponse> {
  const response = await fetch(getApiUrl('/api/game-histories'), {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
    credentials: 'include',
  })

  if (!response.ok) {
    const data = await response.json().catch(() => ({}))
    throw new Error(data.message || `Failed to load game history: ${response.status}`)
  }

  return response.json()
}

export async function fetchGameHistoryById(
  id: number,
): Promise<{ data: GameHistory }> {
  const response = await fetch(getApiUrl(`/api/game-histories/${encodeURIComponent(String(id))}`), {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
    credentials: 'include',
  })

  if (!response.ok) {
    const data = await response.json().catch(() => ({}))
    throw new Error(data.message || `Failed to load game history: ${response.status}`)
  }

  return response.json()
}
