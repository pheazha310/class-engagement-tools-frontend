export interface PollOption {
  id: number
  option_text: string
  created_at: string
}

export interface Poll {
  id: number
  teacher_id: number
  question: string
  status: 'draft' | 'active' | 'ended'
  started_at: string | null
  ended_at: string | null
  options: PollOption[]
  total_votes?: number
  created_at: string
  updated_at: string
}

export interface PollResult {
  id: number
  option: string
  votes: number
  percentage: number
}

export interface PollResultsData {
  question: string
  status: string
  totalVotes: number
  results: PollResult[]
}

export interface VoteUpdatedPayload {
  pollId: number
  totalVotes: number
  results: PollResult[]
}

export interface PollFormData {
  question: string
  options: string[]
}

export interface PaginatedResponse<T> {
  data: T[]
  meta: {
    current_page: number
    last_page: number
    per_page: number
    total: number
  }
}
