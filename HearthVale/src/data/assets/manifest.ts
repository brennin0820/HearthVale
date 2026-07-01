export interface AssetManifestEntry {
  key: string;
  type: 'map' | 'sprite' | 'icon' | 'atlas';
  placeholder: boolean;
  path?: string;
}

/** Keys align with MapDefinition.assetKey and animation frame ids. */
export function buildAssetManifest(mapAssetKeys: string[]): AssetManifestEntry[] {
  const entries: AssetManifestEntry[] = mapAssetKeys.map((key) => ({
    key,
    type: 'map' as const,
    placeholder: true,
  }));

  for (const frame of ['player_down_0', 'player_down_1', 'portal_0', 'portal_1']) {
    entries.push({ key: frame, type: 'sprite', placeholder: true });
  }

  return entries;
}
