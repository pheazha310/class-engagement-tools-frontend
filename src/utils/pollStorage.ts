/**
 * Local Storage helper for polls (Live Voting).
 * All poll data is stored purely in the browser's localStorage — no backend calls.
 */

const STORAGE_KEY = 'live_voting_polls'

export interface LivePoll {
  id: string
  title: string
  description: string
  question: string
  type: 'multiple-choice' | 'yes-no' | 'rating-scale'
  options: string[]
  duration: number // minutes
  allowMultipleVotes: boolean
  anonymous: boolean
  status: 'draft' | 'active' | 'ended'
  createdAt: string
  updatedAt: string
}

function getAllPolls(): LivePoll[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as LivePoll[]) : []
  } catch {
    return []
  }
}

function saveAllPolls(polls: LivePoll[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(polls))
}

export function generateId(): string {
  return crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
}

export function getPolls(): LivePoll[] {
  return getAllPolls()
}

export function getPollById(id: string): LivePoll | undefined {
  return getAllPolls().find((p) => p.id === id)
}

export function createPoll(poll: Omit<LivePoll, 'id' | 'createdAt' | 'updatedAt'>): LivePoll {
  const polls = getAllPolls()
  const now = new Date().toISOString()
  const newPoll: LivePoll = {
    ...poll,
    id: generateId(),
    createdAt: now,
    updatedAt: now,
  }
  polls.push(newPoll)
  saveAllPolls(polls)
  return newPoll
}

export function updatePoll(
  id: string,
  updates: Partial<Omit<LivePoll, 'id' | 'createdAt'>>,
): LivePoll | undefined {
  const polls = getAllPolls()
  const index = polls.findIndex((p) => p.id === id)
  if (index === -1) return undefined
  polls[index] = {
    ...polls[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  } as LivePoll
  saveAllPolls(polls)
  return polls[index]
}

export function deletePoll(id: string): boolean {
  const polls = getAllPolls()
  const index = polls.findIndex((p) => p.id === id)
  if (index === -1) return false
  polls.splice(index, 1)
  saveAllPolls(polls)
  return true
}
