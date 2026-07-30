import assert from 'node:assert/strict';

import { startTestServer } from './testHarness.js';

async function main(): Promise<void> {
  const server = await startTestServer();
  try {
    const username = `smoke_${Date.now()}`;
    const password = 'correct horse battery staple';

    const registerRes = await fetch(`${server.baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    assert.equal(registerRes.status, 201, 'register should return 201');
    const registered = await registerRes.json();
    assert.ok(registered.token, 'register should return a session token');

    const duplicateRes = await fetch(`${server.baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    assert.equal(duplicateRes.status, 409, 'duplicate username should be rejected');

    const wrongPasswordRes = await fetch(`${server.baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ username, password: 'a completely wrong password' }),
    });
    assert.equal(wrongPasswordRes.status, 401, 'wrong password should be rejected');

    const loginRes = await fetch(`${server.baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    assert.equal(loginRes.status, 200, 'login should return 200');
    const loggedIn = await loginRes.json();
    assert.ok(loggedIn.token, 'login should return a session token');

    console.log('auth-smoke: OK — register, duplicate-username rejection, bad-password rejection, and login all behave correctly');
  } finally {
    await server.close();
  }
}

await main();
