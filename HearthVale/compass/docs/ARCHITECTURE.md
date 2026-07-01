# Compass architecture (agent reference)

Compact reference for snapshot shape, API routes, and monitored files. Entry point: [`../AGENTS.md`](../AGENTS.md).

---

## API routes (Vite dev / preview only)

Registered in `server/compassApiPlugin.ts`. Not available in static `dist/` without preview server.

| Method | Path | Query | Response |
|--------|------|-------|----------|
| GET | `/api/registry` | — | `{ registry: RegistryEntry[] }` |
| GET | `/api/project` | `path`, `label?` | `ProjectSnapshot` (full) |
| GET | `/api/project/version` | `path` | `{ snapshotVersion, checkedAt }` |

Registry loaded from `{monorepoRoot}/scripts/gods-eye-projects.conf`. Monorepo root discovered by walking up from `cwd` until `scripts/gods-eye-projects.conf` exists.

---

## Monitored artifacts (auto-refresh)

`computeSnapshotVersion(projectPath)` hashes mtime of these paths (if present):

- `docs/37_GODS_EYE.md`
- `docs/GODS_EYE_REPO_OVERLAY.md`
- `docs/14_SESSION_HANDOFF.md`
- `docs/02_ENGINEERING_CHANGELOG.md`
- `docs/04_LEARNING_LOG.md`
- `AGENTS.md`
- `.cursor/rules/gods-eye-context-intent.mdc`
- `.cursor/hooks.json`

16-char SHA-256 prefix of `rel:mtimeMs|…` joined string.

---

## ProjectSnapshot (top-level)

```typescript
// src/types/snapshot.ts — abbreviated
type ProjectSnapshot = {
  registry: RegistryEntry[]
  project: Project
  phases: Phase[]
  tasks: Task[]
  decisions: Decision[]
  blockers: Blocker[]
  notNowItems: NotNowItem[]
  auditItems: AuditItem[]
  promptCards: PromptCard[]      // enrichSnapshot
  progress: ProgressSnapshot     // enrichSnapshot
  memoryFeed: MemoryFeedItem[]
  loopSignals: LoopSignal[]      // enrichSnapshot
  doneCriteria: DoneCriterionStatus[]
  reports: CompassReport[]
  settings: CompassSettingsProfile
  meta: {
    projectPath: string
    handoffFound: boolean
    overlayFound: boolean
    artifactCount: number
    artifactTotal: number
    snapshotVersion?: string
    loadedAt: string
  }
}
```

Domain entities (`Task`, `Phase`, etc.) live in `src/types/project.ts`.

---

## IndexedDB overrides

Store: `nightraven-compass` / `project-overrides` keyed by `projectPath`.

```typescript
type ProjectOverrides = {
  projectPath: string
  version: 1
  taskPatches?: Record<string, Partial<Task>>
  customTasks?: Task[]
  deletedTaskIds?: string[]
  decisionPatches?: Record<string, Partial<Decision>>
  customDecisions?: Decision[]
  blockerPatches?: Record<string, Partial<Blocker>>
  customBlockers?: Blocker[]
  auditPatches?: Record<string, Partial<AuditItem>>
  notNowPatches?: Record<string, Partial<NotNowItem>>
  customNotNow?: NotNowItem[]
  phasePatches?: Record<string, Partial<Phase>>
  settings?: Partial<CompassSettingsProfile>
}
```

`mergeSnapshot` applies patches then `enrichSnapshot` recomputes derived arrays.

---

## Context API

`ProjectContext` (via `useCompassData()`):

| Method | Effect |
|--------|--------|
| `selectProject(path, label)` | Load base + overrides for project |
| `refresh({ silent? })` | Re-fetch base snapshot from API |
| `updateTask / updateDecision / updateBlocker / updateAuditItem / updatePhase` | Patch IndexedDB |
| `updateSettings` | Patch settings in IndexedDB (e.g. autoRefresh) |

`refreshStatus`: `idle` | `watching` | `refreshing` | `updated`
