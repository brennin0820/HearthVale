# Build Report — Phases 2–8

## Task

Implement Compass MVP Phases 2–8 automatically using mock data only. Wire all sidebar routes. Pass `npm run build` and `npm run lint`.

## Phases completed

| Phase | Deliverable | Acceptance |
|-------|-------------|------------|
| **2 — Roadmap + Priority Board** | `RoadmapPage` (phases, status, done criteria, current highlighted), `PriorityBoardPage` (6 lanes), `TaskCard`, `TaskDetailPanel`, `ScopeMapPage`, task queues | Roadmap shows ordered phases; current phase badge; board shows Now/Next/Later/Blocked/Not Now/Done; task detail panel on select |
| **3 — Next Prompt** | `NextPromptPage` + `phase34PromptCards` from `promptGenerator.ts` | Four targets: God's Eye, NR Builder, Auditor, Research |
| **4 — Decisions + Blockers** | `DecisionsPage` (grouped by status, scope lock banner), `BlockersPage` (severity, blocked task titles), `NotNowPage` | Open/decided/superseded visible; scope lock warning when locked |
| **5 — Auditor Queue** | `AuditorQueuePage` with findings, required fixes, canMoveForward, pass/fix actions | Audit cards show status gate; scope warnings merged |
| **6 — Progress Tracker** | `ProgressTrackerPage` (6 dimensions + honest labels), `DoneCriteriaPage`, `ReportsPage` | All six progress types; done criteria met/partial/open; report excerpts |
| **7 — Memory Feed** | `MemoryFeedPage` with kind filters + `buildActivityFeed()` | Tasks, decisions, audits, blockers, sessions |
| **8 — Loop Detector** | `LoopDetectorPage` + `detectProjectLoops()` + `mockLoopSignals` | Reopened decisions, future-phase work, planning/audit ratio, zero shipping |

## Files created / changed

### Routing
- `src/app/App.tsx` — all views via `routeRegistry`
- `src/app/routeRegistry.tsx` — full `NavItemId` → page map with nav parity check

### Phase 2
- `src/components/roadmap/RoadmapPage.tsx`
- `src/components/priority/PriorityBoardPage.tsx`
- `src/components/tasks/TaskCard.tsx`, `TaskDetailPanel.tsx`
- `src/components/scope/ScopeMapPage.tsx` (existing, wired)
- `src/components/queues/TaskQueuePage.tsx`, `CoderTasksPage.tsx`
- `src/data/mockPhase2.ts`

### Phase 3–4
- `src/components/prompts/NextPromptPage.tsx`
- `src/data/mockPhase34.ts` — four prompt cards + supplemental decisions/blockers/tasks
- `src/utils/promptGenerator.ts` — added `generateResearchPrompt`
- `src/components/lists/DecisionsPage.tsx`, `BlockersPage.tsx`

### Phase 5–6
- `src/components/auditor/AuditorQueuePage.tsx`
- `src/components/progress/ProgressTrackerPage.tsx`
- `src/components/criteria/DoneCriteriaPage.tsx`
- `src/components/reports/ReportsPage.tsx`
- `src/data/mockPhase56.ts`

### Phase 7–8
- `src/components/memory/MemoryFeedPage.tsx`
- `src/components/loops/LoopDetectorPage.tsx`
- `src/utils/loopDetector.ts` — `detectProjectLoops`
- `src/data/mockPhase78.ts` — memory feed, loop signals, done criteria, reports, registry

### Data assembly
- `src/data/mockProject.ts` — extended phases 0–8, richer tasks/decisions/blockers/audits
- `src/data/mockSnapshot.ts` — merges all mock layers via `mergeById`

### Styles
- `src/index.css` — priority layout, task cards, scope lock, loop severity, criteria pages

### Server (type parity)
- `server/types.ts` — re-exports `ProjectSnapshot` from src
- `server/parseHandoff.ts` — memory feed items include `kind` + `title`

## Verification

```text
npm run build  — pass
npm run lint   — pass
```

## Assumptions

- Mock data is authoritative for MVP demo; registry/API path falls back to mock when fetch fails.
- `TaskCard` / `TaskDetailPanel` live under `components/tasks/` (single canonical copy).
- Priority board uses view-state selection, not drag-and-drop persistence.
- Auditor pass/fix buttons write to local overrides when persistence layer is active.

## Problems

- Parallel WIP merged mid-session (routeRegistry, mockPhase* files, enriched ProjectContext) — consolidated into single registry and fixed import/export mismatches.
- Duplicate `DoneCriteriaPage` paths resolved — canonical page at `components/criteria/`.

## Next recommended step

Run **Auditor full MVP audit** against Phases 1–8: verify each acceptance row in this report, browser smoke on all sidebar routes, then decide ship signal for local JSON persistence (post-MVP).
