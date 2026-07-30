import assert from 'node:assert/strict';

import { Client, Room } from 'colyseus.js';
import { createSaveGame, NO_INPUT, WorldSimulation } from '@hearthvale/sim';

import { loadGameData } from '../src/data/loadGameData.js';
import { loadCharacter, saveCharacter } from '../src/persistence/characterRepository.js';
import { startTestServer, waitFor } from './testHarness.js';

interface AuthResponse {
  accountId: string;
  token: string;
}

interface LeaderState {
  level: number;
  x: number;
  y: number;
}

async function registerAccount(baseUrl: string, username: string): Promise<AuthResponse> {
  const res = await fetch(`${baseUrl}/auth/register`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ username, password: 'a-fine-password-1' }),
  });
  assert.equal(res.status, 201, 'register should return 201');
  return res.json() as Promise<AuthResponse>;
}

function leaderFor(room: Room): LeaderState | undefined {
  const key = `${room.sessionId}:warden`;
  return room.state.units.get(key) as LeaderState | undefined;
}

async function main(): Promise<void> {
  const server = await startTestServer();
  let firstRoom: Room | undefined;
  let secondRoom: Room | undefined;
  try {
    const auth = await registerAccount(server.baseUrl, `persist_${Date.now()}`);
    const gameData = loadGameData();
    const map = gameData.maps.find((candidate) => candidate.id === 'hearthvale_town');
    assert.ok(map, 'the persistence test map should exist');

    // Seed through the same SaveGame shape and repository production code use.
    const seedSim = new WorldSimulation(gameData, map, map.playerSpawn);
    for (const member of seedSim.party) member.level = 6;
    seedSim.inventory.splice(0, seedSim.inventory.length, { itemId: 'healing_brew', count: 17 });
    const seededSave = createSaveGame({
      mapId: map.id,
      party: seedSim.party,
      inventory: seedSim.inventory,
      quests: seedSim.quests,
      equipment: seedSim.equipment,
      sockets: seedSim.sockets,
      discoveredMapIds: seedSim.discoveredMapIds,
      resourceCooldowns: seedSim.resourceCooldowns,
      gold: seedSim.gold,
    });
    saveCharacter(server.db, { accountId: auth.accountId, name: 'Persistence Ranger', save: seededSave });

    const client = new Client(server.wsUrl);
    firstRoom = await client.joinOrCreate('world_room', { mapId: map.id, token: auth.token });
    await waitFor(() => leaderFor(firstRoom!)?.level === 6);
    assert.equal(leaderFor(firstRoom)?.level, 6, 'the seeded level should load into the room');

    const initialLeader = leaderFor(firstRoom);
    assert.ok(initialLeader, 'the first session leader should be projected');
    const startX = initialLeader.x;

    firstRoom.send('input', { ...NO_INPUT, x: 1 });
    await waitFor(() => {
      const leader = leaderFor(firstRoom!);
      return Boolean(leader && leader.x > startX);
    });
    firstRoom.send('input', NO_INPUT);
    // Give the server a few ticks to consume the stop input before sampling the persisted position.
    await new Promise((resolve) => setTimeout(resolve, 150));
    const movedLeader = leaderFor(firstRoom);
    assert.ok(movedLeader, 'the moved session leader should remain projected');
    const movedPosition = { x: movedLeader.x, y: movedLeader.y };

    await firstRoom.leave();
    firstRoom = undefined;
    await waitFor(() => {
      const saved = loadCharacter(server.db, auth.accountId);
      const leader = saved?.save.party[0];
      const healingBrew = saved?.save.inventory.find((stack) => stack.itemId === 'healing_brew');
      return leader?.level === 6
        && leader.x === movedPosition.x
        && leader.y === movedPosition.y
        && healingBrew?.count === 17;
    });

    secondRoom = await client.joinOrCreate('world_room', { mapId: map.id, token: auth.token });
    await waitFor(() => {
      const leader = leaderFor(secondRoom!);
      return Boolean(leader
        && leader.level === 6
        && leader.x === movedPosition.x
        && leader.y === movedPosition.y);
    });

    const persisted = loadCharacter(server.db, auth.accountId);
    assert.equal(persisted?.save.inventory.find((stack) => stack.itemId === 'healing_brew')?.count, 17,
      'the seeded inventory should survive the reconnect save/load cycle');

    console.log('character-persistence-smoke: OK — level, moved leader position, and inventory survive disconnect + rejoin');
  } finally {
    await firstRoom?.leave();
    await secondRoom?.leave();
    await server.close();
  }
}

await main();
