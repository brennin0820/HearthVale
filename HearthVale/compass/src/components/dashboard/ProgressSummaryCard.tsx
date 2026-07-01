import { Gauge } from 'lucide-react'
import type { ProgressSnapshot } from '../../types/project'

type ProgressSummaryCardProps = {
  progress: ProgressSnapshot
}

const progressRows = [
  ['Scope', 'scopeProgress'],
  ['Build', 'buildProgress'],
  ['Audit', 'auditProgress'],
  ['Decision', 'decisionProgress'],
  ['Shipping', 'shippingProgress'],
  ['Learning', 'learningProgress'],
] as const

export function ProgressSummaryCard({ progress }: ProgressSummaryCardProps) {
  return (
    <article className="dashboard-card">
      <div className="card-heading">
        <span className="card-icon card-icon--blue">
          <Gauge size={18} aria-hidden="true" />
        </span>
        <div>
          <p className="eyebrow">Progress</p>
          <h2>Honest tracker</h2>
        </div>
      </div>
      <div className="progress-list">
        {progressRows.map(([label, key]) => {
          const value = progress[key]

          return (
            <div className="progress-row" key={key}>
              <span>{label}</span>
              <div className="progress-track" aria-hidden="true">
                <span style={{ width: `${value}%` }} />
              </div>
              <strong>{value}%</strong>
            </div>
          )
        })}
      </div>
    </article>
  )
}
