import type { Phase, Task } from '../types/project'
import type { AuditItem, Blocker, Decision, NotNowItem } from '../types/project'
import type { CompassSettingsProfile } from '../types/snapshot'

const DB_NAME = 'nightraven-compass'
const DB_VERSION = 1
const STORE = 'project-overrides'

export type ProjectOverrides = {
  projectPath: string
  version: 1
  taskPatches?: Record<string, Partial<Task>>
  customTasks?: Task[]
  deletedTaskIds?: string[]
  decisionPatches?: Record<string, Partial<Decision>>
  customDecisions?: Decision[]
  blockerPatches?: Record<string, Partial<Blocker>>
  customBlockers?: Blocker[]
  auditPatches?: Record<string, Partial<AuditItem>>
  notNowPatches?: Record<string, Partial<NotNowItem>>
  customNotNow?: NotNowItem[]
  phasePatches?: Record<string, Partial<Phase>>
  settings?: Partial<CompassSettingsProfile>
  seededAt?: string
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onerror = () => reject(request.error ?? new Error('IndexedDB open failed'))
    request.onsuccess = () => resolve(request.result)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'projectPath' })
      }
    }
  })
}

export async function loadOverrides(projectPath: string): Promise<ProjectOverrides | null> {
  try {
    const db = await openDb()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly')
      const store = tx.objectStore(STORE)
      const request = store.get(projectPath)
      request.onerror = () => reject(request.error ?? new Error('IndexedDB read failed'))
      request.onsuccess = () => resolve((request.result as ProjectOverrides | undefined) ?? null)
      tx.oncomplete = () => db.close()
    })
  } catch {
    return null
  }
}

export async function saveOverrides(overrides: ProjectOverrides): Promise<void> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    const store = tx.objectStore(STORE)
    const request = store.put({ ...overrides, version: 1 as const })
    request.onerror = () => reject(request.error ?? new Error('IndexedDB write failed'))
    request.onsuccess = () => resolve()
    tx.oncomplete = () => db.close()
  })
}

export function createEmptyOverrides(projectPath: string): ProjectOverrides {
  return {
    projectPath,
    version: 1,
    taskPatches: {},
    customTasks: [],
    deletedTaskIds: [],
    decisionPatches: {},
    customDecisions: [],
    blockerPatches: {},
    customBlockers: [],
    auditPatches: {},
    notNowPatches: {},
    customNotNow: [],
    phasePatches: {},
    seededAt: new Date().toISOString(),
  }
}
