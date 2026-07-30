import { randomBytes } from 'node:crypto';

import { Client, Room } from '@colyseus/core';
import type { Database } from 'better-sqlite3';
import { createSaveGame, NO_INPUT, WorldSimulation } from '@hearthvale/sim';
import type { GameData, InputActions, MapDefinition, SimEvent, Vec2 } from '@hearthvale/sim';

import { resolveSession, type ResolvedSession } from '../auth/session.js';
import { loadCharacter, saveCharacter } from '../persistence/characterRepository.js';
import { MonsterUnitSchema, UnitSchema, WorldRoomState } from '../schema/WorldState.js';

export interface WorldRoomOptions {
  gameData: GameData;
  db: Database;
  /** Required at room-creation time; only absent from the static `defaultOptions` passed to `.define()`. */
  mapId?: string;
  spawnX?: number;
  spawnY?: number;
}

interface PlayerSession {
  accountId: string;
  username: string;
  sim: WorldSimulation;
  pendingInput: InputActions;
  connected: boolean;
}

const TICK_MS = 50;
const RECONNECT_GRACE_SECONDS = 25;
const AUTOSAVE_MS = 30_000;

function sanitizeInput(message: Partial<InputActions> | undefined): InputActions {
  return {
    x: Number(message?.x) || 0,
    y: Number(message?.y) || 0,
    sprint: Boolean(message?.sprint),
    attackPressed: Boolean(message?.attackPressed),
    autoAttack: message?.autoAttack !== false,
    interactPressed: Boolean(message?.interactPressed),
    skillRequests: Array.isArray(message?.skillRequests) ? message.skillRequests : [],
  };
}

export class WorldRoom extends Room<WorldRoomState> {
  private gameData!: GameData;
  private db!: Database;
  private map!: MapDefinition;
  private sessions = new Map<string, PlayerSession>();
  private rngSalt = '';

  onCreate(options: WorldRoomOptions): void {
    this.gameData = options.gameData;
    this.db = options.db;
    const map = this.gameData.maps.find((candidate) => candidate.id === options.mapId);
    if (!map) throw new Error(`WorldRoom: unknown mapId "${options.mapId}"`);
    this.map = map;
    this.rngSalt = randomBytes(32).toString('hex');

    this.setState(new WorldRoomState());
    this.state.mapId = map.id;

    this.onMessage('input', (client, message: Partial<InputActions>) => {
      const session = this.sessions.get(client.sessionId);
      if (session) session.pendingInput = sanitizeInput(message);
    });

    this.onMessage('request-travel', (client, message: { portalId?: string }) => {
      this.handleTravelRequest(client, message?.portalId);
    });

    this.setSimulationInterval((deltaMs) => this.tick(deltaMs), TICK_MS);
    this.clock.setInterval(() => this.autosave(), AUTOSAVE_MS);
  }

  async onAuth(_client: Client, options: { token?: string }): Promise<ResolvedSession> {
    if (!options?.token) throw new Error('missing_token');
    const session = resolveSession(this.db, options.token);
    if (!session) throw new Error('invalid_token');
    return session;
  }

  onJoin(client: Client, options: { spawnX?: number; spawnY?: number }, auth: ResolvedSession): void {
    const reconnecting = this.sessions.get(client.sessionId);
    if (reconnecting) {
      reconnecting.connected = true;
      reconnecting.pendingInput = NO_INPUT;
      this.projectSession(client.sessionId);
      return;
    }

    const character = loadCharacter(this.db, auth.accountId);
    const spawn: Vec2 = Number.isFinite(options?.spawnX) && Number.isFinite(options?.spawnY)
      ? { x: options.spawnX as number, y: options.spawnY as number }
      : this.map.playerSpawn;
    const saved = character?.save;
    const restoreSavedPosition = saved?.mapId === this.map.id;
    const sim = new WorldSimulation(
      this.gameData,
      this.map,
      spawn,
      saved?.party,
      saved?.inventory,
      saved?.quests,
      saved?.gold,
      saved?.equipment,
      saved?.discoveredMapIds,
      saved?.resourceCooldowns,
      saved?.sockets,
      { rngSalt: this.rngSalt, restoreSavedPosition },
    );
    this.sessions.set(client.sessionId, {
      accountId: auth.accountId,
      username: auth.username,
      sim,
      pendingInput: NO_INPUT,
      connected: true,
    });
    this.projectSession(client.sessionId);
  }

  async onLeave(client: Client, consented: boolean): Promise<void> {
    this.saveSession(client.sessionId);
    this.removeSessionUnits(client.sessionId);
    if (consented) {
      this.sessions.delete(client.sessionId);
      return;
    }
    const session = this.sessions.get(client.sessionId);
    if (session) session.connected = false;
    try {
      const reconnected = await this.allowReconnection(client, RECONNECT_GRACE_SECONDS);
      const retained = this.sessions.get(reconnected.sessionId);
      if (retained) {
        retained.connected = true;
        retained.pendingInput = NO_INPUT;
        this.projectSession(reconnected.sessionId);
      }
    } catch {
      this.sessions.delete(client.sessionId);
    }
  }

  private handleTravelRequest(client: Client, portalId?: string): void {
    const session = this.sessions.get(client.sessionId);
    if (!session || !portalId) return;
    const portal = this.map.portals.find((candidate) => candidate.id === portalId);
    if (!portal) {
      client.send('travel-denied', { reason: 'unknown_portal' });
      return;
    }
    const level = session.sim.player.level;
    if (portal.requiredLevel && level < portal.requiredLevel) {
      client.send('travel-denied', { reason: 'level' });
      return;
    }
    if (portal.requiredQuestId
      && !session.sim.quests.some((quest) => quest.questId === portal.requiredQuestId && quest.status === 'completed')) {
      client.send('travel-denied', { reason: 'quest' });
      return;
    }
    if (portal.requiredQuestStartedId
      && !session.sim.quests.some((quest) => quest.questId === portal.requiredQuestStartedId)) {
      client.send('travel-denied', { reason: 'quest' });
      return;
    }
    client.send('travel-authorized', {
      targetMapId: portal.targetMapId,
      targetSpawn: portal.targetSpawn,
    });
  }

  private tick(deltaMs: number): void {
    const dt = deltaMs / 1000;
    for (const [sessionId, session] of this.sessions) {
      if (!session.connected) continue;
      const events = session.sim.update(session.pendingInput, dt);
      this.projectSession(sessionId);
      if (events.length > 0) this.broadcastEvents(sessionId, events);
    }
  }

  private projectSession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    for (const member of session.sim.party) {
      const key = `${sessionId}:${member.id}`;
      let unit = this.state.units.get(key);
      if (!unit) {
        unit = new UnitSchema();
        unit.unitId = member.id;
        unit.ownerId = sessionId;
        unit.ownerName = session.username;
        unit.isLeader = member.id === session.sim.player.id;
        this.state.units.set(key, unit);
      }
      unit.name = member.name;
      unit.className = member.className;
      unit.role = member.role;
      unit.level = member.level;
      unit.hp = member.hp;
      unit.maxHp = member.maxHp;
      unit.mp = member.mp;
      unit.maxMp = member.maxMp;
      unit.x = member.x;
      unit.y = member.y;
      unit.facingX = member.facing.x;
      unit.facingY = member.facing.y;
    }

    for (const monster of session.sim.monsters) {
      const key = `${sessionId}:${monster.uid}`;
      let unit = this.state.monsters.get(key);
      if (!unit) {
        unit = new MonsterUnitSchema();
        unit.monsterUid = monster.uid;
        unit.ownerId = sessionId;
        unit.definitionId = monster.definition.id;
        unit.displayName = monster.definition.displayName;
        this.state.monsters.set(key, unit);
      }
      unit.hp = monster.hp;
      unit.maxHp = monster.maxHp;
      unit.x = monster.x;
      unit.y = monster.y;
      unit.alive = monster.alive;
    }
  }

  private removeSessionUnits(sessionId: string): void {
    const prefix = `${sessionId}:`;
    for (const key of [...this.state.units.keys()]) {
      if (key.startsWith(prefix)) this.state.units.delete(key);
    }
    for (const key of [...this.state.monsters.keys()]) {
      if (key.startsWith(prefix)) this.state.monsters.delete(key);
    }
  }

  private autosave(): void {
    for (const [sessionId, session] of this.sessions) {
      if (session.connected) this.saveSession(sessionId);
    }
  }

  private saveSession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;
    const save = createSaveGame({
      mapId: this.map.id,
      party: session.sim.party,
      inventory: session.sim.inventory,
      quests: session.sim.quests,
      equipment: session.sim.equipment,
      sockets: session.sim.sockets,
      discoveredMapIds: session.sim.discoveredMapIds,
      resourceCooldowns: session.sim.resourceCooldowns,
      gold: session.sim.gold,
    });
    saveCharacter(this.db, { accountId: session.accountId, name: session.username, save });
  }

  private broadcastEvents(sessionId: string, events: SimEvent[]): void {
    this.broadcast('sim-events', { sessionId, events });
  }
}
