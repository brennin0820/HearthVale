import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Uranus / World — validate and summarize a Tiled JSON export for Phaser.
 * Does not merge into maps.ts automatically; produces a report + object layer extract.
 *
 * Best practices (Phaser + Tiled):
 * - Embed tilesets in map JSON
 * - Use object layers for portals/spawns (not tile iteration)
 * - Match tilewidth/tileheight to HearthVale TILE_SIZE (32)
 */
const [tiledPath] = process.argv.slice(2);

if (!tiledPath) {
  console.error('Usage: tiled-import <path/to/map.json>');
  process.exit(1);
}

interface TiledMap {
  width: number;
  height: number;
  tilewidth: number;
  tileheight: number;
  layers?: { name: string; type: string; objects?: { name?: string; x: number; y: number; type?: string }[] }[];
  tilesets?: { name?: string; source?: string }[];
}

const abs = path.resolve(tiledPath);
const raw = await readFile(abs, 'utf8');
const map = JSON.parse(raw) as TiledMap;

const warnings: string[] = [];
const objects: { layer: string; name: string; x: number; y: number; type: string }[] = [];

if (map.tilewidth !== 32 || map.tileheight !== 32) {
  warnings.push(`Tile size is ${map.tilewidth}x${map.tileheight}; HearthVale uses 32x32`);
}

for (const ts of map.tilesets ?? []) {
  if (ts.source && !ts.name) {
    warnings.push(`Tileset uses external source "${ts.source}" — embed in Tiled before export`);
  }
}

for (const layer of map.layers ?? []) {
  if (layer.type === 'objectgroup' && layer.objects) {
    for (const obj of layer.objects) {
      objects.push({
        layer: layer.name,
        name: obj.name ?? 'unnamed',
        x: Math.round(obj.x),
        y: Math.round(obj.y),
        type: obj.type ?? 'object',
      });
    }
  }
}

const report = {
  source: abs,
  grid: { width: map.width, height: map.height, tileSize: map.tilewidth },
  layerCount: map.layers?.length ?? 0,
  objectCount: objects.length,
  warnings,
  objects,
  phaserLoadHint: {
    preload: [
      "this.load.tilemapTiledJSON('mapKey', 'path/to/map.json')",
      "this.load.image('tilesetKey', 'path/to/tileset.png')",
    ],
    create: [
      "const map = this.make.tilemap({ key: 'mapKey' })",
      "const tileset = map.addTilesetImage('NameInTiled', 'tilesetKey')",
      "map.createLayer('LayerName', tileset)",
    ],
  },
};

const outDir = path.join(path.dirname(fileURLToPath(import.meta.url)), 'generated');
await writeFile(path.join(outDir, `${path.basename(tiledPath, '.json')}.tiled-report.json`), `${JSON.stringify(report, null, 2)}\n`);

console.log(`Tiled report: ${map.width}x${map.height} @ ${map.tilewidth}px, ${objects.length} objects`);
for (const w of warnings) console.log(`  [warn] ${w}`);
console.log(`Wrote tools/generated/${path.basename(tiledPath, '.json')}.tiled-report.json`);
