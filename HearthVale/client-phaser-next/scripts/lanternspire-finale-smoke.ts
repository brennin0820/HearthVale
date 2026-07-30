import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import type { CollisionGrid, GameData, MapPropSet } from '../src/game/data/types.js';
import { NO_INPUT } from '../src/game/input/actions.js';
import { buildWorldMapModel } from '../src/game/navigation/worldMap.js';
import { isWalkable } from '../src/game/simulation/CollisionGrid.js';
import { WorldSimulation, type MonsterState, type QuestState, type SimEvent } from '../src/game/simulation/WorldSimulation.js';

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
const summitId = 'lanternspire_summit';
const [summitCollision, summitProps] = await Promise.all([
  json<CollisionGrid>(`data/collision/${summitId}.json`),
  json<MapPropSet>(`data/props/${summitId}.json`),
]);
const data: GameData = {
  maps, regions, npcs, monsters, items, quests, drops, shops, recipes, jobs, skills,
  collisions: { [summitId]: summitCollision },
  props: { [summitId]: summitProps },
};
const town = maps.find((map) => map.id === 'hearthvale_town_ro')!;
const summit = maps.find((map) => map.id === summitId)!;
const wren = npcs.find((npc) => npc.id === 'priestess_wren')!;
assert.ok(town && summit && wren, 'Town, Summit, and Priestess Wren should export');
assert.ok(town.npcs.some((npc) => npc.npcId === wren.id), 'Priestess Wren should be active in the playable town');
const summitGate = town.portals.find((portal) => portal.targetMapId === summit.id);
assert.equal(summitGate?.requiredLevel, 14);
assert.equal(summitGate?.requiredQuestStartedId, 'quest_lanternspire_accord');
assert.ok(summit.portals.some((portal) => portal.targetMapId === town.id), 'The Summit should return to town');
assert.ok(summitCollision.walkable.flat().some((tile) => !tile), 'The Summit should contain blocked terrain');
assert.ok(summitProps.props.length >= 35, 'The Summit should have a full authored prop layer');
assert.ok(summitProps.props.filter((prop) => prop.kind === 'lantern').length >= 10);
assert.ok(summitProps.props.some((prop) => prop.kind === 'crystal'));
assert.ok(summitProps.props.some((prop) => prop.kind === 'rift'));
for (const point of [summit.playerSpawn, ...summit.portals.map((portal) => portal.position)]) {
  assert.ok(isWalkable(summit, summitCollision, point), 'Summit traversal points should be walkable');
}

for (const monsterId of ['aurora_mote', 'gloam_warden', 'starved_crown']) {
  assert.ok(monsters.some((monster) => monster.id === monsterId), `${monsterId} should exist`);
  assert.ok(drops.some((table) => table.monsterId === monsterId), `${monsterId} should have loot`);
}
for (const itemId of ['aurora_thread', 'gloam_shard', 'dawnpetal_elixir', 'star_crown_fragment', 'lanternbound_regalia']) {
  assert.ok(items.some((item) => item.id === itemId), `${itemId} should exist`);
}
assert.ok(recipes.some((recipe) => recipe.id === 'recipe_dawnpetal_elixir'));
assert.ok(shops.find((shop) => shop.npcId === 'herbalist_lyra')?.itemIds.includes('dawnpetal_elixir'));
assert.equal(quests.filter((quest) => quest.completesCampaign).length, 1, 'There should be one authored campaign ending');

const completedMoonwell: QuestState = {
  questId: 'quest_heart_of_moonwell', status: 'completed', progress: 2, target: 2,
  objectiveProgress: { enter_heart: 1, matriarch_defeat: 1 },
};
const completedKiln: QuestState = {
  questId: 'quest_hollow_kiln', status: 'completed', progress: 3, target: 3,
  objectiveProgress: { enter_hollow_kiln: 1, defeat_kilnheart: 1, recover_kilnheart: 1 },
};
const lockedMap = buildWorldMapModel(data, town.id, 14, [completedMoonwell, completedKiln], [town.id]);
const lockedSummit = lockedMap.nodes.find((node) => node.id === summit.id)!;
assert.equal(lockedSummit.status, 'locked');
assert.ok(lockedSummit.lockReasons.includes('Accept The Lanternspire Accord'));

const townRun = new WorldSimulation(data, town, town.playerSpawn, undefined, [], [completedMoonwell, completedKiln]);
townRun.party.forEach((member) => { member.level = 14; });
const startEvents = townRun.interactWithNpc(wren);
assert.ok(startEvents.some((event) => event.type === 'quest-started' && event.questId === 'quest_lanternspire_accord'));
assert.ok(townRun.isQuestStarted('quest_lanternspire_accord'));
const openMap = buildWorldMapModel(data, town.id, 14, townRun.quests, [town.id]);
assert.equal(openMap.nodes.find((node) => node.id === summit.id)?.status, 'available');

function defeat(simulation: WorldSimulation, target: MonsterState): SimEvent[] {
  for (const monster of simulation.monsters) {
    monster.alive = false;
    monster.respawn = 999;
  }
  target.alive = true;
  target.hp = 1;
  target.x = simulation.player.x + 20;
  target.y = simulation.player.y;
  simulation.party.forEach((member) => { member.attackCooldown = member.id === simulation.player.id ? 0 : 99; });
  return simulation.update({ ...NO_INPUT, attackPressed: true }, 0.05);
}

const summitRun = new WorldSimulation(data, summit, summit.playerSpawn, townRun.party, townRun.inventory, townRun.quests, townRun.gold);
assert.equal(summitRun.quests.find((state) => state.questId === 'quest_lanternspire_accord')?.objectiveProgress.reach_lanternspire, 1);
const wardens = summitRun.monsters.filter((monster) => monster.definition.id === 'gloam_warden');
assert.ok(wardens.length >= 3, 'One Summit population should satisfy the warden objective');
for (const warden of wardens.slice(0, 3)) defeat(summitRun, warden);
const boss = summitRun.monsters.find((monster) => monster.definition.id === 'starved_crown')!;
const bossEvents = defeat(summitRun, boss);
assert.ok(bossEvents.some((event) => event.type === 'monster-hit' && event.defeated));
assert.ok(bossEvents.some((event) => event.type === 'item-loot' && event.itemId === 'star_crown_fragment'));
assert.equal(summitRun.quests.find((state) => state.questId === 'quest_lanternspire_accord')?.status, 'ready');
const returnRun = new WorldSimulation(data, town, town.playerSpawn, summitRun.party, summitRun.inventory, summitRun.quests, summitRun.gold);
const completionEvents = returnRun.interactWithNpc(wren);
assert.ok(completionEvents.some((event) => event.type === 'quest-completed' && event.campaignCompleted));
assert.ok(returnRun.isCampaignCompleted(), 'Campaign completion should derive from persisted quest state');
assert.ok(returnRun.inventory.some((stack) => stack.itemId === 'lanternbound_regalia'));
assert.ok(!returnRun.inventory.some((stack) => stack.itemId === 'star_crown_fragment' && stack.count > 0));

function combatDamage(withGloom: boolean): number {
  const simulation = new WorldSimulation(data, summit, summit.playerSpawn);
  simulation.party.forEach((member) => { member.level = 14; member.attackCooldown = member.id === simulation.player.id ? 0 : 99; });
  const target = simulation.monsters.find((monster) => monster.definition.id === 'aurora_mote')!;
  for (const monster of simulation.monsters) monster.alive = monster === target;
  target.x = simulation.player.x + 20;
  target.y = simulation.player.y;
  if (withGloom) simulation.player.activeEffects.push({ skillId: 'status:gloom', stat: 'gloom', amount: 10, remaining: 8 });
  const hit = simulation.update({ ...NO_INPUT, attackPressed: true }, 0.05)
    .find((event) => event.type === 'monster-hit' && event.memberId === simulation.player.id);
  assert.ok(hit?.type === 'monster-hit');
  return hit.amount;
}
assert.ok(combatDamage(true) < combatDamage(false), 'Gloom should reduce outgoing attack damage');

const conditionRun = new WorldSimulation(data, summit, summit.playerSpawn, undefined, [{ itemId: 'dawnpetal_elixir', count: 1 }]);
conditionRun.party.forEach((member) => { member.level = 14; });
for (const monster of conditionRun.monsters) monster.alive = monster.definition.id === 'gloam_warden';
const shadow = conditionRun.monsters.find((monster) => monster.alive)!;
shadow.x = conditionRun.player.x + 10;
shadow.y = conditionRun.player.y;
const statusEvents: SimEvent[] = [];
for (let elapsed = 0; elapsed < 2.4; elapsed += 0.05) statusEvents.push(...conditionRun.update(NO_INPUT, 0.05));
assert.ok(statusEvents.some((event) => event.type === 'status-applied' && event.status === 'gloom'));
assert.ok(conditionRun.player.activeEffects.some((effect) => effect.stat === 'gloom'));
const cureEvents = conditionRun.useItem('dawnpetal_elixir');
assert.ok(cureEvents.some((event) => event.type === 'status-cured' && event.status === 'gloom'));
assert.ok(!conditionRun.player.activeEffects.some((effect) => effect.stat === 'gloom'));

console.log('Lanternspire finale smoke test passed: route, art, monsters, loot, gloom, quest, boss, rewards, and campaign ending are connected.');
