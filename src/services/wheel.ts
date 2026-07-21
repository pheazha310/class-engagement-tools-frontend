import type { Participant, SavedWheel } from '@/types/wheel'
import api from '@/services/api'
import type { AxiosError } from 'axios'

export class AuthenticationError extends Error {
  constructor(message: string = 'Unauthenticated') {
    super(message)
    this.name = 'AuthenticationError'
  }
}

export class AuthorizationError extends Error {
  constructor(message: string = 'Unauthorized access') {
    super(message)
    this.name = 'AuthorizationError'
  }
}

function handleAxiosError(error: unknown): Error {
  const axiosError = error as AxiosError
  if (axiosError?.response) {
    const status = axiosError.response.status
    const message = (axiosError.response.data as Record<string, unknown>)?.message || axiosError.message

    if (status === 401) {
      return new AuthenticationError(message as string || 'Session expired. Please log in again.')
    }

    if (status === 403) {
      return new AuthorizationError(message as string || 'You do not have permission to perform this action.')
    }

    return new Error(message as string || `Request failed: ${status}`)
  }

  return error instanceof Error ? error : new Error('Unknown error occurred')
}

export async function spinWheel(participants: Participant[]): Promise<Participant> {
  try {
    const { data } = await api.post('/api/wheel/spin', {
      participants: participants.map((p) => ({ id: p.id, name: p.name })),
    })

    const selected = participants.find(
      (p) => p.id === data.participant.id || p.name === data.participant.name,
    )
    if (!selected) {
      throw new Error('Selected participant not found in provided list')
    }

    return { ...selected }
  } catch {
    const fallback = participants[Math.floor(Math.random() * participants.length)]
    if (!fallback) {
      throw new Error('No participants available to spin')
    }
    return { ...fallback }
  }
}

async function addParticipant(wheelId: string, name: string): Promise<void> {
  try {
    await api.post(`/api/wheels/${wheelId}/participants`, { name })
  } catch (error) {
    const axiosError = error as AxiosError
    console.error('Failed to add participant:', axiosError.response?.data)
    throw error
  }
}

export async function listSavedWheels(): Promise<SavedWheel[]> {
  try {
    const { data } = await api.get('/api/wheels')
    return data
  } catch (error) {
    throw handleAxiosError(error)
  }
}

export async function createSavedWheel(payload: {
  name: string
  description?: string
  color?: string
  participants: Participant[]
}): Promise<SavedWheel> {
  try {
    const { data: wheel } = await api.post('/api/wheels', {
      name: payload.name,
      description: payload.description,
      color: payload.color,
    })

    for (const participant of payload.participants) {
      await addParticipant(wheel.id, participant.name)
    }

    try {
      const { data: fullWheel } = await api.get(`/api/wheels/${wheel.id}`)
      return fullWheel
    } catch {
      return wheel
    }
  } catch (error) {
    throw handleAxiosError(error)
  }
}

export async function updateSavedWheel(
  id: string,
  payload: {
    name?: string
    description?: string
    color?: string
    participants?: Participant[]
  },
): Promise<SavedWheel> {
  try {
    const { data } = await api.put(`/api/wheels/${id}`, payload)
    return data
  } catch (error) {
    throw handleAxiosError(error)
  }
}

export async function loadSavedWheel(id: string): Promise<SavedWheel> {
  try {
    const { data } = await api.get(`/api/wheels/${id}`)
    return data
  } catch (error) {
    throw handleAxiosError(error)
  }
}

export async function deleteSavedWheel(id: string): Promise<void> {
  try {
    await api.delete(`/api/wheels/${id}`)
  } catch (error) {
    throw handleAxiosError(error)
  }
}

export interface ShareTokenResponse {
  share_token: string
  shared_url: string
}

export async function generateShareToken(wheelId: string): Promise<ShareTokenResponse> {
  try {
    const { data } = await api.post(`/api/wheels/${wheelId}/share-token`, {})
    return data
  } catch (error) {
    throw handleAxiosError(error)
  }
}

export interface SharedWheel extends SavedWheel {
  theme?: {
    id: string
    name: string
    colors: string[]
    backgroundColor: string
    wheelBackground: string
    pointerColor: string
    pointerStroke: string
    textColor: string
    buttonGradient: [string, string]
    buttonShadow: string
    sliceStroke: string
    centerColor: string
  }
}

export async function loadSharedWheel(shareToken: string): Promise<SharedWheel> {
  try {
    const { data } = await api.get(`/api/wheels/shared/${encodeURIComponent(shareToken)}`)
    return data
  } catch (error) {
    throw handleAxiosError(error)
  }
}
