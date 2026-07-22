<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { categories, allTools } from '@/data/toolsData'
import { useToolOrganizerStore } from '@/stores/toolOrganizerStore'
import TeacherLayout from '@/components/teacher/TeacherLayout.vue'
import TeacherIcon from '@/components/teacher/TeacherIcon.vue'

const router = useRouter()
const organizer = useToolOrganizerStore()

const searchQuery = ref('')
const activeCategory = ref('all')
const viewMode = ref<'grid' | 'list'>('grid')

const statsSummary = computed(() => ({
  total: allTools.length,
  categories: categories.length,
  withRoutes: allTools.filter(t => t.route).length,
}))

const categoryOptions = computed(() => [
  { id: 'all', label: 'All Tools', count: allTools.length },
  { id: 'favorites', label: '⭐ Favorites', count: organizer.favoriteTools.length },
  ...categories.map(c => ({ id: c.slug, label: c.name, count: c.tools.length })),
])

const filteredTools = computed(() => {
  let list = allTools
  // Use organizer ordering if no category filter active
  if (activeCategory.value === 'favorites') {
    return organizer.favoriteTools
  }
  if (activeCategory.value !== 'all') {
    list = list.filter(t => {
      const cat = categories.find(c => c.slug === activeCategory.value)
      return cat ? cat.tools.some(ct => ct.slug === t.slug) : false
    })
  }
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter(t => t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q) || t.category.toLowerCase().includes(q))
  }
  // Apply organizer ordering when showing all tools
  if (activeCategory.value === 'all' && !searchQuery.value.trim()) {
    const ordered = organizer.orderedVisibleTools
    const orderedSlugs = ordered.map(t => t.slug)
    list.sort((a, b) => {
      const ai = orderedSlugs.indexOf(a.slug)
      const bi = orderedSlugs.indexOf(b.slug)
      return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi)
    })
  }
  return list
})

function navigateToTool(tool: typeof allTools[number]) {
  if (tool.route) {
    router.push(tool.route)
  }
}

function getCategoryIcon(categoryName: string): string {
  const cat = categories.find(c => c.name === categoryName)
  return cat?.icon || '📦'
}
</script>

<template>
  <TeacherLayout sidebar-active="tools" page-title="Classroom Tools" page-subtitle="Everything you need to engage your students and manage your classroom." :show-search="false">
    <template #actions>
      <div class="view-toggle">
        <button class="toggle-btn" :class="{ active: viewMode === 'grid' }" type="button" @click="viewMode = 'grid'" title="Grid view">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
        </button>
        <button class="toggle-btn" :class="{ active: viewMode === 'list' }" type="button" @click="viewMode = 'list'" title="List view">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
        </button>
      </div>
    </template>

    <!-- Stats -->
    <section class="stats-grid" aria-label="Tools overview">
      <article class="stat-card tone-blue">
        <div class="stat-label-row"><span>Total Tools</span><TeacherIcon icon="package" :size="19" /></div>
        <div class="stat-value-row"><strong>{{ statsSummary.total }}</strong></div>
      </article>
      <article class="stat-card tone-green">
        <div class="stat-label-row"><span>Categories</span><TeacherIcon icon="grid" :size="19" /></div>
        <div class="stat-value-row"><strong>{{ statsSummary.categories }}</strong></div>
      </article>
      <article class="stat-card tone-orange">
        <div class="stat-label-row"><span>Launchable</span><TeacherIcon icon="external" :size="19" /></div>
        <div class="stat-value-row"><strong>{{ statsSummary.withRoutes }}</strong></div>
      </article>
      <article class="stat-card tone-blue">
        <div class="stat-label-row"><span>Most Used</span><TeacherIcon icon="trend" :size="19" /></div>
        <div class="stat-value-row"><strong>{{ categories.reduce((a,b) => a.tools.length > b.tools.length ? a : b).tools.length }}</strong><span>tools</span></div>
      </article>
    </section>

    <!-- Search & Filter Bar -->
    <section class="filter-bar">
      <div class="filter-left">
        <div class="search-mini">
          <TeacherIcon icon="search" :size="18" />
          <input v-model="searchQuery" type="search" placeholder="Search tools..." />
        </div>
        <div class="filter-chips">
          <button
            v-for="cat in categoryOptions"
            :key="cat.id"
            class="chip"
            :class="activeCategory === cat.id ? 'active chip-primary' : ''"
            type="button"
            @click="activeCategory = cat.id"
          >{{ cat.label }}
          </button>
        </div>
      </div>
      <div class="filter-info">
        <span class="result-count">{{ filteredTools.length }} tool{{ filteredTools.length !== 1 ? 's' : '' }}</span>
      </div>
    </section>

    <!-- Loading / Empty -->
    <section v-if="filteredTools.length === 0" class="empty-state">
      <div class="empty-icon"><TeacherIcon icon="package" :size="48" /></div>
      <h3>No tools found</h3>
      <p>Try adjusting your search or filter criteria.</p>
    </section>

    <!-- Grid View -->
    <section v-else-if="viewMode === 'grid'" class="tools-grid">
      <div
        v-for="tool in filteredTools"
        :key="tool.slug"
        class="tool-card"
        :class="{ clickable: !!tool.route }"
        @click="navigateToTool(tool)"
      >
        <div class="tool-card-top">
          <div class="tool-emoji">{{ tool.icon }}</div>
          <div v-if="tool.route" class="tool-badge">Launchable</div>
        </div>
        <div class="tool-card-body">
          <h3 class="tool-title">{{ tool.title }}</h3>
          <p class="tool-desc">{{ tool.description }}</p>
        </div>
        <div class="tool-card-footer">
          <span class="tool-category-tag">{{ getCategoryIcon(tool.category) }} {{ tool.category }}</span>
          <span v-if="tool.route" class="tool-launch">
            Launch
            <TeacherIcon icon="chevronRight" :size="14" />
          </span>
          <span v-else class="tool-coming">Coming Soon</span>
        </div>
      </div>
    </section>

    <!-- List View -->
    <section v-else class="table-wrapper">
      <div class="list-table">
        <div class="list-row list-heading">
          <span class="lcol-icon"></span>
          <span class="lcol-name">Tool</span>
          <span class="lcol-desc">Description</span>
          <span class="lcol-cat">Category</span>
          <span class="lcol-action">Action</span>
        </div>
        <div
          v-for="tool in filteredTools"
          :key="tool.slug"
          class="list-row"
          :class="{ clickable: !!tool.route }"
          @click="navigateToTool(tool)"
        >
          <span class="lcol-icon"><span class="list-emoji">{{ tool.icon }}</span></span>
          <span class="lcol-name"><strong>{{ tool.title }}</strong></span>
          <span class="lcol-desc">{{ tool.description }}</span>
          <span class="lcol-cat"><code>{{ tool.category }}</code></span>
          <span class="lcol-action">
            <button v-if="tool.route" class="ghost-button" type="button" @click.stop="navigateToTool(tool)">
              Launch <TeacherIcon icon="chevronRight" :size="14" />
            </button>
            <span v-else class="coming-text">Coming Soon</span>
          </span>
        </div>
      </div>
    </section>
  </TeacherLayout>
</template>

<style scoped>
/* ── Search bar ─────────────────────────────────────────────── */
.search-mini {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 36px;
  border: 1px solid #d0d6e8;
  border-radius: 8px;
  background: #eef3ff;
  color: #4e586b;
  padding: 0 12px;
  min-width: 200px;
}
.search-mini input {
  min-width: 0;
  flex: 1;
  border: 0;
  outline: 0;
  background: transparent;
  font-size: 13px;
  color: var(--ink);
}
.search-mini input::placeholder {
  color: #6d7587;
}

/* ── Filter bar left group ──────────────────────────────────── */
.filter-left {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

/* ── Tools Grid ─────────────────────────────────────────────── */
.tools-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.tool-card {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--line);
  border-radius: 12px;
  background: #fff;
  overflow: hidden;
  transition: all 0.2s;
}
.tool-card.clickable {
  cursor: pointer;
}
.tool-card.clickable:hover {
  box-shadow: 0 8px 24px rgba(21, 33, 72, 0.1);
  transform: translateY(-3px);
  border-color: var(--primary);
}

.tool-card-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 20px 22px 0;
}
.tool-emoji {
  font-size: 36px;
  line-height: 1;
}
.tool-badge {
  border-radius: 999px;
  background: var(--green-soft);
  color: var(--green);
  font-size: 10px;
  font-weight: 800;
  padding: 3px 9px;
  text-transform: uppercase;
}

.tool-card-body {
  flex: 1;
  padding: 14px 22px 0;
}
.tool-title {
  margin: 0 0 6px;
  font-size: 16px;
  font-weight: 700;
  color: var(--ink);
}
.tool-desc {
  margin: 0;
  font-size: 13px;
  color: var(--muted);
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.tool-card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 22px;
  border-top: 1px solid #e0e4ef;
  margin-top: 16px;
}
.tool-category-tag {
  font-size: 11px;
  font-weight: 700;
  color: var(--muted);
}
.tool-launch {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  font-weight: 800;
  color: var(--primary);
  text-transform: uppercase;
}
.tool-coming {
  font-size: 10px;
  font-weight: 800;
  color: var(--muted);
  text-transform: uppercase;
  background: #eef3ff;
  padding: 3px 9px;
  border-radius: 999px;
}

/* ── List View ──────────────────────────────────────────────── */
.list-table {
  width: 100%;
}
.list-row {
  display: grid;
  grid-template-columns: 48px minmax(160px, 1.6fr) minmax(140px, 2fr) 130px 110px;
  align-items: center;
  min-height: 58px;
  border-top: 1px solid #e0e4ef;
  padding: 0 20px;
  gap: 12px;
  transition: background .15s;
}
.list-row:hover { background: #f8faff; }
.list-row.clickable { cursor: pointer; }
.list-heading {
  min-height: 44px;
  background: #eef3ff;
  color: #596072;
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
}
.list-heading:hover { background: #eef3ff; }
.list-emoji { font-size: 22px; }
.lcol-icon { display: flex; align-items: center; }
.lcol-name strong { font-size: 14px; color: var(--primary); }
.lcol-desc { font-size: 13px; color: var(--muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.lcol-cat code { background: #eef3ff; padding: 2px 7px; border-radius: 4px; font-size: 11px; color: var(--primary); font-weight: 700; }
.lcol-action { display: flex; align-items: center; }
.coming-text { font-size: 10px; font-weight: 800; color: var(--muted); text-transform: uppercase; background: #eef3ff; padding: 3px 9px; border-radius: 999px; }

/* ── Responsive ─────────────────────────────────────────────── */
@media (max-width: 980px) {
  .tools-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .list-row {
    grid-template-columns: 40px 1fr 1fr 90px 100px;
  }
}
@media (max-width: 720px) {
  .tools-grid {
    grid-template-columns: 1fr;
  }
  .list-row {
    grid-template-columns: 1fr;
    min-height: auto;
    padding: 14px 18px;
    gap: 6px;
  }
  .list-heading { display: none; }
  .lcol-icon .list-emoji { font-size: 28px; }
}
</style>
