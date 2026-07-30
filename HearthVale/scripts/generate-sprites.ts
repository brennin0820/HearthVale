import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { deflateSync } from 'node:zlib';

type Rgba = [number, number, number, number];

interface SpriteSpec {
  fileName: string;
  draw: (canvas: PixelCanvas) => void;
  dir?: string;
  width?: number;
  height?: number;
}

class PixelCanvas {
  private readonly pixels: Uint8Array;

  constructor(
    readonly width: number,
    readonly height: number,
  ) {
    this.pixels = new Uint8Array(width * height * 4);
  }

  rect(x: number, y: number, width: number, height: number, color: Rgba): void {
    for (let py = y; py < y + height; py += 1) {
      for (let px = x; px < x + width; px += 1) {
        this.set(px, py, color);
      }
    }
  }

  circle(cx: number, cy: number, radius: number, color: Rgba): void {
    const r2 = radius * radius;
    for (let y = cy - radius; y <= cy + radius; y += 1) {
      for (let x = cx - radius; x <= cx + radius; x += 1) {
        const dx = x - cx;
        const dy = y - cy;
        if (dx * dx + dy * dy <= r2) this.set(x, y, color);
      }
    }
  }

  ellipse(cx: number, cy: number, rx: number, ry: number, color: Rgba): void {
    for (let y = cy - ry; y <= cy + ry; y += 1) {
      for (let x = cx - rx; x <= cx + rx; x += 1) {
        const nx = (x - cx) / rx;
        const ny = (y - cy) / ry;
        if (nx * nx + ny * ny <= 1) this.set(x, y, color);
      }
    }
  }

  diamond(cx: number, cy: number, radius: number, color: Rgba): void {
    for (let y = cy - radius; y <= cy + radius; y += 1) {
      for (let x = cx - radius; x <= cx + radius; x += 1) {
        if (Math.abs(x - cx) + Math.abs(y - cy) <= radius) this.set(x, y, color);
      }
    }
  }

  line(x0: number, y0: number, x1: number, y1: number, color: Rgba): void {
    const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
    for (let i = 0; i <= steps; i += 1) {
      const t = steps === 0 ? 0 : i / steps;
      this.set(Math.round(x0 + (x1 - x0) * t), Math.round(y0 + (y1 - y0) * t), color);
    }
  }

  encodePng(): Buffer {
    const stride = this.width * 4;
    const raw = Buffer.alloc((stride + 1) * this.height);
    for (let y = 0; y < this.height; y += 1) {
      raw[y * (stride + 1)] = 0;
      Buffer.from(this.pixels.buffer, y * stride, stride).copy(raw, y * (stride + 1) + 1);
    }

    return Buffer.concat([
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      pngChunk('IHDR', ihdr(this.width, this.height)),
      pngChunk('IDAT', deflateSync(raw)),
      pngChunk('IEND', Buffer.alloc(0)),
    ]);
  }

  private set(x: number, y: number, color: Rgba): void {
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) return;
    const offset = (y * this.width + x) * 4;
    this.pixels[offset] = color[0];
    this.pixels[offset + 1] = color[1];
    this.pixels[offset + 2] = color[2];
    this.pixels[offset + 3] = color[3];
  }
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, '..', 'data', 'assets', 'sprites');

const palette = {
  outline: [36, 31, 42, 255] as Rgba,
  shadow: [12, 10, 14, 92] as Rgba,
  cloak: [65, 113, 166, 255] as Rgba,
  cloakLight: [102, 154, 209, 255] as Rgba,
  tunic: [212, 181, 93, 255] as Rgba,
  skin: [233, 194, 145, 255] as Rgba,
  hair: [91, 59, 42, 255] as Rgba,
  lantern: [255, 218, 116, 255] as Rgba,
  portalBlue: [105, 170, 255, 210] as Rgba,
  portalBlueDark: [53, 88, 166, 210] as Rgba,
  portalGold: [255, 223, 133, 230] as Rgba,
  portalCore: [217, 245, 255, 245] as Rgba,
  leafGreen: [90, 166, 74, 255] as Rgba,
  leafGreenLight: [140, 199, 110, 255] as Rgba,
  herbStem: [107, 143, 66, 255] as Rgba,
  mushroomCap: [176, 110, 150, 255] as Rgba,
  mushroomSpot: [235, 214, 227, 255] as Rgba,
  mushroomStem: [222, 199, 163, 255] as Rgba,
  crystalPurple: [151, 110, 214, 255] as Rgba,
  crystalPurpleLight: [196, 163, 240, 255] as Rgba,
  featherBlueGrey: [173, 196, 214, 255] as Rgba,
  featherWhite: [235, 235, 240, 255] as Rgba,
  moonPale: [222, 214, 255, 235] as Rgba,
  moonCore: [245, 240, 255, 255] as Rgba,
  grassGround: [90, 143, 74, 255] as Rgba,
  grassDark: [70, 120, 58, 255] as Rgba,
  grassAccent: [143, 188, 143, 255] as Rgba,
  pathGround: [180, 150, 110, 255] as Rgba,
  pathDark: [150, 120, 85, 255] as Rgba,
  pathLight: [205, 180, 145, 255] as Rgba,
  flowerPink: [222, 150, 176, 255] as Rgba,
  flowerYellow: [235, 214, 120, 255] as Rgba,
  robeTan: [201, 168, 108, 255] as Rgba,
  hairGrey: [210, 210, 215, 255] as Rgba,
  vestGreen: [74, 122, 74, 255] as Rgba,
};

function drawHero(canvas: PixelCanvas, stride: -1 | 1): void {
  const footShift = stride;
  canvas.ellipse(16, 27, 8, 3, palette.shadow);
  canvas.rect(9, 14, 14, 11, palette.outline);
  canvas.rect(10, 14, 12, 10, palette.cloak);
  canvas.rect(12, 16, 8, 8, palette.tunic);
  canvas.rect(11, 25, 4, 3, palette.outline);
  canvas.rect(18, 25, 4, 3, palette.outline);
  canvas.rect(11 + footShift, 24, 4, 5, palette.cloakLight);
  canvas.rect(18 - footShift, 24, 4, 5, palette.cloak);
  canvas.rect(11, 7, 10, 9, palette.outline);
  canvas.rect(12, 8, 8, 8, palette.skin);
  canvas.rect(11, 6, 10, 4, palette.hair);
  canvas.rect(13, 11, 2, 2, palette.outline);
  canvas.rect(18, 11, 2, 2, palette.outline);
  canvas.rect(7, 17 + Math.max(0, stride), 3, 7, palette.outline);
  canvas.rect(22, 17 + Math.max(0, -stride), 3, 7, palette.outline);
  canvas.rect(23, 19 + Math.max(0, -stride), 2, 4, palette.lantern);
}

function drawPortal(canvas: PixelCanvas, phase: 0 | 1): void {
  const pulse = phase === 0 ? 0 : 2;
  canvas.ellipse(16, 25, 10 + pulse, 4, palette.shadow);
  canvas.ellipse(16, 17, 11 + pulse, 14, palette.portalBlueDark);
  canvas.ellipse(16, 17, 8 + pulse, 11, palette.portalBlue);
  canvas.ellipse(16, 17, 4 + pulse, 7, palette.portalCore);
  canvas.diamond(16, 17, 3 + phase, palette.portalGold);
  canvas.line(16, 4, 16, 30, palette.portalGold);
  canvas.line(7, 17, 25, 17, palette.portalGold);
  canvas.rect(15, 5 + phase, 2, 3, palette.portalCore);
  canvas.rect(15, 26 - phase, 2, 3, palette.portalCore);
}

function drawCloverHerb(canvas: PixelCanvas): void {
  canvas.ellipse(16, 27, 7, 3, palette.shadow);
  canvas.rect(14, 20, 4, 8, palette.outline);
  canvas.rect(15, 21, 2, 7, palette.herbStem);
  const leafSpots: Array<[number, number]> = [
    [16, 10],
    [10, 17],
    [22, 17],
  ];
  for (const [lx, ly] of leafSpots) {
    canvas.circle(lx, ly, 6, palette.outline);
    canvas.circle(lx, ly, 5, palette.leafGreen);
  }
  canvas.circle(16, 8, 2, palette.leafGreenLight);
}

function drawSporeCap(canvas: PixelCanvas): void {
  canvas.ellipse(16, 27, 7, 3, palette.shadow);
  canvas.rect(13, 17, 6, 10, palette.outline);
  canvas.rect(14, 17, 4, 9, palette.mushroomStem);
  canvas.ellipse(16, 14, 9, 6, palette.outline);
  canvas.ellipse(16, 14, 8, 5, palette.mushroomCap);
  canvas.circle(12, 12, 1, palette.mushroomSpot);
  canvas.circle(19, 11, 1, palette.mushroomSpot);
  canvas.circle(16, 15, 1, palette.mushroomSpot);
}

function drawCrystalShard(canvas: PixelCanvas): void {
  canvas.ellipse(16, 27, 7, 3, palette.shadow);
  canvas.diamond(10, 21, 5, palette.outline);
  canvas.diamond(10, 21, 4, palette.crystalPurple);
  canvas.diamond(17, 16, 11, palette.outline);
  canvas.diamond(17, 16, 10, palette.crystalPurple);
  canvas.diamond(17, 12, 4, palette.crystalPurpleLight);
}

function drawGaleFeather(canvas: PixelCanvas): void {
  canvas.ellipse(16, 27, 7, 3, palette.shadow);
  canvas.ellipse(16, 16, 6, 12, palette.outline);
  canvas.ellipse(16, 16, 5, 11, palette.featherBlueGrey);
  canvas.ellipse(16, 16, 3, 9, palette.featherWhite);
  canvas.line(16, 6, 16, 26, palette.herbStem);
  canvas.line(16, 12, 11, 15, palette.featherBlueGrey);
  canvas.line(16, 12, 21, 15, palette.featherBlueGrey);
  canvas.line(16, 19, 11, 22, palette.featherBlueGrey);
  canvas.line(16, 19, 21, 22, palette.featherBlueGrey);
}

function drawMoonFlake(canvas: PixelCanvas): void {
  canvas.ellipse(16, 27, 7, 3, palette.shadow);
  canvas.diamond(16, 16, 8, palette.outline);
  canvas.diamond(16, 16, 7, palette.moonPale);
  canvas.line(16, 5, 16, 27, palette.moonPale);
  canvas.line(5, 16, 27, 16, palette.moonPale);
  canvas.circle(16, 16, 3, palette.moonCore);
}

function drawJellybud(canvas: PixelCanvas): void {
  canvas.ellipse(16, 28, 8, 3, palette.shadow);
  canvas.diamond(16, 10, 3, palette.herbStem);
  canvas.ellipse(16, 20, 10, 9, palette.outline);
  canvas.ellipse(16, 20, 9, 8, palette.leafGreen);
  canvas.ellipse(16, 23, 6, 4, palette.leafGreenLight);
  canvas.rect(12, 17, 2, 2, palette.outline);
  canvas.rect(18, 17, 2, 2, palette.outline);
}

function drawSpriggle(canvas: PixelCanvas): void {
  canvas.ellipse(16, 27, 7, 3, palette.shadow);
  canvas.line(9, 20, 4, 16, palette.herbStem);
  canvas.line(23, 20, 28, 16, palette.herbStem);
  canvas.ellipse(16, 19, 7, 8, palette.outline);
  canvas.ellipse(16, 19, 6, 7, palette.herbStem);
  canvas.rect(13, 21, 6, 3, palette.hair);
  canvas.diamond(16, 9, 6, palette.outline);
  canvas.diamond(16, 9, 5, palette.leafGreen);
  canvas.circle(13, 8, 2, palette.leafGreenLight);
  canvas.circle(19, 8, 2, palette.leafGreenLight);
  canvas.rect(13, 18, 2, 2, palette.outline);
  canvas.rect(18, 18, 2, 2, palette.outline);
}

function drawPuffshroom(canvas: PixelCanvas): void {
  canvas.ellipse(16, 27, 7, 3, palette.shadow);
  canvas.rect(12, 18, 8, 10, palette.outline);
  canvas.rect(13, 18, 6, 9, palette.mushroomStem);
  canvas.ellipse(16, 14, 10, 7, palette.outline);
  canvas.ellipse(16, 14, 9, 6, palette.mushroomCap);
  canvas.circle(11, 12, 1, palette.mushroomSpot);
  canvas.circle(20, 11, 1, palette.mushroomSpot);
  canvas.circle(16, 16, 1, palette.mushroomSpot);
  canvas.rect(14, 21, 2, 2, palette.outline);
  canvas.rect(17, 21, 2, 2, palette.outline);
}

function drawGrassBase(canvas: PixelCanvas): void {
  canvas.rect(0, 0, 32, 32, palette.grassGround);
  const blades: Array<[number, number]> = [
    [4, 6],
    [11, 3],
    [19, 8],
    [27, 5],
    [6, 18],
    [15, 22],
    [23, 19],
    [29, 26],
    [3, 27],
  ];
  for (const [bx, by] of blades) {
    canvas.line(bx, by, bx, by - 3, palette.grassDark);
  }
}

function drawGrassClover(canvas: PixelCanvas): void {
  drawGrassBase(canvas);
  const clusters: Array<[number, number]> = [
    [9, 12],
    [22, 22],
    [17, 7],
  ];
  for (const [cx, cy] of clusters) {
    canvas.circle(cx, cy, 2, palette.leafGreen);
    canvas.circle(cx - 2, cy + 1, 2, palette.leafGreen);
    canvas.circle(cx + 2, cy + 1, 2, palette.leafGreen);
  }
}

function drawGrassFlower(canvas: PixelCanvas): void {
  drawGrassBase(canvas);
  const flowers: Array<[number, number, Rgba]> = [
    [8, 9, palette.flowerYellow],
    [24, 14, palette.flowerPink],
    [14, 25, palette.flowerYellow],
    [28, 24, palette.flowerPink],
  ];
  for (const [fx, fy, color] of flowers) {
    canvas.circle(fx - 1, fy, 1, color);
    canvas.circle(fx + 1, fy, 1, color);
    canvas.circle(fx, fy - 1, 1, color);
    canvas.circle(fx, fy + 1, 1, color);
    canvas.circle(fx, fy, 1, palette.moonCore);
  }
}

function drawDirtPath(canvas: PixelCanvas): void {
  canvas.rect(0, 0, 32, 32, palette.pathGround);
  const specks: Array<[number, number, Rgba]> = [
    [5, 6, palette.pathDark],
    [13, 4, palette.pathLight],
    [21, 9, palette.pathDark],
    [28, 6, palette.pathDark],
    [8, 17, palette.pathLight],
    [17, 20, palette.pathDark],
    [25, 18, palette.pathLight],
    [4, 26, palette.pathDark],
    [12, 28, palette.pathLight],
    [22, 27, palette.pathDark],
  ];
  for (const [sx, sy, color] of specks) {
    canvas.circle(sx, sy, 1, color);
  }
}

function drawElderPortrait(canvas: PixelCanvas): void {
  canvas.rect(14, 44, 36, 20, palette.outline);
  canvas.rect(15, 44, 34, 19, palette.robeTan);
  canvas.rect(15, 44, 34, 4, palette.tunic);
  canvas.rect(28, 36, 8, 10, palette.skin);
  canvas.ellipse(32, 26, 15, 17, palette.outline);
  canvas.ellipse(32, 26, 14, 16, palette.skin);
  canvas.ellipse(32, 43, 12, 9, palette.hairGrey);
  canvas.rect(18, 11, 28, 9, palette.hairGrey);
  canvas.rect(24, 24, 6, 2, palette.hairGrey);
  canvas.rect(34, 24, 6, 2, palette.hairGrey);
  canvas.rect(25, 27, 3, 3, palette.outline);
  canvas.rect(36, 27, 3, 3, palette.outline);
  canvas.circle(32, 48, 4, palette.outline);
  canvas.circle(32, 48, 3, palette.crystalPurpleLight);
}

function drawMerchantPortrait(canvas: PixelCanvas): void {
  canvas.rect(12, 44, 40, 20, palette.outline);
  canvas.rect(13, 44, 38, 19, palette.vestGreen);
  canvas.rect(24, 44, 16, 6, palette.tunic);
  canvas.rect(28, 36, 8, 10, palette.skin);
  canvas.ellipse(32, 26, 15, 16, palette.outline);
  canvas.ellipse(32, 26, 14, 15, palette.skin);
  canvas.rect(18, 11, 28, 9, palette.hair);
  canvas.rect(26, 33, 12, 3, palette.hair);
  canvas.rect(25, 26, 3, 3, palette.outline);
  canvas.rect(36, 26, 3, 3, palette.outline);
  canvas.circle(32, 52, 4, palette.outline);
  canvas.circle(32, 52, 3, palette.lantern);
}

const sprites: SpriteSpec[] = [
  { fileName: 'player_down_0.png', draw: (canvas) => drawHero(canvas, -1) },
  { fileName: 'player_down_1.png', draw: (canvas) => drawHero(canvas, 1) },
  { fileName: 'portal_0.png', draw: (canvas) => drawPortal(canvas, 0) },
  { fileName: 'portal_1.png', draw: (canvas) => drawPortal(canvas, 1) },
  { fileName: 'clover_herb.png', dir: 'items', draw: drawCloverHerb },
  { fileName: 'spore_cap.png', dir: 'items', draw: drawSporeCap },
  { fileName: 'crystal_shard.png', dir: 'items', draw: drawCrystalShard },
  { fileName: 'gale_feather.png', dir: 'items', draw: drawGaleFeather },
  { fileName: 'moon_flake.png', dir: 'items', draw: drawMoonFlake },
  { fileName: 'jellybud.png', dir: 'monsters', draw: drawJellybud },
  { fileName: 'spriggle.png', dir: 'monsters', draw: drawSpriggle },
  { fileName: 'puffshroom.png', dir: 'monsters', draw: drawPuffshroom },
  { fileName: 'grass_base.png', dir: 'tiles', draw: drawGrassBase },
  { fileName: 'grass_clover.png', dir: 'tiles', draw: drawGrassClover },
  { fileName: 'grass_flower.png', dir: 'tiles', draw: drawGrassFlower },
  { fileName: 'dirt_path.png', dir: 'tiles', draw: drawDirtPath },
  { fileName: 'elder.png', dir: 'portraits', draw: drawElderPortrait, width: 64, height: 64 },
  { fileName: 'merchant_silas.png', dir: 'portraits', draw: drawMerchantPortrait, width: 64, height: 64 },
];

for (const sprite of sprites) {
  const targetDir = sprite.dir ? path.join(outDir, sprite.dir) : outDir;
  await mkdir(targetDir, { recursive: true });
  const canvas = new PixelCanvas(sprite.width ?? 32, sprite.height ?? 32);
  sprite.draw(canvas);
  await writeFile(path.join(targetDir, sprite.fileName), canvas.encodePng());
}

console.log(`Generated ${sprites.length} sprites in ${outDir}`);

function ihdr(width: number, height: number): Buffer {
  const buffer = Buffer.alloc(13);
  buffer.writeUInt32BE(width, 0);
  buffer.writeUInt32BE(height, 4);
  buffer[8] = 8;
  buffer[9] = 6;
  buffer[10] = 0;
  buffer[11] = 0;
  buffer[12] = 0;
  return buffer;
}

function pngChunk(type: string, data: Buffer): Buffer {
  const typeBuffer = Buffer.from(type, 'ascii');
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 0);
  return Buffer.concat([length, typeBuffer, data, crc]);
}

function crc32(buffer: Buffer): number {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let i = 0; i < 8; i += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}
