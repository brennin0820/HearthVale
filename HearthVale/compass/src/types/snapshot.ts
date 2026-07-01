import type {
  AuditItem,
  Blocker,
  Decision,
  NotNowItem,
  Phase,
  ProgressSnapshot,
  Project,
  PromptCard,
  Task,
} from './project'

export type RegistryEntry = {
  path: string
  label: string
  role: string
  available: boolean
}

export type MemoryFeedKind = 'task' | 'decision' | 'audit' | 'blocker' | 'session'

export type MemoryFeedItem = {
  id: string
  date: string
  text: string
  kind: MemoryFeedKind
  title: string
  source?: string
}

export type LoopCategory =
  | 'reopened_decision'
  | 'future_phase_work'
  | 'planning_audit_loop'
  | 'shipping_stall'

export type LoopSignal = {
  id: string
  category: LoopCategory
  title: string
  detail: string
  severity: 'low' | 'medium' | 'high'
  count: number
  lastSeen: string
  evidence: string[]
}

export type DoneCriterionStatus = {
  id: string
  phaseId: string
  phaseName: string
  criterion: string
  status: 'met' | 'partial' | 'open'
  note?: string
}

export type CompassReport = {
  id: string
  title: string
  kind: 'build' | 'audit' | 'handoff' | 'learning' | 'scope'
  generatedAt: string
  excerpt: string
  artifactPath?: string
}

export type CompassSettingsProfile = {
  dataMode: 'mock' | 'local' | 'registry'
  autoRefresh: boolean
  showPhaseBadges: boolean
  projectRootHint: string
}

export type RefreshStatus = {
  state: 'idle' | 'watching' | 'refreshing' | 'updated'
  lastRefreshedAt?: string
  lastChangeDetectedAt?: string
  lastSnapshotVersion?: string
}

export type ProjectSnapshot = {
  registry: RegistryEntry[]
  project: Project
  phases: Phase[]
  tasks: Task[]
  decisions: Decision[]
  blockers: Blocker[]
  notNowItems: NotNowItem[]
  auditItems: AuditItem[]
  promptCards: PromptCard[]
  progress: ProgressSnapshot
  memoryFeed: MemoryFeedItem[]
  loopSignals: LoopSignal[]
  doneCriteria: DoneCriterionStatus[]
  reports: CompassReport[]
  settings: CompassSettingsProfile
  meta: {
    projectPath: string
    handoffFound: boolean
    overlayFound: boolean
    artifactCount: number
    artifactTotal: number
    snapshotVersion?: string
    loadedAt: string
  }
}

export type CompassData = {
  snapshot: ProjectSnapshot
  nextTask: Task
  currentPhase: Phase
}

export function selectCompassData(snapshot: ProjectSnapshot): CompassData {
  const currentPhase =
    snapshot.phases.find((phase) => phase.id === snapshot.project.currentPhaseId) ??
    snapshot.phases[0]
  const nextTask =
    snapshot.tasks.find((task) => task.lane === 'now' && task.state !== 'done') ??
    snapshot.tasks.find((task) => task.lane === 'now') ??
    snapshot.tasks[0]

  return { snapshot, nextTask, currentPhase }
}
