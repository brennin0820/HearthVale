import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import type { CollisionGrid, GameData, MapDefinition, MapPropSet, Vec2 } from '../src/game/data/types.js';
import { NO_INPUT } from '../src/game/input/actions.js';
import { buildWorldMapModel } from '../src/game/navigation/worldMap.js';
import { isWalkable } from '../src/game/simulation/CollisionGrid.js';
import { MAX_SKILL_SLOTS, WorldSimulation, type MonsterState, type QuestState, type SimEvent } from '../src/game/simulation/WorldSimulation.js';

const projectRoot = resolve(import.meta.dirname, '../..');
async function json<T>(relativePath: string): Promise<T> {
  return JSON.parse(await readFile(resolve(projectRoot, relativePath), 'utf8')) as T;
}

const mapIds = ['choirwood_canopy', 'crownroot_sanctum'] as const;
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

const canopy = mapById('choirwood_canopy');
const sanctum = mapById('crownroot_sanctum');
const zenith = mapById('zenith_archive');
const lyra = npcs.find((npc) => npc.id === 'runesinger_lyra');
const eira = npcs.find((npc) => npc.id === 'cantor_eira');
assert.ok(lyra && eira, 'Choirwood quest and merchant NPCs should export');

assert.equal(maps.length, 33);
assert.equal(monsters.length, 71);
assert.equal(items.length, 167);
assert.equal(drops.length, 71);
assert.equal(shops.length, 10);
assert.equal(recipes.length, 52);
assert.equal(quests.length, 23);
assert.equal(skills.length, 38);
assert.equal(maps.flatMap((map) => map.resourceNodes ?? []).length, 71);

const canopyGate = zenith.portals.find((portal) => portal.targetMapId === canopy.id);
const sanctumGate = canopy.portals.find((portal) => portal.targetMapId === sanctum.id);
assert.equal(canopyGate?.requiredQuestId, 'quest_zenith_archive');
assert.equal(sanctumGate?.requiredQuestStartedId, 'quest_crownroot_concordance');
assert.ok(canopy.portals.some((portal) => portal.targetMapId === zenith.id));
assert.ok(sanctum.portals.some((portal) => portal.targetMapId === canopy.id));

for (const map of [canopy, sanctum]) {
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

const routeMonsterIds = [
  'chimebeetle', 'canticle_stag', 'mossbound_cantor',
  'scriptroot_lurker', 'bellglass_myconid', 'crownroot_hierophant',
];
for (const monsterId of routeMonsterIds) {
  assert.ok(monsters.find((monster) => monster.id === monsterId)?.abilities?.length, `${monsterId} should have an authored ability`);
  assert.ok(drops.some((table) => table.monsterId === monsterId), `${monsterId} should have loot`);
}
assert.equal(monsters.find((monster) => monster.id === 'crownroot_hierophant')?.abilities?.length, 2);
assert.equal(monsters.find((monster) => monster.id === 'mossbound_cantor')?.abilities?.[0].status, 'muted');
for (const itemId of [
  'echo_moss', 'resonant_bark', 'chime_shell', 'canticle_antler', 'hymn_leaf', 'bellglass_spore',
  'crownroot_resin', 'concordance_seed', 'clearvoice_tisane', 'choirwood_tonic', 'crownroot_cordial',
  'resonance_bracer', 'cantor_longbow', 'scriptroot_staff', 'bellglass_ward', 'crownroot_vestments', 'concordance_band',
]) assert.ok(items.some((item) => item.id === itemId), `${itemId} should exist`);
for (const recipeId of [
  'recipe_clearvoice_tisane', 'recipe_choirwood_tonic', 'recipe_cantor_longbow',
  'recipe_scriptroot_staff', 'recipe_bellglass_ward',
]) assert.ok(recipes.some((recipe) => recipe.id === recipeId), `${recipeId} should exist`);
assert.ok(shops.find((shop) => shop.id === 'shop_choirwood_resonance')?.itemIds.includes('clearvoice_tisane'));

const completedZenith: QuestState = {
  questId: 'quest_zenith_archive', status: 'completed', progress: 1, target: 1, objectiveProgress: {},
};
const fieldRun = new WorldSimulation(
  data, canopy, canopy.playerSpawn, undefined, [], [completedZenith], 15000, undefined, undefined, undefined, undefined,
  { rngSalt: 'phaser-choir-2' },
);
fieldRun.party.forEach((member) => { member.level = 24; });
assert.ok(fieldRun.interactWithNpc(lyra).some((event) => event.type === 'quest-started' && event.questId === 'quest_choirwood_resonance'));
assert.ok(fieldRun.buyItem(eira.id, 'clearvoice_tisane').some((event) => event.type === 'economy-transaction' && event.action === 'buy'));

for (const monster of fieldRun.monsters) monster.alive = false;
const cantor = fieldRun.monsters.find((monster) => monster.definition.id === 'mossbound_cantor');
assert.ok(cantor);
cantor.alive = true;
cantor.hp = cantor.maxHp;
cantor.x = fieldRun.player.x + 60;
cantor.y = fieldRun.player.y;
cantor.abilityCooldowns.hushing_verse = 0;
assert.ok(fieldRun.update(NO_INPUT, 0.05).some((event) => event.type === 'monster-ability-telegraph' && event.abilityId === 'hushing_verse'));
const hushEvents = advance(fieldRun, 1.2);
assert.ok(hushEvents.some((event) => event.type === 'status-applied' && event.status === 'muted'));
assert.ok(fieldRun.update({ ...NO_INPUT, skillRequests: [{ memberId: fieldRun.player.id, skillId: 'basic_strike' }] }, 0.05)
  .some((event) => event.type === 'skill-blocked' && event.reason === 'muted'));
fieldRun.player.attackCooldown = 0;
assert.ok(fieldRun.update({ ...NO_INPUT, attackPressed: true }, 0.05)
  .some((event) => event.type === 'attack-swing'), 'Muted should leave ordinary attacks available');
assert.ok(fieldRun.useItem('clearvoice_tisane').some((event) => event.type === 'status-cured' && event.status === 'muted'));

for (const node of fieldRun.resources) {
  movePlayer(fieldRun, node);
  assert.ok(fieldRun.gatherResource(node.definition.id).some((event) => event.type === 'resource-gathered'));
}
for (const target of fieldRun.monsters.filter((monster) => monster.definition.id === 'chimebeetle').slice(0, 5)) defeat(fieldRun, target);
for (const target of fieldRun.monsters.filter((monster) => monster.definition.id === 'canticle_stag').slice(0, 4)) defeat(fieldRun, target);
for (const target of fieldRun.monsters.filter((monster) => monster.definition.id === 'mossbound_cantor').slice(0, 4)) defeat(fieldRun, target);
assert.equal(fieldRun.quests.find((quest) => quest.questId === 'quest_choirwood_resonance')?.status, 'ready');
assert.ok(fieldRun.interactWithNpc(lyra).some((event) => event.type === 'quest-completed' && event.questId === 'quest_choirwood_resonance'));
assert.equal(inventoryCount(fieldRun, 'resonance_bracer'), 1);
assert.ok(fieldRun.travelByCourier('warp_choirwood').some((event) => event.type === 'courier-warp-blocked' && event.reason === 'location'));
assert.ok(fieldRun.interactWithNpc(lyra).some((event) => event.type === 'quest-started' && event.questId === 'quest_crownroot_concordance'));

const activeWorld = buildWorldMapModel(data, canopy.id, 24, fieldRun.quests, ['zenith_archive', canopy.id]);
assert.equal(activeWorld.pinCount, 14);
assert.equal(activeWorld.nodes.find((node) => node.id === sanctum.id)?.status, 'available');
assert.ok(activeWorld.nodes.find((node) => node.id === sanctum.id)?.objectiveLabels.includes('Defeat the Crownroot Hierophant'));

const dungeonRun = new WorldSimulation(
  data, sanctum, sanctum.playerSpawn, fieldRun.party, fieldRun.inventory, fieldRun.quests, fieldRun.gold,
  fieldRun.equipment, fieldRun.discoveredMapIds, fieldRun.resourceCooldowns, undefined,
  { rngSalt: 'phaser-choir-2' },
);
for (const node of dungeonRun.resources) {
  movePlayer(dungeonRun, node);
  assert.ok(dungeonRun.gatherResource(node.definition.id).some((event) => event.type === 'resource-gathered'));
}
for (const target of dungeonRun.monsters.filter((monster) => monster.definition.id === 'scriptroot_lurker').slice(0, 5)) defeat(dungeonRun, target);
for (const target of dungeonRun.monsters.filter((monster) => monster.definition.id === 'bellglass_myconid').slice(0, 4)) defeat(dungeonRun, target);
const boss = dungeonRun.monsters.find((monster) => monster.definition.id === 'crownroot_hierophant');
assert.ok(boss);
assert.ok(defeat(dungeonRun, boss).some((event) => event.type === 'item-loot' && event.itemId === 'concordance_seed'));
assert.equal(dungeonRun.quests.find((quest) => quest.questId === 'quest_crownroot_concordance')?.status, 'ready');

const finalReturn = new WorldSimulation(
  data, canopy, canopy.playerSpawn, dungeonRun.party, dungeonRun.inventory, dungeonRun.quests, dungeonRun.gold,
  dungeonRun.equipment, dungeonRun.discoveredMapIds, dungeonRun.resourceCooldowns,
);
assert.ok(finalReturn.interactWithNpc(lyra).some((event) => event.type === 'quest-completed' && event.questId === 'quest_crownroot_concordance'));
assert.equal(inventoryCount(finalReturn, 'concordance_seed'), 0);
assert.equal(inventoryCount(finalReturn, 'crownroot_vestments'), 1);
assert.equal(inventoryCount(finalReturn, 'concordance_band'), 1);
assert.equal(inventoryCount(finalReturn, 'crownroot_cordial'), 4);
assert.ok(finalReturn.travelByCourier('warp_crownroot').some((event) => event.type === 'courier-warp-requested' && event.goldCost === 1120));

const techniqueByJob = new Map(skills.filter((skill) => skill.unlockQuestId === 'quest_crownroot_concordance')
  .flatMap((skill) => (skill.jobIds ?? []).map((jobId) => [jobId, skill.id] as const)));
assert.deepEqual([...techniqueByJob.keys()].sort(), ['channeler', 'mender', 'ranger', 'shade', 'warden', 'wayfarer']);
for (const member of finalReturn.party) {
  assert.ok(finalReturn.changeJob(member.id, member.id).some((event) => event.type === 'job-changed'));
  assert.equal(member.skillIds.length, MAX_SKILL_SLOTS);
  assert.equal(finalReturn.skillLoadoutOptions(member.id).length, 4);
}

const warden = finalReturn.party.find((member) => member.id === 'warden');
assert.ok(warden);
assert.ok(finalReturn.toggleSkillLoadout(warden.id, 'rootbound_challenge')
  .some((event) => event.type === 'skill-loadout-blocked' && event.reason === 'slots'));
assert.ok(finalReturn.toggleSkillLoadout(warden.id, 'vale_slash')
  .some((event) => event.type === 'skill-loadout-changed' && !event.equipped));
assert.ok(finalReturn.toggleSkillLoadout(warden.id, 'rootbound_challenge')
  .some((event) => event.type === 'skill-loadout-changed' && event.equipped));
assert.ok(finalReturn.toggleSkillLoadout(warden.id, 'chorus_of_arrows')
  .some((event) => event.type === 'skill-loadout-blocked' && event.reason === 'path'));
assert.equal(warden.skillIds.length, MAX_SKILL_SLOTS);

warden.mp = warden.maxMp;
assert.ok(finalReturn.update({ ...NO_INPUT, skillRequests: [{ memberId: warden.id, skillId: 'rootbound_challenge' }] }, 0.05)
  .some((event) => event.type === 'skill-used' && event.skillId === 'rootbound_challenge'));
assert.ok(warden.activeEffects.some((effect) => effect.skillId === 'rootbound_challenge'));

const restored = new WorldSimulation(
  data, canopy, canopy.playerSpawn, structuredClone(finalReturn.party), finalReturn.inventory, finalReturn.quests,
  finalReturn.gold, finalReturn.equipment, finalReturn.discoveredMapIds, finalReturn.resourceCooldowns,
);
assert.ok(restored.party.find((member) => member.id === 'warden')?.skillIds.includes('rootbound_challenge'), 'Chosen skill loadouts should survive save restoration');

const malformedParty = structuredClone(finalReturn.party);
malformedParty[0].skillIds = ['chorus_of_arrows'];
const sanitized = new WorldSimulation(data, canopy, canopy.playerSpawn, malformedParty, [], finalReturn.quests, 0);
assert.deepEqual(sanitized.player.skillIds, jobs.find((job) => job.id === 'warden')?.startingSkills, 'Wrong-path saved skills should be replaced by the path defaults');

const lockedRun = new WorldSimulation(data, canopy, canopy.playerSpawn, undefined, [], [completedZenith], 500);
lockedRun.party.forEach((member) => { member.level = 24; });
assert.ok(lockedRun.changeJob('warden', 'warden').some((event) => event.type === 'job-changed'));
assert.ok(lockedRun.toggleSkillLoadout('warden', 'rootbound_challenge')
  .some((event) => event.type === 'skill-loadout-blocked' && event.reason === 'quest'));

for (const [jobId, skillId] of [['wayfarer', 'battle_cant'], ['shade', 'echo_fang']] as const) {
  const pathRun = new WorldSimulation(data, canopy, canopy.playerSpawn, undefined, [], finalReturn.quests, 500);
  pathRun.party.forEach((member) => { member.level = 24; });
  assert.ok(pathRun.changeJob('warden', jobId).some((event) => event.type === 'job-changed'));
  assert.ok(pathRun.skillLoadoutOptions('warden').some((skill) => skill.id === skillId));
}

console.log('Choirwood and Crownroot smoke test passed: maps, Muted, cure, gathering, economy, quests, boss, rewards, warps, techniques, loadout limits, casting, and save restoration are connected.');
