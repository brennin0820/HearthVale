import type { Phase, Project, Task } from '../types/project'

export function generateBuilderPrompt(
  project: Project,
  phase: Phase,
  task: Task,
): string {
  return `
Implement this task only.

Project:
${project.name}

Current Phase:
${phase.name}

Task:
${task.title}

Goal:
${task.description}

Why:
${task.why}

Allowed Areas:
${task.allowedAreas.map((area) => `- ${area}`).join('\n')}

Not Allowed:
${task.notAllowedChanges.map((item) => `- ${item}`).join('\n')}

Acceptance Criteria:
${task.acceptanceCriteria.map((item) => `- ${item}`).join('\n')}

Requirements:
- Stay inside the current phase.
- Do not add future-phase features.
- Do not modify unrelated files.
- Use mock data if real integration is not ready.
- After building, produce an implementation report.

Return:
- Files changed
- What was built
- Acceptance criteria completed
- Assumptions
- Problems
- Recommended next step
`.trim()
}

export function generateAuditorPrompt(
  project: Project,
  phase: Phase,
  task: Task,
): string {
  return `
Audit this completed task.

Project:
${project.name}

Current Phase:
${phase.name}

Task:
${task.title}

Original Goal:
${task.description}

Acceptance Criteria:
${task.acceptanceCriteria.map((item) => `- ${item}`).join('\n')}

Check:
- Did the implementation match the task?
- Were unrelated files changed?
- Did it add scope creep?
- Did acceptance criteria pass?
- Is the UI clear?
- Is it ready to mark Done?

Return:
- Pass / Fix Needed / Blocked / Scope Creep / Needs User Decision
- Findings
- Required fixes
- Can move forward: yes/no
`.trim()
}

export function generateGodsEyePrompt(
  project: Project,
  phase: Phase,
  task: Task,
): string {
  return `
Review this task before building.

Project:
${project.name}

Current Phase:
${phase.name}

Task:
${task.title}

Goal:
${task.description}

Check:
- Is the task clear?
- Is it in scope?
- Is it in the correct phase?
- Are there missing details?
- Are there risks?
- Are acceptance criteria complete?
- Should anything be moved to Not Now?

Return:
- Scope verdict
- Missing details
- Risks
- Final refined task
- Recommended next step
`.trim()
}

export function generateResearchPrompt(
  project: Project,
  phase: Phase,
  task: Task,
): string {
  return `
Research this topic before building.

Project:
${project.name}

Current Phase:
${phase.name}

Research Task:
${task.title}

Goal:
${task.description}

Why:
${task.why}

Investigate:
- What options exist?
- What are tradeoffs for a non-coder builder?
- What aligns with God's Eye memory-first approach?
- What should move to Not Now?
- What decision is needed before build?

Return:
- Summary of findings
- Recommended approach
- Risks and unknowns
- Decision needed (yes/no)
- Suggested next step
`.trim()
}
