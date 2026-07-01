import type { NotNowItem, Phase, Project, Task } from '../types/project'
import { getScopeWarnings } from './scopeWarnings'

export type ScopeSeverity = 'ok' | 'warn' | 'block'

export type TaskScopeReport = {
  taskId: string
  title: string
  phaseId: string
  lane: Task['lane']
  state: Task['state']
  severity: ScopeSeverity
  warnings: string[]
  readyToBuild: boolean
}

export type ScopeMonitorSnapshot = {
  scopeLocked: boolean
  healthScore: number
  tasksOk: number
  tasksWarn: number
  tasksBlock: number
  inScopeSummary: string[]
  outOfScopeSummary: string[]
  phaseConstraints: string[]
  taskReports: TaskScopeReport[]
}

function taskSeverity(warnings: string[], readyToBuild: boolean, state: Task['state']): ScopeSeverity {
  if (warnings.length === 0 && (state === 'done' || readyToBuild)) return 'ok'
  if (state === 'done') return warnings.length > 0 ? 'warn' : 'ok'
  if (warnings.length >= 2) return 'block'
  return warnings.length > 0 ? 'warn' : 'ok'
}

function isTaskReadyToBuild(task: Task): boolean {
  return (
    task.state === 'build' &&
    task.acceptanceCriteria.length > 0 &&
    task.notAllowedChanges.length > 0 &&
    task.allowedAreas.length > 0
  )
}

export function buildTaskScopeReport(task: Task): TaskScopeReport {
  const warnings = getScopeWarnings(task)
  const readyToBuild = isTaskReadyToBuild(task)
  return {
    taskId: task.id,
    title: task.title,
    phaseId: task.phaseId,
    lane: task.lane,
    state: task.state,
    severity: taskSeverity(warnings, readyToBuild, task.state),
    warnings,
    readyToBuild,
  }
}

export function buildScopeMonitorSnapshot(
  project: Project,
  phases: Phase[],
  tasks: Task[],
  notNowItems: NotNowItem[],
): ScopeMonitorSnapshot {
  const activePhase = phases.find((phase) => phase.id === project.currentPhaseId) ?? phases[0]
  const taskReports = tasks.map(buildTaskScopeReport)

  const tasksOk = taskReports.filter((report) => report.severity === 'ok').length
  const tasksWarn = taskReports.filter((report) => report.severity === 'warn').length
  const tasksBlock = taskReports.filter((report) => report.severity === 'block').length

  const activeTasks = tasks.filter((task) => task.lane === 'now' || task.state === 'build')
  const inScopeSummary = [
    ...new Set(activeTasks.flatMap((task) => task.allowedAreas)),
    ...activePhase.doneCriteria.slice(0, 3),
  ]

  const outOfScopeSummary = [
    ...notNowItems.map((item) => item.title),
    ...activePhase.notAllowedYet,
  ]

  const openIssues = taskReports.filter((report) => report.severity !== 'ok').length
  const healthScore = tasks.length === 0 ? 100 : Math.round(((tasks.length - openIssues) / tasks.length) * 100)

  return {
    scopeLocked: project.scopeLocked,
    healthScore,
    tasksOk,
    tasksWarn,
    tasksBlock,
    inScopeSummary,
    outOfScopeSummary,
    phaseConstraints: activePhase.notAllowedYet,
    taskReports,
  }
}

export function detectScopeCreep(task: Task, notNowTitles: string[]): string[] {
  const findings: string[] = []
  const haystack = `${task.title} ${task.description}`.toLowerCase()

  for (const title of notNowTitles) {
    const token = title.toLowerCase().split(' ')[0]
    if (token.length > 3 && haystack.includes(token)) {
      findings.push(`Task may touch out-of-scope area: ${title}`)
    }
  }

  if (task.lane === 'not_now' && task.state === 'build') {
    findings.push('Build work scheduled in Not Now lane.')
  }

  if (task.phaseId.includes('phase-2') && task.state === 'build' && task.lane === 'now') {
    findings.push('Phase 2 work marked as build-now before Phase 1 audit pass.')
  }

  return findings
}
