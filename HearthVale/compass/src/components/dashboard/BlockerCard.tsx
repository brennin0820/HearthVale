import { AlertTriangle } from 'lucide-react'
import type { Blocker } from '../../types/project'

type BlockerCardProps = {
  blocker: Blocker
  blockedTaskTitles?: string[]
  onUpdateStatus?: (status: Blocker['status']) => void
}

export function BlockerCard({
  blocker,
  blockedTaskTitles = [],
  onUpdateStatus,
}: BlockerCardProps) {
  return (
    <article className="dashboard-card">
      <div className="card-heading">
        <span className="card-icon card-icon--rose">
          <AlertTriangle size={18} aria-hidden="true" />
        </span>
        <div>
          <p className="eyebrow">Blocker</p>
          <h2>{blocker.title}</h2>
        </div>
      </div>
      <p className="card-copy">{blocker.reason}</p>
      <div className="meta-grid meta-grid--two">
        <span>
          <strong>Severity</strong>
          {blocker.severity}
        </span>
        <span>
          <strong>Status</strong>
          {blocker.status.replaceAll('_', ' ')}
        </span>
        <span>
          <strong>Owner</strong>
          {blocker.owner.replaceAll('_', ' ')}
        </span>
        <span>
          <strong>Blocked tasks</strong>
          {blockedTaskTitles.length > 0 ? blockedTaskTitles.join(', ') : 'None linked'}
        </span>
      </div>
      <div className="resolution-box">
        <strong>Resolution needed</strong>
        <p>{blocker.resolutionNeeded}</p>
      </div>

      {onUpdateStatus && blocker.status !== 'resolved' ? (
        <div className="action-strip">
          <button
            className="scope-link-btn"
            onClick={() => onUpdateStatus('in_progress')}
            type="button"
          >
            In progress
          </button>
          <button
            className="scope-link-btn"
            onClick={() => onUpdateStatus('resolved')}
            type="button"
          >
            Resolve
          </button>
        </div>
      ) : null}
    </article>
  )
}
