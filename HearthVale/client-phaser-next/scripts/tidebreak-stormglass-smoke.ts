import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import type { CollisionGrid, GameData, MapDefinition, MapPropSet, Vec2 } from '../src/game/data/types.js';
import { NO_INPUT } from '../src/game/input/actions.js';
import { buildWorldMapModel } from '../src/game/navigation/worldMap.js';
import { isWalkable } from '../src/game/simulation/CollisionGrid.js';
import { WorldSimulation, type MonsterState, type QuestState, type SimEvent } from '../src/game/simulation/WorldSimulation.js';

const projectRoot = resolve(import.meta.dirname, '../..');
async function json<T>(relativePath: string): Promise<T> {
  return JSON.parse(await readFile(resolve(projectRoot, relativePath), 'utf8')) as T;
}

const mapIds = ['tidebreak_causeway', 'stormglass_reliquary'] as const;
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
const collisionEntries = await Promise.all(mapIds.map(async (id) => [
  id, await json<CollisionGrid>(`data/collision/${id}.json`),
] as const));
const propEntries = await Promise.all(mapIds.map(async (id) => [
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

function movePlayer(simulation: WorldSimulation, point: Vec2): void {
  simulation.player.x = point.x;
  simulation.player.y = point.y;
}

function inventoryCount(simulation: WorldSimulation, itemId: string): number {
  return simulation.inventory.filter((stack) => stack.itemId === itemId)
    .reduce((total, stack) => total + stack.count, 0);
}

function advance(simulation: WorldSimulation, seconds: number): SimEvent[] {
  const events: SimEvent[] = [];
  for (let elapsed = 0; elapsed < seconds; elapsed += 0.05) events.push(...simulation.update(NO_INPUT, 0.05));
  return events;
}

function defeat(simulation: WorldSimulation, target: MonsterState): SimEvent[] {
  for (const monster of simulation.monsters) {
    monster.alive = false;
    monster.respawn = 999;
    monster.telegraph = undefined;
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

const camp = mapById('dawnshore_camp');
const coast = mapById('glasswind_coast');
const causeway = mapById('tidebreak_causeway');
const reliquary = mapById('stormglass_reliquary');
const nia = npcs.find((npc) => npc.id === 'trailwarden_nia');
const orrin = npcs.find((npc) => npc.id === 'beaconwright_orrin');
assert.ok(nia && orrin, 'Both Dawnshore quest keepers should export');

assert.equal(maps.length, 33);
assert.equal(monsters.length, 71);
assert.equal(items.length, 167);
assert.equal(drops.length, 71);
assert.equal(recipes.length, 52);
assert.equal(quests.length, 23);
assert.equal(maps.flatMap((map) => map.resourceNodes ?? []).length, 71);

const coastGate = coast.portals.find((portal) => portal.targetMapId === causeway.id);
assert.equal(coastGate?.requiredLevel, 16);
assert.equal(coastGate?.requiredQuestStartedId, 'quest_tidebreak_road');
const dungeonGate = causeway.portals.find((portal) => portal.targetMapId === reliquary.id);
assert.equal(dungeonGate?.requiredLevel, 17);
assert.equal(dungeonGate?.requiredQuestStartedId, 'quest_stormglass_reliquary');
assert.ok(causeway.portals.some((portal) => portal.targetMapId === coast.id));
assert.ok(reliquary.portals.some((portal) => portal.targetMapId === causeway.id));

for (const map of [causeway, reliquary]) {
  const collision = data.collisions?.[map.id];
  const props = data.props?.[map.id];
  assert.ok(collision && collision.walkable.flat().some((tile) => !tile), `${map.id} needs blocked terrain`);
  assert.ok(props && props.props.length >= 35, `${map.id} needs a full authored prop layer`);
  for (const point of [
    map.playerSpawn,
    ...map.portals.map((portal) => portal.position),
    ...map.npcs.map((npc) => npc.position),
    ...(map.resourceNodes ?? []).map((node) => node.position),
  ]) {
    assert.ok(isWalkable(map, collision, point), `${map.id} authored traversal point should be walkable`);
  }
}

for (const monsterId of ['brinewing_ray', 'surgeclaw', 'galehorn_prowler', 'stormglass_custodian', 'tempest_remnant']) {
  const monster = monsters.find((candidate) => candidate.id === monsterId);
  assert.ok(monster?.abilities?.length, `${monsterId} should have an authored ability`);
  assert.ok(drops.some((table) => table.monsterId === monsterId), `${monsterId} should have loot`);
}
assert.equal(monsters.find((monster) => monster.id === 'tempest_remnant')?.abilities?.length, 2);
for (const itemId of [
  'stormreed_fiber', 'tideiron_scale', 'charged_pearl', 'stormglass_fragment', 'stormclear_draught',
  'tempest_cordial', 'tidebreak_spear', 'stormglass_buckler', 'windward_mantle', 'remnant_lens', 'tempest_heart',
]) assert.ok(items.some((item) => item.id === itemId), `${itemId} should exist`);
for (const recipeId of ['recipe_stormclear_draught', 'recipe_tempest_cordial', 'recipe_tidebreak_spear', 'recipe_stormglass_buckler']) {
  assert.ok(recipes.some((recipe) => recipe.id === recipeId), `${recipeId} should exist`);
}

const abilityRun = new WorldSimulation(
  data, causeway, causeway.playerSpawn, undefined, [{ itemId: 'stormclear_draught', count: 1 }],
);
abilityRun.party.forEach((member) => { member.level = 17; });
for (const monster of abilityRun.monsters) monster.alive = false;
const brinewing = abilityRun.monsters.find((monster) => monster.definition.id === 'brinewing_ray');
assert.ok(brinewing);
brinewing.alive = true;
brinewing.x = abilityRun.player.x + 60;
brinewing.y = abilityRun.player.y;
brinewing.abilityCooldowns.undertow_burst = 0;
const baseInterval = abilityRun.attackIntervalFor(abilityRun.player.id);
const windup = abilityRun.update(NO_INPUT, 0.05);
assert.ok(windup.some((event) => event.type === 'monster-ability-telegraph' && event.abilityId === 'undertow_burst'));
assert.equal(brinewing.telegraph?.abilityId, 'undertow_burst');
const abilityEvents = advance(abilityRun, 0.9);
assert.ok(abilityEvents.some((event) => event.type === 'player-hit'));
assert.ok(abilityEvents.some((event) => event.type === 'status-applied' && event.status === 'drenched'));
assert.ok(abilityRun.player.activeEffects.some((effect) => effect.stat === 'drenched'));
assert.ok(abilityRun.attackIntervalFor(abilityRun.player.id) > baseInterval * 1.1, 'Drenched should slow attack cadence');
brinewing.alive = false;
const slowedStart = abilityRun.player.x;
advance(abilityRun, 1);
abilityRun.player.x = slowedStart;
for (let elapsed = 0; elapsed < 1; elapsed += 0.05) abilityRun.update({ ...NO_INPUT, x: 1 }, 0.05);
assert.ok(abilityRun.player.x - slowedStart < 165, 'Drenched should slow movement');
const cureEvents = abilityRun.useItem('stormclear_draught');
assert.ok(cureEvents.some((event) => event.type === 'status-cured' && event.status === 'drenched'));
assert.ok(!abilityRun.player.activeEffects.some((effect) => effect.stat === 'drenched'));

const dodgeRun = new WorldSimulation(data, causeway, causeway.playerSpawn);
dodgeRun.party.forEach((member) => { member.level = 17; });
for (const monster of dodgeRun.monsters) monster.alive = false;
const surgeclaw = dodgeRun.monsters.find((monster) => monster.definition.id === 'surgeclaw');
assert.ok(surgeclaw);
surgeclaw.alive = true;
surgeclaw.x = dodgeRun.player.x + 60;
surgeclaw.y = dodgeRun.player.y;
surgeclaw.abilityCooldowns.riptide_clamp = 0;
assert.ok(dodgeRun.update(NO_INPUT, 0.05).some((event) => event.type === 'monster-ability-telegraph'));
dodgeRun.player.x += 260;
assert.ok(!advance(dodgeRun, 0.75).some((event) => event.type === 'player-hit'), 'Leaving a single-target telegraph should avoid it');

const completedGlasswind: QuestState = {
  questId: 'quest_glasswind_beacon', status: 'completed', progress: 1, target: 1, objectiveProgress: {},
};
const campRun = new WorldSimulation(data, camp, camp.playerSpawn, undefined, [], [completedGlasswind], 1800);
campRun.party.forEach((member) => { member.level = 16; });
assert.ok(campRun.interactWithNpc(nia).some((event) => event.type === 'quest-started' && event.questId === 'quest_tidebreak_road'));
const activeMap = buildWorldMapModel(data, camp.id, 16, campRun.quests, [camp.id, coast.id]);
assert.equal(activeMap.pinCount, 14);
assert.equal(activeMap.nodes.find((node) => node.id === causeway.id)?.status, 'available');
assert.ok(activeMap.nodes.find((node) => node.id === causeway.id)?.objectiveLabels.includes('Gather Stormreed Fiber'));

const causewayRun = new WorldSimulation(
  data, causeway, causeway.playerSpawn, campRun.party, campRun.inventory, campRun.quests, campRun.gold,
  campRun.equipment, campRun.discoveredMapIds, campRun.resourceCooldowns, undefined,
  { rngSalt: 'phaser-tidebreak-19' },
);
assert.equal(causewayRun.quests.find((quest) => quest.questId === 'quest_tidebreak_road')?.objectiveProgress.reach_tidebreak, 1);
for (const node of causewayRun.resources.filter((resource) => resource.definition.itemId === 'stormreed_fiber').slice(0, 2)) {
  movePlayer(causewayRun, node);
  assert.ok(causewayRun.gatherResource(node.definition.id).some((event) => event.type === 'resource-gathered' && event.count === 2));
}
for (const target of causewayRun.monsters.filter((monster) => monster.definition.id === 'brinewing_ray').slice(0, 4)) defeat(causewayRun, target);
for (const target of causewayRun.monsters.filter((monster) => monster.definition.id === 'surgeclaw').slice(0, 3)) defeat(causewayRun, target);
for (const target of causewayRun.monsters.filter((monster) => monster.definition.id === 'galehorn_prowler').slice(0, 2)) defeat(causewayRun, target);
assert.equal(causewayRun.quests.find((quest) => quest.questId === 'quest_tidebreak_road')?.status, 'ready');

const roadReturn = new WorldSimulation(
  data, camp, camp.playerSpawn, causewayRun.party, causewayRun.inventory, causewayRun.quests, causewayRun.gold,
  causewayRun.equipment, causewayRun.discoveredMapIds, causewayRun.resourceCooldowns,
);
assert.ok(roadReturn.interactWithNpc(nia).some((event) => event.type === 'quest-completed' && event.questId === 'quest_tidebreak_road'));
assert.equal(inventoryCount(roadReturn, 'windward_mantle'), 1);
assert.equal(inventoryCount(roadReturn, 'stormclear_draught'), 3);
assert.ok(roadReturn.travelByCourier('warp_tidebreak').some((event) => event.type === 'courier-warp-requested' && event.goldCost === 320));

const keeperRun = new WorldSimulation(
  data, causeway, causeway.playerSpawn, roadReturn.party, roadReturn.inventory, roadReturn.quests, roadReturn.gold,
  roadReturn.equipment, roadReturn.discoveredMapIds, roadReturn.resourceCooldowns,
);
assert.ok(keeperRun.interactWithNpc(orrin).some((event) => event.type === 'quest-started' && event.questId === 'quest_stormglass_reliquary'));
const dungeonRun = new WorldSimulation(
  data, reliquary, reliquary.playerSpawn, keeperRun.party, keeperRun.inventory, keeperRun.quests, keeperRun.gold,
  keeperRun.equipment, keeperRun.discoveredMapIds, keeperRun.resourceCooldowns, undefined,
  { rngSalt: 'phaser-tidebreak-19' },
);
for (const target of dungeonRun.monsters.filter((monster) => monster.definition.id === 'stormglass_custodian').slice(0, 4)) defeat(dungeonRun, target);
const boss = dungeonRun.monsters.find((monster) => monster.definition.id === 'tempest_remnant');
assert.ok(boss);
const bossEvents = defeat(dungeonRun, boss);
assert.ok(bossEvents.some((event) => event.type === 'item-loot' && event.itemId === 'tempest_heart'));
assert.equal(dungeonRun.quests.find((quest) => quest.questId === 'quest_stormglass_reliquary')?.status, 'ready');

const finalReturn = new WorldSimulation(
  data, causeway, causeway.playerSpawn, dungeonRun.party, dungeonRun.inventory, dungeonRun.quests, dungeonRun.gold,
  dungeonRun.equipment, dungeonRun.discoveredMapIds, dungeonRun.resourceCooldowns,
);
assert.ok(finalReturn.interactWithNpc(orrin).some((event) => event.type === 'quest-completed' && event.questId === 'quest_stormglass_reliquary'));
assert.equal(inventoryCount(finalReturn, 'tempest_heart'), 0);
assert.equal(inventoryCount(finalReturn, 'remnant_lens'), 1);
assert.equal(inventoryCount(finalReturn, 'tempest_cordial'), 3);
assert.ok(finalReturn.travelByCourier('warp_stormglass').some((event) => event.type === 'courier-warp-requested' && event.goldCost === 440));

console.log('Tidebreak and Stormglass smoke test passed: maps, monsters, telegraphs, dodge, drenched cure, gathering, quests, boss, rewards, and warps are connected.');
