import type { MapDefinition } from '../types/world.js';
import { loadJsonAsset } from './jsonAssets.js';

const MAPS_URL = './maps.json';
const MONSTERS_URL = './catalog/monsters.json';

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

  const monsters = await loadJsonAsset<MonsterCatalogEntry[]>(MONSTERS_URL);
  cachedMonsters = new Map(monsters.map((monster) => [monster.id, monster]));
  return cachedMonsters;
}

export async function loadWorldMaps(): Promise<MapDefinition[]> {
  if (cachedMaps) {
    return cachedMaps;
  }

  const maps = await loadJsonAsset<MapDefinition[]>(MAPS_URL);
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
  'hearthvale_town_ro',
  'cloverfield_plains_ro',
  'old_crystal_mine_ro_b1',
] as const;

export type StarterLoopMapId = (typeof STARTER_LOOP_MAP_IDS)[number];

export function isStarterLoopMap(mapId: string): mapId is StarterLoopMapId {
  return (STARTER_LOOP_MAP_IDS as readonly string[]).includes(mapId);
}
