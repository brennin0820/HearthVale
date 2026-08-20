export interface AssetManifestEntry {
  key: string;
  type: 'map' | 'sprite' | 'icon' | 'atlas' | 'tile' | 'portrait';
  placeholder: boolean;
  path?: string;
  frameWidth?: number;
  frameHeight?: number;
  frames?: Record<string, number>;
  license?: 'HearthVale-original';
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

  entries.push(
    {
      key: 'atlas_hearthvale_characters',
      type: 'atlas',
      placeholder: false,
      path: '/assets/hearthvale-characters.svg',
      frameWidth: 48,
      frameHeight: 48,
      frames: {
        player_down_0: 0, player_down_1: 1, player_up_0: 2, player_up_1: 3,
        player_left_0: 4, player_left_1: 5, player_right_0: 6, player_right_1: 7,
        npc_quest: 8, npc_merchant: 9, npc_trainer: 10, npc_warp: 11, npc_flavor: 12,
      },
      license: 'HearthVale-original',
    },
    {
      key: 'atlas_hearthvale_world',
      type: 'atlas',
      placeholder: false,
      path: '/assets/hearthvale-world.svg',
      frameWidth: 48,
      frameHeight: 48,
      frames: {
        prop_tree: 0, prop_cottage: 1, prop_crystal: 2, prop_fence: 3,
        prop_crate: 4, prop_lantern: 5, prop_moonwell: 6, portal_0: 7,
      },
      license: 'HearthVale-original',
    },
  );

  return entries;
}
