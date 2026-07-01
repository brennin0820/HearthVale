import { GitBranch, LockKeyhole } from 'lucide-react'
import { useCompassData } from '../../hooks/useCompassData'
import type { Decision } from '../../types/project'
import { DecisionCard } from '../dashboard/DecisionCard'

const STATUS_ORDER: Decision['status'][] = [
  'open',
  'needs_research',
  'blocked',
  'decided',
  'superseded',
]

function groupDecisions(decisions: Decision[]): Map<Decision['status'], Decision[]> {
  const groups = new Map<Decision['status'], Decision[]>()
  for (const status of STATUS_ORDER) {
    const items = decisions.filter((decision) => decision.status === status)
    if (items.length > 0) groups.set(status, items)
  }
  return groups
}

export function DecisionsPage() {
  const { snapshot, updateDecision } = useCompassData()
  const decisions = snapshot?.decisions ?? []
  const scopeLocked = snapshot?.project.scopeLocked ?? false
  const groups = groupDecisions(decisions)

  return (
    <section className="list-page" aria-labelledby="decisions-title">
      <article className="dashboard-card dashboard-card--wide">
        <div className="card-heading">
          <span className="card-icon card-icon--amber">
            <GitBranch size={18} aria-hidden="true" />
          </span>
          <div>
            <p className="eyebrow">Decisions</p>
            <h2 id="decisions-title">Open, decided, and superseded</h2>
          </div>
        </div>
        {scopeLocked ? (
          <div className="scope-lock-banner">
            <LockKeyhole size={16} aria-hidden="true" />
            <span>
              Scope is locked — new decisions that expand MVP scope require explicit unlock.
            </span>
          </div>
        ) : null}
      </article>

      {[...groups.entries()].map(([status, items]) => (
        <div className="decision-group" key={status}>
          <h3 className="decision-group__title">{status.replaceAll('_', ' ')}</h3>
          <div className="list-page__grid">
            {items.map((decision) => (
              <DecisionCard
                decision={decision}
                key={decision.id}
                onDecide={(finalChoice) =>
                  void updateDecision(decision.id, { status: 'decided', finalChoice })
                }
                showScopeWarnings
                tasks={snapshot?.tasks ?? []}
              />
            ))}
          </div>
        </div>
      ))}

      {decisions.length === 0 ? (
        <article className="dashboard-card">
          <p className="card-copy">No decisions tracked for this project.</p>
        </article>
      ) : null}
    </section>
  )
}
