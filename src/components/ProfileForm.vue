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

    // Update the auth store with the new image
    if (auth.user) {
      auth.user.profile_image = data.profile_image
      auth.user.profile_image_url = data.profile_image_url
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
      auth.user.profile_image = data.user.profile_image
      auth.user.profile_image_url = data.user.profile_image_url
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
    <Transition name="fade">
      <div v-if="successMessage" class="alert alert--success">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
          <polyline points="22 4 12 14.01 9 11.01"></polyline>
        </svg>
        {{ successMessage }}
      </div>
    </Transition>

    <!-- Error Message -->
    <Transition name="fade">
      <div v-if="errorMessage" class="alert alert--error">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="15" y1="9" x2="9" y2="15"></line>
          <line x1="9" y1="9" x2="15" y2="15"></line>
        </svg>
        {{ errorMessage }}
      </div>
    </Transition>

    <!-- Profile Image Upload -->
    <div class="form-section">
      <label class="section-label">Profile Picture</label>
      <div class="image-upload-area">
        <div class="image-preview-wrapper">
          <div class="image-preview">
            <img
              v-if="imagePreview"
              :src="imagePreview"
              alt="Preview"
              class="preview-img"
            />
            <img
              v-else-if="profileImageUrl"
              :src="profileImageUrl"
              :alt="auth.userName"
              class="preview-img"
            />
            <span v-else class="preview-initials">{{ displayInitials }}</span>
          </div>
          <div class="image-upload-actions">
            <label class="btn btn--outline btn--small">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                <circle cx="12" cy="13" r="4"></circle>
              </svg>
              Choose Image
              <input
                type="file"
                accept="image/jpeg,image/png,image/jpg,image/gif,image/webp"
                class="file-input"
                @change="handleFileSelect"
              />
            </label>
            <button
              v-if="selectedFile"
              class="btn btn--primary btn--small"
              :disabled="isUploading"
              @click="uploadImage"
            >
              <svg v-if="isUploading" class="spinner" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <line x1="12" y1="2" x2="12" y2="6"></line>
                <line x1="12" y1="18" x2="12" y2="22"></line>
                <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line>
                <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line>
                <line x1="2" y1="12" x2="6" y2="12"></line>
                <line x1="18" y1="12" x2="22" y2="12"></line>
                <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line>
                <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line>
              </svg>
              {{ isUploading ? 'Uploading...' : 'Upload' }}
            </button>
          </div>
        </div>
        <p class="image-hint">JPEG, PNG, JPG, GIF, or WebP. Max 2MB.</p>
      </div>
    </div>

    <div class="form-divider"></div>

    <!-- Name -->
    <div class="form-section">
      <label for="name" class="section-label">Full Name</label>
      <div class="input-group">
        <input
          id="name"
          v-model="name"
          type="text"
          class="form-input"
          placeholder="Enter your name"
          maxlength="255"
        />
      </div>
    </div>

    <!-- Email (read-only) -->
    <div class="form-section">
      <label class="section-label">Email</label>
      <div class="input-group">
        <input
          type="email"
          :value="auth.user?.email"
          class="form-input form-input--readonly"
          readonly
          disabled
        />
      </div>
    </div>

    <!-- Role (read-only) -->
    <div class="form-section">
      <label class="section-label">Role</label>
      <div class="input-group">
        <input
          type="text"
          :value="auth.user?.role ? auth.user.role.charAt(0).toUpperCase() + auth.user.role.slice(1) : ''"
          class="form-input form-input--readonly"
          readonly
          disabled
        />
      </div>
    </div>

    <!-- School (read-only) -->
    <div class="form-section">
      <label class="section-label">School</label>
      <div class="input-group">
        <input
          type="text"
          :value="auth.user?.school || 'Not assigned'"
          class="form-input form-input--readonly"
          readonly
          disabled
        />
      </div>
    </div>

    <!-- Save Button -->
    <div class="form-actions">
      <button
        class="btn btn--primary"
        :disabled="isSaving || !name.trim()"
        @click="saveProfile"
      >
        <svg v-if="isSaving" class="spinner" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <line x1="12" y1="2" x2="12" y2="6"></line>
          <line x1="12" y1="18" x2="12" y2="22"></line>
          <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line>
          <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line>
          <line x1="2" y1="12" x2="6" y2="12"></line>
          <line x1="18" y1="12" x2="22" y2="12"></line>
          <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line>
          <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line>
        </svg>
        {{ isSaving ? 'Saving...' : 'Save Changes' }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.profile-form {
  max-width: 480px;
}

.alert {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 24px;
}

.alert--success {
  background: #f0fdf4;
  color: #166534;
  border: 1px solid #bbf7d0;
}

.alert--error {
  background: #fef2f2;
  color: #991b1b;
  border: 1px solid #fecaca;
}

/* Fade transition */
.fade-enter-active,
.fade-leave-active {
  transition: all 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

.form-section {
  margin-bottom: 20px;
}

.section-label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: #475569;
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.form-divider {
  height: 1px;
  background: #e2e8f0;
  margin: 24px 0;
}

/* Image Upload */
.image-upload-area {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.image-preview-wrapper {
  display: flex;
  align-items: center;
  gap: 20px;
}

.image-preview {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #2563eb, #7c3aed);
  color: white;
  font-size: 28px;
  font-weight: 700;
  flex-shrink: 0;
  border: 3px solid #e2e8f0;
  transition: border-color 0.2s ease;
}

.image-preview-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.preview-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.preview-initials {
  color: white;
  font-size: 28px;
  font-weight: 700;
}

.image-upload-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.file-input {
  display: none;
}

.image-hint {
  font-size: 12px;
  color: #94a3b8;
  margin: 0;
}

/* Input Group */
.input-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-input {
  width: 100%;
  padding: 10px 14px;
  font-size: 14px;
  font-family: inherit;
  color: #1e293b;
  background: white;
  border: 1.5px solid #e2e8f0;
  border-radius: 10px;
  transition: all 0.2s ease;
  outline: none;
}

.form-input:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
}

.form-input--readonly {
  background: #f8fafc;
  color: #64748b;
  cursor: not-allowed;
}

.form-input--readonly:focus {
  border-color: #e2e8f0;
  box-shadow: none;
}

.form-actions {
  margin-top: 32px;
}

/* Buttons */
.btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  font-size: 14px;
  font-weight: 600;
  font-family: inherit;
  border-radius: 10px;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  text-decoration: none;
  white-space: nowrap;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn--primary {
  background: #2563eb;
  color: white;
  box-shadow: 0 1px 3px rgba(37, 99, 235, 0.2);
}

.btn--primary:hover:not(:disabled) {
  background: #1d4ed8;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
}

.btn--outline {
  background: white;
  color: #475569;
  border: 1.5px solid #e2e8f0;
}

.btn--outline:hover {
  background: #f8fafc;
  border-color: #cbd5e1;
  color: #2563eb;
}

.btn--small {
  padding: 8px 14px;
  font-size: 13px;
  border-radius: 8px;
}

/* Spinner */
.spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
