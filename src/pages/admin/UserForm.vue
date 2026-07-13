<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { adminUserService } from '@/services/adminUserService'
import ToastNotification from '@/components/ToastNotification.vue'
import type { AdminUserFormData } from '@/types/admin'

const router = useRouter()
const route = useRoute()
const isEdit = !!route.params.id

const form = ref<AdminUserFormData>({
  name: '',
  email: '',
  password: '',
  password_confirmation: '',
  roles: [],
})

const roles = ref<string[]>([])
const saving = ref(false)
const errors = ref<Record<string, string>>({})
const toastMessage = ref<string | null>(null)
const toastType = ref<'success' | 'error'>('success')

onMounted(async () => {
  try {
    roles.value = await adminUserService.getRoles()

    if (isEdit) {
      const user = await adminUserService.getUser(Number(route.params.id))
      form.value = {
        name: user.name,
        email: user.email,
        password: '',
        password_confirmation: '',
        roles: user.roles,
      }
    }
  } catch {
    toastMessage.value = 'Failed to load data.'
    toastType.value = 'error'
  }
})

function toggleRole(role: string, checked: boolean) {
  if (checked) {
    form.value.roles = [...form.value.roles, role]
  } else {
    form.value.roles = form.value.roles.filter((r) => r !== role)
  }
}

async function handleSubmit() {
  saving.value = true
  errors.value = {}
  try {
    if (isEdit) {
      await adminUserService.updateUser(Number(route.params.id), form.value)
      toastMessage.value = 'User updated successfully.'
    } else {
      await adminUserService.createUser(form.value)
      toastMessage.value = 'User created successfully.'
    }
    toastType.value = 'success'
    setTimeout(() => router.push('/admin/users'), 500)
  } catch (e: any) {
    const errData = e.response?.data?.errors
    if (errData) {
      for (const [key, msgs] of Object.entries(errData)) {
        const msg = (msgs as string[])[0]
        if (msg) errors.value[key] = msg
      }
    } else {
      toastMessage.value = e.response?.data?.message || 'An error occurred.'
      toastType.value = 'error'
    }
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="mx-auto max-w-2xl px-4 py-8">
    <div class="mb-8 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white shadow-lg">
      <h1 class="text-2xl font-bold">{{ isEdit ? 'Edit User' : 'Create User' }}</h1>
      <p class="mt-1 text-indigo-100">{{ isEdit ? 'Update user details and roles' : 'Add a new user account' }}</p>
    </div>

    <form @submit.prevent="handleSubmit" class="space-y-6">
      <div>
        <label for="name" class="block text-sm font-medium text-gray-700">Name</label>
        <input
          id="name"
          v-model="form.name"
          type="text"
          required
          autocomplete="name"
          class="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 text-sm shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
        />
        <p v-if="errors.name" class="mt-1 text-sm text-red-600">{{ errors.name }}</p>
      </div>

      <div>
        <label for="email" class="block text-sm font-medium text-gray-700">Email</label>
        <input
          id="email"
          v-model="form.email"
          type="email"
          required
          autocomplete="email"
          class="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 text-sm shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
        />
        <p v-if="errors.email" class="mt-1 text-sm text-red-600">{{ errors.email }}</p>
      </div>

      <div>
        <label for="password" class="block text-sm font-medium text-gray-700">
          Password
          <span v-if="isEdit" class="text-gray-400 font-normal">(leave blank to keep current)</span>
        </label>
        <input
          id="password"
          v-model="form.password"
          type="password"
          autocomplete="new-password"
          class="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 text-sm shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
        />
        <p v-if="errors.password" class="mt-1 text-sm text-red-600">{{ errors.password }}</p>
      </div>

      <div>
        <label for="password_confirmation" class="block text-sm font-medium text-gray-700">Confirm password</label>
        <input
          id="password_confirmation"
          v-model="form.password_confirmation"
          type="password"
          autocomplete="new-password"
          class="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 text-sm shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      <div>
        <span class="block text-sm font-medium text-gray-700">Roles</span>
        <div class="mt-2 flex flex-col gap-2">
          <label
            v-for="role in roles"
            :key="role"
            class="flex items-center gap-2 text-sm"
          >
            <input
              type="checkbox"
              :checked="form.roles.includes(role)"
              @change="(e) => toggleRole(role, (e.target as HTMLInputElement).checked)"
              class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            {{ role }}
          </label>
          <p v-if="roles.length === 0" class="text-sm text-gray-400">No roles defined yet.</p>
        </div>
        <p v-if="errors.roles" class="mt-1 text-sm text-red-600">{{ errors.roles }}</p>
      </div>

      <div class="flex gap-3">
        <button
          type="submit"
          :disabled="saving"
          class="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:opacity-50"
        >
          {{ saving ? 'Saving...' : isEdit ? 'Update User' : 'Create User' }}
        </button>
        <button
          type="button"
          class="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
          @click="router.push('/admin/users')"
        >
          Cancel
        </button>
      </div>
    </form>

    <ToastNotification
      :message="toastMessage"
      :type="toastType"
      @close="toastMessage = null"
    />
  </div>
</template>
