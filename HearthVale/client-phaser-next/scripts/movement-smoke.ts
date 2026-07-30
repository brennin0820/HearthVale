import assert from 'node:assert/strict';
import type { GameData, MapDefinition } from '../src/game/data/types.js';
import { WorldSimulation } from '../src/game/simulation/WorldSimulation.js';

const map: MapDefinition = {
  id: 'movement_test', displayName: 'Movement Test', kind: 'field',
  levelRange: { min: 1, max: 2 }, biome: 'test',
  gridSize: { width: 20, height: 20 }, npcs: [], portals: [],
  playerSpawn: { x: 0, y: 0 }, safeZone: null,
  spawnTables: [{
    id: 'nearby', bounds: { x: 0, y: 0, width: 1, height: 1 },
    maxConcurrent: 1, respawnSeconds: 5,
    entries: [{ monsterId: 'training_bud', weight: 1 }],
  }],
};

const data: GameData = {
  maps: [map], npcs: [], jobs: [], skills: [],
  monsters: [{
    id: 'training_bud', displayName: 'Training Bud', baseLevel: 1,
    hp: 500, atk: 1, def: 0, size: 'small', element: 'nature',
  }],
};

const simulation = new WorldSimulation(data, map, map.playerSpawn);
simulation.monsters[0].x = 0;
simulation.monsters[0].y = -30;
const followerStart = { x: simulation.party[1].x, y: simulation.party[1].y };
const idleAutoCombat = {
  x: 0, y: 0, sprint: false, attackPressed: false,
  autoAttack: true, interactPressed: false, skillRequests: [],
};

simulation.update(idleAutoCombat, 0.05);
simulation.update(idleAutoCombat, 0.05);

const followerDrift = Math.hypot(
  simulation.party[1].x - followerStart.x,
  simulation.party[1].y - followerStart.y,
);
assert.ok(followerDrift < 0.01, `Formation drifted ${followerDrift.toFixed(2)}px while the player was stationary`);

console.log('Movement smoke test passed.');
