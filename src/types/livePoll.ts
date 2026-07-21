export interface LivePollOption {
  id: string
  option_text: string
  display_order: number
  votes?: number
}

export type PollStatus = 'draft' | 'active' | 'closed'
export type PollType = 'multiple_choice' | 'yes_no' | 'rating'

export interface LivePoll {
  id: string
  title: string
  description: string | null
  question: string
  poll_type: PollType
  status: PollStatus
  duration_minutes: number | null
  allow_multiple_votes: boolean
  anonymous: boolean
  show_results: boolean
  public_token: string
  created_by: string
  started_at: string | null
  ended_at: string | null
  options: LivePollOption[]
  created_at: string
  updated_at: string
}

export interface LivePollFormData {
  title: string
  description?: string
  question: string
  poll_type: PollType
  options: string[]
  duration_minutes?: number | null
  allow_multiple_votes?: boolean
  anonymous?: boolean
  show_results?: boolean
}

export interface LivePollResultOption {
  id: string
  option_text: string
  display_order: number
  votes: number
}

export interface LivePollResults {
  question: string
  status: PollStatus
  total_votes: number
  anonymous: boolean
  options: LivePollResultOption[]
}

export interface ActivePollItem {
  id: string
  question: string
  title: string | null
  poll_type: PollType
  public_token: string
  duration_minutes: number | null
  started_at: string | null
  anonymous: boolean
  allow_multiple_votes: boolean
  created_at: string
  options_count: number
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
