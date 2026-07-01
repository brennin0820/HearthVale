import type { AuditItem, Decision, Task } from '../types/project'

export function calculateBuildProgress(tasks: Task[]): number {
  if (tasks.length === 0) return 0

  const doneTasks = tasks.filter((task) => task.state === 'done').length
  return Math.round((doneTasks / tasks.length) * 100)
}

export function calculateDecisionProgress(decisions: Decision[]): number {
  if (decisions.length === 0) return 100

  const closed = decisions.filter(
    (decision) =>
      decision.status === 'decided' || decision.status === 'superseded',
  ).length

  return Math.round((closed / decisions.length) * 100)
}

export function calculateAuditProgress(audits: AuditItem[]): number {
  if (audits.length === 0) return 0

  const passed = audits.filter((audit) => audit.status === 'pass').length
  return Math.round((passed / audits.length) * 100)
}
