<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { RouterLink, useRoute } from 'vue-router'

const route = useRoute()
const showBackToTop = ref(false)

const isActive = (path: string) => route.path === path

const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const handleScroll = () => {
  showBackToTop.value = window.scrollY > 400
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll)
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>

<template>
  <footer class="site-footer" role="contentinfo" aria-label="Site footer">
    <div class="site-footer-accent"></div>
    <div class="container">
      <div class="site-footer-content">
        <div class="site-footer-brand">
          <RouterLink to="/" class="site-footer-logo" aria-label="ClassTools home">
            <span class="logo-icon" aria-hidden="true">🎓</span>
            <span class="logo-text">EngageClassKH</span>
          </RouterLink>
          <p class="site-footer-description">
            Empowering educators with innovative classroom engagement tools. Transform your teaching experience today.
          </p>
          <div class="site-footer-social">
            <a href="https://facebook.com/classtools" target="_blank" rel="noopener noreferrer" class="social-icon-link" aria-label="Facebook">
              <span aria-hidden="true">📘</span>
            </a>
            <a href="https://twitter.com/classtools" target="_blank" rel="noopener noreferrer" class="social-icon-link" aria-label="Twitter">
              <span aria-hidden="true">🐦</span>
            </a>
            <a href="https://linkedin.com/company/classtools" target="_blank" rel="noopener noreferrer" class="social-icon-link" aria-label="LinkedIn">
              <span aria-hidden="true">💼</span>
            </a>
            <a href="https://instagram.com/classtools" target="_blank" rel="noopener noreferrer" class="social-icon-link" aria-label="Instagram">
              <span aria-hidden="true">📷</span>
            </a>
            <a href="https://youtube.com/classtools" target="_blank" rel="noopener noreferrer" class="social-icon-link" aria-label="YouTube">
              <span aria-hidden="true">📺</span>
            </a>
          </div>
        </div>

        <nav class="site-footer-nav" aria-label="Footer navigation">
          <div class="site-footer-section">
            <h3 class="site-footer-title">Product</h3>
            <ul class="site-footer-links">
              <li><RouterLink to="/">Features</RouterLink></li>
              <li><RouterLink to="/">Tools</RouterLink></li>
              <li><RouterLink to="/">Pricing</RouterLink></li>
              <li><RouterLink to="/">Updates</RouterLink></li>
            </ul>
          </div>

          <div class="site-footer-section">
            <h3 class="site-footer-title">Company</h3>
            <ul class="site-footer-links">
              <li><RouterLink to="/about" :class="{ active: isActive('/about') }">About Us</RouterLink></li>
              <li><RouterLink to="/contact" :class="{ active: isActive('/contact') }">Contact</RouterLink></li>
              <li><RouterLink to="/">Careers</RouterLink></li>
              <li><RouterLink to="/">Blog</RouterLink></li>
            </ul>
          </div>

          <div class="site-footer-section">
            <h3 class="site-footer-title">Support</h3>
            <ul class="site-footer-links">
              <li><RouterLink to="/">Help Center</RouterLink></li>
              <li><RouterLink to="/">Documentation</RouterLink></li>
              <li><RouterLink to="/">Privacy Policy</RouterLink></li>
              <li><RouterLink to="/">Terms of Service</RouterLink></li>
            </ul>
          </div>
        </nav>
      </div>

      <div class="site-footer-bottom">
        <div class="site-footer-bottom-content">
          <p class="site-footer-copyright">&copy; 2024 ClassTools. All rights reserved.</p>
          <div class="site-footer-bottom-links">
            <RouterLink to="/">Privacy Policy</RouterLink>
            <span class="link-separator" aria-hidden="true">•</span>
            <RouterLink to="/">Terms of Service</RouterLink>
            <span class="link-separator" aria-hidden="true">•</span>
            <RouterLink to="/">Cookie Policy</RouterLink>
          </div>
        </div>
      </div>
    </div>

    <button
      class="back-to-top"
      :class="{ visible: showBackToTop }"
      @click="scrollToTop"
      aria-label="Back to top"
      title="Back to top"
    >
      <span aria-hidden="true">↑</span>
    </button>
  </footer>
</template>

<style scoped>
.site-footer {
  background: linear-gradient(135deg, #1f2937 0%, #111827 100%);
  color: white;
  padding: 80px 20px 30px;
  position: relative;
}

.site-footer-accent {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #2563eb 0%, #1d4ed8 50%, #2563eb 100%);
}

.site-footer-content {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr;
  gap: 48px;
  margin-bottom: 40px;
}

.site-footer-brand {
  padding-right: 20px;
}

.site-footer-logo {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 20px;
  font-weight: 700;
  color: white;
  text-decoration: none;
  margin-bottom: 16px;
  transition: opacity 0.2s ease;
}

.site-footer-logo:hover {
  opacity: 0.85;
}

.logo-icon {
  font-size: 24px;
}

.site-footer-description {
  color: #9ca3af;
  font-size: 14px;
  line-height: 1.8;
  margin-bottom: 20px;
  max-width: 320px;
}

.site-footer-social {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.social-icon-link {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: #374151;
  border-radius: 8px;
  text-decoration: none;
  font-size: 20px;
  transition: all 0.3s ease;
}

.social-icon-link:hover {
  background: #2563eb;
  transform: translateY(-2px);
}

.site-footer-nav {
  display: contents;
}

.site-footer-section {
  min-width: 0;
}

.site-footer-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 20px;
  color: white;
  position: relative;
  padding-bottom: 10px;
}

.site-footer-title::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 40px;
  height: 2px;
  background: #2563eb;
  border-radius: 1px;
}

.site-footer-links {
  list-style: none;
  padding: 0;
  margin: 0;
}

.site-footer-links li {
  margin-bottom: 12px;
}

.site-footer-links a {
  color: #9ca3af;
  text-decoration: none;
  font-size: 14px;
  transition: all 0.3s ease;
  display: inline-block;
}

.site-footer-links a:hover {
  color: white;
  transform: translateX(4px);
}

.site-footer-links a.active {
  color: white;
  font-weight: 500;
}

.site-footer-bottom {
  border-top: 1px solid #374151;
  padding-top: 30px;
  margin-top: 20px;
}

.site-footer-bottom-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
}

.site-footer-copyright {
  color: #9ca3af;
  font-size: 14px;
  margin: 0;
}

.site-footer-bottom-links {
  display: flex;
  gap: 16px;
  align-items: center;
  flex-wrap: wrap;
}

.site-footer-bottom-links a {
  color: #9ca3af;
  text-decoration: none;
  font-size: 14px;
  transition: color 0.3s ease;
}

.site-footer-bottom-links a:hover {
  color: white;
}

.link-separator {
  color: #4b5563;
  user-select: none;
}

.back-to-top {
  position: fixed;
  bottom: 24px;
  right: 24px;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: none;
  background: #2563eb;
  color: white;
  font-size: 20px;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.4);
  transition: all 0.3s ease;
  z-index: 999;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  visibility: hidden;
  transform: translateY(10px);
}

.back-to-top.visible {
  opacity: 1;
  visibility: visible;
  transform: translateY(0);
}

.back-to-top:hover {
  background: #1d4ed8;
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(37, 99, 235, 0.5);
}

.back-to-top:focus {
  outline: 2px solid #60a5fa;
  outline-offset: 2px;
}

@media (max-width: 768px) {
  .site-footer {
    padding: 60px 20px 24px;
  }

  .site-footer-content {
    grid-template-columns: 1fr;
    gap: 40px;
  }

  .site-footer-brand {
    padding-right: 0;
    text-align: center;
  }

  .site-footer-description {
    max-width: none;
    margin-left: auto;
    margin-right: auto;
  }

  .site-footer-social {
    justify-content: center;
  }

  .site-footer-title::after {
    left: 50%;
    transform: translateX(-50%);
  }

  .site-footer-links {
    text-align: center;
  }

  .site-footer-bottom-content {
    flex-direction: column;
    text-align: center;
  }

  .site-footer-bottom-links {
    justify-content: center;
  }

  .back-to-top {
    bottom: 16px;
    right: 16px;
    width: 44px;
    height: 44px;
  }
}

@media (min-width: 769px) and (max-width: 1024px) {
  .site-footer-content {
    grid-template-columns: repeat(2, 1fr);
  }

  .site-footer-brand {
    grid-column: 1 / -1;
    padding-right: 0;
    text-align: center;
  }

  .site-footer-description {
    max-width: 500px;
    margin-left: auto;
    margin-right: auto;
  }

  .site-footer-social {
    justify-content: center;
  }

  .site-footer-title::after {
    left: 50%;
    transform: translateX(-50%);
  }
}
</style>
