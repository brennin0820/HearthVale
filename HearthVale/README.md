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
npm install
cd client-phaser-next && npm install && cd ..
npm run dev:phaser
```

Open the printed local URL and choose **Begin Journey**. Use WASD/arrow keys to move, Shift to sprint, and E to talk to NPCs. Walking into a portal travels automatically. Nearby enemies are attacked automatically; Space or click still triggers a manual strike. The game loads `data/maps.json` and the NPC/monster catalogs directly at dev and build time.

The older Phaser implementation remains archived at `client-phaser-archive/`. The incomplete Unity experiment remains at `client-unity/`; neither is the default launch path.

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
| `npm run dev:phaser` | Run the active Phaser edition locally |
| `npm run build:phaser` | Typecheck and build the active Phaser edition |
| `npm run dev:server` | Run the local multiplayer server (Colyseus + Express on `ws://localhost:2567`) |
| `npm run build:server` | Typecheck the multiplayer server |
| `npm run test:server` | Headless multiplayer smoke tests (auth round trip, two-client shared-room movement) |
| `npm run test:phaser:mastery` | Verify level-18 mastery gates, saves, retraining, combat, healing, and economy effects |
| `npm run test:phaser:sunspire` | Verify Beaconfall/Sunspire maps, Sunblind, gathering, quests, boss rewards, and waylines |
| `npm run test:phaser:zenith` | Verify Aurora/Zenith maps, exclusive oath branches, Fractured, finale rewards, and wayline |
| `npm run test:phaser:crownroot` | Verify Choirwood/Crownroot maps, Muted counterplay, quests, boss rewards, techniques, and skill-loadout saves |
| `npm run test:phaser:runeveil` | Verify Runeveil/Namesong maps, quests, boss rewards, reusable runes, stat bonuses, and socket saves |
| `npm run test:phaser:convergence` | Verify Waystar/Convergence maps, quests, boss rewards, twelve callings, retraining, Severed counterplay, and saves |
| `npm run dev:client` | **Legacy, do not use** — Vite dev server against `client/`, a stale pre-archive duplicate (the canonical retired snapshot is `client-phaser-archive/`, not this). Not part of the current Unity workflow |
| `npm run build:client` | **Legacy, do not use** — typecheck + production build → `client/dist/`, same stale-duplicate caveat as above |
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

**Phaser Next is the active playable game.** Its 33 connected maps span two
regions with four-member party combat, six advancement paths, telegraphed
monster abilities, gathering, crafting, shops, equipment, consumables,
quests, bosses, courier travel, saves, a campaign ending, postgame routes, a
quest-aware world map, a persistent quest journal, and twelve level-18
masteries with path-specific combat and economy effects. The live level-26
endpoint continues beyond Zenith through Choirwood Canopy and Crownroot
Sanctum. Muted condition pressure, Clearvoice Tisane counterplay, a new boss,
and six quest-earned Crownroot techniques feed a persistent three-slot skill
loadout for every advanced path. Runeveil Gardens and Namesong Vault continue
that route with five reusable equipment runes, slot compatibility, immediate
combat stat changes, protected assignments, crafting, and save validation.
Waystar Moor and Convergence Spire now carry the campaign to level 28, where
the Manyroad Crown unlocks two permanent callings for every advanced path,
calling-exclusive techniques, paid retraining, and Severed rune counterplay.
Production art and audio
replacement remain future work; the complete solo progression loop is already
playable with procedural presentation and audio stubs.

**Real multiplayer is now in progress alongside the solo campaign.** A local
Node + Colyseus server (`server/`, `ws://localhost:2567`) hosts one room per
map, backed by local SQLite accounts and the same `WorldSimulation` rules the
solo client uses (now shared via the `shared/sim` workspace package). From
the title screen, "MULTIPLAYER (local server)" opens a login/register panel;
once connected, every player's leader and three AI companions move live for
every other connected player in the same room, and portals hand off between
rooms server-side. This is the foundation phase (MP-0/MP-1) of a longer plan —
server-authoritative combat and persistence, chat, real-player party
grouping, trading, guilds, and opt-in PvP are not built yet. Run it with
`npm run dev:server` alongside `npm run dev:phaser`.
