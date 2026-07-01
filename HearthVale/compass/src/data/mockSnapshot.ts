import type { MemoryFeedItem, ProjectSnapshot } from '../types/snapshot'
import { mockPhase2Tasks } from './mockPhase2'
import {
  phase34PromptCards,
  phase34SupplementalBlockers,
  phase34SupplementalDecisions,
  phase34SupplementalTasks,
} from './mockPhase34'
import {
  mockPhase56AuditItems,
  mockPhase56Progress,
  mockPhase56Tasks,
} from './mockPhase56'
import {
  mockDoneCriteria,
  mockExtraAudits,
  mockExtraBlockers,
  mockExtraDecisions,
  mockExtraTasks,
  mockLoopSignals,
  mockMemoryFeed,
  mockRegistry,
  mockReports,
  mockSettingsProfile,
} from './mockPhase78'
import { mockBlockers, mockDecisions, mockNotNowItems, mockPhases, mockProject, mockPromptCards, mockTasks } from './mockProject'

function mergeById<T extends { id: string }>(...groups: T[][]): T[] {
  const map = new Map<string, T>()
  for (const group of groups) {
    for (const item of group) {
      map.set(item.id, item)
    }
  }
  return [...map.values()]
}

export function buildMockSnapshot(): ProjectSnapshot {
  return {
    registry: mockRegistry,
    project: mockProject,
    phases: mockPhases,
    tasks: mergeById(
      mockTasks,
      mockPhase2Tasks,
      mockPhase56Tasks,
      phase34SupplementalTasks,
      mockExtraTasks,
    ),
    decisions: mergeById(mockDecisions, phase34SupplementalDecisions, mockExtraDecisions),
    blockers: mergeById(mockBlockers, phase34SupplementalBlockers, mockExtraBlockers),
    notNowItems: mockNotNowItems,
    auditItems: mergeById(mockPhase56AuditItems, mockExtraAudits),
    promptCards: mergeById(mockPromptCards, phase34PromptCards),
    progress: mockPhase56Progress,
    memoryFeed: mockMemoryFeed,
    loopSignals: mockLoopSignals,
    doneCriteria: mockDoneCriteria,
    reports: mockReports,
    settings: mockSettingsProfile,
    meta: {
      projectPath: 'mock://nightraven-compass',
      handoffFound: true,
      overlayFound: false,
      artifactCount: 5,
      artifactTotal: 8,
      loadedAt: new Date().toISOString(),
    },
  }
}

/** Unified activity feed for Memory Feed page — mock entries plus live snapshot slices. */
export function buildActivityFeed(snapshot: ProjectSnapshot): MemoryFeedItem[] {
  const base = snapshot.memoryFeed
  const seen = new Set(base.map((item) => item.id))

  const extras: MemoryFeedItem[] = []

  for (const task of snapshot.tasks.filter((t) => t.lane === 'now' && t.state !== 'done').slice(0, 2)) {
    const id = `live-task-${task.id}`
    if (!seen.has(id)) {
      extras.push({
        id,
        date: snapshot.project.updatedAt,
        kind: 'task',
        title: task.title,
        source: task.id,
        text: `${task.state} in ${task.lane} lane — ${task.owner.replaceAll('_', ' ')}.`,
      })
    }
  }

  for (const decision of snapshot.decisions.filter((d) => d.status === 'open').slice(0, 2)) {
    const id = `live-decision-${decision.id}`
    if (!seen.has(id)) {
      extras.push({
        id,
        date: snapshot.project.updatedAt,
        kind: 'decision',
        title: decision.question.slice(0, 60),
        source: decision.id,
        text: `Open (${decision.impact} impact) — ${decision.recommendation ?? 'No recommendation yet.'}`,
      })
    }
  }

  return [...base, ...extras]
}
