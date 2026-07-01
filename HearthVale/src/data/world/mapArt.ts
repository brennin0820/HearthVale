import type { GridSize, Rect, Vec2 } from './types.js';

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

const HEARTHVALE_TOWN_GRID: GridSize = { width: 48, height: 36 };

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

function worldPointFromTile(gridSize: GridSize, col: number, row: number): Vec2 {
  const halfW = (gridSize.width * TILE_SIZE) / 2;
  const halfH = (gridSize.height * TILE_SIZE) / 2;
  return {
    x: -halfW + col * TILE_SIZE + TILE_SIZE / 2,
    y: -halfH + row * TILE_SIZE + TILE_SIZE / 2,
  };
}

function worldRectFromTiles(gridSize: GridSize, col: number, row: number, width: number, height: number): Rect {
  const halfW = (gridSize.width * TILE_SIZE) / 2;
  const halfH = (gridSize.height * TILE_SIZE) / 2;
  return {
    x: -halfW + col * TILE_SIZE,
    y: -halfH + row * TILE_SIZE,
    width: width * TILE_SIZE,
    height: height * TILE_SIZE,
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

function buildTownArt(): MapArtDefinition {
  const mapId = 'hearthvale_town';
  const grid = createWalkableGrid(HEARTHVALE_TOWN_GRID);

  setWalkableRect(grid, 0, 0, HEARTHVALE_TOWN_GRID.width, 2, false);
  setWalkableRect(grid, 0, HEARTHVALE_TOWN_GRID.height - 2, HEARTHVALE_TOWN_GRID.width, 2, false);
  setWalkableRect(grid, 0, 0, 2, HEARTHVALE_TOWN_GRID.height, false);
  setWalkableRect(grid, HEARTHVALE_TOWN_GRID.width - 2, 0, 2, HEARTHVALE_TOWN_GRID.height, false);
  setWalkableRect(grid, HEARTHVALE_TOWN_GRID.width - 2, 17, 2, 4, true);

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
      setWalkableRect(grid, spec.col, spec.row, spec.width, spec.height, false);
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

export const MAP_ART_BY_ID: Record<string, MapArtDefinition> = {
  hearthvale_town: buildTownArt(),
};
