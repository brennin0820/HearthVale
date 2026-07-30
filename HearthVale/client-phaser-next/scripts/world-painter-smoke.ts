import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import type { BiomeDefinition, MapDefinition, MapProp, MapPropSet } from '../src/game/data/types.js';
import { derivePalette, paletteForMap, parseHexColor } from '../src/phaser/view/palette.js';
import { ACTOR_DEPTH_BASE, DEPTH_BAND, actorDepth, bandStandingProps, footY, isGroundProp } from '../src/phaser/view/propDepth.js';

/**
 * Verifies the two rendering contracts that are invisible to the simulation
 * smoke tests:
 *
 *  1. every authored biome resolves to a distinct, readable terrain palette
 *  2. standing props sort on the same depth scale as actors, so the party
 *     walks behind trees and buildings instead of in front of all of them
 */

const dataDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../data');
const readJson = async <T>(relative: string): Promise<T> =>
  JSON.parse(await readFile(path.join(dataDir, relative), 'utf8')) as T;

const maps = await readJson<MapDefinition[]>('maps.json');
const biomes = await readJson<BiomeDefinition[]>('biomes.json');

const channelDistance = (a: number, b: number): number => Math.hypot(
  ((a >> 16) & 0xff) - ((b >> 16) & 0xff),
  ((a >> 8) & 0xff) - ((b >> 8) & 0xff),
  (a & 0xff) - (b & 0xff),
);

// --- palettes -------------------------------------------------------------

assert.ok(biomes.length > 0, 'biomes.json should not be empty');

const biomeIds = new Set(biomes.map((biome) => biome.id));
for (const map of maps) {
  assert.ok(
    biomeIds.has(map.biome),
    `map ${map.id} uses biome "${map.biome}" with no entry in biomes.json — it would fall back to a generic per-kind palette`,
  );
}

for (const biome of biomes) {
  const palette = derivePalette(parseHexColor(biome.groundColor), parseHexColor(biome.accentColor));

  assert.ok(
    channelDistance(palette.walkable, palette.wall) > 40,
    `biome ${biome.id}: wall ${palette.wall.toString(16)} is too close to walkable ${palette.walkable.toString(16)} — collision edges would be invisible`,
  );
  assert.ok(
    channelDistance(palette.walkable, palette.ground) > 20,
    `biome ${biome.id}: floor and backdrop are indistinguishable`,
  );
  assert.ok(
    channelDistance(palette.walkable, palette.grid) > 20,
    `biome ${biome.id}: tile seams would not read against the floor`,
  );
  assert.equal(palette.accent, parseHexColor(biome.accentColor), `biome ${biome.id}: accent must be the authored colour`);
}

// Distinct biomes must not collapse onto one another.
const floors = new Map<number, string>();
for (const biome of biomes) {
  const { walkable } = derivePalette(parseHexColor(biome.groundColor), parseHexColor(biome.accentColor));
  const clash = floors.get(walkable);
  assert.equal(clash, undefined, `biomes ${clash} and ${biome.id} derive an identical floor colour`);
  floors.set(walkable, biome.id);
}

// Derivation is deterministic and independent of map kind once a biome resolves.
const sample = maps[0];
assert.deepEqual(paletteForMap(sample, biomes), paletteForMap(sample, biomes), 'palette derivation must be pure');

// --- prop depth sorting ---------------------------------------------------

let mapsWithProps = 0;
let standingTotal = 0;

for (const map of maps) {
  let propSet: MapPropSet;
  try {
    propSet = await readJson<MapPropSet>(path.join('props', `${map.id}.json`));
  } catch {
    continue;
  }
  const props = propSet.props ?? [];
  if (props.length === 0) continue;
  mapsWithProps += 1;

  const bands = bandStandingProps(props);
  const standing = props.filter((prop) => !isGroundProp(prop));
  standingTotal += standing.length;

  assert.equal(
    bands.reduce((sum, band) => sum + band.props.length, 0),
    standing.length,
    `${map.id}: every standing prop must land in exactly one band`,
  );
  assert.ok(bands.length <= standing.length, `${map.id}: banding should not create more layers than props`);

  for (let i = 1; i < bands.length; i += 1) {
    assert.ok(bands[i].depth > bands[i - 1].depth, `${map.id}: bands must be ordered back to front`);
  }

  for (const band of bands) {
    assert.ok(band.depth > ACTOR_DEPTH_BASE - 100000, `${map.id}: band depth must sit on the actor scale`);
    for (const prop of band.props) {
      assert.ok(
        Math.abs(band.depth - actorDepth(footY(prop))) <= DEPTH_BAND,
        `${map.id}: prop ${prop.id} depth ${band.depth} drifts more than one band from its foot line`,
      );
    }
  }

  // Flat ground props must never be banded — they would occlude actors.
  for (const band of bands) {
    for (const prop of band.props) {
      assert.ok(!isGroundProp(prop), `${map.id}: ground prop ${prop.id} (${prop.kind}) must stay in the ground layer`);
    }
  }
}

// The behaviour that was broken: an actor below a tree draws in front of it,
// an actor above it draws behind.
const tree: MapProp = {
  id: 'test_tree', kind: 'tree', x: 0, y: 0, width: 64, height: 64,
  shape: 'ellipse', fillColor: 0x000000, accentColor: 0x000000, alpha: 1,
};
const [treeBand] = bandStandingProps([tree]);
assert.ok(actorDepth(footY(tree) + 64) > treeBand.depth, 'an actor in front of a tree must draw over it');
assert.ok(actorDepth(footY(tree) - 64) < treeBand.depth, 'an actor behind a tree must be occluded by it');

// Every prop kind present in the data should have a dedicated paint branch.
const PAINTED_KINDS = new Set([
  'path', 'plaza', 'rift', 'crystal', 'tree', 'building', 'stall', 'fence',
  'fountain', 'gate', 'planter', 'crate', 'sign', 'training_dummy', 'lantern',
]);
const authoredKinds = new Set<string>();
for (const map of maps) {
  try {
    const propSet = await readJson<MapPropSet>(path.join('props', `${map.id}.json`));
    for (const prop of propSet.props ?? []) authoredKinds.add(prop.kind);
  } catch { /* map has no authored props */ }
}
for (const kind of authoredKinds) {
  assert.ok(PAINTED_KINDS.has(kind), `prop kind "${kind}" has no paint branch in WorldPainter — it renders as a generic blob`);
}

console.log(
  `World painter smoke passed (${biomes.length} biome palettes, ${maps.length} maps, `
  + `${standingTotal} standing props banded across ${mapsWithProps} maps, ${authoredKinds.size} prop kinds).`,
);
