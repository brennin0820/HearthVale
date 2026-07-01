import type { RegionDefinition } from './types.js';

export const REGIONS: RegionDefinition[] = [
  {
    id: 'hearthlight_vale',
    displayName: 'Hearthlight Vale',
    capitalMapId: 'hearthvale_town',
    levelRange: { min: 1, max: 14 },
    worldMapBounds: {
      x: 40,
      y: 20,
      width: 860,
      height: 300,
    },
    warpTable: [
      {
        id: 'warp_cloverfield',
        label: 'Cloverfield Plains',
        targetMapId: 'cloverfield_plains',
        targetSpawn: { x: -610, y: 170 },
        cost: 0,
      },
      {
        id: 'warp_mushroom_hollow',
        label: 'Mushroom Hollow',
        targetMapId: 'mushroom_hollow',
        targetSpawn: { x: -500, y: 180 },
        cost: 120,
        requiredLevel: 3,
      },
      {
        id: 'warp_whisperwood',
        label: 'Whisperwood Meadows',
        targetMapId: 'whisperwood_meadows',
        targetSpawn: { x: -480, y: 160 },
        cost: 180,
        requiredLevel: 5,
      },
      {
        id: 'warp_millwick',
        label: 'Millwick Crossing',
        targetMapId: 'millwick_crossing',
        targetSpawn: { x: 480, y: 320 },
        cost: 250,
        requiredLevel: 8,
        unlockQuestId: 'quest_millwick_letter',
      },
      {
        id: 'warp_crystal_approach',
        label: 'Crystal Mine Approach',
        targetMapId: 'crystal_mine_approach',
        targetSpawn: { x: 520, y: 280 },
        cost: 200,
        requiredLevel: 6,
      },
      {
        id: 'warp_moonwell',
        label: 'Moonwell Entrance',
        targetMapId: 'moonwell_entrance',
        targetSpawn: { x: -460, y: 140 },
        cost: 320,
        requiredLevel: 10,
        unlockQuestId: 'quest_moonwell_sigil',
      },
    ],
  },
];

export const REGION_BY_ID: Record<string, RegionDefinition> = Object.fromEntries(
  REGIONS.map((region) => [region.id, region]),
);

/** Hearth Courier warp destinations available from the regional capital. */
export const HEARTH_COURIER_WARPS = REGIONS.find(
  (region) => region.id === 'hearthlight_vale',
)!.warpTable;
