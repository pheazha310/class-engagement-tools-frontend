import type { Participant, SavedWheel } from '@/types/wheel'

export async function spinWheel(participants: Participant[]): Promise<Participant> {
  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/wheel/spin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ participants: participants.map((p) => ({ id: p.id, name: p.name })) }),
    })

    if (!response.ok) {
      const data = await response.json().catch(() => ({}))
      throw new Error(data.message || `Spin failed: ${response.status}`)
    }

    const data = await response.json()
    const selected = participants.find(
      (p) => p.id === data.participant.id || p.name === data.participant.name,
    )
    if (!selected) {
      throw new Error('Selected participant not found in provided list')
    }

    return selected
  } catch {
    const fallback = participants[Math.floor(Math.random() * participants.length)]
    if (!fallback) {
      throw new Error('No participants available to spin')
    }
    return fallback
  }
}

async function addParticipant(wheelId: string, name: string): Promise<void> {
  const response = await fetch(`${import.meta.env.VITE_API_URL}/api/wheels/${wheelId}/participants`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ name }),
  })

  if (!response.ok) {
    const data = await response.json().catch(() => ({}))
    console.error('Failed to add participant:', data.message || response.status)
  }
}

export async function listSavedWheels(): Promise<SavedWheel[]> {
  const response = await fetch(`${import.meta.env.VITE_API_URL}/api/wheels`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
    credentials: 'include',
  })

  if (!response.ok) {
    const data = await response.json().catch(() => ({}))
    throw new Error(data.message || `Failed to load wheels: ${response.status}`)
  }

  return response.json()
}

export async function createSavedWheel(payload: {
  name: string
  description?: string
  color?: string
  participants: Participant[]
}): Promise<SavedWheel> {
  const response = await fetch(`${import.meta.env.VITE_API_URL}/api/wheels`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({
      name: payload.name,
      description: payload.description,
      color: payload.color,
    }),
  })

  if (!response.ok) {
    const data = await response.json().catch(() => ({}))
    throw new Error(data.message || `Failed to save wheel: ${response.status}`)
  }

  const wheel = await response.json()

  for (const participant of payload.participants) {
    await addParticipant(wheel.id, participant.name)
  }

  const wheelResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/wheels/${wheel.id}`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
    credentials: 'include',
  })

  if (!wheelResponse.ok) {
    return wheel
  }

  return wheelResponse.json()
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
  const response = await fetch(`${import.meta.env.VITE_API_URL}/api/wheels/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const data = await response.json().catch(() => ({}))
    throw new Error(data.message || `Failed to update wheel: ${response.status}`)
  }

  return response.json()
}

export async function loadSavedWheel(id: string): Promise<SavedWheel> {
  const response = await fetch(`${import.meta.env.VITE_API_URL}/api/wheels/${id}`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
    credentials: 'include',
  })

  if (!response.ok) {
    const data = await response.json().catch(() => ({}))
    throw new Error(data.message || `Failed to load wheel: ${response.status}`)
  }

  return response.json()
}

export async function deleteSavedWheel(id: string): Promise<void> {
  const response = await fetch(`${import.meta.env.VITE_API_URL}/api/wheels/${id}`, {
    method: 'DELETE',
    headers: {
      Accept: 'application/json',
    },
    credentials: 'include',
  })

  if (!response.ok) {
    const data = await response.json().catch(() => ({}))
    throw new Error(data.message || `Failed to delete wheel: ${response.status}`)
  }
}
