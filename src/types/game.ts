export interface GameTypeOption {
  id: string
  title: string
  icon: string
  description: string
}

export interface MathChallengeSettings {
  difficulty: 'easy' | 'medium' | 'hard'
  numQuestions: number
  timePerQuestion: number
  operations: string[]
}

export interface VocabularyRaceSettings {
  wordList: string
  teamMode: boolean
  timeLimit: number
  rounds: number
}

export interface QuizBattleSettings {
  numQuestions: number
  categories: string[]
  teamMode: boolean
  difficulty: 'easy' | 'medium' | 'hard'
}

export interface MemoryGameSettings {
  gridSize: number
  theme: string
  timeLimit: number
  pairs: number
}

export type GameSettings = MathChallengeSettings | VocabularyRaceSettings | QuizBattleSettings | MemoryGameSettings

export interface GameSessionPayload {
  game_type: string
  settings: Record<string, unknown>
  status?: string
}

export interface GameSessionResponse {
  game_session: Record<string, unknown>
  game_id: string | number
}

export interface QuestionOption {
  id: string
  label: string
}

export interface Question {
  id: string
  text: string
  type: 'multiple_choice' | 'text_input'
  options?: QuestionOption[]
  correctAnswer?: string
  points: number
}

export interface AnswerSubmission {
  questionId: string
  answer: string
  timeSpent: number
}

export interface GameState {
  gameType: string
  settings: Record<string, unknown>
  questions: Question[]
  currentQuestionIndex: number
  answers: AnswerSubmission[]
  score: number
  isComplete: boolean
  timeRemaining: number
  isAnswerSubmitted: boolean
}

export const gameTypes: GameTypeOption[] = [
  {
    id: 'math-challenge',
    title: 'Math Challenge',
    icon: '🔢',
    description: 'Add friendly competition with math challenges.',
  },
  {
    id: 'vocabulary-race',
    title: 'Vocabulary Race',
    icon: '📚',
    description: 'Fun vocabulary building races for the classroom.',
  },
  {
    id: 'quiz-battle',
    title: 'Quiz Battle',
    icon: '⚔️',
    description: 'Competitive quiz battles to engage students.',
  },
  {
    id: 'memory-game',
    title: 'Memory Game',
    icon: '🧠',
    description: 'Memory matching games for learning reinforcement.',
  },
]

export const defaultMathChallengeSettings: MathChallengeSettings = {
  difficulty: 'medium',
  numQuestions: 10,
  timePerQuestion: 30,
  operations: ['+', '-', '×', '÷'],
}

export const defaultVocabularyRaceSettings: VocabularyRaceSettings = {
  wordList: '',
  teamMode: false,
  timeLimit: 60,
  rounds: 3,
}

export const defaultQuizBattleSettings: QuizBattleSettings = {
  numQuestions: 10,
  categories: [],
  teamMode: false,
  difficulty: 'medium',
}

export const defaultMemoryGameSettings: MemoryGameSettings = {
  gridSize: 4,
  theme: 'animals',
  timeLimit: 120,
  pairs: 8,
}

export interface LeaderboardEntry {
  participantName: string
  score: number
}

export interface GameHistory {
  id: number
  game_session_id: number
  teacher_id: number
  game_type: string
  settings: Record<string, unknown>
  participants: string[]
  scores: Array<{ participant: string; score: number }>
  total_questions: number
  started_at: string
  ended_at: string
  created_at: string
  updated_at: string
}

export interface GameHistoryResponse {
  data: GameHistory[]
  meta: {
    total: number
    per_page: number
    current_page: number
    last_page: number
  }
}
