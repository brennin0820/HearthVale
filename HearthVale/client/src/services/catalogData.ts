import type {
  DropTableDefinition,
  ItemDefinition,
  JobSkillsEntry,
  NpcDefinition,
  QuestDefinition,
  SkillDefinition,
} from '../types/catalog.js';
import { loadJsonAsset } from './jsonAssets.js';

const NPCS_URL = './catalog/npcs.json';
const QUESTS_URL = './catalog/quests.json';
const JOBS_URL = './catalog/jobs.json';
const SKILLS_URL = './catalog/skills.json';
const ITEMS_URL = './catalog/items.json';
const DROPS_URL = './catalog/drops.json';

let npcById: Record<string, NpcDefinition> = {};
let questsByGiver: Record<string, QuestDefinition[]> = {};
let jobById: Record<string, JobSkillsEntry> = {};
let skillById: Record<string, SkillDefinition> = {};
let itemById: Record<string, ItemDefinition> = {};
let dropsByMonsterId: Record<string, DropTableDefinition> = {};
let loaded = false;

const FETCH_TIMEOUT_MS = 10000;

async function fetchJson<T>(url: string): Promise<T> {
  return Promise.race([
    loadJsonAsset<T>(url),
    new Promise<T>((_, reject) => {
      window.setTimeout(() => reject(new Error(`Timed out loading ${url}`)), FETCH_TIMEOUT_MS);
    }),
  ]);
}

/** Load the NPC, quest, job, and skill catalogs once; safe to call repeatedly. */
export async function loadCatalog(): Promise<void> {
  if (loaded) {
    return;
  }

  const [npcs, quests, jobs, skills, items, drops] = await Promise.all([
    fetchJson<NpcDefinition[]>(NPCS_URL),
    fetchJson<QuestDefinition[]>(QUESTS_URL),
    fetchJson<JobSkillsEntry[]>(JOBS_URL),
    fetchJson<SkillDefinition[]>(SKILLS_URL),
    fetchJson<ItemDefinition[]>(ITEMS_URL),
    fetchJson<DropTableDefinition[]>(DROPS_URL),
  ]);

  npcById = Object.fromEntries(npcs.map((npc) => [npc.id, npc]));

  questsByGiver = {};
  for (const quest of quests) {
    if (!quest.giverNpcId) {
      continue;
    }
    (questsByGiver[quest.giverNpcId] ??= []).push(quest);
  }

  jobById = Object.fromEntries(jobs.map((job) => [job.id, job]));
  skillById = Object.fromEntries(skills.map((skill) => [skill.id, skill]));
  itemById = Object.fromEntries(items.map((item) => [item.id, item]));
  dropsByMonsterId = Object.fromEntries(drops.map((table) => [table.monsterId, table]));

  loaded = true;
}

export function getNpcById(npcId: string): NpcDefinition | undefined {
  return npcById[npcId];
}

export function getQuestsForNpc(npcId: string): QuestDefinition[] {
  return questsByGiver[npcId] ?? [];
}

/** The skill ids a job grants, in authored order — empty if the job is unknown. */
export function getJobSkills(jobId: string): string[] {
  return jobById[jobId]?.startingSkills ?? [];
}

export function getSkillById(skillId: string): SkillDefinition | undefined {
  return skillById[skillId];
}

export function getItemById(itemId: string): ItemDefinition | undefined {
  return itemById[itemId];
}

export function getDropsForMonster(monsterId: string): DropTableDefinition | undefined {
  return dropsByMonsterId[monsterId];
}
