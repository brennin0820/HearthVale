import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const [mapId, displayName = 'New Map'] = process.argv.slice(2);

if (!mapId) {
  console.error('Usage: scaffold-map <map_id> [Display Name]');
  process.exit(1);
}

const stub = `  {
    id: '${mapId}',
    displayName: '${displayName}',
    kind: 'field',
    regionId: 'hearthlight_vale',
    levelRange: { min: 1, max: 5 },
    showOnWorldMap: true,
    worldMapPosition: { x: 400, y: 200 },
    biome: 'clover_grassland',
    musicKey: 'music_${mapId}',
    gridSize: { width: 48, height: 36 },
    spawnTables: [],
    npcs: [],
    portals: [],
    playerSpawn: { x: 0, y: 0 },
    safeZone: null,
    assetKey: 'map_${mapId}',
  },`;

const outPath = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  'tools',
  'generated',
  `${mapId}.snippet.ts`,
);

await writeFile(outPath, `// Paste into src/data/world/maps.ts MAPS array\n${stub}\n`);
console.log(`Wrote map stub snippet: ${outPath}`);
console.log('Add musicKey to src/data/audio/manifest.ts before export.');
