import type { MapAlias, MapDefinition } from './types.js';
import { HEARTHVALE_TOWN_POINTS, HEARTHVALE_TOWN_SAFE_ZONE } from './mapArt.js';

const REGION = 'hearthlight_vale';

export const MAPS: MapDefinition[] = [
  {
    id: 'hearthvale_town',
    displayName: 'Hearthvale Town',
    kind: 'town',
    regionId: REGION,
    levelRange: { min: 1, max: 99 },
    showOnWorldMap: true,
    worldMapPosition: { x: 120, y: 180 },
    biome: 'temperate_town',
    musicKey: 'music_hearthvale_town',
    gridSize: { width: 48, height: 36 },
    spawnTables: [],
    npcs: [
      { npcId: 'elder', position: HEARTHVALE_TOWN_POINTS.elder, facing: 'south' },
      { npcId: 'merchant_silas', position: HEARTHVALE_TOWN_POINTS.merchantSilas, facing: 'west' },
      { npcId: 'hearth_courier', position: HEARTHVALE_TOWN_POINTS.hearthCourier, facing: 'west' },
      { npcId: 'innkeeper_mara', position: HEARTHVALE_TOWN_POINTS.innkeeperMara, facing: 'south' },
      { npcId: 'trainer_bram', position: HEARTHVALE_TOWN_POINTS.trainerBram, facing: 'east' },
      { npcId: 'guard_captain_dell', position: HEARTHVALE_TOWN_POINTS.guardCaptainDell, facing: 'west' },
      { npcId: 'baker_odella', position: HEARTHVALE_TOWN_POINTS.bakerOdella, facing: 'south' },
      { npcId: 'bard_finn', position: HEARTHVALE_TOWN_POINTS.bardFinn, facing: 'east' },
      { npcId: 'child_nettle', position: HEARTHVALE_TOWN_POINTS.childNettle, facing: 'north' },
      { npcId: 'priestess_wren', position: HEARTHVALE_TOWN_POINTS.priestessWren, facing: 'south' },
    ],
    portals: [
      {
        id: 'east_gate',
        label: 'Cloverfield Plains',
        position: HEARTHVALE_TOWN_POINTS.eastGate,
        targetMapId: 'cloverfield_plains',
        targetSpawn: { x: -610, y: 170 },
      },
    ],
    playerSpawn: HEARTHVALE_TOWN_POINTS.playerSpawn,
    safeZone: HEARTHVALE_TOWN_SAFE_ZONE,
    assetKey: 'map_hearthvale_town',
  },

  {
    id: 'cloverfield_plains',
    displayName: 'Cloverfield Plains',
    kind: 'field',
    regionId: REGION,
    levelRange: { min: 1, max: 4 },
    showOnWorldMap: true,
    worldMapPosition: { x: 280, y: 180 },
    biome: 'clover_grassland',
    musicKey: 'music_cloverfield',
    gridSize: { width: 64, height: 40 },
    spawnTables: [
      {
        id: 'cloverfield_main',
        bounds: { x: -400, y: 80, width: 800, height: 360 },
        maxConcurrent: 12,
        respawnSeconds: 8,
        entries: [
          { monsterId: 'jellybud', weight: 60, minLevel: 1, maxLevel: 3 },
          { monsterId: 'spriggle', weight: 40, minLevel: 2, maxLevel: 4 },
        ],
      },
    ],
    npcs: [
      { npcId: 'herbalist_lyra', position: { x: -120, y: 200 }, facing: 'south' },
      { npcId: 'scout_pip', position: { x: 200, y: 140 }, facing: 'west' },
    ],
    portals: [
      {
        id: 'west_gate',
        label: 'Hearthvale Town',
        position: { x: -680, y: 150 },
        targetMapId: 'hearthvale_town',
        targetSpawn: HEARTHVALE_TOWN_POINTS.eastGateArrival,
      },
      {
        id: 'hollow_trail',
        label: 'Mushroom Hollow',
        position: { x: 420, y: 280 },
        targetMapId: 'mushroom_hollow',
        targetSpawn: { x: -500, y: 180 },
      },
      {
        id: 'mine_mouth',
        label: 'Old Crystal Mine',
        position: { x: 180, y: 60 },
        targetMapId: 'old_crystal_mine',
        targetSpawn: { x: -540, y: 155 },
      },
      {
        id: 'northern_trail',
        label: 'Crystal Mine Approach',
        position: { x: -40, y: -20 },
        targetMapId: 'crystal_mine_approach',
        targetSpawn: { x: 520, y: 280 },
      },
      {
        id: 'whisperwood_trail',
        label: 'Whisperwood Meadows',
        position: { x: 580, y: 120 },
        targetMapId: 'whisperwood_meadows',
        targetSpawn: { x: -480, y: 160 },
      },
    ],
    playerSpawn: { x: -610, y: 170 },
    safeZone: null,
    assetKey: 'map_cloverfield_plains',
  },

  {
    id: 'mushroom_hollow',
    displayName: 'Mushroom Hollow',
    kind: 'field',
    regionId: REGION,
    levelRange: { min: 3, max: 6 },
    showOnWorldMap: true,
    worldMapPosition: { x: 420, y: 220 },
    biome: 'fungal_grove',
    musicKey: 'music_mushroom_hollow',
    gridSize: { width: 56, height: 44 },
    spawnTables: [
      {
        id: 'hollow_spore_beds',
        bounds: { x: -320, y: 60, width: 640, height: 380 },
        maxConcurrent: 10,
        respawnSeconds: 10,
        entries: [
          { monsterId: 'puffshroom', weight: 55, minLevel: 3, maxLevel: 5 },
          { monsterId: 'sporeling', weight: 45, minLevel: 4, maxLevel: 6 },
        ],
      },
    ],
    npcs: [
      { npcId: 'mycologist_fern', position: { x: -80, y: 220 }, facing: 'east' },
    ],
    portals: [
      {
        id: 'west_trail',
        label: 'Cloverfield Plains',
        position: { x: -560, y: 200 },
        targetMapId: 'cloverfield_plains',
        targetSpawn: { x: 400, y: 200 },
      },
      {
        id: 'southeast_trail',
        label: 'Whisperwood Meadows',
        position: { x: 480, y: 340 },
        targetMapId: 'whisperwood_meadows',
        targetSpawn: { x: -420, y: 280 },
        requiredLevel: 5,
      },
    ],
    playerSpawn: { x: -500, y: 180 },
    safeZone: null,
    assetKey: 'map_mushroom_hollow',
  },

  {
    id: 'whisperwood_meadows',
    displayName: 'Whisperwood Meadows',
    kind: 'field',
    regionId: REGION,
    levelRange: { min: 5, max: 7 },
    showOnWorldMap: true,
    worldMapPosition: { x: 540, y: 160 },
    biome: 'whisperwood',
    musicKey: 'music_whisperwood',
    gridSize: { width: 60, height: 42 },
    spawnTables: [
      {
        id: 'whisperwood_glades',
        bounds: { x: -360, y: 40, width: 720, height: 400 },
        maxConcurrent: 10,
        respawnSeconds: 12,
        entries: [
          { monsterId: 'leafsprite', weight: 50, minLevel: 5, maxLevel: 6 },
          { monsterId: 'barkling', weight: 35, minLevel: 5, maxLevel: 7 },
          { monsterId: 'spriggle', weight: 15, minLevel: 5, maxLevel: 6 },
        ],
      },
    ],
    npcs: [
      { npcId: 'ranger_elowen', position: { x: 60, y: 180 }, facing: 'south' },
    ],
    portals: [
      {
        id: 'west_trail',
        label: 'Cloverfield Plains',
        position: { x: -520, y: 160 },
        targetMapId: 'cloverfield_plains',
        targetSpawn: { x: 580, y: 120 },
      },
      {
        id: 'northwest_trail',
        label: 'Mushroom Hollow',
        position: { x: -440, y: 280 },
        targetMapId: 'mushroom_hollow',
        targetSpawn: { x: 480, y: 340 },
      },
      {
        id: 'east_road',
        label: 'Old Mill Road',
        position: { x: 520, y: 200 },
        targetMapId: 'old_mill_road',
        targetSpawn: { x: -500, y: 180 },
      },
    ],
    playerSpawn: { x: -480, y: 160 },
    safeZone: null,
    assetKey: 'map_whisperwood_meadows',
  },

  {
    id: 'old_mill_road',
    displayName: 'Old Mill Road',
    kind: 'field',
    regionId: REGION,
    levelRange: { min: 8, max: 10 },
    showOnWorldMap: true,
    worldMapPosition: { x: 680, y: 140 },
    biome: 'mill_countryside',
    musicKey: 'music_old_mill_road',
    gridSize: { width: 72, height: 36 },
    spawnTables: [
      {
        id: 'millroad_verge',
        bounds: { x: -480, y: 60, width: 960, height: 280 },
        maxConcurrent: 12,
        respawnSeconds: 14,
        entries: [
          { monsterId: 'roadjack', weight: 45, minLevel: 8, maxLevel: 9 },
          { monsterId: 'windmite', weight: 35, minLevel: 8, maxLevel: 10 },
          { monsterId: 'barkling', weight: 20, minLevel: 8, maxLevel: 9 },
        ],
      },
    ],
    npcs: [
      { npcId: 'miller_tobin', position: { x: -200, y: 160 }, facing: 'east' },
      { npcId: 'caravan_guard', position: { x: 320, y: 140 }, facing: 'west' },
    ],
    portals: [
      {
        id: 'west_road',
        label: 'Whisperwood Meadows',
        position: { x: -540, y: 180 },
        targetMapId: 'whisperwood_meadows',
        targetSpawn: { x: 520, y: 200 },
      },
      {
        id: 'millwick_gate',
        label: 'Millwick Crossing',
        position: { x: -80, y: 120 },
        targetMapId: 'millwick_crossing',
        targetSpawn: { x: 640, y: 200 },
      },
      {
        id: 'south_trail',
        label: 'Moonwell Entrance',
        position: { x: 600, y: 260 },
        targetMapId: 'moonwell_entrance',
        targetSpawn: { x: -460, y: 140 },
      },
    ],
    playerSpawn: { x: -500, y: 180 },
    safeZone: null,
    assetKey: 'map_old_mill_road',
  },

  {
    id: 'millwick_crossing',
    displayName: 'Millwick Crossing',
    kind: 'town',
    regionId: REGION,
    levelRange: { min: 1, max: 99 },
    showOnWorldMap: true,
    worldMapPosition: { x: 620, y: 100 },
    biome: 'riverside_town',
    musicKey: 'music_millwick_crossing',
    gridSize: { width: 40, height: 32 },
    spawnTables: [],
    npcs: [
      { npcId: 'mayor_holt', position: { x: 300, y: 200 }, facing: 'south' },
      { npcId: 'merchant_elsie', position: { x: 260, y: 240 }, facing: 'east' },
      { npcId: 'hearth_courier', position: { x: 380, y: 180 }, facing: 'west' },
    ],
    portals: [
      {
        id: 'west_gate',
        label: 'Old Mill Road',
        position: { x: 40, y: 200 },
        targetMapId: 'old_mill_road',
        targetSpawn: { x: -80, y: 120 },
      },
    ],
    playerSpawn: { x: 640, y: 200 },
    safeZone: { x: 60, y: 80, width: 680, height: 400 },
    assetKey: 'map_millwick_crossing',
  },

  {
    id: 'crystal_mine_approach',
    displayName: 'Crystal Mine Approach',
    kind: 'field',
    regionId: REGION,
    levelRange: { min: 6, max: 9 },
    showOnWorldMap: true,
    worldMapPosition: { x: 300, y: 80 },
    biome: 'crystal_foothills',
    musicKey: 'music_crystal_approach',
    gridSize: { width: 52, height: 38 },
    spawnTables: [
      {
        id: 'foothill_crystal_vein',
        bounds: { x: -280, y: 40, width: 560, height: 320 },
        maxConcurrent: 8,
        respawnSeconds: 12,
        entries: [
          { monsterId: 'shardling', weight: 50, minLevel: 6, maxLevel: 8 },
          { monsterId: 'cavebat', weight: 30, minLevel: 6, maxLevel: 9 },
          { monsterId: 'puffshroom', weight: 20, minLevel: 6, maxLevel: 7 },
        ],
      },
    ],
    npcs: [
      { npcId: 'prospector_garrick', position: { x: 120, y: 200 }, facing: 'north' },
    ],
    portals: [
      {
        id: 'south_trail',
        label: 'Cloverfield Plains',
        position: { x: 540, y: 280 },
        targetMapId: 'cloverfield_plains',
        targetSpawn: { x: -40, y: -20 },
      },
      {
        id: 'mine_shaft',
        label: 'Old Crystal Mine',
        position: { x: -200, y: 80 },
        targetMapId: 'old_crystal_mine',
        targetSpawn: { x: 420, y: 120 },
        requiredLevel: 8,
      },
    ],
    playerSpawn: { x: 520, y: 280 },
    safeZone: null,
    assetKey: 'map_crystal_mine_approach',
  },

  {
    id: 'old_crystal_mine',
    displayName: 'Old Crystal Mine',
    kind: 'dungeon',
    regionId: REGION,
    levelRange: { min: 8, max: 15 },
    showOnWorldMap: false,
    worldMapPosition: { x: 240, y: 40 },
    biome: 'crystal_cavern',
    musicKey: 'music_crystal_mine',
    gridSize: { width: 48, height: 48 },
    spawnTables: [
      {
        id: 'mine_upper_gallery',
        bounds: { x: -400, y: -200, width: 500, height: 400 },
        maxConcurrent: 8,
        respawnSeconds: 18,
        entries: [
          { monsterId: 'shardling', weight: 40, minLevel: 8, maxLevel: 10 },
          { monsterId: 'cavebat', weight: 35, minLevel: 8, maxLevel: 11 },
          { monsterId: 'crystal_golem', weight: 25, minLevel: 10, maxLevel: 12 },
        ],
      },
      {
        id: 'mine_deep_vein',
        bounds: { x: 80, y: 120, width: 420, height: 360 },
        maxConcurrent: 6,
        respawnSeconds: 22,
        entries: [
          { monsterId: 'crystal_golem', weight: 45, minLevel: 11, maxLevel: 13 },
          { monsterId: 'vein_wraith', weight: 35, minLevel: 12, maxLevel: 14 },
          { monsterId: 'shardling', weight: 20, minLevel: 10, maxLevel: 12 },
        ],
      },
    ],
    npcs: [],
    portals: [
      {
        id: 'mine_exit',
        label: 'Cloverfield Plains',
        position: { x: 740, y: 150 },
        targetMapId: 'cloverfield_plains',
        targetSpawn: { x: 700, y: 150 },
      },
      {
        id: 'upper_shaft',
        label: 'Crystal Mine Approach',
        position: { x: 420, y: 120 },
        targetMapId: 'crystal_mine_approach',
        targetSpawn: { x: -200, y: 80 },
      },
    ],
    playerSpawn: { x: -540, y: 155 },
    safeZone: null,
    assetKey: 'map_old_crystal_mine',
  },

  {
    id: 'moonwell_entrance',
    displayName: 'Moonwell Entrance',
    kind: 'field',
    regionId: REGION,
    levelRange: { min: 10, max: 12 },
    showOnWorldMap: true,
    worldMapPosition: { x: 760, y: 220 },
    biome: 'moonlit_glade',
    musicKey: 'music_moonwell_entrance',
    gridSize: { width: 44, height: 40 },
    spawnTables: [
      {
        id: 'moonwell_shore',
        bounds: { x: -300, y: 60, width: 600, height: 340 },
        maxConcurrent: 10,
        respawnSeconds: 16,
        entries: [
          { monsterId: 'moonmoth', weight: 40, minLevel: 10, maxLevel: 11 },
          { monsterId: 'glade_stalker', weight: 35, minLevel: 10, maxLevel: 12 },
          { monsterId: 'vein_wraith', weight: 25, minLevel: 11, maxLevel: 12 },
        ],
      },
    ],
    npcs: [
      { npcId: 'watcher_seren', position: { x: 40, y: 200 }, facing: 'south' },
    ],
    portals: [
      {
        id: 'north_trail',
        label: 'Old Mill Road',
        position: { x: -500, y: 140 },
        targetMapId: 'old_mill_road',
        targetSpawn: { x: 600, y: 260 },
      },
      {
        id: 'ruins_descent',
        label: 'Moonwell Ruins',
        position: { x: 180, y: 320 },
        targetMapId: 'moonwell_ruins',
        targetSpawn: { x: -320, y: 140 },
        requiredLevel: 11,
      },
    ],
    playerSpawn: { x: -460, y: 140 },
    safeZone: null,
    assetKey: 'map_moonwell_entrance',
  },

  {
    id: 'moonwell_ruins',
    displayName: 'Moonwell Ruins',
    kind: 'dungeon',
    regionId: REGION,
    levelRange: { min: 11, max: 14 },
    showOnWorldMap: true,
    worldMapPosition: { x: 820, y: 260 },
    biome: 'ancient_ruins',
    musicKey: 'music_moonwell_ruins',
    gridSize: { width: 50, height: 46 },
    spawnTables: [
      {
        id: 'ruins_outer_ring',
        bounds: { x: -360, y: 20, width: 480, height: 380 },
        maxConcurrent: 8,
        respawnSeconds: 20,
        entries: [
          { monsterId: 'glade_stalker', weight: 40, minLevel: 11, maxLevel: 12 },
          { monsterId: 'rune_sentinel', weight: 35, minLevel: 12, maxLevel: 13 },
          { monsterId: 'moonmoth', weight: 25, minLevel: 11, maxLevel: 12 },
        ],
      },
      {
        id: 'ruins_inner_sanctum',
        bounds: { x: 120, y: 180, width: 360, height: 300 },
        maxConcurrent: 4,
        respawnSeconds: 30,
        entries: [
          { monsterId: 'rune_sentinel', weight: 50, minLevel: 13, maxLevel: 14 },
          { monsterId: 'vein_wraith', weight: 30, minLevel: 12, maxLevel: 14 },
          { monsterId: 'moonwell_guardian', weight: 20, minLevel: 14, maxLevel: 14 },
        ],
      },
    ],
    npcs: [],
    portals: [
      {
        id: 'ruins_ascent',
        label: 'Moonwell Entrance',
        position: { x: -340, y: 140 },
        targetMapId: 'moonwell_entrance',
        targetSpawn: { x: 180, y: 320 },
      },
    ],
    playerSpawn: { x: -320, y: 140 },
    safeZone: null,
    assetKey: 'map_moonwell_ruins',
  },
];

export const MAP_BY_ID: Record<string, MapDefinition> = Object.fromEntries(
  MAPS.map((map) => [map.id, map]),
);

export const MAP_ALIASES: MapAlias[] = [
  { alias: 'village', mapId: 'hearthvale_town' },
  { alias: 'forest', mapId: 'cloverfield_plains' },
  { alias: 'dungeon', mapId: 'old_crystal_mine' },
];

/** Resolve a map id or legacy alias to a canonical map id. */
export function resolveMapId(idOrAlias: string): string | undefined {
  const alias = MAP_ALIASES.find((entry) => entry.alias === idOrAlias);
  if (alias) {
    return alias.mapId;
  }
  return MAP_BY_ID[idOrAlias]?.id;
}
