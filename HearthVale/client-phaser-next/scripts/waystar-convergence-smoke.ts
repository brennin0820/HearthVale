import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import type { CollisionGrid, GameData, MapDefinition, MapPropSet, Vec2 } from '../src/game/data/types.js';
import { NO_INPUT } from '../src/game/input/actions.js';
import { buildWorldMapModel } from '../src/game/navigation/worldMap.js';
import { isWalkable } from '../src/game/simulation/CollisionGrid.js';
import { EVOLUTION_RETRAIN_COST, WorldSimulation, type MonsterState, type QuestState, type SimEvent } from '../src/game/simulation/WorldSimulation.js';

const projectRoot = resolve(import.meta.dirname, '../..');
async function json<T>(relativePath: string): Promise<T> {
  return JSON.parse(await readFile(resolve(projectRoot, relativePath), 'utf8')) as T;
}

const mapIds = ['waystar_moor', 'convergence_spire'] as const;
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

function inventoryCount(simulation: WorldSimulation, itemId: string): number {
  return simulation.inventory.filter((stack) => stack.itemId === itemId)
    .reduce((total, stack) => total + stack.count, 0);
}

function movePlayer(simulation: WorldSimulation, point: Vec2): void {
  simulation.player.x = point.x;
  simulation.player.y = point.y;
}

function setPartyLevel(simulation: WorldSimulation, level: number): void {
  for (const member of simulation.party) member.level = level;
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

const namesong = mapById('namesong_vault');
const moor = mapById('waystar_moor');
const spire = mapById('convergence_spire');
const calix = npcs.find((npc) => npc.id === 'moorwarden_calix');
const fenn = npcs.find((npc) => npc.id === 'quartermaster_fenn');
const ione = npcs.find((npc) => npc.id === 'pathweaver_ione');
assert.ok(calix && fenn && ione, 'Waystar should export its quest, merchant, and calling NPCs');

assert.equal(maps.length, 33);
assert.equal(monsters.length, 71);
assert.equal(items.length, 167);
assert.equal(drops.length, 71);
assert.equal(shops.length, 10);
assert.equal(recipes.length, 52);
assert.equal(quests.length, 23);
assert.equal(skills.length, 38);
assert.equal(maps.flatMap((map) => map.resourceNodes ?? []).length, 71);

assert.equal(namesong.portals.find((portal) => portal.targetMapId === moor.id)?.requiredQuestId, 'quest_namesong_vault');
assert.equal(moor.portals.find((portal) => portal.targetMapId === spire.id)?.requiredQuestStartedId, 'quest_convergence_rite');
assert.ok(moor.portals.some((portal) => portal.targetMapId === namesong.id));
assert.ok(spire.portals.some((portal) => portal.targetMapId === moor.id));

for (const map of [moor, spire]) {
  const collision = data.collisions?.[map.id];
  const props = data.props?.[map.id];
  assert.ok(collision && collision.walkable.flat().some((tile) => !tile), `${map.id} needs blocked terrain`);
  assert.ok(props && props.props.length >= 35, `${map.id} needs a full authored prop layer`);
  for (const point of [
    map.playerSpawn,
    ...map.portals.map((portal) => portal.position),
    ...map.npcs.map((npc) => npc.position),
    ...(map.resourceNodes ?? []).map((node) => node.position),
  ]) assert.ok(isWalkable(map, collision, point), `${map.id} traversal point should be walkable`);
}

const frontierMonsterIds = [
  'waystar_grazer', 'compass_scarab', 'pathless_wisp',
  'vowsteel_knight', 'splitstar_echo', 'manyroad_crown',
];
for (const monsterId of frontierMonsterIds) {
  assert.ok(monsters.find((monster) => monster.id === monsterId)?.abilities?.length, `${monsterId} should have an ability`);
  assert.ok(drops.some((table) => table.monsterId === monsterId), `${monsterId} should have loot`);
}
assert.equal(monsters.find((monster) => monster.id === 'manyroad_crown')?.abilities?.length, 2);
assert.ok(drops.find((table) => table.monsterId === 'manyroad_crown')?.entries
  .some((entry) => entry.itemId === 'manyroad_keystone' && entry.weight === 100));

const evolutionIds = jobs.flatMap((job) => job.evolutions?.map((evolution) => evolution.id) ?? []);
const evolutionSkillIds = jobs.flatMap((job) => job.evolutions?.map((evolution) => evolution.skillId) ?? []);
assert.equal(evolutionIds.length, 12);
assert.equal(new Set(evolutionIds).size, 12);
assert.equal(new Set(evolutionSkillIds).size, 12);
for (const skillId of evolutionSkillIds) {
  const skill = skills.find((candidate) => candidate.id === skillId);
  assert.ok(skill?.evolutionIds?.length === 1, `${skillId} should belong to one calling`);
  assert.equal(skill.unlockQuestId, 'quest_convergence_rite');
}

const namesongComplete: QuestState = {
  questId: 'quest_namesong_vault', status: 'completed', progress: 1, target: 1, objectiveProgress: {},
};
const lockedEvolution = new WorldSimulation(data, moor, moor.playerSpawn, undefined, [], [namesongComplete], 0);
setPartyLevel(lockedEvolution, 27);
assert.ok(lockedEvolution.changeJob('warden', 'warden').some((event) => event.type === 'job-changed'));
assert.ok(lockedEvolution.chooseEvolution('warden', 'hearthwall_marshal')
  .some((event) => event.type === 'evolution-change-blocked' && event.reason === 'level'));
setPartyLevel(lockedEvolution, 28);
assert.ok(lockedEvolution.chooseEvolution('warden', 'hearthwall_marshal')
  .some((event) => event.type === 'evolution-change-blocked' && event.reason === 'quest'));

const convergenceComplete: QuestState = {
  questId: 'quest_convergence_rite', status: 'completed', progress: 1, target: 1, objectiveProgress: {},
};
const callingRun = new WorldSimulation(
  data, moor, moor.playerSpawn, undefined,
  [{ itemId: 'pathforged_glaive', count: 1 }, { itemId: 'waystar_rune', count: 1 }, { itemId: 'anchorcord_tea', count: 1 }],
  [namesongComplete, convergenceComplete], 1500,
);
setPartyLevel(callingRun, 28);
assert.ok(callingRun.changeJob('warden', 'warden').some((event) => event.type === 'job-changed'));
const hpBeforeCalling = callingRun.player.maxHp;
assert.ok(callingRun.chooseEvolution('warden', 'hearthwall_marshal')
  .some((event) => event.type === 'evolution-changed' && event.goldCost === 0));
assert.equal(callingRun.player.className, 'Hearthwall Marshal');
assert.equal(callingRun.player.maxHp, hpBeforeCalling + 90);
assert.deepEqual(callingRun.evolutionBonuses('warden'), { hp: 90, def: 10 });
assert.ok(callingRun.skillLoadoutOptions('warden').some((skill) => skill.id === 'citadel_oath'));
assert.ok(!callingRun.skillLoadoutOptions('warden').some((skill) => skill.id === 'sunward_cleave'));
assert.ok(callingRun.toggleSkillLoadout('warden', 'vale_slash')
  .some((event) => event.type === 'skill-loadout-changed' && !event.equipped));
assert.ok(callingRun.toggleSkillLoadout('warden', 'citadel_oath')
  .some((event) => event.type === 'skill-loadout-changed'));
assert.ok(callingRun.chooseEvolution('warden', 'waystar_stalker')
  .some((event) => event.type === 'evolution-change-blocked' && event.reason === 'path'));

const goldBeforeRetrain = callingRun.gold;
assert.equal(callingRun.evolutionChangeCost('warden', 'dawnspear_vanguard'), EVOLUTION_RETRAIN_COST);
assert.ok(callingRun.chooseEvolution('warden', 'dawnspear_vanguard')
  .some((event) => event.type === 'evolution-changed' && event.goldCost === EVOLUTION_RETRAIN_COST));
assert.equal(callingRun.gold, goldBeforeRetrain - EVOLUTION_RETRAIN_COST);
assert.equal(callingRun.player.className, 'Dawnspear Vanguard');
assert.ok(!callingRun.player.skillIds.includes('citadel_oath'), 'Retraining should remove the former calling technique');
assert.ok(callingRun.skillLoadoutOptions('warden').some((skill) => skill.id === 'sunward_cleave'));

const restoredCalling = new WorldSimulation(
  data, moor, moor.playerSpawn, structuredClone(callingRun.party), callingRun.inventory,
  [namesongComplete, convergenceComplete], callingRun.gold, callingRun.equipment,
  callingRun.discoveredMapIds, callingRun.resourceCooldowns, callingRun.sockets,
);
assert.equal(restoredCalling.player.evolutionId, 'dawnspear_vanguard');
assert.equal(restoredCalling.player.className, 'Dawnspear Vanguard');
const invalidCalling = new WorldSimulation(
  data, moor, moor.playerSpawn, structuredClone(callingRun.party), callingRun.inventory,
  [namesongComplete], callingRun.gold, callingRun.equipment,
  callingRun.discoveredMapIds, callingRun.resourceCooldowns, callingRun.sockets,
);
assert.equal(invalidCalling.player.evolutionId, undefined, 'Saves should discard callings whose quest is not complete');

assert.ok(callingRun.equipItem('warden', 'pathforged_glaive').some((event) => event.type === 'item-equipped'));
assert.ok(callingRun.socketRune('warden', 'weapon', 'waystar_rune').some((event) => event.type === 'rune-socketed'));
const runeSpeed = callingRun.attackIntervalFor('warden');
callingRun.player.activeEffects.push({ skillId: 'test_severance', stat: 'severed', amount: 1, remaining: 10 });
const severedSpeed = callingRun.attackIntervalFor('warden');
assert.ok(severedSpeed > runeSpeed, 'Severed should suppress a socketed speed rune');
assert.ok(callingRun.useItem('anchorcord_tea')
  .some((event) => event.type === 'status-cured' && event.status === 'severed'));
assert.equal(callingRun.attackIntervalFor('warden'), runeSpeed, 'Anchorcord Tea should restore rune speed');

const economyRun = new WorldSimulation(data, moor, moor.playerSpawn, undefined, [], [convergenceComplete], 5000);
setPartyLevel(economyRun, 28);
economyRun.changeJob('warden', 'wayfarer');
const baseBuyMultiplier = economyRun.buyPriceMultiplier();
assert.ok(economyRun.chooseEvolution('warden', 'grand_trailbroker').some((event) => event.type === 'evolution-changed'));
assert.ok(economyRun.buyPriceMultiplier() < baseBuyMultiplier);
assert.ok(economyRun.stackSizeBonus() >= 25);
assert.ok(economyRun.buyItem(fenn.id, 'anchorcord_tea').some((event) => event.type === 'economy-transaction'));

const fieldRun = new WorldSimulation(
  data, moor, moor.playerSpawn, undefined, [], [namesongComplete], 20000, undefined, undefined, undefined, undefined,
  { rngSalt: 'phaser-waystar-1' },
);
setPartyLevel(fieldRun, 28);
assert.ok(fieldRun.interactWithNpc(calix).some((event) => event.type === 'quest-started' && event.questId === 'quest_waystar_crossing'));

for (const node of fieldRun.resources) {
  movePlayer(fieldRun, node);
  assert.ok(fieldRun.gatherResource(node.definition.id).some((event) => event.type === 'resource-gathered'));
}
for (const target of fieldRun.monsters.filter((monster) => monster.definition.id === 'waystar_grazer').slice(0, 5)) defeat(fieldRun, target);
for (const target of fieldRun.monsters.filter((monster) => monster.definition.id === 'compass_scarab').slice(0, 4)) defeat(fieldRun, target);
for (const target of fieldRun.monsters.filter((monster) => monster.definition.id === 'pathless_wisp').slice(0, 4)) defeat(fieldRun, target);
assert.equal(fieldRun.quests.find((quest) => quest.questId === 'quest_waystar_crossing')?.status, 'ready');
assert.ok(fieldRun.interactWithNpc(calix).some((event) => event.type === 'quest-completed' && event.questId === 'quest_waystar_crossing'));
assert.equal(inventoryCount(fieldRun, 'vowglass_aegis'), 1);
assert.ok(fieldRun.interactWithNpc(ione).some((event) => event.type === 'quest-started' && event.questId === 'quest_convergence_rite'));

const activeWorld = buildWorldMapModel(data, moor.id, 28, fieldRun.quests, [namesong.id, moor.id]);
assert.equal(activeWorld.pinCount, 14);
assert.equal(activeWorld.nodes.find((node) => node.id === spire.id)?.status, 'available');
assert.ok(activeWorld.nodes.find((node) => node.id === spire.id)?.objectiveLabels.includes('Defeat the Manyroad Crown'));

const dungeonRun = new WorldSimulation(
  data, spire, spire.playerSpawn, fieldRun.party, fieldRun.inventory, fieldRun.quests, fieldRun.gold,
  fieldRun.equipment, fieldRun.discoveredMapIds, fieldRun.resourceCooldowns, fieldRun.sockets,
  { rngSalt: 'phaser-waystar-1' },
);
for (const node of dungeonRun.resources) {
  movePlayer(dungeonRun, node);
  assert.ok(dungeonRun.gatherResource(node.definition.id).some((event) => event.type === 'resource-gathered'));
}
for (const target of dungeonRun.monsters.filter((monster) => monster.definition.id === 'vowsteel_knight').slice(0, 5)) defeat(dungeonRun, target);
for (const target of dungeonRun.monsters.filter((monster) => monster.definition.id === 'splitstar_echo').slice(0, 4)) defeat(dungeonRun, target);
const boss = dungeonRun.monsters.find((monster) => monster.definition.id === 'manyroad_crown');
assert.ok(boss);
assert.ok(defeat(dungeonRun, boss).some((event) => event.type === 'item-loot' && event.itemId === 'manyroad_keystone'));
assert.equal(dungeonRun.quests.find((quest) => quest.questId === 'quest_convergence_rite')?.status, 'ready');

const finalReturn = new WorldSimulation(
  data, moor, moor.playerSpawn, dungeonRun.party, dungeonRun.inventory, dungeonRun.quests, dungeonRun.gold,
  dungeonRun.equipment, dungeonRun.discoveredMapIds, dungeonRun.resourceCooldowns, dungeonRun.sockets,
);
assert.ok(finalReturn.interactWithNpc(ione).some((event) => event.type === 'quest-completed' && event.questId === 'quest_convergence_rite'));
assert.equal(inventoryCount(finalReturn, 'manyroad_keystone'), 0);
assert.equal(inventoryCount(finalReturn, 'manyroad_signet'), 1);
assert.ok(finalReturn.changeJob('warden', 'warden').some((event) => event.type === 'job-changed'));
assert.ok(finalReturn.chooseEvolution('warden', 'hearthwall_marshal')
  .some((event) => event.type === 'evolution-changed' && event.goldCost === 0));
assert.ok(finalReturn.travelByCourier('warp_convergence')
  .some((event) => event.type === 'courier-warp-requested' && event.goldCost === 1880));

console.log('Waystar and Convergence smoke test passed: maps, monsters, gathering, quests, boss, economy, callings, exclusive skills, retraining, Severed runes, travel, and saves are connected.');
