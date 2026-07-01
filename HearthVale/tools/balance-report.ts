import { MONSTER_BY_ID } from '../src/data/catalog/index.js';
import { loadMapsJson } from '../scripts/lib/load-data.js';

const jsonOut = process.argv.includes('--json');
const warnings: { mapId: string; monsterId: string; spawnMin: number; spawnMax: number; mapMin: number; mapMax: number }[] = [];

const maps = await loadMapsJson();

for (const map of maps) {
  for (const table of map.spawnTables) {
    for (const entry of table.entries) {
      const monster = MONSTER_BY_ID.get(entry.monsterId);
      const minLv = entry.minLevel ?? monster?.baseLevel ?? 1;
      const maxLv = entry.maxLevel ?? minLv;

      if (minLv < map.levelRange.min || maxLv > map.levelRange.max + 2) {
        warnings.push({
          mapId: map.id,
          monsterId: entry.monsterId,
          spawnMin: minLv,
          spawnMax: maxLv,
          mapMin: map.levelRange.min,
          mapMax: map.levelRange.max,
        });
      }
    }
  }
}

if (jsonOut) {
  console.log(JSON.stringify({ warningCount: warnings.length, warnings }, null, 2));
  process.exit(0);
}

if (warnings.length === 0) {
  console.log('Balance report: no spawn level warnings.');
} else {
  for (const w of warnings) {
    console.log(
      `[balance] ${w.mapId}/${w.monsterId}: spawn Lv ${w.spawnMin}-${w.spawnMax} vs map Lv ${w.mapMin}-${w.mapMax}`,
    );
  }
  console.log(`Balance report: ${warnings.length} warning(s). Use --json for machine output.`);
}
