<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'

defineOptions({
  name: 'ProfileForm',
})

const auth = useAuthStore()

const name = ref(auth.userName)
const profileImageUrl = computed(() => auth.profileImageUrl)
const displayInitials = computed(() => {
  const initials = auth.userInitials
  return initials || '?'
})

const imagePreview = ref<string | null>(null)
const selectedFile = ref<File | null>(null)
const isUploading = ref(false)
const isSaving = ref(false)
const successMessage = ref('')
const errorMessage = ref('')

// Watch auth user changes to sync name
watch(() => auth.userName, (newName) => {
  name.value = newName
})

// Watch for profile image changes
watch(() => auth.user?.profile_image_url, () => {
  imagePreview.value = null
  selectedFile.value = null
})

function handleFileSelect(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  selectedFile.value = file

  const reader = new FileReader()
  reader.onload = (e) => {
    imagePreview.value = e.target?.result as string
  }
  reader.readAsDataURL(file)
  input.value = ''
}

function clearMessages() {
  successMessage.value = ''
  errorMessage.value = ''
}

async function uploadImage() {
  if (!selectedFile.value) return

  isUploading.value = true
  clearMessages()

  try {
    const formData = new FormData()
    formData.append('image', selectedFile.value)

    const res = await fetch('/api/profile/image', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
      },
      credentials: 'include',
      body: formData,
    })

    const data = await res.json()

    if (!res.ok) {
      errorMessage.value = data.message || 'Failed to upload image.'
      return
    }

    const isWrapped = data && typeof data === 'object' && 'user' in data
    const imageSource = isWrapped ? (data as any).user : data
    const nextProfileImage = typeof imageSource?.profile_image === 'string' ? imageSource.profile_image : undefined
    const nextProfileImageUrl = typeof imageSource?.profile_image_url === 'string' ? imageSource.profile_image_url : undefined

    if (auth.user) {
      if (nextProfileImage) {
        auth.user.profile_image = nextProfileImage
      }
      if (nextProfileImageUrl) {
        auth.user.profile_image_url = nextProfileImageUrl
      } else if (!nextProfileImageUrl && !nextProfileImage) {
        auth.user.profile_image = null
        auth.user.profile_image_url = null
      }
    }

    if (nextProfileImageUrl || nextProfileImage) {
      auth.bumpProfileImageVersion()
    }

    successMessage.value = data.message || 'Profile image updated.'
    selectedFile.value = null
  } catch (err) {
    errorMessage.value = err instanceof Error ? err.message : 'Upload failed.'
  } finally {
    isUploading.value = false
  }
}

async function saveProfile() {
  if (!name.value.trim()) {
    errorMessage.value = 'Name is required.'
    return
  }

  isSaving.value = true
  clearMessages()

  try {
    const res = await fetch('/api/profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ name: name.value.trim() }),
    })

    const data = await res.json()

    if (!res.ok) {
      errorMessage.value = data.message || 'Failed to update profile.'
      return
    }

    // Update auth store with the returned user data
    if (data.user && auth.user) {
      auth.user.name = data.user.name
      if (data.user.profile_image) {
        auth.user.profile_image = data.user.profile_image
      }
      if (data.user.profile_image_url) {
        auth.user.profile_image_url = data.user.profile_image_url
        auth.bumpProfileImageVersion()
      }
    }

    successMessage.value = data.message || 'Profile updated.'
  } catch (err) {
    errorMessage.value = err instanceof Error ? err.message : 'Update failed.'
  } finally {
    isSaving.value = false
  }
}
</script>

<template>
  <div class="profile-form">
    <!-- Success Message -->
    <Transition name="slide-fade">
      <div v-if="successMessage" class="form-alert form-alert--success">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
        <span>{{ successMessage }}</span>
      </div>
    </Transition>

    <!-- Error Message -->
    <Transition name="slide-fade">
      <div v-if="errorMessage" class="form-alert form-alert--error">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="15" y1="9" x2="9" y2="15" />
          <line x1="9" y1="9" x2="15" y2="15" />
        </svg>
        <span>{{ errorMessage }}</span>
      </div>
    </Transition>

    <!-- ── Profile Image Upload ──────────────────────────────── -->
    <div class="form-section">
      <label class="field-label">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
          <circle cx="12" cy="13" r="4" />
        </svg>
        Profile Picture
      </label>
      <div class="avatar-upload">
        <div class="avatar-preview">
          <img
            v-if="imagePreview"
            :src="imagePreview"
            alt="Preview"
            class="avatar-img"
          />
          <img
            v-else-if="profileImageUrl"
            :src="profileImageUrl"
            :alt="auth.userName"
            class="avatar-img"
          />
          <span v-else class="avatar-initials">{{ displayInitials }}</span>
          <div class="avatar-overlay">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
            <span>Change</span>
          </div>
          <input
            type="file"
            accept="image/jpeg,image/png,image/jpg,image/gif,image/webp"
            class="avatar-input"
            @change="handleFileSelect"
          />
        </div>
        <div class="avatar-actions">
          <button
            v-if="selectedFile"
            class="pf-btn pf-btn--primary pf-btn--sm"
            :disabled="isUploading"
            @click="uploadImage"
          >
            <svg v-if="isUploading" class="spinner" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="12" y1="2" x2="12" y2="6" />
              <line x1="12" y1="18" x2="12" y2="22" />
              <line x1="4.93" y1="4.93" x2="7.76" y2="7.76" />
              <line x1="16.24" y1="16.24" x2="19.07" y2="19.07" />
              <line x1="2" y1="12" x2="6" y2="12" />
              <line x1="18" y1="12" x2="22" y2="12" />
              <line x1="4.93" y1="19.07" x2="7.76" y2="16.24" />
              <line x1="16.24" y1="7.76" x2="19.07" y2="4.93" />
            </svg>
            {{ isUploading ? 'Uploading...' : 'Upload' }}
          </button>
          <p class="avatar-hint">JPEG, PNG, or WebP. Max 2MB.</p>
        </div>
      </div>
    </div>

    <div class="field-divider" />

    <!-- ── Full Name ─────────────────────────────────────────── -->
    <div class="form-section">
      <label for="name" class="field-label">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
        Full Name
      </label>
      <div class="input-wrap">
        <input
          id="name"
          v-model="name"
          type="text"
          class="pf-input"
          placeholder="Enter your name"
          maxlength="255"
        />
      </div>
    </div>

    <!-- ── Email (read-only) ─────────────────────────────────── -->
    <div class="form-section">
      <label class="field-label">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
          <polyline points="22,6 12,13 2,6" />
        </svg>
        Email
      </label>
      <div class="input-wrap">
        <input
          type="email"
          :value="auth.user?.email"
          class="pf-input pf-input--readonly"
          readonly
          disabled
        />
      </div>
    </div>

    <!-- ── Role (read-only) ──────────────────────────────────── -->
    <div class="form-section">
      <label class="field-label">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 00-3-3.87" />
          <path d="M16 3.13a4 4 0 010 7.75" />
        </svg>
        Role
      </label>
      <div class="input-wrap">
        <input
          type="text"
          :value="auth.user?.role ? auth.user.role.charAt(0).toUpperCase() + auth.user.role.slice(1) : ''"
          class="pf-input pf-input--readonly"
          readonly
          disabled
        />
      </div>
    </div>

    <!-- ── School (read-only) ────────────────────────────────── -->
    <div class="form-section">
      <label class="field-label">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
          <path d="M6 12v5c3 3 9 3 12 0v-5" />
        </svg>
        School
      </label>
      <div class="input-wrap">
        <input
          type="text"
          :value="auth.user?.school || 'Not assigned'"
          class="pf-input pf-input--readonly"
          readonly
          disabled
        />
      </div>
    </div>

    <!-- ── Save Button ───────────────────────────────────────── -->
    <div class="form-actions">
      <button
        class="pf-btn pf-btn--primary pf-btn--lg"
        :disabled="isSaving || !name.trim()"
        @click="saveProfile"
      >
        <svg v-if="isSaving" class="spinner" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <line x1="12" y1="2" x2="12" y2="6" />
          <line x1="12" y1="18" x2="12" y2="22" />
          <line x1="4.93" y1="4.93" x2="7.76" y2="7.76" />
          <line x1="16.24" y1="16.24" x2="19.07" y2="19.07" />
          <line x1="2" y1="12" x2="6" y2="12" />
          <line x1="18" y1="12" x2="22" y2="12" />
          <line x1="4.93" y1="19.07" x2="7.76" y2="16.24" />
          <line x1="16.24" y1="7.76" x2="19.07" y2="4.93" />
        </svg>
        {{ isSaving ? 'Saving...' : 'Save Changes' }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.profile-form {
  max-width: 100%;
}

/* ── Alerts ─────────────────────────────────────────────────── */
.form-alert {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 24px;
  animation: alert-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes alert-in {
  0% { opacity: 0; transform: translateY(-8px) scale(0.96); }
  100% { opacity: 1; transform: translateY(0) scale(1); }
}

.form-alert--success {
  background: #f0fdf4;
  color: #166534;
  border: 1px solid #bbf7d0;
}

.form-alert--error {
  background: #fef2f2;
  color: #991b1b;
  border: 1px solid #fecaca;
}

.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.25s ease;
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

/* ── Sections ───────────────────────────────────────────────── */
.form-section {
  margin-bottom: 22px;
}

.field-label {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 13px;
  font-weight: 700;
  color: var(--ink, #0f172a);
  margin-bottom: 8px;
}

.field-label svg {
  color: var(--muted, #94a3b8);
  flex-shrink: 0;
}

.field-divider {
  height: 1px;
  background: var(--line, #e2e8f0);
  margin: 24px 0;
}

/* ── Avatar Upload ──────────────────────────────────────────── */
.avatar-upload {
  display: flex;
  align-items: center;
  gap: 20px;
}

.avatar-preview {
  position: relative;
  width: 80px;
  height: 80px;
  border-radius: 50%;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  color: white;
  font-size: 28px;
  font-weight: 800;
  flex-shrink: 0;
  border: 3px solid var(--line, #e2e8f0);
  cursor: pointer;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.avatar-preview:hover {
  border-color: #3b82f6;
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.15);
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-initials {
  color: white;
  font-size: 28px;
  font-weight: 800;
}

.avatar-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  background: rgba(0, 0, 0, 0.5);
  opacity: 0;
  transition: opacity 0.2s ease;
  color: white;
}

.avatar-preview:hover .avatar-overlay {
  opacity: 1;
}

.avatar-overlay svg {
  width: 18px;
  height: 18px;
}

.avatar-overlay span {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.avatar-input {
  position: absolute;
  inset: 0;
  opacity: 0;
  cursor: pointer;
}

.avatar-actions {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.avatar-hint {
  font-size: 11px;
  color: var(--muted, #94a3b8);
  margin: 0;
}

/* ── Inputs ─────────────────────────────────────────────────── */
.input-wrap {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.pf-input {
  width: 100%;
  padding: 12px 16px;
  font-size: 14px;
  font-family: inherit;
  color: var(--ink, #0f172a);
  background: var(--surface, #ffffff);
  border: 1.5px solid var(--line, #e2e8f0);
  border-radius: 10px;
  transition: all 0.2s ease;
  outline: none;
}

.pf-input:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.12);
}

.pf-input::placeholder {
  color: #c5cbdd;
}

.pf-input--readonly {
  background: var(--surface-soft, #f8fafc);
  color: var(--muted, #94a3b8);
  cursor: not-allowed;
}

.pf-input--readonly:focus {
  border-color: var(--line, #e2e8f0);
  box-shadow: none;
}

/* ── Buttons ────────────────────────────────────────────────── */
.form-actions {
  margin-top: 32px;
}

.pf-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  font-family: inherit;
  border-radius: 10px;
  border: none;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
  text-decoration: none;
  white-space: nowrap;
}

.pf-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pf-btn--primary {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: white;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.25);
}

.pf-btn--primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(59, 130, 246, 0.35);
}

.pf-btn--primary:active:not(:disabled) {
  transform: translateY(0);
}

.pf-btn--sm {
  padding: 8px 16px;
  font-size: 13px;
  border-radius: 8px;
}

.pf-btn--lg {
  padding: 12px 28px;
  font-size: 15px;
  border-radius: 12px;
  min-width: 180px;
}

/* ── Spinner ────────────────────────────────────────────────── */
.spinner {
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* ── Responsive ─────────────────────────────────────────────── */
@media (max-width: 480px) {
  .avatar-upload {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
