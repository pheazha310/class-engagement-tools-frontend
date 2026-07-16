export interface RegistrationData {
  name: string
  email: string
  password: string
  password_confirmation: string
  role: 'teacher' | 'student' | null
  country_id: number | null
  province_id: number | null
  school_id: number | null
}
