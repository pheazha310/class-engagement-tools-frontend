<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { categories } from '@/data/toolsData'
import SiteFooter from '@/components/SiteFooter.vue'

defineOptions({
  name: 'HomePage',
})
</script>

<template>
  <div class="homepage">
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
            <p>
              Our mission is to empower educators with the resources they need to create
              engaging, inclusive, and effective learning environments. We believe that every
              student deserves access to high-quality educational tools that make learning fun
              and meaningful.
            </p>
          </div>
          <div class="about-stats">
            <div class="stat-item" v-for="stat in stats" :key="stat.label">
              <div class="stat-number">{{ stat.value }}</div>
              <div class="stat-label">{{ stat.label }}</div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="features">
      <div class="container">
        <h2 class="section-title">Why Choose ClassTools?</h2>
        <p class="section-subtitle">
          We provide everything you need to create engaging and interactive classroom experiences.
        </p>
        <div class="features-grid">
          <div class="feature-card" v-for="feature in features" :key="feature.title">
            <div class="feature-icon">{{ feature.icon }}</div>
            <h3>{{ feature.title }}</h3>
            <p>{{ feature.desc }}</p>
          </div>
        </div>
      </div>
    </section>

    <section class="testimonials">
      <div class="container">
        <h2 class="section-title">What Educators Say</h2>
        <p class="section-subtitle">
          Join thousands of teachers who are transforming their classrooms with ClassTools.
        </p>
        <div class="testimonials-grid">
          <div class="testimonial-card" v-for="t in testimonials" :key="t.author">
            <div class="testimonial-content">
              <p>"{{ t.quote }}"</p>
            </div>
            <div class="testimonial-author">
              <div class="testimonial-avatar">{{ t.avatar }}</div>
              <div class="testimonial-info">
                <h4>{{ t.author }}</h4>
                <p>{{ t.role }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="team-section">
      <div class="container">
        <h2 class="section-title">Meet Our Team</h2>
        <p class="section-subtitle">
          We're a passionate group of educators, developers, and designers dedicated to transforming education.
        </p>
        <div class="team-grid">
          <div class="team-card" v-for="member in team" :key="member.name">
            <div class="team-avatar">
              <img :src="member.image" :alt="member.name" class="avatar-image" />
            </div>
            <h3 class="team-name">{{ member.name }}</h3>
            <p class="team-role">{{ member.role }}</p>
            <p class="team-bio">{{ member.bio }}</p>
          </div>
        </div>
      </div>
    </section>

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

<script lang="ts">
import SopheaImage from '@/assets/images/Sophea.jpg'
import SopheaSophornImage from '@/assets/images/oun.jpg'
import SreykeoImage from '@/assets/images/Me.jpg'
import SanImage from '@/assets/images/San.jpg'
import MaryImage from '@/assets/images/Mary.jpg'
import VannaImage from '@/assets/images/Vanna.jpg'
import ChrounImage from '@/assets/images/Nita.jpg'

const stats = [
  { value: '10K+', label: 'Active Teachers' },
  { value: '50K+', label: 'Students Engaged' },
  { value: '15+', label: 'Interactive Tools' },
  { value: '98%', label: 'Satisfaction Rate' },
  { value: '24/7', label: 'Support Available' },
  { value: '100%', label: 'Free to Use' },
]

const features = [
  { icon: '🎯', title: 'Easy to Use', desc: 'Intuitive interface designed for educators. No technical skills required - start using tools in seconds.' },
  { icon: '📱', title: 'Works Everywhere', desc: 'Access tools on any device - desktop, tablet, or mobile. Perfect for modern classrooms.' },
  { icon: '🔒', title: 'Safe & Secure', desc: 'Your data is protected with enterprise-grade security. We prioritize student privacy.' },
  { icon: '💡', title: 'Constantly Updated', desc: 'Regular new features and improvements based on educator feedback. Always evolving.' },
  { icon: '🌍', title: 'Global Community', desc: 'Join thousands of educators worldwide sharing best practices and success stories.' },
  { icon: '🎓', title: 'Education-Focused', desc: 'Built by educators who understand classroom needs. Every feature serves a purpose.' },
]

const testimonials = [
  { quote: 'ClassTools has completely transformed how I engage my students. The Random Wheel and Student Picker are game-changers!', author: 'Sarah Johnson', role: 'Elementary School Teacher', avatar: '👩‍🏫' },
  { quote: 'The Group Generator saves me so much time. I can create balanced groups in seconds and focus on teaching.', author: 'Michael Chen', role: 'High School Teacher', avatar: '👨‍🏫' },
  { quote: 'My students love the educational games! They\'re learning while having fun. Best tool I\'ve ever used.', author: 'Emily Rodriguez', role: 'Middle School Teacher', avatar: '👩‍🏫' },
]

const team = [
  { name: 'Sophea Phal', role: 'Scrum Master', bio: 'Database Management', image: SopheaImage },
  { name: 'Sophea Sophorn', role: 'Backend Developer', bio: 'Responsible for Backend Development', image: SopheaSophornImage },
  { name: 'Sreykeo Keun', role: 'Frontend Developer & QA', bio: 'Responsible for Frontend Development and Quality Assurance', image: SreykeoImage },
  { name: 'San Svit', role: 'Frontend Developer', bio: 'Responsible for Frontend Development', image: SanImage },
  { name: 'Mary Sao', role: 'Frontend Developer', bio: 'Responsible for Frontend Development', image: MaryImage },
  { name: 'Vanna Len', role: 'Backend Developer', bio: 'Responsible for Backend Development', image: VannaImage },
  { name: 'Chroun Nita', role: 'Frontend Developer & QA', bio: 'Responsible for Frontend Development and Quality Assurance', image: ChrounImage },
]
</script>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.image {
  width: 180px;
  height: auto;
  display: block;
  margin: 0 auto;
}

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

h1, h2, h3 {
  line-height: 1.2;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 12px 24px;
  border-radius: 10px;
  text-decoration: none;
  font-weight: 600;
  font-size: 16px;
  border: none;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.btn-primary {
  background: white;
  color: #6366f1;
  box-shadow: 0 2px 8px rgba(99, 102, 241, 0.2);
}

.btn-primary:hover {
  background: #f5f3ff;
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(99, 102, 241, 0.3);
}

.btn-secondary {
  background: transparent;
  color: white;
  border: 2px solid rgba(255, 255, 255, 0.8);
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.15);
  border-color: white;
}

.btn-large {
  padding: 16px 32px;
  font-size: 18px;
}

.btn-login {
  background: transparent;
  color: #475569;
  border: 1px solid #e2e8f0;
  backdrop-filter: blur(10px);
  border-radius: 10px;
  padding: 8px 18px;
  font-size: 14px;
  font-weight: 500;
}

.btn-login:hover {
  background: #f8fafc;
  color: #6366f1;
  border-color: #6366f1;
}

.btn-register {
  background: linear-gradient(135deg, #6366f1, #4f46e5);
  color: white;
  border-radius: 10px;
  padding: 8px 18px;
  font-size: 14px;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(99, 102, 241, 0.25);
}

.btn-register:hover {
  background: linear-gradient(135deg, #818cf8, #6366f1);
  transform: translateY(-1px);
  box-shadow: 0 6px 18px rgba(99, 102, 241, 0.35);
}

.navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  background: rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(16px) saturate(180%);
  -webkit-backdrop-filter: blur(16px) saturate(180%);
  border-bottom: 1px solid transparent;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  height: 64px;
}

.navbar.scrolled {
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
  background: rgba(255, 255, 255, 0.95);
  border-bottom-color: #f1f5f9;
}

.nav-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
  height: 64px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.nav-logo {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 20px;
  font-weight: 700;
  color: #1e293b;
  z-index: 1001;
  text-decoration: none;
}

.nav-logo .image {
  width: 170px;
  height: 170px;
  object-fit: contain;
}

.nav-menu {
  display: flex;
  list-style: none;
  align-items: center;
  gap: 8px;
  margin: 0;
  padding: 0;
}

.nav-link {
  display: inline-flex;
  align-items: center;
  padding: 8px 14px;
  color: #475569;
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  border-radius: 8px;
  transition: all 0.2s ease;
  border: none;
  background: transparent;
  cursor: pointer;
  gap: 4px;
  position: relative;
}

.nav-link:hover {
  color: #6366f1;
  background: rgba(99, 102, 241, 0.06);
}

.nav-link.active {
  color: #6366f1;
  background: rgba(99, 102, 241, 0.08);
}

.nav-link::after {
  content: '';
  position: absolute;
  bottom: 2px;
  left: 14px;
  right: 14px;
  height: 2px;
  background: #6366f1;
  border-radius: 1px;
  transform: scaleX(0);
  transition: transform 0.2s ease;
}

.nav-link:hover::after,
.nav-link.active::after {
  transform: scaleX(1);
}

.nav-dropdown-trigger {
  position: relative;
}

.dropdown-toggle {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.dropdown-icon {
  transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.nav-dropdown-trigger:hover .dropdown-icon {
  transform: rotate(180deg);
}

.dropdown-menu {
  position: absolute;
  top: calc(100% + 10px);
  left: 50%;
  transform: translateX(-50%) translateY(8px) scale(0.96);
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 8px;
  min-width: 220px;
  opacity: 0;
  visibility: hidden;
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  z-index: 1002;
}

.dropdown-menu.active {
  opacity: 1;
  visibility: visible;
  transform: translateX(-50%) translateY(0) scale(1);
}

.dropdown-item {
  display: flex;
  align-items: center;
  width: 100%;
  text-align: left;
  padding: 10px 14px;
  color: #475569;
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  border-radius: 10px;
  transition: all 0.15s ease;
  border: none;
  background: none;
  cursor: pointer;
  gap: 10px;
}

.dropdown-item:hover {
  background: rgba(99, 102, 241, 0.06);
  color: #6366f1;
  padding-left: 18px;
}

.nav-buttons {
  display: flex;
  align-items: center;
  gap: 14px;
}

@media (max-width: 768px) {
  .nav-menu {
    position: fixed;
    top: 64px;
    left: 0;
    right: 0;
    background: white;
    flex-direction: column;
    padding: 20px;
    gap: 4px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
    border-bottom: 1px solid #f1f5f9;
    max-height: 0;
    max-width: 100vw;
    overflow: hidden;
    opacity: 0;
    transform: translateY(-8px);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    z-index: 999;
  }

  .nav-menu.active {
    max-height: calc(100vh - 64px);
    opacity: 1;
    transform: translateY(0);
  }

  .nav-link {
    width: 100%;
    padding: 12px 16px;
    justify-content: space-between;
  }

  .nav-link::after {
    display: none;
  }

  .dropdown-menu {
    position: static;
    transform: none;
    background: #f8fafc;
    padding-left: 16px;
    max-height: 0;
    max-width: 100vw;
    overflow: hidden;
    opacity: 0;
    padding-top: 0;
    padding-bottom: 0;
    transition: all 0.25s ease;
  }

  .dropdown-menu.active {
    max-height: 500px;
    opacity: 1;
    padding-top: 4px;
    padding-bottom: 4px;
  }

  .dropdown-toggle::after {
    content: '';
    border: none;
  }

  .nav-logo-tagline {
    display: none;
  }

  .btn-login {
    background: transparent;
    color: #475569;
    border: 1.5px solid #e2e8f0;
    border-radius: 999px;
    padding: 10px 20px;
    font-size: 14px;
    font-weight: 500;
    transition: all 0.25s ease;
  }

  .btn-login:hover {
    background: rgba(248, 250, 252, 0.9);
    color: #6366f1;
    border-color: #6366f1;
  }

  .btn-register {
    background: linear-gradient(135deg, #6366f1, #4f46e5);
    color: white;
    border: none;
    border-radius: 999px;
    padding: 10px 24px;
    font-size: 14px;
    font-weight: 600;
    box-shadow: 0 2px 8px rgba(99, 102, 241, 0.25);
    transition: all 0.25s ease;
  }

  .btn-register:hover {
    background: linear-gradient(135deg, #818cf8, #6366f1);
    transform: translateY(-1px);
    box-shadow: 0 6px 18px rgba(99, 102, 241, 0.35);
  }

  .mobile-menu-toggle {
    display: flex;
  }

  .nav-buttons .btn {
    display: inline-flex;
    padding: 8px 16px;
    font-size: 14px;
  }

  .mobile-menu-toggle {
    display: flex;
  }
}

/* Hero Section */
.hero {
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%);
  color: white;
  padding: 180px 20px 120px;
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
  opacity: 0.4;
}

.hero-content {
  max-width: 800px;
  margin: 0 auto;
  position: relative;
  z-index: 1;
  animation: fade-in-up 0.8s ease-out;
}

@keyframes fade-in-up {
  from { opacity: 0; transform: translateY(24px); }
  to { opacity: 1; transform: translateY(0); }
}

.hero-title {
  font-size: 56px;
  font-weight: 800;
  margin-bottom: 24px;
  line-height: 1.1;
  letter-spacing: -0.025em;
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
  letter-spacing: -0.025em;
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
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  border: 1px solid #e2e8f0;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.category-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.1);
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
  border-radius: 12px;
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
  transition: all 0.2s ease;
}

.category-tool-link:hover .category-tool-icon {
  background: linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%);
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
  -webkit-orient: vertical;
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
  gap: 20px;
}

.stat-item {
  text-align: center;
  padding: 28px 20px;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.stat-item:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.08);
  border-color: #6366f1;
}

.stat-number {
  font-size: 36px;
  font-weight: 800;
  color: #6366f1;
  margin-bottom: 8px;
  letter-spacing: -0.025em;
}

.stat-label {
  font-size: 14px;
  color: #64748b;
  font-weight: 500;
}

/* Features Section */
.features {
  padding: 80px 20px;
  background: #f9fafb;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;
  margin-top: 48px;
}

.feature-card {
  background: white;
  border-radius: 16px;
  padding: 32px;
  text-align: center;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid #e2e8f0;
}

.feature-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.08);
  border-color: #cbd5e1;
}

.feature-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.feature-card h3 {
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 12px;
  color: #1f2937;
}

.feature-card p {
  color: #6b7280;
  font-size: 14px;
  line-height: 1.6;
}

/* Testimonials Section */
.testimonials {
  padding: 80px 20px;
  background: white;
}

.testimonials-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
  margin-top: 48px;
}

.testimonial-card {
  background: #f9fafb;
  border-radius: 16px;
  padding: 32px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid #e2e8f0;
}

.testimonial-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.1);
  border-color: #cbd5e1;
}

.testimonial-content {
  margin-bottom: 24px;
}

.testimonial-content p {
  color: #4b5563;
  font-size: 16px;
  line-height: 1.8;
  font-style: italic;
}

.testimonial-author {
  display: flex;
  align-items: center;
  gap: 16px;
}

.testimonial-avatar {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: linear-gradient(135deg, #6366f1, #4f46e5);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.2);
}

.testimonial-info h4 {
  font-size: 16px;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 4px;
}

.testimonial-info p {
  font-size: 14px;
  color: #6b7280;
  margin: 0;
}

/* Team Section */
.team-section {
  padding: 80px 20px;
  background: #f9fafb;
}

.team-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 24px;
  margin-top: 48px;
}

.team-card {
  background: white;
  border-radius: 16px;
  padding: 32px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid #e2e8f0;
}

.team-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.1);
  border-color: #cbd5e1;
}

.team-avatar {
  width: 120px;
  height: 120px;
  margin: 0 auto 20px;
  border-radius: 50%;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
  box-shadow: 0 8px 24px rgba(99, 102, 241, 0.25);
}

.avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.team-name {
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 8px;
  color: #1f2937;
}

.team-role {
  font-size: 14px;
  font-weight: 600;
  color: #6366f1;
  margin-bottom: 12px;
}

.team-bio {
  color: #6b7280;
  font-size: 14px;
  line-height: 1.6;
}

/* Call-to-Action Section */
.cta {
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%);
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
  letter-spacing: -0.025em;
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

  .features-grid {
    grid-template-columns: 1fr;
  }

  .testimonials-grid {
    grid-template-columns: 1fr;
  }

  .team-grid {
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

  .features-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .testimonials-grid {
    grid-template-columns: 1fr;
  }

  .team-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
