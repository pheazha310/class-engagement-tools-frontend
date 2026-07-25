<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { RouterLink } from 'vue-router'
import SiteFooter from '@/components/SiteFooter.vue'

const observer = ref<IntersectionObserver | null>(null)

const countersAnimated = ref(false)

const animateCounters = () => {
  if (countersAnimated.value) return
  countersAnimated.value = true
  const targets = document.querySelectorAll('.stat-value')
  targets.forEach((el) => {
    const targetText = (el as HTMLElement).textContent || ''
    const match = targetText.match(/[\d.]+/)
    if (!match) return
    const targetNum = parseFloat(match[0])
    const suffix = targetText.replace(match[0], '')
    const duration = 1800
    const startTime = performance.now()
    const tick = (now: number) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 4)
      const value = Math.floor(eased * targetNum)
      ;(el as HTMLElement).textContent = value + suffix
      if (progress < 1) requestAnimationFrame(tick)
      else (el as HTMLElement).textContent = targetText
    }
    requestAnimationFrame(tick)
  })
}

onMounted(() => {
  observer.value = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view')

          if (entry.target.classList.contains('stats-grid')) animateCounters()
        }
      })
    },
    { threshold: 0.12, rootMargin: '0px 0px -50px 0px' },
  )

  document.querySelectorAll('.reveal').forEach((el) => observer.value?.observe(el))
})

onBeforeUnmount(() => {
  observer.value?.disconnect()
})
</script>

<template>
  <div class="about-page">
    <!-- Hero Section -->
    <section class="hero">
      <div class="hero-orb hero-orb--1" />
      <div class="hero-orb hero-orb--2" />
      <div class="hero-grid" />
      <div class="hero-content">
        <span class="hero-eyebrow reveal">ABOUT US</span>
        <h1 class="hero-title reveal">
          Shaping the future of
          <span class="hero-title-highlight">classroom engagement</span>
        </h1>
        <p class="hero-subtitle reveal">
          We build tools that turn ordinary lessons into interactive, student-centered
          learning experiences—available anywhere, on any device.
        </p>
        <div class="hero-actions reveal">
          <RouterLink to="/register" class="btn btn-primary btn-large">Get Started Free</RouterLink>
          <RouterLink to="/" class="btn btn-ghost btn-large">Explore Tools</RouterLink>
        </div>
      </div>
    </section>

    <!-- Overview Section -->
    <section class="section overview-section">
      <div class="container">
        <div class="section-header reveal">
          <span class="section-eyebrow">Our Platform</span>
          <h2 class="section-title">Built for modern classrooms</h2>
          <p class="section-subtitle">
            A comprehensive suite of interactive applications designed to make teaching more engaging and effective.
          </p>
        </div>
        <div class="overview-content">
          <div class="overview-text">
            <div class="text-line reveal" v-for="(p, idx) in [
              'The Class Engagement Tools Platform is a comprehensive suite of interactive applications designed specifically for modern educators. Our mission is to transform traditional classroom experiences into dynamic, engaging, and student-centered learning environments.',
              'We provide teachers with powerful, easy-to-use tools that increase student participation, streamline classroom management, and make learning fun. From random student selection to interactive quizzes, our platform covers all aspects of classroom engagement.',
              'Built with educators in mind, our platform is intuitive, accessible, and works seamlessly across all devices. Whether you\'re teaching in a traditional classroom or online, our tools adapt to your needs.',
            ]" :key="idx">
              <p>{{ p }}</p>
            </div>
          </div>
          <div class="overview-card reveal">
            <div class="overview-card-inner">
              <span class="overview-icon">🎓</span>
              <div class="overview-card-title">Empowering Education Through Technology</div>
              <div class="overview-card-rule" />
              <div class="overview-card-cols">
                <div class="overview-chip" v-for="c in ['Interactive', 'Accessible', 'Device-ready', 'Teacher-first']" :key="c">
                  <span class="overview-chip-dot" />{{ c }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Mission Section -->
    <section class="section section--tinted mission-section">
      <div class="container">
        <div class="section-header reveal">
          <span class="section-eyebrow">Our Mission</span>
          <h2 class="section-title">Driving better learning outcomes</h2>
          <p class="section-subtitle">We focus on the areas that matter most to educators and students.</p>
        </div>
        <div class="mission-grid">
          <div class="mission-card reveal" v-for="(m, idx) in [
            { icon: '🎯', title: 'Increase Engagement', desc: 'Make every lesson interactive and captivating, ensuring students remain focused and enthusiastic.' },
            { icon: '💡', title: 'Simplify Teaching', desc: 'Intuitive tools that save teachers time and reduce administrative burden.' },
            { icon: '🌟', title: 'Ensure Fairness', desc: 'Equitable learning environments where every student has equal opportunities to participate.' },
            { icon: '🚀', title: 'Foster Innovation', desc: 'Continuously develop new features that leverage technology for better outcomes.' },
          ]" :key="idx" :style="{ transitionDelay: `${idx * 0.08}s` }">
            <div class="mission-card-top">
              <span class="mission-icon">{{ m.icon }}</span>
              <div class="mission-number">{{ String(idx + 1).padStart(2, '0') }}</div>
            </div>
            <h3 class="mission-card-title">{{ m.title }}</h3>
            <p class="mission-card-desc">{{ m.desc }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Features Section -->
    <section class="section features-section">
      <div class="container">
        <div class="section-header reveal">
          <span class="section-eyebrow">Key Features</span>
          <h2 class="section-title">Everything you need in one place</h2>
          <p class="section-subtitle">Discover what makes our platform the perfect companion for modern educators.</p>
        </div>
        <div class="features-grid">
          <div class="feature-card reveal" v-for="(f, idx) in [
            { icon: '🎡', title: 'Random Selection Tools', desc: 'Fair and fun ways to select students with spinning wheels and random pickers.' },
            { icon: '⏱️', title: 'Classroom Timers', desc: 'Countdowns, stopwatches, and Pomodoro sessions to manage classroom time.' },
            { icon: '👥', title: 'Group Management', desc: 'Create balanced groups quickly and share them with your class instantly.' },
            { icon: '🗳️', title: 'Live Polling & Voting', desc: 'Collect instant feedback with interactive polls that work on any device.' },
            { icon: '🎮', title: 'Educational Games', desc: 'Add friendly competition with quizzes, vocabulary games, and more.' },
            { icon: '📊', title: 'Teacher Dashboard', desc: 'Organize classes, save lists, and track activity history in one place.' },
          ]" :key="f.title" :style="{ transitionDelay: `${idx * 0.08}s` }">
            <div class="feature-card-icon">{{ f.icon }}</div>
            <h3 class="feature-card-title">{{ f.title }}</h3>
            <p class="feature-card-desc">{{ f.desc }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Stats Section -->
    <section class="section section--tinted stats-section">
      <div class="container">
        <div class="stats-grid reveal">
          <div class="stat-card" v-for="s in [
            { value: '10K+', label: 'Active Teachers' },
            { value: '50K+', label: 'Students Engaged' },
            { value: '15+', label: 'Interactive Tools' },
            { value: '100+', label: 'Countries Reached' },
          ]" :key="s.label">
            <div class="stat-value">{{ s.value }}</div>
            <div class="stat-label">{{ s.label }}</div>
          </div>
        </div>
      </div>
    </section>

    <!-- Team Section -->
    <section class="section team-section">
      <div class="container">
        <div class="section-header reveal">
          <span class="section-eyebrow">Our Team</span>
          <h2 class="section-title">The people behind the platform</h2>
          <p class="section-subtitle">A passionate group of educators, developers, and designers.</p>
        </div>
        <div class="team-grid">
          <div class="team-card reveal" v-for="(member, idx) in [
            { img: 'Sophea.jpg', name: 'Sophea Phal', role: 'Scrum', bio: 'Database Management' },
            { img: 'oun.jpg', name: 'Sophea Sophorn', role: 'Member', bio: 'Backend Development' },
            { img: 'Me.jpg', name: 'Sreykeo Keun', role: 'Member', bio: 'Frontend Development and QA' },
            { img: 'San.jpg', name: 'San Svit', role: 'Member', bio: 'Frontend Development' },
            { img: 'Mary.jpg', name: 'Mary Sao', role: 'Member', bio: 'Frontend Development' },
            { img: 'Vanna.jpg', name: 'Vanna Len', role: 'Member', bio: 'Backend Development' },
            { img: 'Nita.jpg', name: 'Chroun Nita', role: 'Member', bio: 'Frontend Development and QA' },
          ]" :key="member.name" :style="{ transitionDelay: `${idx * 0.07}s` }">
            <div class="team-avatar">
              <img :src="`/src/assets/images/${member.img}`" :alt="member.name" loading="lazy" />
            </div>
            <h3 class="team-name">{{ member.name }}</h3>
            <p class="team-role">{{ member.role }}</p>
            <p class="team-bio">{{ member.bio }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- FAQ Section -->
    <section class="section section--tinted faq-section">
      <div class="container">
        <div class="section-header reveal">
          <span class="section-eyebrow">FAQ</span>
          <h2 class="section-title">Frequently Asked Questions</h2>
        </div>
        <div class="faq-list reveal">
          <div class="faq-item" v-for="(faq, idx) in [
            { q: 'How quickly will I receive a response?', a: 'We typically respond to all inquiries within 24 hours during business days. For urgent matters, please call us directly.' },
            { q: 'Do you offer technical support?', a: 'Yes! We provide comprehensive technical support for all our users. Contact us through the form or email support@classtools.com.' },
            { q: 'Can I schedule a demo?', a: 'Absolutely! Send us a message mentioning you\'re interested in a demo, and our team will schedule a personalized walkthrough.' },
            { q: 'Do you offer training for educators?', a: 'Yes, we provide free training resources and webinars for educators. Contact us to learn about upcoming sessions.' },
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

    <!-- CTA Section -->
    <section class="cta reveal">
      <div class="cta-orb cta-orb--1" />
      <div class="cta-orb cta-orb--2" />
      <div class="container">
        <h2 class="cta-title">Ready to Transform Your Classroom?</h2>
        <p class="cta-subtitle">
          Join thousands of educators who are already using our platform to create engaging learning experiences.
        </p>
        <div class="cta-actions">
          <RouterLink to="/register" class="btn btn-primary btn-large">Get Started Free</RouterLink>
          <RouterLink to="/" class="btn btn-ghost-light btn-large">Explore Tools</RouterLink>
        </div>
      </div>
      <div class="cta-grid" />
    </section>

    <SiteFooter />
  </div>
</template>

<style scoped>
:root {
  --about-primary: #001f9e;
  --about-primary-soft: #eaf0ff;
  --about-accent: #3b82f6;
  --about-ink: #0f172a;
  --about-muted: #64748b;
  --about-line: #e2e8f0;
  --about-surface: #ffffff;
  --about-surface-soft: #f8fafc;
}

.reveal {
  opacity: 0;
  transform: translateY(28px);
  transition: opacity 0.75s cubic-bezier(0.16, 1, 0.3, 1), transform 0.75s cubic-bezier(0.16, 1, 0.3, 1);
}

.reveal.in-view {
  opacity: 1;
  transform: translateY(0);
}

.about-page {
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  color: var(--about-ink);
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

.section {
  padding: 110px 20px;
  position: relative;
}

.section--tinted {
  background: linear-gradient(to bottom, #f8fafc, #f1f5f9);
}

.section-header {
  text-align: center;
  max-width: 720px;
  margin: 0 auto 64px;
}

.section-eyebrow {
  display: inline-block;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
<<<<<<< HEAD
  color: #001f9e;
  background: #eaf0ff;
  padding: 6px 14px;
=======
  color: var(--about-primary);
  background: var(--about-primary-soft);
  padding: 7px 16px;
>>>>>>> 6acf3de (fix: fixed style that brokend after merge)
  border-radius: 999px;
  margin-bottom: 18px;
  animation: fadeDown 0.5s ease forwards;
}

.section-title {
  font-size: 40px;
  font-weight: 830;
  color: var(--about-ink);
  margin-bottom: 18px;
  letter-spacing: -0.03em;
  line-height: 1.15;
}

.section-subtitle {
  color: var(--about-muted);
  font-size: 17px;
  line-height: 1.7;
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
<<<<<<< HEAD
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
=======
  position: relative;
  z-index: 1;
>>>>>>> 6acf3de (fix: fixed style that brokend after merge)
}

.btn-large {
  padding: 16px 32px;
  font-size: 16px;
  border-radius: 14px;
}

.btn-primary {
  background: linear-gradient(135deg, var(--about-primary) 0%, #2d4ec4 100%);
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
  border: 1.5px solid rgba(255, 255, 255, 0.25);
  backdrop-filter: blur(6px);
}

.btn-ghost:hover {
  background: rgba(255, 255, 255, 0.22);
  transform: translateY(-3px);
}

.btn-ghost-light {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  border: 1.5px solid rgba(255, 255, 255, 0.25);
}

.btn-ghost-light:hover {
  background: rgba(255, 255, 255, 0.22);
  transform: translateY(-3px);
}

/* Hero */
.hero {
<<<<<<< HEAD
  background: linear-gradient(135deg, #001f9e 0%, #2d4ec4 100%);
  color: white;
  padding: 140px 20px 100px;
  text-align: center;
=======
>>>>>>> 6acf3de (fix: fixed style that brokend after merge)
  position: relative;
  background: linear-gradient(135deg, #001f9e 0%, #2547bc 50%, #3b5bf6 100%);
  color: white;
  padding: 120px 20px 140px;
  text-align: center;
  overflow: hidden;
}

.hero-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.04) 1px, transparent 1px);
  background-size: 64px 64px;
  mask-image: radial-gradient(ellipse 80% 60% at 50% 50%, black 40%, transparent 100%);
  pointer-events: none;
  animation: gridDrift 20s linear infinite;
}

.hero-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(70px);
  pointer-events: none;
  opacity: 0.2;
}

.hero-orb--1 {
  width: 420px;
  height: 420px;
  background: #ffffff;
  top: -120px;
  left: -80px;
  animation: orbFloat 10s ease-in-out infinite alternate;
}

.hero-orb--2 {
  width: 360px;
  height: 360px;
  background: #93c5fd;
  bottom: -120px;
  right: -60px;
  animation: orbFloat 12s ease-in-out infinite alternate-reverse;
}

@keyframes orbFloat {
  from { transform: translate(0, 0) scale(1); }
  to { transform: translate(32px, -28px) scale(1.08); }
}

@keyframes gridDrift {
  from { transform: translate(0, 0); }
  to { transform: translate(64px, 64px); }
}

@keyframes fadeDown {
  from { opacity: 0; transform: translateY(-8px); }
  to { opacity: 1; transform: translateY(0); }
}

.hero-content {
  position: relative;
  z-index: 1;
  max-width: 820px;
  margin: 0 auto;
}

.hero-eyebrow {
  display: inline-block;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.12em;
  padding: 7px 16px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.16);
  color: rgba(255, 255, 255, 0.95);
  margin-bottom: 20px;
  border: 1px solid rgba(255, 255, 255, 0.15);
}

.hero-title {
  font-size: 52px;
  font-weight: 830;
  margin-bottom: 24px;
  line-height: 1.12;
  letter-spacing: -0.03em;
  color: #ffffff;
}

.hero-title-highlight {
  background: linear-gradient(135deg, #bfdbfe, #ffffff);
  color: #001f9e;
  padding: 5px 14px;
  border-radius: 12px;
  display: inline-block;
  transform: skewX(-2deg);
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.12);
}

.hero-subtitle {
  font-size: 18px;
  line-height: 1.7;
  max-width: 640px;
  margin: 0 auto 40px;
  color: rgba(255, 255, 255, 0.92);
}

.hero-actions {
  display: inline-flex;
  gap: 16px;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
}

/* Overview */
.overview-content {
  display: grid;
  grid-template-columns: 1.05fr 0.95fr;
  gap: 72px;
  align-items: center;
}

.overview-text p {
  color: #475569;
  font-size: 16.5px;
  margin-bottom: 20px;
  line-height: 1.85;
}

.text-line p {
  margin-bottom: 0;
}

<<<<<<< HEAD
.image-placeholder {
  width: 100%;
  max-width: 420px;
  aspect-ratio: 1;
  background: linear-gradient(135deg, #001f9e 0%, #2d4ec4 100%);
  border-radius: 24px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: white;
  text-align: center;
  padding: 48px;
  box-shadow: 0 24px 48px rgba(0, 31, 158, 0.25);
=======
.overview-card {
  perspective: 1400px;
}

.overview-card-inner {
  background: linear-gradient(135deg, #001f9e 0%, #2547bc 100%);
  border-radius: 28px;
  padding: 40px 32px;
  color: white;
  box-shadow: 0 30px 64px rgba(0, 31, 158, 0.32);
  transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.6s ease;
  position: relative;
  overflow: hidden;
>>>>>>> 6acf3de (fix: fixed style that brokend after merge)
}

.overview-card-inner::before {
  content: '';
  position: absolute;
  top: -50%;
  right: -50%;
  width: 120%;
  height: 120%;
  background: radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%);
  pointer-events: none;
}

.overview-card:hover .overview-card-inner {
  transform: rotateY(8deg) rotateX(2deg) translateY(-8px);
  box-shadow: 0 40px 80px rgba(0, 31, 158, 0.4);
}

.overview-icon {
  font-size: 64px;
  display: block;
  margin-bottom: 16px;
  animation: iconFloat 3s ease-in-out infinite;
}

@keyframes iconFloat {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}

.overview-card-title {
  font-size: 22px;
  font-weight: 800;
  margin-bottom: 16px;
  letter-spacing: -0.01em;
  line-height: 1.3;
}

.overview-card-rule {
  height: 1px;
  background: rgba(255, 255, 255, 0.2);
  margin-bottom: 20px;
}

.overview-card-cols {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.overview-chip {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  font-weight: 700;
  opacity: 0.95;
  letter-spacing: 0.01em;
}

.overview-chip-dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: #93c5fd;
  box-shadow: 0 0 0 3px rgba(147, 197, 253, 0.3);
  animation: dotPulse 2s ease-in-out infinite;
}

@keyframes dotPulse {
  0%, 100% { box-shadow: 0 0 0 3px rgba(147, 197, 253, 0.25); }
  50% { box-shadow: 0 0 0 6px rgba(147, 197, 253, 0.08); }
}

/* Mission */
.mission-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 22px;
  margin-top: 12px;
}

.mission-card {
  background: white;
  border-radius: 22px;
  padding: 28px 24px;
  text-align: left;
  border: 1px solid var(--about-line);
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04);
  transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
  position: relative;
  overflow: hidden;
}

.mission-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, var(--about-primary), var(--about-accent));
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1);
}

.mission-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 22px 42px rgba(0, 31, 158, 0.14);
  border-color: #cbd5e1;
}

.mission-card:hover::before {
  transform: scaleX(1);
}

.mission-card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 18px;
}

.mission-icon {
  font-size: 40px;
  transition: transform 0.35s ease;
}

.mission-card:hover .mission-icon {
  transform: scale(1.15) rotate(-5deg);
}

.mission-number {
  font-size: 11px;
  font-weight: 800;
  color: var(--about-muted);
  opacity: 0.4;
  letter-spacing: 0.05em;
}

.mission-card-title {
  font-size: 18px;
  font-weight: 800;
  margin-bottom: 10px;
  color: var(--about-ink);
  letter-spacing: -0.01em;
}

.mission-card-desc {
  color: var(--about-muted);
  font-size: 13.5px;
  line-height: 1.7;
}

/* Features */
.features-section {
  background: white;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 22px;
  margin-top: 12px;
}

.feature-card {
  background: white;
  border-radius: 22px;
  padding: 28px;
  border: 1px solid var(--about-line);
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04);
  transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
  position: relative;
  overflow: hidden;
}

.feature-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 22px 42px rgba(0, 31, 158, 0.12);
  border-color: #cbd5e1;
}

.feature-card::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.06), rgba(139, 92, 246, 0.06));
  opacity: 0;
  transition: opacity 0.35s ease;
}

.feature-card:hover::before {
  opacity: 1;
}

.feature-card-icon {
  font-size: 40px;
  margin-bottom: 18px;
  display: block;
  position: relative;
  transition: transform 0.35s ease;
}

.feature-card:hover .feature-card-icon {
  transform: scale(1.1) translateY(-2px);
}

.feature-card-title {
  font-size: 17px;
  font-weight: 800;
  margin-bottom: 10px;
  color: var(--about-ink);
  position: relative;
  letter-spacing: -0.01em;
}

.feature-card-desc {
  color: var(--about-muted);
  font-size: 14px;
  line-height: 1.75;
  position: relative;
}

/* Stats */
.stats-section {
  position: relative;
  overflow: hidden;
}

.stats-section::before {
  content: '';
  position: absolute;
  top: -100px;
  right: -100px;
  width: 350px;
  height: 350px;
  background: radial-gradient(circle, rgba(59, 130, 246, 0.06) 0%, transparent 70%);
  border-radius: 50%;
  pointer-events: none;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 28px;
}

.stat-card {
  background: white;
  border-radius: 22px;
  padding: 36px 24px;
  text-align: center;
  border: 1px solid var(--about-line);
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.04);
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  position: relative;
  overflow: hidden;
}

.stat-card::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(0, 31, 158, 0.03), rgba(59, 130, 246, 0.03));
  opacity: 0;
  transition: opacity 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 20px 40px rgba(15, 23, 42, 0.1);
  border-color: #cbd5e1;
}

.stat-card:hover::after {
  opacity: 1;
}

.stat-value {
  font-size: 48px;
  font-weight: 830;
  color: var(--about-primary);
  letter-spacing: -0.03em;
  margin-bottom: 8px;
  position: relative;
  letter-spacing: -0.02em;
}

.stat-label {
  font-size: 13px;
  font-weight: 700;
  color: var(--about-muted);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  position: relative;
}

/* Team */
.team-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 22px;
  margin-top: 12px;
}

.team-card {
  background: white;
  border-radius: 22px;
  padding: 32px 24px;
  text-align: center;
  border: 1px solid var(--about-line);
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04);
  transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
  position: relative;
  overflow: hidden;
}

.team-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, var(--about-primary), var(--about-accent));
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1);
}

.team-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 22px 42px rgba(0, 31, 158, 0.12);
  border-color: #cbd5e1;
}

.team-card:hover::before {
  transform: scaleX(1);
}

.team-avatar {
  width: 100px;
  height: 100px;
  margin: 0 auto 18px;
  border-radius: 50%;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--about-primary-soft), #dbeafe);
  padding: 4px;
  transition: transform 0.35s ease;
}

.team-card:hover .team-avatar {
  transform: scale(1.05);
}

.team-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
  display: block;
}

.team-name {
  font-size: 17px;
  font-weight: 800;
  margin-bottom: 5px;
  color: var(--about-ink);
}

.team-role {
<<<<<<< HEAD
  font-size: 13px;
  font-weight: 600;
  color: #001f9e;
=======
  font-size: 12px;
  font-weight: 800;
  color: var(--about-primary);
>>>>>>> 6acf3de (fix: fixed style that brokend after merge)
  margin-bottom: 10px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.team-bio {
  color: var(--about-muted);
  font-size: 13.5px;
  line-height: 1.6;
}

<<<<<<< HEAD
/* Stats Section */
.stats {
  padding: 80px 20px;
  background: linear-gradient(135deg, #001f9e 0%, #1d4ed8 100%);
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
  background: linear-gradient(135deg, #001f9e 0%, #2d4ec4 100%);
  color: white;
  padding: 100px 20px;
  text-align: center;
=======
/* FAQ */
.faq-section {
>>>>>>> 6acf3de (fix: fixed style that brokend after merge)
  position: relative;
}

.faq-list {
  max-width: 820px;
  margin: 0 auto;
  display: grid;
  gap: 14px;
}

.faq-details {
  background: white;
  border-radius: 18px;
  border: 1px solid var(--about-line);
  padding: 4px;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04);
}

.faq-details[open] {
  border-color: #cbd5e1;
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.08);
  background: linear-gradient(135deg, #fafbff, #f8fafc);
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
  color: var(--about-ink);
  border-radius: 14px;
  transition: background 0.2s ease;
}

.faq-summary:hover {
  background: rgba(0, 31, 158, 0.02);
}

.faq-summary::-webkit-details-marker {
  display: none;
}

.faq-chevron {
  color: var(--about-muted);
  transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1);
  flex-shrink: 0;
}

.faq-details[open] .faq-chevron {
  transform: rotate(180deg);
  color: var(--about-primary);
}

.faq-body {
  padding: 0 22px 20px;
  color: var(--about-muted);
  font-size: 14px;
  line-height: 1.75;
}

/* CTA */
.cta {
  position: relative;
  background: linear-gradient(135deg, #001f9e 0%, #2547bc 50%, #3b5bf6 100%);
  color: white;
  padding: 120px 20px;
  text-align: center;
  overflow: hidden;
}

.cta-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  pointer-events: none;
  opacity: 0.22;
}

.cta-orb--1 {
  width: 420px;
  height: 420px;
  background: #ffffff;
  top: -120px;
  left: -80px;
  animation: orbFloat 10s ease-in-out infinite alternate;
}

.cta-orb--2 {
  width: 360px;
  height: 360px;
  background: #93c5fd;
  bottom: -120px;
  right: -60px;
  animation: orbFloat 12s ease-in-out infinite alternate-reverse;
}

.cta-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px);
  background-size: 60px 60px;
  mask-image: radial-gradient(ellipse 70% 55% at 50% 50%, black 40%, transparent 100%);
  pointer-events: none;
}

.cta-title {
  position: relative;
  font-size: 40px;
  font-weight: 830;
  margin-bottom: 18px;
  letter-spacing: -0.02em;
}

.cta-subtitle {
  position: relative;
  font-size: 17px;
  max-width: 600px;
  margin: 0 auto 36px;
  color: rgba(255, 255, 255, 0.9);
  line-height: 1.7;
}

.cta-actions {
  position: relative;
  display: inline-flex;
  gap: 16px;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
}

@media (max-width: 1024px) {
  .mission-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .overview-content {
    gap: 52px;
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

  .overview-content {
    grid-template-columns: 1fr;
  }

  .features-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .team-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .section {
    padding: 80px 18px;
  }
}

@media (max-width: 640px) {
  .hero-title {
    font-size: 32px;
  }

  .features-grid {
    grid-template-columns: 1fr;
  }

  .mission-grid {
    grid-template-columns: 1fr;
  }

  .team-grid {
    grid-template-columns: 1fr;
    max-width: 420px;
    margin-left: auto;
    margin-right: auto;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 18px;
  }

  .hero-actions {
    flex-direction: column;
    align-items: stretch;
  }

  .btn-large {
    width: 100%;
  }

  .cta-title {
    font-size: 32px;
  }

  .cta-actions {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>