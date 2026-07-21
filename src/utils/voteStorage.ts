/**
 * Local Storage helper for votes on Live Voting polls.
 * Each voter gets a unique token stored in their browser so we can track
 * who has voted and prevent duplicate votes (unless multiple votes are allowed).
 */

const VOTES_STORAGE_KEY = 'live_voting_votes'
const VOTER_ID_KEY = 'live_voting_voter_id'

export interface Vote {
  id: string
  pollId: string
  optionIndex: number
  voterId: string
  timestamp: string
}

export interface PollResult {
  option: string
  votes: number
  percentage: number
  optionIndex: number
}

function getAllVotes(): Vote[] {
  try {
    const raw = localStorage.getItem(VOTES_STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Vote[]) : []
  } catch {
    return []
  }
}

function saveAllVotes(votes: Vote[]): void {
  localStorage.setItem(VOTES_STORAGE_KEY, JSON.stringify(votes))
}

function generateId(): string {
  return crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
}

/** Get or create a persistent voter ID for this browser */
export function getVoterId(): string {
  let id = localStorage.getItem(VOTER_ID_KEY)
  if (!id) {
    id = `voter-${generateId()}`
    localStorage.setItem(VOTER_ID_KEY, id)
  }
  return id
}

/** Check if the current voter has already voted on a given poll */
export function hasVoted(pollId: string): boolean {
  const voterId = getVoterId()
  return getAllVotes().some((v) => v.pollId === pollId && v.voterId === voterId)
}

/** Get all votes cast by the current voter */
export function getMyVotes(): Vote[] {
  const voterId = getVoterId()
  return getAllVotes().filter((v) => v.voterId === voterId)
}

/** Cast a vote on a poll */
export function castVote(pollId: string, optionIndex: number): Vote {
  const voterId = getVoterId()
  const vote: Vote = {
    id: generateId(),
    pollId,
    optionIndex,
    voterId,
    timestamp: new Date().toISOString(),
  }
  const votes = getAllVotes()
  votes.push(vote)
  saveAllVotes(votes)
  return vote
}

/** Get total vote count for a poll */
export function getTotalVotes(pollId: string): number {
  return getAllVotes().filter((v) => v.pollId === pollId).length
}

/** Get vote counts per option for a poll */
export function getVoteCounts(pollId: string, optionCount: number): number[] {
  const votes = getAllVotes().filter((v) => v.pollId === pollId)
  const counts = new Array(optionCount).fill(0)
  for (const vote of votes) {
    if (vote.optionIndex >= 0 && vote.optionIndex < optionCount) {
      counts[vote.optionIndex]++
    }
  }
  return counts
}

/** Get results formatted for display */
export function getResults(pollId: string, options: string[]): PollResult[] {
  const counts = getVoteCounts(pollId, options.length)
  const total = counts.reduce((sum, c) => sum + c, 0)

  return options.map((option, index) => ({
    option,
    votes: counts[index] ?? 0,
    percentage: total > 0 ? Math.round(((counts[index] ?? 0) / total) * 100) : 0,
    optionIndex: index,
  }))
}

/** Get the option index the current voter chose for a poll, or -1 if not voted */
export function getMyVoteOptionIndex(pollId: string): number {
  const voterId = getVoterId()
  const vote = getAllVotes().find((v) => v.pollId === pollId && v.voterId === voterId)
  return vote ? vote.optionIndex : -1
}
