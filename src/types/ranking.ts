export interface QuizRanking {
  id: string
  quiz_id: string
  student_name: string
  score: number
  percentage: number
  time_taken: number
  submitted_at: string
  status: 'pass' | 'fail'
  class_name?: string
}

export interface RankingFilters {
  class_name?: string
  status?: 'pass' | 'fail' | ''
  search?: string
  sort_by?: 'highest_score' | 'lowest_score'
}
