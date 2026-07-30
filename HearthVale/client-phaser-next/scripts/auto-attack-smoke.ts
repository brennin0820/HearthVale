import assert from 'node:assert/strict';
import type { GameData, MapDefinition } from '../src/game/data/types.js';
import { WorldSimulation } from '../src/game/simulation/WorldSimulation.js';

const map: MapDefinition = {
  id: 'auto_attack_test',
  displayName: 'Auto Attack Test',
  kind: 'field',
  levelRange: { min: 1, max: 2 },
  biome: 'test',
  gridSize: { width: 20, height: 20 },
  npcs: [],
  portals: [],
  playerSpawn: { x: 0, y: 0 },
  safeZone: null,
  spawnTables: [{
    id: 'nearby',
    bounds: { x: 0, y: 0, width: 1, height: 1 },
    maxConcurrent: 1,
    respawnSeconds: 5,
    entries: [{ monsterId: 'training_bud', weight: 1 }],
  }],
};

const data: GameData = {
  maps: [map],
  npcs: [],
  jobs: [],
  skills: [],
  monsters: [{
    id: 'training_bud', displayName: 'Training Bud', baseLevel: 1,
    hp: 50, atk: 1, def: 0, size: 'small', element: 'nature',
  }],
};

function createSimulation(): WorldSimulation {
  const simulation = new WorldSimulation(data, map, map.playerSpawn);
  simulation.monsters[0].x = 30;
  simulation.monsters[0].y = 0;
  return simulation;
}

const enabled = createSimulation();
const enabledEvents = enabled.update({
  x: 0, y: 0, sprint: false, attackPressed: false,
  autoAttack: true, interactPressed: false, skillRequests: [],
}, 1 / 60);

assert.ok(enabledEvents.some((event) => event.type === 'attack-swing' && event.automatic));
assert.ok(enabled.monsters[0].hp < enabled.monsters[0].maxHp);
assert.ok(enabled.player.facing.x > 0.99);

const disabled = createSimulation();
disabled.update({
  x: 0, y: 0, sprint: false, attackPressed: false,
  autoAttack: false, interactPressed: false, skillRequests: [],
}, 1 / 60);
assert.equal(disabled.monsters[0].hp, disabled.monsters[0].maxHp);

console.log('Auto-attack smoke test passed.');
