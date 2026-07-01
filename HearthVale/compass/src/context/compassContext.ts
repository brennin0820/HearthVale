import { createContext } from 'react'
import type { AuditItem, Blocker, Decision, Phase, Task } from '../types/project'
import type { SelectedProject } from '../services/compassApi'
import type { CompassSettingsProfile, ProjectSnapshot, RefreshStatus, RegistryEntry } from '../types/snapshot'

export type ProjectContextValue = {
  registry: RegistryEntry[]
  snapshot: ProjectSnapshot | null
  loading: boolean
  error: string | null
  selected: SelectedProject | null
  selectProject: (path: string, label: string) => void
  refresh: (options?: { silent?: boolean }) => Promise<void>
  refreshStatus: RefreshStatus
  updateTask: (taskId: string, patch: Partial<Task>) => Promise<void>
  updateDecision: (decisionId: string, patch: Partial<Decision>) => Promise<void>
  updateBlocker: (blockerId: string, patch: Partial<Blocker>) => Promise<void>
  updateAuditItem: (auditId: string, patch: Partial<AuditItem>) => Promise<void>
  updatePhase: (phaseId: string, patch: Partial<Phase>) => Promise<void>
  updateSettings: (patch: Partial<CompassSettingsProfile>) => Promise<void>
}

export const CompassContext = createContext<ProjectContextValue | null>(null)
