<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { usePollStore } from '@/stores/pollStore'
import PollForm from '@/components/PollForm.vue'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import ToastNotification from '@/components/ToastNotification.vue'
import type { PollFormData } from '@/types/poll'

const router = useRouter()
const route = useRoute()
const store = usePollStore()

const isEditing = ref(false)
const editId = ref<number | null>(null)
const initialData = ref<Partial<PollFormData>>({})
const toastMessage = ref<string | null>(null)
const toastType = ref<'success' | 'error'>('success')

onMounted(async () => {
  if (route.params.id) {
    isEditing.value = true
    editId.value = Number(route.params.id)
    try {
      const poll = await store.fetchPoll(editId.value)
      if (poll.status !== 'draft') {
        toastMessage.value = 'Only draft polls can be edited.'
        toastType.value = 'error'
        router.push('/polls')
        return
      }
      initialData.value = {
        question: poll.question,
        options: poll.options.map((o) => o.option_text),
      }
    } catch {
      toastMessage.value = 'Failed to load poll for editing.'
      toastType.value = 'error'
      router.push('/polls')
    }
  }
})

async function handleSubmit(data: PollFormData) {
  try {
    if (isEditing.value && editId.value) {
      await store.updatePoll(editId.value, data)
      toastMessage.value = 'Poll updated successfully!'
    } else {
      const poll = await store.createPoll(data)
      toastMessage.value = 'Poll created successfully!'
      router.push(`/polls/${poll.id}/results`)
      return
    }
    router.push('/polls')
  } catch (e: any) {
    const msg = e.response?.data?.message
      || e.response?.data?.error
      || (e.response?.data?.errors ? Object.values(e.response.data.errors).flat().join(', ') : null)
      || 'Failed to save poll.'
    console.error('Create poll error:', e.response?.status, msg, e.response?.data)
    toastMessage.value = msg
    toastType.value = 'error'
  }
}

function handleCancel() {
  router.push('/polls')
}
</script>

<template>
  <div class="mx-auto max-w-2xl px-4 py-8">
    <div class="mb-8 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white shadow-lg">
      <h1 class="text-2xl font-bold">{{ isEditing ? 'Edit Poll' : 'Create Poll' }}</h1>
      <p class="mt-1 text-indigo-100">{{ isEditing ? 'Update your poll question and options' : 'Create a new poll for your class' }}</p>
    </div>

    <div class="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <LoadingSpinner v-if="isEditing && store.loading" />
      <PollForm
        v-else
        :initial-data="initialData"
        :is-editing="isEditing"
        @submit="handleSubmit"
        @cancel="handleCancel"
      />
    </div>

    <ToastNotification
      :message="toastMessage"
      :type="toastType"
      @close="toastMessage = null"
    />
  </div>
</template>
