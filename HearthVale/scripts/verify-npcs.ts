import { NPC_BY_ID } from '../src/data/catalog/index.js';
import { loadMapsJson } from './lib/load-data.js';

const maps = await loadMapsJson();
const errors: string[] = [];
const seen = new Set<string>();

for (const map of maps) {
  for (const npc of map.npcs) {
    seen.add(npc.npcId);
    if (!NPC_BY_ID.has(npc.npcId)) {
      errors.push(`[npc] ${map.id} -> unknown npc "${npc.npcId}"`);
    }
  }
}

if (errors.length > 0) {
  console.error(`NPC verification failed (${errors.length} error(s)):`);
  for (const e of errors) console.error(`  ${e}`);
  process.exit(1);
}

console.log(`NPC verification passed (${seen.size} unique NPCs on maps).`);
