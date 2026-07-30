import path from 'node:path';
import { fileURLToPath } from 'node:url';

import DatabaseConstructor, { type Database } from 'better-sqlite3';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_DB_PATH = path.join(__dirname, '..', '..', 'hearthvale.db');

export function openDatabase(dbPath: string = process.env.HEARTHVALE_DB_PATH ?? DEFAULT_DB_PATH): Database {
  const db = new DatabaseConstructor(dbPath);
  db.pragma('journal_mode = WAL');
  db.exec(`
    CREATE TABLE IF NOT EXISTS accounts (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      account_id TEXT NOT NULL REFERENCES accounts(id),
      created_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS characters (
      id TEXT PRIMARY KEY,
      account_id TEXT NOT NULL REFERENCES accounts(id),
      name TEXT NOT NULL,
      save_json TEXT NOT NULL,
      saved_at INTEGER NOT NULL
    );
  `);
  return db;
}
