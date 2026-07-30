import { BIOMES, BIOME_BY_ID } from '../src/data/world/biomes.js';
import { loadMapsJson } from './lib/load-data.js';

/**
 * Every map's biome must resolve to an authored entry with usable colors.
 *
 * The Phaser client derives its whole terrain palette from `groundColor` and
 * `accentColor` (see client-phaser-next/src/phaser/view/palette.ts). A map
 * pointing at an unknown biome silently falls back to a generic per-kind look,
 * which is how nineteen maps ended up sharing four palettes before this check
 * existed.
 */
const HEX = /^#[0-9a-fA-F]{6}$/;

const maps = await loadMapsJson();
const errors: string[] = [];

for (const biome of BIOMES) {
  if (!HEX.test(biome.groundColor)) errors.push(`[biomes] ${biome.id} groundColor "${biome.groundColor}" is not #rrggbb`);
  if (!HEX.test(biome.accentColor)) errors.push(`[biomes] ${biome.id} accentColor "${biome.accentColor}" is not #rrggbb`);
  if (!biome.displayName) errors.push(`[biomes] ${biome.id} is missing displayName`);
}

const seen = new Set<string>();
for (const biome of BIOMES) {
  if (seen.has(biome.id)) errors.push(`[biomes] duplicate biome id "${biome.id}"`);
  seen.add(biome.id);
}

const used = new Set<string>();
for (const map of maps) {
  used.add(map.biome);
  if (!BIOME_BY_ID.has(map.biome)) {
    errors.push(`[biomes] map ${map.id} uses biome "${map.biome}" which has no entry in src/data/world/biomes.ts`);
  }
}

const unused = BIOMES.filter((biome) => !used.has(biome.id)).map((biome) => biome.id);

if (errors.length > 0) {
  console.error(`Biome verification failed (${errors.length} error(s)):`);
  for (const error of errors) console.error(`  ${error}`);
  process.exit(1);
}

console.log(`Biome verification passed (${BIOMES.length} biomes, ${used.size} used across ${maps.length} maps).`);
if (unused.length > 0) console.log(`  note: ${unused.length} unused biome(s): ${unused.join(', ')}`);
