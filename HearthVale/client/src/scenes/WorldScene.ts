import Phaser from 'phaser';
import { hudOverlay, type HudPlayerSnapshot } from '../hud/HudOverlay.js';
import { audioService } from '../services/AudioService.js';
import { DevOverlay } from '../services/DevOverlay.js';
import { loadCollisionMask, loadPropLayer } from '../services/mapArtData.js';
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
import type { CollisionMaskDefinition, MapPropDefinition } from '../types/mapArt.js';
import type { MapDefinition, MapPortal, Vec2 } from '../types/world.js';
import { clampToBounds, getMapBounds, type MapBounds } from '../utils/mapBounds.js';

export interface WorldSceneData {
  mapId: string;
  spawn: Vec2;
}

const PLAYER_COLLISION_SAMPLES: Vec2[] = [
  { x: 0, y: 0 },
  { x: -8, y: 8 },
  { x: 8, y: 8 },
  { x: 0, y: 12 },
];

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
  private collisionMask: CollisionMaskDefinition | null = null;
  private ready = false;
  private playerState: HudPlayerSnapshot = {
    name: 'Hero',
    level: 7,
    hpCur: 129,
    hpMax: 165,
    mpCur: 48,
    mpMax: 88,
    spCur: 90,
    spMax: 100,
    xpCur: 1240,
    xpNext: 2950,
    stance: 'Steady',
  };

  constructor() {
    super({ key: 'WorldScene' });
  }

  init(data: WorldSceneData): void {
    this.mapId = data.mapId;
    this.portalCooldown = 500;
    this.ready = false;
    this.collisionMask = null;
  }

  async create(data: WorldSceneData): Promise<void> {
    const mapDef = getMapById(this.mapId);
    if (!mapDef) {
      this.showFatalError(`Map not found: ${this.mapId}`);
      return;
    }

    this.mapDef = mapDef;
    this.bounds = getMapBounds(mapDef);
    this.worldLayer = this.add.container(0, 0);
    this.cameras.main.setBackgroundColor('#121018');

    try {
      const [collisionMask, propLayer] = await Promise.all([
        loadCollisionMask(this.mapId),
        loadPropLayer(this.mapId),
      ]);

      this.collisionMask = collisionMask;
      this.drawMapBackground(mapDef);
      this.drawPropLayer(propLayer.props);
      this.drawSafeZone(mapDef);
      this.drawSpawnAreas(mapDef);
      this.drawPortals(mapDef);
      this.drawNpcs(mapDef);
      this.drawMonsters(mapDef);

      this.player = this.createPlayer(data.spawn);
      this.worldLayer.add(this.player);

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
      this.syncHud({ x: this.player.x, y: this.player.y });
      this.ready = true;
    } catch (error) {
      console.error('Failed to load map art', error);
      this.showFatalError(`Failed to load map art for ${this.mapId}`);
    }
  }

  update(_time: number, delta: number): void {
    if (!this.ready || !this.player) {
      return;
    }

    if (this.portalCooldown > 0) {
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
    const step = (PLAYER_SPEED * delta) / 1000;
    const nextX = this.player.x + (vx / len) * step;
    const nextY = this.player.y + (vy / len) * step;

    const attemptX = clampToBounds(nextX, this.player.y, this.bounds);
    if (this.isWalkable(attemptX.x, attemptX.y)) {
      this.player.x = attemptX.x;
    }

    const attemptY = clampToBounds(this.player.x, nextY, this.bounds);
    if (this.isWalkable(attemptY.x, attemptY.y)) {
      this.player.y = attemptY.y;
    }
  }

  private isWalkable(x: number, y: number): boolean {
    if (!this.collisionMask) {
      return true;
    }

    const { tileSize, walkable } = this.collisionMask;
    const halfW = (this.mapDef.gridSize.width * tileSize) / 2;
    const halfH = (this.mapDef.gridSize.height * tileSize) / 2;

    for (const sample of PLAYER_COLLISION_SAMPLES) {
      const col = Math.floor((x + sample.x + halfW) / tileSize);
      const row = Math.floor((y + sample.y + halfH) / tileSize);

      if (row < 0 || row >= walkable.length || col < 0 || col >= walkable[row].length) {
        return false;
      }

      if (!walkable[row][col]) {
        return false;
      }
    }

    return true;
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
    this.ready = false;
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

    const ground = this.add.rectangle(0, 0, w, h, color, 0.96);
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

  private drawPropLayer(props: MapPropDefinition[]): void {
    const ordered = [...props].sort((a, b) => this.getPropOrder(a.kind) - this.getPropOrder(b.kind) || a.y - b.y);
    for (const prop of ordered) {
      this.drawProp(prop);
    }
  }

  private getPropOrder(kind: MapPropDefinition['kind']): number {
    switch (kind) {
      case 'path':
      case 'plaza':
        return 0;
      case 'fence':
      case 'gate':
      case 'planter':
      case 'crate':
      case 'sign':
      case 'lantern':
      case 'training_dummy':
        return 1;
      case 'fountain':
      case 'stall':
      case 'building':
      case 'tree':
        return 2;
      default:
        return 3;
    }
  }

  private drawProp(prop: MapPropDefinition): void {
    const fillColor = prop.fillColor ?? 0x7a7a7a;
    const accentColor = prop.accentColor ?? 0xe6d1a5;
    const alpha = prop.alpha ?? 1;

    switch (prop.kind) {
      case 'path':
      case 'plaza': {
        const tile = this.createShape(prop, fillColor, alpha);
        tile.setStrokeStyle(2, accentColor, 0.3);
        tile.setDepth(WORLD_DEPTH.groundDetail);
        this.worldLayer.add(tile);
        return;
      }
      case 'building': {
        const body = this.add.rectangle(prop.x, prop.y, prop.width, prop.height, fillColor, alpha);
        body.setStrokeStyle(2, accentColor, 0.8);
        this.worldLayer.add(body);

        const roof = this.add.rectangle(
          prop.x,
          prop.y - prop.height / 2 + 12,
          prop.width + 8,
          18,
          accentColor,
          0.95,
        );
        roof.setStrokeStyle(1, 0x3b2a20, 0.8);
        this.worldLayer.add(roof);

        const door = this.add.rectangle(prop.x, prop.y + prop.height / 2 - 12, 18, 24, 0x3f2b22, 1);
        this.worldLayer.add(door);

        if (prop.label) {
          this.addWorldLabel(prop.x, prop.y - prop.height / 2 - 8, prop.label, '#f8edcf');
        }
        return;
      }
      case 'tree': {
        const trunk = this.add.rectangle(prop.x, prop.y + prop.height * 0.18, prop.width * 0.22, prop.height * 0.45, accentColor, 1);
        this.worldLayer.add(trunk);

        const canopy = this.add.ellipse(prop.x, prop.y - 6, prop.width, prop.height, fillColor, alpha);
        canopy.setStrokeStyle(2, 0x274528, 0.75);
        this.worldLayer.add(canopy);
        return;
      }
      case 'fence': {
        const fence = this.add.rectangle(prop.x, prop.y, prop.width, prop.height, fillColor, alpha);
        fence.setStrokeStyle(1, accentColor, 0.85);
        this.worldLayer.add(fence);
        return;
      }
      case 'fountain': {
        const basin = this.add.ellipse(prop.x, prop.y, prop.width, prop.height, fillColor, alpha);
        basin.setStrokeStyle(3, accentColor, 0.85);
        this.worldLayer.add(basin);

        const water = this.add.ellipse(prop.x, prop.y + 2, prop.width * 0.62, prop.height * 0.5, 0x86bce8, 0.9);
        this.worldLayer.add(water);
        return;
      }
      case 'stall': {
        const base = this.add.rectangle(prop.x, prop.y + 4, prop.width, prop.height, 0x6a4a35, 1);
        base.setStrokeStyle(2, 0x2d1e17, 0.8);
        this.worldLayer.add(base);

        const canopy = this.add.rectangle(prop.x, prop.y - prop.height / 2 + 10, prop.width + 8, 14, fillColor, alpha);
        canopy.setStrokeStyle(2, accentColor, 0.8);
        this.worldLayer.add(canopy);

        if (prop.label) {
          this.addWorldLabel(prop.x, prop.y - prop.height / 2 - 8, prop.label, '#f8edcf');
        }
        return;
      }
      case 'crate': {
        const crate = this.add.rectangle(prop.x, prop.y, prop.width, prop.height, fillColor, alpha);
        crate.setStrokeStyle(2, accentColor, 0.7);
        this.worldLayer.add(crate);
        return;
      }
      case 'sign': {
        const post = this.add.rectangle(prop.x, prop.y + prop.height * 0.15, 8, prop.height, accentColor, 1);
        this.worldLayer.add(post);

        const board = this.add.rectangle(prop.x, prop.y - prop.height * 0.2, prop.width * 1.3, prop.height * 0.7, fillColor, alpha);
        board.setStrokeStyle(2, 0x523726, 0.8);
        this.worldLayer.add(board);

        if (prop.label) {
          this.addWorldLabel(prop.x, prop.y - prop.height / 2 - 8, prop.label, '#f8edcf');
        }
        return;
      }
      case 'planter': {
        const box = this.add.rectangle(prop.x, prop.y, prop.width, prop.height, accentColor, 0.9);
        box.setStrokeStyle(2, 0x473124, 0.8);
        this.worldLayer.add(box);

        const bloom = this.add.rectangle(prop.x, prop.y, prop.width - 10, prop.height - 6, fillColor, alpha);
        this.worldLayer.add(bloom);
        return;
      }
      case 'gate': {
        const post = this.add.rectangle(prop.x, prop.y, prop.width, prop.height, fillColor, alpha);
        post.setStrokeStyle(2, accentColor, 0.75);
        this.worldLayer.add(post);
        return;
      }
      case 'lantern': {
        const pole = this.add.rectangle(prop.x, prop.y + 8, 6, 22, accentColor, 1);
        this.worldLayer.add(pole);

        const light = this.add.circle(prop.x, prop.y - 2, 8, fillColor, 0.95);
        light.setStrokeStyle(2, 0x634f2a, 0.8);
        this.worldLayer.add(light);
        return;
      }
      case 'training_dummy': {
        const post = this.add.rectangle(prop.x, prop.y + 6, 8, prop.height + 10, accentColor, 1);
        this.worldLayer.add(post);

        const body = this.add.rectangle(prop.x, prop.y - 2, prop.width + 10, prop.height + 8, fillColor, alpha);
        body.setStrokeStyle(2, 0x70472f, 0.8);
        this.worldLayer.add(body);
        return;
      }
      default: {
        const fallback = this.createShape(prop, fillColor, alpha);
        fallback.setStrokeStyle(1, accentColor, 0.6);
        this.worldLayer.add(fallback);
      }
    }
  }

  private createShape(prop: MapPropDefinition, fillColor: number, alpha: number): Phaser.GameObjects.Shape {
    if (prop.shape === 'ellipse') {
      return this.add.ellipse(prop.x, prop.y, prop.width, prop.height, fillColor, alpha);
    }
    return this.add.rectangle(prop.x, prop.y, prop.width, prop.height, fillColor, alpha);
  }

  private addWorldLabel(x: number, y: number, text: string, color: string): void {
    const label = this.add
      .text(x, y, text, {
        fontFamily: 'Georgia, serif',
        fontSize: '11px',
        color,
        stroke: '#1a1520',
        strokeThickness: 3,
      })
      .setOrigin(0.5, 1);
    label.setDepth(WORLD_DEPTH.labels);
    this.worldLayer.add(label);
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
      0.08,
    );
    rect.setStrokeStyle(2, 0xaaddaa, 0.26);
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
        for (let i = 0; i < count; i += 1) {
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
      player: this.getPlayerSnapshot(),
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

  private getPlayerSnapshot(): HudPlayerSnapshot {
    return { ...this.playerState };
  }

  private showFatalError(message: string): void {
    this.ready = false;
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
