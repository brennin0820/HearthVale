import type { GridSize, Rect, Vec2 } from './types.js';
import { scaleGrid, scaleTile } from './mapScale.js';
import { RO_MAP_ART_BY_ID, RO_MAP_POINTS, RO_SAFE_ZONES } from './roMapArt.js';

const TILE_SIZE = 32;

export type MapPropKind =
  | 'path'
  | 'plaza'
  | 'building'
  | 'tree'
  | 'fence'
  | 'fountain'
  | 'stall'
  | 'crate'
  | 'sign'
  | 'planter'
  | 'gate'
  | 'lantern'
  | 'crystal'
  | 'rift'
  | 'training_dummy';

export type MapPropShape = 'rect' | 'ellipse';

export interface MapPropDefinition {
  id: string;
  kind: MapPropKind;
  x: number;
  y: number;
  width: number;
  height: number;
  shape?: MapPropShape;
  label?: string;
  fillColor?: number;
  accentColor?: number;
  alpha?: number;
}

export interface CollisionMaskDefinition {
  mapId: string;
  tileSize: number;
  walkable: boolean[][];
}

export interface PropLayerDefinition {
  mapId: string;
  props: MapPropDefinition[];
}

export interface MapArtDefinition {
  collision: CollisionMaskDefinition;
  props: PropLayerDefinition;
}

interface TilePropSpec {
  id: string;
  kind: MapPropKind;
  col: number;
  row: number;
  width: number;
  height: number;
  shape?: MapPropShape;
  label?: string;
  fillColor?: number;
  accentColor?: number;
  alpha?: number;
  solid?: boolean;
}

const HEARTHVALE_TOWN_GRID: GridSize = scaleGrid({ width: 48, height: 36 });
export const EMBERGLASS_SHELF_GRID: GridSize = scaleGrid({ width: 56, height: 40 });
export const HOLLOW_KILN_GRID: GridSize = scaleGrid({ width: 48, height: 42 });
export const LANTERNSPIRE_SUMMIT_GRID: GridSize = scaleGrid({ width: 52, height: 38 });
export const AFTERLIGHT_EXPANSE_GRID: GridSize = scaleGrid({ width: 58, height: 42 });
export const DAWNSHORE_CAMP_GRID: GridSize = scaleGrid({ width: 46, height: 34 });
export const GLASSWIND_COAST_GRID: GridSize = scaleGrid({ width: 58, height: 42 });
export const TIDEBREAK_CAUSEWAY_GRID: GridSize = scaleGrid({ width: 60, height: 40 });
export const STORMGLASS_RELIQUARY_GRID: GridSize = scaleGrid({ width: 52, height: 38 });
export const BEACONFALL_CLIFFS_GRID: GridSize = scaleGrid({ width: 60, height: 42 });
export const SUNSPIRE_OBSERVATORY_GRID: GridSize = scaleGrid({ width: 54, height: 40 });
export const AURORA_HIGHLANDS_GRID: GridSize = scaleGrid({ width: 60, height: 44 });
export const ZENITH_ARCHIVE_GRID: GridSize = scaleGrid({ width: 54, height: 42 });
export const CHOIRWOOD_CANOPY_GRID: GridSize = scaleGrid({ width: 60, height: 44 });
export const CROWNROOT_SANCTUM_GRID: GridSize = scaleGrid({ width: 54, height: 42 });
export const RUNEVEIL_GARDENS_GRID: GridSize = scaleGrid({ width: 60, height: 44 });
export const NAMESONG_VAULT_GRID: GridSize = scaleGrid({ width: 54, height: 42 });
export const WAYSTAR_MOOR_GRID: GridSize = scaleGrid({ width: 60, height: 44 });
export const CONVERGENCE_SPIRE_GRID: GridSize = scaleGrid({ width: 54, height: 42 });

function createWalkableGrid(gridSize: GridSize): boolean[][] {
  return Array.from({ length: gridSize.height }, () => Array.from({ length: gridSize.width }, () => true));
}

function setWalkableRect(
  grid: boolean[][],
  col: number,
  row: number,
  width: number,
  height: number,
  walkable: boolean,
): void {
  for (let y = row; y < row + height; y += 1) {
    for (let x = col; x < col + width; x += 1) {
      if (grid[y]?.[x] !== undefined) {
        grid[y][x] = walkable;
      }
    }
  }
}

/** Paint a rect authored in design-tile space onto the scaled collision grid. */
function setWalkableDesignRect(
  grid: boolean[][],
  col: number,
  row: number,
  width: number,
  height: number,
  walkable: boolean,
): void {
  setWalkableRect(grid, scaleTile(col), scaleTile(row), scaleTile(width), scaleTile(height), walkable);
}

/** Open a west/east border gate; X stays on the scaled border, Y/H use design tiles. */
function openBorderGate(
  grid: boolean[][],
  gridSize: GridSize,
  side: 'west' | 'east',
  designRow: number,
  designHeight: number,
): void {
  const col = side === 'west' ? 0 : gridSize.width - 2;
  setWalkableRect(grid, col, scaleTile(designRow), 2, scaleTile(designHeight), true);
}

function worldPointFromTile(gridSize: GridSize, col: number, row: number): Vec2 {
  const scaledCol = scaleTile(col);
  const scaledRow = scaleTile(row);
  const halfW = (gridSize.width * TILE_SIZE) / 2;
  const halfH = (gridSize.height * TILE_SIZE) / 2;
  return {
    x: -halfW + scaledCol * TILE_SIZE + TILE_SIZE / 2,
    y: -halfH + scaledRow * TILE_SIZE + TILE_SIZE / 2,
  };
}

function worldRectFromTiles(gridSize: GridSize, col: number, row: number, width: number, height: number): Rect {
  const scaledCol = scaleTile(col);
  const scaledRow = scaleTile(row);
  const scaledWidth = scaleTile(width);
  const scaledHeight = scaleTile(height);
  const halfW = (gridSize.width * TILE_SIZE) / 2;
  const halfH = (gridSize.height * TILE_SIZE) / 2;
  return {
    x: -halfW + scaledCol * TILE_SIZE,
    y: -halfH + scaledRow * TILE_SIZE,
    width: scaledWidth * TILE_SIZE,
    height: scaledHeight * TILE_SIZE,
  };
}

function propFromTiles(gridSize: GridSize, spec: TilePropSpec): MapPropDefinition {
  const rect = worldRectFromTiles(gridSize, spec.col, spec.row, spec.width, spec.height);
  return {
    id: spec.id,
    kind: spec.kind,
    x: rect.x + rect.width / 2,
    y: rect.y + rect.height / 2,
    width: rect.width,
    height: rect.height,
    shape: spec.shape,
    label: spec.label,
    fillColor: spec.fillColor,
    accentColor: spec.accentColor,
    alpha: spec.alpha,
  };
}

function buildEmberglassShelfArt(): MapArtDefinition {
  const mapId = 'emberglass_shelf';
  const gridSize = EMBERGLASS_SHELF_GRID;
  const grid = createWalkableGrid(gridSize);
  setWalkableRect(grid, 0, 0, gridSize.width, 2, false);
  setWalkableRect(grid, 0, gridSize.height - 2, gridSize.width, 2, false);
  setWalkableRect(grid, 0, 0, 2, gridSize.height, false);
  setWalkableRect(grid, gridSize.width - 2, 0, 2, gridSize.height, false);
  openBorderGate(grid, gridSize, 'west', 18, 5);
  openBorderGate(grid, gridSize, 'east', 18, 5);

  const groundProps: TilePropSpec[] = [
    { id: 'shelf_main_path', kind: 'path', col: 1, row: 18, width: 54, height: 5, fillColor: 0x71654f, accentColor: 0xe8b969, alpha: 0.82 },
    { id: 'orla_workyard', kind: 'plaza', col: 6, row: 13, width: 10, height: 10, fillColor: 0x665f53, accentColor: 0xf0c979, alpha: 0.82 },
    { id: 'north_switchback', kind: 'path', col: 16, row: 8, width: 5, height: 12, fillColor: 0x5d5a50, accentColor: 0xc9a566, alpha: 0.72 },
    { id: 'south_switchback', kind: 'path', col: 35, row: 20, width: 5, height: 13, fillColor: 0x5d5a50, accentColor: 0xc9a566, alpha: 0.72 },
  ];
  const crystalAnchors = [
    [4, 5, 3, 4], [9, 7, 2, 3], [15, 3, 3, 5], [22, 7, 2, 4], [29, 4, 3, 5], [37, 7, 2, 4], [45, 4, 3, 5], [50, 9, 2, 3],
    [4, 29, 3, 4], [11, 32, 2, 3], [18, 27, 3, 5], [25, 31, 2, 4], [31, 27, 3, 4], [42, 31, 3, 4], [49, 27, 2, 5],
  ] as const;
  const solidProps: TilePropSpec[] = crystalAnchors.map(([col, row, width, height], index) => ({
    id: `shelf_crystal_${index + 1}`, kind: 'crystal', col, row, width, height,
    fillColor: index % 3 === 0 ? 0xde7b54 : 0x68b9b6, accentColor: 0xffdf91, alpha: 0.92, solid: true,
  }));
  solidProps.push(
    { id: 'north_heat_rift', kind: 'rift', col: 25, row: 10, width: 7, height: 4, shape: 'ellipse', fillColor: 0x7f352c, accentColor: 0xffaa55, alpha: 0.9, solid: true },
    { id: 'south_heat_rift', kind: 'rift', col: 12, row: 25, width: 6, height: 4, shape: 'ellipse', fillColor: 0x71332c, accentColor: 0xf69a4d, alpha: 0.88, solid: true },
    { id: 'east_heat_rift', kind: 'rift', col: 44, row: 24, width: 6, height: 4, shape: 'ellipse', fillColor: 0x71332c, accentColor: 0xf69a4d, alpha: 0.88, solid: true },
  );
  const detailProps: TilePropSpec[] = [
    { id: 'shelf_west_gate', kind: 'gate', col: 1, row: 18, width: 2, height: 5, fillColor: 0x8f7452, accentColor: 0xf3d58b, alpha: 0.9 },
    { id: 'kiln_gate', kind: 'gate', col: 53, row: 18, width: 2, height: 5, fillColor: 0x8f5e45, accentColor: 0xffba66, alpha: 0.95 },
    { id: 'orla_sign', kind: 'sign', col: 8, row: 14, width: 2, height: 1, fillColor: 0x815d3e, accentColor: 0xeed08a, alpha: 1 },
    ...[12, 20, 29, 38, 47].map((col, index): TilePropSpec => ({
      id: `shelf_lantern_${index + 1}`, kind: 'lantern', col, row: 17, width: 1, height: 2,
      fillColor: 0xb95e38, accentColor: 0xffd477, alpha: 0.95,
    })),
  ];
  for (const spec of solidProps) setWalkableDesignRect(grid, spec.col, spec.row, spec.width, spec.height, false);
  return {
    collision: { mapId, tileSize: TILE_SIZE, walkable: grid },
    props: { mapId, props: [...groundProps, ...solidProps, ...detailProps].map((spec) => propFromTiles(gridSize, spec)) },
  };
}

function buildHollowKilnArt(): MapArtDefinition {
  const mapId = 'hollow_kiln';
  const gridSize = HOLLOW_KILN_GRID;
  const grid = createWalkableGrid(gridSize);
  setWalkableRect(grid, 0, 0, gridSize.width, 2, false);
  setWalkableRect(grid, 0, gridSize.height - 2, gridSize.width, 2, false);
  setWalkableRect(grid, 0, 0, 2, gridSize.height, false);
  setWalkableRect(grid, gridSize.width - 2, 0, 2, gridSize.height, false);
  openBorderGate(grid, gridSize, 'west', 19, 5);
  openBorderGate(grid, gridSize, 'east', 19, 5);

  const groundProps: TilePropSpec[] = [
    { id: 'kiln_entry_walk', kind: 'path', col: 1, row: 19, width: 16, height: 5, fillColor: 0x574b47, accentColor: 0xd18a58, alpha: 0.86 },
    { id: 'kiln_upper_walk', kind: 'path', col: 14, row: 8, width: 6, height: 14, fillColor: 0x514846, accentColor: 0xca8051, alpha: 0.78 },
    { id: 'kiln_lower_walk', kind: 'path', col: 18, row: 27, width: 16, height: 5, fillColor: 0x514846, accentColor: 0xca8051, alpha: 0.78 },
    { id: 'kiln_boss_road', kind: 'path', col: 30, row: 19, width: 10, height: 5, fillColor: 0x574744, accentColor: 0xe09355, alpha: 0.82 },
    { id: 'kilnheart_dais', kind: 'plaza', col: 38, row: 14, width: 8, height: 14, shape: 'ellipse', fillColor: 0x493b3d, accentColor: 0xffb062, alpha: 0.9 },
  ];
  const crystalAnchors = [
    [5, 5, 3, 4], [10, 11, 2, 5], [15, 3, 3, 4], [23, 7, 2, 4], [29, 3, 3, 5], [36, 7, 2, 4], [42, 4, 3, 5],
    [5, 31, 3, 4], [11, 27, 2, 5], [16, 34, 3, 4], [25, 32, 3, 5], [34, 34, 2, 4], [42, 31, 3, 5],
  ] as const;
  const solidProps: TilePropSpec[] = crystalAnchors.map(([col, row, width, height], index) => ({
    id: `kiln_crystal_${index + 1}`, kind: 'crystal', col, row, width, height,
    fillColor: index % 2 === 0 ? 0xb94f3f : 0x5f777c, accentColor: 0xffbd6b, alpha: 0.94, solid: true,
  }));
  solidProps.push(
    { id: 'kiln_rift_north', kind: 'rift', col: 18, row: 11, width: 8, height: 5, shape: 'ellipse', fillColor: 0x682521, accentColor: 0xff7b3d, alpha: 0.94, solid: true },
    { id: 'kiln_rift_center', kind: 'rift', col: 24, row: 20, width: 7, height: 5, shape: 'ellipse', fillColor: 0x762923, accentColor: 0xff8b42, alpha: 0.94, solid: true },
    { id: 'kiln_rift_south', kind: 'rift', col: 34, row: 27, width: 7, height: 5, shape: 'ellipse', fillColor: 0x682521, accentColor: 0xff7b3d, alpha: 0.94, solid: true },
  );
  const detailProps: TilePropSpec[] = [
    { id: 'kiln_return_gate', kind: 'gate', col: 1, row: 19, width: 2, height: 5, fillColor: 0x7b5949, accentColor: 0xf0ba76, alpha: 0.94 },
    ...[7, 14, 22, 30, 37, 44].map((col, index): TilePropSpec => ({
      id: `kiln_lantern_${index + 1}`, kind: 'lantern', col, row: index % 2 === 0 ? 18 : 23, width: 1, height: 2,
      fillColor: 0xad4834, accentColor: 0xffc26f, alpha: 0.95,
    })),
  ];
  for (const spec of solidProps) setWalkableDesignRect(grid, spec.col, spec.row, spec.width, spec.height, false);
  return {
    collision: { mapId, tileSize: TILE_SIZE, walkable: grid },
    props: { mapId, props: [...groundProps, ...solidProps, ...detailProps].map((spec) => propFromTiles(gridSize, spec)) },
  };
}

function buildLanternspireSummitArt(): MapArtDefinition {
  const mapId = 'lanternspire_summit';
  const gridSize = LANTERNSPIRE_SUMMIT_GRID;
  const grid = createWalkableGrid(gridSize);
  setWalkableRect(grid, 0, 0, gridSize.width, 2, false);
  setWalkableRect(grid, 0, gridSize.height - 2, gridSize.width, 2, false);
  setWalkableRect(grid, 0, 0, 2, gridSize.height, false);
  setWalkableRect(grid, gridSize.width - 2, 0, 2, gridSize.height, false);
  openBorderGate(grid, gridSize, 'west', 17, 5);
  openBorderGate(grid, gridSize, 'east', 17, 5);

  const groundProps: TilePropSpec[] = [
    { id: 'spire_entry_causeway', kind: 'path', col: 1, row: 17, width: 18, height: 5, fillColor: 0x53636a, accentColor: 0xe7c96e, alpha: 0.9 },
    { id: 'spire_crossing', kind: 'plaza', col: 15, row: 13, width: 17, height: 13, shape: 'ellipse', fillColor: 0x3b5158, accentColor: 0x8bd6c0, alpha: 0.82 },
    { id: 'spire_north_arc', kind: 'path', col: 22, row: 8, width: 18, height: 4, fillColor: 0x465a62, accentColor: 0xb9d8cc, alpha: 0.78 },
    { id: 'spire_south_arc', kind: 'path', col: 22, row: 27, width: 18, height: 4, fillColor: 0x465a62, accentColor: 0xb9d8cc, alpha: 0.78 },
    { id: 'star_crown_dais', kind: 'plaza', col: 36, row: 10, width: 13, height: 19, shape: 'ellipse', fillColor: 0x35454f, accentColor: 0xf2d77d, alpha: 0.94 },
  ];
  const crystalAnchors = [
    [4, 4, 3, 4], [10, 7, 2, 3], [16, 3, 3, 5], [23, 5, 2, 4], [30, 3, 3, 5], [38, 4, 2, 4], [46, 5, 3, 5],
    [4, 29, 3, 4], [11, 28, 2, 5], [17, 31, 3, 4], [24, 29, 2, 4], [31, 32, 3, 4], [40, 30, 2, 4], [47, 28, 3, 5],
  ] as const;
  const solidProps: TilePropSpec[] = crystalAnchors.map(([col, row, width, height], index) => ({
    id: `spire_crystal_${index + 1}`, kind: 'crystal', col, row, width, height,
    fillColor: index % 3 === 0 ? 0x79c9bd : index % 3 === 1 ? 0xc5a7dc : 0xe8ca73,
    accentColor: 0xf7edbd, alpha: 0.95, solid: true,
  }));
  solidProps.push(
    { id: 'gloam_rift_north', kind: 'rift', col: 18, row: 9, width: 6, height: 3, shape: 'ellipse', fillColor: 0x34283f, accentColor: 0xa979c4, alpha: 0.92, solid: true },
    { id: 'gloam_rift_south', kind: 'rift', col: 20, row: 26, width: 7, height: 3, shape: 'ellipse', fillColor: 0x34283f, accentColor: 0xa979c4, alpha: 0.92, solid: true },
    { id: 'gloam_rift_dais_north', kind: 'rift', col: 37, row: 11, width: 3, height: 3, shape: 'ellipse', fillColor: 0x2c2238, accentColor: 0xbc83d4, alpha: 0.9, solid: true },
    { id: 'gloam_rift_dais_south', kind: 'rift', col: 37, row: 25, width: 3, height: 3, shape: 'ellipse', fillColor: 0x2c2238, accentColor: 0xbc83d4, alpha: 0.9, solid: true },
  );
  const detailProps: TilePropSpec[] = [
    { id: 'summit_return_gate', kind: 'gate', col: 1, row: 17, width: 2, height: 5, fillColor: 0x65777c, accentColor: 0xf3dc8b, alpha: 0.96 },
    { id: 'afterlight_gate', kind: 'gate', col: 49, row: 17, width: 2, height: 5, fillColor: 0x758f8b, accentColor: 0xffe79a, alpha: 0.98 },
    { id: 'accord_marker', kind: 'sign', col: 14, row: 15, width: 2, height: 1, label: 'MOON AND EMBER, ONE LIGHT', fillColor: 0x58656a, accentColor: 0xf1d783, alpha: 1 },
    { id: 'crown_marker', kind: 'sign', col: 34, row: 19, width: 1, height: 2, label: 'THE LAST LIGHT WAITS', fillColor: 0x4b4d5e, accentColor: 0xd9bc79, alpha: 1 },
    ...[7, 12, 18, 25, 31].map((col, index): TilePropSpec => ({
      id: `spire_causeway_lantern_${index + 1}`, kind: 'lantern', col, row: index % 2 === 0 ? 16 : 22, width: 1, height: 2,
      fillColor: 0x6f8e8a, accentColor: 0xffe18a, alpha: 0.98,
    })),
    ...[[38, 16], [42, 13], [46, 16], [38, 22], [42, 25], [46, 22]].map(([col, row], index): TilePropSpec => ({
      id: `crown_dais_lantern_${index + 1}`, kind: 'lantern', col, row, width: 1, height: 2,
      fillColor: 0x806d93, accentColor: 0xffe8a0, alpha: 1,
    })),
  ];
  for (const spec of solidProps) setWalkableDesignRect(grid, spec.col, spec.row, spec.width, spec.height, false);
  return {
    collision: { mapId, tileSize: TILE_SIZE, walkable: grid },
    props: { mapId, props: [...groundProps, ...solidProps, ...detailProps].map((spec) => propFromTiles(gridSize, spec)) },
  };
}

function buildAfterlightExpanseArt(): MapArtDefinition {
  const mapId = 'afterlight_expanse';
  const gridSize = AFTERLIGHT_EXPANSE_GRID;
  const grid = createWalkableGrid(gridSize);
  setWalkableRect(grid, 0, 0, gridSize.width, 2, false);
  setWalkableRect(grid, 0, gridSize.height - 2, gridSize.width, 2, false);
  setWalkableRect(grid, 0, 0, 2, gridSize.height, false);
  setWalkableRect(grid, gridSize.width - 2, 0, 2, gridSize.height, false);
  openBorderGate(grid, gridSize, 'west', 19, 5);
  openBorderGate(grid, gridSize, 'east', 19, 5);

  const groundProps: TilePropSpec[] = [
    { id: 'afterlight_entry', kind: 'path', col: 1, row: 19, width: 17, height: 5, fillColor: 0x53686a, accentColor: 0xf1ce73, alpha: 0.9 },
    { id: 'afterlight_crossroads', kind: 'plaza', col: 14, row: 14, width: 17, height: 15, shape: 'ellipse', fillColor: 0x40595a, accentColor: 0x8fd3c2, alpha: 0.84 },
    { id: 'sunshard_walk', kind: 'path', col: 25, row: 7, width: 5, height: 13, fillColor: 0x465f61, accentColor: 0xe8d58e, alpha: 0.78 },
    { id: 'voidglass_walk', kind: 'path', col: 26, row: 23, width: 5, height: 13, fillColor: 0x3e5058, accentColor: 0xb2a1cf, alpha: 0.78 },
    { id: 'sentinel_causeway', kind: 'path', col: 29, row: 19, width: 18, height: 5, fillColor: 0x4a5c61, accentColor: 0xc8d09e, alpha: 0.84 },
    { id: 'eclipse_dais', kind: 'plaza', col: 44, row: 11, width: 11, height: 21, shape: 'ellipse', fillColor: 0x34464d, accentColor: 0xf0d279, alpha: 0.94 },
  ];
  const crystalAnchors = [
    [4, 4, 3, 5], [10, 7, 2, 4], [16, 3, 3, 5], [23, 6, 2, 4], [30, 3, 3, 5], [38, 6, 2, 4], [46, 3, 3, 5], [53, 7, 2, 4],
    [4, 33, 3, 5], [11, 30, 2, 4], [17, 34, 3, 4], [24, 31, 2, 5], [32, 34, 3, 4], [40, 31, 2, 5], [48, 34, 3, 4], [53, 29, 2, 5],
  ] as const;
  const solidProps: TilePropSpec[] = crystalAnchors.map(([col, row, width, height], index) => ({
    id: `afterlight_crystal_${index + 1}`, kind: 'crystal', col, row, width, height,
    fillColor: index % 3 === 0 ? 0xf0c966 : index % 3 === 1 ? 0x72c8ba : 0x9d8abf,
    accentColor: 0xfff1b5, alpha: 0.96, solid: true,
  }));
  solidProps.push(
    { id: 'afterlight_rift_north', kind: 'rift', col: 18, row: 9, width: 6, height: 4, shape: 'ellipse', fillColor: 0x2d283e, accentColor: 0x9c79c3, alpha: 0.92, solid: true },
    { id: 'afterlight_rift_south', kind: 'rift', col: 19, row: 28, width: 7, height: 4, shape: 'ellipse', fillColor: 0x29283d, accentColor: 0x8d76bc, alpha: 0.92, solid: true },
    { id: 'afterlight_rift_east', kind: 'rift', col: 34, row: 13, width: 6, height: 4, shape: 'ellipse', fillColor: 0x2b293e, accentColor: 0xa37cc4, alpha: 0.94, solid: true },
    { id: 'eclipse_well', kind: 'rift', col: 47, row: 18, width: 6, height: 6, shape: 'ellipse', fillColor: 0x242b36, accentColor: 0xf0ce75, alpha: 0.94, solid: true },
  );
  const detailProps: TilePropSpec[] = [
    { id: 'afterlight_return_gate', kind: 'gate', col: 1, row: 19, width: 2, height: 5, fillColor: 0x6d8583, accentColor: 0xffe493, alpha: 0.98 },
    { id: 'dawnshore_gate', kind: 'gate', col: 55, row: 19, width: 2, height: 5, fillColor: 0x75958d, accentColor: 0xffe89a, alpha: 0.98 },
    { id: 'afterlight_marker', kind: 'sign', col: 13, row: 18, width: 2, height: 1, label: 'KEEP THE NEW DAWN', fillColor: 0x566a68, accentColor: 0xf3d783, alpha: 1 },
    { id: 'eclipse_marker', kind: 'sign', col: 43, row: 20, width: 1, height: 2, label: 'WHERE LIGHT CASTS ITS LAST SHADOW', fillColor: 0x4d5262, accentColor: 0xf0ce7d, alpha: 1 },
    ...[7, 13, 20, 27, 34, 41].map((col, index): TilePropSpec => ({
      id: `afterlight_lantern_${index + 1}`, kind: 'lantern', col, row: index % 2 === 0 ? 18 : 24, width: 1, height: 2,
      fillColor: 0x658d87, accentColor: 0xffe48b, alpha: 0.98,
    })),
    ...[[45, 14], [50, 12], [54, 17], [45, 27], [50, 30], [54, 24]].map(([col, row], index): TilePropSpec => ({
      id: `eclipse_lantern_${index + 1}`, kind: 'lantern', col, row, width: 1, height: 2,
      fillColor: 0x7f7292, accentColor: 0xffeaa0, alpha: 1,
    })),
  ];
  for (const spec of solidProps) setWalkableDesignRect(grid, spec.col, spec.row, spec.width, spec.height, false);
  return {
    collision: { mapId, tileSize: TILE_SIZE, walkable: grid },
    props: { mapId, props: [...groundProps, ...solidProps, ...detailProps].map((spec) => propFromTiles(gridSize, spec)) },
  };
}

function buildDawnshoreCampArt(): MapArtDefinition {
  const mapId = 'dawnshore_camp';
  const gridSize = DAWNSHORE_CAMP_GRID;
  const grid = createWalkableGrid(gridSize);
  setWalkableRect(grid, 0, 0, gridSize.width, 2, false);
  setWalkableRect(grid, 0, gridSize.height - 2, gridSize.width, 2, false);
  setWalkableRect(grid, 0, 0, 2, gridSize.height, false);
  setWalkableRect(grid, gridSize.width - 2, 0, 2, gridSize.height, false);
  openBorderGate(grid, gridSize, 'west', 14, 5);
  openBorderGate(grid, gridSize, 'east', 14, 5);

  const groundProps: TilePropSpec[] = [
    { id: 'dawnshore_main_road', kind: 'path', col: 1, row: 14, width: 44, height: 5, fillColor: 0x647274, accentColor: 0xe6cc82, alpha: 0.92 },
    { id: 'dawnshore_camp_green', kind: 'plaza', col: 13, row: 8, width: 17, height: 18, shape: 'ellipse', fillColor: 0x416864, accentColor: 0x8fc9aa, alpha: 0.84 },
    { id: 'dawnshore_inn_walk', kind: 'path', col: 8, row: 8, width: 5, height: 9, fillColor: 0x5d6c6b, accentColor: 0xd5bc7a, alpha: 0.82 },
    { id: 'dawnshore_market', kind: 'plaza', col: 28, row: 10, width: 11, height: 13, fillColor: 0x486665, accentColor: 0xe1c16f, alpha: 0.86 },
    { id: 'dawnshore_watch_walk', kind: 'path', col: 20, row: 5, width: 5, height: 10, fillColor: 0x536968, accentColor: 0xb7cfaa, alpha: 0.76 },
  ];
  const solidProps: TilePropSpec[] = [
    { id: 'dawnshore_inn', kind: 'building', col: 3, row: 3, width: 10, height: 5, label: 'WAYREST INN', fillColor: 0x566d69, accentColor: 0xe0bd72, alpha: 0.96, solid: true },
    { id: 'dawnshore_watchhouse', kind: 'building', col: 17, row: 2, width: 11, height: 6, label: 'TIDEWATCH', fillColor: 0x4b6465, accentColor: 0x9dcfbd, alpha: 0.96, solid: true },
    { id: 'dawnshore_supply', kind: 'building', col: 32, row: 3, width: 9, height: 7, label: 'COAST SUPPLY', fillColor: 0x586565, accentColor: 0xe5c878, alpha: 0.96, solid: true },
    { id: 'dawnshore_storehouse', kind: 'building', col: 34, row: 25, width: 8, height: 5, label: 'STOREHOUSE', fillColor: 0x4d6261, accentColor: 0xb0c9a5, alpha: 0.94, solid: true },
    { id: 'dawnshore_well', kind: 'fountain', col: 19, row: 13, width: 5, height: 5, shape: 'ellipse', fillColor: 0x4d8b94, accentColor: 0xbce8dc, alpha: 0.9, solid: true },
    ...[[3, 24], [7, 28], [12, 26], [17, 29], [25, 27], [29, 30], [42, 13], [42, 20]].map(([col, row], index): TilePropSpec => ({
      id: `dawnshore_windtree_${index + 1}`, kind: 'tree', col, row, width: 2, height: 3,
      fillColor: 0x35655b, accentColor: 0x8fc595, alpha: 0.95, solid: true,
    })),
  ];
  const detailProps: TilePropSpec[] = [
    { id: 'afterlight_camp_gate', kind: 'gate', col: 1, row: 14, width: 2, height: 5, fillColor: 0x718987, accentColor: 0xffe28c, alpha: 0.98 },
    { id: 'glasswind_camp_gate', kind: 'gate', col: 43, row: 14, width: 2, height: 5, fillColor: 0x6b8d8d, accentColor: 0xbcefe2, alpha: 0.98 },
    { id: 'dawnshore_notice', kind: 'sign', col: 15, row: 12, width: 2, height: 1, label: 'DAWNSHORE REACH', fillColor: 0x566867, accentColor: 0xf0d58a, alpha: 1 },
    { id: 'dawnshore_market_stall_1', kind: 'stall', col: 29, row: 11, width: 3, height: 2, fillColor: 0x617674, accentColor: 0xe5bd67, alpha: 0.96 },
    { id: 'dawnshore_market_stall_2', kind: 'stall', col: 35, row: 19, width: 3, height: 2, fillColor: 0x617674, accentColor: 0x86c5b2, alpha: 0.96 },
    { id: 'dawnshore_crates_1', kind: 'crate', col: 31, row: 24, width: 2, height: 2, fillColor: 0x75664f, accentColor: 0xd9bd7c, alpha: 0.96 },
    { id: 'dawnshore_crates_2', kind: 'crate', col: 39, row: 22, width: 2, height: 2, fillColor: 0x75664f, accentColor: 0xd9bd7c, alpha: 0.96 },
    ...[6, 11, 16, 27, 33, 39].map((col, index): TilePropSpec => ({
      id: `dawnshore_lantern_${index + 1}`, kind: 'lantern', col, row: index % 2 === 0 ? 13 : 19, width: 1, height: 2,
      fillColor: 0x648984, accentColor: 0xffdf7d, alpha: 0.98,
    })),
  ];
  for (const spec of solidProps) setWalkableDesignRect(grid, spec.col, spec.row, spec.width, spec.height, false);
  return {
    collision: { mapId, tileSize: TILE_SIZE, walkable: grid },
    props: { mapId, props: [...groundProps, ...solidProps, ...detailProps].map((spec) => propFromTiles(gridSize, spec)) },
  };
}

function buildGlasswindCoastArt(): MapArtDefinition {
  const mapId = 'glasswind_coast';
  const gridSize = GLASSWIND_COAST_GRID;
  const grid = createWalkableGrid(gridSize);
  setWalkableRect(grid, 0, 0, gridSize.width, 2, false);
  setWalkableRect(grid, 0, gridSize.height - 2, gridSize.width, 2, false);
  setWalkableRect(grid, 0, 0, 2, gridSize.height, false);
  setWalkableRect(grid, gridSize.width - 2, 0, 2, gridSize.height, false);
  openBorderGate(grid, gridSize, 'west', 19, 5);
  openBorderGate(grid, gridSize, 'east', 19, 5);

  const groundProps: TilePropSpec[] = [
    { id: 'glasswind_entry', kind: 'path', col: 1, row: 19, width: 18, height: 5, fillColor: 0x607478, accentColor: 0xdacb88, alpha: 0.9 },
    { id: 'glasswind_tidecourt', kind: 'plaza', col: 14, row: 12, width: 17, height: 18, shape: 'ellipse', fillColor: 0x3e6267, accentColor: 0x80c9c2, alpha: 0.84 },
    { id: 'glasswind_north_walk', kind: 'path', col: 26, row: 7, width: 5, height: 14, fillColor: 0x4e696d, accentColor: 0xb8d2b2, alpha: 0.78 },
    { id: 'glasswind_south_walk', kind: 'path', col: 27, row: 23, width: 5, height: 13, fillColor: 0x4b656a, accentColor: 0xc9ba80, alpha: 0.78 },
    { id: 'glasswind_beacon_road', kind: 'path', col: 29, row: 19, width: 18, height: 5, fillColor: 0x536d70, accentColor: 0xdacb82, alpha: 0.84 },
    { id: 'glasswind_tidebreak_road', kind: 'path', col: 51, row: 19, width: 7, height: 5, fillColor: 0x586f72, accentColor: 0x8ed8cf, alpha: 0.88 },
    { id: 'meridian_dais', kind: 'plaza', col: 44, row: 10, width: 11, height: 22, shape: 'ellipse', fillColor: 0x324f58, accentColor: 0x8ed7d0, alpha: 0.94 },
  ];
  const glassAnchors = [
    [4, 4, 3, 5], [10, 7, 2, 4], [16, 3, 3, 5], [23, 6, 2, 4], [31, 3, 3, 5], [38, 6, 2, 4], [46, 3, 3, 5], [53, 7, 2, 4],
    [4, 33, 3, 5], [11, 30, 2, 4], [17, 34, 3, 4], [24, 31, 2, 5], [33, 34, 3, 4], [41, 31, 2, 5], [49, 34, 3, 4], [54, 29, 2, 5],
  ] as const;
  const solidProps: TilePropSpec[] = glassAnchors.map(([col, row, width, height], index) => ({
    id: `glasswind_spire_${index + 1}`, kind: 'crystal', col, row, width, height,
    fillColor: index % 3 === 0 ? 0x63b9bd : index % 3 === 1 ? 0xd0b96f : 0x7f91ad,
    accentColor: 0xdff6dc, alpha: 0.95, solid: true,
  }));
  solidProps.push(
    { id: 'glasswind_tidepool_north', kind: 'rift', col: 17, row: 8, width: 7, height: 4, shape: 'ellipse', fillColor: 0x244c5e, accentColor: 0x72c9cf, alpha: 0.9, solid: true },
    { id: 'glasswind_tidepool_south', kind: 'rift', col: 18, row: 29, width: 7, height: 4, shape: 'ellipse', fillColor: 0x244c5e, accentColor: 0x72c9cf, alpha: 0.9, solid: true },
    { id: 'glasswind_tidepool_east', kind: 'rift', col: 34, row: 12, width: 6, height: 4, shape: 'ellipse', fillColor: 0x244756, accentColor: 0x7ccfd0, alpha: 0.92, solid: true },
    { id: 'meridian_pool', kind: 'rift', col: 47, row: 19, width: 6, height: 6, shape: 'ellipse', fillColor: 0x203f50, accentColor: 0xe0cd7d, alpha: 0.92, solid: true },
  );
  const detailProps: TilePropSpec[] = [
    { id: 'glasswind_return_gate', kind: 'gate', col: 1, row: 19, width: 2, height: 5, fillColor: 0x6f8f8d, accentColor: 0xffe18a, alpha: 0.98 },
    { id: 'tidebreak_gate', kind: 'gate', col: 56, row: 19, width: 2, height: 5, fillColor: 0x668e91, accentColor: 0x9ae9df, alpha: 0.98 },
    { id: 'glasswind_marker', kind: 'sign', col: 13, row: 18, width: 2, height: 1, label: 'GLASSWIND COAST', fillColor: 0x526a6d, accentColor: 0xe8d187, alpha: 1 },
    { id: 'meridian_marker', kind: 'sign', col: 43, row: 20, width: 1, height: 2, label: 'KEEP THE BEACON TRUE', fillColor: 0x435963, accentColor: 0xe9cf7b, alpha: 1 },
    ...[7, 13, 20, 27, 34, 41].map((col, index): TilePropSpec => ({
      id: `glasswind_lantern_${index + 1}`, kind: 'lantern', col, row: index % 2 === 0 ? 18 : 24, width: 1, height: 2,
      fillColor: 0x5c8d8c, accentColor: 0xffdf7c, alpha: 0.98,
    })),
    ...[[45, 14], [50, 12], [54, 17], [45, 27], [50, 30], [54, 24]].map(([col, row], index): TilePropSpec => ({
      id: `meridian_lantern_${index + 1}`, kind: 'lantern', col, row, width: 1, height: 2,
      fillColor: 0x678f93, accentColor: 0xffe894, alpha: 1,
    })),
  ];
  for (const spec of solidProps) setWalkableDesignRect(grid, spec.col, spec.row, spec.width, spec.height, false);
  return {
    collision: { mapId, tileSize: TILE_SIZE, walkable: grid },
    props: { mapId, props: [...groundProps, ...solidProps, ...detailProps].map((spec) => propFromTiles(gridSize, spec)) },
  };
}

function buildTidebreakCausewayArt(): MapArtDefinition {
  const mapId = 'tidebreak_causeway';
  const gridSize = TIDEBREAK_CAUSEWAY_GRID;
  const grid = createWalkableGrid(gridSize);
  setWalkableRect(grid, 0, 0, gridSize.width, 2, false);
  setWalkableRect(grid, 0, gridSize.height - 2, gridSize.width, 2, false);
  setWalkableRect(grid, 0, 0, 2, gridSize.height, false);
  setWalkableRect(grid, gridSize.width - 2, 0, 2, gridSize.height, false);
  openBorderGate(grid, gridSize, 'west', 18, 5);
  openBorderGate(grid, gridSize, 'east', 18, 5);

  const groundProps: TilePropSpec[] = [
    { id: 'tidebreak_main_road', kind: 'path', col: 1, row: 18, width: 58, height: 5, fillColor: 0x596f70, accentColor: 0xd8c67d, alpha: 0.92 },
    { id: 'tidebreak_west_court', kind: 'plaza', col: 10, row: 10, width: 18, height: 20, shape: 'ellipse', fillColor: 0x3b6062, accentColor: 0x79c7ba, alpha: 0.84 },
    { id: 'tidebreak_north_walk', kind: 'path', col: 28, row: 7, width: 5, height: 13, fillColor: 0x496669, accentColor: 0x9bd3b5, alpha: 0.78 },
    { id: 'tidebreak_south_walk', kind: 'path', col: 29, row: 21, width: 5, height: 13, fillColor: 0x465f64, accentColor: 0xd0bd79, alpha: 0.78 },
    { id: 'keeper_platform', kind: 'plaza', col: 43, row: 10, width: 13, height: 20, shape: 'ellipse', fillColor: 0x334f58, accentColor: 0xa4ded0, alpha: 0.92 },
  ];
  const pillarAnchors = [
    [4, 3, 3, 5], [10, 6, 2, 4], [16, 3, 3, 5], [23, 6, 2, 4], [31, 3, 3, 5], [38, 6, 2, 4], [46, 3, 3, 5], [54, 6, 2, 4],
    [4, 32, 3, 5], [11, 29, 2, 4], [18, 33, 3, 4], [25, 30, 2, 5], [34, 33, 3, 4], [42, 30, 2, 5], [49, 33, 3, 4], [55, 28, 2, 5],
  ] as const;
  const solidProps: TilePropSpec[] = pillarAnchors.map(([col, row, width, height], index) => ({
    id: `tidebreak_pillar_${index + 1}`, kind: 'crystal', col, row, width, height,
    fillColor: index % 3 === 0 ? 0x557f86 : index % 3 === 1 ? 0x74b6aa : 0x8b879d,
    accentColor: 0xd6f2d9, alpha: 0.96, solid: true,
  }));
  solidProps.push(
    { id: 'tidebreak_channel_north', kind: 'rift', col: 15, row: 13, width: 7, height: 3, shape: 'ellipse', fillColor: 0x214b59, accentColor: 0x67c7ca, alpha: 0.92, solid: true },
    { id: 'tidebreak_channel_south', kind: 'rift', col: 17, row: 25, width: 7, height: 3, shape: 'ellipse', fillColor: 0x214b59, accentColor: 0x67c7ca, alpha: 0.92, solid: true },
    { id: 'tidebreak_channel_high', kind: 'rift', col: 35, row: 9, width: 6, height: 4, shape: 'ellipse', fillColor: 0x244654, accentColor: 0x82d6ce, alpha: 0.92, solid: true },
    { id: 'tidebreak_channel_low', kind: 'rift', col: 36, row: 27, width: 6, height: 4, shape: 'ellipse', fillColor: 0x244654, accentColor: 0x82d6ce, alpha: 0.92, solid: true },
  );
  const detailProps: TilePropSpec[] = [
    { id: 'glasswind_return_gate', kind: 'gate', col: 1, row: 18, width: 2, height: 5, fillColor: 0x6d8b8c, accentColor: 0xffdf86, alpha: 0.98 },
    { id: 'reliquary_gate', kind: 'gate', col: 58, row: 18, width: 2, height: 5, fillColor: 0x617f91, accentColor: 0xa7e8dc, alpha: 0.98 },
    { id: 'tidebreak_marker', kind: 'sign', col: 12, row: 18, width: 2, height: 1, label: 'TIDEBREAK CAUSEWAY', fillColor: 0x4f6668, accentColor: 0xe7cf83, alpha: 1 },
    { id: 'keeper_marker', kind: 'sign', col: 45, row: 18, width: 2, height: 1, label: 'MOVE WITH THE LIGHT', fillColor: 0x425964, accentColor: 0xa9e2d5, alpha: 1 },
    ...[7, 13, 20, 27, 35, 42, 49, 55].map((col, index): TilePropSpec => ({
      id: `tidebreak_lantern_${index + 1}`, kind: 'lantern', col, row: index % 2 === 0 ? 17 : 23, width: 1, height: 2,
      fillColor: 0x648b89, accentColor: index > 5 ? 0xa9ecdf : 0xffdf7e, alpha: 0.98,
    })),
  ];
  for (const spec of solidProps) setWalkableDesignRect(grid, spec.col, spec.row, spec.width, spec.height, false);
  return {
    collision: { mapId, tileSize: TILE_SIZE, walkable: grid },
    props: { mapId, props: [...groundProps, ...solidProps, ...detailProps].map((spec) => propFromTiles(gridSize, spec)) },
  };
}

function buildStormglassReliquaryArt(): MapArtDefinition {
  const mapId = 'stormglass_reliquary';
  const gridSize = STORMGLASS_RELIQUARY_GRID;
  const grid = createWalkableGrid(gridSize);
  setWalkableRect(grid, 0, 0, gridSize.width, 2, false);
  setWalkableRect(grid, 0, gridSize.height - 2, gridSize.width, 2, false);
  setWalkableRect(grid, 0, 0, 2, gridSize.height, false);
  setWalkableRect(grid, gridSize.width - 2, 0, 2, gridSize.height, false);
  openBorderGate(grid, gridSize, 'west', 17, 5);
  openBorderGate(grid, gridSize, 'east', 17, 5);

  const groundProps: TilePropSpec[] = [
    { id: 'reliquary_spine', kind: 'path', col: 1, row: 17, width: 48, height: 5, fillColor: 0x3d4f59, accentColor: 0x87c9c5, alpha: 0.94 },
    { id: 'reliquary_vestibule', kind: 'plaza', col: 7, row: 11, width: 14, height: 16, shape: 'ellipse', fillColor: 0x344a55, accentColor: 0x77b9b8, alpha: 0.88 },
    { id: 'reliquary_north_gallery', kind: 'path', col: 20, row: 6, width: 5, height: 13, fillColor: 0x384b58, accentColor: 0x94c7b8, alpha: 0.8 },
    { id: 'reliquary_south_gallery', kind: 'path', col: 22, row: 20, width: 5, height: 12, fillColor: 0x354754, accentColor: 0xb5a979, alpha: 0.8 },
    { id: 'tempest_sanctum', kind: 'plaza', col: 36, row: 8, width: 13, height: 22, shape: 'ellipse', fillColor: 0x293c4c, accentColor: 0x8fe0d6, alpha: 0.94 },
    { id: 'tempest_eye', kind: 'rift', col: 41, row: 16, width: 6, height: 6, shape: 'ellipse', fillColor: 0x24495b, accentColor: 0xd7f5dc, alpha: 0.68 },
  ];
  const glassAnchors = [
    [4, 4, 3, 5], [10, 6, 2, 4], [16, 3, 3, 5], [23, 5, 2, 5], [30, 3, 3, 5], [37, 5, 2, 4], [44, 3, 3, 5], [48, 8, 2, 4],
    [4, 30, 3, 5], [10, 28, 2, 4], [16, 31, 3, 4], [23, 29, 2, 5], [30, 31, 3, 4], [37, 29, 2, 5], [44, 31, 3, 4], [48, 26, 2, 5],
  ] as const;
  const solidProps: TilePropSpec[] = glassAnchors.map(([col, row, width, height], index) => ({
    id: `reliquary_prism_${index + 1}`, kind: 'crystal', col, row, width, height,
    fillColor: index % 3 === 0 ? 0x65759c : index % 3 === 1 ? 0x4f9da4 : 0x8d79a1,
    accentColor: 0xbceee1, alpha: 0.97, solid: true,
  }));
  solidProps.push(
    { id: 'reliquary_rift_north', kind: 'rift', col: 12, row: 11, width: 6, height: 3, shape: 'ellipse', fillColor: 0x202f49, accentColor: 0x7cbcca, alpha: 0.92, solid: true },
    { id: 'reliquary_rift_south', kind: 'rift', col: 13, row: 24, width: 6, height: 3, shape: 'ellipse', fillColor: 0x202f49, accentColor: 0x7cbcca, alpha: 0.92, solid: true },
    { id: 'reliquary_rift_high', kind: 'rift', col: 27, row: 10, width: 6, height: 4, shape: 'ellipse', fillColor: 0x252d48, accentColor: 0xa18ac0, alpha: 0.94, solid: true },
    { id: 'reliquary_rift_low', kind: 'rift', col: 29, row: 25, width: 6, height: 4, shape: 'ellipse', fillColor: 0x252d48, accentColor: 0xa18ac0, alpha: 0.94, solid: true },
  );
  const detailProps: TilePropSpec[] = [
    { id: 'causeway_return_gate', kind: 'gate', col: 1, row: 17, width: 2, height: 5, fillColor: 0x607c8a, accentColor: 0xb3efe1, alpha: 0.98 },
    { id: 'beaconfall_gate', kind: 'gate', col: 50, row: 17, width: 2, height: 5, fillColor: 0x72879a, accentColor: 0xf4d889, alpha: 0.98 },
    { id: 'reliquary_marker', kind: 'sign', col: 8, row: 16, width: 2, height: 1, label: 'STORMGLASS RELIQUARY', fillColor: 0x3d5060, accentColor: 0xa4ded5, alpha: 1 },
    { id: 'tempest_marker', kind: 'sign', col: 36, row: 17, width: 2, height: 1, label: 'STAND OUTSIDE THE EYE', fillColor: 0x394858, accentColor: 0xd3ecaf, alpha: 1 },
    ...[6, 11, 17, 23, 29, 35, 41, 47].map((col, index): TilePropSpec => ({
      id: `reliquary_lantern_${index + 1}`, kind: 'lantern', col, row: index % 2 === 0 ? 16 : 22, width: 1, height: 2,
      fillColor: 0x5b7185, accentColor: index > 5 ? 0xc6f3d8 : 0x92d8d2, alpha: 1,
    })),
  ];
  for (const spec of solidProps) setWalkableDesignRect(grid, spec.col, spec.row, spec.width, spec.height, false);
  return {
    collision: { mapId, tileSize: TILE_SIZE, walkable: grid },
    props: { mapId, props: [...groundProps, ...solidProps, ...detailProps].map((spec) => propFromTiles(gridSize, spec)) },
  };
}

function buildBeaconfallCliffsArt(): MapArtDefinition {
  const mapId = 'beaconfall_cliffs';
  const gridSize = BEACONFALL_CLIFFS_GRID;
  const grid = createWalkableGrid(gridSize);
  setWalkableRect(grid, 0, 0, gridSize.width, 2, false);
  setWalkableRect(grid, 0, gridSize.height - 2, gridSize.width, 2, false);
  setWalkableRect(grid, 0, 0, 2, gridSize.height, false);
  setWalkableRect(grid, gridSize.width - 2, 0, 2, gridSize.height, false);
  openBorderGate(grid, gridSize, 'west', 19, 5);
  openBorderGate(grid, gridSize, 'east', 19, 5);

  const groundProps: TilePropSpec[] = [
    { id: 'beaconfall_ridge_road', kind: 'path', col: 1, row: 19, width: 58, height: 5, fillColor: 0x59625f, accentColor: 0xe9cf7b, alpha: 0.94 },
    { id: 'beaconfall_west_terrace', kind: 'plaza', col: 8, row: 11, width: 17, height: 20, shape: 'ellipse', fillColor: 0x526761, accentColor: 0xa8c993, alpha: 0.86 },
    { id: 'beaconfall_high_walk', kind: 'path', col: 24, row: 7, width: 5, height: 14, fillColor: 0x4e5f5d, accentColor: 0xdac87e, alpha: 0.82 },
    { id: 'beaconfall_low_walk', kind: 'path', col: 27, row: 22, width: 5, height: 13, fillColor: 0x4a5a5a, accentColor: 0x9cc9a4, alpha: 0.82 },
    { id: 'sunspire_forecourt', kind: 'plaza', col: 42, row: 10, width: 14, height: 22, shape: 'ellipse', fillColor: 0x46575d, accentColor: 0xe4d18c, alpha: 0.92 },
  ];
  const spires = [
    [4, 4, 3, 5], [10, 6, 2, 4], [16, 3, 3, 5], [23, 5, 2, 4], [31, 3, 3, 5], [38, 6, 2, 4], [46, 3, 3, 5], [54, 6, 2, 4],
    [4, 33, 3, 5], [11, 30, 2, 4], [18, 34, 3, 4], [25, 31, 2, 5], [34, 34, 3, 4], [42, 31, 2, 5], [49, 34, 3, 4], [55, 29, 2, 5],
  ] as const;
  const solidProps: TilePropSpec[] = spires.map(([col, row, width, height], index) => ({
    id: `beaconfall_spire_${index + 1}`, kind: 'crystal', col, row, width, height,
    fillColor: index % 3 === 0 ? 0xb6ad75 : index % 3 === 1 ? 0x68a9a2 : 0x77839d,
    accentColor: 0xf1e5ad, alpha: 0.96, solid: true,
  }));
  solidProps.push(
    { id: 'beaconfall_chasm_north', kind: 'rift', col: 17, row: 10, width: 7, height: 4, shape: 'ellipse', fillColor: 0x20383f, accentColor: 0x7aa6a5, alpha: 0.92, solid: true },
    { id: 'beaconfall_chasm_south', kind: 'rift', col: 18, row: 28, width: 8, height: 4, shape: 'ellipse', fillColor: 0x20383f, accentColor: 0x7aa6a5, alpha: 0.92, solid: true },
    { id: 'beaconfall_chasm_high', kind: 'rift', col: 33, row: 10, width: 6, height: 4, shape: 'ellipse', fillColor: 0x243943, accentColor: 0x8eb8b2, alpha: 0.94, solid: true },
    { id: 'beaconfall_chasm_low', kind: 'rift', col: 36, row: 27, width: 6, height: 4, shape: 'ellipse', fillColor: 0x243943, accentColor: 0x8eb8b2, alpha: 0.94, solid: true },
  );
  const detailProps: TilePropSpec[] = [
    { id: 'stormglass_return_gate', kind: 'gate', col: 1, row: 19, width: 2, height: 5, fillColor: 0x6c838f, accentColor: 0xa9e1d6, alpha: 0.98 },
    { id: 'sunspire_gate', kind: 'gate', col: 58, row: 19, width: 2, height: 5, fillColor: 0x7c8379, accentColor: 0xffdf8d, alpha: 0.98 },
    { id: 'beaconfall_marker', kind: 'sign', col: 11, row: 18, width: 2, height: 1, label: 'BEACONFALL CLIFFS', fillColor: 0x536562, accentColor: 0xeed483, alpha: 1 },
    { id: 'sunspire_marker', kind: 'sign', col: 45, row: 18, width: 2, height: 1, label: 'LOOK AWAY WHEN THE LENS WAKES', fillColor: 0x505b62, accentColor: 0xf2dd92, alpha: 1 },
    { id: 'roan_field_stall', kind: 'stall', col: 21, row: 23, width: 3, height: 2, fillColor: 0x65766f, accentColor: 0xe5c56f, alpha: 0.96 },
    ...[6, 12, 19, 27, 35, 43, 50, 56].map((col, index): TilePropSpec => ({
      id: `beaconfall_lantern_${index + 1}`, kind: 'lantern', col, row: index % 2 === 0 ? 18 : 24, width: 1, height: 2,
      fillColor: 0x718a82, accentColor: index > 5 ? 0xffe89b : 0xe7cf78, alpha: 1,
    })),
  ];
  for (const spec of solidProps) setWalkableDesignRect(grid, spec.col, spec.row, spec.width, spec.height, false);
  return {
    collision: { mapId, tileSize: TILE_SIZE, walkable: grid },
    props: { mapId, props: [...groundProps, ...solidProps, ...detailProps].map((spec) => propFromTiles(gridSize, spec)) },
  };
}

function buildSunspireObservatoryArt(): MapArtDefinition {
  const mapId = 'sunspire_observatory';
  const gridSize = SUNSPIRE_OBSERVATORY_GRID;
  const grid = createWalkableGrid(gridSize);
  setWalkableRect(grid, 0, 0, gridSize.width, 2, false);
  setWalkableRect(grid, 0, gridSize.height - 2, gridSize.width, 2, false);
  setWalkableRect(grid, 0, 0, 2, gridSize.height, false);
  setWalkableRect(grid, gridSize.width - 2, 0, 2, gridSize.height, false);
  openBorderGate(grid, gridSize, 'west', 18, 5);
  openBorderGate(grid, gridSize, 'east', 18, 5);

  const groundProps: TilePropSpec[] = [
    { id: 'sunspire_axis', kind: 'path', col: 1, row: 18, width: 50, height: 5, fillColor: 0x3f4951, accentColor: 0xd7c982, alpha: 0.95 },
    { id: 'sunspire_entry_rotunda', kind: 'plaza', col: 6, row: 11, width: 14, height: 18, shape: 'ellipse', fillColor: 0x384850, accentColor: 0x87bcb3, alpha: 0.88 },
    { id: 'sunspire_north_gallery', kind: 'path', col: 19, row: 6, width: 5, height: 14, fillColor: 0x39474f, accentColor: 0xa7c6ae, alpha: 0.82 },
    { id: 'sunspire_south_gallery', kind: 'path', col: 22, row: 21, width: 5, height: 13, fillColor: 0x37444d, accentColor: 0xcab979, alpha: 0.82 },
    { id: 'orrery_chamber', kind: 'plaza', col: 37, row: 7, width: 14, height: 26, shape: 'ellipse', fillColor: 0x303b4b, accentColor: 0xe2cf80, alpha: 0.95 },
    { id: 'orrery_lens', kind: 'rift', col: 43, row: 17, width: 6, height: 7, shape: 'ellipse', fillColor: 0x3c4352, accentColor: 0xffe795, alpha: 0.7 },
  ];
  const prisms = [
    [4, 4, 3, 5], [10, 6, 2, 4], [16, 3, 3, 5], [23, 5, 2, 5], [30, 3, 3, 5], [37, 5, 2, 4], [44, 3, 3, 5], [49, 7, 2, 4],
    [4, 32, 3, 5], [10, 29, 2, 4], [16, 33, 3, 4], [23, 30, 2, 5], [30, 33, 3, 4], [37, 30, 2, 5], [44, 33, 3, 4], [49, 28, 2, 5],
  ] as const;
  const solidProps: TilePropSpec[] = prisms.map(([col, row, width, height], index) => ({
    id: `sunspire_prism_${index + 1}`, kind: 'crystal', col, row, width, height,
    fillColor: index % 3 === 0 ? 0xc2ad68 : index % 3 === 1 ? 0x629ca1 : 0x827aa0,
    accentColor: 0xffedac, alpha: 0.97, solid: true,
  }));
  solidProps.push(
    { id: 'sunspire_lens_north', kind: 'rift', col: 11, row: 12, width: 6, height: 3, shape: 'ellipse', fillColor: 0x252d42, accentColor: 0xc0aa6d, alpha: 0.92, solid: true },
    { id: 'sunspire_lens_south', kind: 'rift', col: 13, row: 26, width: 6, height: 3, shape: 'ellipse', fillColor: 0x252d42, accentColor: 0xc0aa6d, alpha: 0.92, solid: true },
    { id: 'sunspire_prism_north', kind: 'rift', col: 27, row: 10, width: 6, height: 4, shape: 'ellipse', fillColor: 0x2d3047, accentColor: 0x9b8dbb, alpha: 0.94, solid: true },
    { id: 'sunspire_prism_south', kind: 'rift', col: 29, row: 27, width: 6, height: 4, shape: 'ellipse', fillColor: 0x2d3047, accentColor: 0x9b8dbb, alpha: 0.94, solid: true },
  );
  const detailProps: TilePropSpec[] = [
    { id: 'beaconfall_return_gate', kind: 'gate', col: 1, row: 18, width: 2, height: 5, fillColor: 0x73848e, accentColor: 0xf3da8b, alpha: 0.98 },
    { id: 'aurora_highlands_gate', kind: 'gate', col: 52, row: 18, width: 2, height: 5, fillColor: 0x7a8f86, accentColor: 0xb8f0c7, alpha: 0.98 },
    { id: 'sunspire_observatory_marker', kind: 'sign', col: 8, row: 17, width: 2, height: 1, label: 'SUNSPIRE OBSERVATORY', fillColor: 0x454f5a, accentColor: 0xe9d68e, alpha: 1 },
    { id: 'orrery_warning', kind: 'sign', col: 37, row: 18, width: 2, height: 1, label: 'THE SKY IS NOT A COMMAND', fillColor: 0x414858, accentColor: 0xffe49b, alpha: 1 },
    ...[6, 12, 18, 24, 30, 36, 42, 48].map((col, index): TilePropSpec => ({
      id: `sunspire_lantern_${index + 1}`, kind: 'lantern', col, row: index % 2 === 0 ? 17 : 23, width: 1, height: 2,
      fillColor: 0x667889, accentColor: index > 5 ? 0xffe798 : 0x9bd8c9, alpha: 1,
    })),
  ];
  for (const spec of solidProps) setWalkableDesignRect(grid, spec.col, spec.row, spec.width, spec.height, false);
  return {
    collision: { mapId, tileSize: TILE_SIZE, walkable: grid },
    props: { mapId, props: [...groundProps, ...solidProps, ...detailProps].map((spec) => propFromTiles(gridSize, spec)) },
  };
}

function buildAuroraHighlandsArt(): MapArtDefinition {
  const mapId = 'aurora_highlands';
  const gridSize = AURORA_HIGHLANDS_GRID;
  const grid = createWalkableGrid(gridSize);
  setWalkableRect(grid, 0, 0, gridSize.width, 2, false);
  setWalkableRect(grid, 0, gridSize.height - 2, gridSize.width, 2, false);
  setWalkableRect(grid, 0, 0, 2, gridSize.height, false);
  setWalkableRect(grid, gridSize.width - 2, 0, 2, gridSize.height, false);
  openBorderGate(grid, gridSize, 'west', 20, 5);
  openBorderGate(grid, gridSize, 'east', 20, 5);

  const groundProps: TilePropSpec[] = [
    { id: 'aurora_high_road', kind: 'path', col: 1, row: 20, width: 58, height: 5, fillColor: 0x59675d, accentColor: 0x9ed39f, alpha: 0.94 },
    { id: 'aurora_mercy_meadow', kind: 'plaza', col: 7, row: 8, width: 20, height: 22, shape: 'ellipse', fillColor: 0x536f61, accentColor: 0xb6dd9c, alpha: 0.86 },
    { id: 'aurora_vigil_meadow', kind: 'plaza', col: 20, row: 22, width: 20, height: 17, shape: 'ellipse', fillColor: 0x5c695b, accentColor: 0xd3b978, alpha: 0.84 },
    { id: 'aurora_north_walk', kind: 'path', col: 27, row: 7, width: 5, height: 15, fillColor: 0x52645c, accentColor: 0xa9d09b, alpha: 0.82 },
    { id: 'zenith_forecourt', kind: 'plaza', col: 42, row: 8, width: 14, height: 28, shape: 'ellipse', fillColor: 0x4b5c5c, accentColor: 0xe0ca82, alpha: 0.91 },
  ];
  const outcrops = [
    [4, 4, 3, 5], [11, 5, 2, 4], [18, 3, 3, 5], [25, 5, 2, 4], [33, 3, 3, 5], [40, 5, 2, 4], [47, 3, 3, 5], [54, 6, 2, 4],
    [4, 36, 3, 5], [12, 34, 2, 4], [19, 37, 3, 4], [27, 34, 2, 5], [35, 37, 3, 4], [43, 34, 2, 5], [50, 37, 3, 4], [55, 32, 2, 5],
  ] as const;
  const solidProps: TilePropSpec[] = outcrops.map(([col, row, width, height], index) => ({
    id: `aurora_outcrop_${index + 1}`, kind: index % 3 === 0 ? 'tree' : 'crystal', col, row, width, height,
    fillColor: index % 3 === 0 ? 0x426f54 : index % 3 === 1 ? 0x71a995 : 0xb09d68,
    accentColor: index % 3 === 0 ? 0x8ec184 : 0xe9dda2, alpha: 0.96, solid: true,
  }));
  solidProps.push(
    { id: 'aurora_ravine_north', kind: 'rift', col: 16, row: 11, width: 7, height: 4, shape: 'ellipse', fillColor: 0x25423c, accentColor: 0x72a891, alpha: 0.92, solid: true },
    { id: 'aurora_ravine_south', kind: 'rift', col: 13, row: 30, width: 8, height: 4, shape: 'ellipse', fillColor: 0x25423c, accentColor: 0x72a891, alpha: 0.92, solid: true },
    { id: 'aurora_sunmetal_high', kind: 'rift', col: 34, row: 10, width: 6, height: 4, shape: 'ellipse', fillColor: 0x39413e, accentColor: 0xc7ae6a, alpha: 0.94, solid: true },
    { id: 'aurora_sunmetal_low', kind: 'rift', col: 38, row: 29, width: 6, height: 4, shape: 'ellipse', fillColor: 0x39413e, accentColor: 0xc7ae6a, alpha: 0.94, solid: true },
  );
  const detailProps: TilePropSpec[] = [
    { id: 'sunspire_return_gate', kind: 'gate', col: 1, row: 20, width: 2, height: 5, fillColor: 0x738b80, accentColor: 0xbce9bd, alpha: 0.98 },
    { id: 'zenith_archive_gate', kind: 'gate', col: 58, row: 20, width: 2, height: 5, fillColor: 0x807c72, accentColor: 0xffdc86, alpha: 0.98 },
    { id: 'aurora_marker', kind: 'sign', col: 9, row: 19, width: 2, height: 1, label: 'AURORA HIGHLANDS', fillColor: 0x51665b, accentColor: 0xbce0a3, alpha: 1 },
    { id: 'branch_marker', kind: 'sign', col: 28, row: 24, width: 2, height: 1, label: 'CHOOSE WHAT THE HEIGHTS REMEMBER', fillColor: 0x566258, accentColor: 0xe5c777, alpha: 1 },
    { id: 'vesper_highland_stall', kind: 'stall', col: 34, row: 25, width: 3, height: 2, fillColor: 0x69796a, accentColor: 0xe4c976, alpha: 0.96 },
    ...[6, 13, 20, 28, 36, 44, 51, 56].map((col, index): TilePropSpec => ({
      id: `aurora_lantern_${index + 1}`, kind: 'lantern', col, row: index % 2 === 0 ? 19 : 25, width: 1, height: 2,
      fillColor: 0x6e8977, accentColor: index > 5 ? 0xffdf88 : 0xaee0a1, alpha: 1,
    })),
  ];
  for (const spec of solidProps) setWalkableDesignRect(grid, spec.col, spec.row, spec.width, spec.height, false);
  return {
    collision: { mapId, tileSize: TILE_SIZE, walkable: grid },
    props: { mapId, props: [...groundProps, ...solidProps, ...detailProps].map((spec) => propFromTiles(gridSize, spec)) },
  };
}

function buildZenithArchiveArt(): MapArtDefinition {
  const mapId = 'zenith_archive';
  const gridSize = ZENITH_ARCHIVE_GRID;
  const grid = createWalkableGrid(gridSize);
  setWalkableRect(grid, 0, 0, gridSize.width, 2, false);
  setWalkableRect(grid, 0, gridSize.height - 2, gridSize.width, 2, false);
  setWalkableRect(grid, 0, 0, 2, gridSize.height, false);
  setWalkableRect(grid, gridSize.width - 2, 0, 2, gridSize.height, false);
  openBorderGate(grid, gridSize, 'west', 19, 5);
  openBorderGate(grid, gridSize, 'east', 19, 5);

  const groundProps: TilePropSpec[] = [
    { id: 'zenith_index_road', kind: 'path', col: 1, row: 19, width: 52, height: 5, fillColor: 0x41494a, accentColor: 0xcfbd78, alpha: 0.95 },
    { id: 'zenith_entry_index', kind: 'plaza', col: 6, row: 11, width: 14, height: 20, shape: 'ellipse', fillColor: 0x394848, accentColor: 0x8db6a2, alpha: 0.88 },
    { id: 'zenith_north_stacks', kind: 'path', col: 19, row: 6, width: 5, height: 15, fillColor: 0x3b4648, accentColor: 0xb7aa75, alpha: 0.82 },
    { id: 'zenith_south_stacks', kind: 'path', col: 22, row: 22, width: 5, height: 13, fillColor: 0x384447, accentColor: 0x83ad9d, alpha: 0.82 },
    { id: 'keeper_catalogue', kind: 'plaza', col: 37, row: 7, width: 14, height: 28, shape: 'ellipse', fillColor: 0x303a43, accentColor: 0xe0c976, alpha: 0.95 },
    { id: 'zenith_codex_dais', kind: 'rift', col: 43, row: 18, width: 6, height: 7, shape: 'ellipse', fillColor: 0x3c4146, accentColor: 0xffdf82, alpha: 0.72 },
  ];
  const stacks = [
    [4, 4, 3, 5], [10, 6, 2, 4], [16, 3, 3, 5], [23, 5, 2, 5], [30, 3, 3, 5], [37, 5, 2, 4], [44, 3, 3, 5], [49, 7, 2, 4],
    [4, 34, 3, 5], [10, 31, 2, 4], [16, 35, 3, 4], [23, 32, 2, 5], [30, 35, 3, 4], [37, 32, 2, 5], [44, 35, 3, 4], [49, 30, 2, 5],
  ] as const;
  const solidProps: TilePropSpec[] = stacks.map(([col, row, width, height], index) => ({
    id: `zenith_stack_${index + 1}`, kind: index % 4 === 0 ? 'crystal' : 'building', col, row, width, height,
    fillColor: index % 4 === 0 ? 0xb09a62 : index % 2 === 0 ? 0x465452 : 0x3d4b50,
    accentColor: 0xe1ce83, alpha: 0.97, solid: true,
  }));
  solidProps.push(
    { id: 'zenith_redaction_north', kind: 'rift', col: 11, row: 12, width: 6, height: 3, shape: 'ellipse', fillColor: 0x252d35, accentColor: 0x8e9d8c, alpha: 0.92, solid: true },
    { id: 'zenith_redaction_south', kind: 'rift', col: 13, row: 28, width: 6, height: 3, shape: 'ellipse', fillColor: 0x252d35, accentColor: 0x8e9d8c, alpha: 0.92, solid: true },
    { id: 'zenith_broken_index', kind: 'rift', col: 28, row: 10, width: 6, height: 4, shape: 'ellipse', fillColor: 0x302f3b, accentColor: 0xb39b68, alpha: 0.94, solid: true },
    { id: 'zenith_lost_shelf', kind: 'rift', col: 30, row: 29, width: 6, height: 4, shape: 'ellipse', fillColor: 0x302f3b, accentColor: 0xb39b68, alpha: 0.94, solid: true },
  );
  const detailProps: TilePropSpec[] = [
    { id: 'aurora_return_gate', kind: 'gate', col: 1, row: 19, width: 2, height: 5, fillColor: 0x71827d, accentColor: 0xd9c77f, alpha: 0.98 },
    { id: 'choirwood_passage_gate', kind: 'gate', col: 52, row: 19, width: 2, height: 5, fillColor: 0x4f7561, accentColor: 0xb7e3a2, alpha: 0.98 },
    { id: 'zenith_archive_marker', kind: 'sign', col: 8, row: 18, width: 2, height: 1, label: 'ZENITH ARCHIVE', fillColor: 0x465350, accentColor: 0xe4cf83, alpha: 1 },
    { id: 'keeper_warning', kind: 'sign', col: 37, row: 19, width: 2, height: 1, label: 'NO MEMORY OWNS THE MORNING', fillColor: 0x41484d, accentColor: 0xffdf8a, alpha: 1 },
    ...[6, 12, 18, 24, 30, 36, 42, 48].map((col, index): TilePropSpec => ({
      id: `zenith_lantern_${index + 1}`, kind: 'lantern', col, row: index % 2 === 0 ? 18 : 24, width: 1, height: 2,
      fillColor: 0x667b74, accentColor: index > 5 ? 0xffdb83 : 0xa8c9aa, alpha: 1,
    })),
  ];
  for (const spec of solidProps) setWalkableDesignRect(grid, spec.col, spec.row, spec.width, spec.height, false);
  return {
    collision: { mapId, tileSize: TILE_SIZE, walkable: grid },
    props: { mapId, props: [...groundProps, ...solidProps, ...detailProps].map((spec) => propFromTiles(gridSize, spec)) },
  };
}

function buildChoirwoodCanopyArt(): MapArtDefinition {
  const mapId = 'choirwood_canopy';
  const gridSize = CHOIRWOOD_CANOPY_GRID;
  const grid = createWalkableGrid(gridSize);
  setWalkableRect(grid, 0, 0, gridSize.width, 2, false);
  setWalkableRect(grid, 0, gridSize.height - 2, gridSize.width, 2, false);
  setWalkableRect(grid, 0, 0, 2, gridSize.height, false);
  setWalkableRect(grid, gridSize.width - 2, 0, 2, gridSize.height, false);
  openBorderGate(grid, gridSize, 'west', 20, 5);
  openBorderGate(grid, gridSize, 'east', 20, 5);

  const groundProps: TilePropSpec[] = [
    { id: 'choirwood_resonance_road', kind: 'path', col: 1, row: 20, width: 58, height: 5, fillColor: 0x425f4d, accentColor: 0x9fcf8d, alpha: 0.95 },
    { id: 'choirwood_echo_glade', kind: 'plaza', col: 6, row: 8, width: 19, height: 24, shape: 'ellipse', fillColor: 0x3f654f, accentColor: 0x8bcf9b, alpha: 0.87 },
    { id: 'choirwood_cantor_green', kind: 'plaza', col: 20, row: 9, width: 20, height: 27, shape: 'ellipse', fillColor: 0x456b54, accentColor: 0xd2cb78, alpha: 0.84 },
    { id: 'choirwood_bellgrove', kind: 'plaza', col: 39, row: 7, width: 17, height: 29, shape: 'ellipse', fillColor: 0x385c4b, accentColor: 0x9ed9bf, alpha: 0.9 },
    { id: 'choirwood_north_songpath', kind: 'path', col: 28, row: 7, width: 5, height: 15, fillColor: 0x3c5a49, accentColor: 0xbacb83, alpha: 0.82 },
  ];
  const groves = [
    [4, 4, 3, 5], [11, 5, 2, 4], [18, 3, 3, 5], [25, 5, 2, 4], [34, 3, 3, 5], [41, 5, 2, 4], [48, 3, 3, 5], [55, 6, 2, 4],
    [4, 36, 3, 5], [12, 35, 2, 4], [19, 37, 3, 4], [27, 35, 2, 5], [35, 37, 3, 4], [43, 34, 2, 5], [50, 37, 3, 4], [55, 33, 2, 5],
  ] as const;
  const solidProps: TilePropSpec[] = groves.map(([col, row, width, height], index) => ({
    id: `choirwood_grove_${index + 1}`, kind: index % 4 === 1 ? 'crystal' : 'tree', col, row, width, height,
    fillColor: index % 4 === 1 ? 0x759b74 : index % 2 === 0 ? 0x2e6046 : 0x395a42,
    accentColor: index % 4 === 1 ? 0xd8d184 : 0x86bd76, alpha: 0.97, solid: true,
  }));
  solidProps.push(
    { id: 'choirwood_hushpool_north', kind: 'rift', col: 14, row: 11, width: 7, height: 4, shape: 'ellipse', fillColor: 0x24483f, accentColor: 0x79bca0, alpha: 0.92, solid: true },
    { id: 'choirwood_hushpool_south', kind: 'rift', col: 14, row: 29, width: 7, height: 4, shape: 'ellipse', fillColor: 0x24483f, accentColor: 0x79bca0, alpha: 0.92, solid: true },
    { id: 'choirwood_bellroot_north', kind: 'rift', col: 36, row: 11, width: 7, height: 4, shape: 'ellipse', fillColor: 0x30483c, accentColor: 0xc6b96e, alpha: 0.94, solid: true },
    { id: 'choirwood_bellroot_south', kind: 'rift', col: 36, row: 29, width: 7, height: 4, shape: 'ellipse', fillColor: 0x30483c, accentColor: 0xc6b96e, alpha: 0.94, solid: true },
  );
  const detailProps: TilePropSpec[] = [
    { id: 'zenith_return_gate', kind: 'gate', col: 1, row: 20, width: 2, height: 5, fillColor: 0x5d7569, accentColor: 0xd9ca84, alpha: 0.98 },
    { id: 'crownroot_sanctum_gate', kind: 'gate', col: 58, row: 20, width: 2, height: 5, fillColor: 0x4d6c50, accentColor: 0xb7d98b, alpha: 0.98 },
    { id: 'choirwood_marker', kind: 'sign', col: 8, row: 19, width: 2, height: 1, label: 'CHOIRWOOD CANOPY', fillColor: 0x3f5c4a, accentColor: 0xd8d38b, alpha: 1 },
    { id: 'cantor_eira_stall', kind: 'stall', col: 18, row: 25, width: 3, height: 2, fillColor: 0x586d50, accentColor: 0xd8c877, alpha: 0.97 },
    { id: 'crownroot_warning', kind: 'sign', col: 46, row: 19, width: 2, height: 1, label: 'LET EVERY VOICE RETURN', fillColor: 0x3d5947, accentColor: 0xcde3a0, alpha: 1 },
    ...[6, 13, 21, 29, 37, 45, 52, 56].map((col, index): TilePropSpec => ({
      id: `choirwood_chime_${index + 1}`, kind: 'lantern', col, row: index % 2 === 0 ? 19 : 25, width: 1, height: 2,
      fillColor: 0x5f7a62, accentColor: index > 5 ? 0xcfe69b : 0xe2cf7b, alpha: 1,
    })),
  ];
  for (const spec of solidProps) setWalkableDesignRect(grid, spec.col, spec.row, spec.width, spec.height, false);
  return {
    collision: { mapId, tileSize: TILE_SIZE, walkable: grid },
    props: { mapId, props: [...groundProps, ...solidProps, ...detailProps].map((spec) => propFromTiles(gridSize, spec)) },
  };
}

function buildCrownrootSanctumArt(): MapArtDefinition {
  const mapId = 'crownroot_sanctum';
  const gridSize = CROWNROOT_SANCTUM_GRID;
  const grid = createWalkableGrid(gridSize);
  setWalkableRect(grid, 0, 0, gridSize.width, 2, false);
  setWalkableRect(grid, 0, gridSize.height - 2, gridSize.width, 2, false);
  setWalkableRect(grid, 0, 0, 2, gridSize.height, false);
  setWalkableRect(grid, gridSize.width - 2, 0, 2, gridSize.height, false);
  openBorderGate(grid, gridSize, 'west', 19, 5);
  openBorderGate(grid, gridSize, 'east', 19, 5);

  const groundProps: TilePropSpec[] = [
    { id: 'crownroot_processional', kind: 'path', col: 1, row: 19, width: 50, height: 5, fillColor: 0x38493d, accentColor: 0xb3a96d, alpha: 0.95 },
    { id: 'crownroot_entry_nave', kind: 'plaza', col: 6, row: 10, width: 14, height: 22, shape: 'ellipse', fillColor: 0x33483d, accentColor: 0x7ea888, alpha: 0.88 },
    { id: 'crownroot_scriptorium', kind: 'path', col: 19, row: 6, width: 6, height: 15, fillColor: 0x35483e, accentColor: 0xc0b478, alpha: 0.82 },
    { id: 'crownroot_bellcrypt', kind: 'path', col: 23, row: 22, width: 6, height: 13, fillColor: 0x31443b, accentColor: 0x82aa94, alpha: 0.82 },
    { id: 'crownroot_inner_choir', kind: 'plaza', col: 36, row: 7, width: 15, height: 28, shape: 'ellipse', fillColor: 0x293b33, accentColor: 0xd1c477, alpha: 0.95 },
    { id: 'crownroot_dais', kind: 'rift', col: 43, row: 18, width: 6, height: 7, shape: 'ellipse', fillColor: 0x303d34, accentColor: 0xe0d184, alpha: 0.74 },
  ];
  const pillars = [
    [4, 4, 3, 5], [10, 6, 2, 4], [16, 3, 3, 5], [23, 5, 2, 5], [30, 3, 3, 5], [37, 5, 2, 4], [44, 3, 3, 5], [49, 7, 2, 4],
    [4, 34, 3, 5], [10, 31, 2, 4], [16, 35, 3, 4], [23, 32, 2, 5], [30, 35, 3, 4], [37, 32, 2, 5], [44, 35, 3, 4], [49, 30, 2, 5],
  ] as const;
  const solidProps: TilePropSpec[] = pillars.map(([col, row, width, height], index) => ({
    id: `crownroot_pillar_${index + 1}`, kind: index % 3 === 0 ? 'tree' : 'building', col, row, width, height,
    fillColor: index % 3 === 0 ? 0x315440 : index % 2 === 0 ? 0x405045 : 0x37483f,
    accentColor: 0xb9ae70, alpha: 0.97, solid: true,
  }));
  solidProps.push(
    { id: 'crownroot_silence_north', kind: 'rift', col: 11, row: 12, width: 6, height: 3, shape: 'ellipse', fillColor: 0x202e2a, accentColor: 0x6f8d7c, alpha: 0.93, solid: true },
    { id: 'crownroot_silence_south', kind: 'rift', col: 13, row: 28, width: 6, height: 3, shape: 'ellipse', fillColor: 0x202e2a, accentColor: 0x6f8d7c, alpha: 0.93, solid: true },
    { id: 'crownroot_bellglass_north', kind: 'rift', col: 28, row: 10, width: 6, height: 4, shape: 'ellipse', fillColor: 0x2b3532, accentColor: 0x9fb773, alpha: 0.95, solid: true },
    { id: 'crownroot_bellglass_south', kind: 'rift', col: 30, row: 29, width: 6, height: 4, shape: 'ellipse', fillColor: 0x2b3532, accentColor: 0x9fb773, alpha: 0.95, solid: true },
  );
  const detailProps: TilePropSpec[] = [
    { id: 'choirwood_return_gate', kind: 'gate', col: 1, row: 19, width: 2, height: 5, fillColor: 0x59705d, accentColor: 0xc8d98a, alpha: 0.98 },
    { id: 'runeveil_gardens_gate', kind: 'gate', col: 52, row: 19, width: 2, height: 5, fillColor: 0x52655c, accentColor: 0x8fd7c4, alpha: 0.98 },
    { id: 'crownroot_marker', kind: 'sign', col: 8, row: 18, width: 2, height: 1, label: 'CROWNROOT SANCTUM', fillColor: 0x3d4e43, accentColor: 0xd7ca80, alpha: 1 },
    { id: 'hierophant_warning', kind: 'sign', col: 37, row: 19, width: 2, height: 1, label: 'A CHORUS NEEDS EVERY VOICE', fillColor: 0x38483f, accentColor: 0xead886, alpha: 1 },
    ...[6, 12, 18, 24, 30, 36, 42, 48].map((col, index): TilePropSpec => ({
      id: `crownroot_bell_${index + 1}`, kind: 'lantern', col, row: index % 2 === 0 ? 18 : 24, width: 1, height: 2,
      fillColor: 0x5d7162, accentColor: index > 5 ? 0xe8d37f : 0x9cc58b, alpha: 1,
    })),
  ];
  for (const spec of solidProps) setWalkableDesignRect(grid, spec.col, spec.row, spec.width, spec.height, false);
  return {
    collision: { mapId, tileSize: TILE_SIZE, walkable: grid },
    props: { mapId, props: [...groundProps, ...solidProps, ...detailProps].map((spec) => propFromTiles(gridSize, spec)) },
  };
}

function buildRuneveilGardensArt(): MapArtDefinition {
  const mapId = 'runeveil_gardens';
  const gridSize = RUNEVEIL_GARDENS_GRID;
  const grid = createWalkableGrid(gridSize);
  setWalkableRect(grid, 0, 0, gridSize.width, 2, false);
  setWalkableRect(grid, 0, gridSize.height - 2, gridSize.width, 2, false);
  setWalkableRect(grid, 0, 0, 2, gridSize.height, false);
  setWalkableRect(grid, gridSize.width - 2, 0, 2, gridSize.height, false);
  openBorderGate(grid, gridSize, 'west', 20, 5);
  openBorderGate(grid, gridSize, 'east', 20, 5);
  const groundProps: TilePropSpec[] = [
    { id: 'runeveil_processional', kind: 'path', col: 1, row: 20, width: 58, height: 5, fillColor: 0x3b5751, accentColor: 0x8bc9b8, alpha: 0.96 },
    { id: 'runeveil_petaled_walk', kind: 'plaza', col: 5, row: 8, width: 18, height: 27, shape: 'ellipse', fillColor: 0x3c6255, accentColor: 0xd3a8b4, alpha: 0.88 },
    { id: 'runeveil_wayglass_green', kind: 'plaza', col: 21, row: 7, width: 19, height: 29, shape: 'ellipse', fillColor: 0x3c5c55, accentColor: 0x9ed8cc, alpha: 0.87 },
    { id: 'runeveil_memorial_hedge', kind: 'plaza', col: 39, row: 8, width: 17, height: 27, shape: 'ellipse', fillColor: 0x344f49, accentColor: 0xd5c47b, alpha: 0.9 },
    { id: 'runeveil_crosswalk', kind: 'path', col: 28, row: 6, width: 5, height: 32, fillColor: 0x38514c, accentColor: 0x7fc1b2, alpha: 0.82 },
  ];
  const groves = [
    [4, 4, 3, 5], [11, 5, 2, 4], [18, 3, 3, 5], [25, 5, 2, 4], [34, 3, 3, 5], [41, 5, 2, 4], [48, 3, 3, 5], [55, 6, 2, 4],
    [4, 36, 3, 5], [12, 35, 2, 4], [19, 37, 3, 4], [27, 35, 2, 5], [35, 37, 3, 4], [43, 34, 2, 5], [50, 37, 3, 4], [55, 33, 2, 5],
  ] as const;
  const solidProps: TilePropSpec[] = groves.map(([col, row, width, height], index) => ({
    id: `runeveil_grove_${index + 1}`, kind: index % 3 === 1 ? 'crystal' : 'tree', col, row, width, height,
    fillColor: index % 3 === 1 ? 0x60958c : index % 2 === 0 ? 0x315b4b : 0x3c604e,
    accentColor: index % 3 === 1 ? 0xb7eee0 : 0xd09aa9, alpha: 0.97, solid: true,
  }));
  solidProps.push(
    { id: 'runeveil_pool_north', kind: 'rift', col: 13, row: 11, width: 7, height: 4, shape: 'ellipse', fillColor: 0x294942, accentColor: 0xa8dfcf, alpha: 0.93, solid: true },
    { id: 'runeveil_pool_south', kind: 'rift', col: 13, row: 29, width: 7, height: 4, shape: 'ellipse', fillColor: 0x294942, accentColor: 0xa8dfcf, alpha: 0.93, solid: true },
    { id: 'runeveil_wayglass_north', kind: 'crystal', col: 37, row: 11, width: 6, height: 4, fillColor: 0x527e76, accentColor: 0xd1f3e9, alpha: 0.95, solid: true },
    { id: 'runeveil_wayglass_south', kind: 'crystal', col: 37, row: 29, width: 6, height: 4, fillColor: 0x527e76, accentColor: 0xd1f3e9, alpha: 0.95, solid: true },
  );
  const detailProps: TilePropSpec[] = [
    { id: 'crownroot_return_gate', kind: 'gate', col: 1, row: 20, width: 2, height: 5, fillColor: 0x52695c, accentColor: 0xc8d98a, alpha: 0.98 },
    { id: 'namesong_vault_gate', kind: 'gate', col: 58, row: 20, width: 2, height: 5, fillColor: 0x4b6560, accentColor: 0xa9eadb, alpha: 0.98 },
    { id: 'runeveil_marker', kind: 'sign', col: 8, row: 19, width: 2, height: 1, label: 'RUNEVEIL GARDENS', fillColor: 0x36574c, accentColor: 0xe0b4c0, alpha: 1 },
    { id: 'namesong_warning', kind: 'sign', col: 47, row: 19, width: 2, height: 1, label: 'A NAME IS A GIFT, NOT A CAGE', fillColor: 0x36524c, accentColor: 0xd8d08a, alpha: 1 },
    ...[6, 13, 21, 29, 37, 45, 52, 56].map((col, index): TilePropSpec => ({
      id: `runeveil_lantern_${index + 1}`, kind: 'lantern', col, row: index % 2 === 0 ? 19 : 25, width: 1, height: 2,
      fillColor: 0x59766d, accentColor: index > 5 ? 0xb9efe1 : 0xe6b4c0, alpha: 1,
    })),
  ];
  for (const spec of solidProps) setWalkableDesignRect(grid, spec.col, spec.row, spec.width, spec.height, false);
  return {
    collision: { mapId, tileSize: TILE_SIZE, walkable: grid },
    props: { mapId, props: [...groundProps, ...solidProps, ...detailProps].map((spec) => propFromTiles(gridSize, spec)) },
  };
}

function buildNamesongVaultArt(): MapArtDefinition {
  const mapId = 'namesong_vault';
  const gridSize = NAMESONG_VAULT_GRID;
  const grid = createWalkableGrid(gridSize);
  setWalkableRect(grid, 0, 0, gridSize.width, 2, false);
  setWalkableRect(grid, 0, gridSize.height - 2, gridSize.width, 2, false);
  setWalkableRect(grid, 0, 0, 2, gridSize.height, false);
  setWalkableRect(grid, gridSize.width - 2, 0, 2, gridSize.height, false);
  openBorderGate(grid, gridSize, 'west', 19, 5);
  openBorderGate(grid, gridSize, 'east', 19, 5);
  const groundProps: TilePropSpec[] = [
    { id: 'namesong_processional', kind: 'path', col: 1, row: 19, width: 50, height: 5, fillColor: 0x343f42, accentColor: 0x9fc6bd, alpha: 0.96 },
    { id: 'namesong_entry', kind: 'plaza', col: 5, row: 9, width: 15, height: 24, shape: 'ellipse', fillColor: 0x334448, accentColor: 0x8fbeb4, alpha: 0.9 },
    { id: 'namesong_epitaph_hall', kind: 'path', col: 19, row: 6, width: 6, height: 29, fillColor: 0x354247, accentColor: 0xc4b878, alpha: 0.84 },
    { id: 'namesong_scriptorium', kind: 'path', col: 27, row: 7, width: 6, height: 27, fillColor: 0x303d43, accentColor: 0x83bdb1, alpha: 0.84 },
    { id: 'namesong_archive_dais', kind: 'plaza', col: 36, row: 7, width: 15, height: 28, shape: 'ellipse', fillColor: 0x29353b, accentColor: 0xd3c780, alpha: 0.95 },
  ];
  const pillars = [
    [4, 4, 3, 5], [10, 6, 2, 4], [16, 3, 3, 5], [23, 5, 2, 5], [30, 3, 3, 5], [37, 5, 2, 4], [44, 3, 3, 5], [49, 7, 2, 4],
    [4, 34, 3, 5], [10, 31, 2, 4], [16, 35, 3, 4], [23, 32, 2, 5], [30, 35, 3, 4], [37, 32, 2, 5], [44, 35, 3, 4], [49, 30, 2, 5],
  ] as const;
  const solidProps: TilePropSpec[] = pillars.map(([col, row, width, height], index) => ({
    id: `namesong_pillar_${index + 1}`, kind: index % 3 === 0 ? 'crystal' : 'building', col, row, width, height,
    fillColor: index % 3 === 0 ? 0x4d7771 : index % 2 === 0 ? 0x3d4b50 : 0x354349,
    accentColor: index % 3 === 0 ? 0xa8ddd2 : 0xbfb277, alpha: 0.97, solid: true,
  }));
  solidProps.push(
    { id: 'namesong_erasure_north', kind: 'rift', col: 11, row: 12, width: 6, height: 3, shape: 'ellipse', fillColor: 0x202c32, accentColor: 0x678e88, alpha: 0.94, solid: true },
    { id: 'namesong_erasure_south', kind: 'rift', col: 13, row: 28, width: 6, height: 3, shape: 'ellipse', fillColor: 0x202c32, accentColor: 0x678e88, alpha: 0.94, solid: true },
    { id: 'namesong_hollowstar_north', kind: 'crystal', col: 28, row: 10, width: 6, height: 4, fillColor: 0x4b696a, accentColor: 0xc2e9de, alpha: 0.95, solid: true },
    { id: 'namesong_hollowstar_south', kind: 'crystal', col: 30, row: 29, width: 6, height: 4, fillColor: 0x4b696a, accentColor: 0xc2e9de, alpha: 0.95, solid: true },
  );
  const detailProps: TilePropSpec[] = [
    { id: 'runeveil_return_gate', kind: 'gate', col: 1, row: 19, width: 2, height: 5, fillColor: 0x526a65, accentColor: 0xb7e4d8, alpha: 0.98 },
    { id: 'waystar_moor_gate', kind: 'gate', col: 52, row: 19, width: 2, height: 5, fillColor: 0x54576d, accentColor: 0xd7b6f1, alpha: 0.98 },
    { id: 'namesong_marker', kind: 'sign', col: 8, row: 18, width: 2, height: 1, label: 'NAMESONG VAULT', fillColor: 0x37464b, accentColor: 0xd5c77e, alpha: 1 },
    { id: 'archivore_warning', kind: 'sign', col: 37, row: 19, width: 2, height: 1, label: 'REMEMBER WITHOUT OWNING', fillColor: 0x344349, accentColor: 0xe0d188, alpha: 1 },
    ...[6, 12, 18, 24, 30, 36, 42, 48].map((col, index): TilePropSpec => ({
      id: `namesong_lantern_${index + 1}`, kind: 'lantern', col, row: index % 2 === 0 ? 18 : 24, width: 1, height: 2,
      fillColor: 0x566b68, accentColor: index > 5 ? 0xc9f1e5 : 0xd7c77e, alpha: 1,
    })),
  ];
  for (const spec of solidProps) setWalkableDesignRect(grid, spec.col, spec.row, spec.width, spec.height, false);
  return {
    collision: { mapId, tileSize: TILE_SIZE, walkable: grid },
    props: { mapId, props: [...groundProps, ...solidProps, ...detailProps].map((spec) => propFromTiles(gridSize, spec)) },
  };
}

function buildWaystarMoorArt(): MapArtDefinition {
  const mapId = 'waystar_moor';
  const gridSize = WAYSTAR_MOOR_GRID;
  const grid = createWalkableGrid(gridSize);
  setWalkableRect(grid, 0, 0, gridSize.width, 2, false);
  setWalkableRect(grid, 0, gridSize.height - 2, gridSize.width, 2, false);
  setWalkableRect(grid, 0, 0, 2, gridSize.height, false);
  setWalkableRect(grid, gridSize.width - 2, 0, 2, gridSize.height, false);
  openBorderGate(grid, gridSize, 'west', 20, 5);
  openBorderGate(grid, gridSize, 'east', 20, 5);
  const groundProps: TilePropSpec[] = [
    { id: 'waystar_main_bearing', kind: 'path', col: 1, row: 20, width: 58, height: 5, fillColor: 0x434c55, accentColor: 0xb8a7d6, alpha: 0.96 },
    { id: 'waystar_west_heath', kind: 'plaza', col: 5, row: 8, width: 17, height: 28, shape: 'ellipse', fillColor: 0x425d50, accentColor: 0xd5c978, alpha: 0.87 },
    { id: 'waystar_compass_green', kind: 'plaza', col: 21, row: 7, width: 19, height: 30, shape: 'ellipse', fillColor: 0x46545f, accentColor: 0xbfa2db, alpha: 0.9 },
    { id: 'waystar_east_moor', kind: 'plaza', col: 39, row: 8, width: 17, height: 28, shape: 'ellipse', fillColor: 0x395a55, accentColor: 0x83c9bd, alpha: 0.88 },
    { id: 'waystar_meridian_walk', kind: 'path', col: 28, row: 5, width: 5, height: 34, fillColor: 0x3e4853, accentColor: 0xc4addc, alpha: 0.82 },
  ];
  const landmarks = [
    [4, 4, 3, 5], [11, 5, 2, 4], [18, 3, 3, 5], [25, 5, 2, 4], [34, 3, 3, 5], [41, 5, 2, 4], [48, 3, 3, 5], [55, 6, 2, 4],
    [4, 36, 3, 5], [12, 35, 2, 4], [19, 37, 3, 4], [27, 35, 2, 5], [35, 37, 3, 4], [43, 34, 2, 5], [50, 37, 3, 4], [55, 33, 2, 5],
  ] as const;
  const solidProps: TilePropSpec[] = landmarks.map(([col, row, width, height], index) => ({
    id: `waystar_landmark_${index + 1}`, kind: index % 3 === 0 ? 'crystal' : 'tree', col, row, width, height,
    fillColor: index % 3 === 0 ? 0x6e7394 : index % 2 === 0 ? 0x345b4e : 0x3e654f,
    accentColor: index % 3 === 0 ? 0xe3cbfa : 0xd8cb76, alpha: 0.97, solid: true,
  }));
  solidProps.push(
    { id: 'waystar_lost_road_north', kind: 'rift', col: 12, row: 11, width: 7, height: 4, shape: 'ellipse', fillColor: 0x293947, accentColor: 0x9c83bb, alpha: 0.94, solid: true },
    { id: 'waystar_lost_road_south', kind: 'rift', col: 13, row: 29, width: 7, height: 4, shape: 'ellipse', fillColor: 0x293947, accentColor: 0x9c83bb, alpha: 0.94, solid: true },
    { id: 'waystar_glass_north', kind: 'crystal', col: 40, row: 11, width: 6, height: 4, fillColor: 0x547b78, accentColor: 0xa5e7da, alpha: 0.95, solid: true },
    { id: 'waystar_glass_south', kind: 'crystal', col: 40, row: 29, width: 6, height: 4, fillColor: 0x547b78, accentColor: 0xa5e7da, alpha: 0.95, solid: true },
  );
  const detailProps: TilePropSpec[] = [
    { id: 'namesong_return_gate', kind: 'gate', col: 1, row: 20, width: 2, height: 5, fillColor: 0x52686a, accentColor: 0xb9e8dd, alpha: 0.98 },
    { id: 'convergence_spire_gate', kind: 'gate', col: 58, row: 20, width: 2, height: 5, fillColor: 0x5c5872, accentColor: 0xe2c8f7, alpha: 0.98 },
    { id: 'waystar_marker', kind: 'sign', col: 8, row: 19, width: 2, height: 1, label: 'WAYSTAR MOOR', fillColor: 0x3b5152, accentColor: 0xe4d276, alpha: 1 },
    { id: 'calling_warning', kind: 'sign', col: 47, row: 19, width: 2, height: 1, label: 'A PATH IS CHOSEN, NOT ASSIGNED', fillColor: 0x45485a, accentColor: 0xd9bff1, alpha: 1 },
    ...[6, 13, 21, 29, 37, 45, 52, 56].map((col, index): TilePropSpec => ({
      id: `waystar_beacon_${index + 1}`, kind: 'lantern', col, row: index % 2 === 0 ? 19 : 25, width: 1, height: 2,
      fillColor: 0x5f6676, accentColor: index > 5 ? 0xdcc4f2 : 0xe2d477, alpha: 1,
    })),
  ];
  for (const spec of solidProps) setWalkableDesignRect(grid, spec.col, spec.row, spec.width, spec.height, false);
  return {
    collision: { mapId, tileSize: TILE_SIZE, walkable: grid },
    props: { mapId, props: [...groundProps, ...solidProps, ...detailProps].map((spec) => propFromTiles(gridSize, spec)) },
  };
}

function buildConvergenceSpireArt(): MapArtDefinition {
  const mapId = 'convergence_spire';
  const gridSize = CONVERGENCE_SPIRE_GRID;
  const grid = createWalkableGrid(gridSize);
  setWalkableRect(grid, 0, 0, gridSize.width, 2, false);
  setWalkableRect(grid, 0, gridSize.height - 2, gridSize.width, 2, false);
  setWalkableRect(grid, 0, 0, 2, gridSize.height, false);
  setWalkableRect(grid, gridSize.width - 2, 0, 2, gridSize.height, false);
  openBorderGate(grid, gridSize, 'west', 19, 5);
  const groundProps: TilePropSpec[] = [
    { id: 'convergence_ascent', kind: 'path', col: 1, row: 19, width: 50, height: 5, fillColor: 0x373946, accentColor: 0xb79bd5, alpha: 0.96 },
    { id: 'convergence_entry', kind: 'plaza', col: 5, row: 9, width: 14, height: 24, shape: 'ellipse', fillColor: 0x39414d, accentColor: 0x8ccbc1, alpha: 0.9 },
    { id: 'convergence_vow_hall', kind: 'path', col: 19, row: 6, width: 6, height: 29, fillColor: 0x44414e, accentColor: 0xcfb66c, alpha: 0.84 },
    { id: 'convergence_split_hall', kind: 'path', col: 28, row: 6, width: 6, height: 29, fillColor: 0x343b49, accentColor: 0xa896cb, alpha: 0.84 },
    { id: 'manyroad_dais', kind: 'plaza', col: 36, row: 7, width: 15, height: 28, shape: 'ellipse', fillColor: 0x2c2d3a, accentColor: 0xe0c475, alpha: 0.95 },
  ];
  const pillars = [
    [4, 4, 3, 5], [10, 6, 2, 4], [16, 3, 3, 5], [23, 5, 2, 5], [30, 3, 3, 5], [37, 5, 2, 4], [44, 3, 3, 5], [49, 7, 2, 4],
    [4, 34, 3, 5], [10, 31, 2, 4], [16, 35, 3, 4], [23, 32, 2, 5], [30, 35, 3, 4], [37, 32, 2, 5], [44, 35, 3, 4], [49, 30, 2, 5],
  ] as const;
  const solidProps: TilePropSpec[] = pillars.map(([col, row, width, height], index) => ({
    id: `convergence_pillar_${index + 1}`, kind: index % 3 === 0 ? 'crystal' : 'building', col, row, width, height,
    fillColor: index % 3 === 0 ? 0x6b6184 : index % 2 === 0 ? 0x4b4b58 : 0x414451,
    accentColor: index % 3 === 0 ? 0xd7bdf0 : 0xd5bd72, alpha: 0.97, solid: true,
  }));
  solidProps.push(
    { id: 'convergence_severance_north', kind: 'rift', col: 11, row: 12, width: 6, height: 3, shape: 'ellipse', fillColor: 0x252532, accentColor: 0x8a70a9, alpha: 0.94, solid: true },
    { id: 'convergence_severance_south', kind: 'rift', col: 13, row: 28, width: 6, height: 3, shape: 'ellipse', fillColor: 0x252532, accentColor: 0x8a70a9, alpha: 0.94, solid: true },
    { id: 'convergence_vowglass_north', kind: 'crystal', col: 29, row: 10, width: 6, height: 4, fillColor: 0x625979, accentColor: 0xdcc9ee, alpha: 0.95, solid: true },
    { id: 'convergence_vowglass_south', kind: 'crystal', col: 30, row: 29, width: 6, height: 4, fillColor: 0x625979, accentColor: 0xdcc9ee, alpha: 0.95, solid: true },
  );
  const detailProps: TilePropSpec[] = [
    { id: 'waystar_return_gate', kind: 'gate', col: 1, row: 19, width: 2, height: 5, fillColor: 0x586171, accentColor: 0xcdb6e2, alpha: 0.98 },
    { id: 'convergence_marker', kind: 'sign', col: 8, row: 18, width: 2, height: 1, label: 'CONVERGENCE SPIRE', fillColor: 0x3d3f4c, accentColor: 0xd8bf72, alpha: 1 },
    { id: 'manyroad_warning', kind: 'sign', col: 37, row: 19, width: 2, height: 1, label: 'NO CROWN MAY CHOOSE FOR YOU', fillColor: 0x393946, accentColor: 0xe2ca77, alpha: 1 },
    ...[6, 12, 18, 24, 30, 36, 42, 48].map((col, index): TilePropSpec => ({
      id: `convergence_star_${index + 1}`, kind: 'lantern', col, row: index % 2 === 0 ? 18 : 24, width: 1, height: 2,
      fillColor: 0x666174, accentColor: index > 5 ? 0xe5cf77 : 0xc8aee1, alpha: 1,
    })),
  ];
  for (const spec of solidProps) setWalkableDesignRect(grid, spec.col, spec.row, spec.width, spec.height, false);
  return {
    collision: { mapId, tileSize: TILE_SIZE, walkable: grid },
    props: { mapId, props: [...groundProps, ...solidProps, ...detailProps].map((spec) => propFromTiles(gridSize, spec)) },
  };
}

function buildTownArt(): MapArtDefinition {
  const mapId = 'hearthvale_town';
  const grid = createWalkableGrid(HEARTHVALE_TOWN_GRID);

  setWalkableRect(grid, 0, 0, HEARTHVALE_TOWN_GRID.width, 2, false);
  setWalkableRect(grid, 0, HEARTHVALE_TOWN_GRID.height - 2, HEARTHVALE_TOWN_GRID.width, 2, false);
  setWalkableRect(grid, 0, 0, 2, HEARTHVALE_TOWN_GRID.height, false);
  setWalkableRect(grid, HEARTHVALE_TOWN_GRID.width - 2, 0, 2, HEARTHVALE_TOWN_GRID.height, false);
  openBorderGate(grid, HEARTHVALE_TOWN_GRID, 'east', 17, 4);

  const groundProps: TilePropSpec[] = [
    {
      id: 'town_green',
      kind: 'plaza',
      col: 15,
      row: 9,
      width: 18,
      height: 16,
      fillColor: 0x58714d,
      accentColor: 0x7fa16d,
      alpha: 0.82,
    },
    {
      id: 'main_road',
      kind: 'path',
      col: 2,
      row: 17,
      width: 44,
      height: 4,
      fillColor: 0xa78860,
      accentColor: 0xc9ac7f,
      alpha: 0.92,
    },
    {
      id: 'north_lane',
      kind: 'path',
      col: 22,
      row: 2,
      width: 4,
      height: 31,
      fillColor: 0xa78860,
      accentColor: 0xc9ac7f,
      alpha: 0.88,
    },
    {
      id: 'market_apron',
      kind: 'path',
      col: 31,
      row: 12,
      width: 11,
      height: 5,
      fillColor: 0xb09368,
      accentColor: 0xd1b587,
      alpha: 0.86,
    },
    {
      id: 'guild_yard',
      kind: 'path',
      col: 27,
      row: 28,
      width: 14,
      height: 4,
      fillColor: 0x99724f,
      accentColor: 0xb48a62,
      alpha: 0.82,
    },
  ];

  const solidProps: TilePropSpec[] = [
    {
      id: 'elder_fountain',
      kind: 'fountain',
      col: 22,
      row: 11,
      width: 4,
      height: 4,
      shape: 'ellipse',
      fillColor: 0x597ea1,
      accentColor: 0xd7ecff,
      alpha: 0.92,
      solid: true,
    },
    {
      id: 'town_inn',
      kind: 'building',
      col: 5,
      row: 6,
      width: 7,
      height: 6,
      label: 'INN',
      fillColor: 0x7e5c43,
      accentColor: 0xe4c89d,
      alpha: 1,
      solid: true,
    },
    {
      id: 'merchant_shop',
      kind: 'building',
      col: 34,
      row: 6,
      width: 7,
      height: 6,
      label: 'SHOP',
      fillColor: 0x8a6345,
      accentColor: 0xe5c08f,
      alpha: 1,
      solid: true,
    },
    {
      id: 'guild_hall',
      kind: 'building',
      col: 31,
      row: 22,
      width: 9,
      height: 6,
      label: 'GUILD',
      fillColor: 0x6f4e40,
      accentColor: 0xd4b38f,
      alpha: 1,
      solid: true,
    },
    {
      id: 'south_cottages',
      kind: 'building',
      col: 7,
      row: 23,
      width: 7,
      height: 5,
      label: 'HOMES',
      fillColor: 0x846149,
      accentColor: 0xdcb58b,
      alpha: 1,
      solid: true,
    },
    {
      id: 'storehouse',
      kind: 'building',
      col: 16,
      row: 24,
      width: 5,
      height: 4,
      label: 'STORE',
      fillColor: 0x765640,
      accentColor: 0xcfb189,
      alpha: 1,
      solid: true,
    },
    {
      id: 'produce_stall',
      kind: 'stall',
      col: 33,
      row: 13,
      width: 3,
      height: 2,
      label: 'Goods',
      fillColor: 0xb95a4b,
      accentColor: 0xf6d9a9,
      alpha: 0.95,
      solid: true,
    },
    {
      id: 'tool_stall',
      kind: 'stall',
      col: 37,
      row: 13,
      width: 3,
      height: 2,
      label: 'Tools',
      fillColor: 0x7d4f7c,
      accentColor: 0xf2db9c,
      alpha: 0.95,
      solid: true,
    },
    {
      id: 'courier_board',
      kind: 'sign',
      col: 41,
      row: 16,
      width: 1,
      height: 2,
      label: 'Board',
      fillColor: 0xc79b5a,
      accentColor: 0x5a3f2f,
      alpha: 1,
      solid: true,
    },
    {
      id: 'gate_post_north',
      kind: 'gate',
      col: 45,
      row: 16,
      width: 1,
      height: 1,
      fillColor: 0x6e5642,
      accentColor: 0x9d835d,
      alpha: 1,
      solid: true,
    },
    {
      id: 'gate_post_south',
      kind: 'gate',
      col: 45,
      row: 20,
      width: 1,
      height: 1,
      fillColor: 0x6e5642,
      accentColor: 0x9d835d,
      alpha: 1,
      solid: true,
    },
    {
      id: 'trainer_dummy_a',
      kind: 'training_dummy',
      col: 28,
      row: 29,
      width: 1,
      height: 1,
      fillColor: 0xb69359,
      accentColor: 0x744930,
      alpha: 1,
      solid: true,
    },
    {
      id: 'trainer_dummy_b',
      kind: 'training_dummy',
      col: 30,
      row: 30,
      width: 1,
      height: 1,
      fillColor: 0xb69359,
      accentColor: 0x744930,
      alpha: 1,
      solid: true,
    },
    {
      id: 'crate_stack',
      kind: 'crate',
      col: 20,
      row: 22,
      width: 2,
      height: 2,
      fillColor: 0x8d6a43,
      accentColor: 0xb39066,
      alpha: 1,
      solid: true,
    },
    {
      id: 'planter_west',
      kind: 'planter',
      col: 14,
      row: 14,
      width: 2,
      height: 1,
      fillColor: 0x5f6a3d,
      accentColor: 0xc87d55,
      alpha: 1,
      solid: true,
    },
    {
      id: 'planter_east',
      kind: 'planter',
      col: 31,
      row: 14,
      width: 2,
      height: 1,
      fillColor: 0x5f6a3d,
      accentColor: 0xc87d55,
      alpha: 1,
      solid: true,
    },
    {
      id: 'cottage_fence_north',
      kind: 'fence',
      col: 6,
      row: 22,
      width: 9,
      height: 1,
      fillColor: 0xc0a072,
      accentColor: 0xe4c89d,
      alpha: 1,
      solid: true,
    },
    {
      id: 'cottage_fence_west',
      kind: 'fence',
      col: 6,
      row: 22,
      width: 1,
      height: 7,
      fillColor: 0xc0a072,
      accentColor: 0xe4c89d,
      alpha: 1,
      solid: true,
    },
    {
      id: 'cottage_fence_east',
      kind: 'fence',
      col: 14,
      row: 22,
      width: 1,
      height: 5,
      fillColor: 0xc0a072,
      accentColor: 0xe4c89d,
      alpha: 1,
      solid: true,
    },
    {
      id: 'lamp_north',
      kind: 'lantern',
      col: 19,
      row: 16,
      width: 1,
      height: 1,
      fillColor: 0xe8ca73,
      accentColor: 0x6f5436,
      alpha: 1,
      solid: true,
    },
    {
      id: 'lamp_south',
      kind: 'lantern',
      col: 27,
      row: 16,
      width: 1,
      height: 1,
      fillColor: 0xe8ca73,
      accentColor: 0x6f5436,
      alpha: 1,
      solid: true,
    },
    {
      id: 'tree_nw',
      kind: 'tree',
      col: 3,
      row: 3,
      width: 2,
      height: 2,
      shape: 'ellipse',
      fillColor: 0x3f6a3d,
      accentColor: 0x6f4c31,
      alpha: 1,
      solid: true,
    },
    {
      id: 'tree_north_a',
      kind: 'tree',
      col: 9,
      row: 2,
      width: 2,
      height: 2,
      shape: 'ellipse',
      fillColor: 0x466f40,
      accentColor: 0x6f4c31,
      alpha: 1,
      solid: true,
    },
    {
      id: 'tree_north_b',
      kind: 'tree',
      col: 15,
      row: 3,
      width: 2,
      height: 2,
      shape: 'ellipse',
      fillColor: 0x466f40,
      accentColor: 0x6f4c31,
      alpha: 1,
      solid: true,
    },
    {
      id: 'tree_near_shop',
      kind: 'tree',
      col: 41,
      row: 4,
      width: 2,
      height: 2,
      shape: 'ellipse',
      fillColor: 0x3f6a3d,
      accentColor: 0x6f4c31,
      alpha: 1,
      solid: true,
    },
    {
      id: 'tree_ne',
      kind: 'tree',
      col: 43,
      row: 8,
      width: 2,
      height: 2,
      shape: 'ellipse',
      fillColor: 0x3f6a3d,
      accentColor: 0x6f4c31,
      alpha: 1,
      solid: true,
    },
    {
      id: 'tree_west_mid',
      kind: 'tree',
      col: 2,
      row: 14,
      width: 2,
      height: 2,
      shape: 'ellipse',
      fillColor: 0x3f6a3d,
      accentColor: 0x6f4c31,
      alpha: 1,
      solid: true,
    },
    {
      id: 'tree_sw',
      kind: 'tree',
      col: 4,
      row: 30,
      width: 2,
      height: 2,
      shape: 'ellipse',
      fillColor: 0x3f6a3d,
      accentColor: 0x6f4c31,
      alpha: 1,
      solid: true,
    },
    {
      id: 'tree_south_a',
      kind: 'tree',
      col: 18,
      row: 31,
      width: 2,
      height: 2,
      shape: 'ellipse',
      fillColor: 0x466f40,
      accentColor: 0x6f4c31,
      alpha: 1,
      solid: true,
    },
    {
      id: 'tree_south_b',
      kind: 'tree',
      col: 36,
      row: 31,
      width: 2,
      height: 2,
      shape: 'ellipse',
      fillColor: 0x466f40,
      accentColor: 0x6f4c31,
      alpha: 1,
      solid: true,
    },
    {
      id: 'tree_se',
      kind: 'tree',
      col: 43,
      row: 29,
      width: 2,
      height: 2,
      shape: 'ellipse',
      fillColor: 0x3f6a3d,
      accentColor: 0x6f4c31,
      alpha: 1,
      solid: true,
    },
  ];

  for (const spec of solidProps) {
    if (spec.solid) {
      setWalkableDesignRect(grid, spec.col, spec.row, spec.width, spec.height, false);
    }
  }

  return {
    collision: {
      mapId,
      tileSize: TILE_SIZE,
      walkable: grid,
    },
    props: {
      mapId,
      props: [...groundProps, ...solidProps].map((spec) => propFromTiles(HEARTHVALE_TOWN_GRID, spec)),
    },
  };
}

export const HEARTHVALE_TOWN_POINTS = {
  playerSpawn: worldPointFromTile(HEARTHVALE_TOWN_GRID, 24, 21),
  eastGate: worldPointFromTile(HEARTHVALE_TOWN_GRID, 46, 18),
  eastGateArrival: worldPointFromTile(HEARTHVALE_TOWN_GRID, 42, 18),
  elder: worldPointFromTile(HEARTHVALE_TOWN_GRID, 24, 16),
  merchantSilas: worldPointFromTile(HEARTHVALE_TOWN_GRID, 33, 15),
  hearthCourier: worldPointFromTile(HEARTHVALE_TOWN_GRID, 40, 18),
  innkeeperMara: worldPointFromTile(HEARTHVALE_TOWN_GRID, 12, 13),
  trainerBram: worldPointFromTile(HEARTHVALE_TOWN_GRID, 29, 29),
  guardCaptainDell: worldPointFromTile(HEARTHVALE_TOWN_GRID, 43, 19),
  bakerOdella: worldPointFromTile(HEARTHVALE_TOWN_GRID, 13, 8),
  bardFinn: worldPointFromTile(HEARTHVALE_TOWN_GRID, 20, 13),
  childNettle: worldPointFromTile(HEARTHVALE_TOWN_GRID, 26, 19),
  priestessWren: worldPointFromTile(HEARTHVALE_TOWN_GRID, 17, 21),
} as const satisfies Record<string, Vec2>;

export const HEARTHVALE_TOWN_SAFE_ZONE = worldRectFromTiles(HEARTHVALE_TOWN_GRID, 2, 2, 44, 32);

/**
 * Gameplay anchor points (spawns, portal gates, quest/resource nodes) for each
 * adventure map. These are pure coordinate data consumed by maps.ts and
 * regions.ts — independent of the ADVENTURE_ART set-dressing generator below,
 * which only produces visuals. Restored after the map-art rewrite dropped
 * them while leaving these imports in place elsewhere.
 */
export const EMBERGLASS_SHELF_POINTS = {
  playerSpawn: worldPointFromTile(EMBERGLASS_SHELF_GRID, 7, 20),
  approachPass: worldPointFromTile(EMBERGLASS_SHELF_GRID, 2, 20),
  approachArrival: worldPointFromTile(EMBERGLASS_SHELF_GRID, 7, 20),
  glasswrightOrla: worldPointFromTile(EMBERGLASS_SHELF_GRID, 10, 16),
  kilnGate: worldPointFromTile(EMBERGLASS_SHELF_GRID, 53, 20),
  kilnArrival: worldPointFromTile(EMBERGLASS_SHELF_GRID, 50, 20),
  emberglassSeam1: worldPointFromTile(EMBERGLASS_SHELF_GRID, 21, 20),
  emberglassSeam2: worldPointFromTile(EMBERGLASS_SHELF_GRID, 31, 20),
  emberglassSeam3: worldPointFromTile(EMBERGLASS_SHELF_GRID, 40, 20),
} as const satisfies Record<string, Vec2>;

export const HOLLOW_KILN_POINTS = {
  playerSpawn: worldPointFromTile(HOLLOW_KILN_GRID, 7, 21),
  shelfGate: worldPointFromTile(HOLLOW_KILN_GRID, 2, 21),
  shelfArrival: worldPointFromTile(HOLLOW_KILN_GRID, 7, 21),
  kilnheartDais: worldPointFromTile(HOLLOW_KILN_GRID, 41, 21),
} as const satisfies Record<string, Vec2>;

export const LANTERNSPIRE_SUMMIT_POINTS = {
  playerSpawn: worldPointFromTile(LANTERNSPIRE_SUMMIT_GRID, 6, 19),
  townGate: worldPointFromTile(LANTERNSPIRE_SUMMIT_GRID, 2, 19),
  townArrival: worldPointFromTile(LANTERNSPIRE_SUMMIT_GRID, 6, 19),
  afterlightGate: worldPointFromTile(LANTERNSPIRE_SUMMIT_GRID, 50, 19),
  afterlightArrival: worldPointFromTile(LANTERNSPIRE_SUMMIT_GRID, 46, 19),
  starvedCrown: worldPointFromTile(LANTERNSPIRE_SUMMIT_GRID, 43, 19),
} as const satisfies Record<string, Vec2>;

export const AFTERLIGHT_EXPANSE_POINTS = {
  playerSpawn: worldPointFromTile(AFTERLIGHT_EXPANSE_GRID, 7, 21),
  summitGate: worldPointFromTile(AFTERLIGHT_EXPANSE_GRID, 2, 21),
  summitArrival: worldPointFromTile(AFTERLIGHT_EXPANSE_GRID, 7, 21),
  dawnshoreGate: worldPointFromTile(AFTERLIGHT_EXPANSE_GRID, 56, 21),
  dawnshoreArrival: worldPointFromTile(AFTERLIGHT_EXPANSE_GRID, 52, 21),
  eclipseHerald: worldPointFromTile(AFTERLIGHT_EXPANSE_GRID, 50, 15),
  sunshardBloom1: worldPointFromTile(AFTERLIGHT_EXPANSE_GRID, 18, 20),
  sunshardBloom2: worldPointFromTile(AFTERLIGHT_EXPANSE_GRID, 28, 18),
  voidglassSeam1: worldPointFromTile(AFTERLIGHT_EXPANSE_GRID, 34, 21),
  voidglassSeam2: worldPointFromTile(AFTERLIGHT_EXPANSE_GRID, 41, 23),
} as const satisfies Record<string, Vec2>;

export const DAWNSHORE_CAMP_POINTS = {
  playerSpawn: worldPointFromTile(DAWNSHORE_CAMP_GRID, 7, 16),
  afterlightGate: worldPointFromTile(DAWNSHORE_CAMP_GRID, 2, 16),
  afterlightArrival: worldPointFromTile(DAWNSHORE_CAMP_GRID, 7, 16),
  glasswindGate: worldPointFromTile(DAWNSHORE_CAMP_GRID, 44, 16),
  glasswindArrival: worldPointFromTile(DAWNSHORE_CAMP_GRID, 39, 16),
  trailwardenNia: worldPointFromTile(DAWNSHORE_CAMP_GRID, 18, 12),
  quartermasterVesa: worldPointFromTile(DAWNSHORE_CAMP_GRID, 30, 16),
  hearthCourier: worldPointFromTile(DAWNSHORE_CAMP_GRID, 36, 16),
} as const satisfies Record<string, Vec2>;

export const GLASSWIND_COAST_POINTS = {
  playerSpawn: worldPointFromTile(GLASSWIND_COAST_GRID, 7, 21),
  campGate: worldPointFromTile(GLASSWIND_COAST_GRID, 2, 21),
  campArrival: worldPointFromTile(GLASSWIND_COAST_GRID, 7, 21),
  tidebreakGate: worldPointFromTile(GLASSWIND_COAST_GRID, 57, 21),
  tidebreakArrival: worldPointFromTile(GLASSWIND_COAST_GRID, 55, 21),
  drownedMeridian: worldPointFromTile(GLASSWIND_COAST_GRID, 50, 15),
  sunwakeKelp1: worldPointFromTile(GLASSWIND_COAST_GRID, 12, 11),
  sunwakeKelp2: worldPointFromTile(GLASSWIND_COAST_GRID, 19, 27),
  sunwakeKelp3: worldPointFromTile(GLASSWIND_COAST_GRID, 29, 10),
  saltglassSeam1: worldPointFromTile(GLASSWIND_COAST_GRID, 26, 21),
  saltglassSeam2: worldPointFromTile(GLASSWIND_COAST_GRID, 38, 27),
  saltglassSeam3: worldPointFromTile(GLASSWIND_COAST_GRID, 42, 17),
} as const satisfies Record<string, Vec2>;

export const TIDEBREAK_CAUSEWAY_POINTS = {
  playerSpawn: worldPointFromTile(TIDEBREAK_CAUSEWAY_GRID, 7, 20),
  coastGate: worldPointFromTile(TIDEBREAK_CAUSEWAY_GRID, 2, 20),
  coastArrival: worldPointFromTile(TIDEBREAK_CAUSEWAY_GRID, 7, 20),
  reliquaryGate: worldPointFromTile(TIDEBREAK_CAUSEWAY_GRID, 59, 20),
  reliquaryArrival: worldPointFromTile(TIDEBREAK_CAUSEWAY_GRID, 54, 20),
  beaconwrightOrrin: worldPointFromTile(TIDEBREAK_CAUSEWAY_GRID, 49, 15),
  stormreed1: worldPointFromTile(TIDEBREAK_CAUSEWAY_GRID, 12, 11),
  stormreed2: worldPointFromTile(TIDEBREAK_CAUSEWAY_GRID, 23, 28),
  stormreed3: worldPointFromTile(TIDEBREAK_CAUSEWAY_GRID, 36, 15),
  tideiron1: worldPointFromTile(TIDEBREAK_CAUSEWAY_GRID, 29, 20),
  tideiron2: worldPointFromTile(TIDEBREAK_CAUSEWAY_GRID, 40, 15),
  tideiron3: worldPointFromTile(TIDEBREAK_CAUSEWAY_GRID, 47, 27),
} as const satisfies Record<string, Vec2>;

export const STORMGLASS_RELIQUARY_POINTS = {
  playerSpawn: worldPointFromTile(STORMGLASS_RELIQUARY_GRID, 7, 19),
  causewayGate: worldPointFromTile(STORMGLASS_RELIQUARY_GRID, 2, 19),
  causewayArrival: worldPointFromTile(STORMGLASS_RELIQUARY_GRID, 7, 19),
  tempestRemnant: worldPointFromTile(STORMGLASS_RELIQUARY_GRID, 44, 19),
  stormglassRelic1: worldPointFromTile(STORMGLASS_RELIQUARY_GRID, 16, 10),
  stormglassRelic2: worldPointFromTile(STORMGLASS_RELIQUARY_GRID, 25, 27),
  stormglassRelic3: worldPointFromTile(STORMGLASS_RELIQUARY_GRID, 34, 15),
  beaconfallGate: worldPointFromTile(STORMGLASS_RELIQUARY_GRID, 51, 19),
  beaconfallArrival: worldPointFromTile(STORMGLASS_RELIQUARY_GRID, 47, 19),
} as const satisfies Record<string, Vec2>;

export const BEACONFALL_CLIFFS_POINTS = {
  playerSpawn: worldPointFromTile(BEACONFALL_CLIFFS_GRID, 7, 21),
  stormglassGate: worldPointFromTile(BEACONFALL_CLIFFS_GRID, 2, 21),
  stormglassArrival: worldPointFromTile(BEACONFALL_CLIFFS_GRID, 7, 21),
  sunspireGate: worldPointFromTile(BEACONFALL_CLIFFS_GRID, 59, 21),
  sunspireArrival: worldPointFromTile(BEACONFALL_CLIFFS_GRID, 55, 21),
  astronomerSela: worldPointFromTile(BEACONFALL_CLIFFS_GRID, 14, 17),
  cliffsmithRoan: worldPointFromTile(BEACONFALL_CLIFFS_GRID, 23, 24),
  sunveilBloom1: worldPointFromTile(BEACONFALL_CLIFFS_GRID, 12, 28),
  sunveilBloom2: worldPointFromTile(BEACONFALL_CLIFFS_GRID, 27, 13),
  sunveilBloom3: worldPointFromTile(BEACONFALL_CLIFFS_GRID, 39, 26),
  skyglassSeam1: worldPointFromTile(BEACONFALL_CLIFFS_GRID, 30, 21),
  skyglassSeam2: worldPointFromTile(BEACONFALL_CLIFFS_GRID, 43, 14),
  skyglassSeam3: worldPointFromTile(BEACONFALL_CLIFFS_GRID, 51, 28),
} as const satisfies Record<string, Vec2>;

export const SUNSPIRE_OBSERVATORY_POINTS = {
  playerSpawn: worldPointFromTile(SUNSPIRE_OBSERVATORY_GRID, 7, 20),
  beaconfallGate: worldPointFromTile(SUNSPIRE_OBSERVATORY_GRID, 2, 20),
  beaconfallArrival: worldPointFromTile(SUNSPIRE_OBSERVATORY_GRID, 7, 20),
  celestialOrrery: worldPointFromTile(SUNSPIRE_OBSERVATORY_GRID, 46, 20),
  starfallRelic1: worldPointFromTile(SUNSPIRE_OBSERVATORY_GRID, 16, 10),
  starfallRelic2: worldPointFromTile(SUNSPIRE_OBSERVATORY_GRID, 25, 29),
  starfallRelic3: worldPointFromTile(SUNSPIRE_OBSERVATORY_GRID, 34, 15),
  highlandsGate: worldPointFromTile(SUNSPIRE_OBSERVATORY_GRID, 53, 20),
  highlandsArrival: worldPointFromTile(SUNSPIRE_OBSERVATORY_GRID, 49, 20),
} as const satisfies Record<string, Vec2>;

export const AURORA_HIGHLANDS_POINTS = {
  playerSpawn: worldPointFromTile(AURORA_HIGHLANDS_GRID, 7, 22),
  sunspireGate: worldPointFromTile(AURORA_HIGHLANDS_GRID, 2, 22),
  sunspireArrival: worldPointFromTile(AURORA_HIGHLANDS_GRID, 7, 22),
  zenithGate: worldPointFromTile(AURORA_HIGHLANDS_GRID, 59, 22),
  zenithArrival: worldPointFromTile(AURORA_HIGHLANDS_GRID, 55, 22),
  keeperAurell: worldPointFromTile(AURORA_HIGHLANDS_GRID, 12, 17),
  wardenMaelis: worldPointFromTile(AURORA_HIGHLANDS_GRID, 18, 27),
  archivistNerys: worldPointFromTile(AURORA_HIGHLANDS_GRID, 27, 18),
  traderVesper: worldPointFromTile(AURORA_HIGHLANDS_GRID, 35, 28),
  dawnsage1: worldPointFromTile(AURORA_HIGHLANDS_GRID, 11, 30),
  dawnsage2: worldPointFromTile(AURORA_HIGHLANDS_GRID, 28, 13),
  dawnsage3: worldPointFromTile(AURORA_HIGHLANDS_GRID, 39, 28),
  sunmetal1: worldPointFromTile(AURORA_HIGHLANDS_GRID, 31, 22),
  sunmetal2: worldPointFromTile(AURORA_HIGHLANDS_GRID, 44, 14),
  sunmetal3: worldPointFromTile(AURORA_HIGHLANDS_GRID, 51, 30),
} as const satisfies Record<string, Vec2>;

export const ZENITH_ARCHIVE_POINTS = {
  playerSpawn: worldPointFromTile(ZENITH_ARCHIVE_GRID, 7, 21),
  auroraGate: worldPointFromTile(ZENITH_ARCHIVE_GRID, 2, 21),
  auroraArrival: worldPointFromTile(ZENITH_ARCHIVE_GRID, 7, 21),
  keeperOfZenith: worldPointFromTile(ZENITH_ARCHIVE_GRID, 46, 21),
  memoryLeaf1: worldPointFromTile(ZENITH_ARCHIVE_GRID, 16, 11),
  memoryLeaf2: worldPointFromTile(ZENITH_ARCHIVE_GRID, 25, 30),
  memoryLeaf3: worldPointFromTile(ZENITH_ARCHIVE_GRID, 34, 16),
  choirwoodGate: worldPointFromTile(ZENITH_ARCHIVE_GRID, 53, 21),
  choirwoodArrival: worldPointFromTile(ZENITH_ARCHIVE_GRID, 49, 21),
} as const satisfies Record<string, Vec2>;

export const CHOIRWOOD_CANOPY_POINTS = {
  playerSpawn: worldPointFromTile(CHOIRWOOD_CANOPY_GRID, 7, 22),
  zenithGate: worldPointFromTile(CHOIRWOOD_CANOPY_GRID, 2, 22),
  zenithArrival: worldPointFromTile(CHOIRWOOD_CANOPY_GRID, 7, 22),
  crownrootGate: worldPointFromTile(CHOIRWOOD_CANOPY_GRID, 59, 22),
  crownrootArrival: worldPointFromTile(CHOIRWOOD_CANOPY_GRID, 55, 22),
  runesingerLyra: worldPointFromTile(CHOIRWOOD_CANOPY_GRID, 12, 17),
  cantorEira: worldPointFromTile(CHOIRWOOD_CANOPY_GRID, 19, 28),
  keeperOrem: worldPointFromTile(CHOIRWOOD_CANOPY_GRID, 28, 17),
  echoMoss1: worldPointFromTile(CHOIRWOOD_CANOPY_GRID, 11, 31),
  echoMoss2: worldPointFromTile(CHOIRWOOD_CANOPY_GRID, 31, 13),
  echoMoss3: worldPointFromTile(CHOIRWOOD_CANOPY_GRID, 41, 27),
  resonantBark1: worldPointFromTile(CHOIRWOOD_CANOPY_GRID, 30, 22),
  resonantBark2: worldPointFromTile(CHOIRWOOD_CANOPY_GRID, 45, 14),
  resonantBark3: worldPointFromTile(CHOIRWOOD_CANOPY_GRID, 51, 29),
} as const satisfies Record<string, Vec2>;

export const CROWNROOT_SANCTUM_POINTS = {
  playerSpawn: worldPointFromTile(CROWNROOT_SANCTUM_GRID, 7, 21),
  choirwoodGate: worldPointFromTile(CROWNROOT_SANCTUM_GRID, 2, 21),
  choirwoodArrival: worldPointFromTile(CROWNROOT_SANCTUM_GRID, 7, 21),
  runeveilGate: worldPointFromTile(CROWNROOT_SANCTUM_GRID, 53, 21),
  runeveilArrival: worldPointFromTile(CROWNROOT_SANCTUM_GRID, 49, 21),
  crownrootHierophant: worldPointFromTile(CROWNROOT_SANCTUM_GRID, 46, 21),
  hymnLeaf1: worldPointFromTile(CROWNROOT_SANCTUM_GRID, 16, 10),
  hymnLeaf2: worldPointFromTile(CROWNROOT_SANCTUM_GRID, 25, 29),
  hymnLeaf3: worldPointFromTile(CROWNROOT_SANCTUM_GRID, 34, 15),
} as const satisfies Record<string, Vec2>;

export const RUNEVEIL_GARDENS_POINTS = {
  playerSpawn: worldPointFromTile(RUNEVEIL_GARDENS_GRID, 7, 22),
  crownrootGate: worldPointFromTile(RUNEVEIL_GARDENS_GRID, 2, 22),
  crownrootArrival: worldPointFromTile(RUNEVEIL_GARDENS_GRID, 7, 22),
  namesongGate: worldPointFromTile(RUNEVEIL_GARDENS_GRID, 59, 22),
  namesongArrival: worldPointFromTile(RUNEVEIL_GARDENS_GRID, 55, 22),
  waykeeperTalin: worldPointFromTile(RUNEVEIL_GARDENS_GRID, 12, 17),
  runesmithSera: worldPointFromTile(RUNEVEIL_GARDENS_GRID, 19, 28),
  archivistPell: worldPointFromTile(RUNEVEIL_GARDENS_GRID, 28, 17),
  runebloom1: worldPointFromTile(RUNEVEIL_GARDENS_GRID, 11, 31),
  runebloom2: worldPointFromTile(RUNEVEIL_GARDENS_GRID, 31, 13),
  runebloom3: worldPointFromTile(RUNEVEIL_GARDENS_GRID, 41, 27),
  wayglass1: worldPointFromTile(RUNEVEIL_GARDENS_GRID, 30, 22),
  wayglass2: worldPointFromTile(RUNEVEIL_GARDENS_GRID, 45, 14),
  wayglass3: worldPointFromTile(RUNEVEIL_GARDENS_GRID, 51, 29),
} as const satisfies Record<string, Vec2>;

export const NAMESONG_VAULT_POINTS = {
  playerSpawn: worldPointFromTile(NAMESONG_VAULT_GRID, 7, 21),
  runeveilGate: worldPointFromTile(NAMESONG_VAULT_GRID, 2, 21),
  runeveilArrival: worldPointFromTile(NAMESONG_VAULT_GRID, 7, 21),
  waystarGate: worldPointFromTile(NAMESONG_VAULT_GRID, 53, 21),
  waystarArrival: worldPointFromTile(NAMESONG_VAULT_GRID, 49, 21),
  archivore: worldPointFromTile(NAMESONG_VAULT_GRID, 46, 21),
  hollowstar1: worldPointFromTile(NAMESONG_VAULT_GRID, 16, 10),
  hollowstar2: worldPointFromTile(NAMESONG_VAULT_GRID, 25, 29),
  hollowstar3: worldPointFromTile(NAMESONG_VAULT_GRID, 34, 15),
} as const satisfies Record<string, Vec2>;

export const WAYSTAR_MOOR_POINTS = {
  playerSpawn: worldPointFromTile(WAYSTAR_MOOR_GRID, 7, 22),
  namesongGate: worldPointFromTile(WAYSTAR_MOOR_GRID, 2, 22),
  namesongArrival: worldPointFromTile(WAYSTAR_MOOR_GRID, 7, 22),
  convergenceGate: worldPointFromTile(WAYSTAR_MOOR_GRID, 59, 22),
  convergenceArrival: worldPointFromTile(WAYSTAR_MOOR_GRID, 55, 22),
  moorwardenCalix: worldPointFromTile(WAYSTAR_MOOR_GRID, 12, 17),
  quartermasterFenn: worldPointFromTile(WAYSTAR_MOOR_GRID, 19, 28),
  pathweaverIone: worldPointFromTile(WAYSTAR_MOOR_GRID, 28, 17),
  waystarPollen1: worldPointFromTile(WAYSTAR_MOOR_GRID, 11, 31),
  waystarPollen2: worldPointFromTile(WAYSTAR_MOOR_GRID, 31, 13),
  waystarPollen3: worldPointFromTile(WAYSTAR_MOOR_GRID, 41, 27),
  convergentGlass1: worldPointFromTile(WAYSTAR_MOOR_GRID, 30, 22),
  convergentGlass2: worldPointFromTile(WAYSTAR_MOOR_GRID, 47, 14),
  convergentGlass3: worldPointFromTile(WAYSTAR_MOOR_GRID, 51, 29),
} as const satisfies Record<string, Vec2>;

export const CONVERGENCE_SPIRE_POINTS = {
  playerSpawn: worldPointFromTile(CONVERGENCE_SPIRE_GRID, 7, 21),
  waystarGate: worldPointFromTile(CONVERGENCE_SPIRE_GRID, 2, 21),
  waystarArrival: worldPointFromTile(CONVERGENCE_SPIRE_GRID, 7, 21),
  manyroadCrown: worldPointFromTile(CONVERGENCE_SPIRE_GRID, 46, 21),
  vowsteel1: worldPointFromTile(CONVERGENCE_SPIRE_GRID, 16, 10),
  vowsteel2: worldPointFromTile(CONVERGENCE_SPIRE_GRID, 25, 29),
  vowsteel3: worldPointFromTile(CONVERGENCE_SPIRE_GRID, 34, 15),
} as const satisfies Record<string, Vec2>;

/**
 * Compact authored set dressing for the adventure maps.  Each layout keeps its
 * travel entrances and local points of interest clear; the corresponding
 * verifier checks those anchors against the exported collision mask.
 */
function buildAdventureArt(
  mapId: string,
  gridSize: GridSize,
  groundColor: number,
  pathColor: number,
  obstacles: TilePropSpec[],
  paths: TilePropSpec[],
): MapArtDefinition {
  const grid = createWalkableGrid(gridSize);
  for (const obstacle of obstacles) {
    if (obstacle.solid) {
      setWalkableRect(grid, obstacle.col, obstacle.row, obstacle.width, obstacle.height, false);
    }
  }

  const ground: TilePropSpec = {
    id: `${mapId}_ground`, kind: 'plaza', col: 0, row: 0,
    width: gridSize.width, height: gridSize.height, fillColor: groundColor, alpha: 0.32,
  };
  const decoratedPaths = paths.map((path) => ({ ...path, fillColor: path.fillColor ?? pathColor }));
  return {
    collision: { mapId, tileSize: TILE_SIZE, walkable: grid },
    props: {
      mapId,
      props: [ground, ...decoratedPaths, ...obstacles].map((spec) => propFromTiles(gridSize, spec)),
    },
  };
}

const TREE = (id: string, col: number, row: number, width = 2, height = 2): TilePropSpec => ({
  id, kind: 'tree', col, row, width, height, shape: 'ellipse', fillColor: 0x365d3a,
  accentColor: 0x725038, alpha: 1, solid: true,
});
const ROCK = (id: string, col: number, row: number, width = 2, height = 2): TilePropSpec => ({
  id, kind: 'crate', col, row, width, height, fillColor: 0x626878,
  accentColor: 0x9aa3b4, alpha: 1, solid: true,
});
const FENCE = (id: string, col: number, row: number, width: number, height = 1): TilePropSpec => ({
  id, kind: 'fence', col, row, width, height, fillColor: 0x8e6c48,
  accentColor: 0xd2ad78, alpha: 1, solid: true,
});
const PATH = (id: string, col: number, row: number, width: number, height: number): TilePropSpec => ({
  id, kind: 'path', col, row, width, height, fillColor: 0xb29b70, accentColor: 0xd7bd8a, alpha: 0.68,
});

const ADVENTURE_ART: Record<string, MapArtDefinition> = {
  cloverfield_plains: buildAdventureArt('cloverfield_plains', { width: 64, height: 40 }, 0x4f8045, 0xbba477,
    [TREE('clover_oak_nw', 4, 4, 3, 3), TREE('clover_oak_sw', 7, 31, 3, 3), TREE('clover_oak_east', 54, 27, 3, 3), TREE('clover_oak_ne', 56, 5, 3, 3), FENCE('clover_hedge', 24, 8, 8), ROCK('clover_stones', 39, 23, 3, 2)],
    [PATH('clover_main_trail', 2, 22, 58, 3), PATH('clover_hollow_turn', 42, 24, 3, 10), PATH('clover_mine_track', 30, 4, 3, 18)]),
  mushroom_hollow: buildAdventureArt('mushroom_hollow', { width: 56, height: 44 }, 0x624878, 0xb08c71,
    [TREE('hollow_root_nw', 4, 4, 4, 3), TREE('hollow_root_north', 23, 3, 4, 3), TREE('hollow_root_east', 48, 9, 3, 4), TREE('hollow_root_se', 43, 35, 4, 4), ROCK('hollow_spore_rocks', 27, 24, 3, 2), FENCE('hollow_fallen_log', 12, 30, 7)],
    [PATH('hollow_west_trail', 1, 23, 28, 3), PATH('hollow_southeast_trail', 27, 25, 3, 15)]),
  whisperwood_meadows: buildAdventureArt('whisperwood_meadows', { width: 60, height: 42 }, 0x365f48, 0x9f875e,
    [TREE('wood_grove_nw', 4, 4, 5, 4), TREE('wood_grove_north', 22, 3, 5, 3), TREE('wood_grove_ne', 49, 5, 5, 4), TREE('wood_grove_sw', 6, 33, 4, 4), TREE('wood_grove_se', 48, 32, 5, 4), ROCK('wood_mossy_stones', 35, 25, 3, 2)],
    [PATH('wood_west_road', 1, 22, 57, 3), PATH('wood_hollow_path', 5, 25, 3, 10)]),
  old_mill_road: buildAdventureArt('old_mill_road', { width: 72, height: 36 }, 0x758443, 0xb69a67,
    [TREE('mill_oak_west', 5, 5, 4, 4), TREE('mill_oak_east', 62, 5, 4, 4), TREE('mill_willow_south', 54, 28, 4, 3), FENCE('mill_fence_north', 20, 8, 12), FENCE('mill_fence_south', 25, 27, 10), ROCK('mill_milestone', 42, 16, 2, 2)],
    [PATH('mill_road', 1, 18, 70, 3), PATH('millwick_lane', 35, 10, 3, 10), PATH('moonwell_turn', 56, 20, 3, 10)]),
  millwick_crossing: buildAdventureArt('millwick_crossing', { width: 44, height: 32 }, 0x497664, 0xb4996c,
    [TREE('millwick_willow_nw', 4, 4, 3, 3), TREE('millwick_willow_ne', 32, 5, 3, 3), FENCE('millwick_dock_fence', 25, 24, 9), ROCK('millwick_barrels', 16, 23, 2, 2), { id: 'millwick_well', kind: 'fountain', col: 19, row: 12, width: 3, height: 3, shape: 'ellipse', fillColor: 0x4f87a3, accentColor: 0xd4efff, alpha: 1, solid: true }],
    [PATH('millwick_west_road', 1, 18, 37, 3), PATH('millwick_dock_lane', 27, 19, 3, 8)]),
  crystal_mine_approach: buildAdventureArt('crystal_mine_approach', { width: 52, height: 38 }, 0x66745b, 0x9e8766,
    [ROCK('approach_cliff_nw', 4, 4, 6, 4), ROCK('approach_cliff_north', 20, 3, 7, 3), ROCK('approach_crystals', 34, 13, 3, 4), ROCK('approach_boulder_east', 45, 24, 3, 3), TREE('approach_pines_sw', 6, 30, 4, 3)],
    [PATH('approach_south_trail', 3, 27, 45, 3), PATH('approach_mine_track', 13, 10, 3, 20)]),
  old_crystal_mine: buildAdventureArt('old_crystal_mine', { width: 48, height: 48 }, 0x34435f, 0x687b9c,
    [ROCK('mine_wall_nw', 3, 3, 8, 4), ROCK('mine_wall_north', 18, 4, 7, 3), ROCK('mine_wall_ne', 36, 5, 7, 4), ROCK('mine_pillar_a', 16, 19, 3, 4), ROCK('mine_pillar_b', 29, 27, 3, 4), ROCK('mine_vein_south', 37, 39, 5, 3), FENCE('mine_rail', 8, 32, 10)],
    [PATH('mine_gallery', 4, 25, 40, 3), PATH('mine_deep_vein', 30, 27, 3, 14)]),
  moonwell_entrance: buildAdventureArt('moonwell_entrance', { width: 44, height: 40 }, 0x455473, 0x9d89b4,
    [TREE('moonwell_grove_nw', 3, 4, 5, 4), TREE('moonwell_grove_ne', 34, 4, 5, 4), TREE('moonwell_grove_sw', 6, 32, 5, 3), ROCK('moonwell_shoreline', 24, 22, 4, 2), { id: 'moonwell_pool', kind: 'fountain', col: 19, row: 12, width: 5, height: 5, shape: 'ellipse', fillColor: 0x547cb0, accentColor: 0xc6e6ff, alpha: 0.9, solid: true }],
    [PATH('moonwell_north_trail', 1, 22, 27, 3), PATH('moonwell_ruins_path', 25, 24, 3, 12)]),
  moonwell_ruins: buildAdventureArt('moonwell_ruins', { width: 50, height: 46 }, 0x51445f, 0x89789a,
    [ROCK('ruins_wall_nw', 3, 4, 8, 3), ROCK('ruins_wall_ne', 38, 4, 8, 3), ROCK('ruins_column_a', 15, 17, 2, 4), ROCK('ruins_column_b', 31, 18, 2, 4), ROCK('ruins_sanctum', 34, 33, 7, 5), FENCE('ruins_broken_wall', 7, 32, 9)],
    [PATH('ruins_ascent_path', 2, 24, 37, 3), PATH('ruins_inner_ring', 34, 25, 3, 11)]),
};

export const MAP_ART_BY_ID: Record<string, MapArtDefinition> = {
  hearthvale_town: buildTownArt(),
  ...ADVENTURE_ART,
};

export { RO_GRID_SIZES, RO_MAP_POINTS, RO_SAFE_ZONES } from './roMapArt.js';
