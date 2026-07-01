export type ProjectStatus =
  | 'planning'
  | 'building'
  | 'auditing'
  | 'blocked'
  | 'ready'
  | 'shipped'

export type PhaseStatus =
  | 'not_started'
  | 'active'
  | 'blocked'
  | 'auditing'
  | 'done'
  | 'superseded'

export type TaskState =
  | 'think'
  | 'build'
  | 'audit'
  | 'decide'
  | 'research'
  | 'delay'
  | 'done'

export type TaskLane = 'now' | 'next' | 'later' | 'blocked' | 'done' | 'not_now'

export type TaskPriority = 'P0' | 'P1' | 'P2' | 'P3'

export type TaskOwner =
  | 'user'
  | 'gods_eye'
  | 'nightraven_builder'
  | 'nightraven_auditor'
  | 'research'

export type TaskType =
  | 'scope'
  | 'design'
  | 'frontend'
  | 'backend'
  | 'data'
  | 'integration'
  | 'test'
  | 'audit'
  | 'research'
  | 'documentation'
  | 'decision'
  | 'cleanup'
  | 'release'

export type Project = {
  id: string
  name: string
  concept: string
  status: ProjectStatus
  currentPhaseId: string
  scopeLocked: boolean
  createdAt: string
  updatedAt: string
}

export type Phase = {
  id: string
  projectId: string
  name: string
  goal: string
  order: number
  status: PhaseStatus
  doneCriteria: string[]
  notAllowedYet: string[]
}

export type Task = {
  id: string
  projectId: string
  phaseId: string
  title: string
  description: string
  why: string
  type: TaskType
  priority: TaskPriority
  lane: TaskLane
  state: TaskState
  owner: TaskOwner
  dependencies: string[]
  acceptanceCriteria: string[]
  allowedAreas: string[]
  notAllowedChanges: string[]
  auditRequired: boolean
}

export type Decision = {
  id: string
  projectId: string
  question: string
  options: string[]
  recommendation?: string
  finalChoice?: string
  status: 'open' | 'decided' | 'superseded' | 'blocked' | 'needs_research'
  impact: 'low' | 'medium' | 'high'
  unlocksTaskIds: string[]
}

export type Blocker = {
  id: string
  projectId: string
  title: string
  reason: string
  severity: 'critical' | 'high' | 'medium' | 'low'
  blockedTaskIds: string[]
  owner: TaskOwner
  resolutionNeeded: string
  status: 'open' | 'in_progress' | 'resolved' | 'superseded'
}

export type AuditItem = {
  id: string
  projectId: string
  taskId: string
  status:
    | 'pending'
    | 'pass'
    | 'fix_needed'
    | 'blocked'
    | 'scope_creep'
    | 'needs_user_decision'
  findings: string[]
  requiredFixes: string[]
  canMoveForward: boolean
}

export type PromptCard = {
  id: string
  projectId: string
  taskId: string
  target:
    | 'gods_eye'
    | 'nightraven_builder'
    | 'nightraven_auditor'
    | 'research'
    | 'user'
  prompt: string
  requiredOutput: string[]
}

export type NotNowItem = {
  id: string
  projectId: string
  title: string
  reasonDelayed: string
  earliestPhaseAllowed: string
  riskIfBuiltTooEarly: string
  revisitCondition: string
}

export type ProgressSnapshot = {
  projectId: string
  scopeProgress: number
  buildProgress: number
  auditProgress: number
  decisionProgress: number
  shippingProgress: number
  learningProgress: number
}
