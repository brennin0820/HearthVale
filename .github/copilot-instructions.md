# GitHub Copilot — HearthVale

You are working in the **HearthVale** GitHub repository. The playable game package is nested:

```text
HearthVale/                 ← npm package (Phaser client, data, tools, docs)
  AGENTS.md                 ← canonical agent laws (always read this)
  STRATEGY.md
  docs/14_SESSION_HANDOFF.md
  docs/ROADMAP.md
  src/data/                 ← author here (TypeScript source of truth)
  data/                     ← exported JSON (do not hand-edit)
  client/                   ← Phaser 3 + Vite
  tools/                    ← CLI (scaffold, verify helpers)
  compass/                  ← guidance UI (optional)
```

## Read before any code change

1. `HearthVale/docs/14_SESSION_HANDOFF.md` — current focus and locks
2. `HearthVale/AGENTS.md` — laws (this-repo-only, append-only ledgers, Path A)
3. `HearthVale/STRATEGY.md` — product + stack
4. `HearthVale/docs/ROADMAP.md` — what is done vs open (Phase C current)

Paths below are relative to `HearthVale/` unless noted.

## Stack (Path A)

- Client: Phaser 3 + TypeScript + Vite (`client/`)
- Data: TypeScript modules under `src/data/` → `npm run export:data` → `data/*.json`
- Server: Node + Colyseus **later** — do not start multiplayer unless the task explicitly says so
- iOS Capacitor and `mac:compass` are Mac-only; skip on Linux CI runners

## How to change content

1. Edit TypeScript under `src/data/` (maps, catalogs, combat formulas). **Never** hand-edit exported `data/*.json` as the source of truth.
2. From `HearthVale/`: `npm run export:data` then `npm run verify`.
3. Client gameplay: `client/src/` (WorldScene, CombatController, HUD). After data edits that the client loads, re-export first.
4. After meaningful work, append `docs/14_SESSION_HANDOFF.md` **Recent sessions** (newest first, `+#` only). Never delete or rewrite prior ledger/handoff entries.

## Verify before finishing a PR

```bash
cd HearthVale
npm ci
cd client && npm ci && cd ..
npm run verify
npm run build:client
```

All verify checks must pass. Prefer one focused Phase C/D slice per PR (job UI, portal level gates, mine floors/boss, courier warp UI, etc.) — see ROADMAP.

## Coding conventions

- TypeScript; imports at top of file (no inline imports)
- Exhaustive `switch` on unions/enums with a `never` default
- Original Hearthlight Vale IP only — bank RO *mechanics*, never RO lore/asset names
- Map tile size is **32×32** when touching Tiled / collision
- Do not expand scope into Colyseus, production audio files, or cross-repo memory

## Out of scope unless asked

- Editing prior `BUILD_LEDGER` / `AUDIT_LEDGER` lines
- Committing secrets, `.env`, or `node_modules`
- Rewriting the nested folder layout
- Mac-only iOS/Xcode work on the Ubuntu Copilot runner
