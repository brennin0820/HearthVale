import { randomBytes, randomUUID, scryptSync, timingSafeEqual } from 'node:crypto';

import type { Database } from 'better-sqlite3';

export interface Account {
  id: string;
  username: string;
}

interface AccountRow {
  id: string;
  username: string;
  password_hash: string;
}

const SCRYPT_KEYLEN = 64;

export class UsernameTakenError extends Error {}
export class InvalidCredentialsError extends Error {}

function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const derived = scryptSync(password, salt, SCRYPT_KEYLEN);
  return `${salt.toString('hex')}:${derived.toString('hex')}`;
}

function verifyPassword(password: string, stored: string): boolean {
  const [saltHex, hashHex] = stored.split(':');
  if (!saltHex || !hashHex) return false;
  const salt = Buffer.from(saltHex, 'hex');
  const expected = Buffer.from(hashHex, 'hex');
  const actual = scryptSync(password, salt, expected.length);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export function registerAccount(db: Database, username: string, password: string): Account {
  const existing = db.prepare('SELECT id FROM accounts WHERE username = ?').get(username);
  if (existing) throw new UsernameTakenError(`Username "${username}" is already taken`);
  const id = randomUUID();
  db.prepare('INSERT INTO accounts (id, username, password_hash, created_at) VALUES (?, ?, ?, ?)')
    .run(id, username, hashPassword(password), Date.now());
  return { id, username };
}

export function authenticateAccount(db: Database, username: string, password: string): Account {
  const row = db.prepare('SELECT id, username, password_hash FROM accounts WHERE username = ?')
    .get(username) as AccountRow | undefined;
  if (!row || !verifyPassword(password, row.password_hash)) {
    throw new InvalidCredentialsError('Invalid username or password');
  }
  return { id: row.id, username: row.username };
}
