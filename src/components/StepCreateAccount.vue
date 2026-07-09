<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRegistrationStore } from '@/stores/registrationStore'

const store = useRegistrationStore()

const showPassword = ref(false)
const showConfirm = ref(false)

const name = ref(store.data.name)
const email = ref(store.data.email)
const password = ref(store.data.password)
const passwordConfirmation = ref(store.data.password_confirmation)

const errors = ref<Record<string, string>>({})
const touched = ref<Record<string, boolean>>({})

const passwordStrength = computed(() => {
  const p = password.value
  let score = 0
  if (p.length >= 8) score++
  if (p.length >= 12) score++
  if (/[A-Z]/.test(p)) score++
  if (/[a-z]/.test(p)) score++
  if (/[0-9]/.test(p)) score++
  if (/[^A-Za-z0-9]/.test(p)) score++
  return score
})

const strengthLabel = computed(() => {
  if (passwordStrength.value <= 2) return { text: 'Weak', color: 'bg-red-500', textColor: 'text-red-600' }
  if (passwordStrength.value <= 4) return { text: 'Medium', color: 'bg-amber-500', textColor: 'text-amber-600' }
  return { text: 'Strong', color: 'bg-green-500', textColor: 'text-green-600' }
})

const isValid = computed(() => {
  return name.value.trim()
    && email.value.trim()
    && password.value.length >= 8
    && password.value === passwordConfirmation.value
})

function validate() {
  const e: Record<string, string> = {}
  if (!name.value.trim()) e.name = 'Full name is required.'
  if (!email.value.trim()) e.email = 'Email is required.'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) e.email = 'Please enter a valid email address.'
  if (password.value.length < 8) e.password = 'Password must be at least 8 characters.'
  if (password.value !== passwordConfirmation.value) e.password_confirmation = 'Passwords do not match.'
  errors.value = e
  Object.keys(e).forEach((k) => (touched.value[k] = true))
  return Object.keys(e).length === 0
}

function handleNext() {
  touched.value = { name: true, email: true, password: true, password_confirmation: true }
  if (!validate()) return
  store.updateAccount({
    name: name.value,
    email: email.value,
    password: password.value,
    password_confirmation: passwordConfirmation.value,
  })
  store.nextStep()
}
</script>

<template>
  <form @submit.prevent="handleNext" class="space-y-5">
    <div class="space-y-1">
      <label for="reg-name" class="text-sm font-medium text-gray-700">Full Name</label>
      <div class="relative">
        <svg class="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
        <input
          id="reg-name"
          v-model="name"
          type="text"
          required
          autocomplete="name"
          placeholder="John Doe"
          class="w-full rounded-xl border py-2.5 pl-10 pr-4 text-sm transition-all duration-200 focus:outline-none"
          :class="[touched.name && errors.name ? 'border-red-300 bg-red-50/50 focus:ring-2 focus:ring-red-200' : 'border-gray-200 bg-white hover:border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100']"
          @input="errors.name = ''"
          @blur="touched.name = true"
        />
      </div>
      <Transition
        enter-active-class="transition-all duration-200"
        leave-active-class="transition-all duration-150"
        enter-from-class="translate-y-1 opacity-0"
        leave-to-class="translate-y-1 opacity-0"
      >
        <p v-if="touched.name && errors.name" class="text-xs text-red-500 flex items-center gap-1">
          <svg class="h-3 w-3" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" /></svg>
          {{ errors.name }}
        </p>
      </Transition>
    </div>

    <div class="space-y-1">
      <label for="reg-email" class="text-sm font-medium text-gray-700">Email</label>
      <div class="relative">
        <svg class="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
        <input
          id="reg-email"
          v-model="email"
          type="email"
          required
          autocomplete="email"
          placeholder="you@example.com"
          class="w-full rounded-xl border py-2.5 pl-10 pr-4 text-sm transition-all duration-200 focus:outline-none"
          :class="[touched.email && errors.email ? 'border-red-300 bg-red-50/50 focus:ring-2 focus:ring-red-200' : 'border-gray-200 bg-white hover:border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100']"
          @input="errors.email = ''"
          @blur="touched.email = true"
        />
      </div>
      <Transition name="slide">
        <p v-if="touched.email && errors.email" class="text-xs text-red-500 flex items-center gap-1">
          <svg class="h-3 w-3" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" /></svg>
          {{ errors.email }}
        </p>
      </Transition>
    </div>

    <div class="space-y-1">
      <label for="reg-password" class="text-sm font-medium text-gray-700">Password</label>
      <div class="relative">
        <svg class="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        <input
          id="reg-password"
          v-model="password"
          :type="showPassword ? 'text' : 'password'"
          required
          autocomplete="new-password"
          placeholder="Create a strong password"
          class="w-full rounded-xl border py-2.5 pl-10 pr-10 text-sm transition-all duration-200 focus:outline-none"
          :class="[touched.password && errors.password ? 'border-red-300 bg-red-50/50 focus:ring-2 focus:ring-red-200' : 'border-gray-200 bg-white hover:border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100']"
          @input="errors.password = ''"
          @blur="touched.password = true"
        />
        <button
          type="button"
          class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
          @click="showPassword = !showPassword"
        >
          <svg v-if="!showPassword" class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          <svg v-else class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
          </svg>
        </button>
      </div>

      <div v-if="password.length > 0" class="mt-2 space-y-1.5">
        <div class="flex gap-1">
          <div
            v-for="i in 6"
            :key="i"
            class="h-1 flex-1 rounded-full transition-all duration-300"
            :class="i <= passwordStrength ? strengthLabel.color : 'bg-gray-200'"
          />
        </div>
        <p class="text-xs" :class="strengthLabel.textColor">Password strength: {{ strengthLabel.text }}</p>
      </div>

      <Transition name="slide">
        <p v-if="touched.password && errors.password" class="text-xs text-red-500 flex items-center gap-1">
          <svg class="h-3 w-3" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" /></svg>
          {{ errors.password }}
        </p>
      </Transition>
    </div>

    <div class="space-y-1">
      <label for="reg-confirm" class="text-sm font-medium text-gray-700">Confirm Password</label>
      <div class="relative">
        <svg class="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
        <input
          id="reg-confirm"
          v-model="passwordConfirmation"
          :type="showConfirm ? 'text' : 'password'"
          required
          autocomplete="new-password"
          placeholder="Re-enter your password"
          class="w-full rounded-xl border py-2.5 pl-10 pr-10 text-sm transition-all duration-200 focus:outline-none"
          :class="[touched.password_confirmation && errors.password_confirmation ? 'border-red-300 bg-red-50/50 focus:ring-2 focus:ring-red-200' : 'border-gray-200 bg-white hover:border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100']"
          @input="errors.password_confirmation = ''"
          @blur="touched.password_confirmation = true"
        />
        <button
          type="button"
          class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
          @click="showConfirm = !showConfirm"
        >
          <svg v-if="!showConfirm" class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          <svg v-else class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
          </svg>
        </button>
      </div>
      <Transition name="slide">
        <p v-if="touched.password_confirmation && errors.password_confirmation" class="text-xs text-red-500 flex items-center gap-1">
          <svg class="h-3 w-3" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" /></svg>
          {{ errors.password_confirmation }}
        </p>
      </Transition>

      <Transition name="slide">
        <p v-if="passwordConfirmation && password !== passwordConfirmation && !errors.password_confirmation" class="text-xs text-amber-500 flex items-center gap-1">
          <svg class="h-3 w-3" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" /></svg>
          Passwords do not match yet
        </p>
      </Transition>
    </div>

    <button
      type="submit"
      :disabled="!isValid"
      class="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-200 transition-all duration-200 hover:shadow-xl hover:shadow-blue-300 hover:from-blue-700 hover:to-blue-800 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
    >
      <span class="relative z-10 flex items-center gap-2">
        Continue
        <svg class="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7" />
        </svg>
      </span>
    </button>
  </form>
</template>
