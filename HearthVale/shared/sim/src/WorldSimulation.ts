import type { InputActions } from './actions.js';
import type { CollisionGrid, DropTableDefinition, GameData, ItemDefinition, JobDefinition, JobEvolutionDefinition, JobMasteryBonuses, JobMasteryDefinition, MapDefinition, MonsterDefinition, NpcDefinition, PartyRole, QuestDefinition, RecipeDefinition, RegionDefinition, ResourceNodeDefinition, ShopDefinition, SkillDefinition, Vec2, WarpDestination } from './types.js';
import { moveWithCollisions, nearestWalkablePoint } from './CollisionGrid.js';

export interface ActiveEffect {
  skillId: string;
  stat: string;
  amount: number;
  remaining: number;
  tickTimer?: number;
}

export interface PlayerState extends Vec2 {
  id: string;
  name: string;
  jobId: string;
  masteryId?: string;
  evolutionId?: string;
  className: string;
  role: PartyRole;
  color: number;
  level: number;
  hp: number;
  baseMaxHp: number;
  maxHp: number;
  mp: number;
  baseMaxMp: number;
  maxMp: number;
  stamina: number;
  maxStamina: number;
  xp: number;
  xpNext: number;
  attackCooldown: number;
  attackInterval: number;
  attackRange: number;
  power: number;
  invulnerable: number;
  facing: Vec2;
  combo: number;
  comboWindow: number;
  skillIds: string[];
  skillCooldowns: Record<string, number>;
  activeEffects: ActiveEffect[];
}

export interface MonsterState extends Vec2 {
  uid: string;
  definition: MonsterDefinition;
  hp: number;
  maxHp: number;
  home: Vec2;
  wanderAngle: number;
  hurtFlash: number;
  attackCooldown: number;
  abilityCooldowns: Record<string, number>;
  abilitySequence: number;
  telegraph?: {
    abilityId: string;
    targetMemberId: string;
    remaining: number;
    totalDuration: number;
    range: number;
  };
  alive: boolean;
  respawn: number;
  activeEffects: ActiveEffect[];
}

export interface ResourceNodeState extends Vec2 {
  definition: ResourceNodeDefinition;
  available: boolean;
  respawn: number;
}

export type ResourceCooldowns = Record<string, number>;

export interface InventoryStack {
  itemId: string;
  count: number;
}

export interface QuestState {
  questId: string;
  status: 'active' | 'ready' | 'completed';
  progress: number;
  target: number;
  objectiveProgress: Record<string, number>;
}

export type EquipmentSlot = NonNullable<ItemDefinition['slot']>;
export type EquipmentStats = Record<'atk' | 'def' | 'hp' | 'spd' | 'crit', number>;
export type MemberEquipment = Partial<Record<EquipmentSlot, string>>;
export type EquipmentState = Record<string, MemberEquipment>;
export type MemberSockets = Partial<Record<EquipmentSlot, string>>;
export type SocketState = Record<string, MemberSockets>;
export type EconomyAction = 'buy' | 'sell' | 'craft';

export interface WorldSimulationOptions {
  /** Secret entropy supplied by the authoritative server for loot and gathering rolls. */
  rngSalt?: string;
  /** Restore the saved leader position rather than treating `spawn` as a map transition. */
  restoreSavedPosition?: boolean;
}

export type SimEvent =
  | { type: 'attack-swing'; memberId: string; targetUid: string; automatic: boolean }
  | { type: 'skill-used'; memberId: string; skillId: string; targetUid?: string; targetMemberId?: string; affectedUids?: string[] }
  | { type: 'skill-blocked'; memberId: string; skillId: string; reason: 'cooldown' | 'mp' | 'target' | 'passive' | 'muted' }
  | { type: 'skill-loadout-changed'; memberId: string; skillId: string; equipped: boolean }
  | { type: 'skill-loadout-blocked'; memberId: string; skillId: string; reason: 'path' | 'level' | 'quest' | 'slots' | 'minimum' }
  | { type: 'member-healed'; memberId: string; healerId: string; amount: number; skillId?: string }
  | { type: 'player-hit'; memberId: string; amount: number }
  | { type: 'player-dodged'; memberId: string; uid: string }
  | { type: 'monster-ability-telegraph'; uid: string; abilityId: string; targetMemberId: string; duration: number; range: number }
  | { type: 'monster-hit'; memberId: string; uid: string; amount: number; defeated: boolean; critical: boolean; skillId?: string; element?: string; effectiveness: 'normal' | 'strong' | 'resisted' }
  | { type: 'item-loot'; itemId: string; count: number }
  | { type: 'resource-gathered'; nodeId: string; itemId: string; count: number; bonus: number }
  | { type: 'resource-blocked'; nodeId: string; reason: 'node' | 'range' | 'level' | 'cooldown' }
  | { type: 'quest-started'; questId: string }
  | { type: 'quest-progress'; questId: string; progress: number; target: number; objectiveId?: string }
  | { type: 'quest-completed'; questId: string; rewardItems: InventoryStack[]; xp: number; gold: number; campaignCompleted?: boolean }
  | { type: 'item-used'; itemId: string; memberId?: string; amount?: number }
  | { type: 'warp-requested'; itemId: string; target: string }
  | { type: 'courier-warp-requested'; warpId: string; targetMapId: string; targetSpawn: Vec2; goldCost: number }
  | { type: 'courier-warp-blocked'; warpId: string; reason: 'destination' | 'level' | 'quest' | 'gold' | 'location' }
  | { type: 'item-equipped'; itemId: string; memberId: string; slot: EquipmentSlot }
  | { type: 'item-unequipped'; itemId: string; memberId: string; slot: EquipmentSlot }
  | { type: 'rune-socketed'; runeId: string; memberId: string; slot: EquipmentSlot; replacedRuneId?: string }
  | { type: 'rune-unsocketed'; runeId: string; memberId: string; slot: EquipmentSlot }
  | { type: 'rune-blocked'; runeId: string; memberId: string; slot: EquipmentSlot; reason: 'member' | 'equipment' | 'missing' | 'level' | 'type' | 'slot' | 'assigned' }
  | { type: 'item-blocked'; itemId: string; reason: 'missing' | 'level' | 'type' | 'assigned' | 'full' | 'condition' | 'location' }
  | { type: 'economy-transaction'; action: EconomyAction; itemId: string; count: number; goldDelta: number; recipeId?: string }
  | { type: 'economy-blocked'; action: EconomyAction; targetId: string; reason: 'merchant' | 'stock' | 'gold' | 'items' | 'level' | 'protected' | 'equipped' }
  | { type: 'job-changed'; memberId: string; fromJobId: string; jobId: string; goldCost: number }
  | { type: 'job-change-blocked'; memberId: string; jobId: string; reason: 'level' | 'path' | 'gold' | 'same' }
  | { type: 'mastery-changed'; memberId: string; fromMasteryId?: string; masteryId: string; goldCost: number }
  | { type: 'mastery-change-blocked'; memberId: string; masteryId: string; reason: 'level' | 'path' | 'gold' | 'same' }
  | { type: 'evolution-changed'; memberId: string; fromEvolutionId?: string; evolutionId: string; goldCost: number }
  | { type: 'evolution-change-blocked'; memberId: string; evolutionId: string; reason: 'level' | 'path' | 'quest' | 'gold' | 'same' }
  | { type: 'member-fainted'; memberId: string }
  | { type: 'status-applied'; memberId: string; status: string; duration: number }
  | { type: 'status-damage'; memberId: string; status: string; amount: number }
  | { type: 'status-cured'; memberId: string; status: string }
  | { type: 'level-up'; level: number }
  | { type: 'party-wiped' };

interface PartyConfig {
  id: string;
  name: string;
  className: string;
  role: PartyRole;
  color: number;
  maxHp: number;
  maxMp: number;
  attackInterval: number;
  attackRange: number;
  power: number;
}

interface JobCombatProfile {
  role: PartyRole;
  attackInterval: number;
  attackRange: number;
  power: number;
}

const TILE = 32;
export const MAX_SKILL_SLOTS = 3;
const PLAYER_SPEED = 185;
const MAX_STAMINA = 100;
const SPRINT_STAMINA_DRAIN = 22;
const STAMINA_RECOVERY = 14;
const AREA_RADIUS = 92;
export const JOB_RETRAIN_COST = 150;
export const MASTERY_RETRAIN_COST = 300;
export const EVOLUTION_RETRAIN_COST = 500;
export const EQUIPMENT_SLOTS: EquipmentSlot[] = ['weapon', 'offhand', 'head', 'body', 'accessory'];
const EQUIPMENT_STAT_KEYS: Array<keyof EquipmentStats> = ['atk', 'def', 'hp', 'spd', 'crit'];
const EMPTY_EQUIPMENT_STATS: EquipmentStats = { atk: 0, def: 0, hp: 0, spd: 0, crit: 0 };
const PARTY_CONFIG: PartyConfig[] = [
  { id: 'warden', name: 'Aster', className: 'Vale Warden', role: 'melee', color: 0x4f8e84, maxHp: 145, maxMp: 58, attackInterval: 0.48, attackRange: 68, power: 1.05 },
  { id: 'ranger', name: 'Rowan', className: 'Glade Ranger', role: 'ranged', color: 0x77a95c, maxHp: 100, maxMp: 76, attackInterval: 0.72, attackRange: 205, power: 0.9 },
  { id: 'channeler', name: 'Iris', className: 'Thorn Channeler', role: 'magic', color: 0x9d75bd, maxHp: 88, maxMp: 116, attackInterval: 1.05, attackRange: 165, power: 1.45 },
  { id: 'mender', name: 'Mara', className: 'Hearth Mender', role: 'support', color: 0xd7ad59, maxHp: 108, maxMp: 108, attackInterval: 0.92, attackRange: 130, power: 0.68 },
];
const JOB_COMBAT_PROFILES: Record<string, JobCombatProfile> = {
  novice: { role: 'novice', attackInterval: 0.68, attackRange: 74, power: 0.82 },
  warden: { role: 'melee', attackInterval: 0.48, attackRange: 68, power: 1.05 },
  ranger: { role: 'ranged', attackInterval: 0.72, attackRange: 205, power: 0.9 },
  channeler: { role: 'magic', attackInterval: 1.05, attackRange: 165, power: 1.45 },
  mender: { role: 'support', attackInterval: 0.92, attackRange: 130, power: 0.68 },
  wayfarer: { role: 'artisan', attackInterval: 0.66, attackRange: 76, power: 0.96 },
  shade: { role: 'scout', attackInterval: 0.4, attackRange: 70, power: 1.18 },
};
const FORMATION = [
  { side: 0, back: 0 },
  { side: -34, back: 42 },
  { side: 34, back: 42 },
  { side: 0, back: 78 },
];
const ELEMENTAL_MODIFIERS: Record<string, Record<string, number>> = {
  nature: { water: 1.35, fungal: 0.75, fire: 0.75, nature: 0.85 },
  arcane: { spirit: 1.35, shadow: 1.35, fire: 1.15, crystal: 0.75 },
  crystal: { wind: 1.35, fungal: 1.2, fire: 1.25, water: 0.75, crystal: 0.85 },
  fire: { fungal: 1.2, crystal: 1.35, water: 0.75, fire: 0.85 },
};

function dist(a: Vec2, b: Vec2): number { return Math.hypot(a.x - b.x, a.y - b.y); }
function seeded(seed: string): number {
  let value = 2166136261;
  for (const char of seed) value = Math.imul(value ^ char.charCodeAt(0), 16777619);
  return (value >>> 0) / 4294967295;
}
function tickEffects(effects: ActiveEffect[], dt: number): ActiveEffect[] {
  for (const effect of effects) effect.remaining = Math.max(0, effect.remaining - dt);
  return effects.filter((effect) => effect.remaining > 0);
}
function effectAmount(effects: ActiveEffect[], stat: string): number {
  return effects.filter((effect) => effect.stat === stat).reduce((sum, effect) => sum + effect.amount, 0);
}

export function normalizeEquipmentState(equipment: unknown, legacyMemberId = PARTY_CONFIG[0].id): EquipmentState {
  if (!equipment || typeof equipment !== 'object' || Array.isArray(equipment)) return {};
  const source = equipment as Record<string, unknown>;
  const legacyLoadout = Object.fromEntries(EQUIPMENT_SLOTS.flatMap((slot) =>
    typeof source[slot] === 'string' ? [[slot, source[slot] as string]] : []));
  if (Object.keys(legacyLoadout).length > 0) return { [legacyMemberId]: legacyLoadout };

  const normalized: EquipmentState = {};
  for (const [memberId, loadout] of Object.entries(source)) {
    if (!loadout || typeof loadout !== 'object' || Array.isArray(loadout)) continue;
    const memberLoadout = loadout as Record<string, unknown>;
    normalized[memberId] = Object.fromEntries(EQUIPMENT_SLOTS.flatMap((slot) =>
      typeof memberLoadout[slot] === 'string' ? [[slot, memberLoadout[slot] as string]] : []));
  }
  return normalized;
}

export function normalizeSocketState(sockets: unknown): SocketState {
  if (!sockets || typeof sockets !== 'object' || Array.isArray(sockets)) return {};
  const normalized: SocketState = {};
  for (const [memberId, loadout] of Object.entries(sockets as Record<string, unknown>)) {
    if (!loadout || typeof loadout !== 'object' || Array.isArray(loadout)) continue;
    const memberLoadout = loadout as Record<string, unknown>;
    normalized[memberId] = Object.fromEntries(EQUIPMENT_SLOTS.flatMap((slot) =>
      typeof memberLoadout[slot] === 'string' ? [[slot, memberLoadout[slot] as string]] : []));
  }
  return normalized;
}

export function equipmentStatsForMember(equipment: EquipmentState, items: readonly ItemDefinition[], memberId: string, sockets: SocketState = {}): EquipmentStats {
  const catalog = new Map(items.map((item) => [item.id, item]));
  const totals = { ...EMPTY_EQUIPMENT_STATS };
  for (const itemId of Object.values(equipment[memberId] ?? {})) {
    const stats = itemId ? catalog.get(itemId)?.stats : undefined;
    for (const stat of EQUIPMENT_STAT_KEYS) totals[stat] += stats?.[stat] ?? 0;
  }
  for (const runeId of Object.values(sockets[memberId] ?? {})) {
    const stats = runeId ? catalog.get(runeId)?.runeStats : undefined;
    for (const stat of EQUIPMENT_STAT_KEYS) totals[stat] += stats?.[stat] ?? 0;
  }
  return totals;
}

export function elementalEffectiveness(attackElement = 'neutral', targetElement = 'neutral'): number {
  return ELEMENTAL_MODIFIERS[attackElement]?.[targetElement] ?? 1;
}

export class WorldSimulation {
  readonly map: MapDefinition;
  readonly party: PlayerState[];
  readonly player: PlayerState;
  readonly monsters: MonsterState[] = [];
  readonly resources: ResourceNodeState[] = [];
  readonly resourceCooldowns: ResourceCooldowns = {};
  readonly inventory: InventoryStack[] = [];
  readonly quests: QuestState[] = [];
  readonly equipment: EquipmentState = {};
  readonly sockets: SocketState = {};
  readonly discoveredMapIds: string[] = [];
  gold = 25;
  private readonly collision?: CollisionGrid;
  private readonly skills = new Map<string, SkillDefinition>();
  private readonly jobs = new Map<string, JobDefinition>();
  private readonly items = new Map<string, ItemDefinition>();
  private readonly shopsByNpc = new Map<string, ShopDefinition>();
  private readonly recipes = new Map<string, RecipeDefinition>();
  private readonly regions = new Map<string, RegionDefinition>();
  private readonly questsByGiver = new Map<string, QuestDefinition[]>();
  private readonly questCatalog = new Map<string, QuestDefinition>();
  private readonly dropsByMonster = new Map<string, DropTableDefinition>();
  private readonly attackSequences = new Map<string, number>();
  private readonly monsterAttackSequences = new Map<string, number>();
  private readonly gatherSequences = new Map<string, number>();
  private readonly dropSequences = new Map<string, number>();
  private readonly rngSalt: string;
  private events: SimEvent[] = [];
  private movementFacing: Vec2 = { x: 1, y: 0 };
  private sprintRecoveryLocked = false;

  constructor(data: GameData, map: MapDefinition, spawn: Vec2, savedParty?: PlayerState[], savedInventory?: InventoryStack[], savedQuests?: QuestState[], savedGold?: number, savedEquipment?: EquipmentState, savedDiscoveredMapIds?: string[], savedResourceCooldowns?: ResourceCooldowns, savedSockets?: SocketState, options: WorldSimulationOptions = {}) {
    this.map = map;
    this.rngSalt = options.rngSalt ?? '';
    this.collision = data.collisions?.[map.id];
    this.skills = new Map(data.skills.map((skill) => [skill.id, skill]));
    this.jobs = new Map(data.jobs.map((job) => [job.id, job]));
    this.items = new Map((data.items ?? []).map((item) => [item.id, item]));
    this.shopsByNpc = new Map((data.shops ?? []).map((shop) => [shop.npcId, shop]));
    this.recipes = new Map((data.recipes ?? []).map((recipe) => [recipe.id, recipe]));
    this.regions = new Map((data.regions ?? []).map((region) => [region.id, region]));
    this.questCatalog = new Map((data.quests ?? []).map((quest) => [quest.id, quest]));
    this.dropsByMonster = new Map((data.drops ?? []).map((table) => [table.monsterId, table]));
    for (const quest of data.quests ?? []) {
      if (!quest.giverNpcId) continue;
      const list = this.questsByGiver.get(quest.giverNpcId) ?? [];
      list.push(quest);
      this.questsByGiver.set(quest.giverNpcId, list);
    }
    this.inventory.push(...(savedInventory?.map((stack) => ({ ...stack })) ?? [
      { itemId: 'healing_brew', count: 2 },
      { itemId: 'hearth_charm', count: 1 },
    ]));
    this.quests.push(...(savedQuests?.map((quest) => this.normalizeQuestState(quest)) ?? []));
    const normalizedEquipment = normalizeEquipmentState(savedEquipment);
    for (const config of PARTY_CONFIG) this.equipment[config.id] = { ...(normalizedEquipment[config.id] ?? {}) };
    const normalizedSockets = normalizeSocketState(savedSockets);
    const assignedRunes = new Map<string, number>();
    for (const config of PARTY_CONFIG) {
      this.sockets[config.id] = {};
      for (const slot of EQUIPMENT_SLOTS) {
        const runeId = normalizedSockets[config.id]?.[slot];
        const rune = runeId ? this.items.get(runeId) : undefined;
        const assigned = runeId ? assignedRunes.get(runeId) ?? 0 : 0;
        const savedLevel = savedParty?.find((member) => member.id === config.id)?.level ?? savedParty?.[0]?.level ?? 1;
        if (!runeId || !this.equipment[config.id]?.[slot] || rune?.kind !== 'rune'
          || !rune.runeSlots?.includes(slot) || (rune.levelReq ?? 1) > savedLevel
          || assigned >= this.inventoryCount(runeId)) continue;
        this.sockets[config.id][slot] = runeId;
        assignedRunes.set(runeId, assigned + 1);
      }
    }
    this.gold = savedGold ?? this.gold;
    this.discoveredMapIds.push(...new Set([...(savedDiscoveredMapIds ?? []), map.id]));
    Object.assign(this.resourceCooldowns, savedResourceCooldowns ?? {});
    const savedLeader = savedParty?.[0];
    const restoreSavedPosition = Boolean(options.restoreSavedPosition
      && Number.isFinite(savedLeader?.x) && Number.isFinite(savedLeader?.y));
    const partySpawn = restoreSavedPosition
      ? { x: savedLeader!.x, y: savedLeader!.y }
      : spawn;
    const level = savedLeader?.level ?? 1;
    this.party = PARTY_CONFIG.map((config, index) => {
      const saved = savedParty?.find((member) => member.id === config.id);
      const formationPosition = this.formationPosition(partySpawn, { x: 1, y: 0 }, index);
      const position = nearestWalkablePoint(this.map, this.collision, formationPosition, 11);
      const savedJobId = saved?.jobId
        ?? [...this.jobs.values()].find((job) => job.displayName === saved?.className)?.id;
      const initialJobId = savedJobId ?? (this.jobs.has('novice') ? 'novice' : this.jobs.has(config.id) ? config.id : '');
      const job = this.jobs.get(initialJobId);
      const mastery = job?.masteries?.find((candidate) => candidate.id === saved?.masteryId
        && level >= candidate.requiredLevel);
      const evolution = job?.evolutions?.find((candidate) => candidate.id === saved?.evolutionId
        && level >= candidate.requiredLevel && this.isQuestCompleted(candidate.unlockQuestId));
      const baseMaxHp = saved?.baseMaxHp ?? saved?.maxHp ?? config.maxHp;
      const baseMaxMp = saved?.baseMaxMp ?? saved?.maxMp ?? config.maxMp;
      const maxHp = baseMaxHp + this.equipmentBonus(config.id, 'hp')
        + (mastery?.bonuses.hp ?? 0) + (evolution?.bonuses.hp ?? 0);
      const maxMp = baseMaxMp + (mastery?.bonuses.mp ?? 0) + (evolution?.bonuses.mp ?? 0);
      const maxStamina = Math.max(1, saved?.maxStamina ?? MAX_STAMINA);
      const savedMaxHp = saved?.maxHp ?? baseMaxHp;
      const savedMaxMp = saved?.maxMp ?? baseMaxMp;
      const savedHp = saved?.hp ?? maxHp;
      const profile = JOB_COMBAT_PROFILES[initialJobId] ?? {
        role: job?.role ?? config.role,
        attackInterval: config.attackInterval,
        attackRange: config.attackRange,
        power: config.power,
      };
      const availableSkillIds = new Set([...this.skills.values()]
        .filter((skill) => job && this.skillAvailableFor(job, level, skill, evolution?.id))
        .map((skill) => skill.id));
      const savedSkillIds = [...new Set(saved?.skillIds ?? [])]
        .filter((id) => availableSkillIds.has(id))
        .slice(0, MAX_SKILL_SLOTS);
      const skillIds = savedSkillIds.length > 0
        ? savedSkillIds
        : (job?.startingSkills.filter((id) => this.skills.has(id)).slice(0, MAX_SKILL_SLOTS) ?? []);
      return {
        ...position,
        ...config,
        ...profile,
        jobId: initialJobId,
        masteryId: mastery?.id,
        evolutionId: evolution?.id,
        className: evolution?.displayName ?? job?.displayName ?? config.className,
        level,
        hp: Math.max(1, Math.min(maxHp, savedHp + Math.max(0, maxHp - savedMaxHp))),
        baseMaxHp,
        maxHp,
        mp: Math.max(0, Math.min(maxMp, (saved?.mp ?? maxMp) + Math.max(0, maxMp - savedMaxMp))),
        baseMaxMp,
        maxMp,
        stamina: Math.max(0, Math.min(maxStamina, saved?.stamina ?? maxStamina)),
        maxStamina,
        xp: savedLeader?.xp ?? 0,
        xpNext: savedLeader?.xpNext ?? 80,
        attackCooldown: 0,
        invulnerable: 0,
        facing: saved?.facing ?? { x: 1, y: 0 },
        combo: 0,
        comboWindow: 0,
        skillIds,
        skillCooldowns: Object.fromEntries(skillIds.map((id) => [id, saved?.skillCooldowns?.[id] ?? 0])),
        activeEffects: saved?.activeEffects?.map((effect) => ({ ...effect })) ?? [],
      };
    });
    this.player = this.party[0];
    this.sprintRecoveryLocked = this.player.stamina < 20;

    const catalog = new Map(data.monsters.map((monster) => [monster.id, monster]));
    for (const table of map.spawnTables) {
      const count = Math.min(table.maxConcurrent, 6);
      for (let i = 0; i < count; i += 1) {
        const entry = table.entries[i % table.entries.length];
        const definition = catalog.get(entry?.monsterId ?? '');
        if (!definition) continue;
        const rx = seeded(`${table.id}:${i}:x`);
        const ry = seeded(`${table.id}:${i}:y`);
        const authoredPosition = {
          x: table.bounds.x + rx * table.bounds.width,
          y: table.bounds.y + ry * table.bounds.height,
        };
        const position = nearestWalkablePoint(this.map, this.collision, authoredPosition, this.monsterRadius(definition), 14);
        const uid = `${table.id}-${i}`;
        this.monsters.push({
          uid, definition, x: position.x, y: position.y, home: { ...position },
          hp: definition.hp, maxHp: definition.hp, wanderAngle: seeded(`${table.id}:${i}:a`) * Math.PI * 2,
          hurtFlash: 0, attackCooldown: 0,
          abilityCooldowns: Object.fromEntries((definition.abilities ?? []).map((ability) => [
            ability.id,
            Math.max(1.5, ability.cooldown * 0.45 + seeded(`${uid}:${ability.id}`) * 1.5),
          ])),
          abilitySequence: 0,
          alive: true, respawn: 0, activeEffects: [],
        });
      }
    }
    const now = Date.now();
    for (const definition of map.resourceNodes ?? []) {
      const position = nearestWalkablePoint(this.map, this.collision, definition.position, 12, 12);
      const availableAt = this.resourceCooldowns[this.resourceKey(definition.id)] ?? 0;
      this.resources.push({
        definition, ...position, available: availableAt <= now,
        respawn: Math.max(0, (availableAt - now) / 1000),
      });
    }
    this.advanceQuestObjectives('visit', this.map.id, 1);
  }

  update(input: InputActions, deltaSeconds: number): SimEvent[] {
    const dt = Math.min(deltaSeconds, 0.05);
    for (const member of this.party) {
      member.attackCooldown = Math.max(0, member.attackCooldown - dt);
      member.invulnerable = Math.max(0, member.invulnerable - dt);
      member.comboWindow = Math.max(0, member.comboWindow - dt);
      if (member.comboWindow === 0) member.combo = 0;
      member.mp = Math.min(member.maxMp, member.mp + dt * (member.role === 'magic' || member.role === 'support' ? 4.2 : 3));
      for (const skillId of member.skillIds) member.skillCooldowns[skillId] = Math.max(0, (member.skillCooldowns[skillId] ?? 0) - dt);
      this.tickMemberEffects(member, dt);
    }
    for (const monster of this.monsters) monster.activeEffects = tickEffects(monster.activeEffects, dt);
    this.updateResources();

    this.updateMovement(input, dt);
    this.updateFormation(dt);
    for (const request of input.skillRequests) this.castSkill(request.memberId, request.skillId, true);
    this.updatePartyCombat(input);
    for (const monster of this.monsters) this.updateMonster(monster, dt);

    const events = this.events;
    this.events = [];
    return events;
  }

  nearestLivingMonster(maxDistance = Number.POSITIVE_INFINITY): MonsterState | undefined {
    return this.nearestMonsterFrom(this.player, maxDistance);
  }

  nearestResource(maxDistance = Number.POSITIVE_INFINITY): ResourceNodeState | undefined {
    return this.resources.filter((node) => dist(node, this.player) <= maxDistance)
      .sort((a, b) => Number(b.available) - Number(a.available) || dist(a, this.player) - dist(b, this.player))[0];
  }

  skillDefinition(skillId: string): SkillDefinition | undefined { return this.skills.get(skillId); }
  jobDefinition(jobId: string): JobDefinition | undefined { return this.jobs.get(jobId); }
  masteryDefinition(masteryId: string): JobMasteryDefinition | undefined {
    for (const job of this.jobs.values()) {
      const mastery = job.masteries?.find((candidate) => candidate.id === masteryId);
      if (mastery) return mastery;
    }
    return undefined;
  }

  evolutionDefinition(evolutionId: string): JobEvolutionDefinition | undefined {
    for (const job of this.jobs.values()) {
      const evolution = job.evolutions?.find((candidate) => candidate.id === evolutionId);
      if (evolution) return evolution;
    }
    return undefined;
  }

  skillLoadoutOptions(memberId: string): SkillDefinition[] {
    const member = this.party.find((candidate) => candidate.id === memberId);
    const job = member ? this.jobs.get(member.jobId) : undefined;
    if (!member || !job) return [];
    return [...this.skills.values()].filter((skill) => this.skillBelongsToJob(job, skill, member.evolutionId));
  }

  toggleSkillLoadout(memberId: string, skillId: string): SimEvent[] {
    const member = this.party.find((candidate) => candidate.id === memberId);
    const job = member ? this.jobs.get(member.jobId) : undefined;
    const skill = this.skills.get(skillId);
    if (!member || !job || !skill || !this.skillBelongsToJob(job, skill, member.evolutionId)) {
      this.events.push({ type: 'skill-loadout-blocked', memberId, skillId, reason: 'path' });
      return this.flushEvents();
    }
    if (member.level < (skill.requiredLevel ?? 1)) {
      this.events.push({ type: 'skill-loadout-blocked', memberId, skillId, reason: 'level' });
      return this.flushEvents();
    }
    if (skill.unlockQuestId && !this.isQuestCompleted(skill.unlockQuestId)) {
      this.events.push({ type: 'skill-loadout-blocked', memberId, skillId, reason: 'quest' });
      return this.flushEvents();
    }
    if (member.skillIds.includes(skill.id)) {
      if (member.skillIds.length <= 1) {
        this.events.push({ type: 'skill-loadout-blocked', memberId, skillId, reason: 'minimum' });
        return this.flushEvents();
      }
      member.skillIds = member.skillIds.filter((id) => id !== skill.id);
      delete member.skillCooldowns[skill.id];
      this.events.push({ type: 'skill-loadout-changed', memberId, skillId, equipped: false });
      return this.flushEvents();
    }
    if (member.skillIds.length >= MAX_SKILL_SLOTS) {
      this.events.push({ type: 'skill-loadout-blocked', memberId, skillId, reason: 'slots' });
      return this.flushEvents();
    }
    member.skillIds.push(skill.id);
    member.skillCooldowns[skill.id] = 0;
    this.events.push({ type: 'skill-loadout-changed', memberId, skillId, equipped: true });
    return this.flushEvents();
  }
  advancedJobDefinitions(): JobDefinition[] {
    return [...this.jobs.values()].filter((job) => (job.tier ?? 0) > 0 && job.baseClassId === 'novice');
  }
  itemDefinition(itemId: string): ItemDefinition | undefined { return this.items.get(itemId); }
  shopDefinition(npcId: string): ShopDefinition | undefined { return this.shopsByNpc.get(npcId); }
  recipeDefinition(recipeId: string): RecipeDefinition | undefined { return this.recipes.get(recipeId); }
  warpDestinations(): WarpDestination[] { return [...(this.regions.get(this.map.regionId ?? '')?.warpTable ?? [])]; }
  questDefinition(questId: string): QuestDefinition | undefined { return this.questCatalog.get(questId); }
  isQuestCompleted(questId: string): boolean {
    return this.quests.some((quest) => quest.questId === questId && quest.status === 'completed');
  }
  isQuestStarted(questId: string): boolean {
    return this.quests.some((quest) => quest.questId === questId);
  }
  isCampaignCompleted(): boolean {
    return this.quests.some((state) => state.status === 'completed' && this.questCatalog.get(state.questId)?.completesCampaign);
  }

  private nextSequence(sequences: Map<string, number>, key: string): number {
    const sequence = (sequences.get(key) ?? 0) + 1;
    sequences.set(key, sequence);
    return sequence;
  }

  private seededRoll(kind: 'gather' | 'drop', subjectId: string, sequence: number, channel: string): number {
    return seeded(`${this.rngSalt}:${kind}:${subjectId}:${sequence}:${channel}`);
  }

  gatherResource(nodeId: string): SimEvent[] {
    const node = this.resources.find((candidate) => candidate.definition.id === nodeId);
    if (!node) return this.blockResource(nodeId, 'node');
    this.updateResources();
    if (!node.available) return this.blockResource(nodeId, 'cooldown');
    if (dist(node, this.player) > 74) return this.blockResource(nodeId, 'range');
    if ((node.definition.requiredLevel ?? 1) > this.player.level) return this.blockResource(nodeId, 'level');
    const sequence = this.nextSequence(this.gatherSequences, node.definition.id);
    const baseCount = node.definition.minCount
      + Math.floor(this.seededRoll('gather', node.definition.id, sequence, 'count') * (node.definition.maxCount - node.definition.minCount + 1));
    const bonus = this.dropRateBonus() > 0
      && this.seededRoll('gather', node.definition.id, sequence, 'bonus') * 100 < this.dropRateBonus() ? 1 : 0;
    const count = baseCount + bonus;
    this.addItem(node.definition.itemId, count);
    const availableAt = Date.now() + node.definition.respawnSeconds * 1000;
    this.resourceCooldowns[this.resourceKey(node.definition.id)] = availableAt;
    node.available = false;
    node.respawn = node.definition.respawnSeconds;
    this.events.push({
      type: 'resource-gathered', nodeId: node.definition.id,
      itemId: node.definition.itemId, count, bonus,
    });
    return this.flushEvents();
  }

  jobChangeCost(memberId: string, jobId: string): number {
    const member = this.party.find((candidate) => candidate.id === memberId);
    if (!member || member.jobId === jobId) return 0;
    return (this.jobs.get(member.jobId)?.tier ?? 0) > 0 ? JOB_RETRAIN_COST : 0;
  }

  changeJob(memberId: string, jobId: string): SimEvent[] {
    const member = this.party.find((candidate) => candidate.id === memberId);
    const job = this.jobs.get(jobId);
    if (!member || !job || (job.tier ?? 0) <= 0 || job.baseClassId !== 'novice') {
      this.events.push({ type: 'job-change-blocked', memberId, jobId, reason: 'path' });
      return this.flushEvents();
    }
    if (member.jobId === job.id) {
      this.events.push({ type: 'job-change-blocked', memberId, jobId, reason: 'same' });
      return this.flushEvents();
    }
    if (member.level < (job.requiredLevel ?? 1)) {
      this.events.push({ type: 'job-change-blocked', memberId, jobId, reason: 'level' });
      return this.flushEvents();
    }
    const goldCost = this.jobChangeCost(member.id, job.id);
    if (this.gold < goldCost) {
      this.events.push({ type: 'job-change-blocked', memberId, jobId, reason: 'gold' });
      return this.flushEvents();
    }
    const fromJobId = member.jobId;
    this.gold -= goldCost;
    this.applyJob(member, job);
    this.events.push({ type: 'job-changed', memberId: member.id, fromJobId, jobId: job.id, goldCost });
    return this.flushEvents();
  }

  masteryChangeCost(memberId: string, masteryId: string): number {
    const member = this.party.find((candidate) => candidate.id === memberId);
    if (!member || member.masteryId === masteryId) return 0;
    return member.masteryId ? MASTERY_RETRAIN_COST : 0;
  }

  masteryBonuses(memberId: string): JobMasteryBonuses {
    const member = this.party.find((candidate) => candidate.id === memberId);
    return { ...(member ? this.masteryFor(member)?.bonuses : undefined) };
  }

  chooseMastery(memberId: string, masteryId: string): SimEvent[] {
    const member = this.party.find((candidate) => candidate.id === memberId);
    const mastery = member ? this.jobs.get(member.jobId)?.masteries?.find((candidate) => candidate.id === masteryId) : undefined;
    if (!member || !mastery) {
      this.events.push({ type: 'mastery-change-blocked', memberId, masteryId, reason: 'path' });
      return this.flushEvents();
    }
    if (member.masteryId === mastery.id) {
      this.events.push({ type: 'mastery-change-blocked', memberId, masteryId, reason: 'same' });
      return this.flushEvents();
    }
    if (member.level < mastery.requiredLevel) {
      this.events.push({ type: 'mastery-change-blocked', memberId, masteryId, reason: 'level' });
      return this.flushEvents();
    }
    const goldCost = this.masteryChangeCost(member.id, mastery.id);
    if (this.gold < goldCost) {
      this.events.push({ type: 'mastery-change-blocked', memberId, masteryId, reason: 'gold' });
      return this.flushEvents();
    }
    const fromMasteryId = member.masteryId;
    const previousMaxHp = member.maxHp;
    const previousMaxMp = member.maxMp;
    this.gold -= goldCost;
    member.masteryId = mastery.id;
    this.syncDerivedResources(member, previousMaxHp, previousMaxMp);
    this.events.push({ type: 'mastery-changed', memberId, fromMasteryId, masteryId: mastery.id, goldCost });
    return this.flushEvents();
  }

  evolutionChangeCost(memberId: string, evolutionId: string): number {
    const member = this.party.find((candidate) => candidate.id === memberId);
    if (!member || member.evolutionId === evolutionId) return 0;
    return member.evolutionId ? EVOLUTION_RETRAIN_COST : 0;
  }

  evolutionBonuses(memberId: string): JobMasteryBonuses {
    const member = this.party.find((candidate) => candidate.id === memberId);
    return { ...(member ? this.evolutionFor(member)?.bonuses : undefined) };
  }

  chooseEvolution(memberId: string, evolutionId: string): SimEvent[] {
    const member = this.party.find((candidate) => candidate.id === memberId);
    const job = member ? this.jobs.get(member.jobId) : undefined;
    const evolution = job?.evolutions?.find((candidate) => candidate.id === evolutionId);
    if (!member || !job || !evolution) {
      this.events.push({ type: 'evolution-change-blocked', memberId, evolutionId, reason: 'path' });
      return this.flushEvents();
    }
    if (member.evolutionId === evolution.id) {
      this.events.push({ type: 'evolution-change-blocked', memberId, evolutionId, reason: 'same' });
      return this.flushEvents();
    }
    if (member.level < evolution.requiredLevel) {
      this.events.push({ type: 'evolution-change-blocked', memberId, evolutionId, reason: 'level' });
      return this.flushEvents();
    }
    if (!this.isQuestCompleted(evolution.unlockQuestId)) {
      this.events.push({ type: 'evolution-change-blocked', memberId, evolutionId, reason: 'quest' });
      return this.flushEvents();
    }
    const goldCost = this.evolutionChangeCost(member.id, evolution.id);
    if (this.gold < goldCost) {
      this.events.push({ type: 'evolution-change-blocked', memberId, evolutionId, reason: 'gold' });
      return this.flushEvents();
    }
    const fromEvolutionId = member.evolutionId;
    const previousMaxHp = member.maxHp;
    const previousMaxMp = member.maxMp;
    this.gold -= goldCost;
    member.evolutionId = evolution.id;
    member.className = evolution.displayName;
    member.skillIds = member.skillIds.filter((skillId) => {
      const skill = this.skills.get(skillId);
      return Boolean(skill && this.skillAvailableFor(job, member.level, skill, evolution.id));
    });
    member.skillCooldowns = Object.fromEntries(member.skillIds.map((skillId) => [skillId, member.skillCooldowns[skillId] ?? 0]));
    this.syncDerivedResources(member, previousMaxHp, previousMaxMp);
    this.events.push({ type: 'evolution-changed', memberId, fromEvolutionId, evolutionId: evolution.id, goldCost });
    return this.flushEvents();
  }

  buyPriceMultiplier(): number {
    return Math.max(0.5, 1 + (this.partyPassiveAmount('buyPrice') + this.partyProgressionAmount('buyPrice')) / 100);
  }

  dropRateBonus(): number { return Math.max(0, this.partyPassiveAmount('dropRate') + this.partyProgressionAmount('dropRate')); }

  stackSizeBonus(): number { return Math.max(0, this.partyPassiveAmount('stackMax') + this.partyProgressionAmount('stackMax')); }

  useItem(itemId: string): SimEvent[] {
    const item = this.items.get(itemId);
    const stack = this.inventory.find((candidate) => candidate.itemId === itemId && candidate.count > 0);
    if (!item || !stack) {
      this.events.push({ type: 'item-blocked', itemId, reason: 'missing' });
      return this.flushEvents();
    }
    if ((item.levelReq ?? 1) > this.player.level) {
      this.events.push({ type: 'item-blocked', itemId, reason: 'level' });
      return this.flushEvents();
    }
    if (item.kind === 'equipment' && item.slot) {
      return this.equipItem(this.player.id, itemId);
    }
    if (item.kind !== 'consumable' || !item.effect) {
      this.events.push({ type: 'item-blocked', itemId, reason: 'type' });
      return this.flushEvents();
    }
    if (item.effect.type === 'heal') {
      const target = this.party.filter((member) => member.hp > 0 && member.hp < member.maxHp)
        .sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0] ?? this.player;
      const amount = Math.min(item.effect.amount ?? 0, target.maxHp - target.hp);
      if (amount <= 0) return this.blockItem(itemId, 'full');
      target.hp += amount;
      this.consumeItem(stack);
      this.events.push({ type: 'item-used', itemId, memberId: target.id, amount });
      return this.flushEvents();
    }
    if (item.effect.type === 'restore' && item.effect.stat === 'mp') {
      const target = this.party.filter((member) => member.hp > 0 && member.mp < member.maxMp)
        .sort((a, b) => a.mp / a.maxMp - b.mp / b.maxMp)[0] ?? this.player;
      const amount = Math.min(item.effect.amount ?? 0, target.maxMp - target.mp);
      if (amount <= 0) return this.blockItem(itemId, 'full');
      target.mp += amount;
      this.consumeItem(stack);
      this.events.push({ type: 'item-used', itemId, memberId: target.id, amount });
      return this.flushEvents();
    }
    if (item.effect.type === 'restore' && item.effect.stat === 'stamina') {
      const amount = Math.min(item.effect.amount ?? 0, this.player.maxStamina - this.player.stamina);
      if (amount <= 0) return this.blockItem(itemId, 'full');
      this.player.stamina += amount;
      this.consumeItem(stack);
      this.events.push({ type: 'item-used', itemId, memberId: this.player.id, amount });
      return this.flushEvents();
    }
    if (item.effect.type === 'buff' && item.effect.stat && item.effect.amount !== undefined && item.effect.duration) {
      this.applyItemEffect(this.player, item);
      this.consumeItem(stack);
      this.events.push({ type: 'item-used', itemId, memberId: this.player.id, amount: item.effect.amount });
      return this.flushEvents();
    }
    if (item.effect.type === 'cure' && item.effect.target) {
      const status = item.effect.target;
      const target = this.party.filter((member) => member.activeEffects.some((effect) => effect.stat === status))
        .sort((a, b) => b.activeEffects.filter((effect) => effect.stat === status)
          .reduce((sum, effect) => sum + effect.remaining, 0) - a.activeEffects.filter((effect) => effect.stat === status)
          .reduce((sum, effect) => sum + effect.remaining, 0))[0];
      if (!target) return this.blockItem(itemId, 'condition');
      target.activeEffects = target.activeEffects.filter((effect) => effect.stat !== status);
      this.consumeItem(stack);
      this.events.push({ type: 'status-cured', memberId: target.id, status });
      this.events.push({ type: 'item-used', itemId, memberId: target.id });
      return this.flushEvents();
    }
    if (item.effect.type === 'warp' && item.effect.target) {
      if (item.effect.target === 'warp_hearthvale' && ['hearthvale_town_ro', 'hearthvale_town'].includes(this.map.id)) {
        return this.blockItem(itemId, 'location');
      }
      this.consumeItem(stack);
      this.events.push({ type: 'item-used', itemId, memberId: this.player.id });
      this.events.push({ type: 'warp-requested', itemId, target: item.effect.target });
      return this.flushEvents();
    }
    this.events.push({ type: 'item-blocked', itemId, reason: 'type' });
    return this.flushEvents();
  }

  equipItem(memberId: string, itemId: string): SimEvent[] {
    const member = this.party.find((candidate) => candidate.id === memberId);
    const item = this.items.get(itemId);
    if (!member || !item || this.inventoryCount(itemId) <= 0) {
      this.events.push({ type: 'item-blocked', itemId, reason: 'missing' });
      return this.flushEvents();
    }
    if ((item.levelReq ?? 1) > member.level) {
      this.events.push({ type: 'item-blocked', itemId, reason: 'level' });
      return this.flushEvents();
    }
    if (item.kind !== 'equipment' || !item.slot) {
      this.events.push({ type: 'item-blocked', itemId, reason: 'type' });
      return this.flushEvents();
    }
    const loadout = this.equipment[member.id] ?? (this.equipment[member.id] = {});
    if (loadout[item.slot] === item.id) return this.flushEvents();
    if (this.inventoryCount(item.id) <= this.equippedCount(item.id)) {
      this.events.push({ type: 'item-blocked', itemId, reason: 'assigned' });
      return this.flushEvents();
    }
    const previousMaxHp = member.maxHp;
    const previousItemId = loadout[item.slot];
    if (previousItemId && previousItemId !== item.id) this.releaseRune(member.id, item.slot);
    loadout[item.slot] = item.id;
    this.syncEquipmentHealth(member, previousMaxHp);
    this.events.push({ type: 'item-equipped', itemId, memberId: member.id, slot: item.slot });
    return this.flushEvents();
  }

  unequipItem(memberId: string, slot: EquipmentSlot): SimEvent[] {
    const member = this.party.find((candidate) => candidate.id === memberId);
    const loadout = this.equipment[memberId];
    const itemId = loadout?.[slot];
    if (!member || !itemId) return this.flushEvents();
    const previousMaxHp = member.maxHp;
    this.releaseRune(memberId, slot);
    delete loadout[slot];
    this.syncEquipmentHealth(member, previousMaxHp);
    this.events.push({ type: 'item-unequipped', itemId, memberId, slot });
    return this.flushEvents();
  }

  equipmentStats(memberId: string): EquipmentStats {
    return equipmentStatsForMember(this.equipment, [...this.items.values()], memberId, this.sockets);
  }

  equippedCount(itemId: string): number {
    return Object.values(this.equipment).reduce((count, loadout) =>
      count + Object.values(loadout).filter((equippedId) => equippedId === itemId).length, 0);
  }

  socketRune(memberId: string, slot: EquipmentSlot, runeId: string): SimEvent[] {
    const member = this.party.find((candidate) => candidate.id === memberId);
    const rune = this.items.get(runeId);
    if (!member) return this.blockRune(memberId, slot, runeId, 'member');
    if (!this.equipment[memberId]?.[slot]) return this.blockRune(memberId, slot, runeId, 'equipment');
    if (!rune || this.inventoryCount(runeId) <= 0) return this.blockRune(memberId, slot, runeId, 'missing');
    if ((rune.levelReq ?? 1) > member.level) return this.blockRune(memberId, slot, runeId, 'level');
    if (rune.kind !== 'rune' || !rune.runeStats) return this.blockRune(memberId, slot, runeId, 'type');
    if (!rune.runeSlots?.includes(slot)) return this.blockRune(memberId, slot, runeId, 'slot');
    const memberSockets = this.sockets[memberId] ?? (this.sockets[memberId] = {});
    const replacedRuneId = memberSockets[slot];
    if (replacedRuneId === runeId) return this.flushEvents();
    if (this.inventoryCount(runeId) <= this.socketedCount(runeId)) return this.blockRune(memberId, slot, runeId, 'assigned');
    const previousMaxHp = member.maxHp;
    memberSockets[slot] = runeId;
    this.syncEquipmentHealth(member, previousMaxHp);
    this.events.push({ type: 'rune-socketed', runeId, memberId, slot, replacedRuneId });
    return this.flushEvents();
  }

  unsocketRune(memberId: string, slot: EquipmentSlot): SimEvent[] {
    const member = this.party.find((candidate) => candidate.id === memberId);
    const runeId = this.sockets[memberId]?.[slot];
    if (!member || !runeId) return this.flushEvents();
    const previousMaxHp = member.maxHp;
    this.releaseRune(memberId, slot);
    this.syncEquipmentHealth(member, previousMaxHp);
    return this.flushEvents();
  }

  socketedCount(runeId: string): number {
    return Object.values(this.sockets).reduce((count, loadout) =>
      count + Object.values(loadout).filter((socketedId) => socketedId === runeId).length, 0);
  }

  attackIntervalFor(memberId: string): number {
    const member = this.party.find((candidate) => candidate.id === memberId);
    if (!member) return 0;
    const speedReduction = Math.min(0.45, this.equipmentBonus(member.id, 'spd') * 0.02
      + (effectAmount(member.activeEffects, 'spd') + this.progressionBonus(member, 'spd')) / 100);
    const drenchedPenalty = Math.min(0.65, effectAmount(member.activeEffects, 'drenched') / 100);
    return member.attackInterval * (1 - speedReduction) * (1 + drenchedPenalty);
  }

  buyItem(npcId: string, itemId: string): SimEvent[] {
    const shop = this.shopsByNpc.get(npcId);
    if (!shop) return this.blockEconomy('buy', itemId, 'merchant');
    if (!shop.itemIds.includes(itemId)) return this.blockEconomy('buy', itemId, 'stock');
    const item = this.items.get(itemId);
    if (!item || item.buyPrice === undefined || item.kind === 'quest' || item.tradable === false) {
      return this.blockEconomy('buy', itemId, 'protected');
    }
    const price = Math.max(1, Math.ceil(item.buyPrice * this.buyPriceMultiplier()));
    if (this.gold < price) return this.blockEconomy('buy', itemId, 'gold');
    this.gold -= price;
    this.addItem(item.id, 1);
    this.events.push({ type: 'economy-transaction', action: 'buy', itemId: item.id, count: 1, goldDelta: -price });
    return this.flushEvents();
  }

  sellItem(npcId: string, itemId: string): SimEvent[] {
    if (!this.shopsByNpc.has(npcId)) return this.blockEconomy('sell', itemId, 'merchant');
    const item = this.items.get(itemId);
    const stack = this.inventory.find((candidate) => candidate.itemId === itemId && candidate.count > 0);
    if (!item || !stack) return this.blockEconomy('sell', itemId, 'stock');
    if (item.kind === 'quest' || item.tradable === false) return this.blockEconomy('sell', itemId, 'protected');
    if (this.inventoryCount(itemId) <= this.equippedCount(itemId) + this.socketedCount(itemId)) return this.blockEconomy('sell', itemId, 'equipped');
    this.consumeItem(stack);
    this.gold += item.sellPrice;
    this.events.push({ type: 'economy-transaction', action: 'sell', itemId: item.id, count: 1, goldDelta: item.sellPrice });
    return this.flushEvents();
  }

  craftRecipe(npcId: string, recipeId: string): SimEvent[] {
    const recipe = this.recipes.get(recipeId);
    if (!recipe || !recipe.stationNpcIds.includes(npcId)) return this.blockEconomy('craft', recipeId, 'merchant');
    if ((recipe.requiredLevel ?? 1) > this.player.level) return this.blockEconomy('craft', recipeId, 'level');
    if (this.gold < recipe.goldCost) return this.blockEconomy('craft', recipeId, 'gold');
    if (!this.hasItems(recipe.ingredients)) return this.blockEconomy('craft', recipeId, 'items');
    this.removeItems(recipe.ingredients);
    this.gold -= recipe.goldCost;
    this.addItem(recipe.result.itemId, recipe.result.count);
    this.events.push({
      type: 'economy-transaction', action: 'craft', itemId: recipe.result.itemId,
      count: recipe.result.count, goldDelta: -recipe.goldCost, recipeId: recipe.id,
    });
    return this.flushEvents();
  }

  travelByCourier(warpId: string): SimEvent[] {
    const destination = this.warpDestinations().find((warp) => warp.id === warpId);
    if (!destination) return this.blockCourierWarp(warpId, 'destination');
    if (destination.targetMapId === this.map.id) return this.blockCourierWarp(warpId, 'location');
    if ((destination.requiredLevel ?? 1) > this.player.level) return this.blockCourierWarp(warpId, 'level');
    if (destination.unlockQuestId && !this.isQuestCompleted(destination.unlockQuestId)) return this.blockCourierWarp(warpId, 'quest');
    if (this.gold < destination.cost) return this.blockCourierWarp(warpId, 'gold');
    this.gold -= destination.cost;
    this.events.push({
      type: 'courier-warp-requested', warpId: destination.id, targetMapId: destination.targetMapId,
      targetSpawn: { ...destination.targetSpawn }, goldCost: destination.cost,
    });
    return this.flushEvents();
  }

  interactWithNpc(npc: NpcDefinition): SimEvent[] {
    const ready = this.quests.find((state) => {
      if (state.status !== 'ready') return false;
      const quest = this.questCatalog.get(state.questId);
      return (quest?.completionNpcId ?? quest?.giverNpcId) === npc.id;
    });
    if (ready) {
      const quest = this.questCatalog.get(ready.questId);
      if (quest && this.hasItems(quest.turnInItems ?? [])) this.completeQuest(ready);
      return this.flushEvents();
    }

    for (const quest of this.questsByGiver.get(npc.id) ?? []) {
      if ((quest.requiredLevel ?? 1) > this.player.level) continue;
      const state = this.quests.find((candidate) => candidate.questId === quest.id);
      if (!state) {
        if (!(quest.prerequisiteQuestIds ?? []).every((questId) => this.isQuestCompleted(questId))) continue;
        if ((quest.prerequisiteAnyQuestIds?.length ?? 0) > 0
          && !quest.prerequisiteAnyQuestIds!.some((questId) => this.isQuestCompleted(questId))) continue;
        if ((quest.exclusiveQuestIds ?? []).some((questId) => this.isQuestStarted(questId))) continue;
        for (const stack of quest.startItems ?? []) this.addItem(stack.itemId, stack.count);
        const objectiveProgress = Object.fromEntries((quest.objectives ?? []).map((objective) => {
          const progress = objective.kind === 'collect'
            ? Math.min(objective.count, this.inventoryCount(objective.targetId))
            : objective.kind === 'visit' && objective.targetId === this.map.id ? objective.count : 0;
          return [objective.id, progress];
        }));
        const target = (quest.objectives ?? []).reduce((sum, objective) => sum + objective.count, 0);
        const next: QuestState = { questId: quest.id, status: 'active', progress: 0, target, objectiveProgress };
        this.syncQuestTotals(next, quest);
        this.quests.push(next);
        this.events.push({ type: 'quest-started', questId: quest.id });
        return this.flushEvents();
      }
    }
    return [];
  }

  private updateMovement(input: InputActions, dt: number): void {
    const magnitude = Math.hypot(input.x, input.y);
    if (this.sprintRecoveryLocked && this.player.stamina >= 20) this.sprintRecoveryLocked = false;
    const sprinting = magnitude > 0 && input.sprint && !this.sprintRecoveryLocked && this.player.stamina > 0;
    this.player.stamina = Math.max(0, Math.min(this.player.maxStamina,
      this.player.stamina + (sprinting ? -SPRINT_STAMINA_DRAIN : STAMINA_RECOVERY) * dt));
    if (sprinting && this.player.stamina <= 0) this.sprintRecoveryLocked = true;
    if (magnitude > 0) {
      const nx = input.x / magnitude;
      const ny = input.y / magnitude;
      this.movementFacing = { x: nx, y: ny };
      this.player.facing = { x: nx, y: ny };
      const speedBuff = 1 + Math.max(0, effectAmount(this.player.activeEffects, 'spd') + this.progressionBonus(this.player, 'spd')) / 100;
      const drenchedSlow = Math.min(0.65, effectAmount(this.player.activeEffects, 'drenched') / 100);
      const speed = PLAYER_SPEED * (sprinting ? 1.45 : 1) * speedBuff * (1 - drenchedSlow);
      const next = moveWithCollisions(this.map, this.collision, this.player, { x: nx * speed * dt, y: ny * speed * dt }, 12);
      this.player.x = next.x;
      this.player.y = next.y;
    }
    const halfW = this.map.gridSize.width * TILE / 2 - 24;
    const halfH = this.map.gridSize.height * TILE / 2 - 24;
    this.player.x = Math.max(-halfW, Math.min(halfW, this.player.x));
    this.player.y = Math.max(-halfH, Math.min(halfH, this.player.y));
  }

  private updateFormation(dt: number): void {
    for (let index = 1; index < this.party.length; index += 1) {
      const member = this.party[index];
      const formationPosition = this.formationPosition(this.player, this.movementFacing, index);
      const desired = nearestWalkablePoint(this.map, this.collision, formationPosition, 10, 4);
      const distance = dist(member, desired);
      if (distance > 230) {
        member.x = desired.x;
        member.y = desired.y;
      } else {
        const follow = Math.min(1, dt * 7.5);
        const next = moveWithCollisions(this.map, this.collision, member, {
          x: (desired.x - member.x) * follow,
          y: (desired.y - member.y) * follow,
        }, 10);
        member.x = next.x;
        member.y = next.y;
      }
    }
  }

  private formationPosition(anchor: Vec2, facing: Vec2, index: number): Vec2 {
    const slot = FORMATION[index];
    const right = { x: -facing.y, y: facing.x };
    return {
      x: anchor.x - facing.x * slot.back + right.x * slot.side,
      y: anchor.y - facing.y * slot.back + right.y * slot.side,
    };
  }

  private updatePartyCombat(input: InputActions): void {
    const manualCasters = new Set(input.skillRequests.map((request) => request.memberId));
    for (const member of this.party) {
      if (member.hp <= 0) continue;
      if (member.attackCooldown > 0) continue;
      if (input.autoAttack && !manualCasters.has(member.id) && this.tryAutoSkill(member)) continue;

      if (member.role === 'support' && input.autoAttack) {
        const wounded = this.lowestWoundedAlly(0.76);
        if (wounded) {
          const amount = this.healingAmount(member, 14 + member.level * 3);
          wounded.hp = Math.min(wounded.maxHp, wounded.hp + amount);
          member.attackCooldown = this.attackIntervalFor(member.id);
          this.events.push({ type: 'member-healed', memberId: wounded.id, healerId: member.id, amount });
          continue;
        }
      }

      const target = this.nearestMonsterFrom(member, member.attackRange);
      const shouldAttack = Boolean(target) && (input.autoAttack || input.attackPressed);
      if (!target || !shouldAttack) continue;
      this.faceTarget(member, target);
      this.events.push({ type: 'attack-swing', memberId: member.id, targetUid: target.uid, automatic: input.autoAttack });
      this.attack(member, target);
    }
  }

  private tryAutoSkill(member: PlayerState): boolean {
    if (member.role === 'support') {
      const wounded = this.lowestWoundedAlly(0.68);
      if (wounded && this.castSkill(member.id, 'waystar_liturgy', false)) return true;
      if (wounded && this.castSkill(member.id, 'concordant_mend', false)) return true;
      if (wounded && this.castSkill(member.id, 'mend_wounds', false)) return true;
      const unshielded = this.party.filter((ally) => ally.hp > 0 && !ally.activeEffects.some((effect) => effect.skillId === 'constellation_ward'))
        .sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
      if (unshielded && unshielded.hp / unshielded.maxHp < 0.92 && this.castSkill(member.id, 'constellation_ward', false)) return true;
      const exposed = this.party.filter((ally) => ally.hp > 0 && !ally.activeEffects.some((effect) => effect.skillId === 'warding_light'))
        .sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
      if (exposed && exposed.hp / exposed.maxHp < 0.9 && this.castSkill(member.id, 'warding_light', false)) return true;
      if (this.nearestMonsterFrom(member, member.attackRange) && this.castSkill(member.id, 'hearth_blessing', false)) return true;
      return false;
    }
    const target = this.nearestMonsterFrom(member, member.attackRange);
    if (!target) return false;
    if (member.jobId === 'novice') {
      if (member.hp / member.maxHp < 0.72 && this.castSkill(member.id, 'first_aid', false)) return true;
      return this.castSkill(member.id, 'basic_strike', false);
    }
    const priorities = member.jobId === 'warden'
      ? ['citadel_oath', 'sunward_cleave', 'rootbound_challenge', 'guard_stance', 'shield_bash', 'vale_slash']
      : member.jobId === 'ranger'
        ? ['horizon_piercer', 'meteor_fletching', 'chorus_of_arrows', 'hunters_mark', 'thornvolley', 'keen_shot']
        : member.jobId === 'channeler'
          ? ['prismatic_collapse', 'stormbloom', 'crownroot_nova', 'crystal_lance', 'ember_wisp', 'sprout_bolt']
          : member.jobId === 'shade'
            ? ['manyroad_execution', 'mirrorstep_flurry', 'pilfer', 'shadowstep', 'echo_fang', 'twin_fang']
            : member.jobId === 'wayfarer'
              ? ['provisioners_chant', 'battle_cant']
              : [];
    for (const skillId of priorities) {
      if (['citadel_oath', 'rootbound_challenge', 'guard_stance', 'provisioners_chant', 'battle_cant'].includes(skillId)
        && member.activeEffects.some((effect) => effect.skillId === skillId)) continue;
      if (skillId === 'hunters_mark' && target.activeEffects.some((effect) => effect.skillId === skillId)) continue;
      if (skillId === 'shadowstep' && member.activeEffects.some((effect) => effect.skillId === skillId)) continue;
      if (skillId === 'pilfer' && target.activeEffects.some((effect) => effect.skillId === skillId)) continue;
      if (['sunward_cleave', 'meteor_fletching', 'prismatic_collapse', 'stormbloom', 'chorus_of_arrows', 'crownroot_nova', 'thornvolley'].includes(skillId)
        && this.monsters.filter((monster) => monster.alive && dist(monster, target) <= AREA_RADIUS).length < 2) continue;
      if (this.castSkill(member.id, skillId, false)) return true;
    }
    return false;
  }

  private castSkill(memberId: string, skillId: string, notifyFailure: boolean): boolean {
    const member = this.party.find((candidate) => candidate.id === memberId);
    const skill = this.skills.get(skillId);
    if (!member || !skill || member.hp <= 0 || !member.skillIds.includes(skillId)) return false;
    if (this.isPassiveSkill(skill)) return this.blockSkill(member, skill, 'passive', notifyFailure);
    if (effectAmount(member.activeEffects, 'muted') > 0) return this.blockSkill(member, skill, 'muted', notifyFailure);
    if ((member.skillCooldowns[skillId] ?? 0) > 0) return this.blockSkill(member, skill, 'cooldown', notifyFailure);
    if (member.mp < skill.mpCost) return this.blockSkill(member, skill, 'mp', notifyFailure);

    let targetMonster: MonsterState | undefined;
    let targetMember: PlayerState | undefined;
    if (skill.targetType === 'enemy' || skill.targetType === 'area') {
      targetMonster = this.nearestMonsterFrom(member, member.attackRange + (skill.targetType === 'area' ? 20 : 0));
      if (!targetMonster) return this.blockSkill(member, skill, 'target', notifyFailure);
      this.faceTarget(member, targetMonster);
    } else if (skill.targetType === 'ally') {
      targetMember = skill.effect.kind === 'heal' ? this.lowestWoundedAlly(0.995) : this.lowestUnbuffedAlly(skill.id);
      if (!targetMember) return this.blockSkill(member, skill, 'target', notifyFailure);
    } else {
      targetMember = member;
    }

    member.mp -= skill.mpCost;
    member.skillCooldowns[skillId] = skill.cooldown;
    member.attackCooldown = Math.max(member.attackCooldown, Math.min(0.55, this.attackIntervalFor(member.id)));
    const affectedUids: string[] = [];

    if (skill.effect.kind === 'damage' && targetMonster) {
      const targets = skill.targetType === 'area'
        ? this.monsters.filter((monster) => monster.alive && dist(monster, targetMonster!) <= AREA_RADIUS)
        : [targetMonster];
      for (const target of targets) {
        affectedUids.push(target.uid);
        this.damageMonster(member, target, skill.effect.powerMultiplier ?? 1, skill.id, skill.element);
      }
    } else if (skill.effect.kind === 'heal' && targetMember) {
      const amount = this.healingAmount(member, (skill.effect.amount ?? 0) + member.level * 2.5);
      const restored = Math.min(amount, targetMember.maxHp - targetMember.hp);
      targetMember.hp += restored;
      this.events.push({ type: 'member-healed', memberId: targetMember.id, healerId: member.id, amount: restored, skillId: skill.id });
    } else if (skill.effect.kind === 'buff' && targetMember) {
      this.applyEffect(targetMember.activeEffects, skill);
    } else if ((skill.effect.kind === 'debuff' || skill.effect.kind === 'mark') && targetMonster) {
      this.applyEffect(targetMonster.activeEffects, skill);
    } else if (skill.effect.kind === 'economy' && skill.effect.stat === 'bonusDropChance' && targetMonster) {
      this.applyEffect(targetMonster.activeEffects, skill, 12);
    }

    this.events.push({
      type: 'skill-used', memberId: member.id, skillId: skill.id,
      targetUid: targetMonster?.uid, targetMemberId: targetMember?.id,
      affectedUids: affectedUids.length > 0 ? affectedUids : undefined,
    });
    return true;
  }

  private blockSkill(member: PlayerState, skill: SkillDefinition, reason: 'cooldown' | 'mp' | 'target' | 'passive' | 'muted', notify: boolean): false {
    if (notify) this.events.push({ type: 'skill-blocked', memberId: member.id, skillId: skill.id, reason });
    return false;
  }

  private applyEffect(effects: ActiveEffect[], skill: SkillDefinition, defaultDuration = 0): void {
    const stat = skill.effect.stat;
    const amount = skill.effect.amount;
    const duration = skill.effect.duration ?? defaultDuration;
    if (!stat || amount === undefined || !duration) return;
    const existing = effects.find((effect) => effect.skillId === skill.id);
    if (existing) {
      existing.remaining = duration;
      existing.amount = amount;
    } else {
      effects.push({ skillId: skill.id, stat, amount, remaining: duration });
    }
  }

  private applyItemEffect(member: PlayerState, item: ItemDefinition): void {
    const { stat, amount, duration } = item.effect ?? {};
    if (!stat || amount === undefined || !duration) return;
    const skillId = `item:${item.id}`;
    const existing = member.activeEffects.find((effect) => effect.skillId === skillId);
    if (existing) {
      existing.stat = stat;
      existing.amount = amount;
      existing.remaining = duration;
    } else {
      member.activeEffects.push({ skillId, stat, amount, remaining: duration });
    }
  }

  private applyStatus(member: PlayerState, status: string, amount: number, duration: number): void {
    const skillId = `status:${status}`;
    const existing = member.activeEffects.find((effect) => effect.skillId === skillId);
    if (existing) {
      existing.amount = amount;
      existing.remaining = duration;
      existing.tickTimer = 1;
    } else {
      member.activeEffects.push({ skillId, stat: status, amount, remaining: duration, tickTimer: 1 });
    }
    this.events.push({ type: 'status-applied', memberId: member.id, status, duration });
  }

  private tickMemberEffects(member: PlayerState, dt: number): void {
    const wasAlive = member.hp > 0;
    for (const effect of member.activeEffects) {
      effect.remaining = Math.max(0, effect.remaining - dt);
      if (effect.stat !== 'poison' || effect.remaining <= 0 || member.hp <= 0) continue;
      effect.tickTimer = (effect.tickTimer ?? 1) - dt;
      while (effect.tickTimer <= 0 && member.hp > 0) {
        const amount = Math.min(member.hp, Math.max(1, Math.round(effect.amount)));
        member.hp -= amount;
        effect.tickTimer += 1;
        this.events.push({ type: 'status-damage', memberId: member.id, status: effect.stat, amount });
      }
    }
    member.activeEffects = member.activeEffects.filter((effect) => effect.remaining > 0);
    if (wasAlive && member.hp <= 0) {
      this.events.push({ type: 'member-fainted', memberId: member.id });
      if (this.party.every((candidate) => candidate.hp <= 0)) this.restorePartyAfterWipe();
    }
  }

  private attack(member: PlayerState, target: MonsterState): void {
    member.combo = member.comboWindow > 0 ? (member.combo % 3) + 1 : 1;
    member.comboWindow = 0.72;
    member.attackCooldown = this.attackIntervalFor(member.id);
    const comboMultiplier = 1 + member.combo * 0.12;
    this.damageMonster(member, target, comboMultiplier);
  }

  private damageMonster(member: PlayerState, target: MonsterState, multiplier: number, skillId?: string, element = 'neutral'): void {
    const roleBonus = member.role === 'magic' ? 5 : member.role === 'scout' ? 4 : member.role === 'ranged' ? 2 : member.role === 'artisan' ? 1 : 0;
    const attackBuff = effectAmount(member.activeEffects, 'atk');
    const gloomPenalty = effectAmount(member.activeEffects, 'gloom');
    const sunblindAmount = effectAmount(member.activeEffects, 'sunblind');
    const sunblindDamageMultiplier = 1 - Math.min(0.5, sunblindAmount / 100);
    const equipmentAttack = this.equipmentBonus(member.id, 'atk');
    const progressionAttack = this.progressionBonus(member, 'atk');
    const markedBonus = effectAmount(target.activeEffects, 'damageTaken') / 100;
    const elementModifier = elementalEffectiveness(element, target.definition.element);
    const effectiveness = elementModifier > 1.05 ? 'strong' : elementModifier < 0.95 ? 'resisted' : 'normal';
    const sequence = (this.attackSequences.get(member.id) ?? 0) + 1;
    this.attackSequences.set(member.id, sequence);
    const criticalChance = Math.max(0, Math.min(100, this.equipmentBonus(member.id, 'crit') + this.progressionBonus(member, 'crit') - sunblindAmount));
    const critical = seeded(`${member.id}:attack:${sequence}`) * 100 < criticalChance;
    const criticalMultiplier = critical ? 1.5 : 1;
    const progressionPower = 1 + this.progressionBonus(member, 'powerPercent') / 100;
    const amount = Math.max(4, Math.round(((14 + member.level * 2.8 + roleBonus + attackBuff + equipmentAttack + progressionAttack - gloomPenalty) * member.power * progressionPower * multiplier - target.definition.def * 0.5) * (1 + markedBonus) * elementModifier * criticalMultiplier * sunblindDamageMultiplier));
    target.hp -= amount;
    target.hurtFlash = 0.16;
    const defeated = target.hp <= 0;
    if (defeated) {
      target.alive = false;
      target.respawn = 7;
      target.telegraph = undefined;
      this.gainXp(18 + target.definition.baseLevel * 8);
      this.rollDrops(target);
      this.advanceQuestObjectives('defeat', target.definition.id, 1);
    }
    this.events.push({ type: 'monster-hit', memberId: member.id, uid: target.uid, amount, defeated, critical, skillId, element, effectiveness });
  }

  private gainXp(amount: number): void {
    this.player.xp += amount;
    while (this.player.xp >= this.player.xpNext) {
      this.player.xp -= this.player.xpNext;
      this.player.level += 1;
      this.player.xpNext = Math.round(this.player.xpNext * 1.35);
      for (const member of this.party) {
        member.level = this.player.level;
        member.xp = this.player.xp;
        member.xpNext = this.player.xpNext;
        const growth = this.jobs.get(member.jobId)?.growth;
        member.baseMaxHp += growth?.hp ?? (member.role === 'melee' ? 24 : member.role === 'support' ? 17 : 14);
        member.baseMaxMp += growth?.mp ?? (member.role === 'magic' || member.role === 'support' ? 12 : 7);
        member.maxHp = member.baseMaxHp + this.equipmentBonus(member.id, 'hp') + this.progressionBonus(member, 'hp');
        member.maxMp = member.baseMaxMp + this.progressionBonus(member, 'mp');
        member.hp = member.maxHp;
        member.mp = member.maxMp;
      }
      this.events.push({ type: 'level-up', level: this.player.level });
    }
    for (const member of this.party) {
      member.xp = this.player.xp;
      member.xpNext = this.player.xpNext;
    }
  }

  private rollDrops(monster: MonsterState): void {
    const table = this.dropsByMonster.get(monster.definition.id);
    if (!table) return;
    const totalWeight = table.entries.reduce((sum, entry) => sum + entry.weight, 0);
    if (totalWeight <= 0) return;
    const bonusChance = this.dropRateBonus() + Math.max(0, effectAmount(monster.activeEffects, 'bonusDropChance'));
    const sequence = this.nextSequence(this.dropSequences, monster.uid);
    const roll = this.seededRoll('drop', monster.uid, sequence, 'eligible') * 100;
    if (roll > Math.min(100, totalWeight + bonusChance)) return;
    let pick = this.seededRoll('drop', monster.uid, sequence, 'entry') * totalWeight;
    for (const entry of table.entries) {
      pick -= entry.weight;
      if (pick > 0) continue;
      const count = entry.minCount
        + Math.floor(this.seededRoll('drop', monster.uid, sequence, 'count') * (entry.maxCount - entry.minCount + 1));
      this.addItem(entry.itemId, count);
      this.events.push({ type: 'item-loot', itemId: entry.itemId, count });
      return;
    }
  }

  private addItem(itemId: string, count: number): void {
    this.advanceQuestObjectives('collect', itemId, count);
    const item = this.items.get(itemId);
    const stackBonus = item?.kind === 'consumable' || item?.kind === 'material' ? this.stackSizeBonus() : 0;
    const stackMax = (item?.stackMax ?? 99) + stackBonus;
    let remaining = count;
    for (const stack of this.inventory.filter((candidate) => candidate.itemId === itemId && candidate.count < stackMax)) {
      const added = Math.min(remaining, stackMax - stack.count);
      stack.count += added;
      remaining -= added;
      if (remaining <= 0) return;
    }
    while (remaining > 0) {
      const added = Math.min(remaining, stackMax);
      this.inventory.push({ itemId, count: added });
      remaining -= added;
    }
  }

  private consumeItem(stack: InventoryStack): void {
    stack.count = Math.max(0, stack.count - 1);
  }

  private blockItem(itemId: string, reason: Extract<SimEvent, { type: 'item-blocked' }>['reason']): SimEvent[] {
    this.events.push({ type: 'item-blocked', itemId, reason });
    return this.flushEvents();
  }

  private applyJob(member: PlayerState, job: JobDefinition): void {
    const previousMaxHp = member.maxHp;
    const previousMaxMp = member.maxMp;
    const profile = JOB_COMBAT_PROFILES[job.id] ?? {
      role: job.role,
      attackInterval: member.attackInterval,
      attackRange: member.attackRange,
      power: member.power,
    };
    const skillIds = job.startingSkills.filter((skillId) => this.skills.has(skillId));
    member.jobId = job.id;
    member.masteryId = undefined;
    member.evolutionId = undefined;
    member.className = job.displayName;
    member.role = profile.role;
    member.attackInterval = profile.attackInterval;
    member.attackRange = profile.attackRange;
    member.power = profile.power;
    member.skillIds = skillIds;
    member.skillCooldowns = Object.fromEntries(skillIds.map((skillId) => [skillId, 0]));
    member.attackCooldown = 0;
    member.combo = 0;
    member.comboWindow = 0;
    member.activeEffects = [];
    this.syncDerivedResources(member, previousMaxHp, previousMaxMp);
    member.hp = member.maxHp;
    member.mp = member.maxMp;
    member.stamina = member.maxStamina;
  }

  private isPassiveSkill(skill: SkillDefinition): boolean {
    return skill.targetType === 'self' && skill.mpCost === 0 && skill.cooldown === 0
      && (skill.effect.kind === 'economy' || skill.effect.kind === 'gather' || skill.effect.kind === 'utility');
  }

  private partyPassiveAmount(stat: string): number {
    const skillIds = new Set(this.party.flatMap((member) => member.skillIds));
    let total = 0;
    for (const skillId of skillIds) {
      const skill = this.skills.get(skillId);
      if (!skill || !this.isPassiveSkill(skill) || skill.effect.stat !== stat) continue;
      total += skill.effect.amount ?? 0;
    }
    return total;
  }

  private masteryFor(member: PlayerState): JobMasteryDefinition | undefined {
    return this.jobs.get(member.jobId)?.masteries?.find((mastery) => mastery.id === member.masteryId);
  }

  private evolutionFor(member: PlayerState): JobEvolutionDefinition | undefined {
    return this.jobs.get(member.jobId)?.evolutions?.find((evolution) => evolution.id === member.evolutionId);
  }

  private skillBelongsToJob(job: JobDefinition, skill: SkillDefinition, evolutionId?: string): boolean {
    const pathMatch = job.startingSkills.includes(skill.id) || (skill.jobIds ?? []).includes(job.id);
    const evolutionMatch = !skill.evolutionIds?.length || Boolean(evolutionId && skill.evolutionIds.includes(evolutionId));
    return pathMatch && evolutionMatch;
  }

  private skillAvailableFor(job: JobDefinition, level: number, skill: SkillDefinition, evolutionId?: string): boolean {
    return this.skillBelongsToJob(job, skill, evolutionId)
      && level >= (skill.requiredLevel ?? 1)
      && (!skill.unlockQuestId || this.isQuestCompleted(skill.unlockQuestId));
  }

  private progressionBonus(member: PlayerState, stat: keyof JobMasteryBonuses): number {
    return (this.masteryFor(member)?.bonuses[stat] ?? 0) + (this.evolutionFor(member)?.bonuses[stat] ?? 0);
  }

  private partyProgressionAmount(stat: keyof JobMasteryBonuses): number {
    return this.party.reduce((total, member) => total + this.progressionBonus(member, stat), 0);
  }

  private healingAmount(member: PlayerState, baseAmount: number): number {
    return Math.round(baseAmount * (1 + this.progressionBonus(member, 'healingPercent') / 100));
  }

  private equipmentBonus(memberId: string, stat: keyof EquipmentStats): number {
    const gear = Object.values(this.equipment[memberId] ?? {}).reduce((sum, itemId) =>
      sum + (itemId ? this.items.get(itemId)?.stats?.[stat] ?? 0 : 0), 0);
    const member = (this.party as PlayerState[] | undefined)?.find((candidate) => candidate.id === memberId);
    const runesSuppressed = stat !== 'hp' && Boolean(member && effectAmount(member.activeEffects, 'severed') > 0);
    if (runesSuppressed) return gear;
    return gear + Object.values(this.sockets[memberId] ?? {}).reduce((sum, runeId) =>
      sum + (runeId ? this.items.get(runeId)?.runeStats?.[stat] ?? 0 : 0), 0);
  }

  private releaseRune(memberId: string, slot: EquipmentSlot): void {
    const runeId = this.sockets[memberId]?.[slot];
    if (!runeId) return;
    delete this.sockets[memberId][slot];
    this.events.push({ type: 'rune-unsocketed', runeId, memberId, slot });
  }

  private blockRune(memberId: string, slot: EquipmentSlot, runeId: string, reason: Extract<SimEvent, { type: 'rune-blocked' }>['reason']): SimEvent[] {
    this.events.push({ type: 'rune-blocked', runeId, memberId, slot, reason });
    return this.flushEvents();
  }

  private syncEquipmentHealth(member: PlayerState, previousMaxHp: number): void {
    this.syncDerivedResources(member, previousMaxHp, member.maxMp);
  }

  private syncDerivedResources(member: PlayerState, previousMaxHp: number, previousMaxMp: number): void {
    member.maxHp = member.baseMaxHp + this.equipmentBonus(member.id, 'hp') + this.progressionBonus(member, 'hp');
    member.maxMp = member.baseMaxMp + this.progressionBonus(member, 'mp');
    if (member.hp > 0) member.hp = Math.max(1, Math.min(member.maxHp, member.hp + Math.max(0, member.maxHp - previousMaxHp)));
    member.mp = Math.max(0, Math.min(member.maxMp, member.mp + Math.max(0, member.maxMp - previousMaxMp)));
  }

  private normalizeQuestState(saved: QuestState): QuestState {
    const quest = this.questCatalog.get(saved.questId);
    const objectives = quest?.objectives ?? [];
    const savedProgress = (saved as Partial<QuestState>).objectiveProgress;
    const objectiveProgress: Record<string, number> = savedProgress ? { ...savedProgress } : {};
    if (objectives.length > 0 && Object.keys(objectiveProgress).length === 0) {
      let legacyProgress = saved.status === 'ready' || saved.status === 'completed'
        ? Number.POSITIVE_INFINITY
        : Math.max(0, saved.progress ?? 0);
      for (const objective of objectives) {
        const progress = Math.min(objective.count, legacyProgress);
        objectiveProgress[objective.id] = progress;
        legacyProgress -= progress;
      }
    }
    const next: QuestState = {
      ...saved,
      objectiveProgress,
      progress: Math.max(0, saved.progress ?? 0),
      target: Math.max(0, saved.target ?? 0),
    };
    if (quest) this.syncQuestTotals(next, quest);
    return next;
  }

  private syncQuestTotals(state: QuestState, quest: QuestDefinition): void {
    const objectives = quest.objectives ?? [];
    state.target = objectives.reduce((sum, objective) => sum + objective.count, 0);
    state.progress = objectives.reduce((sum, objective) => sum + Math.min(objective.count, state.objectiveProgress[objective.id] ?? 0), 0);
    if (state.status !== 'completed') state.status = state.progress >= state.target ? 'ready' : 'active';
  }

  private inventoryCount(itemId: string): number {
    return this.inventory.filter((stack) => stack.itemId === itemId).reduce((sum, stack) => sum + stack.count, 0);
  }

  private hasItems(stacks: InventoryStack[]): boolean {
    return stacks.every((stack) => this.inventoryCount(stack.itemId) >= stack.count);
  }

  private removeItems(stacks: InventoryStack[]): void {
    for (const requirement of stacks) {
      let remaining = requirement.count;
      for (const stack of this.inventory.filter((candidate) => candidate.itemId === requirement.itemId && candidate.count > 0)) {
        const removed = Math.min(stack.count, remaining);
        stack.count -= removed;
        remaining -= removed;
        if (remaining <= 0) break;
      }
    }
  }

  private blockEconomy(action: EconomyAction, targetId: string, reason: Extract<SimEvent, { type: 'economy-blocked' }>['reason']): SimEvent[] {
    this.events.push({ type: 'economy-blocked', action, targetId, reason });
    return this.flushEvents();
  }

  private blockCourierWarp(warpId: string, reason: Extract<SimEvent, { type: 'courier-warp-blocked' }>['reason']): SimEvent[] {
    this.events.push({ type: 'courier-warp-blocked', warpId, reason });
    return this.flushEvents();
  }

  private blockResource(nodeId: string, reason: Extract<SimEvent, { type: 'resource-blocked' }>['reason']): SimEvent[] {
    this.events.push({ type: 'resource-blocked', nodeId, reason });
    return this.flushEvents();
  }

  private resourceKey(nodeId: string): string { return `${this.map.id}:${nodeId}`; }

  private updateResources(): void {
    const now = Date.now();
    for (const node of this.resources) {
      const availableAt = this.resourceCooldowns[this.resourceKey(node.definition.id)] ?? 0;
      node.available = availableAt <= now;
      node.respawn = Math.max(0, (availableAt - now) / 1000);
      if (node.available && availableAt > 0) delete this.resourceCooldowns[this.resourceKey(node.definition.id)];
    }
  }

  private advanceQuestObjectives(kind: 'defeat' | 'collect' | 'visit', targetId: string, amount: number): void {
    for (const state of this.quests) {
      if (state.status !== 'active') continue;
      const quest = this.questCatalog.get(state.questId);
      if (!quest) continue;
      let changedObjectiveId: string | undefined;
      for (const objective of quest.objectives ?? []) {
        if (objective.kind !== kind || (objective.targetId !== targetId && objective.targetId !== '*')) continue;
        const current = state.objectiveProgress[objective.id] ?? 0;
        const next = Math.min(objective.count, current + amount);
        if (next === current) continue;
        state.objectiveProgress[objective.id] = next;
        changedObjectiveId = objective.id;
      }
      if (!changedObjectiveId) continue;
      this.syncQuestTotals(state, quest);
      this.events.push({ type: 'quest-progress', questId: state.questId, progress: state.progress, target: state.target, objectiveId: changedObjectiveId });
    }
  }

  private completeQuest(state: QuestState): void {
    const quest = this.questCatalog.get(state.questId);
    if (!quest) return;
    const rewardItems = quest.rewards?.items ?? [];
    const rewardXp = quest.rewards?.xp ?? 0;
    const rewardGold = quest.rewards?.gold ?? 0;
    this.removeItems(quest.turnInItems ?? []);
    state.status = 'completed';
    state.progress = state.target;
    for (const stack of rewardItems) this.addItem(stack.itemId, stack.count);
    this.gold += rewardGold;
    if (rewardXp > 0) this.gainXp(rewardXp);
    this.events.push({
      type: 'quest-completed', questId: state.questId, rewardItems, xp: rewardXp, gold: rewardGold,
      campaignCompleted: quest.completesCampaign,
    });
  }

  private flushEvents(): SimEvent[] {
    const events = this.events;
    this.events = [];
    return events;
  }

  private updateMonster(monster: MonsterState, dt: number): void {
    if (!monster.alive) {
      monster.respawn -= dt;
      if (monster.respawn <= 0) {
        monster.alive = true;
        monster.hp = monster.maxHp;
        monster.x = monster.home.x;
        monster.y = monster.home.y;
        monster.activeEffects = [];
        monster.telegraph = undefined;
        monster.abilityCooldowns = Object.fromEntries((monster.definition.abilities ?? []).map((ability) => [
          ability.id, Math.max(1.5, ability.cooldown * 0.45),
        ]));
      }
      return;
    }
    monster.hurtFlash = Math.max(0, monster.hurtFlash - dt);
    monster.attackCooldown = Math.max(0, monster.attackCooldown - dt);
    for (const ability of monster.definition.abilities ?? []) {
      monster.abilityCooldowns[ability.id] = Math.max(0, (monster.abilityCooldowns[ability.id] ?? 0) - dt);
    }
    if (monster.telegraph) {
      monster.telegraph.remaining = Math.max(0, monster.telegraph.remaining - dt);
      if (monster.telegraph.remaining <= 0) this.resolveMonsterAbility(monster);
      return;
    }
    const target = this.nearestLivingMember(monster);
    if (!target) return;
    const distance = dist(monster, target);
    const readyAbilities = (monster.definition.abilities ?? []).filter((ability) =>
      (monster.abilityCooldowns[ability.id] ?? 0) <= 0 && distance <= ability.range);
    if (readyAbilities.length > 0) {
      const ability = readyAbilities[monster.abilitySequence % readyAbilities.length];
      monster.abilitySequence += 1;
      monster.abilityCooldowns[ability.id] = ability.cooldown;
      monster.telegraph = {
        abilityId: ability.id,
        targetMemberId: target.id,
        remaining: ability.telegraphSeconds,
        totalDuration: ability.telegraphSeconds,
        range: ability.range,
      };
      this.events.push({
        type: 'monster-ability-telegraph', uid: monster.uid, abilityId: ability.id,
        targetMemberId: target.id, duration: ability.telegraphSeconds, range: ability.range,
      });
      return;
    }
    let dx = Math.cos(monster.wanderAngle);
    let dy = Math.sin(monster.wanderAngle);
    let speed = 18;
    if (distance < 190) {
      dx = (target.x - monster.x) / Math.max(1, distance);
      dy = (target.y - monster.y) / Math.max(1, distance);
      const slow = Math.min(0.75, effectAmount(monster.activeEffects, 'flee') / 100);
      speed = (42 + monster.definition.baseLevel * 1.5) * (1 - slow);
    } else {
      monster.wanderAngle += dt * (0.4 + seeded(monster.uid) * 0.4);
    }
    if (distance > 34) {
      const next = moveWithCollisions(this.map, this.collision, monster, { x: dx * speed * dt, y: dy * speed * dt }, this.monsterRadius(monster.definition));
      monster.x = next.x;
      monster.y = next.y;
    }
    if (distance < 40 && monster.attackCooldown <= 0 && target.invulnerable <= 0) {
      const sequence = (this.monsterAttackSequences.get(monster.uid) ?? 0) + 1;
      this.monsterAttackSequences.set(monster.uid, sequence);
      const evadeChance = Math.max(0, Math.min(80, effectAmount(target.activeEffects, 'flee') + this.progressionBonus(target, 'evasion')));
      monster.attackCooldown = 1.1;
      if (seeded(`${monster.uid}:attack:${sequence}`) * 100 < evadeChance) {
        target.invulnerable = 0.25;
        this.events.push({ type: 'player-dodged', memberId: target.id, uid: monster.uid });
        return;
      }
      const baseDefense = target.role === 'melee' ? 4 + target.level : Math.round(target.level * 0.5);
      const defense = Math.max(0, baseDefense + effectAmount(target.activeEffects, 'def') + this.equipmentBonus(target.id, 'def') + this.progressionBonus(target, 'def') - effectAmount(target.activeEffects, 'fractured'));
      const resistance = Math.min(0.8, effectAmount(target.activeEffects, 'matk_resist') / 100);
      const amount = Math.max(2, Math.round((monster.definition.atk - defense) * (1 - resistance)));
      target.hp = Math.max(0, target.hp - amount);
      target.invulnerable = 0.75;
      this.events.push({ type: 'player-hit', memberId: target.id, amount });
      if (target.hp > 0 && monster.definition.element === 'fungal' && sequence % 2 === 0) {
        const poisonDamage = Math.max(2, Math.round(monster.definition.baseLevel * 0.6));
        this.applyStatus(target, 'poison', poisonDamage, 10);
      }
      if (target.hp > 0 && monster.definition.element === 'shadow' && sequence % 3 === 0) {
        this.applyStatus(target, 'gloom', 10, 8);
      }
      if (target.hp === 0) {
        this.events.push({ type: 'member-fainted', memberId: target.id });
        if (this.party.every((member) => member.hp <= 0)) this.restorePartyAfterWipe();
      }
    }
  }

  private resolveMonsterAbility(monster: MonsterState): void {
    const telegraph = monster.telegraph;
    monster.telegraph = undefined;
    if (!telegraph || !monster.alive) return;
    const ability = monster.definition.abilities?.find((candidate) => candidate.id === telegraph.abilityId);
    if (!ability) return;
    const targets = ability.target === 'area'
      ? this.party.filter((member) => member.hp > 0 && dist(member, monster) <= ability.range)
      : this.party.filter((member) => member.id === telegraph.targetMemberId && member.hp > 0 && dist(member, monster) <= ability.range);
    for (const target of targets) {
      if (target.invulnerable > 0) continue;
      const evadeChance = Math.max(0, Math.min(80, effectAmount(target.activeEffects, 'flee') + this.progressionBonus(target, 'evasion')));
      if (seeded(`${monster.uid}:ability:${monster.abilitySequence}:${ability.id}:${target.id}`) * 100 < evadeChance) {
        target.invulnerable = 0.25;
        this.events.push({ type: 'player-dodged', memberId: target.id, uid: monster.uid });
        continue;
      }
      const baseDefense = target.role === 'melee' ? 4 + target.level : Math.round(target.level * 0.5);
      const defense = Math.max(0, baseDefense + effectAmount(target.activeEffects, 'def') + this.equipmentBonus(target.id, 'def') + this.progressionBonus(target, 'def') - effectAmount(target.activeEffects, 'fractured'));
      const resistance = Math.min(0.8, effectAmount(target.activeEffects, 'matk_resist') / 100);
      const amount = Math.max(2, Math.round((monster.definition.atk * ability.powerMultiplier - defense) * (1 - resistance)));
      target.hp = Math.max(0, target.hp - amount);
      target.invulnerable = 0.75;
      this.events.push({ type: 'player-hit', memberId: target.id, amount });
      if (target.hp > 0 && ability.status && ability.statusAmount && ability.statusDuration) {
        this.applyStatus(target, ability.status, ability.statusAmount, ability.statusDuration);
      }
      if (target.hp === 0) this.events.push({ type: 'member-fainted', memberId: target.id });
    }
    if (this.party.every((member) => member.hp <= 0)) this.restorePartyAfterWipe();
  }

  private restorePartyAfterWipe(): void {
    for (let index = 0; index < this.party.length; index += 1) {
      const member = this.party[index];
      const formationPosition = this.formationPosition(this.map.playerSpawn, { x: 1, y: 0 }, index);
      const position = nearestWalkablePoint(this.map, this.collision, formationPosition, 11);
      member.x = position.x;
      member.y = position.y;
      member.hp = member.maxHp;
      member.mp = member.maxMp;
      member.stamina = member.maxStamina;
      member.invulnerable = 1.5;
      member.activeEffects = [];
    }
    this.events.push({ type: 'party-wiped' });
  }

  private faceTarget(member: PlayerState, target: Vec2): void {
    const dx = target.x - member.x;
    const dy = target.y - member.y;
    const length = Math.max(1, Math.hypot(dx, dy));
    member.facing = { x: dx / length, y: dy / length };
  }

  private lowestWoundedAlly(threshold: number): PlayerState | undefined {
    return this.party.filter((ally) => ally.hp > 0 && ally.hp / ally.maxHp < threshold)
      .sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
  }

  private lowestUnbuffedAlly(skillId: string): PlayerState | undefined {
    return this.party.filter((ally) => ally.hp > 0 && !ally.activeEffects.some((effect) => effect.skillId === skillId))
      .sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
  }

  private nearestMonsterFrom(origin: Vec2, maxDistance: number): MonsterState | undefined {
    return this.monsters.filter((monster) => monster.alive && dist(monster, origin) <= maxDistance)
      .sort((a, b) => dist(a, origin) - dist(b, origin))[0];
  }

  private nearestLivingMember(origin: Vec2): PlayerState | undefined {
    return this.party.filter((member) => member.hp > 0)
      .sort((a, b) => dist(a, origin) - dist(b, origin))[0];
  }

  private monsterRadius(definition: MonsterDefinition): number {
    return definition.size === 'large' ? 15 : definition.size === 'medium' ? 12 : 9;
  }
}
