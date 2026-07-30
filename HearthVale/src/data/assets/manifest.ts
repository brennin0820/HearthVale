export interface AssetManifestEntry {
  key: string;
  type: 'map' | 'sprite' | 'icon' | 'atlas' | 'tile' | 'portrait';
  placeholder: boolean;
  path?: string;
}

const ITEM_ICON_KEYS = ['clover_herb', 'spore_cap', 'crystal_shard', 'gale_feather', 'moon_flake'];
const MONSTER_SPRITE_KEYS = ['jellybud', 'spriggle', 'puffshroom'];
const TERRAIN_TILE_KEYS = ['grass_base', 'grass_clover', 'grass_flower', 'dirt_path'];
const NPC_PORTRAIT_KEYS = ['elder', 'merchant_silas'];

/** Keys align with MapDefinition.assetKey and animation frame ids. */
export function buildAssetManifest(mapAssetKeys: string[]): AssetManifestEntry[] {
  const entries: AssetManifestEntry[] = mapAssetKeys.map((key) => ({
    key,
    type: 'map' as const,
    placeholder: true,
  }));

  for (const frame of ['player_down_0', 'player_down_1', 'portal_0', 'portal_1']) {
    entries.push({
      key: frame,
      type: 'sprite',
      placeholder: false,
      path: `assets/sprites/${frame}.png`,
    });
  }

  for (const key of ITEM_ICON_KEYS) {
    entries.push({
      key,
      type: 'icon',
      placeholder: false,
      path: `assets/sprites/items/${key}.png`,
    });
  }

  for (const key of MONSTER_SPRITE_KEYS) {
    entries.push({
      key,
      type: 'sprite',
      placeholder: false,
      path: `assets/sprites/monsters/${key}.png`,
    });
  }

  for (const key of TERRAIN_TILE_KEYS) {
    entries.push({
      key,
      type: 'tile',
      placeholder: false,
      path: `assets/sprites/tiles/${key}.png`,
    });
  }

  for (const key of NPC_PORTRAIT_KEYS) {
    entries.push({
      key,
      type: 'portrait',
      placeholder: false,
      path: `assets/sprites/portraits/${key}.png`,
    });
  }

  return entries;
}
