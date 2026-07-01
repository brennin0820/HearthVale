import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Mercury / Pixel lane — slice a horizontal sprite sheet into frame keys.
 * Config JSON: { "prefix": "player_down", "frameWidth": 32, "frameHeight": 32, "count": 4 }
 */
const [configPath] = process.argv.slice(2);

if (!configPath) {
  console.error('Usage: slice-spritesheet <config.json>');
  process.exit(1);
}

interface SliceConfig {
  prefix: string;
  frameWidth: number;
  frameHeight: number;
  count: number;
}

const config = JSON.parse(await readFile(configPath, 'utf8')) as SliceConfig;
const frames = Array.from({ length: config.count }, (_, i) => `${config.prefix}_${i}`);

const manifest = {
  animations: [
    {
      key: `${config.prefix}_anim`,
      frames,
      frameRate: 6,
      repeat: -1,
    },
  ],
  sprites: frames.map((key) => ({ key, placeholder: true, width: config.frameWidth, height: config.frameHeight })),
};

const outPath = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  '..',
  'data',
  'sprites',
  `${config.prefix}.manifest.json`,
);

await writeFile(outPath, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Wrote sprite manifest: ${outPath}`);
