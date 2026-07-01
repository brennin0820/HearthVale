import { useState } from 'react'
import { AppShell } from '../components/layout/AppShell'
import type { NavItemId } from '../components/layout/navigation'
import { renderRoute } from './routeRegistry'

export default function App() {
  const [activeView, setActiveView] = useState<NavItemId>('dashboard')

  return (
    <AppShell activeView={activeView} onViewChange={setActiveView}>
      {renderRoute(activeView)}
    </AppShell>
  )
}
