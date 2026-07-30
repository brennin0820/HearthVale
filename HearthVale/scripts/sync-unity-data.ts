import {
  copyFile,
  lstat,
  mkdir,
  readdir,
  readlink,
  realpath,
  rm,
  symlink,
} from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

type SyncMode = 'auto' | 'link' | 'copy';

type SyncOptions = {
  mode: SyncMode;
  dryRun: boolean;
};

type SyncCounters = {
  copiedFiles: number;
  createdDirectories: number;
  removedEntries: number;
};

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.join(__dirname, '..');
const sourceDir = path.join(repoRoot, 'data');
const streamingAssetsDir = path.join(repoRoot, 'client-unity', 'Assets', 'StreamingAssets');
const targetDir = path.join(streamingAssetsDir, 'data');

function parseArgs(argv: string[]): SyncOptions {
  let mode: SyncMode = 'auto';
  let dryRun = false;

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--dry-run') {
      dryRun = true;
      continue;
    }

    if (arg === '--mode') {
      const next = argv[i + 1];
      if (!next || !isSyncMode(next)) {
        throw new Error('Expected --mode <auto|link|copy>.');
      }
      mode = next;
      i += 1;
      continue;
    }

    if (arg.startsWith('--mode=')) {
      const value = arg.slice('--mode='.length);
      if (!isSyncMode(value)) {
        throw new Error(`Unsupported mode: ${value}`);
      }
      mode = value;
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return { mode, dryRun };
}

function isSyncMode(value: string): value is SyncMode {
  return value === 'auto' || value === 'link' || value === 'copy';
}

function normalizeComparablePath(value: string): string {
  const normalized = path.resolve(value).replace(/\\/g, '/');
  const withoutLongPathPrefix = normalized.replace(/^\/\/\?\/?/u, '');
  return process.platform === 'win32'
    ? withoutLongPathPrefix.toLowerCase()
    : withoutLongPathPrefix;
}

function samePath(left: string, right: string): boolean {
  return normalizeComparablePath(left) === normalizeComparablePath(right);
}

async function pathExists(targetPath: string): Promise<boolean> {
  try {
    await lstat(targetPath);
    return true;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return false;
    }
    throw error;
  }
}

async function ensureDirectory(targetPath: string, dryRun: boolean, counters: SyncCounters): Promise<void> {
  if (await pathExists(targetPath)) {
    return;
  }

  if (!dryRun) {
    await mkdir(targetPath, { recursive: true });
  }
  counters.createdDirectories += 1;
}

async function removeEntry(targetPath: string, dryRun: boolean, counters: SyncCounters): Promise<void> {
  if (!dryRun) {
    await rm(targetPath, { recursive: true, force: true });
  }
  counters.removedEntries += 1;
}

async function syncDirectory(sourcePath: string, destinationPath: string, dryRun: boolean, counters: SyncCounters): Promise<void> {
  const destinationExists = await pathExists(destinationPath);
  if (!destinationExists) {
    await ensureDirectory(destinationPath, dryRun, counters);
  } else {
    const stats = await lstat(destinationPath);
    if (!stats.isDirectory()) {
      await removeEntry(destinationPath, dryRun, counters);
      await ensureDirectory(destinationPath, dryRun, counters);
    }
  }

  const sourceEntries = await readdir(sourcePath, { withFileTypes: true });
  const destinationEntries = await readdir(destinationPath, { withFileTypes: true }).catch((error: NodeJS.ErrnoException) => {
    if (error.code === 'ENOENT') {
      return [];
    }
    throw error;
  });
  const sourceNames = new Set(sourceEntries.map((entry) => entry.name));

  for (const entry of destinationEntries) {
    if (!sourceNames.has(entry.name)) {
      await removeEntry(path.join(destinationPath, entry.name), dryRun, counters);
    }
  }

  for (const entry of sourceEntries) {
    const from = path.join(sourcePath, entry.name);
    const to = path.join(destinationPath, entry.name);

    if (entry.isDirectory()) {
      await syncDirectory(from, to, dryRun, counters);
      continue;
    }

    if (entry.isFile()) {
      const existing = await pathExists(to);
      if (existing) {
        const stats = await lstat(to);
        if (!stats.isFile()) {
          await removeEntry(to, dryRun, counters);
        }
      }

      if (!dryRun) {
        await mkdir(path.dirname(to), { recursive: true });
        await copyFile(from, to);
      }
      counters.copiedFiles += 1;
      continue;
    }

    throw new Error(`Unsupported entry type under data/: ${from}`);
  }
}

async function createLink(sourcePath: string, destinationPath: string, dryRun: boolean): Promise<void> {
  if (dryRun) {
    return;
  }

  const linkType = process.platform === 'win32' ? 'junction' : 'dir';
  await symlink(sourcePath, destinationPath, linkType);
}

async function describeExistingTarget(sourcePath: string, destinationPath: string): Promise<'missing' | 'linked-to-source' | 'linked-elsewhere' | 'directory' | 'other'> {
  if (!(await pathExists(destinationPath))) {
    return 'missing';
  }

  const stats = await lstat(destinationPath);
  if (stats.isSymbolicLink()) {
    const resolvedTarget = await realpath(destinationPath);
    const resolvedSource = await realpath(sourcePath);
    return samePath(resolvedTarget, resolvedSource) ? 'linked-to-source' : 'linked-elsewhere';
  }

  if (stats.isDirectory()) {
    return 'directory';
  }

  return 'other';
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  const counters: SyncCounters = {
    copiedFiles: 0,
    createdDirectories: 0,
    removedEntries: 0,
  };

  if (!(await pathExists(sourceDir))) {
    throw new Error(`Source data directory is missing: ${sourceDir}`);
  }

  await ensureDirectory(streamingAssetsDir, options.dryRun, counters);

  const existingTarget = await describeExistingTarget(sourceDir, targetDir);
  if (existingTarget === 'linked-to-source') {
    console.log(`Unity data already linked: ${targetDir} -> ${await readlink(targetDir).catch(() => sourceDir)}`);
    return;
  }

  if (existingTarget === 'linked-elsewhere') {
    throw new Error(
      `Refusing to overwrite ${targetDir} because it is linked somewhere other than ${sourceDir}.`,
    );
  }

  if (existingTarget === 'other') {
    throw new Error(
      `Refusing to overwrite ${targetDir} because it exists and is not a directory or link.`,
    );
  }

  const shouldCopy = options.mode === 'copy' || existingTarget === 'directory';
  if (!shouldCopy) {
    try {
      await createLink(sourceDir, targetDir, options.dryRun);
      console.log(
        options.dryRun
          ? `[dry-run] Would create Unity data link: ${targetDir} -> ${sourceDir}`
          : `Created Unity data link: ${targetDir} -> ${sourceDir}`,
      );
      return;
    } catch (error) {
      if (options.mode === 'link') {
        throw error;
      }

      console.warn(
        `Link creation failed (${(error as Error).message}). Falling back to mirrored copy.`,
      );
    }
  }

  await syncDirectory(sourceDir, targetDir, options.dryRun, counters);
  const prefix = options.dryRun ? '[dry-run] ' : '';
  console.log(
    `${prefix}Synced Unity data copy: ${counters.copiedFiles} files, ` +
      `${counters.createdDirectories} directories created, ` +
      `${counters.removedEntries} stale entries removed.`,
  );
}

await main();
