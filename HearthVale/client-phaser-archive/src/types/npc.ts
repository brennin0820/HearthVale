/** Client-side mirror of server/catalog NPC types (from exported JSON). */

export type NpcRole = 'quest' | 'merchant' | 'trainer' | 'warp' | 'flavor';

export interface NpcCatalogEntry {
  id: string;
  displayName: string;
  role: NpcRole;
  title?: string;
  dialogue?: string[];
}
