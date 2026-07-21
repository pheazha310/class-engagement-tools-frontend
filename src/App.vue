<script setup lang="ts">
import { RouterView, useRoute } from 'vue-router'
import Navbar from './components/Navbar.vue';
import { computed } from 'vue';

const route = useRoute();
const hideNavbar = computed(() => route.meta?.hideNavbar || false);
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
}
</style>
