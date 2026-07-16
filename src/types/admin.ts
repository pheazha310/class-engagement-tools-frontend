export interface AdminUserListItem {
  id: number
  name: string
  email: string
  email_verified_at: string | null
  roles: string[]
  created_at: string | null
}

export interface AdminUserFormData {
  name: string
  email: string
  password: string
  password_confirmation: string
  roles: string[]
}

export interface PaginatedResponse<T> {
  data: T[]
  current_page: number
  last_page: number
  per_page: number
  total: number
  from: number | null
  to: number | null
  links: { url: string | null; label: string; active: boolean }[]
}
