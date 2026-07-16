<script setup lang="ts">
import { RouterLink } from 'vue-router'
import SiteFooter from '@/components/SiteFooter.vue'
</script>

<template>
  <div class="about-page">
    <!-- Hero Section -->
    <section class="hero">
      <div class="hero-content">
        <h1 class="hero-title">About Class Engagement Tools</h1>
        <p class="hero-subtitle">
          Empowering educators with innovative tools to create engaging, interactive, and effective learning experiences.
        </p>
      </div>
    </section>

     <!-- Platform Overview Section -->
     <section class="overview">
       <div class="container">
         <div class="section-header">
           <span class="section-eyebrow">Our Platform</span>
           <h2 class="section-title">Built for modern classrooms</h2>
           <p class="section-subtitle">
             A comprehensive suite of interactive applications designed to make teaching more engaging and effective.
           </p>
         </div>
         <div class="overview-content">
           <div class="overview-text">
             <p>
               The Class Engagement Tools Platform is a comprehensive suite of interactive applications
               designed specifically for modern educators. Our mission is to transform traditional
               classroom experiences into dynamic, engaging, and student-centered learning environments.
             </p>
             <p>
               We provide teachers with powerful, easy-to-use tools that increase student participation,
               streamline classroom management, and make learning fun. From random student selection to
               interactive quizzes, our platform covers all aspects of classroom engagement.
             </p>
             <p>
               Built with educators in mind, our platform is intuitive, accessible, and works seamlessly
               across all devices. Whether you're teaching in a traditional classroom or online, our tools
               adapt to your needs.
             </p>
           </div>
           <div class="overview-image">
             <div class="image-placeholder">
               <span class="placeholder-icon">🎓</span>
               <p>Empowering Education Through Technology</p>
             </div>
           </div>
         </div>
       </div>
     </section>

     <!-- Mission Section -->
     <section class="mission">
       <div class="container">
         <div class="section-header">
           <span class="section-eyebrow">Our Mission</span>
           <h2 class="section-title">Driving better learning outcomes</h2>
           <p class="section-subtitle">
             We focus on the areas that matter most to educators and students.
           </p>
         </div>
         <div class="mission-content">
           <div class="mission-card">
             <div class="mission-icon">🎯</div>
             <h3>Increase Engagement</h3>
             <p>Make every lesson interactive and captivating, ensuring students remain focused and enthusiastic about learning.</p>
           </div>
           <div class="mission-card">
             <div class="mission-icon">💡</div>
             <h3>Simplify Teaching</h3>
             <p>Provide intuitive tools that save teachers time and reduce administrative burden, allowing more focus on actual teaching.</p>
           </div>
           <div class="mission-card">
             <div class="mission-icon">🌟</div>
             <h3>Ensure Fairness</h3>
             <p>Create equitable learning environments where every student has equal opportunities to participate and succeed.</p>
           </div>
           <div class="mission-card">
             <div class="mission-icon">🚀</div>
             <h3>Foster Innovation</h3>
             <p>Continuously develop new features and tools that leverage technology to enhance educational outcomes.</p>
           </div>
         </div>
       </div>
     </section>

     <!-- Key Features Section -->
     <section class="features">
       <div class="container">
         <div class="section-header">
           <span class="section-eyebrow">Key Features</span>
           <h2 class="section-title">Everything you need in one place</h2>
           <p class="section-subtitle">
             Discover what makes our platform the perfect companion for modern educators.
           </p>
         </div>
         <div class="features-grid">
           <div class="feature-card">
             <div class="feature-icon">🎡</div>
             <h3>Random Selection Tools</h3>
             <p>Fair and fun ways to select students with spinning wheels and random pickers.</p>
           </div>
           <div class="feature-card">
             <div class="feature-icon">⏱️</div>
             <h3>Classroom Timers</h3>
             <p>Countdowns, stopwatches, and Pomodoro sessions to manage classroom time effectively.</p>
           </div>
           <div class="feature-card">
             <div class="feature-icon">👥</div>
             <h3>Group Management</h3>
             <p>Create balanced groups quickly and share them with your class instantly.</p>
           </div>
           <div class="feature-card">
             <div class="feature-icon">🗳️</div>
             <h3>Live Polling & Voting</h3>
             <p>Collect instant feedback with interactive polls that work on any device.</p>
           </div>
           <div class="feature-card">
             <div class="feature-icon">🎮</div>
             <h3>Educational Games</h3>
             <p>Add friendly competition with math challenges, vocabulary games, quizzes, and more.</p>
           </div>
           <div class="feature-card">
             <div class="feature-icon">📊</div>
             <h3>Teacher Dashboard</h3>
             <p>Organize classes, save lists, and track activity history in one centralized location.</p>
           </div>
         </div>
       </div>
     </section>

     <!-- Team Section -->
     <section class="team">
       <div class="container">
         <div class="section-header">
           <span class="section-eyebrow">Our Team</span>
           <h2 class="section-title">The people behind the platform</h2>
           <p class="section-subtitle">
             We're a passionate group of educators, developers, and designers dedicated to transforming education.
           </p>
         </div>
         <div class="team-grid">
           <div class="team-card">
             <div class="team-avatar">
               <img src="@/assets/images/Sophea.jpg" alt="Sophea Phal" class="avatar-image" />
             </div>
             <h3 class="team-name">Sophea Phal</h3>
             <p class="team-role">Scrum</p>
             <p class="team-bio">Database Management</p>
           </div>
           <div class="team-card">
             <div class="team-avatar">
               <img src="@/assets/images/oun.jpg" alt="Sophea Sophorn" class="avatar-image" />
             </div>
             <h3 class="team-name">Sophea Sophorn</h3>
             <p class="team-role">Member</p>
             <p class="team-bio">Responsible for Backend Development</p>
           </div>
           <div class="team-card">
             <div class="team-avatar">
               <img src="@/assets/images/Me.jpg" alt="Sreykeo Keun" class="avatar-image" />
             </div>
             <h3 class="team-name">Sreykeo Keun</h3>
             <p class="team-role">Member</p>
             <p class="team-bio">Responsible for Frontend Development and Quality Assurance</p>
           </div>
           <div class="team-card">
             <div class="team-avatar">
               <img src="@/assets/images/San.jpg" alt="San Svit" class="avatar-image" />
             </div>
             <h3 class="team-name">San Svit</h3>
             <p class="team-role">Member</p>
             <p class="team-bio">Responsible for Frontend Development</p>
           </div>
           <div class="team-card">
             <div class="team-avatar">
               <img src="@/assets/images/Mary.jpg" alt="Mary Sao" class="avatar-image" />
             </div>
             <h3 class="team-name">Mary Sao</h3>
             <p class="team-role">Member</p>
             <p class="team-bio">Responsible for Frontend Development</p>
           </div>
           <div class="team-card">
             <div class="team-avatar">
               <img src="@/assets/images/Vanna.jpg" alt="Vanna Len" class="avatar-image" />
             </div>
             <h3 class="team-name">Vanna Len</h3>
             <p class="team-role">Member</p>
             <p class="team-bio">Responsible for Backend Development</p>
           </div>
           <div class="team-card">
             <div class="team-avatar">
               <img src="@/assets/images/Nita.jpg" alt="Chroun Nita" class="avatar-image" />
             </div>
             <h3 class="team-name">Chroun Nita</h3>
             <p class="team-role">Member</p>
             <p class="team-bio">Responsible for Frontend Development and Quality Assurance</p>
           </div>
         </div>
       </div>
     </section>

     <!-- Stats Section -->
     <section class="stats">
       <div class="container">
         <div class="stats-grid">
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
           <div class="stat-item">
             <div class="stat-number">100+</div>
             <div class="stat-label">Countries Reached</div>
           </div>
         </div>
       </div>
     </section>

     <!-- Call-to-Action Section -->
     <section class="cta">
       <div class="container">
         <h2 class="cta-title">Ready to Transform Your Classroom?</h2>
         <p class="cta-subtitle">
           Join thousands of educators who are already using our platform to create engaging learning experiences.
         </p>
         <div class="cta-buttons">
           <RouterLink to="/register" class="btn btn-primary btn-large">Get Started Free</RouterLink>
           <RouterLink to="/" class="btn btn-secondary btn-large">Explore Tools</RouterLink>
         </div>
       </div>
     </section>

    <SiteFooter />
  </div>
</template>

<style scoped>
/* Reset and Base Styles */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.about-page {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  line-height: 1.6;
  color: #1f2937;
  background: #ffffff;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
}

/* Typography */
.section-header {
  text-align: center;
  max-width: 700px;
  margin: 0 auto 56px;
}

.section-eyebrow {
  display: inline-block;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #2563eb;
  background: #eff6ff;
  padding: 6px 14px;
  border-radius: 999px;
  margin-bottom: 16px;
}

.section-title {
  font-size: 36px;
  font-weight: 800;
  color: #0f172a;
  margin-bottom: 16px;
  letter-spacing: -0.02em;
  line-height: 1.2;
}

.section-subtitle {
  color: #64748b;
  font-size: 17px;
  line-height: 1.7;
}

/* Buttons */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 14px 28px;
  border-radius: 10px;
  text-decoration: none;
  font-weight: 600;
  font-size: 15px;
  border: none;
  cursor: pointer;
  transition: all 0.25s ease;
}

.btn-primary {
  background: white;
  color: #2563eb;
  box-shadow: 0 4px 14px rgba(37, 99, 235, 0.25);
}

.btn-primary:hover {
  background: #f8faff;
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(37, 99, 235, 0.35);
}

.btn-secondary {
  background: transparent;
  color: white;
  border: 2px solid rgba(255, 255, 255, 0.9);
}

.btn-secondary:hover {
  background: white;
  color: #2563eb;
  transform: translateY(-2px);
}

.btn-large {
  padding: 16px 32px;
  font-size: 16px;
  border-radius: 12px;
}

/* Hero Section */
.hero {
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  color: white;
  padding: 140px 20px 100px;
  text-align: center;
  position: relative;
  overflow: hidden;
}

.hero::before {
  content: '';
  position: absolute;
  inset: 0;
  background: url('data:image/svg+xml,<svg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"><g fill="none" fill-rule="evenodd"><g fill="%23ffffff" fill-opacity="0.06"><path d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/></g></g></svg>');
  opacity: 0.5;
  pointer-events: none;
}

.hero-content {
  max-width: 800px;
  margin: 0 auto;
  position: relative;
  z-index: 1;
}

.hero-title {
  font-size: 48px;
  font-weight: 800;
  margin-bottom: 20px;
  line-height: 1.15;
  letter-spacing: -0.02em;
}

.hero-subtitle {
  font-size: 18px;
  opacity: 0.92;
  line-height: 1.7;
  max-width: 640px;
  margin: 0 auto 36px;
}

/* Overview Section */
.overview {
  padding: 100px 20px;
  background: #ffffff;
}

.overview-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 56px;
  align-items: center;
}

.overview-text p {
  color: #475569;
  font-size: 16px;
  margin-bottom: 18px;
  line-height: 1.8;
}

.overview-image {
  display: flex;
  justify-content: center;
  align-items: center;
}

.image-placeholder {
  width: 100%;
  max-width: 420px;
  aspect-ratio: 1;
  background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%);
  border-radius: 24px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: white;
  text-align: center;
  padding: 48px;
  box-shadow: 0 24px 48px rgba(37, 99, 235, 0.25);
}

.placeholder-icon {
  font-size: 88px;
  margin-bottom: 20px;
}

.image-placeholder p {
  font-size: 18px;
  font-weight: 600;
  line-height: 1.5;
  opacity: 0.95;
}

/* Mission Section */
.mission {
  padding: 100px 20px;
  background: linear-gradient(to bottom, #f8fafc, #f1f5f9);
}

.mission-content {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
  margin-top: 8px;
}

.mission-card {
  background: white;
  border-radius: 16px;
  padding: 32px 24px;
  text-align: center;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  border: 1px solid #e2e8f0;
  transition: all 0.3s ease;
}

.mission-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 16px 32px rgba(0, 0, 0, 0.1);
  border-color: #cbd5e1;
}

.mission-icon {
  font-size: 44px;
  margin-bottom: 16px;
}

.mission-card h3 {
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 12px;
  color: #0f172a;
}

.mission-card p {
  color: #64748b;
  font-size: 14px;
  line-height: 1.7;
}

/* Features Section */
.features {
  padding: 100px 20px;
  background: #ffffff;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
  margin-top: 8px;
}

.feature-card {
  background: #ffffff;
  border-radius: 16px;
  padding: 32px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  transition: all 0.3s ease;
}

.feature-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 16px 32px rgba(0, 0, 0, 0.1);
  border-color: #cbd5e1;
}

.feature-icon {
  font-size: 40px;
  margin-bottom: 18px;
  display: block;
}

.feature-card h3 {
  font-size: 17px;
  font-weight: 700;
  margin-bottom: 10px;
  color: #0f172a;
}

.feature-card p {
  color: #64748b;
  font-size: 14px;
  line-height: 1.7;
}

/* Team Section */
.team {
  padding: 100px 20px;
  background: #ffffff;
}

.team-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 24px;
  margin-top: 8px;
}

.team-card {
  background: white;
  border-radius: 16px;
  padding: 32px 24px;
  text-align: center;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  border: 1px solid #e2e8f0;
  transition: all 0.3s ease;
}

.team-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 16px 32px rgba(0, 0, 0, 0.1);
  border-color: #cbd5e1;
}

.team-avatar {
  width: 96px;
  height: 96px;
  margin: 0 auto 18px;
  border-radius: 50%;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%);
  padding: 3px;
}

.avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
  display: block;
}

.avatar-icon {
  font-size: 44px;
}

.team-name {
  font-size: 17px;
  font-weight: 700;
  margin-bottom: 6px;
  color: #0f172a;
}

.team-role {
  font-size: 13px;
  font-weight: 600;
  color: #2563eb;
  margin-bottom: 10px;
}

.team-bio {
  color: #64748b;
  font-size: 13px;
  line-height: 1.6;
}

/* Stats Section */
.stats {
  padding: 80px 20px;
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  color: white;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
  text-align: center;
}

.stat-item {
  padding: 24px 16px;
}

.stat-number {
  font-size: 44px;
  font-weight: 800;
  margin-bottom: 8px;
  letter-spacing: -0.02em;
}

.stat-label {
  font-size: 15px;
  opacity: 0.9;
  font-weight: 500;
}

/* Call-to-Action Section */
.cta {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 100px 20px;
  text-align: center;
  position: relative;
  overflow: hidden;
}

.cta::before {
  content: '';
  position: absolute;
  inset: 0;
  background: url('data:image/svg+xml,<svg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"><g fill="none" fill-rule="evenodd"><g fill="%23ffffff" fill-opacity="0.08"><path d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/></g></g></svg>');
  opacity: 0.4;
  pointer-events: none;
}

.cta-title {
  font-size: 38px;
  font-weight: 800;
  margin-bottom: 18px;
  position: relative;
  letter-spacing: -0.02em;
}

.cta-subtitle {
  font-size: 17px;
  margin-bottom: 32px;
  opacity: 0.95;
  position: relative;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
  line-height: 1.7;
}

.cta-buttons {
  display: flex;
  gap: 16px;
  justify-content: center;
  flex-wrap: wrap;
  position: relative;
}

/* Responsive Design */
@media (max-width: 1024px) {
  .mission-content {
    grid-template-columns: repeat(2, 1fr);
  }

  .features-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .hero {
    padding: 120px 20px 80px;
  }

  .hero-title {
    font-size: 34px;
  }

  .hero-subtitle {
    font-size: 16px;
  }

  .section-title {
    font-size: 28px;
  }

  .overview {
    padding: 72px 20px;
  }

  .overview-content {
    grid-template-columns: 1fr;
    gap: 40px;
  }

  .mission {
    padding: 72px 20px;
  }

  .mission-content {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .features {
    padding: 72px 20px;
  }

  .features-grid {
    grid-template-columns: 1fr;
  }

  .team {
    padding: 72px 20px;
  }

  .team-grid {
    grid-template-columns: 1fr;
    max-width: 400px;
    margin-left: auto;
    margin-right: auto;
  }

  .stats {
    padding: 64px 20px;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
  }

  .stat-number {
    font-size: 36px;
  }

  .cta {
    padding: 72px 20px;
  }

  .cta-title {
    font-size: 28px;
  }

  .cta-buttons {
    flex-direction: column;
    align-items: center;
    gap: 12px;
  }

  .btn-large {
    width: 100%;
    max-width: 320px;
  }
}

@media (min-width: 769px) and (max-width: 1024px) {
  .overview-content {
    gap: 40px;
  }

  .team-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
