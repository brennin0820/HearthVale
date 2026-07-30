import type { MapDefinition, Vec2 } from '../src/data/world/types.js';
import { loadMapsJson } from './lib/load-data.js';

const TILE_SIZE = 32;

function inGrid(map: MapDefinition, pos: Vec2): boolean {
  const halfW = (map.gridSize.width * TILE_SIZE) / 2;
  const halfH = (map.gridSize.height * TILE_SIZE) / 2;
  return pos.x >= -halfW && pos.x <= halfW && pos.y >= -halfH && pos.y <= halfH;
}

const maps = await loadMapsJson();
const mapsById = new Map(maps.map((map) => [map.id, map]));
const errors: string[] = [];
const warnings: string[] = [];

for (const map of maps) {
  if (!inGrid(map, map.playerSpawn)) {
    errors.push(`[bounds] ${map.id}: playerSpawn outside grid`);
  }

  for (const portal of map.portals) {
    if (!inGrid(map, portal.position)) {
      warnings.push(`[bounds] ${map.id} portal "${portal.id}" position outside grid (may be intentional)`);
    }
    const targetMap = mapsById.get(portal.targetMapId);
    if (targetMap && !inGrid(targetMap, portal.targetSpawn)) {
      errors.push(`[bounds] ${map.id} portal "${portal.id}" targetSpawn outside ${targetMap.id}`);
    }
  }

  for (const npc of map.npcs) {
    if (!inGrid(map, npc.position)) {
      errors.push(`[bounds] ${map.id} npc "${npc.npcId}" outside grid`);
    }
  }

  for (const node of map.resourceNodes ?? []) {
    if (!inGrid(map, node.position)) {
      errors.push(`[bounds] ${map.id} resource "${node.id}" outside grid`);
    }
  }

  for (const table of map.spawnTables) {
    const b = table.bounds;
    if (b.width <= 0 || b.height <= 0) {
      errors.push(`[bounds] ${map.id}/${table.id}: invalid spawn bounds`);
    }
  }
}

for (const w of warnings) console.log(w);

if (errors.length > 0) {
  console.error(`Bounds verification failed (${errors.length} error(s)):`);
  for (const e of errors) console.error(`  ${e}`);
  process.exit(1);
}

console.log(`Bounds verification passed (${maps.length} maps).`);
