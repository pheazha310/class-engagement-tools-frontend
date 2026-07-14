<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

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
  countryName: string
  province: string
  schoolName: string
}

const form = ref<FormData>({
  name: '',
  email: '',
  password: '',
  passwordConfirmation: '',
  role: '',
  countryCode: '',
  countryName: '',
  province: '',
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

const countries = ref<CountryOption[]>([])
const provinces = ref<ProvinceOption[]>([])
const schools = ref<SchoolOption[]>([])
const loadingCountries = ref(false)
const loadingProvinces = ref(false)
const loadingSchools = ref(false)

const step = ref(1)
const error = ref('')
const submitting = ref(false)
const success = ref(false)
const showPassword = ref(false)
const showConfirmPassword = ref(false)

const passwordMatch = computed(() =>
  form.value.password === form.value.passwordConfirmation
)

const step1Valid = computed(
  () =>
    form.value.name.trim() !== '' &&
    form.value.email.trim() !== '' &&
    form.value.password.length >= 6 &&
    passwordMatch.value
)

const step2Valid = computed(() => form.value.role !== '')

const step3Valid = computed(
  () =>
    form.value.countryCode !== '' &&
    form.value.province !== '' &&
    form.value.schoolName !== ''
)

async function fetchCountries() {
  loadingCountries.value = true
  try {
    const res = await fetch('/api/countries')
    const data = await res.json()
    countries.value = data.data ?? data
  } catch {
    // ignore
  } finally {
    loadingCountries.value = false
  }
}

async function fetchProvinces() {
  const country = countries.value.find(c => c.code === form.value.countryCode)
  if (!country) return
  form.value.province = ''
  form.value.schoolName = ''
  provinces.value = []
  schools.value = []
  loadingProvinces.value = true
  try {
    const res = await fetch(`/api/provinces?country_id=${country.id}`)
    const data = await res.json()
    provinces.value = data.data ?? data
  } catch {
    // ignore
  } finally {
    loadingProvinces.value = false
  }
}

async function fetchSchools() {
  form.value.schoolName = ''
  schools.value = []
  loadingSchools.value = true
  try {
    const res = await fetch(`/api/location-schools?province=${encodeURIComponent(form.value.province)}`)
    const data = await res.json()
    schools.value = data ?? []
  } catch {
    // ignore
  } finally {
    loadingSchools.value = false
  }
}

onMounted(fetchCountries)

function nextStep() {
  if (step.value === 1 && step1Valid.value) step.value = 2
  else if (step.value === 2 && step2Valid.value) step.value = 3
  else if (step.value === 3 && step3Valid.value) step.value = 4
}

function prevStep() {
  if (step.value > 1) step.value--
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
    country: form.value.countryName,
    province: form.value.province,
    school_name: form.value.schoolName,
  })

  if (err) {
    error.value = err
    submitting.value = false
    return
  }

  success.value = true
  setTimeout(() => router.replace('/'), 1400)
}

const roleOptions: { value: Role; label: string }[] = [
  { value: 'student', label: 'Student' },
  { value: 'teacher', label: 'Teacher' },
]
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

      <!-- Progress Steps -->
      <div class="progress">
        <div
          v-for="i in 4"
          :key="i"
          class="progress-step"
          :class="{
            'progress-step--active': step === i,
            'progress-step--done': step > i,
          }"
        >
          <div class="progress-circle">{{ step > i ? '✓' : i }}</div>
          <span class="progress-label">{{ ['Register', 'Role', 'Location', 'Review'][i - 1] }}</span>
        </div>
      </div>

      <!-- Success State / Form -->
      <template v-if="success">
        <Transition name="scale-fade">
          <div class="success-message">
            <div class="success-icon-wrap">
              <svg class="success-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h3 class="success-title">Account Created!</h3>
            <p class="success-text">Redirecting to homepage...</p>
          </div>
        </Transition>
      </template>
      <form v-else class="auth-form" novalidate @submit.prevent="submit()">
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
        <div v-show="step === 1" class="step-content">
          <h2 class="step-title">Personal Information</h2>
          <p class="step-desc">Tell us about yourself</p>

          <label class="form-group">
            <span class="form-label">Full Name</span>
            <div class="input-wrap">
              <svg class="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              <input v-model="form.name" type="text" class="input" placeholder="John Doe" required />
            </div>
          </label>

          <label class="form-group">
            <span class="form-label">Email Address</span>
            <div class="input-wrap">
              <svg class="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
              <input v-model="form.email" type="email" class="input" placeholder="john@example.com" required />
            </div>
          </label>

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
                placeholder="At least 6 characters"
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
              <span v-if="form.passwordConfirmation && !passwordMatch" class="field-error">Passwords do not match</span>
            </Transition>
          </label>
        </div>

        <!-- Step 2: Role -->
        <div v-show="step === 2" class="step-content">
          <h2 class="step-title">Select Your Role</h2>
          <p class="step-desc">Choose how you'll use the platform</p>

          <div class="role-grid">
            <button
              v-for="opt in roleOptions"
              :key="opt.value"
              type="button"
              class="role-btn"
              :class="{ 'role-btn--active': form.role === opt.value }"
              @click="form.role = opt.value"
            >
              <span class="role-icon">
                {{ opt.value === 'student' ? '🎓' : '👨‍🏫' }}
              </span>
              <span class="role-label">{{ opt.label }}</span>
              <span class="role-desc">
                {{ opt.value === 'student' ? 'Join classes and participate' : 'Create classes and manage' }}
              </span>
            </button>
          </div>
        </div>

        <!-- Step 3: Location -->
        <div v-show="step === 3" class="step-content">
          <h2 class="step-title">Your Location</h2>
          <p class="step-desc">Tell us where you're based</p>

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
                @change="form.countryName = countries.find(c => c.code === form.countryCode)?.name ?? ''; fetchProvinces()"
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
                v-model="form.province"
                class="input input--select"
                :disabled="!form.countryCode || loadingProvinces"
                @change="fetchSchools()"
              >
                <option value="" disabled>
                  {{ loadingProvinces ? 'Loading...' : form.countryCode ? 'Select a province' : 'Select a country first' }}
                </option>
                <option v-for="p in provinces" :key="p.id" :value="p.name">{{ p.name }}</option>
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
                v-model="form.schoolName"
                class="input input--select"
                :disabled="!form.province || loadingSchools"
              >
                <option value="" disabled>
                  {{ loadingSchools ? 'Loading...' : form.province ? 'Select a school' : 'Select a province first' }}
                </option>
                <option v-for="s in schools" :key="s.id" :value="s.name">{{ s.name }}</option>
              </select>
              <svg v-if="loadingSchools" class="input-spinner" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <circle cx="12" cy="12" r="10" stroke-dasharray="31.4 31.4" stroke-linecap="round" />
              </svg>
            </div>
          </label>
        </div>

        <!-- Step 4: Review -->
        <div v-show="step === 4" class="step-content">
          <h2 class="step-title">Review Your Details</h2>
          <p class="step-desc">Please verify everything looks correct</p>

          <div class="review-grid">
            <div class="review-item">
              <span class="review-label">Name</span>
              <span class="review-value">{{ form.name }}</span>
            </div>
            <div class="review-item">
              <span class="review-label">Email</span>
              <span class="review-value">{{ form.email }}</span>
            </div>
            <div class="review-item">
              <span class="review-label">Role</span>
              <span class="review-value">{{ form.role.charAt(0).toUpperCase() + form.role.slice(1) }}</span>
            </div>
            <div class="review-item">
              <span class="review-label">Country</span>
              <span class="review-value">{{ form.countryName }}</span>
            </div>
            <div class="review-item">
              <span class="review-label">Province</span>
              <span class="review-value">{{ form.province }}</span>
            </div>
            <div class="review-item">
              <span class="review-label">School</span>
              <span class="review-value">{{ form.schoolName }}</span>
            </div>
          </div>
        </div>

        <!-- Navigation -->
        <div class="nav-buttons">
          <button v-if="step > 1" type="button" class="auth-btn auth-btn--secondary" @click="prevStep">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            Back
          </button>
          <button type="button" class="auth-btn auth-btn--primary" :disabled="submitting" @click="step < 4 ? nextStep() : submit()">
            <template v-if="submitting">
              <svg class="auth-spinner" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <circle cx="12" cy="12" r="10" stroke-dasharray="31.4 31.4" stroke-linecap="round" />
              </svg>
              Creating account...
            </template>
            <template v-else>
              {{ step < 4 ? 'Continue' : 'Create Account' }}
              <svg v-if="step < 4" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
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
