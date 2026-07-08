import type { Participant } from '@/types/wheel'

export async function spinWheel(participants: Participant[]): Promise<Participant> {
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
}
