/** Discriminator for map gameplay rules and UI treatment. */
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
  requiredQuestStartedId?: string;
}

export type ResourceNodeKind = 'herb' | 'ore' | 'fiber' | 'relic';

export interface ResourceNodeDefinition {
  id: string;
  displayName: string;
  kind: ResourceNodeKind;
  position: Vec2;
  itemId: string;
  minCount: number;
  maxCount: number;
  respawnSeconds: number;
  requiredLevel?: number;
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
  resourceNodes?: ResourceNodeDefinition[];
  npcs: MapNpcPlacement[];
  portals: MapPortal[];
  playerSpawn: Vec2;
  safeZone: Rect | null;
  assetKey: string;
}

export interface WarpDestination {
  id: string;
  label: string;
  targetMapId: string;
  targetSpawn: Vec2;
  /** Gold cost; 0 = free. */
  cost: number;
  requiredLevel?: number;
  unlockQuestId?: string;
}

export interface RegionDefinition {
  id: string;
  displayName: string;
  capitalMapId: string;
  levelRange: LevelRange;
  worldMapBounds: Rect;
  warpTable: WarpDestination[];
}

export interface MapAlias {
  alias: string;
  mapId: string;
}
