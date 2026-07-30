import type { PartyRole, Vec2 } from '../../game/data/types.js';

/**
 * The generated 2.5D sheets are 1536×1024: four 384×512 cells per row and
 * two rows. Characters sit on roughly the bottom tenth of each frame, so the
 * renderer anchors the feet—not the transparent frame centre—to simulation
 * coordinates.
 */
export const ACTOR_SPRITE_FRAME = {
  width: 384,
  height: 512,
  scale: 0.18,
  originX: 0.5,
  originY: 0.9,
} as const;

export const ACTOR_SPRITE_ASSETS = {
  lateSengokuFireSwordsman: {
    key: 'actor-late-sengoku-fire-swordsman',
    path: 'assets/sprite-samples/late_sengoku_fire_swordsman_player_sheet.png',
  },
  valeWarden: { key: 'actor-vale-warden', path: 'assets/sprite-samples/vale_warden_2_5d_topdown_sheet.png' },
  gladeRanger: { key: 'actor-glade-ranger', path: 'assets/sprite-samples/glade_ranger_2_5d_topdown_sheet.png' },
  thornChanneler: { key: 'actor-thorn-channeler', path: 'assets/sprite-samples/thorn_channeler_2_5d_topdown_sheet.png' },
  hearthMender: { key: 'actor-hearth-mender', path: 'assets/sprite-samples/hearth_mender_2_5d_topdown_sheet.png' },
  hollowShade: { key: 'actor-hollow-shade', path: 'assets/sprite-samples/hollow_shade_2_5d_topdown_sheet.png' },
} as const;

// Aster is the persistent solo player leader; their user-selected avatar does
// not change when their gameplay job changes.
const PRIMARY_PLAYER_MEMBER_ID = 'warden';

const ROLE_TEXTURE: Record<PartyRole, string> = {
  novice: ACTOR_SPRITE_ASSETS.valeWarden.key,
  melee: ACTOR_SPRITE_ASSETS.valeWarden.key,
  ranged: ACTOR_SPRITE_ASSETS.gladeRanger.key,
  magic: ACTOR_SPRITE_ASSETS.thornChanneler.key,
  support: ACTOR_SPRITE_ASSETS.hearthMender.key,
  artisan: ACTOR_SPRITE_ASSETS.valeWarden.key,
  scout: ACTOR_SPRITE_ASSETS.hollowShade.key,
};

const JOB_TEXTURE: Record<string, string> = {
  warden: ACTOR_SPRITE_ASSETS.valeWarden.key,
  ranger: ACTOR_SPRITE_ASSETS.gladeRanger.key,
  channeler: ACTOR_SPRITE_ASSETS.thornChanneler.key,
  mender: ACTOR_SPRITE_ASSETS.hearthMender.key,
  shade: ACTOR_SPRITE_ASSETS.hollowShade.key,
};

/** The prompt-kit order: Down, Down-Right, Right, Up-Right / Up, Up-Left, Left, Down-Left. */
export function actorFrameForFacing(facing: Vec2): number {
  const { x, y } = facing;
  if (Math.abs(x) < 0.1 && Math.abs(y) < 0.1) return 0;
  if (Math.abs(x) < 0.28) return y < 0 ? 4 : 0;
  if (Math.abs(y) < 0.28) return x > 0 ? 2 : 6;
  if (x > 0) return y > 0 ? 1 : 3;
  return y > 0 ? 7 : 5;
}

export function actorTextureForMember(memberId: string, jobId: string, role: PartyRole): string {
  if (memberId === PRIMARY_PLAYER_MEMBER_ID) {
    return ACTOR_SPRITE_ASSETS.lateSengokuFireSwordsman.key;
  }

  return JOB_TEXTURE[jobId] ?? ROLE_TEXTURE[role];
}
