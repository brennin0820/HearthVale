import type { Task } from '../types/project'

export function getRouteForTask(task: Task): string {
  if (task.state === 'think') return "God's Eye Queue"
  if (task.state === 'research') return 'Research Queue'
  if (task.state === 'build') return 'NightRaven Build Queue'
  if (task.state === 'audit') return 'Auditor Queue'
  if (task.state === 'decide') return 'Decisions'
  if (task.state === 'delay') return 'Not Now'
  if (task.state === 'done') return 'Done'
  return 'Unsorted'
}

export function isTaskReadyToBuild(task: Task): boolean {
  return (
    task.state === 'build' &&
    task.acceptanceCriteria.length > 0 &&
    task.notAllowedChanges.length > 0 &&
    task.allowedAreas.length > 0
  )
}
