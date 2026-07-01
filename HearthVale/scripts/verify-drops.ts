import { ITEM_BY_ID } from '../src/data/catalog/index.js';
import { loadJsonFile } from './lib/load-data.js';
import type { DropTableDefinition } from '../src/data/catalog/types.js';

const drops = await loadJsonFile<DropTableDefinition[]>('catalog/drops.json');
const errors: string[] = [];

for (const table of drops) {
  if (!table.monsterId) {
    errors.push(`[drops] table "${table.id}" missing monsterId`);
  }
  if (table.entries.length === 0) {
    errors.push(`[drops] table "${table.id}" has no entries`);
  }
  for (const entry of table.entries) {
    if (!ITEM_BY_ID.has(entry.itemId)) {
      errors.push(`[drops] ${table.id} -> unknown item "${entry.itemId}"`);
    }
    if (entry.minCount > entry.maxCount) {
      errors.push(`[drops] ${table.id}/${entry.itemId}: minCount > maxCount`);
    }
  }
}

if (errors.length > 0) {
  console.error(`Drop verification failed (${errors.length} error(s)):`);
  for (const e of errors) console.error(`  ${e}`);
  process.exit(1);
}

console.log(`Drop verification passed (${drops.length} drop tables).`);
