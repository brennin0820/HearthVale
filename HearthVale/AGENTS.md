# AGENTS.md — HearthVale

Minimal rules for coding agents working in **this repository only**.

## Read first

1. `docs/14_SESSION_HANDOFF.md` — current focus, recent sessions, guardrails
2. `docs/01_PROJECT_MEMORY.md` — app memory (HearthVale-specific)
3. `STRATEGY.md` — product direction and current client stack

## Laws

- **This repo only** — no cross-project memory bleed; do not import handoff or locks from other apps
- **Append-only ledgers** — `docs/ledgers/BUILD_LEDGER.md` and `docs/ledgers/AUDIT_LEDGER.md` are `+#` only; never edit or remove prior entries
- **Memory before edit** — read relevant `docs/` before changing files
- **Current stack** — Phaser 3 + TypeScript active client in `client-phaser-next/`; unchanged TypeScript data layer; Node/Colyseus server now in progress (local-dev only) in `server/`, alongside the solo campaign

## Stack

| Layer | Technology |
|-------|------------|
| Client | Phaser 3 + TypeScript + Vite — `client-phaser-next/`; Unity scaffold retained at `client-unity/`; old Phaser client archived at `client-phaser-archive/` |
| Data | TypeScript modules, JSON exports (`src/data/**` → `data/*.json`, `data/catalog/*.json`) — shared by all clients |
| Shared sim | `shared/sim/` — `WorldSimulation`/`CollisionGrid`/data contract, npm workspace shared by `client-phaser-next` and `server/` |
| Server | Node + Colyseus, local-dev only (`ws://localhost:2567`) — `server/`. MP-0/MP-1 done (2026-07-28); see `docs/14_SESSION_HANDOFF.md` for the next task |

## After meaningful work

Append `docs/14_SESSION_HANDOFF.md` **Recent sessions** (newest first, `+#` only).
