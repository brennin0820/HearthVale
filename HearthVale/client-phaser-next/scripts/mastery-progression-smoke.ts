import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import type { GameData, JobDefinition, MapDefinition, SkillDefinition } from '../src/game/data/types.js';
import { JOB_RETRAIN_COST, MASTERY_RETRAIN_COST, WorldSimulation } from '../src/game/simulation/WorldSimulation.js';

const map: MapDefinition = {
  id: 'mastery_test', displayName: 'Mastery Test', kind: 'town',
  levelRange: { min: 1, max: 20 }, biome: 'test', gridSize: { width: 30, height: 30 },
  playerSpawn: { x: 0, y: 0 }, safeZone: null, portals: [], npcs: [],
  spawnTables: [{
    id: 'training', bounds: { x: 24, y: 0, width: 1, height: 1 }, maxConcurrent: 1, respawnSeconds: 5,
    entries: [{ monsterId: 'training_golem', weight: 1 }],
  }],
};
const jobs = JSON.parse(readFileSync(new URL('../../data/catalog/jobs.json', import.meta.url), 'utf8')) as JobDefinition[];
const skills = JSON.parse(readFileSync(new URL('../../data/catalog/skills.json', import.meta.url), 'utf8')) as SkillDefinition[];
const data: GameData = {
  maps: [map], jobs, skills, quests: [], npcs: [], items: [], drops: [],
  monsters: [{ id: 'training_golem', displayName: 'Training Golem', baseLevel: 18, hp: 5000, atk: 40, def: 0, size: 'large', element: 'neutral' }],
};
const idleInput = {
  x: 0, y: 0, sprint: false, attackPressed: false, autoAttack: false,
  interactPressed: false, skillRequests: [],
};

function simulation(): WorldSimulation {
  return new WorldSimulation(data, map, map.playerSpawn, undefined, [], undefined, 2000);
}

function setLevel(sim: WorldSimulation, level: number): void {
  for (const member of sim.party) member.level = level;
}

function isolateMember(sim: WorldSimulation, memberId: string): void {
  for (const member of sim.party) {
    member.x = 0;
    member.y = 0;
    member.attackCooldown = member.id === memberId ? 0 : 99;
    member.hp = member.id === memberId ? member.maxHp : 0;
    member.invulnerable = 0;
  }
  sim.monsters[0].x = 20;
  sim.monsters[0].y = 0;
  sim.monsters[0].alive = true;
  sim.monsters[0].hp = sim.monsters[0].maxHp;
  sim.monsters[0].attackCooldown = 0;
}

const advancedJobs = jobs.filter((job) => (job.tier ?? 0) > 0);
assert.equal(advancedJobs.length, 6);
assert.ok(advancedJobs.every((job) => job.masteries?.length === 2));
assert.equal(new Set(advancedJobs.flatMap((job) => job.masteries?.map((mastery) => mastery.id) ?? [])).size, 12);

const wardenSim = simulation();
setLevel(wardenSim, 17);
assert.ok(wardenSim.changeJob('warden', 'warden').some((event) => event.type === 'job-changed'));
assert.ok(wardenSim.chooseMastery('warden', 'bulwark_keeper')
  .some((event) => event.type === 'mastery-change-blocked' && event.reason === 'level'));
setLevel(wardenSim, 18);
isolateMember(wardenSim, 'warden');
const unmasteredHit = wardenSim.update(idleInput, 0.01).find((event) => event.type === 'player-hit')?.amount ?? 0;
const hpBeforeMastery = wardenSim.player.maxHp;
const firstMastery = wardenSim.chooseMastery('warden', 'bulwark_keeper');
assert.ok(firstMastery.some((event) => event.type === 'mastery-changed' && event.goldCost === 0));
assert.equal(wardenSim.player.maxHp, hpBeforeMastery + 70);
assert.deepEqual(wardenSim.masteryBonuses('warden'), { hp: 70, def: 8 });
isolateMember(wardenSim, 'warden');
const masteredHit = wardenSim.update(idleInput, 0.01).find((event) => event.type === 'player-hit')?.amount ?? 0;
assert.ok(masteredHit < unmasteredHit, 'Bulwark Keeper defense should reduce incoming damage');
assert.ok(wardenSim.chooseMastery('warden', 'bulwark_keeper')
  .some((event) => event.type === 'mastery-change-blocked' && event.reason === 'same'));

const restored = new WorldSimulation(data, map, map.playerSpawn, structuredClone(wardenSim.party), [], undefined, wardenSim.gold);
assert.equal(restored.player.masteryId, 'bulwark_keeper');
assert.equal(restored.player.maxHp, wardenSim.player.maxHp, 'Mastery-derived HP should survive save restoration without doubling');
const invalidParty = structuredClone(wardenSim.party);
invalidParty[0].masteryId = 'not_a_real_mastery';
const invalidRestore = new WorldSimulation(data, map, map.playerSpawn, invalidParty, [], undefined, wardenSim.gold);
assert.equal(invalidRestore.player.masteryId, undefined, 'Invalid saved mastery ids should be discarded');
assert.equal(invalidRestore.player.maxHp, invalidRestore.player.baseMaxHp);

const goldBeforeMasteryRetrain = wardenSim.gold;
assert.ok(wardenSim.chooseMastery('warden', 'dawnsworn_edge')
  .some((event) => event.type === 'mastery-changed' && event.goldCost === MASTERY_RETRAIN_COST));
assert.equal(wardenSim.gold, goldBeforeMasteryRetrain - MASTERY_RETRAIN_COST);
assert.equal(wardenSim.player.maxHp, hpBeforeMastery);
assert.deepEqual(wardenSim.masteryBonuses('warden'), { atk: 8, crit: 5 });
const goldBeforePathRetrain = wardenSim.gold;
assert.ok(wardenSim.changeJob('warden', 'ranger')
  .some((event) => event.type === 'job-changed' && event.goldCost === JOB_RETRAIN_COST));
assert.equal(wardenSim.gold, goldBeforePathRetrain - JOB_RETRAIN_COST);
assert.equal(wardenSim.player.masteryId, undefined, 'Changing paths should clear the old path mastery');

const channelerSim = simulation();
setLevel(channelerSim, 18);
channelerSim.changeJob('channeler', 'channeler');
isolateMember(channelerSim, 'channeler');
const baseDamage = channelerSim.update({ ...idleInput, attackPressed: true }, 0.01)
  .find((event) => event.type === 'monster-hit' && event.memberId === 'channeler')?.amount ?? 0;
const baseMp = channelerSim.party[2].maxMp;
channelerSim.chooseMastery('channeler', 'prism_savant');
isolateMember(channelerSim, 'channeler');
const masteryDamage = channelerSim.update({ ...idleInput, attackPressed: true }, 0.01)
  .find((event) => event.type === 'monster-hit' && event.memberId === 'channeler')?.amount ?? 0;
assert.ok(masteryDamage > baseDamage, 'Prism Savant power should raise outgoing damage');
assert.equal(channelerSim.party[2].maxMp, baseMp + 40);

const menderSim = simulation();
setLevel(menderSim, 18);
menderSim.changeJob('mender', 'mender');
menderSim.chooseMastery('mender', 'hearthkeeper');
const mender = menderSim.party[3];
menderSim.player.hp = 1;
const mend = skills.find((skill) => skill.id === 'mend_wounds')!;
const expectedHeal = Math.round(((mend.effect.amount ?? 0) + mender.level * 2.5) * 1.2);
const healAmount = menderSim.update({ ...idleInput, skillRequests: [{ memberId: 'mender', skillId: 'mend_wounds' }] }, 0.01)
  .find((event) => event.type === 'member-healed' && event.healerId === 'mender')?.amount;
assert.equal(healAmount, expectedHeal, 'Hearthkeeper should amplify active healing by 20%');

const wayfarerSim = simulation();
setLevel(wayfarerSim, 18);
wayfarerSim.changeJob('warden', 'wayfarer');
wayfarerSim.chooseMastery('warden', 'trailbroker');
assert.equal(wayfarerSim.buyPriceMultiplier(), 0.85);
assert.equal(wayfarerSim.stackSizeBonus(), 40);
wayfarerSim.chooseMastery('warden', 'relic_seeker');
assert.equal(wayfarerSim.buyPriceMultiplier(), 0.9);
assert.equal(wayfarerSim.dropRateBonus(), 27);
assert.equal(wayfarerSim.stackSizeBonus(), 20);
assert.ok(wayfarerSim.attackIntervalFor('warden') < 0.66, 'Relic Seeker haste should accelerate attacks');

const shadeSim = simulation();
setLevel(shadeSim, 18);
shadeSim.changeJob('warden', 'shade');
shadeSim.chooseMastery('warden', 'hollow_dancer');
assert.ok(Math.abs(shadeSim.attackIntervalFor('warden') - 0.36) < 0.0001);
isolateMember(shadeSim, 'warden');
let dodged = false;
for (let attempt = 0; attempt < 100 && !dodged; attempt += 1) {
  shadeSim.player.hp = shadeSim.player.maxHp;
  shadeSim.player.invulnerable = 0;
  shadeSim.monsters[0].attackCooldown = 0;
  dodged = shadeSim.update(idleInput, 0.01).some((event) => event.type === 'player-dodged');
}
assert.ok(dodged, 'Hollow Dancer evasion should be consumed by monster attacks');
shadeSim.chooseMastery('warden', 'nightglass_blade');
isolateMember(shadeSim, 'warden');
let critical = false;
for (let attempt = 0; attempt < 100 && !critical; attempt += 1) {
  shadeSim.player.hp = shadeSim.player.maxHp;
  shadeSim.player.attackCooldown = 0;
  shadeSim.monsters[0].alive = true;
  shadeSim.monsters[0].hp = shadeSim.monsters[0].maxHp;
  shadeSim.monsters[0].x = 20;
  shadeSim.monsters[0].y = 0;
  critical = shadeSim.update({ ...idleInput, attackPressed: true }, 0.01)
    .some((event) => event.type === 'monster-hit' && event.critical);
}
assert.ok(critical, 'Nightglass Blade critical chance should be consumed by player attacks');

console.log('Mastery progression smoke test passed (12 choices, gates, saves, retraining, combat, healing, and economy).');
