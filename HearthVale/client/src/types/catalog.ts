/** Client-side mirror of the exported catalog types (from `data/catalog/*.json`). */

export type NpcRole = 'quest' | 'merchant' | 'trainer' | 'warp' | 'flavor';

export interface NpcDefinition {
  id: string;
  displayName: string;
  role: NpcRole;
  title: string;
  dialogue: string[];
}

export interface QuestDefinition {
  id: string;
  displayName: string;
  giverNpcId?: string;
  requiredLevel?: number;
  unlocksWarpId?: string;
}

export type SkillEffectKind =
  | 'damage'
  | 'heal'
  | 'buff'
  | 'debuff'
  | 'mark'
  | 'economy'
  | 'gather'
  | 'utility';

/** Client mirror of `SkillEffect` — see `src/data/catalog/types.ts` for the authoring-side shape. */
export interface SkillEffect {
  kind: SkillEffectKind;
  powerMultiplier?: number;
  amount?: number;
  stat?: string;
  duration?: number;
}

/** Client mirror of `SkillDefinition`. `economy`/`gather`/`utility` effects are not combat actions. */
export interface SkillDefinition {
  id: string;
  displayName: string;
  mpCost: number;
  cooldown: number;
  effect: SkillEffect;
  element?: string;
}

/** Subset of the exported job catalog the client needs: which skills a job grants. */
export interface JobSkillsEntry {
  id: string;
  startingSkills: string[];
}

export interface ItemDefinition {
  id: string;
  displayName: string;
  kind: 'consumable' | 'material' | 'equipment' | 'quest';
  stackMax: number;
  rarity?: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
}

export interface DropEntry {
  itemId: string;
  weight: number;
  minCount: number;
  maxCount: number;
}

export interface DropTableDefinition {
  monsterId: string;
  entries: DropEntry[];
}
