import assert from 'node:assert/strict';

import type { GameData, ItemDefinition, MapDefinition } from '../src/game/data/types.js';
import type { InputActions } from '../src/game/input/actions.js';
import { WorldSimulation, type PlayerState, type SimEvent } from '../src/game/simulation/WorldSimulation.js';

const map: MapDefinition = {
  id: 'condition_test', displayName: 'Condition Test', kind: 'field',
  levelRange: { min: 1, max: 10 }, biome: 'test', gridSize: { width: 80, height: 40 },
  npcs: [], portals: [], playerSpawn: { x: 0, y: 0 }, safeZone: null,
  spawnTables: [{
    id: 'fungal_test', bounds: { x: 10, y: 0, width: 1, height: 1 }, maxConcurrent: 1, respawnSeconds: 5,
    entries: [{ monsterId: 'test_sporeling', weight: 1 }],
  }],
};

const items: ItemDefinition[] = [
  { id: 'stamina_snack', displayName: 'Stamina Snack', kind: 'consumable', stackMax: 20, sellPrice: 10, effect: { type: 'restore', stat: 'stamina', amount: 40 } },
  { id: 'antidote_leaf', displayName: 'Antidote Leaf', kind: 'consumable', stackMax: 20, sellPrice: 12, effect: { type: 'cure', target: 'poison' } },
  { id: 'warding_incense', displayName: 'Warding Incense', kind: 'consumable', stackMax: 10, sellPrice: 30, effect: { type: 'buff', stat: 'def', amount: 8, duration: 60 } },
  { id: 'gale_tonic', displayName: 'Gale Tonic', kind: 'consumable', stackMax: 10, sellPrice: 28, effect: { type: 'buff', stat: 'spd', amount: 15, duration: 45 } },
  { id: 'hearth_charm', displayName: 'Hearth Charm', kind: 'consumable', stackMax: 5, sellPrice: 20, effect: { type: 'warp', target: 'warp_hearthvale' } },
];

const data: GameData = {
  maps: [map], npcs: [], jobs: [], skills: [], items,
  monsters: [{
    id: 'test_sporeling', displayName: 'Test Sporeling', baseLevel: 4,
    hp: 9999, atk: 20, def: 0, size: 'small', element: 'fungal',
  }],
};

const idle: InputActions = {
  x: 0, y: 0, sprint: false, attackPressed: false,
  autoAttack: false, interactPressed: false, skillRequests: [],
};

function createSimulation(itemIds: string[] = []): WorldSimulation {
  const simulation = new WorldSimulation(data, map, map.playerSpawn, undefined,
    itemIds.map((itemId) => ({ itemId, count: 1 })));
  simulation.monsters[0].x = simulation.player.x + 10;
  simulation.monsters[0].y = simulation.player.y;
  return simulation;
}

function advance(simulation: WorldSimulation, seconds: number, input = idle): SimEvent[] {
  const events: SimEvent[] = [];
  for (let elapsed = 0; elapsed < seconds; elapsed += 0.05) events.push(...simulation.update(input, 0.05));
  return events;
}

const travel = createSimulation(['stamina_snack', 'gale_tonic']);
travel.monsters[0].alive = false;
const sprintInput = { ...idle, x: 1, sprint: true };
advance(travel, 1, sprintInput);
assert.ok(travel.player.stamina > 77 && travel.player.stamina < 79, 'Sprinting should drain 22 stamina per second');
for (let step = 0; step < 100 && travel.player.stamina > 0; step += 1) travel.update(sprintInput, 0.05);
assert.equal(travel.player.stamina, 0, 'Sustained sprinting should exhaust the travel meter');
travel.player.x = 0;
advance(travel, 1, sprintInput);
const normalDistance = travel.player.x;
assert.ok(normalDistance > 184 && normalDistance < 186, 'Movement should fall back to walking speed after exhaustion');
travel.player.stamina = 0;
advance(travel, 1);
assert.ok(travel.player.stamina > 13 && travel.player.stamina < 15, 'Resting should recover 14 stamina per second');
travel.player.stamina = 25;
const snackEvents = travel.useItem('stamina_snack');
assert.equal(travel.player.stamina, 65);
assert.ok(snackEvents.some((event) => event.type === 'item-used' && event.amount === 40));

travel.player.x = 0;
travel.player.stamina = travel.player.maxStamina;
const baselineInterval = travel.attackIntervalFor(travel.player.id);
const galeEvents = travel.useItem('gale_tonic');
assert.ok(galeEvents.some((event) => event.type === 'item-used'));
assert.ok(travel.attackIntervalFor(travel.player.id) < baselineInterval * 0.9, 'Gale Tonic should quicken attack cadence');
const galeStart = travel.player.x;
advance(travel, 1, { ...idle, x: 1 });
assert.ok(travel.player.x - galeStart > 205, 'Gale Tonic should increase walking speed by 15%');

const unwarded = createSimulation();
const unwardedHp = unwarded.player.hp;
const unwardedEvents = unwarded.update(idle, 0.05);
const unwardedDamage = unwardedHp - unwarded.player.hp;
assert.ok(unwardedEvents.some((event) => event.type === 'player-hit'));

const warded = createSimulation(['warding_incense']);
const wardEvents = warded.useItem('warding_incense');
assert.ok(wardEvents.some((event) => event.type === 'item-used'));
const wardedHp = warded.player.hp;
warded.update(idle, 0.05);
assert.equal(unwardedDamage - (wardedHp - warded.player.hp), 8, 'Warding Incense should mitigate eight damage');

const condition = createSimulation(['antidote_leaf']);
const combatEvents = advance(condition, 1.2);
assert.ok(combatEvents.some((event) => event.type === 'status-applied' && event.status === 'poison'), 'Every second fungal strike should poison');
assert.ok(condition.player.activeEffects.some((effect) => effect.stat === 'poison'));
condition.monsters[0].alive = false;
const poisonHp = condition.player.hp;
const poisonEvents = advance(condition, 1.05);
assert.ok(poisonEvents.some((event) => event.type === 'status-damage' && event.status === 'poison'));
assert.ok(condition.player.hp < poisonHp, 'Poison should pulse once per second');
const cureEvents = condition.useItem('antidote_leaf');
assert.ok(cureEvents.some((event) => event.type === 'status-cured' && event.status === 'poison'));
assert.ok(!condition.player.activeEffects.some((effect) => effect.stat === 'poison'));

const noCondition = createSimulation(['antidote_leaf']);
const blockedCure = noCondition.useItem('antidote_leaf');
assert.ok(blockedCure.some((event) => event.type === 'item-blocked' && event.reason === 'condition'));
assert.equal(noCondition.inventory[0].count, 1, 'A needless antidote should not be consumed');

const allyCondition = createSimulation(['antidote_leaf']);
allyCondition.party[1].activeEffects.push({ skillId: 'status:poison', stat: 'poison', amount: 2, remaining: 8, tickTimer: 1 });
const allyCure = allyCondition.useItem('antidote_leaf');
assert.ok(allyCure.some((event) => event.type === 'status-cured' && event.memberId === allyCondition.party[1].id));
assert.ok(!allyCondition.party[1].activeEffects.some((effect) => effect.stat === 'poison'), 'Antidotes should find poisoned allies');

const warp = createSimulation(['hearth_charm']);
const warpEvents = warp.useItem('hearth_charm');
assert.ok(warpEvents.some((event) => event.type === 'warp-requested' && event.target === 'warp_hearthvale'));
assert.equal(warp.inventory[0].count, 0, 'The Hearth Charm should be consumed when travel is requested');

const homeMap = { ...map, id: 'hearthvale_town_ro', displayName: 'Hearthvale Town' };
const home = new WorldSimulation(data, homeMap, homeMap.playerSpawn, undefined, [{ itemId: 'hearth_charm', count: 1 }]);
const homeWarp = home.useItem('hearth_charm');
assert.ok(homeWarp.some((event) => event.type === 'item-blocked' && event.reason === 'location'));
assert.equal(home.inventory[0].count, 1, 'A Hearth Charm should not be wasted in Hearthvale Town');

const legacyParty = structuredClone(warp.party).map((member) => {
  const legacy = member as Partial<PlayerState>;
  delete legacy.stamina;
  delete legacy.maxStamina;
  return legacy;
}) as PlayerState[];
const migrated = new WorldSimulation(data, map, map.playerSpawn, legacyParty);
assert.equal(migrated.player.maxStamina, 100);
assert.equal(migrated.player.stamina, 100, 'Old saves should receive a full stamina pool');

console.log('Consumables and status smoke test passed (stamina, buffs, poison, cure, warp, and migration).');
