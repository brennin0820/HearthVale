import Phaser from 'phaser';
import { Client, Room } from 'colyseus.js';
import type { GameData, MapDefinition } from '../../game/data/types.js';
import type { InputActions } from '../../game/input/actions.js';

export interface MultiplayerStart {
  serverUrl: string;
  token: string;
  username: string;
  mapId: string;
  spawnX?: number;
  spawnY?: number;
}

interface UnitView {
  root: Phaser.GameObjects.Container;
  body: Phaser.GameObjects.Arc;
  hpBar: Phaser.GameObjects.Graphics;
  label: Phaser.GameObjects.Text;
}

const ROLE_COLOR: Record<string, number> = {
  melee: 0x4f8e84, ranged: 0x77a95c, magic: 0x9d75bd, support: 0xd7ad59,
  novice: 0x8a8a8a, artisan: 0xb08a4f, scout: 0x6f8fb0,
};
const MONSTER_COLOR = 0xb0463f;
const PORTAL_TRIGGER_RANGE = 48;
const PORTAL_COOLDOWN_SECONDS = 2;

/**
 * Networked counterpart to WorldScene: renders whatever the authoritative
 * WorldRoom broadcasts instead of driving a local WorldSimulation. Movement
 * has no client-side prediction yet (see MP-1 plan) — everyone's position,
 * including your own, comes straight from the server, which is fine for a
 * same-machine/local-dev server but will read as laggy over a real network.
 */
export class MultiplayerWorldScene extends Phaser.Scene {
  private client?: Client;
  private room?: Room;
  private gameData!: GameData;
  private map!: MapDefinition;
  private start!: MultiplayerStart;
  private unitViews = new Map<string, UnitView>();
  private monsterViews = new Map<string, UnitView>();
  private keys!: Record<'up' | 'down' | 'left' | 'right' | 'w' | 'a' | 's' | 'd' | 'shift' | 'attack' | 'escape', Phaser.Input.Keyboard.Key>;
  private statusText!: Phaser.GameObjects.Text;
  private portalCooldown = 0;
  private myPosition?: { x: number; y: number };
  private leaving = false;

  constructor() { super('MultiplayerWorld'); }

  create(start: MultiplayerStart): void {
    this.start = start;
    this.gameData = this.registry.get('gameData') as GameData;
    this.map = this.gameData.maps.find((candidate) => candidate.id === start.mapId) ?? this.gameData.maps[0];
    this.cameras.main.setBackgroundColor(this.map.kind === 'dungeon' ? '#11181c' : '#172d27');
    this.unitViews.clear();
    this.monsterViews.clear();
    this.leaving = false;
    this.myPosition = undefined;

    this.statusText = this.add.text(12, 12, `Connecting to ${start.serverUrl}...`, {
      fontFamily: 'Arial, sans-serif', fontSize: '13px', color: '#e8c46d',
    }).setScrollFactor(0).setDepth(10000);
    this.add.text(12, 32, 'ESC to disconnect', {
      fontFamily: 'Arial, sans-serif', fontSize: '11px', color: '#86a696',
    }).setScrollFactor(0).setDepth(10000);

    this.bindInput();
    void this.connect();

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.teardown());
  }

  private bindInput(): void {
    const keyboard = this.input.keyboard!;
    this.keys = {
      up: keyboard.addKey('UP'), down: keyboard.addKey('DOWN'), left: keyboard.addKey('LEFT'), right: keyboard.addKey('RIGHT'),
      w: keyboard.addKey('W'), a: keyboard.addKey('A'), s: keyboard.addKey('S'), d: keyboard.addKey('D'),
      shift: keyboard.addKey('SHIFT'), attack: keyboard.addKey('SPACE'), escape: keyboard.addKey('ESC'),
    };
  }

  private async connect(): Promise<void> {
    try {
      this.client = new Client(this.start.serverUrl);
      this.room = await this.client.joinOrCreate('world_room', {
        mapId: this.start.mapId,
        token: this.start.token,
        spawnX: this.start.spawnX,
        spawnY: this.start.spawnY,
      });
      this.statusText.setText(`${this.start.username} — ${this.map.displayName}`);
      this.room.onMessage('travel-authorized', (message: { targetMapId: string; targetSpawn: { x: number; y: number } }) => {
        this.travelTo(message.targetMapId, message.targetSpawn);
      });
      this.room.onMessage('travel-denied', (message: { reason: string }) => {
        this.statusText.setText(`Can't travel there yet (${message.reason})`);
      });
      this.room.onLeave(() => {
        if (!this.leaving) this.statusText.setText('Disconnected from server');
      });
    } catch (err) {
      this.statusText.setText(`Failed to connect: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  private travelTo(targetMapId: string, targetSpawn: { x: number; y: number }): void {
    if (this.leaving) return;
    this.leaving = true;
    this.cameras.main.fadeOut(280, 10, 23, 19);
    this.time.delayedCall(300, () => {
      void this.completeTravel(targetMapId, targetSpawn);
    });
  }

  /**
   * Await consented leave so WorldRoom.onLeave can persist before the next
   * joinOrCreate loads the character. Fire-and-forget leave raced the new
   * room's load and let a later autosave overwrite fresher progress.
   */
  private async completeTravel(targetMapId: string, targetSpawn: { x: number; y: number }): Promise<void> {
    await this.leaveRoom();
    if (!this.sys.isActive()) return;
    this.scene.start('MultiplayerWorld', {
      ...this.start,
      mapId: targetMapId,
      spawnX: targetSpawn.x,
      spawnY: targetSpawn.y,
    } satisfies MultiplayerStart);
  }

  private leaveToTitle(): void {
    if (this.leaving) return;
    this.leaving = true;
    void this.leaveRoom().then(() => {
      if (!this.sys.isActive()) return;
      this.scene.start('Title');
    });
  }

  private async leaveRoom(): Promise<void> {
    const room = this.room;
    this.room = undefined;
    if (!room) return;
    try {
      await room.leave(true);
    } catch {
      // Room may already be closed; continue so travel/disconnect isn't stuck.
    }
  }

  private teardown(): void {
    this.room?.removeAllListeners();
    for (const view of this.unitViews.values()) view.root.destroy();
    for (const view of this.monsterViews.values()) view.root.destroy();
    this.unitViews.clear();
    this.monsterViews.clear();
  }

  update(_time: number, deltaMs: number): void {
    if (Phaser.Input.Keyboard.JustDown(this.keys.escape)) { this.leaveToTitle(); return; }
    if (!this.room || this.leaving) return;
    this.room.send('input', this.readInput());
    this.portalCooldown = Math.max(0, this.portalCooldown - deltaMs / 1000);
    this.syncUnits();
    this.syncMonsters();
    this.checkPortals();
  }

  private readInput(): InputActions {
    return {
      x: Number(this.keys.right.isDown || this.keys.d.isDown) - Number(this.keys.left.isDown || this.keys.a.isDown),
      y: Number(this.keys.down.isDown || this.keys.s.isDown) - Number(this.keys.up.isDown || this.keys.w.isDown),
      sprint: this.keys.shift.isDown,
      attackPressed: Phaser.Input.Keyboard.JustDown(this.keys.attack),
      autoAttack: true,
      interactPressed: false,
      skillRequests: [],
    };
  }

  private syncUnits(): void {
    const room = this.room;
    if (!room) return;
    const seen = new Set<string>();
    room.state.units.forEach((unit: any, key: string) => {
      seen.add(key);
      let view = this.unitViews.get(key);
      if (!view) { view = this.createUnitView(unit.isLeader, ROLE_COLOR[unit.role] ?? 0x8a8a8a); this.unitViews.set(key, view); }
      const isMine = unit.ownerId === room.sessionId;
      view.body.setFillStyle(ROLE_COLOR[unit.role] ?? 0x8a8a8a, isMine ? 1 : 0.7);
      view.root.setPosition(unit.x, unit.y);
      view.label.setText(unit.isLeader ? `${unit.ownerName ?? '?'} · ${unit.name}` : unit.name);
      this.drawHpBar(view.hpBar, unit.hp, unit.maxHp);
      if (isMine && unit.isLeader) {
        this.myPosition = { x: unit.x, y: unit.y };
        this.cameras.main.startFollow(view.root, true, 0.15, 0.15);
      }
    });
    for (const [key, view] of [...this.unitViews.entries()]) {
      if (!seen.has(key)) { view.root.destroy(); this.unitViews.delete(key); }
    }
  }

  private syncMonsters(): void {
    const room = this.room;
    if (!room) return;
    const seen = new Set<string>();
    room.state.monsters.forEach((monster: any, key: string) => {
      if (!monster.alive) return;
      seen.add(key);
      let view = this.monsterViews.get(key);
      if (!view) { view = this.createUnitView(false, MONSTER_COLOR); this.monsterViews.set(key, view); }
      view.root.setPosition(monster.x, monster.y);
      view.label.setText(monster.displayName);
      this.drawHpBar(view.hpBar, monster.hp, monster.maxHp);
    });
    for (const [key, view] of [...this.monsterViews.entries()]) {
      if (!seen.has(key)) { view.root.destroy(); this.monsterViews.delete(key); }
    }
  }

  private checkPortals(): void {
    if (!this.myPosition || this.portalCooldown > 0 || !this.room) return;
    const nearby = this.map.portals.find((portal) => Phaser.Math.Distance.Between(
      this.myPosition!.x, this.myPosition!.y, portal.position.x, portal.position.y,
    ) < PORTAL_TRIGGER_RANGE);
    if (!nearby) return;
    this.portalCooldown = PORTAL_COOLDOWN_SECONDS;
    this.room.send('request-travel', { portalId: nearby.id });
  }

  private createUnitView(isLeader: boolean, color: number): UnitView {
    const body = this.add.circle(0, 0, isLeader ? 16 : 12, color);
    const hpBar = this.add.graphics();
    const label = this.add.text(0, isLeader ? -30 : -24, '', {
      fontFamily: 'Arial, sans-serif', fontSize: '10px', color: '#e7ddc7',
    }).setOrigin(0.5);
    const root = this.add.container(0, 0, [body, hpBar, label]);
    return { root, body, hpBar, label };
  }

  private drawHpBar(graphics: Phaser.GameObjects.Graphics, hp: number, maxHp: number): void {
    const width = 28;
    const ratio = maxHp > 0 ? Phaser.Math.Clamp(hp / maxHp, 0, 1) : 0;
    graphics.clear();
    graphics.fillStyle(0x1a1a1a, 0.8).fillRect(-width / 2, -18, width, 4);
    graphics.fillStyle(ratio > 0.4 ? 0x7bbf6a : 0xc0564a, 1).fillRect(-width / 2, -18, width * ratio, 4);
  }
}
