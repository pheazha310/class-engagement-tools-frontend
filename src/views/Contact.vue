<script setup lang="ts">
import { ref } from 'vue'
import SiteFooter from '@/components/SiteFooter.vue'

const formData = ref({
  name: '',
  email: '',
  message: ''
})

const handleSubmit = () => {
  alert('Thank you for your message! We will get back to you soon.')
  formData.value = {
    name: '',
    email: '',
    message: ''
  }
}
</script>

<template>
  <div class="contact-page">
    <!-- Hero Section -->
    <section class="hero">
      <div class="hero-content">
        <h1 class="hero-title">Contact Us</h1>
        <p class="hero-subtitle">
          Have questions or feedback? We'd love to hear from you. Reach out to our team and we'll get back to you as soon as possible.
        </p>
      </div>
    </section>

    <!-- Contact Information Section -->
    <section class="contact-info">
      <div class="container">
        <div class="contact-info-grid">
          <div class="contact-info-card">
            <div class="contact-icon">📧</div>
            <h3>Email</h3>
            <p>support@classtools.com</p>
            <p>info@classtools.com</p>
          </div>
          <div class="contact-info-card">
            <div class="contact-icon">📱</div>
            <h3>Phone</h3>
            <p>+1 (555) 494-1983</p>
            <p>Mon-Fri, 9am-5pm EST</p>
          </div>
          <div class="contact-info-card">
            <div class="contact-icon">📍</div>
            <h3>Location</h3>
            <p>St 371, Phum Propeang
Chhuk Sangkat Tek Thal,
Khan Sen Sok, Phnom
Penh, Cambodia</p>

          </div>
        </div>
      </div>
    </section>

    <!-- Contact Form and Map Section -->
    <section class="contact-form-map-section">
      <div class="container">
        <div class="form-map-grid">
          <!-- Contact Form -->
          <div class="contact-form-wrapper">
            <div class="form-header">
              <h2 class="section-title">Send Us a Message</h2>
              <p class="section-subtitle">
                Fill out the form below and we'll get back to you within 24 hours.
              </p>
            </div>

            <form @submit.prevent="handleSubmit" class="contact-form">
              <div class="form-group">
                <label for="name">Full Name *</label>
                <input
                  type="text"
                  id="name"
                  v-model="formData.name"
                  placeholder="Enter your full name"
                  required
                />
              </div>

              <div class="form-group">
                <label for="email">Email Address *</label>
                <input
                  type="email"
                  id="email"
                  v-model="formData.email"
                  placeholder="Enter your email address"
                  required
                />
              </div>

              <div class="form-group">
                <label for="message">Message *</label>
                <textarea
                  id="message"
                  v-model="formData.message"
                  placeholder="Tell us how we can help you..."
                  rows="6"
                  required
                ></textarea>
              </div>

              <button type="submit" class="btn btn-submit">Send Message</button>
            </form>
          </div>

          <!-- Map -->
          <div class="map-wrapper">
            <h3 class="map-title">Find Us</h3>
            <p class="map-subtitle">Visit our office or get in touch with us directly.</p>
            <div class="map-container">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2948.1234567890123!2d-71.0589!3d42.3601!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89e3708d8f4b2b8b%3A0x1234567890abcdef!2sBoston%2C%20MA%2002101!5e0!3m2!1sen!2sus!4v1234567890123!5m2!1sen!2sus"
                width="100%"
                height="450"
                style="border: 0; border-radius: 12px;"
                :allowfullscreen="true"
                loading="lazy"
                referrerpolicy="no-referrer-when-downgrade"
                title="ClassTools Location Map">
              </iframe>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Social Media Section -->
    <section class="social-media">
      <div class="container">
        <h2 class="section-title">Connect With Us</h2>
        <p class="section-subtitle">
          Follow us on social media for the latest updates, tips, and educational resources.
        </p>
        <div class="social-links">
          <a href="https://facebook.com/classtools" target="_blank" rel="noopener noreferrer" class="social-link">
            <div class="social-icon">📘</div>
            <span>Facebook</span>
          </a>
          <a href="https://twitter.com/classtools" target="_blank" rel="noopener noreferrer" class="social-link">
            <div class="social-icon">🐦</div>
            <span>Twitter</span>
          </a>
          <a href="https://linkedin.com/company/classtools" target="_blank" rel="noopener noreferrer" class="social-link">
            <div class="social-icon">💼</div>
            <span>LinkedIn</span>
          </a>
          <a href="https://instagram.com/classtools" target="_blank" rel="noopener noreferrer" class="social-link">
            <div class="social-icon">📷</div>
            <span>Instagram</span>
          </a>
          <a href="https://youtube.com/classtools" target="_blank" rel="noopener noreferrer" class="social-link">
            <div class="social-icon">📺</div>
            <span>YouTube</span>
          </a>
        </div>
      </div>
    </section>

    <!-- FAQ Section -->
    <section class="faq">
      <div class="container">
        <h2 class="section-title">Frequently Asked Questions</h2>
        <div class="faq-list">
          <div class="faq-item">
            <h3>How quickly will I receive a response?</h3>
            <p>We typically respond to all inquiries within 24 hours during business days. For urgent matters, please call us directly.</p>
          </div>
          <div class="faq-item">
            <h3>Do you offer technical support?</h3>
            <p>Yes! We provide comprehensive technical support for all our users. Contact us through the form above or email support@classtools.com.</p>
          </div>
          <div class="faq-item">
            <h3>Can I schedule a demo?</h3>
            <p>Absolutely! Send us a message mentioning you're interested in a demo, and our team will schedule a personalized walkthrough for you.</p>
          </div>
          <div class="faq-item">
            <h3>Do you offer training for educators?</h3>
            <p>Yes, we provide free training resources and webinars for educators. Contact us to learn about upcoming training sessions.</p>
          </div>
        </div>
      </div>
    </section>

    <SiteFooter />
  </div>
</template>

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

.contact-page {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  line-height: 1.6;
  color: #1f2937;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

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

.btn-submit {
  background: #2563eb;
  color: white;
  padding: 16px 32px;
  font-size: 16px;
  width: 100%;
  max-width: 300px;
}

.btn-submit:hover {
  background: #1d4ed8;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
}

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

.contact-info {
  padding: 80px 20px;
  background: white;
}

.contact-info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 32px;
  margin-top: 48px;
}

.contact-info-card {
  background: #f9fafb;
  border-radius: 12px;
  padding: 32px;
  text-align: center;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.contact-info-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
}

.contact-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.contact-info-card h3 {
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 12px;
  color: #1f2937;
}

.contact-info-card p {
  color: #6b7280;
  font-size: 14px;
  line-height: 1.6;
  margin-bottom: 4px;
}


.contact-form-map-section {
  padding: 80px 20px;
  background: #f9fafb;
}

.form-map-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 48px;
  align-items: start;
}

.contact-form-wrapper {
  background: white;
  border-radius: 12px;
  padding: 48px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.form-header {
  text-align: center;
  margin-bottom: 40px;
}

.contact-form {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-weight: 600;
  color: #1f2937;
  font-size: 14px;
}

.form-group input,
.form-group textarea {
  padding: 12px 16px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 16px;
  font-family: inherit;
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.form-group textarea {
  resize: vertical;
  min-height: 120px;
}

.map-wrapper {
  background: white;
  border-radius: 12px;
  padding: 48px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.map-title {
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 12px;
  color: #1f2937;
  text-align: center;
}

.map-subtitle {
  text-align: center;
  color: #6b7280;
  font-size: 16px;
  margin-bottom: 24px;
}

.map-container {
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.map-container iframe {
  display: block;
}

.social-media {
  padding: 80px 20px;
  background: white;
}

.social-links {
  display: flex;
  justify-content: center;
  gap: 24px;
  flex-wrap: wrap;
  margin-top: 48px;
}

.social-link {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 24px;
  background: #f9fafb;
  border-radius: 12px;
  text-decoration: none;
  color: #1f2937;
  transition: all 0.3s ease;
  min-width: 140px;
}

.social-link:hover {
  background: #2563eb;
  color: white;
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(37, 99, 235, 0.2);
}

.social-icon {
  font-size: 36px;
}

.social-link span {
  font-weight: 600;
  font-size: 14px;
}

.faq {
  padding: 80px 20px;
  background: #f9fafb;
}

.faq-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;
  margin-top: 48px;
}

.faq-item {
  background: white;
  border-radius: 12px;
  padding: 32px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.faq-item h3 {
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 12px;
  color: #1f2937;
}

.faq-item p {
  color: #6b7280;
  font-size: 14px;
  line-height: 1.6;
}

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

  .contact-info-grid {
    grid-template-columns: 1fr;
  }

  .social-links {
    flex-direction: column;
    align-items: center;
  }

  .social-link {
    width: 100%;
    max-width: 300px;
  }

  .faq-list {
    grid-template-columns: 1fr;
  }

  .form-map-grid {
    grid-template-columns: 1fr;
    gap: 32px;
  }

  .contact-form-wrapper {
    padding: 32px 24px;
  }

  .map-wrapper {
    padding: 32px 24px;
  }

  .btn-submit {
    max-width: 100%;
  }
}

@media (min-width: 769px) and (max-width: 1024px) {
  .contact-info-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .social-links {
    gap: 16px;
  }

  .social-link {
    min-width: 120px;
    padding: 20px;
  }

  .form-map-grid {
    grid-template-columns: 1fr;
    gap: 32px;
  }

  .faq-list {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
