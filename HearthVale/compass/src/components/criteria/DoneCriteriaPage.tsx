import { Flag } from 'lucide-react'
import { useCompassData } from '../../hooks/useCompassData'
import type { DoneCriterionStatus } from '../../types/snapshot'

const statusLabel: Record<DoneCriterionStatus['status'], string> = {
  met: 'Met',
  partial: 'Partial',
  open: 'Open',
}

function CriterionRow({ row }: { row: DoneCriterionStatus }) {
  return (
    <article className="dashboard-card done-criterion" data-status={row.status}>
      <div className="done-criterion__head">
        <div>
          <p className="eyebrow">{row.phaseName}</p>
          <h3>{row.criterion}</h3>
        </div>
        <span className="queue-pill">{statusLabel[row.status]}</span>
      </div>
      {row.note ? <p className="card-copy">{row.note}</p> : null}
    </article>
  )
}

export function DoneCriteriaPage() {
  const { snapshot } = useCompassData()
  const rows = snapshot?.doneCriteria ?? []
  const met = rows.filter((row) => row.status === 'met').length
  const partial = rows.filter((row) => row.status === 'partial').length
  const open = rows.filter((row) => row.status === 'open').length

  const byPhase = rows.reduce<Record<string, DoneCriterionStatus[]>>((acc, row) => {
    const list = acc[row.phaseName] ?? []
    list.push(row)
    acc[row.phaseName] = list
    return acc
  }, {})

  return (
    <section className="criteria-page" aria-labelledby="done-criteria-title">
      <article className="dashboard-card dashboard-card--wide">
        <div className="card-heading">
          <span className="card-icon card-icon--green">
            <Flag size={18} aria-hidden="true" />
          </span>
          <div>
            <p className="eyebrow">Done criteria</p>
            <h2 id="done-criteria-title">Phase exit checklist</h2>
          </div>
        </div>
        <p className="card-copy">
          What must be true before a phase can mark done — derived from phase definitions and
          current build state.
        </p>
        <div className="scope-stats">
          <span>
            <strong>Met</strong>
            {met}
          </span>
          <span>
            <strong>Partial</strong>
            {partial}
          </span>
          <span>
            <strong>Open</strong>
            {open}
          </span>
        </div>
      </article>

      {Object.entries(byPhase).map(([phaseName, phaseRows]) => (
        <div className="criteria-phase" key={phaseName}>
          <h3 className="criteria-phase__title">{phaseName}</h3>
          <div className="criteria-list">
            {phaseRows.map((row) => (
              <CriterionRow key={row.id} row={row} />
            ))}
          </div>
        </div>
      ))}
    </section>
  )
}
