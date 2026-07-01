import { Ban } from 'lucide-react'
import type { NotNowItem } from '../../types/project'

type NotNowCardProps = {
  items: NotNowItem[]
}

export function NotNowCard({ items }: NotNowCardProps) {
  return (
    <article className="dashboard-card">
      <div className="card-heading">
        <span className="card-icon card-icon--amber">
          <Ban size={18} aria-hidden="true" />
        </span>
        <div>
          <p className="eyebrow">Not Now</p>
          <h2>Parked safely</h2>
        </div>
      </div>
      <div className="not-now-list">
        {items.map((item) => (
          <section key={item.id}>
            <h3>{item.title}</h3>
            <p>{item.reasonDelayed}</p>
            <small>{item.riskIfBuiltTooEarly}</small>
          </section>
        ))}
      </div>
    </article>
  )
}
