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
