# HearthVale: Lanternbound

Fresh Phaser 3 + TypeScript + Vite client for HearthVale. It reads the repository's exported JSON data directly through Vite's `publicDir`, so maps, portals, NPCs, and monsters remain single-sourced in `../data/`.

## Run

```bash
npm install
npm run dev
```

Controls: WASD/arrow keys to move, Shift to sprint, and E to talk to NPCs. Walking into a portal travels automatically. The party automatically faces, strikes, and uses available class skills against nearby enemies; Space or click still triggers a manual strike.

The default journey is a complete three-zone route: Hearthvale Town, Cloverfield Plains, and Old Crystal Mine B1. Each zone loads its authored prop layout and walkability grid, so buildings, trees, fences, terrain edges, cave walls, and mine clutter are real movement obstacles. The town contains NPC services and dialogue; the field and dungeon contain distinct roaming monster populations.

Each playable class has three catalog-driven skills with MP costs, cooldowns, and combat effects. Click the skill bar or use `1`–`3` for Aster, `4`–`6` for Rowan, `7`–`9` for Iris, and `Z`/`X`/`C` for Mara.

## Build

```bash
npm run build
```

The production bundle is written to `dist/` and includes the exported data files.
