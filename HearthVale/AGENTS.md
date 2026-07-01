# AGENTS.md — HearthVale

Minimal rules for coding agents working in **this repository only**.

## Read first

1. `docs/14_SESSION_HANDOFF.md` — current focus, recent sessions, guardrails
2. `docs/01_PROJECT_MEMORY.md` — app memory (HearthVale-specific)
3. `STRATEGY.md` — product direction and Path A stack

## Laws

- **This repo only** — no cross-project memory bleed; do not import handoff or locks from other apps
- **Append-only ledgers** — `docs/ledgers/BUILD_LEDGER.md` and `docs/ledgers/AUDIT_LEDGER.md` are `+#` only; never edit or remove prior entries
- **Memory before edit** — read relevant `docs/` before changing files
- **Path A stack** — Phaser 3 + TypeScript data layer now; Node/Colyseus server later unless strategy is explicitly revised

## Stack (Path A)

| Layer | Technology |
|-------|------------|
| Client | Phaser 3, TypeScript |
| Data | TypeScript modules, JSON exports |
| Server (later) | Node, Colyseus |

## After meaningful work

Append `docs/14_SESSION_HANDOFF.md` **Recent sessions** (newest first, `+#` only).
