import { createServer as createHttpServer, type Server as HttpServer } from 'node:http';

import cors from 'cors';
import express from 'express';
import { Server } from '@colyseus/core';
import { WebSocketTransport } from '@colyseus/ws-transport';
import type { Database } from 'better-sqlite3';

import { registerAuthRoutes } from './auth/routes.js';
import { loadGameData } from './data/loadGameData.js';
import { openDatabase } from './persistence/db.js';
import { WorldRoom, type WorldRoomOptions } from './rooms/WorldRoom.js';

export interface HearthValeServer {
  httpServer: HttpServer;
  gameServer: Server;
  db: Database;
}

/** Boots the Colyseus + Express process. `dbPath` overrides the default file (e.g. ':memory:' for tests). */
export function createHearthValeServer(dbPath?: string): HearthValeServer {
  const db = openDatabase(dbPath);
  const gameData = loadGameData();

  const app = express();
  app.use(cors());
  app.use(express.json());
  registerAuthRoutes(app, db);

  const httpServer = createHttpServer(app);
  const gameServer = new Server({
    transport: new WebSocketTransport({ server: httpServer }),
  });

  gameServer.define('world_room', WorldRoom, { gameData, db }).filterBy(['mapId']);

  return { httpServer, gameServer, db };
}
