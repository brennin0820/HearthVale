import { BarChart3 } from 'lucide-react'
import { useCompassData } from '../../hooks/useCompassData'
import { mockPhase56ProgressDimensions } from '../../data/mockPhase56'

export function ProgressTrackerPage() {
  const { snapshot } = useCompassData()

  if (!snapshot) return null

  const { meta } = snapshot

  return (
    <section className="progress-page" aria-labelledby="progress-tracker-title">
      <article className="dashboard-card dashboard-card--wide">
        <div className="card-heading">
          <span className="card-icon card-icon--green">
            <BarChart3 size={18} aria-hidden="true" />
          </span>
          <div>
            <p className="eyebrow">Phase 6 · Progress tracker</p>
            <h2 id="progress-tracker-title">Honest build health</h2>
          </div>
        </div>
        <p className="card-copy">
          Six dimensions — no inflated percentages. Loaded{' '}
          {new Date(meta.loadedAt).toLocaleString()} from{' '}
          <code>{meta.projectPath}</code>.
        </p>
      </article>

      <div className="progress-tracker-list">
        {mockPhase56ProgressDimensions.map((dimension) => {
          const value = snapshot.progress[dimension.key]

          return (
            <article className="dashboard-card progress-dimension-card" key={dimension.key}>
              <div className="progress-dimension-card__head">
                <h3>{dimension.label}</h3>
                <strong>{value}%</strong>
              </div>
              <p className="progress-dimension-card__honest">{dimension.honestLabel}</p>
              <div className="progress-track progress-track--tall" aria-hidden="true">
                <span style={{ width: `${value}%` }} />
              </div>
              <p className="card-copy">{dimension.explanation}</p>
            </article>
          )
        })}
      </div>
    </section>
  )
}
