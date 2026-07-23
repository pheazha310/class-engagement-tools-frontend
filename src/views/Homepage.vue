<script setup lang="ts">
import { RouterLink, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { onMounted } from 'vue'
import { categories } from '@/data/toolsData'
import SiteFooter from '@/components/SiteFooter.vue'

defineOptions({
  name: 'HomePage',
})

const router = useRouter()
const auth = useAuthStore()

onMounted(() => {
  // Redirect authenticated users to their role-specific dashboard
  if (auth.isAuthenticated) {
    const targetRoute = auth.user?.role === 'teacher' ? '/teacher/dashboard' : '/student/dashboard'
    router.replace(targetRoute)
  }
})
</script>

<template>
  <div class="homepage">
    <!-- Hero Section -->
    <section class="hero">
      <div class="hero-content">
        <h1 class="hero-title">Transform Your Classroom Engagement</h1>
        <p class="hero-subtitle">
          Discover powerful tools designed for modern educators. Make learning interactive, fun, and fair for every student.
        </p>
        <div class="hero-buttons">
          <RouterLink to="/register" class="btn btn-primary">Get Started Free</RouterLink>
          <button class="btn btn-secondary">Learn More</button>
        </div>
      </div>
    </section>

    <!-- Featured Tools Section -->
    <section class="featured-tools">
      <div class="container">
        <h2 class="section-title">Featured Tools</h2>
        <p class="section-subtitle">
          Explore our collection of classroom engagement tools designed to enhance student participation and learning outcomes.
        </p>

        <div class="categories-grid">
          <div class="category-card" v-for="category in categories" :key="category.name">
            <h3 class="category-title">{{ category.icon }} {{ category.name }}</h3>
            <div class="category-tools">
              <RouterLink
                v-for="tool in category.tools"
                :key="tool.title"
                :to="tool.route || '/tools/' + tool.slug"
                class="category-tool-link"
              >
                <span class="category-tool-icon">{{ tool.icon }}</span>
                <div class="category-tool-content">
                  <span class="category-tool-title">{{ tool.title }}</span>
                  <span class="category-tool-desc">{{ tool.description }}</span>
                </div>
              </RouterLink>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- About Section -->
    <section class="about">
      <div class="container">
        <h2 class="section-title">About ClassTools</h2>
        <div class="about-content">
          <div class="about-text">
            <p>
              ClassTools is dedicated to transforming education through innovative technology.
              Our platform provides educators with a comprehensive suite of interactive tools
              designed to increase student engagement, streamline classroom management, and
              create dynamic learning experiences.
            </p>
            <p>
              Founded by educators, for educators, we understand the challenges of modern
              teaching. That's why we've created tools that are intuitive, effective, and
              accessible to all teachers.
            </p>
          </div>
          <div class="about-stats">
            <div class="stat-item">
              <div class="stat-number">10K+</div>
              <div class="stat-label">Active Teachers</div>
            </div>
            <div class="stat-item">
              <div class="stat-number">50K+</div>
              <div class="stat-label">Students Engaged</div>
            </div>
            <div class="stat-item">
              <div class="stat-number">15+</div>
              <div class="stat-label">Interactive Tools</div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Call-to-Action Section -->
    <section class="cta">
      <div class="container">
        <h2 class="cta-title">Ready to Transform Your Classroom?</h2>
        <p class="cta-subtitle">Join thousands of educators who are already using ClassTools to create engaging learning experiences.</p>
        <RouterLink to="/register" class="btn btn-primary btn-large">Get Started Free</RouterLink>
      </div>
    </section>

    <SiteFooter />
  </div>
</template>

<style scoped>
.homepage {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  line-height: 1.6;
  color: #1f2937;
  background: #ffffff;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

/* Buttons */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 12px 24px;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 600;
  font-size: 16px;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-primary {
  background: white;
  color: #001f9e;
}

.btn-primary:hover {
  background: #f0f5ff;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 31, 158, 0.3);
}

.btn-secondary {
  background: transparent;
  color: white;
  border: 2px solid white;
}

.btn-secondary:hover {
  background: white;
  color: #001f9e;
}

.btn-large {
  padding: 16px 32px;
  font-size: 18px;
}

/* Hero Section */
.hero {
  background: linear-gradient(135deg, #001f9e 0%, #2d4ec4 100%);
  color: white;
  padding: 160px 20px 120px;
  text-align: center;
  position: relative;
  overflow: hidden;
}

.hero::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: url('data:image/svg+xml,<svg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"><g fill="none" fill-rule="evenodd"><g fill="%23ffffff" fill-opacity="0.05"><path d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/></g></g></svg>');
  opacity: 0.3;
}

.hero-content {
  max-width: 800px;
  margin: 0 auto;
  position: relative;
  z-index: 1;
}

.hero-title {
  font-size: 56px;
  font-weight: 800;
  margin-bottom: 24px;
  line-height: 1.1;
  letter-spacing: -0.02em;
}

.hero-subtitle {
  font-size: 18px;
  margin-bottom: 40px;
  opacity: 0.95;
  line-height: 1.6;
  font-weight: 400;
}

.hero-buttons {
  display: flex;
  gap: 16px;
  justify-content: center;
  flex-wrap: wrap;
}

/* Featured Tools Section */
.featured-tools {
  padding: 80px 20px;
  background: linear-gradient(to bottom, #f8fafc, #f1f5f9);
}

.section-title {
  font-size: 36px;
  font-weight: 800;
  text-align: center;
  margin-bottom: 16px;
  color: #0f172a;
  letter-spacing: -0.02em;
}

.section-subtitle {
  text-align: center;
  color: #64748b;
  font-size: 18px;
  max-width: 700px;
  margin: 0 auto 48px;
  line-height: 1.6;
}

.categories-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 24px;
}

.category-card {
  background: white;
  border-radius: 16px;
  padding: 28px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  border: 1px solid #e2e8f0;
  transition: all 0.3s ease;
}

.category-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.12);
  border-color: #cbd5e1;
}

.category-title {
  font-size: 20px;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 20px;
  padding-bottom: 14px;
  border-bottom: 2px solid #e2e8f0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.category-tools {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.category-tool-link {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px;
  border-radius: 10px;
  text-decoration: none;
  color: #1e293b;
  transition: all 0.2s ease;
  border: 1px solid transparent;
}

.category-tool-link:hover {
  background: #f8fafc;
  border-color: #e2e8f0;
  transform: translateX(4px);
}

.category-tool-icon {
  font-size: 24px;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
  border-radius: 10px;
  flex-shrink: 0;
}

.category-tool-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  flex: 1;
}

.category-tool-title {
  font-weight: 600;
  font-size: 15px;
  color: #0f172a;
}

.category-tool-desc {
  font-size: 13px;
  color: #64748b;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* About Section */
.about {
  padding: 80px 20px;
  background: white;
}

.about-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 48px;
  align-items: center;
  margin-top: 48px;
}

.about-text p {
  color: #475569;
  font-size: 16px;
  margin-bottom: 16px;
  line-height: 1.8;
}

.about-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
}

.stat-item {
  text-align: center;
  padding: 28px 20px;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-radius: 12px;
  border: 1px solid #e2e8f0;
}

.stat-number {
  font-size: 36px;
  font-weight: 800;
  color: #001f9e;
  margin-bottom: 8px;
  letter-spacing: -0.02em;
}

.stat-label {
  font-size: 14px;
  color: #64748b;
  font-weight: 500;
}

/* Call-to-Action Section */
.cta {
  background: linear-gradient(135deg, #001f9e 0%, #2d4ec4 100%);
  color: white;
  padding: 100px 20px;
  text-align: center;
  position: relative;
  overflow: hidden;
}

.cta::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: url('data:image/svg+xml,<svg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"><g fill="none" fill-rule="evenodd"><g fill="%23ffffff" fill-opacity="0.08"><path d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/></g></g></svg>');
  opacity: 0.4;
}

.cta-title {
  font-size: 42px;
  font-weight: 800;
  margin-bottom: 20px;
  position: relative;
  letter-spacing: -0.02em;
}

.cta-subtitle {
  font-size: 18px;
  margin-bottom: 36px;
  opacity: 0.95;
  position: relative;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
  line-height: 1.6;
}

/* Responsive Design */
@media (max-width: 768px) {
  .hero {
    padding: 140px 20px 100px;
  }

  .hero-title {
    font-size: 36px;
  }

  .hero-subtitle {
    font-size: 16px;
  }

  .section-title {
    font-size: 28px;
  }

  .categories-grid {
    grid-template-columns: 1fr;
  }

  .about-content {
    grid-template-columns: 1fr;
  }

  .about-stats {
    grid-template-columns: 1fr;
  }

  .cta-title {
    font-size: 28px;
  }

  .cta {
    padding: 60px 20px;
  }
}

@media (min-width: 769px) and (max-width: 1024px) {
  .categories-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .about-content {
    grid-template-columns: 1fr;
  }
}
</style>
