import {
  normalizeEquipmentState,
  normalizeSocketState,
  type EquipmentState,
  type InventoryStack,
  type PlayerState,
  type QuestState,
  type ResourceCooldowns,
  type SocketState,
} from './WorldSimulation.js';

/**
 * Durable character state shared by the solo save store and the multiplayer
 * server. Keep this format independent of any renderer or storage backend.
 */
export interface SaveGame {
  version: 1;
  mapId: string;
  party: PlayerState[];
  inventory: InventoryStack[];
  quests: QuestState[];
  equipment: EquipmentState;
  sockets: SocketState;
  discoveredMapIds: string[];
  resourceCooldowns: ResourceCooldowns;
  trackedQuestId?: string;
  gold: number;
  savedAt: number;
}

export interface SaveGameInput {
  mapId: string;
  party: PlayerState[];
  inventory?: InventoryStack[];
  quests?: QuestState[];
  equipment?: EquipmentState;
  sockets?: SocketState;
  discoveredMapIds?: string[];
  resourceCooldowns?: ResourceCooldowns;
  trackedQuestId?: string;
  gold?: number;
  savedAt?: number;
}

/** Clones authored state into the versioned persistence format. */
export function createSaveGame(input: SaveGameInput): SaveGame {
  return {
    version: 1,
    mapId: input.mapId,
    party: input.party.map(clonePlayerState),
    inventory: (input.inventory ?? []).map(cloneInventoryStack),
    quests: (input.quests ?? []).map(cloneQuestState),
    equipment: normalizeEquipmentState(input.equipment),
    sockets: normalizeSocketState(input.sockets),
    discoveredMapIds: [...new Set([...(input.discoveredMapIds ?? []), input.mapId])],
    resourceCooldowns: cloneResourceCooldowns(input.resourceCooldowns),
    trackedQuestId: input.trackedQuestId || undefined,
    gold: typeof input.gold === 'number' ? input.gold : 0,
    savedAt: typeof input.savedAt === 'number' ? input.savedAt : Date.now(),
  };
}

/** Parses current and legacy browser saves before either storage backend uses them. */
export function normalizeSaveGame(value: unknown): SaveGame | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const parsed = value as Partial<SaveGame>;
  if (parsed.version !== 1 || typeof parsed.mapId !== 'string' || !Array.isArray(parsed.party)) return null;
  return createSaveGame({
    mapId: parsed.mapId,
    party: parsed.party,
    inventory: Array.isArray(parsed.inventory) ? parsed.inventory : [],
    quests: Array.isArray(parsed.quests) ? parsed.quests : [],
    equipment: normalizeEquipmentState(parsed.equipment),
    sockets: normalizeSocketState(parsed.sockets),
    discoveredMapIds: Array.isArray(parsed.discoveredMapIds)
      ? parsed.discoveredMapIds.filter((mapId): mapId is string => typeof mapId === 'string')
      : [parsed.mapId],
    resourceCooldowns: cloneResourceCooldowns(parsed.resourceCooldowns),
    trackedQuestId: typeof parsed.trackedQuestId === 'string' ? parsed.trackedQuestId : undefined,
    gold: typeof parsed.gold === 'number' ? parsed.gold : 0,
    savedAt: typeof parsed.savedAt === 'number' ? parsed.savedAt : Date.now(),
  });
}

function clonePlayerState(member: PlayerState): PlayerState {
  const maxStamina = Number.isFinite(member.maxStamina) ? member.maxStamina : 100;
  return {
    ...member,
    stamina: Number.isFinite(member.stamina) ? Math.max(0, Math.min(maxStamina, member.stamina)) : maxStamina,
    maxStamina,
    facing: { ...member.facing },
    skillIds: [...(member.skillIds ?? [])],
    skillCooldowns: { ...(member.skillCooldowns ?? {}) },
    activeEffects: (member.activeEffects ?? []).map((effect) => ({ ...effect })),
  };
}

function cloneInventoryStack(stack: InventoryStack): InventoryStack {
  return { itemId: stack.itemId, count: stack.count };
}

function cloneQuestState(quest: QuestState): QuestState {
  return { ...quest, objectiveProgress: { ...(quest.objectiveProgress ?? {}) } };
}

function cloneResourceCooldowns(cooldowns: unknown): ResourceCooldowns {
  if (!cooldowns || typeof cooldowns !== 'object' || Array.isArray(cooldowns)) return {};
  const now = Date.now();
  return Object.fromEntries(Object.entries(cooldowns as Record<string, unknown>)
    .filter((entry): entry is [string, number] => typeof entry[1] === 'number' && Number.isFinite(entry[1]) && entry[1] > now));
}
