import { ArrowRight, ShieldCheck } from 'lucide-react'
import type { Task } from '../../types/project'
import { getRouteForTask, isTaskReadyToBuild } from '../../utils/routing'
import { getScopeWarnings } from '../../utils/scopeWarnings'

type NextBestActionCardProps = {
  task: Task
}

function formatOwner(owner: Task['owner']) {
  return owner.replaceAll('_', ' ')
}

export function NextBestActionCard({ task }: NextBestActionCardProps) {
  const warnings = getScopeWarnings(task)
  const route = getRouteForTask(task)
  const ready = isTaskReadyToBuild(task)

  return (
    <article className="dashboard-card dashboard-card--accent">
      <div className="card-heading">
        <span className="card-icon card-icon--amber">
          <ArrowRight size={18} aria-hidden="true" />
        </span>
        <div>
          <p className="eyebrow">Next best action</p>
          <h2>{task.title}</h2>
        </div>
      </div>
      <p className="card-copy">{task.why}</p>
      <div className="action-strip">
        <span>{task.priority}</span>
        <span>{formatOwner(task.owner)}</span>
        <span>{route}</span>
        <span>{task.state}</span>
      </div>
      <div className="audit-note" data-ready={ready}>
        <ShieldCheck size={17} aria-hidden="true" />
        {ready ? 'Ready to build with audit required' : 'Needs scope cleanup first'}
      </div>
      {warnings.length > 0 ? (
        <ul className="warning-list">
          {warnings.map((warning) => (
            <li key={warning}>{warning}</li>
          ))}
        </ul>
      ) : null}
    </article>
  )
}
