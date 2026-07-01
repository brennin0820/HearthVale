import { useContext, useMemo } from 'react'
import { CompassContext } from '../context/compassContext'
import { selectCompassData } from '../types/snapshot'

export function useProjectContext() {
  const context = useContext(CompassContext)
  if (!context) throw new Error('useProjectContext must be used within ProjectProvider')
  return context
}

export function useCompassData() {
  const {
    snapshot,
    loading,
    error,
    refresh,
    refreshStatus,
    registry,
    selected,
    selectProject,
    updateTask,
    updateDecision,
    updateBlocker,
    updateAuditItem,
    updatePhase,
    updateSettings,
  } = useProjectContext()

  const data = useMemo(
    () => (snapshot ? selectCompassData(snapshot) : null),
    [snapshot],
  )

  return {
    snapshot,
    nextTask: data?.nextTask ?? null,
    currentPhase: data?.currentPhase ?? null,
    loading,
    error,
    refresh,
    refreshStatus,
    registry,
    selected,
    selectProject,
    updateTask,
    updateDecision,
    updateBlocker,
    updateAuditItem,
    updatePhase,
    updateSettings,
  }
}
