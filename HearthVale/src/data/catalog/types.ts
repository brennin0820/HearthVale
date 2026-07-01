export interface MonsterDefinition {
  id: string;
  displayName: string;
  baseLevel: number;
  hp: number;
  atk: number;
  def: number;
  size: 'small' | 'medium' | 'large';
  element: string;
}

export interface NpcDefinition {
  id: string;
  displayName: string;
  role: 'quest' | 'merchant' | 'trainer' | 'warp' | 'flavor';
}

export type ItemKind = 'consumable' | 'material' | 'equipment' | 'quest';

export type ItemRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

/** Slot an equipment item occupies. Required for `kind: 'equipment'`. */
export type EquipmentSlot = 'weapon' | 'offhand' | 'head' | 'body' | 'accessory';

/** Flat stat bonuses granted while an equipment item is worn. */
export interface ItemStats {
  atk?: number;
  def?: number;
  hp?: number;
  spd?: number;
  /** Critical-hit chance bonus, in whole percent. */
  crit?: number;
}

/** What a consumable does when used. Required for `kind: 'consumable'`. */
export interface ConsumableEffect {
  /** heal HP, restore a resource, apply a timed buff, cure a status, or warp. */
  type: 'heal' | 'restore' | 'buff' | 'cure' | 'warp';
  /** HP/resource restored, or buff magnitude, depending on `type`. */
  amount?: number;
  /** Buff duration in seconds (buff only). */
  duration?: number;
  /** Stat boosted by a buff, or resource restored (e.g. 'mp', 'stamina'). */
  stat?: string;
  /** Status cured (cure only), or destination warp id (warp only). */
  target?: string;
}

export interface ItemDefinition {
  id: string;
  displayName: string;
  kind: ItemKind;
  stackMax: number;
  sellPrice: number;
  /** Drop/loot rarity tier. Defaults to 'common' when omitted. */
  rarity?: ItemRarity;
  /** Short flavor / tooltip text. */
  description?: string;
  /** Shop purchase price. Must be >= sellPrice when present. */
  buyPrice?: number;
  /** Minimum character level required to equip or use. */
  levelReq?: number;
  /** Equipment slot (equipment items only). */
  slot?: EquipmentSlot;
  /** Stat bonuses granted while worn (equipment items only). */
  stats?: ItemStats;
  /** Effect applied on use (consumable items only). */
  effect?: ConsumableEffect;
  /** Whether the item may be traded/sold between players. Defaults to true. */
  tradable?: boolean;
}

export interface QuestDefinition {
  id: string;
  displayName: string;
  giverNpcId?: string;
  requiredLevel?: number;
  unlocksWarpId?: string;
}

export interface DropEntry {
  itemId: string;
  weight: number;
  minCount: number;
  maxCount: number;
}

export interface DropTableDefinition {
  id: string;
  monsterId: string;
  entries: DropEntry[];
}

/** Broad combat/utility archetype a job class fills. */
export type JobRole =
  | 'novice'
  | 'melee'
  | 'ranged'
  | 'magic'
  | 'support'
  | 'artisan'
  | 'scout';

/** Per-level stat gains applied while advanced in a job class. */
export interface JobStatGrowth {
  hp: number;
  mp: number;
  atk: number;
  def: number;
  matk: number;
  spr: number;
}

/**
 * A HearthVale character job class. Tier 0 is the shared Vale Novice base;
 * tier 1 classes branch from it via `baseClassId` once `requiredLevel` is met.
 * Original IP — RO-inspired archetype structure, not copied content.
 */
export interface JobClassDefinition {
  id: string;
  displayName: string;
  tier: number;
  role: JobRole;
  /** Parent job an advanced class branches from (omitted for the tier-0 base). */
  baseClassId?: string;
  /** Character level required to change into this job. */
  requiredLevel: number;
  primaryStat: 'str' | 'agi' | 'int' | 'vit' | 'dex' | 'wis';
  description: string;
  growth: JobStatGrowth;
  startingSkills: string[];
}
