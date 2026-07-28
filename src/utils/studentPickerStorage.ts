/**
 * Local Storage utility for the Multiple Student Picker.
 * Tracks which student names have already been selected to prevent duplicates
 * across multiple picking rounds, even after page refresh.
 */

const PICKED_STORAGE_KEY = 'multiple_student_picker_picked'
const STUDENT_POOL_KEY = 'multiple_student_picker_pool'

/** Get the set of already-picked student names */
export function getPickedStudentNames(): Set<string> {
  try {
    const raw = localStorage.getItem(PICKED_STORAGE_KEY)
    if (raw) {
      const arr = JSON.parse(raw) as string[]
      return new Set(arr)
    }
  } catch {
    /* ignore */
  }
  return new Set()
}

/** Save a list of newly picked student names to localStorage */
export function savePickedStudentNames(names: string[]): void {
  const existing = getPickedStudentNames()
  for (const name of names) {
    existing.add(name)
  }
  try {
    localStorage.setItem(PICKED_STORAGE_KEY, JSON.stringify([...existing]))
  } catch {
    /* ignore */
  }
}

/** Check if a specific student name has already been picked */
export function isStudentPicked(name: string): boolean {
  return getPickedStudentNames().has(name)
}

/** Reset the picked student history */
export function resetPickedStudents(): void {
  try {
    localStorage.removeItem(PICKED_STORAGE_KEY)
  } catch {
    /* ignore */
  }
}

/** Get the count of unique picked students */
export function getPickedCount(): number {
  return getPickedStudentNames().size
}

/** Cache the current student pool (names) so it persists across refreshes */
export function saveStudentPool(names: string[]): void {
  try {
    localStorage.setItem(STUDENT_POOL_KEY, JSON.stringify(names))
  } catch {
    /* ignore */
  }
}

/** Restore the previously saved student pool */
export function restoreStudentPool(): string[] | null {
  try {
    const raw = localStorage.getItem(STUDENT_POOL_KEY)
    if (raw) {
      const arr = JSON.parse(raw) as string[]
      return Array.isArray(arr) && arr.length > 0 ? arr : null
    }
  } catch {
    /* ignore */
  }
  return null
}

/** Clear everything — pool and pick history */
export function clearAllStudentData(): void {
  try {
    localStorage.removeItem(STUDENT_POOL_KEY)
    localStorage.removeItem(PICKED_STORAGE_KEY)
  } catch {
    /* ignore */
  }
}
