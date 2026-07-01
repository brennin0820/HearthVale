import type { MapDefinition } from '../types/world.js';
import { TILE_SIZE } from '../constants.js';

export interface MapBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

/** Map bounds from gridSize — world origin at center. */
export function getMapBounds(map: MapDefinition): MapBounds {
  const halfW = (map.gridSize.width * TILE_SIZE) / 2;
  const halfH = (map.gridSize.height * TILE_SIZE) / 2;

  let minX = -halfW;
  let maxX = halfW;
  let minY = -halfH;
  let maxY = halfH;

  const points = [
    map.playerSpawn,
    ...map.portals.map((p) => p.position),
    ...map.npcs.map((n) => n.position),
  ];

  for (const point of points) {
    minX = Math.min(minX, point.x - TILE_SIZE);
    maxX = Math.max(maxX, point.x + TILE_SIZE);
    minY = Math.min(minY, point.y - TILE_SIZE);
    maxY = Math.max(maxY, point.y + TILE_SIZE);
  }

  return { minX, maxX, minY, maxY };
}

export function clampToBounds(x: number, y: number, bounds: MapBounds): { x: number; y: number } {
  return {
    x: Math.min(Math.max(x, bounds.minX), bounds.maxX),
    y: Math.min(Math.max(y, bounds.minY), bounds.maxY),
  };
}
