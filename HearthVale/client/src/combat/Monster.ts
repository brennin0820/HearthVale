import Phaser from 'phaser';
import type { MonsterCatalogEntry } from '../services/worldData.js';
import type { Vec2 } from '../types/world.js';
import type { CombatStats } from './formulas.js';

const ELEMENT_COLORS: Record<string, number> = {
  nature: 0x6fae5a,
  fungal: 0xb06fd0,
  crystal: 0x6fb6e0,
  shadow: 0x6a5a8f,
  lunar: 0x8fa8e0,
  arcane: 0xd08fd0,
  wind: 0x9fd6c0,
  neutral: 0xcc6644,
};

const SIZE_RADIUS: Record<MonsterCatalogEntry['size'], number> = {
  small: 10,
  medium: 13,
  large: 18,
};

const HP_BAR_WIDTH = 34;
const HP_BAR_HEIGHT = 4;

export type MonsterState = 'alive' | 'dead';

/**
 * A live, damageable monster in the world. Owns its own Phaser visuals
 * (body, name tag, floating HP bar) and its combat/respawn state. Movement and
 * targeting decisions are driven externally by the CombatController; the
 * Monster only knows how to move a step, take damage, die, and respawn.
 *
 * Parts are positioned directly (not nested in a Container) so the name tag
 * can render at the labels depth above the player while the body stays at
 * the monster depth below it — a Container would force every child to share
 * one depth slot in its parent's display list.
 */
export class Monster {
  readonly def: MonsterCatalogEntry;
  readonly home: Vec2;
  readonly level: number;
  readonly hpMax: number;
  readonly respawnSeconds: number;

  hpCur: number;
  state: MonsterState = 'alive';
  attackCooldown = 0;

  private x_ = 0;
  private y_ = 0;
  private readonly radius: number;
  private respawnRemaining = 0;
  private readonly body: Phaser.GameObjects.Arc;
  private readonly tag: Phaser.GameObjects.Text;
  private readonly hpBarBg: Phaser.GameObjects.Rectangle;
  private readonly hpBarFill: Phaser.GameObjects.Rectangle;

  /** Flee reduction from a `debuff`-kind skill (e.g. Shield Bash), and remaining ms. */
  private fleeDebuff = 0;
  private fleeDebuffRemaining = 0;
  /** Bonus damage-taken percent from a `mark`-kind skill (e.g. Hunter's Mark), and remaining ms. */
  private markBonusPercent = 0;
  private markRemaining = 0;

  constructor(
    scene: Phaser.Scene,
    layer: Phaser.GameObjects.Container,
    def: MonsterCatalogEntry,
    home: Vec2,
    respawnSeconds: number,
    depths: { monster: number; label: number },
  ) {
    this.def = def;
    this.home = { ...home };
    this.level = def.baseLevel;
    this.hpMax = def.hp;
    this.hpCur = def.hp;
    this.respawnSeconds = respawnSeconds > 0 ? respawnSeconds : 6;
    this.x_ = home.x;
    this.y_ = home.y;

    this.radius = SIZE_RADIUS[def.size] ?? 11;
    const color = ELEMENT_COLORS[def.element] ?? 0xcc6644;

    this.body = scene.add.circle(home.x, home.y, this.radius, color, 0.92);
    this.body.setStrokeStyle(2, 0xffd0b0, 0.9);
    this.body.setDepth(depths.monster);

    this.tag = scene.add
      .text(home.x, home.y - this.radius - 12, `${def.displayName} Lv${def.baseLevel}`, {
        fontFamily: 'sans-serif',
        fontSize: '9px',
        color: '#ffe0cc',
        stroke: '#1a1520',
        strokeThickness: 2,
      })
      .setOrigin(0.5, 1);
    this.tag.setDepth(depths.label);

    this.hpBarBg = scene.add.rectangle(
      home.x,
      home.y - this.radius - 4,
      HP_BAR_WIDTH,
      HP_BAR_HEIGHT,
      0x000000,
      0.55,
    );
    this.hpBarBg.setDepth(depths.label);
    this.hpBarFill = scene.add
      .rectangle(home.x - HP_BAR_WIDTH / 2, home.y - this.radius - 4, HP_BAR_WIDTH, HP_BAR_HEIGHT, 0x66dd66, 1)
      .setOrigin(0, 0.5);
    this.hpBarFill.setDepth(depths.label);
    this.hpBarBg.setVisible(false);
    this.hpBarFill.setVisible(false);

    layer.add([this.body, this.tag, this.hpBarBg, this.hpBarFill]);
  }

  get x(): number {
    return this.x_;
  }

  get y(): number {
    return this.y_;
  }

  get isAlive(): boolean {
    return this.state === 'alive';
  }

  combatStats(): CombatStats {
    return {
      level: this.level,
      atk: this.def.atk,
      def: this.def.def,
      hit: this.level * 2,
      flee: Math.max(0, this.level - this.fleeDebuff),
      element: this.def.element,
    };
  }

  /** Damage multiplier from an active `mark`-kind skill (1 when unmarked). */
  markMultiplier(): number {
    return 1 + this.markBonusPercent / 100;
  }

  /** Apply a `debuff`-kind skill effect (e.g. Shield Bash lowering flee). */
  applyDebuff(fleeDelta: number, durationMs: number): void {
    this.fleeDebuff = fleeDelta;
    this.fleeDebuffRemaining = durationMs;
  }

  /** Apply a `mark`-kind skill effect (e.g. Hunter's Mark raising damage taken). */
  applyMark(bonusPercent: number, durationMs: number): void {
    this.markBonusPercent = bonusPercent;
    this.markRemaining = durationMs;
  }

  /** Decrement active debuff/mark timers; called once per frame while alive. */
  tickEffects(delta: number): void {
    if (this.fleeDebuffRemaining > 0) {
      this.fleeDebuffRemaining -= delta;
      if (this.fleeDebuffRemaining <= 0) {
        this.fleeDebuffRemaining = 0;
        this.fleeDebuff = 0;
      }
    }
    if (this.markRemaining > 0) {
      this.markRemaining -= delta;
      if (this.markRemaining <= 0) {
        this.markRemaining = 0;
        this.markBonusPercent = 0;
      }
    }
  }

  /** Apply damage; returns true if this blow was fatal. */
  takeDamage(amount: number): boolean {
    if (this.state !== 'alive') return false;
    this.hpCur = Math.max(0, this.hpCur - amount);
    this.refreshHpBar();
    return this.hpCur <= 0;
  }

  die(): void {
    this.state = 'dead';
    this.attackCooldown = 0;
    this.respawnRemaining = Math.max(1000, this.respawnSeconds * 1000);
    this.setPartsVisible(false);
  }

  /** Step the monster toward a point, clamped to the map's playable bounds. */
  moveToward(x: number, y: number, step: number, clamp: (x: number, y: number) => Vec2): void {
    const dx = x - this.x_;
    const dy = y - this.y_;
    const dist = Math.hypot(dx, dy);
    if (dist < 1) return;
    const next = clamp(this.x_ + (dx / dist) * step, this.y_ + (dy / dist) * step);
    this.setPosition(next.x, next.y);
  }

  /** Advance respawn timer while dead; returns true on the frame it revives. */
  tickRespawn(delta: number): boolean {
    if (this.state !== 'dead') return false;
    this.respawnRemaining -= delta;
    if (this.respawnRemaining > 0) return false;
    this.respawn();
    return true;
  }

  private respawn(): void {
    this.hpCur = this.hpMax;
    this.state = 'alive';
    this.attackCooldown = 0;
    this.fleeDebuff = 0;
    this.fleeDebuffRemaining = 0;
    this.markBonusPercent = 0;
    this.markRemaining = 0;
    this.setPosition(this.home.x, this.home.y);
    this.setPartsVisible(true);
    this.hpBarBg.setVisible(false);
    this.hpBarFill.setVisible(false);
  }

  private setPosition(x: number, y: number): void {
    this.x_ = x;
    this.y_ = y;
    this.body.setPosition(x, y);
    this.tag.setPosition(x, y - this.radius - 12);
    this.hpBarBg.setPosition(x, y - this.radius - 4);
    this.hpBarFill.setPosition(x - HP_BAR_WIDTH / 2, y - this.radius - 4);
  }

  private setPartsVisible(visible: boolean): void {
    this.body.setVisible(visible);
    this.tag.setVisible(visible);
    if (!visible) {
      this.hpBarBg.setVisible(false);
      this.hpBarFill.setVisible(false);
    }
  }

  private refreshHpBar(): void {
    const pct = Math.max(0, Math.min(1, this.hpCur / this.hpMax));
    const damaged = pct < 1 && this.hpCur > 0;
    this.hpBarBg.setVisible(damaged);
    this.hpBarFill.setVisible(damaged);
    this.hpBarFill.displayWidth = HP_BAR_WIDTH * pct;
    this.hpBarFill.fillColor = pct > 0.5 ? 0x66dd66 : pct > 0.25 ? 0xddc044 : 0xdd5544;
  }

  destroy(): void {
    this.body.destroy();
    this.tag.destroy();
    this.hpBarBg.destroy();
    this.hpBarFill.destroy();
  }
}
