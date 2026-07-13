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
