import type { Participant } from '@/types/wheel'

export async function spinWheel(participants: Participant[]): Promise<Participant> {
  const selected = participants[Math.floor(Math.random() * participants.length)]
  if (!selected) {
    throw new Error('No participants available to spin')
  }

  return selected
}
