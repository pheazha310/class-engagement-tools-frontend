<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink } from 'vue-router'

const mobileMenuOpen = ref(false)

const tools = [
  {
    title: 'Random Wheel',
    description: 'Choose students fairly with smooth spinning animations and reusable wheels.',
    icon: '🎡',
    color: '#2563eb',
    colorDark: '#1d4ed8',
  },
  {
    title: 'Student Picker',
    description: 'Pick one or several learners at once with visual card and lucky draw modes.',
    icon: '🎯',
    color: '#a855f7',
    colorDark: '#9333ea',
  },
  {
    title: 'Classroom Timer',
    description: 'Run countdowns, stopwatches, and Pomodoro sessions with alerts.',
    icon: '⏱️',
    color: '#16a34a',
    colorDark: '#15803d',
  },
  {
    title: 'Group Generator',
    description: 'Create balanced teams quickly and share the groups with your class.',
    icon: '👥',
    color: '#ea580c',
    colorDark: '#d97706',
  },
  {
    title: 'Live Voting',
    description: 'Collect instant feedback with polls that work on any device.',
    icon: '🗳',
    color: '#e11d48',
    colorDark: '#dc2626',
  },
  {
    title: 'Educational Games',
    description: 'Add friendly competition with math, vocabulary, quiz, and memory challenges.',
    icon: '🎮',
    color: '#ec4899',
    colorDark: '#db2777',
  },
  {
    title: 'Classroom Quiz',
    description: 'Create quizzes with multiple formats and display live rankings.',
    icon: '📝',
    color: '#6366f1',
    colorDark: '#4f46e5',
  },
  {
    title: 'Icebreaker Activities',
    description: 'Warm up your class with energizing prompts and team-building games.',
    icon: '✨',
    color: '#eab308',
    colorDark: '#ca8a04',
  },
  {
    title: 'Soundboard',
    description: 'Bring excitement to lessons with applause, countdown, and success sounds.',
    icon: '🔊',
    color: '#06b6d4',
    colorDark: '#0891b2',
  },
  {
    title: 'Teacher Dashboard',
    description: 'Organize classes, save lists, and revisit activity history in one place.',
    icon: '📊',
    color: '#14b8a6',
    colorDark: '#0d9488',
  },
]

const getGradient = (tool: typeof tools[0]) => {
  return `linear-gradient(135deg, ${tool.color} 0%, ${tool.colorDark} 100%)`
}

const handleRegister = () => {
  console.log('Navigating to register')
}

const toggleMobileMenu = () => {
  mobileMenuOpen.value = !mobileMenuOpen.value
}
</script>

<template>
  <div class="homepage">
    <!-- Navigation Bar -->
    <nav class="navbar">
      <div class="nav-container">
        <div class="nav-logo">
          <img src="@/assets/photo_logo.jpg" alt="Graduation" class="image" />
        </div>

        <ul class="nav-menu">
          <li><RouterLink to="/" class="nav-link">Home</RouterLink></li>
          <li><RouterLink to="/about" class="nav-link">About</RouterLink></li>
          <li><RouterLink to="/" class="nav-link">Tools</RouterLink></li>
          <li><RouterLink to="/contact" class="nav-link">Contact</RouterLink></li>
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

        <div class="tools-grid">
          <div class="tool-card">
            <div class="tool-icon" style="background: #2563eb;">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 6v6l4 2"/>
              </svg>
            </div>
            <h3 class="tool-title">Random Wheel</h3>
            <p class="tool-description">Choose students fairly with smooth spinning animations and reusable wheels.</p>
            <RouterLink to="/tools/random-wheel" class="tool-link">Try it now →</RouterLink>
          </div>

          <div class="tool-card">
            <div class="tool-icon" style="background: #9333ea;">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
            </div>
            <h3 class="tool-title">Student Picker</h3>
            <p class="tool-description">Pick one or several learners at once with visual card and lucky draw modes.</p>
            <RouterLink to="/tools/student-picker" class="tool-link">Try it now →</RouterLink>
          </div>

          <div class="tool-card">
            <div class="tool-icon" style="background: #16a34a;">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
            </div>
            <h3 class="tool-title">Classroom Timer</h3>
            <p class="tool-description">Run countdowns, stopwatches, and Pomodoro sessions with alerts.</p>
            <RouterLink to="/tools/timer" class="tool-link">Try it now →</RouterLink>
          </div>

          <div class="tool-card">
            <div class="tool-icon" style="background: #ea580c;">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </div>
            <h3 class="tool-title">Group Generator</h3>
            <p class="tool-description">Create balanced teams quickly and share the groups with your class.</p>
            <RouterLink to="/tools/group-generator" class="tool-link">Try it now →</RouterLink>
          </div>

          <div class="tool-card">
            <div class="tool-icon" style="background: #e11d48;">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 20h9"/>
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
              </svg>
            </div>
            <h3 class="tool-title">Live Voting</h3>
            <p class="tool-description">Collect instant feedback with polls that work on any device.</p>
            <RouterLink to="/tools/live-voting" class="tool-link">Try it now →</RouterLink>
          </div>

          <div class="tool-card">
            <div class="tool-icon" style="background: #ec4899;">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="2" y="6" width="20" height="12" rx="2"/>
                <path d="M6 12h4"/>
                <path d="M14 12h4"/>
                <path d="M6 16h12"/>
              </svg>
            </div>
            <h3 class="tool-title">Educational Games</h3>
            <p class="tool-description">Add friendly competition with math, vocabulary, quiz, and memory challenges.</p>
            <RouterLink to="/tools/games" class="tool-link">Try it now →</RouterLink>
          </div>

          <div class="tool-card">
            <div class="tool-icon" style="background: #6366f1;">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
                <polyline points="10 9 9 9 8 9"/>
              </svg>
            </div>
            <h3 class="tool-title">Classroom Quiz</h3>
            <p class="tool-description">Create quizzes with multiple formats and display live rankings.</p>
            <RouterLink to="/tools/quiz" class="tool-link">Try it now →</RouterLink>
          </div>

          <div class="tool-card">
            <div class="tool-icon" style="background: #eab308;">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
            </div>
            <h3 class="tool-title">Icebreaker Activities</h3>
            <p class="tool-description">Warm up your class with energizing prompts and team-building games.</p>
            <RouterLink to="/tools/icebreakers" class="tool-link">Try it now →</RouterLink>
          </div>

          <div class="tool-card">
            <div class="tool-icon" style="background: #06b6d4;">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
              </svg>
            </div>
            <h3 class="tool-title">Soundboard</h3>
            <p class="tool-description">Bring excitement to lessons with applause, countdown, and success sounds.</p>
            <RouterLink to="/tools/soundboard" class="tool-link">Try it now →</RouterLink>
          </div>

          <div class="tool-card">
            <div class="tool-icon" style="background: #14b8a6;">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="7" height="7"/>
                <rect x="14" y="3" width="7" height="7"/>
                <rect x="14" y="14" width="7" height="7"/>
                <rect x="3" y="14" width="7" height="7"/>
              </svg>
            </div>
            <h3 class="tool-title">Teacher Dashboard</h3>
            <p class="tool-description">Organize classes, save lists, and revisit activity history in one place.</p>
            <RouterLink to="/tools/dashboard" class="tool-link">Try it now →</RouterLink>
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
            <p>
              Our mission is to empower educators with the resources they need to create
              engaging, inclusive, and effective learning environments. We believe that every
              student deserves access to high-quality educational tools that make learning fun
              and meaningful.
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
            <div class="stat-item">
              <div class="stat-number">98%</div>
              <div class="stat-label">Satisfaction Rate</div>
            </div>
            <div class="stat-item">
              <div class="stat-number">24/7</div>
              <div class="stat-label">Support Available</div>
            </div>
            <div class="stat-item">
              <div class="stat-number">100%</div>
              <div class="stat-label">Free to Use</div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Features Section -->
    <section class="features">
      <div class="container">
        <h2 class="section-title">Why Choose ClassTools?</h2>
        <p class="section-subtitle">
          We provide everything you need to create engaging and interactive classroom experiences.
        </p>
        <div class="features-grid">
          <div class="feature-card">
            <div class="feature-icon">🎯</div>
            <h3>Easy to Use</h3>
            <p>Intuitive interface designed for educators. No technical skills required - start using tools in seconds.</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">📱</div>
            <h3>Works Everywhere</h3>
            <p>Access tools on any device - desktop, tablet, or mobile. Perfect for modern classrooms.</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">🔒</div>
            <h3>Safe & Secure</h3>
            <p>Your data is protected with enterprise-grade security. We prioritize student privacy.</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">💡</div>
            <h3>Constantly Updated</h3>
            <p>Regular new features and improvements based on educator feedback. Always evolving.</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">🌍</div>
            <h3>Global Community</h3>
            <p>Join thousands of educators worldwide sharing best practices and success stories.</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">🎓</div>
            <h3>Education-Focused</h3>
            <p>Built by educators who understand classroom needs. Every feature serves a purpose.</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Testimonials Section -->
    <section class="testimonials">
      <div class="container">
        <h2 class="section-title">What Educators Say</h2>
        <p class="section-subtitle">
          Join thousands of teachers who are transforming their classrooms with ClassTools.
        </p>
        <div class="testimonials-grid">
          <div class="testimonial-card">
            <div class="testimonial-content">
              <p>"ClassTools has completely transformed how I engage my students. The Random Wheel and Student Picker are game-changers!"</p>
            </div>
            <div class="testimonial-author">
              <div class="testimonial-avatar">👩‍🏫</div>
              <div class="testimonial-info">
                <h4>Sarah Johnson</h4>
                <p>Elementary School Teacher</p>
              </div>
            </div>
          </div>
          <div class="testimonial-card">
            <div class="testimonial-content">
              <p>"The Group Generator saves me so much time. I can create balanced groups in seconds and focus on teaching."</p>
            </div>
            <div class="testimonial-author">
              <div class="testimonial-avatar">👨‍🏫</div>
              <div class="testimonial-info">
                <h4>Michael Chen</h4>
                <p>High School Teacher</p>
              </div>
            </div>
          </div>
          <div class="testimonial-card">
            <div class="testimonial-content">
              <p>"My students love the educational games! They're learning while having fun. Best tool I've ever used."</p>
            </div>
            <div class="testimonial-author">
              <div class="testimonial-avatar">👩‍🏫</div>
              <div class="testimonial-info">
                <h4>Emily Rodriguez</h4>
                <p>Middle School Teacher</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Team Section -->
    <section class="team-section">
      <div class="container">
        <h2 class="section-title">Meet Our Team</h2>
        <p class="section-subtitle">
          We're a passionate group of educators, developers, and designers dedicated to transforming education.
        </p>
        <div class="team-grid">
          <div class="team-card">
            <div class="team-avatar">
              <img src="@/assets/images/Sophea.jpg" alt="Sophea Phal" class="avatar-image" />
            </div>
            <h3 class="team-name">Sophea Phal</h3>
            <p class="team-role">Scrum Master</p>
            <p class="team-bio">Database Management</p>
          </div>
          <div class="team-card">
            <div class="team-avatar">
              <img src="@/assets/images/oun.jpg" alt="Sophea Sophorn" class="avatar-image" />
            </div>
            <h3 class="team-name">Sophea Sophorn</h3>
            <p class="team-role">Backend Developer</p>
            <p class="team-bio">Responsible for Backend Development</p>
          </div>
          <div class="team-card">
            <div class="team-avatar">
              <img src="@/assets/images/Me.jpg" alt="Sreykeo Keun" class="avatar-image" />
            </div>
            <h3 class="team-name">Sreykeo Keun</h3>
            <p class="team-role">Frontend Developer & QA</p>
            <p class="team-bio">Responsible for Frontend Development and Quality Assurance</p>
          </div>
          <div class="team-card">
            <div class="team-avatar">
              <img src="@/assets/images/San.jpg" alt="San Svit" class="avatar-image" />
            </div>
            <h3 class="team-name">San Svit</h3>
            <p class="team-role">Frontend Developer</p>
            <p class="team-bio">Responsible for Frontend Development</p>
          </div>
          <div class="team-card">
            <div class="team-avatar">
              <img src="@/assets/images/Mary.jpg" alt="Mary Sao" class="avatar-image" />
            </div>
            <h3 class="team-name">Mary Sao</h3>
            <p class="team-role">Frontend Developer</p>
            <p class="team-bio">Responsible for Frontend Development</p>
          </div>
          <div class="team-card">
            <div class="team-avatar">
              <img src="@/assets/images/Vanna.jpg" alt="Vanna Len" class="avatar-image" />
            </div>
            <h3 class="team-name">Vanna Len</h3>
            <p class="team-role">Backend Developer</p>
            <p class="team-bio">Responsible for Backend Development</p>
          </div>
          <div class="team-card">
            <div class="team-avatar">
              <img src="@/assets/images/Nita.jpg" alt="Chroun Nita" class="avatar-image" />
            </div>
            <h3 class="team-name">Chroun Nita</h3>
            <p class="team-role">Frontend Developer & QA</p>
            <p class="team-bio">Responsible for Frontend Development and Quality Assurance</p>
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
              <li><RouterLink to="/about">About</RouterLink></li>
              <li><RouterLink to="/contact">Contact</RouterLink></li>
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
.homepage {
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
  background:white;
   color: #2563eb;
}

.btn-primary:hover {
  background: #1d4ed8;
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

.nav-buttons {
  display: flex;
  gap: 12px;
}

/* Hero Section */
.hero {
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  color: white;
  padding: 120px 20px;
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

.hero-buttons {
  display: flex;
  gap: 16px;
  justify-content: center;
  flex-wrap: wrap;
}

/* About Me Section */
.about-me {
  padding: 80px 20px;
  background: white;
}

.about-me-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 48px;
  align-items: center;
  margin-top: 48px;
}

.about-me-image {
  display: flex;
  justify-content: center;
  align-items: center;
}

.about-me-text h3 {
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 8px;
  color: #1f2937;
}

.about-me-role {
  font-size: 16px;
  font-weight: 600;
  color: #2563eb;
  margin-bottom: 16px;
}

.about-me-text p {
  color: #4b5563;
  font-size: 16px;
  margin-bottom: 16px;
  line-height: 1.8;
}

.image-placeholder {
  width: 100%;
  max-width: 300px;
  aspect-ratio: 1;
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  border-radius: 20px;
  display: flex;
  justify-content: center;
  align-items: center;
  color: white;
}

.placeholder-icon {
  font-size: 80px;
}

/* Featured Tools Section */
.featured-tools {
  padding: 80px 20px;
  background: #f9fafb;
}

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

.tools-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 24px;
}

.tool-card {
  background: white;
  border-radius: 12px;
  padding: 32px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.tool-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
}

.tool-icon {
  width: 64px;
  height: 64px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
  color: white;
}

.tool-icon svg {
  width: 32px;
  height: 32px;
}

.tool-title {
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 12px;
  color: #1f2937;
}

.tool-description {
  color: #6b7280;
  font-size: 14px;
  line-height: 1.6;
}

.tool-link {
  display: inline-block;
  margin-top: 12px;
  color: #2563eb;
  text-decoration: none;
  font-weight: 600;
  font-size: 14px;
  transition: color 0.3s ease;
}

.tool-link:hover {
  color: #1d4ed8;
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
  color: #4b5563;
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
  padding: 24px;
  background: #f9fafb;
  border-radius: 12px;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.stat-item:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
}

.stat-number {
  font-size: 32px;
  font-weight: 700;
  color: #2563eb;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 14px;
  color: #6b7280;
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
  border-radius: 12px;
  padding: 32px;
  text-align: center;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.feature-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
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
  border-radius: 12px;
  padding: 32px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.testimonial-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
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
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
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
  width: 120px;
  height: 120px;
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

/* Call-to-Action Section */
.cta {
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
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

  .tools-grid {
    grid-template-columns: 1fr;
  }

  .about-content {
    grid-template-columns: 1fr;
  }

  .about-me-content {
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

  .footer-content {
    grid-template-columns: 1fr;
    gap: 32px;
  }

  .cta-title {
    font-size: 28px;
  }
}

@media (min-width: 769px) and (max-width: 1024px) {
  .tools-grid {
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

  .footer-content {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
