# Phase Plans

One implementation plan per remaining project phase. Authored 2026-07-01 for
the autonomous improvement loop; useful to any human or agent session.

## How these are consumed

- `.claude/project-state.md` names the **current phase** and links here.
- Each plan's work items are sized to roughly one focused loop iteration
  (inspect → change → verify → log).
- A phase is only advanced when every item in its **Definition of Done** has
  passed its concrete validation step — no "looks done" promotions.
- Plans are living documents: when reality diverges (a blocker, a better
  ordering), edit the plan and note why in `.claude/project-state.md`'s
  iteration log.

## Index

| Plan | Phase | Status |
|---|---|---|
| [PHASE_B_UNITY.md](PHASE_B_UNITY.md) | B-Unity — Unity starter loop | **CURRENT** (M1 static verification in progress; M2+ blocked on Unity Editor/MCP) |
| [PHASE_C_UNITY.md](PHASE_C_UNITY.md) | C-Unity — Dungeon depth + boss | Planned |
| [PHASE_D.md](PHASE_D.md) | D — Early expansion + world map UI | Planned |
| [PHASE_LATER.md](PHASE_LATER.md) | Later — Server-authoritative multiplayer | Backlog sketch (not executable) |

Completed phases (no plan needed): **A — Data foundation** (verify suite
green); **B-Phaser** (retired, archived at `client-phaser-archive/`).

## Invariants that apply to every phase

- `npm run verify:all` and root `npx tsc --noEmit` must stay green.
- The TS data layer (`src/data/**` → `npm run export:data` → `data/*.json`)
  is the single source of truth. Unity reads JSON via the StreamingAssets
  junction (`npm run unity:refresh-data`).
- Schema changes touch TS types AND C# DTOs
  (`client-unity/Assets/Scripts/Data/*.cs`) in the same change, then re-export.
- Coordinate convention: data is Y-down (Phaser-authored); Unity negates Y on
  read (`WorldController.ToUnityPosition`). Never "fix" this in the data.
- `client/` and `client-phaser-archive/` are retired — no new work there.
- No new dependencies unless genuinely necessary.
