import type { Decision, Task } from '../types/project'

export function getScopeWarnings(task: Task): string[] {
  const warnings: string[] = []

  if (task.acceptanceCriteria.length === 0) {
    warnings.push('Task has no acceptance criteria.')
  }

  if (task.notAllowedChanges.length === 0) {
    warnings.push('Task does not define what is not allowed.')
  }

  if (task.lane === 'not_now' && task.state !== 'delay') {
    warnings.push('Task is in Not Now but is not marked as Delay.')
  }

  if (task.state === 'build' && task.auditRequired === false) {
    warnings.push('Build task does not require audit.')
  }

  return warnings
}

export function getDecisionScopeWarnings(decision: Decision, tasks: Task[]): string[] {
  const warnings: string[] = []

  if (decision.status === 'open' && decision.impact === 'high') {
    warnings.push('High-impact decision is still open — downstream tasks may stall.')
  }

  if (decision.status === 'open' && decision.unlocksTaskIds.length > 0) {
    warnings.push(
      `Unlocks ${decision.unlocksTaskIds.length} task(s) once decided — scope may shift.`,
    )
  }

  for (const taskId of decision.unlocksTaskIds) {
    const task = tasks.find((item) => item.id === taskId)
    if (!task) continue
    for (const warning of getScopeWarnings(task)) {
      warnings.push(`${task.title}: ${warning}`)
    }
  }

  return warnings
}
