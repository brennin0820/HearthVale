import type { BiomeDefinition, MapDefinition } from '../../game/data/types.js';

/**
 * Terrain palette used by the world painter.
 *
 * `ground` is the backdrop behind the playable floor, `walkable` is the floor
 * itself, `wall` is the lip drawn over blocking tiles that touch the floor,
 * `grid` draws tile seams, `leaf` tints scattered decoration, and `accent` is
 * the biome highlight shared with portals and the map border.
 */
export interface Palette {
  ground: number;
  walkable: number;
  grid: number;
  leaf: number;
  accent: number;
  wall: number;
}

/** Fallback palettes, used only when a map's biome is missing from `biomes.json`. */
const KIND_PALETTES: Record<string, Palette> = {
  town: { ground: 0x233e36, walkable: 0x456b58, grid: 0x6c8a72, leaf: 0x6f9b67, accent: 0xf5c76b, wall: 0x1b302b },
  field: { ground: 0x294533, walkable: 0x52784c, grid: 0x789260, leaf: 0x88ad61, accent: 0xe8d887, wall: 0x20382b },
  dungeon: { ground: 0x131c22, walkable: 0x33434a, grid: 0x52616a, leaf: 0x596b68, accent: 0x79c4c6, wall: 0x0e151a },
  instance: { ground: 0x2d2435, walkable: 0x554461, grid: 0x756385, leaf: 0x756385, accent: 0xe6b6e8, wall: 0x211a28 },
};

function mix(a: number, b: number, t: number): number {
  const ar = (a >> 16) & 0xff; const ag = (a >> 8) & 0xff; const ab = a & 0xff;
  const br = (b >> 16) & 0xff; const bg = (b >> 8) & 0xff; const bb = b & 0xff;
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const blue = Math.round(ab + (bb - ab) * t);
  return (r << 16) | (g << 8) | blue;
}

const shade = (color: number, amount: number): number => mix(color, 0x000000, amount);
const tint = (color: number, amount: number): number => mix(color, 0xffffff, amount);

export function parseHexColor(value: string, fallback = 0x000000): number {
  const parsed = Number.parseInt(value.replace('#', ''), 16);
  return Number.isFinite(parsed) ? parsed : fallback;
}

/**
 * Expand a biome's two authored colors into the six channels the painter needs.
 *
 * The ramp is calibrated against the hand-tuned palettes this replaces: the
 * authored `groundColor` sits just below the floor tone and `accentColor` is
 * used verbatim. Deriving the rest keeps every biome in `biomes.json` — not
 * just the handful someone remembered to add to the client — on a coherent
 * ramp, and guarantees `wall` reads darker than `walkable` so collision edges
 * stay visible.
 */
export function derivePalette(groundColor: number, accentColor: number): Palette {
  const floor = tint(groundColor, 0.06);
  return {
    ground: shade(groundColor, 0.52),
    walkable: floor,
    grid: tint(groundColor, 0.34),
    leaf: mix(tint(groundColor, 0.22), accentColor, 0.28),
    accent: accentColor,
    wall: shade(groundColor, 0.66),
  };
}

export function paletteForBiome(biome: BiomeDefinition): Palette {
  return derivePalette(parseHexColor(biome.groundColor, 0x294533), parseHexColor(biome.accentColor, 0xe8d887));
}

/**
 * Resolve a map's palette from authored biome data, falling back to the
 * generic per-kind palette only when the biome is absent from `biomes.json`.
 */
export function paletteForMap(map: MapDefinition, biomes: readonly BiomeDefinition[] = []): Palette {
  const biome = biomes.find((candidate) => candidate.id === map.biome);
  if (biome) return paletteForBiome(biome);
  return KIND_PALETTES[map.kind] ?? KIND_PALETTES.field;
}
