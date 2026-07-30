import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import type { GameData, JobDefinition, MapDefinition, SkillDefinition } from '../src/game/data/types.js';
import { WorldSimulation } from '../src/game/simulation/WorldSimulation.js';

const map: MapDefinition = {
  id: 'skills_test', displayName: 'Skills Test', kind: 'field',
  levelRange: { min: 1, max: 2 }, biome: 'test', gridSize: { width: 20, height: 20 },
  npcs: [], portals: [], playerSpawn: { x: 0, y: 0 }, safeZone: null,
  spawnTables: [{
    id: 'targets', bounds: { x: 24, y: 0, width: 1, height: 1 }, maxConcurrent: 3, respawnSeconds: 5,
    entries: [{ monsterId: 'training_bud', weight: 1 }],
  }],
};

const jobs = JSON.parse(readFileSync(new URL('../../data/catalog/jobs.json', import.meta.url), 'utf8')) as JobDefinition[];
const skills = JSON.parse(readFileSync(new URL('../../data/catalog/skills.json', import.meta.url), 'utf8')) as SkillDefinition[];
const data: GameData = {
  maps: [map], npcs: [], jobs, skills,
  monsters: [{ id: 'training_bud', displayName: 'Training Bud', baseLevel: 1, hp: 500, atk: 1, def: 0, size: 'small', element: 'nature' }],
};

const playableClassIds = ['warden', 'ranger', 'channeler', 'mender'];
const expectedSkillIds = playableClassIds.flatMap((id) => jobs.find((job) => job.id === id)?.startingSkills ?? []);
assert.equal(expectedSkillIds.length, 12, 'the four playable classes should expose three skills each');

function advancedSimulation(jobId: string): WorldSimulation {
  const simulation = new WorldSimulation(data, map, map.playerSpawn);
  simulation.party.forEach((member) => { member.level = 10; });
  assert.ok(
    simulation.changeJob(jobId, jobId).some((event) => event.type === 'job-changed'),
    `${jobId} should advance at level 10`,
  );
  return simulation;
}

for (const skillId of expectedSkillIds) {
  const skill = skills.find((candidate) => candidate.id === skillId);
  assert.ok(skill, `${skillId} should resolve in the catalog`);
  const owner = playableClassIds.find((id) => jobs.find((job) => job.id === id)?.startingSkills.includes(skillId));
  assert.ok(owner, `${skillId} should have a playable owner`);

  const simulation = advancedSimulation(owner);
  simulation.monsters.forEach((monster, index) => { monster.x = 28 + index * 8; monster.y = 0; });
  simulation.party[0].hp -= 30;
  const member = simulation.party.find((candidate) => candidate.id === owner)!;
  const mpBefore = member.mp;
  const events = simulation.update({
    x: 0, y: 0, sprint: false, attackPressed: false, autoAttack: false, interactPressed: false,
    skillRequests: [{ memberId: owner, skillId }],
  }, 1 / 60);

  assert.ok(events.some((event) => event.type === 'skill-used' && event.skillId === skillId), `${skillId} should cast successfully`);
  assert.equal(member.skillCooldowns[skillId], skill.cooldown, `${skillId} should start its cooldown`);
  assert.ok(member.mp < mpBefore || skill.mpCost === 0, `${skillId} should spend its MP cost`);
}

const volleySimulation = advancedSimulation('ranger');
volleySimulation.monsters.forEach((monster, index) => { monster.x = 28 + index * 8; monster.y = 0; });
const volleyEvents = volleySimulation.update({
  x: 0, y: 0, sprint: false, attackPressed: false, autoAttack: false, interactPressed: false,
  skillRequests: [{ memberId: 'ranger', skillId: 'thornvolley' }],
}, 1 / 60);
const volley = volleyEvents.find((event) => event.type === 'skill-used' && event.skillId === 'thornvolley');
assert.ok(volley?.type === 'skill-used' && volley.affectedUids?.length === 3, 'Thornvolley should hit clustered enemies');

console.log('Skill smoke test passed (12 skills across 4 advanced paths).');
