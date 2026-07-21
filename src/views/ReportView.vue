<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { reportService } from '@/services/reportService'
import { quizService } from '@/services/quizService'
import type { Quiz } from '@/types/quiz'
import type { ReportFilters } from '@/types/report'
import ReportFilter from '@/components/ReportFilter.vue'
import ExportButton from '@/components/ExportButton.vue'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import ToastNotification from '@/components/ToastNotification.vue'

const router = useRouter()
const route = useRoute()

const quizId = route.params.quizId as string

const quiz = ref<Quiz | null>(null)
const loading = ref(false)
const exportingPdf = ref(false)
const exportingExcel = ref(false)
const toastMessage = ref<string | null>(null)
const toastType = ref<'success' | 'error'>('success')

const currentFilters = ref<ReportFilters>({
  class_name: '',
  date_from: '',
  date_to: '',
  student_name: '',
  status: '',
})

onMounted(async () => {
  loading.value = true
  try {
    const quizData = await quizService.getQuiz(quizId)
    quiz.value = quizData
  } catch (e: any) {
    toastMessage.value = e.response?.data?.message || 'Failed to load quiz data.'
    toastType.value = 'error'
  } finally {
    loading.value = false
  }
})

function onFiltersUpdate(filters: ReportFilters) {
  currentFilters.value = filters
}

function onResetFilters() {
  currentFilters.value = {
    class_name: '',
    date_from: '',
    date_to: '',
    student_name: '',
    status: '',
  }
}

async function handleExport(format: 'pdf' | 'excel') {
  const service = format === 'pdf' ? reportService.exportPDF : reportService.exportExcel
  const loadingRef = format === 'pdf' ? exportingPdf : exportingExcel

  loadingRef.value = true
  try {
    const filters = currentFilters.value
    const hasFilters = filters.class_name || filters.date_from || filters.date_to || filters.student_name || filters.status
    await service(quizId, hasFilters ? filters : undefined)
    toastMessage.value = `${format.toUpperCase()} report downloaded successfully!`
    toastType.value = 'success'
  } catch (e: any) {
    toastMessage.value = e.response?.data?.message || `Failed to export ${format.toUpperCase()} report.`
    toastType.value = 'error'
  } finally {
    loadingRef.value = false
  }
}

function goBackToQuiz() {
  router.push({ name: 'teacher-quizzes' })
}
</script>

<template>
  <div class="report-page">
    <div class="report-bg" aria-hidden="true"></div>

    <div class="report-container">
      <!-- ===================== HEADER ===================== -->
      <header class="report-header">
        <div class="report-header-left">
          <button class="btn btn-back-icon" @click="goBackToQuiz" title="Back to quizzes">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
            </svg>
          </button>
          <div class="report-header-icon">
            <svg class="report-header-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
          </div>
          <div>
            <h1 class="report-header-title" v-if="quiz">{{ quiz.title }} — Report</h1>
            <h1 class="report-header-title" v-else>Quiz Report</h1>
            <p class="report-header-subtitle" v-if="quiz">
              {{ quiz.subject }} · {{ quiz.class_name }} · Export results
            </p>
            <p class="report-header-subtitle" v-else>Export quiz results and analytics</p>
          </div>
        </div>
      </header>

      <!-- Loading -->
      <LoadingSpinner v-if="loading" />

      <template v-else>
        <!-- ===================== FILTERS CARD ===================== -->
        <div class="report-card report-card--filters">
          <div class="report-card-header">
            <div class="report-card-header-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <line x1="4" y1="21" x2="4" y2="14" /><line x1="4" y1="10" x2="4" y2="3" />
                <line x1="12" y1="21" x2="12" y2="12" /><line x1="12" y1="8" x2="12" y2="3" />
                <line x1="20" y1="21" x2="20" y2="16" /><line x1="20" y1="12" x2="20" y2="3" />
                <line x1="1" y1="14" x2="7" y2="14" /><line x1="9" y1="8" x2="15" y2="8" /><line x1="17" y1="16" x2="23" y2="16" />
              </svg>
            </div>
            <h2 class="report-card-title">Filter Results</h2>
          </div>
          <ReportFilter
            @update="onFiltersUpdate"
            @reset="onResetFilters"
          />
        </div>

        <!-- ===================== EXPORT CARD ===================== -->
        <div class="report-card report-card--export">
          <div class="report-card-header">
            <div class="report-card-header-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
            </div>
            <h2 class="report-card-title">Export Report</h2>
          </div>
          <p class="report-export-desc">
            Download a report of all quiz results. Apply filters above to narrow down the data before exporting.
          </p>
          <div class="report-export-buttons">
            <ExportButton
              format="pdf"
              :exporting="exportingPdf"
              @export="handleExport"
            />
            <ExportButton
              format="excel"
              :exporting="exportingExcel"
              @export="handleExport"
            />
          </div>
        </div>
      </template>
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
.report-page {
  position: relative;
  min-height: 100vh;
  padding: 7rem 1rem 4rem;
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
}

.report-bg {
  position: fixed;
  inset: 0;
  pointer-events: none;
  background:
    radial-gradient(ellipse 70% 50% at 50% -15%, rgba(13, 148, 136, 0.07), transparent),
    radial-gradient(ellipse 50% 40% at 20% 90%, rgba(99, 102, 241, 0.04), transparent);
  z-index: 0;
}

.report-container {
  position: relative;
  z-index: 1;
  max-width: 860px;
  margin: 0 auto;
}

/* ============================================================
   HEADER
   ============================================================ */
.report-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 2.5rem;
  padding: 0 0.25rem;
  flex-wrap: wrap;
}

.report-header-left {
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
  border-color: #14b8a6;
  color: #0d9488;
  background: #f0fdfa;
}

.report-header-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 52px;
  height: 52px;
  border-radius: 14px;
  background: linear-gradient(135deg, #0d9488 0%, #14b8a6 100%);
  box-shadow: 0 8px 24px rgba(13, 148, 136, 0.25);
  flex-shrink: 0;
}

.report-header-svg {
  width: 26px;
  height: 26px;
  color: #fff;
}

.report-header-title {
  font-size: 1.625rem;
  font-weight: 700;
  color: #1e293b;
  letter-spacing: -0.02em;
  margin: 0;
  line-height: 1.3;
}

.report-header-subtitle {
  font-size: 0.9rem;
  color: #64748b;
  margin: 0.2rem 0 0;
  line-height: 1.4;
}

/* ============================================================
   REPORT CARDS
   ============================================================ */
.report-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 20px;
  padding: 1.5rem;
  box-shadow:
    0 4px 12px rgba(0, 0, 0, 0.08),
    0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 1.25rem;
}

.report-card-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1.25rem;
}

.report-card-header-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: #f0fdfa;
  flex-shrink: 0;
}

.report-card-header-icon svg {
  width: 18px;
  height: 18px;
  color: #0d9488;
}

.report-card-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
}

.report-export-desc {
  font-size: 0.875rem;
  color: #64748b;
  margin: 0 0 1.25rem;
  line-height: 1.5;
}

.report-export-buttons {
  display: flex;
  gap: 0.85rem;
  flex-wrap: wrap;
}

/* ============================================================
   RESPONSIVE
   ============================================================ */
@media (max-width: 768px) {
  .report-page {
    padding: 1.25rem 0.75rem 3rem;
  }

  .report-header {
    flex-direction: column;
    align-items: stretch;
    gap: 0.75rem;
  }

  .report-header-left {
    flex-direction: column;
    text-align: center;
    gap: 0.6rem;
  }

  .report-header-icon {
    width: 48px;
    height: 48px;
  }

  .report-header-svg {
    width: 24px;
    height: 24px;
  }

  .report-header-title {
    font-size: 1.3rem;
  }

  .report-header-subtitle {
    font-size: 0.85rem;
  }

  .btn-back-icon {
    align-self: flex-start;
  }

  .report-card {
    padding: 1.25rem;
    border-radius: 16px;
  }

  .report-export-buttons {
    flex-direction: column;
  }
}
</style>
