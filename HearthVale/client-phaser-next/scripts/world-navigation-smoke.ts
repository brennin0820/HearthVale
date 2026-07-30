import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import type { GameData } from '../src/game/data/types.js';
import { buildWorldMapModel } from '../src/game/navigation/worldMap.js';
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
const startId = 'hearthvale_town_ro';
const plainsId = 'cloverfield_plains_ro';

const startModel = buildWorldMapModel(data, startId, 1, [], [startId]);
assert.equal(startModel.pinCount, 14, 'The region chart should expose the fourteen authored world-map pins');
assert.equal(startModel.nodes.find((node) => node.id === startId)?.status, 'current');
assert.equal(startModel.nodes.find((node) => node.id === plainsId)?.status, 'available');

const earlyModel = buildWorldMapModel(data, plainsId, 1, [], [startId, plainsId]);
assert.equal(earlyModel.nodes.find((node) => node.id === 'mushroom_hollow')?.status, 'available');
assert.equal(earlyModel.nodes.find((node) => node.id === 'crystal_mine_approach')?.status, 'available');
assert.equal(earlyModel.nodes.find((node) => node.id === 'whisperwood_meadows')?.status, 'locked');
assert.ok(earlyModel.nodes.find((node) => node.id === 'whisperwood_meadows')?.lockReasons.includes('Reach level 5'));

const levelFiveModel = buildWorldMapModel(data, plainsId, 5, [], [startId, plainsId]);
assert.equal(levelFiveModel.nodes.find((node) => node.id === 'whisperwood_meadows')?.status, 'available');

const millwickQuest: QuestState = {
  questId: 'quest_millwick_letter',
  status: 'active',
  progress: 0,
  target: 1,
  objectiveProgress: { reach_millwick: 0 },
};
const objectiveModel = buildWorldMapModel(data, plainsId, 8, [millwickQuest], [startId, plainsId]);
assert.ok(objectiveModel.nodes.find((node) => node.id === 'millwick_crossing')?.objectiveLabels.includes('Reach Millwick Crossing'));

const town = maps.find((map) => map.id === startId)!;
const simulation = new WorldSimulation(data, town, town.playerSpawn, undefined, undefined, undefined, undefined, undefined, ['mushroom_hollow']);
assert.deepEqual(new Set(simulation.discoveredMapIds), new Set(['mushroom_hollow', startId]), 'Entering a map should extend discovery state');

console.log('World navigation smoke test passed: discovery, route gates, and quest map markers are ready.');
