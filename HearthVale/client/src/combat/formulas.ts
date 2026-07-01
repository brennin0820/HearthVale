/**
 * Client-side mirror of the HearthVale combat formulas
 * (`src/data/combat/formulas.ts`). Kept in sync by hand — the client owns its
 * own copy of shared math the same way it mirrors world/catalog types, so the
 * Phaser bundle never reaches into the data layer's `.js` modules.
 */

export interface CombatStats {
  atk: number;
  def: number;
  level: number;
  hit: number;
  flee: number;
  element: string;
}

export function calcPhysicalDamage(
  attacker: CombatStats,
  defender: CombatStats,
  skillMultiplier = 1,
): number {
  const raw = attacker.atk * skillMultiplier - defender.def * 0.6;
  const levelFactor = 1 + (attacker.level - defender.level) * 0.02;
  const elemental = elementMultiplier(attacker.element, defender.element);
  return Math.max(1, Math.floor(raw * levelFactor * elemental));
}

export function calcHitChance(attacker: CombatStats, defender: CombatStats): number {
  const base = 80 + attacker.hit - defender.flee;
  return Math.min(95, Math.max(5, base));
}

export function rollHit(attacker: CombatStats, defender: CombatStats, rng: () => number = Math.random): boolean {
  return rng() * 100 < calcHitChance(attacker, defender);
}

export const ELEMENT_MODIFIERS: Record<string, Record<string, number>> = {
  nature: { fungal: 1.25, crystal: 0.85, lunar: 1, neutral: 1 },
  fungal: { nature: 0.85, crystal: 1.1, lunar: 1, neutral: 1 },
  crystal: { nature: 1.15, shadow: 1.2, lunar: 0.9, neutral: 1 },
  shadow: { lunar: 1.25, arcane: 0.9, neutral: 1 },
  lunar: { arcane: 1.15, shadow: 0.85, neutral: 1 },
  arcane: { crystal: 1.1, nature: 1, neutral: 1 },
  wind: { nature: 1.1, neutral: 1 },
  neutral: {},
};

export function elementMultiplier(attackElement: string, defendElement: string): number {
  return ELEMENT_MODIFIERS[attackElement]?.[defendElement] ?? 1;
}
