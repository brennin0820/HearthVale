# Project Memory — HearthVale

App-specific memory for coding agents. This file did not exist prior to
2026-07-01 despite `AGENTS.md` requiring it as required reading — it is
created now as part of the Unity migration pass, backfilled from
`docs/ledgers/BUILD_LEDGER.md` and `docs/ROADMAP.md`.

## What HearthVale is

A cozy, Ragnarok Online–inspired **solo MMO** set in an original IP,
**Hearthlight Vale**. The starter region began as a 10-map target for character
levels 1–14 and has grown to 19 maps, followed by the fourteen-map Dawnshore Reach
expansion for 33 maps total (towns, fields, dungeons, and instances).
No third-party RO assets, packets, sprites, maps, monster names, or lore — original names only
(`Gemhorn Sentinel`, `Vale Novice`, etc.).

+# **Project name:** HearthVale (IP: Hearthlight Vale)
+# **Genre:** Cozy RO-inspired solo MMO
+# **Phase:** B complete — Phaser starter client shipped; Phase C next
+# **Phase:** C in progress (2026-08-20) — combat/loot/HUD/iOS and all-10-map greybox already playable; remaining C is mine floors/boss, job selection UI, enforced portal level gates, courier warp UI

| Layer | Technology | Location |
|-------|------------|----------|
| Client | Phaser 3 + TypeScript + Vite | `client-phaser-next/` — active playable browser client |
| Client experiment | Unity (C#) | `client-unity/` — incomplete scaffold retained for reference |
| Client (retired) | Phaser 3 + TypeScript + Vite | `client-phaser-archive/` — reference only, do not run or extend |
| Data | TypeScript modules + JSON exports | `src/data/**` → `data/*.json`, `data/catalog/*.json` (unchanged by the Unity migration) |
| Server | Node + Colyseus | `server/` — local-dev multiplayer (MP-0/MP-1 done, 2026-07-28): room-per-map, local accounts, shared-world movement |
| Shared sim | TypeScript (npm workspace) | `shared/sim/` — `WorldSimulation`/`CollisionGrid`/data contract, consumed by both `client-phaser-next` and `server/` |

**Why the switch happened:** the project was Path A (Phaser) through a
complete 4-map loop plus combat/job/skill catalogs (Phase B done, Phase C
in progress). On 2026-07-01 the decision was made to move the client engine
to Unity while preserving all data/design work — see `STRATEGY.md`
"Migration note" and `docs/ROADMAP.md` for the phase-by-phase detail.

## Data layer facts an agent should know before touching `src/data/**`

- 19 maps in the `hearthlight_vale` region (`src/data/world/maps.ts`), including
  Moonreed Fen, the Moonwell Heart and Hollow Kiln capstones, and their joined
  quest-gated Lanternspire Summit campaign finale plus Afterlight Expanse
  postgame hunt.
- 14 maps in the level-15–28 `dawnshore_reach` region: Dawnshore Camp,
  Glasswind Coast, Tidebreak Causeway, Stormglass Reliquary, Beaconfall Cliffs,
  Sunspire Observatory, Aurora Highlands, Zenith Archive, Choirwood Canopy,
  Crownroot Sanctum, Runeveil Gardens, Namesong Vault, Waystar Moor, and
  Convergence Spire. Afterlight
  provides the cross-region road; the route now includes an exclusive two-oath
  choice that rejoins at the shared Zenith finale.
- Starter 4-map loop (originally Phase B-Phaser, now the Phase B-Unity parity
  target): `hearthvale_town` ↔ `cloverfield_plains` ↔ `mushroom_hollow`,
  plus `old_crystal_mine` (entry/exit only pre-Phase C).
- World origin is centered at (0,0) per map; coordinates are **Phaser
  Y-down** (this convention predates the Unity migration and was NOT changed
  — the Unity client negates Y on read instead, see `client-unity/README.md`).
- Job catalog: 1 tier-0 base (`Vale Novice`) + 6 tier-1 paths
  (`src/data/catalog/jobs.ts`), plus two level-18 mastery choices per advanced
  path (12 total) and two level-28 callings per advanced path (12 total).
- Skill catalog: 38 skills: 20 path defaults, six quest-earned Crownroot
  techniques, and twelve calling-exclusive techniques selected through persistent three-slot loadouts
  (`src/data/catalog/skills.ts`), enforced by `scripts/verify-skills.ts`.
- Economy catalog: 10 NPC shops and 52 recipes across alchemy, smithing, and
  tailoring. Seventy-one persistent world resource nodes join monster drops,
  shop stock, recipes, and equipment in a verified gather → trade/craft →
  upgrade loop.
- `npm run verify` (alias for `verify:all`) must pass with zero errors before
  any data-layer change is considered done. It runs 15 checks (portals,
  campaign reachability, spawns, npcs, bounds, drops, items, economy, quests,
  resources, jobs, skills, audio, assets, general validation).

## Client facts an agent should know

+# Phase B complete (2026-06-11) — Phaser client under `client/`; 4-map portal loop; loads exported `data/maps.json`
+# Phase C next — dungeon depth, combat placeholders, level-gated portal UI; MMO tooling suite landed (five-lane parallel build).
+# Phase C remaining (2026-08-20) — Gemhorn Sentinel + mine floors, job selection UI, client-enforced `requiredLevel` on portals, Hearth Courier warp UI from existing `warpTable`. Phase D maps are already walkable greyboxes.

## Multiplayer facts an agent should know

- **`server/`** — Node + Colyseus multiplayer server, local-dev only
  (`ws://localhost:2567`, run via `npm run dev:server`). One `WorldRoom` per
  `mapId` (matching the existing portal graph); each connected player gets
  their own unmodified `WorldSimulation` instance (leader + 3 AI companions —
  the "keep AI companions" party model was chosen specifically to avoid
  rebalancing any of the 33 already-tuned maps). Movement/skills/economy
  intents flow through `WorldSimulation.update()`/its existing public command
  methods exactly as the solo client already called them; only the *caller*
  changed (a Colyseus message handler instead of `WorldScene`).
- **`shared/sim/`** — `WorldSimulation.ts`, `CollisionGrid.ts`, and the data
  contract (`types.ts`/`actions.ts`) moved here from `client-phaser-next` as
  an npm-workspace package (`@hearthvale/sim`), consumed directly as
  TypeScript source (no build step — both Vite and `tsx` handle it). The old
  `client-phaser-next/src/game/{simulation,data,input}/*` paths are now thin
  `export * from '@hearthvale/sim'` shims so every pre-existing import and
  all 25 solo smoke tests keep working unchanged.
- **Combat formula caveat still applies to the server**: `WorldSimulation.ts`
  reimplements its own damage/XP/loot math independently of the repo-root
  `src/data/combat/formulas.ts` (which only the retired `client`/
  `client-phaser-archive` clients import) — the server reuses the *live*
  `WorldSimulation` math via the shared package, not that older file.
- **RNG**: crit/evasion rolls are already seeded (FNV-1a hash keyed on a
  per-entity attack sequence). `rollDrops()` and `gatherResource()`'s bonus
  roll still use raw `Math.random()` — fine for MP-1 (movement/visibility
  only), but must move to the same seeded pattern before MP-2's combat
  authority work, or loot becomes a client-trust hole again.
- **Party model is not yet real multiplayer grouping.** Today, N connected
  players each get their own independent 4-unit squad and monster spawns in
  the same room (visible to each other, but monsters are NOT shared/contested
  — each player's monsters are their own instanced copy, keyed
  `${sessionId}:${uid}`). Real party grouping across players ("party of
  squads") is scoped to MP-3, not built yet.
- **No character persistence yet in multiplayer.** Accounts persist in SQLite
  (`server/hearthvale.db`), but each room join starts a fresh level-1
  `WorldSimulation` — character save/load server-side is MP-2 scope.
- Local dev workflow: `npm run dev:server` (Colyseus/Express on 2567) +
  `npm run dev:phaser` (Vite client) together; `npm run test:server` runs
  headless auth + two-client movement-visibility smoke tests
  (`server/scripts/*-smoke.ts`).

## Open decisions (carried from STRATEGY.md)

- Server-side character persistence contract for multiplayer (MP-2) — solo saves are unaffected.
- Real-player party/grouping model beyond "keep AI companions" (MP-3 XP/loot split rule).
- Production art direction beyond Phaser Next's procedural presentation.

## Revision log

| Date | Change |
|------|--------|
| 2026-07-28 | Added real multiplayer alongside the solo campaign: `shared/sim` workspace package (extracted from `client-phaser-next`), `server/` Node + Colyseus server (local-dev, room-per-map, local SQLite accounts, one `WorldSimulation` per player, portal-gate validation, reconnect), and `MultiplayerWorldScene` + title-screen login in the client. This is MP-0/MP-1 of a phased MP-0..MP-6 plan (combat authority, persistence, chat, real-player party grouping, trading, guilds, PvP remain). Solo saves/campaign untouched; all pre-existing Phaser smoke suites plus new server smoke tests and `npm run verify` pass. |
| 2026-07-22 | Extended Dawnshore Reach to level 28 with Waystar Moor and Convergence Spire; added six monsters, seventeen items, six drops, nine resources, six recipes, two quests, three NPCs, one shop, two waylines, seven abilities, Severed/Anchorcord counterplay, and twelve saved callings with exclusive techniques. Current totals: 33 maps, 71 monsters, 167 items, 71 drops, 71 resources, 10 shops, 52 recipes, 23 quests, 42 abilities, and 38 skills. All 24 Phaser smoke suites pass. |
| 2026-07-22 | Extended Dawnshore Reach to level 26 with Runeveil Gardens and Namesong Vault; added six monsters, eighteen items including five reusable runes, six drops, nine resources, five recipes, two quests, three NPCs, one shop, two waylines, seven abilities, and a saved equipment-socket system with slot compatibility and active stats. Current totals: 31 maps, 65 monsters, 150 items, 65 drops, 62 resources, 9 shops, 46 recipes, 21 quests, 35 abilities, and 26 skills. All 23 Phaser smoke suites pass. |
| 2026-07-22 | Extended Dawnshore Reach to level 24 with Choirwood Canopy and Crownroot Sanctum; added six monsters, seventeen items, six drops, nine resources, five recipes, two quests, three NPCs, one shop, two waylines, seven abilities, Muted/Clearvoice counterplay, and six quest-earned techniques with persistent three-slot loadouts. Current totals: 29 maps, 59 monsters, 132 items, 59 drops, 53 resources, 8 shops, 41 recipes, 19 quests, 28 abilities, and 26 skills. All 22 Phaser smoke suites pass. |
| 2026-07-22 | Extended Dawnshore Reach to level 22 with Aurora Highlands and Zenith Archive; added exclusive oath branches with an OR-gated shared finale, six monsters, seventeen items, six drops, nine resources, five recipes, three quests, four NPCs, one shop, one wayline, seven abilities, and Fractured/Mending Salve counterplay. Current totals: 27 maps, 53 monsters, 115 items, 53 drops, 44 resources, 7 shops, 36 recipes, 17 quests, and 21 abilities. All 21 Phaser smoke suites pass. |
| 2026-07-22 | Extended Dawnshore Reach to level 20 with Beaconfall Cliffs and Sunspire Observatory; added six monsters, sixteen items, six drops, nine resources, five recipes, two quests, two NPCs, one shop, two waylines, seven abilities, and Sunblind/Clarity counterplay. Current totals: 25 maps, 47 monsters, 98 items, 47 drops, 35 resources, 6 shops, 31 recipes, 14 quests, and 14 abilities. All 20 Phaser smoke suites pass. |
| 2026-07-22 | Added twelve data-driven level-18 Lantern Masteries across all six paths, save validation, free first choices, 300g mastery retraining, active combat/economy effects, responsive Trainer Bram controls, and a dedicated smoke suite. All 19 Phaser smoke suites pass. |
| 2026-07-22 | Added the responsive Lantern Path quest journal with full quest-state filters, objective and reward details, NPC handoffs, persistent pinning, keyboard/touch access, pause behavior, save migration, and a dedicated smoke suite. |
| 2026-07-22 | Extended Dawnshore Reach through Tidebreak Causeway and Stormglass Reliquary; added five monsters, eleven items, five drops, nine resource nodes, four recipes, two quests, two waylines, and seven telegraphed monster abilities with Drenched counterplay. Current totals: 23 maps across 2 regions, 41 monsters, 82 items, 41 drops, 26 resources, 26 recipes, and 12 quests. |
| 2026-07-22 | Added persistent gathering with 17 nodes, cooldown saves, Ore Sense integration, minimap/world-map guidance, and resource verification; opened Dawnshore Reach with two maps, four monsters, nine items, four drops, four recipes, a fifth shop, two NPCs, and a complete coast quest. Current totals: 21 maps across 2 regions, 36 monsters, 71 items, 36 drops, 22 recipes, and 10 quests. |
| 2026-07-22 | Activated Hearth Courier fast travel and added Afterlight Expanse, four monsters, six items, four drops, two recipes, an endgame boss, and a complete postgame vigil. Current totals: 19 maps, 32 monsters, 62 items, 32 drops, 18 recipes, and 9 quests. |
| 2026-07-22 | Added the joined Lanternspire Summit campaign finale, three monsters, five items, Gloom/Dawnpetal condition counterplay, final quest and boss, persisted epilogue/title recognition, and accepted-quest portal gates. Current totals: 18 maps, 28 monsters, 56 items, 28 drops, 16 recipes, and 8 quests. |
| 2026-07-22 | Completed all authored consumable effects, persisted stamina and exhaustion recovery, fungal poison/antidotes, Hearth Charm return travel, condition HUD feedback, and mobile pack access. |
| 2026-07-22 | Added Emberglass Shelf and Hollow Kiln with authored collision/art, four monsters, eight items, two recipes, two quests, a warp unlock, a level-14 boss, and fire elemental combat. Current totals: 17 maps, 25 monsters, 51 items, 25 drops, and 7 quests. |
| 2026-07-22 | Added save-compatible Vale Novice starts, six-path level-10 advancement and retraining, complete Wayfarer/Shade utility mechanics, and Trainer Bram's responsive party path panel. |
| 2026-07-22 | Replaced leader-only gear with save-compatible full-party loadouts, activated all five equipment stats, enforced per-copy assignment/trade rules, and added the responsive comparison armory. |
| 2026-07-22 | Connected the default opening to the full 15-map campaign, added bidirectional campaign verification, persisted discovery, and shipped the quest-aware world map. |
| 2026-07-22 | Added the merchant and crafting economy: 4 shops, 13 recipes, deterministic transactions, responsive workshop UI, material-source coverage, and economy smoke/validation tests. |
| 2026-07-22 | Added data-driven multi-objective quests, elemental combat, Moonreed Fen, and the Moonwell Heart capstone; current catalog totals are 15 maps, 21 monsters, 43 items, 21 drops, and 5 quests. |
| 2026-07-21 | Phaser Next became the active client in `client-phaser-next/`; Unity retained as an incomplete reference scaffold. |
| 2026-07-01 | File created (was missing despite being required reading in `AGENTS.md`). Backfilled from `docs/ledgers/BUILD_LEDGER.md` and `docs/ROADMAP.md` as part of the Path A → Path B (Unity) migration. |
