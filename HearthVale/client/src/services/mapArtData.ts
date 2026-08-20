import type { CollisionMaskDefinition, PropLayerDefinition } from '../types/mapArt.js';
import { loadJsonAsset } from './jsonAssets.js';

const collisionCache = new Map<string, Promise<CollisionMaskDefinition>>();
const propCache = new Map<string, Promise<PropLayerDefinition>>();

async function loadJson<T>(path: string): Promise<T> {
  return loadJsonAsset<T>(path);
}

export function loadCollisionMask(mapId: string): Promise<CollisionMaskDefinition> {
  let pending = collisionCache.get(mapId);
  if (!pending) {
    pending = loadJson<CollisionMaskDefinition>(`./collision/${mapId}.json`);
    collisionCache.set(mapId, pending);
  }
  return pending;
}

export function loadPropLayer(mapId: string): Promise<PropLayerDefinition> {
  let pending = propCache.get(mapId);
  if (!pending) {
    pending = loadJson<PropLayerDefinition>(`./props/${mapId}.json`);
    propCache.set(mapId, pending);
  }
  return pending;
}
