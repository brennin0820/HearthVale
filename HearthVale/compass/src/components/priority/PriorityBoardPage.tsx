import { useState } from 'react'
import { Columns3 } from 'lucide-react'
import { useCompassData } from '../../hooks/useCompassData'
import type { Task, TaskLane } from '../../types/project'
import { TaskCard } from '../tasks/TaskCard'
import { TaskDetailPanel } from '../tasks/TaskDetailPanel'

const LANES: TaskLane[] = ['now', 'next', 'later', 'blocked', 'not_now', 'done']

export function PriorityBoardPage() {
  const { snapshot, updateTask } = useCompassData()
  const tasks = snapshot?.tasks ?? []
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)

  return (
    <section className="priority-page" aria-labelledby="priority-title">
      <article className="dashboard-card dashboard-card--wide">
        <div className="card-heading">
          <span className="card-icon card-icon--blue">
            <Columns3 size={18} aria-hidden="true" />
          </span>
          <div>
            <p className="eyebrow">Priority board</p>
            <h2 id="priority-title">Tasks by lane</h2>
          </div>
        </div>
        <p className="card-copy">
          Now / Next / Later / Blocked / Not Now / Done — click a task for details.
        </p>
      </article>

      <div className="priority-layout">
        <div className="priority-board">
          {LANES.map((lane) => {
            const laneTasks = tasks.filter((task) => task.lane === lane)
            return (
              <article className="dashboard-card priority-lane" key={lane}>
                <h3>
                  {lane.replaceAll('_', ' ')} <span className="lane-count">{laneTasks.length}</span>
                </h3>
                <div className="priority-lane__list">
                  {laneTasks.length === 0 ? (
                    <p className="priority-lane__empty">Empty</p>
                  ) : (
                    laneTasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        onSelect={setSelectedTask}
                        selected={selectedTask?.id === task.id}
                        task={task}
                      />
                    ))
                  )}
                </div>
              </article>
            )
          })}
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
