import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import type { CollisionGrid, GameData, MapPropSet } from '../src/game/data/types.js';
import { buildWorldMapModel } from '../src/game/navigation/worldMap.js';
import { isWalkable } from '../src/game/simulation/CollisionGrid.js';
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
const routeIds = ['emberglass_shelf', 'hollow_kiln'] as const;
const collisionEntries = await Promise.all(routeIds.map(async (id) => [id, await json<CollisionGrid>(`data/collision/${id}.json`)] as const));
const propEntries = await Promise.all(routeIds.map(async (id) => [id, await json<MapPropSet>(`data/props/${id}.json`)] as const));
const data: GameData = {
  maps, regions, npcs, monsters, items, quests, drops, shops, recipes, jobs, skills,
  collisions: Object.fromEntries(collisionEntries),
  props: Object.fromEntries(propEntries),
};
const approach = maps.find((map) => map.id === 'crystal_mine_approach')!;
const shelf = maps.find((map) => map.id === 'emberglass_shelf')!;
const kiln = maps.find((map) => map.id === 'hollow_kiln')!;
assert.ok(approach && shelf && kiln, 'The complete Emberglass route should export');
assert.ok(approach.portals.some((portal) => portal.targetMapId === shelf.id && portal.requiredLevel === 11));
assert.ok(shelf.portals.some((portal) => portal.targetMapId === approach.id));
const kilnGate = shelf.portals.find((portal) => portal.targetMapId === kiln.id);
assert.equal(kilnGate?.requiredLevel, 13);
assert.equal(kilnGate?.requiredQuestId, 'quest_emberglass_survey');
assert.ok(kiln.portals.some((portal) => portal.targetMapId === shelf.id));

for (const map of [shelf, kiln]) {
  const collision = data.collisions?.[map.id];
  const props = data.props?.[map.id]?.props ?? [];
  assert.ok(collision?.walkable.flat().some((tile) => !tile), `${map.id} should contain blocked terrain`);
  assert.ok(props.length >= 25, `${map.id} should contain a full authored prop layer`);
  assert.ok(props.some((prop) => prop.kind === 'crystal'));
  assert.ok(props.some((prop) => prop.kind === 'rift'));
  const keyPoints = [map.playerSpawn, ...map.portals.map((portal) => portal.position), ...map.npcs.map((npc) => npc.position)];
  assert.ok(keyPoints.every((point) => isWalkable(map, collision, point)), `${map.id} key traversal points should be walkable`);
  const simulation = new WorldSimulation(data, map, map.playerSpawn, undefined, [], []);
  assert.ok(simulation.monsters.length >= (map.id === shelf.id ? 12 : 13));
  assert.ok(simulation.monsters.every((monster) => isWalkable(map, collision, monster)), `${map.id} monsters should spawn on walkable ground`);
}

for (const monsterId of ['cinder_mote', 'prism_scarab', 'sinterhorn', 'kilnheart_colossus']) {
  assert.ok(monsters.some((monster) => monster.id === monsterId), `${monsterId} should exist`);
  assert.ok(drops.some((table) => table.monsterId === monsterId), `${monsterId} should have a drop table`);
}
for (const itemId of ['emberglass_chip', 'kiln_ash', 'prism_shell', 'cinder_cordial', 'emberglass_circlet', 'kilnforged_aegis', 'hearthspark_glaive', 'kilnheart_core']) {
  assert.ok(items.some((item) => item.id === itemId), `${itemId} should exist`);
}
assert.ok(recipes.some((recipe) => recipe.id === 'recipe_cinder_cordial'));
assert.ok(recipes.some((recipe) => recipe.id === 'recipe_kilnforged_aegis'));
assert.ok(shops.find((shop) => shop.npcId === 'merchant_elsie')?.itemIds.includes('cinder_cordial'));

const completedMillwick: QuestState = {
  questId: 'quest_millwick_letter', status: 'completed', progress: 1, target: 1,
  objectiveProgress: { reach_millwick: 1 },
};
const lockedModel = buildWorldMapModel(data, shelf.id, 13, [], [approach.id, shelf.id]);
assert.ok(lockedModel.nodes.find((node) => node.id === kiln.id)?.lockReasons.includes('Complete The Emberglass Survey'));
const surveyComplete: QuestState = {
  questId: 'quest_emberglass_survey', status: 'completed', progress: 8, target: 8,
  objectiveProgress: { reach_emberglass: 1, quiet_cinder_motes: 4, gather_emberglass: 3 },
};
const openModel = buildWorldMapModel(data, shelf.id, 13, [surveyComplete], [approach.id, shelf.id]);
assert.equal(openModel.nodes.find((node) => node.id === kiln.id)?.status, 'available');

const garrick = npcs.find((npc) => npc.id === 'prospector_garrick')!;
const orla = npcs.find((npc) => npc.id === 'glasswright_orla')!;
const survey = new WorldSimulation(
  data, approach, approach.playerSpawn, undefined, [{ itemId: 'emberglass_chip', count: 3 }], [completedMillwick], 200,
);
survey.party.forEach((member) => { member.level = 11; });
assert.ok(survey.interactWithNpc(garrick).some((event) => event.type === 'quest-started' && event.questId === 'quest_emberglass_survey'));

const shelfRun = new WorldSimulation(data, shelf, shelf.playerSpawn, survey.party, survey.inventory, survey.quests, survey.gold);
assert.equal(shelfRun.quests.find((state) => state.questId === 'quest_emberglass_survey')?.objectiveProgress.reach_emberglass, 1);
const cinderMotes = shelfRun.monsters.filter((monster) => monster.definition.id === 'cinder_mote');
assert.equal(cinderMotes.length, 4, 'The shelf route should provide the four quest targets in one population cycle');
for (const target of cinderMotes) {
  for (const monster of shelfRun.monsters) {
    monster.alive = false;
    monster.respawn = 999;
  }
  target.alive = true;
  target.hp = 1;
  target.x = shelfRun.player.x + 20;
  target.y = shelfRun.player.y;
  shelfRun.party.forEach((member) => { member.attackCooldown = member.id === shelfRun.player.id ? 0 : 99; });
  shelfRun.update({ x: 0, y: 0, sprint: false, attackPressed: true, autoAttack: false, interactPressed: false, skillRequests: [] }, 0.05);
}
assert.equal(shelfRun.quests.find((state) => state.questId === 'quest_emberglass_survey')?.status, 'ready');
assert.ok(shelfRun.interactWithNpc(orla).some((event) => event.type === 'quest-completed' && event.questId === 'quest_emberglass_survey'));
assert.ok(shelfRun.inventory.some((stack) => stack.itemId === 'emberglass_circlet' && stack.count === 1));
assert.ok(regions[0].warpTable.some((warp) => warp.id === 'warp_emberglass' && warp.unlockQuestId === 'quest_emberglass_survey'));

shelfRun.party.forEach((member) => { member.level = 13; });
assert.ok(shelfRun.interactWithNpc(orla).some((event) => event.type === 'quest-started' && event.questId === 'quest_hollow_kiln'));
const kilnRun = new WorldSimulation(data, kiln, kiln.playerSpawn, shelfRun.party, shelfRun.inventory, shelfRun.quests, shelfRun.gold);
const boss = kilnRun.monsters.find((monster) => monster.definition.id === 'kilnheart_colossus')!;
for (const monster of kilnRun.monsters) {
  monster.alive = false;
  monster.respawn = 999;
}
boss.alive = true;
boss.hp = 1;
boss.x = kilnRun.player.x + 20;
boss.y = kilnRun.player.y;
kilnRun.party.forEach((member) => { member.attackCooldown = member.id === kilnRun.player.id ? 0 : 99; });
const bossEvents = kilnRun.update({ x: 0, y: 0, sprint: false, attackPressed: true, autoAttack: false, interactPressed: false, skillRequests: [] }, 0.05);
assert.ok(bossEvents.some((event) => event.type === 'monster-hit' && event.defeated));
assert.ok(bossEvents.some((event) => event.type === 'item-loot' && event.itemId === 'kilnheart_core'));
assert.equal(kilnRun.quests.find((state) => state.questId === 'quest_hollow_kiln')?.status, 'ready');
const returnRun = new WorldSimulation(data, shelf, shelf.playerSpawn, kilnRun.party, kilnRun.inventory, kilnRun.quests, kilnRun.gold);
assert.ok(returnRun.interactWithNpc(orla).some((event) => event.type === 'quest-completed' && event.questId === 'quest_hollow_kiln'));
assert.ok(returnRun.inventory.some((stack) => stack.itemId === 'hearthspark_glaive' && stack.count === 1));
assert.ok(returnRun.inventory.some((stack) => stack.itemId === 'cinder_cordial' && stack.count === 2));

console.log('Emberglass content smoke test passed: maps, monsters, loot, quests, boss, rewards, warp, and art are connected.');
