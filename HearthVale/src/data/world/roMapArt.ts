import type { MapArtDefinition, MapPropDefinition, MapPropKind } from './mapArt.js';
import type { GridSize, Rect, Vec2 } from './types.js';
import { MAP_GRID_SCALE, scaleTile } from './mapScale.js';

const TILE_SIZE = 32;

interface RoMapSpec {
  id: string;
  rows: string[];
}

const RO_MAP_ROWS = {
  hearthvale_town_ro: [
    '################################################',
    '##TTTT....TTT.............TTT...........TTTT..##',
    '##T....BBBBBBB.....=====.....BBBBBBB.......T..##',
    '##.....B INN B.....=...=.....B SHOPB..........##',
    '##.....BBBBBBB.....=...=.....BBBBBBB.....TT...##',
    '##..................=...=.....................##',
    '##.........FFFF.....=...=.....FFFF............##',
    '##.........F..F..NNN=====NNN..F..F............##',
    '##.........F..F.....=...=.....F..F............##',
    '##.........FFFF...,,,~~~,,,...FFFF............##',
    '##...............,,,~~~~~,,,..................##',
    '##===============,,,~~~~~,,,=============P....##',
    '##...............,,,~~~~~,,,.............P....##',
    '##..................=...=...........N.........##',
    '##.....BBBBBB.......=...=.....BBBBBBBB........##',
    '##.....BHOME B......=...=.....B GUILD B.......##',
    '##.....BBBBBB.......=...=.....BBBBBBBB........##',
    '##..................=...=.....................##',
    '##..TT.......GG.....=...=.....GG........TT....##',
    '##..TT..............=====...............TTT...##',
    '##.............BBBBB.....BBBBB................##',
    '##.............BSTORE....BBAKE................##',
    '##.............BBBBB.....BBBBB................##',
    '##..TTT.................................TTT...##',
    '##TTTTT..............FFFF..............TTTTT..##',
    '##...................FNNF.....................##',
    '##...................FFFF.....................##',
    '################################################',
  ],
  cloverfield_plains_ro: [
    '########################################################',
    '##TTTTTTT,,,,,,,,,,,,,,,,TTTTTTT,,,,,,,,,,,,,,,,TTTTT###',
    '##T,,,,,,,,,,GG,,,,,,,,,,T,,,,,,,,,,,,,,,GG,,,,,,,,,T###',
    '##T,,,,,SSSS,,,,,,,,,,,,,T,,,,,,,,,SSSS,,,,,,,,,,,,,T###',
    '##T,,,,,SSSS,,,,,,,,,,,,,,,,,,,,,,,SSSS,,,,,,,,,,,,,T###',
    '##T,,,,,,,,,,,,,,,,,====,,,,,,,,,,,,,,,,,,,,,,,,,,,,,T##',
    '##T,,,,,,,,,,,,,,,,,=..=,,,,,,,,,,,,,,,,,,,,,,,,,,,,,T##',
    '##P==================..==========================P,,,T##',
    '##P.................=..=.........................P,,,T##',
    '##T,,,,,,,,,,,,,,,,,=..=,,,,,,,,,,,,,,,,,,,,,,,,,,,,T###',
    '##T,,,,,,,,GG,,,,,,,=..=,,,,,,,,GG,,,,,,,,,,,,,,,,,,T###',
    '##T,,,,,,,,,,,,,,,,,=..=,,,,,,,,,,,,,,,,,,,,,,,,,,,,T###',
    '##T,,,,,,,,,,,,,,,SS=..=SS,,,,,,,,,,,,,,,,SSSS,,,,,,T###',
    '##T,,,,,,,,,,,,,,,SS=..=SS,,,,,,,,,,,,,,,,SSSS,,,,,,T###',
    '##TTTTT,,,,,,,,,,,,,=..=,,,,,,,,,,,,,,,,,,,,,,,,TTTTT###',
    '######T,,,,,,,,,,,,,=..=,,,,,,,,,,,,,,,,,,,,,,,,T#######',
    '##....T,,,,,,,=======..=======,,,,,,,,,,,,,,,,,,,T...###',
    '##....T,,,,,,,=..............=,,,,,,,,GG,,,,,,,,,T...###',
    '##....T,,,,,,,=..............=,,,,,,,,,,,,,,,,,,,T...###',
    '##....T,,,,,,,====P=====P=====,,,,,,,,,,,,,,,,,,,T...###',
    '##....T,,,,,,,,,,,P.....P,,,,,,,,,,,,,,,,,,,,,,,,T...###',
    '##....TTTT,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,TTTT...###',
    '##.......T,,,,SSSS,,,,,,,,,,,,,,,,SSSS,,,,,,,,T......###',
    '##.......T,,,,SSSS,,,,,,,,,,,,,,,,SSSS,,,,,,,,T......###',
    '##.......T,,,,,,,,,,,,GG,,,,,,,,,,,,,,,,GG,,,,T......###',
    '##.......TTTTTTT,,,,,,,,,,,,,,,,,,,,,,,,TTTTTTT......###',
    '##....................................................##',
    '##....................................................##',
    '########################################################',
    '########################################################',
  ],
  old_crystal_mine_ro_b1: [
    '##################################################',
    '#######################RRRR#######################',
    '#########.............#....#.............#########',
    '#########.CCCC..SSSS..#....#..SSSS..CCCC.#########',
    '#########.............#....#.............#########',
    '###############.#######....#######.###############',
    '######.........#................#.........########',
    '######.CCCC....#................#....CCCC.########',
    '######.........#......CCCC......#.........########',
    '######.#######.########..########.#######.########',
    '##P...#.....#....................#.....#....RRR###',
    '##P...#.....#..SSSS........SSSS..#.....#....R.R###',
    '##....#..C..#..SSSS........SSSS..#..C..#....R.R###',
    '######...C..##########..##########..C...##########',
    '######......#........#..#........#......##########',
    '##########..#..CCCC..#..#..CCCC..#..##############',
    '######......#........#..#........#......##########',
    '######.####.##########..##########.####.##########',
    '######.#..#........................#..#.##########',
    '######.#..#..SSSS............SSSS..#..#.##########',
    '######.#..#..SSSS....CCCC....SSSS..#..#.##########',
    '######.#..###########....###########..#.##########',
    '######.#.............#..#.............#.##########',
    '######.##########....#..#....##########.##########',
    '######..........#....#..#....#..........##########',
    '###############.#....#..#....#.###################',
    '###############.#....#..#....#.###################',
    '###############.######PP######.###################',
    '###############........XX........#################',
    '#######################XX#########################',
    '##################################################',
    '##################################################',
  ],
} as const;

const BLOCKING_TILES = new Set(['#', 'T', 'B', 'F', 'C', 'R', 'X', 'I', 'H', 'O', 'M', 'E', 'U', 'L', 'D', 'A', 'K']);

const TILE_STYLE: Record<string, { kind: MapPropKind; fillColor: number; accentColor: number; alpha?: number }> = {
  ',': { kind: 'plaza', fillColor: 0x58794c, accentColor: 0x8fcf70, alpha: 0.45 },
  '=': { kind: 'path', fillColor: 0xb79a65, accentColor: 0xe0c78e, alpha: 0.9 },
  '~': { kind: 'fountain', fillColor: 0x4b8aa6, accentColor: 0xa8ddf0, alpha: 0.82 },
  T: { kind: 'tree', fillColor: 0x315f3b, accentColor: 0x7a5235 },
  B: { kind: 'building', fillColor: 0x80614b, accentColor: 0xd8b582 },
  F: { kind: 'fence', fillColor: 0xc09a69, accentColor: 0xe2c38f },
  C: { kind: 'crate', fillColor: 0x78bed0, accentColor: 0xd8f7ff },
  R: { kind: 'sign', fillColor: 0x697077, accentColor: 0xb5c0c4 },
  G: { kind: 'planter', fillColor: 0x7dae55, accentColor: 0xc8ed9f },
  P: { kind: 'gate', fillColor: 0xf1c75b, accentColor: 0xffe6a2 },
  X: { kind: 'training_dummy', fillColor: 0xd44d4d, accentColor: 0xffb1a8 },
};

export const RO_GRID_SIZES = {
  hearthvale_town_ro: gridSizeFromRows(scaleAsciiRows(RO_MAP_ROWS.hearthvale_town_ro)),
  cloverfield_plains_ro: gridSizeFromRows(scaleAsciiRows(RO_MAP_ROWS.cloverfield_plains_ro)),
  old_crystal_mine_ro_b1: gridSizeFromRows(scaleAsciiRows(RO_MAP_ROWS.old_crystal_mine_ro_b1)),
} as const satisfies Record<keyof typeof RO_MAP_ROWS, GridSize>;

export const RO_MAP_POINTS = {
  hearthvaleTown: {
    playerSpawn: tilePoint(RO_GRID_SIZES.hearthvale_town_ro, scaleTile(24), scaleTile(17)),
    eastGate: tilePoint(RO_GRID_SIZES.hearthvale_town_ro, scaleTile(45), scaleTile(11)),
    eastGateArrival: tilePoint(RO_GRID_SIZES.hearthvale_town_ro, scaleTile(44), scaleTile(11)),
    elder: tilePoint(RO_GRID_SIZES.hearthvale_town_ro, scaleTile(23), scaleTile(7)),
    merchantSilas: tilePoint(RO_GRID_SIZES.hearthvale_town_ro, scaleTile(37), scaleTile(13)),
    hearthCourier: tilePoint(RO_GRID_SIZES.hearthvale_town_ro, scaleTile(22), scaleTile(25)),
    trainerBram: tilePoint(RO_GRID_SIZES.hearthvale_town_ro, scaleTile(25), scaleTile(25)),
    priestessWren: tilePoint(RO_GRID_SIZES.hearthvale_town_ro, scaleTile(15), scaleTile(17)),
    lanternspireGate: tilePoint(RO_GRID_SIZES.hearthvale_town_ro, scaleTile(18), scaleTile(17)),
  },
  cloverfieldPlains: {
    playerSpawn: tilePoint(RO_GRID_SIZES.cloverfield_plains_ro, scaleTile(4), scaleTile(10)),
    westGate: tilePoint(RO_GRID_SIZES.cloverfield_plains_ro, scaleTile(2), scaleTile(7)),
    scoutPip: tilePoint(RO_GRID_SIZES.cloverfield_plains_ro, scaleTile(10), scaleTile(8)),
    hollowTrail: tilePoint(RO_GRID_SIZES.cloverfield_plains_ro, scaleTile(51), scaleTile(7)),
    mineMouth: tilePoint(RO_GRID_SIZES.cloverfield_plains_ro, scaleTile(31), scaleTile(19)),
    approachTrail: tilePoint(RO_GRID_SIZES.cloverfield_plains_ro, scaleTile(26), scaleTile(19)),
    whisperwoodTrail: tilePoint(RO_GRID_SIZES.cloverfield_plains_ro, scaleTile(53), scaleTile(26)),
    cloverPatch1: tilePoint(RO_GRID_SIZES.cloverfield_plains_ro, scaleTile(14), scaleTile(10)),
    cloverPatch2: tilePoint(RO_GRID_SIZES.cloverfield_plains_ro, scaleTile(37), scaleTile(10)),
    cloverPatch3: tilePoint(RO_GRID_SIZES.cloverfield_plains_ro, scaleTile(15), scaleTile(23)),
    cloverPatch4: tilePoint(RO_GRID_SIZES.cloverfield_plains_ro, scaleTile(43), scaleTile(23)),
  },
  oldCrystalMineB1: {
    playerSpawn: tilePoint(RO_GRID_SIZES.old_crystal_mine_ro_b1, scaleTile(5), scaleTile(12)),
    mineExit: tilePoint(RO_GRID_SIZES.old_crystal_mine_ro_b1, scaleTile(2), scaleTile(10)),
    bossDoor: tilePoint(RO_GRID_SIZES.old_crystal_mine_ro_b1, scaleTile(24), scaleTile(27)),
  },
} as const;

export const RO_SAFE_ZONES = {
  hearthvale_town_ro: tileRect(RO_GRID_SIZES.hearthvale_town_ro, scaleTile(2), scaleTile(1), scaleTile(44), scaleTile(26)),
} as const;

export const RO_MAP_ART_BY_ID: Record<keyof typeof RO_MAP_ROWS, MapArtDefinition> = {
  hearthvale_town_ro: buildAsciiMapArt({ id: 'hearthvale_town_ro', rows: scaleAsciiRows([...RO_MAP_ROWS.hearthvale_town_ro]) }),
  cloverfield_plains_ro: buildAsciiMapArt({ id: 'cloverfield_plains_ro', rows: scaleAsciiRows([...RO_MAP_ROWS.cloverfield_plains_ro]) }),
  old_crystal_mine_ro_b1: buildAsciiMapArt({ id: 'old_crystal_mine_ro_b1', rows: scaleAsciiRows([...RO_MAP_ROWS.old_crystal_mine_ro_b1]) }),
};

function scaleAsciiRows(rows: readonly string[]): string[] {
  const srcH = rows.length;
  const srcW = rows[0]?.length ?? 0;
  const dstH = Math.round(srcH * MAP_GRID_SCALE);
  const dstW = Math.round(srcW * MAP_GRID_SCALE);
  const out: string[] = [];
  for (let y = 0; y < dstH; y += 1) {
    const srcY = Math.min(srcH - 1, Math.floor(y / MAP_GRID_SCALE));
    let line = '';
    for (let x = 0; x < dstW; x += 1) {
      const srcX = Math.min(srcW - 1, Math.floor(x / MAP_GRID_SCALE));
      line += rows[srcY][srcX] ?? '#';
    }
    out.push(line);
  }
  return out;
}

function gridSizeFromRows(rows: readonly string[]): GridSize {
  return {
    width: rows[0]?.length ?? 0,
    height: rows.length,
  };
}

function tilePoint(gridSize: GridSize, col: number, row: number): Vec2 {
  return {
    x: col * TILE_SIZE - (gridSize.width * TILE_SIZE) / 2 + TILE_SIZE / 2,
    y: row * TILE_SIZE - (gridSize.height * TILE_SIZE) / 2 + TILE_SIZE / 2,
  };
}

function tileRect(gridSize: GridSize, col: number, row: number, width: number, height: number): Rect {
  return {
    x: col * TILE_SIZE - (gridSize.width * TILE_SIZE) / 2,
    y: row * TILE_SIZE - (gridSize.height * TILE_SIZE) / 2,
    width: width * TILE_SIZE,
    height: height * TILE_SIZE,
  };
}

function buildAsciiMapArt(spec: RoMapSpec): MapArtDefinition {
  const gridSize = gridSizeFromRows(spec.rows);
  const walkable = spec.rows.map((row) => [...row].map((tile) => !BLOCKING_TILES.has(tile)));

  return {
    collision: {
      mapId: spec.id,
      tileSize: TILE_SIZE,
      walkable,
    },
    props: {
      mapId: spec.id,
      props: buildProps(spec.id, spec.rows, gridSize),
    },
  };
}

function buildProps(mapId: string, rows: string[], gridSize: GridSize): MapPropDefinition[] {
  const props: MapPropDefinition[] = [];
  for (let row = 0; row < rows.length; row += 1) {
    let col = 0;
    while (col < rows[row].length) {
      const tile = rows[row][col];
      const style = TILE_STYLE[tile];
      if (!style) {
        col += 1;
        continue;
      }

      let width = 1;
      while (rows[row][col + width] === tile) {
        width += 1;
      }

      const rect = tileRect(gridSize, col, row, width, 1);
      props.push({
        id: `${mapId}_${row}_${col}_${tileName(tile)}`,
        kind: style.kind,
        x: rect.x + rect.width / 2,
        y: rect.y + rect.height / 2,
        width: rect.width,
        height: rect.height,
        shape: tile === 'T' || tile === '~' ? 'ellipse' : 'rect',
        fillColor: style.fillColor,
        accentColor: style.accentColor,
        alpha: style.alpha ?? 1,
      });
      col += width;
    }
  }

  return props;
}

function tileName(tile: string): string {
  switch (tile) {
    case ',':
      return 'grass';
    case '=':
      return 'road';
    case '~':
      return 'water';
    default:
      return tile.toLowerCase();
  }
}
