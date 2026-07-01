import { LockKeyhole } from 'lucide-react'
import type { Project } from '../../types/project'

type ProjectStatusCardProps = {
  project: Project
}

export function ProjectStatusCard({ project }: ProjectStatusCardProps) {
  return (
    <article className="dashboard-card dashboard-card--wide">
      <div className="card-heading">
        <span className="card-icon card-icon--blue">
          <LockKeyhole size={18} aria-hidden="true" />
        </span>
        <div>
          <p className="eyebrow">Project</p>
          <h2>{project.name}</h2>
        </div>
      </div>
      <p className="card-copy">{project.concept}</p>
      <div className="meta-grid">
        <span>
          <strong>Status</strong>
          {project.status}
        </span>
        <span>
          <strong>Scope locked</strong>
          {project.scopeLocked ? 'Yes' : 'No'}
        </span>
        <span>
          <strong>Updated</strong>
          {project.updatedAt}
        </span>
      </div>
    </article>
  )
}
