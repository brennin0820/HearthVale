#!/usr/bin/env tsx
/**
 * HearthVale tooling CLI — Jupiter / Engineer lane entry point.
 * Usage: npm run hearthvale -- <command> [args]
 */
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.join(__dirname, '..');

function run(script: string, args: string[] = []): number {
  const result = spawnSync('npx', ['tsx', script, ...args], {
    cwd: repoRoot,
    stdio: 'inherit',
    shell: false,
  });
  return result.status ?? 1;
}

const [command, ...args] = process.argv.slice(2);

if (!command || command === 'help' || command === '--help') {
  console.log(`HearthVale tools

Data pipeline:
  export              Export TS data -> data/
  verify              Run all verifiers (export + checks)
  validate-data       Zod schema + catalog validation
  verify-portals      Portal graph check
  verify-spawns       Spawn monster ID check
  verify-npcs         NPC ID check
  verify-bounds       Map bounds check
  verify-drops        Drop table check
  verify-items        Item catalog check
  verify-quests       Quest / warp unlock check
  verify-audio        Audio manifest check
  verify-assets       Asset manifest vs map assetKeys

Authoring:
  balance-report      Spawn level vs map level warnings (--json)
  scaffold-map        New map stub (id displayName)
  scaffold-dungeon    New dungeon floor stub
  import-csv          CSV -> catalog JSON (monsters|items)
  slice-spritesheet   Build animation manifest from sheet config
  tiled-import        Validate Tiled JSON + extract object layers
  world-map           Print path to world map preview HTML

Research (online resources):
  research <topic> [lane|planet] [hub-id]
    Lanes: engine pixel world design audio all
    Planets: jupiter mercury uranus saturn neptune
  resources           List curated resource hubs
`);
  process.exit(0);
}

const scriptMap: Record<string, string> = {
  export: 'scripts/export-data.ts',
  'validate-data': 'scripts/validate-data.ts',
  'verify-portals': 'scripts/verify-portals.ts',
  'verify-spawns': 'scripts/verify-spawns.ts',
  'verify-npcs': 'scripts/verify-npcs.ts',
  'verify-bounds': 'scripts/verify-bounds.ts',
  'verify-drops': 'scripts/verify-drops.ts',
  'verify-items': 'scripts/verify-items.ts',
  'verify-quests': 'scripts/verify-quests.ts',
  'verify-audio': 'scripts/verify-audio.ts',
  'verify-assets': 'scripts/verify-assets.ts',
  'balance-report': 'tools/balance-report.ts',
  'scaffold-map': 'tools/scaffold-map.ts',
  'scaffold-dungeon': 'tools/scaffold-dungeon-floor.ts',
  'import-csv': 'tools/import-csv.ts',
  'slice-spritesheet': 'tools/spritesheet/slice-manifest.ts',
  research: 'tools/research.ts',
  'tiled-import': 'tools/tiled/import-map.ts',
};

switch (command) {
  case 'verify': {
    let code = run('scripts/export-data.ts');
    if (code !== 0) process.exit(code);
    const steps = [
      'scripts/validate-data.ts',
      'scripts/verify-portals.ts',
      'scripts/verify-spawns.ts',
      'scripts/verify-npcs.ts',
      'scripts/verify-bounds.ts',
      'scripts/verify-drops.ts',
      'scripts/verify-items.ts',
      'scripts/verify-quests.ts',
      'scripts/verify-audio.ts',
      'scripts/verify-assets.ts',
    ];
    for (const step of steps) {
      code = run(step);
      if (code !== 0) process.exit(code);
    }
    console.log('All verifications passed.');
    process.exit(0);
  }
  case 'world-map': {
    console.log(`Open: file://${path.join(repoRoot, 'tools/world-map-preview.html')}`);
    console.log('Requires maps.json exported (npm run export:data).');
    process.exit(0);
  }
  case 'resources': {
    console.log('Curated hubs: tools/resources/registry.json');
    console.log('Run: npm run hearthvale -- research "<topic>" [lane|planet]\n');
    process.exit(run('tools/research.ts', ['help']));
  }
  default: {
    const script = scriptMap[command];
    if (!script) {
      console.error(`Unknown command: ${command}`);
      console.error('Run: npm run hearthvale -- help');
      process.exit(1);
    }
    process.exit(run(script, args));
  }
}
