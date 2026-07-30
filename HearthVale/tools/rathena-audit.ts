import { access, mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { ITEM_BY_ID, MONSTER_BY_ID, QUEST_BY_ID, SKILL_BY_ID } from '../src/data/catalog/index.js';

type ScalarValue = string | number | boolean;
type RecordRow = { [key: string]: ScalarValue | undefined; _source: string };

type CliArgs = {
  repoRoot?: string;
  maxLevel?: number;
  top: number;
  limit?: number;
  out: string;
};

type DomainResult = {
  sourceFiles: string[];
  total: number;
  mapped: number;
  unmatched: number;
  starterEligible: number;
  samples: { id: string; name: string; level?: number }[];
};

type DomainType = 'monster' | 'item' | 'skill' | 'quest';

const cli = parseArgs(process.argv.slice(2));
if (!cli.repoRoot || cli.repoRoot === '--help' || cli.repoRoot === '-h') {
  console.error(
    'Usage: rathena-audit <path/to/rathena/repo> [--max-level <n>] [--top <n>] [--limit <n>] [--out <path>]',
  );
  process.exit(1);
}

const maxLevel = cli.maxLevel;
const repoRoot = path.resolve(cli.repoRoot);
const outFile = path.resolve(cli.out);

await access(path.join(repoRoot, 'db', 'mob_db.yml')).catch(() => {
  throw new Error(`Could not find a rAthena checkout at: ${repoRoot}`);
});

const knownMonsters = buildLookupSet(MONSTER_BY_ID);
const knownItems = buildLookupSet(ITEM_BY_ID);
const knownSkills = buildLookupSet(SKILL_BY_ID);
const knownQuests = buildLookupSet(QUEST_BY_ID);

const monsterFiles = await resolveChain(repoRoot, path.join(repoRoot, 'db', 'mob_db.yml'));
const itemFiles = await resolveChain(repoRoot, path.join(repoRoot, 'db', 'item_db.yml'));
const skillFiles = await resolveChain(repoRoot, path.join(repoRoot, 'db', 'skill_db.yml'));
const questFiles = await resolveChain(repoRoot, path.join(repoRoot, 'db', 'quest_db.yml'));

const monsters = analyzeDomain(await loadDbChain(monsterFiles), knownMonsters, 'monster', cli);
const items = analyzeDomain(await loadDbChain(itemFiles), knownItems, 'item', cli);
const skills = analyzeDomain(await loadDbChain(skillFiles), knownSkills, 'skill', cli);
const quests = analyzeDomain(await loadDbChain(questFiles), knownQuests, 'quest', cli);

await mkdir(path.dirname(outFile), { recursive: true });
await writeFile(
  outFile,
  `${JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      rathenaRepo: repoRoot,
      maxLevel,
      topSamples: cli.top,
      sources: {
        monsters: monsterFiles,
        items: itemFiles,
        skills: skillFiles,
        quests: questFiles,
      },
      monsters,
      items,
      skills,
      quests,
    },
    null,
    2,
  )}\n`,
);

printSummary('Monsters', monsters);
printSummary('Items', items);
printSummary('Skills', skills);
printSummary('Quests', quests);
console.log(`Audit report written to ${outFile}`);

function parseArgs(raw: string[]): CliArgs {
  const args: CliArgs = {
    top: 20,
    out: path.join('data', 'rathena-audit.json'),
  };

  if (raw.length > 0 && !raw[0].startsWith('-')) {
    args.repoRoot = raw[0];
  }

  for (let i = args.repoRoot ? 1 : 0; i < raw.length; i += 1) {
    const token = raw[i];
    if ((token === '--max-level' || token === '--max') && raw[i + 1] !== undefined) {
      args.maxLevel = Number(raw[i + 1]);
      i += 1;
      continue;
    }
    if ((token === '--top' || token === '--samples') && raw[i + 1] !== undefined) {
      args.top = Number(raw[i + 1]);
      i += 1;
      continue;
    }
    if (token === '--limit' && raw[i + 1] !== undefined) {
      args.limit = Number(raw[i + 1]);
      i += 1;
      continue;
    }
    if ((token === '--out' || token === '-o') && raw[i + 1] !== undefined) {
      args.out = raw[i + 1];
      i += 1;
      continue;
    }
  }

  return args;
}

function printSummary(name: string, domain: DomainResult): void {
  console.log(`${name}: ${domain.total} entries`);
  console.log(`  mapped: ${domain.mapped}, unmapped: ${domain.unmatched}, starter-eligible: ${domain.starterEligible}`);
  if (domain.samples.length === 0) {
    console.log('  - no sample unmapped entries in scanned range');
    return;
  }
  console.log(`  sample unmapped (${domain.samples.length}):`);
  for (const sample of domain.samples) {
    const levelLabel = sample.level === undefined ? '' : ` (level ${sample.level})`;
    console.log(`  - ${sample.id} · ${sample.name}${levelLabel}`);
  }
}

function toScalar(raw: string): ScalarValue | undefined {
  const trimmed = raw.trim();
  if (trimmed === '') return undefined;
  if (trimmed === 'true') return true;
  if (trimmed === 'false') return false;
  if (!Number.isNaN(Number(trimmed)) && Number.isFinite(Number(trimmed))) {
    return Number(trimmed);
  }
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.substring(1, trimmed.length - 1);
  }
  return trimmed;
}

function parseDatabaseBody(raw: string): Omit<RecordRow, '_source'>[] {
  const lines = raw.split(/\r?\n/);
  const bodyIndex = lines.findIndex((line) => line.trim() === 'Body:');
  if (bodyIndex < 0) return [];

  const footerIndex = lines.findIndex((line, idx) => idx > bodyIndex && line.trim() === 'Footer:');
  const scanTo = footerIndex >= 0 ? footerIndex : lines.length;

  const rows: Omit<RecordRow, '_source'>[] = [];
  for (let i = bodyIndex + 1; i < scanTo; i += 1) {
    const line = lines[i];
    if (line.trim() === '' || line.trimStart().startsWith('#')) continue;

    const startMatch = line.match(/^ {2}-\s*Id:\s*(.+)\s*$/);
    if (!startMatch) continue;

    const row: Omit<RecordRow, '_source'> = {
      Id: toScalar(startMatch[1]),
    };

    for (i += 1; i < scanTo; i += 1) {
      const current = lines[i];
      if (current.trimStart().startsWith('#')) continue;
      if (current.match(/^ {2}-\s*Id:\s*/)) {
        i -= 1;
        break;
      }

      const fieldMatch = current.match(/^ {4}([A-Za-z][A-Za-z0-9_]*)\s*:\s*(.*)$/);
      if (fieldMatch) {
        row[fieldMatch[1]] = toScalar(fieldMatch[2]);
      }
    }

    rows.push(row);
  }

  return rows;
}

function parseImportPaths(raw: string, repoRoot: string): string[] {
  const lines = raw.split(/\r?\n/);
  const footerIndex = lines.findIndex((line) => line.trim() === 'Footer:');
  if (footerIndex < 0) return [];

  const imports: string[] = [];
  for (let i = footerIndex; i < lines.length; i += 1) {
    const match = lines[i].match(/^-?\s*-\s*Path:\s*(.+)\s*$/);
    if (match) {
      imports.push(path.resolve(repoRoot, match[1] ?? ''));
    }
  }
  return imports;
}

async function resolveChain(repoRoot: string, entryFile: string): Promise<string[]> {
  const seen = new Set<string>();
  const queue = [path.resolve(entryFile)];
  for (let i = 0; i < queue.length; i += 1) {
    const file = queue[i];
    if (file === undefined || seen.has(file)) continue;
    seen.add(file);

    const raw = await readFile(file, 'utf8').catch(() => null);
    if (!raw) continue;

    for (const imported of parseImportPaths(raw, repoRoot)) {
      if (!seen.has(imported)) queue.push(imported);
    }
  }
  return Array.from(seen);
}

async function loadDbChain(files: string[]): Promise<RecordRow[]> {
  const rows: RecordRow[] = [];
  for (const file of files) {
    const raw = await readFile(file, 'utf8').catch(() => null);
    if (!raw) continue;
    for (const parsed of parseDatabaseBody(raw)) {
      rows.push({
        ...parsed,
        _source: file,
      });
    }
  }
  return rows;
}

function buildLookupSet<T extends { id: string; displayName?: string }>(source: Map<string, T>): Set<string> {
  const out = new Set<string>();
  for (const entry of source.values()) {
    out.add(normalize(entry.id));
    if (entry.displayName) out.add(normalize(entry.displayName));
  }
  return out;
}

function analyzeDomain(rows: RecordRow[], known: Set<string>, domain: DomainType, options: CliArgs): DomainResult {
  const scanned = typeof options.limit === 'number' && options.limit > 0 ? rows.slice(0, options.limit) : rows;
  const sourceFiles = Array.from(new Set(scanned.map((row) => row._source)));

  let mapped = 0;
  let starterEligible = 0;
  const samples: { id: string; name: string; level?: number }[] = [];

  for (const row of scanned) {
    const id = String(row.Id ?? '');
    const extracted = extractNameAndLevel(row, domain);
    const normalizedKeys = new Set<string>([
      normalize(id),
      normalize(extracted.name),
      normalize(extracted.name.replace(/[_]/g, '')),
    ]);
    const found = Array.from(normalizedKeys).some((key) => known.has(key));

    if (found) {
      mapped += 1;
    } else if (samples.length < options.top) {
      samples.push({ id, name: extracted.name, level: extracted.level });
    }

    if (options.maxLevel !== undefined && extracted.level !== undefined && extracted.level <= options.maxLevel) {
      starterEligible += 1;
    }
  }

  return {
    sourceFiles,
    total: scanned.length,
    mapped,
    unmatched: scanned.length - mapped,
    starterEligible,
    samples,
  };
}

function extractNameAndLevel(row: RecordRow, domain: DomainType): { name: string; level?: number } {
  const fallback = String(row.Id ?? 'unknown');
  if (domain === 'monster') {
    const level = toNumber(row.Level);
    return { name: String(row.Name ?? row.AegisName ?? fallback), level };
  }
  if (domain === 'item') {
    const level = toNumber(row.EquipLevelMin);
    return { name: String(row.Name ?? row.AegisName ?? fallback), level };
  }
  if (domain === 'skill') {
    const level = toNumber(row.MaxLevel);
    return { name: String(row.Name ?? fallback), level };
  }
  return { name: String((row.Title as string) ?? fallback), level: undefined };
}

function toNumber(value: ScalarValue | undefined): number | undefined {
  if (typeof value === 'number') return value;
  if (typeof value === 'string' && value.trim() !== '' && !Number.isNaN(Number(value))) return Number(value);
  return undefined;
}

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '');
}
