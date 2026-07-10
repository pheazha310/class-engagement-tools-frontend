<script setup lang="ts"></script>

<template>
  <div class="not-found">
    <h1 class="title">404</h1>
    <p class="message">Page not found</p>
    <router-link to="/" class="link">Go to home page</router-link>
  </div>
</template>

<style scoped>
.not-found {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  gap: 12px;
  padding: 24px;
  background: #0f0f1a;
}

.title {
  font-size: 64px;
  font-weight: 900;
  color: #fff;
  margin: 0;
  line-height: 1;
}

.message {
  font-size: 18px;
  color: #888;
  margin: 0;
}

.link {
  margin-top: 8px;
  padding: 10px 20px;
  border-radius: 10px;
  background: linear-gradient(135deg, #e94560, #c0392b);
  color: #fff;
  font-weight: 700;
  text-decoration: none;
  transition: transform 0.15s, box-shadow 0.15s;
}

.link:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(233, 69, 96, 0.5);
}
</style>
