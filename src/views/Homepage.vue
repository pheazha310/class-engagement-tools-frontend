<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { onMounted, onBeforeUnmount, ref } from 'vue'
import { categories } from '@/data/toolsData'
import SiteFooter from '@/components/SiteFooter.vue'
import ToolIcon from '@/components/ToolIcon.vue'

defineOptions({
  name: 'HomePage',
})

const observer = ref<IntersectionObserver | null>(null)
const countersAnimated = ref(false)
const activeDemo = ref('Random picker')
const demoActivities = [
  { label: 'Random picker', icon: 'wheel', color: 'orange', value: '24' },
  { label: 'Quick quiz', icon: 'quiz', color: 'blue', value: '12' },
]

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
          if (entry.target.classList.contains('about-stats')) animateCounters()
        }
      })
    },
    { threshold: 0.08, rootMargin: '0px 0px -40px 0px' },
  )

  document.querySelectorAll('.reveal').forEach((el) => observer.value?.observe(el))
})

onBeforeUnmount(() => {
  observer.value?.disconnect()
})
</script>

<template>
  <div class="homepage">
    <!-- Hero -->
    <section class="hero">
      <div class="hero-orb hero-orb--1" />
      <div class="hero-orb hero-orb--2" />
      <div class="hero-orb hero-orb--3" />
      <div class="hero-grid" />
      <div class="container">
        <div class="hero-layout">
          <div class="hero-content">
            <span class="hero-eyebrow reveal"><span class="eyebrow-dot" /> MADE FOR MODERN EDUCATORS</span>
              <h1 class="hero-title reveal">
                Turn every lesson into an
                <span class="hero-title-highlight">Active Experiences.</span>
              </h1>
            <p class="hero-subtitle reveal">
              Bring energy, participation, and a little magic to your classroom with tools students love to use.
            </p>
            <div class="hero-buttons reveal">
              <RouterLink to="/register" class="btn btn-primary btn-large">Start teaching for free <span aria-hidden="true">→</span></RouterLink>
              <RouterLink to="/tools" class="btn btn-ghost btn-large">See all tools</RouterLink>
            </div>
          </div>

          <div class="hero-demo reveal" aria-label="Interactive classroom activity preview">
            <div class="demo-glow" />
            <div class="demo-window">
              <div class="demo-toolbar"><span /><span /><span /><b>Live classroom</b><i>● Live</i></div>
              <div class="demo-main">
                <div class="demo-topline"><span>Science · Grade 8</span><strong>Tuesday, 10:30 AM</strong></div>
                <div class="demo-question">
                  <span class="demo-question-icon"><ToolIcon :name="demoActivities.find((item) => item.label === activeDemo)?.icon || 'poll'" :size="24" /></span>
                  <div><small>NOW PLAYING</small><h3>{{ activeDemo }}</h3></div>
                  <span class="demo-score">{{ demoActivities.find((item) => item.label === activeDemo)?.value }}</span>
                </div>
                <div class="demo-chart"><i style="height: 42%" /><i style="height: 76%" /><i style="height: 58%" /><i style="height: 92%" /><i style="height: 67%" /><i style="height: 84%" /></div>
                <div class="demo-participants"><span><b>●</b> 28 students joined</span><div class="participant-dots"><i /><i /><i /><i /><i /></div></div>
              </div>
              <div class="demo-tabs">
                <button v-for="activity in demoActivities" :key="activity.label" :class="{ active: activeDemo === activity.label }" @click="activeDemo = activity.label">
                  <ToolIcon :name="activity.icon" :size="17" /> {{ activity.label }}
                </button>
              </div>
            </div>
            <div class="floating-card floating-card--top"><ToolIcon name="sparkles" :size="20" /><span><b>+42%</b><small>more participation</small></span></div>
            <div class="floating-card floating-card--bottom"><span class="live-dot" /> <b>Everyone is engaged</b></div>
          </div>
        </div>
      </div>
    </section>

    <!-- Featured Tools -->
    <section class="featured-tools">
      <div class="container">
        <div class="section-header reveal">
          <span class="section-eyebrow">Our Tools</span>
          <h2 class="section-title">Everything you need</h2>
          <p class="section-subtitle">
            Explore our complete collection of classroom engagement tools designed to enhance participation and learning outcomes.
          </p>
        </div>
        <div class="categories-grid">
          <div class="category-card reveal" v-for="(category, idx) in categories" :key="category.name" :style="{ transitionDelay: `${idx * 0.08}s` }">
            <div class="category-card-inner">
              <h3 class="category-title">
                <span class="category-icon"><ToolIcon :name="category.icon" :size="22" /></span>
                <span>{{ category.name }}</span>
              </h3>
              <div class="category-tools">
                <RouterLink
                  v-for="tool in category.tools"
                  :key="tool.title"
                  :to="tool.route || '/tools/' + tool.slug"
                  class="category-tool-link"
                >
                  <span class="category-tool-icon"><ToolIcon :name="tool.icon" :size="22" /></span>
                  <div class="category-tool-content">
                    <span class="category-tool-title">{{ tool.title }}</span>
                    <span class="category-tool-desc">{{ tool.description }}</span>
                  </div>
                </RouterLink>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- About / Mission -->
    <section class="about-section">
      <div class="container">
        <div class="section-header reveal">
          <span class="section-eyebrow">Our Mission</span>
          <h2 class="section-title">Built for modern classrooms</h2>
          <p class="section-subtitle">
            A comprehensive suite of interactive applications designed to make teaching more engaging and effective.
          </p>
        </div>
        <div class="about-content">
          <div class="about-text">
            <div class="text-block reveal">
              <p>
                ClassTools is dedicated to transforming education through innovative technology.
                Our platform provides educators with a comprehensive suite of interactive tools
                designed to increase student engagement, streamline classroom management, and
                create dynamic learning experiences.
              </p>
            </div>
            <div class="text-block reveal">
              <p>
                Founded by educators, for educators, we understand the challenges of modern
                teaching. That's why we've created tools that are intuitive, effective, and
                accessible to all teachers.
              </p>
            </div>
            <div class="text-block reveal">
              <p>
                Our mission is to empower educators with the resources they need to create
                engaging, inclusive, and effective learning environments.
              </p>
            </div>
          </div>
          <div class="about-visual reveal">
            <div class="visual-card">
              <div class="floating-shapes">
                <div class="floating-shape"></div>
                <div class="floating-shape"></div>
                <div class="floating-shape"></div>
              </div>
              <div class="visual-icon"><ToolIcon name="target" :size="48" /></div>
              <div class="visual-content">
                <h3>Our Impact</h3>
                <div class="impact-items">
                  <div class="impact-item">
                    <div class="impact-icon"><ToolIcon name="chart" :size="28" /></div>
                    <span class="impact-text">Increased Engagement</span>
                  </div>
                  <div class="impact-item">
                    <div class="impact-icon"><ToolIcon name="bulb" :size="28" /></div>
                    <span class="impact-text">Active Learning</span>
                  </div>
                  <div class="impact-item">
                    <div class="impact-icon"><ToolIcon name="rocket" :size="28" /></div>
                    <span class="impact-text">Easy Implementation</span>
                  </div>
                  <div class="impact-item">
                    <div class="impact-icon"><ToolIcon name="teacher" :size="28" /></div>
                    <span class="impact-text">Teacher Approved</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Features -->
    <section class="features-section section--tinted">
      <div class="container">
        <div class="section-header reveal">
          <span class="section-eyebrow">Why Choose Us</span>
          <h2 class="section-title">Built different</h2>
          <p class="section-subtitle">
            We provide everything you need to create engaging and interactive classroom experiences.
          </p>
        </div>
        <div class="features-grid">
          <div class="feature-card reveal" v-for="(feature, idx) in features" :key="feature.title" :style="{ transitionDelay: `${idx * 0.07}s` }">
            <div class="feature-icon"><ToolIcon :name="feature.icon" :size="34" /></div>
            <h3>{{ feature.title }}</h3>
            <p>{{ feature.desc }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Testimonials -->
    <section class="testimonials-section">
      <div class="container">
        <div class="section-header reveal">
          <span class="section-eyebrow">Testimonials</span>
          <h2 class="section-title">What educators say</h2>
          <p class="section-subtitle">
            Join thousands of teachers who are transforming their classrooms with ClassTools.
          </p>
        </div>
        <div class="testimonials-grid">
          <div class="testimonial-card reveal" v-for="(t, idx) in testimonials" :key="t.author" :style="{ transitionDelay: `${idx * 0.1}s` }">
            <div class="testimonial-content">
              <p>"{{ t.quote }}"</p>
            </div>
            <div class="testimonial-author">
              <div class="testimonial-avatar"><ToolIcon :name="t.avatar" :size="27" /></div>
              <div class="testimonial-info">
                <h4>{{ t.author }}</h4>
                <p>{{ t.role }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Team -->
    <section class="team-section section--tinted">
      <div class="container">
        <div class="section-header reveal">
          <span class="section-eyebrow">Our Team</span>
          <h2 class="section-title">Behind the platform</h2>
          <p class="section-subtitle">
            A passionate group of educators, developers, and designers dedicated to transforming education.
          </p>
        </div>
        <div class="team-grid">
          <div class="team-card reveal" v-for="(member, idx) in team" :key="member.name" :style="{ transitionDelay: `${idx * 0.07}s` }">
            <div class="team-avatar">
              <img :src="member.image" :alt="member.name" class="avatar-image" loading="lazy" />
            </div>
            <h3 class="team-name">{{ member.name }}</h3>
            <p class="team-role">{{ member.role }}</p>
            <p class="team-bio">{{ member.bio }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section class="cta">
      <div class="cta-orb cta-orb--1" />
      <div class="cta-orb cta-orb--2" />
      <div class="container">
        <h2 class="cta-title reveal">Ready to Transform Your Classroom?</h2>
        <p class="cta-subtitle reveal">
          Join thousands of educators who are already using ClassTools to create engaging learning experiences.
        </p>
        <div class="cta-actions reveal">
          <RouterLink to="/register" class="btn btn-primary btn-large">Get Started Free</RouterLink>
          <RouterLink to="/tools" class="btn btn-ghost-light btn-large">Explore Tools</RouterLink>
        </div>
      </div>
      <div class="cta-grid" />
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

const features = [
  { icon: 'target', title: 'Easy to Use', desc: 'Intuitive interface designed for educators. No technical skills required — start using tools in seconds.' },
  { icon: 'device', title: 'Works Everywhere', desc: 'Access tools on any device — desktop, tablet, or mobile. Perfect for modern classrooms.' },
  { icon: 'lock', title: 'Safe & Secure', desc: 'Your data is protected with enterprise-grade security. We prioritize student privacy.' },
  { icon: 'bulb', title: 'Constantly Updated', desc: 'Regular new features and improvements based on educator feedback. Always evolving.' },
  { icon: 'globe', title: 'Global Community', desc: 'Join thousands of educators worldwide sharing best practices and success stories.' },
  { icon: 'cap', title: 'Education-Focused', desc: 'Built by educators who understand classroom needs. Every feature serves a purpose.' },
]

const testimonials = [
  { quote: 'ClassTools has completely transformed how I engage my students. The Random Wheel and Student Picker are game-changers!', author: 'Sarah Johnson', role: 'Elementary School Teacher', avatar: 'teacher' },
  { quote: 'The Group Generator saves me so much time. I can create balanced groups in seconds and focus on teaching.', author: 'Michael Chen', role: 'High School Teacher', avatar: 'cap' },
  { quote: 'My students love the educational games! They\'re learning while having fun. Best tool I\'ve ever used.', author: 'Emily Rodriguez', role: 'Middle School Teacher', avatar: 'users' },
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
:root {
  --home-primary: #001f9e;
  --home-accent: #6366f1;
  --home-ink: #0f172a;
  --home-muted: #64748b;
  --home-line: #e2e8f0;
  --home-surface: #ffffff;
  --home-soft: #f8fafc;
}

/* Reveal Animation */
.reveal {
  opacity: 0;
  transform: translateY(28px);
  transition: opacity 0.75s cubic-bezier(0.16, 1, 0.3, 1), transform 0.75s cubic-bezier(0.16, 1, 0.3, 1);
}

.reveal.in-view {
  opacity: 1;
  transform: translateY(0);
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.homepage {
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  color: var(--home-ink);
  background: #ffffff;
  overflow-x: hidden;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
}

.section--tinted {
  background: linear-gradient(to bottom, #f8fafc, #f1f5f9);
}

.section-header {
  text-align: center;
  max-width: 720px;
  margin: 0 auto 56px;
}

/* Hero */
.hero {
  position: relative;
  background: linear-gradient(135deg, #001f9e 0%, #2547bc 50%, #3b5bf6 100%);
  color: white;
  padding: 160px 20px 140px;
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

.hero-orb--3 {
  width: 260px;
  height: 260px;
  background: #c7d2fe;
  top: 40%;
  left: 60%;
  animation: orbFloat 14s ease-in-out infinite alternate;
}

@keyframes orbFloat {
  from { transform: translate(0, 0) scale(1); }
  to { transform: translate(28px, -24px) scale(1.06); }
}

@keyframes gridDrift {
  from { transform: translate(0, 0); }
  to { transform: translate(64px, 64px); }
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
  letter-spacing: -0.03em;
  line-height: 1.1;
  color: #ffffff;
}

.hero-title-highlight {
  background: linear-gradient(135deg, #bfdbfe, #ffffff);
  color: #001f9e;
  padding: 5px 14px;
  border-radius: 12px;
  display: inline;
  transform: skewX(-2deg);
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.12);
  box-decoration-break: clone;
  -webkit-box-decoration-break: clone;
  white-space: normal;
}

.hero-subtitle {
  font-size: 18px;
  line-height: 1.7;
  max-width: 640px;
  margin: 0 auto 40px;
  color: rgba(255, 255, 255, 0.92);
}

.hero-buttons {
  display: inline-flex;
  gap: 16px;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
}

/* Hero experience */
.hero {
  min-height: 670px;
  display: flex;
  align-items: center;
  padding: 108px 20px 90px;
}

.hero-layout {
  position: relative;
  z-index: 1;
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(420px, 0.87fr);
  gap: 54px;
  align-items: center;
}

.hero-content {
  max-width: 650px;
  margin: 0;
  text-align: left;
}

.hero-eyebrow { display: inline-flex; align-items: center; gap: 9px; }
.eyebrow-dot { width: 8px; height: 8px; border-radius: 50%; background: #fbbf24; box-shadow: 0 0 0 5px rgba(251, 191, 36, .16); }

.hero-title { font-size: clamp(45px, 4.8vw, 68px); max-width: 670px; margin-bottom: 24px; }
.hero-title-highlight { display: table; margin-top: 8px; transform: rotate(-1.2deg); }
.hero-subtitle { margin: 0 0 36px; max-width: 575px; font-size: 18px; }
.hero-buttons { justify-content: flex-start; }
.hero-buttons .btn-primary span { margin-left: 9px; font-size: 21px; line-height: 0; transition: transform .25s ease; }
.hero-buttons .btn-primary:hover span { transform: translateX(4px); }


.hero-demo { position: relative; min-height: 410px; display: flex; align-items: center; }
.demo-glow { position: absolute; width: 380px; height: 350px; right: -30px; top: 20px; border-radius: 50%; background: #8b9dff; opacity: .28; filter: blur(52px); animation: demoGlow 4s ease-in-out infinite alternate; }
.demo-window { position: relative; width: 100%; overflow: hidden; border: 1px solid rgba(255,255,255,.35); border-radius: 24px; background: rgba(255,255,255,.96); color: #172554; box-shadow: 0 28px 60px rgba(0, 19, 110, .34), inset 0 1px rgba(255,255,255,.8); transform: rotate(2deg); transition: transform .35s ease; }
.hero-demo:hover .demo-window { transform: rotate(0deg) translateY(-5px); }
.demo-toolbar { display: flex; align-items: center; gap: 6px; height: 43px; padding: 0 16px; background: #eff3ff; border-bottom: 1px solid #dbe4ff; }
.demo-toolbar > span { width: 8px; height: 8px; border-radius: 50%; background: #fda4af; }.demo-toolbar > span:nth-child(2) { background: #fcd34d; }.demo-toolbar > span:nth-child(3) { background: #6ee7b7; }
.demo-toolbar b { margin-left: 8px; font-size: 11px; }.demo-toolbar i { margin-left: auto; padding: 4px 8px; border-radius: 20px; background: #dcfce7; color: #15803d; font-size: 10px; font-style: normal; font-weight: 800; }
.demo-main { padding: 19px 22px 17px; }.demo-topline { display: flex; justify-content: space-between; color: #64748b; font-size: 11px; }.demo-topline strong { font-weight: 700; }
.demo-question { display: flex; align-items: center; gap: 10px; margin: 18px 0; }.demo-question-icon { display: grid; place-items: center; width: 45px; height: 45px; border-radius: 14px; background: linear-gradient(135deg,#ede9fe,#dbeafe); }.demo-question small { display: block; font-size: 9px; font-weight: 800; letter-spacing: .1em; color: #64748b; }.demo-question h3 { margin: 3px 0 0; font-size: 18px; text-transform: capitalize; }.demo-score { margin-left: auto; display: grid; place-items: center; min-width: 42px; height: 31px; border-radius: 9px; color: #4338ca; background: #e0e7ff; font-size: 13px; font-weight: 900; }
.demo-chart { height: 102px; padding: 11px 10px 0; display: flex; align-items: end; gap: 11px; border-radius: 13px; background: repeating-linear-gradient(to bottom, transparent 0 24px, #eef2ff 25px 26px); }.demo-chart i { flex: 1; min-width: 14px; border-radius: 6px 6px 2px 2px; background: linear-gradient(to top, #4f46e5, #818cf8); animation: chartRise .8s cubic-bezier(.16,1,.3,1) both; }.demo-chart i:nth-child(2n) { background: linear-gradient(to top,#06b6d4,#67e8f9); }.demo-chart i:nth-child(2) { animation-delay:.1s }.demo-chart i:nth-child(3) { animation-delay:.2s }.demo-chart i:nth-child(4) { animation-delay:.3s }.demo-chart i:nth-child(5) { animation-delay:.4s }.demo-chart i:nth-child(6) { animation-delay:.5s }
.demo-participants { display:flex; align-items:center; justify-content:space-between; margin-top:15px; font-size:11px; font-weight:700; color:#64748b; }.demo-participants b { color:#22c55e; }.participant-dots { display:flex; }.participant-dots i { width:17px; height:17px; margin-left:-5px; border:2px solid white; border-radius:50%; background:#fda4af; }.participant-dots i:nth-child(2) { background:#a5b4fc; }.participant-dots i:nth-child(3) { background:#67e8f9; }.participant-dots i:nth-child(4) { background:#fde68a; }.participant-dots i:nth-child(5) { background:#86efac; }
.demo-tabs { display: grid; grid-template-columns: repeat(2,1fr); padding: 10px; gap: 7px; border-top: 1px solid #e2e8f0; background: #fafbff; }.demo-tabs button { display:flex; justify-content:center; align-items:center; gap:5px; border:0; border-radius:9px; padding:9px 4px; background:transparent; color:#64748b; font:700 10px inherit; cursor:pointer; transition:.2s ease; }.demo-tabs button:hover,.demo-tabs button.active { background:#e0e7ff; color:#3730a3; }
.floating-card { position:absolute; z-index:2; display:flex; align-items:center; gap:9px; padding:10px 13px; border:1px solid rgba(255,255,255,.55); border-radius:13px; background:rgba(255,255,255,.94); color:#1e3a8a; box-shadow:0 14px 26px rgba(5,24,118,.2); animation: floatCard 3.8s ease-in-out infinite; }.floating-card span:not(.live-dot) { display:flex; flex-direction:column; }.floating-card b { font-size:12px; }.floating-card small { color:#64748b; font-size:9px; font-weight:600; }.floating-card--top { top: -16px; right: -20px; }.floating-card--bottom { bottom: 6px; left: -29px; animation-delay:-1.4s; }.live-dot { width:8px; height:8px; border-radius:50%; background:#22c55e; box-shadow:0 0 0 5px rgba(34,197,94,.14); }
@keyframes floatCard { 50% { transform: translateY(-9px); } } @keyframes demoGlow { to { transform:scale(1.12); opacity:.4; } } @keyframes chartRise { from { transform:scaleY(.1); transform-origin:bottom; } to { transform:scaleY(1); transform-origin:bottom; } }

/* Shared */
.section-title {
  font-size: 40px;
  font-weight: 830;
  color: var(--home-ink);
  margin-bottom: 16px;
  letter-spacing: -0.03em;
  line-height: 1.15;
}

.section-subtitle {
  color: var(--home-muted);
  font-size: 17px;
  max-width: 700px;
  margin: 0 auto 48px;
  line-height: 1.7;
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
  margin-bottom: 16px;
}

/* Buttons */
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
  position: relative;
  z-index: 1;
}

.btn-large {
  padding: 16px 32px;
  font-size: 16px;
  border-radius: 14px;
}

.btn-primary {
  background: linear-gradient(135deg, #ffffff 0%, #eef2ff 100%);
  color: #001f9e;
  box-shadow: 0 10px 24px rgba(0, 31, 158, 0.25);
}

.btn-primary:hover {
  transform: translateY(-3px);
  box-shadow: 0 16px 32px rgba(0, 31, 158, 0.35);
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

/* Tools Section */
.featured-tools {
  padding: 40px 24px 40px;
  background: linear-gradient(to bottom, #f8fafc, #f1f5f9);
}

.tools-content {
  padding: 80px 24px;
}

.tools-content .container {
  max-width: 1400px;
}

.categories-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(280px, 1fr));
  gap: 24px;
}

.category-card {
  background: white;
  border-radius: 20px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04);
  overflow: hidden;
  transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
}

.category-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 22px 42px rgba(0, 31, 158, 0.12);
  border-color: #cbd5e1;
}

.category-card-inner {
  padding: 24px;
}

.category-title {
  font-size: 18px;
  font-weight: 800;
  color: #0f172a;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 2px solid #e2e8f0;
  display: flex;
  align-items: center;
  gap: 10px;
  letter-spacing: -0.01em;
}

.category-icon {
  font-size: 24px;
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
  padding: 12px;
  border-radius: 12px;
  text-decoration: none;
  color: #1e293b;
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  border: 1px solid transparent;
  background: transparent;
  position: relative;
}

.category-tool-link::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.06), rgba(139, 92, 246, 0.06));
  opacity: 0;
  transition: opacity 0.25s ease;
  border-radius: 12px;
}

.category-tool-link:hover {
  transform: translateX(6px);
  border-color: #e2e8f0;
  background: white;
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.04);
}

.category-tool-link:hover::before {
  opacity: 1;
}

.category-tool-icon {
  font-size: 22px;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f5f7ff 0%, #e5ecff 55%, #f5edff 100%);
  border-radius: 10px;
  border: 1px solid rgba(129, 140, 248, 0.12);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.9), 0 4px 10px rgba(99, 102, 241, 0.09);
  flex-shrink: 0;
  transition: transform 0.25s ease;
  position: relative;
}

.category-tool-link:hover .category-tool-icon {
  transform: scale(1.08) rotate(3deg);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.95), 0 6px 16px rgba(99, 102, 241, 0.18);
}

.category-tool-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  flex: 1;
  position: relative;
}

.category-tool-title {
  font-weight: 700;
  font-size: 14px;
  color: #0f172a;
  letter-spacing: -0.01em;
}

.category-tool-desc {
  font-size: 12px;
  color: #64748b;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-orientation: vertical;
  overflow: hidden;
}

/* About Section */
.about-section {
  padding: 100px 20px;
  background: white;
}

.about-content {
  display: grid;
  grid-template-columns: 1.1fr 0.9fr;
  gap: 72px;
  align-items: center;
  margin-top: 8px;
}

.about-text .text-block {
  margin-bottom: 20px;
}

.about-text p {
  color: #475569;
  font-size: 16.5px;
  line-height: 1.85;
}

.about-stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 18px;
}

.stat-item {
  text-align: center;
  padding: 32px 20px;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-radius: 20px;
  border: 1px solid #e2e8f0;
  transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
  position: relative;
  overflow: hidden;
}

.stat-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, var(--home-primary), var(--home-accent));
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1);
}

.stat-item:hover {
  transform: translateY(-6px);
  box-shadow: 0 18px 36px rgba(0, 31, 158, 0.1);
  border-color: #cbd5e1;
}

.stat-item:hover::before {
  transform: scaleX(1);
}

.stat-value {
  font-size: 44px;
  font-weight: 830;
  color: var(--home-primary);
  margin-bottom: 8px;
  letter-spacing: -0.03em;
}

.stat-label {
  font-size: 14px;
  color: var(--home-muted);
  font-weight: 600;
  letter-spacing: 0.02em;
}

.about-visual {
  display: flex;
  align-items: center;
  justify-content: center;
}

.visual-card {
  background: linear-gradient(135deg, #f5f7ff 0%, #e5ecff 100%);
  border-radius: 24px;
  padding: 40px 32px;
  border: 1px solid rgba(129, 140, 248, 0.15);
  box-shadow: 0 12px 32px rgba(99, 102, 241, 0.12);
  width: 100%;
  max-width: 400px;
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  position: relative;
  overflow: hidden;
}

.visual-card:hover {
  transform: translateY(-8px) rotate(2deg);
  box-shadow: 0 20px 48px rgba(99, 102, 241, 0.2);
}

.visual-card::before {
  content: '';
  position: absolute;
  top: -50%;
  right: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(99, 102, 241, 0.1) 0%, transparent 70%);
  animation: rotateGlow 8s linear infinite;
}

@keyframes rotateGlow {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.visual-icon {
  width: 80px;
  height: 80px;
  margin: 0 auto 24px;
  background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 10px 28px rgba(99, 102, 241, 0.3);
  animation: iconPulse 3s ease-in-out infinite;
  position: relative;
  z-index: 1;
}

@keyframes iconPulse {
  0%, 100% {
    transform: scale(1) rotate(0deg);
  }
  50% {
    transform: scale(1.05) rotate(3deg);
  }
}

.visual-content h3 {
  font-size: 22px;
  font-weight: 800;
  color: var(--home-primary);
  margin-bottom: 20px;
  text-align: center;
  letter-spacing: -0.01em;
  position: relative;
  z-index: 1;
}

.impact-items {
  display: flex;
  flex-direction: column;
  gap: 14px;
  position: relative;
  z-index: 1;
}

.impact-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  background: white;
  border-radius: 12px;
  border: 1px solid rgba(129, 140, 248, 0.1);
  transition: all 0.3s ease;
  cursor: default;
  position: relative;
  overflow: hidden;
}

.impact-item::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  transform: scaleY(0);
  transition: transform 0.3s ease;
}

.impact-item:hover::before {
  transform: scaleY(1);
}

.impact-item:hover {
  transform: translateX(6px);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.15);
  border-color: rgba(129, 140, 248, 0.3);
}

.impact-icon {
  font-size: 24px;
  flex-shrink: 0;
  animation: iconBounce 2s ease-in-out infinite;
  position: relative;
  z-index: 1;
}

.impact-item:nth-child(1) .impact-icon { animation-delay: 0s; }
.impact-item:nth-child(2) .impact-icon { animation-delay: 0.3s; }
.impact-item:nth-child(3) .impact-icon { animation-delay: 0.6s; }
.impact-item:nth-child(4) .impact-icon { animation-delay: 0.9s; }

@keyframes iconBounce {
  0%, 100% {
    transform: translateY(0) scale(1);
  }
  50% {
    transform: translateY(-4px) scale(1.1);
  }
}

.impact-text {
  font-size: 14px;
  font-weight: 600;
  color: var(--home-ink);
  letter-spacing: -0.01em;
  position: relative;
  z-index: 1;
}

.floating-shapes {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
  z-index: 0;
}

.floating-shape {
  position: absolute;
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(139, 92, 246, 0.2));
  border-radius: 50%;
  animation: floatShape 6s ease-in-out infinite;
}

.floating-shape:nth-child(1) {
  width: 60px;
  height: 60px;
  top: 10%;
  right: 10%;
  animation-delay: 0s;
}

.floating-shape:nth-child(2) {
  width: 40px;
  height: 40px;
  bottom: 20%;
  left: 5%;
  animation-delay: 2s;
}

.floating-shape:nth-child(3) {
  width: 50px;
  height: 50px;
  top: 50%;
  right: 5%;
  animation-delay: 4s;
}

@keyframes floatShape {
  0%, 100% {
    transform: translateY(0) scale(1);
    opacity: 0.3;
  }
  50% {
    transform: translateY(-20px) scale(1.2);
    opacity: 0.6;
  }
}

/* Features */
.features-section {
  padding: 100px 20px;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
  margin-top: 12px;
}

.feature-card {
  background: white;
  border-radius: 22px;
  padding: 36px;
  text-align: center;
  border: 1px solid var(--home-line);
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04);
  transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
  position: relative;
  overflow: hidden;
}

.feature-card::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.05), rgba(139, 92, 246, 0.05));
  opacity: 0;
  transition: opacity 0.35s ease;
}

.feature-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 22px 42px rgba(0, 31, 158, 0.12);
  border-color: #cbd5e1;
}

.feature-card:hover::before {
  opacity: 1;
}

.feature-icon {
  width: 68px;
  height: 68px;
  margin: 0 auto 18px;
  display: grid;
  place-items: center;
  background: linear-gradient(135deg, #f5f7ff 0%, #e5ecff 55%, #f5edff 100%);
  border: 1px solid rgba(129, 140, 248, 0.12);
  border-radius: 20px;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, .9), 0 10px 20px rgba(99, 102, 241, .1);
  transition: transform 0.35s ease;
  position: relative;
}

.feature-card:hover .feature-icon {
  transform: scale(1.12) translateY(-4px);
}

.feature-card h3 {
  font-size: 20px;
  font-weight: 800;
  margin-bottom: 12px;
  color: var(--home-ink);
  position: relative;
  letter-spacing: -0.01em;
}

.feature-card p {
  color: var(--home-muted);
  font-size: 14px;
  line-height: 1.75;
  position: relative;
}

/* Testimonials */
.testimonials-section {
  padding: 100px 20px;
  background: white;
}

.testimonials-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
  margin-top: 12px;
}

.testimonial-card {
  background: white;
  border-radius: 22px;
  padding: 36px;
  border: 1px solid var(--home-line);
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04);
  transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
  position: relative;
  overflow: hidden;
}

.testimonial-card::before {
  content: '"';
  position: absolute;
  top: 20px;
  right: 28px;
  font-size: 120px;
  font-weight: 900;
  color: rgba(99, 102, 241, 0.06);
  line-height: 1;
  transition: color 0.35s ease;
}

.testimonial-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 22px 42px rgba(0, 31, 158, 0.12);
  border-color: #cbd5e1;
}

.testimonial-card:hover::before {
  color: rgba(99, 102, 241, 0.12);
}

.testimonial-content {
  margin-bottom: 24px;
  position: relative;
}

.testimonial-content p {
  color: #475569;
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
  background: linear-gradient(135deg, #f5f7ff 0%, #e5ecff 55%, #f5edff 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  border: 1px solid #e2e8f0;
  transition: transform 0.35s ease;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, .9), 0 6px 14px rgba(99, 102, 241, .1);
}

.testimonial-card:hover .testimonial-avatar {
  transform: scale(1.08);
}

.testimonial-info h4 {
  font-size: 16px;
  font-weight: 800;
  color: var(--home-ink);
  margin-bottom: 4px;
}

.testimonial-info p {
  font-size: 14px;
  color: var(--home-muted);
  margin: 0;
}

/* Team */
.team-section {
  padding: 100px 20px;
}

.team-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 24px;
  margin-top: 12px;
}

.team-card {
  background: white;
  border-radius: 22px;
  padding: 32px;
  text-align: center;
  border: 1px solid var(--home-line);
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
  background: linear-gradient(90deg, var(--home-primary), var(--home-accent));
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
  background: linear-gradient(135deg, #eaf0ff, #dbeafe);
  padding: 4px;
  transition: transform 0.35s ease;
}

.team-card:hover .team-avatar {
  transform: scale(1.05);
}

.avatar-image {
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
  color: var(--home-ink);
}

.team-role {
  font-size: 12px;
  font-weight: 800;
  color: var(--home-primary);
  margin-bottom: 10px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.team-bio {
  color: var(--home-muted);
  font-size: 13.5px;
  line-height: 1.6;
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
  font-size: 40px;
  font-weight: 830;
  margin-bottom: 18px;
  letter-spacing: -0.02em;
  position: relative;
}

.cta-subtitle {
  font-size: 17px;
  max-width: 600px;
  margin: 0 auto 36px;
  color: rgba(255, 255, 255, 0.9);
  line-height: 1.7;
  position: relative;
}

.cta-actions {
  display: inline-flex;
  gap: 16px;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  position: relative;
}

@media (max-width: 1024px) {
  .hero-layout { gap: 32px; grid-template-columns: minmax(0, 1fr) minmax(355px, .82fr); }
  .hero-title { font-size: 48px; }
  .floating-card--top { right: -6px; }
  .floating-card--bottom { left: -8px; }

  .about-content {
    gap: 48px;
  }

  .categories-grid {
    grid-template-columns: repeat(2, 1fr);
    max-width: 800px;
    margin: 0 auto;
  }
}

@media (max-width: 860px) {
  .hero {
    padding: 112px 20px 84px;
    min-height: auto;
  }

  .hero-layout { grid-template-columns: 1fr; max-width: 620px; gap: 42px; }
  .hero-content { text-align: center; margin: 0 auto; }
  .hero-title-highlight { margin-left: auto; margin-right: auto; }
  .hero-subtitle { margin-left: auto; margin-right: auto; }
  .hero-buttons { justify-content: center; }
  .hero-trust { justify-content: center; text-align: left; }
  .hero-demo { max-width: 520px; width: 100%; min-height: 360px; margin: 0 auto; }

  .section-title {
    font-size: 30px;
  }

  .about-content {
    grid-template-columns: 1fr;
  }

.categories-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.tools-content .container {
  max-width: 1400px;
}

  .section {
    padding: 80px 18px;
  }
}

@media (max-width: 640px) {
  .hero-title {
    font-size: 38px;
  }

  .hero-title-highlight { display: inline-block; }
  .hero-demo { min-height: 300px; }
  .demo-main { padding: 15px; }
  .floating-card--top { top: -13px; right: -5px; }
  .floating-card--bottom { bottom: -8px; left: -4px; }
  .floating-card--bottom b { font-size: 10px; }
  .demo-tabs button { font-size: 9px; }

  .hero-buttons {
    flex-direction: column;
    align-items: stretch;
  }

  .btn-large {
    width: 100%;
  }

  .features-grid {
    grid-template-columns: 1fr;
  }

  .about-stats {
    grid-template-columns: 1fr;
  }

  .cta-actions {
    flex-direction: column;
    align-items: stretch;
  }

  .cta-title {
    font-size: 32px;
  }
}
</style>
