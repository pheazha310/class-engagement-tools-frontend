<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { adminUserService } from '@/services/adminUserService'
import ConfirmationDialog from '@/components/ConfirmationDialog.vue'
import ToastNotification from '@/components/ToastNotification.vue'
import type { AdminUserListItem, PaginatedResponse } from '@/types/admin'

const router = useRouter()

const paginatedUsers = ref<PaginatedResponse<AdminUserListItem> | null>(null)
const search = ref('')
const loading = ref(false)
const showDeleteDialog = ref(false)
const userToDelete = ref<AdminUserListItem | null>(null)
const toastMessage = ref<string | null>(null)
const toastType = ref<'success' | 'error'>('success')

let debounceTimer: ReturnType<typeof setTimeout>

async function fetchUsers() {
  loading.value = true
  try {
    paginatedUsers.value = await adminUserService.getUsers(search.value)
  } catch {
    toastMessage.value = 'Failed to load users.'
    toastType.value = 'error'
  } finally {
    loading.value = false
  }
}

watch(search, () => {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(fetchUsers, 300)
})

onMounted(fetchUsers)

function navigateToCreate() {
  router.push('/admin/users/create')
}

function editUser(id: number) {
  router.push(`/admin/users/${id}/edit`)
}

function confirmDelete(user: AdminUserListItem) {
  userToDelete.value = user
  showDeleteDialog.value = true
}

async function executeDelete() {
  if (!userToDelete.value) return
  try {
    await adminUserService.deleteUser(userToDelete.value.id)
    toastMessage.value = 'User deleted successfully.'
    toastType.value = 'success'
    await fetchUsers()
  } catch (e: any) {
    toastMessage.value = e.response?.data?.message || 'Failed to delete user.'
    toastType.value = 'error'
  } finally {
    showDeleteDialog.value = false
    userToDelete.value = null
  }
}

async function goToPage(page: number) {
  loading.value = true
  try {
    paginatedUsers.value = await adminUserService.getUsers(search.value, page)
  } catch {
    toastMessage.value = 'Failed to load page.'
    toastType.value = 'error'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="mx-auto max-w-5xl px-4 py-8">
    <div class="mb-8 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white shadow-lg">
      <h1 class="text-2xl font-bold">User Management</h1>
      <p class="mt-1 text-indigo-100">Manage accounts and their roles</p>
    </div>

    <div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div class="relative max-w-xs">
        <input
          v-model="search"
          type="text"
          placeholder="Search by name or email..."
          class="block w-full rounded-lg border border-gray-300 px-4 py-2 pl-10 text-sm shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
        />
        <svg class="absolute left-3 top-2.5 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
      <button
        class="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700"
        @click="navigateToCreate"
      >
        + Add User
      </button>
    </div>

    <div v-if="loading" class="flex justify-center py-12">
      <div class="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
    </div>

    <div v-else-if="!paginatedUsers || paginatedUsers.data.length === 0" class="py-12 text-center text-gray-500">
      No users found.
    </div>

    <div v-else class="overflow-x-auto rounded-xl border border-gray-200">
      <table class="w-full text-sm">
        <thead class="border-b border-gray-100 bg-gray-50 text-left text-gray-500">
          <tr>
            <th class="px-4 py-3 font-medium">Name</th>
            <th class="px-4 py-3 font-medium">Email</th>
            <th class="px-4 py-3 font-medium">Roles</th>
            <th class="px-4 py-3 font-medium">Verified</th>
            <th class="px-4 py-3 text-right font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="user in paginatedUsers.data"
            :key="user.id"
            class="border-b border-gray-100 last:border-0 hover:bg-gray-50"
          >
            <td class="px-4 py-3 font-medium text-gray-900">{{ user.name }}</td>
            <td class="px-4 py-3 text-gray-500">{{ user.email }}</td>
            <td class="px-4 py-3">
              <div class="flex flex-wrap gap-1">
                <span
                  v-for="role in user.roles"
                  :key="role"
                  class="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700"
                >
                  {{ role }}
                </span>
                <span v-if="user.roles.length === 0" class="text-gray-400">—</span>
              </div>
            </td>
            <td class="px-4 py-3">
              <span
                class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
                :class="user.email_verified_at
                  ? 'bg-green-50 text-green-700'
                  : 'bg-gray-50 text-gray-500'"
              >
                {{ user.email_verified_at ? 'Verified' : 'Unverified' }}
              </span>
            </td>
            <td class="px-4 py-3">
              <div class="flex justify-end gap-2">
                <button
                  class="rounded-lg px-3 py-1.5 text-sm font-medium text-indigo-600 transition hover:bg-indigo-50"
                  @click="editUser(user.id)"
                >
                  Edit
                </button>
                <button
                  class="rounded-lg px-3 py-1.5 text-sm font-medium text-red-600 transition hover:bg-red-50"
                  @click="confirmDelete(user)"
                >
                  Delete
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div
      v-if="paginatedUsers && paginatedUsers.last_page > 1"
      class="mt-4 flex items-center justify-between text-sm text-gray-500"
    >
      <span>
        Showing {{ paginatedUsers.from }}–{{ paginatedUsers.to }} of {{ paginatedUsers.total }}
      </span>
      <div class="flex gap-1">
        <button
          v-for="link in paginatedUsers.links"
          :key="link.label"
          :disabled="!link.url"
          class="rounded-lg border border-gray-300 px-3 py-1.5 text-sm transition hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          :class="{ 'bg-indigo-600 text-white border-indigo-600': link.active }"
          @click="link.url && goToPage(parseInt(link.label))"
        >
          {{ link.label.replace('&laquo;', '‹').replace('&raquo;', '›') }}
        </button>
      </div>
    </div>

    <ConfirmationDialog
      :show="showDeleteDialog"
      title="Delete User"
      :message="`Delete ${userToDelete?.name}? This action cannot be undone.`"
      confirm-text="Delete"
      variant="danger"
      @confirm="executeDelete"
      @cancel="showDeleteDialog = false"
    />

    <ToastNotification
      :message="toastMessage"
      :type="toastType"
      @close="toastMessage = null"
    />
  </div>
</template>
