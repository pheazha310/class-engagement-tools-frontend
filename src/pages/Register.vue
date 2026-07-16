<script setup lang="ts">
import { watch, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useRegistrationStore } from '@/stores/registrationStore'
import { useAuthStore } from '@/stores/authStore'
import Stepper from '@/components/Stepper.vue'
import StepCreateAccount from '@/components/StepCreateAccount.vue'
import StepSelectRole from '@/components/StepSelectRole.vue'
import StepSelectLocation from '@/components/StepSelectLocation.vue'
import StepSelectSchool from '@/components/StepSelectSchool.vue'
import StepReview from '@/components/StepReview.vue'

const router = useRouter()
const store = useRegistrationStore()
const authStore = useAuthStore()

const steps = ['Create Account', 'Select Role', 'Location', 'School', 'Review']
const redirectCountdown = ref(3)

watch(
  () => store.success,
  (val) => {
    if (val) {
      const timer = setInterval(() => {
        redirectCountdown.value--
        if (redirectCountdown.value <= 0) {
          clearInterval(timer)
          const role = store.data.role
          store.reset()
          if (role === 'teacher') {
            router.push('/teacher/dashboard')
          } else {
            router.push('/student/dashboard')
          }
        }
      }, 1000)
    }
  },
)
</script>

<template>
  <div class="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-4 py-12">
    <div class="w-full max-w-2xl">
      <!-- Success State -->
      <Transition
        enter-active-class="transition-all duration-500"
        leave-active-class="transition-all duration-300"
        enter-from-class="scale-90 opacity-0"
        leave-to-class="scale-90 opacity-0"
      >
        <div v-if="store.success" class="relative overflow-hidden rounded-3xl border border-slate-700 bg-slate-900/90 p-12 text-center shadow-2xl shadow-cyan-950/40 backdrop-blur">
          <!-- Confetti decorations -->
          <div class="absolute top-0 left-0 h-2 w-full bg-gradient-to-r from-cyan-400 via-blue-500 to-emerald-400" />
          <div class="absolute -top-4 -left-4 h-24 w-24 rounded-full bg-cyan-400/10 blur-2xl" />
          <div class="absolute -bottom-8 -right-8 h-32 w-32 rounded-full bg-emerald-400/10 blur-3xl" />

          <div class="relative">
            <div class="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-emerald-500 shadow-lg shadow-cyan-200/20 animate-scale-check">
              <svg class="h-10 w-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <div class="animate-fade-in-up">
              <h1 class="mb-2 text-3xl font-bold text-white">Registration Successful!</h1>
              <p class="mb-1 text-slate-400">Welcome to the Class Engagement Tools Platform.</p>
              <p class="text-sm text-slate-500">
                Redirecting to your dashboard in
                <span class="font-semibold text-cyan-300">{{ redirectCountdown }}s</span>
              </p>

              <div class="mt-8 flex items-center justify-center gap-2">
                <div
                  v-for="i in 3"
                  :key="i"
                  class="h-2 w-2 rounded-full animate-bounce"
                  :class="i === 1 ? 'bg-cyan-400' : i === 2 ? 'bg-emerald-400' : 'bg-blue-500'"
                  :style="{ animationDelay: `${i * 150}ms` }"
                />
              </div>
            </div>
          </div>
        </div>
      </Transition>

      <!-- Registration Form -->
      <Transition
        enter-active-class="transition-all duration-500"
        leave-active-class="transition-all duration-300"
        enter-from-class="scale-95 opacity-0"
        leave-to-class="scale-95 opacity-0"
      >
        <div v-if="!store.success">
          <div class="mb-8 text-center">
            <div class="inline-flex items-center justify-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-1.5 mb-4">
              <svg class="h-4 w-4 text-cyan-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span class="text-xs font-medium text-cyan-200">Secure Registration</span>
            </div>
            <h1 class="text-3xl font-bold text-white">Create Your Account</h1>
            <p class="mt-2 text-slate-400">Join the class engagement platform in a few simple steps</p>
          </div>

          <div class="mb-8 px-4">
            <Stepper :steps="steps" :current-step="store.currentStep" />
          </div>

          <div class="rounded-3xl border border-slate-700 bg-slate-900/90 p-6 shadow-2xl shadow-cyan-950/40 backdrop-blur sm:p-8">
            <Transition
              mode="out-in"
              enter-active-class="transition-all duration-300 ease-out"
              leave-active-class="transition-all duration-200 ease-in"
              enter-from-class="translate-x-6 opacity-0"
              leave-to-class="-translate-x-6 opacity-0"
            >
              <StepCreateAccount v-if="store.currentStep === 1" key="step1" />
              <StepSelectRole v-else-if="store.currentStep === 2" key="step2" />
              <StepSelectLocation v-else-if="store.currentStep === 3" key="step3" />
              <StepSelectSchool v-else-if="store.currentStep === 4" key="step4" />
              <StepReview v-else-if="store.currentStep === 5" key="step5" />
            </Transition>
          </div>

          <p class="mt-6 text-center text-sm text-slate-400">
            Already have an account?
            <router-link to="/login" class="font-semibold text-cyan-300 hover:text-cyan-200 transition-colors">
              Sign in
            </router-link>
          </p>
        </div>
      </Transition>
    </div>
  </div>
</template>
