import { createHearthValeServer } from '../src/createServer.js';
import type { Database } from 'better-sqlite3';

export interface TestServerHandle {
  baseUrl: string;
  wsUrl: string;
  db: Database;
  close: () => Promise<void>;
}

/** Boots a real HearthVale server on an OS-assigned free port with an in-memory DB, for smoke tests. */
export async function startTestServer(): Promise<TestServerHandle> {
  const { httpServer, gameServer, db } = createHearthValeServer(':memory:');
  await gameServer.listen(0);
  const address = httpServer.address();
  const port = typeof address === 'object' && address ? address.port : 0;
  return {
    baseUrl: `http://127.0.0.1:${port}`,
    wsUrl: `ws://127.0.0.1:${port}`,
    db,
    close: () => gameServer.gracefullyShutdown(false),
  };
}

export function waitFor(predicate: () => boolean, timeoutMs = 4000): Promise<void> {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const tick = () => {
      let ok = false;
      try {
        ok = predicate();
      } catch {
        ok = false; // e.g. schema fields not hydrated yet — treat as "not ready", keep polling
      }
      if (ok) { resolve(); return; }
      if (Date.now() - start > timeoutMs) { reject(new Error('waitFor timed out')); return; }
      setTimeout(tick, 50);
    };
    tick();
  });
}
