export interface QuestionChoice {
  id?: string
  choice_text: string
  is_correct: boolean
}

export interface QuestionFormData {
  question_text: string
  question_type: 'multiple_choice' | 'true_false' | 'short_answer'
  points: number
  choices: QuestionChoice[]
  correct_answer: string
}

export interface Question {
  id: string
  quiz_id: string
  question_text: string
  question_type: 'multiple_choice' | 'true_false' | 'short_answer'
  points: number
  choices: QuestionChoice[]
  correct_answer: string
  order: number
  created_at: string
  updated_at: string
}
