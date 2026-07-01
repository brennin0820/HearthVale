import { readFile } from 'node:fs/promises';

import type { MapDefinition, RegionDefinition } from '../../src/data/world/types.js';
import { dataPath } from './paths.js';

export async function loadMapsJson(): Promise<MapDefinition[]> {
  const raw = await readFile(dataPath('maps.json'), 'utf8');
  return JSON.parse(raw) as MapDefinition[];
}

export async function loadRegionsJson(): Promise<RegionDefinition[]> {
  const raw = await readFile(dataPath('regions.json'), 'utf8');
  return JSON.parse(raw) as RegionDefinition[];
}

export async function loadJsonFile<T>(relativePath: string): Promise<T> {
  const raw = await readFile(dataPath(relativePath), 'utf8');
  return JSON.parse(raw) as T;
}
