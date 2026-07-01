import type { ProjectSnapshot, RegistryEntry } from '../types/snapshot'

const STORAGE_KEY = 'compass.selectedProject'
/** One-time: drop legacy localStorage default of gods-eye-1 monorepo (pre pickInitialProject). */
const LEGACY_MONOREPO_MIGRATION_KEY = 'compass.himflerDefaultMigration.v1'

/** Default workspace when no prior selection is stored — override via Settings. */
export const PREFERRED_DEFAULT_PROJECT = {
  path: '/Users/brentlenninorlanda/Developer/HearthVale',
  label: 'HearthVale (Phaser MMO)',
} as const

function normalizePath(value: string): string {
  return value.replace(/\\/g, '/').toLowerCase()
}

function isGodsEyeMonorepo(entry: RegistryEntry): boolean {
  return entry.role === 'framework' && normalizePath(entry.path).includes('gods-eye-1')
}

function findHimFlerEntry(registry: RegistryEntry[]): RegistryEntry | undefined {
  return registry.find(
    (entry) =>
      entry.available &&
      (normalizePath(entry.path).includes('himfler') ||
        entry.label.toLowerCase().includes('himfl')),
  )
}

function tryRestoreStoredProject(registry: RegistryEntry[]): SelectedProject | null {
  const stored = loadStoredProject()
  if (!stored) return null

  const match = registry.find(
    (entry) => entry.available && normalizePath(entry.path) === normalizePath(stored.path),
  )
  if (!match) return null

  // Pre-ca783f2 builds auto-picked the first registry row (gods-eye-1). Migrate once to HimFLer.
  if (
    !localStorage.getItem(LEGACY_MONOREPO_MIGRATION_KEY) &&
    isGodsEyeMonorepo(match)
  ) {
    localStorage.removeItem(STORAGE_KEY)
    localStorage.setItem(LEGACY_MONOREPO_MIGRATION_KEY, 'done')
    return null
  }

  return { path: match.path, label: match.label }
}

export function pickInitialProject(registry: RegistryEntry[]): SelectedProject {
  const restored = tryRestoreStoredProject(registry)
  if (restored) return restored

  const preferred = registry.find(
    (entry) =>
      entry.available &&
      normalizePath(entry.path) === normalizePath(PREFERRED_DEFAULT_PROJECT.path),
  )
  if (preferred) return { path: preferred.path, label: preferred.label }

  const himfler = findHimFlerEntry(registry)
  if (himfler) return { path: himfler.path, label: himfler.label }

  const appEntry = registry.find((entry) => entry.available && entry.role === 'app')
  if (appEntry) return { path: appEntry.path, label: appEntry.label }

  const any = registry.find((entry) => entry.available)
  if (any) return { path: any.path, label: any.label }

  return {
    path: PREFERRED_DEFAULT_PROJECT.path,
    label: PREFERRED_DEFAULT_PROJECT.label,
  }
}

export type SelectedProject = {
  path: string
  label: string
}

export function loadStoredProject(): SelectedProject | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as SelectedProject
  } catch {
    return null
  }
}

export function storeProject(project: SelectedProject) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(project))
}

export async function fetchRegistry(): Promise<RegistryEntry[]> {
  const response = await fetch('/api/registry')
  if (!response.ok) throw new Error(`Registry failed: ${response.status}`)
  const data = (await response.json()) as { registry: RegistryEntry[] }
  return data.registry
}

export async function fetchProjectSnapshot(
  path: string,
  label: string,
): Promise<ProjectSnapshot> {
  const params = new URLSearchParams({ path, label })
  const response = await fetch(`/api/project?${params.toString()}`)
  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { error?: string }
    throw new Error(body.error ?? `Project load failed: ${response.status}`)
  }
  return response.json() as Promise<ProjectSnapshot>
}

export type ProjectVersionInfo = {
  snapshotVersion: string
  checkedAt: string
}

export async function fetchProjectVersion(path: string): Promise<ProjectVersionInfo> {
  const params = new URLSearchParams({ path })
  const response = await fetch(`/api/project/version?${params.toString()}`)
  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { error?: string }
    throw new Error(body.error ?? `Version check failed: ${response.status}`)
  }
  return response.json() as Promise<ProjectVersionInfo>
}

/** Poll interval when auto-refresh is enabled (registry mode). */
export const AUTO_REFRESH_POLL_MS = 10_000
