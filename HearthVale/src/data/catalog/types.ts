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

export type NpcRole = 'quest' | 'merchant' | 'trainer' | 'warp' | 'flavor';

export interface NpcDefinition {
  id: string;
  displayName: string;
  role: NpcRole;
  /** Short honorific/subtitle shown under the name in-world (e.g. "Town Elder"). */
  title?: string;
  /** Lines spoken when the player talks to this NPC; cycled on repeat interaction. */
  dialogue?: string[];
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
