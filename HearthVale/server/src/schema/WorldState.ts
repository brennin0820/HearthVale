import { MapSchema, Schema, type } from '@colyseus/schema';

/**
 * One visible body in the room: either a real player's leader unit or one of
 * their three AI companions. `ownerId` groups a squad together on the client;
 * `isLeader` distinguishes the unit that follows a specific player's input.
 */
export class UnitSchema extends Schema {
  @type('string') unitId = '';
  @type('string') ownerId = '';
  @type('string') ownerName = '';
  @type('string') name = '';
  @type('string') className = '';
  @type('string') role = '';
  @type('boolean') isLeader = false;
  @type('number') level = 1;
  @type('number') hp = 0;
  @type('number') maxHp = 0;
  @type('number') mp = 0;
  @type('number') maxMp = 0;
  @type('number') x = 0;
  @type('number') y = 0;
  @type('number') facingX = 1;
  @type('number') facingY = 0;
}

/** One monster body. Monsters are instanced per player squad (see WorldRoom) — `ownerId` scopes it. */
export class MonsterUnitSchema extends Schema {
  @type('string') monsterUid = '';
  @type('string') ownerId = '';
  @type('string') definitionId = '';
  @type('string') displayName = '';
  @type('number') hp = 0;
  @type('number') maxHp = 0;
  @type('number') x = 0;
  @type('number') y = 0;
  @type('boolean') alive = true;
}

export class WorldRoomState extends Schema {
  @type('string') mapId = '';
  @type({ map: UnitSchema }) units = new MapSchema<UnitSchema>();
  @type({ map: MonsterUnitSchema }) monsters = new MapSchema<MonsterUnitSchema>();
}
