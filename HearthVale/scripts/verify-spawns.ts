import { MONSTER_BY_ID } from '../src/data/catalog/index.js';
import { loadMapsJson } from './lib/load-data.js';

const maps = await loadMapsJson();
const errors: string[] = [];
const seen = new Set<string>();
let authoredAbilityCount = 0;

for (const monster of MONSTER_BY_ID.values()) {
  const abilityIds = new Set<string>();
  for (const ability of monster.abilities ?? []) {
    authoredAbilityCount += 1;
    if (abilityIds.has(ability.id)) errors.push(`[ability] ${monster.id}: duplicate ability id "${ability.id}"`);
    abilityIds.add(ability.id);
    if (ability.status && (ability.statusAmount === undefined || ability.statusDuration === undefined)) {
      errors.push(`[ability] ${monster.id}/${ability.id}: status requires statusAmount and statusDuration`);
    }
    if (!ability.status && (ability.statusAmount !== undefined || ability.statusDuration !== undefined)) {
      errors.push(`[ability] ${monster.id}/${ability.id}: statusAmount/statusDuration require a status`);
    }
  }
}

for (const map of maps) {
  for (const table of map.spawnTables) {
    for (const entry of table.entries) {
      seen.add(entry.monsterId);
      if (!MONSTER_BY_ID.has(entry.monsterId)) {
        errors.push(`[spawn] ${map.id}/${table.id} -> unknown monster "${entry.monsterId}"`);
      }
    }
  }
}

for (const id of MONSTER_BY_ID.keys()) {
  if (!seen.has(id)) {
    console.log(`[unused] monster "${id}" not placed on any map spawn table`);
  }
}

if (errors.length > 0) {
  console.error(`Spawn verification failed (${errors.length} error(s)):`);
  for (const e of errors) console.error(`  ${e}`);
  process.exit(1);
}

console.log(`Spawn verification passed (${seen.size} monsters referenced, ${authoredAbilityCount} authored abilities).`);
