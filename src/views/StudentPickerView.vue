<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

interface FeatureCard {
  title: string
  description: string
  gradient: string
  icon: string
  actionLabel: string
  route?: string
  isLive?: boolean
}

const features: FeatureCard[] = [
  {
    title: 'Single Student Picker',
    description: 'Pick one random student from the class with animated reveal effects and celebration.',
    gradient: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    icon: 'single',
    actionLabel: 'Pick Random',
    route: '/single-student-picker',
    isLive: true,
  },
  {
    title: 'Multiple Student Picker',
    description: 'Select several students at once for group activities or team assignments.',
    gradient: 'linear-gradient(135deg, #ec4899, #f472b6)',
    icon: 'multiple',
    actionLabel: 'Pick Selected',
    route: '/multiple-student-picker',
    isLive: true,
  },
  {
    title: 'Lucky Draw',
    description: 'A spinning wheel or raffle-style picker for exciting classroom moments.',
    gradient: 'linear-gradient(135deg, #f59e0b, #f97316)',
    icon: 'lucky',
    actionLabel: 'Spin!',
    route: '/lucky-draw',
    isLive: true,
  },
  {
    title: 'Card Picker',
    description: 'Flip through student cards with a visually interactive picker — tap to select.',
    gradient: 'linear-gradient(135deg, #14b8a6, #06b6d4)',
    icon: 'card',
    actionLabel: 'Pick Cards',
    route: '/card-picker',
    isLive: true,
  },
  {
    title: 'Image Picker',
    description: 'Pick students by their photos or avatars displayed in a visual grid layout.',
    gradient: 'linear-gradient(135deg, #22c55e, #10b981)',
    icon: 'image',
    actionLabel: 'Pick Image',
  },
]

function openFeature(feature: FeatureCard) {
  if (feature.route) {
    router.push(feature.route)
  }
}
</script>

<template>
  <div class="dashboard">
    <!-- Header -->
    <header class="header">
      <div class="header__inner">
        <div class="header__icon-wrap">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <span class="header__icon-glow"></span>
        </div>
        <div>
          <h1 class="header__title">Student Picker</h1>
          <p class="header__subtitle">Choose a picker mode below to get started.</p>
        </div>
        <div class="header__badge">
          <span class="header__badge-dot"></span>
          <span class="header__badge-text">Classroom Tools</span>
        </div>
      </div>
      <div class="header__gradient"></div>
    </header>

    <!-- Feature Grid -->
    <main class="main">
      <div class="grid">
        <article
          v-for="feature in features"
          :key="feature.title"
          class="card"
          :class="{ 'card--live': feature.isLive }"
          @click="openFeature(feature)"
        >
          <div class="card__header" :style="{ background: feature.gradient }">
            <div class="card__icon">
              <svg v-if="feature.icon === 'single'" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <line x1="19" y1="8" x2="19" y2="14" />
                <line x1="22" y1="11" x2="16" y2="11" />
              </svg>
              <svg v-else-if="feature.icon === 'multiple'" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              <svg v-else-if="feature.icon === 'lucky'" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 2v4" />
                <path d="M12 18v4" />
                <path d="M2 12h4" />
                <path d="M18 12h4" />
                <path d="m4.93 4.93 2.83 2.83" />
                <path d="m16.24 16.24 2.83 2.83" />
                <path d="m4.93 19.07 2.83-2.83" />
                <path d="m16.24 7.76 2.83-2.83" />
                <path d="M12 6a6 6 0 1 0 0 12 6 6 0 0 0 0-12Z" />
                <path d="M12 10a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z" />
              </svg>
              <svg v-else-if="feature.icon === 'card'" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                <line x1="3" y1="9" x2="21" y2="9" />
                <line x1="9" y1="3" x2="9" y2="21" />
                <line x1="15" y1="3" x2="15" y2="21" />
                <line x1="3" y1="15" x2="21" y2="15" />
              </svg>
              <svg v-else-if="feature.icon === 'image'" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                <circle cx="9" cy="9" r="2" />
                <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
              </svg>
            </div>
            <div class="card__badge" :class="{ 'card__badge--live': feature.isLive }">
              {{ feature.isLive ? 'Live' : 'Preview' }}
            </div>
          </div>

          <div class="card__preview">
            <div v-if="feature.icon === 'single'" class="preview preview--single">
              <div class="preview__avatar">A</div>
              <div class="preview__name">Alice Johnson</div>
            </div>
            <div v-else-if="feature.icon === 'multiple'" class="preview preview--multiple">
              <label class="preview__row"><input type="checkbox" checked disabled /><span>Alice</span></label>
              <label class="preview__row"><input type="checkbox" disabled /><span>Bob</span></label>
              <label class="preview__row"><input type="checkbox" checked disabled /><span>Charlie</span></label>
              <label class="preview__row"><input type="checkbox" disabled /><span>Diana</span></label>
            </div>
            <div v-else-if="feature.icon === 'lucky'" class="preview preview--lucky">
              <div class="preview__wheel">
                <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="1.5">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 2v4" /><path d="M12 18v4" />
                  <path d="M2 12h4" /><path d="M18 12h4" />
                  <path d="m4.93 4.93 2.83 2.83" />
                  <path d="m16.24 16.24 2.83 2.83" />
                  <path d="m4.93 19.07 2.83-2.83" />
                  <path d="m16.24 7.76 2.83-2.83" />
                </svg>
              </div>
              <div class="preview__wheel-arrow">▼</div>
            </div>
            <div v-else-if="feature.icon === 'card'" class="preview preview--card">
              <div class="preview__card-stack">
                <div class="preview__card-item" style="--i: 0">?</div>
                <div class="preview__card-item" style="--i: 1">?</div>
                <div class="preview__card-item" style="--i: 2">?</div>
              </div>
            </div>
            <div v-else-if="feature.icon === 'image'" class="preview preview--image">
              <div class="preview__image-grid">
                <div class="preview__img" style="background:#6366f1">A</div>
                <div class="preview__img" style="background:#ec4899">B</div>
                <div class="preview__img" style="background:#22c55e">C</div>
                <div class="preview__img" style="background:#f59e0b">D</div>
              </div>
            </div>
          </div>

          <div class="card__body">
            <h2 class="card__title">{{ feature.title }}</h2>
            <p class="card__desc">{{ feature.description }}</p>
          </div>

          <div class="card__action" v-if="feature.route">
            <div class="card__btn">{{ feature.actionLabel }}</div>
          </div>

          <div class="card__footer">
            <span class="card__status">{{ feature.isLive ? 'Click to Open' : 'Coming Soon' }}</span>
            <svg class="card__arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </div>
        </article>
      </div>
    </main>
  </div>
</template>

<style scoped>
.dashboard {
  min-height: 100vh;
  background: #ffffff;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  padding-top: 64px;
}

.header {
  position: relative;
  background: #0f172a;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  overflow: hidden;
}

.header {
  position: relative;
  background: #0f172a;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  overflow: hidden;
}

.header__inner {
  position: relative;
  z-index: 1;
  max-width: 72rem;
  margin: 0 auto;
  padding: 2.5rem 2rem 2.75rem;
  display: flex;
  align-items: center;
  gap: 1.25rem;
}

.header__icon-wrap {
  position: relative;
  width: 4rem;
  height: 4rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: white;
  border-radius: 1.1rem;
  flex-shrink: 0;
  box-shadow: 0 20px 40px rgba(99, 102, 241, 0.35);
}

.header__icon-glow {
  position: absolute;
  inset: -8px;
  background: radial-gradient(circle, rgba(99, 102, 241, 0.55), transparent 65%);
  opacity: 0;
  transition: opacity 0.3s ease;
  border-radius: inherit;
  pointer-events: none;
}

.header:hover .header__icon-glow {
  opacity: 1;
}

.header__title {
  font-size: 2rem;
  font-weight: 800;
  color: #f8fafc;
  margin: 0;
  line-height: 1.1;
  letter-spacing: -0.03em;
}

.header__subtitle {
  margin: 0.4rem 0 0;
  color: #94a3b8;
  font-size: 1rem;
  line-height: 1.45;
}

.header__badge {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.55rem 1rem;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 999px;
  color: #cbd5e1;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  backdrop-filter: blur(8px);
}

.header__badge-dot {
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 50%;
  background: #22c55e;
  box-shadow: 0 0 10px rgba(34, 197, 94, 0.7);
}

.header__gradient {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(99, 102, 241, 0.5), transparent);
}

.header__inner {
  max-width: 72rem;
  margin: 0 auto;
  padding: 2.25rem 2rem;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.header__icon-wrap {
  width: 3rem;
  height: 3rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: white;
  border-radius: 0.75rem;
  flex-shrink: 0;
  box-shadow: 0 8px 20px rgba(99, 102, 241, 0.35);
}

.header__title {
  font-size: 1.5rem;
  font-weight: 800;
  color: #f8fafc;
  margin: 0;
  line-height: 1.2;
  letter-spacing: -0.02em;
}

.header__subtitle {
  margin: 0.25rem 0 0;
  color: #94a3b8;
  font-size: 0.9rem;
  line-height: 1.5;
}

.main {
  max-width: 72rem;
  margin: 0 auto;
  padding: 2rem;
}

@media (max-width: 640px) {
  .header__inner {
    padding: 1.5rem 1rem;
    flex-wrap: wrap;
  }

  .header__icon-wrap {
    width: 3.25rem;
    height: 3.25rem;
  }

  .header__title {
    font-size: 1.5rem;
  }

  .header__subtitle {
    font-size: 0.9rem;
  }

  .header__badge {
    margin-left: 0;
    width: 100%;
    justify-content: center;
    margin-top: 0.5rem;
  }

  .main {
    padding: 1.25rem 1rem 2rem;
  }

  .grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
}

.card {
  display: flex;
  flex-direction: column;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 1.25rem;
  overflow: hidden;
  transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
}

.card:hover {
  transform: translateY(-6px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.08), 0 4px 12px rgba(0, 0, 0, 0.04);
  border-color: #cbd5e1;
}

.card:hover .card__arrow {
  transform: translateX(3px);
}

.card:hover .card__action .card__btn {
  transform: translateY(-1px) scale(1.03);
}

.card__header {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  min-height: 5.5rem;
}

.card__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 3.25rem;
  height: 3.25rem;
  background: rgba(255, 255, 255, 0.22);
  border-radius: 0.9rem;
  backdrop-filter: blur(4px);
}

.card__badge {
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  font-size: 0.6rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  padding: 0.3rem 0.65rem;
  background: rgba(255, 255, 255, 0.28);
  color: rgba(255, 255, 255, 0.95);
  border-radius: 999px;
  backdrop-filter: blur(6px);
}

.card__badge--live {
  background: #22c55e;
  color: white;
}

.card__preview {
  padding: 1rem 1.25rem;
  background: #f8fafc;
  border-top: 1px solid #f1f5f9;
  border-bottom: 1px solid #f1f5f9;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 5rem;
}

.preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  width: 100%;
}

.preview--single {
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.5rem;
}

.preview__avatar {
  width: 2.25rem;
  height: 2.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: white;
  border-radius: 50%;
  font-weight: 700;
  font-size: 0.75rem;
}

.preview__name {
  font-size: 0.9rem;
  font-weight: 600;
  color: #334155;
  flex: 1;
  min-width: 5rem;
}

.preview--multiple {
  align-items: stretch;
}

.preview__row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8rem;
  color: #475569;
  cursor: default;
}

.preview__row input[type="checkbox"] {
  accent-color: #ec4899;
  width: 0.9rem;
  height: 0.9rem;
  pointer-events: none;
}

.preview--lucky {
  position: relative;
}

.preview__wheel {
  animation: spin-slow 4s linear infinite;
}

.preview__wheel-arrow {
  position: absolute;
  top: -4px;
  font-size: 0.85rem;
  color: #f59e0b;
  animation: bounce-arrow 1s ease-in-out infinite;
}

@keyframes spin-slow {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes bounce-arrow {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(3px); }
}

.preview--card {
  position: relative;
}

.preview__card-stack {
  display: flex;
  justify-content: center;
  padding: 0.25rem 0;
}

.preview__card-item {
  width: 2.2rem;
  height: 3rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  border: 2px solid #14b8a6;
  border-radius: 0.4rem;
  font-weight: 800;
  font-size: 0.85rem;
  color: #14b8a6;
  margin-left: calc(var(--i) * -0.65rem);
  box-shadow: 0 2px 4px rgba(0,0,0,0.06);
  transition: transform 0.2s ease;
}

.card:hover .preview__card-item {
  animation: fan-out 2s ease-in-out infinite alternate;
}

.preview__card-item:nth-child(1) { animation-delay: 0s; }
.preview__card-item:nth-child(2) { animation-delay: 0.1s; }
.preview__card-item:nth-child(3) { animation-delay: 0.2s; }

@keyframes fan-out {
  from { transform: rotate(0deg) translateY(0); }
  to { transform: rotate(5deg) translateY(-3px); }
}

.preview__image-grid {
  display: flex;
  gap: 0.4rem;
}

.preview__img {
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  border-radius: 0.4rem;
  font-size: 0.55rem;
  font-weight: 700;
  transition: transform 0.2s ease;
}

.card:hover .preview__img {
  transform: scale(1.1);
}

.card:hover .preview__img:nth-child(2) { transition-delay: 0.05s; }
.card:hover .preview__img:nth-child(3) { transition-delay: 0.1s; }
.card:hover .preview__img:nth-child(4) { transition-delay: 0.15s; }

.card__body {
  padding: 1.1rem 1.25rem 0.75rem;
  flex: 1;
}

.card__title {
  font-size: 1.05rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 0.35rem;
  line-height: 1.3;
}

.card__desc {
  font-size: 0.8rem;
  color: #64748b;
  margin: 0;
  line-height: 1.55;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-orient: vertical;
  overflow: hidden;
}

.card__action {
  display: flex;
  justify-content: center;
  padding: 0 1.25rem 0.85rem;
}

.card__btn {
  font-size: 0.85rem;
  font-weight: 600;
  padding: 0.55rem 1.5rem;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: white;
  border-radius: 999px;
  white-space: nowrap;
  text-align: center;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.card:hover .card__btn {
  transform: translateY(-1px) scale(1.03);
  box-shadow: 0 8px 18px rgba(99, 102, 241, 0.45);
}

.card__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.65rem 1.25rem;
  border-top: 1px solid #f1f5f9;
}

.card__status {
  font-size: 0.65rem;
  color: #94a3b8;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.card__arrow {
  color: #94a3b8;
  transition: transform 0.2s ease;
}

.main {
  max-width: 72rem;
  margin: 0 auto;
  padding: 2rem;
}

@media (max-width: 640px) {
  .header__inner {
    padding: 1.5rem 1rem;
    flex-wrap: wrap;
  }

  .header__icon-wrap {
    width: 3.25rem;
    height: 3.25rem;
  }

  .header__title {
    font-size: 1.5rem;
  }

  .header__subtitle {
    font-size: 0.9rem;
  }

  .header__badge {
    margin-left: 0;
    width: 100%;
    justify-content: center;
    margin-top: 0.5rem;
  }

  .main {
    padding: 1.25rem 1rem 2rem;
  }

  .grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
}
</style>
