import assert from 'node:assert/strict';
import type { GameData, MapDefinition } from '../src/game/data/types.js';
import { WorldSimulation } from '../src/game/simulation/WorldSimulation.js';

const map: MapDefinition = {
  id: 'quest_test', displayName: 'Quest Test', kind: 'field',
  levelRange: { min: 1, max: 2 }, biome: 'test', gridSize: { width: 20, height: 20 },
  npcs: [{ npcId: 'trainer_bram', position: { x: 0, y: 0 } }],
  portals: [], playerSpawn: { x: 0, y: 0 }, safeZone: null,
  spawnTables: [{
    id: 'targets', bounds: { x: 24, y: 0, width: 1, height: 1 }, maxConcurrent: 5, respawnSeconds: 5,
    entries: [{ monsterId: 'training_bud', weight: 1 }],
  }],
};

const routeMap: MapDefinition = {
  ...map,
  id: 'route_destination',
  displayName: 'Route Destination',
  npcs: [{ npcId: 'trainer_bram', position: { x: 0, y: 0 } }],
  spawnTables: [],
};

const data: GameData = {
  maps: [map, routeMap],
  npcs: [{
    id: 'trainer_bram',
    displayName: 'Trainer Bram',
    role: 'trainer',
    title: 'Field Trainer',
    dialogue: ['Bring back proof you can handle the fields.'],
  }],
  monsters: [{
    id: 'training_bud', displayName: 'Training Bud', baseLevel: 1,
    hp: 1, atk: 1, def: 0, size: 'small', element: 'nature',
  }],
  jobs: [],
  skills: [],
  items: [
    { id: 'clover_herb', displayName: 'Clover Herb', kind: 'material', stackMax: 99, sellPrice: 8 },
    { id: 'healing_brew', displayName: 'Healing Brew', kind: 'consumable', stackMax: 20, sellPrice: 15, effect: { type: 'heal', amount: 60 } },
    { id: 'hearth_charm', displayName: 'Hearth Charm', kind: 'consumable', stackMax: 5, sellPrice: 20 },
    { id: 'wooden_blade', displayName: 'Wooden Blade', kind: 'equipment', stackMax: 1, sellPrice: 40, levelReq: 1, slot: 'weapon', stats: { atk: 6 } },
  ],
  quests: [
    {
      id: 'quest_first_hunt', displayName: 'First Hunt', giverNpcId: 'trainer_bram', requiredLevel: 1,
      objectives: [{ id: 'defeats', kind: 'defeat', targetId: '*', count: 5, label: 'Defeat creatures' }],
      rewards: { xp: 70, gold: 35, items: [{ itemId: 'healing_brew', count: 3 }] },
    },
    {
      id: 'quest_route', displayName: 'Route Test', giverNpcId: 'trainer_bram', requiredLevel: 1,
      prerequisiteQuestIds: ['quest_first_hunt'],
      objectives: [
        { id: 'supplies', kind: 'collect', targetId: 'clover_herb', count: 1, label: 'Carry a Clover Herb' },
        { id: 'destination', kind: 'visit', targetId: 'route_destination', count: 1, label: 'Reach the destination' },
      ],
      turnInItems: [{ itemId: 'clover_herb', count: 1 }],
      rewards: { xp: 20, gold: 10 },
    },
  ],
  drops: [{
    id: 'drops_training_bud',
    monsterId: 'training_bud',
    entries: [{ itemId: 'clover_herb', weight: 100, minCount: 1, maxCount: 1 }],
  }],
};

const simulation = new WorldSimulation(data, map, map.playerSpawn);
  const startEvents = simulation.interactWithNpc(data.npcs[0]);
  assert.ok(startEvents.some((event) => event.type === 'quest-started' && event.questId === 'quest_first_hunt'), 'Trainer should start First Hunt');
  assert.equal(simulation.quests[0].status, 'active');

  for (let i = 0; i < 5; i += 1) {
    const monster = simulation.monsters[i];
    monster.x = 25 + i;
    monster.y = 0;
    monster.hp = 1;
    monster.alive = true;
    simulation.party.forEach((member) => { member.attackCooldown = 0; });
    simulation.update({
      x: 0, y: 0, sprint: false, attackPressed: true, autoAttack: true,
      interactPressed: false, skillRequests: [],
    }, 0.05);
  }

  const quest = simulation.quests.find((state) => state.questId === 'quest_first_hunt');
  assert.equal(quest?.status, 'ready', 'First Hunt should be ready after five defeats');
  assert.equal(quest.progress, 5);
  assert.ok((simulation.inventory.find((stack) => stack.itemId === 'clover_herb')?.count ?? 0) >= 5, 'Defeated monsters should drop inventory loot');

  const goldBefore = simulation.gold;
  const completeEvents = simulation.interactWithNpc(data.npcs[0]);
  assert.ok(completeEvents.some((event) => event.type === 'quest-completed' && event.questId === 'quest_first_hunt'), 'Trainer should complete First Hunt');
  assert.equal(quest.status, 'completed');
  assert.ok(simulation.gold > goldBefore, 'Quest completion should award gold');
  assert.ok((simulation.inventory.find((stack) => stack.itemId === 'healing_brew')?.count ?? 0) >= 5, 'Quest reward should add healing brews');

  const routeStartEvents = simulation.interactWithNpc(data.npcs[0]);
  assert.ok(routeStartEvents.some((event) => event.type === 'quest-started' && event.questId === 'quest_route'), 'Prerequisite completion should unlock the route quest');
  const routeQuest = simulation.quests.find((state) => state.questId === 'quest_route');
  assert.equal(routeQuest?.objectiveProgress.supplies, 1, 'Collect objectives should count items already carried when accepted');
  assert.equal(routeQuest?.status, 'active');

  const destination = new WorldSimulation(data, routeMap, routeMap.playerSpawn, simulation.party, simulation.inventory, simulation.quests, simulation.gold, simulation.equipment);
  const visitEvents = destination.update({
    x: 0, y: 0, sprint: false, attackPressed: false, autoAttack: false,
    interactPressed: false, skillRequests: [],
  }, 0.05);
  assert.ok(visitEvents.some((event) => event.type === 'quest-progress' && event.questId === 'quest_route'), 'Entering a target map should advance visit objectives');
  const destinationQuest = destination.quests.find((state) => state.questId === 'quest_route');
  assert.equal(destinationQuest?.status, 'ready', 'Multi-objective quest should become ready after every objective is complete');
  const herbsBeforeTurnIn = destination.inventory.find((stack) => stack.itemId === 'clover_herb')?.count ?? 0;
  destination.interactWithNpc(data.npcs[0]);
  assert.equal(destinationQuest?.status, 'completed');
  assert.equal(destination.inventory.find((stack) => stack.itemId === 'clover_herb')?.count, herbsBeforeTurnIn - 1, 'Turn-in items should be consumed');

  destination.player.hp -= 40;
  const hpBefore = destination.player.hp;
  const healEvents = destination.useItem('healing_brew');
  assert.ok(healEvents.some((event) => event.type === 'item-used' && event.itemId === 'healing_brew'), 'Healing Brew should be usable from inventory');
  assert.ok(destination.player.hp > hpBefore, 'Healing Brew should restore HP');

  destination.inventory.push({ itemId: 'wooden_blade', count: 1 });
  const equipEvents = destination.useItem('wooden_blade');
  assert.ok(equipEvents.some((event) => event.type === 'item-equipped' && event.itemId === 'wooden_blade'), 'Equipment should be equippable from inventory');
assert.equal(destination.equipment.warden.weapon, 'wooden_blade');

console.log('Quest and inventory smoke test passed.');
