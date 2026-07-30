import assert from 'node:assert/strict';
import type { GameData, MapDefinition } from '../src/game/data/types.js';
import { normalizeEquipmentState, WorldSimulation } from '../src/game/simulation/WorldSimulation.js';

const map: MapDefinition = {
  id: 'equipment_test', displayName: 'Equipment Test', kind: 'field',
  levelRange: { min: 1, max: 10 }, biome: 'test', gridSize: { width: 30, height: 30 },
  npcs: [{ npcId: 'merchant', position: { x: 300, y: 300 } }], portals: [],
  playerSpawn: { x: 0, y: 0 }, safeZone: null,
  spawnTables: [{
    id: 'training_target', bounds: { x: 24, y: 0, width: 1, height: 1 }, maxConcurrent: 1, respawnSeconds: 5,
    entries: [{ monsterId: 'training_guard', weight: 1 }],
  }],
};

const data: GameData = {
  maps: [map], quests: [], drops: [], jobs: [], skills: [],
  npcs: [{ id: 'merchant', displayName: 'Quartermaster', role: 'merchant', title: 'Trader', dialogue: ['Choose well.'] }],
  monsters: [{ id: 'training_guard', displayName: 'Training Guard', baseLevel: 10, hp: 500, atk: 30, def: 3, size: 'small', element: 'neutral' }],
  items: [
    { id: 'power_blade', displayName: 'Power Blade', kind: 'equipment', stackMax: 1, sellPrice: 40, slot: 'weapon', stats: { atk: 20 } },
    { id: 'swift_blade', displayName: 'Swift Blade', kind: 'equipment', stackMax: 1, sellPrice: 40, slot: 'weapon', stats: { spd: 10 } },
    { id: 'critical_blade', displayName: 'Critical Blade', kind: 'equipment', stackMax: 1, sellPrice: 40, slot: 'weapon', stats: { crit: 100 } },
    { id: 'life_charm', displayName: 'Life Charm', kind: 'equipment', stackMax: 1, sellPrice: 40, slot: 'accessory', stats: { hp: 40 } },
    { id: 'guard_charm', displayName: 'Guard Charm', kind: 'equipment', stackMax: 1, sellPrice: 40, slot: 'accessory', stats: { def: 20 } },
  ],
  shops: [{ id: 'quartermaster', displayName: 'Quartermaster', npcId: 'merchant', itemIds: [] }],
};

const idleInput = {
  x: 0, y: 0, sprint: false, attackPressed: false, autoAttack: false,
  interactPressed: false, skillRequests: [],
};

function simulationWith(...itemIds: string[]): WorldSimulation {
  return new WorldSimulation(data, map, map.playerSpawn, undefined, itemIds.map((itemId) => ({ itemId, count: 1 })));
}

function attackOnce(simulation: WorldSimulation, memberId: string): number {
  const attacker = simulation.party.find((member) => member.id === memberId)!;
  const monster = simulation.monsters[0];
  for (const member of simulation.party) {
    member.x = 0;
    member.y = 0;
    member.attackCooldown = 99;
  }
  attacker.x = 0;
  attacker.y = 0;
  attacker.attackCooldown = 0;
  monster.x = 24;
  monster.y = 0;
  monster.hp = monster.maxHp;
  monster.alive = true;
  monster.attackCooldown = 99;
  const events = simulation.update({ ...idleInput, autoAttack: true }, 0.05);
  return events.find((event) => event.type === 'monster-hit' && event.memberId === memberId)?.amount ?? 0;
}

assert.deepEqual(
  normalizeEquipmentState({ weapon: 'power_blade', accessory: 'life_charm' }),
  { warden: { weapon: 'power_blade', accessory: 'life_charm' } },
  'Legacy leader-only saves should migrate to Aster without losing slots',
);

const ownership = simulationWith('power_blade');
assert.ok(ownership.equipItem('warden', 'power_blade').some((event) => event.type === 'item-equipped' && event.memberId === 'warden'));
assert.ok(ownership.equipItem('ranger', 'power_blade').some((event) => event.type === 'item-blocked' && event.reason === 'assigned'), 'One owned copy cannot be assigned twice');
ownership.inventory.push({ itemId: 'power_blade', count: 1 });
assert.ok(ownership.equipItem('ranger', 'power_blade').some((event) => event.type === 'item-equipped'), 'A second owned copy should support a second party loadout');
assert.equal(ownership.equippedCount('power_blade'), 2);

const health = simulationWith('life_charm');
const warden = health.party.find((member) => member.id === 'warden')!;
const baseHealth = warden.baseMaxHp;
health.equipItem('warden', 'life_charm');
assert.equal(warden.maxHp, baseHealth + 40, 'HP gear should raise effective maximum HP');
assert.equal(warden.hp, warden.maxHp, 'Equipping HP gear at full health should fill the added capacity');
assert.ok(health.unequipItem('warden', 'accessory').some((event) => event.type === 'item-unequipped'));
assert.equal(warden.maxHp, baseHealth, 'Unequipping should restore base maximum HP');

const speed = simulationWith('swift_blade');
const baseInterval = speed.attackIntervalFor('ranger');
speed.equipItem('ranger', 'swift_blade');
assert.ok(speed.attackIntervalFor('ranger') < baseInterval, 'SPD should reduce the equipped member attack interval');

const baseAttack = simulationWith();
const gearedAttack = simulationWith('power_blade');
gearedAttack.equipItem('ranger', 'power_blade');
assert.ok(attackOnce(gearedAttack, 'ranger') > attackOnce(baseAttack, 'ranger'), 'ATK gear should increase non-leader damage');

const criticalAttack = simulationWith('critical_blade');
criticalAttack.equipItem('channeler', 'critical_blade');
const normalMagicDamage = attackOnce(simulationWith(), 'channeler');
const criticalDamage = attackOnce(criticalAttack, 'channeler');
assert.ok(criticalDamage > normalMagicDamage, '100 CRIT should deterministically produce a critical hit');

function monsterHitAmount(simulation: WorldSimulation): number {
  const ranger = simulation.party.find((member) => member.id === 'ranger')!;
  for (const member of simulation.party) { member.x = 0; member.y = 0; member.hp = 0; }
  ranger.hp = ranger.maxHp; ranger.invulnerable = 0;
  const monster = simulation.monsters[0];
  monster.x = -16; monster.y = -13; monster.attackCooldown = 0;
  const events = simulation.update(idleInput, 0.05);
  return events.find((event) => event.type === 'player-hit' && event.memberId === 'ranger')?.amount ?? 0;
}

const baseDefense = monsterHitAmount(simulationWith());
const gearedDefenseSimulation = simulationWith('guard_charm');
gearedDefenseSimulation.equipItem('ranger', 'guard_charm');
assert.ok(monsterHitAmount(gearedDefenseSimulation) < baseDefense, 'DEF gear should protect non-leader party members');

const growth = simulationWith('life_charm');
growth.equipItem('warden', 'life_charm');
growth.monsters[0].maxHp = 1;
attackOnce(growth, 'warden');
const grownWarden = growth.party.find((member) => member.id === 'warden')!;
assert.equal(grownWarden.level, 2, 'The training target should grant enough XP to level up');
assert.equal(grownWarden.maxHp, grownWarden.baseMaxHp + 40, 'Level growth and HP gear should remain separate after leveling');

const sales = new WorldSimulation(data, map, map.playerSpawn, undefined, [
  { itemId: 'guard_charm', count: 1 }, { itemId: 'guard_charm', count: 1 },
]);
sales.equipItem('mender', 'guard_charm');
assert.ok(sales.sellItem('merchant', 'guard_charm').some((event) => event.type === 'economy-transaction'), 'An unassigned duplicate should remain sellable');
assert.ok(sales.sellItem('merchant', 'guard_charm').some((event) => event.type === 'economy-blocked' && event.reason === 'equipped'), 'The final assigned copy should be protected from sale');

console.log('Party equipment smoke test passed.');
