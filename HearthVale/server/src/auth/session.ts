import { randomUUID } from 'node:crypto';

import type { Database } from 'better-sqlite3';

export interface ResolvedSession {
  accountId: string;
  username: string;
}

interface SessionRow {
  accountId: string;
  username: string;
}

export function createSession(db: Database, accountId: string): string {
  const token = randomUUID();
  db.prepare('INSERT INTO sessions (token, account_id, created_at) VALUES (?, ?, ?)').run(token, accountId, Date.now());
  return token;
}

export function resolveSession(db: Database, token: string): ResolvedSession | undefined {
  return db.prepare(`
    SELECT accounts.id AS accountId, accounts.username AS username
    FROM sessions
    JOIN accounts ON accounts.id = sessions.account_id
    WHERE sessions.token = ?
  `).get(token) as SessionRow | undefined;
}
