import type { MonsterCatalogEntry } from '../services/worldData.js';
import type { CombatStats } from './formulas.js';

/**
 * Client mirror of `src/data/progression/xpCurve.ts` plus the player-side stat
 * derivation the solo client needs. XP values are expressed *per level* here
 * (the amount to advance from `level` to `level + 1`) which is what the combat
 * loop and HUD bar consume, derived from the cumulative curve.
 */

/** Cumulative XP required to reach a given level, from level 1. */
export function totalXpForLevel(level: number): number {
  if (level <= 1) return 0;
  return Math.floor(100 * level ** 1.8);
}

/** XP needed to advance from `level` to the next level. */
export function xpToNextLevel(level: number): number {
  return Math.max(1, totalXpForLevel(level + 1) - totalXpForLevel(level));
}

export const STARTER_REGION_LEVEL_CAP = 14;

/** XP a defeated monster awards, scaled by its level and durability. */
export function monsterXpReward(monster: MonsterCatalogEntry): number {
  return Math.max(1, Math.round(monster.baseLevel * 6 + monster.hp * 0.35));
}

export interface PlayerVitals {
  hpMax: number;
  mpMax: number;
}

/** Derived max HP/MP for a player level — keeps the HUD bars honest as we level. */
export function playerVitals(level: number): PlayerVitals {
  return {
    hpMax: 40 + level * 12,
    mpMax: 20 + level * 6,
  };
}

/** Derived offensive/defensive profile fed into the shared combat formulas. */
export function playerCombatStats(level: number): CombatStats {
  return {
    level,
    atk: 6 + level * 3,
    def: 2 + Math.floor(level * 1.5),
    hit: level * 2,
    flee: level * 2,
    element: 'neutral',
  };
}
