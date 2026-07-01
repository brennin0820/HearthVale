import type { AuditItem, ProgressSnapshot, Task } from '../types/project'

/** Phase 5 — supplemental task referenced by audit queue mock rows. */
export const mockPhase56Tasks: Task[] = [
  {
    id: 'task-scope-map',
    projectId: 'project-nr-compass',
    phaseId: 'phase-2',
    title: 'Wire Scope Map page',
    description: 'Show allowed vs not-allowed areas from the build packet.',
    why: 'Scope visibility prevents builder drift before audit.',
    type: 'frontend',
    priority: 'P1',
    lane: 'now',
    state: 'audit',
    owner: 'nightraven_builder',
    dependencies: ['task-dashboard'],
    acceptanceCriteria: [
      'Scope map page renders mock boundaries',
      'Not Now collisions are visible',
    ],
    allowedAreas: ['src/components/scope', 'src/data'],
    notAllowedChanges: ['Do not add cloud sync', 'Do not edit repo files'],
    auditRequired: true,
  },
]

/** Phase 5 — auditor queue mock rows with statuses, findings, fixes, gates. */
export const mockPhase56AuditItems: AuditItem[] = [
  {
    id: 'audit-app-shell',
    projectId: 'project-nr-compass',
    taskId: 'task-app-shell',
    status: 'pass',
    findings: ['Sidebar renders all nav items.', 'Mock data badge visible in header.'],
    requiredFixes: [],
    canMoveForward: true,
  },
  {
    id: 'audit-phase-1-dashboard',
    projectId: 'project-nr-compass',
    taskId: 'task-dashboard',
    status: 'fix_needed',
    findings: [
      'Dashboard cards render but several nav targets are still placeholders.',
      'Progress summary uses mock percentages — not yet tied to live calculators on all pages.',
    ],
    requiredFixes: [
      'Wire Phase 5 auditor queue and Phase 6 progress tracker routes.',
      'Re-run lint and build before marking dashboard done.',
    ],
    canMoveForward: false,
  },
  {
    id: 'audit-scope-map',
    projectId: 'project-nr-compass',
    taskId: 'task-scope-map',
    status: 'scope_creep',
    findings: [
      'Task touches scope utilities shared with Phase 4 blockers — verify no duplicate logic.',
      'Copy mentions "live handoff" before Phase 7 memory feed exists.',
    ],
    requiredFixes: [
      'Keep Scope Map mock-only; remove any live repo path references in UI copy.',
      'Confirm allowedAreas match build packet.',
    ],
    canMoveForward: false,
  },
  {
    id: 'audit-priority-board',
    projectId: 'project-nr-compass',
    taskId: 'task-priority-board',
    status: 'pending',
    findings: ['Build not submitted for audit yet.'],
    requiredFixes: ['Complete priority board page before auditor review.'],
    canMoveForward: false,
  },
  {
    id: 'audit-roadmap-gate',
    projectId: 'project-nr-compass',
    taskId: 'task-roadmap',
    status: 'needs_user_decision',
    findings: [
      'Roadmap page ships in Phase 2 but Phase 1 audit is still open.',
      'Builder may be sequencing phases out of order.',
    ],
    requiredFixes: ['User confirms whether to pause Phase 2 until Phase 1 audit passes.'],
    canMoveForward: false,
  },
]

export type ProgressDimension = {
  key:
    | 'scopeProgress'
    | 'buildProgress'
    | 'auditProgress'
    | 'decisionProgress'
    | 'shippingProgress'
    | 'learningProgress'
  label: string
  honestLabel: string
  explanation: string
}

/** Phase 6 — six progress dimensions with plain-language honest labels. */
export const mockPhase56Progress: ProgressSnapshot = {
  projectId: 'project-nr-compass',
  scopeProgress: 85,
  buildProgress: 33,
  auditProgress: 20,
  decisionProgress: 60,
  shippingProgress: 0,
  learningProgress: 40,
}

export const mockPhase56ProgressDimensions: ProgressDimension[] = [
  {
    key: 'scopeProgress',
    label: 'Scope',
    honestLabel: '85% — boundaries defined, not fully exercised in UI',
    explanation:
      'Project scope, Not Now list, and phase done-criteria exist in mock data. Scope Map and auditor gates still proving them in the app.',
  },
  {
    key: 'buildProgress',
    label: 'Build',
    honestLabel: '33% — shell done; dashboard and Phase 2 pages partial',
    explanation:
      'App shell is done. Dashboard and downstream pages are partial. No backend or persistence yet — by design for MVP.',
  },
  {
    key: 'auditProgress',
    label: 'Audit',
    honestLabel: '20% — 1 pass, 1 fix needed, 3 blocked or waiting',
    explanation:
      'Auditor queue is active. Most work has not cleared scope and acceptance gates. Nothing is falsely marked Done.',
  },
  {
    key: 'decisionProgress',
    label: 'Decision',
    honestLabel: '60% — storage decided; styling and sequencing still open',
    explanation:
      'Mock-data-first storage choice is closed. Phase-order and UI polish decisions remain open or need user input.',
  },
  {
    key: 'shippingProgress',
    label: 'Shipping',
    honestLabel: '0% — not deployed; local dev only',
    explanation:
      'No production URL, no installable artifact, no Phase 1 auditor sign-off. Shipping stays at zero until audit passes.',
  },
  {
    key: 'learningProgress',
    label: 'Learning',
    honestLabel: '40% — docs exist; handoff chain not wired to app',
    explanation:
      'Build reports and scope docs are present. Memory feed and live handoff ingestion are future phases — learning is documented, not automated.',
  },
]

export const auditStatusLabels: Record<AuditItem['status'], string> = {
  pending: 'Pending review',
  pass: 'Pass',
  fix_needed: 'Fix needed',
  blocked: 'Blocked',
  scope_creep: 'Scope creep',
  needs_user_decision: 'Needs user decision',
}
