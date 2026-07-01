import { loadJsonFile, loadMapsJson } from './lib/load-data.js';

interface AudioManifest {
  music: { key: string; path?: string; stub?: boolean }[];
  sfx: { key: string; path?: string; stub?: boolean }[];
}

const maps = await loadMapsJson();
const manifest = await loadJsonFile<AudioManifest>('audio/manifest.json');
const musicKeys = new Set(manifest.music.map((m) => m.key));
const errors: string[] = [];

for (const map of maps) {
  if (!musicKeys.has(map.musicKey)) {
    errors.push(`[audio] ${map.id}: musicKey "${map.musicKey}" missing from manifest`);
  }
}

for (const track of manifest.music) {
  if (!track.stub && !track.path) {
    errors.push(`[audio] music "${track.key}" needs path or stub:true`);
  }
}

for (const sfx of manifest.sfx) {
  if (!sfx.stub && !sfx.path) {
    errors.push(`[audio] sfx "${sfx.key}" needs path or stub:true`);
  }
}

if (errors.length > 0) {
  console.error(`Audio verification failed (${errors.length} error(s)):`);
  for (const e of errors) console.error(`  ${e}`);
  process.exit(1);
}

console.log(
  `Audio verification passed (${maps.length} maps, ${manifest.music.length} music, ${manifest.sfx.length} sfx).`,
);
