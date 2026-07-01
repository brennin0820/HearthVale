import { QUEST_BY_ID } from '../src/data/catalog/index.js';
import { loadMapsJson, loadRegionsJson } from './lib/load-data.js';

const maps = await loadMapsJson();
const regions = await loadRegionsJson();
const errors: string[] = [];

for (const map of maps) {
  for (const portal of map.portals) {
    if (portal.requiredQuestId && !QUEST_BY_ID.has(portal.requiredQuestId)) {
      errors.push(
        `[quest] ${map.id} portal "${portal.id}" -> unknown quest "${portal.requiredQuestId}"`,
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
