# Build Ledger — HearthVale

Append-only. Never edit or remove existing entries.

---

## [2026-06-11] NightRaven Core — Phase A parallel bootstrap approval

- Event: ApprovalGranted
- User quote: "run in parallel"
- Scope: Phase A bootstrap — HearthVale-native Phaser MMO documentation foundation (Path A)
- Reasoning: User approved parallel NightRaven builder work for empty-repo bootstrap
- Confidence: 100/100

---

## [2026-06-11] NightRaven Builder Agent — Phase A bootstrap (Path A)

- Event: BuildStarted
- Actions performed: Scaffold NightRaven governance docs, strategy, agent rules, project memory, session handoff, and README for empty HearthVale repo
- Path: Path A — HearthVale-native Phaser MMO (client-first; Colyseus server later)
- Files targeted: `docs/ledgers/BUILD_LEDGER.md`, `docs/ledgers/AUDIT_LEDGER.md`, `STRATEGY.md`, `AGENTS.md`, `docs/01_PROJECT_MEMORY.md`, `docs/14_SESSION_HANDOFF.md`, `README.md`
- Dependencies added: none
- Reasoning: Establish append-only ledgers and minimal project memory before Phase A data-layer work from sibling workers
- Confidence: 95/100

---

## [2026-06-11] NightRaven Builder Agent — Phase A bootstrap complete

- Event: FeatureBuilt
- Actions performed: Created all seven scoped documentation files; no `src/` or `package.json`
- Files created: `docs/ledgers/BUILD_LEDGER.md`, `docs/ledgers/AUDIT_LEDGER.md`, `STRATEGY.md`, `AGENTS.md`, `docs/01_PROJECT_MEMORY.md`, `docs/14_SESSION_HANDOFF.md`, `README.md`
- Files modified: none (new repo)
- Dependencies added: none
- Reasoning: Phase A parallel bootstrap documentation foundation complete per approved scope
- Confidence: 98/100

---

## [2026-06-11] NightRaven Core — Phase A parallel workers complete

- Event: FeatureBuilt
- Actions performed: Four parallel builders — world TS data, export/verify tooling, world layout + roadmap docs
- Files created: `src/data/world/*.ts`, `scripts/export-data.ts`, `scripts/verify-portals.ts`, `package.json`, `tsconfig.json`, `data/maps.json`, `data/regions.json`, `docs/world/HEARTHLIGHT_VALE_LAYOUT.md`, `docs/ROADMAP.md`
- Verification: `npm run verify` passed — 10 maps, 22 portals, 3 aliases
- Reasoning: Phase A data foundation complete; ready for Phase B Phaser client
- Confidence: 97/100

---

## [2026-06-11] NightRaven Core — Phase B approval

- Event: ApprovalGranted
- User quote: "go b"
- Scope: Phase B — Phaser starter 4-map loop (Path A continuation)
- Reasoning: User approved Phase B client build after Phase A data foundation
- Confidence: 100/100

---

## [2026-06-11] NightRaven Builder Agent — Phase B Phaser client

- Event: BuildStarted
- Actions performed: Scaffold Phaser 3 + Vite client under `client/`; WorldScene with portal traversal for starter 4-map loop
- Path: Path A — load `data/maps.json` at runtime; town ↔ plains ↔ hollow ↔ mine
- Files targeted: `client/**`, root `package.json`, `README.md`, `docs/14_SESSION_HANDOFF.md`, `docs/01_PROJECT_MEMORY.md`
- Dependencies added: phaser, vite (client)
- Reasoning: Playable MVP client for starter region portal loop per approved Phase B scope
- Confidence: 95/100

---

## [2026-06-11] NightRaven Builder Agent — Phase B Phaser client complete

- Event: FeatureBuilt
- Actions performed: Phaser 3 + Vite client under `client/`; BootScene loads `/maps.json`; WorldScene with WASD movement, grid bounds collision, portal transitions, safe-zone HUD, NPC/monster placeholders
- Starter loop: hearthvale_town ↔ cloverfield_plains ↔ mushroom_hollow; cloverfield mine_mouth → old_crystal_mine; mine mine_exit → cloverfield
- Files created: `client/package.json`, `client/vite.config.ts`, `client/tsconfig.json`, `client/index.html`, `client/src/main.ts`, `client/src/constants.ts`, `client/src/types/world.ts`, `client/src/services/worldData.ts`, `client/src/utils/mapBounds.ts`, `client/src/scenes/BootScene.ts`, `client/src/scenes/WorldScene.ts`
- Files modified: `package.json` (dev:client, build:client scripts), `README.md`, `docs/14_SESSION_HANDOFF.md`, `docs/01_PROJECT_MEMORY.md`
- Dependencies added: phaser ^3.90.0, vite ^6.3.5 (client)
- Reasoning: Phase B exit criteria — playable 4-map loop from exported world data without art pipeline
- Confidence: 96/100

---

## [2026-06-11] NightRaven Core — MMO tooling suite (5 lanes parallel)

- Event: ApprovalGranted
- User quote: "2"
- Scope: Full MMO tooling manifest — Jupiter/Mercury/Uranus/Saturn/Neptune lanes in parallel
- Reasoning: User approved all waves in parallel for HearthVale Path A tooling

---

## [2026-06-11] NightRaven Builder Agents — MMO tooling suite complete

- Event: FeatureBuilt
- Actions performed: Catalog data (monsters, NPCs, items, quests, drops); combat/progression modules; extended export (biomes, animations, audio, assets, collision, props); 8 verify scripts + validate-data; tools/cli + scaffold/import/balance/sprite/world-map; client AudioService + DevOverlay (F3)
- Files created: `src/data/catalog/*`, `src/data/combat/*`, `src/data/progression/*`, `src/data/world/biomes.ts`, `src/data/audio/manifest.ts`, `src/data/assets/*`, `scripts/validate-data.ts`, `scripts/verify-*.ts`, `scripts/lib/*`, `tools/**`, `client/src/services/AudioService.ts`, `client/src/services/DevOverlay.ts`
- Files modified: `scripts/export-data.ts`, `package.json`, `tsconfig.json`, `client/src/scenes/BootScene.ts`, `client/src/scenes/WorldScene.ts`
- Dependencies added: none
- Reasoning: Five-lane parallel tooling per approved manifest; `npm run verify:all` merge gate
- Confidence: 94/100

- Event: VerificationCompleted
- Actions performed: `npm run build:client` passed (tsc + vite build); dev server smoke — `/` and `/maps.json` HTTP 200; `npm run verify:portals` passed (22 portals, 2 documented one-way)
- Reasoning: Phase B build and runtime data load verified before handoff
- Confidence: 97/100

---

## [2026-06-11] NightRaven Core — Tooling improvement pass (5 lanes + online research)

- Event: ApprovalGranted
- User quote: "before that let the coders improve the tools and the can search online for unlimitted resources"
- Scope: Improve MMO tooling; add online resource research for all planet lanes
- Reasoning: User deferred Phase C until tooling quality + research capability improved

---

## [2026-06-11] NightRaven Builder Agents — Tooling improvement complete

- Event: FeatureBuilt
- Actions performed: Zod map schemas; verify-assets; research CLI + resource registry; Tiled import report; improved CSV parser; interactive world map; balance --json; audio resourceHints; hunt-log.jsonl
- Files created: `tools/research.ts`, `tools/resources/registry.json`, `tools/lib/schemas.ts`, `tools/tiled/import-map.ts`, `scripts/verify-assets.ts`
- Files modified: `tools/cli.ts`, `scripts/validate-data.ts`, `tools/import-csv.ts`, `tools/balance-report.ts`, `tools/world-map-preview.html`, `src/data/audio/manifest.ts`, `README.md`, `package.json`
- Dependencies added: zod (dev)
- Reasoning: Online-research-enabled tooling per user request; verify:all extended
- Confidence: 93/100

---

## [2026-06-11] NightRaven Core — Tooling improvement pass (5 lanes + online research)

- Event: ApprovalGranted
- User quote: "before that let the coders improve the tools and the can search online for unlimitted resources"
- Scope: Improve MMO tooling; add online resource research for all planet lanes
- Reasoning: User deferred Phase C until tooling quality + research capability improved

---

## [2026-06-11] NightRaven Builder Agents — Tooling improvement complete

- Event: FeatureBuilt
- Actions performed: Zod map schemas; verify-assets; research CLI + resource registry; Tiled import report; improved CSV parser; interactive world map; balance --json; audio resourceHints; hunt-log.jsonl
- Files created: `tools/research.ts`, `tools/resources/registry.json`, `tools/lib/schemas.ts`, `tools/tiled/import-map.ts`, `scripts/verify-assets.ts`
- Files modified: `tools/cli.ts`, `scripts/validate-data.ts`, `tools/import-csv.ts`, `tools/balance-report.ts`, `tools/world-map-preview.html`, `src/data/audio/manifest.ts`, `README.md`, `package.json`
- Dependencies added: zod (dev)
- Reasoning: Online-research-enabled tooling per user request; verify:all extended
- Confidence: 93/100

---

## [2026-07-01] Autonomous design/production pass — skill catalog + roadmap correction

- Event: FeatureBuilt
- Actions performed: Added `SkillDefinition`/`SkillEffect`/`SkillType`/`SkillTargetType` types and `src/data/catalog/skills.ts` (20 skills covering every `JOB_CLASSES.startingSkills` id), `scripts/verify-skills.ts` (uniqueness, cost/cooldown/effect-shape, element cross-check against `ELEMENT_MODIFIERS`, job→skill reference resolution). Wired into `src/data/catalog/index.ts`, `scripts/export-data.ts` (`data/catalog/skills.json`), `package.json` (`verify:skills`), `tools/cli.ts` (help text + `verify` steps), `README.md`. Corrected `docs/ROADMAP.md` drift (read "Phase A current" though `docs/14_SESSION_HANDOFF.md` already showed Phase B complete / Phase C underway) — Phase A/B marked done, Phase C current with skills→combat wiring called out as the next task, combat/jobs moved out of the server-only "Later" backlog.
- Files created: `src/data/catalog/skills.ts`, `scripts/verify-skills.ts`
- Files modified: `src/data/catalog/types.ts`, `src/data/catalog/index.ts`, `scripts/export-data.ts`, `package.json`, `tools/cli.ts`, `README.md`, `docs/ROADMAP.md`, `docs/14_SESSION_HANDOFF.md`
- Dependencies added: none
- Reasoning: Job classes shipped with skill-id stubs that resolved to nothing (Phase 5 design-loop gate requires skills connect to combat/economy); this closes that gap at the data layer without touching the in-flight combat client PR, and fixes stale roadmap status that contradicted the session log
- Verification: `npm run verify` passed (13/13 checks); `npx tsc --noEmit` clean
- Confidence: 92/100
