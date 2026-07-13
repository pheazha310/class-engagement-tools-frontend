<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { authService } from '@/services/authService'
import LoadingSpinner from '@/components/LoadingSpinner.vue'

const router = useRouter()
const store = useAuthStore()

const email = ref('')
const password = ref('')
const remember = ref(false)
const showPassword = ref(false)
const showForgotPassword = ref(false)
const resetEmail = ref('')
const resetSent = ref(false)
const resetLoading = ref(false)
const resetError = ref<string | null>(null)

async function handleLogin() {
  try {
    await store.login({ email: email.value, password: password.value, remember: remember.value })
    if (store.user?.role === 'teacher') {
      router.push('/teacher/dashboard')
    } else if (store.user?.role === 'student') {
      router.push('/student/dashboard')
    } else {
      router.push('/polls')
    }
  } catch {
    // error handled in store
  }
}

async function handleForgotPassword() {
  resetLoading.value = true
  resetError.value = null
  try {
    await authService.forgotPassword(resetEmail.value)
    resetSent.value = true
  } catch (e: any) {
    resetError.value = e.response?.data?.message || 'Failed to send reset link. Please try again.'
  } finally {
    resetLoading.value = false
  }
}
</script>

<template>
  <div class="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-gradient-to-br from-gray-50 via-white to-blue-50/30 px-4 py-12">
    <div class="w-full max-w-md">
      <!-- Login Form -->
      <div v-if="!showForgotPassword">
        <div class="mb-8 text-center">
          <div class="inline-flex items-center justify-center gap-2 rounded-full bg-blue-50 px-4 py-1.5 mb-4">
            <svg class="h-4 w-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span class="text-xs font-medium text-blue-700">Welcome Back</span>
          </div>
          <h1 class="text-3xl font-bold text-gray-900">Sign In</h1>
          <p class="mt-2 text-gray-500">Sign in to your account to continue</p>
        </div>

        <div class="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm shadow-gray-200/50">
          <form @submit.prevent="handleLogin" class="space-y-5">
            <div class="space-y-1">
              <label for="email" class="text-sm font-medium text-gray-700">Email</label>
              <div class="relative">
                <svg class="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <input
                  id="email"
                  v-model="email"
                  type="email"
                  required
                  autocomplete="email"
                  placeholder="you@example.com"
                  class="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm transition-all duration-200 hover:border-gray-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            <div class="space-y-1">
              <label for="password" class="text-sm font-medium text-gray-700">Password</label>
              <div class="relative">
                <svg class="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <input
                  id="password"
                  v-model="password"
                  :type="showPassword ? 'text' : 'password'"
                  required
                  autocomplete="current-password"
                  placeholder="Enter your password"
                  class="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-10 text-sm transition-all duration-200 hover:border-gray-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
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
            </div>

            <div class="flex items-center justify-between">
              <label class="flex items-center gap-2 cursor-pointer group">
                <div class="relative">
                  <input
                    v-model="remember"
                    type="checkbox"
                    class="peer sr-only"
                  />
                  <div class="h-4 w-4 rounded border border-gray-300 bg-white transition-all duration-200 peer-checked:bg-blue-600 peer-checked:border-blue-600 peer-focus:ring-2 peer-focus:ring-blue-100 group-hover:border-gray-400">
                    <svg v-if="remember" class="h-3.5 w-3.5 text-white absolute top-0.5 left-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
                <span class="text-sm text-gray-600 select-none">Remember me</span>
              </label>
              <button
                type="button"
                class="text-sm font-medium text-blue-600 hover:text-blue-500 transition-colors"
                @click="showForgotPassword = true"
              >
                Forgot password?
              </button>
            </div>

            <div v-if="store.error" class="rounded-xl bg-red-50 border border-red-100 px-4 py-3">
              <p class="text-sm text-red-600 flex items-center gap-2">
                <svg class="h-4 w-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" /></svg>
                {{ store.error }}
              </p>
            </div>

            <button
              type="submit"
              :disabled="store.loading"
              class="group relative flex w-full items-center justify-center overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-200 transition-all duration-200 hover:shadow-xl hover:shadow-blue-300 hover:from-blue-700 hover:to-blue-800 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none active:scale-[0.98]"
            >
              <LoadingSpinner v-if="store.loading" size="sm" />
              <span v-else class="flex items-center gap-2">
                Sign In
                <svg class="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>
            </button>
          </form>

          <div class="mt-8 pt-6 border-t border-gray-100">
            <p class="text-center text-sm text-gray-500">
              Don't have an account?
              <router-link to="/register" class="font-semibold text-blue-600 hover:text-blue-500 transition-colors">Create one</router-link>
            </p>
          </div>
        </div>
      </div>

      <!-- Forgot Password Form -->
      <div v-else>
        <div class="mb-8 text-center">
          <div class="inline-flex items-center justify-center gap-2 rounded-full bg-blue-50 px-4 py-1.5 mb-4">
            <svg class="h-4 w-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
            <span class="text-xs font-medium text-blue-700">Reset Password</span>
          </div>
          <h1 class="text-3xl font-bold text-gray-900">Forgot Password?</h1>
          <p class="mt-2 text-gray-500">Enter your email to receive a reset link</p>
        </div>

        <div class="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm shadow-gray-200/50">
          <div v-if="resetSent" class="text-center py-4">
            <div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 animate-scale-check">
              <svg class="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 class="text-lg font-bold text-gray-900 mb-2">Check Your Email</h3>
            <p class="text-sm text-gray-500 leading-relaxed">
              If that email address is registered, you'll receive a password reset link shortly.
            </p>
            <button
              type="button"
              class="mt-6 text-sm font-semibold text-blue-600 hover:text-blue-500 transition-colors"
              @click="showForgotPassword = false; resetSent = false"
            >
              Back to sign in
            </button>
          </div>

          <form v-else @submit.prevent="handleForgotPassword" class="space-y-5">
            <div class="space-y-1">
              <label for="reset-email" class="text-sm font-medium text-gray-700">Email</label>
              <div class="relative">
                <svg class="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <input
                  id="reset-email"
                  v-model="resetEmail"
                  type="email"
                  required
                  placeholder="you@example.com"
                  class="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm transition-all duration-200 hover:border-gray-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            <div v-if="resetError" class="rounded-xl bg-red-50 border border-red-100 px-4 py-3">
              <p class="text-sm text-red-600 flex items-center gap-2">
                <svg class="h-4 w-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" /></svg>
                {{ resetError }}
              </p>
            </div>

            <button
              type="submit"
              :disabled="resetLoading"
              class="group relative flex w-full items-center justify-center overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-200 transition-all duration-200 hover:shadow-xl hover:shadow-blue-300 hover:from-blue-700 hover:to-blue-800 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none active:scale-[0.98]"
            >
              <span v-if="resetLoading" class="flex items-center gap-2">
                <svg class="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Sending...
              </span>
              <span v-else class="flex items-center gap-2">
                Send Reset Link
                <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>
            </button>

            <button
              type="button"
              class="w-full text-center text-sm text-gray-500 hover:text-gray-700 transition-colors pt-2"
              @click="showForgotPassword = false"
            >
              Back to sign in
            </button>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>
