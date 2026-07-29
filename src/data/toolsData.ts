export interface Tool { title: string; slug: string; icon: string; description: string; category: string; route?: string }
export interface Category { name: string; icon: string; slug: string; tools: Tool[] }

export const categories: Category[] = [
  { name: 'Random Tools', icon: 'wheel', slug: 'random', tools: [
    { title: 'Random Wheel', slug: 'random-wheel', icon: 'wheel', description: 'Choose students fairly with smooth spinning animations and reusable wheels.', category: 'Random Tools', route: '/wheel' },
    { title: 'Card Picker', slug: 'card-picker', icon: 'cards', description: 'Flip through student cards with a visually interactive picker — tap to select.', category: 'Random Tools', route: '/card-picker' },
    { title: 'Student Picker', slug: 'student-picker', icon: 'target', description: 'Pick one or several learners at once with visual card and lucky draw modes.', category: 'Random Tools', route: '/student-picker' },
    { title: 'Group Generator', slug: 'group-generator', icon: 'users', description: 'Create balanced teams quickly and share the groups with your class.', category: 'Random Tools', route: '/group-generator' },
  ] },
  { name: 'Student Engagement', icon: 'quiz', slug: 'student-engagement', tools: [
    { title: 'Classroom Quiz', slug: 'classroom-quiz', icon: 'quiz', description: 'Create quizzes with multiple formats and display live rankings.', category: 'Student Engagement', route: '/Classroom' },
    { title: 'Icebreakers', slug: 'icebreakers', icon: 'sparkles', description: 'Warm up your class with energizing prompts and team-building exercises.', category: 'Student Engagement', route: '/icebreakers' },
    { title: 'Mood Check', slug: 'mood-check', icon: 'smile', description: 'Check student mood and engagement levels.', category: 'Student Engagement', route: '/tools/mood-check' },
    { title: 'Word Cloud', slug: 'word-cloud', icon: 'cloud', description: 'Visualize word frequency and student responses.', category: 'Student Engagement', route: '/tools/word-cloud' },
    { title: 'Live Voting', slug: 'live-voting', icon: 'poll', description: 'Launch quick polls and collect instant student feedback in real time.', category: 'Student Engagement', route: '/live-voting' },
  ] },
  { name: 'Classroom Control', icon: 'timer', slug: 'classroom', tools: [
    { title: 'Timer', slug: 'timer', icon: 'timer', description: 'Run countdowns, stopwatches, and Pomodoro sessions with alerts.', category: 'Classroom Control', route: '/timer' },
    { title: 'Stopwatch', slug: 'stopwatch', icon: 'stopwatch', description: 'Measure activity duration with an easy-start stopwatch.', category: 'Classroom Control', route: '/stopwatch' },
    { title: 'Soundboard', slug: 'soundboard', icon: 'audio', description: 'Bring excitement to lessons with applause, countdown, and success sounds.', category: 'Classroom Control', route: '/soundboard' },
  ] },
  { name: 'Games', icon: 'gamepad', slug: 'games', tools: [
    { title: 'Math Challenge', slug: 'math-challenge', icon: 'calculator', description: 'Add friendly competition with math challenges.', category: 'Games', route: '/games/create' },
    { title: 'Vocabulary Race', slug: 'vocabulary-race', icon: 'book', description: 'Fun vocabulary building races for the classroom.', category: 'Games', route: '/games/create' },
    { title: 'Quiz Battle', slug: 'quiz-battle', icon: 'swords', description: 'Competitive quiz battles to engage students.', category: 'Games', route: '/games/create' },
    { title: 'Memory Game', slug: 'memory-game', icon: 'brain', description: 'Memory matching games for learning reinforcement.', category: 'Games', route: '/games/create' },
  ] },
]
export const allTools: Tool[] = categories.flatMap(category => category.tools.map(tool => ({ ...tool, category: category.name })))
