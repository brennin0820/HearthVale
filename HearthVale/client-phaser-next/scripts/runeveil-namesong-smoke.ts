import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import type { CollisionGrid, GameData, MapDefinition, MapPropSet, Vec2 } from '../src/game/data/types.js';
import { NO_INPUT } from '../src/game/input/actions.js';
import { buildWorldMapModel } from '../src/game/navigation/worldMap.js';
import { isWalkable } from '../src/game/simulation/CollisionGrid.js';
import { WorldSimulation, type EquipmentState, type MonsterState, type QuestState, type SimEvent, type SocketState } from '../src/game/simulation/WorldSimulation.js';

const projectRoot = resolve(import.meta.dirname, '../..');
async function json<T>(relativePath: string): Promise<T> {
  return JSON.parse(await readFile(resolve(projectRoot, relativePath), 'utf8')) as T;
}

const mapIds = ['runeveil_gardens', 'namesong_vault'] as const;
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

const gardens = mapById('runeveil_gardens');
const vault = mapById('namesong_vault');
const crownroot = mapById('crownroot_sanctum');
const talin = npcs.find((npc) => npc.id === 'waykeeper_talin');
const sera = npcs.find((npc) => npc.id === 'runesmith_sera');
const pell = npcs.find((npc) => npc.id === 'archivist_pell');
assert.ok(talin && sera && pell, 'Runeveil should export its quest, smith, and memorial NPCs');

assert.equal(maps.length, 33);
assert.equal(monsters.length, 71);
assert.equal(items.length, 167);
assert.equal(drops.length, 71);
assert.equal(shops.length, 10);
assert.equal(recipes.length, 52);
assert.equal(quests.length, 23);
assert.equal(maps.flatMap((map) => map.resourceNodes ?? []).length, 71);

assert.equal(crownroot.portals.find((portal) => portal.targetMapId === gardens.id)?.requiredQuestId, 'quest_crownroot_concordance');
assert.equal(gardens.portals.find((portal) => portal.targetMapId === vault.id)?.requiredQuestStartedId, 'quest_namesong_vault');
assert.ok(gardens.portals.some((portal) => portal.targetMapId === crownroot.id));
assert.ok(vault.portals.some((portal) => portal.targetMapId === gardens.id));

for (const map of [gardens, vault]) {
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

for (const monsterId of ['glyphhare', 'lanternback_elk', 'wayglass_watcher', 'epitaph_sentinel', 'pale_scriptling', 'archivore']) {
  assert.ok(monsters.find((monster) => monster.id === monsterId)?.abilities?.length, `${monsterId} should have an ability`);
  assert.ok(drops.some((table) => table.monsterId === monsterId), `${monsterId} should have loot`);
}
assert.equal(monsters.find((monster) => monster.id === 'archivore')?.abilities?.length, 2);

const runeIds = ['embermark_rune', 'bastion_rune', 'heartroot_rune', 'galescript_rune', 'seer_rune'];
for (const runeId of runeIds) {
  const rune = items.find((item) => item.id === runeId);
  assert.equal(rune?.kind, 'rune');
  assert.ok(rune?.runeStats && rune.runeSlots?.length, `${runeId} should grant compatible socket stats`);
  assert.ok(recipes.some((recipe) => recipe.result.itemId === runeId), `${runeId} should be craftable`);
}

const runeRun = new WorldSimulation(data, gardens, gardens.playerSpawn, undefined, [
  { itemId: 'runesmith_maul', count: 1 },
  { itemId: 'cantor_longbow', count: 1 },
  { itemId: 'bellglass_ward', count: 1 },
  { itemId: 'veilguard_mantle', count: 1 },
  { itemId: 'crownroot_vestments', count: 1 },
  { itemId: 'embermark_rune', count: 1 },
  { itemId: 'bastion_rune', count: 1 },
  { itemId: 'heartroot_rune', count: 1 },
  { itemId: 'galescript_rune', count: 1 },
  { itemId: 'runebloom_petal', count: 6 },
  { itemId: 'glyphhide', count: 4 },
  { itemId: 'wayglass_shard', count: 3 },
], undefined, 20000);
runeRun.party.forEach((member) => { member.level = 26; });
assert.ok(runeRun.equipItem('warden', 'runesmith_maul').some((event) => event.type === 'item-equipped'));
assert.ok(runeRun.equipItem('warden', 'bellglass_ward').some((event) => event.type === 'item-equipped'));
assert.ok(runeRun.equipItem('warden', 'veilguard_mantle').some((event) => event.type === 'item-equipped'));
assert.ok(runeRun.equipItem('ranger', 'cantor_longbow').some((event) => event.type === 'item-equipped'));

assert.ok(runeRun.socketRune('warden', 'weapon', 'embermark_rune')
  .some((event) => event.type === 'rune-socketed' && event.runeId === 'embermark_rune'));
assert.equal(runeRun.equipmentStats('warden').atk, 80, 'Weapon and rune ATK should combine');
assert.equal(runeRun.equipmentStats('warden').crit, 10);
assert.ok(runeRun.socketRune('ranger', 'weapon', 'embermark_rune')
  .some((event) => event.type === 'rune-blocked' && event.reason === 'assigned'));
assert.ok(runeRun.sellItem(sera.id, 'embermark_rune')
  .some((event) => event.type === 'economy-blocked' && event.reason === 'equipped'));

assert.ok(runeRun.socketRune('warden', 'weapon', 'galescript_rune')
  .some((event) => event.type === 'rune-socketed' && event.replacedRuneId === 'embermark_rune'));
assert.equal(runeRun.equipmentStats('warden').atk, 70);
assert.equal(runeRun.equipmentStats('warden').spd, 13, 'Gear and rune haste should combine');
assert.ok(runeRun.sellItem(sera.id, 'embermark_rune').some((event) => event.type === 'economy-transaction'));

const bodyHp = runeRun.party[0].maxHp;
assert.ok(runeRun.socketRune('warden', 'body', 'heartroot_rune').some((event) => event.type === 'rune-socketed'));
assert.equal(runeRun.party[0].maxHp, bodyHp + 90, 'HP runes should update derived maximum health immediately');
const replacementEvents = runeRun.equipItem('warden', 'crownroot_vestments');
assert.ok(replacementEvents.some((event) => event.type === 'rune-unsocketed' && event.runeId === 'heartroot_rune'));
assert.equal(runeRun.sockets.warden.body, undefined, 'Replacing gear should release its rune');
assert.ok(runeRun.socketRune('warden', 'offhand', 'bastion_rune').some((event) => event.type === 'rune-socketed'));

const restored = new WorldSimulation(
  data, gardens, gardens.playerSpawn, structuredClone(runeRun.party), runeRun.inventory, [], runeRun.gold,
  runeRun.equipment, runeRun.discoveredMapIds, runeRun.resourceCooldowns, runeRun.sockets,
);
assert.equal(restored.sockets.warden.weapon, 'galescript_rune');
assert.equal(restored.sockets.warden.offhand, 'bastion_rune');
assert.equal(restored.equipmentStats('warden').spd, runeRun.equipmentStats('warden').spd);

const malformedEquipment: EquipmentState = {
  warden: { weapon: 'runesmith_maul' }, ranger: { weapon: 'cantor_longbow' },
};
const malformedSockets: SocketState = {
  warden: { weapon: 'galescript_rune' }, ranger: { weapon: 'galescript_rune' },
};
const sanitized = new WorldSimulation(
  data, gardens, gardens.playerSpawn, structuredClone(runeRun.party), [{ itemId: 'galescript_rune', count: 1 }], [], 0,
  malformedEquipment, [], {}, malformedSockets,
);
assert.equal(sanitized.sockets.warden.weapon, 'galescript_rune');
assert.equal(sanitized.sockets.ranger.weapon, undefined, 'Save restoration should reject over-assigned runes');

const completedCrownroot: QuestState = {
  questId: 'quest_crownroot_concordance', status: 'completed', progress: 1, target: 1, objectiveProgress: {},
};
const fieldRun = new WorldSimulation(
  data, gardens, gardens.playerSpawn, undefined, [], [completedCrownroot], 18000, undefined, undefined, undefined, undefined,
  { rngSalt: 'phaser-rune-0' },
);
fieldRun.party.forEach((member) => { member.level = 26; });
assert.ok(fieldRun.interactWithNpc(talin).some((event) => event.type === 'quest-started' && event.questId === 'quest_runeveil_marks'));
assert.ok(fieldRun.buyItem(sera.id, 'runeveil_broth').some((event) => event.type === 'economy-transaction'));

for (const node of fieldRun.resources) {
  movePlayer(fieldRun, node);
  assert.ok(fieldRun.gatherResource(node.definition.id).some((event) => event.type === 'resource-gathered'));
}
for (const target of fieldRun.monsters.filter((monster) => monster.definition.id === 'glyphhare').slice(0, 5)) defeat(fieldRun, target);
for (const target of fieldRun.monsters.filter((monster) => monster.definition.id === 'lanternback_elk').slice(0, 4)) defeat(fieldRun, target);
for (const target of fieldRun.monsters.filter((monster) => monster.definition.id === 'wayglass_watcher').slice(0, 4)) defeat(fieldRun, target);
assert.equal(fieldRun.quests.find((quest) => quest.questId === 'quest_runeveil_marks')?.status, 'ready');
assert.ok(fieldRun.interactWithNpc(talin).some((event) => event.type === 'quest-completed' && event.questId === 'quest_runeveil_marks'));
assert.equal(inventoryCount(fieldRun, 'veilguard_mantle'), 1);
assert.equal(inventoryCount(fieldRun, 'heartroot_rune'), 1);
assert.ok(fieldRun.interactWithNpc(pell).some((event) => event.type === 'quest-started' && event.questId === 'quest_namesong_vault'));

const activeWorld = buildWorldMapModel(data, gardens.id, 26, fieldRun.quests, ['crownroot_sanctum', gardens.id]);
assert.equal(activeWorld.pinCount, 14);
assert.equal(activeWorld.nodes.find((node) => node.id === vault.id)?.status, 'available');
assert.ok(activeWorld.nodes.find((node) => node.id === vault.id)?.objectiveLabels.includes('Defeat the Archivore'));

const dungeonRun = new WorldSimulation(
  data, vault, vault.playerSpawn, fieldRun.party, fieldRun.inventory, fieldRun.quests, fieldRun.gold,
  fieldRun.equipment, fieldRun.discoveredMapIds, fieldRun.resourceCooldowns, fieldRun.sockets,
  { rngSalt: 'phaser-rune-0' },
);
for (const node of dungeonRun.resources) {
  movePlayer(dungeonRun, node);
  assert.ok(dungeonRun.gatherResource(node.definition.id).some((event) => event.type === 'resource-gathered'));
}
for (const target of dungeonRun.monsters.filter((monster) => monster.definition.id === 'epitaph_sentinel').slice(0, 5)) defeat(dungeonRun, target);
for (const target of dungeonRun.monsters.filter((monster) => monster.definition.id === 'pale_scriptling').slice(0, 4)) defeat(dungeonRun, target);
const boss = dungeonRun.monsters.find((monster) => monster.definition.id === 'archivore');
assert.ok(boss);
assert.ok(defeat(dungeonRun, boss).some((event) => event.type === 'item-loot' && event.itemId === 'namesong_seal'));
assert.equal(dungeonRun.quests.find((quest) => quest.questId === 'quest_namesong_vault')?.status, 'ready');

const finalReturn = new WorldSimulation(
  data, gardens, gardens.playerSpawn, dungeonRun.party, dungeonRun.inventory, dungeonRun.quests, dungeonRun.gold,
  dungeonRun.equipment, dungeonRun.discoveredMapIds, dungeonRun.resourceCooldowns, dungeonRun.sockets,
);
assert.ok(finalReturn.interactWithNpc(pell).some((event) => event.type === 'quest-completed' && event.questId === 'quest_namesong_vault'));
assert.equal(inventoryCount(finalReturn, 'namesong_seal'), 0);
assert.equal(inventoryCount(finalReturn, 'hollowstar_circlet'), 1);
assert.equal(inventoryCount(finalReturn, 'seer_rune'), 1);
assert.equal(inventoryCount(finalReturn, 'scriptwater_draught'), 4);
assert.ok(finalReturn.travelByCourier('warp_namesong').some((event) => event.type === 'courier-warp-requested' && event.goldCost === 1480));

console.log('Runeveil and Namesong smoke test passed: maps, monsters, gathering, quests, boss, economy, reusable runes, stat bonuses, replacement, selling protection, travel, and save restoration are connected.');
