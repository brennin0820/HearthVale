export interface Vec2 { x: number; y: number }
export interface Rect { x: number; y: number; width: number; height: number }
export interface CollisionGrid {
  mapId: string;
  tileSize: number;
  walkable: boolean[][];
}
export interface MapProp {
  id: string;
  kind: string;
  x: number;
  y: number;
  width: number;
  height: number;
  shape: 'rect' | 'ellipse';
  fillColor: number;
  accentColor: number;
  alpha: number;
}
export interface MapPropSet { mapId: string; props: MapProp[] }
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
export interface SpawnTableEntry { monsterId: string; weight: number; minLevel?: number; maxLevel?: number }
export interface SpawnTable { id: string; bounds: Rect; maxConcurrent: number; respawnSeconds: number; entries: SpawnTableEntry[] }
export interface MapNpcPlacement { npcId: string; position: Vec2; facing?: string }
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
  kind: 'town' | 'field' | 'dungeon' | 'instance';
  levelRange: { min: number; max: number };
  biome: string;
  gridSize: { width: number; height: number };
  spawnTables: SpawnTable[];
  resourceNodes?: ResourceNodeDefinition[];
  npcs: MapNpcPlacement[];
  portals: MapPortal[];
  playerSpawn: Vec2;
  safeZone: Rect | null;
  regionId?: string;
  showOnWorldMap?: boolean;
  worldMapPosition?: Vec2;
  musicKey?: string;
  assetKey?: string;
}
export interface WarpDestination {
  id: string;
  label: string;
  targetMapId: string;
  targetSpawn: Vec2;
  cost: number;
  requiredLevel?: number;
  unlockQuestId?: string;
}
export interface BiomeDefinition {
  id: string;
  displayName: string;
  groundColor: string;
  accentColor: string;
}
export interface RegionDefinition {
  id: string;
  displayName: string;
  capitalMapId: string;
  levelRange: { min: number; max: number };
  worldMapBounds: Rect;
  warpTable: WarpDestination[];
}
export interface NpcDefinition {
  id: string;
  displayName: string;
  role: 'quest' | 'merchant' | 'trainer' | 'warp' | 'flavor';
  title: string;
  dialogue: string[];
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
export interface MonsterAbilityDefinition {
  id: string;
  displayName: string;
  target: 'single' | 'area';
  cooldown: number;
  telegraphSeconds: number;
  range: number;
  powerMultiplier: number;
  status?: 'poison' | 'gloom' | 'drenched' | 'sunblind' | 'fractured' | 'muted' | 'severed';
  statusAmount?: number;
  statusDuration?: number;
}
export interface ItemDefinition {
  id: string;
  displayName: string;
  kind: 'consumable' | 'material' | 'equipment' | 'rune' | 'quest';
  stackMax: number;
  sellPrice: number;
  rarity?: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  description?: string;
  buyPrice?: number;
  levelReq?: number;
  slot?: 'weapon' | 'offhand' | 'head' | 'body' | 'accessory';
  stats?: Record<string, number>;
  runeStats?: Record<string, number>;
  runeSlots?: Array<'weapon' | 'offhand' | 'head' | 'body' | 'accessory'>;
  effect?: { type: 'heal' | 'restore' | 'buff' | 'cure' | 'warp'; amount?: number; duration?: number; stat?: string; target?: string };
  tradable?: boolean;
}
export interface QuestDefinition {
  id: string;
  displayName: string;
  description?: string;
  giverNpcId?: string;
  completionNpcId?: string;
  requiredLevel?: number;
  prerequisiteQuestIds?: string[];
  prerequisiteAnyQuestIds?: string[];
  exclusiveQuestIds?: string[];
  objectives?: QuestObjectiveDefinition[];
  startItems?: QuestItemStack[];
  turnInItems?: QuestItemStack[];
  rewards?: QuestRewardDefinition;
  unlocksWarpId?: string;
  completesCampaign?: boolean;
}
export type QuestObjectiveKind = 'defeat' | 'collect' | 'visit';
export interface QuestItemStack { itemId: string; count: number }
export interface QuestObjectiveDefinition {
  id: string;
  kind: QuestObjectiveKind;
  targetId: string;
  count: number;
  label: string;
}
export interface QuestRewardDefinition { xp: number; gold: number; items?: QuestItemStack[] }
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
export interface DropEntry { itemId: string; weight: number; minCount: number; maxCount: number }
export interface DropTableDefinition { id: string; monsterId: string; entries: DropEntry[] }

export type PartyRole = 'novice' | 'melee' | 'ranged' | 'magic' | 'support' | 'artisan' | 'scout';
export type SkillTargetType = 'self' | 'enemy' | 'ally' | 'area';
export type SkillEffectKind = 'damage' | 'heal' | 'buff' | 'debuff' | 'mark' | 'economy' | 'gather' | 'utility';
export interface SkillEffect {
  kind: SkillEffectKind;
  powerMultiplier?: number;
  amount?: number;
  stat?: string;
  duration?: number;
}
export interface SkillDefinition {
  id: string;
  displayName: string;
  type: 'physical' | 'magical' | 'support' | 'utility';
  targetType: SkillTargetType;
  description: string;
  mpCost: number;
  cooldown: number;
  effect: SkillEffect;
  element?: string;
  jobIds?: string[];
  evolutionIds?: string[];
  requiredLevel?: number;
  unlockQuestId?: string;
}
export interface JobDefinition {
  id: string;
  displayName: string;
  role: PartyRole;
  tier?: number;
  baseClassId?: string;
  requiredLevel?: number;
  primaryStat?: string;
  description?: string;
  growth?: { hp: number; mp: number; atk: number; def: number; matk: number; spr: number };
  startingSkills: string[];
  masteries?: JobMasteryDefinition[];
  evolutions?: JobEvolutionDefinition[];
}
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

export interface JobEvolutionDefinition {
  id: string;
  displayName: string;
  description: string;
  requiredLevel: number;
  unlockQuestId: string;
  skillId: string;
  bonuses: JobMasteryBonuses;
}
export interface GameData {
  maps: MapDefinition[];
  regions?: RegionDefinition[];
  biomes?: BiomeDefinition[];
  npcs: NpcDefinition[];
  monsters: MonsterDefinition[];
  items: ItemDefinition[];
  quests: QuestDefinition[];
  drops: DropTableDefinition[];
  shops?: ShopDefinition[];
  recipes?: RecipeDefinition[];
  jobs: JobDefinition[];
  skills: SkillDefinition[];
  collisions?: Record<string, CollisionGrid>;
  props?: Record<string, MapPropSet>;
}
