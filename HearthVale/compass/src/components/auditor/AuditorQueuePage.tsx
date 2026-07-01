import { ShieldCheck } from 'lucide-react'
import { useCompassData } from '../../hooks/useCompassData'
import type { ProjectSnapshot } from '../../types/snapshot'
import { buildTaskScopeReport, detectScopeCreep } from '../../utils/scopeMonitor'
import { getScopeWarnings } from '../../utils/scopeWarnings'

type AuditRow = {
  id: string
  taskTitle: string
  status: string
  findings: string[]
  requiredFixes: string[]
  scopeWarnings: string[]
  creepFindings: string[]
  canMoveForward: boolean
}

function buildAuditRows(snapshot: ProjectSnapshot): AuditRow[] {
  const { auditItems: items, tasks, notNowItems } = snapshot
  const notNowTitles = notNowItems.map((item) => item.title)

  return items.map((audit) => {
    const task = tasks.find((entry) => entry.id === audit.taskId)
    if (!task) {
      return {
        id: audit.id,
        taskTitle: audit.taskId,
        status: audit.status,
        findings: audit.findings,
        requiredFixes: audit.requiredFixes,
        scopeWarnings: ['Linked task not found.'],
        creepFindings: [],
        canMoveForward: false,
      }
    }

    const scopeWarnings = getScopeWarnings(task)
    const creepFindings = detectScopeCreep(task, notNowTitles)
    const report = buildTaskScopeReport(task)
    const blocked =
      scopeWarnings.length > 0 ||
      creepFindings.length > 0 ||
      !report.readyToBuild ||
      audit.findings.length > 0

    const allFindings = [...audit.findings, ...creepFindings]
    const allFixes = [...audit.requiredFixes]

    if (scopeWarnings.length > 0 && audit.requiredFixes.length === 0) {
      allFixes.push('Resolve scope warnings before marking done.')
    }

    return {
      id: audit.id,
      taskTitle: task.title,
      status: blocked && audit.status === 'pending' ? 'scope_review' : audit.status,
      findings: allFindings,
      requiredFixes: allFixes,
      scopeWarnings,
      creepFindings,
      canMoveForward: !blocked && audit.canMoveForward,
    }
  })
}

export function AuditorQueuePage() {
  const { snapshot, updateAuditItem } = useCompassData()

  if (!snapshot) return null

  const rows = buildAuditRows(snapshot)
  const pending = rows.filter((row) => !row.canMoveForward).length

  return (
    <section className="auditor-page" aria-labelledby="auditor-queue-title">
      <article className="dashboard-card dashboard-card--wide">
        <div className="card-heading">
          <span className="card-icon card-icon--green">
            <ShieldCheck size={18} aria-hidden="true" />
          </span>
          <div>
            <p className="eyebrow">Auditor queue</p>
            <h2 id="auditor-queue-title">Audit cards and movement gate</h2>
          </div>
        </div>
        <p className="card-copy">
          Status, findings, required fixes, and canMoveForward — prevents false Done.
        </p>
        <div className="scope-stats">
          <span>
            <strong>Queue items</strong>
            {rows.length}
          </span>
          <span>
            <strong>Blocked</strong>
            {pending}
          </span>
          <span>
            <strong>Can move forward</strong>
            {rows.filter((row) => row.canMoveForward).length}
          </span>
        </div>
      </article>

      <div className="auditor-list">
        {rows.length === 0 ? (
          <article className="dashboard-card">
            <p className="card-copy">No audit items in queue.</p>
          </article>
        ) : (
          rows.map((row) => (
            <article className="dashboard-card auditor-card" key={row.id}>
              <div className="auditor-card__head">
                <h3>{row.taskTitle}</h3>
                <span className="auditor-status" data-forward={row.canMoveForward}>
                  {row.canMoveForward ? 'Can move forward' : 'Hold — review needed'}
                </span>
              </div>
              <div className="action-strip">
                <span>{row.status.replaceAll('_', ' ')}</span>
              </div>
              {row.findings.length > 0 ? (
                <div className="auditor-findings">
                  <strong>Findings</strong>
                  <ul>
                    {row.findings.map((finding) => (
                      <li key={finding}>{finding}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {row.requiredFixes.length > 0 ? (
                <div className="auditor-findings auditor-findings--creep">
                  <strong>Required fixes</strong>
                  <ul>
                    {row.requiredFixes.map((fix) => (
                      <li key={fix}>{fix}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {row.scopeWarnings.length > 0 ? (
                <div className="auditor-findings">
                  <strong>Scope warnings</strong>
                  <ul>
                    {row.scopeWarnings.map((warning) => (
                      <li key={warning}>{warning}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {row.findings.length === 0 &&
              row.requiredFixes.length === 0 &&
              row.scopeWarnings.length === 0 ? (
                <p className="auditor-clean">All checks passed for this task.</p>
              ) : null}
              <div className="action-strip">
                <button
                  className="scope-link-btn"
                  onClick={() =>
                    void updateAuditItem(row.id, {
                      status: 'pass',
                      canMoveForward: true,
                      findings: [],
                      requiredFixes: [],
                    })
                  }
                  type="button"
                >
                  Mark pass
                </button>
                <button
                  className="scope-link-btn"
                  onClick={() =>
                    void updateAuditItem(row.id, {
                      status: 'fix_needed',
                      canMoveForward: false,
                    })
                  }
                  type="button"
                >
                  Needs fix
                </button>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  )
}
