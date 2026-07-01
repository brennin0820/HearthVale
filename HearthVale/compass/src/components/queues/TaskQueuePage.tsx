import { useState } from 'react'
import type { Task, TaskOwner, TaskState, TaskType } from '../../types/project'
import { useCompassData } from '../../hooks/useCompassData'
import type { NavItemId } from '../layout/navigation'
import { TaskCard } from '../tasks/TaskCard'
import { TaskDetailPanel } from '../tasks/TaskDetailPanel'

type QueueFilter = {
  title: string
  description: string
  owners?: TaskOwner[]
  states?: TaskState[]
  types?: TaskType[]
}

const queueFilters: Partial<Record<NavItemId, QueueFilter>> = {
  'ge-queue': {
    title: "God's Eye queue",
    description: 'Memory, scope, and handoff tasks owned by God\'s Eye.',
    owners: ['gods_eye'],
  },
  'nr-queue': {
    title: 'NightRaven queue',
    description: 'Build and audit work owned by NightRaven divisions.',
    owners: ['nightraven_builder', 'nightraven_auditor'],
  },
  'research-queue': {
    title: 'Research queue',
    description: 'Investigation and discovery tasks before build.',
    owners: ['research'],
    states: ['research', 'think'],
  },
  'coder-tasks': {
    title: 'Coder tasks',
    description: 'Build-lane implementation work owned by NightRaven builder.',
    owners: ['nightraven_builder'],
    states: ['build'],
  },
}

function matchesQueue(task: Task, filter: QueueFilter): boolean {
  if (filter.owners && !filter.owners.includes(task.owner)) return false
  if (filter.states && !filter.states.includes(task.state)) return false
  if (filter.types && !filter.types.includes(task.type)) return false
  if (task.lane === 'done' || task.state === 'done') return false
  return true
}

type TaskQueuePageProps = {
  queueId: NavItemId
}

export function TaskQueuePage({ queueId }: TaskQueuePageProps) {
  const { snapshot, updateTask } = useCompassData()
  const filter = queueFilters[queueId]
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)

  if (!snapshot || !filter) {
    return (
      <section className="placeholder-panel">
        <h2>Queue not configured</h2>
      </section>
    )
  }

  const tasks = snapshot.tasks.filter((task) => matchesQueue(task, filter))

  return (
    <section className="queue-page" aria-labelledby="queue-title">
      <article className="dashboard-card dashboard-card--wide">
        <p className="eyebrow">Task queue</p>
        <h2 id="queue-title">{filter.title}</h2>
        <p className="card-copy">{filter.description}</p>
        <div className="scope-stats">
          <span>
            <strong>Open items</strong>
            {tasks.length}
          </span>
        </div>
      </article>

      <div className="queue-page__body">
        <div className="queue-list">
          {tasks.length === 0 ? (
            <article className="dashboard-card">
              <p className="card-copy">No tasks match this queue for the selected project.</p>
            </article>
          ) : (
            tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                selected={selectedTask?.id === task.id}
                onSelect={setSelectedTask}
              />
            ))
          )}
        </div>

        {selectedTask ? (
          <TaskDetailPanel
            onClose={() => setSelectedTask(null)}
            onUpdate={(patch) => void updateTask(selectedTask.id, patch)}
            task={selectedTask}
          />
        ) : null}
      </div>
    </section>
  )
}
