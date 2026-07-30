import { ITEM_BY_ID, MONSTER_BY_ID, NPC_BY_ID, QUEST_BY_ID } from '../src/data/catalog/index.js';
import { loadMapsJson, loadRegionsJson } from './lib/load-data.js';

const maps = await loadMapsJson();
const regions = await loadRegionsJson();
const errors: string[] = [];
const mapIds = new Set(maps.map((map) => map.id));
const campaignQuests = [...QUEST_BY_ID.values()].filter((quest) => quest.completesCampaign);

if (campaignQuests.length > 1) {
  errors.push(`[quest] expected at most one campaign finale, found ${campaignQuests.length}`);
}

for (const quest of QUEST_BY_ID.values()) {
  const tag = `[quest] ${quest.id}`;
  if (quest.giverNpcId && !NPC_BY_ID.has(quest.giverNpcId)) {
    errors.push(`${tag}: unknown giver NPC "${quest.giverNpcId}"`);
  }
  if (quest.completionNpcId && !NPC_BY_ID.has(quest.completionNpcId)) {
    errors.push(`${tag}: unknown completion NPC "${quest.completionNpcId}"`);
  }
  if ((quest.requiredLevel ?? 1) < 1) errors.push(`${tag}: requiredLevel must be >= 1`);

  const prerequisiteIds = [...(quest.prerequisiteQuestIds ?? []), ...(quest.prerequisiteAnyQuestIds ?? [])];
  for (const prerequisiteId of prerequisiteIds) {
    if (prerequisiteId === quest.id) errors.push(`${tag}: cannot require itself`);
    else if (!QUEST_BY_ID.has(prerequisiteId)) errors.push(`${tag}: unknown prerequisite "${prerequisiteId}"`);
  }
  for (const exclusiveId of quest.exclusiveQuestIds ?? []) {
    if (exclusiveId === quest.id) errors.push(`${tag}: cannot exclude itself`);
    else if (!QUEST_BY_ID.has(exclusiveId)) errors.push(`${tag}: unknown exclusive quest "${exclusiveId}"`);
    else if (!(QUEST_BY_ID.get(exclusiveId)?.exclusiveQuestIds ?? []).includes(quest.id)) {
      errors.push(`${tag}: exclusive quest "${exclusiveId}" must also exclude "${quest.id}"`);
    }
    if (prerequisiteIds.includes(exclusiveId)) errors.push(`${tag}: quest "${exclusiveId}" cannot be both prerequisite and exclusive`);
  }

  const objectiveIds = new Set<string>();
  for (const objective of quest.objectives ?? []) {
    if (objectiveIds.has(objective.id)) errors.push(`${tag}: duplicate objective id "${objective.id}"`);
    objectiveIds.add(objective.id);
    if (!Number.isInteger(objective.count) || objective.count < 1) errors.push(`${tag}/${objective.id}: count must be an integer >= 1`);
    if (!objective.label) errors.push(`${tag}/${objective.id}: missing label`);
    if (objective.kind === 'defeat' && objective.targetId !== '*' && !MONSTER_BY_ID.has(objective.targetId)) {
      errors.push(`${tag}/${objective.id}: unknown monster "${objective.targetId}"`);
    } else if (objective.kind === 'collect' && !ITEM_BY_ID.has(objective.targetId)) {
      errors.push(`${tag}/${objective.id}: unknown item "${objective.targetId}"`);
    } else if (objective.kind === 'visit' && !mapIds.has(objective.targetId)) {
      errors.push(`${tag}/${objective.id}: unknown map "${objective.targetId}"`);
    } else if (!['defeat', 'collect', 'visit'].includes(objective.kind)) {
      errors.push(`${tag}/${objective.id}: invalid kind "${objective.kind}"`);
    }
  }

  const itemStacks = [
    ...(quest.startItems ?? []),
    ...(quest.turnInItems ?? []),
    ...(quest.rewards?.items ?? []),
  ];
  for (const stack of itemStacks) {
    if (!ITEM_BY_ID.has(stack.itemId)) errors.push(`${tag}: unknown item "${stack.itemId}"`);
    if (!Number.isInteger(stack.count) || stack.count < 1) errors.push(`${tag}: item count for "${stack.itemId}" must be an integer >= 1`);
  }
  if ((quest.rewards?.xp ?? 0) < 0 || (quest.rewards?.gold ?? 0) < 0) {
    errors.push(`${tag}: reward XP and gold must be >= 0`);
  }
}

for (const quest of QUEST_BY_ID.values()) {
  const visited = new Set<string>();
  const visit = (questId: string): boolean => {
    if (questId === quest.id && visited.size > 0) return true;
    if (visited.has(questId)) return false;
    visited.add(questId);
    const current = QUEST_BY_ID.get(questId);
    return [...(current?.prerequisiteQuestIds ?? []), ...(current?.prerequisiteAnyQuestIds ?? [])].some(visit);
  };
  if ([...(quest.prerequisiteQuestIds ?? []), ...(quest.prerequisiteAnyQuestIds ?? [])].some(visit)) {
    errors.push(`[quest] ${quest.id}: prerequisite cycle detected`);
  }
}

for (const map of maps) {
  for (const portal of map.portals) {
    if (portal.requiredQuestId && !QUEST_BY_ID.has(portal.requiredQuestId)) {
      errors.push(
        `[quest] ${map.id} portal "${portal.id}" -> unknown quest "${portal.requiredQuestId}"`,
      );
    }
    if (portal.requiredQuestStartedId && !QUEST_BY_ID.has(portal.requiredQuestStartedId)) {
      errors.push(
        `[quest] ${map.id} portal "${portal.id}" -> unknown started quest "${portal.requiredQuestStartedId}"`,
      );
    }
  }
}

for (const region of regions) {
  for (const warp of region.warpTable) {
    if (warp.unlockQuestId && !QUEST_BY_ID.has(warp.unlockQuestId)) {
      errors.push(`[quest] warp "${warp.id}" -> unknown quest "${warp.unlockQuestId}"`);
    }
    if (warp.unlockQuestId) {
      const quest = QUEST_BY_ID.get(warp.unlockQuestId);
      if (quest?.unlocksWarpId && quest.unlocksWarpId !== warp.id) {
        errors.push(
          `[quest] ${warp.unlockQuestId} unlocksWarpId "${quest.unlocksWarpId}" != warp "${warp.id}"`,
        );
      }
    }
  }
}

if (errors.length > 0) {
  console.error(`Quest verification failed (${errors.length} error(s)):`);
  for (const e of errors) console.error(`  ${e}`);
  process.exit(1);
}

console.log(`Quest verification passed (${QUEST_BY_ID.size} quests in catalog).`);
