<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import Navbar from '@/components/Navbar.vue'
import { createGameSession } from '@/services/game'
import type { GameTypeOption, GameSessionPayload, MathChallengeSettings, VocabularyRaceSettings, QuizBattleSettings, MemoryGameSettings } from '@/types/game'
import {
  gameTypes,
  defaultMathChallengeSettings,
  defaultVocabularyRaceSettings,
  defaultQuizBattleSettings,
  defaultMemoryGameSettings,
} from '@/types/game'

const router = useRouter()

const selectedGameType = ref<GameTypeOption | null>(null)
const isSubmitting = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

const settings = reactive<{
  math: MathChallengeSettings
  vocabulary: VocabularyRaceSettings
  quiz: QuizBattleSettings
  memory: MemoryGameSettings
}>({
  math: { ...defaultMathChallengeSettings },
  vocabulary: { ...defaultVocabularyRaceSettings },
  quiz: { ...defaultQuizBattleSettings },
  memory: { ...defaultMemoryGameSettings },
})

const isConfigureStep = computed(() => selectedGameType.value !== null)

const operationOptions = ['+', '-', '×', '÷']
const categoryOptions = ['Science', 'History', 'Math', 'English', 'Geography', 'Art']
const memoryThemeOptions = ['animals', 'space', 'nature', 'sports', 'music']

function selectGameType(game: GameTypeOption) {
  selectedGameType.value = game
  errorMessage.value = ''
  successMessage.value = ''
}

function goBack() {
  selectedGameType.value = null
  errorMessage.value = ''
  successMessage.value = ''
}

function validateSettings(): boolean {
  if (selectedGameType.value?.id === 'vocabulary-race') {
    const words = settings.vocabulary.wordList
      .split('\n')
      .map((w) => w.trim())
      .filter((w) => w.length > 0)
    if (words.length < 4) {
      errorMessage.value = 'Please enter at least 4 vocabulary words (one per line).'
      return false
    }
    if (settings.vocabulary.timeLimit < 10) {
      errorMessage.value = 'Time limit must be at least 10 seconds.'
      return false
    }
  }

  if (selectedGameType.value?.id === 'math-challenge') {
    if (settings.math.numQuestions < 1 || settings.math.numQuestions > 100) {
      errorMessage.value = 'Number of questions must be between 1 and 100.'
      return false
    }
    if (settings.math.timePerQuestion < 5) {
      errorMessage.value = 'Time per question must be at least 5 seconds.'
      return false
    }
    if (settings.math.operations.length === 0) {
      errorMessage.value = 'Please select at least one operation.'
      return false
    }
  }

  if (selectedGameType.value?.id === 'quiz-battle') {
    if (settings.quiz.numQuestions < 1 || settings.quiz.numQuestions > 100) {
      errorMessage.value = 'Number of questions must be between 1 and 100.'
      return false
    }
  }

  if (selectedGameType.value?.id === 'memory-game') {
    if (settings.memory.timeLimit < 10) {
      errorMessage.value = 'Time limit must be at least 10 seconds.'
      return false
    }
  }

  errorMessage.value = ''
  return true
}

async function handleSubmit() {
  if (!selectedGameType.value) return
  if (!validateSettings()) return

  isSubmitting.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    let payload: GameSessionPayload
    if (selectedGameType.value.id === 'math-challenge') {
      payload = {
        game_type: 'math-challenge',
        settings: settings.math as unknown as Record<string, unknown>,
        status: 'active',
      }
    } else if (selectedGameType.value.id === 'vocabulary-race') {
      const words = settings.vocabulary.wordList
        .split('\n')
        .map((w) => w.trim())
        .filter((w) => w.length > 0)
      payload = {
        game_type: 'vocabulary-race',
        settings: {
          ...settings.vocabulary,
          wordList: words,
        } as unknown as Record<string, unknown>,
        status: 'active',
      }
    } else if (selectedGameType.value.id === 'quiz-battle') {
      payload = {
        game_type: 'quiz-battle',
        settings: settings.quiz as unknown as Record<string, unknown>,
        status: 'active',
      }
    } else if (selectedGameType.value.id === 'memory-game') {
      payload = {
        game_type: 'memory-game',
        settings: settings.memory as unknown as Record<string, unknown>,
        status: 'active',
      }
    } else {
      throw new Error('Invalid game type selected')
    }

    await createGameSession(payload)
    successMessage.value = 'Game session created successfully!'
    setTimeout(() => {
      router.push('/tools')
    }, 1500)
  } catch (err) {
    errorMessage.value = err instanceof Error ? err.message : 'Failed to create game session. Please try again.'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="create-game-page">
    <Navbar />

    <section class="create-game-hero">
      <div class="container">
        <div class="create-game-hero-content">
          <h1 class="create-game-hero-title">Create Educational Game</h1>
          <p class="create-game-hero-subtitle">
            Select a game type and configure the settings to start an engaging classroom activity.
          </p>
        </div>
      </div>
    </section>

    <section class="create-game-content">
      <div class="container">
        <div v-if="!isConfigureStep" class="game-selection">
          <h2 class="section-title">Select a Game Type</h2>
          <div class="game-types-grid">
            <div
              v-for="game in gameTypes"
              :key="game.id"
              class="game-type-card"
              @click="selectGameType(game)"
            >
              <div class="game-type-icon">{{ game.icon }}</div>
              <div class="game-type-title">{{ game.title }}</div>
              <div class="game-type-description">{{ game.description }}</div>
              <div class="game-type-action">Configure →</div>
            </div>
          </div>
        </div>

        <div v-else class="game-configuration">
          <div class="config-header">
            <button class="btn-back" @click="goBack">← Back to games</button>
            <div class="selected-game-badge">
              <span class="selected-game-icon">{{ selectedGameType!.icon }}</span>
              <span class="selected-game-title">{{ selectedGameType!.title }}</span>
            </div>
          </div>

          <div class="config-card">
            <h2 class="section-title">Game Settings</h2>

            <div v-if="selectedGameType!.id === 'math-challenge'" class="config-form">
              <div class="form-group">
                <label class="form-label">Difficulty</label>
                <div class="radio-group">
                  <label v-for="level in ['easy', 'medium', 'hard']" :key="level" class="radio-label">
                    <input
                      v-model="settings.math.difficulty"
                      type="radio"
                      :value="level"
                      name="difficulty"
                    />
                    <span class="radio-text">{{ level.charAt(0).toUpperCase() + level.slice(1) }}</span>
                  </label>
                </div>
              </div>

              <div class="form-group">
                <label class="form-label" for="numQuestions">Number of Questions</label>
                <input
                  id="numQuestions"
                  v-model.number="settings.math.numQuestions"
                  type="number"
                  min="1"
                  max="100"
                  class="form-input"
                />
              </div>

              <div class="form-group">
                <label class="form-label" for="timePerQuestion">Time per Question (seconds)</label>
                <input
                  id="timePerQuestion"
                  v-model.number="settings.math.timePerQuestion"
                  type="number"
                  min="5"
                  max="300"
                  class="form-input"
                />
              </div>

              <div class="form-group">
                <label class="form-label">Operations</label>
                <div class="checkbox-group">
                  <label v-for="op in operationOptions" :key="op" class="checkbox-label">
                    <input
                      v-model="settings.math.operations"
                      type="checkbox"
                      :value="op"
                    />
                    <span class="checkbox-text">{{ op }}</span>
                  </label>
                </div>
              </div>
            </div>

            <div v-if="selectedGameType!.id === 'vocabulary-race'" class="config-form">
              <div class="form-group">
                <label class="form-label" for="wordList">Vocabulary Words (one per line)</label>
                <textarea
                  id="wordList"
                  v-model="settings.vocabulary.wordList"
                  rows="8"
                  placeholder="apple&#10;banana&#10;cherry&#10;date"
                  class="form-textarea"
                ></textarea>
                <span class="form-hint">Enter at least 4 words, one per line.</span>
              </div>

              <div class="form-group">
                <label class="form-label" for="timeLimit">Time Limit (seconds)</label>
                <input
                  id="timeLimit"
                  v-model.number="settings.vocabulary.timeLimit"
                  type="number"
                  min="10"
                  max="600"
                  class="form-input"
                />
              </div>

              <div class="form-group">
                <label class="form-label" for="rounds">Number of Rounds</label>
                <input
                  id="rounds"
                  v-model.number="settings.vocabulary.rounds"
                  type="number"
                  min="1"
                  max="20"
                  class="form-input"
                />
              </div>

              <div class="form-group">
                <label class="checkbox-label">
                  <input v-model="settings.vocabulary.teamMode" type="checkbox" />
                  <span class="checkbox-text">Enable Team Mode</span>
                </label>
              </div>
            </div>

            <div v-if="selectedGameType!.id === 'quiz-battle'" class="config-form">
              <div class="form-group">
                <label class="form-label" for="quizNumQuestions">Number of Questions</label>
                <input
                  id="quizNumQuestions"
                  v-model.number="settings.quiz.numQuestions"
                  type="number"
                  min="1"
                  max="100"
                  class="form-input"
                />
              </div>

              <div class="form-group">
                <label class="form-label" for="quizDifficulty">Difficulty</label>
                <div class="radio-group">
                  <label v-for="level in ['easy', 'medium', 'hard']" :key="level" class="radio-label">
                    <input
                      v-model="settings.quiz.difficulty"
                      type="radio"
                      :value="level"
                      name="quizDifficulty"
                    />
                    <span class="radio-text">{{ level.charAt(0).toUpperCase() + level.slice(1) }}</span>
                  </label>
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Categories</label>
                <div class="checkbox-group">
                  <label v-for="cat in categoryOptions" :key="cat" class="checkbox-label">
                    <input
                      v-model="settings.quiz.categories"
                      type="checkbox"
                      :value="cat"
                    />
                    <span class="checkbox-text">{{ cat }}</span>
                  </label>
                </div>
              </div>

              <div class="form-group">
                <label class="checkbox-label">
                  <input v-model="settings.quiz.teamMode" type="checkbox" />
                  <span class="checkbox-text">Enable Team Mode</span>
                </label>
              </div>
            </div>

            <div v-if="selectedGameType!.id === 'memory-game'" class="config-form">
              <div class="form-group">
                <label class="form-label" for="gridSize">Grid Size</label>
                <select id="gridSize" v-model.number="settings.memory.gridSize" class="form-select">
                  <option :value="2">2 x 2</option>
                  <option :value="4">4 x 4</option>
                  <option :value="6">6 x 6</option>
                  <option :value="8">8 x 8</option>
                </select>
              </div>

              <div class="form-group">
                <label class="form-label" for="memoryTheme">Theme</label>
                <select id="memoryTheme" v-model="settings.memory.theme" class="form-select">
                  <option v-for="theme in memoryThemeOptions" :key="theme" :value="theme">
                    {{ theme.charAt(0).toUpperCase() + theme.slice(1) }}
                  </option>
                </select>
              </div>

              <div class="form-group">
                <label class="form-label" for="memoryTimeLimit">Time Limit (seconds)</label>
                <input
                  id="memoryTimeLimit"
                  v-model.number="settings.memory.timeLimit"
                  type="number"
                  min="10"
                  max="600"
                  class="form-input"
                />
              </div>
            </div>

            <div v-if="errorMessage" class="alert alert-error">{{ errorMessage }}</div>
            <div v-if="successMessage" class="alert alert-success">{{ successMessage }}</div>

            <div class="config-actions">
              <button
                class="btn-submit"
                :disabled="isSubmitting"
                @click="handleSubmit"
              >
                {{ isSubmitting ? 'Creating...' : 'Start Game' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.create-game-page {
  min-height: 100vh;
}

.create-game-hero {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 120px 20px 80px;
  text-align: center;
}

.create-game-hero-content {
  max-width: 800px;
  margin: 0 auto;
  position: relative;
  z-index: 1;
}

.create-game-hero-title {
  font-size: 40px;
  font-weight: 800;
  margin-bottom: 16px;
  letter-spacing: -0.02em;
}

.create-game-hero-subtitle {
  font-size: 18px;
  opacity: 0.95;
  line-height: 1.6;
}

.create-game-content {
  padding: 60px 20px;
  background: linear-gradient(to bottom, #f8fafc, #f1f5f9);
}

.section-title {
  font-size: 24px;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 24px;
}

.game-types-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 24px;
}

.game-type-card {
  background: white;
  border-radius: 16px;
  padding: 28px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  border: 1px solid #e2e8f0;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.game-type-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.12);
  border-color: #cbd5e1;
}

.game-type-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.game-type-title {
  font-size: 18px;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 8px;
}

.game-type-description {
  font-size: 14px;
  color: #64748b;
  line-height: 1.6;
  margin-bottom: 16px;
}

.game-type-action {
  font-size: 14px;
  font-weight: 600;
  color: #2563eb;
}

.config-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.selected-game-badge {
  display: flex;
  align-items: center;
  gap: 10px;
  background: white;
  padding: 10px 18px;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  border: 1px solid #e2e8f0;
}

.selected-game-icon {
  font-size: 24px;
}

.selected-game-title {
  font-size: 16px;
  font-weight: 700;
  color: #0f172a;
}

.config-card {
  background: white;
  border-radius: 16px;
  padding: 32px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  border: 1px solid #e2e8f0;
  max-width: 720px;
}

.config-form {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-label {
  font-size: 14px;
  font-weight: 600;
  color: #0f172a;
}

.form-input,
.form-textarea,
.form-select {
  padding: 12px 16px;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  font-size: 15px;
  color: #0f172a;
  background: #f8fafc;
  transition: all 0.2s ease;
  font-family: inherit;
}

.form-input:focus,
.form-textarea:focus,
.form-select:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
  background: white;
}

.form-textarea {
  resize: vertical;
  min-height: 120px;
}

.form-select {
  cursor: pointer;
}

.form-hint {
  font-size: 13px;
  color: #64748b;
}

.radio-group,
.checkbox-group {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.radio-label,
.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 8px 14px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  background: #f8fafc;
  transition: all 0.2s ease;
  font-size: 14px;
  color: #334155;
}

.radio-label:hover,
.checkbox-label:hover {
  border-color: #cbd5e1;
  background: #f1f5f9;
}

.radio-label:has(input:checked),
.checkbox-label:has(input:checked) {
  border-color: #2563eb;
  background: #eff6ff;
  color: #2563eb;
  font-weight: 600;
}

.radio-label input,
.checkbox-label input {
  accent-color: #2563eb;
}

.alert {
  padding: 14px 18px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
}

.alert-error {
  background: #fef2f2;
  color: #b91c1c;
  border: 1px solid #fecaca;
}

.alert-success {
  background: #f0fdf4;
  color: #15803d;
  border: 1px solid #bbf7d0;
}

.config-actions {
  margin-top: 32px;
  display: flex;
  justify-content: flex-end;
}

.btn-back {
  display: inline-flex;
  align-items: center;
  padding: 10px 18px;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 600;
  font-size: 14px;
  border: 1.5px solid #e2e8f0;
  color: #334155;
  background: white;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-back:hover {
  border-color: #2563eb;
  color: #2563eb;
}

.btn-submit {
  padding: 14px 28px;
  border-radius: 10px;
  border: none;
  background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%);
  color: white;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
}

.btn-submit:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(37, 99, 235, 0.4);
}

.btn-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .create-game-hero {
    padding: 100px 20px 60px;
  }

  .create-game-hero-title {
    font-size: 28px;
  }

  .create-game-content {
    padding: 40px 20px;
  }

  .game-types-grid {
    grid-template-columns: 1fr;
  }

  .config-card {
    padding: 24px;
  }

  .radio-group,
  .checkbox-group {
    flex-direction: column;
  }
}
</style>
