import type { Task, TaskLane, TaskState } from '../../types/project'

const LANES: TaskLane[] = ['now', 'next', 'later', 'blocked', 'not_now', 'done']
const STATES: TaskState[] = [
  'think',
  'build',
  'audit',
  'decide',
  'research',
  'delay',
  'done',
]

type TaskActionsProps = {
  task: Task
  onUpdate: (patch: Partial<Task>) => void
}

export function TaskActions({ task, onUpdate }: TaskActionsProps) {
  return (
    <div className="task-actions">
      <label className="task-actions__field">
        <span>Lane</span>
        <select
          value={task.lane}
          onChange={(event) => onUpdate({ lane: event.target.value as TaskLane })}
        >
          {LANES.map((lane) => (
            <option key={lane} value={lane}>
              {lane.replaceAll('_', ' ')}
            </option>
          ))}
        </select>
      </label>
      <label className="task-actions__field">
        <span>State</span>
        <select
          value={task.state}
          onChange={(event) => onUpdate({ state: event.target.value as TaskState })}
        >
          {STATES.map((state) => (
            <option key={state} value={state}>
              {state}
            </option>
          ))}
        </select>
      </label>
      <button
        className="scope-link-btn"
        onClick={() => onUpdate({ lane: 'done', state: 'done' })}
        type="button"
      >
        Mark done
      </button>
    </div>
  )
}
