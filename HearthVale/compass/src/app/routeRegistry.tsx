import type { ComponentType, ReactNode } from 'react'
import { AuditorQueuePage } from '../components/auditor/AuditorQueuePage'
import { DashboardPage } from '../components/dashboard/DashboardPage'
import { DoneCriteriaPage } from '../components/criteria/DoneCriteriaPage'
import { BlockersPage } from '../components/lists/BlockersPage'
import { DecisionsPage } from '../components/lists/DecisionsPage'
import { NotNowPage } from '../components/lists/NotNowPage'
import { LoopDetectorPage } from '../components/loops/LoopDetectorPage'
import type { NavItemId } from '../components/layout/navigation'
import { navItems } from '../components/layout/navigation'
import { MemoryFeedPage } from '../components/memory/MemoryFeedPage'
import { PriorityBoardPage } from '../components/priority/PriorityBoardPage'
import { ProgressTrackerPage } from '../components/progress/ProgressTrackerPage'
import { NextPromptPage } from '../components/prompts/NextPromptPage'
import { CoderTasksPage } from '../components/queues/CoderTasksPage'
import { TaskQueuePage } from '../components/queues/TaskQueuePage'
import { ReportsPage } from '../components/reports/ReportsPage'
import { RoadmapPage } from '../components/roadmap/RoadmapPage'
import { ScopeMapPage } from '../components/scope/ScopeMapPage'
import { SettingsPage } from '../components/settings/SettingsPage'

type RouteEntry = {
  component: ComponentType
}

export const routeRegistry = {
  dashboard: { component: DashboardPage },
  'scope-map': { component: ScopeMapPage },
  roadmap: { component: RoadmapPage },
  'priority-board': { component: PriorityBoardPage },
  'coder-tasks': { component: CoderTasksPage },
  'next-prompt': { component: NextPromptPage },
  'ge-queue': { component: () => <TaskQueuePage queueId="ge-queue" /> },
  'nr-queue': { component: () => <TaskQueuePage queueId="nr-queue" /> },
  'research-queue': { component: () => <TaskQueuePage queueId="research-queue" /> },
  'auditor-queue': { component: AuditorQueuePage },
  decisions: { component: DecisionsPage },
  blockers: { component: BlockersPage },
  progress: { component: ProgressTrackerPage },
  'done-criteria': { component: DoneCriteriaPage },
  'not-now': { component: NotNowPage },
  'memory-feed': { component: MemoryFeedPage },
  'back-and-forth': { component: LoopDetectorPage },
  reports: { component: ReportsPage },
  settings: { component: SettingsPage },
} satisfies Record<NavItemId, RouteEntry>

const routeKeys = new Set(Object.keys(routeRegistry) as NavItemId[])
const missingRoutes = navItems.filter((item) => !routeKeys.has(item.id))
if (missingRoutes.length > 0) {
  throw new Error(
    `navigation.ts ids missing from routeRegistry: ${missingRoutes.map((item) => item.id).join(', ')}`,
  )
}

export function renderRoute(activeView: NavItemId): ReactNode {
  const entry = routeRegistry[activeView]
  const Page = entry.component
  return <Page />
}

export const registeredNavIds = Object.keys(routeRegistry) as NavItemId[]
