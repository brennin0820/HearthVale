import type { GridSize, Rect, Vec2 } from './types.js';

/** Linear scale applied to all map grids and authored tile layouts (~2.25× area). */
export const MAP_GRID_SCALE = 1.5;

export function scaleTile(value: number): number {
  return Math.max(1, Math.round(value * MAP_GRID_SCALE));
}

export function scaleGrid(size: GridSize): GridSize {
  return {
    width: Math.max(1, Math.round(size.width * MAP_GRID_SCALE)),
    height: Math.max(1, Math.round(size.height * MAP_GRID_SCALE)),
  };
}

/** Scale a world-space point authored against the pre-scale grid. */
export function scaleWorldPoint(point: Vec2): Vec2 {
  return {
    x: Math.round(point.x * MAP_GRID_SCALE),
    y: Math.round(point.y * MAP_GRID_SCALE),
  };
}

/** Scale a world-space rect authored against the pre-scale grid. */
export function scaleWorldRect(rect: Rect): Rect {
  return {
    x: Math.round(rect.x * MAP_GRID_SCALE),
    y: Math.round(rect.y * MAP_GRID_SCALE),
    width: Math.max(1, Math.round(rect.width * MAP_GRID_SCALE)),
    height: Math.max(1, Math.round(rect.height * MAP_GRID_SCALE)),
  };
}
