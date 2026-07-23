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
         <div class="section-header">
           <span class="section-eyebrow">Contact Info</span>
           <h2 class="section-title">We'd love to hear from you</h2>
           <p class="section-subtitle">
             Reach out through any of these channels and our team will respond as soon as possible.
           </p>
         </div>
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
         <div class="section-header">
           <span class="section-eyebrow">Get In Touch</span>
           <h2 class="section-title">Send us a message</h2>
           <p class="section-subtitle">
             Fill out the form below and we'll get back to you within 24 hours.
           </p>
         </div>
         <div class="form-map-grid">
           <!-- Contact Form -->
           <div class="contact-form-wrapper">
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
                 height="420"
                 style="border: 0; border-radius: 16px;"
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
         <div class="section-header">
           <span class="section-eyebrow">Connect</span>
           <h2 class="section-title">Follow us on social media</h2>
           <p class="section-subtitle">
             Follow us for the latest updates, tips, and educational resources.
           </p>
         </div>
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
         <div class="section-header">
           <span class="section-eyebrow">FAQ</span>
           <h2 class="section-title">Frequently Asked Questions</h2>
         </div>
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

.contact-page {
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
  color: #001f9e;
  background: #eaf0ff;
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
  color: #001f9e;
  box-shadow: 0 4px 14px rgba(0, 31, 158, 0.25);
}

.btn-primary:hover {
  background: #f8faff;
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 31, 158, 0.35);
}

.btn-secondary {
  background: transparent;
  color: white;
  border: 2px solid rgba(255, 255, 255, 0.9);
}

.btn-secondary:hover {
  background: white;
  color: #001f9e;
  transform: translateY(-2px);
}

.btn-large {
  padding: 16px 32px;
  font-size: 16px;
  border-radius: 12px;
}

.btn-login {
  background: transparent;
  color: #475569;
  border: 1px solid #e2e8f0;
  backdrop-filter: blur(10px);
  border-radius: 8px;
  padding: 8px 18px;
  font-size: 14px;
  font-weight: 500;
}

.btn-login:hover {
  background: #f8fafc;
  color: #001f9e;
  border-color: #cbd5e1;
}

.btn-register {
  background: #001f9e;
  color: white;
  border-radius: 8px;
  padding: 8px 18px;
  font-size: 14px;
  font-weight: 600;
  box-shadow: 0 1px 3px rgba(37, 99, 235, 0.2);
}

.btn-register:hover {
  background: #00157a;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 31, 158, 0.3);
}

.btn-submit {
  background: linear-gradient(135deg, #001f9e 0%, #2d4ec4 100%);
  color: white;
  padding: 14px 28px;
  font-size: 15px;
  width: 100%;
  max-width: 300px;
  border-radius: 10px;
  box-shadow: 0 4px 14px rgba(37, 99, 235, 0.25);
}

.btn-submit:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(37, 99, 235, 0.35);
}

/* Hero Section */
.hero {
  background: linear-gradient(135deg, #001f9e 0%, #2d4ec4 100%);
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
  background: url('data:image/svg+xml,<svg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"><g fill="none" fill-rule="evenodd"><g fill="%23ffffff" fill-opacity="0.08"><path d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/></g></g></svg>');
  opacity: 0.4;
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
  margin-bottom: 36px;
  opacity: 0.92;
  line-height: 1.7;
  max-width: 640px;
  margin-left: auto;
  margin-right: auto;
}

/* Contact Info Section */
.contact-info {
  padding: 100px 20px;
  background: #ffffff;
}

.contact-info-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
  margin-top: 8px;
}

.contact-info-card {
  background: #ffffff;
  border-radius: 16px;
  padding: 36px 24px;
  text-align: center;
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  transition: all 0.3s ease;
}

.contact-info-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 16px 32px rgba(0, 0, 0, 0.1);
  border-color: #cbd5e1;
}

.contact-icon {
  font-size: 44px;
  margin-bottom: 16px;
}

.contact-info-card h3 {
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 12px;
  color: #0f172a;
}

.contact-info-card p {
  color: #64748b;
  font-size: 14px;
  line-height: 1.6;
  margin-bottom: 4px;
}

/* Contact Form + Map */
.contact-form-map-section {
  padding: 100px 20px;
  background: linear-gradient(to bottom, #f8fafc, #f1f5f9);
}

.form-map-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 32px;
  align-items: start;
}

.contact-form-wrapper {
  background: white;
  border-radius: 16px;
  padding: 40px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  border: 1px solid #e2e8f0;
}

.form-header {
  text-align: center;
  margin-bottom: 32px;
}

.contact-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-weight: 600;
  color: #0f172a;
  font-size: 14px;
}

.form-group input,
.form-group textarea {
  padding: 12px 16px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  font-size: 15px;
  font-family: inherit;
  background: #f8fafc;
  color: #0f172a;
  transition: all 0.2s ease;
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #001f9e;
  box-shadow: 0 0 0 3px rgba(0, 31, 158, 0.1);
  background: white;
}

.form-group textarea {
  resize: vertical;
  min-height: 120px;
}

.map-wrapper {
  background: white;
  border-radius: 16px;
  padding: 40px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  border: 1px solid #e2e8f0;
}

.map-title {
  font-size: 22px;
  font-weight: 700;
  margin-bottom: 10px;
  color: #0f172a;
  text-align: center;
}

.map-subtitle {
  text-align: center;
  color: #64748b;
  font-size: 15px;
  margin-bottom: 24px;
}

.map-container {
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.map-container iframe {
  display: block;
}

/* Social Media */
.social-media {
  padding: 100px 20px;
  background: #ffffff;
}

.social-links {
  display: flex;
  justify-content: center;
  gap: 20px;
  flex-wrap: wrap;
  margin-top: 8px;
}

.social-link {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 24px;
  background: #ffffff;
  border-radius: 16px;
  text-decoration: none;
  color: #0f172a;
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  transition: all 0.3s ease;
  min-width: 140px;
}

.social-link:hover {
  background: #001f9e;
  color: white;
  border-color: #001f9e;
  transform: translateY(-6px);
  box-shadow: 0 16px 32px rgba(0, 31, 158, 0.25);
}

.social-icon {
  font-size: 36px;
}

.social-link span {
  font-weight: 600;
  font-size: 14px;
}

/* FAQ */
.faq {
  padding: 100px 20px;
  background: linear-gradient(to bottom, #f8fafc, #f1f5f9);
}

.faq-list {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  margin-top: 8px;
}

.faq-item {
  background: white;
  border-radius: 16px;
  padding: 28px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  border: 1px solid #e2e8f0;
  transition: all 0.3s ease;
}

.faq-item:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.08);
  border-color: #cbd5e1;
}

.faq-item h3 {
  font-size: 17px;
  font-weight: 700;
  margin-bottom: 10px;
  color: #0f172a;
}

.faq-item p {
  color: #64748b;
  font-size: 14px;
  line-height: 1.7;
}

/* Responsive */
@media (max-width: 1024px) {
  .form-map-grid {
    grid-template-columns: 1fr;
  }

  .faq-list {
    grid-template-columns: 1fr;
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

  .contact-info {
    padding: 72px 20px;
  }

  .contact-info-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .contact-form-map-section {
    padding: 72px 20px;
  }

  .contact-form-wrapper {
    padding: 28px 20px;
  }

  .map-wrapper {
    padding: 28px 20px;
  }

  .social-media {
    padding: 72px 20px;
  }

  .social-links {
    flex-direction: column;
    align-items: center;
    gap: 12px;
  }

  .social-link {
    width: 100%;
    max-width: 320px;
  }

  .faq {
    padding: 72px 20px;
  }

  .btn-submit {
    max-width: 100%;
  }
}

@media (min-width: 769px) and (max-width: 1024px) {
  .contact-info-grid {
    grid-template-columns: repeat(2, 1fr);
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
