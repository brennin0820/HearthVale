# STRATEGY — HearthVale

## Product

**HearthVale** is a cozy, Ragnarok Online–inspired **solo MMO** set in the original IP **Hearthlight Vale**. Players explore a warm, community-forward fantasy world at their own pace — gathering, crafting, light combat, and region progression without mandatory group content.

## Vision

- **Feel:** Cozy, nostalgic MMO warmth; readable UI; low-friction session loops (15–45 minutes).
- **Scope:** The original Phase A starter region covers **levels 1–14**; the live solo campaign now continues through Dawnshore Reach to **level 28**.
- **IP:** Original world, factions, and naming under **Hearthlight Vale**; no third-party asset or lore dependency.

## Technical approach — Phaser Next

| Layer | Choice | Notes |
|-------|--------|-------|
| Client | **Phaser 3 + TypeScript + Vite** | Active playable browser client in `client-phaser-next/` |
| Data | **TypeScript** modules + JSON exports | Single source of truth for maps, NPCs, items, quests, portals — consumed directly by the browser client |
| Server | **Node + Colyseus** (`server/`) | Local-dev multiplayer: room-per-map, shared-world movement/visibility, local accounts. See "Multiplayer (2026-07-28)" below |
| Tooling | npm scripts | `npm run export:data`, `npm run verify` (data layer, unchanged) |

The active Phaser edition keeps the strict TS data contract exactly as built. Maps, portals, jobs, skills, monsters, items, quests, drops, shops, and recipes all originate in `src/data/**` and export to `data/*.json` / `data/catalog/*.json`.
Persistent resource nodes are part of that same contract and feed gathering,
quests, crafting, minimap guidance, and save state.
Authored monster abilities share the contract too, including cooldowns,
telegraphs, target shapes, damage scaling, and condition payloads.
Each advanced job also owns two level-18 mastery choices whose permanent
bonuses are consumed by the same simulation rules and preserved in saves.
At level 24, Crownroot adds one quest-earned technique to each advanced path;
players choose three equipped skills from four available options.
Runeveil and Namesong then add five reusable equipment runes with compatible
slots, active stat bonuses, reversible binding, assignment protection, and
validated save persistence.
At level 28, Convergence adds two quest-gated callings to every advanced job.
The first calling is free, retraining costs 500 gold, permanent bonuses and
exclusive techniques are simulation-owned, and invalid saves are sanitized.

### Phaser Next direction (2026-07-21)

The product direction returned to a browser-first Phaser client at the user's request. `client-phaser-next/` is a clean implementation with a separate simulation/render boundary, a DOM HUD, procedural presentation, NPC dialogue, portal travel, lightweight combat, and progression. The incomplete Unity scaffold remains in `client-unity/` as reference but is not the default launch path.

### Multiplayer (2026-07-28)

HearthVale gained a real, server-authoritative multiplayer mode alongside the
existing solo campaign. `server/` (Node + Colyseus, local-dev only for now —
`ws://localhost:2567`) hosts one room per map on the existing portal graph,
running a `@hearthvale/sim` `WorldSimulation` instance per connected player
(each keeping their existing 3 AI companions — "party of squads" grouping is
the intended later model, not yet built). Local username/password accounts
persist in SQLite (`server/hearthvale.db`, gitignored); movement/combat/loot
run through the same shared simulation code the solo client already used, now
extracted into the `shared/sim` workspace package so both consumers stay on
one copy. `client-phaser-next` gained a new `MultiplayerWorldScene` and a
"MULTIPLAYER (local server)" entry from the title screen; the original
localStorage-save solo campaign is untouched. See `docs/ROADMAP.md`'s
"Later — Server-authoritative multiplayer" section for the phased plan
(MP-0/MP-1 done; combat authority/persistence, chat + real-player party
grouping, trading, guilds, and PvP remain).

### Historical migration note — Path A → Path B (2026-07-01)

HearthVale's client was originally built as Path A: a Phaser 3 + TypeScript web client. That client reached a working 4-map loop with combat, job, and skill catalogs (see `docs/ROADMAP.md` Phase B-Phaser) before the team decided to move the client to Unity (Path B). The Phaser client is **retired** and archived at `client-phaser-archive/` for reference; it is not run or maintained going forward. A new `client-unity/` Unity project is being scaffolded by a separate workstream.

This is a client-engine swap, not a redesign: the TypeScript data layer (`src/data/**`, `scripts/export-data.ts`, the `verify-*.ts` scripts, `tools/**`) is preserved untouched because it was never Phaser-specific — it only ever produced plain JSON. The new Unity client will consume that same `data/*.json` / `data/catalog/*.json` output through a JSON parsing bridge (built separately). No maps, jobs, monsters, or lore change as a result of this migration.

## Target player loop (starter region)

1. Create character → tutorial hamlet → first job path hints (Lv 1–5).
2. Field grinding and light quests → first dungeon (Lv 6–10).
3. Crafting / economy hooks → border region and portal checks (Lv 11–14).
4. Cross the Afterlight road → gather, hunt, and clear the Stormglass
   Reliquary through Dawnshore Reach (Lv 15–18).
5. Climb Beaconfall Cliffs → prepare for Sunblind → restore Sunspire
   Observatory and defeat the Celestial Orrery (Lv 18–20).
6. Cross Aurora Highlands → choose the gentle or direct oath → mend Fractured
   defenses and reopen Zenith Archive (Lv 20–22).
7. Learn Choirwood's refrain → counter Muted → restore Crownroot Sanctum and
   choose each path's three-skill combat loadout (Lv 22–24).
8. Recover Runeveil's movable marks → bind equipment runes → free every stolen
   name from the Archivore in Namesong Vault (Lv 24–26).
9. Stabilize Waystar Moor → climb Convergence Spire → defeat the Manyroad
   Crown → choose one of two callings for every advanced path (Lv 26–28).

## Current completion priorities

- Continue expanding the playable campaign with connected maps, monsters,
  items, quests, encounters, and elemental interactions; each content pass
  should enter the verified travel, reward, and progression loops.
- Build outward from the delivered fourteen-map Dawnshore Reach arc with more
  connected routes, monster families, items, gathering materials, quests,
  upgrade sets, and encounter mechanics while keeping the level-14 starter
  campaign and level-18 expansion progression coherent.
- Build on the delivered Lantern Masteries, three-slot skill loadouts, and
  twelve callings with later consequences and additional quest-earned choices.
- Preserve the simulation-owned RPG rules and responsive DOM menu pattern as
  systems grow; save migration and deterministic smoke coverage are required
  for durable progression changes.
- Build quest chains on the delivered journal and tracker: every accepted,
  available, locked, ready, and completed quest remains inspectable with
  objective progress, rewards, NPC handoffs, and a save-persisted pin.
- Extend encounters through the delivered ability and condition framework:
  new warning shapes, status counters, cures, buffs, and equipment
  interactions should build on poison, Gloom, Drenched, Sunblind, Fractured,
  Muted, Severed, and timed effects.

## Success metrics (Phase A)

- Starter region data validates (`verify:portals` clean).
- The active Phaser Next client can load and traverse the exported region pack without hand-edited duplicates.
- Documented stack and agent memory prevent cross-project bleed.

## Non-goals (near-term)

- Cloud/production deployment of the multiplayer server (local-dev only for now)
- Server-authoritative combat/loot and cross-session character persistence (planned next, see MP-2 in `docs/ROADMAP.md`)
- Chat, trading, guilds, PvP (planned, see MP-3..MP-6 in `docs/ROADMAP.md`)
- Full audio pipeline or production art pass
- Monetization

## Open decisions

- Exact starter region name and zone graph — resolved and expanded
  (**Hearthlight Vale**, 19 maps) with the fourteen-map second region
  (**Dawnshore Reach**) now playable for 33 maps total; see `docs/world/HEARTHLIGHT_VALE_LAYOUT.md`
  and `docs/world/DAWNSHORE_REACH_LAYOUT.md`.
- Authoritative persistence contract for multiplayer characters (MP-2, see `docs/ROADMAP.md`) — accounts persist in SQLite now, but character state is still ephemeral per session; browser-local saves remain the persistence model for solo play
- Real-player party model for multiplayer (each player keeps their 3 AI companions; a "party of squads" groups multiple players — see `docs/ROADMAP.md` MP-3)
- Production art pipeline beyond the current procedural visual pass
