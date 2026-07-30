import type { CollisionGrid, MapDefinition, Vec2 } from './types.js';

function tileCenter(map: MapDefinition, grid: CollisionGrid, column: number, row: number): Vec2 {
  const width = map.gridSize.width * grid.tileSize;
  const height = map.gridSize.height * grid.tileSize;
  return {
    x: -width / 2 + column * grid.tileSize + grid.tileSize / 2,
    y: -height / 2 + row * grid.tileSize + grid.tileSize / 2,
  };
}

function walkableTile(map: MapDefinition, grid: CollisionGrid, x: number, y: number): boolean {
  const width = map.gridSize.width * grid.tileSize;
  const height = map.gridSize.height * grid.tileSize;
  const column = Math.floor((x + width / 2) / grid.tileSize);
  const row = Math.floor((y + height / 2) / grid.tileSize);
  return Boolean(grid.walkable[row]?.[column]);
}

export function isWalkable(map: MapDefinition, grid: CollisionGrid | undefined, point: Vec2, radius = 0): boolean {
  if (!grid) return true;
  const inset = radius * Math.SQRT1_2;
  const samples = radius > 0
    ? [
      [0, 0], [radius, 0], [-radius, 0], [0, radius], [0, -radius],
      [inset, inset], [inset, -inset], [-inset, inset], [-inset, -inset],
    ]
    : [[0, 0]];
  return samples.every(([offsetX, offsetY]) => walkableTile(map, grid, point.x + offsetX, point.y + offsetY));
}

export function nearestWalkablePoint(
  map: MapDefinition,
  grid: CollisionGrid | undefined,
  point: Vec2,
  radius = 0,
  searchTiles = 10,
): Vec2 {
  if (!grid || isWalkable(map, grid, point, radius)) return { ...point };
  const width = map.gridSize.width * grid.tileSize;
  const height = map.gridSize.height * grid.tileSize;
  const originColumn = Math.floor((point.x + width / 2) / grid.tileSize);
  const originRow = Math.floor((point.y + height / 2) / grid.tileSize);
  for (let ring = 1; ring <= searchTiles; ring += 1) {
    const candidates: Vec2[] = [];
    for (let rowOffset = -ring; rowOffset <= ring; rowOffset += 1) {
      for (let columnOffset = -ring; columnOffset <= ring; columnOffset += 1) {
        if (Math.max(Math.abs(columnOffset), Math.abs(rowOffset)) !== ring) continue;
        candidates.push(tileCenter(map, grid, originColumn + columnOffset, originRow + rowOffset));
      }
    }
    candidates.sort((a, b) => Math.hypot(a.x - point.x, a.y - point.y) - Math.hypot(b.x - point.x, b.y - point.y));
    const result = candidates.find((candidate) => isWalkable(map, grid, candidate, radius));
    if (result) return result;
  }
  return { ...point };
}

export function moveWithCollisions(
  map: MapDefinition,
  grid: CollisionGrid | undefined,
  point: Vec2,
  delta: Vec2,
  radius: number,
): Vec2 {
  if (!grid) return { x: point.x + delta.x, y: point.y + delta.y };
  const diagonal = { x: point.x + delta.x, y: point.y + delta.y };
  if (isWalkable(map, grid, diagonal, radius)) return diagonal;
  const alongX = { x: point.x + delta.x, y: point.y };
  const afterX = isWalkable(map, grid, alongX, radius) ? alongX : { ...point };
  const alongY = { x: afterX.x, y: point.y + delta.y };
  if (isWalkable(map, grid, alongY, radius)) return alongY;
  const onlyY = { x: point.x, y: point.y + delta.y };
  return isWalkable(map, grid, onlyY, radius) ? onlyY : afterX;
}
