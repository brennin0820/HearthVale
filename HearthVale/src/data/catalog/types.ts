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
