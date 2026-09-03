import assert from 'node:assert/strict';

import { Client, Room } from 'colyseus.js';
import { createSaveGame, WorldSimulation } from '@hearthvale/sim';

import { loadGameData } from '../src/data/loadGameData.js';
import { loadCharacter, saveCharacter } from '../src/persistence/characterRepository.js';
import { startTestServer, waitFor } from './testHarness.js';

interface AuthResponse {
  accountId: string;
  token: string;
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

/**
 * Regression for MultiplayerWorldScene portal travel: the next room must join
 * only after consented leave finishes so onLeave's saveSession is durable
 * before loadCharacter runs in the destination room.
 */
async function main(): Promise<void> {
  const server = await startTestServer();
  let firstRoom: Room | undefined;
  let secondRoom: Room | undefined;
  try {
    const auth = await registerAccount(server.baseUrl, `travel_${Date.now()}`);
    const gameData = loadGameData();
    const fromMap = gameData.maps.find((candidate) => candidate.id === 'hearthvale_town');
    const toMap = gameData.maps.find((candidate) => candidate.id === 'cloverfield_plains');
    assert.ok(fromMap && toMap, 'portal travel maps should exist');

    const seedSim = new WorldSimulation(gameData, fromMap, fromMap.playerSpawn);
    for (const member of seedSim.party) member.level = 4;
    seedSim.inventory.splice(0, seedSim.inventory.length, { itemId: 'healing_brew', count: 9 });
    seedSim.gold = 42;
    saveCharacter(server.db, {
      accountId: auth.accountId,
      name: 'Travel Ranger',
      save: createSaveGame({
        mapId: fromMap.id,
        party: seedSim.party,
        inventory: seedSim.inventory,
        quests: seedSim.quests,
        equipment: seedSim.equipment,
        sockets: seedSim.sockets,
        discoveredMapIds: seedSim.discoveredMapIds,
        resourceCooldowns: seedSim.resourceCooldowns,
        gold: seedSim.gold,
      }),
    });

    const client = new Client(server.wsUrl);
    firstRoom = await client.joinOrCreate('world_room', { mapId: fromMap.id, token: auth.token });
    await waitFor(() => {
      const leader = firstRoom!.state.units.get(`${firstRoom!.sessionId}:warden`);
      return leader?.level === 4;
    });

    // Client must await leave before joining the destination room.
    await firstRoom.leave(true);
    firstRoom = undefined;

    await waitFor(() => {
      const saved = loadCharacter(server.db, auth.accountId);
      return saved?.save.mapId === fromMap.id
        && saved.save.gold === 42
        && saved.save.inventory.some((stack) => stack.itemId === 'healing_brew' && stack.count === 9);
    });

    const portalSpawn = toMap.playerSpawn;
    secondRoom = await client.joinOrCreate('world_room', {
      mapId: toMap.id,
      token: auth.token,
      spawnX: portalSpawn.x,
      spawnY: portalSpawn.y,
    });
    await waitFor(() => {
      const leader = secondRoom!.state.units.get(`${secondRoom!.sessionId}:warden`);
      return leader?.level === 4;
    });

    await secondRoom.leave(true);
    secondRoom = undefined;

    const afterTravel = loadCharacter(server.db, auth.accountId);
    assert.equal(afterTravel?.save.mapId, toMap.id, 'leave after destination join should persist the new map');
    assert.equal(afterTravel?.save.gold, 42, 'gold must survive portal leave→join ordering');
    assert.equal(
      afterTravel?.save.inventory.find((stack) => stack.itemId === 'healing_brew')?.count,
      9,
      'inventory must survive portal leave→join ordering',
    );

    console.log('portal-travel-persistence-smoke: OK — awaited leave persists gold/inventory across map change');
  } finally {
    await firstRoom?.leave();
    await secondRoom?.leave();
    await server.close();
  }
}

await main();
