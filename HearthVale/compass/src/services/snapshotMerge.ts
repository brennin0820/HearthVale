import type { ProjectSnapshot } from '../types/snapshot'
import type { ProjectOverrides } from './persistence'

function applyPatches<T extends { id: string }>(
  items: T[],
  patches: Record<string, Partial<T>> | undefined,
  deletedIds: string[] | undefined,
  custom: T[] | undefined,
): T[] {
  const deleted = new Set(deletedIds ?? [])
  const merged = items
    .filter((item) => !deleted.has(item.id))
    .map((item) => ({ ...item, ...(patches?.[item.id] ?? {}) }))

  const existingIds = new Set(merged.map((item) => item.id))
  for (const item of custom ?? []) {
    if (!existingIds.has(item.id)) {
      merged.push(item)
    }
  }

  return merged
}

export function mergeSnapshot(
  base: ProjectSnapshot,
  overrides: ProjectOverrides | null,
): ProjectSnapshot {
  if (!overrides) return base

  return {
    ...base,
    tasks: applyPatches(
      base.tasks,
      overrides.taskPatches,
      overrides.deletedTaskIds,
      overrides.customTasks,
    ),
    decisions: applyPatches(
      base.decisions,
      overrides.decisionPatches,
      undefined,
      overrides.customDecisions,
    ),
    blockers: applyPatches(
      base.blockers,
      overrides.blockerPatches,
      undefined,
      overrides.customBlockers,
    ),
    auditItems: applyPatches(base.auditItems, overrides.auditPatches, undefined, undefined),
    notNowItems: applyPatches(
      base.notNowItems,
      overrides.notNowPatches,
      undefined,
      overrides.customNotNow,
    ),
    phases: applyPatches(base.phases, overrides.phasePatches, undefined, undefined),
    settings: overrides.settings
      ? { ...base.settings, ...overrides.settings }
      : base.settings,
  }
}
