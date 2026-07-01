import type { NpcDefinition, QuestDefinition } from '../types/catalog.js';

const NPCS_URL = '/catalog/npcs.json';
const QUESTS_URL = '/catalog/quests.json';

let npcById: Record<string, NpcDefinition> = {};
let questsByGiver: Record<string, QuestDefinition[]> = {};
let loaded = false;

const FETCH_TIMEOUT_MS = 10000;

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
  if (!response.ok) {
    throw new Error(`Failed to load ${url} (${response.status})`);
  }
  return (await response.json()) as T;
}

/** Load the NPC and quest catalogs once; safe to call repeatedly. */
export async function loadCatalog(): Promise<void> {
  if (loaded) {
    return;
  }

  const [npcs, quests] = await Promise.all([
    fetchJson<NpcDefinition[]>(NPCS_URL),
    fetchJson<QuestDefinition[]>(QUESTS_URL),
  ]);

  npcById = Object.fromEntries(npcs.map((npc) => [npc.id, npc]));

  questsByGiver = {};
  for (const quest of quests) {
    if (!quest.giverNpcId) {
      continue;
    }
    (questsByGiver[quest.giverNpcId] ??= []).push(quest);
  }

  loaded = true;
}

export function getNpcById(npcId: string): NpcDefinition | undefined {
  return npcById[npcId];
}

export function getQuestsForNpc(npcId: string): QuestDefinition[] {
  return questsByGiver[npcId] ?? [];
}
