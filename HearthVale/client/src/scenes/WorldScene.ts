import Phaser from 'phaser';
import { hudOverlay } from '../hud/HudOverlay.js';
import type { MapDefinition, MapPortal, Vec2 } from '../types/world.js';
import { getMapById } from '../services/worldData.js';
import {
  BIOME_COLORS,
  DEFAULT_MAP_COLOR,
  KIND_ACCENT,
  PLAYER_SPEED,
  PORTAL_TRIGGER_RADIUS,
  TILE_SIZE,
  WORLD_DEPTH,
} from '../constants.js';
import { audioService } from '../services/AudioService.js';
import { DevOverlay } from '../services/DevOverlay.js';
import { clampToBounds, getMapBounds, type MapBounds } from '../utils/mapBounds.js';

export interface WorldSceneData {
  mapId: string;
  spawn: Vec2;
}

export class WorldScene extends Phaser.Scene {
  private mapId = '';
  private mapDef!: MapDefinition;
  private bounds!: MapBounds;
  private player!: Phaser.GameObjects.Container;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: {
    W: Phaser.Input.Keyboard.Key;
    A: Phaser.Input.Keyboard.Key;
    S: Phaser.Input.Keyboard.Key;
    D: Phaser.Input.Keyboard.Key;
  };
  private portalCooldown = 0;
  private worldLayer!: Phaser.GameObjects.Container;
  private nearestPortal: MapPortal | null = null;
  private inSafeZone = false;
  private devOverlay!: DevOverlay;

  constructor() {
    super({ key: 'WorldScene' });
  }

  init(data: WorldSceneData): void {
    this.mapId = data.mapId;
    this.portalCooldown = 500;
  }

  create(data: WorldSceneData): void {
    const mapDef = getMapById(this.mapId);
    if (!mapDef) {
      this.showFatalError(`Map not found: ${this.mapId}`);
      return;
    }

    this.mapDef = mapDef;
    this.bounds = getMapBounds(mapDef);
    this.worldLayer = this.add.container(0, 0);

    this.drawMapBackground(mapDef);
    this.drawSafeZone(mapDef);
    this.drawSpawnAreas(mapDef);
    this.drawPortals(mapDef);
    this.drawNpcs(mapDef);
    this.drawMonsters(mapDef);

    this.player = this.createPlayer(data.spawn);
    this.worldLayer.add(this.player);

    this.cameras.main.setBackgroundColor('#121018');
    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);
    this.cameras.main.setZoom(1);

    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasd = {
      W: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      A: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      S: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      D: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };

    this.devOverlay = new DevOverlay(this);
    this.devOverlay.mount(mapDef);
    audioService.playMapMusic(mapDef.musicKey);
    this.syncHud(data.spawn);
  }

  update(_time: number, delta: number): void {
    if (!this.player || this.portalCooldown > 0) {
      this.portalCooldown = Math.max(0, this.portalCooldown - delta);
    }

    this.handleMovement(delta);
    this.checkPortals();
    this.syncHud({ x: this.player.x, y: this.player.y });
    this.devOverlay.update(this.mapDef, { x: this.player.x, y: this.player.y });
  }

  private handleMovement(delta: number): void {
    let vx = 0;
    let vy = 0;

    if (this.cursors.left.isDown || this.wasd.A.isDown) vx -= 1;
    if (this.cursors.right.isDown || this.wasd.D.isDown) vx += 1;
    if (this.cursors.up.isDown || this.wasd.W.isDown) vy -= 1;
    if (this.cursors.down.isDown || this.wasd.S.isDown) vy += 1;

    if (vx === 0 && vy === 0) return;

    const len = Math.hypot(vx, vy);
    vx /= len;
    vy /= len;

    const step = (PLAYER_SPEED * delta) / 1000;
    const next = clampToBounds(this.player.x + vx * step, this.player.y + vy * step, this.bounds);
    this.player.setPosition(next.x, next.y);
  }

  private checkPortals(): void {
    this.nearestPortal = null;
    let nearestDist = PORTAL_TRIGGER_RADIUS;

    for (const portal of this.mapDef.portals) {
      const dist = Phaser.Math.Distance.Between(
        this.player.x,
        this.player.y,
        portal.position.x,
        portal.position.y,
      );
      if (dist <= nearestDist) {
        nearestDist = dist;
        this.nearestPortal = portal;
      }
    }

    if (this.nearestPortal && this.portalCooldown <= 0) {
      this.transitionToPortal(this.nearestPortal);
    }
  }

  private transitionToPortal(portal: MapPortal): void {
    const target = getMapById(portal.targetMapId);
    if (!target) {
      console.warn(`Portal target missing: ${portal.targetMapId}`);
      return;
    }

    this.portalCooldown = 800;
    audioService.playSfx('sfx_portal');
    this.scene.restart({
      mapId: portal.targetMapId,
      spawn: { ...portal.targetSpawn },
    });
  }

  private drawMapBackground(map: MapDefinition): void {
    const color = BIOME_COLORS[map.biome] ?? DEFAULT_MAP_COLOR;
    const accent = KIND_ACCENT[map.kind] ?? 0x888888;
    const w = map.gridSize.width * TILE_SIZE;
    const h = map.gridSize.height * TILE_SIZE;

    const ground = this.add.rectangle(0, 0, w, h, color, 0.95);
    ground.setStrokeStyle(3, accent, 0.8);
    this.worldLayer.add(ground);

    const grid = this.add.graphics();
    grid.lineStyle(1, 0x000000, 0.08);
    const halfW = w / 2;
    const halfH = h / 2;
    for (let x = -halfW; x <= halfW; x += TILE_SIZE) {
      grid.lineBetween(x, -halfH, x, halfH);
    }
    for (let y = -halfH; y <= halfH; y += TILE_SIZE) {
      grid.lineBetween(-halfW, y, halfW, y);
    }
    this.worldLayer.add(grid);

    const title = this.add
      .text(0, -halfH + 24, map.displayName, {
        fontFamily: 'Georgia, serif',
        fontSize: '18px',
        color: '#f0e6d2',
        stroke: '#1a1520',
        strokeThickness: 4,
      })
      .setOrigin(0.5, 0)
      .setAlpha(0.35);
    this.worldLayer.add(title);
  }

  private drawSafeZone(map: MapDefinition): void {
    if (!map.safeZone) return;

    const zone = map.safeZone;
    const rect = this.add.rectangle(
      zone.x + zone.width / 2,
      zone.y + zone.height / 2,
      zone.width,
      zone.height,
      0x88cc88,
      0.12,
    );
    rect.setStrokeStyle(2, 0xaaddaa, 0.35);
    rect.setDepth(WORLD_DEPTH.safeZone);
    this.worldLayer.add(rect);

    const label = this.add
      .text(zone.x + zone.width / 2, zone.y + 16, 'Safe Zone', {
        fontFamily: 'sans-serif',
        fontSize: '11px',
        color: '#cceecc',
      })
      .setOrigin(0.5, 0)
      .setAlpha(0.7);
    label.setDepth(WORLD_DEPTH.labels);
    this.worldLayer.add(label);
  }

  private drawSpawnAreas(map: MapDefinition): void {
    if (map.kind === 'town') return;

    for (const table of map.spawnTables) {
      const b = table.bounds;
      const area = this.add.rectangle(
        b.x + b.width / 2,
        b.y + b.height / 2,
        b.width,
        b.height,
        0xffcc66,
        0.06,
      );
      area.setStrokeStyle(1, 0xffdd88, 0.2);
      area.setDepth(WORLD_DEPTH.spawnBounds);
      this.worldLayer.add(area);
    }
  }

  private drawPortals(map: MapDefinition): void {
    for (const portal of map.portals) {
      const ring = this.add.circle(portal.position.x, portal.position.y, 22, 0x66aaff, 0.35);
      ring.setStrokeStyle(2, 0xaaccff, 0.9);
      ring.setDepth(WORLD_DEPTH.portal);
      this.worldLayer.add(ring);

      const label = this.add
        .text(portal.position.x, portal.position.y - 32, portal.label, {
          fontFamily: 'sans-serif',
          fontSize: '11px',
          color: '#cce0ff',
          stroke: '#1a1520',
          strokeThickness: 3,
          align: 'center',
        })
        .setOrigin(0.5, 1);
      label.setDepth(WORLD_DEPTH.labels);
      this.worldLayer.add(label);
    }
  }

  private drawNpcs(map: MapDefinition): void {
    for (const npc of map.npcs) {
      const body = this.add.rectangle(npc.position.x, npc.position.y, 20, 28, 0xc9a86c, 1);
      body.setStrokeStyle(2, 0xf0e0b0);
      body.setDepth(WORLD_DEPTH.npc);
      this.worldLayer.add(body);

      const name = this.add
        .text(npc.position.x, npc.position.y - 22, npc.npcId.replace(/_/g, ' '), {
          fontFamily: 'sans-serif',
          fontSize: '10px',
          color: '#ffe8b0',
          stroke: '#1a1520',
          strokeThickness: 2,
        })
        .setOrigin(0.5, 1);
      name.setDepth(WORLD_DEPTH.labels);
      this.worldLayer.add(name);
    }
  }

  private drawMonsters(map: MapDefinition): void {
    if (map.kind === 'town') return;

    let index = 0;
    for (const table of map.spawnTables) {
      for (const entry of table.entries) {
        const count = Math.min(3, Math.ceil(entry.weight / 25));
        for (let i = 0; i < count; i++) {
          const offsetX = ((index * 47) % table.bounds.width) - table.bounds.width / 2;
          const offsetY = ((index * 31) % table.bounds.height) - table.bounds.height / 2;
          const x = table.bounds.x + table.bounds.width / 2 + offsetX * 0.6;
          const y = table.bounds.y + table.bounds.height / 2 + offsetY * 0.6;

          const mob = this.add.circle(x, y, 10, 0xcc6644, 0.9);
          mob.setStrokeStyle(2, 0xff8866);
          mob.setDepth(WORLD_DEPTH.monster);
          this.worldLayer.add(mob);

          const tag = this.add
            .text(x, y - 16, entry.monsterId, {
              fontFamily: 'sans-serif',
              fontSize: '9px',
              color: '#ffbbaa',
              stroke: '#1a1520',
              strokeThickness: 2,
            })
            .setOrigin(0.5, 1);
          tag.setDepth(WORLD_DEPTH.labels);
          this.worldLayer.add(tag);

          index += 1;
        }
      }
    }
  }

  private createPlayer(spawn: Vec2): Phaser.GameObjects.Container {
    const clamped = clampToBounds(spawn.x, spawn.y, this.bounds);
    const container = this.add.container(clamped.x, clamped.y);
    container.setDepth(WORLD_DEPTH.player);

    const shadow = this.add.ellipse(0, 14, 22, 10, 0x000000, 0.25);
    const body = this.add.rectangle(0, 0, 18, 26, 0x5a8fd4, 1);
    body.setStrokeStyle(2, 0xb8dcff);
    const face = this.add.circle(0, -6, 4, 0xf5d6a8, 1);

    container.add([shadow, body, face]);
    return container;
  }

  private syncHud(position: Vec2): void {
    this.inSafeZone = this.isInSafeZone(position);
    hudOverlay.sync({
      map: this.mapDef,
      position,
      nearestPortal: this.nearestPortal,
      inSafeZone: this.inSafeZone,
    });
  }

  private isInSafeZone(position: Vec2): boolean {
    const zone = this.mapDef.safeZone;
    if (!zone) return false;
    return (
      position.x >= zone.x &&
      position.x <= zone.x + zone.width &&
      position.y >= zone.y &&
      position.y <= zone.y + zone.height
    );
  }

  private showFatalError(message: string): void {
    this.add
      .text(this.scale.width / 2, this.scale.height / 2, message, {
        fontFamily: 'monospace',
        fontSize: '16px',
        color: '#ff8888',
      })
      .setOrigin(0.5)
      .setScrollFactor(0);
  }
}
