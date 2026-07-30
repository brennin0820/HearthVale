# Dawnshore Reach — Zone Layout Reference

Canonical companion for HearthVale's first region beyond Hearthlight Vale.
The live data in `src/data/world/maps.ts` and `src/data/world/regions.ts`
remains authoritative.

**Related:** `docs/world/HEARTHLIGHT_VALE_LAYOUT.md` · `docs/ROADMAP.md` · `STRATEGY.md`

---

## Region Overview

| Field | Value |
|-------|-------|
| Region ID | `dawnshore_reach` |
| Display name | Dawnshore Reach |
| Level range | 15–28 |
| Capital | Dawnshore Camp (`dawnshore_camp`) |
| Live maps | 14 |
| Entry | Afterlight Expanse east passage; level 15 + completed Afterlight Vigil |
| Current arc | Camp → Glasswind Coast → Tidebreak Causeway → Stormglass Reliquary → Beaconfall Cliffs → Sunspire Observatory → Aurora Highlands → Zenith Archive → Choirwood Canopy → Crownroot Sanctum → Runeveil Gardens → Namesong Vault → Waystar Moor → Convergence Spire |

Dawnshore is a wind-cut coast where old beacon glass keeps reflecting false
horizons. Its current arc establishes a safe expedition camp, clears the
coast's corrupted bearing, follows the storm road across Tidebreak Causeway,
still the Tempest Remnant, climbs the newly uncovered Beaconfall high route,
restores the great lens inside Sunspire Observatory, then chooses an oath in
Aurora Highlands before reopening Zenith Archive, then follows its blank page
into Choirwood Canopy, the buried Crownroot Sanctum, Runeveil Gardens, the
memorial halls of Namesong Vault, Waystar Moor, and Convergence Spire.

## Live Maps

| Map | Kind | Level | Key content |
|-----|------|-------|-------------|
| `dawnshore_camp` | town | 15–99 | Trailwarden Nia, Quartermaster Vesa, Hearth Courier, fifth shop, four recipes |
| `glasswind_coast` | field | 15–16 | Six resource nodes, three monster families, Drowned Meridian boss |
| `tidebreak_causeway` | field | 16–17 | Six resource nodes, Brinewing Rays, Surgeclaws, Galehorn Prowlers |
| `stormglass_reliquary` | dungeon | 17–18 | Three relic nodes, Stormglass Custodians, Tempest Remnant boss |
| `beaconfall_cliffs` | field | 18–19 | Sela, Roan, six resource nodes, three monster families, sixth shop |
| `sunspire_observatory` | dungeon | 19–20 | Three relic nodes, Lensbound Sentries, Starfall Choirs, Celestial Orrery boss |
| `aurora_highlands` | field | 20–21 | Aurell/Maelis oath choice, Vesper's shop, six resource nodes, three monster families |
| `zenith_archive` | dungeon | 21–22 | Three Living Index nodes, Index Wraiths, Gilded Automatons, Keeper of Zenith boss |
| `choirwood_canopy` | field | 22–23 | Lyra/Eira/Orem, six resource nodes, three monster families, eighth shop |
| `crownroot_sanctum` | dungeon | 23–24 | Three Hymn Leaf nodes, Scriptroot Lurkers, Bellglass Myconids, Crownroot Hierophant boss |
| `runeveil_gardens` | field | 24–25 | Talin/Sera/Pell, six resource nodes, three monster families, ninth shop, rune introduction |
| `namesong_vault` | dungeon | 25–26 | Three Hollowstar seams, Epitaph Sentinels, Pale Scriptlings, Archivore boss |
| `waystar_moor` | field | 26–27 | Calix/Fenn/Ione, six resource nodes, three monster families, tenth shop, calling quest |
| `convergence_spire` | dungeon | 27–28 | Three Vowsteel remnants, Vowsteel Knights, Splitstar Echoes, Manyroad Crown boss |

All fourteen maps have custom collision, authored prop layers, map-specific palettes,
music stubs, regional chart pins, and reciprocal travel.

## Route And Unlocks

| Source | Portal | Target | Requirement |
|--------|--------|--------|-------------|
| Afterlight Expanse | `dawnshore_passage` | Dawnshore Camp | Lv 15 + completed `quest_afterlight_vigil` |
| Dawnshore Camp | `afterlight_return` | Afterlight Expanse | None |
| Dawnshore Camp | `glasswind_gate` | Glasswind Coast | Lv 15 + accepted `quest_glasswind_beacon` |
| Glasswind Coast | `dawnshore_return` | Dawnshore Camp | None |
| Glasswind Coast | `tidebreak_passage` | Tidebreak Causeway | Lv 16 + accepted `quest_tidebreak_road` |
| Tidebreak Causeway | `glasswind_return` | Glasswind Coast | None |
| Tidebreak Causeway | `stormglass_gate` | Stormglass Reliquary | Lv 17 + accepted `quest_stormglass_reliquary` |
| Stormglass Reliquary | `tidebreak_return` | Tidebreak Causeway | None |
| Stormglass Reliquary | `beaconfall_ascent` | Beaconfall Cliffs | Lv 18 + completed `quest_stormglass_reliquary` |
| Beaconfall Cliffs | `stormglass_return` | Stormglass Reliquary | None |
| Beaconfall Cliffs | `sunspire_gate` | Sunspire Observatory | Lv 18 + accepted `quest_sunspire_lens` |
| Sunspire Observatory | `beaconfall_return` | Beaconfall Cliffs | None |
| Sunspire Observatory | `highlands_passage` | Aurora Highlands | Lv 20 + completed `quest_sunspire_lens` |
| Aurora Highlands | `sunspire_return` | Sunspire Observatory | None |
| Aurora Highlands | `zenith_gate` | Zenith Archive | Lv 20 + accepted `quest_zenith_archive` |
| Zenith Archive | `aurora_return` | Aurora Highlands | None |
| Zenith Archive | `choirwood_passage` | Choirwood Canopy | Lv 22 + completed `quest_zenith_archive` |
| Choirwood Canopy | `zenith_return` | Zenith Archive | None |
| Choirwood Canopy | `crownroot_gate` | Crownroot Sanctum | Lv 23 + accepted `quest_crownroot_concordance` |
| Crownroot Sanctum | `choirwood_return` | Choirwood Canopy | None |
| Crownroot Sanctum | `runeveil_passage` | Runeveil Gardens | Lv 24 + completed `quest_crownroot_concordance` |
| Runeveil Gardens | `crownroot_return` | Crownroot Sanctum | None |
| Runeveil Gardens | `namesong_gate` | Namesong Vault | Lv 25 + accepted `quest_namesong_vault` |
| Namesong Vault | `runeveil_return` | Runeveil Gardens | None |
| Namesong Vault | `waystar_passage` | Waystar Moor | Lv 26 + completed `quest_namesong_vault` |
| Waystar Moor | `namesong_return` | Namesong Vault | None |
| Waystar Moor | `convergence_gate` | Convergence Spire | Lv 27 + accepted `quest_convergence_rite` |
| Convergence Spire | `waystar_return` | Waystar Moor | None |

Regional courier services:

| Service | Destination | Fee | Unlock |
|---------|-------------|-----|--------|
| `warp_dawnshore_camp` | Dawnshore Camp | Free | Lv 15 |
| `warp_glasswind` | Glasswind Coast | 240g | Lv 15 + completed Glasswind Bearing |
| `warp_tidebreak` | Tidebreak Causeway | 320g | Lv 16 + completed Where the Tide Breaks |
| `warp_stormglass` | Stormglass Reliquary | 440g | Lv 17 + completed The Storm Remembers |
| `warp_beaconfall` | Beaconfall Cliffs | 560g | Lv 18 + completed Above the Broken Beacon |
| `warp_sunspire` | Sunspire Observatory | 680g | Lv 19 + completed The Sunspire Lens |
| `warp_zenith` | Zenith Archive | 840g | Lv 21 + completed A Blank Page at Zenith |
| `warp_choirwood` | Choirwood Canopy | 960g | Lv 22 + completed The Wood Remembers Song |
| `warp_crownroot` | Crownroot Sanctum | 1120g | Lv 23 + completed Concordance Beneath the Crown |
| `warp_runeveil` | Runeveil Gardens | 1280g | Lv 24 + completed Marks That May Be Moved |
| `warp_namesong` | Namesong Vault | 1480g | Lv 25 + completed Every Name Leaves the Vault |
| `warp_waystar` | Waystar Moor | 1680g | Lv 26 + completed Where Every Road Still Shines |
| `warp_convergence` | Convergence Spire | 1880g | Lv 27 + completed A Calling of Your Own |

## Gathering And Encounters

Glasswind Coast contains three Sunwake Kelp fiber nodes and three Saltglass
ore seams. Nodes enforce level and proximity, persist absolute respawn times,
hide their minimap marker while exhausted, and feed quests and recipes. The
Wayfarer passive Ore Sense has a 15% chance to add one gathered item.
Tidebreak adds Stormreed Fiber and Tideiron Ore nodes; Stormglass adds three
Stormglass Relics. Beaconfall adds Sunveil blooms and Skyglass seams, while
Sunspire holds three Starfall memories. Aurora adds Dawnsage patches and
Sunmetal outcrops, while Zenith holds three Living Index nodes. Choirwood adds
Echo Moss and Resonant Bark, Crownroot holds three Hymn Leaf relics, Runeveil
adds Runebloom and Wayglass, Namesong holds three Hollowstar seams, Waystar
adds Waystar Pollen and Convergent Glass, and Convergence holds three Vowsteel
remnants. The region contains 60 nodes in total.

| Encounter | Level | Element | Primary reward role |
|-----------|-------|---------|---------------------|
| Tideglass Mote | 15 | water | Kelp and saltglass supply |
| Saltbound Husk | 15 | crystal | Saltglass and beacon ash supply |
| Beacon Wraith | 16 | shadow | Quest hunt and beacon ash |
| The Drowned Meridian | 16 | water | Guaranteed Glasswind Compass |
| Brinewing Ray | 16 | water | Stormreed and Charged Pearl supply |
| Surgeclaw | 17 | water | Tideiron and Charged Pearl supply |
| Galehorn Prowler | 17 | wind | Tideiron and field hunt progress |
| Stormglass Custodian | 18 | crystal | Stormglass Fragment supply |
| The Tempest Remnant | 18 | spirit | Guaranteed Tempest Heart |
| Sunveil Sprite | 18 | spirit | Sunveil Petals and Sunblind pressure |
| Zephyrkin Screecher | 18 | wind | Zephyr Pinion supply |
| Cliffglass Ram | 19 | crystal | Skyglass Ore and rare boots |
| Lensbound Sentry | 19 | arcane | Auric Cogs and Lens Prisms |
| Starfall Choir | 20 | spirit | Starfall Dust and elixirs |
| The Celestial Orrery | 20 | arcane | Guaranteed Aurora Lens Core |
| Prismwing Moth | 20 | spirit | Aurora Silk, Dawnsage, and Mending Salve supply |
| Sunforge Boar | 20 | fire | Sunmetal Plate supply and rare greaves |
| Horizon Raptor | 21 | wind | Horizon Talon and draught supply |
| Index Wraith | 21 | arcane | Archive Ink and Memory Leaf supply |
| Gilded Automaton | 22 | crystal | Sunmetal and Zenith Prism supply |
| The Keeper of Zenith | 22 | arcane | Guaranteed Zenith Codex |
| Chimebeetle | 22 | nature | Chime Shell and Echo Moss supply |
| Canticle Stag | 23 | spirit | Canticle Antler and Resonant Bark supply |
| Mossbound Cantor | 23 | nature | Muted pressure and Clearvoice supply |
| Scriptroot Lurker | 23 | shadow | Resonant Bark and Hymn Leaf supply |
| Bellglass Myconid | 24 | fungal | Bellglass Spore and cordial supply |
| The Crownroot Hierophant | 24 | spirit | Guaranteed Concordance Seed |
| Glyphhare | 24 | nature | Glyphhide and rare Galescript Runes |
| Lanternback Elk | 25 | spirit | Lantern Antlers and rare Heartroot Runes |
| Wayglass Watcher | 25 | crystal | Wayglass and rare Bastion Runes |
| Epitaph Sentinel | 25 | shadow | Epitaph Dust and rare Embermark Runes |
| Pale Scriptling | 26 | arcane | Namekeeper Wax and Hollowstar Ore |
| The Archivore | 26 | spirit | Guaranteed Namesong Seal |
| Waystar Grazer | 26 | spirit | Comet Hide and Startrail Stew supply |
| Compass Scarab | 27 | crystal | Compass Shell and rare Waystar Runes |
| Pathless Wisp | 27 | arcane | Moorlight Essence and Waystar Pollen supply |
| Vowsteel Knight | 27 | spirit | Vowsteel Fragments and rare Convergence Runes |
| Splitstar Echo | 28 | shadow | Splitstar Filament and Convergent Glass supply |
| The Manyroad Crown | 28 | arcane | Guaranteed Manyroad Keystone |

`The Glasswind Bearing` asks the player to visit the coast, gather four
Sunwake Kelp, defeat three Beacon Wraiths, defeat the Drowned Meridian, and
return its compass. Nia rewards a legendary Sunwake Sabre, three Shoreline
Stews, XP, gold, and the coast courier unlock.

`Where the Tide Breaks` continues from Nia through a causeway visit, gathering,
three monster hunts, and Charged Pearl recovery. Its reward includes the
Windward Mantle and Tidebreak courier unlock. Beaconwright Orrin then offers
`The Storm Remembers`, sending the party through the dungeon, its Custodians,
the Tempest Remnant, and the guaranteed Tempest Heart before rewarding the
Remnant Lens, Tempest Cordial, and Stormglass wayline.

`Above the Broken Beacon` continues from the Reliquary through Beaconfall's
three hunts and two gathering objectives, rewarding a Sunward Visor, Clarity
Tonics, and the Beaconfall wayline. `The Sunspire Lens` then opens the
observatory, asks the player to dismantle its sentries and choirs, gather
Starfall Dust, defeat the Celestial Orrery, and return its Aurora Lens Core.
Its rewards include the legendary Sunspire Compass and final regional wayline.

After Sunspire, Keeper Aurell offers `The Gentle Height` and Warden Maelis
offers `The Direct Horizon`. Starting either oath permanently closes the
other, with distinct hunts, materials, and equipment rewards. Completing
either one unlocks Archivist Nerys's `A Blank Page at Zenith`, which opens the
archive, culminates in the Keeper of Zenith, and awards the Zenith Diadem,
Choicebound Charm, restoratives, and final wayline.

`The Wood Remembers Song` begins after Zenith and asks the party to learn the
canopy through three hunts plus Echo Moss and Resonant Bark gathering. It
rewards a Resonance Bracer, Clearvoice Tisanes, and the Choirwood wayline.
`Concordance Beneath the Crown` then opens the Sanctum, culminates in the
Crownroot Hierophant, and returns the guaranteed Concordance Seed. Completion
awards Crownroot Vestments, a Concordance Band, the Crownroot wayline, and one
new level-24 technique for every advanced path. Each path then chooses three
equipped skills from four available options.

`Marks That May Be Moved` begins after Crownroot and clears Runeveil's three
monster families while gathering Runebloom and Wayglass. It rewards a
Veilguard Mantle, Heartroot Rune, broth, and the Runeveil wayline while
introducing reusable one-rune-per-item-slot binding. `Every Name Leaves the
Vault` then opens Namesong, culminates in the Archivore, and returns the
guaranteed Namesong Seal. Its rewards include the Hollowstar Circlet, Seer
Rune, Scriptwater Draughts, and Namesong wayline.

`Where Every Road Still Shines` continues into Waystar Moor with three hunts
and two gathering objectives, rewarding a Vowglass Aegis, expedition food,
and the Waystar wayline. Pathweaver Ione then offers `A Calling of Your Own`,
which climbs Convergence Spire, breaks its Vowsteel and Splitstar guardians,
and culminates in the Manyroad Crown. Returning its guaranteed keystone opens
two level-28 callings for each advanced job, each with permanent bonuses and
one exclusive technique; the first answer is free and retraining costs 500g.

Thirty-nine monsters across the extended region now carry forty-two authored abilities.
Cooldowns and wind-ups produce persistent single-target tether rings or broad
area warnings that can be escaped before resolution. Drenched slows movement
and attack cadence; Stormclear Draught provides the regional cure. Sunblind
reduces outgoing damage and critical chance, while Clarity Tonic removes it.
Fractured subtracts from party defense against both normal and telegraphed
attacks; Mending Salve removes it. Muted prevents active skill casting without
stopping ordinary attacks; Clearvoice Tisane removes it. Severed temporarily
suppresses non-health rune bonuses; Anchorcord Tea restores them.

## Expansion Hooks

- Continue beyond Convergence Spire after level 28 with another reciprocal route.
- Expand authored monster abilities with new warning shapes and counters.
- Reuse oath outcomes, Crownroot skill choices, rune loadouts, callings, and the full regional material set in later consequences.
- Keep each new map reciprocal, charted, gather-aware, and covered by the
  campaign/resource verification and a focused simulation smoke test.
