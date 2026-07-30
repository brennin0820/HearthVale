import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import type { GameData } from '../src/game/data/types.js';
import { WorldSimulation, type QuestState } from '../src/game/simulation/WorldSimulation.js';

const projectRoot = resolve(import.meta.dirname, '../..');
async function json<T>(relativePath: string): Promise<T> {
  return JSON.parse(await readFile(resolve(projectRoot, relativePath), 'utf8')) as T;
}

const [maps, regions, npcs, monsters, items, quests, drops, shops, recipes, jobs, skills] = await Promise.all([
  json<GameData['maps']>('data/maps.json'),
  json<NonNullable<GameData['regions']>>('data/regions.json'),
  json<GameData['npcs']>('data/catalog/npcs.json'),
  json<GameData['monsters']>('data/catalog/monsters.json'),
  json<GameData['items']>('data/catalog/items.json'),
  json<GameData['quests']>('data/catalog/quests.json'),
  json<GameData['drops']>('data/catalog/drops.json'),
  json<NonNullable<GameData['shops']>>('data/catalog/shops.json'),
  json<NonNullable<GameData['recipes']>>('data/catalog/recipes.json'),
  json<GameData['jobs']>('data/catalog/jobs.json'),
  json<GameData['skills']>('data/catalog/skills.json'),
]);
const data: GameData = { maps, regions, npcs, monsters, items, quests, drops, shops, recipes, jobs, skills };
const town = maps.find((map) => map.id === 'hearthvale_town_ro')!;
const afterlight = maps.find((map) => map.id === 'afterlight_expanse')!;
const finalQuest: QuestState = {
  questId: 'quest_lanternspire_accord', status: 'completed', progress: 4, target: 4,
  objectiveProgress: { reach_lanternspire: 1, break_gloam_wardens: 3, defeat_starved_crown: 1, recover_star_crown: 1 },
};

const catalog = new WorldSimulation(data, town, town.playerSpawn);
assert.equal(catalog.warpDestinations().length, 8, 'The Hearth Courier should expose every authored regional wayline');
assert.deepEqual(
  catalog.warpDestinations().find((warp) => warp.id === 'warp_afterlight'),
  {
    id: 'warp_afterlight', label: 'Afterlight Expanse', targetMapId: afterlight.id,
    targetSpawn: afterlight.playerSpawn, cost: 420, requiredLevel: 14, unlockQuestId: finalQuest.questId,
  },
);

const freeRun = new WorldSimulation(data, town, town.playerSpawn, undefined, undefined, undefined, 25);
const freeEvents = freeRun.travelByCourier('warp_cloverfield');
assert.ok(freeEvents.some((event) => event.type === 'courier-warp-requested' && event.goldCost === 0));
assert.equal(freeRun.gold, 25, 'A free wayline should not change gold');

const paidRun = new WorldSimulation(data, town, town.playerSpawn, undefined, undefined, undefined, 500);
paidRun.player.level = 14;
const paidEvents = paidRun.travelByCourier('warp_mushroom_hollow');
assert.ok(paidEvents.some((event) => event.type === 'courier-warp-requested'
  && event.targetMapId === 'mushroom_hollow' && event.goldCost === 120));
assert.equal(paidRun.gold, 380, 'Courier fare should be deducted exactly once');

const levelRun = new WorldSimulation(data, town, town.playerSpawn, undefined, undefined, undefined, 999);
assert.ok(levelRun.travelByCourier('warp_whisperwood').some((event) => event.type === 'courier-warp-blocked' && event.reason === 'level'));

const questRun = new WorldSimulation(data, town, town.playerSpawn, undefined, undefined, undefined, 999);
questRun.player.level = 14;
assert.ok(questRun.travelByCourier('warp_afterlight').some((event) => event.type === 'courier-warp-blocked' && event.reason === 'quest'));

const poorRun = new WorldSimulation(data, town, town.playerSpawn, undefined, undefined, undefined, 100);
poorRun.player.level = 14;
assert.ok(poorRun.travelByCourier('warp_mushroom_hollow').some((event) => event.type === 'courier-warp-blocked' && event.reason === 'gold'));
assert.equal(poorRun.gold, 100, 'A blocked trip should not charge the player');

const unlockedRun = new WorldSimulation(data, town, town.playerSpawn, undefined, undefined, [finalQuest], 500);
unlockedRun.player.level = 14;
const unlockedEvents = unlockedRun.travelByCourier('warp_afterlight');
assert.ok(unlockedEvents.some((event) => event.type === 'courier-warp-requested'
  && event.targetMapId === afterlight.id && event.goldCost === 420));
assert.equal(unlockedRun.gold, 80);

const sameMapRun = new WorldSimulation(data, afterlight, afterlight.playerSpawn, undefined, undefined, [finalQuest], 999);
sameMapRun.player.level = 14;
assert.ok(sameMapRun.travelByCourier('warp_afterlight').some((event) => event.type === 'courier-warp-blocked' && event.reason === 'location'));
assert.ok(sameMapRun.travelByCourier('warp_missing').some((event) => event.type === 'courier-warp-blocked' && event.reason === 'destination'));

console.log('Courier travel smoke test passed: catalog, fares, unlocks, level, gold, destination, and same-map rules are enforced.');
