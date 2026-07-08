<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const mobileMenuOpen = ref(false)
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <header class="sticky top-0 z-40 border-b border-gray-200 bg-white/90 backdrop-blur dark:border-gray-700 dark:bg-gray-800/90">
      <div class="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <div class="flex items-center gap-6">
          <button class="text-lg font-bold text-indigo-600 dark:text-indigo-400" @click="router.push('/')">
            VoteLive
          </button>
          <nav class="hidden items-center gap-4 sm:flex">
            <button
              class="text-sm font-medium text-gray-600 transition hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
              @click="router.push('/polls')"
            >
              Teacher Dashboard
            </button>
            <button
              class="text-sm font-medium text-gray-600 transition hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
              @click="router.push('/active-poll')"
            >
              Active Poll
            </button>
          </nav>
        </div>
        <button class="sm:hidden" @click="mobileMenuOpen = !mobileMenuOpen">
          <svg class="h-6 w-6 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path v-if="!mobileMenuOpen" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <Transition
        enter-active-class="transition-all duration-200"
        leave-active-class="transition-all duration-150"
        enter-from-class="max-h-0 opacity-0"
        leave-to-class="max-h-0 opacity-0"
      >
        <div v-if="mobileMenuOpen" class="border-t border-gray-200 px-4 py-3 dark:border-gray-700">
          <nav class="flex flex-col gap-2">
            <button class="rounded-lg px-3 py-2 text-left text-sm font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700" @click="router.push('/polls'); mobileMenuOpen = false">
              Teacher Dashboard
            </button>
            <button class="rounded-lg px-3 py-2 text-left text-sm font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700" @click="router.push('/active-poll'); mobileMenuOpen = false">
              Active Poll
            </button>
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
body {
  margin: 0;
}
</style>
