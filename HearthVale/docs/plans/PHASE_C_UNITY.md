# Phase C-Unity — Dungeon depth + boss (PLANNED)

Goal: a party-of-one can clear the mine boss (Gemhorn Sentinel) and return to
town with loot. Whisperwood Meadows reachable at level 5. Phase B maps keep
regression-free portal behavior.

## Preconditions
- Phase B-Unity DoD fully met (Editor compiles, 4-map loop playable).
- Reference implementation available: the archived Phaser combat code
  (`client-phaser-archive/src/combat/CombatController.ts`) is the porting
  source of truth for combat feel/formulas — port logic, don't redesign.
- Combat formulas already exist in the data layer:
  `src/data/combat/formulas.ts`, `src/data/progression/xpCurve.ts`. If the
  Unity client needs them at runtime, they must be exported to JSON (new
  export) or ported to C# with a parity test — decide in item 1.

## Work items (each ≈ one loop iteration unless noted)

### Combat core
- [ ] Decide + implement formula delivery: export combat/XP formulas as JSON
      constants vs. C# port with a parity check script. Validation: parity
      script compares TS and C# outputs for a grid of levels/stats.
- [ ] Monster spawning from `spawnTables` (bounds, maxConcurrent,
      respawnSeconds, weighted entries). Validation: counts and respawn timing
      observed in Play Mode match table values for cloverfield_plains.
- [ ] Monster AI: aggro radius + leash-return (port from archived
      CombatController). Validation: Play Mode — aggro on approach, leash on
      distance, HP reset on leash.
- [ ] Player melee attack + target cycling (tab/nearest). Validation: damage
      applied per formulas; target indicator cycles.
- [ ] Floating damage numbers + death/despawn + XP-on-kill + level-up via
      xpCurve. Validation: kill a Jellybud, XP and level-up match the curve.
- [ ] Player death/respawn at town. Validation: HP 0 → respawn at
      hearthvale_town playerSpawn with penalty rules (per archived behavior).

### Skills & jobs
- [ ] Skill-effect wiring: map `SkillDefinition.effect` (damage multiplier,
      element, range, AoE, cooldown, cost) onto the combat system.
      Validation: 2–3 representative skills (single-target, AoE, buff) behave
      per catalog values in Play Mode.
- [ ] Job selection UI at level 10: branch Vale Novice → 6 tier-1 paths;
      apply `JobStatGrowth`, grant `startingSkills`. Validation: selecting a
      job updates stats/skills per `data/catalog/jobs.json`.

### Dungeon content (data layer + client)
- [ ] Mine floors 2+ and boss chamber: new maps authored in `src/data/world/`
      (TS source, never hand-edited JSON), exported, portal-verified.
      Validation: `npm run verify:all` green with new maps; portals resolve.
- [ ] Gemhorn Sentinel boss encounter (stats/skills/drops in catalog TS,
      boss behavior in Unity). Validation: boss fight winnable at target
      level; drops granted from its drop table.
- [ ] Loot pickup + inventory (minimal): drops from `drops.json` appear and
      can be picked up. Validation: kill → drop → pickup → HUD/inventory count.
- [ ] Hearth Courier paid warps (fee from warp table; gating honored).
      Validation: warp costs and level/quest gates match `data/regions.json`.

## Definition of Done
1. Solo character can clear the Gemhorn Sentinel and return to town with loot.
2. Whisperwood Meadows reachable at level 5 (gates honored).
3. Phase B 4-map loop still passes its acceptance walk (regression check).
4. `npm run verify:all` + root tsc green; any new data fields exist in both
   TS types and C# DTOs.

## Risks
- Combat feel drift vs. the archived Phaser implementation — mitigate by
  porting from `client-phaser-archive/src/combat/CombatController.ts`, not
  rewriting from memory.
- Formula duplication (TS vs C#) — mitigate with the parity check item.
- Scope creep into multiplayer — explicitly deferred to Later.
