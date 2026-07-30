import { randomUUID } from 'node:crypto';

import type { Database } from 'better-sqlite3';
import { normalizeSaveGame, type SaveGame } from '@hearthvale/sim';

interface CharacterRow {
  id: string;
  account_id: string;
  name: string;
  save_json: string;
  saved_at: number;
}

export interface SavedCharacter {
  id: string;
  accountId: string;
  name: string;
  save: SaveGame;
  savedAt: number;
}

export interface SaveCharacterInput {
  accountId: string;
  name: string;
  save: SaveGame;
}

/**
 * Retrieves the most recently saved character for an account. Invalid legacy
 * JSON is treated as no character so a corrupt row never prevents sign-in.
 */
export function loadCharacter(db: Database, accountId: string): SavedCharacter | undefined {
  const row = db.prepare(`
    SELECT id, account_id, name, save_json, saved_at
    FROM characters
    WHERE account_id = ?
    ORDER BY saved_at DESC, rowid DESC
    LIMIT 1
  `).get(accountId) as CharacterRow | undefined;
  if (!row) return undefined;

  try {
    const save = normalizeSaveGame(JSON.parse(row.save_json));
    if (!save) return undefined;
    return {
      id: row.id,
      accountId: row.account_id,
      name: row.name,
      save,
      savedAt: row.saved_at,
    };
  } catch {
    return undefined;
  }
}

/** Saves the account's character using the shared, normalized SaveGame shape. */
export function saveCharacter(db: Database, input: SaveCharacterInput): SavedCharacter {
  const savedAt = Date.now();
  const save = normalizeSaveGame({ ...input.save, savedAt });
  if (!save) throw new Error('Cannot save an invalid character state');

  const existing = db.prepare(`
    SELECT id FROM characters WHERE account_id = ? ORDER BY saved_at DESC, rowid DESC LIMIT 1
  `).get(input.accountId) as Pick<CharacterRow, 'id'> | undefined;
  const id = existing?.id ?? randomUUID();

  if (existing) {
    db.prepare(`
      UPDATE characters
      SET name = ?, save_json = ?, saved_at = ?
      WHERE id = ?
    `).run(input.name, JSON.stringify(save), savedAt, id);
  } else {
    db.prepare(`
      INSERT INTO characters (id, account_id, name, save_json, saved_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, input.accountId, input.name, JSON.stringify(save), savedAt);
  }

  return { id, accountId: input.accountId, name: input.name, save, savedAt };
}
