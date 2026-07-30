import type { MapProp } from '../../game/data/types.js';

/**
 * Depth rules for authored map props.
 *
 * Kept free of Phaser imports so the sorting can be verified headlessly by
 * `scripts/world-painter-smoke.ts`.
 */

/** Props that lie flat on the floor and never occlude an actor. */
export const GROUND_PROPS = new Set(['path', 'plaza', 'rift']);

/** World-layer depth: everything painted flat on the ground. */
export const GROUND_DEPTH = -10000;

/**
 * Standing props share the actor depth scale — `WorldScene` sorts party,
 * monsters, NPCs, and resource nodes by `y + ACTOR_DEPTH_BASE` — so a tree or
 * building drawn further down the screen correctly covers anyone behind it.
 */
export const ACTOR_DEPTH_BASE = 10000;

/** Foot-line bucket size. Batches standing props into a few dozen draw calls. */
export const DEPTH_BAND = 16;

export function isGroundProp(prop: MapProp): boolean { return GROUND_PROPS.has(prop.kind); }

/** Screen-space base of a prop — what its depth sorts on. */
export function footY(prop: MapProp): number { return prop.y + prop.height / 2; }

/** Depth an actor standing at `y` is drawn at. */
export function actorDepth(y: number): number { return Math.round(y + ACTOR_DEPTH_BASE); }

export interface PropBand { depth: number; props: MapProp[] }

/**
 * Group standing props into foot-line bands, ordered back to front. Props are
 * static, so each band is drawn once and never touched again.
 */
export function bandStandingProps(props: readonly MapProp[]): PropBand[] {
  const bands = new Map<number, MapProp[]>();
  for (const prop of props) {
    if (isGroundProp(prop)) continue;
    const band = Math.round(footY(prop) / DEPTH_BAND);
    const bucket = bands.get(band);
    if (bucket) bucket.push(prop);
    else bands.set(band, [prop]);
  }
  return [...bands.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([band, bucket]) => ({
      depth: band * DEPTH_BAND + ACTOR_DEPTH_BASE,
      props: bucket.sort((a, b) => footY(a) - footY(b)),
    }));
}
