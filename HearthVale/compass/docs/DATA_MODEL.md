# Data Model

Primary types live in [`src/types/project.ts`](../src/types/project.ts).

Core objects:

- `Project` - name, concept, status, current phase, scope lock.
- `Phase` - ordered work stage, done criteria, and not-allowed-yet list.
- `Task` - work item with lane, state, owner, acceptance criteria, and audit requirement.
- `Decision` - question, options, recommendation, final choice, and impact.
- `Blocker` - reason work is blocked and resolution needed.
- `AuditItem` - verification status, findings, fixes, and movement gate.
- `PromptCard` - target prompt and required output.
- `NotNowItem` - delayed idea with revisit condition.
- `ProgressSnapshot` - honest progress categories.

Mock data lives in [`src/data/mockProject.ts`](../src/data/mockProject.ts).
