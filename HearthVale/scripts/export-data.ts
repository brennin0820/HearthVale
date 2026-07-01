import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildAssetManifest } from '../src/data/assets/manifest.js';
import { ANIMATIONS } from '../src/data/assets/animations.js';
import { AUDIO_MANIFEST } from '../src/data/audio/manifest.js';
import {
  DROP_TABLES,
  ITEMS,
  JOB_CLASSES,
  MONSTERS,
  NPCS,
  QUESTS,
  SKILLS,
} from '../src/data/catalog/index.js';
import { BIOMES } from '../src/data/world/biomes.js';
import { MAP_ART_BY_ID } from '../src/data/world/mapArt.js';
import {
  MAPS,
  MAP_ALIASES,
  REGIONS,
  resolveMapId,
} from '../src/data/world/index.js';
import type { MapDefinition } from '../src/data/world/types.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, '..', 'data');

const pretty = (value: unknown) => `${JSON.stringify(value, null, 2)}\n`;

async function writeJson(relativePath: string, value: unknown): Promise<string> {
  const fullPath = path.join(dataDir, relativePath);
  await mkdir(path.dirname(fullPath), { recursive: true });
  await writeFile(fullPath, pretty(value));
  return fullPath;
}

function buildCollisionGrid(map: MapDefinition): boolean[][] {
  const rows: boolean[][] = [];
  for (let y = 0; y < map.gridSize.height; y += 1) {
    const row: boolean[] = [];
    for (let x = 0; x < map.gridSize.width; x += 1) {
      row.push(true);
    }
    rows.push(row);
  }
  return rows;
}

function buildPropLayer(mapId: string): { mapId: string; props: unknown[] } {
  return {
    mapId,
    props: [],
  };
}

await mkdir(dataDir, { recursive: true });

for (const { alias } of MAP_ALIASES) {
  resolveMapId(alias);
}

const mapsPath = await writeJson('maps.json', MAPS);
const regionsPath = await writeJson('regions.json', REGIONS);

await writeJson('catalog/monsters.json', MONSTERS);
await writeJson('catalog/npcs.json', NPCS);
await writeJson('catalog/items.json', ITEMS);
await writeJson('catalog/quests.json', QUESTS);
await writeJson('catalog/drops.json', DROP_TABLES);
await writeJson('catalog/jobs.json', JOB_CLASSES);
await writeJson('catalog/skills.json', SKILLS);
await writeJson('biomes.json', BIOMES);
await writeJson('animations.json', ANIMATIONS);
await writeJson('audio/manifest.json', AUDIO_MANIFEST);

const assetKeys = [...new Set(MAPS.map((m) => m.assetKey))];
await writeJson('assets/manifest.json', buildAssetManifest(assetKeys));

for (const map of MAPS) {
  const art = MAP_ART_BY_ID[map.id];
  await writeJson(
    `collision/${map.id}.json`,
    art?.collision ?? {
      mapId: map.id,
      tileSize: 32,
      walkable: buildCollisionGrid(map),
    },
  );
  await writeJson(`props/${map.id}.json`, art?.props ?? buildPropLayer(map.id));
}

console.log(`Wrote ${mapsPath} (${MAPS.length} maps)`);
console.log(`Wrote ${regionsPath} (${REGIONS.length} regions)`);
console.log(`Validated ${MAP_ALIASES.length} map aliases`);
console.log(`Exported catalog (incl. jobs, skills), biomes, animations, audio, assets, collision, props`);
