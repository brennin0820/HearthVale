import type { NpcCatalogEntry } from '../types/npc.js';
import { loadJsonAsset } from './jsonAssets.js';

const NPCS_URL = './catalog/npcs.json';

let pending: Promise<Map<string, NpcCatalogEntry>> | null = null;

/** Loads the NPC catalog once and returns an id -> entry lookup (cached). */
export function loadNpcCatalog(): Promise<Map<string, NpcCatalogEntry>> {
  if (!pending) {
    pending = loadJsonAsset<NpcCatalogEntry[]>(NPCS_URL)
      .then((entries) => new Map(entries.map((entry) => [entry.id, entry])))
      .catch((error) => {
        // Reset so a later load can retry instead of caching the failure.
        pending = null;
        throw error;
      });
  }
  return pending;
}
