# Later — Server-authoritative multiplayer (BACKLOG SKETCH)

Not executable yet. This is a direction sketch so earlier phases don't paint
the project into a corner; it becomes a real plan only after Phase D ships.

## Direction
- Node + Colyseus, one room per map (shardable).
- Server-authoritative movement, combat, and inventory; client becomes a
  renderer/predictor of server state.
- Persistence layer: player state, quest progress, economy.
- Portal/warp validation server-side; replace client-side spawns with server
  spawn tables (the data layer's spawnTables become server input).

## Systems parked here (from ROADMAP "Later")
Party/guild hooks · server-authoritative socket validation · Region 2+ ·
instance maps · seasonal events / cozy-MMO social features. Status effects,
equipment slots, and the first reusable rune/socket system now ship in the
solo client; this phase only needs their future multiplayer ownership model.

## Constraints earlier phases must respect (anti-corner rules)
- Keep ALL game rules in the data layer or in pure, portable functions —
  combat/XP formulas must stay reproducible outside Unity (the Phase C parity
  check is what makes a future server port cheap).
- Unity client must never invent state the data layer can't express; anything
  the client persists locally (position, HP, inventory) should be shaped so a
  server could own it later.
- No networking dependencies added before this phase begins.

## Entry criteria (when to turn this into a real plan)
- Phase D DoD met, and a deliberate decision to go multiplayer — this phase
  is opt-in, not automatic.
