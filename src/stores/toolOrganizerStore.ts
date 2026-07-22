import { ref, computed, watch } from 'vue'
import { defineStore } from 'pinia'
import { allTools, type Tool } from '@/data/toolsData'

const STORAGE_KEY = 'teacher-tool-organizer'

interface OrganizerData {
  favorites: string[]     // tool slugs that are favorited
  order: string[]         // ordered list of tool slugs (only tools in this list)
  hidden: string[]        // tool slugs that are hidden
}

function loadFromStorage(): OrganizerData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { favorites: [], order: [], hidden: [] }
    const parsed = JSON.parse(raw)
    return {
      favorites: Array.isArray(parsed.favorites) ? parsed.favorites : [],
      order: Array.isArray(parsed.order) ? parsed.order : [],
      hidden: Array.isArray(parsed.hidden) ? parsed.hidden : [],
    }
  } catch {
    return { favorites: [], order: [], hidden: [] }
  }
}

function saveToStorage(data: OrganizerData) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch { /* silently fail */ }
}

export const useToolOrganizerStore = defineStore('toolOrganizer', () => {
  const data = ref<OrganizerData>(loadFromStorage())

  // Persist on changes
  watch(data, (val) => { saveToStorage(val) }, { deep: true })

  // ── Computed ──────────────────────────────────────────────

  /** All tools with organizer state merged in */
  const allToolsWithState = computed(() => {
    return allTools.map(tool => ({
      ...tool,
      isFavorite: data.value.favorites.includes(tool.slug),
      isHidden: data.value.hidden.includes(tool.slug),
      sortOrder: data.value.order.indexOf(tool.slug),
    }))
  })

  /** Favorited tools, in organizer order, then by default order */
  const favoriteTools = computed(() => {
    return allToolsWithState.value
      .filter(t => t.isFavorite && !t.isHidden)
      .sort((a, b) => {
        if (a.sortOrder !== -1 && b.sortOrder !== -1) return a.sortOrder - b.sortOrder
        if (a.sortOrder !== -1) return -1
        if (b.sortOrder !== -1) return 1
        return 0
      })
  })

  /** Non-favorite visible tools in organizer order */
  const otherTools = computed(() => {
    const unordered = allToolsWithState.value.filter(t => !t.isFavorite && !t.isHidden)
    const ordered: typeof unordered = []
    const remaining: typeof unordered = []
    data.value.order.forEach(slug => {
      const idx = unordered.findIndex(t => t.slug === slug)
      if (idx !== -1) ordered.push(unordered.splice(idx, 1)[0])
    })
    remaining.push(...unordered)
    return [...ordered, ...remaining]
  })

  /** All visible tools in organizer order (favorites first) */
  const orderedVisibleTools = computed(() => {
    return [...favoriteTools.value, ...otherTools.value]
  })

  // ── Actions ───────────────────────────────────────────────

  function toggleFavorite(slug: string) {
    const idx = data.value.favorites.indexOf(slug)
    if (idx === -1) {
      data.value.favorites.push(slug)
    } else {
      data.value.favorites.splice(idx, 1)
    }
    // Ensure favorited tool is in order list
    if (!data.value.order.includes(slug)) {
      data.value.order.push(slug)
    }
  }

  function setOrder(newOrder: string[]) {
    data.value.order = newOrder
  }

  function moveToPosition(slug: string, toIndex: number) {
    // Remove from current position
    const fromIdx = data.value.order.indexOf(slug)
    if (fromIdx !== -1) data.value.order.splice(fromIdx, 1)
    // Insert at new position (clamped)
    const insertAt = Math.max(0, Math.min(toIndex, data.value.order.length))
    data.value.order.splice(insertAt, 0, slug)
  }

  function moveUp(slug: string) {
    const idx = data.value.order.indexOf(slug)
    if (idx > 0) {
      [data.value.order[idx - 1], data.value.order[idx]] = [data.value.order[idx], data.value.order[idx - 1]]
    }
  }

  function moveDown(slug: string) {
    const idx = data.value.order.indexOf(slug)
    if (idx < data.value.order.length - 1) {
      [data.value.order[idx], data.value.order[idx + 1]] = [data.value.order[idx + 1], data.value.order[idx]]
    }
  }

  function toggleHidden(slug: string) {
    const idx = data.value.hidden.indexOf(slug)
    if (idx === -1) {
      data.value.hidden.push(slug)
    } else {
      data.value.hidden.splice(idx, 1)
    }
  }

  function resetToDefault() {
    data.value = { favorites: [], order: [], hidden: [] }
  }

  function ensureOrderContainsAllSlugs() {
    const allSlugs = allTools.map(t => t.slug)
    allSlugs.forEach(slug => {
      if (!data.value.order.includes(slug)) {
        data.value.order.push(slug)
      }
    })
  }

  // Initialize: ensure all tool slugs are in the order list
  ensureOrderContainsAllSlugs()

  return {
    data,
    allToolsWithState,
    favoriteTools,
    orderedVisibleTools,
    toggleFavorite,
    setOrder,
    moveToPosition,
    moveUp,
    moveDown,
    toggleHidden,
    resetToDefault,
  }
})
