import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import type { CollisionGrid, GameData, MapDefinition, MapPropSet, Vec2 } from '../src/game/data/types.js';
import { NO_INPUT } from '../src/game/input/actions.js';
import { buildWorldMapModel } from '../src/game/navigation/worldMap.js';
import { isWalkable } from '../src/game/simulation/CollisionGrid.js';
import {
  WorldSimulation,
  type MonsterState,
  type QuestState,
  type ResourceCooldowns,
  type SimEvent,
} from '../src/game/simulation/WorldSimulation.js';

const projectRoot = resolve(import.meta.dirname, '../..');
async function json<T>(relativePath: string): Promise<T> {
  return JSON.parse(await readFile(resolve(projectRoot, relativePath), 'utf8')) as T;
}

const gatheringMapIds = [
  'cloverfield_plains_ro', 'emberglass_shelf', 'afterlight_expanse', 'glasswind_coast',
  'tidebreak_causeway', 'stormglass_reliquary',
] as const;
const authoredMapIds = ['dawnshore_camp', 'glasswind_coast', 'tidebreak_causeway', 'stormglass_reliquary'] as const;
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
const collisionIds = [...new Set([...gatheringMapIds, ...authoredMapIds])];
const collisionEntries = await Promise.all(collisionIds.map(async (id) => [
  id, await json<CollisionGrid>(`data/collision/${id}.json`),
] as const));
const propEntries = await Promise.all(authoredMapIds.map(async (id) => [
  id, await json<MapPropSet>(`data/props/${id}.json`),
] as const));
const data: GameData = {
  maps, regions, npcs, monsters, items, quests, drops, shops, recipes, jobs, skills,
  collisions: Object.fromEntries(collisionEntries),
  props: Object.fromEntries(propEntries),
};

function mapById(id: string): MapDefinition {
  const map = maps.find((candidate) => candidate.id === id);
  assert.ok(map, `Missing map ${id}`);
  return map;
}

function inventoryCount(simulation: WorldSimulation, itemId: string): number {
  return simulation.inventory.filter((stack) => stack.itemId === itemId)
    .reduce((total, stack) => total + stack.count, 0);
}

function movePlayer(simulation: WorldSimulation, point: Vec2): void {
  simulation.player.x = point.x;
  simulation.player.y = point.y;
}

function defeat(simulation: WorldSimulation, target: MonsterState): SimEvent[] {
  for (const monster of simulation.monsters) {
    monster.alive = false;
    monster.respawn = 999;
  }
  target.alive = true;
  target.hp = 1;
  target.x = simulation.player.x + 20;
  target.y = simulation.player.y;
  simulation.party.forEach((member) => {
    member.attackCooldown = member.id === simulation.player.id ? 0 : 99;
  });
  return simulation.update({ ...NO_INPUT, attackPressed: true }, 0.05);
}

const clover = mapById('cloverfield_plains_ro');
const emberglass = mapById('emberglass_shelf');
const afterlight = mapById('afterlight_expanse');
const camp = mapById('dawnshore_camp');
const coast = mapById('glasswind_coast');
const nia = npcs.find((npc) => npc.id === 'trailwarden_nia');
assert.ok(nia, 'Trailwarden Nia should export');

assert.equal(maps.length, 33);
assert.equal(maps.flatMap((map) => map.resourceNodes ?? []).length, 71);
assert.deepEqual(gatheringMapIds.map((id) => mapById(id).resourceNodes?.length), [4, 3, 4, 6, 6, 3]);
assert.equal(monsters.length, 71);
assert.equal(items.length, 167);
assert.equal(drops.length, 71);
assert.equal(shops.length, 10);
assert.equal(recipes.length, 52);

for (const mapId of gatheringMapIds) {
  const map = mapById(mapId);
  const collision = data.collisions?.[mapId];
  assert.ok(collision, `${mapId} should export collision`);
  for (const node of map.resourceNodes ?? []) {
    assert.ok(isWalkable(map, collision, node.position), `${mapId} resource ${node.id} should be walkable`);
  }
}

for (const map of authoredMapIds.map(mapById)) {
  const collision = data.collisions?.[map.id];
  const props = data.props?.[map.id];
  assert.ok(collision && collision.walkable.flat().some((tile) => !tile), `${map.id} needs blocked terrain`);
  assert.ok(props && props.props.length >= (map.id === camp.id ? 30 : 35), `${map.id} needs full authored art`);
  const traversalPoints = [
    map.playerSpawn,
    ...map.portals.map((portal) => portal.position),
    ...map.npcs.map((npc) => npc.position),
  ];
  for (const point of traversalPoints) assert.ok(isWalkable(map, collision, point), `${map.id} traversal point is blocked`);
}

const outbound = afterlight.portals.find((portal) => portal.targetMapId === camp.id);
assert.equal(outbound?.requiredLevel, 15);
assert.equal(outbound?.requiredQuestId, 'quest_afterlight_vigil');
assert.ok(camp.portals.some((portal) => portal.targetMapId === afterlight.id));
const coastGate = camp.portals.find((portal) => portal.targetMapId === coast.id);
assert.equal(coastGate?.requiredQuestStartedId, 'quest_glasswind_beacon');
assert.ok(coast.portals.some((portal) => portal.targetMapId === camp.id));
const dawnshoreRegion = regions.find((region) => region.id === 'dawnshore_reach');
assert.equal(dawnshoreRegion?.warpTable.length, 13);

const afterlightVigil: QuestState = {
  questId: 'quest_afterlight_vigil', status: 'completed', progress: 1, target: 1, objectiveProgress: {},
};
const lockedMap = buildWorldMapModel(data, camp.id, 15, [afterlightVigil], [camp.id]);
assert.equal(lockedMap.regionName, 'Dawnshore Reach');
assert.equal(lockedMap.pinCount, 14);
assert.equal(lockedMap.nodes.find((node) => node.id === coast.id)?.status, 'locked');

const gatheringNode = clover.resourceNodes![0];
const gatheringRun = new WorldSimulation(data, clover, gatheringNode.position);
movePlayer(gatheringRun, gatheringRun.resources[0]);
const gathered = gatheringRun.gatherResource(gatheringNode.id);
const gatheredEvent = gathered.find((event) => event.type === 'resource-gathered');
assert.ok(gatheredEvent && gatheredEvent.itemId === 'clover_herb' && gatheredEvent.count >= 1);
assert.equal(inventoryCount(gatheringRun, 'clover_herb'), gatheredEvent.count);
assert.ok(gatheringRun.resourceCooldowns[`${clover.id}:${gatheringNode.id}`] > Date.now());
assert.ok(gatheringRun.gatherResource(gatheringNode.id)
  .some((event) => event.type === 'resource-blocked' && event.reason === 'cooldown'));

const savedCooldowns: ResourceCooldowns = { ...gatheringRun.resourceCooldowns };
const reloadedRun = new WorldSimulation(
  data, clover, gatheringNode.position, undefined, undefined, undefined, undefined, undefined, undefined, savedCooldowns,
);
assert.equal(reloadedRun.resources[0].available, false, 'Gathering cooldown should survive reconstruction');
const expiredRun = new WorldSimulation(
  data, clover, gatheringNode.position, undefined, undefined, undefined, undefined, undefined, undefined,
  { [`${clover.id}:${gatheringNode.id}`]: Date.now() - 1 },
);
assert.equal(expiredRun.resources[0].available, true, 'Expired gathering nodes should reform');

const lockedNode = emberglass.resourceNodes![0];
const levelLockedRun = new WorldSimulation(data, emberglass, lockedNode.position);
movePlayer(levelLockedRun, levelLockedRun.resources[0]);
assert.ok(levelLockedRun.gatherResource(lockedNode.id)
  .some((event) => event.type === 'resource-blocked' && event.reason === 'level'));

const oreSenseRun = new WorldSimulation(
  data, clover, gatheringNode.position, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined,
  { rngSalt: 'phaser-dawnshore-11' },
);
oreSenseRun.party[1].skillIds.push('ore_sense');
movePlayer(oreSenseRun, oreSenseRun.resources[0]);
const bonusGather = oreSenseRun.gatherResource(gatheringNode.id);
assert.ok(bonusGather.some((event) => event.type === 'resource-gathered' && event.bonus === 1 && event.count === 2));

const campRun = new WorldSimulation(data, camp, camp.playerSpawn, undefined, [], [afterlightVigil], 500);
campRun.party.forEach((member) => { member.level = 15; });
const startEvents = campRun.interactWithNpc(nia);
assert.ok(startEvents.some((event) => event.type === 'quest-started' && event.questId === 'quest_glasswind_beacon'));
const activeMap = buildWorldMapModel(data, camp.id, 15, campRun.quests, [camp.id]);
const coastNode = activeMap.nodes.find((node) => node.id === coast.id);
assert.equal(coastNode?.status, 'available');
assert.ok(coastNode?.objectiveLabels.includes('Gather Sunwake Kelp'));

const coastRun = new WorldSimulation(
  data, coast, coast.playerSpawn, campRun.party, campRun.inventory, campRun.quests, campRun.gold,
  campRun.equipment, campRun.discoveredMapIds, campRun.resourceCooldowns, undefined,
  { rngSalt: 'phaser-dawnshore-11' },
);
assert.equal(coastRun.quests.find((state) => state.questId === 'quest_glasswind_beacon')
  ?.objectiveProgress.reach_glasswind, 1);
assert.equal(coastRun.monsters.filter((monster) => monster.definition.id === 'beacon_wraith').length, 3);
assert.equal(coastRun.monsters.filter((monster) => monster.definition.id === 'drowned_meridian').length, 1);

for (const node of coastRun.resources.filter((resource) => resource.definition.itemId === 'sunwake_kelp').slice(0, 2)) {
  movePlayer(coastRun, node);
  const events = coastRun.gatherResource(node.definition.id);
  assert.ok(events.some((event) => event.type === 'resource-gathered' && event.count === 2));
}
assert.equal(inventoryCount(coastRun, 'sunwake_kelp'), 4);

for (const wraith of coastRun.monsters.filter((monster) => monster.definition.id === 'beacon_wraith')) {
  assert.ok(defeat(coastRun, wraith).some((event) => event.type === 'monster-hit' && event.defeated));
}
const boss = coastRun.monsters.find((monster) => monster.definition.id === 'drowned_meridian');
assert.ok(boss);
const bossEvents = defeat(coastRun, boss);
assert.ok(bossEvents.some((event) => event.type === 'item-loot' && event.itemId === 'glasswind_compass'));
assert.equal(coastRun.quests.find((state) => state.questId === 'quest_glasswind_beacon')?.status, 'ready');

const returnRun = new WorldSimulation(
  data, camp, camp.playerSpawn, coastRun.party, coastRun.inventory, coastRun.quests, coastRun.gold,
  coastRun.equipment, coastRun.discoveredMapIds, coastRun.resourceCooldowns,
);
const completionEvents = returnRun.interactWithNpc(nia);
assert.ok(completionEvents.some((event) => event.type === 'quest-completed'
  && event.questId === 'quest_glasswind_beacon' && !event.campaignCompleted));
assert.equal(inventoryCount(returnRun, 'sunwake_kelp'), 0);
assert.equal(inventoryCount(returnRun, 'glasswind_compass'), 0);
assert.equal(inventoryCount(returnRun, 'sunwake_sabre'), 1);
assert.equal(inventoryCount(returnRun, 'shoreline_stew'), 3);
assert.ok(returnRun.travelByCourier('warp_glasswind').some((event) => event.type === 'courier-warp-requested'
  && event.targetMapId === coast.id && event.goldCost === 240));

console.log('Dawnshore gathering smoke test passed: nodes, persistence, Ore Sense, authored maps, quest, boss, rewards, guidance, and courier are connected.');
