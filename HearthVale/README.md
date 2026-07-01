# HearthVale

Cozy, Ragnarok Online–inspired **solo MMO** in the original world **Hearthlight Vale**. Phase A targets a starter region for **levels 1–14**.

## Stack (Path A)

| Layer | Technology |
|-------|------------|
| Client | Phaser 3, TypeScript, Vite |
| Data | TypeScript modules, JSON exports |
| Server (later) | Node, Colyseus |

## Quick start

```bash
# Data layer (export + verify portal graph)
npm install
npm run verify

# Phaser client (install client deps first)
cd client && npm install && cd ..
npm run dev:client
```

Open the URL Vite prints (default `http://localhost:5173`). Use **WASD** or **arrow keys** to move; walk into glowing **portals** to traverse the starter loop:

**Hearthvale Town** ↔ **Cloverfield Plains** ↔ **Mushroom Hollow** · **Old Crystal Mine** (via mine mouth / exit)

## Scripts

| Script | Description |
|--------|-------------|
| `npm run export:data` | Export TS world + catalog → `data/` |
| `npm run verify:all` | Export + full validation suite (portals, spawns, NPCs, bounds, drops, items, quests, audio) |
| `npm run verify` | Alias for `verify:all` |
| `npm run hearthvale -- help` | Tooling CLI (scaffold, balance, CSV, Tiled, research) |
| `npm run hearthvale -- research "<topic>" <lane>` | Online resource search URLs (pixel/world/audio/engine) |
| `npm run balance:report` | Spawn level vs map level warnings |
| `npm run dev:client` | Vite dev server for Phaser client |
| `npm run build:client` | Typecheck + production build → `client/dist/` |
| `npm run dev:compass` | NightRaven Compass in browser |
| `npm run mac:compass` | Compass as native macOS app (Electron) |
| `npm run build:compass:mac` | Build `HearthVale Compass.app` |

## NightRaven Compass (Mac)

Project guidance UI — reads HearthVale God's Eye handoff, roadmap, and ledgers. See [`compass/README.md`](compass/README.md).

```bash
cd compass && npm install
npm run mac:compass   # from repo root
```

## Docs

- `STRATEGY.md` — product direction
- `AGENTS.md` — agent entry rules
- `docs/14_SESSION_HANDOFF.md` — session continuity
- `docs/ROADMAP.md` — phased delivery plan
- `docs/world/HEARTHLIGHT_VALE_LAYOUT.md` — starter region layout
- `docs/ledgers/` — NightRaven build and audit ledgers

## Status

**Phase B complete** — Phaser starter client loads `data/maps.json`, renders placeholder maps, and supports the 4-map portal loop. Phase C: dungeon depth, combat hooks, Whisperwood unlock gating.
