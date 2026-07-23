<script setup lang="ts">
import { ref, computed } from 'vue'
import TeacherLayout from '@/components/teacher/TeacherLayout.vue'
import TeacherIcon from '@/components/teacher/TeacherIcon.vue'
import { useToolOrganizerStore } from '@/stores/toolOrganizerStore'
import { categories } from '@/data/toolsData'

const organizer = useToolOrganizerStore()

const dragSlug = ref<string | null>(null)
const dragOverSlug = ref<string | null>(null)
const activeTab = ref<'favorites' | 'all'>('favorites')
const savedToast = ref(false)

// ── Stats ─────────────────────────────────────────────────────
const stats = computed(() => ({
  total: organizer.allToolsWithState.length,
  favorites: organizer.favoriteTools.length,
  hidden: organizer.allToolsWithState.filter(t => t.isHidden).length,
  categories: categories.length,
}))

// ── Tab data ──────────────────────────────────────────────────
const favoriteItems = computed(() => organizer.favoriteTools)
const allItems = computed(() => organizer.orderedVisibleTools)

// ── Drag & Drop ──────────────────────────────────────────────
function onDragStart(slug: string) {
  dragSlug.value = slug
}

function onDragOver(e: DragEvent, slug: string) {
  e.preventDefault()
  dragOverSlug.value = slug
}

function onDragLeave() {
  dragOverSlug.value = null
}

function onDrop(slug: string) {
  if (!dragSlug.value || dragSlug.value === slug) {
    dragSlug.value = null
    dragOverSlug.value = null
    return
  }
  const list = activeTab.value === 'favorites'
    ? favoriteItems.value.map(t => t.slug)
    : allItems.value.map(t => t.slug)

  const fromIdx = list.indexOf(dragSlug.value)
  const toIdx = list.indexOf(slug)
  if (fromIdx === -1 || toIdx === -1) {
    dragSlug.value = null
    dragOverSlug.value = null
    return
  }

  // Reorder in store
  const orderedSlugs = [...organizer.data.order]
  const slugToMove = dragSlug.value
  const srcIdx = orderedSlugs.indexOf(slugToMove)
  if (srcIdx !== -1) orderedSlugs.splice(srcIdx, 1)
  const dstIdx = orderedSlugs.indexOf(slug)
  if (dstIdx !== -1) {
    orderedSlugs.splice(dstIdx, 0, slugToMove)
  } else {
    orderedSlugs.push(slugToMove)
  }
  organizer.setOrder(orderedSlugs)
  dragSlug.value = null
  dragOverSlug.value = null
}

function onDragEnd() {
  dragSlug.value = null
  dragOverSlug.value = null
}

// ── Helpers ──────────────────────────────────────────────────
function getCategoryEmoji(categoryName: string): string {
  const cat = categories.find(c => c.name === categoryName)
  return cat?.icon || '📦'
}

function showSavedToast() {
  savedToast.value = true
  setTimeout(() => { savedToast.value = false }, 2000)
}
</script>

<template>
  <TeacherLayout sidebar-active="organize" page-title="Tool Organizer"
    page-subtitle="Drag to reorder your tools. Star your favorites for quick access."
    :show-search="false"
  >
    <template #actions>
      <button class="outline-button" type="button" @click="organizer.resetToDefault(); showSavedToast()">
        <TeacherIcon icon="refresh" :size="16" />
        <span>Reset</span>
      </button>
    </template>

    <!-- Stats -->
    <section class="stats-grid" aria-label="Organizer stats">
      <article class="stat-card tone-blue">
        <div class="stat-label-row"><span>Total Tools</span><TeacherIcon icon="package" :size="19" /></div>
        <div class="stat-value-row"><strong>{{ stats.total }}</strong></div>
      </article>
      <article class="stat-card tone-green">
        <div class="stat-label-row"><span>Favorites</span><TeacherIcon icon="star" :size="19" /></div>
        <div class="stat-value-row">
          <strong>{{ stats.favorites }}</strong>
          <span>pinned</span>
        </div>
      </article>
      <article class="stat-card tone-orange">
        <div class="stat-label-row"><span>Hidden</span><TeacherIcon icon="eye" :size="19" /></div>
        <div class="stat-value-row">
          <strong>{{ stats.hidden }}</strong>
          <span>tools</span>
        </div>
      </article>
      <article class="stat-card tone-blue">
        <div class="stat-label-row"><span>Categories</span><TeacherIcon icon="grid" :size="19" /></div>
        <div class="stat-value-row"><strong>{{ stats.categories }}</strong></div>
      </article>
    </section>

    <!-- Tabs -->
    <div class="organizer-tabs">
      <button
        class="organizer-tab"
        :class="{ active: activeTab === 'favorites' }"
        @click="activeTab = 'favorites'"
      >
        <TeacherIcon icon="star" :size="18" />
        <span>Favorites</span>
        <span class="tab-count">{{ organizer.favoriteTools.length }}</span>
      </button>
      <button
        class="organizer-tab"
        :class="{ active: activeTab === 'all' }"
        @click="activeTab = 'all'"
      >
        <TeacherIcon icon="grid" :size="18" />
        <span>All Tools</span>
        <span class="tab-count">{{ organizer.orderedVisibleTools.length }}</span>
      </button>
    </div>

    <!-- Drag area hint -->
    <p class="drag-hint">
      <TeacherIcon icon="picker" :size="16" />
      Drag and drop tools to reorder them
    </p>

    <!-- Favorites Tab -->
    <section v-if="activeTab === 'favorites'" class="org-section">
      <div v-if="favoriteItems.length === 0" class="empty-state">
        <div class="empty-icon"><TeacherIcon icon="star" :size="48" /></div>
        <h3>No favorites yet</h3>
        <p>Click the star icon on any tool to add it to your favorites.</p>
        <button class="primary-button" type="button" @click="activeTab = 'all'">
          <TeacherIcon icon="grid" :size="16" />
          <span>Browse All Tools</span>
        </button>
      </div>

      <div v-else class="org-list">
        <div
          v-for="tool in favoriteItems"
          :key="tool.slug"
          class="org-item"
          :class="{
            'drag-over': dragOverSlug === tool.slug,
            dragging: dragSlug === tool.slug,
            'item-hidden': tool.isHidden,
          }"
          draggable="true"
          @dragstart="onDragStart(tool.slug)"
          @dragover="(e) => onDragOver(e, tool.slug)"
          @dragleave="onDragLeave"
          @drop="onDrop(tool.slug)"
          @dragend="onDragEnd"
        >
          <span class="drag-handle" title="Drag to reorder">
            <TeacherIcon icon="picker" :size="16" />
          </span>
          <span class="org-emoji">{{ tool.icon }}</span>
          <div class="org-info">
            <strong>{{ tool.title }}</strong>
            <span class="org-category">{{ getCategoryEmoji(tool.category) }} {{ tool.category }}</span>
          </div>
          <div class="org-badges">
            <span class="org-badge badge-fav">Favorite</span>
            <span v-if="tool.route" class="org-badge badge-route">Launchable</span>
          </div>
          <div class="org-actions">
            <button
              class="org-action-btn star-btn"
              :class="{ active: tool.isFavorite }"
              type="button"
              :title="tool.isFavorite ? 'Remove from favorites' : 'Add to favorites'"
              @click="organizer.toggleFavorite(tool.slug)"
            >
              <TeacherIcon icon="star" :size="18" />
            </button>
            <button
              class="org-action-btn"
              type="button"
              title="Move up"
              :disabled="favoriteItems.indexOf(tool) === 0"
              @click="organizer.moveUp(tool.slug)"
            >
              <TeacherIcon icon="chevronUp" :size="18" />
            </button>
            <button
              class="org-action-btn"
              type="button"
              title="Move down"
              :disabled="favoriteItems.indexOf(tool) === favoriteItems.length - 1"
              @click="organizer.moveDown(tool.slug)"
            >
              <TeacherIcon icon="chevronDown" :size="18" />
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- All Tools Tab -->
    <section v-if="activeTab === 'all'" class="org-section">
      <div class="org-list">
        <div
          v-for="tool in allItems"
          :key="tool.slug"
          class="org-item"
          :class="{
            'drag-over': dragOverSlug === tool.slug,
            dragging: dragSlug === tool.slug,
            'item-hidden': tool.isHidden,
          }"
          draggable="true"
          @dragstart="onDragStart(tool.slug)"
          @dragover="(e) => onDragOver(e, tool.slug)"
          @dragleave="onDragLeave"
          @drop="onDrop(tool.slug)"
          @dragend="onDragEnd"
        >
          <span class="drag-handle" title="Drag to reorder">
            <TeacherIcon icon="picker" :size="16" />
          </span>
          <span class="org-emoji">{{ tool.icon }}</span>
          <div class="org-info">
            <strong>{{ tool.title }}</strong>
            <span class="org-category">{{ getCategoryEmoji(tool.category) }} {{ tool.category }}</span>
          </div>
          <div class="org-badges">
            <span v-if="tool.isFavorite" class="org-badge badge-fav">Favorite</span>
            <span v-if="tool.route" class="org-badge badge-route">Launchable</span>
          </div>
          <div class="org-actions">
            <button
              class="org-action-btn star-btn"
              :class="{ active: tool.isFavorite }"
              type="button"
              :title="tool.isFavorite ? 'Remove from favorites' : 'Add to favorites'"
              @click="organizer.toggleFavorite(tool.slug)"
            >
              <TeacherIcon icon="star" :size="18" />
            </button>
            <button
              class="org-action-btn"
              type="button"
              title="Move up"
              :disabled="allItems.indexOf(tool) === 0"
              @click="organizer.moveUp(tool.slug)"
            >
              <TeacherIcon icon="chevronUp" :size="18" />
            </button>
            <button
              class="org-action-btn"
              type="button"
              title="Move down"
              :disabled="allItems.indexOf(tool) === allItems.length - 1"
              @click="organizer.moveDown(tool.slug)"
            >
              <TeacherIcon icon="chevronDown" :size="18" />
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- Toast -->
    <Transition name="toast">
      <div v-if="savedToast" class="saved-toast">
        <TeacherIcon icon="check" :size="18" />
        <span>Organizer reset to default!</span>
      </div>
    </Transition>
  </TeacherLayout>
</template>

<style scoped>
/* ── Tabs ──────────────────────────────────────────────────── */
.organizer-tabs {
  display: flex;
  gap: 4px;
  margin-bottom: 20px;
  padding: 4px;
  border-radius: 10px;
  background: #eef3ff;
  max-width: 380px;
}
.organizer-tab {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-height: 38px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: #4a5268;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: all .15s;
  padding: 0 16px;
}
.organizer-tab.active {
  background: #fff;
  color: var(--primary);
  box-shadow: 0 2px 6px rgba(0,0,0,.06);
}
.tab-count {
  margin-left: auto;
  border-radius: 999px;
  background: #dae0f0;
  padding: 2px 8px;
  font-size: 11px;
  font-weight: 800;
  color: #4a5268;
}
.organizer-tab.active .tab-count {
  background: var(--primary-soft);
  color: var(--primary);
}

/* ── Drag hint ─────────────────────────────────────────────── */
.drag-hint {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 16px;
  color: var(--muted);
  font-size: 12px;
  font-weight: 600;
}

/* ── Organizer list ────────────────────────────────────────── */
.org-section {
  margin-bottom: 32px;
}
.org-list {
  display: grid;
  gap: 6px;
}
.org-item {
  display: flex;
  align-items: center;
  gap: 14px;
  min-height: 64px;
  border: 1px solid var(--line);
  border-radius: 10px;
  background: #fff;
  padding: 8px 16px;
  transition: all .15s;
  user-select: none;
}
.org-item:hover {
  border-color: #b8c0d8;
  box-shadow: 0 2px 8px rgba(0,0,0,.04);
}
.org-item.dragging {
  opacity: .4;
  border-style: dashed;
}
.org-item.drag-over {
  border-color: var(--primary);
  background: var(--primary-soft);
  box-shadow: 0 0 0 2px rgba(0,31,158,.12);
}
.org-item.item-hidden {
  opacity: .5;
}

.drag-handle {
  display: inline-grid;
  width: 32px;
  height: 32px;
  place-items: center;
  border-radius: 6px;
  color: #a8b0c8;
  cursor: grab;
  transition: all .15s;
  flex-shrink: 0;
}
.drag-handle:hover {
  background: #eef3ff;
  color: var(--primary);
}
.drag-handle:active {
  cursor: grabbing;
}

.org-emoji {
  font-size: 28px;
  flex-shrink: 0;
  line-height: 1;
}
.org-info {
  min-width: 0;
  flex: 1;
}
.org-info strong {
  display: block;
  font-size: 14px;
  font-weight: 700;
  color: var(--ink);
}
.org-category {
  font-size: 11px;
  color: var(--muted);
  font-weight: 600;
  margin-top: 2px;
  display: block;
}

.org-badges {
  display: flex;
  gap: 6px;
  flex-shrink: 0;
}
.org-badge {
  border-radius: 999px;
  font-size: 10px;
  font-weight: 800;
  padding: 3px 9px;
  text-transform: uppercase;
}
.badge-fav {
  background: #fef3c7;
  color: #d97706;
}
.badge-route {
  background: var(--green-soft);
  color: var(--green);
}

.org-actions {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}
.org-action-btn {
  display: inline-grid;
  width: 34px;
  height: 34px;
  place-items: center;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: #8a92a8;
  cursor: pointer;
  transition: all .15s;
}
.org-action-btn:hover {
  background: #eef3ff;
  color: var(--primary);
}
.org-action-btn:disabled {
  opacity: .3;
  cursor: not-allowed;
}
.org-action-btn:hover:disabled {
  background: transparent;
  color: #8a92a8;
}
.org-action-btn.star-btn.active {
  color: #f59e0b;
}
.org-action-btn.star-btn.active:hover {
  background: #fffbeb;
}

/* ── Toast ─────────────────────────────────────────────────── */
.saved-toast {
  position: fixed;
  bottom: 32px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 24px;
  border-radius: 10px;
  background: var(--green);
  color: #fff;
  font-size: 14px;
  font-weight: 700;
  box-shadow: 0 8px 24px rgba(0,119,47,.25);
  z-index: 999;
}
.toast-enter-active,
.toast-leave-active {
  transition: all .3s ease;
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(20px);
}

/* ── Responsive ─────────────────────────────────────────────── */
@media (max-width: 720px) {
  .org-item {
    flex-wrap: wrap;
    gap: 10px;
    min-height: auto;
    padding: 14px 16px;
  }
  .org-badges {
    order: 10;
    width: 100%;
  }
  .org-actions {
    margin-left: auto;
  }
}
</style>
