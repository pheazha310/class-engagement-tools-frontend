import { defineStore } from 'pinia'
import { reactive, ref } from 'vue'
import type { RegistrationData } from '@/types/auth'
import api from '@/services/api'

const initialData: RegistrationData = {
  name: '',
  email: '',
  password: '',
  password_confirmation: '',
  role: null,
  country_id: null,
  province_id: null,
  school_id: null,
}

export const useRegistrationStore = defineStore('registration', () => {
  const currentStep = ref(1)
  const data = reactive<RegistrationData>({ ...initialData })
  const loading = ref(false)
  const error = ref<string | null>(null)
  const success = ref(false)

  function updateAccount(fields: Partial<Pick<RegistrationData, 'name' | 'email' | 'password' | 'password_confirmation'>>) {
    Object.assign(data, fields)
  }

  function updateRole(role: 'teacher' | 'student') {
    data.role = role
  }

  function updateLocation(location: Partial<Pick<RegistrationData, 'country_id' | 'province_id'>>) {
    Object.assign(data, location)
  }

  function updateSchool(schoolId: number | null) {
    data.school_id = schoolId
  }

  function nextStep() {
    currentStep.value++
  }

  function prevStep() {
    if (currentStep.value > 1) currentStep.value--
  }

  function goToStep(step: number) {
    currentStep.value = step
  }

  async function submitRegistration() {
    loading.value = true
    error.value = null
    try {
      await api.get('/sanctum/csrf-cookie')

      await api.post('/api/auth/register', {
        name: data.name,
        email: data.email,
        password: data.password,
        password_confirmation: data.password_confirmation,
        role: data.role,
        country_id: data.country_id,
        province_id: data.province_id,
        school_id: data.school_id,
      })

      await api.get('/sanctum/csrf-cookie')

      await api.post('/login', {
        email: data.email,
        password: data.password,
      })

      success.value = true
    } catch (e: any) {
      const errors = e.response?.data?.errors
      if (errors) {
        error.value = Object.values(errors).flat().join(', ')
      } else {
        error.value = e.response?.data?.message || 'Registration failed.'
      }
      throw e
    } finally {
      loading.value = false
    }
  }

  function reset() {
    currentStep.value = 1
    Object.assign(data, initialData)
    loading.value = false
    error.value = null
    success.value = false
  }

  return {
    currentStep,
    data,
    loading,
    error,
    success,
    updateAccount,
    updateRole,
    updateLocation,
    updateSchool,
    nextStep,
    prevStep,
    goToStep,
    submitRegistration,
    reset,
  }
})
