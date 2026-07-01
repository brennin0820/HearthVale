import type { Blocker, Decision, PromptCard, Task } from '../types/project'
import {
  generateAuditorPrompt,
  generateBuilderPrompt,
  generateGodsEyePrompt,
  generateResearchPrompt,
} from '../utils/promptGenerator'
import { mockPhases, mockProject, mockTasks } from './mockProject'

const currentPhase =
  mockPhases.find((phase) => phase.id === mockProject.currentPhaseId) ?? mockPhases[0]

const nextTask =
  mockTasks.find((task) => task.lane === 'now' && task.state !== 'done') ??
  mockTasks.find((task) => task.lane === 'now') ??
  mockTasks[0]

export const phase34SupplementalTasks: Task[] = [
  {
    id: 'task-research-priority-ui',
    projectId: mockProject.id,
    phaseId: 'phase-2',
    title: 'Research priority board interaction patterns',
    description:
      'Compare drag-and-drop lanes vs static columns for a non-coder builder workflow.',
    why: 'Priority board UX affects every future task ordering decision.',
    type: 'research',
    priority: 'P1',
    lane: 'next',
    state: 'research',
    owner: 'research',
    dependencies: ['task-dashboard'],
    acceptanceCriteria: [
      'At least two interaction patterns compared',
      'Recommendation includes scope and deferral notes',
      'Risks of building too early are listed',
    ],
    allowedAreas: ['docs', 'research notes'],
    notAllowedChanges: ['Do not implement UI until decision is made'],
    auditRequired: false,
  },
]

const researchTask = phase34SupplementalTasks[0]

function buildPromptCard(
  id: string,
  target: PromptCard['target'],
  prompt: string,
  taskId: string,
): PromptCard {
  return {
    id,
    projectId: mockProject.id,
    taskId,
    target,
    prompt,
    requiredOutput:
      target === 'gods_eye'
        ? [
            'Scope verdict',
            'Missing details',
            'Risks',
            'Final refined task',
            'Recommended next step',
          ]
        : target === 'nightraven_builder'
          ? [
              'Files changed',
              'What was built',
              'Acceptance criteria completed',
              'Assumptions',
              'Recommended next step',
            ]
          : target === 'nightraven_auditor'
            ? [
                'Pass / Fix Needed / Blocked / Scope Creep / Needs User Decision',
                'Findings',
                'Required fixes',
                'Can move forward: yes/no',
              ]
            : [
                'Summary of findings',
                'Recommended approach',
                'Risks if we skip research',
                'Recommended next step',
              ],
  }
}

/** Phase 3 — four prompt targets generated via promptGenerator.ts */
export const phase34PromptCards: PromptCard[] = [
  buildPromptCard(
    'prompt-ge-phase34',
    'gods_eye',
    generateGodsEyePrompt(mockProject, currentPhase, nextTask),
    nextTask.id,
  ),
  buildPromptCard(
    'prompt-builder-phase34',
    'nightraven_builder',
    generateBuilderPrompt(mockProject, currentPhase, nextTask),
    nextTask.id,
  ),
  buildPromptCard(
    'prompt-auditor-phase34',
    'nightraven_auditor',
    generateAuditorPrompt(mockProject, currentPhase, nextTask),
    nextTask.id,
  ),
  buildPromptCard(
    'prompt-research-phase34',
    'research',
    generateResearchPrompt(mockProject, mockPhases[2] ?? currentPhase, researchTask),
    researchTask.id,
  ),
]

/** Phase 4 — supplemental decisions (IDs unique vs mockProject.ts) */
export const phase34SupplementalDecisions: Decision[] = [
  {
    id: 'decision-priority-ui',
    projectId: mockProject.id,
    question: 'Should the priority board use drag-and-drop lanes or static columns?',
    options: [
      'Drag-and-drop lanes',
      'Static columns with move buttons',
      'Read-only columns until Phase 3',
    ],
    recommendation: 'Static columns with move buttons for MVP — less scope risk.',
    status: 'open',
    impact: 'high',
    unlocksTaskIds: ['task-priority-board'],
  },
  {
    id: 'decision-audit-gate',
    projectId: mockProject.id,
    question: 'Must every Phase 1 task pass Auditor before Phase 2 starts?',
    options: ['Yes — hard gate', 'Yes — soft gate with exceptions', 'No — parallel phases'],
    recommendation: 'Yes — hard gate for Phase 1 only.',
    status: 'open',
    impact: 'medium',
    unlocksTaskIds: ['task-roadmap', 'task-dashboard'],
  },
]

/** Phase 4 — supplemental blockers (IDs unique vs mockProject.ts) */
export const phase34SupplementalBlockers: Blocker[] = [
  {
    id: 'blocker-scope-lock',
    projectId: mockProject.id,
    title: 'Scope lock warning — cloud sync mentioned in handoff',
    reason:
      'Recent handoff text references cloud sync, which is Not Now until local storage works.',
    severity: 'low',
    blockedTaskIds: [],
    owner: 'gods_eye',
    resolutionNeeded:
      'Trim handoff to mock-only scope or move cloud sync to Not Now with revisit condition.',
    status: 'open',
  },
  {
    id: 'blocker-legacy-nav',
    projectId: mockProject.id,
    title: 'Duplicate sidebar nav experiment',
    reason: 'Superseded by unified navigation.ts — no longer blocks work.',
    severity: 'low',
    blockedTaskIds: [],
    owner: 'nightraven_builder',
    resolutionNeeded: 'None — archived.',
    status: 'resolved',
  },
]
