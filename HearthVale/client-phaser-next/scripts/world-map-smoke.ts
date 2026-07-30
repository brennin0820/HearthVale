import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import type {
  CollisionGrid,
  GameData,
  JobDefinition,
  MapDefinition,
  MapPropSet,
  MonsterDefinition,
  NpcDefinition,
  SkillDefinition,
  Vec2,
} from '../src/game/data/types.js';
import { isWalkable, moveWithCollisions } from '../src/game/simulation/CollisionGrid.js';
import { WorldSimulation } from '../src/game/simulation/WorldSimulation.js';

const projectRoot = resolve(import.meta.dirname, '../..');
async function json<T>(relativePath: string): Promise<T> {
  return JSON.parse(await readFile(resolve(projectRoot, relativePath), 'utf8')) as T;
}

const routeIds = ['hearthvale_town_ro', 'cloverfield_plains_ro', 'old_crystal_mine_ro_b1'] as const;
const [allMaps, npcs, monsters, jobs, skills] = await Promise.all([
  json<MapDefinition[]>('data/maps.json'),
  json<NpcDefinition[]>('data/catalog/npcs.json'),
  json<MonsterDefinition[]>('data/catalog/monsters.json'),
  json<JobDefinition[]>('data/catalog/jobs.json'),
  json<SkillDefinition[]>('data/catalog/skills.json'),
]);
const maps = routeIds.map((id) => {
  const map = allMaps.find((candidate) => candidate.id === id);
  assert.ok(map, `Missing playable map ${id}`);
  return map;
});
const collisionEntries = await Promise.all(routeIds.map(async (id) => [id, await json<CollisionGrid>(`data/collision/${id}.json`)] as const));
const propEntries = await Promise.all(routeIds.map(async (id) => [id, await json<MapPropSet>(`data/props/${id}.json`)] as const));
const data: GameData = {
  maps,
  npcs,
  monsters,
  jobs,
  skills,
  collisions: Object.fromEntries(collisionEntries),
  props: Object.fromEntries(propEntries),
};

function pointsFor(map: MapDefinition): Array<[string, Vec2]> {
  return [
    ['player spawn', map.playerSpawn],
    ...map.portals.map((portal) => [`portal ${portal.id}`, portal.position] as [string, Vec2]),
    ...map.npcs.map((npc) => [`NPC ${npc.npcId}`, npc.position] as [string, Vec2]),
  ];
}

for (const map of maps) {
  const collision = data.collisions?.[map.id];
  const props = data.props?.[map.id];
  assert.ok(collision, `${map.id} has no collision grid`);
  assert.equal(collision.walkable.length, map.gridSize.height, `${map.id} collision height mismatch`);
  assert.ok(collision.walkable.every((row) => row.length === map.gridSize.width), `${map.id} collision width mismatch`);
  assert.ok(collision.walkable.flat().some((value) => !value), `${map.id} needs real obstacles`);
  assert.ok(props && props.props.length >= 20, `${map.id} needs authored environment props`);
  for (const [label, point] of pointsFor(map)) {
    assert.ok(isWalkable(map, collision, point), `${map.id} ${label} is blocked`);
  }
}

const [town, field, dungeon] = maps;
assert.ok(town.npcs.length >= 4, 'Town needs a complete NPC population');
assert.ok(field.npcs.length >= 1, 'The monster field needs a resident NPC');
assert.ok(town.portals.some((portal) => portal.targetMapId === field.id), 'Town must connect to the field');
assert.ok(field.portals.some((portal) => portal.targetMapId === town.id), 'Field must return to town');
assert.ok(field.portals.some((portal) => portal.targetMapId === dungeon.id), 'Field must connect to the dungeon');
assert.ok(dungeon.portals.some((portal) => portal.targetMapId === field.id), 'Dungeon must return to the field');

for (const map of [field, dungeon]) {
  const simulation = new WorldSimulation(data, map, map.playerSpawn);
  assert.ok(simulation.monsters.length >= 12, `${map.id} needs a full monster population`);
  for (const monster of simulation.monsters) {
    assert.ok(isWalkable(map, data.collisions?.[map.id], monster), `${map.id} spawned ${monster.uid} inside an obstacle`);
  }
}

const fieldCollision = data.collisions?.[field.id];
assert.ok(fieldCollision);
let blockedMovementChecked = false;
for (let row = 1; row < fieldCollision.walkable.length - 1 && !blockedMovementChecked; row += 1) {
  for (let column = 1; column < fieldCollision.walkable[row].length - 1; column += 1) {
    if (!fieldCollision.walkable[row][column] || fieldCollision.walkable[row][column + 1]) continue;
    const start = {
      x: -field.gridSize.width * 16 + column * 32 + 16,
      y: -field.gridSize.height * 16 + row * 32 + 16,
    };
    const moved = moveWithCollisions(field, fieldCollision, start, { x: 28, y: 0 }, 10);
    assert.ok(moved.x < start.x + 20, 'Movement crossed a blocked terrain tile');
    blockedMovementChecked = true;
    break;
  }
}
assert.ok(blockedMovementChecked, 'Could not find a walkable field tile beside an obstacle');

console.log('Playable map smoke test passed: town, field, dungeon, obstacles, NPCs, portals, and monsters are ready.');
