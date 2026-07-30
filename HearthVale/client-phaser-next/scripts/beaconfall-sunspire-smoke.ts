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

const mapIds = ['beaconfall_cliffs', 'sunspire_observatory'] as const;
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

function playerAttackDamage(sunblindAmount = 0): number {
  const simulation = new WorldSimulation(data, mapById('beaconfall_cliffs'), mapById('beaconfall_cliffs').playerSpawn);
  simulation.party.forEach((member) => {
    member.level = 20;
    member.attackCooldown = member.id === simulation.player.id ? 0 : 99;
  });
  for (const monster of simulation.monsters) monster.alive = false;
  const target = simulation.monsters.find((monster) => monster.definition.id === 'cliffglass_ram');
  assert.ok(target);
  target.alive = true;
  target.hp = target.maxHp;
  target.x = simulation.player.x + 20;
  target.y = simulation.player.y;
  if (sunblindAmount > 0) simulation.player.activeEffects.push({
    skillId: 'status:sunblind', stat: 'sunblind', amount: sunblindAmount, remaining: 10,
  });
  const hit = simulation.update({ ...NO_INPUT, attackPressed: true }, 0.05)
    .find((event): event is Extract<SimEvent, { type: 'monster-hit' }> => event.type === 'monster-hit' && event.memberId === simulation.player.id);
  assert.ok(hit);
  return hit.amount;
}

const cliffs = mapById('beaconfall_cliffs');
const observatory = mapById('sunspire_observatory');
const sela = npcs.find((npc) => npc.id === 'astronomer_sela');
const roan = npcs.find((npc) => npc.id === 'cliffsmith_roan');
assert.ok(sela && roan, 'Beaconfall quest and merchant NPCs should export');

assert.equal(maps.length, 33);
assert.equal(monsters.length, 71);
assert.equal(items.length, 167);
assert.equal(drops.length, 71);
assert.equal(recipes.length, 52);
assert.equal(quests.length, 23);
assert.equal(maps.flatMap((map) => map.resourceNodes ?? []).length, 71);

const cliffsGate = cliffs.portals.find((portal) => portal.targetMapId === observatory.id);
assert.equal(cliffsGate?.requiredLevel, 18);
assert.equal(cliffsGate?.requiredQuestStartedId, 'quest_sunspire_lens');
assert.ok(cliffs.portals.some((portal) => portal.targetMapId === 'stormglass_reliquary'));
assert.ok(observatory.portals.some((portal) => portal.targetMapId === cliffs.id));

for (const map of [cliffs, observatory]) {
  const collision = data.collisions?.[map.id];
  const props = data.props?.[map.id];
  assert.ok(collision && collision.walkable.flat().some((tile) => !tile), `${map.id} needs blocked terrain`);
  assert.ok(props && props.props.length >= 35, `${map.id} needs a full authored prop layer`);
  for (const point of [
    map.playerSpawn,
    ...map.portals.map((portal) => portal.position),
    ...map.npcs.map((npc) => npc.position),
    ...(map.resourceNodes ?? []).map((node) => node.position),
  ]) assert.ok(isWalkable(map, collision, point), `${map.id} authored traversal point should be walkable`);
}

for (const monsterId of ['sunveil_sprite', 'zephyrkin_screecher', 'cliffglass_ram', 'lensbound_sentry', 'starfall_choir', 'celestial_orrery']) {
  const monster = monsters.find((candidate) => candidate.id === monsterId);
  assert.ok(monster?.abilities?.length, `${monsterId} should have an authored ability`);
  assert.ok(drops.some((table) => table.monsterId === monsterId), `${monsterId} should have loot`);
}
assert.equal(monsters.find((monster) => monster.id === 'celestial_orrery')?.abilities?.length, 2);
for (const itemId of [
  'sunveil_petal', 'skyglass_ore', 'zephyr_pinion', 'auric_cog', 'starfall_dust', 'lens_prism',
  'clarity_tonic', 'sunward_philter', 'starfall_elixir', 'cliffwalker_boots', 'sunward_visor',
  'skyglass_arcblade', 'observatory_aegis', 'astrolabe_regalia', 'sunspire_compass', 'aurora_lens_core',
]) assert.ok(items.some((item) => item.id === itemId), `${itemId} should exist`);
for (const recipeId of [
  'recipe_clarity_tonic', 'recipe_sunward_philter', 'recipe_skyglass_arcblade',
  'recipe_observatory_aegis', 'recipe_astrolabe_regalia',
]) assert.ok(recipes.some((recipe) => recipe.id === recipeId), `${recipeId} should exist`);
assert.ok(shops.find((shop) => shop.id === 'shop_beaconfall_outfitter')?.itemIds.includes('clarity_tonic'));

const abilityRun = new WorldSimulation(data, cliffs, cliffs.playerSpawn, undefined, [{ itemId: 'clarity_tonic', count: 1 }]);
abilityRun.party.forEach((member) => { member.level = 20; });
for (const monster of abilityRun.monsters) monster.alive = false;
const sprite = abilityRun.monsters.find((monster) => monster.definition.id === 'sunveil_sprite');
assert.ok(sprite);
sprite.alive = true;
sprite.x = abilityRun.player.x + 60;
sprite.y = abilityRun.player.y;
sprite.abilityCooldowns.solar_flare = 0;
assert.ok(abilityRun.update(NO_INPUT, 0.05).some((event) => event.type === 'monster-ability-telegraph' && event.abilityId === 'solar_flare'));
const flareEvents = advance(abilityRun, 1);
assert.ok(flareEvents.some((event) => event.type === 'status-applied' && event.status === 'sunblind'));
const blindedBeforeCure = abilityRun.party.filter((member) => member.activeEffects.some((effect) => effect.stat === 'sunblind')).length;
assert.ok(blindedBeforeCure > 0);
const cureEvents = abilityRun.useItem('clarity_tonic');
assert.ok(cureEvents.some((event) => event.type === 'status-cured' && event.status === 'sunblind'));
assert.equal(abilityRun.party.filter((member) => member.activeEffects.some((effect) => effect.stat === 'sunblind')).length, blindedBeforeCure - 1);
assert.ok(playerAttackDamage(30) < playerAttackDamage(), 'Sunblind should reduce outgoing attack damage');

const completedStormglass: QuestState = {
  questId: 'quest_stormglass_reliquary', status: 'completed', progress: 1, target: 1, objectiveProgress: {},
};
const fieldRun = new WorldSimulation(
  data, cliffs, cliffs.playerSpawn, undefined, [], [completedStormglass], 7000, undefined, undefined, undefined, undefined,
  { rngSalt: 'phaser-beacon-8' },
);
fieldRun.party.forEach((member) => { member.level = 20; });
assert.ok(fieldRun.interactWithNpc(sela).some((event) => event.type === 'quest-started' && event.questId === 'quest_beaconfall_ascent'));
assert.ok(fieldRun.buyItem(roan.id, 'clarity_tonic').some((event) => event.type === 'economy-transaction' && event.action === 'buy'));

for (const node of fieldRun.resources) {
  movePlayer(fieldRun, node);
  assert.ok(fieldRun.gatherResource(node.definition.id).some((event) => event.type === 'resource-gathered'));
}
for (const target of fieldRun.monsters.filter((monster) => monster.definition.id === 'sunveil_sprite').slice(0, 4)) defeat(fieldRun, target);
for (const target of fieldRun.monsters.filter((monster) => monster.definition.id === 'zephyrkin_screecher').slice(0, 4)) defeat(fieldRun, target);
for (const target of fieldRun.monsters.filter((monster) => monster.definition.id === 'cliffglass_ram').slice(0, 3)) defeat(fieldRun, target);
assert.equal(fieldRun.quests.find((quest) => quest.questId === 'quest_beaconfall_ascent')?.status, 'ready');
assert.ok(fieldRun.interactWithNpc(sela).some((event) => event.type === 'quest-completed' && event.questId === 'quest_beaconfall_ascent'));
assert.equal(inventoryCount(fieldRun, 'sunward_visor'), 1);
assert.ok(fieldRun.travelByCourier('warp_beaconfall').some((event) => event.type === 'courier-warp-blocked' && event.reason === 'location'));
assert.ok(fieldRun.interactWithNpc(sela).some((event) => event.type === 'quest-started' && event.questId === 'quest_sunspire_lens'));

const activeWorld = buildWorldMapModel(data, cliffs.id, 20, fieldRun.quests, ['stormglass_reliquary', cliffs.id]);
assert.equal(activeWorld.nodes.find((node) => node.id === observatory.id)?.status, 'available');
assert.ok(activeWorld.nodes.find((node) => node.id === observatory.id)?.objectiveLabels.includes('Defeat the Celestial Orrery'));

const dungeonRun = new WorldSimulation(
  data, observatory, observatory.playerSpawn, fieldRun.party, fieldRun.inventory, fieldRun.quests, fieldRun.gold,
  fieldRun.equipment, fieldRun.discoveredMapIds, fieldRun.resourceCooldowns, undefined,
  { rngSalt: 'phaser-beacon-8' },
);
for (const node of dungeonRun.resources.slice(0, 2)) {
  movePlayer(dungeonRun, node);
  assert.ok(dungeonRun.gatherResource(node.definition.id).some((event) => event.type === 'resource-gathered'));
}
for (const target of dungeonRun.monsters.filter((monster) => monster.definition.id === 'lensbound_sentry').slice(0, 5)) defeat(dungeonRun, target);
for (const target of dungeonRun.monsters.filter((monster) => monster.definition.id === 'starfall_choir').slice(0, 4)) defeat(dungeonRun, target);
const boss = dungeonRun.monsters.find((monster) => monster.definition.id === 'celestial_orrery');
assert.ok(boss);
assert.ok(defeat(dungeonRun, boss).some((event) => event.type === 'item-loot' && event.itemId === 'aurora_lens_core'));
assert.equal(dungeonRun.quests.find((quest) => quest.questId === 'quest_sunspire_lens')?.status, 'ready');

const finalReturn = new WorldSimulation(
  data, cliffs, cliffs.playerSpawn, dungeonRun.party, dungeonRun.inventory, dungeonRun.quests, dungeonRun.gold,
  dungeonRun.equipment, dungeonRun.discoveredMapIds, dungeonRun.resourceCooldowns,
);
const completionEvents = finalReturn.interactWithNpc(sela);
assert.ok(completionEvents.some((event) => event.type === 'quest-completed' && event.questId === 'quest_sunspire_lens'));
assert.equal(inventoryCount(finalReturn, 'aurora_lens_core'), 0);
assert.equal(inventoryCount(finalReturn, 'sunspire_compass'), 1);
assert.equal(inventoryCount(finalReturn, 'starfall_elixir'), 3);
assert.ok(finalReturn.travelByCourier('warp_sunspire').some((event) => event.type === 'courier-warp-requested' && event.goldCost === 680));

console.log('Beaconfall and Sunspire smoke test passed: maps, Sunblind, cure, gathering, economy, quests, boss, rewards, world map, and warps are connected.');
