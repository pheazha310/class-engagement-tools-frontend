<script setup lang="ts">
import { ref } from 'vue'
import { schoolService } from '@/services/schoolService'

const emit = defineEmits<{
  close: []
  submitted: []
}>()

const schoolName = ref('')
const email = ref('')
const address = ref('')
const phone = ref('')
const notes = ref('')
const loading = ref(false)
const error = ref<string | null>(null)
const submitted = ref(false)

async function handleSubmit() {
  if (!schoolName.value.trim()) return
  loading.value = true
  error.value = null
  try {
    await schoolService.requestSchool({
      school_name: schoolName.value,
      email: email.value || undefined,
      address: address.value,
      phone: phone.value || undefined,
      notes: notes.value || undefined,
    })
    submitted.value = true
    setTimeout(() => emit('submitted'), 1500)
  } catch (e: any) {
    error.value = e.response?.data?.message || 'Failed to submit request.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-all duration-200"
      leave-active-class="transition-all duration-150"
      enter-from-class="opacity-0"
      leave-to-class="opacity-0"
    >
      <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4" @click.self="$emit('close')">
        <Transition
          enter-active-class="transition-all duration-300"
          leave-active-class="transition-all duration-200"
          enter-from-class="scale-90 opacity-0 translate-y-4"
          leave-to-class="scale-90 opacity-0 translate-y-4"
        >
          <div v-if="!submitted" class="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl shadow-black/5">
            <div class="mb-6 flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                  <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <h3 class="text-lg font-bold text-gray-900">Request New School</h3>
              </div>
              <button class="rounded-lg p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors" @click="$emit('close')">
                <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form @submit.prevent="handleSubmit" class="space-y-4">
              <div>
                <label class="mb-1.5 block text-sm font-medium text-gray-700">School Name <span class="text-red-500">*</span></label>
                <input
                  v-model="schoolName"
                  type="text"
                  required
                  placeholder="Enter school name"
                  class="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm transition-all duration-200 hover:border-gray-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label class="mb-1.5 block text-sm font-medium text-gray-700">Email (optional)</label>
                <input
                  v-model="email"
                  type="email"
                  placeholder="your@email.com"
                  class="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm transition-all duration-200 hover:border-gray-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label class="mb-1.5 block text-sm font-medium text-gray-700">Address</label>
                <input
                  v-model="address"
                  type="text"
                  placeholder="School address"
                  class="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm transition-all duration-200 hover:border-gray-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label class="mb-1.5 block text-sm font-medium text-gray-700">Phone (optional)</label>
                <input
                  v-model="phone"
                  type="tel"
                  placeholder="+855 12 345 678"
                  class="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm transition-all duration-200 hover:border-gray-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label class="mb-1.5 block text-sm font-medium text-gray-700">Notes</label>
                <textarea
                  v-model="notes"
                  rows="3"
                  placeholder="Any additional information..."
                  class="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm transition-all duration-200 hover:border-gray-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 resize-none"
                />
              </div>

              <div v-if="error" class="rounded-xl bg-red-50 border border-red-100 px-4 py-3">
                <p class="text-sm text-red-600 flex items-center gap-2">
                  <svg class="h-4 w-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" /></svg>
                  {{ error }}
                </p>
              </div>

              <div class="flex gap-3 pt-2">
                <button
                  type="button"
                  class="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 transition-all duration-200 hover:bg-gray-50 active:scale-[0.98]"
                  @click="$emit('close')"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  :disabled="loading || !schoolName.trim()"
                  class="flex-1 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-200 transition-all duration-200 hover:shadow-xl hover:from-blue-700 hover:to-blue-800 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none active:scale-[0.98]"
                >
                  <span v-if="loading" class="flex items-center justify-center gap-2">
                    <svg class="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Submitting...
                  </span>
                  <span v-else>Submit Request</span>
                </button>
              </div>
            </form>
          </div>

          <div v-else class="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-xl shadow-black/5">
            <div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 animate-scale-check">
              <svg class="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 class="text-lg font-bold text-gray-900">Request Submitted!</h3>
            <p class="mt-2 text-sm text-gray-500">Your school request has been sent for review.</p>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>
