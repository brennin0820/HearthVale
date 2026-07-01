import { loadJsonFile } from './lib/load-data.js';
import type {
  EquipmentSlot,
  ItemDefinition,
  ItemKind,
  ItemRarity,
} from '../src/data/catalog/types.js';

const items = await loadJsonFile<ItemDefinition[]>('catalog/items.json');
const errors: string[] = [];

const KINDS: ItemKind[] = ['consumable', 'material', 'equipment', 'quest'];
const RARITIES: ItemRarity[] = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
const SLOTS: EquipmentSlot[] = ['weapon', 'offhand', 'head', 'body', 'accessory'];

const seen = new Set<string>();

for (const item of items) {
  const tag = item.id || '(missing id)';

  if (!item.id) {
    errors.push('[items] entry missing id');
  } else if (seen.has(item.id)) {
    errors.push(`[items] duplicate id "${item.id}"`);
  } else {
    seen.add(item.id);
  }

  if (!item.displayName) {
    errors.push(`[items] ${tag}: missing displayName`);
  }
  if (!KINDS.includes(item.kind)) {
    errors.push(`[items] ${tag}: invalid kind "${item.kind}"`);
  }
  if (!Number.isInteger(item.stackMax) || item.stackMax < 1) {
    errors.push(`[items] ${tag}: stackMax must be an integer >= 1`);
  }
  if (item.sellPrice < 0) {
    errors.push(`[items] ${tag}: sellPrice must be >= 0`);
  }
  if (item.rarity !== undefined && !RARITIES.includes(item.rarity)) {
    errors.push(`[items] ${tag}: invalid rarity "${item.rarity}"`);
  }
  if (item.buyPrice !== undefined) {
    if (item.buyPrice < 0) {
      errors.push(`[items] ${tag}: buyPrice must be >= 0`);
    } else if (item.buyPrice < item.sellPrice) {
      errors.push(`[items] ${tag}: buyPrice (${item.buyPrice}) < sellPrice (${item.sellPrice})`);
    }
  }
  if (item.levelReq !== undefined && (!Number.isInteger(item.levelReq) || item.levelReq < 1)) {
    errors.push(`[items] ${tag}: levelReq must be an integer >= 1`);
  }

  // Kind-specific shape.
  if (item.kind === 'equipment') {
    if (item.stackMax !== 1) {
      errors.push(`[items] ${tag}: equipment must have stackMax 1`);
    }
    if (!item.slot) {
      errors.push(`[items] ${tag}: equipment must declare a slot`);
    } else if (!SLOTS.includes(item.slot)) {
      errors.push(`[items] ${tag}: invalid equipment slot "${item.slot}"`);
    }
    if (!item.stats || Object.keys(item.stats).length === 0) {
      errors.push(`[items] ${tag}: equipment should grant at least one stat`);
    }
  } else if (item.slot || item.stats) {
    errors.push(`[items] ${tag}: only equipment may declare slot/stats`);
  }

  if (item.kind === 'consumable') {
    if (!item.effect) {
      errors.push(`[items] ${tag}: consumable must declare an effect`);
    } else if (!['heal', 'restore', 'buff', 'cure', 'warp'].includes(item.effect.type)) {
      errors.push(`[items] ${tag}: invalid consumable effect type "${item.effect.type}"`);
    }
  } else if (item.effect) {
    errors.push(`[items] ${tag}: only consumables may declare an effect`);
  }

  if (item.kind === 'quest' && item.stackMax !== 1) {
    errors.push(`[items] ${tag}: quest items must have stackMax 1`);
  }
}

if (errors.length > 0) {
  console.error(`Item verification failed (${errors.length} error(s)):`);
  for (const e of errors) console.error(`  ${e}`);
  process.exit(1);
}

const byKind = items.reduce<Record<string, number>>((acc, i) => {
  acc[i.kind] = (acc[i.kind] ?? 0) + 1;
  return acc;
}, {});
const summary = KINDS.map((k) => `${byKind[k] ?? 0} ${k}`).join(', ');
console.log(`Item verification passed (${items.length} items: ${summary}).`);
