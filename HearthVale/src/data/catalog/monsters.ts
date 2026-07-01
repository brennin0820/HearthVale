import type { MonsterDefinition } from './types.js';

/** Starter-region monster catalog — HearthVale original IP. */
export const MONSTERS: MonsterDefinition[] = [
  { id: 'jellybud', displayName: 'Jellybud', baseLevel: 1, hp: 45, atk: 8, def: 2, size: 'small', element: 'nature' },
  { id: 'spriggle', displayName: 'Spriggle', baseLevel: 2, hp: 55, atk: 10, def: 3, size: 'small', element: 'nature' },
  { id: 'puffshroom', displayName: 'Puffshroom', baseLevel: 3, hp: 70, atk: 12, def: 4, size: 'small', element: 'fungal' },
  { id: 'sporeling', displayName: 'Sporeling', baseLevel: 4, hp: 85, atk: 14, def: 5, size: 'small', element: 'fungal' },
  { id: 'leafsprite', displayName: 'Leafsprite', baseLevel: 5, hp: 95, atk: 16, def: 6, size: 'small', element: 'nature' },
  { id: 'barkling', displayName: 'Barkling', baseLevel: 6, hp: 110, atk: 18, def: 8, size: 'medium', element: 'nature' },
  { id: 'roadjack', displayName: 'Roadjack', baseLevel: 8, hp: 130, atk: 22, def: 10, size: 'medium', element: 'neutral' },
  { id: 'windmite', displayName: 'Windmite', baseLevel: 9, hp: 120, atk: 24, def: 8, size: 'small', element: 'wind' },
  { id: 'shardling', displayName: 'Shardling', baseLevel: 7, hp: 100, atk: 20, def: 12, size: 'small', element: 'crystal' },
  { id: 'cavebat', displayName: 'Cavebat', baseLevel: 8, hp: 90, atk: 21, def: 6, size: 'small', element: 'neutral' },
  { id: 'crystal_golem', displayName: 'Crystal Golem', baseLevel: 11, hp: 220, atk: 28, def: 18, size: 'large', element: 'crystal' },
  { id: 'vein_wraith', displayName: 'Vein Wraith', baseLevel: 12, hp: 160, atk: 32, def: 10, size: 'medium', element: 'shadow' },
  { id: 'moonmoth', displayName: 'Moonmoth', baseLevel: 10, hp: 105, atk: 19, def: 7, size: 'small', element: 'lunar' },
  { id: 'glade_stalker', displayName: 'Glade Stalker', baseLevel: 11, hp: 150, atk: 26, def: 11, size: 'medium', element: 'nature' },
  { id: 'rune_sentinel', displayName: 'Rune Sentinel', baseLevel: 13, hp: 200, atk: 30, def: 16, size: 'large', element: 'arcane' },
  { id: 'moonwell_guardian', displayName: 'Moonwell Guardian', baseLevel: 14, hp: 320, atk: 36, def: 20, size: 'large', element: 'lunar' },
];

export const MONSTER_BY_ID = new Map(MONSTERS.map((m) => [m.id, m]));
