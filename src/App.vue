<script setup lang="ts">
import { RouterView, useRoute } from 'vue-router'
import Navbar from './components/Navbar.vue';
import { computed } from 'vue';

const route = useRoute();

const hideNavbar = computed(() => {
  const routeHide = route.meta?.hideNavbar || false
  const usesOwnLayout = route.meta?.role === 'teacher' || route.meta?.role === 'admin'
  return routeHide || usesOwnLayout
})

const showNavbar = computed(() => !hideNavbar.value)
</script>

<template>
  <Navbar v-if="showNavbar" />
  <div class="main-content" :class="{ 'has-navbar': showNavbar }">
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

.main-content.has-navbar {
  padding-top: 64px;
}

</style>
