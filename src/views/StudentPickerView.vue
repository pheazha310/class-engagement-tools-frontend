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
  },
  {
    title: 'Lucky Draw',
    description: 'A spinning wheel or raffle-style picker for exciting classroom moments.',
    gradient: 'linear-gradient(135deg, #f59e0b, #f97316)',
    icon: 'lucky',
    actionLabel: 'Spin!',
  },
  {
    title: 'Card Picker',
    description: 'Flip animated cards to reveal selected students with a game-like feel.',
    gradient: 'linear-gradient(135deg, #14b8a6, #06b6d4)',
    icon: 'card',
    actionLabel: 'Flip Card',
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
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
        </div>
        <div>
          <h1 class="header__title">Student Picker</h1>
          <p class="header__subtitle">
            Choose a picker mode below to get started with classroom engagement tools.
          </p>
        </div>
      </div>
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
          <!-- Card header with gradient icon -->
          <div class="card__header" :style="{ background: feature.gradient }">
            <div class="card__icon">
              <!-- Single Student Picker icon -->
              <svg v-if="feature.icon === 'single'" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <line x1="19" y1="8" x2="19" y2="14" />
                <line x1="22" y1="11" x2="16" y2="11" />
              </svg>
              <!-- Multiple Student Picker icon -->
              <svg v-else-if="feature.icon === 'multiple'" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              <!-- Lucky Draw icon -->
              <svg v-else-if="feature.icon === 'lucky'" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
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
              <!-- Card Picker icon -->
              <svg v-else-if="feature.icon === 'card'" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                <line x1="3" y1="9" x2="21" y2="9" />
                <line x1="9" y1="3" x2="9" y2="21" />
                <line x1="15" y1="3" x2="15" y2="21" />
                <line x1="3" y1="15" x2="21" y2="15" />
              </svg>
              <!-- Image Picker icon -->
              <svg v-else-if="feature.icon === 'image'" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                <circle cx="9" cy="9" r="2" />
                <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
              </svg>
            </div>
            <div class="card__badge" :class="{ 'card__badge--live': feature.isLive }">
              {{ feature.isLive ? 'Live' : 'Preview' }}
            </div>
          </div>

          <!-- Preview area showing mockup UI -->
          <div class="card__preview">
            <!-- Single Student Picker preview -->
            <div v-if="feature.icon === 'single'" class="preview preview--single">
              <div class="preview__avatar">A</div>
              <div class="preview__name">Alice Johnson</div>
            </div>

            <!-- Multiple Student Picker preview -->
            <div v-else-if="feature.icon === 'multiple'" class="preview preview--multiple">
              <label class="preview__row"><input type="checkbox" checked disabled /><span>Alice</span></label>
              <label class="preview__row"><input type="checkbox" disabled /><span>Bob</span></label>
              <label class="preview__row"><input type="checkbox" checked disabled /><span>Charlie</span></label>
              <label class="preview__row"><input type="checkbox" disabled /><span>Diana</span></label>
            </div>

            <!-- Lucky Draw preview -->
            <div v-else-if="feature.icon === 'lucky'" class="preview preview--lucky">
              <div class="preview__wheel">
                <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="1.5">
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

            <!-- Card Picker preview -->
            <div v-else-if="feature.icon === 'card'" class="preview preview--card">
              <div class="preview__card-stack">
                <div class="preview__card-item" style="--i: 0">?</div>
                <div class="preview__card-item" style="--i: 1">?</div>
                <div class="preview__card-item" style="--i: 2">?</div>
              </div>
            </div>

            <!-- Image Picker preview -->
            <div v-else-if="feature.icon === 'image'" class="preview preview--image">
              <div class="preview__image-grid">
                <div class="preview__img" style="background:#6366f1">A</div>
                <div class="preview__img" style="background:#ec4899">B</div>
                <div class="preview__img" style="background:#22c55e">C</div>
                <div class="preview__img" style="background:#f59e0b">D</div>
              </div>
            </div>
          </div>

          <!-- Card body -->
          <div class="card__body">
            <h2 class="card__title">{{ feature.title }}</h2>
            <p class="card__desc">{{ feature.description }}</p>
          </div>

          <!-- Centered action button -->
          <div class="card__action">
            <div class="card__btn">{{ feature.actionLabel }}</div>
          </div>

          <!-- Card footer -->
          <div class="card__footer">
            <span class="card__status">{{ feature.isLive ? 'Click to Open' : 'Coming Soon' }}</span>
            <svg class="card__arrow" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
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
  background: #f8fafc;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

/* ── Header ── */
.header {
  background: white;
  border-bottom: 1px solid #e2e8f0;
}

.header__inner {
  max-width: 72rem;
  margin: 0 auto;
  padding: 2.5rem 2rem;
  display: flex;
  align-items: flex-start;
  gap: 1rem;
}

.header__icon-wrap {
  width: 3.5rem;
  height: 3.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: white;
  border-radius: 1rem;
  flex-shrink: 0;
}

.header__title {
  font-size: 1.75rem;
  font-weight: 800;
  color: #0f172a;
  margin: 0;
  line-height: 1.2;
}

.header__subtitle {
  margin: 0.35rem 0 0;
  color: #64748b;
  font-size: 0.95rem;
  line-height: 1.5;
}

/* ── Main ── */
.main {
  max-width: 72rem;
  margin: 0 auto;
  padding: 2rem;
}

/* ── Grid ── */
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.25rem;
}

/* ── Card ── */
.card {
  display: flex;
  flex-direction: column;
  background: white;
  border-radius: 1rem;
  border: 1px solid #e2e8f0;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
}

.card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.08), 0 4px 8px rgba(0, 0, 0, 0.04);
  border-color: #cbd5e1;
}

.card:hover .card__arrow {
  transform: translateX(3px);
}

/* Card header */
.card__header {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  min-height: 6rem;
}

.card__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 3.5rem;
  height: 3.5rem;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 1rem;
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
  padding: 0.25rem 0.6rem;
  background: rgba(255, 255, 255, 0.25);
  color: rgba(255, 255, 255, 0.9);
  border-radius: 0.4rem;
  backdrop-filter: blur(4px);
}

.card__badge--live {
  background: rgba(34, 197, 94, 0.7);
  color: white;
}

/* Preview area */
.card__preview {
  padding: 0.75rem 1rem;
  background: #fafafa;
  border-bottom: 1px solid #f1f5f9;
  display: flex;
  justify-content: center;
}

.preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  width: 100%;
}

/* Single picker preview */
.preview--single {
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.5rem;
}

.preview__avatar {
  width: 2rem;
  height: 2rem;
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
  font-size: 0.85rem;
  font-weight: 600;
  color: #334155;
  flex: 1;
  min-width: 5rem;
}

/* Multiple picker preview */
.preview--multiple {
  align-items: stretch;
}

.preview__row {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.75rem;
  color: #475569;
  cursor: default;
}

.preview__row input[type="checkbox"] {
  accent-color: #ec4899;
  width: 0.8rem;
  height: 0.8rem;
  pointer-events: none;
}

/* Lucky draw preview */
.preview--lucky {
  position: relative;
}

.preview__wheel {
  animation: spin-slow 4s linear infinite;
}

.preview__wheel-arrow {
  position: absolute;
  top: -2px;
  font-size: 0.8rem;
  color: #f59e0b;
  animation: bounce-arrow 1s ease-in-out infinite;
}

@keyframes spin-slow {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@keyframes bounce-arrow {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(3px); }
}

/* Card picker preview */
.preview--card {
  position: relative;
}

.preview__card-stack {
  display: flex;
  justify-content: center;
  padding: 0.25rem 0;
}

.preview__card-item {
  width: 2rem;
  height: 2.8rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  border: 2px solid #14b8a6;
  border-radius: 0.35rem;
  font-weight: 800;
  font-size: 0.8rem;
  color: #14b8a6;
  margin-left: calc(var(--i) * -0.6rem);
  box-shadow: 0 1px 3px rgba(0,0,0,0.08);
  transition: transform 0.2s ease;
}

.card:hover .preview__card-item {
  animation: fan-out 2s ease-in-out infinite alternate;
}

.preview__card-item:nth-child(1) { animation-delay: 0s; }
.preview__card-item:nth-child(2) { animation-delay: 0.1s; }
.preview__card-item:nth-child(3) { animation-delay: 0.2s; }

@keyframes fan-out {
  0% { transform: rotate(0deg) translateY(0); }
  100% { transform: rotate(5deg) translateY(-3px); }
}

/* Image picker preview */
.preview__image-grid {
  display: flex;
  gap: 0.35rem;
}

.preview__img {
  width: 1.8rem;
  height: 1.8rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  border-radius: 0.35rem;
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

/* Card body */
.card__body {
  padding: 1rem 1.25rem;
  flex: 1;
}

.card__title {
  font-size: 1rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 0.25rem;
  line-height: 1.3;
}

.card__desc {
  font-size: 0.8rem;
  color: #64748b;
  margin: 0;
  line-height: 1.5;
}

/* Centered action button */
.card__action {
  display: flex;
  justify-content: center;
  padding: 0 1.25rem 1rem;
}

.card__btn {
  font-size: 0.9rem;
  font-weight: 600;
  padding: 0.55rem 1.5rem;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: white;
  border-radius: 999px;
  white-space: nowrap;
  text-align: center;
  box-shadow: 0 3px 8px rgba(99, 102, 241, 0.35);
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: default;
}

.card:hover .card__btn {
  transform: translateY(-1px) scale(1.04);
  box-shadow: 0 6px 16px rgba(99, 102, 241, 0.5);
}

.card:hover .card__btn:active {
  transform: translateY(0) scale(0.97);
}

/* Card footer */
.card__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1.25rem;
  border-top: 1px solid #f1f5f9;
}

.card__status {
  font-size: 0.65rem;
  color: #94a3b8;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.card__arrow {
  color: #94a3b8;
  transition: transform 0.2s ease;
}

/* ── Responsive ── */
@media (max-width: 640px) {
  .header__inner {
    padding: 1.5rem 1rem;
    flex-direction: column;
    align-items: stretch;
  }

  .header__icon-wrap {
    width: 2.75rem;
    height: 2.75rem;
  }

  .header__icon-wrap svg {
    width: 22px;
    height: 22px;
  }

  .header__title {
    font-size: 1.35rem;
  }

  .main {
    padding: 1rem;
  }

  .grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
}
</style>
