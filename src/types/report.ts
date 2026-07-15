export interface ReportFilters {
  class_name: string
  date_from: string
  date_to: string
  student_name: string
  status: 'pass' | 'fail' | ''
}

export interface ExportPayload {
  quiz_id: string
  filters: ReportFilters
  format: 'pdf' | 'excel'
}
