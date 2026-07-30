import assert from 'node:assert/strict';
import type { GameData, MapDefinition, MonsterDefinition } from '../src/game/data/types.js';
import { elementalEffectiveness, WorldSimulation } from '../src/game/simulation/WorldSimulation.js';

const input = {
  x: 0, y: 0, sprint: false, attackPressed: false, autoAttack: false,
  interactPressed: false, skillRequests: [{ memberId: 'channeler', skillId: 'sprout_bolt' }],
};

function makeSimulation(monster: MonsterDefinition): WorldSimulation {
  const map: MapDefinition = {
    id: `element_${monster.element}`, displayName: 'Element Test', kind: 'field',
    levelRange: { min: 1, max: 1 }, biome: 'test', gridSize: { width: 20, height: 20 },
    npcs: [], portals: [], playerSpawn: { x: 0, y: 0 }, safeZone: null,
    spawnTables: [{
      id: 'target', bounds: { x: 30, y: 0, width: 1, height: 1 }, maxConcurrent: 1, respawnSeconds: 10,
      entries: [{ monsterId: monster.id, weight: 100 }],
    }],
  };
  const data: GameData = {
    maps: [map], npcs: [], monsters: [monster], items: [], quests: [], drops: [],
    jobs: [{ id: 'channeler', displayName: 'Channeler', role: 'magic', startingSkills: ['sprout_bolt'] }],
    skills: [{
      id: 'sprout_bolt', displayName: 'Sprout Bolt', type: 'magical', targetType: 'enemy',
      description: 'Element test skill', mpCost: 0, cooldown: 1,
      effect: { kind: 'damage', powerMultiplier: 1 }, element: 'nature',
    }],
  };
  const simulation = new WorldSimulation(data, map, map.playerSpawn);
  const target = simulation.monsters[0];
  const caster = simulation.party.find((member) => member.id === 'channeler')!;
  target.x = caster.x + 20;
  target.y = caster.y;
  return simulation;
}

const waterTarget = { id: 'water_target', displayName: 'Water Target', baseLevel: 1, hp: 200, atk: 0, def: 0, size: 'small' as const, element: 'water' };
const fungalTarget = { ...waterTarget, id: 'fungal_target', displayName: 'Fungal Target', element: 'fungal' };

const strongEvents = makeSimulation(waterTarget).update(input, 0.05);
const resistedEvents = makeSimulation(fungalTarget).update(input, 0.05);
const strongHit = strongEvents.find((event) => event.type === 'monster-hit');
const resistedHit = resistedEvents.find((event) => event.type === 'monster-hit');

assert.equal(elementalEffectiveness('nature', 'water'), 1.35);
assert.equal(elementalEffectiveness('nature', 'fungal'), 0.75);
assert.equal(elementalEffectiveness('fire', 'crystal'), 1.35);
assert.equal(elementalEffectiveness('fire', 'water'), 0.75);
assert.equal(elementalEffectiveness('crystal', 'fire'), 1.25);
assert.equal(strongHit?.effectiveness, 'strong', 'Nature damage should be strong against water creatures');
assert.equal(resistedHit?.effectiveness, 'resisted', 'Fungal creatures should resist nature damage');
assert.ok((strongHit?.amount ?? 0) > (resistedHit?.amount ?? 0), 'Elemental advantage should change actual damage');

console.log('Elemental combat smoke test passed.');
