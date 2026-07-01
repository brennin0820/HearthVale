import { AlertTriangle } from 'lucide-react'
import { useCompassData } from '../../hooks/useCompassData'
import { BlockerCard } from '../dashboard/BlockerCard'

export function BlockersPage() {
  const { snapshot, updateBlocker } = useCompassData()
  const blockers = snapshot?.blockers ?? []
  const tasks = snapshot?.tasks ?? []

  const taskTitle = (taskId: string) =>
    tasks.find((task) => task.id === taskId)?.title ?? taskId

  return (
    <section className="list-page" aria-labelledby="blockers-title">
      <article className="dashboard-card dashboard-card--wide">
        <div className="card-heading">
          <span className="card-icon card-icon--rose">
            <AlertTriangle size={18} aria-hidden="true" />
          </span>
          <div>
            <p className="eyebrow">Blockers</p>
            <h2 id="blockers-title">Severity, blocked tasks, resolution</h2>
          </div>
        </div>
        <div className="scope-stats">
          <span>
            <strong>Open</strong>
            {blockers.filter((b) => b.status === 'open').length}
          </span>
          <span>
            <strong>In progress</strong>
            {blockers.filter((b) => b.status === 'in_progress').length}
          </span>
          <span>
            <strong>Critical</strong>
            {blockers.filter((b) => b.severity === 'critical').length}
          </span>
        </div>
      </article>

      <div className="list-page__grid">
        {blockers.length === 0 ? (
          <article className="dashboard-card">
            <p className="card-copy">No blockers detected — handoff looks actionable.</p>
          </article>
        ) : (
          blockers.map((blocker) => (
            <BlockerCard
              blockedTaskTitles={blocker.blockedTaskIds.map(taskTitle)}
              blocker={blocker}
              key={blocker.id}
              onUpdateStatus={(status) => void updateBlocker(blocker.id, { status })}
            />
          ))
        )}
      </div>
    </section>
  )
}
