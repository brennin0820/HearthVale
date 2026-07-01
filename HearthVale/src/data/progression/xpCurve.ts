/** XP required to reach each level (cumulative from level 1). */
export function xpForLevel(level: number): number {
  if (level <= 1) return 0;
  return Math.floor(100 * level ** 1.8);
}

export function levelFromXp(totalXp: number): number {
  let level = 1;
  while (xpForLevel(level + 1) <= totalXp && level < 99) {
    level += 1;
  }
  return level;
}

export const STARTER_REGION_LEVEL_CAP = 14;
