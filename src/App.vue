<script setup lang="ts">
import { RouterView, useRoute } from 'vue-router'
import Navbar from './components/Navbar.vue';
import TeacherNavbar from './components/teacher/TeacherNavbar.vue';
import { computed } from 'vue';
import { useAuthStore } from '@/stores/auth';

const route = useRoute();
const auth = useAuthStore();

const hideNavbar = computed(() => {
<<<<<<< HEAD
  const routeHide = route.meta?.hideNavbar || false;
  const isTeacherOnDashboard = auth.isAuthenticated && auth.user?.role === 'teacher' && route.path.startsWith('/teacher');
  return routeHide || isTeacherOnDashboard;
});

const showTeacherNav = computed(() => {
  return auth.isAuthenticated && auth.user?.role === 'teacher' && !route.path.startsWith('/teacher') && !route.meta?.hideNavbar;
});
=======
  const routeHide = route.meta?.hideNavbar || false
  const isTeacher = auth.isAuthenticated && auth.user?.role === 'teacher'
  return routeHide || isTeacher
})
>>>>>>> 6acf3de (fix: fixed style that brokend after merge)
</script>

<template>
  <TeacherNavbar v-if="showTeacherNav" />
  <Navbar v-else-if="!hideNavbar" />
  <RouterView />
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

</style>
