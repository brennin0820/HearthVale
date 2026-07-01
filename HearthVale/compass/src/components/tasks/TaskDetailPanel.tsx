import { X } from 'lucide-react'
import type { Task } from '../../types/project'
import { getScopeWarnings } from '../../utils/scopeWarnings'
import { TaskActions } from './TaskActions'

type TaskDetailPanelProps = {
  task: Task
  onClose?: () => void
  onUpdate?: (patch: Partial<Task>) => void
}

export function TaskDetailPanel({ task, onClose, onUpdate }: TaskDetailPanelProps) {
  const warnings = getScopeWarnings(task)

  return (
    <aside className="task-detail-panel dashboard-card" aria-labelledby="task-detail-title">
      <div className="task-detail-panel__head">
        <div>
          <p className="eyebrow">Task detail</p>
          <h2 id="task-detail-title">{task.title}</h2>
        </div>
        {onClose ? (
          <button type="button" className="task-detail-panel__close" onClick={onClose} aria-label="Close task detail">
            <X size={16} aria-hidden="true" />
          </button>
        ) : null}
      </div>

      <p className="card-copy">{task.description}</p>

      <div className="meta-grid meta-grid--two">
        <span>
          <strong>Priority</strong>
          {task.priority}
        </span>
        <span>
          <strong>Lane</strong>
          {task.lane.replaceAll('_', ' ')}
        </span>
        <span>
          <strong>State</strong>
          {task.state}
        </span>
        <span>
          <strong>Owner</strong>
          {task.owner.replaceAll('_', ' ')}
        </span>
        <span>
          <strong>Type</strong>
          {task.type}
        </span>
        <span>
          <strong>Audit</strong>
          {task.auditRequired ? 'Required' : 'Optional'}
        </span>
      </div>

      <div className="split-list">
        <div>
          <h4>Why</h4>
          <p className="card-copy">{task.why}</p>
        </div>
        <div>
          <h4>Acceptance criteria</h4>
          <ul>
            {task.acceptanceCriteria.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </div>

      {task.allowedAreas.length > 0 ? (
        <div>
          <h4>Allowed areas</h4>
          <ul className="task-detail-panel__tags">
            {task.allowedAreas.map((area) => (
              <li key={area}>
                <code>{area}</code>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {task.notAllowedChanges.length > 0 ? (
        <div>
          <h4>Not allowed</h4>
          <ul>
            {task.notAllowedChanges.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {task.dependencies.length > 0 ? (
        <div>
          <h4>Dependencies</h4>
          <ul className="task-detail-panel__tags">
            {task.dependencies.map((dep) => (
              <li key={dep}>
                <code>{dep}</code>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {warnings.length > 0 ? (
        <ul className="warning-list">
          {warnings.map((warning) => (
            <li key={warning}>{warning}</li>
          ))}
        </ul>
      ) : null}

      {onUpdate ? <TaskActions onUpdate={onUpdate} task={task} /> : null}
    </aside>
  )
}
