<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { allTools, type Tool } from '@/data/toolsData'
import TeacherLayout from '@/components/teacher/TeacherLayout.vue'
import TeacherIcon from '@/components/teacher/TeacherIcon.vue'

const route = useRoute()
const router = useRouter()
const slug = computed(() => route.params.slug as string)
const loading = ref(true)
const loadError = ref(false)

const tool = computed<Tool | undefined>(() => {
  return allTools.find(t => t.slug === slug.value)
})

const toolRoute = computed(() => tool.value?.route || '')

onMounted(() => {
  if (!tool.value) {
    loadError.value = true
    loading.value = false
    return
  }
  // Simulate iframe load
  loading.value = false
})

function goBack() {
  router.push('/teacher/dashboard')
}

function openInNewTab() {
  if (toolRoute.value) {
    window.open(toolRoute.value, '_blank')
  }
}
</script>

<template>
  <TeacherLayout
    sidebar-active="dashboard"
    :page-title="tool?.title || 'Tool Not Found'"
    :page-subtitle="tool?.description || 'This tool could not be found.'"
    :show-search="false"
  >
    <template #actions>
      <button class="outline-button" type="button" @click="goBack" title="Back to dashboard">
        <TeacherIcon icon="chevronLeft" :size="16" />
        <span>Back to Dashboard</span>
      </button>
      <button v-if="toolRoute" class="primary-button" type="button" @click="openInNewTab" title="Open in new tab">
        <TeacherIcon icon="external" :size="16" />
        <span>Open in New Tab</span>
      </button>
    </template>

    <!-- Loading state -->
    <div v-if="loading" class="tool-loading">
      <div class="spinner"></div>
      <p>Loading {{ tool?.title || 'tool' }}...</p>
    </div>

    <!-- Error state -->
    <div v-else-if="loadError || !tool" class="tool-error">
      <div class="error-icon">
        <TeacherIcon icon="x" :size="48" />
      </div>
      <h2>Tool Not Found</h2>
      <p>The tool "{{ slug }}" doesn't exist or has been removed.</p>
      <button class="primary-button" type="button" @click="goBack">
        <TeacherIcon icon="chevronLeft" :size="16" />
        <span>Back to Dashboard</span>
      </button>
    </div>

    <!-- Full-screen iframe embed -->
    <div v-else class="tool-fullscreen">
      <iframe
        :src="toolRoute"
        class="tool-iframe"
        :title="`${tool.title} — Teacher View`"
        frameborder="0"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-top-navigation"
        @load="loading = false"
      ></iframe>
    </div>
  </TeacherLayout>
</template>

<style scoped>
.tool-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  min-height: 400px;
  color: #697082;
}

.tool-loading p {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #c5cbdd;
  border-top-color: #001f9e;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.tool-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
  min-height: 400px;
  text-align: center;
}

.error-icon {
  color: var(--red);
  opacity: 0.5;
}

.tool-error h2 {
  margin: 0;
  font-size: 22px;
  font-weight: 800;
  color: var(--ink);
}

.tool-error p {
  margin: 0;
  color: #697082;
  font-size: 15px;
}

.tool-fullscreen {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  overflow: hidden;
  background: #ffffff;
  border-radius: 4px;
}

.tool-iframe {
  flex: 1;
  width: 100%;
  height: 100%;
  border: 0;
  background: #ffffff;
}
</style>
