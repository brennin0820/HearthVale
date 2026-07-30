import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import type { MapDefinition, RegionDefinition } from '../src/data/world/types.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataRoot = path.join(__dirname, '..', 'data');
const START_MAP_ID = 'hearthvale_town_ro';

const [maps, regions] = await Promise.all([
  readFile(path.join(dataRoot, 'maps.json'), 'utf8').then((raw) => JSON.parse(raw) as MapDefinition[]),
  readFile(path.join(dataRoot, 'regions.json'), 'utf8').then((raw) => JSON.parse(raw) as RegionDefinition[]),
]);

const mapsById = new Map(maps.map((map) => [map.id, map]));
const errors: string[] = [];

function reachableFrom(startMapId: string): Set<string> {
  const visited = new Set<string>();
  const pending = [startMapId];
  while (pending.length > 0) {
    const mapId = pending.shift()!;
    if (visited.has(mapId)) continue;
    visited.add(mapId);
    for (const portal of mapsById.get(mapId)?.portals ?? []) {
      if (!visited.has(portal.targetMapId)) pending.push(portal.targetMapId);
    }
  }
  return visited;
}

if (!mapsById.has(START_MAP_ID)) errors.push(`Missing active start map ${START_MAP_ID}`);
const region = regions.find((candidate) => candidate.id === 'hearthlight_vale');
if (!region) errors.push('Missing hearthlight_vale region');
else if (region.capitalMapId !== START_MAP_ID) errors.push(`Region capital must be ${START_MAP_ID}, found ${region.capitalMapId}`);

const reachable = reachableFrom(START_MAP_ID);
for (const map of maps) {
  if (!reachable.has(map.id)) errors.push(`${map.id} is unreachable from a new journey`);
  if (!reachableFrom(map.id).has(START_MAP_ID)) errors.push(`${map.id} cannot return to the regional capital`);
}

const visibleNames = new Map<string, string>();
for (const map of maps.filter((candidate) => candidate.showOnWorldMap)) {
  const previous = visibleNames.get(map.displayName);
  if (previous) errors.push(`World map duplicates ${map.displayName}: ${previous} and ${map.id}`);
  visibleNames.set(map.displayName, map.id);
}

if (errors.length > 0) {
  console.error(`Campaign verification failed (${errors.length} error(s)):`);
  for (const error of errors) console.error(`  ${error}`);
  process.exit(1);
}

console.log(`Campaign verification passed (${maps.length} maps reachable from ${START_MAP_ID}, ${visibleNames.size} region pins).`);
