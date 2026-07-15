import api from './api'
import type { ReportFilters } from '@/types/report'

export const reportService = {
  async exportPDF(quizId: string, filters?: ReportFilters) {
    const response = await api.get(`/api/quizzes/${quizId}/report/pdf`, {
      params: filters,
      responseType: 'blob',
    })
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `quiz-report-${quizId}.pdf`)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
  },

  async exportExcel(quizId: string, filters?: ReportFilters) {
    const response = await api.get(`/api/quizzes/${quizId}/report/excel`, {
      params: filters,
      responseType: 'blob',
    })
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `quiz-report-${quizId}.xlsx`)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
  },
}
