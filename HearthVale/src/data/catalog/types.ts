export type MonsterAbilityTarget = 'single' | 'area';

export interface MonsterAbilityDefinition {
  id: string;
  displayName: string;
  target: MonsterAbilityTarget;
  /** Seconds before the ability can be selected again. */
  cooldown: number;
  /** Visible wind-up time. Moving outside `range` avoids the hit. */
  telegraphSeconds: number;
  /** Ability reach in world pixels. */
  range: number;
  /** Multiplier applied to the monster's normal attack damage. */
  powerMultiplier: number;
  /** Optional condition applied to surviving targets. */
  status?: 'poison' | 'gloom' | 'drenched' | 'sunblind' | 'fractured' | 'muted' | 'severed';
  statusAmount?: number;
  statusDuration?: number;
}

export interface MonsterDefinition {
  id: string;
  displayName: string;
  baseLevel: number;
  hp: number;
  atk: number;
  def: number;
  size: 'small' | 'medium' | 'large';
  element: string;
  abilities?: MonsterAbilityDefinition[];
}

export type NpcRole = 'quest' | 'merchant' | 'trainer' | 'warp' | 'flavor';

export interface NpcDefinition {
  id: string;
  displayName: string;
  role: NpcRole;
  /** Short role/occupation subtitle shown under the name in the talk panel. */
  title: string;
  /** Ordered lines shown when the player talks to this NPC. */
  dialogue: string[];
}

export type ItemKind = 'consumable' | 'material' | 'equipment' | 'rune' | 'quest';

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
  /** Stat bonuses granted while socketed (rune items only). */
  runeStats?: ItemStats;
  /** Equipment slots this rune can be bound to (rune items only). */
  runeSlots?: EquipmentSlot[];
  /** Effect applied on use (consumable items only). */
  effect?: ConsumableEffect;
  /** Whether the item may be traded/sold between players. Defaults to true. */
  tradable?: boolean;
}

export type QuestObjectiveKind = 'defeat' | 'collect' | 'visit';

export interface QuestItemStack {
  itemId: string;
  count: number;
}

export interface QuestObjectiveDefinition {
  id: string;
  kind: QuestObjectiveKind;
  /** Monster id, item id, map id, or `*` for any monster defeat. */
  targetId: string;
  count: number;
  label: string;
}

export interface QuestRewardDefinition {
  xp: number;
  gold: number;
  items?: QuestItemStack[];
}

export interface ShopDefinition {
  id: string;
  displayName: string;
  npcId: string;
  itemIds: string[];
}

export type RecipeCategory = 'alchemy' | 'smithing' | 'tailoring';

export interface RecipeDefinition {
  id: string;
  displayName: string;
  category: RecipeCategory;
  stationNpcIds: string[];
  result: QuestItemStack;
  ingredients: QuestItemStack[];
  goldCost: number;
  requiredLevel?: number;
}

export interface QuestDefinition {
  id: string;
  displayName: string;
  description?: string;
  giverNpcId?: string;
  completionNpcId?: string;
  requiredLevel?: number;
  /** Every listed quest must be complete before this quest can start. */
  prerequisiteQuestIds?: string[];
  /** At least one listed quest must be complete before this quest can start. */
  prerequisiteAnyQuestIds?: string[];
  /** Starting any listed quest permanently closes this alternative branch. */
  exclusiveQuestIds?: string[];
  objectives?: QuestObjectiveDefinition[];
  startItems?: QuestItemStack[];
  turnInItems?: QuestItemStack[];
  rewards?: QuestRewardDefinition;
  unlocksWarpId?: string;
  completesCampaign?: boolean;
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

/** Permanent bonuses granted by a level-18 advanced-path mastery. */
export interface JobMasteryBonuses {
  hp?: number;
  mp?: number;
  atk?: number;
  def?: number;
  spd?: number;
  crit?: number;
  powerPercent?: number;
  healingPercent?: number;
  evasion?: number;
  buyPrice?: number;
  dropRate?: number;
  stackMax?: number;
}

export interface JobMasteryDefinition {
  id: string;
  displayName: string;
  description: string;
  requiredLevel: number;
  bonuses: JobMasteryBonuses;
}

/** A mutually exclusive level-28 calling that deepens a tier-1 path. */
export interface JobEvolutionDefinition {
  id: string;
  displayName: string;
  description: string;
  requiredLevel: number;
  unlockQuestId: string;
  skillId: string;
  bonuses: JobMasteryBonuses;
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
  /** Mutually exclusive capstone choices for an advanced path. */
  masteries?: JobMasteryDefinition[];
  /** Mutually exclusive later-path callings earned beyond Namesong. */
  evolutions?: JobEvolutionDefinition[];
}

/** Broad category a skill falls into — mirrors the job roles it serves. */
export type SkillType = 'physical' | 'magical' | 'support' | 'utility';

export type SkillTargetType = 'self' | 'enemy' | 'ally' | 'area';

/**
 * What a skill actually does when used. `damage`/`heal`/`buff`/`debuff`/`mark`
 * are consumed by the combat layer; `economy`/`gather` are consumed by the
 * vendor and resource-node systems respectively — a skill is never decorative.
 */
export interface SkillEffect {
  kind: 'damage' | 'heal' | 'buff' | 'debuff' | 'mark' | 'economy' | 'gather' | 'utility';
  /** ATK/MATK multiplier fed into the shared damage formula (damage skills only). */
  powerMultiplier?: number;
  /** Flat magnitude: HP/resource restored, buff/debuff strength, or a percent (economy/gather). */
  amount?: number;
  /** Stat or resource the effect targets (e.g. 'def', 'flee', 'mp', 'buyPrice', 'dropRate'). */
  stat?: string;
  /** Effect duration in seconds (buff/debuff/mark only). */
  duration?: number;
}

/**
 * A HearthVale skill — referenced by id from `JobClassDefinition.startingSkills`.
 * Every skill must resolve to a definition here (enforced by `verify-skills`)
 * so no job ever grants a name with no mechanical effect.
 */
export interface SkillDefinition {
  id: string;
  displayName: string;
  type: SkillType;
  targetType: SkillTargetType;
  description: string;
  mpCost: number;
  /** Cooldown in seconds before the skill can be used again. */
  cooldown: number;
  effect: SkillEffect;
  /** Damage/heal element, when relevant — must match a known `ELEMENT_MODIFIERS` key. */
  element?: string;
  /** Advanced paths allowed to place this technique in their three-slot loadout. */
  jobIds?: string[];
  /** Later-path callings allowed to place this technique in their loadout. */
  evolutionIds?: string[];
  /** Level required before the technique can be equipped. */
  requiredLevel?: number;
  /** Optional completed quest that teaches this technique. */
  unlockQuestId?: string;
}
