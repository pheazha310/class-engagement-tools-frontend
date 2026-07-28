export interface PollOption {
  id: string
  option_text: string
  display_order?: number
  is_correct?: boolean
  created_at?: string
}

export interface Poll {
  id: string
  title?: string
  description?: string | null
  question: string
  teacher_id?: number
  room_code?: string
  status: 'draft' | 'active' | 'ended' | 'closed'
  is_multiple_choice?: boolean
  is_anonymous?: boolean
  is_quiz?: boolean
  is_open_text?: boolean
  max_points?: number | null
  correct_option_id?: string | null
  duration_minutes?: number | null
  // Backend field names
  poll_type?: string
  anonymous?: boolean
  allow_multiple_votes?: boolean
  show_results?: boolean
  public_token?: string
  created_by?: string
  started_at: string | null
  ended_at: string | null
  options: PollOption[]
  total_votes?: number
  participant_count?: number
  created_at: string
  updated_at: string
}

export interface PollResult {
  id: number
  option: string
  votes: number
  percentage: number
  points?: number | null
  is_correct?: boolean
}

export interface OpenTextResponse {
  text: string
  student_name?: string
  student_id?: number
}

export interface QuizSummary {
  correct_option_ids: number[]
  total_votes: number
  correct_votes: number
  correct_percentage: number
  correct_students: Array<{ student_id: number; student_name: string }>
}

export interface PollResultsData {
  question: string
  status: string
  totalVotes: number
  totalPoints?: number | null
  is_anonymous?: boolean
  is_quiz?: boolean
  is_open_text?: boolean
  max_points?: number | null
  has_weights?: boolean
  results: any[]
  quiz_summary?: QuizSummary | null
}

export interface VoteUpdatedPayload {
  pollId: number
  totalVotes: number
  results: any[]
  totalPoints?: number | null
  has_weights?: boolean
}

export interface PollFormData {
  question: string
  options: string[]
  is_multiple_choice?: boolean
  duration_minutes?: number | null
  is_anonymous?: boolean
  is_quiz?: boolean
  is_open_text?: boolean
  max_points?: number | null
  options_correct?: boolean[]
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

export interface QrCodeData {
  room_code: string
  join_url: string
  poll_id: number
}
