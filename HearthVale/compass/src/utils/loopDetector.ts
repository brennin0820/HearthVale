import type { MemoryFeedItem, ProjectSnapshot } from '../types/snapshot'

const STOP_WORDS = new Set([
  'about',
  'after',
  'also',
  'apps',
  'compass',
  'docs',
  'from',
  'gods',
  'handoff',
  'into',
  'memory',
  'nightraven',
  'only',
  'push',
  'repo',
  'session',
  'that',
  'this',
  'touch',
  'with',
])

export type LoopTheme = {
  theme: string
  count: number
  sessions: string[]
}

export type ProjectLoopWarning = {
  id: string
  severity: 'critical' | 'high' | 'medium' | 'low'
  category: 'decision' | 'future_phase' | 'planning_audit' | 'shipping' | 'theme'
  title: string
  detail: string
}

export function detectLoopThemes(memoryFeed: MemoryFeedItem[]): LoopTheme[] {
  const themeMap = new Map<string, { count: number; sessions: string[] }>()

  for (const item of memoryFeed) {
    const words =
      item.text
        .toLowerCase()
        .match(/\b[a-z][a-z0-9-]{3,}\b/g)
        ?.filter((word) => !STOP_WORDS.has(word)) ?? []
    const unique = new Set(words)

    for (const word of unique) {
      const existing = themeMap.get(word) ?? { count: 0, sessions: [] }
      existing.count += 1
      if (!existing.sessions.includes(item.date)) {
        existing.sessions.push(item.date)
      }
      themeMap.set(word, existing)
    }
  }

  return [...themeMap.entries()]
    .filter(([, value]) => value.count >= 2)
    .map(([theme, value]) => ({ theme, count: value.count, sessions: value.sessions }))
    .sort((left, right) => right.count - left.count)
    .slice(0, 12)
}

export function detectProjectLoops(snapshot: ProjectSnapshot): ProjectLoopWarning[] {
  const warnings: ProjectLoopWarning[] = []
  const { project, phases, tasks, decisions, progress } = snapshot
  const currentPhase =
    phases.find((phase) => phase.id === project.currentPhaseId) ?? phases[0]
  const currentOrder = currentPhase?.order ?? 0

  const supersededReopened = decisions.filter(
    (decision) =>
      decision.status === 'superseded' &&
      decision.question.toLowerCase().includes('reopen'),
  )
  if (supersededReopened.length > 0) {
    warnings.push({
      id: 'loop-reopened-decisions',
      severity: 'high',
      category: 'decision',
      title: 'Reopened or superseded decisions',
      detail: `${supersededReopened.length} decision(s) were reopened and superseded — possible back-and-forth on settled choices.`,
    })
  }

  const openHighImpact = decisions.filter(
    (decision) => decision.status === 'open' && decision.impact === 'high',
  )
  if (openHighImpact.length > 0) {
    warnings.push({
      id: 'loop-open-decisions',
      severity: 'medium',
      category: 'decision',
      title: 'Open high-impact decisions',
      detail: `${openHighImpact.length} high-impact decision(s) still open — building may stall.`,
    })
  }

  const futurePhaseTasks = tasks.filter((task) => {
    const taskPhase = phases.find((phase) => phase.id === task.phaseId)
    return (
      taskPhase &&
      taskPhase.order > currentOrder &&
      task.lane !== 'not_now' &&
      task.state !== 'done' &&
      task.state !== 'delay'
    )
  })
  if (futurePhaseTasks.length > 0) {
    warnings.push({
      id: 'loop-future-phase',
      severity: 'high',
      category: 'future_phase',
      title: 'Future-phase work in active lanes',
      detail: `${futurePhaseTasks.length} task(s) belong to phases after "${currentPhase?.name}" but are not deferred.`,
    })
  }

  const planningStates = tasks.filter(
    (task) =>
      (task.state === 'think' || task.state === 'decide' || task.state === 'research') &&
      task.lane !== 'done' &&
      task.lane !== 'not_now',
  )
  const auditStates = tasks.filter(
    (task) => task.state === 'audit' && task.lane !== 'done',
  )
  const buildStates = tasks.filter(
    (task) => task.state === 'build' && task.lane !== 'done',
  )

  if (planningStates.length + auditStates.length > buildStates.length * 2 && buildStates.length < 3) {
    warnings.push({
      id: 'loop-planning-audit',
      severity: 'medium',
      category: 'planning_audit',
      title: 'Heavy planning and auditing vs building',
      detail: `${planningStates.length} planning + ${auditStates.length} audit tasks vs ${buildStates.length} active build tasks — risk of analysis loop.`,
    })
  }

  if (progress.shippingProgress === 0) {
    warnings.push({
      id: 'loop-no-shipping',
      severity: 'critical',
      category: 'shipping',
      title: 'No shipping progress',
      detail: 'Shipping progress is 0% — MVP features exist but nothing has shipped to users yet.',
    })
  }

  const themes = detectLoopThemes(snapshot.memoryFeed)
  for (const theme of themes.slice(0, 3)) {
    warnings.push({
      id: `loop-theme-${theme.theme}`,
      severity: 'low',
      category: 'theme',
      title: `Repeated theme: "${theme.theme}"`,
      detail: `Appeared in ${theme.count} memory entries (${theme.sessions.join(', ')}).`,
    })
  }

  return warnings
}
