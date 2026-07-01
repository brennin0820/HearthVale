import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { MONSTER_BY_ID } from '../src/data/catalog/index.js';
import { BIOME_BY_ID } from '../src/data/world/biomes.js';
import { MapsFileSchema } from '../tools/lib/schemas.js';

const mapsRaw = await readFile(
  path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'data', 'maps.json'),
  'utf8',
);
const parsed = MapsFileSchema.safeParse(JSON.parse(mapsRaw));

if (!parsed.success) {
  console.error('Zod schema validation failed for maps.json:');
  for (const issue of parsed.error.issues) {
    console.error(`  ${issue.path.join('.')}: ${issue.message}`);
  }
  process.exit(1);
}

const maps = parsed.data;
const errors: string[] = [];

for (const map of maps) {
  if (map.levelRange.min > map.levelRange.max) {
    errors.push(`[map] ${map.id}: levelRange min > max`);
  }
  if (!BIOME_BY_ID.has(map.biome)) {
    errors.push(`[map] ${map.id}: unknown biome "${map.biome}"`);
  }
  for (const table of map.spawnTables) {
    const t = table as { id?: string; maxConcurrent?: number; entries?: { weight?: number; monsterId?: string }[] };
    if ((t.maxConcurrent ?? 0) < 1) {
      errors.push(`[spawn] ${map.id}/${t.id}: maxConcurrent < 1`);
    }
    for (const entry of t.entries ?? []) {
      if ((entry.weight ?? 0) <= 0) {
        errors.push(`[spawn] ${map.id}/${t.id}: zero weight on ${entry.monsterId}`);
      }
      if (entry.monsterId && !MONSTER_BY_ID.has(entry.monsterId)) {
        errors.push(`[catalog] ${map.id} references unknown monster "${entry.monsterId}"`);
      }
    }
  }
}

if (errors.length > 0) {
  console.error(`Data validation failed (${errors.length} error(s)):`);
  for (const e of errors) console.error(`  ${e}`);
  process.exit(1);
}

console.log(`Data validation passed (${maps.length} maps, Zod + catalog checks).`);
