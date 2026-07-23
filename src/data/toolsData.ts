export interface Tool {
  title: string
  slug: string
  icon: string
  description: string
  category: string
  route?: string
}

export interface Category {
  name: string
  icon: string
  slug: string
  tools: Tool[]
}

export const categories: Category[] = [
  {
    name: 'Random Tools',
    icon: '🎡',
    slug: 'random',
    tools: [
      { title: 'Random Wheel', slug: 'random-wheel', icon: '🎡', description: 'Choose students fairly with smooth spinning animations and reusable wheels.', category: 'Random Tools', route: '/wheel' },
      { title: 'Card Picker', slug: 'card-picker', icon: '🃏', description: 'Flip through student cards with a visually interactive picker — tap to select.', category: 'Random Tools', route: '/card-picker' },
      { title: 'Student Picker', slug: 'student-picker', icon: '🎯', description: 'Pick one or several learners at once with visual card and lucky draw modes.', category: 'Random Tools', route: '/student-picker' },
      { title: 'Group Generator', slug: 'group-generator', icon: '👥', description: 'Create balanced teams quickly and share the groups with your class.', category: 'Random Tools', route: '/group-generator' },
    ]
  },
  {
    name: 'Quiz & Assessment',
    icon: '📝',
    slug: 'quiz',
    tools: [
      { title: 'Classroom Quiz', slug: 'classroom-quiz', icon: '📝', description: 'Take pre-made quizzes, see your score, and view live rankings!', category: 'Quiz & Assessment', route: '/classroom' },
      { title: 'Live Voting', slug: 'live-voting', icon: '🗳️', description: 'Collect instant feedback with polls that work on any device.', category: 'Quiz & Assessment' },
      { title: 'Exit Ticket', slug: 'exit-ticket', icon: '🎫', description: 'Quick formative assessments to check student understanding.', category: 'Quiz & Assessment' },
    ]
  },
  {
    name: 'Classroom Control',
    icon: '⏱️',
    slug: 'classroom',
    tools: [
      { title: 'Timer', slug: 'timer', icon: '⏱️', description: 'Run countdowns, stopwatches, and Pomodoro sessions with alerts.', category: 'Classroom Control' },
      { title: 'Stopwatch', slug: 'stopwatch', icon: '⏱️', description: 'Measure activity duration with an easy-start stopwatch.', category: 'Classroom Control', route: '/stopwatch' },
      { title: 'Soundboard', slug: 'soundboard', icon: '🔊', description: 'Bring excitement to lessons with applause, countdown, and success sounds.', category: 'Classroom Control', route: '/soundboard' },
    ]
  },
  {
    name: 'Games',
    icon: '🎮',
    slug: 'games',
    tools: [
      { title: 'Math Challenge', slug: 'math-challenge', icon: '🔢', description: 'Add friendly competition with math challenges.', category: 'Games', route: '/games/create' },
      { title: 'Vocabulary Race', slug: 'vocabulary-race', icon: '📚', description: 'Fun vocabulary building races for the classroom.', category: 'Games', route: '/games/create' },
      { title: 'Quiz Battle', slug: 'quiz-battle', icon: '⚔️', description: 'Competitive quiz battles to engage students.', category: 'Games', route: '/games/create' },
      { title: 'Memory Game', slug: 'memory-game', icon: '🧠', description: 'Memory matching games for learning reinforcement.', category: 'Games', route: '/games/create' },
    ]
  },
  {
    name: 'Engagement',
    icon: '📊',
    slug: 'engagement',
    tools: [
      { title: 'Mood Check', slug: 'mood-check', icon: '😊', description: 'Check student mood and engagement levels.', category: 'Engagement' },
      { title: 'Word Cloud', slug: 'word-cloud', icon: '☁️', description: 'Visualize word frequency and student responses.', category: 'Engagement' },
      { title: 'Leaderboard', slug: 'leaderboard', icon: '🏆', description: 'Track and display student achievement rankings.', category: 'Engagement' },
    ]
  },
  {
    name: 'Fun Activities',
    icon: '🎉',
    slug: 'fun',
    tools: [
      { title: 'Icebreakers', slug: 'icebreakers', icon: '✨', description: 'Warm up your class with energizing prompts and team-building games.', category: 'Fun Activities' },
      { title: 'Bingo Generator', slug: 'bingo-generator', icon: '🎱', description: 'Create custom bingo games for any subject.', category: 'Fun Activities' },
      { title: 'Flashcards', slug: 'flashcards', icon: '📖', description: 'Interactive flashcards for vocabulary and concept review.', category: 'Fun Activities' },
    ]
  },
]

export const allTools: Tool[] = categories.flatMap((category) =>
  category.tools.map((tool) => ({ ...tool, category: category.name }))
)
