import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import type { CollisionGrid, GameData, MapDefinition, MapPropSet, Vec2 } from '../src/game/data/types.js';
import { NO_INPUT } from '../src/game/input/actions.js';
import { buildWorldMapModel } from '../src/game/navigation/worldMap.js';
import { buildQuestJournal } from '../src/game/quests/journal.js';
import { isWalkable } from '../src/game/simulation/CollisionGrid.js';
import { WorldSimulation, type MonsterState, type QuestState, type SimEvent } from '../src/game/simulation/WorldSimulation.js';

const projectRoot = resolve(import.meta.dirname, '../..');
async function json<T>(relativePath: string): Promise<T> {
  return JSON.parse(await readFile(resolve(projectRoot, relativePath), 'utf8')) as T;
}

const mapIds = ['aurora_highlands', 'zenith_archive'] as const;
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

function incomingAttackDamage(fracturedAmount = 0): number {
  const simulation = new WorldSimulation(data, mapById('aurora_highlands'), mapById('aurora_highlands').playerSpawn);
  simulation.party.forEach((member) => {
    member.level = 22;
    member.hp = member.id === simulation.player.id ? member.maxHp : 0;
  });
  for (const monster of simulation.monsters) monster.alive = false;
  const attacker = simulation.monsters.find((monster) => monster.definition.id === 'sunforge_boar');
  assert.ok(attacker);
  attacker.alive = true;
  attacker.attackCooldown = 0;
  attacker.x = simulation.player.x + 20;
  attacker.y = simulation.player.y;
  for (const ability of attacker.definition.abilities ?? []) attacker.abilityCooldowns[ability.id] = 99;
  if (fracturedAmount > 0) simulation.player.activeEffects.push({
    skillId: 'status:fractured', stat: 'fractured', amount: fracturedAmount, remaining: 10,
  });
  const hit = simulation.update(NO_INPUT, 0.05)
    .find((event): event is Extract<SimEvent, { type: 'player-hit' }> => event.type === 'player-hit' && event.memberId === simulation.player.id);
  assert.ok(hit);
  return hit.amount;
}

const highlands = mapById('aurora_highlands');
const archive = mapById('zenith_archive');
const aurell = npcs.find((npc) => npc.id === 'keeper_aurell');
const maelis = npcs.find((npc) => npc.id === 'warden_maelis');
const nerys = npcs.find((npc) => npc.id === 'archivist_nerys');
const vesper = npcs.find((npc) => npc.id === 'trader_vesper');
assert.ok(aurell && maelis && nerys && vesper, 'Aurora Highlands NPC cast should export');

assert.equal(maps.length, 33);
assert.equal(monsters.length, 71);
assert.equal(items.length, 167);
assert.equal(drops.length, 71);
assert.equal(shops.length, 10);
assert.equal(recipes.length, 52);
assert.equal(quests.length, 23);
assert.equal(maps.flatMap((map) => map.resourceNodes ?? []).length, 71);

const sunspire = mapById('sunspire_observatory');
const highlandsGate = sunspire.portals.find((portal) => portal.targetMapId === highlands.id);
const archiveGate = highlands.portals.find((portal) => portal.targetMapId === archive.id);
assert.equal(highlandsGate?.requiredQuestId, 'quest_sunspire_lens');
assert.equal(archiveGate?.requiredQuestStartedId, 'quest_zenith_archive');
assert.ok(archive.portals.some((portal) => portal.targetMapId === highlands.id));

for (const map of [highlands, archive]) {
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

for (const monsterId of ['prismwing_moth', 'sunforge_boar', 'horizon_raptor', 'index_wraith', 'gilded_automaton', 'keeper_of_zenith']) {
  assert.ok(monsters.find((monster) => monster.id === monsterId)?.abilities?.length, `${monsterId} should have an authored ability`);
  assert.ok(drops.some((table) => table.monsterId === monsterId), `${monsterId} should have loot`);
}
assert.equal(monsters.find((monster) => monster.id === 'keeper_of_zenith')?.abilities?.length, 2);
for (const itemId of [
  'dawnsage_leaf', 'sunmetal_plate', 'aurora_silk', 'horizon_talon', 'archive_ink', 'memory_leaf', 'zenith_prism',
  'mending_salve', 'horizon_draught', 'zenith_restorative', 'dawnweave_mantle', 'horizon_cleaver',
  'sunmetal_greaves', 'archive_lantern', 'zenith_diadem', 'choicebound_charm', 'zenith_codex',
]) assert.ok(items.some((item) => item.id === itemId), `${itemId} should exist`);
for (const recipeId of [
  'recipe_mending_salve', 'recipe_horizon_draught', 'recipe_sunmetal_greaves',
  'recipe_archive_lantern', 'recipe_choicebound_charm',
]) assert.ok(recipes.some((recipe) => recipe.id === recipeId), `${recipeId} should exist`);
assert.ok(shops.find((shop) => shop.id === 'shop_highland_provisions')?.itemIds.includes('mending_salve'));

const completedSunspire: QuestState = {
  questId: 'quest_sunspire_lens', status: 'completed', progress: 1, target: 1, objectiveProgress: {},
};
const initialJournal = buildQuestJournal(quests, [completedSunspire], 22);
assert.equal(initialJournal.entries.find((entry) => entry.quest.id === 'quest_highlands_mercy')?.status, 'available');
assert.equal(initialJournal.entries.find((entry) => entry.quest.id === 'quest_highlands_vigil')?.status, 'available');
assert.match(initialJournal.entries.find((entry) => entry.quest.id === 'quest_zenith_archive')?.lockReason ?? '', /Complete either/);

const abilityRun = new WorldSimulation(data, highlands, highlands.playerSpawn, undefined, [{ itemId: 'mending_salve', count: 1 }]);
abilityRun.party.forEach((member) => { member.level = 22; });
for (const monster of abilityRun.monsters) monster.alive = false;
const moth = abilityRun.monsters.find((monster) => monster.definition.id === 'prismwing_moth');
assert.ok(moth);
moth.alive = true;
moth.x = abilityRun.player.x + 60;
moth.y = abilityRun.player.y;
moth.abilityCooldowns.rainbow_shear = 0;
assert.ok(abilityRun.update(NO_INPUT, 0.05).some((event) => event.type === 'monster-ability-telegraph' && event.abilityId === 'rainbow_shear'));
const shearEvents = advance(abilityRun, 1);
assert.ok(shearEvents.some((event) => event.type === 'status-applied' && event.status === 'fractured'));
const fracturedBeforeCure = abilityRun.party.filter((member) => member.activeEffects.some((effect) => effect.stat === 'fractured')).length;
assert.ok(fracturedBeforeCure > 0);
assert.ok(abilityRun.useItem('mending_salve').some((event) => event.type === 'status-cured' && event.status === 'fractured'));
assert.equal(abilityRun.party.filter((member) => member.activeEffects.some((effect) => effect.stat === 'fractured')).length, fracturedBeforeCure - 1);
assert.ok(incomingAttackDamage(18) > incomingAttackDamage(), 'Fractured should increase incoming damage by reducing defense');

const mercyRun = new WorldSimulation(
  data, highlands, highlands.playerSpawn, undefined, [], [completedSunspire], 12000, undefined, undefined, undefined, undefined,
  { rngSalt: 'phaser-zenith-3' },
);
mercyRun.party.forEach((member) => { member.level = 22; });
assert.ok(mercyRun.interactWithNpc(aurell).some((event) => event.type === 'quest-started' && event.questId === 'quest_highlands_mercy'));
assert.equal(mercyRun.interactWithNpc(maelis).length, 0, 'Starting Mercy should close the Vigil branch');
assert.ok(mercyRun.buyItem(vesper.id, 'mending_salve').some((event) => event.type === 'economy-transaction' && event.action === 'buy'));
const chosenJournal = buildQuestJournal(quests, mercyRun.quests, 22);
assert.match(chosenJournal.entries.find((entry) => entry.quest.id === 'quest_highlands_vigil')?.lockReason ?? '', /was chosen instead/);

for (const node of mercyRun.resources.filter((resource) => resource.definition.itemId === 'dawnsage_leaf')) {
  movePlayer(mercyRun, node);
  assert.ok(mercyRun.gatherResource(node.definition.id).some((event) => event.type === 'resource-gathered'));
}
for (const target of mercyRun.monsters.filter((monster) => monster.definition.id === 'prismwing_moth').slice(0, 5)) defeat(mercyRun, target);
assert.equal(mercyRun.quests.find((quest) => quest.questId === 'quest_highlands_mercy')?.status, 'ready');
assert.ok(mercyRun.interactWithNpc(aurell).some((event) => event.type === 'quest-completed' && event.questId === 'quest_highlands_mercy'));
assert.equal(inventoryCount(mercyRun, 'dawnweave_mantle'), 1);
assert.equal(inventoryCount(mercyRun, 'mending_salve'), 4);
const postMercyJournal = buildQuestJournal(quests, mercyRun.quests, 22);
assert.equal(postMercyJournal.entries.find((entry) => entry.quest.id === 'quest_zenith_archive')?.status, 'available');
assert.ok(mercyRun.interactWithNpc(nerys).some((event) => event.type === 'quest-started' && event.questId === 'quest_zenith_archive'));

const activeWorld = buildWorldMapModel(data, highlands.id, 22, mercyRun.quests, ['sunspire_observatory', highlands.id]);
assert.equal(activeWorld.pinCount, 14);
assert.equal(activeWorld.nodes.find((node) => node.id === archive.id)?.status, 'available');
assert.ok(activeWorld.nodes.find((node) => node.id === archive.id)?.objectiveLabels.includes('Defeat the Keeper of Zenith'));

const dungeonRun = new WorldSimulation(
  data, archive, archive.playerSpawn, mercyRun.party, mercyRun.inventory, mercyRun.quests, mercyRun.gold,
  mercyRun.equipment, mercyRun.discoveredMapIds, mercyRun.resourceCooldowns, undefined,
  { rngSalt: 'phaser-zenith-3' },
);
for (const node of dungeonRun.resources) {
  movePlayer(dungeonRun, node);
  assert.ok(dungeonRun.gatherResource(node.definition.id).some((event) => event.type === 'resource-gathered'));
}
for (const target of dungeonRun.monsters.filter((monster) => monster.definition.id === 'index_wraith').slice(0, 5)) defeat(dungeonRun, target);
for (const target of dungeonRun.monsters.filter((monster) => monster.definition.id === 'gilded_automaton').slice(0, 4)) defeat(dungeonRun, target);
const boss = dungeonRun.monsters.find((monster) => monster.definition.id === 'keeper_of_zenith');
assert.ok(boss);
assert.ok(defeat(dungeonRun, boss).some((event) => event.type === 'item-loot' && event.itemId === 'zenith_codex'));
assert.equal(dungeonRun.quests.find((quest) => quest.questId === 'quest_zenith_archive')?.status, 'ready');

const finalReturn = new WorldSimulation(
  data, highlands, highlands.playerSpawn, dungeonRun.party, dungeonRun.inventory, dungeonRun.quests, dungeonRun.gold,
  dungeonRun.equipment, dungeonRun.discoveredMapIds, dungeonRun.resourceCooldowns,
);
assert.ok(finalReturn.interactWithNpc(nerys).some((event) => event.type === 'quest-completed' && event.questId === 'quest_zenith_archive'));
assert.equal(inventoryCount(finalReturn, 'zenith_codex'), 0);
assert.equal(inventoryCount(finalReturn, 'zenith_diadem'), 1);
assert.equal(inventoryCount(finalReturn, 'choicebound_charm'), 1);
assert.equal(inventoryCount(finalReturn, 'zenith_restorative'), 3);
assert.ok(finalReturn.travelByCourier('warp_zenith').some((event) => event.type === 'courier-warp-requested' && event.goldCost === 840));

const vigilRun = new WorldSimulation(data, highlands, highlands.playerSpawn, undefined, [], [completedSunspire], 0);
vigilRun.party.forEach((member) => { member.level = 22; });
assert.ok(vigilRun.interactWithNpc(maelis).some((event) => event.type === 'quest-started' && event.questId === 'quest_highlands_vigil'));
assert.equal(vigilRun.interactWithNpc(aurell).length, 0, 'Starting Vigil should close the Mercy branch');

console.log('Aurora Highlands and Zenith Archive smoke test passed: authored maps, oath branches, Fractured, cure, loot, finale, rewards, world map, shop, and wayline are connected.');
