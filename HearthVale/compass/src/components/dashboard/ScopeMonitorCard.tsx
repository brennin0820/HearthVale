import { Map } from 'lucide-react'
import { useCompassData } from '../../hooks/useCompassData'
import { buildScopeMonitorSnapshot } from '../../utils/scopeMonitor'
import type { NavItemId } from '../layout/navigation'

type ScopeMonitorCardProps = {
  onOpenScopeMap: (view: NavItemId) => void
}

export function ScopeMonitorCard({ onOpenScopeMap }: ScopeMonitorCardProps) {
  const { snapshot } = useCompassData()

  if (!snapshot) return null

  const scopeSnapshot = buildScopeMonitorSnapshot(
    snapshot.project,
    snapshot.phases,
    snapshot.tasks,
    snapshot.notNowItems,
  )
  const issues = scopeSnapshot.tasksWarn + scopeSnapshot.tasksBlock

  return (
    <article className="dashboard-card">
      <div className="card-heading">
        <span className="card-icon card-icon--blue">
          <Map size={18} aria-hidden="true" />
        </span>
        <div>
          <p className="eyebrow">Scope monitor</p>
          <h2>{scopeSnapshot.healthScore}% healthy</h2>
        </div>
      </div>
      <p className="card-copy">
        {issues === 0
          ? 'All tracked tasks pass scope rules.'
          : `${issues} task(s) need scope cleanup before build.`}
      </p>
      <button className="scope-link-btn" onClick={() => onOpenScopeMap('scope-map')} type="button">
        Open Scope Map
      </button>
    </article>
  )
}
