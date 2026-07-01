import {
  Compass,
} from 'lucide-react'
import { navItems, type NavItemId } from './navigation'

type SidebarProps = {
  activeView: NavItemId
  onViewChange: (view: NavItemId) => void
}

export function Sidebar({ activeView, onViewChange }: SidebarProps) {
  return (
    <aside className="sidebar" aria-label="NightRaven Compass navigation">
      <div className="sidebar__brand">
        <span className="sidebar__brand-mark">
          <Compass size={22} aria-hidden="true" />
        </span>
        <span>
          <strong>HearthVale</strong>
          <small>NightRaven Compass</small>
        </span>
      </div>

      <nav className="sidebar__nav">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = item.id === activeView

          return (
            <button
              aria-current={isActive ? 'page' : undefined}
              className="sidebar__link"
              data-active={isActive}
              key={item.id}
              onClick={() => onViewChange(item.id)}
              type="button"
            >
              <Icon size={18} aria-hidden="true" />
              <span className="sidebar__link-label">{item.label}</span>
              <span className="sidebar__phase">{item.phase}</span>
            </button>
          )
        })}
      </nav>
    </aside>
  )
}
