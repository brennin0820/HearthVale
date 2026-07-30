import type { GameData, MapProp } from '@hearthvale/sim';

import {
  DROP_TABLES,
  ITEMS,
  JOB_CLASSES,
  MONSTERS,
  NPCS,
  QUESTS,
  RECIPES,
  SHOPS,
  SKILLS,
} from '../../../src/data/catalog/index.js';
import { MAPS, REGIONS } from '../../../src/data/world/index.js';
import { BIOMES } from '../../../src/data/world/biomes.js';
import { MAP_ART_BY_ID, type MapPropDefinition } from '../../../src/data/world/mapArt.js';
import type { MapDefinition } from '../../../src/data/world/types.js';

function fallbackCollisionGrid(map: MapDefinition): boolean[][] {
  return Array.from({ length: map.gridSize.height }, () => Array(map.gridSize.width).fill(true));
}

function toSimProp(prop: MapPropDefinition): MapProp {
  return {
    ...prop,
    shape: prop.shape ?? 'rect',
    fillColor: prop.fillColor ?? 0xffffff,
    accentColor: prop.accentColor ?? 0xffffff,
    alpha: prop.alpha ?? 1,
  };
}

let cached: GameData | undefined;

/**
 * Assembles the same catalog/world data `scripts/export-data.ts` writes to
 * `data/*.json`, directly from the `src/data/**` TS source — no JSON round-trip.
 * This keeps the server on the single source of truth the client build also uses.
 *
 * The repo-root `src/data/**` catalog types and `@hearthvale/sim`'s `GameData`
 * contract are independently-declared, structurally-compatible parallel
 * schemas (the sim contract predates and is not literally generated from the
 * root catalog) — this loader is the adapter boundary between them, hence the
 * cast at the end rather than a field-by-field structural match.
 */
export function loadGameData(): GameData {
  if (cached) return cached;

  const collisions: Record<string, unknown> = {};
  const props: Record<string, unknown> = {};

  for (const map of MAPS) {
    const art = MAP_ART_BY_ID[map.id];
    collisions[map.id] = art?.collision ?? {
      mapId: map.id,
      tileSize: 32,
      walkable: fallbackCollisionGrid(map),
    };
    props[map.id] = {
      mapId: map.id,
      props: art?.props.props.map(toSimProp) ?? [],
    };
  }

  const data = {
    maps: MAPS,
    regions: REGIONS,
    biomes: BIOMES,
    npcs: NPCS,
    monsters: MONSTERS,
    items: ITEMS,
    quests: QUESTS,
    drops: DROP_TABLES,
    shops: SHOPS,
    recipes: RECIPES,
    jobs: JOB_CLASSES,
    skills: SKILLS,
    collisions,
    props,
  } as unknown as GameData;

  cached = data;
  return data;
}
