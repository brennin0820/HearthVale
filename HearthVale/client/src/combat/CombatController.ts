import Phaser from 'phaser';
import { audioService } from '../services/AudioService.js';
import type { MonsterCatalogEntry } from '../services/worldData.js';
import type { SkillDefinition } from '../types/catalog.js';
import type { SpawnTable, Vec2 } from '../types/world.js';
import { calcPhysicalDamage, rollHit, type CombatStats } from './formulas.js';
import { Monster } from './Monster.js';

export interface CombatTargetInfo {
  name: string;
  level: number;
  hpCur: number;
  hpMax: number;
  element: string;
}

/** Bridge back to WorldScene — the controller stays ignorant of HUD/vitals. */
export interface CombatBridge {
  getPlayerPosition(): Vec2;
  getPlayerStats(): CombatStats;
  isPlayerAlive(): boolean;
  clampToBounds(x: number, y: number): Vec2;
  /** A monster landed a hit for `amount` damage. */
  onPlayerDamaged(amount: number, attackerName: string): void;
  /** A monster was defeated — award XP / loot upstream. */
  onMonsterDefeated(monster: MonsterCatalogEntry): void;
  /** Current combat target changed (identity or HP) — refresh the HUD frame. */
  onTargetChanged(target: CombatTargetInfo | null): void;
  /** Spend MP for a skill cast; returns false (no-op) if the player can't afford it. */
  spendMp(amount: number): boolean;
  /** A `heal`-kind skill restores player HP, clamped to max upstream. */
  healPlayer(amount: number): void;
  /** A `buff`-kind skill applies a timed stat bonus to the player. */
  applyPlayerBuff(stat: string, amount: number, durationMs: number): void;
}

export interface CombatDepths {
  monster: number;
  label: number;
  floatingText: number;
}

const PLAYER_MELEE_RANGE = 40;
const MONSTER_MELEE_RANGE = 30;
const AGGRO_RADIUS = 160;
const LEASH_RADIUS = 340;
const TARGET_RADIUS = 220;
const PLAYER_ATTACK_COOLDOWN = 550;
const MONSTER_ATTACK_COOLDOWN = 1200;
const MONSTER_SPEED = 72;

export class CombatController {
  private readonly monsters: Monster[] = [];
  private playerAttackCooldown = 0;
  private target: Monster | null = null;
  private lastTargetKey = '';
  private readonly skillCooldowns: Map<string, number> = new Map();

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly layer: Phaser.GameObjects.Container,
    private readonly bridge: CombatBridge,
    private readonly depths: CombatDepths,
  ) {}

  /** Instantiate live monsters from a map's spawn tables. */
  spawnFromTables(spawnTables: SpawnTable[], monsterCatalog: Map<string, MonsterCatalogEntry>): void {
    let index = 0;
    for (const table of spawnTables) {
      const bounds = table.bounds;
      const centerX = bounds.x + bounds.width / 2;
      const centerY = bounds.y + bounds.height / 2;
      for (const entry of table.entries) {
        const def = monsterCatalog.get(entry.monsterId);
        if (!def) continue;
        const count = Math.min(table.maxConcurrent || 3, Math.max(1, Math.ceil(entry.weight / 25)));
        for (let i = 0; i < count; i += 1) {
          const offsetX = ((index * 47) % bounds.width) - bounds.width / 2;
          const offsetY = ((index * 31) % bounds.height) - bounds.height / 2;
          const home = this.bridge.clampToBounds(centerX + offsetX * 0.6, centerY + offsetY * 0.6);
          this.monsters.push(
            new Monster(this.scene, this.layer, def, home, table.respawnSeconds, this.depths),
          );
          index += 1;
        }
      }
    }
  }

  get hasMonsters(): boolean {
    return this.monsters.length > 0;
  }

  update(delta: number): void {
    if (this.playerAttackCooldown > 0) {
      this.playerAttackCooldown = Math.max(0, this.playerAttackCooldown - delta);
    }

    for (const [skillId, remaining] of this.skillCooldowns) {
      const next = remaining - delta;
      if (next <= 0) {
        this.skillCooldowns.delete(skillId);
      } else {
        this.skillCooldowns.set(skillId, next);
      }
    }

    const playerPos = this.bridge.getPlayerPosition();
    const playerAlive = this.bridge.isPlayerAlive();
    const step = (MONSTER_SPEED * delta) / 1000;

    for (const monster of this.monsters) {
      if (monster.tickRespawn(delta)) continue;
      if (!monster.isAlive) continue;
      monster.tickEffects(delta);

      if (monster.attackCooldown > 0) {
        monster.attackCooldown = Math.max(0, monster.attackCooldown - delta);
      }

      const distToPlayer = Phaser.Math.Distance.Between(monster.x, monster.y, playerPos.x, playerPos.y);
      const distToHome = Phaser.Math.Distance.Between(monster.x, monster.y, monster.home.x, monster.home.y);

      if (playerAlive && distToPlayer <= AGGRO_RADIUS && distToHome <= LEASH_RADIUS) {
        if (distToPlayer > MONSTER_MELEE_RANGE) {
          monster.moveToward(playerPos.x, playerPos.y, step, (x, y) => this.bridge.clampToBounds(x, y));
        } else if (monster.attackCooldown <= 0) {
          this.monsterAttack(monster);
        }
      } else if (distToHome > MONSTER_MELEE_RANGE) {
        monster.moveToward(monster.home.x, monster.home.y, step, (x, y) => this.bridge.clampToBounds(x, y));
      }
    }

    this.refreshTarget(playerPos);
  }

  /** Player initiates a melee attack (Space / click). */
  playerAttack(): void {
    if (this.playerAttackCooldown > 0 || !this.bridge.isPlayerAlive()) return;

    const playerPos = this.bridge.getPlayerPosition();
    let victim = this.target;
    if (!victim || !victim.isAlive || this.distanceTo(victim, playerPos) > PLAYER_MELEE_RANGE) {
      victim = this.nearestAlive(playerPos, PLAYER_MELEE_RANGE);
    }
    if (!victim) return;

    this.target = victim;
    this.playerAttackCooldown = PLAYER_ATTACK_COOLDOWN;

    const stats = this.bridge.getPlayerStats();
    const defenderStats = victim.combatStats();
    if (!rollHit(stats, defenderStats)) {
      this.floatingText(victim.x, victim.y, 'miss', '#cfd0d8');
      return;
    }

    const damage = calcPhysicalDamage(stats, defenderStats);
    const fatal = victim.takeDamage(damage);
    audioService.playSfx('sfx_combat_hit');
    this.floatingText(victim.x, victim.y, String(damage), '#ffe08a');

    if (fatal) {
      const def = victim.def;
      victim.die();
      this.floatingText(victim.x, victim.y - 8, `${def.displayName} defeated`, '#9fe0a0');
      this.bridge.onMonsterDefeated(def);
      if (this.target === victim) {
        this.target = null;
      }
    }
  }

  /** Click-to-target: select and attack the monster nearest a world point. */
  attackAtPoint(worldX: number, worldY: number): void {
    const picked = this.nearestAlive({ x: worldX, y: worldY }, 28);
    if (picked) {
      this.target = picked;
      const playerPos = this.bridge.getPlayerPosition();
      if (this.distanceTo(picked, playerPos) > PLAYER_MELEE_RANGE) {
        // Selected but out of melee range — don't let playerAttack's fallback
        // silently substitute a different, unrelated nearby victim.
        return;
      }
    }
    this.playerAttack();
  }

  /**
   * Cast a job skill (hotbar 1-4). Only `damage`/`heal`/`buff`/`debuff`/`mark`
   * effects are combat actions — `economy`/`gather`/`utility` skills (haggle,
   * ore sense, pushcart, ...) are handled by the vendor/gather systems instead
   * and are silently ignored here.
   */
  useSkill(skill: SkillDefinition): void {
    if (!this.bridge.isPlayerAlive() || this.skillCooldowns.has(skill.id)) return;

    const { effect } = skill;
    const needsTarget = effect.kind === 'damage' || effect.kind === 'debuff' || effect.kind === 'mark';
    let target: Monster | null = null;
    if (needsTarget) {
      target = this.acquireTarget();
      if (!target) return;
    }

    if (!this.bridge.spendMp(skill.mpCost)) {
      const pos = this.bridge.getPlayerPosition();
      this.floatingText(pos.x, pos.y - 20, 'no MP', '#88aaff');
      return;
    }

    switch (effect.kind) {
      case 'damage':
        this.castDamageSkill(skill, target!);
        break;
      case 'heal': {
        const amount = effect.amount ?? 0;
        this.bridge.healPlayer(amount);
        const pos = this.bridge.getPlayerPosition();
        this.floatingText(pos.x, pos.y - 20, `+${amount}`, '#9fe0a0');
        break;
      }
      case 'buff':
        if (effect.stat) {
          this.bridge.applyPlayerBuff(effect.stat, effect.amount ?? 0, (effect.duration ?? 0) * 1000);
        }
        this.floatingText(this.bridge.getPlayerPosition().x, this.bridge.getPlayerPosition().y - 20, skill.displayName, '#ffe08a');
        break;
      case 'debuff':
        target!.applyDebuff(effect.amount ?? 0, (effect.duration ?? 0) * 1000);
        this.floatingText(target!.x, target!.y, skill.displayName, '#ff9a6a');
        break;
      case 'mark':
        target!.applyMark(effect.amount ?? 0, (effect.duration ?? 0) * 1000);
        this.floatingText(target!.x, target!.y, skill.displayName, '#f0c850');
        break;
      default:
        // economy/gather/utility — not a combat action.
        return;
    }

    this.skillCooldowns.set(skill.id, skill.cooldown * 1000);
  }

  private castDamageSkill(skill: SkillDefinition, target: Monster): void {
    const baseStats = this.bridge.getPlayerStats();
    const stats = skill.element ? { ...baseStats, element: skill.element } : baseStats;
    const defenderStats = target.combatStats();

    if (!rollHit(stats, defenderStats)) {
      this.floatingText(target.x, target.y, 'miss', '#cfd0d8');
      return;
    }

    const base = calcPhysicalDamage(stats, defenderStats, skill.effect.powerMultiplier ?? 1);
    const damage = Math.max(1, Math.round(base * target.markMultiplier()));
    const fatal = target.takeDamage(damage);
    audioService.playSfx('sfx_combat_hit');
    this.floatingText(target.x, target.y, String(damage), '#a8e0ff');

    if (fatal) {
      const def = target.def;
      target.die();
      this.floatingText(target.x, target.y - 8, `${def.displayName} defeated`, '#9fe0a0');
      this.bridge.onMonsterDefeated(def);
      if (this.target === target) {
        this.target = null;
      }
    }
  }

  /** The current lock-on target if still valid, else the nearest alive monster in range. */
  private acquireTarget(): Monster | null {
    const playerPos = this.bridge.getPlayerPosition();
    if (this.target && this.target.isAlive && this.distanceTo(this.target, playerPos) <= TARGET_RADIUS) {
      return this.target;
    }
    return this.nearestAlive(playerPos, TARGET_RADIUS);
  }

  destroy(): void {
    for (const monster of this.monsters) {
      monster.destroy();
    }
    this.monsters.length = 0;
    this.target = null;
    this.bridge.onTargetChanged(null);
  }

  private monsterAttack(monster: Monster): void {
    monster.attackCooldown = MONSTER_ATTACK_COOLDOWN;
    const attackerStats = monster.combatStats();
    const playerStats = this.bridge.getPlayerStats();
    if (!rollHit(attackerStats, playerStats)) {
      const pos = this.bridge.getPlayerPosition();
      this.floatingText(pos.x, pos.y - 20, 'miss', '#cfd0d8');
      return;
    }
    const damage = calcPhysicalDamage(attackerStats, playerStats);
    this.bridge.onPlayerDamaged(damage, monster.def.displayName);
    audioService.playSfx('sfx_combat_hit');
    const pos = this.bridge.getPlayerPosition();
    this.floatingText(pos.x, pos.y - 20, String(damage), '#ff7a6a');
  }

  private refreshTarget(playerPos: Vec2): void {
    if (!this.target || !this.target.isAlive || this.distanceTo(this.target, playerPos) > TARGET_RADIUS) {
      this.target = this.nearestAlive(playerPos, TARGET_RADIUS);
    }

    const key = this.target
      ? `${this.target.def.id}:${Math.round(this.target.x)}:${Math.round(this.target.y)}:${this.target.hpCur}`
      : '';
    if (key === this.lastTargetKey) return;
    this.lastTargetKey = key;

    if (!this.target) {
      this.bridge.onTargetChanged(null);
      return;
    }
    this.bridge.onTargetChanged({
      name: this.target.def.displayName,
      level: this.target.level,
      hpCur: this.target.hpCur,
      hpMax: this.target.hpMax,
      element: this.target.def.element,
    });
  }

  private nearestAlive(from: Vec2, maxDist: number): Monster | null {
    let best: Monster | null = null;
    let bestDist = maxDist;
    for (const monster of this.monsters) {
      if (!monster.isAlive) continue;
      const dist = this.distanceTo(monster, from);
      if (dist <= bestDist) {
        bestDist = dist;
        best = monster;
      }
    }
    return best;
  }

  private distanceTo(monster: Monster, point: Vec2): number {
    return Phaser.Math.Distance.Between(monster.x, monster.y, point.x, point.y);
  }

  private floatingText(x: number, y: number, text: string, color: string): void {
    const label = this.scene.add
      .text(x, y - 14, text, {
        fontFamily: 'sans-serif',
        fontSize: '13px',
        color,
        stroke: '#1a1520',
        strokeThickness: 3,
      })
      .setOrigin(0.5, 1);
    label.setDepth(this.depths.floatingText);
    this.layer.add(label);
    this.scene.tweens.add({
      targets: label,
      y: y - 40,
      alpha: 0,
      duration: 720,
      ease: 'Cubic.easeOut',
      onComplete: () => label.destroy(),
    });
  }
}
