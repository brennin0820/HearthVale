# Phase D — Early expansion + world map UI (PLANNED)

Goal: every Phase A map is playable or reachable in the Unity client; the
world map UI reflects all `showOnWorldMap: true` maps; the starter region arc
is completable solo to level 14, ending with the send-off to the next region.

## Preconditions
- Phase C-Unity DoD fully met (combat, skills, jobs, boss, loot, paid warps).
- All 10 maps already exist in the data layer with collision masks, spawn
  tables, NPCs, and portal wiring — this phase is client-side reach and UI,
  plus any missing catalog content for the level 10–14 band.

## Work items (each ≈ one loop iteration unless noted)

### Map reach
- [ ] Old Mill Road playable: portals, spawns, NPCs render and behave.
      Validation: acceptance walk; spawn/NPC counts match data tables.
- [ ] Millwick Crossing playable, incl. economy NPCs (merchant flows).
      Validation: buy/sell against `buyPrice`/item catalog values.
- [ ] Moonwell Entrance playable (gating per portal rules honored).
      Validation: gate blocks under-leveled/questless entry; passes when met.
- [ ] Moonwell Ruins playable (top of starter-band difficulty).
      Validation: acceptance walk + combat viability at intended level.
- [ ] crystal_mine_approach + whisperwood_meadows regression pass (reachable
      since B/C; confirm no drift). Validation: portal walk, Console clean.

### World map UI
- [ ] World map screen: render all `showOnWorldMap: true` maps from
      `data/maps.json` `worldMapPosition` / region `worldMapBounds`.
      Validation: rendered set exactly equals the flagged set in data.
- [ ] Current-location indicator + discovered/undiscovered states.
      Validation: state updates on map change; persists across map loads.
- [ ] Hearth Courier full fee table on the map UI (fees/gates from
      `data/regions.json`). Validation: UI values match regions.json exactly.

### Progression arc
- [ ] Level 10–14 content pass: quests/mobs/drops needed for solo 10→14 exist
      in catalog TS (author in `src/data/**`, export, verify). Validation:
      `npm run verify:all` green; balance sanity via `npm run balance:report`.
- [ ] Level 14 send-off: final starter-region quest + region-exit hook.
      Validation: quest completable in Play Mode; exit gate honors level 14.

## Definition of Done
1. All 10 Phase A maps playable or reachable in Unity.
2. World map UI shows exactly the `showOnWorldMap: true` set, with location
   and courier fees driven by data.
3. Starter region arc completable solo to level 14 (verified full playthrough).
4. `npm run verify:all` + root tsc green; Phase B loop and Phase C boss
   acceptance checks still pass (regression).

## Risks
- Balance holes in the 10–14 band — data-layer authoring may be the long pole;
  use `tools/balance-report.ts` early, not after content is built.
- World map UI is the first data-driven UI screen — keep it read-only from
  JSON (no map data duplicated in Unity scenes).
