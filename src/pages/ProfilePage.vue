<script setup lang="ts">
import { onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import ProfileForm from '@/components/ProfileForm.vue'

defineOptions({
  name: 'ProfilePage',
})

const auth = useAuthStore()

onMounted(async () => {
  await auth.fetchUser()
})
</script>

<template>
  <div class="profile-page">
    <div class="profile-container">
      <!-- Header -->
      <div class="page-header">
        <div class="page-header-content">
          <div class="breadcrumb">
            <span class="breadcrumb-item">Home</span>
            <svg class="breadcrumb-sep" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
            <span class="breadcrumb-item breadcrumb-item--active">Profile</span>
          </div>
          <h1 class="page-title">My Profile</h1>
          <p class="page-subtitle">Manage your personal information and profile picture.</p>
        </div>
      </div>

      <!-- Content -->
      <div class="page-content">
        <div class="content-card">
          <div class="card-header">
            <div class="card-header-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </div>
            <div>
              <h2 class="card-title">Personal Information</h2>
              <p class="card-desc">Update your name and profile picture displayed on your account.</p>
            </div>
          </div>

          <ProfileForm />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.profile-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 50%, #eef2ff 100%);
  padding-top: 80px;
}

.profile-container {
  max-width: 720px;
  margin: 0 auto;
  padding: 40px 24px 80px;
}

/* Page Header */
.page-header {
  margin-bottom: 32px;
}

.page-header-content {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #94a3b8;
  margin-bottom: 4px;
}

.breadcrumb-item--active {
  color: #475569;
  font-weight: 500;
}

.breadcrumb-sep {
  color: #cbd5e1;
}

.page-title {
  font-size: 32px;
  font-weight: 800;
  color: #0f172a;
  letter-spacing: -0.03em;
  line-height: 1.2;
}

.page-subtitle {
  font-size: 15px;
  color: #64748b;
  line-height: 1.5;
  margin-top: 4px;
}

/* Content */
.page-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.content-card {
  background: white;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  padding: 32px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  transition: box-shadow 0.3s ease;
}

.content-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.card-header {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  margin-bottom: 28px;
  padding-bottom: 20px;
  border-bottom: 1px solid #f1f5f9;
}

.card-header-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: linear-gradient(135deg, #eff6ff, #dbeafe);
  color: #2563eb;
  flex-shrink: 0;
}

.card-title {
  font-size: 18px;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 4px;
}

.card-desc {
  font-size: 14px;
  color: #64748b;
  line-height: 1.5;
}

/* Responsive */
@media (max-width: 640px) {
  .profile-container {
    padding: 24px 16px 60px;
  }

  .page-title {
    font-size: 26px;
  }

  .content-card {
    padding: 24px 20px;
  }

  .card-header {
    flex-direction: column;
  }
}
</style>
