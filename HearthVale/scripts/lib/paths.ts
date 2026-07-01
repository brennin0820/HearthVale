import path from 'node:path';
import { fileURLToPath } from 'node:url';

const libDir = path.dirname(fileURLToPath(import.meta.url));

/** Repository root (parent of `scripts/`). */
export const REPO_ROOT = path.join(libDir, '..', '..');

export const dataPath = (...segments: string[]): string =>
  path.join(REPO_ROOT, 'data', ...segments);
