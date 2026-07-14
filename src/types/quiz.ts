export interface QuizFormData {
  title: string
  description: string
  subject: string
  class_name: string
  duration: number
  passing_score: number
  due_date: string
  shuffle_questions: boolean
  status: 'draft' | 'published'
}

export interface Quiz extends QuizFormData {
  id: string
  teacher_id: string | null
  created_at: string
  updated_at: string
}
