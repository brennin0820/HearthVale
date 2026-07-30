# Hearthlight Vale — Zone Layout Reference

> **Current Phaser Next route (2026-07-22):** the original 10-map plan below
> has expanded to 19 exported maps. New journeys begin in
> `hearthvale_town_ro`; its authored field connects into Mushroom Hollow,
> Crystal Mine Approach, and Whisperwood, from which the full Millwick,
> Moonreed Fen, Moonwell, Emberglass Shelf, Hollow Kiln, Lanternspire finale,
> and Afterlight postgame hunt are reachable. `npm run verify:campaign`
> enforces reachability to and from all 33 live maps, including the east road
> from Afterlight into Dawnshore Reach. Hearthlight Vale itself remains a
> 19-map region. The
> tables below remain the original layout reference; `src/data/world/maps.ts`
> and the exported region chart are authoritative for the live route.

Canonical layout reference for the **Hearthlight Vale** starter region (levels **1–14**). All names are original HearthVale IP. Map IDs match `src/data/world/maps.ts`; this document is the human-readable companion.

**Related:** `docs/ROADMAP.md` · `STRATEGY.md` · `docs/world/DAWNSHORE_REACH_LAYOUT.md` · `src/data/world/`

---

## Region overview

| Field | Value |
|-------|-------|
| **Region ID** | `hearthlight_vale` |
| **Display name** | Hearthlight Vale |
| **Level range** | 1–14 (starter arc) |
| **Capital** | Hearthvale Town (`hearthvale_town_ro`) |
| **Map count** | 19 live exports (10-map original Phase A target) |
| **Playable loop (Phase B)** | Town → Cloverfield Plains → Mushroom Hollow → Old Crystal Mine |
| **Expansion arcs (Phase C–D+)** | Millwick → Moonwell chain; Crystal Approach → Emberglass Shelf → Hollow Kiln; both capstones → Lanternspire Summit → Afterlight Expanse |

### Narrative spine

Hearthlight Vale is the warm threshold of the wider HearthVale world: a sheltered vale where new adventurers learn gathering, light combat, and portal travel before pushing toward the Moonwell ruins and border towns. Progression follows field difficulty outward from Hearthvale Town, with the Old Crystal Mine as the first dungeon test, parallel Moonwell Heart and Hollow Kiln capstones, a joined Lanternspire Summit finale at level 14, and the Afterlight Expanse as its repeatable postgame hunt.

---

## Map taxonomy

| Kind | Purpose | Safe zone | World map | Examples |
|------|---------|-----------|-----------|----------|
| `town` | Hubs, vendors, quests, warp services | Yes | Yes | Hearthvale Town, Millwick Crossing |
| `field` | Overworld combat, gathering, travel | No* | Yes | Cloverfield Plains, Mushroom Hollow |
| `dungeon` | Instanced depth, bosses, rare drops | No | Usually hidden | Old Crystal Mine, Moonwell Ruins |
| `instance` | Scripted one-off spaces | Varies | Hidden | Moonwell Heart |

\*Field maps may contain small camp clearings; only `town` maps set `safeZone: true` in data.

### Data fields (per map)

Each `MapDefinition` carries: `id`, `displayName`, `kind`, `regionId`, `levelRange`, `showOnWorldMap`, `worldMapPosition`, `biome`, `musicKey`, `gridSize`, `spawnTables`, optional `resourceNodes`, `npcs`, `portals`, `playerSpawn`, `safeZone`, `assetKey`.

---

## Zone catalog (all 10 maps)

| # | Map ID | Display name | Kind | Lv range | Biome | On world map | Notes |
|---|--------|--------------|------|----------|-------|--------------|-------|
| 1 | `hearthvale_town` | Hearthvale Town | town | 1–99 | hearth_hamlet | Yes | Capital; safe zone; tutorial hub |
| 2 | `cloverfield_plains` | Cloverfield Plains | field | 1–4 | clover_meadow | Yes | Starter grind; Jellybud, Spriggle |
| 3 | `mushroom_hollow` | Mushroom Hollow | field | 3–6 | fungal_glen | Yes | Puffshroom, Sporeling |
| 4 | `whisperwood_meadows` | Whisperwood Meadows | field | 5–7 | whisper_grove | Yes | Unlocks from Hollow (Lv 5) |
| 5 | `old_mill_road` | Old Mill Road | field | 8–10 | mill_lane | Yes | Connector toward border |
| 6 | `millwick_crossing` | Millwick Crossing | town | 8–99 | wayfarer_hamlet | Yes | Second hub; economy hooks |
| 7 | `crystal_mine_approach` | Crystal Mine Approach | field | 6–9 | quarry_fringe | Yes | Optional approach lane |
| 8 | `old_crystal_mine` | Old Crystal Mine | dungeon | 8–15 | crystal_depths | **No** | First dungeon; boss in Phase C |
| 9 | `moonwell_entrance` | Moonwell Entrance | field | 10–12 | moonlit_moor | Yes | Region border field |
| 10 | `moonwell_ruins` | Moonwell Ruins | dungeon | 11–14 | ruined_sanctum | **No** | Region capstone dungeon |

### Live expansions beyond the original catalog

| Map ID | Display name | Kind | Lv range | World map | Purpose |
|--------|--------------|------|----------|-----------|---------|
| `hearthvale_town_ro` | Hearthvale Town | town | 1–99 | Yes | Active authored capital and new-game start |
| `cloverfield_plains_ro` | Cloverfield Plains | field | 1–4 | Yes | Active authored opening field and campaign junction |
| `old_crystal_mine_ro_b1` | Old Crystal Mine B1 | dungeon | 8–15 | No | Authored alternate mine entry |
| `moonreed_fen` | Moonreed Fen | field | 12–14 | Yes | Water/spirit hunt and gathering route |
| `moonwell_heart` | Moonwell Heart | instance | 14 | No | Tidemoon Matriarch finale |
| `emberglass_shelf` | Emberglass Shelf | field | 11–13 | Yes | Fire/crystal survey, Glasswright Orla, kiln approach |
| `hollow_kiln` | Hollow Kiln | dungeon | 13–14 | Yes | Kilnheart Colossus finale and legendary reward |
| `lanternspire_summit` | Lanternspire Summit | instance | 14 | Yes | Joined final quest, Gloam Wardens, and The Starved Crown |
| `afterlight_expanse` | Afterlight Expanse | field | 14 | Yes | Postgame vigil, rare crafting materials, and Eclipse Herald boss |

### Map aliases (legacy / shorthand)

| Alias | Canonical map ID |
|-------|------------------|
| `village` | `hearthvale_town` |
| `forest` | `cloverfield_plains` |
| `dungeon` | `old_crystal_mine` |

---

## ASCII layout sketches — starter loop (Phase B)

Grids are **conceptual** (not tile-accurate). `P` = portal, `N` = NPC, `S` = spawn cluster, `#` = blocking terrain, `.` = walkable.

### Hearthvale Town (`hearthvale_town`)

```
                    NORTH
    ################################################
    ##............................................##
    ##..######......................######........##
    ##..# INN #....CENTRAL GREEN....# SHOP #......##
    ##..######......(playerSpawn)....######........##
    ##...................N........................##
    ##...............[Elder Gemhorn]..............##
    ##............................................##
    ##....######..................######..........##
    ##....# HOME #................# GUILD #.......##
    ##....######..................######..........##
    ##............................................##
    ##........[Merchant Silas]....................##
    ##........[Hearth Courier]....................##
    ##............................................##
    ##..........................P (east_gate).....##
    ################################################
                    EAST → Cloverfield Plains
```

**Landmarks:** Elder Gemhorn (`elder`), Merchant Silas (`merchant_silas`), Hearth Courier (`hearth_courier`), east gate portal.

### Cloverfield Plains (`cloverfield_plains`)

```
    ################################################
    ##P (west_gate)................................##
    ##← Hearthvale Town............................##
    ##............................................##
    ##......SSSS (Jellybud).......................##
    ##......SSSS...................................##
    ##............................................##
    ##..............P (hollow_trail)..............##
    ##..............↑ Mushroom Hollow............##
    ##............................................##
    ##................SSSS (Spriggle).............##
    ##............................................##
    ##................................P (mine_mouth)
    ##...............................→ Old Crystal Mine
    ################################################
```

**Landmarks:** West gate (town return), hollow trail (north), mine mouth (east), scattered clover patches for gathering.

### Mushroom Hollow (`mushroom_hollow`)

```
    ################################################
    ##................P (west_trail)...............##
    ##................↓ Cloverfield Plains........##
    ##............................................##
    ##....SSSS (Puffshroom).......................##
    ##....####....................................##
    ##....#GG#  giant stump landmark..............##
    ##....####....................................##
    ##............................................##
    ##..............SSSS (Sporeling)..............##
    ##............................................##
    ##..............................P (southeast).##
    ##..............................→ Whisperwood Meadows
    ##..............................(requires Lv 5).##
    ################################################
```

**Landmarks:** Fungal canopy, spore pools, southeast gate (level-gated).

### Old Crystal Mine (`old_crystal_mine`)

```
    ################################################
    ##P (mine_exit)................................##
    ##← Cloverfield Plains (700, 150)..............##
    ##............................................##
    ##....####....####....####....................##
    ##....#  #....#  #....#  #  crystal veins.....##
    ##....####....####....####....................##
    ##............................................##
    ##..............SHAFT DESCENT.................##
    ##..............(deeper floors — Phase C).....##
    ##............................................##
    ##..............[BOSS CHAMBER]................##
    ##..............(Phase C — Gemhorn Sentinel)..##
    ################################################
```

**Landmarks:** Entry chamber, crystal veins, vertical shaft (Phase C floors), boss chamber at depth.

---

## Portal wiring — canonical starter region

Bidirectional pairs use matching portal IDs on each side. One-way portals are noted.

| Source map | Portal ID | Label | Position (x, y) | Target map | Target spawn (x, y) | Constraints |
|------------|-----------|-------|-----------------|------------|---------------------|-------------|
| `hearthvale_town` | `east_gate` | East Gate | (640, 160) | `cloverfield_plains` | (-610, 170) | — |
| `cloverfield_plains` | `west_gate` | West Gate | (600, 150) | `hearthvale_town` | (-620, 160) | — |
| `cloverfield_plains` | `hollow_trail` | Hollow Trail | (120, -80) | `mushroom_hollow` | (-500, 180) | — |
| `mushroom_hollow` | `west_trail` | West Trail | (-480, 200) | `cloverfield_plains` | (400, 200) | — |
| `cloverfield_plains` | `mine_mouth` | Mine Mouth | (720, 140) | `old_crystal_mine` | (-540, 155) | — |
| `old_crystal_mine` | `mine_exit` | Mine Exit | (-520, 160) | `cloverfield_plains` | (700, 150) | — |
| `mushroom_hollow` | `southeast` | Southeast Path | (500, 220) | `whisperwood_meadows` | (-480, 180) | `requiredLevel: 5` |
| `whisperwood_meadows` | `northwest` | Northwest Path | (-460, 190) | `mushroom_hollow` | (480, 210) | — |
| `whisperwood_meadows` | `west_return` | West Return | (-500, 100) | `cloverfield_plains` | (200, -60) | — |
| `whisperwood_meadows` | `east_mill` | Old Mill Road | (520, 120) | `old_mill_road` | (-500, 150) | — |
| `old_mill_road` | `west_whisper` | Whisperwood | (-480, 160) | `whisperwood_meadows` | (500, 130) | — |
| `old_mill_road` | `millwick_gate` | Millwick Crossing | (600, 140) | `millwick_crossing` | (-580, 160) | — |
| `millwick_crossing` | `road_return` | Old Mill Road | (-560, 170) | `old_mill_road` | (580, 150) | — |
| `old_mill_road` | `south_moonwell` | Moonwell Trail | (200, 280) | `moonwell_entrance` | (-400, -120) | — |
| `moonwell_entrance` | `north_mill` | Old Mill Road | (-380, -100) | `old_mill_road` | (220, 270) | — |
| `moonwell_entrance` | `ruins_descent` | Moonwell Descent | (300, 200) | `moonwell_ruins` | (-200, 180) | — |
| `moonwell_ruins` | `ruins_exit` | Surface Exit | (-180, 200) | `moonwell_entrance` | (280, 190) | — |
| `cloverfield_plains` | `quarry_path` | Quarry Path | (400, -100) | `crystal_mine_approach` | (-450, 160) | — |
| `crystal_mine_approach` | `plains_return` | Cloverfield | (-430, 170) | `cloverfield_plains` | (420, -90) | — |
| `crystal_mine_approach` | `mine_shaft` | Mine Shaft | (500, 100) | `old_crystal_mine` | (-300, 100) | Alt. dungeon entry |
| `crystal_mine_approach` | `emberglass_trail` | Emberglass Shelf | (360, -260) | `emberglass_shelf` | (-656, 16) | `requiredLevel: 11` |
| `emberglass_shelf` | `approach_pass` | Crystal Mine Approach | (-816, 16) | `crystal_mine_approach` | (320, -220) | — |
| `emberglass_shelf` | `hollow_kiln_gate` | Hollow Kiln | (816, 16) | `hollow_kiln` | (-528, 16) | Lv 13 + Emberglass Survey |
| `hollow_kiln` | `shelf_return` | Emberglass Shelf | (-688, 16) | `emberglass_shelf` | (720, 16) | — |
| `hearthvale_town_ro` | `lanternspire_gate` | Lanternspire Summit | (-176, 112) | `lanternspire_summit` | (-624, 16) | Lv 14 + accepted Lanternspire Accord |
| `lanternspire_summit` | `hearthvale_return` | Hearthvale Town | (-752, 16) | `hearthvale_town_ro` | (-176, 112) | — |
| `lanternspire_summit` | `afterlight_passage` | Afterlight Expanse | (784, 16) | `afterlight_expanse` | (-688, 16) | Lv 14 + completed Lanternspire Accord |
| `afterlight_expanse` | `lanternspire_return` | Lanternspire Summit | (-848, 16) | `lanternspire_summit` | (656, 16) | — |
| `afterlight_expanse` | `dawnshore_passage` | Dawnshore Reach | (880, 16) | `dawnshore_camp` | (-496, -16) | Lv 15 + completed Afterlight Vigil |

**Verification:** `npm run verify:portals` (Phase A tooling) checks target existence and bidirectional pairing.

---

## Hearth Courier warp services

Hearth Courier NPCs (`hearth_courier`) provide active fast travel within **Hearthlight Vale**. The Phaser Next wayline panel reads `targetMapId`, `targetSpawn`, cost, level, and quest unlocks directly from the region data, explains blocked routes, and preserves the full journey state.

| Service ID | Destination map | Display name | Fee | Min level | Unlock |
|------------|-----------------|--------------|-----|-----------|--------|
| `warp_cloverfield` | `cloverfield_plains_ro` | Cloverfield Plains | **Free** | 1 | — |
| `warp_mushroom_hollow` | `mushroom_hollow` | Mushroom Hollow | 120g | 3 | — |
| `warp_whisperwood` | `whisperwood_meadows` | Whisperwood Meadows | 180g | 5 | — |
| `warp_millwick` | `millwick_crossing` | Millwick Crossing | 250g | 8 | Letter for Millwick |
| `warp_crystal_approach` | `crystal_mine_approach` | Crystal Mine Approach | 200g | 6 | — |
| `warp_emberglass` | `emberglass_shelf` | Emberglass Shelf | 300g | 11 | The Emberglass Survey |
| `warp_moonwell` | `moonwell_entrance` | Moonwell Entrance | 320g | 10 | Moonwell Sigil |
| `warp_afterlight` | `afterlight_expanse` | Afterlight Expanse | 420g | 14 | The Lanternspire Accord |
| `warp_emberglass` | Hearth Courier | `emberglass_shelf` | Emberglass Shelf | 300z | 11 | Post-survey |

**Design rules**

- First field warp (Cloverfield) is **free** to reduce early friction.
- Hub-to-hub warps cost more than hub-to-adjacent-field.
- Dungeon maps (`old_crystal_mine`, `moonwell_ruins`) are **not** warp targets — players must walk or portal.

---

## Art pipeline checklist (per map)

Each map ships three asset layers plus metadata. Asset keys follow `{assetKey}_*` convention.

| Layer | File pattern | Contents | Phase |
|-------|--------------|----------|-------|
| **Base** | `assets/maps/{assetKey}/base.png` | Ground tiles, static terrain | B+ |
| **Props** | `assets/maps/{assetKey}/props.png` | Trees, buildings, overlays (depth-sorted) | B+ |
| **Collision** | `assets/maps/{assetKey}/collision.json` | Blocking polygons / tile flags for Phaser | B+ |
| **Metadata** | `src/data/world/maps.ts` | Spawns, portals, NPCs, grid size | A |

### Per-map checklist

| Map ID | assetKey | Base | Props | Collision | Music | Status |
|--------|----------|------|-------|-----------|-------|--------|
| `hearthvale_town` | `hearthvale_town` | ☐ | ☐ | ☐ | `bgm_hearth_hamlet` | Phase B |
| `cloverfield_plains` | `cloverfield_plains` | ☐ | ☐ | ☐ | `bgm_clover_wind` | Phase B |
| `mushroom_hollow` | `mushroom_hollow` | ☐ | ☐ | ☐ | `bgm_hollow_hush` | Phase B |
| `old_crystal_mine` | `old_crystal_mine` | ☐ | ☐ | ☐ | `bgm_crystal_deep` | Phase B/C |
| `whisperwood_meadows` | `whisperwood_meadows` | ☐ | ☐ | ☐ | `bgm_whisper_leaves` | Phase C |
| `old_mill_road` | `old_mill_road` | ☐ | ☐ | ☐ | `bgm_mill_road` | Phase D |
| `millwick_crossing` | `millwick_crossing` | ☐ | ☐ | ☐ | `bgm_wayfarer` | Phase D |
| `crystal_mine_approach` | `crystal_mine_approach` | ☐ | ☐ | ☐ | `bgm_quarry` | Phase C |
| `moonwell_entrance` | `moonwell_entrance` | ☐ | ☐ | ☐ | `bgm_moonwell` | Phase D |
| `moonwell_ruins` | `moonwell_ruins` | ☐ | ☐ | ☐ | `bgm_ruins` | Phase D |

**Pipeline order:** metadata (A) → greybox collision (B) → base pass → props pass → polish + lighting.

---

## Build phases A / B / C / D (layout scope)

| Phase | Layout focus | Maps | Deliverable |
|-------|--------------|------|-------------|
| **A** — Data foundation | Catalog + portal graph + warp table in TS | All 10 defined | `verify:portals` clean; JSON export |
| **B** — Starter 4-map loop | Playable Phaser loop | Town, Plains, Hollow, Mine | Walk town → field → field → dungeon → return |
| **C** — Dungeon depth + boss | Mine floors, Whisperwood, Approach | + Whisperwood, Crystal Mine Approach, mine boss chamber | Boss encounter, deeper mine layout |
| **D** — Early expansion + world map | Border towns, Moonwell chain, UI | + Old Mill Road, Millwick, Moonwell Entrance/Ruins | World map pins, Millwick economy |

### Phase B acceptance (starter loop)

- [ ] Player spawns in Hearthvale Town at `playerSpawn`
- [ ] East gate → Cloverfield; grind Jellybud / Spriggle
- [ ] Hollow trail → Mushroom Hollow; Puffshroom / Sporeling
- [ ] Mine mouth → Old Crystal Mine; exit returns to plains
- [ ] Hearth Courier free warp to Cloverfield from town
- [ ] All four maps have base + props + collision loaded in Phaser

### Phase C acceptance (depth)

- [ ] Old Crystal Mine multi-floor layout and boss chamber
- [ ] Whisperwood reachable at Lv 5 via southeast portal
- [ ] Crystal Mine Approach optional lane wired

### Phase D acceptance (expansion)

- [ ] Old Mill Road ↔ Millwick ↔ Moonwell portal chain
- [ ] World map UI shows all `showOnWorldMap: true` pins
- [ ] Paid warp services through Millwick and Moonwell Entrance

---

## World map positions (conceptual)

Normalized coordinates for Phase D world-map UI (`worldMapPosition`):

```
        N
        │
  Whisperwood ●────● Old Mill Road ────● Millwick Crossing
        │                                    │
  Mushroom ●                                 │
   Hollow │                                  │
        │                                    │
  Cloverfield ●──● Hearthvale Town           │
        │         (capital)                  │
        │                                    │
  Crystal Mine                                │
  Approach ●──● Emberglass Shelf              │
                  │                           │
              Hollow Kiln                     │
        │                                     │
        └──────── Moonwell Entrance ●─────────┘
                         │
                  Moonwell Ruins (hidden pin)
```

---

## Revision log

| Date | Change |
|------|--------|
| 2026-07-22 | Documented the verified cross-region exit to Dawnshore Reach and the shared resource-node map contract |
| 2026-07-22 | Updated live route to 17 maps and documented Emberglass Shelf, Hollow Kiln, their portals, warp, and parallel finale role |
| 2026-06-11 | Initial layout reference — Phase A parallel bootstrap |
