import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const [dungeonId, floor = '2'] = process.argv.slice(2);

if (!dungeonId) {
  console.error('Usage: scaffold-dungeon <base_dungeon_id> [floor_number]');
  process.exit(1);
}

const floorId = `${dungeonId}_floor_${floor}`;
const stub = `  {
    id: '${floorId}',
    displayName: '${dungeonId.replace(/_/g, ' ')} Floor ${floor}',
    kind: 'dungeon',
    regionId: 'hearthlight_vale',
    levelRange: { min: 10, max: 15 },
    showOnWorldMap: false,
    worldMapPosition: { x: 240, y: 40 },
    biome: 'crystal_cavern',
    musicKey: 'music_crystal_mine',
    gridSize: { width: 48, height: 48 },
    spawnTables: [],
    npcs: [],
    portals: [
      {
        id: 'floor_ascent',
        label: 'Upper Floor',
        position: { x: 0, y: 200 },
        targetMapId: '${dungeonId}',
        targetSpawn: { x: 0, y: 200 },
      },
    ],
    playerSpawn: { x: -400, y: 0 },
    safeZone: null,
    assetKey: 'map_${floorId}',
  },`;

const outPath = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  'generated',
  `${floorId}.snippet.ts`,
);

await writeFile(outPath, `// Paste into src/data/world/maps.ts MAPS array\n${stub}\n`);
console.log(`Wrote dungeon floor stub: ${outPath}`);
