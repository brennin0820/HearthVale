import { MAP_ART_BY_ID } from '../src/data/world/mapArt.js';
import type { CollisionMaskDefinition } from '../src/data/world/mapArt.js';
import type { MapDefinition, Vec2 } from '../src/data/world/types.js';
import { loadMapsJson } from './lib/load-data.js';

const TILE_SIZE = 32;
const maps = await loadMapsJson();
const mapsById = new Map(maps.map((map) => [map.id, map]));
const errors: string[] = [];

function tileAt(map: MapDefinition, point: Vec2): { col: number; row: number } {
  return {
    col: Math.floor((point.x + (map.gridSize.width * TILE_SIZE) / 2) / TILE_SIZE),
    row: Math.floor((point.y + (map.gridSize.height * TILE_SIZE) / 2) / TILE_SIZE),
  };
}

function assertWalkable(map: MapDefinition, collision: CollisionMaskDefinition, point: Vec2, label: string): void {
  const { col, row } = tileAt(map, point);
  if (!collision.walkable[row]?.[col]) {
    errors.push(`[blocked-anchor] ${map.id} ${label} is blocked at tile ${col},${row}`);
  }
}

for (const map of maps) {
  const art = MAP_ART_BY_ID[map.id];
  if (!art) {
    errors.push(`[missing-art] ${map.id} has no authored collision/props definition`);
    continue;
  }
  const { collision, props } = art;
  if (collision.mapId !== map.id || props.mapId !== map.id) {
    errors.push(`[map-id] ${map.id} collision/props mapId must match the map id`);
  }
  if (collision.walkable.length !== map.gridSize.height || collision.walkable.some((row) => row.length !== map.gridSize.width)) {
    errors.push(`[grid-size] ${map.id} collision grid must be ${map.gridSize.width}x${map.gridSize.height}`);
    continue;
  }
  if (props.props.length === 0) errors.push(`[empty-props] ${map.id} needs authored world props`);
  assertWalkable(map, collision, map.playerSpawn, 'playerSpawn');
  for (const npc of map.npcs) assertWalkable(map, collision, npc.position, `npc "${npc.npcId}"`);
  for (const portal of map.portals) {
    assertWalkable(map, collision, portal.position, `portal "${portal.id}"`);
    const targetMap = mapsById.get(portal.targetMapId);
    const targetArt = targetMap ? MAP_ART_BY_ID[targetMap.id] : undefined;
    if (targetMap && targetArt) assertWalkable(targetMap, targetArt.collision, portal.targetSpawn, `arrival from ${map.id}/${portal.id}`);
  }
}

if (errors.length > 0) {
  console.error(`Map art verification failed (${errors.length} error(s)):`);
  for (const error of errors) console.error(`  ${error}`);
  process.exit(1);
}

console.log(`Map art verification passed (${maps.length} maps have authored props and reachable travel anchors).`);
