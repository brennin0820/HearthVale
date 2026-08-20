---
applyTo: "HearthVale/src/data/**/*.ts"
---

# Data-layer instructions

- Author catalogs and world data only under `HearthVale/src/data/`.
- After edits: `cd HearthVale && npm run export:data && npm run verify`.
- Do not hand-edit `HearthVale/data/**/*.json` as source of truth.
- Portal graph must stay bidirectional; `requiredLevel` belongs on `MapPortal`.
- New maps: prefer `npm run hearthvale -- scaffold-map` then wire portals in `maps.ts`.
- Job `startingSkills` must resolve in `skills.ts` (`verify:skills`).
- Original IP names only.
