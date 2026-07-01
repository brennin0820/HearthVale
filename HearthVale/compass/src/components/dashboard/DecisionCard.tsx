import { GitBranch } from 'lucide-react'
import type { Decision, Task } from '../../types/project'
import { getDecisionScopeWarnings } from '../../utils/scopeWarnings'

type DecisionCardProps = {
  decision: Decision
  tasks?: Task[]
  showScopeWarnings?: boolean
  onDecide?: (finalChoice: string) => void
}

export function DecisionCard({
  decision,
  tasks = [],
  showScopeWarnings = false,
  onDecide,
}: DecisionCardProps) {
  const scopeWarnings = showScopeWarnings ? getDecisionScopeWarnings(decision, tasks) : []
  const unlockedTasks = decision.unlocksTaskIds
    .map((id) => tasks.find((task) => task.id === id))
    .filter((task): task is Task => task !== undefined)

  return (
    <article className="dashboard-card" data-status={decision.status}>
      <div className="card-heading">
        <span className="card-icon card-icon--green">
          <GitBranch size={18} aria-hidden="true" />
        </span>
        <div>
          <p className="eyebrow">Decision</p>
          <h2>{decision.question}</h2>
        </div>
      </div>

      {decision.options.length > 0 ? (
        <div className="split-list">
          <div>
            <h3>Options</h3>
            <ul>
              {decision.options.map((option) => (
                <li key={option}>{option}</li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}

      <div className="decision-stack">
        {decision.recommendation ? (
          <p>
            <strong>Recommendation</strong>
            {decision.recommendation}
          </p>
        ) : null}
        <p>
          <strong>Final choice</strong>
          {decision.finalChoice ?? 'Open'}
        </p>
        {unlockedTasks.length > 0 ? (
          <p>
            <strong>Unlocks</strong>
            {unlockedTasks.map((task) => task.title).join(', ')}
          </p>
        ) : null}
      </div>

      {scopeWarnings.length > 0 ? (
        <div className="warning-list" role="note" aria-label="Scope warnings">
          <h3>Scope warnings</h3>
          <ul>
            {scopeWarnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="action-strip">
        <span>{decision.status}</span>
        <span>{decision.impact} impact</span>
      </div>

      {onDecide && decision.status === 'open' && decision.options.length > 0 ? (
        <div className="decision-actions">
          {decision.options.map((option) => (
            <button
              className="scope-link-btn"
              key={option}
              onClick={() => onDecide(option)}
              type="button"
            >
              Choose: {option}
            </button>
          ))}
        </div>
      ) : null}
    </article>
  )
}
