<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'

const router = useRouter()
const authStore = useAuthStore()
const mobileMenuOpen = ref(false)

onMounted(() => {
  authStore.fetchUser()
})

async function handleLogout() {
  await authStore.logout()
  router.push('/login')
}
</script>

<template>
  <div class="min-h-screen bg-white">
    <header class="sticky top-0 z-40 border-b border-gray-100 bg-white/95 backdrop-blur">
      <div class="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <div class="flex items-center gap-6">
          <button class="text-lg font-bold text-blue-600" @click="router.push('/')">
            ClassTools
          </button>
          <nav v-if="authStore.user" class="hidden items-center gap-1 sm:flex">
            <button
              v-if="authStore.user.role === 'admin'"
              class="rounded-lg px-3 py-2 text-sm font-medium text-gray-500 transition hover:bg-gray-50 hover:text-gray-900"
              @click="router.push('/admin/users')"
            >
              Users
            </button>
            <button
              v-if="authStore.user.role === 'teacher'"
              class="rounded-lg px-3 py-2 text-sm font-medium text-gray-500 transition hover:bg-gray-50 hover:text-gray-900"
              @click="router.push('/teacher/dashboard')"
            >
              Dashboard
            </button>
            <button
              v-if="authStore.user.role === 'student'"
              class="rounded-lg px-3 py-2 text-sm font-medium text-gray-500 transition hover:bg-gray-50 hover:text-gray-900"
              @click="router.push('/student/dashboard')"
            >
              Dashboard
            </button>
          </nav>
        </div>
        <div class="flex items-center gap-3">
          <template v-if="authStore.user">
            <span class="hidden text-sm text-gray-500 sm:block">{{ authStore.user.name }}</span>
            <span
              class="hidden rounded-full px-2 py-0.5 text-xs font-medium sm:inline-block"
              :class="authStore.user.role === 'admin'
                ? 'bg-purple-50 text-purple-700'
                : authStore.user.role === 'teacher'
                  ? 'bg-blue-50 text-blue-700'
                  : 'bg-green-50 text-green-700'"
            >
              {{ authStore.user.role }}
            </span>
            <button
              class="rounded-lg px-3 py-2 text-sm font-medium text-gray-500 transition hover:bg-gray-50 hover:text-gray-900"
              @click="handleLogout"
            >
              Logout
            </button>
          </template>
          <template v-else>
            <button
              class="rounded-lg px-3 py-2 text-sm font-medium text-gray-500 transition hover:bg-gray-50 hover:text-gray-900"
              @click="router.push('/login')"
            >
              Sign In
            </button>
            <button
              class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
              @click="router.push('/register')"
            >
              Sign Up
            </button>
          </template>
          <button class="sm:hidden" @click="mobileMenuOpen = !mobileMenuOpen">
            <svg class="h-6 w-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path v-if="!mobileMenuOpen" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
              <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <Transition
        enter-active-class="transition-all duration-200"
        leave-active-class="transition-all duration-150"
        enter-from-class="max-h-0 opacity-0"
        leave-to-class="max-h-0 opacity-0"
      >
        <div v-if="mobileMenuOpen" class="border-t border-gray-100 px-4 py-3">
          <nav class="flex flex-col gap-1">
            <template v-if="authStore.user">
              <button v-if="authStore.user.role === 'admin'" class="rounded-lg px-3 py-2 text-left text-sm font-medium text-gray-500 hover:bg-gray-50" @click="router.push('/admin/users'); mobileMenuOpen = false">
                Users
              </button>
              <button v-if="authStore.user.role === 'teacher'" class="rounded-lg px-3 py-2 text-left text-sm font-medium text-gray-500 hover:bg-gray-50" @click="router.push('/teacher/dashboard'); mobileMenuOpen = false">
                Dashboard
              </button>
              <button v-if="authStore.user.role === 'student'" class="rounded-lg px-3 py-2 text-left text-sm font-medium text-gray-500 hover:bg-gray-50" @click="router.push('/student/dashboard'); mobileMenuOpen = false">
                Dashboard
              </button>
            </template>
            <template v-if="authStore.user">
              <div class="border-t border-gray-100 pt-2 mt-2">
                <div class="px-3 py-2 text-sm text-gray-900">{{ authStore.user.name }}</div>
                <button class="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-gray-500 hover:bg-gray-50" @click="handleLogout; mobileMenuOpen = false">
                  Logout
                </button>
              </div>
            </template>
            <template v-else>
              <div class="border-t border-gray-100 pt-2 mt-2">
                <button class="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-gray-500 hover:bg-gray-50" @click="router.push('/login'); mobileMenuOpen = false">
                  Sign In
                </button>
                <button class="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-gray-500 hover:bg-gray-50" @click="router.push('/register'); mobileMenuOpen = false">
                  Sign Up
                </button>
              </div>
            </template>
          </nav>
        </div>
      </Transition>
    </header>

    <main>
      <router-view />
    </main>
  </div>
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html {
  scroll-behavior: smooth;
}
</style>
