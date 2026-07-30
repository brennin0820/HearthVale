import type { Express } from 'express';
import type { Database } from 'better-sqlite3';
import { z } from 'zod';

import { authenticateAccount, InvalidCredentialsError, registerAccount, UsernameTakenError } from './accounts.js';
import { loadCharacter } from '../persistence/characterRepository.js';
import { createSession } from './session.js';

const credentialsSchema = z.object({
  username: z.string().trim().min(3).max(24),
  password: z.string().min(6).max(128),
});

export function registerAuthRoutes(app: Express, db: Database): void {
  app.post('/auth/register', (req, res) => {
    const parsed = credentialsSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'invalid_credentials' });
      return;
    }
    try {
      const account = registerAccount(db, parsed.data.username, parsed.data.password);
      const token = createSession(db, account.id);
      res.status(201).json({ accountId: account.id, username: account.username, token, mapId: loadCharacter(db, account.id)?.save.mapId });
    } catch (err) {
      if (err instanceof UsernameTakenError) {
        res.status(409).json({ error: 'username_taken' });
        return;
      }
      throw err;
    }
  });

  app.post('/auth/login', (req, res) => {
    const parsed = credentialsSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'invalid_credentials' });
      return;
    }
    try {
      const account = authenticateAccount(db, parsed.data.username, parsed.data.password);
      const token = createSession(db, account.id);
      res.status(200).json({ accountId: account.id, username: account.username, token, mapId: loadCharacter(db, account.id)?.save.mapId });
    } catch (err) {
      if (err instanceof InvalidCredentialsError) {
        res.status(401).json({ error: 'invalid_credentials' });
        return;
      }
      throw err;
    }
  });
}
