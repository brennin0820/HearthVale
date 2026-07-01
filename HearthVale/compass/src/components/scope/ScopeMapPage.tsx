import { AlertTriangle, CheckCircle2, LockKeyhole, Map, XCircle } from 'lucide-react'
import { useCompassData } from '../../hooks/useCompassData'
import { buildScopeMonitorSnapshot, type TaskScopeReport } from '../../utils/scopeMonitor'

function SeverityBadge({ severity }: { severity: TaskScopeReport['severity'] }) {
  if (severity === 'ok') {
    return (
      <span className="scope-badge scope-badge--ok">
        <CheckCircle2 size={14} aria-hidden="true" /> OK
      </span>
    )
  }
  if (severity === 'warn') {
    return (
      <span className="scope-badge scope-badge--warn">
        <AlertTriangle size={14} aria-hidden="true" /> Warn
      </span>
    )
  }
  return (
    <span className="scope-badge scope-badge--block">
      <XCircle size={14} aria-hidden="true" /> Block
    </span>
  )
}

export function ScopeMapPage() {
  const { snapshot } = useCompassData()

  if (!snapshot) return null

  const scopeSnapshot = buildScopeMonitorSnapshot(
    snapshot.project,
    snapshot.phases,
    snapshot.tasks,
    snapshot.notNowItems,
  )

  return (
    <section className="scope-page" aria-labelledby="scope-map-title">
      <div className="scope-page__hero dashboard-card dashboard-card--wide">
        <div className="card-heading">
          <span className="card-icon card-icon--blue">
            <Map size={18} aria-hidden="true" />
          </span>
          <div>
            <p className="eyebrow">Scope monitor</p>
            <h2 id="scope-map-title">What is in scope right now</h2>
          </div>
        </div>
        <p className="card-copy">
          Live read of project rules — phase constraints, allowed build areas, Not Now guardrails,
          and per-task scope health.
        </p>
        <div className="scope-stats">
          <span>
            <strong>Health</strong>
            {scopeSnapshot.healthScore}%
          </span>
          <span>
            <strong>Scope locked</strong>
            {scopeSnapshot.scopeLocked ? 'Yes' : 'No'}
            <LockKeyhole size={14} aria-hidden="true" />
          </span>
          <span>
            <strong>Tasks OK</strong>
            {scopeSnapshot.tasksOk}
          </span>
          <span>
            <strong>Warnings</strong>
            {scopeSnapshot.tasksWarn}
          </span>
          <span>
            <strong>Blocked</strong>
            {scopeSnapshot.tasksBlock}
          </span>
        </div>
      </div>

      <div className="scope-page__grid">
        <article className="dashboard-card">
          <h3>In scope</h3>
          <ul className="scope-list scope-list--in">
            {scopeSnapshot.inScopeSummary.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>

        <article className="dashboard-card">
          <h3>Out of scope / Not Now</h3>
          <ul className="scope-list scope-list--out">
            {scopeSnapshot.outOfScopeSummary.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>

        <article className="dashboard-card">
          <h3>Active phase constraints</h3>
          <ul className="scope-list">
            {scopeSnapshot.phaseConstraints.length > 0 ? (
              scopeSnapshot.phaseConstraints.map((item) => <li key={item}>{item}</li>)
            ) : (
              <li>No extra phase constraints.</li>
            )}
          </ul>
        </article>
      </div>

      <article className="dashboard-card scope-table-card">
        <h3>Task scope monitor</h3>
        <div className="scope-table-wrap">
          <table className="scope-table">
            <thead>
              <tr>
                <th>Task</th>
                <th>Lane</th>
                <th>State</th>
                <th>Status</th>
                <th>Issues</th>
              </tr>
            </thead>
            <tbody>
              {scopeSnapshot.taskReports.map((report) => (
                <tr key={report.taskId} data-severity={report.severity}>
                  <td>{report.title}</td>
                  <td>{report.lane}</td>
                  <td>{report.state}</td>
                  <td>
                    <SeverityBadge severity={report.severity} />
                  </td>
                  <td>
                    {report.warnings.length > 0 ? (
                      <ul className="scope-table-issues">
                        {report.warnings.map((warning) => (
                          <li key={warning}>{warning}</li>
                        ))}
                      </ul>
                    ) : (
                      <span className="scope-table-ok">Clean</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>
    </section>
  )
}
