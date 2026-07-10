<script setup lang="ts">
import { RouterLink } from 'vue-router'
</script>

<template>
  <div class="about-page">
    <!-- Navigation Bar -->
    <nav class="navbar">
      <div class="nav-container">
        <div class="nav-logo">
          <img src="@/assets/photo_logo.jpg" alt="Graduation" class="image" />
        </div>

        <ul class="nav-menu">
          <li><RouterLink to="/" class="nav-link">Home</RouterLink></li>
          <li><RouterLink to="/about" class="nav-link active">About</RouterLink></li>
          <li><RouterLink to="/" class="nav-link">Tools</RouterLink></li>
          <li><RouterLink to="/" class="nav-link">Contact</RouterLink></li>
        </ul>

        <div class="nav-buttons">
          <RouterLink to="/login" class="btn btn-login">Login</RouterLink>
          <RouterLink to="/register" class="btn btn-register">Register</RouterLink>
        </div>
      </div>
    </nav>

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
        <h2 class="section-title">Our Platform</h2>
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
        <h2 class="section-title">Our Mission</h2>
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
        <h2 class="section-title">Key Features</h2>
        <p class="section-subtitle">
          Discover what makes our platform the perfect companion for modern educators.
        </p>
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
        <h2 class="section-title">Meet Our Team</h2>
        <p class="section-subtitle">
          We're a passionate group of educators, developers, and designers dedicated to transforming education.
        </p>
        <div class="team-grid">
          <div class="team-card">
            <div class="team-avatar">
              <img src="@/assets/images/Sophea.jpg" alt="John Smith" class="avatar-image" />
            </div>
            <h3 class="team-name">Sophea Phal</h3>
            <p class="team-role">Scrum</p>
            <p class="team-bio">  Database Management .</p>
          </div>
          <div class="team-card">
            <div class="team-avatar">
              <img src="@/assets/images/oun.jpg" alt="Sarah Johnson" class="avatar-image" />
            </div>
            <h3 class="team-name">Sophea Sophorn</h3>
            <p class="team-role">Member</p>
            <p class="team-bio">Responsible for Backend Development .</p>
          </div>
          <div class="team-card">
            <div class="team-avatar">
              <img src="@/assets/images/Me.jpg" alt="Michael Chen" class="avatar-image" />
            </div>
            <h3 class="team-name">Sreykeo Keun</h3>
            <p class="team-role">Member</p>
            <p class="team-bio">Responsible for Frontend Development and Quality Assurance .</p>
          </div>
          <div class="team-card">
            <div class="team-avatar">
              <img src="@/assets/images/San.jpg" alt="Emily Davis" class="avatar-image" />
            </div>
            <h3 class="team-name">San Svit</h3>
            <p class="team-role">Member</p>
            <p class="team-bio">Responsible for Frontend Development.</p>
          </div>
          <div class="team-card">
            <div class="team-avatar">
              <img src="@/assets/images/Mary.jpg" alt="David Wilson" class="avatar-image" />
            </div>
            <h3 class="team-name"> Mary Sao</h3>
            <p class="team-role">Member</p>
            <p class="team-bio">Responsible for Frontend Development.</p>
          </div>
          <div class="team-card">
            <div class="team-avatar">
              <img src="@/assets/images/Vanna.jpg" alt="Lisa Anderson" class="avatar-image" />
            </div>
            <h3 class="team-name">Vanna Len</h3>
            <p class="team-role">Member</p>
            <p class="team-bio">Responsible for Backend Development.</p>
          </div>
          <div class="team-card">
            <div class="team-avatar">
              <img src="@/assets/images/Nita.jpg" alt="Robert Taylor" class="avatar-image" />
            </div>
            <h3 class="team-name">Chroun Nita</h3>
            <p class="team-role">Member</p>
            <p class="team-bio">Responsible for Frontend Development and Quality Assurance .</p>
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

    <!-- Footer -->
    <footer class="footer">
      <div class="container">
        <div class="footer-content">
          <div class="footer-section">
            <div class="footer-logo">
              <span class="logo-icon">🎓</span>
              <span class="logo-text">ClassTools</span>
            </div>
            <p class="footer-description">Empowering educators with innovative classroom engagement tools.</p>
          </div>
          <div class="footer-section">
            <h4 class="footer-title">Product</h4>
            <ul class="footer-links">
              <li><RouterLink to="/">Features</RouterLink></li>
              <li><RouterLink to="/">Tools</RouterLink></li>
              <li><RouterLink to="/">Pricing</RouterLink></li>
            </ul>
          </div>
          <div class="footer-section">
            <h4 class="footer-title">Company</h4>
            <ul class="footer-links">
              <li><RouterLink to="/about" class="active-link">About</RouterLink></li>
              <li><RouterLink to="/">Contact</RouterLink></li>
              <li><RouterLink to="/">Careers</RouterLink></li>
            </ul>
          </div>

          <div class="footer-section">
            <h4 class="footer-title">Support</h4>
            <ul class="footer-links">
              <li><RouterLink to="/">Help Center</RouterLink></li>
              <li><RouterLink to="/">Documentation</RouterLink></li>
              <li><RouterLink to="/">Privacy Policy</RouterLink></li>
            </ul>
          </div>
        </div>

        <div class="footer-bottom">
          <p>&copy; 2024 ClassTools. All rights reserved.</p>
        </div>
      </div>
    </footer>
  </div>
</template>

<style scoped>
/* Reset and Base Styles */
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

.about-page {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  line-height: 1.6;
  color: #1f2937;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

/* Buttons */
.btn {
  display: inline-block;
  padding: 12px 24px;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 600;
  font-size: 16px;
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-primary {
  background: white;
  color: #2563eb;
}

.btn-primary:hover {
  background: #f0f0f0;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
}

.btn-secondary {
  background: transparent;
  color: white;
  border: 2px solid white;
}

.btn-secondary:hover {
  background: white;
  color: #2563eb;
}

.btn-large {
  padding: 16px 32px;
  font-size: 18px;
}

.btn-login {
  background: transparent;
  color: #2563eb;
  border: 1px solid #2563eb;
}

.btn-login:hover {
  background: #2563eb;
  color: white;
}

.btn-register {
  background: #2563eb;
  color: white;
}

.btn-register:hover {
  background: #1d4ed8;
}

/* Navigation Bar */
.navbar {
  background: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 1000;
}

.nav-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 16px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.nav-logo {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 20px;
  font-weight: 700;
  color: #1f2937;
}

.logo-icon {
  font-size: 24px;
}

.nav-menu {
  display: flex;
  list-style: none;
  gap: 32px;
}

.nav-link {
  color: #6b7280;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.3s ease;
}

.nav-link:hover {
  color: #2563eb;
}

.nav-link.active {
  color: #2563eb;
}

.nav-buttons {
  display: flex;
  gap: 12px;
}

/* Hero Section */
.hero {
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  color: white;
  padding: 100px 20px;
  text-align: center;
}

.hero-content {
  max-width: 800px;
  margin: 0 auto;
}

.hero-title {
  font-size: 48px;
  font-weight: 800;
  margin-bottom: 24px;
  line-height: 1.2;
}

.hero-subtitle {
  font-size: 18px;
  margin-bottom: 40px;
  opacity: 0.9;
  line-height: 1.6;
}

/* Section Titles */
.section-title {
  font-size: 36px;
  font-weight: 700;
  text-align: center;
  margin-bottom: 16px;
  color: #1f2937;
}

.section-subtitle {
  text-align: center;
  color: #6b7280;
  font-size: 18px;
  max-width: 700px;
  margin: 0 auto 48px;
}

/* Overview Section */
.overview {
  padding: 80px 20px;
  background: white;
}

.overview-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 48px;
  align-items: center;
  margin-top: 48px;
}

.overview-text p {
  color: #4b5563;
  font-size: 16px;
  margin-bottom: 16px;
  line-height: 1.8;
}

.overview-image {
  display: flex;
  justify-content: center;
  align-items: center;
}

.image-placeholder {
  width: 100%;
  max-width: 400px;
  aspect-ratio: 1;
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  border-radius: 20px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: white;
  text-align: center;
  padding: 40px;
}

.placeholder-icon {
  font-size: 80px;
  margin-bottom: 20px;
}

.image-placeholder p {
  font-size: 18px;
  font-weight: 600;
  line-height: 1.4;
}

/* Mission Section */
.mission {
  padding: 80px 20px;
  background: #f9fafb;
}

.mission-content {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 24px;
  margin-top: 48px;
}

.mission-card {
  background: white;
  border-radius: 12px;
  padding: 32px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.mission-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
}

.mission-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.mission-card h3 {
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 12px;
  color: #1f2937;
}

.mission-card p {
  color: #6b7280;
  font-size: 14px;
  line-height: 1.6;
}

/* Features Section */
.features {
  padding: 80px 20px;
  background: white;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;
  margin-top: 48px;
}

.feature-card {
  background: #f9fafb;
  border-radius: 12px;
  padding: 32px;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.feature-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
}

.feature-icon {
  font-size: 40px;
  margin-bottom: 16px;
}

.feature-card h3 {
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 12px;
  color: #1f2937;
}

.feature-card p {
  color: #6b7280;
  font-size: 14px;
  line-height: 1.6;
}

/* Team Section */
.team {
  padding: 80px 20px;
  background: #f9fafb;
}

.team-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
  margin-top: 48px;
}

.team-card {
  flex: 0 0 calc(25% - 18px);
}

.team-card:nth-child(-n+3) {
  flex: 0 0 calc(33.333% - 16px);
}

.team-card {
  background: white;
  border-radius: 12px;
  padding: 32px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.team-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
}

.team-avatar {
  width: 100px;
  height: 100px;
  margin: 0 auto 20px;
  border-radius: 50%;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
}

.avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-icon {
  font-size: 48px;
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
  color: #2563eb;
  margin-bottom: 12px;
}

.team-bio {
  color: #6b7280;
  font-size: 14px;
  line-height: 1.6;
}

/* Stats Section */
.stats {
  padding: 60px 20px;
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  color: white;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 32px;
  text-align: center;
}

.stat-item {
  padding: 20px;
}

.stat-number {
  font-size: 48px;
  font-weight: 800;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 16px;
  opacity: 0.9;
}

/* Call-to-Action Section */
.cta {
  background: linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%);
  color: white;
  padding: 80px 20px;
  text-align: center;
}

.cta-title {
  font-size: 36px;
  font-weight: 700;
  margin-bottom: 16px;
}

.cta-subtitle {
  font-size: 18px;
  margin-bottom: 32px;
  opacity: 0.9;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
}

.cta-buttons {
  display: flex;
  gap: 16px;
  justify-content: center;
  flex-wrap: wrap;
}

/* Footer */
.footer {
  background: #1f2937;
  color: white;
  padding: 60px 20px 20px;
}

.footer-content {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr;
  gap: 48px;
  margin-bottom: 40px;
}

.footer-logo {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 16px;
}

.footer-description {
  color: #9ca3af;
  font-size: 14px;
  line-height: 1.6;
}

.footer-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 16px;
}

.footer-links {
  list-style: none;
}

.footer-links li {
  margin-bottom: 8px;
}

.footer-links a {
  color: #9ca3af;
  text-decoration: none;
  font-size: 14px;
  transition: color 0.3s ease;
}

.footer-links a:hover {
  color: white;
}

.footer-links a.active-link {
  color: white;
}

.footer-bottom {
  border-top: 1px solid #374151;
  padding-top: 20px;
  text-align: center;
  color: #9ca3af;
  font-size: 14px;
}

/* Responsive Design */
@media (max-width: 768px) {
  .nav-menu {
    display: none;
  }

  .hero-title {
    font-size: 32px;
  }

  .hero-subtitle {
    font-size: 16px;
  }

  .section-title {
    font-size: 28px;
  }

  .overview-content {
    grid-template-columns: 1fr;
  }

  .mission-content {
    grid-template-columns: 1fr;
  }

  .features-grid {
    grid-template-columns: 1fr;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .stat-number {
    font-size: 36px;
  }

  .footer-content {
    grid-template-columns: 1fr;
    gap: 32px;
  }

  .cta-title {
    font-size: 28px;
  }

  .cta-buttons {
    flex-direction: column;
    align-items: center;
  }

  .btn-large {
    width: 100%;
    max-width: 300px;
  }
}

@media (min-width: 769px) and (max-width: 1024px) {
  .overview-content {
    grid-template-columns: 1fr;
  }

  .mission-content {
    grid-template-columns: repeat(2, 1fr);
  }

  .features-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .team-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .footer-content {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
