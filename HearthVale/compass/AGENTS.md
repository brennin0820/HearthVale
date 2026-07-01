# AGENTS.md — NightRaven Compass (coding agent entry)

**Read this first** when working in `apps/compass/`. For God's Eye framework law on the monorepo, use repo root [`AGENTS.md`](../../AGENTS.md) and [`docs/14_SESSION_HANDOFF.md`](../../docs/14_SESSION_HANDOFF.md) — **framework handoff only**. Compass loads **consumer** handoffs from each registered project path.

---

## What Compass is

**NightRaven Compass** is a project-guidance UI for a **non-coder builder** (Brent) who uses God's Eye memory and NightRaven orchestration to build software with AI agents.

**Motto chain:** God's Eye thinks · NightRaven builds · Auditor verifies · **Compass points** to the next correct step.

Compass does **not** run agents, edit repos, or sync to the cloud. It **reads** God's Eye artifacts from disk (via dev-server API), **merges** local IndexedDB overrides, and **surfaces** scope, phase, priorities, blockers, decisions, audits, progress, prompts, and loop warnings.

---

## Stack

| Layer | Technology |
|-------|------------|
| UI | React 19, TypeScript, Vite 8 |
| Styling | CSS modules / `index.css` (no Tailwind) |
| Icons | `lucide-react` |
| Routing | `useState` view switching — no React Router |
| Server (dev only) | Vite middleware plugin `server/compassApiPlugin.ts` |
| Client persistence | IndexedDB (`nightraven-compass` / `project-overrides`) |
| Registry | `scripts/gods-eye-projects.conf` at monorepo root |

---

## Directory map

```text
apps/compass/
├── AGENTS.md              ← you are here
├── README.md              ← human + agent pointer
├── docs/                  ← product scope, build reports, ARCHITECTURE.md
├── server/                ← Vite dev API (Node, not bundled to static build)
│   ├── compassApiPlugin.ts
│   ├── buildSnapshot.ts   ← handoff → ProjectSnapshot
│   └── parseHandoff.ts
├── src/
│   ├── main.tsx           ← ProjectProvider → CompassState → App
│   ├── app/
│   │   ├── App.tsx        ← activeView state + AppShell
│   │   └── routeRegistry.tsx
│   ├── components/
│   │   ├── layout/        ← AppShell, Sidebar, navigation.ts
│   │   ├── dashboard/     ← Phase 1 cards
│   │   ├── roadmap/       ← Phase 2
│   │   ├── priority/      ← Phase 2
│   │   ├── scope/         ← Phase 2
│   │   ├── queues/        ← Phase 2 task queues
│   │   ├── prompts/       ← Phase 3 Next Prompt
│   │   ├── lists/         ← Phase 4 decisions, blockers, not-now
│   │   ├── auditor/       ← Phase 5
│   │   ├── progress/      ← Phase 6
│   │   ├── criteria/      ← Phase 6 done criteria
│   │   ├── memory/        ← Phase 7 memory feed
│   │   ├── loops/         ← Phase 8 loop detector
│   │   ├── reports/       ← Phase 8
│   │   └── settings/      ← registry picker, auto-refresh toggle
│   ├── context/
│   │   ├── ProjectContext.tsx   ← data orchestration
│   │   └── compassContext.ts
│   ├── hooks/
│   │   └── useCompassData.ts
│   ├── services/
│   │   ├── compassApi.ts        ← fetch registry/project/version
│   │   ├── persistence.ts       ← IndexedDB overrides
│   │   └── snapshotMerge.ts
│   ├── data/                    ← mock seeds (fallback when API unavailable)
│   ├── types/
│   │   ├── project.ts
│   │   └── snapshot.ts
│   └── utils/
│       ├── enrichSnapshot.ts    ← derived fields (prompts, loops, progress)
│       ├── promptGenerator.ts
│       ├── loopDetector.ts
│       └── progress.ts
└── vite.config.ts               ← compassApiPlugin()
```

---

## Data flow (read this before editing)

```text
gods-eye-projects.conf
        │
        ▼
GET /api/registry  ──────────────────────────────┐
        │                                         │
        ▼                                         │
pickInitialProject() / Settings select            │
        │                                         │
        ▼                                         │
GET /api/project?path=&label=                     │
  └─ buildSnapshot.ts                             │
       ├─ read docs/14, overlay, Bible, etc.      │
       ├─ parseHandoff.ts                         │
       └─ computeSnapshotVersion() (mtime hash)   │
        │                                         │
        ▼                                         │
loadOverrides(path) from IndexedDB                │
        │                                         │
        ▼                                         │
mergeSnapshot(base, overrides)                    │
        │                                         │
        ▼                                         │
enrichSnapshot(merged, dataMode)                  │
  └─ prompt cards, loop signals, done criteria,     │
     progress dimensions, reports stubs           │
        │                                         │
        ▼                                         │
ProjectContext → useCompassData() → page components
        │
        ▼
updateTask / updateDecision / … → persistOverrides → IndexedDB
```

**Two-source model:**

1. **Base snapshot (read-only from disk)** — rebuilt on refresh; sourced from consumer project's God's Eye files.
2. **Overrides (IndexedDB)** — task/decision/blocker/audit/phase patches, settings; survives refresh.

User edits in the UI write **overrides only**, never God's Eye files on disk.

---

## Project registry and default project

| Item | Location / behavior |
|------|---------------------|
| Registry file | `scripts/gods-eye-projects.conf` (monorepo root) |
| Format | `ABS_PATH\|label\|role` per line (`framework`, `master`, `app`, `user-global`) |
| Default project | **HimFLer** (`E:/NightRaven/HimFLer`) when no `localStorage` selection |
| Stored selection | `localStorage` key `compass.selectedProject` |
| Switch project | Settings → registry list → Select |

**Handoff isolation:** When Compass shows HimFLer, it reads `E:/NightRaven/HimFLer/docs/14_SESSION_HANDOFF.md` — not framework `gods-eye-1/docs/14`. Never bleed framework handoff into consumer app context.

---

## Auto-refresh (implemented)

When `settings.autoRefresh` is true and `dataMode === 'registry'`:

1. Client polls `GET /api/project/version?path=` every **10s** (`AUTO_REFRESH_POLL_MS`).
2. Server `computeSnapshotVersion()` hashes **mtime** of monitored artifacts (see `MONITORED_ARTIFACTS` in `server/buildSnapshot.ts`).
3. On version change → silent `loadProject()` → banner in `AppShell` ("God's Eye memory changed — snapshot refreshed").
4. Header badges: **Live** (watching) · **Refreshing…** · **Updated** (6s banner).

Toggle: Settings → Auto-refresh. Static `vite build` output has no API — polling fails silently; manual refresh unavailable without preview server.

---

## Phase 1–8 page map

Navigation ids live in `src/components/layout/navigation.ts`. Routes in `src/app/routeRegistry.tsx` — **must stay in sync** (startup throws if mismatch).

| Phase | Nav id | Page | Primary files |
|-------|--------|------|---------------|
| 1 | `dashboard` | Dashboard | `components/dashboard/*` |
| 2 | `scope-map` | Scope Map | `components/scope/ScopeMapPage.tsx` |
| 2 | `roadmap` | Roadmap | `components/roadmap/RoadmapPage.tsx` |
| 2 | `priority-board` | Priority Board | `components/priority/PriorityBoardPage.tsx` |
| 2 | `coder-tasks` | Coder Tasks | `components/queues/CoderTasksPage.tsx` |
| 2 | `next-prompt` | Next Prompt | `components/prompts/NextPromptPage.tsx` |
| 2 | `ge-queue` | God's Eye Queue | `TaskQueuePage` queueId=`ge-queue` |
| 2 | `nr-queue` | NR Queue | `TaskQueuePage` queueId=`nr-queue` |
| 2 | `research-queue` | Research Queue | `TaskQueuePage` queueId=`research-queue` |
| 2 | `decisions` | Decisions | `components/lists/DecisionsPage.tsx` |
| 2 | `blockers` | Blockers | `components/lists/BlockersPage.tsx` |
| 2 | `not-now` | Not Now | `components/lists/NotNowPage.tsx` |
| 5 | `auditor-queue` | Auditor Queue | `components/auditor/AuditorQueuePage.tsx` |
| 6 | `progress` | Progress Tracker | `components/progress/ProgressTrackerPage.tsx` |
| 6 | `done-criteria` | Done Criteria | `components/criteria/DoneCriteriaPage.tsx` |
| 7 | `memory-feed` | Memory Feed | `components/memory/MemoryFeedPage.tsx` |
| 7 | `settings` | Settings | `components/settings/SettingsPage.tsx` |
| 8 | `back-and-forth` | Loop Detector | `components/loops/LoopDetectorPage.tsx` |
| 8 | `reports` | Reports | `components/reports/ReportsPage.tsx` |

---

## Data modes

| Mode | When | Source |
|------|------|--------|
| `registry` | Dev server API succeeds | Live handoff parse + enrich |
| `local` | API fails for selected path | Mock snapshot seeded with project label |
| `mock` | Bootstrap catastrophic failure | `buildMockSnapshot()` |

Set in snapshot `settings.dataMode`; user cannot pick mode directly — it follows API availability.

---

## How to verify

```bash
cd apps/compass
npm install
npm run dev      # API + UI — registry mode works
npm run build    # tsc -b && vite build
npm run lint     # eslint .
npm run preview  # preview server also attaches compassApiPlugin
```

**Smoke checks:** Open Settings → confirm registry entries; select HimFLer; edit a task state → reload → override persists; edit a handoff file on disk → within ~10s see Live/Updated badge (auto-refresh on).

---

## Safe modification guide

| Task | Touch these files |
|------|-------------------|
| New sidebar page | `navigation.ts` + `routeRegistry.tsx` + new component |
| New snapshot field | `types/snapshot.ts` → `buildSnapshot.ts` → `enrichSnapshot.ts` → consumers |
| New override patch | `persistence.ts` → `snapshotMerge.ts` → `ProjectContext` updater |
| New API route | `compassApiPlugin.ts` + `compassApi.ts` |
| Prompt templates | `utils/promptGenerator.ts` |
| Handoff parsing | `server/parseHandoff.ts` |

**Exhaustive switches:** TypeScript unions use `never` in default cases (workspace rule).

**Imports:** Top of file only — no inline imports.

---

## Out of scope (locks — do not implement without explicit Brent approval)

- Cloud sync / multi-user database
- Autonomous AI agent execution from Compass UI
- Repo auto-editing (writing God's Eye files from Compass)
- Plugin / MCP manager UI
- React Router / URL deep links (MVP uses in-memory view state)

---

## Related docs

| Doc | Purpose |
|-----|---------|
| [`README.md`](README.md) | Human-oriented run + feature table |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | Snapshot shape, API routes, monitored files |
| [`docs/PROJECT_SCOPE.md`](docs/PROJECT_SCOPE.md) | Product scope |
| [`docs/DATA_MODEL.md`](docs/DATA_MODEL.md) | Domain types |
| Repo [`docs/NIGHTRAVEN_UNIFIED_PRODUCT.md`](../../docs/NIGHTRAVEN_UNIFIED_PRODUCT.md) | Monorepo boundaries |
| Repo [`docs/14_SESSION_HANDOFF.md`](../../docs/14_SESSION_HANDOFF.md) | Framework work only — not consumer app state |
