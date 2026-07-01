import { loadJsonFile, loadMapsJson } from './lib/load-data.js';

interface AssetEntry {
  key: string;
  type: string;
  placeholder?: boolean;
  path?: string;
}

interface AssetManifest {
  entries?: AssetEntry[];
}

const maps = await loadMapsJson();
const manifest = await loadJsonFile<AssetEntry[] | AssetManifest>('assets/manifest.json');

const entries: AssetEntry[] = Array.isArray(manifest)
  ? manifest
  : (manifest.entries ?? []);

const keys = new Set(entries.map((e) => e.key));
const errors: string[] = [];

for (const map of maps) {
  if (!keys.has(map.assetKey)) {
    errors.push(`[assets] map ${map.id} assetKey "${map.assetKey}" missing from manifest`);
  }
}

for (const entry of entries) {
  if (!entry.placeholder && !entry.path) {
    errors.push(`[assets] "${entry.key}" needs path or placeholder:true`);
  }
}

if (errors.length > 0) {
  console.error(`Asset verification failed (${errors.length} error(s)):`);
  for (const e of errors) console.error(`  ${e}`);
  process.exit(1);
}

console.log(`Asset verification passed (${entries.length} manifest entries, ${maps.length} maps).`);
