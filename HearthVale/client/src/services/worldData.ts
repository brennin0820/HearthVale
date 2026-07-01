import type { MapDefinition } from '../types/world.js';

const MAPS_URL = '/maps.json';

let cachedMaps: MapDefinition[] | null = null;
let mapById: Record<string, MapDefinition> = {};

export async function loadWorldMaps(): Promise<MapDefinition[]> {
  if (cachedMaps) {
    return cachedMaps;
  }

  const response = await fetch(MAPS_URL);
  if (!response.ok) {
    throw new Error(`Failed to load maps.json (${response.status})`);
  }

  const maps = (await response.json()) as MapDefinition[];
  cachedMaps = maps;
  mapById = Object.fromEntries(maps.map((map) => [map.id, map]));
  return maps;
}

export function getMapById(mapId: string): MapDefinition | undefined {
  return mapById[mapId];
}

export function getAllMaps(): MapDefinition[] {
  return cachedMaps ?? [];
}

/** Phase B starter loop — used for HUD hints. */
export const STARTER_LOOP_MAP_IDS = [
  'hearthvale_town',
  'cloverfield_plains',
  'mushroom_hollow',
  'old_crystal_mine',
] as const;

export type StarterLoopMapId = (typeof STARTER_LOOP_MAP_IDS)[number];

export function isStarterLoopMap(mapId: string): mapId is StarterLoopMapId {
  return (STARTER_LOOP_MAP_IDS as readonly string[]).includes(mapId);
}
