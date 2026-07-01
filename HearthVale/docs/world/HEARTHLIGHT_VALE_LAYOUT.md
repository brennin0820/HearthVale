# Hearthlight Vale — Zone Layout Reference

Canonical layout reference for the **Hearthlight Vale** starter region (levels **1–14**). All names are original HearthVale IP. Map IDs match `src/data/world/maps.ts`; this document is the human-readable companion.

**Related:** `docs/ROADMAP.md` · `STRATEGY.md` · `src/data/world/`

---

## Region overview

| Field | Value |
|-------|-------|
| **Region ID** | `hearthlight_vale` |
| **Display name** | Hearthlight Vale |
| **Level range** | 1–14 (starter arc) |
| **Capital** | Hearthvale Town (`hearthvale_town`) |
| **Map count** | 10 (Phase A catalog) |
| **Playable loop (Phase B)** | Town → Cloverfield Plains → Mushroom Hollow → Old Crystal Mine |
| **Expansion arc (Phase C–D)** | Whisperwood Meadows → Old Mill Road → Millwick Crossing → Moonwell chain |

### Narrative spine

Hearthlight Vale is the warm threshold of the wider HearthVale world: a sheltered vale where new adventurers learn gathering, light combat, and portal travel before pushing toward the Moonwell ruins and border towns. Progression follows field difficulty outward from Hearthvale Town, with the Old Crystal Mine as the first dungeon test and Moonwell Ruins as the region capstone.

---

## Map taxonomy

| Kind | Purpose | Safe zone | World map | Examples |
|------|---------|-----------|-----------|----------|
| `town` | Hubs, vendors, quests, warp services | Yes | Yes | Hearthvale Town, Millwick Crossing |
| `field` | Overworld combat, gathering, travel | No* | Yes | Cloverfield Plains, Mushroom Hollow |
| `dungeon` | Instanced depth, bosses, rare drops | No | Usually hidden | Old Crystal Mine, Moonwell Ruins |
| `instance` | Scripted one-off spaces (future) | Varies | Hidden | Reserved — not in Phase A catalog |

\*Field maps may contain small camp clearings; only `town` maps set `safeZone: true` in data.

### Data fields (per map)

Each `MapDefinition` carries: `id`, `displayName`, `kind`, `regionId`, `levelRange`, `showOnWorldMap`, `worldMapPosition`, `biome`, `musicKey`, `gridSize`, `spawnTables`, `npcs`, `portals`, `playerSpawn`, `safeZone`, `assetKey`.

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

**Verification:** `npm run verify:portals` (Phase A tooling) checks target existence and bidirectional pairing.

---

## Hearth Courier warp services

Hearth Courier NPCs (`hearth_courier`) provide paid fast travel within **Hearthlight Vale**. Warp targets reference `targetMapId` + `targetSpawn`; fees are data-driven (Phase B UI).

| Service ID | From (hub) | Destination | Display name | Fee | Min level | Phase |
|------------|------------|-------------|--------------|-----|-----------|-------|
| `warp_cloverfield_free` | `hearthvale_town` | `cloverfield_plains` | Cloverfield Plains | **Free** | 1 | A/B |
| `warp_hollow` | `hearthvale_town` | `mushroom_hollow` | Mushroom Hollow | 50z | 3 | B |
| `warp_whisperwood` | `hearthvale_town` | `whisperwood_meadows` | Whisperwood Meadows | 120z | 5 | C |
| `warp_millwick` | `hearthvale_town` | `millwick_crossing` | Millwick Crossing | 200z | 8 | D |
| `warp_moonwell` | `millwick_crossing` | `moonwell_entrance` | Moonwell Entrance | 350z | 10 | D |
| `warp_town_return` | `millwick_crossing` | `hearthvale_town` | Hearthvale Town | 150z | 1 | D |

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
  Approach ●                                  │
        │                                     │
        └──────── Moonwell Entrance ●─────────┘
                         │
                  Moonwell Ruins (hidden pin)
```

---

## Revision log

| Date | Change |
|------|--------|
| 2026-06-11 | Initial layout reference — Phase A parallel bootstrap |
