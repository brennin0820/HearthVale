import Phaser from 'phaser';
import type { BiomeDefinition, CollisionGrid, MapDefinition, MapProp } from '../../game/data/types.js';
import { type Palette, paletteForMap } from './palette.js';
import { GROUND_DEPTH, bandStandingProps, isGroundProp } from './propDepth.js';

function hash(text: string): number {
  let result = 0;
  for (const char of text) result = Math.imul(result ^ char.charCodeAt(0), 2654435761);
  return result >>> 0;
}

function paintCollision(
  scene: Phaser.Scene,
  map: MapDefinition,
  collision: CollisionGrid | undefined,
  palette: Palette,
  layer: Phaser.GameObjects.Container,
): void {
  const width = map.gridSize.width * 32;
  const height = map.gridSize.height * 32;
  const ground = scene.add.graphics();
  ground.fillStyle(palette.ground, 1).fillRoundedRect(-width / 2, -height / 2, width, height, 24);

  if (collision) {
    const tile = collision.tileSize;
    const left = -width / 2;
    const top = -height / 2;
    ground.fillStyle(palette.walkable, 1);
    collision.walkable.forEach((row, rowIndex) => row.forEach((walkable, columnIndex) => {
      if (walkable) ground.fillRect(left + columnIndex * tile, top + rowIndex * tile, tile + 0.5, tile + 0.5);
    }));
    ground.fillStyle(palette.wall, 0.82);
    collision.walkable.forEach((row, rowIndex) => row.forEach((walkable, columnIndex) => {
      if (walkable) return;
      const touchesFloor = Boolean(
        collision.walkable[rowIndex - 1]?.[columnIndex]
        || collision.walkable[rowIndex + 1]?.[columnIndex]
        || row[columnIndex - 1]
        || row[columnIndex + 1],
      );
      if (touchesFloor) ground.fillRect(left + columnIndex * tile, top + rowIndex * tile, tile + 0.5, tile + 0.5);
    }));
    ground.lineStyle(1, palette.grid, map.kind === 'dungeon' ? 0.12 : 0.16);
    collision.walkable.forEach((row, rowIndex) => row.forEach((walkable, columnIndex) => {
      if (walkable) ground.strokeRect(left + columnIndex * tile, top + rowIndex * tile, tile, tile);
    }));
  } else {
    ground.fillStyle(palette.walkable, 1).fillRoundedRect(-width / 2 + 8, -height / 2 + 8, width - 16, height - 16, 18);
    ground.lineStyle(1, palette.grid, 0.26);
    for (let x = -width / 2; x <= width / 2; x += 64) ground.lineBetween(x, -height / 2, x, height / 2);
    for (let y = -height / 2; y <= height / 2; y += 64) ground.lineBetween(-width / 2, y, width / 2, y);
  }
  ground.lineStyle(8, palette.accent, 0.18).strokeRoundedRect(-width / 2, -height / 2, width, height, 24);
  layer.add(ground);
}

function fillPropShape(graphics: Phaser.GameObjects.Graphics, prop: MapProp, color: number, alpha: number): void {
  graphics.fillStyle(color, alpha);
  if (prop.shape === 'ellipse') graphics.fillEllipse(prop.x, prop.y, prop.width, prop.height);
  else graphics.fillRoundedRect(prop.x - prop.width / 2, prop.y - prop.height / 2, prop.width, prop.height, Math.min(7, prop.height / 3));
}

function strokePropShape(graphics: Phaser.GameObjects.Graphics, prop: MapProp, color: number, alpha: number, width = 2): void {
  graphics.lineStyle(width, color, alpha);
  if (prop.shape === 'ellipse') graphics.strokeEllipse(prop.x, prop.y, prop.width, prop.height);
  else graphics.strokeRoundedRect(prop.x - prop.width / 2, prop.y - prop.height / 2, prop.width, prop.height, Math.min(7, prop.height / 3));
}

function paintProp(graphics: Phaser.GameObjects.Graphics, prop: MapProp): void {
  const left = prop.x - prop.width / 2;
  const right = prop.x + prop.width / 2;
  const top = prop.y - prop.height / 2;
  const bottom = prop.y + prop.height / 2;
  const alpha = Math.max(0.12, Math.min(1, prop.alpha));

  if (prop.kind === 'path' || prop.kind === 'plaza') {
    fillPropShape(graphics, prop, prop.fillColor, alpha);
    graphics.lineStyle(1, prop.accentColor, prop.kind === 'path' ? 0.28 : 0.16).lineBetween(left, bottom - 3, right, bottom - 3);
    return;
  }
  if (prop.kind === 'rift') {
    graphics.fillStyle(0x120d0f, 0.48).fillEllipse(prop.x + 4, prop.y + 7, prop.width, prop.height);
    fillPropShape(graphics, prop, prop.fillColor, alpha);
    graphics.fillStyle(prop.accentColor, 0.32).fillEllipse(prop.x, prop.y, prop.width * 0.72, prop.height * 0.42);
    graphics.lineStyle(3, prop.accentColor, 0.68).strokeEllipse(prop.x, prop.y, prop.width * 0.88, prop.height * 0.72);
    graphics.lineStyle(1, 0xffdf9a, 0.58).lineBetween(left + prop.width * 0.18, prop.y, right - prop.width * 0.25, prop.y - 3);
    return;
  }
  if (prop.kind === 'crystal') {
    graphics.fillStyle(0x111719, 0.38).fillEllipse(prop.x + 4, bottom - 2, prop.width * 0.9, prop.height * 0.28);
    graphics.fillStyle(prop.fillColor, alpha).fillTriangle(left + prop.width * 0.1, bottom, prop.x - prop.width * 0.05, top, prop.x + prop.width * 0.17, bottom);
    graphics.fillStyle(prop.accentColor, 0.78).fillTriangle(prop.x - prop.width * 0.05, bottom, right - prop.width * 0.08, top + prop.height * 0.24, right - prop.width * 0.2, bottom);
    graphics.lineStyle(2, prop.accentColor, 0.34).strokeEllipse(prop.x, prop.y, prop.width * 0.94, prop.height * 0.84);
    return;
  }
  if (prop.kind === 'tree') {
    graphics.fillStyle(0x4f3522, 0.9).fillRect(prop.x - 3, prop.y - 1, 6, 15);
    fillPropShape(graphics, prop, prop.fillColor, alpha);
    graphics.fillStyle(prop.accentColor, 0.35).fillEllipse(prop.x - prop.width * 0.12, prop.y - 4, prop.width * 0.48, prop.height * 0.54);
    strokePropShape(graphics, prop, 0x20372c, 0.7, 2);
    return;
  }
  if (prop.kind === 'building') {
    graphics.fillStyle(0x101b18, 0.35).fillRoundedRect(left + 4, top + 6, prop.width, prop.height, 5);
    fillPropShape(graphics, prop, prop.fillColor, alpha);
    graphics.lineStyle(3, prop.accentColor, 0.7).lineBetween(left + 3, top + 4, right - 3, top + 4);
    graphics.lineStyle(1, 0x32291f, 0.55).lineBetween(left + 5, bottom - 4, right - 5, bottom - 4);
    return;
  }
  if (prop.kind === 'stall') {
    // Market stall: shaded counter under a striped awning on two posts.
    graphics.fillStyle(0x101b18, 0.32).fillEllipse(prop.x + 4, bottom - 2, prop.width * 0.86, prop.height * 0.2);
    const awningHeight = prop.height * 0.42;
    const counterTop = top + awningHeight + prop.height * 0.12;
    graphics.lineStyle(4, 0x5a3d27, 0.92).lineBetween(left + 10, top + awningHeight, left + 10, bottom - 2);
    graphics.lineStyle(4, 0x5a3d27, 0.92).lineBetween(right - 10, top + awningHeight, right - 10, bottom - 2);
    graphics.fillStyle(prop.fillColor, alpha).fillRoundedRect(left + 6, counterTop, prop.width - 12, bottom - counterTop - 2, 4);
    graphics.lineStyle(2, prop.accentColor, 0.5).lineBetween(left + 8, counterTop + 3, right - 8, counterTop + 3);
    graphics.fillStyle(prop.accentColor, Math.min(1, alpha + 0.04)).fillRoundedRect(left, top, prop.width, awningHeight, 6);
    const stripe = Math.max(14, prop.width / 8);
    for (let x = left + stripe; x < right - 2; x += stripe * 2) {
      graphics.fillStyle(prop.fillColor, 0.55).fillRect(x, top + 2, stripe, awningHeight - 4);
    }
    graphics.lineStyle(2, 0x32291f, 0.42).strokeRoundedRect(left, top, prop.width, awningHeight, 6);
    return;
  }
  if (prop.kind === 'fence') {
    graphics.lineStyle(5, prop.fillColor, alpha).lineBetween(left, prop.y, right, prop.y);
    for (let x = left + 4; x <= right; x += 25) graphics.lineStyle(3, prop.accentColor, 0.9).lineBetween(x, top + 3, x, bottom - 1);
    return;
  }
  if (prop.kind === 'fountain') {
    graphics.fillStyle(0x182b2c, 0.42).fillEllipse(prop.x + 3, prop.y + 4, prop.width, prop.height);
    fillPropShape(graphics, prop, prop.fillColor, alpha);
    graphics.fillStyle(0x68bfd0, 0.78).fillEllipse(prop.x, prop.y, prop.width * 0.68, prop.height * 0.55);
    graphics.fillStyle(prop.accentColor, 0.9).fillCircle(prop.x, prop.y - 3, 5);
    return;
  }
  if (prop.kind === 'gate') {
    graphics.fillStyle(0x17231f, 0.45).fillRoundedRect(left + 3, top + 5, prop.width, prop.height, 5);
    strokePropShape(graphics, prop, prop.fillColor, alpha, 5);
    graphics.lineStyle(2, prop.accentColor, 0.8).lineBetween(prop.x, top + 3, prop.x, bottom - 3);
    return;
  }
  if (prop.kind === 'planter') {
    fillPropShape(graphics, prop, prop.fillColor, alpha);
    for (let x = left + 8; x < right; x += 15) graphics.fillStyle(prop.accentColor, 0.85).fillCircle(x, prop.y - 4 + (Math.round(x) % 3), 3);
    return;
  }
  if (prop.kind === 'crate') {
    fillPropShape(graphics, prop, prop.fillColor, alpha);
    strokePropShape(graphics, prop, prop.accentColor, 0.65, 2);
    graphics.lineStyle(2, prop.accentColor, 0.48).lineBetween(left + 4, top + 3, right - 4, bottom - 3);
    return;
  }
  if (prop.kind === 'sign') {
    graphics.lineStyle(4, 0x5a3d27, 0.95).lineBetween(prop.x, prop.y, prop.x, bottom + 9);
    fillPropShape(graphics, prop, prop.fillColor, alpha);
    strokePropShape(graphics, prop, prop.accentColor, 0.62, 2);
    return;
  }
  if (prop.kind === 'training_dummy') {
    graphics.lineStyle(5, 0x5a3d27, 0.95).lineBetween(prop.x, top, prop.x, bottom + 10);
    graphics.fillStyle(prop.fillColor, alpha).fillCircle(prop.x, prop.y - 4, Math.min(11, prop.height * 0.35));
    graphics.lineStyle(4, prop.accentColor, 0.85).lineBetween(left + 5, prop.y + 2, right - 5, prop.y + 2);
    return;
  }
  if (prop.kind === 'lantern') {
    graphics.lineStyle(3, 0x50372d, 0.92).lineBetween(prop.x, prop.y, prop.x, bottom + 6);
    graphics.fillStyle(prop.accentColor, 0.16).fillCircle(prop.x, top + 5, Math.max(12, prop.width));
    graphics.fillStyle(prop.fillColor, alpha).fillRoundedRect(left + 4, top, Math.max(6, prop.width - 8), Math.max(9, prop.height * 0.45), 3);
    graphics.fillStyle(prop.accentColor, 0.94).fillCircle(prop.x, top + prop.height * 0.2, 4);
    return;
  }
  fillPropShape(graphics, prop, prop.fillColor, alpha);
  strokePropShape(graphics, prop, prop.accentColor, 0.45, 2);
}

/**
 * Paint authored props in two passes.
 *
 * Flat props (paths, plazas, rifts) bake into the ground container. Everything
 * that stands up is grouped into foot-line bands and given a depth on the actor
 * scale, so the party walks behind trees and buildings instead of in front of
 * every one of them. Props are static, so each band is drawn once — there is no
 * per-frame cost to the sorting.
 */
function paintAuthoredProps(
  scene: Phaser.Scene,
  props: readonly MapProp[],
  layer: Phaser.GameObjects.Container,
): Phaser.GameObjects.Graphics[] {
  if (props.length === 0) return [];

  const flat = props.filter(isGroundProp);
  if (flat.length > 0) {
    const groundGraphics = scene.add.graphics();
    for (const prop of [...flat].sort((a, b) => a.y - b.y)) paintProp(groundGraphics, prop);
    layer.add(groundGraphics);
  }

  return bandStandingProps(props).map((band) => {
    const graphics = scene.add.graphics().setDepth(band.depth);
    for (const prop of band.props) paintProp(graphics, prop);
    return graphics;
  });
}

function paintFallbackDecorations(scene: Phaser.Scene, map: MapDefinition, palette: Palette, layer: Phaser.GameObjects.Container): void {
  const width = map.gridSize.width * 32;
  const height = map.gridSize.height * 32;
  const seed = hash(map.id);
  const decorations = Math.min(90, Math.round(width * height / 28000));
  const graphics = scene.add.graphics();
  for (let i = 0; i < decorations; i += 1) {
    const x = -width / 2 + 34 + (((seed + i * 7919) % 1000) / 1000) * (width - 68);
    const y = -height / 2 + 34 + (((seed * 3 + i * 3571) % 1000) / 1000) * (height - 68);
    if (map.kind === 'dungeon') {
      graphics.fillStyle(palette.leaf, 0.42).fillTriangle(x - 7, y + 8, x, y - 9, x + 7, y + 8);
      graphics.fillStyle(palette.accent, 0.32).fillCircle(x, y + 1, 3);
    } else {
      graphics.fillStyle(palette.leaf, 0.38).fillCircle(x - 4, y, 5).fillCircle(x + 3, y - 3, 6);
      graphics.lineStyle(2, 0xd6e4ac, 0.18).lineBetween(x, y + 4, x, y + 10);
    }
  }
  layer.add(graphics);
}

function paintMoonwellHeart(scene: Phaser.Scene, layer: Phaser.GameObjects.Container): void {
  const graphics = scene.add.graphics();
  const center = { x: 110, y: 120 };

  graphics.fillStyle(0x182638, 0.88).fillEllipse(center.x, center.y, 720, 470);
  graphics.fillStyle(0x1f5365, 0.72).fillEllipse(center.x, center.y, 610, 390);
  graphics.fillStyle(0x3e8f9b, 0.34).fillEllipse(center.x, center.y, 470, 290);
  graphics.lineStyle(5, 0x9ce6df, 0.42).strokeEllipse(center.x, center.y, 710, 460);
  graphics.lineStyle(3, 0xbbece4, 0.36).strokeEllipse(center.x, center.y, 570, 350);
  graphics.lineStyle(2, 0xe4fff3, 0.28).strokeEllipse(center.x, center.y, 420, 250);

  graphics.fillStyle(0x5b546d, 0.96).fillRoundedRect(-500, 82, 790, 76, 18);
  graphics.lineStyle(3, 0xbfdad0, 0.34).strokeRoundedRect(-500, 82, 790, 76, 18);
  for (let x = -465; x < 265; x += 54) {
    graphics.lineStyle(2, 0xd9ebda, 0.15).lineBetween(x, 88, x + 12, 152);
  }

  graphics.fillStyle(0x676079, 0.98).fillEllipse(300, 120, 190, 145);
  graphics.lineStyle(6, 0xe2cf8d, 0.45).strokeEllipse(300, 120, 190, 145);
  graphics.fillStyle(0x1f5263, 0.92).fillEllipse(300, 120, 122, 84);
  graphics.fillStyle(0x8fe4dc, 0.22).fillEllipse(300, 120, 92, 60);
  graphics.lineStyle(2, 0xd8fff3, 0.68).strokeEllipse(300, 120, 122, 84);

  const crystals = [
    { x: -245, y: -92 }, { x: -96, y: 336 }, { x: 82, y: -114 },
    { x: 282, y: 338 }, { x: 455, y: -48 }, { x: 502, y: 262 },
  ];
  for (const crystal of crystals) {
    graphics.fillStyle(0x18252f, 0.45).fillEllipse(crystal.x + 4, crystal.y + 9, 34, 14);
    graphics.fillStyle(0x78d8d2, 0.78).fillTriangle(crystal.x - 11, crystal.y + 8, crystal.x, crystal.y - 22, crystal.x + 7, crystal.y + 8);
    graphics.fillStyle(0xd9fff1, 0.72).fillTriangle(crystal.x - 2, crystal.y + 5, crystal.x + 8, crystal.y - 13, crystal.x + 13, crystal.y + 8);
    graphics.lineStyle(2, 0xa8f3e6, 0.28).strokeCircle(crystal.x, crystal.y, 25);
  }

  graphics.fillStyle(0xf4dda0, 0.72).fillCircle(300, 120, 5);
  graphics.lineStyle(2, 0xf6e7b4, 0.34).strokeCircle(300, 120, 38);
  layer.add(graphics);
}

export interface PaintedWorld {
  /** Flat terrain and ground props, behind every actor. */
  ground: Phaser.GameObjects.Container;
  /** Standing props, depth-sorted into the actor display list. */
  propBands: Phaser.GameObjects.Graphics[];
}

export function paintWorld(
  scene: Phaser.Scene,
  map: MapDefinition,
  props: readonly MapProp[] = [],
  collision?: CollisionGrid,
  biomes: readonly BiomeDefinition[] = [],
): PaintedWorld {
  const layer = scene.add.container(0, 0).setDepth(GROUND_DEPTH);
  const palette = paletteForMap(map, biomes);
  paintCollision(scene, map, collision, palette, layer);
  const propBands = paintAuthoredProps(scene, props, layer);
  if (map.biome === 'moonwell_depths') paintMoonwellHeart(scene, layer);
  else if (props.length === 0) paintFallbackDecorations(scene, map, palette, layer);

  if (map.safeZone) {
    const zone = scene.add.graphics();
    zone.fillStyle(palette.accent, 0.035).fillRoundedRect(map.safeZone.x, map.safeZone.y, map.safeZone.width, map.safeZone.height, 16);
    zone.lineStyle(2, palette.accent, 0.18).strokeRoundedRect(map.safeZone.x, map.safeZone.y, map.safeZone.width, map.safeZone.height, 16);
    layer.add(zone);
  }
  return { ground: layer, propBands };
}

export function biomeAccent(map: MapDefinition, biomes: readonly BiomeDefinition[] = []): number {
  return paletteForMap(map, biomes).accent;
}
