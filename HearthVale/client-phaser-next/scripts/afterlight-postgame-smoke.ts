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

const [maps, regions, npcs, monsters, items, quests, drops, shops, recipes, jobs, skills, collision, props] = await Promise.all([
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
  json<CollisionGrid>('data/collision/afterlight_expanse.json'),
  json<MapPropSet>('data/props/afterlight_expanse.json'),
]);
const data: GameData = {
  maps, regions, npcs, monsters, items, quests, drops, shops, recipes, jobs, skills,
  collisions: { afterlight_expanse: collision }, props: { afterlight_expanse: props },
};
const town = maps.find((map) => map.id === 'hearthvale_town_ro')!;
const summit = maps.find((map) => map.id === 'lanternspire_summit')!;
const afterlight = maps.find((map) => map.id === 'afterlight_expanse')!;
const wren = npcs.find((npc) => npc.id === 'priestess_wren')!;
assert.ok(town && summit && afterlight && wren, 'The postgame route and quest giver should export');

const gate = summit.portals.find((portal) => portal.targetMapId === afterlight.id);
assert.equal(gate?.requiredLevel, 14);
assert.equal(gate?.requiredQuestId, 'quest_lanternspire_accord');
assert.ok(afterlight.portals.some((portal) => portal.targetMapId === summit.id), 'Afterlight should return to Lanternspire');
assert.ok(collision.walkable.flat().some((tile) => !tile), 'Afterlight should contain blocked terrain');
assert.ok(props.props.length >= 35, 'Afterlight should have a full authored prop layer');
assert.ok(props.props.filter((prop) => prop.kind === 'lantern').length >= 10);
assert.ok(props.props.some((prop) => prop.kind === 'crystal'));
assert.ok(props.props.some((prop) => prop.kind === 'rift'));
for (const point of [afterlight.playerSpawn, ...afterlight.portals.map((portal) => portal.position)]) {
  assert.ok(isWalkable(afterlight, collision, point), 'Afterlight traversal points should be walkable');
}

for (const monsterId of ['sunshard_mote', 'voidglass_revenant', 'dawnscale_sentinel', 'eclipse_herald']) {
  assert.ok(monsters.some((monster) => monster.id === monsterId), `${monsterId} should exist`);
  assert.ok(drops.some((table) => table.monsterId === monsterId), `${monsterId} should have loot`);
}
for (const itemId of ['sunshard_filament', 'voidglass_splinter', 'afterlight_tonic', 'dawnstar_circlet', 'eclipse_guard', 'eclipse_sigil']) {
  assert.ok(items.some((item) => item.id === itemId), `${itemId} should exist`);
}
assert.ok(recipes.some((recipe) => recipe.id === 'recipe_afterlight_tonic'));
assert.ok(recipes.some((recipe) => recipe.id === 'recipe_dawnstar_circlet'));
assert.ok(regions[0].warpTable.some((warp) => warp.id === 'warp_afterlight'
  && warp.unlockQuestId === 'quest_lanternspire_accord'));

const finalQuest: QuestState = {
  questId: 'quest_lanternspire_accord', status: 'completed', progress: 4, target: 4,
  objectiveProgress: { reach_lanternspire: 1, break_gloam_wardens: 3, defeat_starved_crown: 1, recover_star_crown: 1 },
};
const lockedMap = buildWorldMapModel(data, town.id, 14, [], [town.id, summit.id]);
assert.equal(lockedMap.nodes.find((node) => node.id === afterlight.id)?.status, 'locked');
const openMap = buildWorldMapModel(data, town.id, 14, [finalQuest], [town.id, summit.id]);
assert.equal(openMap.nodes.find((node) => node.id === afterlight.id)?.status, 'available');

const townRun = new WorldSimulation(data, town, town.playerSpawn, undefined, [], [finalQuest], 500);
townRun.party.forEach((member) => { member.level = 14; });
const startEvents = townRun.interactWithNpc(wren);
assert.ok(startEvents.some((event) => event.type === 'quest-started' && event.questId === 'quest_afterlight_vigil'));

const fieldRun = new WorldSimulation(data, afterlight, afterlight.playerSpawn, townRun.party, townRun.inventory, townRun.quests, townRun.gold);
assert.equal(fieldRun.quests.find((state) => state.questId === 'quest_afterlight_vigil')?.objectiveProgress.reach_afterlight, 1);
assert.equal(fieldRun.monsters.filter((monster) => monster.definition.id === 'voidglass_revenant').length, 4);
assert.equal(fieldRun.monsters.filter((monster) => monster.definition.id === 'dawnscale_sentinel').length, 3);
assert.ok(fieldRun.monsters.every((monster) => isWalkable(afterlight, collision, monster)), 'Afterlight monsters should spawn on walkable ground');

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

for (const target of fieldRun.monsters.filter((monster) => monster.definition.id === 'voidglass_revenant')) defeat(fieldRun, target);
for (const target of fieldRun.monsters.filter((monster) => monster.definition.id === 'dawnscale_sentinel')) defeat(fieldRun, target);
const boss = fieldRun.monsters.find((monster) => monster.definition.id === 'eclipse_herald')!;
const bossEvents = defeat(fieldRun, boss);
assert.ok(bossEvents.some((event) => event.type === 'monster-hit' && event.defeated));
assert.ok(bossEvents.some((event) => event.type === 'item-loot' && event.itemId === 'eclipse_sigil'));
assert.equal(fieldRun.quests.find((state) => state.questId === 'quest_afterlight_vigil')?.status, 'ready');

const returnRun = new WorldSimulation(data, town, town.playerSpawn, fieldRun.party, fieldRun.inventory, fieldRun.quests, fieldRun.gold);
const completionEvents = returnRun.interactWithNpc(wren);
assert.ok(completionEvents.some((event) => event.type === 'quest-completed'
  && event.questId === 'quest_afterlight_vigil' && !event.campaignCompleted));
assert.ok(returnRun.inventory.some((stack) => stack.itemId === 'eclipse_guard' && stack.count === 1));
assert.ok(returnRun.inventory.some((stack) => stack.itemId === 'afterlight_tonic' && stack.count === 3));
assert.ok(!returnRun.inventory.some((stack) => stack.itemId === 'eclipse_sigil' && stack.count > 0));

console.log('Afterlight postgame smoke test passed: route, art, spawns, loot, quest, boss, rewards, recipes, and warp are connected.');
