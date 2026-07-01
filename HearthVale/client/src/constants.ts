import type { NpcRole } from './types/catalog.js';

/** World tile size in pixels — RO-style 32px cells. */
export const TILE_SIZE = 32;

export const PLAYER_SPEED = 180;

export const PORTAL_TRIGGER_RADIUS = 28;

export const BIOME_COLORS: Record<string, number> = {
  temperate_town: 0x4a6741,
  clover_grassland: 0x5a8f4a,
  fungal_grove: 0x6b4f7a,
  crystal_cavern: 0x3d4f6f,
  whisperwood: 0x3d6b4f,
  mill_countryside: 0x7a8f4a,
  riverside_town: 0x4a7a6b,
  crystal_foothills: 0x6b7a5a,
  moonlit_glade: 0x4a5a7a,
  ancient_ruins: 0x5a4a6b,
};

export const KIND_ACCENT: Record<string, number> = {
  town: 0xc9a86c,
  field: 0x8fbc8f,
  dungeon: 0x7a6b8f,
  instance: 0x8f7a6b,
};

export const NPC_ROLE_COLORS: Record<NpcRole, number> = {
  quest: 0xf0c850,
  merchant: 0x6cc98a,
  trainer: 0xd88050,
  warp: 0x8a9cf0,
  flavor: 0xc9a86c,
};

export const DEFAULT_MAP_COLOR = 0x3a3a4a;

export const INITIAL_MAP_ID = 'hearthvale_town';

export const HUD_DEPTH = 1000;

export const WORLD_DEPTH = {
  ground: 0,
  groundDetail: 1,
  safeZone: 2,
  props: 4,
  spawnBounds: 6,
  portal: 10,
  npc: 20,
  monster: 25,
  player: 30,
  labels: 40,
} as const;
