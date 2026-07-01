import { Route } from 'lucide-react'
import { useCompassData } from '../../hooks/useCompassData'

export function RoadmapPage() {
  const { snapshot } = useCompassData()
  const phases = snapshot?.phases ?? []
  const currentPhaseId = snapshot?.project.currentPhaseId

  return (
    <section className="roadmap-page" aria-labelledby="roadmap-title">
      <article className="dashboard-card dashboard-card--wide">
        <div className="card-heading">
          <span className="card-icon card-icon--blue">
            <Route size={18} aria-hidden="true" />
          </span>
          <div>
            <p className="eyebrow">Roadmap</p>
            <h2 id="roadmap-title">Phases in build order</h2>
          </div>
        </div>
        <p className="card-copy">
          Phases 0–8 from the build packet. Current phase is highlighted.
        </p>
      </article>

      <div className="roadmap-list">
        {phases.map((phase) => {
          const isCurrent = phase.id === currentPhaseId
          return (
            <article
              className="dashboard-card roadmap-card"
              data-current={isCurrent}
              data-status={phase.status}
              key={phase.id}
            >
              <div className="roadmap-card__head">
                <h3>
                  {phase.order + 1}. {phase.name}
                  {isCurrent ? <span className="current-badge">Current</span> : null}
                </h3>
                <span className="queue-pill">{phase.status.replaceAll('_', ' ')}</span>
              </div>
              <p className="card-copy">{phase.goal}</p>
              <div className="split-list">
                <div>
                  <h4>Done criteria</h4>
                  <ul>
                    {phase.doneCriteria.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4>Not allowed yet</h4>
                  <ul>
                    {phase.notAllowedYet.length > 0 ? (
                      phase.notAllowedYet.map((item) => (
                        <li key={item}>{item}</li>
                      ))
                    ) : (
                      <li>None listed.</li>
                    )}
                  </ul>
                </div>
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}
