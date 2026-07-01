import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import type { MapDefinition, MapPortal, Vec2 } from '../src/data/world/types.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const mapsPath = path.join(__dirname, '..', 'data', 'maps.json');

/** Max distance (world units) between linked portal spawn and reverse gate position. */
const SPAWN_PROXIMITY = 200;

/**
 * Entrance-only portals (dungeon mouths, instance doors) — no reverse required on target map.
 * Document each id so verify stays intentional, not silent.
 */
const ONE_WAY_PORTAL_IDS = new Set<string>(['mine_mouth', 'mine_exit']);

interface PortalRef {
  mapId: string;
  portal: MapPortal;
}

function dist(a: Vec2, b: Vec2): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.hypot(dx, dy);
}

function findReversePortal(
  mapsById: Map<string, MapDefinition>,
  forward: PortalRef,
): MapPortal | undefined {
  const targetMap = mapsById.get(forward.portal.targetMapId);
  if (!targetMap) return undefined;

  const sourcePos = forward.portal.position;
  const landOnTarget = forward.portal.targetSpawn;

  let best: MapPortal | undefined;
  let bestScore = Infinity;

  for (const candidate of targetMap.portals) {
    if (candidate.targetMapId !== forward.mapId) continue;

    const spawnToGate = dist(candidate.targetSpawn, sourcePos);
    const gateToLanding = dist(candidate.position, landOnTarget);
    const score = Math.min(spawnToGate, gateToLanding);

    if (score < bestScore) {
      bestScore = score;
      best = candidate;
    }
  }

  if (best && bestScore <= SPAWN_PROXIMITY) {
    return best;
  }

  return undefined;
}

const raw = await readFile(mapsPath, 'utf8');
const maps = JSON.parse(raw) as MapDefinition[];

const mapsById = new Map(maps.map((m) => [m.id, m]));
const errors: string[] = [];
const warnings: string[] = [];

for (const map of maps) {
  for (const portal of map.portals) {
    if (!mapsById.has(portal.targetMapId)) {
      errors.push(
        `[missing-target] ${map.id} portal "${portal.id}" -> unknown map "${portal.targetMapId}"`,
      );
    }
  }
}

const allPortals: PortalRef[] = [];
for (const map of maps) {
  for (const portal of map.portals) {
    allPortals.push({ mapId: map.id, portal });
  }
}

for (const ref of allPortals) {
  if (!mapsById.has(ref.portal.targetMapId)) continue;

  if (ONE_WAY_PORTAL_IDS.has(ref.portal.id)) {
    warnings.push(
      `[one-way] ${ref.mapId} portal "${ref.portal.id}" -> ${ref.portal.targetMapId} (documented)`,
    );
    continue;
  }

  const reverse = findReversePortal(mapsById, ref);
  if (!reverse) {
    errors.push(
      `[no-reverse] ${ref.mapId} portal "${ref.portal.id}" -> ${ref.portal.targetMapId} (no matching reverse within ${SPAWN_PROXIMITY}u)`,
    );
  }
}

for (const w of warnings) {
  console.log(w);
}

if (errors.length > 0) {
  console.error(`Portal verification failed (${errors.length} error(s)):`);
  for (const e of errors) {
    console.error(`  ${e}`);
  }
  process.exit(1);
}

console.log(
  `Portal verification passed (${allPortals.length} portals, ${ONE_WAY_PORTAL_IDS.size} documented one-way).`,
);
