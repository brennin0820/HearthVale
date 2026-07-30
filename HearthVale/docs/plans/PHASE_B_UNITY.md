# Phase B-Unity — Unity starter loop (CURRENT)

Goal: prove the data layer drives a Unity client end-to-end. A new character
spawns in Hearthvale Town, walks the 4-map loop (town → plains → hollow →
mine → return) with no dead portals, HUD reflects data-layer values, and NPC
dialogue renders from existing data — all driven by `data/maps.json` and
`data/catalog/*.json`.

## Preconditions
- Phase A (data foundation) done — `npm run verify:all` green. ✔ verified 2026-07-01.
- StreamingAssets junction in place (`npm run unity:refresh-data`). ✔ 2026-07-01.

## Explicitly out of scope (deferred to Phase C-Unity — do not claim as done here)
Click-to-move A* pathfinding · full melee CombatController · job selection UI ·
skill-effect wiring · audio service · dev overlay (F3) · monster spawning/AI.

## Milestones and work items (each item ≈ one loop iteration)

### M1 — Static scaffold verification (no Editor required) — IN PROGRESS
- [x] DTO↔JSON audit (`WorldData.cs`, `CatalogData.cs`, `WorldDataService.cs`)
      — zero critical mismatches (2026-07-01).
- [x] Fix `Rect` → `RectData` CS0104 shadowing hazard (2026-07-01).
- [ ] Compile-sanity review of remaining 10 scripts (Player/, World/, UI/) +
      asmdef + Packages/manifest.json — review in flight; apply any fixes found.
      Validation: re-review changed files; grep for the flagged patterns.
- [x] Resolve dead `MapAlias` path: removed DTO + `_aliases` field (no Unity
      consumer existed). Grep confirms zero references; verify:all green
      (2026-07-01).
- [x] Trivial cleanups: redundant URL check in `WorldDataService.cs`
      simplified; stale `rarity` comment in `CatalogData.cs` corrected
      (2026-07-01).

### M2 — Editor compile verification — BLOCKED (needs user)
User must open `client-unity/` in Unity 6000.5.1f1 (the pinned version) and approve Unity MCP
(Project Settings > AI > Unity MCP). Then:
- [ ] Zero compile errors in Console (fix any that appear — expect Newtonsoft
      package resolution and using/namespace nits).
      Validation: `Unity_GetConsoleLogs` shows no errors after script reload.
- [ ] Confirm packages resolve: com.unity.nuget.newtonsoft-json, TextMeshPro.
      Validation: Package Manager list via MCP; no missing-type errors.

### M3 — Scene & prefab authoring (Editor/MCP)
- [ ] Boot.unity: camera + BootLoader wiring. Validation: scene loads, no
      exceptions in Console on Play.
- [ ] World.unity: WorldController, CollisionMask consumer, portal triggers
      spawned from data. Validation: Play Mode logs show hearthvale_town loaded,
      22-portal graph honored for the current map.
- [ ] Player prefab: PlayerController + CameraFollow + SpriteRenderer.
      Validation: WASD moves player; collision blocks per mask; camera follows.
- [ ] HUD canvas (HudController) + dialogue panel (DialogueController).
      Validation: bars show data-layer values; [E] near NPC opens dialogue with
      that NPC's `dialogue[]` lines.

### M4 — Playable-loop acceptance
- [ ] Full loop walk: town → cloverfield_plains → mushroom_hollow →
      old_crystal_mine → return. No dead portals; spawn positions match
      `playerSpawn`/portal `targetSpawn` (Y negated on read).
      Validation: scripted or manual walk in Play Mode; Console clean;
      cross-check portal pairs against `npm run verify:portals` output.

## Definition of Done (all must have passed their validation)
1. All 13 C# scripts compile in a real Unity Editor with zero errors.
2. Play Mode boots to Hearthvale Town from BootLoader with a clean Console.
3. 4-map portal loop completes without dead portals, driven by data/maps.json.
4. HUD HP/MP/SP/XP + map name reflect data-layer values.
5. NPC dialogue renders from `data/catalog/npcs.json` via [E] interaction.
6. `npm run verify:all` and root `npx tsc --noEmit` still green.

## Risks / blockers
- Unity MCP approval is the gating dependency for M2–M4 (user action).
- Prefab/scene wiring cannot be statically verified — expect an
  iterate-in-Editor tail even after static review is clean.
- `client-dev.err` is locked by a stray process; harmless, retry deletion later.
