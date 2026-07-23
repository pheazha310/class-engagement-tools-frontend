<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import api from '@/services/api'

import '@/assets/css/auth.css'

const router = useRouter()
const auth = useAuthStore()

type Role = '' | 'student' | 'teacher'

interface FormData {
  name: string
  email: string
  password: string
  passwordConfirmation: string
  role: Role
  countryCode: string
  countryId: number | null
  countryName: string
  provinceId: number | null
  province: string
  schoolId: number | null
  schoolName: string
}

const form = ref<FormData>({
  name: '',
  email: '',
  password: '',
  passwordConfirmation: '',
  role: '',
  countryCode: '',
  countryId: null,
  countryName: '',
  provinceId: null,
  province: '',
  schoolId: null,
  schoolName: '',
})

interface CountryOption {
  id: number
  code: string
  name: string
}

interface ProvinceOption {
  id: number
  name: string
}

interface SchoolOption {
  id: number
  name: string
}

interface LocationOptionResponse {
  country: CountryOption
  province: ProvinceOption
  school: SchoolOption
}

const countries = ref<CountryOption[]>([])
const provinces = ref<ProvinceOption[]>([])
const schools = ref<SchoolOption[]>([])
const loadingCountries = ref(false)
const loadingProvinces = ref(false)
const loadingSchools = ref(false)
const showAddLocation = ref(false)
const savingLocation = ref(false)
const locationError = ref('')
const locationSuccess = ref('')

const newLocation = ref({
  countryName: '',
  countryCode: '',
  provinceName: '',
  schoolName: '',
})

const step = ref(1)
const error = ref('')
const submitting = ref(false)
const success = ref(false)
const showPassword = ref(false)
const showConfirmPassword = ref(false)

const passwordMatch = computed(() =>
  form.value.password === form.value.passwordConfirmation
)

const passwordStrength = computed(() => {
  const pwd = form.value.password
  if (!pwd) return 0
  let score = 0
  if (pwd.length >= 8) score += 25
  if (pwd.length >= 12) score += 15
  if (/[A-Z]/.test(pwd)) score += 20
  if (/[a-z]/.test(pwd)) score += 15
  if (/[0-9]/.test(pwd)) score += 15
  if (/[^A-Za-z0-9]/.test(pwd)) score += 10
  return Math.min(score, 100)
})

const passwordStrengthLabel = computed(() => {
  if (passwordStrength.value === 0) return ''
  if (passwordStrength.value < 30) return 'Weak'
  if (passwordStrength.value < 60) return 'Fair'
  if (passwordStrength.value < 80) return 'Good'
  return 'Strong'
})

const passwordStrengthColor = computed(() => {
  if (passwordStrength.value < 30) return '#ef4444'
  if (passwordStrength.value < 60) return '#f59e0b'
  if (passwordStrength.value < 80) return '#3b82f6'
  return '#10b981'
})

const step1Valid = computed(
  () =>
    form.value.name.trim() !== '' &&
    form.value.email.trim() !== '' &&
    form.value.password.length >= 8 &&
    passwordMatch.value
)

const step2Valid = computed(() => form.value.role !== '')

const step3Valid = computed(
  () =>
    form.value.countryCode !== '' &&
    form.value.provinceId !== null &&
    form.value.schoolId !== null
)

const selectedCountry = computed(() =>
  countries.value.find(c => c.code === form.value.countryCode) ?? null
)

const addLocationValid = computed(
  () =>
    newLocation.value.countryName.trim() !== '' &&
    newLocation.value.provinceName.trim() !== '' &&
    newLocation.value.schoolName.trim() !== ''
)

const steps = [
  { number: 1, label: 'Account', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
  { number: 2, label: 'Role', icon: 'M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0' },
  { number: 3, label: 'Location', icon: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z' },
  { number: 4, label: 'Review', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
]

async function fetchCountries() {
  loadingCountries.value = true
  try {
    const { data } = await api.get('/api/countries')
    console.log('[RegisterPage] countries response', data)
    countries.value = data.data ?? data
  } catch (err) {
    console.error('[RegisterPage] failed to load countries', err)
  } finally {
    loadingCountries.value = false
  }
}

async function selectCountry(countryCode: string) {
  form.value.countryCode = countryCode
  form.value.countryName = countries.value.find(c => c.code === countryCode)?.name ?? ''
  await fetchProvinces()
}

async function fetchProvinces() {
  const country = countries.value.find(c => c.code === form.value.countryCode)
  if (!country) return
  form.value.countryId = country.id
  form.value.province = ''
  form.value.provinceId = null
  form.value.schoolName = ''
  form.value.schoolId = null
  provinces.value = []
  schools.value = []
  loadingProvinces.value = true
  try {
    const { data } = await api.get(`/api/provinces`, { params: { country_id: country.id } })
    console.log('[RegisterPage] provinces response', data)
    provinces.value = data.data ?? data
  } catch (err) {
    console.error('[RegisterPage] failed to load provinces', err)
  } finally {
    loadingProvinces.value = false
  }
}

async function fetchSchools() {
  if (!form.value.provinceId) return
  form.value.schoolName = ''
  form.value.schoolId = null
  schools.value = []
  loadingSchools.value = true
  try {
    const { data } = await api.get(`/api/location-schools`, {
      params: {
        province_id: form.value.provinceId,
      },
    })
    console.log('[RegisterPage] schools response', data)
    schools.value = data ?? []
  } catch (err) {
    console.error('[RegisterPage] failed to load schools', err)
  } finally {
    loadingSchools.value = false
  }
}

onMounted(async () => {
  await fetchCountries()
  const cambodia = countries.value.find(c => c.code === 'KH')
  if (cambodia) {
    form.value.countryCode = cambodia.code
    form.value.countryName = cambodia.name
    form.value.countryId = cambodia.id
    await fetchProvinces()
  }
})

function openAddLocation() {
  locationError.value = ''
  locationSuccess.value = ''
  newLocation.value = {
    countryName: form.value.countryName || selectedCountry.value?.name || '',
    countryCode: form.value.countryCode || '',
    provinceName: form.value.province,
    schoolName: form.value.schoolName,
  }
  showAddLocation.value = true
}

function closeAddLocation() {
  if (savingLocation.value) return
  showAddLocation.value = false
  locationError.value = ''
  locationSuccess.value = ''
}

async function addLocationOption() {
  if (!addLocationValid.value) return

  savingLocation.value = true
  locationError.value = ''
  locationSuccess.value = ''

  try {
    const { data } = await api.post<LocationOptionResponse>('/api/location-options', {
      country_name: newLocation.value.countryName,
      country_code: newLocation.value.countryCode || undefined,
      province_name: newLocation.value.provinceName,
      school_name: newLocation.value.schoolName,
    })

    await fetchCountries()
    if (!countries.value.some(c => c.code === data.country.code)) {
      countries.value.push(data.country)
    }

    await selectCountry(data.country.code)
    if (!provinces.value.some(p => p.id === data.province.id)) {
      provinces.value.push(data.province)
    }

    form.value.province = data.province.name
    await fetchSchools()
    if (!schools.value.some(s => s.id === data.school.id)) {
      schools.value.push(data.school)
    }

    form.value.schoolName = data.school.name
    locationSuccess.value = 'Location added and selected.'
    showAddLocation.value = false
  } catch (err) {
    const response = (err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } }).response
    locationError.value = response?.data?.message
      || (response?.data?.errors ? Object.values(response.data.errors).flat().join(', ') : '')
      || 'Could not add this location.'
  } finally {
    savingLocation.value = false
  }
}

function nextStep() {
  if (step.value === 1 && step1Valid.value) step.value = 2
  else if (step.value === 2 && step2Valid.value) step.value = 3
  else if (step.value === 3 && step3Valid.value) step.value = 4
}

function prevStep() {
  if (step.value > 1) step.value--
}

function goToStep(n: number) {
  if (n >= step.value) return // only allow going back
  step.value = n
}

async function submit() {
  error.value = ''
  submitting.value = true

  const err = await auth.register({
    name: form.value.name,
    email: form.value.email,
    password: form.value.password,
    password_confirmation: form.value.passwordConfirmation,
    role: form.value.role,
    country_id: form.value.countryId,
    province_id: form.value.provinceId,
    school_id: form.value.schoolId,
    country_name: form.value.countryName,
    province_name: form.value.province,
    school_name: form.value.schoolName,
  })

  if (err) {
    error.value = err
    submitting.value = false
    return
  }

  success.value = true
  // Redirect based on user role
  const targetRoute = auth.user?.role === 'teacher' ? '/teacher/dashboard' : '/student/dashboard'
  setTimeout(() => router.replace(targetRoute), 2000)
}

const roleOptions: { value: Role; label: string; icon: string; desc: string; features: string[] }[] = [
  {
    value: 'student',
    label: 'Student',
    icon: '🎓',
    desc: 'Join classes and participate in activities',
    features: ['Join live polls and quizzes', 'View real-time results', 'Engage with interactive tools'],
  },
  {
    value: 'teacher',
    label: 'Teacher',
    icon: '👨‍🏫',
    desc: 'Create classes and manage your students',
    features: ['Create polls & quizzes', 'Monitor student engagement', 'Access classroom analytics'],
  },
]

const stepErrors = computed(() => {
  const errs: Record<string, string> = {}
  if (step.value === 1) {
    if (!form.value.name.trim()) errs.name = 'Name is required'
    if (!form.value.email.trim()) errs.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.value.email)) errs.email = 'Invalid email format'
    if (form.value.password.length > 0 && form.value.password.length < 6) errs.password = 'At least 6 characters'
    if (form.value.passwordConfirmation && !passwordMatch.value) errs.confirm = 'Passwords do not match'
  }
  return errs
})
</script>

<template>
  <div class="auth-page">
    <div class="auth-card auth-card--wide">
      <!-- Header -->
      <div class="auth-header">
        <div class="auth-badge">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="8.5" cy="7" r="4" />
            <line x1="20" y1="8" x2="20" y2="14" />
            <line x1="23" y1="11" x2="17" y2="11" />
          </svg>
          Secure Registration
        </div>
        <h1 class="auth-title">Create Account</h1>
        <p class="auth-subtitle">Join the platform in a few simple steps</p>
      </div>

      <!-- Premium Progress Stepper -->
      <div class="auth-stepper">
        <div class="auth-stepper__track">
          <div
            class="auth-stepper__fill"
            :style="{ width: `${((step - 1) / 3) * 100}%` }"
          />
        </div>
        <div class="auth-stepper__steps">
          <button
            v-for="s in steps"
            :key="s.number"
            type="button"
            class="auth-stepper__step"
            :class="{
              'auth-stepper__step--active': step === s.number,
              'auth-stepper__step--done': step > s.number,
              'auth-stepper__step--clickable': step > s.number,
            }"
            :disabled="step <= s.number"
            @click="goToStep(s.number)"
          >
            <div class="auth-stepper__circle">
              <svg v-if="step > s.number" class="auth-stepper__check" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <path :d="s.icon" />
              </svg>
              <div v-if="step === s.number" class="auth-stepper__pulse" />
            </div>
            <span class="auth-stepper__label">{{ s.label }}</span>
          </button>
        </div>
      </div>

      <!-- Success State -->
      <Transition name="scale-fade">
        <div v-if="success" class="auth-success">
          <div class="auth-success__orb" />
          <div class="auth-success__icon-wrap">
            <svg class="auth-success__icon" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <div class="auth-success__particles">
            <span v-for="i in 12" :key="i" class="auth-success__particle" :style="{ '--angle': `${i * 30}deg`, '--delay': `${i * 0.05}s` }" />
          </div>
          <h3 class="auth-success__title">Account Created!</h3>
          <p class="auth-success__text">Welcome aboard! Redirecting to your dashboard...</p>
          <div class="auth-success__dots">
            <span v-for="i in 3" :key="i" class="auth-success__dot" :style="{ animationDelay: `${i * 0.2}s` }" />
          </div>
        </div>
      </Transition>

      <!-- Form -->
      <form v-if="!success" class="auth-form" novalidate @submit.prevent="step < 4 ? nextStep() : submit()">
        <Transition name="fade">
          <div v-if="error" class="alert alert--error">
            <svg class="alert-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
            <span>{{ error }}</span>
          </div>
        </Transition>

        <!-- Step 1: Account Info -->
        <div v-show="step === 1" class="auth-step-panel">
          <div class="auth-step-panel__header">
            <h2 class="auth-step-panel__title">Personal Information</h2>
            <p class="auth-step-panel__desc">Tell us about yourself to get started</p>
          </div>

          <div class="auth-step-panel__body">
            <label class="form-group">
              <span class="form-label">Full Name</span>
              <div class="input-wrap">
                <svg class="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                <input
                  v-model="form.name"
                  type="text"
                  class="input"
                  :class="{ 'input--error': stepErrors.name }"
                  placeholder="John Doe"
                  required
                />
                <svg v-if="form.name.trim() && !stepErrors.name" class="input-valid" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <Transition name="fade">
                <span v-if="stepErrors.name" class="field-error">{{ stepErrors.name }}</span>
              </Transition>
            </label>

            <label class="form-group">
              <span class="form-label">Email Address</span>
              <div class="input-wrap">
                <svg class="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
                <input
                  v-model="form.email"
                  type="email"
                  class="input"
                  :class="{ 'input--error': stepErrors.email }"
                  placeholder="john@example.com"
                  required
                />
                <svg v-if="form.email.trim() && !stepErrors.email" class="input-valid" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <Transition name="fade">
                <span v-if="stepErrors.email" class="field-error">{{ stepErrors.email }}</span>
              </Transition>
            </label>

            <div class="auth-grid-2">
              <label class="form-group">
                <span class="form-label">Password</span>
                <div class="input-wrap">
                  <svg class="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  <input
                    v-model="form.password"
                    :type="showPassword ? 'text' : 'password'"
                    class="input"
                    :class="{ 'input--error': stepErrors.password }"
                     placeholder="At least 8 characters"
                    required
                  />
                  <button type="button" class="password-toggle" @click="showPassword = !showPassword" tabindex="-1">
                    <svg v-if="!showPassword" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                    <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  </button>
                </div>
                <!-- Password strength -->
                <div v-if="form.password.length > 0" class="auth-pw-strength">
                  <div class="auth-pw-strength__bar">
                    <div
                      class="auth-pw-strength__fill"
                      :style="{ width: `${passwordStrength}%`, backgroundColor: passwordStrengthColor }"
                    />
                  </div>
                  <span class="auth-pw-strength__label" :style="{ color: passwordStrengthColor }">
                    {{ passwordStrengthLabel }}
                  </span>
                </div>
                <Transition name="fade">
                  <span v-if="stepErrors.password" class="field-error">{{ stepErrors.password }}</span>
                </Transition>
              </label>

              <label class="form-group">
                <span class="form-label">Confirm Password</span>
                <div class="input-wrap">
                  <svg class="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  <input
                    v-model="form.passwordConfirmation"
                    :type="showConfirmPassword ? 'text' : 'password'"
                    class="input"
                    :class="{ 'input--error': form.passwordConfirmation && !passwordMatch }"
                    placeholder="Repeat password"
                    required
                  />
                  <button type="button" class="password-toggle" @click="showConfirmPassword = !showConfirmPassword" tabindex="-1">
                    <svg v-if="!showConfirmPassword" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                    <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  </button>
                </div>
                <Transition name="fade">
                  <span v-if="stepErrors.confirm" class="field-error">{{ stepErrors.confirm }}</span>
                </Transition>
              </label>
            </div>
          </div>
        </div>

        <!-- Step 2: Role -->
        <div v-show="step === 2" class="auth-step-panel">
          <div class="auth-step-panel__header">
            <h2 class="auth-step-panel__title">Select Your Role</h2>
            <p class="auth-step-panel__desc">Choose how you'll use the platform</p>
          </div>

          <div class="auth-step-panel__body">
            <div class="auth-role-grid">
              <button
                v-for="opt in roleOptions"
                :key="opt.value"
                type="button"
                class="auth-role-card"
                :class="{ 'auth-role-card--active': form.role === opt.value }"
                @click="form.role = opt.value"
              >
                <div class="auth-role-card__indicator">
                  <div v-if="form.role === opt.value" class="auth-role-card__check">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                </div>
                <div class="auth-role-card__icon">{{ opt.icon }}</div>
                <span class="auth-role-card__label">{{ opt.label }}</span>
                <span class="auth-role-card__desc">{{ opt.desc }}</span>
                <ul class="auth-role-card__features">
                  <li v-for="(feat, fi) in opt.features" :key="fi">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    {{ feat }}
                  </li>
                </ul>
              </button>
            </div>
          </div>
        </div>

        <!-- Step 3: Location -->
        <div v-show="step === 3" class="auth-step-panel">
          <div class="auth-step-panel__header auth-step-panel__header--split">
            <div>
              <h2 class="auth-step-panel__title">Your Location</h2>
              <p class="auth-step-panel__desc">Tell us where you're based</p>
            </div>
            <button type="button" class="auth-mini-btn" @click="openAddLocation">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Add location
            </button>
          </div>

          <div class="auth-step-panel__body auth-step-panel__body--location">
            <Transition name="fade">
              <div v-if="locationSuccess" class="auth-inline-success">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                {{ locationSuccess }}
              </div>
            </Transition>

            <div v-if="showAddLocation" class="auth-add-location">
              <div class="auth-add-location__header">
                <span class="auth-add-location__title">Add Missing Location</span>
                <button type="button" class="auth-icon-btn" aria-label="Close add location form" @click="closeAddLocation">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              <div class="auth-add-location__grid">
                <label class="form-group">
                  <span class="form-label">Country name</span>
                  <input v-model="newLocation.countryName" class="input input--plain" type="text" placeholder="Cambodia" />
                </label>

                <label class="form-group">
                  <span class="form-label">Country code</span>
                  <input v-model="newLocation.countryCode" class="input input--plain" type="text" placeholder="KH" maxlength="10" />
                </label>

                <label class="form-group">
                  <span class="form-label">Province</span>
                  <input v-model="newLocation.provinceName" class="input input--plain" type="text" placeholder="Phnom Penh" />
                </label>

                <label class="form-group">
                  <span class="form-label">School</span>
                  <input v-model="newLocation.schoolName" class="input input--plain" type="text" placeholder="School name" />
                </label>
              </div>

              <Transition name="fade">
                <span v-if="locationError" class="field-error">{{ locationError }}</span>
              </Transition>

              <div class="auth-add-location__actions">
                <button type="button" class="auth-btn auth-btn--secondary auth-btn--compact" :disabled="savingLocation" @click="closeAddLocation">
                  Cancel
                </button>
                <button type="button" class="auth-btn auth-btn--primary auth-btn--compact" :disabled="!addLocationValid || savingLocation" @click="addLocationOption">
                  <svg v-if="savingLocation" class="auth-spinner" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <circle cx="12" cy="12" r="10" stroke-dasharray="31.4 31.4" stroke-linecap="round" />
                  </svg>
                  <span>{{ savingLocation ? 'Saving...' : 'Save and select' }}</span>
                </button>
              </div>
            </div>

            <label class="form-group">
              <span class="form-label">Country</span>
              <div class="input-wrap">
                <svg class="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="2" y1="12" x2="22" y2="12" />
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                </svg>
                <select
                  v-model="form.countryCode"
                  class="input input--select"
                  :disabled="loadingCountries"
                  @change="selectCountry(form.countryCode)"
                >
                  <option value="" disabled>{{ loadingCountries ? 'Loading...' : 'Select a country' }}</option>
                  <option v-for="c in countries" :key="c.code" :value="c.code">{{ c.name }}</option>
                </select>
                <svg v-if="loadingCountries" class="input-spinner" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <circle cx="12" cy="12" r="10" stroke-dasharray="31.4 31.4" stroke-linecap="round" />
                </svg>
              </div>
            </label>

            <label class="form-group">
              <span class="form-label">Province</span>
              <div class="input-wrap">
                <svg class="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <select
                  v-model="form.provinceId"
                  class="input input--select"
                  :disabled="!form.countryCode || loadingProvinces"
                  @change="form.province = provinces.find(p => p.id === form.provinceId)?.name ?? ''; fetchSchools()"
                >
                  <option :value="null" disabled>
                    {{ loadingProvinces ? 'Loading...' : form.countryCode ? 'Select a province' : 'Select a country first' }}
                  </option>
                  <option v-for="p in provinces" :key="p.id" :value="p.id">{{ p.name }}</option>
                </select>
                <svg v-if="loadingProvinces" class="input-spinner" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <circle cx="12" cy="12" r="10" stroke-dasharray="31.4 31.4" stroke-linecap="round" />
                </svg>
              </div>
            </label>

            <label class="form-group">
              <span class="form-label">School</span>
              <div class="input-wrap">
                <svg class="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                  <path d="M6 12v5c3 3 9 3 12 0v-5" />
                </svg>
                <select
                  v-model="form.schoolId"
                  class="input input--select"
                  :disabled="!form.provinceId || loadingSchools"
                  @change="form.schoolName = schools.find(s => s.id === form.schoolId)?.name ?? ''"
                >
                  <option :value="null" disabled>
                    {{ loadingSchools ? 'Loading...' : form.provinceId ? 'Select a school' : 'Select a province first' }}
                  </option>
                  <option v-for="s in schools" :key="s.id" :value="s.id">{{ s.name }}</option>
                </select>
                <svg v-if="loadingSchools" class="input-spinner" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <circle cx="12" cy="12" r="10" stroke-dasharray="31.4 31.4" stroke-linecap="round" />
                </svg>
              </div>
            </label>
          </div>
        </div>

        <!-- Step 4: Review -->
        <div v-show="step === 4" class="auth-step-panel">
          <div class="auth-step-panel__header">
            <h2 class="auth-step-panel__title">Review Your Details</h2>
            <p class="auth-step-panel__desc">Please verify everything looks correct before submitting</p>
          </div>

          <div class="auth-step-panel__body">
            <div class="auth-review-grid">
              <div class="auth-review-section">
                <div class="auth-review-section__header">
                  <div class="auth-review-section__icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </div>
                  <span class="auth-review-section__title">Account</span>
                  <button type="button" class="auth-review-section__edit" @click="goToStep(1)">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                    Edit
                  </button>
                </div>
                <div class="auth-review-section__body">
                  <div class="auth-review-row">
                    <span class="auth-review-row__label">Name</span>
                    <span class="auth-review-row__value">{{ form.name }}</span>
                  </div>
                  <div class="auth-review-row">
                    <span class="auth-review-row__label">Email</span>
                    <span class="auth-review-row__value">{{ form.email }}</span>
                  </div>
                </div>
              </div>

              <div class="auth-review-section">
                <div class="auth-review-section__header">
                  <div class="auth-review-section__icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M10 6H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-5m-4 0V5a2 2 0 1 1 4 0v1m-4 0a2 2 0 1 0 4 0" />
                    </svg>
                  </div>
                  <span class="auth-review-section__title">Role</span>
                  <button type="button" class="auth-review-section__edit" @click="goToStep(2)">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                    Edit
                  </button>
                </div>
                <div class="auth-review-section__body">
                  <div class="auth-review-row">
                    <span class="auth-review-row__label">Role</span>
                    <span class="auth-review-row__badge" :class="form.role === 'teacher' ? 'auth-review-row__badge--teacher' : 'auth-review-row__badge--student'">
                      {{ form.role === 'teacher' ? '👨‍🏫 Teacher' : '🎓 Student' }}
                    </span>
                  </div>
                </div>
              </div>

              <div class="auth-review-section">
                <div class="auth-review-section__header">
                  <div class="auth-review-section__icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 0 1-2.827 0l-4.244-4.243a8 8 0 1 1 11.314 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                  </div>
                  <span class="auth-review-section__title">Location</span>
                  <button type="button" class="auth-review-section__edit" @click="goToStep(3)">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                    Edit
                  </button>
                </div>
                <div class="auth-review-section__body">
                  <div class="auth-review-row">
                    <span class="auth-review-row__label">Country</span>
                    <span class="auth-review-row__value">{{ form.countryName || '—' }}</span>
                  </div>
                  <div class="auth-review-row">
                    <span class="auth-review-row__label">Province</span>
                    <span class="auth-review-row__value">{{ form.province || '—' }}</span>
                  </div>
                  <div class="auth-review-row">
                    <span class="auth-review-row__label">School</span>
                    <span class="auth-review-row__value">{{ form.schoolName || '—' }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Step indicator dots -->
        <div class="auth-step-dots">
          <span
            v-for="i in 4"
            :key="i"
            class="auth-step-dot"
            :class="{ 'auth-step-dot--active': step === i, 'auth-step-dot--done': step > i }"
          />
        </div>

        <!-- Navigation -->
        <div class="nav-buttons">
          <button
            v-if="step > 1"
            type="button"
            class="auth-btn auth-btn--secondary"
            @click="prevStep"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            Back
          </button>
          <div v-else />

          <button
            type="button"
            class="auth-btn auth-btn--primary"
            :disabled="
              submitting ||
              (step === 1 && !step1Valid) ||
              (step === 2 && !step2Valid) ||
              (step === 3 && !step3Valid)
            "
            @click="step < 4 ? nextStep() : submit()"
          >
            <template v-if="submitting">
              <svg class="auth-spinner" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <circle cx="12" cy="12" r="10" stroke-dasharray="31.4 31.4" stroke-linecap="round" />
              </svg>
              Creating account...
            </template>
            <template v-else>
              <span>{{ step < 4 ? 'Continue' : 'Create Account' }}</span>
              <svg v-if="step < 4" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
              <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </template>
          </button>
        </div>
      </form>

      <!-- Footer -->
      <div class="auth-footer">
        <p class="auth-footer-text">
          Already have an account?
          <router-link to="/login" class="auth-footer-link">Sign in</router-link>
        </p>
      </div>
    </div>

    <!-- Background decorations -->
    <div class="auth-glow auth-glow--1" />
    <div class="auth-glow auth-glow--2" />
  </div>
</template>
