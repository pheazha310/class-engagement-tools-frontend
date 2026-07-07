import { http } from '@/api/http'

export interface JoinSessionPayload {
  code: string
  displayName: string
}

export interface JoinSessionResponse {
  sessionId: string
  displayName: string
  joinedAt: string
}

export async function joinSession(payload: JoinSessionPayload): Promise<JoinSessionResponse> {
  const response = await http.post<JoinSessionResponse>('/api/join', payload)
  return response.data
}
