import assert from 'node:assert/strict';

import { Client, Room } from 'colyseus.js';

import { startTestServer, waitFor } from './testHarness.js';

async function registerAccount(baseUrl: string, username: string): Promise<string> {
  const res = await fetch(`${baseUrl}/auth/register`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ username, password: 'a-fine-password-1' }),
  });
  const body = await res.json();
  return body.token as string;
}

const NO_INPUT = {
  x: 0, y: 0, sprint: false, attackPressed: false, autoAttack: false, interactPressed: false, skillRequests: [],
};

async function main(): Promise<void> {
  const server = await startTestServer();
  let roomA: Room | undefined;
  let roomB: Room | undefined;
  try {
    const tokenA = await registerAccount(server.baseUrl, `alpha_${Date.now()}`);
    const tokenB = await registerAccount(server.baseUrl, `bravo_${Date.now()}`);

    const clientA = new Client(server.wsUrl);
    const clientB = new Client(server.wsUrl);

    const a = await clientA.joinOrCreate('world_room', { mapId: 'hearthvale_town', token: tokenA });
    const b = await clientB.joinOrCreate('world_room', { mapId: 'hearthvale_town', token: tokenB });
    roomA = a;
    roomB = b;

    // Two players, four party members each (leader + 3 AI companions).
    await waitFor(() => b.state.units.size >= 8, 4000);

    let sawALeader = false;
    b.state.units.forEach((unit: { ownerId: string; isLeader: boolean }) => {
      if (unit.ownerId === a.sessionId && unit.isLeader) sawALeader = true;
    });
    assert.ok(sawALeader, 'client B should see client A\'s leader unit in the shared room state');

    const leaderKeyA = `${a.sessionId}:warden`;
    const before = b.state.units.get(leaderKeyA);
    const startX = before?.x;
    const startY = before?.y;

    a.send('input', { ...NO_INPUT, x: 1, y: 0 });
    await waitFor(() => {
      const unit = b.state.units.get(leaderKeyA);
      return Boolean(unit && (unit.x !== startX || unit.y !== startY));
    }, 4000);

    console.log('world-room-smoke: OK — two clients share room state and movement broadcasts from one client to the other');
  } finally {
    await roomA?.leave();
    await roomB?.leave();
    await server.close();
  }
}

await main();
