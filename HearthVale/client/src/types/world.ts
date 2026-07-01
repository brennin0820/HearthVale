/** Client-side mirror of server/world map types (from exported JSON). */

export type MapKind = 'town' | 'field' | 'dungeon' | 'instance';

export interface Vec2 {
  x: number;
  y: number;
}

export interface LevelRange {
  min: number;
  max: number;
}

export interface GridSize {
  width: number;
  height: number;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface SpawnTableEntry {
  monsterId: string;
  weight: number;
  minLevel?: number;
  maxLevel?: number;
}

export interface SpawnTable {
  id: string;
  bounds: Rect;
  maxConcurrent: number;
  respawnSeconds: number;
  entries: SpawnTableEntry[];
}

export interface MapNpcPlacement {
  npcId: string;
  position: Vec2;
  facing?: 'north' | 'south' | 'east' | 'west';
}

export interface MapPortal {
  id: string;
  label: string;
  position: Vec2;
  targetMapId: string;
  targetSpawn: Vec2;
  requiredLevel?: number;
  requiredQuestId?: string;
}

export interface MapDefinition {
  id: string;
  displayName: string;
  kind: MapKind;
  regionId: string;
  levelRange: LevelRange;
  showOnWorldMap: boolean;
  worldMapPosition: Vec2;
  biome: string;
  musicKey: string;
  gridSize: GridSize;
  spawnTables: SpawnTable[];
  npcs: MapNpcPlacement[];
  portals: MapPortal[];
  playerSpawn: Vec2;
  safeZone: Rect | null;
  assetKey: string;
}
