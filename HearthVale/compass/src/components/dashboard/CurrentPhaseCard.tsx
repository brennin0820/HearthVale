import { CheckCircle2 } from 'lucide-react'
import type { Phase } from '../../types/project'

type CurrentPhaseCardProps = {
  phase: Phase
}

export function CurrentPhaseCard({ phase }: CurrentPhaseCardProps) {
  return (
    <article className="dashboard-card">
      <div className="card-heading">
        <span className="card-icon card-icon--green">
          <CheckCircle2 size={18} aria-hidden="true" />
        </span>
        <div>
          <p className="eyebrow">Current phase</p>
          <h2>{phase.name}</h2>
        </div>
      </div>
      <p className="card-copy">{phase.goal}</p>
      <div className="split-list">
        <section>
          <h3>Done criteria</h3>
          <ul>
            {phase.doneCriteria.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
        <section>
          <h3>Not allowed yet</h3>
          <ul>
            {phase.notAllowedYet.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      </div>
    </article>
  )
}
