# HearthVale — Product Roadmap

Phased delivery plan for **HearthVale** (Path A: Phaser-first client, TypeScript data layer, Colyseus server later). Starter scope: **Hearthlight Vale**, levels **1–14**.

**Related:** `STRATEGY.md` · `docs/world/HEARTHLIGHT_VALE_LAYOUT.md` · `docs/01_PROJECT_MEMORY.md`

---

## Overview

```
Phase A ──► Phase B ──► Phase C ──► Phase D ──► Later (server, combat, jobs)
 data         4-map       dungeon      expansion      Colyseus + banked patterns
```

| Phase | Name | Status | Outcome |
|-------|------|--------|---------|
| **A** | Data foundation | **Current** | TS world catalog, portal graph, export/verify tooling |
| **B** | Phaser starter 4-map loop | Planned | Walkable town → plains → hollow → mine |
| **C** | Dungeon depth + boss | Planned | Mine floors, Whisperwood unlock, first boss |
| **D** | Early expansion + world map UI | Planned | Millwick, Moonwell chain, world map pins |
| **Later** | Server + combat + jobs | Backlog | Colyseus, RO-inspired systems from code bank |

---

## Phase A — Data foundation (current)

**Goal:** Single source of truth for the starter region before client or server work.

### Deliverables

- [x] Project bootstrap docs (`STRATEGY.md`, `AGENTS.md`, ledgers, handoff)
- [ ] `src/data/world/types.ts` — `MapKind`, `MapDefinition`, `MapPortal`, `RegionDefinition`
- [ ] `src/data/world/maps.ts` — all 10 Hearthlight Vale maps + portal graph
- [ ] `src/data/world/regions.ts` — `hearthlight_vale` region + Hearth Courier warp table
- [ ] `src/data/world/index.ts` — exports + `MAP_ALIASES`
- [ ] `package.json` + `scripts/export-data.ts` → `data/maps.json`, `data/regions.json`
- [ ] `scripts/verify-portals.ts` — target existence + bidirectional pairing
- [x] `docs/world/HEARTHLIGHT_VALE_LAYOUT.md` — layout reference
- [x] `docs/ROADMAP.md` — this document

### Exit criteria

- `npm run verify` passes with zero portal errors
- All 10 maps documented in layout reference match exported JSON
- No hand-edited duplicate map data outside `src/data/world/`

### Parallel workers (2026-06-11)

| Worker | Scope |
|--------|-------|
| Docs bootstrap | Ledgers, strategy, agents, handoff, README |
| World data | `src/data/world/*` |
| Build tooling | `package.json`, export/verify scripts |
| Layout + roadmap | This file + `HEARTHLIGHT_VALE_LAYOUT.md` |

---

## Phase B — Phaser starter 4-map loop

**Goal:** First playable client loop — prove Path A stack end-to-end.

### Maps in scope

| Map | Role |
|-----|------|
| Hearthvale Town | Safe hub, Elder Gemhorn, Merchant Silas, Hearth Courier |
| Cloverfield Plains | Lv 1–4 grind (Jellybud, Spriggle) |
| Mushroom Hollow | Lv 3–6 grind (Puffshroom, Sporeling) |
| Old Crystal Mine | Lv 8–15 first dungeon (entry/exit only in B) |

### Deliverables

- [ ] Phaser 3 + TypeScript client scaffold (`src/client/`)
- [ ] Map loader: base + props + collision JSON per map
- [ ] Player movement, camera, portal transitions
- [ ] NPC placeholders (elder, merchant_silas, hearth_courier)
- [ ] Basic mob spawns from `spawnTables` (client-side for solo)
- [ ] Hearth Courier UI — free Cloverfield warp
- [ ] Greybox art pass for four maps (see art checklist in layout doc)

### Exit criteria

- New character spawns in Hearthvale Town
- Full loop: town → plains → hollow → mine → return without dead portals
- `export:data` JSON consumed by client without manual edits

---

## Phase C — Dungeon depth + boss

**Goal:** Vertical content in Old Crystal Mine and east-field expansion.

### Maps added / deepened

| Map | Role |
|-----|------|
| Old Crystal Mine (floors) | Multi-floor layout, boss chamber |
| Whisperwood Meadows | Lv 5+ field (portal from Mushroom Hollow) |
| Crystal Mine Approach | Optional quarry approach lane |

### Deliverables

- [ ] Mine floor 2+ layouts and portal-down wiring
- [ ] Boss encounter — **Gemhorn Sentinel** (original IP; not RO content)
- [ ] Whisperwood portal gate (`requiredLevel: 5`)
- [ ] Drop tables and quest hooks for mine completion
- [ ] Paid Hearth Courier warps (Hollow, Whisperwood)
- [ ] Audio stubs (`musicKey` per map)

### Exit criteria

- Party-of-one can clear mine boss and return to town with loot
- Whisperwood reachable from Hollow at level 5
- Phase B maps retain regression-free portal behavior

---

## Phase D — Early expansion + world map UI

**Goal:** Complete the Hearthlight Vale catalog on client; surface region on world map.

### Maps in scope

| Map | Role |
|-----|------|
| Old Mill Road | Lv 8–10 connector |
| Millwick Crossing | Second town hub |
| Moonwell Entrance | Lv 10–12 border field |
| Moonwell Ruins | Lv 11–14 capstone dungeon |

### Deliverables

- [ ] Portal chain: Whisperwood → Old Mill Road → Millwick → Moonwell
- [ ] Moonwell Ruins dungeon (simpler than mine boss; region finale)
- [ ] World map UI with pins for all `showOnWorldMap: true` maps
- [ ] Millwick economy NPCs (crafting vendor, warp hub)
- [ ] Full Hearth Courier fee table (see layout doc)
- [ ] Region completion quest arc (Lv 14 send-off to next region — TBD)

### Exit criteria

- All 10 Phase A maps playable or reachable
- World map reflects `worldMapPosition` from data
- Starter region arc completable solo to level 14

---

## Later — Server, combat, jobs (backlog)

**Goal:** Evolve from solo Phaser client to authoritative multiplayer MMO.

### Server (Colyseus)

- Node + Colyseus room per map (or shard)
- Authoritative movement, combat, inventory
- Persistence layer (player state, quests, economy)
- Portal and warp validation server-side
- Replace client-side spawns with server spawn tables

### Combat (banked RO patterns)

Apply patterns from code bank (`~/.claude/code-bank/`) — **mechanics only**, original HearthVale content:

- [ ] ATK/DEF/hit/flee formulas (adapted, not copied literals)
- [ ] Element table and size modifiers (original elements)
- [ ] Status effects (stun, poison, silence — renamed skills)
- [ ] Aggro leash and spawn respawn timers

### Jobs and progression

- [ ] Base class selection (Novice → first jobs — original class names)
- [ ] Skill trees per job
- [ ] Equipment slots and card/socket system (if scoped)
- [ ] Party/guild hooks (post-Colyseus)

### Content beyond Hearthlight Vale

- [ ] Region 2+ (name TBD)
- [ ] Instance maps (`kind: instance`)
- [ ] Seasonal events and cozy MMO social features

---

## Dependency graph

```mermaid
flowchart LR
  A[Phase A: Data] --> B[Phase B: 4-map Phaser]
  B --> C[Phase C: Mine boss]
  C --> D[Phase D: World map + expansion]
  D --> S[Later: Colyseus]
  D --> X[Later: Combat/jobs]
  S --> X
```

**Rule:** No phase skips portal verification. Each phase ends with `npm run verify` green.

---

## Risks and mitigations

| Risk | Mitigation |
|------|------------|
| Portal graph drift between docs and data | `verify:portals` CI; layout doc references map IDs |
| Art bottleneck on Phase B | Greybox collision first; placeholder base tiles |
| Scope creep into multiplayer | Colyseus explicitly deferred to Later |
| RO IP contamination | Original names only; banked patterns are mechanics, not lore |

---

## Revision log

| Date | Change |
|------|--------|
| 2026-06-11 | Initial roadmap — Phase A parallel bootstrap |
