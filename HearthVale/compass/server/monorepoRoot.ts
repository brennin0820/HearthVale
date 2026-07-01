import fs from 'node:fs'
import path from 'node:path'

/** Walk up from cwd (or optional start) until scripts/gods-eye-projects.conf is found. */
export function findMonorepoRoot(startDir = process.cwd()): string {
  let dir = startDir
  for (let i = 0; i < 8; i += 1) {
    if (fs.existsSync(path.join(dir, 'scripts', 'gods-eye-projects.conf'))) return dir
    const parent = path.dirname(dir)
    if (parent === dir) break
    dir = parent
  }
  return path.resolve(startDir, '..')
}
