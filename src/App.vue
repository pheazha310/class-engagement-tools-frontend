<script setup lang="ts">
import { RouterView, useRoute } from 'vue-router'
import Navbar from './components/Navbar.vue';
import { computed } from 'vue';
import { useAuthStore } from '@/stores/auth';

const route = useRoute();
const auth = useAuthStore();

const hideNavbar = computed(() => {
  const routeHide = route.meta?.hideNavbar || false;
  const isTeacher = auth.isAuthenticated && auth.user?.role === 'teacher';
  return routeHide || isTeacher;
});
</script>

<template>
  <Navbar v-if="!hideNavbar" />
  <div class="main-content">
    <RouterView />
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
  font-family:
    'Inter',
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    Roboto,
    Oxygen,
    Ubuntu,
    Cantarell,
    sans-serif;
}

body {
  font-family: inherit;
}

.main-content {
  padding-top: 64px;
}
</style>
