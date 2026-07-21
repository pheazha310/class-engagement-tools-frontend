import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { seededQuizzes, type SeededQuiz, type SeededQuestion } from '@/data/quizData'
import type { QuizRanking } from '@/types/ranking'

export interface QuizSubmission {
  id: string
  quizId: string
  studentName: string
  class_name: string
  answers: { questionId: string; selectedChoiceId: string | null }[]
  score: number
  totalPoints: number
  percentage: number
  timeTaken: number
  submittedAt: string
  status: 'pass' | 'fail'
  passingScore: number
}

export const useClassroomQuizStore = defineStore('classroomQuiz', () => {
  // --- State ---
  const quizzes = ref<SeededQuiz[]>([])
  const submissions = ref<QuizSubmission[]>([])
  const currentStudentName = ref('')
  const currentStudentClass = ref('')

  // --- Private helpers ---
  function saveToStorage() {
    try {
      localStorage.setItem('classroom-submissions', JSON.stringify(submissions.value))
      localStorage.setItem('classroom-student-name', currentStudentName.value)
      localStorage.setItem('classroom-student-class', currentStudentClass.value)
      localStorage.setItem('classroom-custom-quizzes', JSON.stringify(
        quizzes.value.filter(q => q.id.startsWith('custom-'))
      ))
    } catch { /* ignore */ }
  }

  function loadFromStorage() {
    try {
      const stored = localStorage.getItem('classroom-submissions')
      if (stored) submissions.value = JSON.parse(stored)
      const name = localStorage.getItem('classroom-student-name')
      if (name) currentStudentName.value = name
      const cls = localStorage.getItem('classroom-student-class')
      if (cls) currentStudentClass.value = cls
      const customQuizzes = localStorage.getItem('classroom-custom-quizzes')
      if (customQuizzes) {
        const parsed: SeededQuiz[] = JSON.parse(customQuizzes)
        for (const q of parsed) {
          if (!quizzes.value.find(existing => existing.id === q.id)) {
            quizzes.value.push(q)
          }
        }
      }
    } catch { /* ignore */ }
  }

  // --- Init ---
  function init() {
    if (quizzes.value.length === 0) {
      quizzes.value = seededQuizzes.map(q => ({
        ...q,
        questions: q.questions.map(qq => ({
          ...qq,
          choices: qq.choices.map(c => ({ ...c })),
        })),
      }))
    }
    loadFromStorage()
  }

  // --- Getters ---
  function getQuizById(id: string): SeededQuiz | undefined {
    return quizzes.value.find(q => q.id === id)
  }

  function shuffleArray<T>(arr: T[]): T[] {
    const result = [...arr]
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      const temp = result[i] as T
      result[i] = result[j] as T
      result[j] = temp
    }
    return result
  }

  function getQuestionsForQuiz(quizId: string): SeededQuestion[] {
    const quiz = getQuizById(quizId)
    if (!quiz) return []
    const questions = quiz.questions
    if (quiz.shuffle_questions) {
      return shuffleArray(questions)
    }
    return questions
  }

  const rankingsForQuizzes = computed(() => {
    const map: Record<string, QuizRanking[]> = {}
    const allStudentSubmissions: Record<string, { name: string; class_name: string; submissions: QuizSubmission[] }> = {}

    for (const sub of submissions.value) {
      const key = `${sub.studentName}-${sub.quizId}`
      if (!allStudentSubmissions[key]) {
        allStudentSubmissions[key] = {
          name: sub.studentName,
          class_name: sub.class_name,
          submissions: [],
        }
      }
      allStudentSubmissions[key]!.submissions.push(sub)
    }

    for (const quiz of quizzes.value) {
      const rankings: QuizRanking[] = []

      for (const s of Object.values(allStudentSubmissions)) {
        const bestSub = s.submissions
          .filter(sub => sub.quizId === quiz.id)
          .sort((a, b) => b.score - a.score || a.timeTaken - b.timeTaken)[0]

        if (!bestSub) continue

        rankings.push({
          id: `rank-${quiz.id}-${s.name}`,
          quiz_id: quiz.id,
          student_name: s.name,
          score: bestSub.score,
          percentage: bestSub.percentage,
          time_taken: bestSub.timeTaken,
          submitted_at: bestSub.submittedAt,
          status: bestSub.status,
          class_name: s.class_name,
        })
      }

      map[quiz.id] = rankings.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score
        return a.time_taken - b.time_taken
      })
    }

    return map
  })

  function getRankingsForQuiz(quizId: string): QuizRanking[] {
    return rankingsForQuizzes.value[quizId] || []
  }

  function hasStudentSubmitted(quizId: string, studentName: string): boolean {
    return submissions.value.some(
      s => s.quizId === quizId && s.studentName.toLowerCase() === studentName.toLowerCase()
    )
  }

  // --- Actions ---
  function setStudentInfo(name: string, className: string) {
    currentStudentName.value = name
    currentStudentClass.value = className
    saveToStorage()
  }

  function submitQuiz(
    quizId: string,
    studentName: string,
    className: string,
    answers: { questionId: string; selectedChoiceId: string | null }[],
    timeTaken: number
  ): QuizSubmission {
    const quiz = getQuizById(quizId)
    if (!quiz) throw new Error('Quiz not found')

    let score = 0
    let totalPoints = 0

    for (const question of quiz.questions) {
      totalPoints += question.points
      const answer = answers.find(a => a.questionId === question.id)
      if (answer) {
        const correctChoice = question.choices.find(c => c.is_correct)
        if (correctChoice && answer.selectedChoiceId === correctChoice.id) {
          score += question.points
        }
      }
    }

    const percentage = totalPoints > 0 ? (score / totalPoints) * 100 : 0
    const status: 'pass' | 'fail' = percentage >= quiz.passing_score ? 'pass' : 'fail'

    const submission: QuizSubmission = {
      id: `sub-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      quizId,
      studentName,
      class_name: className,
      answers,
      score,
      totalPoints,
      percentage,
      timeTaken,
      submittedAt: new Date().toISOString(),
      status,
      passingScore: quiz.passing_score,
    }

    submissions.value.push(submission)
    saveToStorage()
    return submission
  }

  function createCustomQuiz(quizData: SeededQuiz) {
    quizzes.value.push(quizData)
    saveToStorage()
  }

  function resetAllData() {
    submissions.value = []
    localStorage.removeItem('classroom-submissions')
  }

  return {
    quizzes,
    submissions,
    currentStudentName,
    currentStudentClass,
    init,
    getQuizById,
    getQuestionsForQuiz,
    getRankingsForQuiz,
    hasStudentSubmitted,
    setStudentInfo,
    submitQuiz,
    createCustomQuiz,
    resetAllData,
  }
})
