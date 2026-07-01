import { useMemo } from 'react'
import { AlertTriangle } from 'lucide-react'
import { useCompassData } from '../../hooks/useCompassData'
import { detectLoopThemes, detectProjectLoops } from '../../utils/loopDetector'

export function LoopDetectorPage() {
  const { snapshot } = useCompassData()

  const { loops, themes, mockSignals } = useMemo(() => {
    if (!snapshot) return { loops: [], themes: [], mockSignals: [] }
    return {
      loops: detectProjectLoops(snapshot),
      themes: detectLoopThemes(snapshot.memoryFeed),
      mockSignals: snapshot.loopSignals ?? [],
    }
  }, [snapshot])

  const allWarnings = useMemo(() => {
    const fromSignals = mockSignals.map((signal) => ({
      id: signal.id,
      severity: signal.severity,
      title: signal.title,
      detail: signal.detail,
      category: signal.category.replaceAll('_', ' '),
      count: signal.count,
    }))
    const fromDetected = loops.map((loop) => ({
      id: loop.id,
      severity: loop.severity,
      title: loop.title,
      detail: loop.detail,
      category: loop.category.replaceAll('_', ' '),
      count: undefined as number | undefined,
    }))
    return [...fromSignals, ...fromDetected]
  }, [mockSignals, loops])

  return (
    <section className="loop-page" aria-labelledby="loop-title">
      <article className="dashboard-card dashboard-card--wide">
        <div className="card-heading">
          <span className="card-icon card-icon--amber">
            <AlertTriangle size={18} aria-hidden="true" />
          </span>
          <div>
            <p className="eyebrow">Loop detector</p>
            <h2 id="loop-title">Back-and-forth warnings</h2>
          </div>
        </div>
        <p className="card-copy">
          Reopened decisions, future-phase work, planning/audit loops, and zero shipping progress.
        </p>
        <div className="scope-stats">
          <span>
            <strong>Warnings</strong>
            {allWarnings.length}
          </span>
          <span>
            <strong>Memory themes</strong>
            {themes.length}
          </span>
        </div>
      </article>

      <div className="loop-list">
        {allWarnings.length === 0 ? (
          <article className="dashboard-card">
            <p className="card-copy">No loop warnings detected.</p>
          </article>
        ) : (
          allWarnings.map((loop) => (
            <article
              className="dashboard-card loop-card"
              data-severity={loop.severity}
              key={loop.id}
            >
              <div className="loop-card__head">
                <h3>{loop.title}</h3>
                <span className="queue-pill">
                  {loop.count !== undefined ? `${loop.count}×` : loop.severity}
                </span>
              </div>
              <p className="card-copy">{loop.detail}</p>
              <span className="loop-category">{loop.category}</span>
            </article>
          ))
        )}
      </div>
    </section>
  )
}
