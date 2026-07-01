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

export interface ItemDefinition {
  id: string;
  displayName: string;
  kind: 'consumable' | 'material' | 'equipment' | 'quest';
  stackMax: number;
  sellPrice: number;
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
