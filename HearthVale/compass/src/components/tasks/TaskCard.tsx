import type { Task } from '../../types/project'

type TaskCardProps = {
  task: Task
  selected?: boolean
  onSelect?: (task: Task) => void
}

export function TaskCard({ task, selected = false, onSelect }: TaskCardProps) {
  const interactive = Boolean(onSelect)

  return (
    <article
      className="task-card"
      data-lane={task.lane}
      data-state={task.state}
      data-selected={selected ? 'true' : 'false'}
    >
      <button
        type="button"
        className="task-card__button"
        onClick={() => onSelect?.(task)}
        disabled={!interactive}
        aria-pressed={selected}
      >
        <div className="task-card__head">
          <strong>{task.title}</strong>
          <span className="queue-pill">{task.priority}</span>
        </div>
        <p className="task-card__copy">{task.description}</p>
        <div className="task-card__meta">
          <span>{task.state.replaceAll('_', ' ')}</span>
          <span>{task.owner.replaceAll('_', ' ')}</span>
        </div>
      </button>
    </article>
  )
}
