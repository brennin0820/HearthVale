import assert from 'node:assert/strict';
import type { GameData, MapDefinition } from '../src/game/data/types.js';
import { WorldSimulation } from '../src/game/simulation/WorldSimulation.js';

const map: MapDefinition = {
  id: 'economy_test', displayName: 'Economy Test', kind: 'town',
  levelRange: { min: 1, max: 1 }, biome: 'test', gridSize: { width: 20, height: 20 },
  spawnTables: [], npcs: [{ npcId: 'merchant', position: { x: 0, y: 0 } }],
  portals: [], playerSpawn: { x: 0, y: 0 }, safeZone: null,
};

const data: GameData = {
  maps: [map], monsters: [], quests: [], drops: [], jobs: [], skills: [],
  npcs: [{ id: 'merchant', displayName: 'Test Merchant', role: 'merchant', title: 'Trader', dialogue: ['Trade well.'] }],
  items: [
    { id: 'herb', displayName: 'Herb', kind: 'material', stackMax: 99, buyPrice: 20, sellPrice: 8 },
    { id: 'brew', displayName: 'Brew', kind: 'consumable', stackMax: 20, buyPrice: 40, sellPrice: 15, effect: { type: 'heal', amount: 10 } },
    { id: 'blade', displayName: 'Blade', kind: 'equipment', stackMax: 1, buyPrice: 100, sellPrice: 40, slot: 'weapon', stats: { atk: 5 } },
    { id: 'sigil', displayName: 'Sigil', kind: 'quest', stackMax: 1, sellPrice: 0, tradable: false },
  ],
  shops: [{ id: 'shop_test', displayName: 'Test Shop', npcId: 'merchant', itemIds: ['brew', 'blade'] }],
  recipes: [
    {
      id: 'recipe_brew', displayName: 'Brew Herbs', category: 'alchemy', stationNpcIds: ['merchant'],
      result: { itemId: 'brew', count: 1 }, ingredients: [{ itemId: 'herb', count: 2 }], goldCost: 10,
    },
    {
      id: 'recipe_blade', displayName: 'Forge Blade', category: 'smithing', stationNpcIds: ['merchant'],
      result: { itemId: 'blade', count: 1 }, ingredients: [{ itemId: 'brew', count: 1 }], goldCost: 5, requiredLevel: 5,
    },
  ],
};

const simulation = new WorldSimulation(data, map, map.playerSpawn, undefined, [
  { itemId: 'herb', count: 3 },
  { itemId: 'blade', count: 1 },
  { itemId: 'sigil', count: 1 },
], undefined, 100);

const buyEvents = simulation.buyItem('merchant', 'brew');
assert.ok(buyEvents.some((event) => event.type === 'economy-transaction' && event.action === 'buy'));
assert.equal(simulation.gold, 60, 'Buying should deduct the authored buy price');
assert.equal(simulation.inventory.find((stack) => stack.itemId === 'brew')?.count, 1);

const sellEvents = simulation.sellItem('merchant', 'herb');
assert.ok(sellEvents.some((event) => event.type === 'economy-transaction' && event.action === 'sell'));
assert.equal(simulation.gold, 68, 'Selling should add the authored sell price');
assert.equal(simulation.inventory.find((stack) => stack.itemId === 'herb')?.count, 2);

const craftEvents = simulation.craftRecipe('merchant', 'recipe_brew');
assert.ok(craftEvents.some((event) => event.type === 'economy-transaction' && event.action === 'craft'));
assert.equal(simulation.gold, 58, 'Crafting should deduct the recipe fee');
assert.equal(simulation.inventory.find((stack) => stack.itemId === 'herb')?.count, 0);
assert.equal(simulation.inventory.find((stack) => stack.itemId === 'brew')?.count, 2);

assert.ok(simulation.craftRecipe('merchant', 'recipe_brew').some((event) => event.type === 'economy-blocked' && event.reason === 'items'));
assert.ok(simulation.craftRecipe('merchant', 'recipe_blade').some((event) => event.type === 'economy-blocked' && event.reason === 'level'));
assert.ok(simulation.buyItem('stranger', 'brew').some((event) => event.type === 'economy-blocked' && event.reason === 'merchant'));
assert.ok(simulation.sellItem('merchant', 'sigil').some((event) => event.type === 'economy-blocked' && event.reason === 'protected'));

simulation.useItem('blade');
assert.ok(simulation.sellItem('merchant', 'blade').some((event) => event.type === 'economy-blocked' && event.reason === 'equipped'));

console.log('Economy smoke test passed.');
