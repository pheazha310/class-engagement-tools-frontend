<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import SiteFooter from '@/components/SiteFooter.vue'
import ToolIcon from '@/components/ToolIcon.vue'

const formData = ref({
  name: '',
  email: '',
  subject: '',
  message: ''
})

const formErrors = ref<Record<string, string>>({})
const isSubmitting = ref(false)
const submitted = ref(false)

const contactIcon = (title: string) => ({ Email: 'mail', Phone: 'phone', Office: 'pin' }[title] || 'mail')
const socialIcon = (name: string) => ({ Facebook: 'facebook', Twitter: 'twitter', LinkedIn: 'linkedin', Instagram: 'instagram', YouTube: 'youtube' }[name] || 'globe')

const observer = ref<IntersectionObserver | null>(null)

onMounted(() => {
  observer.value = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view')
        }
      })
    },
    { threshold: 0.1, rootMargin: '0px 0px -40px 0px' },
  )

  document.querySelectorAll('.reveal').forEach((el) => observer.value?.observe(el))
})

onBeforeUnmount(() => {
  observer.value?.disconnect()
})

const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

const handleSubmit = () => {
  formErrors.value = {}
  if (!formData.value.name.trim()) formErrors.value.name = 'Full name is required'
  if (!formData.value.email.trim()) formErrors.value.email = 'Email is required'
  else if (!validateEmail(formData.value.email)) formErrors.value.email = 'Please enter a valid email'
  if (!formData.value.message.trim()) formErrors.value.message = 'Message is required'

  if (Object.keys(formErrors.value).length > 0) return

  isSubmitting.value = true
  setTimeout(() => {
    isSubmitting.value = false
    submitted.value = true
    formData.value = { name: '', email: '', subject: '', message: '' }
  }, 1200)
}
</script>

<template>
  <div class="contact-page">
    <!-- Hero -->
    <section class="hero">
      <div class="hero-orb hero-orb--1" />
      <div class="hero-orb hero-orb--2" />
      <div class="hero-content">
        <span class="hero-eyebrow reveal">CONTACT US</span>
        <h1 class="hero-title reveal">We're here to help</h1>
        <p class="hero-subtitle reveal">
          Have questions or feedback? Reach out to our team and we'll get back to you as soon as possible.
        </p>
        <div class="hero-actions reveal">
          <RouterLink to="/" class="btn btn-primary btn-large">Explore Tools</RouterLink>
        </div>
      </div>
    </section>

    <!-- Contact Cards -->
    <section class="contact-section">
      <div class="container">
        <div class="section-header reveal">
          <span class="section-eyebrow">Contact Info</span>
          <h2 class="section-title">Get in touch</h2>
          <p class="section-subtitle">
            Choose the channel that works best for you. We’d love to hear from you.
          </p>
        </div>
        <div class="contact-grid">
          <a href="mailto:support@classtools.com" class="contact-card reveal" v-for="c in [
            { icon: '📧', title: 'Email', detail: ['support@classtools.com', 'info@classtools.com'] },
            { icon: '📱', title: 'Phone', detail: ['+1 (555) 494-1983', 'Mon-Fri, 9am-5pm EST'] },
            { icon: '📍', title: 'Office', detail: ['St 371, Phum Propeang', 'Khan Sen Sok, Phnom Penh, Cambodia'] },
          ]" :key="c.title">
            <div class="contact-card-icon"><ToolIcon :name="contactIcon(c.title)" :size="34" /></div>
            <h3>{{ c.title }}</h3>
            <p v-for="(d, i) in c.detail" :key="i">{{ d }}</p>
          </a>
        </div>
      </div>
    </section>

    <!-- Form + Map -->
    <section class="form-map-section">
      <div class="container">
        <div class="section-header reveal">
          <span class="section-eyebrow">Send a Message</span>
          <h2 class="section-title">Let's talk</h2>
          <p class="section-subtitle">
            Fill out the form below and we'll get back to you within 24 hours.
          </p>
        </div>
        <div class="form-map-grid">
          <div class="form-wrapper reveal">
            <div v-if="submitted" class="form-success">
              <div class="success-icon">✓</div>
              <h3>Message Sent!</h3>
              <p>Thank you for reaching out. We'll get back to you shortly.</p>
            </div>
            <form v-else @submit.prevent="handleSubmit" class="contact-form" novalidate>
              <div class="form-field">
                <label for="name">Full Name</label>
                <input
                  type="text"
                  id="name"
                  v-model="formData.name"
                  placeholder="Enter your full name"
                  autocomplete="name"
                  :class="{ 'input-error': formErrors.name }"
                />
                <span v-if="formErrors.name" class="field-error">{{ formErrors.name }}</span>
              </div>
              <div class="form-field">
                <label for="email">Email Address</label>
                <input
                  type="email"
                  id="email"
                  v-model="formData.email"
                  placeholder="Enter your email address"
                  autocomplete="email"
                  :class="{ 'input-error': formErrors.email }"
                />
                <span v-if="formErrors.email" class="field-error">{{ formErrors.email }}</span>
              </div>
              <div class="form-field">
                <label for="subject">Subject</label>
                <input
                  type="text"
                  id="subject"
                  v-model="formData.subject"
                  placeholder="What is this about?"
                  autocomplete="off"
                />
              </div>
              <div class="form-field">
                <label for="message">Message</label>
                <textarea
                  id="message"
                  v-model="formData.message"
                  placeholder="Tell us how we can help you..."
                  rows="5"
                  :class="{ 'input-error': formErrors.message }"
                ></textarea>
                <span v-if="formErrors.message" class="field-error">{{ formErrors.message }}</span>
              </div>
              <button type="submit" class="btn btn-submit" :disabled="isSubmitting">
                <span v-if="!isSubmitting">Send Message</span>
                <span v-else class="spinner"></span>
              </button>
            </form>
          </div>
          <div class="map-wrapper reveal">
            <div class="map-container">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2948.1234567890123!2d-71.0589!3d42.3601!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89e3708d8f4b2b8b%3A0x1234567890abcdef!2sBoston%2C%20MA%2002101!5e0!3m2!1sen!2sus!4v1234567890123!5m2!1sen!2sus"
                width="100%"
                height="420"
                style="border: 0; border-radius: 20px;"
                :allowfullscreen="true"
                loading="lazy"
                referrerpolicy="no-referrer-when-downgrade"
                title="ClassTools Location"
              ></iframe>
            </div>
            <div class="map-info">
              <div class="map-info-item" v-for="info in [
                { label: 'Email', value: 'support@classtools.com' },
                { label: 'Phone', value: '+1 (555) 494-1983' },
                { label: 'Location', value: 'Phnom Penh, Cambodia' },
              ]" :key="info.label">
                <span class="map-info-label">{{ info.label }}</span>
                <span class="map-info-value">{{ info.value }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Social -->
    <section class="social-section">
      <div class="container">
        <div class="section-header reveal">
          <span class="section-eyebrow">Connect</span>
          <h2 class="section-title">Follow us on social media</h2>
          <p class="section-subtitle">
            Follow us for the latest updates, tips, and educational resources.
          </p>
        </div>
        <div class="social-grid">
          <a v-for="s in [
            { icon: '📘', name: 'Facebook', href: 'https://facebook.com/classtools' },
            { icon: '🐦', name: 'Twitter', href: 'https://twitter.com/classtools' },
            { icon: '💼', name: 'LinkedIn', href: 'https://linkedin.com/company/classtools' },
            { icon: '📷', name: 'Instagram', href: 'https://instagram.com/classtools' },
            { icon: '📺', name: 'YouTube', href: 'https://youtube.com/classtools' },
          ]" :key="s.name" :href="s.href" target="_blank" rel="noopener noreferrer" class="social-card reveal">
            <div class="social-card-icon"><ToolIcon :name="socialIcon(s.name)" :size="30" /></div>
            <span class="social-card-name">{{ s.name }}</span>
          </a>
        </div>
      </div>
    </section>

    <!-- FAQ -->
    <section class="faq-section">
      <div class="container">
        <div class="section-header reveal">
          <span class="section-eyebrow">FAQ</span>
          <h2 class="section-title">Frequently Asked Questions</h2>
        </div>
        <div class="faq-list reveal">
          <div class="faq-item" v-for="(faq, idx) in [
            { q: 'How quickly will I receive a response?', a: 'We typically respond to all inquiries within 24 hours during business days. For urgent matters, please call us directly.' },
            { q: 'Do you offer technical support?', a: 'Yes! We provide comprehensive technical support for all our users. Contact us through the form above or email support@classtools.com.' },
            { q: 'Can I schedule a demo?', a: 'Absolutely! Send us a message mentioning you\'re interested in a demo, and our team will schedule a personalized walkthrough for you.' },
            { q: 'Do you offer training for educators?', a: 'Yes, we provide free training resources and webinars for educators. Contact us to learn about upcoming training sessions.' },
          ]" :key="idx">
            <details class="faq-details">
              <summary class="faq-summary">
                <span>{{ faq.q }}</span>
                <svg class="faq-chevron" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
              </summary>
              <div class="faq-body">{{ faq.a }}</div>
            </details>
          </div>
        </div>
      </div>
    </section>

    <SiteFooter />
  </div>
</template>

<style scoped>
.reveal {
  opacity: 0;
  transform: translateY(28px);
  transition: opacity 0.75s cubic-bezier(0.16, 1, 0.3, 1), transform 0.75s cubic-bezier(0.16, 1, 0.3, 1);
}

.reveal.in-view {
  opacity: 1;
  transform: translateY(0);
}

.contact-page {
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  color: #0f172a;
  background: #ffffff;
  overflow-x: hidden;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
}

/* Hero */
.hero {
  background: linear-gradient(135deg, #001f9e 0%, #2547bc 50%, #3b5bf6 100%);
  color: white;
  padding: 120px 20px 140px;
  text-align: center;
  position: relative;
  overflow: hidden;
}

.hero::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 20% 80%, rgba(255,255,255,0.08) 0%, transparent 50%),
    radial-gradient(circle at 80% 20%, rgba(255,255,255,0.06) 0%, transparent 50%);
  pointer-events: none;
}

.hero-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(70px);
  pointer-events: none;
  opacity: 0.22;
}

.hero-orb--1 {
  width: 340px;
  height: 340px;
  background: #ffffff;
  top: -100px;
  left: -60px;
  animation: orbFloat 10s ease-in-out infinite alternate;
}

.hero-orb--2 {
  width: 280px;
  height: 280px;
  background: #a5b4fc;
  bottom: -80px;
  right: -40px;
  animation: orbFloat 12s ease-in-out infinite alternate-reverse;
}

.hero-content {
  max-width: 820px;
  margin: 0 auto;
  position: relative;
  z-index: 1;
}

.hero-eyebrow {
  display: inline-block;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.14em;
  padding: 7px 16px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.16);
  color: rgba(255, 255, 255, 0.95);
  margin-bottom: 20px;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.hero-title {
  font-size: 52px;
  font-weight: 830;
  margin-bottom: 22px;
  line-height: 1.12;
  letter-spacing: -0.03em;
}

.hero-subtitle {
  font-size: 18px;
  margin-bottom: 40px;
  opacity: 0.92;
  line-height: 1.7;
  max-width: 640px;
  margin-left: auto;
  margin-right: auto;
}

.hero-actions {
  display: inline-flex;
  gap: 14px;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 14px 28px;
  border-radius: 12px;
  text-decoration: none;
  font-weight: 700;
  font-size: 15px;
  border: none;
  cursor: pointer;
  transition: all 0.25s ease;
}

.btn-large {
  padding: 16px 32px;
  font-size: 16px;
  border-radius: 14px;
}

.btn-primary {
  background: linear-gradient(135deg, #001f9e 0%, #2d4ec4 100%);
  color: #fff;
  box-shadow: 0 10px 24px rgba(0, 31, 158, 0.3);
}

.btn-primary:hover {
  transform: translateY(-3px);
  box-shadow: 0 16px 32px rgba(0, 31, 158, 0.4);
}

.btn-ghost {
  background: rgba(255, 255, 255, 0.12);
  color: #fff;
  border: 1.5px solid rgba(255, 255, 255, 0.3);
  backdrop-filter: blur(6px);
}

.btn-ghost:hover {
  background: rgba(255, 255, 255, 0.22);
  transform: translateY(-3px);
}

.btn-submit {
  background: linear-gradient(135deg, #001f9e 0%, #6366f1 100%);
  color: white;
  padding: 14px 28px;
  font-size: 15px;
  width: 100%;
  border-radius: 12px;
  box-shadow: 0 8px 20px rgba(0, 31, 158, 0.25);
  max-width: 320px;
}

.btn-submit:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 28px rgba(0, 31, 158, 0.35);
}

.spinner {
  display: inline-block;
  width: 18px;
  height: 18px;
  border: 2.5px solid rgba(255,255,255,0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Contact cards */
.contact-section {
  padding: 100px 20px;
  background: white;
  position: relative;
}

.section-header {
  text-align: center;
  max-width: 720px;
  margin: 0 auto 56px;
}

.section-eyebrow {
  display: inline-block;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--home-primary);
  background: #eaf0ff;
  padding: 7px 16px;
  border-radius: 999px;
  margin-bottom: 18px;
}

.section-title {
  font-size: 40px;
  font-weight: 830;
  color: #0f172a;
  margin-bottom: 18px;
  letter-spacing: -0.03em;
  line-height: 1.15;
}

.section-subtitle {
  color: #64748b;
  font-size: 17px;
  line-height: 1.7;
}

.contact-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
  margin-top: 8px;
}

.contact-card {
  background: white;
  border-radius: 22px;
  padding: 36px 28px;
  text-align: center;
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04);
  text-decoration: none;
  color: inherit;
  transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
  position: relative;
  overflow: hidden;
}

.contact-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, #001f9e, #6366f1);
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1);
}

.contact-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 22px 42px rgba(0, 0, 0, 0.1);
  border-color: #cbd5e1;
}

.contact-card:hover::before {
  transform: scaleX(1);
}

.contact-card-icon {
  width: 72px;
  height: 72px;
  margin-bottom: 18px;
  display: grid;
  place-items: center;
  background: linear-gradient(135deg, #f5f7ff 0%, #e5ecff 55%, #f5edff 100%);
  border: 1px solid rgba(129, 140, 248, .12);
  border-radius: 21px;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, .9), 0 10px 20px rgba(99, 102, 241, .1);
  transition: transform 0.35s ease;
}

.contact-card:hover .contact-card-icon {
  transform: scale(1.15);
}

.contact-card h3 {
  font-size: 18px;
  font-weight: 800;
  margin-bottom: 12px;
  color: #0f172a;
  letter-spacing: -0.01em;
}

.contact-card p {
  color: #64748b;
  font-size: 14px;
  line-height: 1.6;
  margin-bottom: 4px;
}

/* Form + Map */
.form-map-section {
  padding: 100px 20px;
  background: linear-gradient(to bottom, #f8fafc, #f1f5f9);
}

.form-map-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 36px;
  align-items: start;
}

.form-wrapper {
  background: white;
  border-radius: 24px;
  padding: 44px;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04);
  border: 1px solid #e2e8f0;
}

.form-success {
  text-align: center;
  padding: 60px 20px;
}

.success-icon {
  width: 72px;
  height: 72px;
  margin: 0 auto 20px;
  background: linear-gradient(135deg, #10b981, #34d399);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 36px;
  font-weight: 800;
  animation: popIn 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes popIn {
  from { transform: scale(0.5); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

.form-success h3 {
  font-size: 24px;
  font-weight: 800;
  color: #0f172a;
  margin-bottom: 8px;
}

.form-success p {
  color: #64748b;
  font-size: 15px;
}

.contact-form {
  display: flex;
  flex-direction: column;
  gap: 22px;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
  position: relative;
}

.form-field label {
  font-weight: 600;
  color: #0f172a;
  font-size: 14px;
  letter-spacing: 0.01em;
}

.form-field input,
.form-field textarea {
  padding: 13px 16px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  font-size: 15px;
  font-family: inherit;
  background: #f8fafc;
  color: #0f172a;
  transition: all 0.25s ease;
  outline: none;
}

.form-field input:focus,
.form-field textarea:focus {
  border-color: #001f9e;
  box-shadow: 0 0 0 3px rgba(0, 31, 158, 0.1);
  background: white;
}

.form-field.input-error input,
.form-field.input-error textarea {
  border-color: #ef4444;
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.08);
}

.field-error {
  color: #ef4444;
  font-size: 13px;
  font-weight: 500;
}

.form-field textarea {
  resize: vertical;
  min-height: 120px;
}

.map-wrapper {
  background: white;
  border-radius: 24px;
  padding: 32px;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04);
  border: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.map-container {
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 8px 20px rgba(15, 23, 42, 0.08);
}

.map-container iframe {
  display: block;
}

.map-info {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  padding-top: 8px;
}

.map-info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.map-info-label {
  font-size: 12px;
  font-weight: 700;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.map-info-value {
  font-size: 14px;
  font-weight: 600;
  color: #0f172a;
}

/* Social */
.social-section {
  padding: 100px 20px;
  background: white;
  position: relative;
}

.social-grid {
  display: flex;
  justify-content: center;
  gap: 20px;
  flex-wrap: wrap;
  margin-top: 12px;
}

.social-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  padding: 28px 32px;
  background: white;
  border-radius: 18px;
  text-decoration: none;
  color: #0f172a;
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04);
  transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
  min-width: 130px;
  position: relative;
  overflow: hidden;
}

.social-card::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(118, 75, 162, 0.08), rgba(102, 126, 234, 0.08));
  opacity: 0;
  transition: opacity 0.35s ease;
}

.social-card:hover {
  background: linear-gradient(135deg, #001f9e, #6366f1);
  color: white;
  border-color: transparent;
  transform: translateY(-6px);
  box-shadow: 0 20px 36px rgba(0, 31, 158, 0.3);
}

.social-card:hover .social-card-icon {
  transform: translateY(-4px);
}

.social-card::before:hover {
  opacity: 1;
}

.social-card-icon {
  width: 60px;
  height: 60px;
  display: grid;
  place-items: center;
  margin: 0 auto 12px;
  background: rgba(255, 255, 255, .15);
  border: 1px solid rgba(255, 255, 255, .18);
  border-radius: 18px;
  position: relative;
  transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1);
}

.social-card-name {
  font-weight: 600;
  font-size: 14px;
  position: relative;
  letter-spacing: 0.01em;
}

/* FAQ */
.faq-section {
  padding: 100px 20px;
  background: linear-gradient(to bottom, #f8fafc, #f1f5f9);
}

.faq-list {
  max-width: 860px;
  margin: 0 auto;
  display: grid;
  gap: 14px;
}

.faq-details {
  background: white;
  border-radius: 18px;
  border: 1px solid #e2e8f0;
  padding: 4px;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04);
}

.faq-details[open] {
  border-color: #cbd5e1;
  box-shadow: 0 14px 30px rgba(15, 23, 42, 0.08);
}

.faq-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 18px 22px;
  list-style: none;
  cursor: pointer;
  font-weight: 700;
  font-size: 15px;
  color: #0f172a;
  border-radius: 14px;
  transition: background 0.2s ease;
}

.faq-summary::-webkit-details-marker {
  display: none;
}

.faq-summary:hover {
  background: rgba(118, 75, 162, 0.02);
}

.faq-chevron {
  color: #64748b;
  transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1);
  flex-shrink: 0;
}

.faq-details[open] .faq-chevron {
  transform: rotate(180deg);
  color: #001f9e;
}

.faq-body {
  padding: 0 22px 20px;
  color: #64748b;
  font-size: 14px;
  line-height: 1.75;
}

@media (max-width: 1024px) {
  .contact-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 860px) {
  .hero {
    padding: 110px 20px 100px;
  }

  .hero-title {
    font-size: 36px;
  }

  .section-title {
    font-size: 30px;
  }

  .form-map-grid {
    grid-template-columns: 1fr;
  }

  .map-info {
    grid-template-columns: 1fr;
  }

  .contact-section {
    padding: 80px 18px;
  }

  .form-map-section {
    padding: 80px 18px;
  }
}

@media (max-width: 640px) {
  .hero-title {
    font-size: 32px;
  }

  .contact-grid {
    grid-template-columns: 1fr;
    max-width: 420px;
    margin-left: auto;
    margin-right: auto;
  }

  .form-wrapper {
    padding: 28px 20px;
  }

  .map-wrapper {
    padding: 20px;
  }

  .social-grid {
    flex-direction: column;
    align-items: center;
  }

  .social-card {
    width: 100%;
    max-width: 300px;
  }

  .btn-submit {
    max-width: 100%;
  }
}
</style>
