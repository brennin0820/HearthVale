import Phaser from 'phaser';
import {
  DEFAULT_CURRENCY,
  DEFAULT_HOTBAR,
  DEFAULT_INVENTORY,
  DEFAULT_PARTY,
  hudOverlay,
  type HudAura,
  type HudPlayerSnapshot,
  type HudTarget,
} from '../hud/HudOverlay.js';
import { audioService } from '../services/AudioService.js';
import { DevOverlay } from '../services/DevOverlay.js';
import { loadCollisionMask, loadPropLayer } from '../services/mapArtData.js';
import { loadNpcCatalog } from '../services/npcData.js';
import type { NpcCatalogEntry, NpcRole } from '../types/npc.js';
import { getMapById, loadMonsterCatalog, type MonsterCatalogEntry } from '../services/worldData.js';
import { getJobSkills, getSkillById } from '../services/catalogData.js';
import type { SkillEffectKind } from '../types/catalog.js';
import { CombatController, type CombatBridge, type CombatTargetInfo } from '../combat/CombatController.js';
import type { CombatStats } from '../combat/formulas.js';
import {
  monsterXpReward,
  playerCombatStats,
  playerVitals,
  STARTER_REGION_LEVEL_CAP,
  xpToNextLevel,
} from '../combat/progression.js';
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

/** A fresh solo hero at the bottom of the starter-region curve. */
function createStartingPlayer(): HudPlayerSnapshot {
  const level = 1;
  const { hpMax, mpMax } = playerVitals(level);
  return {
    name: 'Hero',
    level,
    hpCur: hpMax,
    hpMax,
    mpCur: mpMax,
    mpMax,
    spCur: 100,
    spMax: 100,
    xpCur: 0,
    xpNext: xpToNextLevel(level),
    stance: 'Ready',
  };
}

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
/** Every character starts as the tier-0 Vale Novice — job selection UI is future Phase C work. */
const STARTING_JOB_ID = 'novice';
/** Effect kinds a hotbar press actually casts; economy/gather/utility skills belong to other systems. */
const COMBAT_CASTABLE_KINDS: ReadonlySet<SkillEffectKind> = new Set(['damage', 'heal', 'buff', 'debuff', 'mark']);

interface PlayerBuff {
  stat: string;
  amount: number;
  remainingMs: number;
}

const LOW_HP_AURA_THRESHOLD = 0.3;
const VITAL_STAMINA_DRAIN_PER_SECOND = 16;
const VITAL_STAMINA_REGEN_PER_SECOND = 9;
const VITAL_MP_DRAIN_PER_SECOND_MOVING = 1.5;
const VITAL_HP_REGEN_PER_SECOND_SAFE = 6;
const VITAL_MP_REGEN_PER_SECOND_SAFE = 10;
const VITAL_SP_REGEN_PER_SECOND_SAFE = 20;
const AUTO_PATH_REACH_RADIUS = 3.5;
const AUTO_PATH_SEARCH_LIMIT = 2400;
const PATH_NEIGHBOR_STEPS: ReadonlyArray<[number, number]> = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
];

const NPC_INTERACT_RADIUS = 62;
const NPC_CLICK_TOLERANCE = 40;
const NPC_BOB_AMPLITUDE = 3;
const NPC_DIALOGUE_MS = 5200;

interface NpcRoleStyle {
  body: number;
  accent: number;
  glyph: string;
  glyphColor: string;
}

/** Per-role NPC visuals. Glyphs use Latin-1/general-punctuation chars that render
 * reliably in the canvas sans-serif fallback (no emoji). */
const NPC_ROLE_STYLE: Record<NpcRole, NpcRoleStyle> = {
  quest: { body: 0xd8b24a, accent: 0xfff0c0, glyph: '!', glyphColor: '#ffe89a' },
  merchant: { body: 0x5fa663, accent: 0xd8f5c8, glyph: '$', glyphColor: '#bff0b2' },
  trainer: { body: 0xb0563f, accent: 0xffd8c0, glyph: '‡', glyphColor: '#ffc2a8' },
  warp: { body: 0x5a8fd4, accent: 0xcfe4ff, glyph: '»', glyphColor: '#bcd8ff' },
  flavor: { body: 0xc9a86c, accent: 0xf0e0b0, glyph: '', glyphColor: '#f0e0b0' },
};

type TileCoord = { row: number; col: number; };

interface NpcInstance {
  npcId: string;
  displayName: string;
  title: string;
  role: NpcRole;
  dialogue: string[];
  position: Vec2;
  dialogueIndex: number;
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
  private interactKey!: Phaser.Input.Keyboard.Key;
  private inSafeZone = false;
  private devOverlay!: DevOverlay;
  private collisionMask: CollisionMaskDefinition | null = null;
  private ready = false;
  private autoPath: Vec2[] = [];
  private autoPathMarker: Phaser.GameObjects.Arc | null = null;
  private playerState: HudPlayerSnapshot = createStartingPlayer();
  private npcCatalog: Map<string, NpcCatalogEntry> = new Map();
  private npcs: NpcInstance[] = [];
  private nearestNpc: NpcInstance | null = null;
  private interactPrompt: Phaser.GameObjects.Text | null = null;
  private dialogueBubble: Phaser.GameObjects.Container | null = null;
  private dialogueTimer = 0;
  private monsterCatalog: Map<string, MonsterCatalogEntry> = new Map();
  private combat!: CombatController;
  private attackKey!: Phaser.Input.Keyboard.Key;
  private skillKeys: Phaser.Input.Keyboard.Key[] = [];
  private skillLoadout: string[] = [];
  private playerBuffs: PlayerBuff[] = [];
  private inCombat = false;
  private playerInvuln = 0;
  private liveCombatTarget: CombatTargetInfo | null = null;

  constructor() {
    super({ key: 'WorldScene' });
  }

  init(data: WorldSceneData): void {
    this.mapId = data.mapId;
    this.portalCooldown = 500;
    this.ready = false;
    this.collisionMask = null;
    // Game objects are destroyed on scene.restart; drop stale references so a
    // fresh map starts with clean NPC/interaction state.
    this.npcs = [];
    this.nearestNpc = null;
    this.interactPrompt = null;
    this.dialogueBubble = null;
    this.dialogueTimer = 0;
    this.liveCombatTarget = null;
    this.inCombat = false;
    this.playerInvuln = 0;
    this.playerBuffs = [];
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
      const [collisionMask, propLayer, npcCatalog, monsterCatalog] = await Promise.all([
        loadCollisionMask(this.mapId),
        loadPropLayer(this.mapId),
        loadNpcCatalog(),
        loadMonsterCatalog(),
      ]);

      this.collisionMask = collisionMask;
      this.npcCatalog = npcCatalog;
      this.monsterCatalog = monsterCatalog;
      this.drawMapBackground(mapDef);
      this.drawPropLayer(propLayer.props);
      this.drawSafeZone(mapDef);
      this.drawAmbientLight(mapDef);
      this.drawSpawnAreas(mapDef);
      this.drawPortals(mapDef);
      this.drawNpcs(mapDef);

      this.player = this.createPlayer(data.spawn);
      this.worldLayer.add(this.player);

      this.setupCombat(mapDef);

      this.cameras.main.startFollow(this.player, true, 0.12, 0.12);
      this.cameras.main.setZoom(1);

      this.cursors = this.input.keyboard!.createCursorKeys();
      this.wasd = {
        W: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
        A: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
        S: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
        D: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      };
      this.interactKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.E);
      this.autoPathMarker = this.add.circle(0, 0, 7, 0x88ff88, 0.55);
      this.autoPathMarker.setDepth(WORLD_DEPTH.labels);
      this.autoPathMarker.setVisible(false);
      this.attackKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
      this.skillLoadout = getJobSkills(STARTING_JOB_ID);
      this.skillKeys = [
        Phaser.Input.Keyboard.KeyCodes.ONE,
        Phaser.Input.Keyboard.KeyCodes.TWO,
        Phaser.Input.Keyboard.KeyCodes.THREE,
        Phaser.Input.Keyboard.KeyCodes.FOUR,
      ].map((code) => this.input.keyboard!.addKey(code));
      this.input.on('pointerdown', this.handlePointerAttack, this);
      this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.onShutdown, this);

      this.input.on('pointerdown', this.handlePointerDown, this);
      this.input.mouse?.disableContextMenu();

      this.devOverlay = new DevOverlay(this);
      this.devOverlay.mount(mapDef);
      audioService.playMapMusic(mapDef.musicKey);
      this.inSafeZone = this.isInSafeZone({ x: this.player.x, y: this.player.y });
      this.updatePlayerVitals(0, false);
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
    if (this.playerInvuln > 0) {
      this.playerInvuln = Math.max(0, this.playerInvuln - delta);
    }
    const moved = this.handleMovement(delta);
    const autoPathMoved = this.followAutoPath(delta);

    const actuallyMoved = moved || autoPathMoved;
    this.updateNpcInteraction(delta);
    this.inSafeZone = this.isInSafeZone({ x: this.player.x, y: this.player.y });
    this.updatePlayerVitals(delta, actuallyMoved);
    this.updatePlayerBuffs(delta);
    this.combat.update(delta);
    if (Phaser.Input.Keyboard.JustDown(this.attackKey)) {
      this.combat.playerAttack();
    }
    for (let i = 0; i < this.skillKeys.length; i += 1) {
      if (Phaser.Input.Keyboard.JustDown(this.skillKeys[i])) {
        this.tryUseSkill(i);
      }
    }
    if (this.playerInvuln > 0) {
      this.playerState.stance = 'Recovering';
    } else if (this.inCombat && !this.inSafeZone && this.playerState.hpCur > 0) {
      this.playerState.stance = 'Fighting';
    }
    this.checkPortals();
    this.syncHud({ x: this.player.x, y: this.player.y });
    this.devOverlay.update(this.mapDef, { x: this.player.x, y: this.player.y });
  }

  private handleMovement(delta: number): boolean {
    const intent = this.getMovementIntent();
    if (intent.vx === 0 && intent.vy === 0) {
      return false;
    }

    this.autoPath = [];
    this.hideAutoPathMarker();
    return this.moveByVector(delta, intent.vx, intent.vy);
  }

  private getMovementIntent(): { vx: number; vy: number } {
    let vx = 0;
    let vy = 0;

    if (this.cursors.left.isDown || this.wasd.A.isDown) vx -= 1;
    if (this.cursors.right.isDown || this.wasd.D.isDown) vx += 1;
    if (this.cursors.up.isDown || this.wasd.W.isDown) vy -= 1;
    if (this.cursors.down.isDown || this.wasd.S.isDown) vy += 1;

    const len = Math.hypot(vx, vy);
    if (len === 0) {
      return { vx: 0, vy: 0 };
    }

    return { vx: vx / len, vy: vy / len };
  }

  private handlePointerDown(pointer: Phaser.Input.Pointer): void {
    if (!this.ready || !this.player) return;
    if (!(pointer.leftButtonDown() || pointer.rightButtonDown())) return;

    const target = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
    // A left-click on a nearby NPC starts a conversation; otherwise fall through
    // to auto-path so clicking open ground still moves the player.
    if (pointer.leftButtonDown() && this.tryClickNpc(target.x, target.y)) {
      return;
    }
    this.queueAutoPath(target.x, target.y);
  }

  private followAutoPath(delta: number): boolean {
    if (!this.autoPath.length) {
      this.hideAutoPathMarker();
      return false;
    }

    const target = this.autoPath[0];
    const dx = target.x - this.player.x;
    const dy = target.y - this.player.y;
    const remaining = Math.hypot(dx, dy);

    if (remaining <= AUTO_PATH_REACH_RADIUS) {
      this.player.x = target.x;
      this.player.y = target.y;
      this.autoPath.shift();
      if (!this.autoPath.length) {
        this.hideAutoPathMarker();
      } else if (this.autoPathMarker) {
        const next = this.autoPath[this.autoPath.length - 1];
        this.autoPathMarker.setPosition(next.x, next.y);
      }
      return true;
    }

    const moved = this.moveByVector(delta, dx / remaining, dy / remaining);
    if (!moved) {
      this.autoPath = [];
      this.hideAutoPathMarker();
    }

    return moved;
  }

  private moveByVector(delta: number, vx: number, vy: number): boolean {
    if (vx === 0 && vy === 0) return false;

    const step = (PLAYER_SPEED * delta) / 1000;
    const nextX = this.player.x + vx * step;
    const nextY = this.player.y + vy * step;
    let moved = false;

    const attemptX = clampToBounds(nextX, this.player.y, this.bounds);
    if (this.isWalkable(attemptX.x, attemptX.y)) {
      this.player.x = attemptX.x;
      moved = true;
    }

    const attemptY = clampToBounds(this.player.x, nextY, this.bounds);
    if (this.isWalkable(attemptY.x, attemptY.y)) {
      this.player.y = attemptY.y;
      moved = true;
    }

    return moved;
  }

  private queueAutoPath(worldX: number, worldY: number): void {
    if (!this.collisionMask || !this.player) return;
    const start = this.worldToTile(this.player.x, this.player.y);
    let end: TileCoord | null = this.worldToTile(worldX, worldY);
    end = this.findNearestWalkableTile(end, start);
    if (!end) return;

    const rawPath = this.findPath(start, end);
    if (rawPath.length < 2) {
      this.autoPath = [];
      this.hideAutoPathMarker();
      return;
    }

    rawPath.shift();
    this.autoPath = rawPath.map((tile) => this.tileToWorld(tile.col, tile.row));
    const markerTarget = this.autoPath[this.autoPath.length - 1];
    if (markerTarget) {
      this.showAutoPathMarker(markerTarget);
    }
    if (!this.autoPath.length) {
      this.hideAutoPathMarker();
    }
  }

  private showAutoPathMarker(position: Vec2): void {
    if (!this.autoPathMarker) return;
    this.autoPathMarker.setPosition(position.x, position.y);
    this.autoPathMarker.setVisible(true);
  }

  private hideAutoPathMarker(): void {
    this.autoPathMarker?.setVisible(false);
  }

  private findPath(start: TileCoord, end: TileCoord): TileCoord[] {
    if (!this.collisionMask) return [];
    const { walkable } = this.collisionMask;
    const rows = walkable.length;
    const cols = walkable[0]?.length ?? 0;

    if (!this.isInsideGrid(start, rows, cols) || !this.isInsideGrid(end, rows, cols)) return [];
    if (!this.isWalkableTile(start, walkable) || !this.isWalkableTile(end, walkable)) return [];
    if (start.row === end.row && start.col === end.col) {
      return [start];
    }

    const toKey = (tile: TileCoord): number => tile.row * cols + tile.col;
    const fromKey = (key: number): TileCoord => ({ row: Math.floor(key / cols), col: key % cols });
    const startKey = toKey(start);
    const targetKey = toKey(end);
    const gScore = new Map<number, number>([[startKey, 0]]);
    const fScore = new Map<number, number>([[startKey, Math.abs(start.row - end.row) + Math.abs(start.col - end.col)]]);
    const openSet = new Set<number>([startKey]);
    const cameFrom = new Int32Array(rows * cols);
    cameFrom.fill(-1);

    while (openSet.size > 0) {
      let current = -1;
      let bestF = Infinity;
      for (const key of openSet) {
        const score = fScore.get(key) ?? Infinity;
        if (score < bestF) {
          bestF = score;
          current = key;
        }
      }
      if (current === -1) break;

      openSet.delete(current);
      if (current === targetKey) {
        return this.reconstructPath(cameFrom, fromKey, startKey, targetKey);
      }

      const currentTile = fromKey(current);
      const currentG = gScore.get(current) ?? Infinity;

      for (const [dx, dy] of PATH_NEIGHBOR_STEPS) {
        const next: TileCoord = { row: currentTile.row + dy, col: currentTile.col + dx };
        if (!this.isInsideGrid(next, rows, cols) || !this.isWalkableTile(next, walkable)) {
          continue;
        }

        const nextKey = toKey(next);
        const tentativeG = currentG + 1;
        const existing = gScore.get(nextKey);
        if (existing !== undefined && tentativeG >= existing) {
          continue;
        }

        cameFrom[nextKey] = current;
        gScore.set(nextKey, tentativeG);
        const heuristic = Math.abs(end.row - next.row) + Math.abs(end.col - next.col);
        fScore.set(nextKey, tentativeG + heuristic);
        if (!openSet.has(nextKey)) {
          openSet.add(nextKey);
        }
      }
    }

    return [];
  }

  private reconstructPath(
    cameFrom: Int32Array,
    fromKey: (key: number) => TileCoord,
    startKey: number,
    targetKey: number,
  ): TileCoord[] {
    const path: TileCoord[] = [];
    let current = targetKey;
    while (current !== -1) {
      path.push(fromKey(current));
      if (current === startKey) break;
      current = cameFrom[current];
      if (current === -1) return [];
    }

    return path.reverse();
  }

  private findNearestWalkableTile(
    target: TileCoord,
    fallback: TileCoord,
  ): TileCoord | null {
    if (!this.collisionMask) return null;
    const { walkable } = this.collisionMask;
    const rows = walkable.length;
    const cols = walkable[0]?.length ?? 0;
    if (!this.isInsideGrid(target, rows, cols)) {
      if (this.isInsideGrid(fallback, rows, cols) && this.isWalkableTile(fallback, walkable)) {
        return fallback;
      }
      return null;
    }

    if (this.isWalkableTile(target, walkable)) {
      return target;
    }

    const visited = new Set<number>();
    const queue: TileCoord[] = [];
    const toKey = (tile: TileCoord): number => tile.row * cols + tile.col;
    const startKey = toKey(target);
    visited.add(startKey);
    queue.push(target);
    let searched = 0;

    while (queue.length > 0 && searched < AUTO_PATH_SEARCH_LIMIT) {
      const current = queue.shift();
      if (!current) break;
      searched += 1;
      for (const [dx, dy] of PATH_NEIGHBOR_STEPS) {
        const next = { row: current.row + dy, col: current.col + dx };
        const key = toKey(next);
        if (visited.has(key)) continue;
        if (!this.isInsideGrid(next, rows, cols)) continue;
        if (this.isWalkableTile(next, walkable)) {
          return next;
        }
        visited.add(key);
        if (queue.length < AUTO_PATH_SEARCH_LIMIT) {
          queue.push(next);
        }
      }
    }

    return this.isWalkableTile(fallback, walkable) ? fallback : null;
  }

  private isWalkableTile(tile: TileCoord, walkable: boolean[][]): boolean {
    return !!walkable[tile.row]?.[tile.col];
  }

  private isInsideGrid(tile: TileCoord, rows: number, cols: number): boolean {
    return tile.row >= 0 && tile.row < rows && tile.col >= 0 && tile.col < cols;
  }

  private worldToTile(x: number, y: number): TileCoord {
    const { tileSize, walkable } = this.collisionMask ?? { tileSize: TILE_SIZE, walkable: [] };
    const halfW = (walkable[0]?.length ?? this.mapDef.gridSize.width) * tileSize / 2;
    const halfH = (walkable.length || this.mapDef.gridSize.height) * tileSize / 2;

    return {
      col: Math.floor((x + halfW) / tileSize),
      row: Math.floor((y + halfH) / tileSize),
    };
  }

  private tileToWorld(col: number, row: number): Vec2 {
    const tileSize = this.collisionMask?.tileSize ?? TILE_SIZE;
    const halfW = (this.mapDef.gridSize.width * tileSize) / 2;
    const halfH = (this.mapDef.gridSize.height * tileSize) / 2;

    return {
      x: col * tileSize - halfW + tileSize / 2,
      y: row * tileSize - halfH + tileSize / 2,
    };
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
        this.tweens.add({
          targets: water,
          scaleX: 1.14,
          scaleY: 1.14,
          alpha: 0.68,
          duration: 1700,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
        });
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

        const glow = this.add.circle(prop.x, prop.y - 2, 15, fillColor, 0.18);
        this.worldLayer.add(glow);

        const light = this.add.circle(prop.x, prop.y - 2, 8, fillColor, 0.95);
        light.setStrokeStyle(2, 0x634f2a, 0.8);
        this.worldLayer.add(light);

        // Each lantern flickers on its own cadence so the town glow feels alive.
        this.tweens.add({
          targets: [light, glow],
          alpha: '-=0.18',
          scaleX: 1.16,
          scaleY: 1.16,
          duration: this.randomRange(1200, 1900),
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
          delay: this.randomRange(0, 800),
        });
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
    for (const placement of map.npcs) {
      const entry = this.npcCatalog.get(placement.npcId);
      const role: NpcRole = entry?.role ?? 'flavor';
      const style = NPC_ROLE_STYLE[role];
      const displayName = entry?.displayName ?? placement.npcId.replace(/_/g, ' ');
      const title = entry?.title ?? '';
      const dialogue = entry?.dialogue ?? [];
      const pos = { x: placement.position.x, y: placement.position.y };

      const container = this.add.container(pos.x, pos.y);
      container.setDepth(WORLD_DEPTH.npc);

      const shadow = this.add.ellipse(0, 14, 22, 9, 0x000000, 0.25);

      // The figure (body + face) bobs; the shadow and nameplate stay put.
      const figure = this.add.container(0, 0);
      const body = this.add.rectangle(0, 0, 20, 26, style.body, 1);
      body.setStrokeStyle(2, style.accent, 0.9);
      const face = this.add.circle(0, -10, 5, 0xf5d6a8, 1);
      figure.add([body, face]);

      const name = this.add
        .text(0, -20, displayName, {
          fontFamily: 'sans-serif',
          fontSize: '10px',
          color: '#ffe8b0',
          stroke: '#1a1520',
          strokeThickness: 2,
        })
        .setOrigin(0.5, 1);

      container.add([shadow, figure, name]);
      this.worldLayer.add(container);

      this.tweens.add({
        targets: figure,
        y: -NPC_BOB_AMPLITUDE,
        duration: this.randomRange(1000, 1400),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
        delay: this.randomRange(0, 600),
      });

      if (style.glyph) {
        const glyph = this.add
          .text(pos.x, pos.y - 34, style.glyph, {
            fontFamily: 'Georgia, serif',
            fontSize: role === 'quest' ? '18px' : '14px',
            color: style.glyphColor,
            stroke: '#1a1520',
            strokeThickness: 3,
          })
          .setOrigin(0.5, 1);
        glyph.setDepth(WORLD_DEPTH.labels);
        this.worldLayer.add(glyph);
        this.tweens.add({
          targets: glyph,
          y: glyph.y - 5,
          duration: this.randomRange(700, 1000),
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
          delay: this.randomRange(0, 500),
        });
      }

      this.npcs.push({
        npcId: placement.npcId,
        displayName,
        title,
        role,
        dialogue,
        position: pos,
        dialogueIndex: 0,
      });
    }
  }

  private randomRange(min: number, max: number): number {
    return min + Math.random() * (max - min);
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

  private handlePointerAttack(pointer: Phaser.Input.Pointer): void {
    if (!this.ready || !this.combat) return;
    const world = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
    this.combat.attackAtPoint(world.x, world.y);
  }

  private onShutdown(): void {
    this.input.off('pointerdown', this.handlePointerAttack, this);
    this.combat?.destroy();
    this.inCombat = false;
    this.liveCombatTarget = null;
  }

  private setupCombat(map: MapDefinition): void {
    const bridge: CombatBridge = {
      getPlayerPosition: () => ({ x: this.player.x, y: this.player.y }),
      getPlayerStats: () => this.getPlayerCombatStats(),
      isPlayerAlive: () => this.playerState.hpCur > 0 && this.playerInvuln <= 0 && !this.inSafeZone,
      clampToBounds: (x, y) => clampToBounds(x, y, this.bounds),
      onPlayerDamaged: (amount) => this.applyPlayerDamage(amount),
      onMonsterDefeated: (monster) => this.awardMonsterKill(monster),
      onTargetChanged: (target) => this.onCombatTargetChanged(target),
      spendMp: (amount) => this.spendPlayerMp(amount),
      healPlayer: (amount) => this.healPlayer(amount),
      applyPlayerBuff: (stat, amount, durationMs) => this.applyPlayerBuff(stat, amount, durationMs),
    };

    this.combat = new CombatController(this, this.worldLayer, bridge, {
      monster: WORLD_DEPTH.monster,
      label: WORLD_DEPTH.labels,
      floatingText: WORLD_DEPTH.floatingText,
    });

    if (map.kind !== 'town') {
      this.combat.spawnFromTables(map.spawnTables, this.monsterCatalog);
    }
  }

  /** Combat stats plus any active skill buffs (atk/def/flee — matk/spr have no client-side hook yet). */
  private getPlayerCombatStats(): CombatStats {
    const base = playerCombatStats(this.playerState.level);
    let { atk, def, flee } = base;
    for (const buff of this.playerBuffs) {
      if (buff.stat === 'atk') atk += buff.amount;
      else if (buff.stat === 'def') def += buff.amount;
      else if (buff.stat === 'flee') flee += buff.amount;
    }
    return { ...base, atk, def, flee };
  }

  /** Try to cast the skill in the given hotbar slot (1-4); no-op if empty or not a combat skill. */
  private tryUseSkill(slotIndex: number): void {
    const skillId = this.skillLoadout[slotIndex];
    if (!skillId) return;
    const skill = getSkillById(skillId);
    if (!skill || !COMBAT_CASTABLE_KINDS.has(skill.effect.kind)) return;
    this.combat.useSkill(skill);
  }

  private spendPlayerMp(amount: number): boolean {
    if (amount <= 0) return true;
    if (this.playerState.mpCur < amount) return false;
    this.playerState.mpCur -= amount;
    return true;
  }

  private healPlayer(amount: number): void {
    this.playerState.hpCur = Math.min(this.playerState.hpMax, this.playerState.hpCur + amount);
  }

  private applyPlayerBuff(stat: string, amount: number, durationMs: number): void {
    const existing = this.playerBuffs.find((buff) => buff.stat === stat);
    if (existing) {
      existing.amount = amount;
      existing.remainingMs = durationMs;
    } else {
      this.playerBuffs.push({ stat, amount, remainingMs: durationMs });
    }
  }

  private updatePlayerBuffs(delta: number): void {
    if (this.playerBuffs.length === 0) return;
    for (const buff of this.playerBuffs) {
      buff.remainingMs -= delta;
    }
    this.playerBuffs = this.playerBuffs.filter((buff) => buff.remainingMs > 0);
  }

  private onCombatTargetChanged(target: CombatTargetInfo | null): void {
    this.inCombat = target !== null;
    this.liveCombatTarget = target;
  }

  private applyPlayerDamage(amount: number): void {
    if (this.playerInvuln > 0 || this.playerState.hpCur <= 0) return;
    this.playerState.hpCur = Math.max(0, this.playerState.hpCur - amount);
    if (this.playerState.hpCur <= 0) {
      this.handlePlayerDefeat();
    }
  }

  private handlePlayerDefeat(): void {
    const respawn = this.respawnPoint();
    this.player.x = respawn.x;
    this.player.y = respawn.y;
    const { hpMax, mpMax } = playerVitals(this.playerState.level);
    this.playerState.hpMax = hpMax;
    this.playerState.mpMax = mpMax;
    this.playerState.hpCur = hpMax;
    this.playerState.mpCur = mpMax;
    this.playerState.stance = 'Recovering';
    this.playerInvuln = 2500;
    audioService.playSfx('sfx_portal');
  }

  private respawnPoint(): Vec2 {
    const zone = this.mapDef.safeZone;
    if (zone) {
      return clampToBounds(zone.x + zone.width / 2, zone.y + zone.height / 2, this.bounds);
    }
    return clampToBounds(this.mapDef.playerSpawn.x, this.mapDef.playerSpawn.y, this.bounds);
  }

  private awardMonsterKill(monster: MonsterCatalogEntry): void {
    if (this.playerState.level >= STARTER_REGION_LEVEL_CAP) {
      this.playerState.xpCur = this.playerState.xpNext;
      return;
    }

    this.playerState.xpCur += monsterXpReward(monster);
    while (
      this.playerState.xpCur >= this.playerState.xpNext &&
      this.playerState.level < STARTER_REGION_LEVEL_CAP
    ) {
      this.playerState.xpCur -= this.playerState.xpNext;
      this.playerState.level += 1;
      const { hpMax, mpMax } = playerVitals(this.playerState.level);
      this.playerState.hpMax = hpMax;
      this.playerState.mpMax = mpMax;
      this.playerState.hpCur = hpMax;
      this.playerState.mpCur = mpMax;
      this.playerState.xpNext = xpToNextLevel(this.playerState.level);
      this.spawnLevelUpText();
    }

    if (this.playerState.level >= STARTER_REGION_LEVEL_CAP) {
      this.playerState.xpCur = this.playerState.xpNext;
    }
  }

  private spawnLevelUpText(): void {
    const label = this.add
      .text(this.player.x, this.player.y - 30, `Level ${this.playerState.level}!`, {
        fontFamily: 'Georgia, serif',
        fontSize: '15px',
        color: '#ffe9a8',
        stroke: '#1a1520',
        strokeThickness: 4,
      })
      .setOrigin(0.5, 1);
    label.setDepth(WORLD_DEPTH.floatingText);
    this.worldLayer.add(label);
    this.tweens.add({
      targets: label,
      y: this.player.y - 62,
      alpha: 0,
      duration: 1100,
      ease: 'Cubic.easeOut',
      onComplete: () => label.destroy(),
    });
  }

  private syncHud(position: Vec2): void {
    this.inSafeZone = this.isInSafeZone(position);
    const auras = this.getAuras();
    hudOverlay.sync({
      map: this.mapDef,
      position,
      nearestPortal: this.nearestPortal,
      inSafeZone: this.inSafeZone,
      player: this.getPlayerSnapshot(),
      buffs: auras.buffs,
      debuffs: auras.debuffs,
      target: this.getTargetSnapshot(),
      // No party/economy/inventory systems yet — pass the design seed data through
      // the snapshot so the scene stays the single owner of HUD state.
      party: DEFAULT_PARTY,
      currency: DEFAULT_CURRENCY,
      hotbar: DEFAULT_HOTBAR,
      inventory: DEFAULT_INVENTORY,
    });
  }

  /** Formats the CombatController's live target (if any) for the HUD frame. */
  private getTargetSnapshot(): HudTarget | null {
    const target = this.liveCombatTarget;
    if (!target) return null;
    const hpPct = target.hpMax > 0 ? Math.max(0, Math.min(100, (target.hpCur / target.hpMax) * 100)) : 0;
    return { name: target.name, level: target.level, hpPct: `${hpPct}%` };
  }

  /** Derives status auras from live player vitals and zone state. */
  private getAuras(): { buffs: HudAura[]; debuffs: HudAura[] } {
    const buffs: HudAura[] = [];
    const debuffs: HudAura[] = [];
    const state = this.playerState;

    if (this.inSafeZone) {
      buffs.push({ letter: 'R', time: 'Rest' });
    }
    for (const buff of this.playerBuffs) {
      buffs.push({ letter: buff.stat.slice(0, 1).toUpperCase(), time: `${Math.ceil(buff.remainingMs / 1000)}s` });
    }
    if (state.stance === 'Tired' || state.spCur <= 0) {
      debuffs.push({ letter: 'T', time: 'Tired' });
    }
    const hpRatio = state.hpMax > 0 ? state.hpCur / state.hpMax : 0;
    if (hpRatio > 0 && hpRatio < LOW_HP_AURA_THRESHOLD) {
      debuffs.push({ letter: '!', time: 'Low' });
    }
    return { buffs, debuffs };
  }

  private updatePlayerVitals(delta: number, moved: boolean): void {
    const dt = delta / 1000;
    if (dt <= 0) {
      // Zero-delta / initial-create frame: assign the correct idle stance for the
      // current zone instead of leaving a stale value (e.g. 'Steady'/'Resting'
      // carried across a portal into a non-safe map).
      this.playerState.stance = this.inSafeZone ? 'Resting' : 'Ready';
      return;
    }

    if (this.inSafeZone) {
      this.playerState.stance = 'Resting';
      this.playerState.hpCur = this.adjustStat(this.playerState.hpCur, this.playerState.hpMax, VITAL_HP_REGEN_PER_SECOND_SAFE * dt);
      this.playerState.mpCur = this.adjustStat(this.playerState.mpCur, this.playerState.mpMax, VITAL_MP_REGEN_PER_SECOND_SAFE * dt);
      this.playerState.spCur = this.adjustStat(this.playerState.spCur, this.playerState.spMax, VITAL_SP_REGEN_PER_SECOND_SAFE * dt);
      return;
    }

    if (moved) {
      this.playerState.spCur = this.adjustStat(
        this.playerState.spCur,
        this.playerState.spMax,
        -VITAL_STAMINA_DRAIN_PER_SECOND * dt,
      );
      this.playerState.mpCur = this.adjustStat(
        this.playerState.mpCur,
        this.playerState.mpMax,
        -VITAL_MP_DRAIN_PER_SECOND_MOVING * dt,
      );
      this.playerState.stance = this.playerState.spCur > 0 ? 'Steady' : 'Tired';
      return;
    }

    this.playerState.spCur = this.adjustStat(
      this.playerState.spCur,
      this.playerState.spMax,
      VITAL_STAMINA_REGEN_PER_SECOND * dt,
    );
    this.playerState.stance = 'Ready';
  }

  private adjustStat(current: number, max: number, delta: number): number {
    if (!Number.isFinite(current) || !Number.isFinite(max) || max <= 0) {
      return current;
    }
    const next = current + delta;
    if (!Number.isFinite(next)) {
      return current;
    }
    return Math.max(0, Math.min(max, next));
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

  private drawAmbientLight(map: MapDefinition): void {
    if (map.kind !== 'town') return;

    const w = map.gridSize.width * TILE_SIZE;
    const h = map.gridSize.height * TILE_SIZE;
    const glow = this.add.rectangle(0, 0, w, h, 0xffd9a0, 0.05);
    glow.setBlendMode(Phaser.BlendModes.ADD);
    // Warm the ground and props but sit below actors/labels so text stays crisp.
    glow.setDepth(WORLD_DEPTH.portal - 1);
    this.worldLayer.add(glow);

    this.tweens.add({
      targets: glow,
      alpha: 0.09,
      duration: 5200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  private updateNpcInteraction(delta: number): void {
    let nearest: NpcInstance | null = null;
    let best = NPC_INTERACT_RADIUS;
    for (const npc of this.npcs) {
      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, npc.position.x, npc.position.y);
      if (dist <= best) {
        best = dist;
        nearest = npc;
      }
    }

    this.nearestNpc = nearest;
    this.updateInteractPrompt(nearest);

    if (nearest && this.interactKey && Phaser.Input.Keyboard.JustDown(this.interactKey)) {
      this.talkToNpc(nearest);
    }

    if (this.dialogueBubble) {
      this.dialogueTimer -= delta;
      if (this.dialogueTimer <= 0) {
        this.dialogueBubble.destroy();
        this.dialogueBubble = null;
      }
    }
  }

  private updateInteractPrompt(npc: NpcInstance | null): void {
    if (!npc) {
      this.interactPrompt?.setVisible(false);
      return;
    }

    if (!this.interactPrompt) {
      this.interactPrompt = this.add
        .text(0, 0, '[E] Talk', {
          fontFamily: 'sans-serif',
          fontSize: '11px',
          color: '#fff6df',
          backgroundColor: 'rgba(26,21,32,0.82)',
          padding: { x: 6, y: 3 },
          stroke: '#1a1520',
          strokeThickness: 2,
        })
        .setOrigin(0.5, 0);
      this.interactPrompt.setDepth(WORLD_DEPTH.labels + 2);
      this.worldLayer.add(this.interactPrompt);
    }

    this.interactPrompt.setPosition(npc.position.x, npc.position.y + 22);
    this.interactPrompt.setVisible(true);
  }

  private tryClickNpc(worldX: number, worldY: number): boolean {
    let hit: NpcInstance | null = null;
    let best = NPC_CLICK_TOLERANCE;
    for (const npc of this.npcs) {
      const dist = Phaser.Math.Distance.Between(worldX, worldY, npc.position.x, npc.position.y);
      if (dist <= best) {
        best = dist;
        hit = npc;
      }
    }

    if (!hit) return false;
    const playerDist = Phaser.Math.Distance.Between(this.player.x, this.player.y, hit.position.x, hit.position.y);
    if (playerDist > NPC_INTERACT_RADIUS * 1.7) {
      return false;
    }

    this.talkToNpc(hit);
    return true;
  }

  private talkToNpc(npc: NpcInstance): void {
    const line = npc.dialogue.length
      ? npc.dialogue[npc.dialogueIndex % npc.dialogue.length]
      : '…';
    npc.dialogueIndex += 1;
    this.showDialogueBubble(npc, line);
    hudOverlay.logNpcLine(npc.displayName, line);
  }

  private showDialogueBubble(npc: NpcInstance, line: string): void {
    this.dialogueBubble?.destroy();

    const padX = 10;
    const padY = 8;
    const gap = 3;
    const maxWidth = 210;

    const speaker = this.add
      .text(0, 0, npc.title ? `${npc.displayName} · ${npc.title}` : npc.displayName, {
        fontFamily: 'Georgia, serif',
        fontSize: '11px',
        color: '#7a5320',
        fontStyle: 'bold',
        wordWrap: { width: maxWidth },
      })
      .setOrigin(0, 0);
    const text = this.add
      .text(0, 0, line, {
        fontFamily: 'Georgia, serif',
        fontSize: '12px',
        color: '#2a2118',
        wordWrap: { width: maxWidth },
      })
      .setOrigin(0, 0);

    const contentWidth = Math.max(speaker.width, text.width);
    speaker.setPosition(padX, padY);
    text.setPosition(padX, padY + speaker.height + gap);

    const boxWidth = contentWidth + padX * 2;
    const boxHeight = padY * 2 + speaker.height + gap + text.height;

    const bg = this.add.graphics();
    bg.fillStyle(0xf6ecd6, 0.98);
    bg.fillRoundedRect(0, 0, boxWidth, boxHeight, 8);
    bg.lineStyle(2, 0xb9a06a, 1);
    bg.strokeRoundedRect(0, 0, boxWidth, boxHeight, 8);
    bg.fillTriangle(boxWidth / 2 - 7, boxHeight, boxWidth / 2 + 7, boxHeight, boxWidth / 2, boxHeight + 9);

    const container = this.add.container(npc.position.x - boxWidth / 2, npc.position.y - 40 - boxHeight);
    container.add([bg, speaker, text]);
    container.setDepth(WORLD_DEPTH.labels + 4);
    this.worldLayer.add(container);

    this.dialogueBubble = container;
    this.dialogueTimer = NPC_DIALOGUE_MS;
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
