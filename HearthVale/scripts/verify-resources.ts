import type { ItemDefinition } from '../src/data/catalog/types.js';
import type { ResourceNodeKind } from '../src/data/world/types.js';
import { loadJsonFile, loadMapsJson } from './lib/load-data.js';

const [maps, items] = await Promise.all([
  loadMapsJson(),
  loadJsonFile<ItemDefinition[]>('catalog/items.json'),
]);
const itemById = new Map(items.map((item) => [item.id, item]));
const kinds = new Set<ResourceNodeKind>(['herb', 'ore', 'fiber', 'relic']);
const errors: string[] = [];
let nodeCount = 0;

for (const map of maps) {
  const ids = new Set<string>();
  for (const node of map.resourceNodes ?? []) {
    nodeCount += 1;
    const tag = `${map.id}/${node.id || '(missing id)'}`;
    if (!node.id) errors.push(`[resources] ${map.id}: node missing id`);
    else if (ids.has(node.id)) errors.push(`[resources] ${map.id}: duplicate node id "${node.id}"`);
    ids.add(node.id);
    if (!node.displayName) errors.push(`[resources] ${tag}: missing displayName`);
    if (!kinds.has(node.kind)) errors.push(`[resources] ${tag}: invalid kind "${node.kind}"`);
    const item = itemById.get(node.itemId);
    if (!item) errors.push(`[resources] ${tag}: unknown item "${node.itemId}"`);
    else if (item.kind !== 'material') errors.push(`[resources] ${tag}: gathered item "${node.itemId}" must be a material`);
    if (!Number.isInteger(node.minCount) || node.minCount < 1) errors.push(`[resources] ${tag}: minCount must be an integer >= 1`);
    if (!Number.isInteger(node.maxCount) || node.maxCount < node.minCount) errors.push(`[resources] ${tag}: maxCount must be an integer >= minCount`);
    if (!(node.respawnSeconds > 0)) errors.push(`[resources] ${tag}: respawnSeconds must be positive`);
    if (node.requiredLevel !== undefined && (!Number.isInteger(node.requiredLevel) || node.requiredLevel < 1)) {
      errors.push(`[resources] ${tag}: requiredLevel must be an integer >= 1`);
    }
  }
}

if (nodeCount === 0) errors.push('[resources] no resource nodes are authored');
if (errors.length > 0) {
  console.error(`Resource verification failed (${errors.length} error(s)):`);
  for (const error of errors) console.error(`  ${error}`);
  process.exit(1);
}

console.log(`Resource verification passed (${nodeCount} nodes across ${maps.filter((map) => (map.resourceNodes?.length ?? 0) > 0).length} maps).`);
