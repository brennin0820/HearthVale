import { loadJsonFile, loadMapsJson } from './lib/load-data.js';
import { access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

interface AssetEntry {
  key: string;
  type: string;
  placeholder?: boolean;
  path?: string;
  frameWidth?: number;
  frameHeight?: number;
  frames?: Record<string, number>;
  license?: string;
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
const repoRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

for (const map of maps) {
  if (!keys.has(map.assetKey)) {
    errors.push(`[assets] map ${map.id} assetKey "${map.assetKey}" missing from manifest`);
  }
}

for (const entry of entries) {
  if (!entry.placeholder && !entry.path) {
    errors.push(`[assets] "${entry.key}" needs path or placeholder:true`);
  }
  if (!entry.placeholder && entry.path) {
    if (!entry.path.startsWith('/assets/')) {
      errors.push(`[assets] "${entry.key}" path must be rooted at /assets/`);
    } else {
      try {
        await access(path.join(repoRoot, 'client', 'public', entry.path));
      } catch {
        errors.push(`[assets] "${entry.key}" file is missing: ${entry.path}`);
      }
    }
  }
  if (entry.type === 'atlas') {
    if (!entry.frameWidth || !entry.frameHeight || !entry.frames || Object.keys(entry.frames).length === 0) {
      errors.push(`[assets] atlas "${entry.key}" needs frame dimensions and named frames`);
    }
    if (entry.license !== 'HearthVale-original') {
      errors.push(`[assets] atlas "${entry.key}" must declare license "HearthVale-original"`);
    }
  }
}

for (const entry of entries) {
  if (entry.placeholder || !entry.path) continue;
  try {
    await access(path.join('data', entry.path), constants.R_OK);
  } catch {
    errors.push(`[assets] "${entry.key}" path "${entry.path}" is not readable`);
  }
}

if (errors.length > 0) {
  console.error(`Asset verification failed (${errors.length} error(s)):`);
  for (const e of errors) console.error(`  ${e}`);
  process.exit(1);
}

console.log(`Asset verification passed (${entries.length} manifest entries, ${maps.length} maps).`);
