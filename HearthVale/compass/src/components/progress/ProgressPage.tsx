import { BarChart3 } from 'lucide-react'
import { useCompassData } from '../../hooks/useCompassData'
import {
  calculateAuditProgress,
  calculateBuildProgress,
  calculateDecisionProgress,
} from '../../utils/progress'
import { ProgressSummaryCard } from '../dashboard/ProgressSummaryCard'

const DIMENSION_NOTES: Record<string, string> = {
  scopeProgress: 'Scope docs and boundaries defined — high but not 100% until MVP ships.',
  buildProgress: 'Calculated from tasks marked done vs total tasks.',
  auditProgress: 'Calculated from audit items with pass status.',
  decisionProgress: 'Calculated from decided or superseded decisions.',
  shippingProgress: 'Honest: nothing shipped to users yet.',
  learningProgress: 'Memory and handoff activity — mock sessions only.',
}

export function ProgressPage() {
  const { snapshot } = useCompassData()

  if (!snapshot) return null

  const progress = {
    ...snapshot.progress,
    buildProgress: calculateBuildProgress(snapshot.tasks),
    auditProgress: calculateAuditProgress(snapshot.auditItems),
    decisionProgress: calculateDecisionProgress(snapshot.decisions),
  }

  return (
    <section className="progress-page" aria-labelledby="progress-title">
      <article className="dashboard-card dashboard-card--wide">
        <div className="card-heading">
          <span className="card-icon card-icon--green">
            <BarChart3 size={18} aria-hidden="true" />
          </span>
          <div>
            <p className="eyebrow">Progress</p>
            <h2 id="progress-title">All six dimensions — honest tracker</h2>
          </div>
        </div>
        <p className="card-copy">
          Mock data only. Build, audit, and decision values recalculate from current task state.
        </p>
      </article>

      <div className="progress-page__grid">
        <ProgressSummaryCard progress={progress} />

        <article className="dashboard-card">
          <h3>Dimension notes</h3>
          <ul className="progress-notes">
            {Object.entries(DIMENSION_NOTES).map(([key, note]) => (
              <li key={key}>
                <strong>{key.replace('Progress', '')}</strong>
                {note}
              </li>
            ))}
          </ul>
        </article>
      </div>
    </section>
  )
}
