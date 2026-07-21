<script setup lang="ts">
import { ref, reactive, watch, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { rankingService } from '@/services/rankingService'
import { quizService } from '@/services/quizService'
import type { QuizRanking } from '@/types/ranking'
import type { Quiz } from '@/types/quiz'
import RankingTable from '@/components/RankingTable.vue'
import RankingFilter from '@/components/RankingFilter.vue'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import EmptyState from '@/components/EmptyState.vue'
import ToastNotification from '@/components/ToastNotification.vue'

const router = useRouter()
const route = useRoute()

const quizId = route.params.quizId as string

const quiz = ref<Quiz | null>(null)
const rankings = ref<QuizRanking[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const toastMessage = ref<string | null>(null)
const toastType = ref<'success' | 'error'>('success')

const filterTimeout = ref<ReturnType<typeof setTimeout> | null>(null)

async function loadRankings(filters?: { search?: string; class_name?: string; status?: string; sort_by?: string }) {
  loading.value = true
  error.value = null
  try {
    rankings.value = await rankingService.filterRankings(quizId, (filters || {}) as import('@/types/ranking').RankingFilters)
  } catch (e: any) {
    const msg = e.response?.data?.message || 'Failed to load rankings.'
    error.value = msg
    toastMessage.value = msg
    toastType.value = 'error'
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  loading.value = true
  try {
    const [quizData] = await Promise.all([
      quizService.getQuiz(quizId),
      loadRankings(),
    ])
    quiz.value = quizData
  } catch (e: any) {
    const msg = e.response?.data?.message || 'Failed to load data.'
    error.value = msg
    toastMessage.value = msg
    toastType.value = 'error'
  } finally {
    loading.value = false
  }
})

function onFilterUpdate(filters: { search: string; class_name: string; status: string; sort_by: string }) {
  if (filterTimeout.value) clearTimeout(filterTimeout.value)
  filterTimeout.value = setTimeout(() => {
    loadRankings(filters)
  }, 300)
}

function goBackToQuiz() {
  router.push({ name: 'teacher-quizzes' })
}
</script>

<template>
  <div class="ranking-page">
    <div class="ranking-bg" aria-hidden="true"></div>

    <div class="ranking-container">
      <!-- ===================== HEADER ===================== -->
      <header class="ranking-header">
        <div class="ranking-header-left">
          <button class="btn btn-back-icon" @click="goBackToQuiz" title="Back to quizzes">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
            </svg>
          </button>
          <div class="ranking-header-icon">
            <svg class="ranking-header-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5C7 4 9 6 9 8.5V15a2 2 0 0 1-2 2H4" />
              <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5C17 4 15 6 15 8.5V15a2 2 0 0 0 2 2h3" />
              <path d="M12 3v18" />
            </svg>
          </div>
          <div>
            <h1 class="ranking-header-title" v-if="quiz">{{ quiz.title }} — Rankings</h1>
            <h1 class="ranking-header-title" v-else>Student Rankings</h1>
            <p class="ranking-header-subtitle" v-if="quiz">
              {{ rankings.length }} student{{ rankings.length !== 1 ? 's' : '' }} · {{ quiz.subject }} · {{ quiz.class_name }}
            </p>
            <p class="ranking-header-subtitle" v-else>View student performance and results</p>
          </div>
        </div>
      </header>

      <!-- ===================== FILTERS ===================== -->
      <div class="ranking-filters-section">
        <RankingFilter @update="onFilterUpdate" />
      </div>

      <!-- ===================== ERROR ===================== -->
      <div v-if="error && !loading" class="error-banner">
        <svg class="error-banner-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <span>{{ error }}</span>
        <button class="error-retry-btn" @click="loadRankings()">Retry</button>
      </div>

      <!-- ===================== LOADING ===================== -->
      <LoadingSpinner v-if="loading && rankings.length === 0" />

      <!-- ===================== EMPTY ===================== -->
      <div v-else-if="!loading && rankings.length === 0 && !error" class="ranking-empty-state">
        <div class="ranking-empty-icon-wrapper">
          <span class="ranking-empty-icon">🏆</span>
        </div>
        <h3 class="ranking-empty-title">No rankings yet</h3>
        <p class="ranking-empty-desc">Students haven't taken this quiz yet. Rankings will appear here once submissions come in.</p>
      </div>

      <!-- ===================== TABLE ===================== -->
      <div v-else-if="rankings.length > 0" class="ranking-card">
        <RankingTable :rankings="rankings" :loading="loading" />
      </div>
    </div>

    <ToastNotification
      :message="toastMessage"
      :type="toastType"
      @close="toastMessage = null"
    />
  </div>
</template>

<style scoped>
/* ============================================================
   PAGE CONTAINER
   ============================================================ */
.ranking-page {
  position: relative;
  min-height: 100vh;
  padding: 7rem 1rem 4rem;
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
}

.ranking-bg {
  position: fixed;
  inset: 0;
  pointer-events: none;
  background:
    radial-gradient(ellipse 70% 50% at 50% -15%, rgba(13, 148, 136, 0.07), transparent),
    radial-gradient(ellipse 50% 40% at 20% 90%, rgba(99, 102, 241, 0.04), transparent);
  z-index: 0;
}

.ranking-container {
  position: relative;
  z-index: 1;
  max-width: 1100px;
  margin: 0 auto;
}

/* ============================================================
   HEADER
   ============================================================ */
.ranking-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 2.5rem;
  padding: 0 0.25rem;
  flex-wrap: wrap;
}

.ranking-header-left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.btn-back-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  border: 1px solid #cbd5e1;
  background: #ffffff;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s ease;
  padding: 0;
}

.btn-back-icon svg {
  width: 20px;
  height: 20px;
}

.btn-back-icon:hover {
  border-color: #3b82f6;
  color: #2563eb;
  background: #eff6ff;
}

.ranking-header-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 52px;
  height: 52px;
  border-radius: 14px;
  background: linear-gradient(135deg, #2563eb 0%, #3b82f6 100%);
  box-shadow: 0 8px 24px rgba(37, 99, 235, 0.25);
  flex-shrink: 0;
}

.ranking-header-svg {
  width: 26px;
  height: 26px;
  color: #fff;
}

.ranking-header-title {
  font-size: 1.625rem;
  font-weight: 700;
  color: #1e293b;
  letter-spacing: -0.02em;
  margin: 0;
  line-height: 1.3;
}

.ranking-header-subtitle {
  font-size: 0.9rem;
  color: #64748b;
  margin: 0.2rem 0 0;
  line-height: 1.4;
}

/* ============================================================
   FILTERS SECTION
   ============================================================ */
.ranking-filters-section {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 1rem 1.25rem;
  margin-bottom: 1.25rem;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
}

/* ============================================================
   ERROR BANNER
   ============================================================ */
.error-banner {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.25rem;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 12px;
  color: #991b1b;
  font-size: 0.875rem;
  margin-bottom: 1rem;
}

.error-banner-icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  color: #ef4444;
}

.error-retry-btn {
  margin-left: auto;
  padding: 0.35rem 0.85rem;
  border: 1px solid #fecaca;
  border-radius: 8px;
  background: #ffffff;
  color: #991b1b;
  font-size: 0.8rem;
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s ease;
}

.error-retry-btn:hover {
  background: #fee2e2;
}

/* ============================================================
   RANKING CARD
   ============================================================ */
.ranking-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 0.25rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  overflow: hidden;
}

/* ============================================================
   RANKING EMPTY STATE
   ============================================================ */
.ranking-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  border: 2px dashed #cbd5e1;
  border-radius: 16px;
  background: #ffffff;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.ranking-empty-icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 80px;
  height: 80px;
  margin-bottom: 1.5rem;
  background: linear-gradient(135deg, #eff6ff, #dbeafe);
  border-radius: 20px;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
}

.ranking-empty-icon {
  font-size: 2.5rem;
  line-height: 1;
}

.ranking-empty-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 0.75rem;
  letter-spacing: -0.02em;
}

.ranking-empty-desc {
  font-size: 1rem;
  color: #475569;
  margin: 0;
  max-width: 480px;
  line-height: 1.6;
}

/* ============================================================
   RESPONSIVE
   ============================================================ */
@media (max-width: 768px) {
  .ranking-page {
    padding: 1.25rem 0.75rem 3rem;
  }

  .ranking-header {
    flex-direction: column;
    align-items: stretch;
    gap: 0.75rem;
  }

  .ranking-header-left {
    flex-direction: column;
    text-align: center;
    gap: 0.6rem;
  }

  .ranking-header-icon {
    width: 48px;
    height: 48px;
  }

  .ranking-header-svg {
    width: 24px;
    height: 24px;
  }

  .ranking-header-title {
    font-size: 1.3rem;
  }

  .ranking-header-subtitle {
    font-size: 0.85rem;
  }

  .btn-back-icon {
    align-self: flex-start;
  }

  .ranking-filters-section {
    padding: 0.85rem;
  }

  .error-banner {
    flex-wrap: wrap;
  }
}
</style>
