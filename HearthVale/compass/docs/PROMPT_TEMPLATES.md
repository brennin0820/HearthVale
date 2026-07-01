# Prompt Templates

## God's Eye Review

```text
Review the NightRaven Compass build packet.

Check whether the MVP is clear, whether the build phases are in the correct order, whether the data model is enough for the first version, and whether anything should be moved to Not Now.

Return:
- Scope verdict
- Missing details
- Risks
- Recommended MVP changes
- What should be Not Now
- Final build instruction for NightRaven Builder
```

## NightRaven Builder

```text
Build the first MVP version of NightRaven Compass.

Implement Phase 1 only.

Use:
- React
- TypeScript
- Vite
- Mock data

Build:
- App shell
- Sidebar navigation
- Dashboard page
- Required dashboard cards
- Recommended prompt card

Do not implement:
- Real AI integration
- Cloud sync
- Repo auto-editing
- Plugin manager
- MCP manager
- Database
- Future phase pages except sidebar placeholders

Return:
- Files changed
- What was built
- Acceptance criteria completed
- Assumptions
- Problems
- Next recommended task
```

## Auditor

```text
Audit the Phase 1 implementation of NightRaven Compass.

Verify the app matches the build packet and Phase 1 scope.

Return:
- Pass / Fix Needed / Blocked / Scope Creep / Needs User Decision
- Findings
- Missing acceptance criteria
- Required fixes
- Whether Phase 2 can begin
```
