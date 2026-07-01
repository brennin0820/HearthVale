import type {
  JobSkillsEntry,
  NpcDefinition,
  QuestDefinition,
  SkillDefinition,
} from '../types/catalog.js';

const NPCS_URL = '/catalog/npcs.json';
const QUESTS_URL = '/catalog/quests.json';
const JOBS_URL = '/catalog/jobs.json';
const SKILLS_URL = '/catalog/skills.json';

let npcById: Record<string, NpcDefinition> = {};
let questsByGiver: Record<string, QuestDefinition[]> = {};
let jobById: Record<string, JobSkillsEntry> = {};
let skillById: Record<string, SkillDefinition> = {};
let loaded = false;

const FETCH_TIMEOUT_MS = 10000;

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
  if (!response.ok) {
    throw new Error(`Failed to load ${url} (${response.status})`);
  }
  return (await response.json()) as T;
}

/** Load the NPC, quest, job, and skill catalogs once; safe to call repeatedly. */
export async function loadCatalog(): Promise<void> {
  if (loaded) {
    return;
  }

  const [npcs, quests, jobs, skills] = await Promise.all([
    fetchJson<NpcDefinition[]>(NPCS_URL),
    fetchJson<QuestDefinition[]>(QUESTS_URL),
    fetchJson<JobSkillsEntry[]>(JOBS_URL),
    fetchJson<SkillDefinition[]>(SKILLS_URL),
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
