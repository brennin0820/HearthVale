import type { MapDefinition } from '../types/world.js';

const MAPS_URL = '/maps.json';
const MONSTERS_URL = '/catalog/monsters.json';

let cachedMaps: MapDefinition[] | null = null;
let mapById: Record<string, MapDefinition> = {};

/** Subset of the exported monster catalog the client needs for combat and the HUD target frame. */
export interface MonsterCatalogEntry {
  id: string;
  displayName: string;
  baseLevel: number;
  hp: number;
  atk: number;
  def: number;
  size: 'small' | 'medium' | 'large';
  element: string;
}

let cachedMonsters: Map<string, MonsterCatalogEntry> | null = null;

export async function loadMonsterCatalog(): Promise<Map<string, MonsterCatalogEntry>> {
  if (cachedMonsters) {
    return cachedMonsters;
  }

  const response = await fetch(MONSTERS_URL);
  if (!response.ok) {
    throw new Error(`Failed to load monsters.json (${response.status})`);
  }

  const monsters = (await response.json()) as MonsterCatalogEntry[];
  cachedMonsters = new Map(monsters.map((monster) => [monster.id, monster]));
  return cachedMonsters;
}

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
