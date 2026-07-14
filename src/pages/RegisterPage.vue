<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

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
  <div class="page">
    <div class="card">
      <!-- Header -->
      <div class="header">
        <div class="badge">
          <svg class="badge-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="8.5" cy="7" r="4" />
            <line x1="20" y1="8" x2="20" y2="14" />
            <line x1="23" y1="11" x2="17" y2="11" />
          </svg>
          Secure Registration
        </div>
        <h1 class="title">Create Account</h1>
        <p class="subtitle">Join the platform in a few simple steps</p>
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

      <!-- Success State -->
      <Transition name="scale-fade">
        <div v-if="success" class="success-message">
          <div class="success-icon-wrap">
            <svg class="success-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h3 class="success-title">Account Created!</h3>
          <p class="success-text">Redirecting to homepage...</p>
        </div>
      </Transition>

      <!-- Form -->
      <form v-else novalidate @submit.prevent="submit()">
        <Transition name="fade">
          <div v-if="error" class="alert alert-error">
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
              <button type="button" class="toggle-password" @click="showPassword = !showPassword" tabindex="-1">
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
              <button type="button" class="toggle-password" @click="showConfirmPassword = !showConfirmPassword" tabindex="-1">
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
          <button v-if="step > 1" type="button" class="btn btn-secondary" @click="prevStep">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            Back
          </button>
          <button type="button" class="btn btn-primary" :disabled="submitting" @click="step < 4 ? nextStep() : submit()">
            <template v-if="submitting">
              <svg class="spinner" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
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
      <div class="footer">
        <p class="footer-text">
          Already have an account?
          <router-link to="/login" class="footer-link">Sign in</router-link>
        </p>
      </div>
    </div>

    <!-- Background decorations -->
    <div class="bg-glow bg-glow--1" />
    <div class="bg-glow bg-glow--2" />
  </div>
</template>

<style scoped>
.page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: #080812;
  position: relative;
  overflow: hidden;
}

/* ===== Background Glows ===== */
.bg-glow {
  position: absolute;
  border-radius: 50%;
  filter: blur(120px);
  pointer-events: none;
  z-index: 0;
}

.bg-glow--1 {
  width: 400px;
  height: 400px;
  background: rgba(78, 205, 196, 0.12);
  top: -120px;
  right: -100px;
}

.bg-glow--2 {
  width: 350px;
  height: 350px;
  background: rgba(99, 102, 241, 0.10);
  bottom: -100px;
  left: -80px;
}

/* ===== Card ===== */
.card {
  width: 100%;
  max-width: 460px;
  padding: 36px 32px 28px;
  background: #111127;
  border: 1px solid #1e1e40;
  border-radius: 20px;
  box-shadow:
    0 20px 60px rgba(0, 0, 0, 0.6),
    0 0 0 1px rgba(78, 205, 196, 0.05);
  position: relative;
  z-index: 1;
  animation: cardIn 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes cardIn {
  from {
    opacity: 0;
    transform: translateY(24px) scale(0.97);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* ===== Header ===== */
.header {
  text-align: center;
  margin-bottom: 24px;
}

.badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 700;
  color: #4ecdc4;
  background: rgba(78, 205, 196, 0.10);
  border: 1px solid rgba(78, 205, 196, 0.15);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 16px;
}

.badge-icon {
  opacity: 0.8;
}

.title {
  margin: 0 0 6px;
  font-size: 26px;
  font-weight: 800;
  color: #fff;
  letter-spacing: -0.02em;
}

.subtitle {
  margin: 0;
  font-size: 14px;
  color: #6b7280;
  line-height: 1.5;
}

/* ===== Progress Steps ===== */
.progress {
  display: flex;
  justify-content: space-between;
  margin-bottom: 28px;
  position: relative;
  padding: 0 8px;
}

.progress::before {
  content: '';
  position: absolute;
  top: 14px;
  left: 20px;
  right: 20px;
  height: 2px;
  background: #1e1e40;
  z-index: 0;
}

.progress-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  position: relative;
  z-index: 1;
}

.progress-circle {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-size: 12px;
  font-weight: 700;
  background: #0d0d22;
  color: #4b4b6e;
  border: 2px solid #1e1e40;
  transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.progress-step--active .progress-circle {
  background: #4ecdc4;
  color: #fff;
  border-color: #4ecdc4;
  box-shadow: 0 0 16px rgba(78, 205, 196, 0.35);
  transform: scale(1.1);
}

.progress-step--done .progress-circle {
  background: #2fa89e;
  color: #fff;
  border-color: #2fa89e;
}

.progress-label {
  font-size: 10px;
  color: #4b4b6e;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  font-weight: 600;
  transition: color 0.35s;
}

.progress-step--active .progress-label {
  color: #4ecdc4;
}

.progress-step--done .progress-label {
  color: #2fa89e;
}

/* ===== Step Content ===== */
.step-content {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.step-title {
  margin: 0;
  font-size: 17px;
  font-weight: 700;
  color: #e8e8f0;
}

.step-desc {
  margin: -4px 0 4px;
  font-size: 13px;
  color: #6b7280;
}

/* ===== Form Elements ===== */
.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-label {
  font-size: 12px;
  font-weight: 700;
  color: #c8c8dc;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.input-wrap {
  position: relative;
  display: flex;
  align-items: center;
}

.input-icon {
  position: absolute;
  left: 14px;
  color: #4b4b6e;
  pointer-events: none;
  transition: color 0.2s;
}

.input-wrap:focus-within .input-icon {
  color: #4ecdc4;
}

.input {
  width: 100%;
  padding: 13px 14px 13px 42px;
  border-radius: 12px;
  border: 1px solid #222244;
  background: #0d0d22;
  color: #e8e8f0;
  font-size: 15px;
  outline: none;
  font-family: inherit;
  transition: all 0.2s ease;
  appearance: none;
}

.input--select {
  cursor: pointer;
  padding-right: 36px;
}

.input::placeholder {
  color: #3a3a5c;
}

.input:focus {
  border-color: #4ecdc4;
  box-shadow: 0 0 0 3px rgba(78, 205, 196, 0.08);
}

.input--error {
  border-color: #ff6b6b !important;
}

.input--error:focus {
  box-shadow: 0 0 0 3px rgba(255, 107, 107, 0.10) !important;
}

.toggle-password {
  position: absolute;
  right: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  color: #4b4b6e;
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.2s;
  z-index: 2;
}

.toggle-password:hover {
  color: #8b8baa;
  background: rgba(255, 255, 255, 0.04);
}

.input-spinner {
  position: absolute;
  right: 14px;
  color: #4ecdc4;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.field-error {
  font-size: 12px;
  color: #ff6b6b;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 4px;
}

/* ===== Roles ===== */
.role-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-top: 4px;
}

.role-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 22px 16px;
  border-radius: 14px;
  border: 2px solid #222244;
  background: #0d0d22;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.25s ease;
  font-family: inherit;
}

.role-btn:hover {
  border-color: #4ecdc4;
  color: #e8e8f0;
  background: rgba(78, 205, 196, 0.04);
  transform: translateY(-2px);
}

.role-btn--active {
  border-color: #4ecdc4;
  background: rgba(78, 205, 196, 0.08);
  color: #4ecdc4;
  box-shadow: 0 0 20px rgba(78, 205, 196, 0.10);
}

.role-icon {
  font-size: 32px;
  line-height: 1;
}

.role-label {
  font-size: 15px;
  font-weight: 700;
}

.role-desc {
  font-size: 11px;
  color: #4b4b6e;
  text-align: center;
  line-height: 1.3;
}

.role-btn--active .role-desc {
  color: rgba(78, 205, 196, 0.6);
}

/* ===== Review Grid ===== */
.review-grid {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 4px;
}

.review-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #0d0d22;
  border-radius: 12px;
  border: 1px solid #1e1e40;
  transition: border-color 0.2s;
}

.review-item:hover {
  border-color: #2a2a55;
}

.review-label {
  font-size: 11px;
  font-weight: 700;
  color: #4b4b6e;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.review-value {
  font-size: 14px;
  color: #e8e8f0;
  font-weight: 500;
}

/* ===== Navigation ===== */
.nav-buttons {
  display: flex;
  gap: 10px;
  margin-top: 24px;
}

.nav-buttons > .btn:first-child {
  flex: 0 0 auto;
  min-width: 100px;
}

.nav-buttons > .btn:last-child {
  flex: 1;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 13px 20px;
  border: none;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.2s ease;
}

.btn-primary {
  color: #fff;
  background: linear-gradient(135deg, #4ecdc4, #2fa89e);
  box-shadow:
    0 4px 16px rgba(78, 205, 196, 0.30),
    inset 0 1px 0 rgba(255, 255, 255, 0.15);
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow:
    0 8px 24px rgba(78, 205, 196, 0.40),
    inset 0 1px 0 rgba(255, 255, 255, 0.15);
}

.btn-primary:active:not(:disabled) {
  transform: translateY(0);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  color: #8b8baa;
  background: #0d0d22;
  border: 1px solid #222244;
}

.btn-secondary:hover:not(:disabled) {
  background: #16163a;
  color: #e8e8f0;
  border-color: #3a3a6a;
}

.spinner {
  animation: spin 1s linear infinite;
}

/* ===== Alert ===== */
.alert {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 14px;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 600;
  line-height: 1.4;
  margin-bottom: 14px;
}

.alert-error {
  color: #ff6b6b;
  background: rgba(255, 107, 107, 0.08);
  border: 1px solid rgba(255, 107, 107, 0.15);
}

.alert-icon {
  flex-shrink: 0;
  opacity: 0.8;
}

/* ===== Success ===== */
.success-message {
  text-align: center;
  padding: 28px 0;
}

.success-icon-wrap {
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: linear-gradient(135deg, #2fa89e, #4ecdc4);
  margin: 0 auto 16px;
  box-shadow: 0 0 24px rgba(78, 205, 196, 0.30);
  animation: successPop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes successPop {
  from {
    transform: scale(0);
  }
  to {
    transform: scale(1);
  }
}

.success-icon {
  color: #fff;
}

.success-title {
  margin: 0 0 6px;
  font-size: 20px;
  font-weight: 800;
  color: #fff;
}

.success-text {
  margin: 0;
  font-size: 14px;
  color: #6b7280;
}

/* ===== Footer ===== */
.footer {
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid #1a1a3a;
  text-align: center;
}

.footer-text {
  margin: 0;
  font-size: 13px;
  color: #6b7280;
}

.footer-link {
  color: #4ecdc4;
  font-weight: 700;
  text-decoration: none;
  transition: color 0.2s;
}

.footer-link:hover {
  color: #6ee7de;
  text-decoration: underline;
}

/* ===== Transitions ===== */
.fade-enter-active,
.fade-leave-active {
  transition: all 0.25s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

.scale-fade-enter-active {
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.scale-fade-leave-active {
  transition: all 0.25s ease;
}

.scale-fade-enter-from {
  opacity: 0;
  transform: scale(0.9);
}

.scale-fade-leave-to {
  opacity: 0;
  transform: scale(0.9);
}
</style>
