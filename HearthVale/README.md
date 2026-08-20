# HearthVale

Cozy, Ragnarok Online–inspired **solo MMO** in the original world **Hearthlight Vale**. The active game is a fresh Phaser 3 browser edition backed by the project's validated world data.

## Stack

| Layer | Technology |
|-------|------------|
| Client | **Phaser 3 + TypeScript + Vite** — `client-phaser-next/` |
| Data | TypeScript modules, JSON exports — unchanged |
| Server (later) | Node, Colyseus |

## Quick start

```bash
# From the HearthVale/ package folder (repo root may nest this directory)
npm install
cd client-phaser-next && npm install && cd ..
npm run dev:phaser
```

Open the URL Vite prints (default `http://localhost:5173`). On the same Wi‑Fi, other devices can use the **Network** URL Vite prints (server binds `0.0.0.0`). Use **WASD** or **arrow keys** to move; walk into glowing **portals** to traverse the starter loop:

The older Phaser implementation remains archived at `client-phaser-archive/`. The incomplete Unity experiment remains at `client-unity/`; neither is the default launch path.

## Windows (local + GitHub remote)

**Remote:** https://github.com/brennin0820/HearthVale (public). Sync with `git pull` / `git push` from either Mac or Windows.

**Install once on the Windows PC:** [Git](https://git-scm.com/download/win), [Node.js LTS](https://nodejs.org/) (includes npm). Optional: [Cursor](https://cursor.com/) and open the cloned folder.

```powershell
# Clone (PowerShell or Git Bash)
cd $env:USERPROFILE\Developer
git clone https://github.com/brennin0820/HearthVale.git
cd HearthVale\HearthVale

npm install
cd client; npm install; cd ..
npm run verify
npm run dev:client
```

Open `http://localhost:5173` (or the Network URL for another device on the LAN).

**Windows notes**

| Works on Windows | Does not (Mac-only) |
|------------------|---------------------|
| Phaser client (`dev:client` / `build:client`) | `ios:sync` / `ios:open` (needs Xcode) |
| Data export + `npm run verify` | `mac:compass` Electron `.app` |
| Compass in browser: `npm run dev:compass` | — |
| Git sync with GitHub | — |

If Windows Defender or the firewall prompts when Vite starts, allow Node on private networks so LAN play works.

**Already cloned?** `git pull` inside the repo, then re-run `npm install` in root and `client/` if `package-lock.json` changed.

## Scripts

| Script | Description |
|--------|-------------|
| `npm run export:data` | Export TS world + catalog → `data/` |
| `npm run unity:sync-data` | Sync repo-root `data/` into `client-unity/Assets/StreamingAssets/data` (prefers link/junction, falls back to mirrored copy) |
| `npm run unity:refresh-data` | Run `export:data`, then sync Unity StreamingAssets in one step |
| `npm run verify:all` | Export + full validation suite (portals, spawns, NPCs, bounds, drops, items, quests, jobs, skills, audio) |
| `npm run verify` | Alias for `verify:all` |
| `npm run rathena:audit -- <path/to/rathena> [--max-level <n>] [--top <n>] [--limit <n>] [--out <path>]` | Compatibility audit against local rAthena DB extracts (default output `data/rathena-audit.json`) |
| `npm run hearthvale -- help` | Tooling CLI (scaffold, balance, CSV, Tiled, research) |
| `npm run hearthvale -- research "<topic>" <lane>` | Online resource search URLs (pixel/world/audio/engine) |
| `npm run hearthvale -- rathena-audit <path/to/rathena> [--max-level <n>] [--top <n>] [--limit <n>] [--out <path>]` | Run compatibility scan via CLI |
| `npm run balance:report` | Spawn level vs map level warnings |
| `npm run dev:client` | Vite dev server for Phaser client |
| `npm run build:client` | Typecheck + production build → `client/dist/` |
| `npm run ios:sync` | Build the Phaser client and sync it into the iOS Xcode project |
| `npm run ios:open` | Open the generated HearthVale iOS project in Xcode |
| `npm run dev:compass` | NightRaven Compass in browser |
| `npm run mac:compass` | Compass as native macOS app (Electron) |
| `npm run build:compass:mac` | Build `HearthVale Compass.app` |

## iOS

HearthVale ships the same Phaser/TypeScript game in a landscape iOS shell with
safe-area-aware touch controls for movement, skills, attack, brace, interaction,
and the local map.

```bash
npm install
cd client && npm install && cd ..
npm run ios:sync
npm run ios:open
```

In Xcode, select the `App` scheme and an iPhone simulator or signing-enabled
device, then Run. Re-run `npm run ios:sync` whenever client or exported data
changes.

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

**Phase C current** — Phaser client plays the full 10-map greybox with live combat, skills, loot, and HUD. Remaining C: mine boss/floors, job selection, enforced portal level gates, Hearth Courier warp UI. See `docs/ROADMAP.md`.
