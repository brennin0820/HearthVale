# Session Handoff — HearthVale

Continuity notes for the next agent/session. This file did not exist prior to
2026-07-01 despite `AGENTS.md` requiring it as required reading — created now
as part of the Unity migration pass.

## Current focus

**Phaser Next is now the active playable client.** Run `npm run dev:phaser`
from the repository root. The new client lives in `client-phaser-next/` and
loads the existing exported JSON data directly. The Unity scaffold is retained
for reference but is no longer the default runtime.

**Real multiplayer is now in progress alongside the solo campaign** (MP-0/MP-1
done, 2026-07-28 — see the session entry below and `docs/ROADMAP.md`'s "Later
— Server-authoritative multiplayer" section for full phase detail). Run
`npm run dev:server` (Colyseus + Express on `ws://localhost:2567`) alongside
`npm run dev:phaser`.

### Next task: MP-2 — server-authoritative combat + character persistence

This is the recommended next unit of work, already scoped in
`docs/ROADMAP.md`:

1. **Seed the remaining RNG.** `shared/sim/src/WorldSimulation.ts`'s
   `rollDrops()` (loot rolls, ~line 1306/1308/1312) and `gatherResource()`'s
   bonus roll (~line 564-565) still call raw `Math.random()` — everything
   else (crit/evasion) already uses the deterministic `seeded(seed)` FNV-1a
   helper (~line 202-206) keyed on per-entity attack-sequence counters. Add
   matching `gatherSequences`/`dropSequences` counters and route these two
   call sites through `seeded()` too, salted with a server-generated
   per-room secret so outcomes aren't client-guessable. This is the last gap
   before loot/gathering can be trusted as server-authoritative.
2. **Persist characters in SQLite.** `server/src/persistence/db.ts` already
   creates a `characters` table (`id, account_id, name, save_json,
   saved_at`) but nothing reads/writes it yet — every multiplayer join in
   `server/src/rooms/WorldRoom.ts::onJoin` currently starts a **fresh
   level-1** `WorldSimulation` every time. Add
   `server/src/persistence/characterRepository.ts` with save/load functions
   that serialize the same shape `client-phaser-next/src/game/persistence/
   saveStore.ts`'s `SaveGame` already uses (party/inventory/quests/equipment/
   sockets/discoveredMapIds/resourceCooldowns/gold), reusing that file's
   existing `normalizeEquipmentState`/`normalizeSocketState` clone/migration
   logic rather than re-deriving it. Wire load-on-join and save-on-leave
   (plus a periodic autosave) into `WorldRoom`.
3. **Add a smoke test** proving a character's level/position/inventory
   survives a disconnect + rejoin (extend `server/scripts/*-smoke.ts`,
   same `tsx` pattern as the existing `auth-smoke.ts`/`world-room-smoke.ts`,
   wired into `server/scripts/run-smoke.ts` and `npm run test:server`).

Do **not** start MP-3 (chat/real-player party grouping), MP-4 (trading),
MP-5 (guilds), or MP-6 (PvP) before MP-2 — they all assume persisted,
server-authoritative characters exist. Party grouping in particular depends
on a locked-in decision already made: **players keep their existing 3 AI
companions**; multiplayer "party" is a later "party of squads" concept
(MP-3), not a same-player-1-avatar redesign — don't relitigate that.

### Known gaps / honest scope-downs from the MP-0/MP-1 pass (not bugs, just not done yet)

- **No client-side prediction/reconciliation.** `MultiplayerWorldScene`
  renders whatever the server broadcasts directly — fine on localhost,
  will feel laggy the moment this server is reachable over a real network.
  Fine to leave until real hosting is in scope.
- **Monsters are per-player-instanced, not shared.** Two players in the same
  room each get their own independent monster spawns (keyed
  `${sessionId}:${uid}` in `WorldRoom`'s schema projection) — they see each
  other move, but aren't actually fighting the same mobs. This is an
  intentional consequence of reusing `WorldSimulation` unmodified per player
  (see `docs/01_PROJECT_MEMORY.md` "Multiplayer facts"), not a bug to "fix"
  incidentally while doing MP-2 — real shared/contested monsters are a
  bigger design question for later.
- **Never visually verified in a real browser.** The sandbox this was built
  in had no `chromium-cli`/cached Playwright browsers, so `TitleScene`'s new
  login panel and `MultiplayerWorldScene`'s rendering were verified via
  headless Colyseus smoke tests and live curl checks against the running
  dev server, not an actual screenshot. If you have real browser tooling,
  do that check before touching the UI further.
- **Two pre-existing, unrelated failures**: `npm run test:phaser:dawnshore`
  and `npm run test:phaser:stormglass` fail on a `tidebreak_causeway`
  resource-node walkability bug — documented in the 2026-07-23 entry below,
  predates this session, not caused by the multiplayer work. Don't assume
  multiplayer changes caused these if you see them fail again.

## Guardrails

- Do not resurrect or extend `client/` or `client-phaser-archive/`; they remain
  historical. Active browser client work goes in `client-phaser-next/`.
- Do not touch `src/data/**`, `scripts/**`, or `tools/**` as part of "Unity
  work" unless a data schema is genuinely missing a field the Unity client
  needs — in that case, add the field to the TS types AND the C# DTOs
  (`client-unity/Assets/Scripts/Data/*.cs`) together, re-run
  `npm run export:data`, and note it in the build ledger.
- `npm run verify` must stay green. It was green after the 2026-07-23
  map-size scale pass (`MAP_GRID_SCALE = 1.5`).
- Coordinate convention: data is Y-down (Phaser-authored), Unity client code
  negates Y on read. Don't "fix" this by flipping the data — see
  `client-unity/README.md`.
- **Multiplayer guardrails**: `shared/sim/` is now the single copy of
  `WorldSimulation`/`CollisionGrid`/the data contract — edit it there, not
  at the old `client-phaser-next/src/game/{simulation,data,input}/*` paths
  (those are now `export * from '@hearthvale/sim'` shims kept only for
  import-path compatibility). Any change to `shared/sim/` must keep all 25
  `npm run test:phaser:*` suites green (they instantiate `WorldSimulation`
  directly) AND `npm run test:server` green (the same class runs
  server-side). The multiplayer server is **local-dev only** —
  `ws://localhost:2567`, SQLite in `server/hearthvale.db` (gitignored); do
  not add cloud deployment, TLS, or hosting config without the user asking.

## Recent sessions (newest first)

### 2026-07-29 — Primary player-avatar spec: late-Sengoku fire swordsman
- Promoted `late_sengoku_fire_swordsman_player_sheet.png` to Aster's persistent solo player avatar (member `warden`), while leaving the other party roles on their existing sheets.
- The selected appearance remains stable through gameplay job changes; `npm run build:phaser` verifies the active client compiles and packages the sheet.

### 2026-07-29 — Late-Sengoku fire swordsman player sheet

- Added a standalone transparent 2×4 player sheet for a late-Sengoku wandering
  fire swordsman at `data/assets/sprite-samples/late_sengoku_fire_swordsman_player_sheet.png`.
  It is 1536×1024, with eight 384×512 directional frames in the active Phaser
  convention. The sheet is a sample asset only and is not wired into a party
  role or manifest.

### 2026-07-29 — Prompt-kit sprites integrated at 2.5D world scale

- The active solo Phaser renderer now preloads the five prompt-kit sheets as
  384×512 spritesheets and renders the party with their specified eight
  directions, bottom-foot anchoring, and a 0.18 presentation scale. Physics,
  collision, authored map coordinates, and the 32-unit world grid remain
  unchanged.
- Camera zoom now targets the larger 2.5D actors responsively (0.72–0.98),
  maintaining useful map coverage. The multiplayer placeholder renderer,
  NPCs, and monsters remain intentionally unchanged pending their own art.
- Verification: `npm run build:phaser` and `npm run verify` pass; the built
  Vite output contains all five sheets. No browser automation is installed in
  this checkout, so live canvas screenshot QA remains outstanding.

### 2026-07-29 — Prompt-kit sprite alpha-matte correction

- Reprocessed all five generated class sheets from their original source files
  with a border-connected key rather than a broad color wipe. The entire
  magenta field and its fringe are now transparent while dark/purple character
  details remain intact. Confirmed 32-bit ARGB output with transparent corners
  and a transparent inter-cell gap on every sheet.

### 2026-07-29 — Prompt-kit 2.5D directional class sprite sheets

- Generated the complete tier-1 class sample set with the built-in image
  generator: Vale Warden, Glade Ranger, Thorn Channeler, Hearth Mender, and
  Hollow Shade. Each is a 1536×1024, two-row by four-column directional sheet
  in the prompt kit's Down → Down-Left order.
- The generated magenta backdrop was keyed to alpha and the five final PNGs
  live in `data/assets/sprite-samples/`. They are sample assets only; no
  runtime manifest or gameplay asset index has been changed.

### 2026-07-29 — MP-2 server-authoritative RNG and character persistence

- Replaced the final raw `Math.random()` calls in `shared/sim` gathering and
  loot resolution with sequence-keyed FNV-1a rolls. `WorldRoom` now generates a
  private 32-byte room salt and supplies it to every server simulation, so
  authoritative loot and gathering outcomes cannot be predicted from client
  state. The matching Phaser fixtures use explicit test-only salts instead of
  monkeypatching global randomness.
- Moved the solo `SaveGame` shape and its cloning/migration rules into
  `@hearthvale/sim`. The browser localStorage save store and the server now use
  the same normalized party, inventory, quest, equipment, socket, discovery,
  resource-cooldown, gold, map, and timestamp contract.
- Added `server/src/persistence/characterRepository.ts`: one durable character
  per local account in the existing SQLite `characters` table. `WorldRoom`
  loads a character on join, restores its saved leader position when returning
  to that map, saves on leave, and autosaves every 30 seconds. Auth replies now
  expose the last saved map so the multiplayer title flow resumes the character
  in the correct room. The existing AI-companion party model is unchanged.
- Added `character-persistence-smoke.ts` to `npm run test:server`; it seeds a
  level-6 character with inventory, moves it through a real Colyseus room,
  disconnects, and verifies level, exact leader position, and inventory after
  rejoin.
- Verification: `npm run verify`, `npm run build:phaser`, `npm run build:server`,
  and `npm run test:server` pass. All 25 Phaser smoke commands were run: 23
  pass; `test:phaser:dawnshore` and `test:phaser:stormglass` retain only their
  pre-existing `tidebreak_causeway` resource-node walkability failures.

### 2026-07-28 — Real multiplayer: MP-0/MP-1 (server foundation + shared-world visibility)

Kicked off converting HearthVale from a solo-only game into a true MMORPG
per user request, via a phased MP-0..MP-6 plan (full detail in
`docs/ROADMAP.md`'s "Later" section and `docs/01_PROJECT_MEMORY.md`'s
"Multiplayer facts" section — read those before continuing this work, don't
re-derive). Solo campaign is completely unaffected. See "Next task: MP-2"
above for what to do next.

- Extracted `WorldSimulation.ts`/`CollisionGrid.ts`/the data contract out of
  `client-phaser-next` into a new `shared/sim/` npm-workspace package
  (`@hearthvale/sim`), so the client and the new server share one copy of the
  simulation rules. Old import paths are thin re-export shims — zero edits
  needed in any of the 25 existing smoke tests or `WorldScene.ts`.
- Added root `workspaces` field (`client-phaser-next`, `shared/sim`,
  `server`) to `package.json`.
- Built `server/` — Node + Colyseus, local-dev only (`ws://localhost:2567`,
  `npm run dev:server`): `WorldRoom` (one room per `mapId`, one
  `WorldSimulation` instance per connected player — their existing 4-unit
  squad, unmodified), local SQLite accounts (scrypt-hashed passwords, opaque
  session tokens, `server/hearthvale.db`, gitignored), server-side
  portal-gate validation on room-crossing (level/quest requirements
  re-checked against the room's own `map.portals`, not trusted from the
  client), and a 25s reconnect grace window. `server/src/data/
  loadGameData.ts` imports `src/data/**` directly (same pattern as
  `scripts/export-data.ts`), no JSON round-trip.
- Added `client-phaser-next`'s `MultiplayerWorldScene` (renders whatever the
  room broadcasts — other players' leaders + companions, monsters, HP bars;
  no client-side prediction yet, see "Known gaps" above) and a "MULTIPLAYER
  (local server)" login/register panel on the title screen (Phaser DOM
  element, plain fetch calls to the new `/auth/register`/`/auth/login`
  routes).
- Added `server/scripts/*-smoke.ts` (auth round trip; two real
  `colyseus.js` clients joining the same room and confirming they see each
  other's live movement) wired into `npm run test:server`.
- Verification: `npm run verify` (15 checks), `npm run build:phaser`,
  `npm run build:server`, `npm run test:server`, and all pre-existing
  `npm run test:phaser:*` suites pass **except** the two documented
  pre-existing `dawnshore`/`stormglass` failures (unrelated, see "Known
  gaps" above — confirmed via `git status` that those smoke-test files and
  the underlying collision data were already untracked/modified before this
  session touched anything). Also ran both `npm run dev:server` and
  `npm run dev:phaser` live and exercised the real HTTP auth endpoints with
  `curl` against the running process (not just the isolated smoke tests).
- **Not done / explicitly out of scope this pass**: visual browser
  verification (no browser automation tool available in this sandbox — see
  "Known gaps"); everything in MP-2 through MP-6 (server-authoritative
  combat/loot RNG, character persistence, chat, real-player party grouping,
  trading, guilds, PvP).

### 2026-07-23 — Data-driven biome palettes and prop depth sorting

- `WorldPainter` no longer carries a hardcoded 14-entry `BIOME_PALETTES` table.
  Terrain palettes now derive from the authored `data/biomes.json` contract via
  `client-phaser-next/src/phaser/view/palette.ts`. **19 of 33 maps** previously
  fell through to one of four generic per-kind palettes — the whole starter
  region plus Runeveil, Namesong, Waystar, and Convergence. All 30 biomes now
  render their authored identity.
- The derived ramp reproduces the 14 hand-tuned palettes within 2–8 RGB units
  (no visual regression) and fixes Emberglass Shelf and Hollow Kiln, where
  `ground == walkable == wall` made collision edges literally invisible.
- Standing props (trees, buildings, crystals, stalls…) were all baked into one
  `Graphics` at depth `-10000`, so the party always drew **in front of** every
  tree and building. They are now grouped into 16px foot-line bands on the actor
  depth scale (`propDepth.ts`). Props are static, so this costs nothing per
  frame — ~8–37 band layers per map. Resource nodes moved from `y + 9600` to
  `y + 10000` to sort on the same scale.
- Added the missing `stall` paint branch (7 authored stalls rendered as generic
  blobs).
- New `scripts/verify-biomes.ts` (wired into `npm run verify`) fails if any map
  uses a biome with no authored entry, so this class of drift cannot recur.
- New `npm run test:phaser:painter` covers palette separation, biome coverage,
  band ordering, and prop-kind coverage headlessly.

**Known-broken, NOT caused by this pass:** `test:phaser:dawnshore` and
`test:phaser:stormglass` fail — `tidebreak_causeway` resource node
`stormreed_stand_2` at (-304, 400) sits inside the `tidebreak_channel_south`
rift and is unwalkable. This is fallout from the 1.5× map-scale pass below,
which ran `npm run verify` (no walkability check on resource nodes) but not the
Phaser smoke suites. `export:data` is deterministic; the coordinate needs
fixing in `src/data/world/maps.ts` (`TIDEBREAK_CAUSEWAY_POINTS.stormreed2`).

### 2026-07-23 — Map sizes scaled 1.5×

- Introduced canonical `MAP_GRID_SCALE = 1.5` in `src/data/world/mapScale.ts`
  (~2.25× area). All map grids, tile layouts, RO ASCII maps, and hardcoded
  world spawns/portals now go through scale helpers.
- Average grid area rose from ~2174 to ~4891 tiles. Examples: Hearthvale Town
  48×36 → 72×54; Waystar Moor 60×44 → 90×66; RO town 48×28 → 72×42.
- Camera bounds, collision, props, and points derive from scaled `gridSize`.
  Portal proximity verify threshold scaled with the same factor (200 → 300).
- `npm run export:data` and `npm run verify` passed (33 maps, 68 portals).

### 2026-07-22 — Waystar, Convergence, and level-28 callings

- Extended Dawnshore Reach into the level 26–27 Waystar Moor field and level
  27–28 Convergence Spire dungeon with authored collision, props, palettes,
  music, reciprocal travel, nine resources, linked quests, a tenth shop, and
  two quest-unlocked waylines.
- Added six monsters, seventeen items, six drop tables, six recipes, two
  quests, three NPCs, and seven abilities. The Manyroad Crown drops the
  guaranteed keystone; Anchorcord Tea cures Severed, which temporarily
  suppresses non-health rune bonuses.
- Added two level-28 callings for every advanced job. Each of the twelve choices
  grants permanent bonuses and one exclusive technique; first selection is
  free, retraining costs 500 gold, path changes clear the calling, and old or
  malformed saves are validated. Pathweaver Ione owns the responsive UI.
- Current totals: 33 maps in two regions, 68 portals, 71 monsters, 167 items,
  71 drop tables, 71 resource nodes, 10 shops, 52 recipes, 23 quests, 39 unique
  NPCs, 28 world-map pins, 28 music keys, 42 authored monster abilities, and
  38 skills. `npm run verify`, `npm run build:phaser`, and all 24 Phaser smoke
  suites pass. Browser QA covered desktop/mobile callings, a real 500g switch,
  both new maps, the boss arena, nonblank canvases, and empty problem logs.

### 2026-07-22 — Runeveil, Namesong, and equipment runes

- Extended Dawnshore Reach from Crownroot into the level 24–25 Runeveil
  Gardens field and level 25–26 Namesong Vault dungeon with authored collision,
  props, palettes, music, reciprocal travel, chart pins, nine resources, linked
  quests, a ninth shop, and two quest-unlocked waylines.
- Added six monsters, eighteen items, six drop tables, five recipes, two quests,
  three NPCs, and seven monster abilities. The Archivore drops the guaranteed
  Namesong Seal; quest rewards include Veilguard and Hollowstar equipment.
- Added five reusable equipment runes with explicit slot compatibility and
  ATK/DEF/HP/SPD/CRIT bonuses. The armory exposes one rune menu per equipped
  slot; replacement and unequip release runes, assigned copies cannot be sold
  or double-bound, HP changes synchronize immediately, and old/malformed saves
  migrate safely.
- Current totals: 31 maps in two regions, 64 portals, 65 monsters, 150 items,
  65 drop tables, 62 resource nodes, 9 shops, 46 recipes, 21 quests, 36 unique
  NPCs, 26 world-map pins, 26 music keys, 35 authored monster abilities, and
  26 skills. `npm run verify`, `npm run build:phaser`, and all 23 Phaser smoke
  suites pass. The live client remains at `http://127.0.0.1:5175/`.

### 2026-07-22 — Choirwood, Crownroot, and skill loadouts

- Extended Dawnshore Reach from Zenith into the level 22–23 Choirwood Canopy
  field and level 23–24 Crownroot Sanctum dungeon with authored collision,
  props, palettes, music, reciprocal travel, chart pins, nine resources,
  linked quests, an eighth shop, and two quest-unlocked waylines.
- Added six monsters, seventeen items, six drop tables, five recipes, two
  quests, three NPCs, and seven monster abilities. Muted prevents active skill
  casting while preserving ordinary attacks; Clearvoice Tisane removes it.
  The Crownroot Hierophant drops the guaranteed Concordance Seed.
- Added one level-24 Crownroot technique for every advanced job and a saved
  three-slot skill loadout. The armory shows all four path skills with level,
  quest, path, capacity, and minimum-one gates; equipped changes immediately
  rebind keys and feed manual plus auto-combat priorities. Invalid old or
  malformed save selections fall back to path defaults.
- Current totals: 29 maps in two regions, 60 portals, 59 monsters, 132 items,
  59 drop tables, 53 resource nodes, 8 shops, 41 recipes, 19 quests, 33 unique
  NPCs, 24 world-map pins, 24 music keys, 28 authored monster abilities, and
  26 skills. `npm run verify`, `npm run build:phaser`, and all 22 Phaser smoke
  suites pass. In-app browser QA covered both maps, Crownroot's boss arena, a
  real skill swap and hotkey update, default desktop and 390x844 layouts,
  transient HUD spacing, and empty warning/error logs. The live client remains
  at `http://127.0.0.1:5175/`.

### 2026-07-22 — Aurora Highlands, Zenith Archive, and branching oaths

- Extended Dawnshore Reach from Sunspire into the level 20–21 Aurora
  Highlands field and level 21–22 Zenith Archive dungeon with authored
  collision/props, palettes, music, reciprocal travel, chart pins, resources,
  encounters, a seventh shop, and a quest-unlocked Zenith wayline.
- Added the first durable branching quest contract. Keeper Aurell's gentle
  oath and Warden Maelis's direct oath are mutually exclusive; completing
  either satisfies Archivist Nerys's OR prerequisite for the shared archive
  finale. The journal explains both the chosen lockout and either/or gate.
- Added six monsters, seventeen items, six drop tables, nine resource nodes,
  five recipes, three quests, four NPCs, and seven abilities. Fractured reduces
  party defense against ordinary and telegraphed attacks until Mending Salve
  removes it; the Keeper of Zenith drops the guaranteed finale proof.
- Current totals: 27 maps in two regions, 56 portals, 53 monsters, 115 items,
  53 drop tables, 44 resource nodes, 7 shops, 36 recipes, 17 quests, 30 unique
  NPCs, 22 world-map pins, 22 music keys, and 21 authored monster abilities.
  `npm run verify`, `npm run build:phaser`, and all 21 Phaser smoke suites pass.
  Browser QA covered both maps, oath lock guidance, the highland shop, the
  eight-pin chart, desktop and 390x844 layouts, zero overflow, and no console
  warnings/errors. The live client remains at `http://127.0.0.1:5175/`.

### 2026-07-22 — Beaconfall Cliffs and Sunspire Observatory

- Extended Dawnshore Reach from Stormglass Reliquary into the level 18–19
  Beaconfall Cliffs field and level 19–20 Sunspire Observatory dungeon. Both
  maps have authored collision/props, distinct palettes and music, reciprocal
  travel, world-map pins, gathering nodes, and quest-unlocked courier waylines.
- Added Astronomer Sela, Cliffsmith Roan, a sixth shop, six monsters, sixteen
  items, six drop tables, nine resource nodes, five recipes, and two linked
  quests. The route culminates in the Celestial Orrery, its guaranteed Aurora
  Lens Core, the legendary Sunspire Compass, and a level-20 campaign endpoint.
- Added Sunblind to the shared ability contract. Solar Flare, Refracted Gaze,
  and Daybreak Axis can apply it; it reduces outgoing damage and critical
  chance, appears as a harmful HUD condition, and is removed by Clarity Tonic.
- Current totals: 25 maps in two regions, 52 portals, 47 monsters, 98 items,
  47 drop tables, 35 resource nodes, 6 shops, 31 recipes, 14 quests, 26 unique
  NPCs, 20 world-map pins, 20 music keys, and 14 authored monster abilities.
  `npm run verify`, `npm run build:phaser`, and all 20 Phaser smoke suites pass.
  Browser QA covered both maps, the boss arena, six-pin regional chart,
  outfitter, 1280x720 and 390x844 layouts, zero overflow, and no console issues.
  The live client remains at `http://127.0.0.1:5175/`.

### 2026-07-22 — Level-18 Lantern Masteries

- Added two authored level-18 masteries to every advanced path, for twelve
  choices total. Bonuses cover HP, MP, ATK, DEF, haste, critical chance,
  outgoing power, healing, evasion, shop prices, drops, and material stacks.
- The first mastery is free and changing it costs 300 gold. Selection is
  restricted to the member's current path, persists in saves and travel,
  validates malformed legacy data, updates derived HP/MP without doubling,
  and clears when the member retrains into a different path.
- Trainer Bram now presents a responsive mastery section beneath the path
  list with member-specific choices, bonus chips, locks, current state, cost,
  and two-step confirmation. `previewMastery=1` prepares a level-18 party and
  500 gold for deterministic QA.
- Added `test:phaser:mastery`. All 19 Phaser smoke suites, `npm run verify`,
  and `npm run build:phaser` pass. Browser QA covered level gating, free
  selection, paid retraining, immediate HP changes, member switching,
  1440x900 and 390x844 layouts, and zero console warnings/errors. The live
  client remains at `http://127.0.0.1:5175/`.

### 2026-07-22 — Lantern Path quest journal

- Replaced the compact tracker as the only quest reference with a responsive
  campaign journal. Current, available/locked, and completed views expose all
  twelve quests with state labels, level/prerequisite guidance, descriptions,
  objective-by-objective progress, XP/gold/item rewards, and giver/return NPCs.
- Added quest pinning from the detail pane. The pinned quest leads the compact
  tracker, survives saves and legacy migration, and is preserved through
  portals, Hearth Charm travel, courier travel, title reloads, and map scene
  restarts. The compact tracker is capped at two rows to avoid HUD overlap.
- Added toolbar and `J` access, touch-friendly narrow layout, mutual exclusion
  with map/loadout overlays, and simulation pausing while the journal is open.
  `previewJournal` provides a frozen authored state for repeatable visual QA.
- Added a pure quest-journal model and `test:phaser:journal`. All 18 Phaser
  smoke suites, `npm run verify`, and the production build pass. Live browser
  checks covered filtering, lock guidance, pin/unpin, keyboard and toolbar
  access, pause/resume behavior, 1280x720 and 500x844 layouts, no overflow,
  and zero browser errors. The live client remains at
  `http://127.0.0.1:5175/`.

### 2026-07-22 — Tidebreak Causeway and Stormglass Reliquary

- Extended Dawnshore Reach east through the level 16–17 Tidebreak Causeway
  field and into the level 17–18 Stormglass Reliquary dungeon. Both maps have
  custom collision, authored props, palettes, music stubs, reciprocal travel,
  resource nodes, regional chart pins, and quest-unlocked courier waylines.
- Added Beaconwright Orrin; Brinewing Rays, Surgeclaws, Galehorn Prowlers,
  Stormglass Custodians, and the Tempest Remnant boss; eleven items, five drop
  tables, four recipes, and nine gathering nodes. `Where the Tide Breaks` and
  `The Storm Remembers` form a complete visit, gather, hunt, dungeon, boss,
  proof, reward, and fast-travel progression arc.
- Added a cross-client authored monster-ability contract and seven live
  abilities with cooldowns, wind-ups, single-target tethers, area warnings,
  dodgeable resolution, and poison/Gloom/Drenched payloads. Drenched slows
  movement and attack cadence, Stormclear Draught cures it, and the HUD keeps
  harmful conditions prominent.
- Current totals: 23 maps in two regions, 48 portals, 41 monsters, 82 items,
  41 drop tables, 26 resource nodes, 5 shops, 26 recipes, 12 quests, 24 unique
  NPCs, 18 world-map pins, 18 music keys, and 7 authored monster abilities.
  `npm run verify`, the production build, and all 17 Phaser smoke suites pass.
  Browser QA verified both telegraph shapes and overlap-free 1440x900 and
  500x844 layouts with zero page errors. The live client remains at
  `http://127.0.0.1:5175/`.

### 2026-07-22 — Persistent gathering and Dawnshore Reach

- Added the first real gathering verb to the shared world contract. Seventeen
  herb, ore, fiber, and relic nodes now exist across Cloverfield Plains,
  Emberglass Shelf, Afterlight Expanse, and Glasswind Coast. Nodes enforce
  range and level requirements, grant materials, advance collect objectives,
  visibly reform on absolute-time cooldowns, persist through saves and map
  travel, appear on the minimap, and receive the Wayfarer's Ore Sense bonus.
- Opened Afterlight's east road into **Dawnshore Reach**, the second region.
  Its level-15 Dawnshore Camp hub and level-15–16 Glasswind Coast field have
  custom collision, authored props, palettes, music stubs, reciprocal travel,
  two regional chart pins, two courier destinations, and six gather nodes.
- Added Trailwarden Nia, Quartermaster Vesa, Tideglass Motes, Saltbound Husks,
  Beacon Wraiths, and The Drowned Meridian boss. Added nine items, four drop
  tables, four recipes, a fifth shop, and `The Glasswind Bearing`, a complete
  visit/gather/hunt/boss/proof quest with legendary and consumable rewards.
- Added resource schema parity to TypeScript, Zod, Phaser, and Unity DTOs;
  added `verify:resources`; corrected portal destination bounds validation;
  and added `test:phaser:dawnshore` for placement, persistence, gating,
  Ore Sense, map guidance, quest completion, rewards, and courier unlocks.
- Current totals: 21 maps in two regions, 44 portals, 36 monsters, 71 items,
  36 drop tables, 17 resource nodes, 5 shops, 22 recipes, 10 quests, 23 unique
  NPCs, 16 world-map pins, and 16 music keys. `npm run verify`, the production
  build, and all 16 Phaser smoke suites pass. Edge/Playwright verified actual
  gathering, cooldown marker behavior, regional lock guidance, nonblank
  canvases, zero page errors, and overlap-free 1440x900 and 500x844 layouts.
  The live client remains at `http://127.0.0.1:5175/`.

### 2026-07-22 — Hearth Courier and Afterlight postgame hunt

- Activated the previously data-only `hearth_courier` role in Phaser Next.
  Regional couriers now open a responsive eight-route wayline panel, explain
  level/quest/fare locks, deduct exact fares, reject invalid or same-map
  travel, preserve the complete journey state, and arrive at authored spawns.
- Extended Lanternspire east into the new level-14 Afterlight Expanse field,
  gated by completion of `The Lanternspire Accord`. The 58x42 map has custom
  collision, 41 authored props, reciprocal Summit travel, a 14th world-map
  pin, distinct palette/music, and a post-finale courier route.
- Added Sunshard Motes, Voidglass Revenants, Dawnscale Sentinels, and the
  Eclipse Herald boss with four complete drop tables. Added six items across
  materials, an ATK tonic, crafted and legendary equipment, and guaranteed
  boss proof, plus two recipes.
- Added Wren's postgame `The Afterlight Vigil`: visit the field, defeat four
  Revenants and three Sentinels, defeat the Herald, recover its sigil, and
  return for the Eclipse Guard and consumables. Its completion deliberately
  does not replay the campaign epilogue.
- Added `test:phaser:courier` and `test:phaser:afterlight`; corrected narrow
  target-card placement so combat status does not overlap party or map HUD.
- Current totals: 19 maps, 40 portals, 32 monsters, 62 items, 32 drop tables,
  4 shops, 18 recipes, 9 quests, 21 unique NPCs, 14 world-map pins, and 14
  music keys. `npm run verify`, production build, and all 15 Phaser smoke
  suites pass. Edge/Playwright screenshots passed at 1440x900 and 500x844;
  real pointer travel opened all eight routes and reached Cloverfield. The
  live client remains at `http://127.0.0.1:5175/`.

### 2026-07-22 — Lanternspire campaign finale and epilogue

- Joined the Moonwell Heart and Hollow Kiln capstones into a real final quest,
  `The Lanternspire Accord`, offered by Priestess Wren in the active town only
  after both branches are complete. Accepting it opens a level-14 gate to the
  new Lanternspire Summit instance; completion remains saved as quest state.
- Added a custom 52x38 Summit map with collision, 37 authored props, reciprocal
  town travel, a 13th world-map pin, distinct palette/music, Aurora Motes,
  Gloam Wardens, and The Starved Crown boss. Added five items, three drop
  tables, a Dawnpetal Elixir recipe/shop offering, guaranteed boss proof, and
  legendary Lanternbound Regalia.
- Shadow monsters now inflict Gloom every third landed attack, reducing
  outgoing damage until it expires or Dawnpetal Elixir cures it. Gloom is
  surfaced as a harmful party condition alongside poison.
- Completing the Accord now emits a campaign-ending event, writes the final
  save, pauses play under a responsive epilogue, and offers Continue Exploring
  or Return to Title. Completed saves are recognized on the title screen as
  `Hearthlight Restored` with `Continue Epilogue`.
- Added accepted-quest portal gating across shared TS data, Zod validation,
  Phaser types/navigation, quest verification, and Unity DTO parity. Added
  `test:phaser:finale` for route, collision/art, population, loot, Gloom,
  objective progression, boss, reward, turn-in, and campaign state.
- Current totals: 18 maps, 38 portals, 28 monsters, 56 items, 28 drop tables,
  4 shops, 16 recipes, 8 quests, 21 unique NPCs, 13 world-map pins, and 13
  music keys. `npm run verify`, production build, and all 13 Phaser smoke
  suites pass. Desktop 1440x900 and mobile 500x844 screenshots passed; a real
  Edge/Playwright pointer pass verified both epilogue actions and the completed
  save title. The live client remains at `http://127.0.0.1:5175/`.

### 2026-07-22 — Complete consumables, stamina, and conditions

- Made all eleven authored consumables mechanically usable. Stamina Snack now
  restores travel stamina, Warding Incense grants timed DEF, Gale Tonic
  quickens movement and attack cadence, Antidote Leaf cures poison without
  being wasted when no condition exists, and Hearth Charm returns the full
  party to Hearthvale Town while retaining inventory, quests, gear, gold, and
  discovered maps.
- Added a 100-point persisted stamina pool. Sprint drains 22 per second,
  resting recovers 14 per second, and an exhaustion lock requires 20 stamina
  before held sprint resumes, preventing frame-by-frame speed oscillation.
- Fungal monsters now inflict ten-second poison on every second landed attack;
  poison pulses once per second, can faint party members, clears on a wipe,
  and is surfaced alongside friendly timed effects in the party HUD.
- Added backward save migration for stamina and defensive cloning for older
  skill/effect arrays. Added a mobile pack toggle above the two-row skill bar,
  making consumables accessible at narrow touch widths.
- Added `test:phaser:consumables` with measured movement, recovery, defense,
  attack-speed, poison, cure, warp, non-waste, and migration coverage.
  `npm run verify`, production build, and all twelve Phaser smoke suites pass.
  Desktop 1440x900 and narrow 500x844 screenshots passed with the condition
  HUD and mobile pack open. The live client remains at
  `http://127.0.0.1:5175/`.

### 2026-07-22 — Emberglass Shelf and Hollow Kiln

- Added a complete optional level 11-14 crystal-side arc branching from
  Crystal Mine Approach: the authored Emberglass Shelf field leads into the
  quest-gated Hollow Kiln dungeon and returns cleanly to the regional graph.
- Both maps have custom collision masks and more than 25 authored props, with
  blocked crystal formations, molten rifts, lit paths, distinct palettes,
  world-map pins, music stubs, and a quest-unlocked Hearth Courier warp.
- Added Glasswright Orla, Cinder Mote, Prism Scarab, Sinterhorn, and the
  Kilnheart Colossus boss. Added eight items, four drop tables, two recipes,
  and two quests that form a survey, hunt, gather, dungeon, boss, core turn-in,
  and legendary equipment reward loop.
- Made Ember Wisp a true fire skill and added fire/crystal interactions plus
  fire monster presentation. Added deterministic `test:phaser:emberglass`
  coverage for travel, collision, population, quest gates, both turn-ins,
  guaranteed boss loot, recipes, rewards, warp unlock, and map art.
- Current totals are 17 maps, 36 portals, 25 monsters, 51 items, 25 drop
  tables, 4 shops, 15 recipes, and 7 quests. `npm run verify`, production
  build, and all eleven Phaser smoke suites pass. Desktop and 500x844 visual
  QA passed for both maps, the boss chamber, and the 12-pin region chart.
  Phaser Next remains live at `http://127.0.0.1:5175/`.

### 2026-07-22 — Six-path party advancement

- Fresh journeys now begin all four party members as Vale Novices. Existing
  saves infer their advanced path from the saved class name, preserving
  pre-advancement parties without requiring a save reset.
- Trainer Bram now opens a responsive party advancement panel at level 10.
  Every member can choose any of the six tier-1 paths; the first rite is free,
  later retraining costs 150 gold, and the panel uses a two-step confirmation.
- Job changes now apply catalog skills and level growth plus distinct combat
  profiles. Vale Novice, Warden, Ranger, Channeler, Mender, Wayfarer, and Shade
  behavior all run from the simulation and update the party HUD immediately.
- Made the utility paths fully mechanical: Haggle reduces shop prices by 10%,
  Pushcart adds 20 material/consumable stack capacity, Ore Sense adds 15% drop
  chance, Pilfer marks a monster for bonus loot, and Shadowstep grants evasion.
- Added `test:phaser:jobs`, updated the advanced-skill smoke setup, and added
  `?previewTrainer=trainer_bram&previewLevel=10` for direct QA. `npm run verify`,
  production build, and all ten Phaser smoke suites pass; 1440x900 and 500x844
  screenshots show no clipping or incoherent overlap. The game remains live at
  `http://127.0.0.1:5175/`.

### 2026-07-22 — Full-party equipment and armory

- Replaced the leader-only equipment record with independent five-slot
  loadouts for all four party members. Existing flat saves migrate their gear
  to Aster automatically, while new saves retain base HP separately from gear
  HP so leveling and loadouts cannot double-count growth.
- Made every authored gear stat functional: ATK and DEF work for every party
  member, HP changes effective maximum health, SPD shortens attack intervals,
  and CRIT uses a deterministic attack sequence for 1.5x hits.
- Added ownership rules: one inventory copy can be assigned once, duplicate
  copies can support multiple members, assigned copies cannot be sold, and
  unassigned duplicates remain tradable.
- Added a responsive party armory opened with `I` or the crossed-swords
  control. It provides member tabs, all five slots, complete gear bonuses,
  item stats, owner/free counts, same-slot comparison deltas, equip actions,
  and direct unequip controls. Combat pauses under loadout, map, and dialogue
  overlays.
- Added `test:phaser:equipment` and `?previewLoadout=1` for regression and
  visual QA. `npm run verify`, production build, and all nine Phaser smoke
  suites pass; 1440x900 and 500x844 screenshots show no clipping or overlap.
- Also fixed discovered-map state being omitted during portal scene restarts.
  Phaser Next remains available at `http://127.0.0.1:5175/`.

### 2026-07-22 — Reachable campaign and world map

- Repaired the default Phaser Next journey graph. The authored RO town/plains
  opening now links to Mushroom Hollow, Crystal Mine Approach, and
  Whisperwood, making the Millwick, Moonreed, ruins, and finale routes
  reachable during normal play.
- Added `verify:campaign`, which proves all 15 maps are reachable from a new
  journey, every map can return to the Hearthvale capital, and the 10 visible
  region pins have unique names.
- Added persisted map discovery and a responsive world map opened with `M` or
  the map control. It shows current, visited, available, locked, and uncharted
  routes; level/quest gate reasons; and active quest locations derived from
  visit, monster, drop-source, and turn-in data.
- Added `test:phaser:navigation` for discovery, route gates, and quest markers.
  Desktop 1440x900 and narrow 500x844 screenshots passed after correcting
  opening-label and Moonwell-cluster spacing.
- Verification: `npm run verify` (14 checks), `npm run build:phaser`, and all
  eight Phaser smoke suites pass. Phaser Next remains available at
  `http://127.0.0.1:5175/`.

### 2026-07-22 — Merchant and crafting economy

- Added four data-driven shops and thirteen recipes spanning alchemy,
  smithing, and tailoring, plus catalog export, schema validation, Unity DTOs,
  and a dedicated economy verifier.
- Added simulation-owned buy, sell, and craft transactions with deterministic
  gold/material changes, level gates, merchant/station validation, and
  protection for quest and equipped items.
- Added a responsive merchant workshop with Buy, Sell, and Craft views. The
  existing monster roster now supplies previously missing crafting materials,
  completing a gather → trade/craft → equip/use progression loop.
- Added `?previewShop=<npc_id>` (optionally with `previewMap`) for non-persistent
  merchant QA. Desktop 1440x900 and narrow 500x844 screenshots passed without
  overflow, overlap, or unreadable controls.
- Verification: `npm run verify`, `npm run build:phaser`, and all seven Phaser
  smoke suites, including `npm run test:phaser:economy`, pass. Current totals
  are 15 maps, 21 monsters, 43 items, 21 drop tables, 4 shops, 13 recipes, and
  5 quests. Phaser Next remains available at `http://127.0.0.1:5175/`.

### 2026-07-22 — Data-driven quest finale and elemental combat

- Replaced Phaser Next's hard-coded quest cases with catalog-driven multi-objective
  quests supporting defeat, collect, visit, prerequisites, start/turn-in items,
  rewards, completion NPCs, map-visit progress, and legacy save migration.
- Added elemental strengths/resistances for nature, arcane, and crystal skills,
  with combat text and monster-roster element labels.
- Added the quest-gated Moonwell Heart capstone instance, Wellbound Echo and
  Tidemoon Matriarch, five items, two drop tables, a new biome treatment, and
  two linked late-region quests. Catalog totals are now 15 maps, 21 monsters,
  43 items, 21 drop tables, and 5 quests.
- Added `?previewMap=<map_id>` for direct map QA and corrected narrow-screen
  title typography after desktop/500px screenshot review.
- Verification: `npm run verify`, `npm run build:phaser`, and all six Phaser
  smoke suites pass. Phaser Next is running at `http://127.0.0.1:5175/` because
  port 5174 is occupied by a retired-client server.

### 2026-07-22 — Content expansion: Moonreed Fen

- Added Moonreed Fen as a connected late-starter field between Moonwell
  Entrance and Moonwell Ruins, with bidirectional portal coverage.
- Added three original monsters (`reedwhisper`, `fen_wisp`, `glimmercroc`),
  two new monster elements (`water`, `spirit`), one new biome (`reed_fen`),
  four new items, and three new drop tables.
- Verification: `npm run verify`, `npm run build:phaser`, and all Phaser
  smoke tests pass.

### 2026-07-22 — Phaser Next actionable loot

- Added consumable use and equipment actions from the inventory HUD; usable
  rows now expose Use/Equip controls.
- Equipment state persists in save slots and weapon/defense bonuses feed into
  combat for the party leader.
- Expanded `npm run test:phaser:quests` to cover healing item use and weapon
  equip flow.
- Verification: `npm run build:phaser`, `npm run test:phaser:quests`, and all
  existing Phaser smoke suites pass.

### 2026-07-22 — Phaser Next RPG quest and inventory loop

- Wired Phaser Next into the exported items, quests, and drop-table catalogs.
- Added simulation-owned inventory, gold, quest state, monster loot drops,
  quest start/progress/turn-in events, and persistence for those RPG systems.
- Replaced the static quest card with live quest tracking and added a compact
  inventory panel to the HUD.
- Added `npm run test:phaser:quests` covering quest accept → defeats/drops →
  ready → turn-in rewards.
- Verification: `npm run build:phaser`, `npm run test:phaser:quests`, all
  existing Phaser smoke suites, and `npm run verify` pass.

### 2026-07-22 — Phaser Next save slots and system menu

- Added browser-local persistence for Phaser Next: continuing from title loads
  the saved map/party state, and New Game / Clear Save are available when a
  save exists.
- Added a compact in-game system menu with Save, Title, Clear, sound toggle,
  and reduced-motion toggle; map/combat progress auto-saves periodically and
  after meaningful progression events.
- Verification: `npm run build:phaser`, `npm run test:phaser:movement`,
  `npm run test:phaser:skills`, `npm run test:phaser:auto-attack`, and
  `npm run test:phaser:maps` pass.

### 2026-07-21 — Complete playable town-field-dungeon route

- Promoted the authored Hearthvale Town, Cloverfield Plains, and Old Crystal Mine B1 maps into Phaser Next's default journey and removed their draft-facing labels.
- Added data-driven prop and collision-grid loading, full procedural rendering for authored buildings/trees/roads/cave rooms, collision-aware party and monster movement, Scout Pip in the monster field, and a map-route smoke test.
- Browser-playtested the complete route from town to field to dungeon: NPC/minimap markers rendered, automatic portals transitioned correctly, field combat defeated monsters and awarded levels, and the dungeon populated its full encounter roster.
- Verification: `npm run build:phaser`, all four Phaser smoke suites, `npm run verify`, and a live browser console check pass.

### 2026-07-21 — Phaser Next combat FX polish

- Enriched combat/skill/attack feedback in `client-phaser-next` with
  role-specific slash/projectile trails, caster lunges, impact bursts, area
  blooms, heal/buff rings, and player-hit flashes.
- Kept changes renderer-side in `WorldScene`, driven by existing simulation
  events so auto-attacks, manual attacks, and skills share the same visual
  path.
- Verification: `npm run build:phaser`,
  `npm run test:phaser:auto-attack`, `npm run test:phaser:skills`, and
  `npm run test:phaser:movement` pass.

### 2026-07-21 — Party movement regression fix

- Fixed formation drift caused by combat targeting and movement sharing the
  leader's `facing` vector. Movement heading is now tracked independently, so
  attacks can aim at enemies without rotating or dragging idle followers.
- Added `npm run test:phaser:movement`; the regression reproduced as 28.66px
  of idle drift before the fix and passes with zero drift afterward.

### 2026-07-21 — Playable class skills

- Wired the shared job and skill catalogs into Phaser Next; all 12 skills for
  the four playable party classes now execute in the simulation instead of
  existing only as data definitions.
- Added MP, regeneration, per-skill cooldowns, timed buffs/debuffs/marks, area
  damage, healing, class-aware auto-casting, manual keyboard/click controls,
  visual feedback, and a responsive skill bar.
- Added a skill smoke test covering every playable skill and Thornvolley's
  clustered area hit. Production build, auto-attack smoke, skill smoke, and
  shared skill verification pass; desktop/mobile browser playtest reported no
  console warnings or errors.

### 2026-07-21 — Live map HUD

- Added a compact top-right area map to Phaser Next with live player heading,
  moving monster positions, authored NPC positions, coordinates, and a marker
  legend.
- Added a map-specific monster roster directly below it with each monster name,
  base level, and current active count; the layout condenses on mobile.

### 2026-07-21 — Automatic portal traversal

- Portals now trigger when the player enters their 68px radius; E is reserved
  for NPC dialogue.
- Added enter/exit arming so a destination spawn cannot immediately bounce the
  player back through its arrival portal. Level-gated portals notify once and
  re-arm only after the player leaves their radius.

### 2026-07-21 — Phaser Next auto-attack refinement

- Added simulation-owned auto-attack: when a living enemy enters the 66px
  attack radius, the player faces it and advances the existing timed combo.
- Auto-attacks pause during NPC dialogue; manual Space/click strikes remain.
- Routed swing visuals through simulation events so automatic and manual
  attacks share the same renderer feedback.

### 2026-07-21 — Phaser Next playable client

- Added `client-phaser-next/`, a fresh Phaser 3 + TypeScript + Vite game using
  the shared maps, NPCs, and monster catalogs without duplicating source data.
- Implemented title/boot flow, procedural map presentation, responsive DOM
  HUD, movement/sprint, NPC dialogue, portal travel, monster AI, strike combo,
  damage feedback, defeat/respawn, XP, and leveling.
- Added root `dev:phaser` / `build:phaser` commands and made Phaser Next the
  documented default client. The old Phaser archive and Unity scaffold remain
  untouched as historical/reference workstreams.
- Verification: production build passes; browser smoke test confirmed title →
  world, HUD/canvas layout, input response, and zero console warnings/errors.

### 2026-07-01 — Verification hardening for Unity setup pass

- Fixed `tools/cli.ts` so `npm run verify` works on Windows in this checkout by
  invoking the local `tsx` CLI through `node` instead of trying to spawn
  `npx.cmd` directly.
- Fixed the `tools/rathena-audit.ts` row-parser return type so
  `npx tsc --noEmit` is clean again.
- Verification after the Unity sync automation pass: `npm run verify` passed
  and `npx tsx scripts/sync-unity-data.ts --dry-run` reported it would create
  `client-unity/Assets/StreamingAssets/data -> data`.

### 2026-07-01 — Unity data sync automation

- Added `scripts/sync-unity-data.ts` plus root scripts
  `npm run unity:sync-data` / `npm run unity:refresh-data`.
- The sync flow targets `client-unity/Assets/StreamingAssets/data`, prefers a
  live link/junction into repo-root `data/`, and falls back to a mirrored
  copy when links are unavailable.
- Updated the root README and `client-unity/README.md` so Unity setup no
  longer depends on a manual symlink-only step.
- Still not done: opening `client-unity/` in a real Unity Editor. This pass
  improves setup ergonomics only; it does not validate C# compile/runtime
  correctness.

### 2026-07-01 — Path A → Path B (Unity) migration kickoff

- Archived the Phaser client: `client/` copied to `client-phaser-archive/`
  (source + config only; the original `client/` also remains on disk because
  this sandbox's mount would not permit deleting already-written files —
  treat `client-phaser-archive/` as canonical, `client/` as a stale
  duplicate).
- Scaffolded `client-unity/` — Assets folder tree (Art/Animations/Audio/
  Prefabs/Scenes/Scripts/UI/ScriptableObjects), `Packages/manifest.json`
  (Newtonsoft.Json, TextMeshPro, 2D/UI/networking modules), an `.asmdef`.
- Wrote C# scripts for Phase B-Unity parity scope: `WorldData.cs`/
  `CatalogData.cs` (DTOs mirroring `src/data/world/types.ts` and
  `src/data/catalog/types.ts`), `WorldDataService.cs` (StreamingAssets JSON
  loader), `WorldConstants.cs`, `MapBounds.cs`, `CollisionMask.cs`,
  `PortalTrigger.cs` (portal proximity + level/quest gating),
  `PlayerController.cs` (WASD movement + collision), `CameraFollow.cs`
  (soft follow), `HudController.cs` (HP/MP/SP/XP bars, map name, portal
  hint), `DialogueController.cs` (NPC talk panel, `[E]` interact),
  `BootLoader.cs` + `WorldController.cs` (scene orchestration).
- Explicitly deferred to Phase C-Unity+ (not silently skipped — see
  `client-unity/README.md` "Known gaps"): click-to-move A* pathfinding,
  combat (`CombatController` equivalent), player vitals drain/regen, prop/
  tile art rendering, job/skill/inventory/quest UI, audio, dev overlay.
- Rewrote `STRATEGY.md`, `docs/ROADMAP.md`, `AGENTS.md`, `README.md` for
  Path B. `docs/ROADMAP.md` now has Phase A (done) → Phase B-Phaser
  (retired/superseded) → Phase B-Unity (current, parity scope) →
  Phase C-Unity (planned) → Phase D → Later, replacing the old Phase A/B/C
  structure.
- Created this file and `docs/01_PROJECT_MEMORY.md` (both were referenced by
  `AGENTS.md` but did not exist).
- **Not done in this session:** opening `client-unity/` in an actual Unity
  Editor; StreamingAssets symlink was not created (no live Unity project to
  symlink into yet); prefab/scene files (Boot.unity, World.unity,
  Player.prefab) were not created since Unity scene/prefab YAML shouldn't be
  hand-authored outside the Editor. `npm run verify` was re-run to confirm
  the data layer is still green after all doc/Unity work (see
  `docs/ledgers/BUILD_LEDGER.md` for the exact result).
  Note: the manual symlink step is no longer the only path; use
  `npm run unity:refresh-data` from the repo root to create a link/junction or
  mirrored copy automatically.
