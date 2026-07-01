import { appendFile, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const resourcesDir = path.join(path.dirname(fileURLToPath(import.meta.url)), 'resources');

interface ResourceHub {
  id: string;
  name: string;
  url: string;
  searchUrl?: string;
  lanes?: string[];
  licenses?: string[];
  notes?: string;
}

interface ResourceRegistry {
  hubs: ResourceHub[];
  laneDefaults: Record<string, string[]>;
}

type Lane = 'engine' | 'pixel' | 'world' | 'design' | 'audio' | 'all';

const LANE_ALIASES: Record<string, Lane> = {
  jupiter: 'engine',
  mercury: 'pixel',
  uranus: 'world',
  saturn: 'design',
  neptune: 'audio',
  engine: 'engine',
  pixel: 'pixel',
  world: 'world',
  design: 'design',
  audio: 'audio',
  all: 'all',
};

function encodeQuery(q: string): string {
  return encodeURIComponent(q.trim().replace(/\s+/g, ' '));
}

async function loadRegistry(): Promise<ResourceRegistry> {
  const raw = await readFile(path.join(resourcesDir, 'registry.json'), 'utf8');
  return JSON.parse(raw) as ResourceRegistry;
}

function pickHubs(registry: ResourceRegistry, lane: Lane, hubFilter?: string): ResourceHub[] {
  if (hubFilter) {
    const hub = registry.hubs.find((h) => h.id === hubFilter);
    return hub ? [hub] : [];
  }
  if (lane === 'all') return registry.hubs;
  const ids = registry.laneDefaults[lane] ?? [];
  return registry.hubs.filter((h) => ids.includes(h.id));
}

const [topicArg, laneArg = 'all', hubArg] = process.argv.slice(2);

if (!topicArg) {
  console.log(`Usage: research <topic> [lane|planet] [hub-id]

Lanes: engine|pixel|world|design|audio|all
Planets: jupiter|mercury|uranus|saturn|neptune

Examples:
  npm run hearthvale -- research "top down 16x16 dungeon tileset" pixel
  npm run hearthvale -- research "cozy town BGM loop" neptune
  npm run hearthvale -- research "Tiled portal objects" world kenney
`);
  process.exit(0);
}

const lane = LANE_ALIASES[laneArg.toLowerCase()] ?? 'all';
const registry = await loadRegistry();
const hubs = pickHubs(registry, lane, hubArg);

if (hubs.length === 0) {
  console.error(`No hubs matched lane="${laneArg}" hub="${hubArg ?? ''}"`);
  process.exit(1);
}

console.log(`\nHearthVale Research — "${topicArg}" (${lane})\n`);

const lines: string[] = [];
for (const hub of hubs) {
  const searchLink = hub.searchUrl
    ? hub.searchUrl.replace('{query}', encodeQuery(topicArg))
    : hub.url;
  console.log(`• ${hub.name}`);
  console.log(`  ${searchLink}`);
  if (hub.licenses?.length) console.log(`  License: ${hub.licenses.join(', ')}`);
  if (hub.notes) console.log(`  Note: ${hub.notes}`);
  console.log('');
  lines.push(`${hub.id}\t${searchLink}`);
}

// GitHub code search angle (hunt skill pattern)
const ghQuery = encodeQuery(`${topicArg} phaser OR tiled OR rpg language:TypeScript`);
console.log(`• GitHub code search`);
console.log(`  https://github.com/search?q=${ghQuery}&type=code\n`);

const logEntry = {
  ts: new Date().toISOString(),
  topic: topicArg,
  lane,
  hubs: hubs.map((h) => h.id),
};
const logPath = path.join(resourcesDir, 'hunt-log.jsonl');
await appendFile(logPath, `${JSON.stringify(logEntry)}\n`);
console.log(`Logged to tools/resources/hunt-log.jsonl`);
console.log('Review licenses before importing assets into HearthVale.\n');
