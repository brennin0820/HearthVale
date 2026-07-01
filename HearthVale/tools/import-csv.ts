import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/** Parse a single CSV line respecting quoted fields. */
function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      out.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  out.push(current.trim());
  return out;
}

type CatalogKind = 'monsters' | 'items';

const [kind, csvPath] = process.argv.slice(2) as [CatalogKind | undefined, string | undefined];

if (!kind || !csvPath || (kind !== 'monsters' && kind !== 'items')) {
  console.error('Usage: import-csv <monsters|items> <path/to/file.csv>');
  process.exit(1);
}

const raw = await readFile(path.resolve(csvPath), 'utf8');
const lines = raw.trim().split(/\r?\n/).filter(Boolean);
const headers = parseCsvLine(lines[0] ?? '');

if (headers.length === 0) {
  console.error('CSV is empty');
  process.exit(1);
}

const rows = lines.slice(1).map((line) => {
  const values = parseCsvLine(line);
  return Object.fromEntries(headers.map((h, i) => [h, values[i] ?? '']));
});

const outDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'data', 'catalog');
const outFile = path.join(outDir, `${kind}.imported.json`);
await writeFile(outFile, `${JSON.stringify(rows, null, 2)}\n`);

console.log(`Imported ${rows.length} ${kind} rows -> ${outFile}`);
console.log('Review and merge into src/data/catalog/*.ts, then npm run export:data');
