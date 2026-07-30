import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import type { GameData, JobDefinition, MapDefinition, SkillDefinition } from '../src/game/data/types.js';
import { JOB_RETRAIN_COST, type PlayerState, WorldSimulation } from '../src/game/simulation/WorldSimulation.js';

const map: MapDefinition = {
  id: 'advancement_test', displayName: 'Advancement Test', kind: 'town',
  levelRange: { min: 1, max: 20 }, biome: 'test', gridSize: { width: 30, height: 30 },
  playerSpawn: { x: 0, y: 0 }, safeZone: null, portals: [],
  npcs: [{ npcId: 'merchant', position: { x: 0, y: 0 } }],
  spawnTables: [{
    id: 'training', bounds: { x: 24, y: 0, width: 1, height: 1 }, maxConcurrent: 1, respawnSeconds: 5,
    entries: [{ monsterId: 'ore_bud', weight: 1 }],
  }],
};

const jobs = JSON.parse(readFileSync(new URL('../../data/catalog/jobs.json', import.meta.url), 'utf8')) as JobDefinition[];
const skills = JSON.parse(readFileSync(new URL('../../data/catalog/skills.json', import.meta.url), 'utf8')) as SkillDefinition[];
const data: GameData = {
  maps: [map], jobs, skills, quests: [],
  npcs: [{ id: 'merchant', displayName: 'Test Merchant', role: 'merchant', title: 'Trader', dialogue: ['Trade well.'] }],
  monsters: [{ id: 'ore_bud', displayName: 'Ore Bud', baseLevel: 1, hp: 500, atk: 30, def: 0, size: 'small', element: 'nature' }],
  items: [{ id: 'ore', displayName: 'Test Ore', kind: 'material', stackMax: 5, buyPrice: 100, sellPrice: 20 }],
  shops: [{ id: 'test_shop', displayName: 'Test Shop', npcId: 'merchant', itemIds: ['ore'] }],
  drops: [{ id: 'ore_drop', monsterId: 'ore_bud', entries: [{ itemId: 'ore', weight: 10, minCount: 1, maxCount: 1 }] }],
};
const idleInput = {
  x: 0, y: 0, sprint: false, attackPressed: false, autoAttack: false,
  interactPressed: false, skillRequests: [],
};

const simulation = new WorldSimulation(
  data, map, map.playerSpawn, undefined, [], undefined, 1000, undefined, undefined, undefined, undefined,
  { rngSalt: 'phaser-job-5' },
);
assert.deepEqual(simulation.party.map((member) => member.jobId), ['novice', 'novice', 'novice', 'novice']);
assert.ok(simulation.party.every((member) => member.skillIds.join(',') === 'basic_strike,first_aid'));
assert.equal(simulation.advancedJobDefinitions().length, 6, 'All six first-tier paths should be offered');
assert.ok(simulation.changeJob('warden', 'wayfarer').some((event) => event.type === 'job-change-blocked' && event.reason === 'level'));

simulation.party.forEach((member) => { member.level = 10; });
const wayfarerEvents = simulation.changeJob('warden', 'wayfarer');
assert.ok(wayfarerEvents.some((event) => event.type === 'job-changed' && event.goldCost === 0));
assert.equal(simulation.player.role, 'artisan');
assert.deepEqual(simulation.player.skillIds, ['haggle', 'pushcart', 'ore_sense']);
assert.equal(simulation.buyPriceMultiplier(), 0.9);
assert.equal(simulation.dropRateBonus(), 15);
assert.equal(simulation.stackSizeBonus(), 20);
assert.ok(simulation.update({ ...idleInput, skillRequests: [{ memberId: 'warden', skillId: 'haggle' }] }, 0.05)
  .some((event) => event.type === 'skill-blocked' && event.reason === 'passive'));

for (let index = 0; index < 6; index += 1) {
  assert.ok(simulation.buyItem('merchant', 'ore').some((event) => event.type === 'economy-transaction'));
}
assert.equal(simulation.gold, 460, 'Haggle should reduce six 100-gold purchases to 90 gold each');
assert.deepEqual(simulation.inventory.filter((stack) => stack.itemId === 'ore').map((stack) => stack.count), [6], 'Pushcart should extend the material stack cap');

const target = simulation.monsters[0];
for (const member of simulation.party) {
  member.attackCooldown = member.id === 'warden' ? 0 : 99;
  member.x = 0;
  member.y = 0;
}
target.x = 24;
target.y = 0;
target.hp = 1;
const dropEvents = simulation.update({ ...idleInput, autoAttack: true }, 0.05);
assert.ok(dropEvents.some((event) => event.type === 'item-loot' && event.itemId === 'ore'), 'Ore Sense should turn a deterministic 20 roll into loot on a 10% table');

const shadeEvents = simulation.changeJob('ranger', 'shade');
assert.ok(shadeEvents.some((event) => event.type === 'job-changed' && event.goldCost === 0));
const shade = simulation.party.find((member) => member.id === 'ranger')!;
target.alive = true;
target.hp = target.maxHp;
target.x = 20;
target.y = 0;
shade.x = 0;
shade.y = 0;
assert.ok(simulation.update({ ...idleInput, skillRequests: [{ memberId: 'ranger', skillId: 'pilfer' }] }, 0.05)
  .some((event) => event.type === 'skill-used' && event.skillId === 'pilfer'));
assert.ok(target.activeEffects.some((effect) => effect.skillId === 'pilfer' && effect.stat === 'bonusDropChance'));

shade.skillCooldowns.shadowstep = 0;
assert.ok(simulation.update({ ...idleInput, skillRequests: [{ memberId: 'ranger', skillId: 'shadowstep' }] }, 0.05)
  .some((event) => event.type === 'skill-used' && event.skillId === 'shadowstep'));
const flee = shade.activeEffects.find((effect) => effect.skillId === 'shadowstep')!;
flee.amount = 80;
simulation.party.forEach((member) => { member.hp = member.id === shade.id ? member.maxHp : 0; });
let dodged = false;
for (let attempt = 0; attempt < 10 && !dodged; attempt += 1) {
  shade.invulnerable = 0;
  target.attackCooldown = 0;
  target.x = shade.x + 8;
  target.y = shade.y;
  dodged = simulation.update(idleInput, 0.01).some((event) => event.type === 'player-dodged' && event.memberId === shade.id);
}
assert.ok(dodged, 'Shadowstep flee should produce deterministic monster evasion');

simulation.party.forEach((member) => { member.hp = member.maxHp; member.attackCooldown = 99; });
const goldBeforeRetrain = simulation.gold;
const retrainEvents = simulation.changeJob('warden', 'warden');
assert.ok(retrainEvents.some((event) => event.type === 'job-changed' && event.goldCost === JOB_RETRAIN_COST));
assert.equal(simulation.gold, goldBeforeRetrain - JOB_RETRAIN_COST);
assert.equal(simulation.player.role, 'melee');

const hpBeforeGrowth = simulation.player.baseMaxHp;
simulation.player.xp = simulation.player.xpNext - 1;
simulation.player.attackCooldown = 0;
Object.keys(simulation.player.skillCooldowns).forEach((skillId) => { simulation.player.skillCooldowns[skillId] = 99; });
target.alive = true;
target.hp = 1;
target.x = simulation.player.x + 20;
target.y = simulation.player.y;
const growthEvents = simulation.update({ ...idleInput, autoAttack: true }, 0.05);
assert.ok(growthEvents.some((event) => event.type === 'level-up'));
assert.equal(simulation.player.baseMaxHp, hpBeforeGrowth + 26, 'Warden level-up should use authored job growth');

const legacyParty = simulation.party.map((member) => {
  const { jobId: _jobId, ...legacyMember } = structuredClone(member);
  return legacyMember;
}) as unknown as PlayerState[];
const restored = new WorldSimulation(data, map, map.playerSpawn, legacyParty, [], undefined, simulation.gold);
assert.equal(restored.party.find((member) => member.id === 'warden')?.jobId, 'warden');
assert.equal(restored.party.find((member) => member.id === 'ranger')?.jobId, 'shade');

console.log('Job advancement smoke test passed (six paths, passives, retraining, growth, and migration).');
