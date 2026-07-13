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
      <h1 class="title">Create Account</h1>
      <p class="subtitle">Join us in 4 easy steps</p>

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

      <div v-if="success" class="success-message">
        <div class="success-icon">✓</div>
        <p>Account created successfully! Redirecting home...</p>
      </div>

      <form v-else novalidate @submit.prevent="submit()">
        <div v-if="error" class="alert alert-error">{{ error }}</div>

        <!-- Step 1: Register -->
        <div v-show="step === 1" class="step">
          <h2 class="step-title">Personal Information</h2>

          <label class="form-group">
            <span class="form-label">Full Name</span>
            <input v-model="form.name" type="text" class="input" placeholder="John Doe" required />
          </label>

          <label class="form-group">
            <span class="form-label">Email Address</span>
            <input v-model="form.email" type="email" class="input" placeholder="john@example.com" required />
          </label>

          <label class="form-group">
            <span class="form-label">Password</span>
            <input v-model="form.password" type="password" class="input" placeholder="At least 6 characters" required />
          </label>

          <label class="form-group">
            <span class="form-label">Confirm Password</span>
            <input v-model="form.passwordConfirmation" type="password" class="input" placeholder="Repeat password" required />
            <span v-if="form.passwordConfirmation && !passwordMatch" class="field-error">Passwords do not match</span>
          </label>
        </div>

        <!-- Step 2: Role -->
        <div v-show="step === 2" class="step">
          <h2 class="step-title">Select Your Role</h2>
          <p class="step-desc">Choose how you'll use the platform.</p>

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
            </button>
          </div>
        </div>

        <!-- Step 3: Location -->
        <div v-show="step === 3" class="step">
          <h2 class="step-title">Your Location</h2>
          <p class="step-desc">Tell us where you're based.</p>

          <label class="form-group">
            <span class="form-label">Country</span>
            <select
              v-model="form.countryCode"
              class="input"
              :disabled="loadingCountries"
              @change="form.countryName = countries.find(c => c.code === form.countryCode)?.name ?? ''; fetchProvinces()"
            >
              <option value="" disabled>{{ loadingCountries ? 'Loading...' : 'Select a country' }}</option>
              <option v-for="c in countries" :key="c.code" :value="c.code">{{ c.name }}</option>
            </select>
          </label>

          <label class="form-group">
            <span class="form-label">Province</span>
            <select
              v-model="form.province"
              class="input"
              :disabled="!form.countryCode || loadingProvinces"
              @change="fetchSchools()"
            >
              <option value="" disabled>
                {{ loadingProvinces ? 'Loading...' : form.countryCode ? 'Select a province' : 'Select a country first' }}
              </option>
              <option v-for="p in provinces" :key="p.id" :value="p.name">{{ p.name }}</option>
            </select>
          </label>

          <label class="form-group">
            <span class="form-label">School Name</span>
            <select
              v-model="form.schoolName"
              class="input"
              :disabled="!form.province || loadingSchools"
            >
              <option value="" disabled>
                {{ loadingSchools ? 'Loading...' : form.province ? 'Select a school' : 'Select a province first' }}
              </option>
              <option v-for="s in schools" :key="s.id" :value="s.name">{{ s.name }}</option>
            </select>
          </label>
        </div>

        <!-- Step 4: Review -->
        <div v-show="step === 4" class="step">
          <h2 class="step-title">Review Your Details</h2>
          <p class="step-desc">Please verify before submitting.</p>

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
            Back
          </button>
          <button type="button" class="btn btn-primary" :disabled="submitting" @click="step < 4 ? nextStep() : submit()">
            {{ step < 4 ? 'Next' : submitting ? 'Creating account...' : 'Create Account' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
.page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: #0f0f1a;
}

.card {
  width: 100%;
  max-width: 440px;
  padding: 32px;
  background: #141428;
  border: 1px solid #252540;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
}

.title {
  margin: 0 0 4px;
  font-size: 22px;
  font-weight: 800;
  color: #fff;
  text-align: center;
}

.subtitle {
  margin: 0 0 24px;
  font-size: 14px;
  color: #888;
  text-align: center;
}

/* Progress Steps */
.progress {
  display: flex;
  justify-content: space-between;
  margin-bottom: 28px;
  position: relative;
}

.progress::before {
  content: '';
  position: absolute;
  top: 14px;
  left: 24px;
  right: 24px;
  height: 2px;
  background: #252540;
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
  background: #1a1a2e;
  color: #666;
  border: 2px solid #252540;
  transition: all 0.3s;
}

.progress-step--active .progress-circle {
  background: #4ecdc4;
  color: #fff;
  border-color: #4ecdc4;
  box-shadow: 0 0 12px rgba(78, 205, 196, 0.4);
}

.progress-step--done .progress-circle {
  background: #2fa89e;
  color: #fff;
  border-color: #2fa89e;
}

.progress-label {
  font-size: 10px;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  font-weight: 600;
}

.progress-step--active .progress-label {
  color: #4ecdc4;
}

.progress-step--done .progress-label {
  color: #2fa89e;
}

/* Steps */
.step {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.step-title {
  margin: 0;
  font-size: 17px;
  font-weight: 700;
  color: #fff;
}

.step-desc {
  margin: 0 0 4px;
  font-size: 13px;
  color: #888;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-label {
  font-size: 12px;
  font-weight: 700;
  color: #ddd;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.input {
  padding: 12px 14px;
  border-radius: 10px;
  border: 1px solid #2a2a45;
  background: #1a1a2e;
  color: #fff;
  font-size: 15px;
  outline: none;
  font-family: inherit;
}

.input:focus {
  border-color: #4ecdc4;
}

.field-error {
  font-size: 12px;
  color: #ff6b6b;
  font-weight: 600;
}

/* Roles */
.role-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.role-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 20px 12px;
  border-radius: 12px;
  border: 2px solid #2a2a45;
  background: #1a1a2e;
  color: #888;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
}

.role-btn:hover {
  border-color: #4ecdc4;
  color: #fff;
}

.role-btn--active {
  border-color: #4ecdc4;
  background: rgba(78, 205, 196, 0.1);
  color: #4ecdc4;
}

.role-icon {
  font-size: 28px;
}

.role-label {
  font-size: 13px;
  font-weight: 700;
}

/* Review */
.review-grid {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.review-item {
  display: flex;
  justify-content: space-between;
  padding: 12px 14px;
  background: #1a1a2e;
  border-radius: 10px;
  border: 1px solid #2a2a45;
}

.review-label {
  font-size: 12px;
  font-weight: 700;
  color: #888;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.review-value {
  font-size: 14px;
  color: #fff;
  font-weight: 500;
}

/* Navigation */
.nav-buttons {
  display: flex;
  gap: 10px;
  margin-top: 24px;
}

.nav-buttons .btn:first-child {
  flex: 0 0 auto;
}

.nav-buttons .btn:last-child {
  flex: 1;
}

.btn {
  padding: 12px 20px;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.2s;
}

.btn-primary {
  color: #fff;
  background: linear-gradient(135deg, #4ecdc4, #2fa89e);
  box-shadow: 0 4px 12px rgba(78, 205, 196, 0.35);
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-1px);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  color: #ccc;
  background: #1a1a2e;
  border: 1px solid #2a2a45;
}

.btn-secondary:hover {
  background: #252540;
  color: #fff;
}

/* Alert */
.alert {
  padding: 10px 12px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 700;
  margin-bottom: 14px;
}

.alert-error {
  color: #ff6b6b;
  background: #2a1010;
  border: 1px solid #5a1f1f;
}

/* Success */
.success-message {
  text-align: center;
  padding: 20px 0;
}

.success-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #2fa89e;
  color: #fff;
  font-size: 24px;
  font-weight: 700;
  margin: 0 auto 12px;
}

.success-message p {
  color: #2fa89e;
  font-size: 14px;
  font-weight: 600;
  margin: 0;
}
</style>
