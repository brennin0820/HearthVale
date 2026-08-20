# Session Handoff — HearthVale

Continuity notes for the next agent/session. This file did not exist prior to
2026-07-01 despite `AGENTS.md` requiring it as required reading — created now
as part of the Unity migration pass.

## Current focus

**Phaser Next is now the active playable client.** Run `npm run dev:phaser`
from the repository root. The new client lives in `client-phaser-next/` and
loads the existing exported JSON data directly. The Unity scaffold is retained
for reference but is no longer the default runtime.

+# **2026-08-20** — Roadmap refreshed against the live client. Phase C is still current, but the July note that combat was an unmerged PR is stale: `CombatController`, skills 1–4, telegraphs/Brace, live loot, Hearthglass HUD, iOS Capacitor v1, and authored art/collision on all 10 maps are playable. Remaining Phase C: job selection UI, enforce portal `requiredLevel`, mine floors + Gemhorn Sentinel, Courier warp UI, mine-completion quest. Phase D map *geometry* shipped early (Whisperwood → Millwick → Moonwell is walkable); remaining D is world-map UI, vendors, and the Lv 14 quest arc. Next named slice is unset — pick one remaining C item before the next build.
+# **2026-07-01** — Wired `SkillDefinition.effect` into the merged `CombatController` (PR #8), so job skills are no longer just data: `client/src/services/catalogData.ts` now also loads `/catalog/jobs.json` + `/catalog/skills.json` (`getJobSkills`, `getSkillById`); `WorldScene` gives the player a hotbar loadout from their job's `startingSkills` (default `novice` — job selection UI is still future work) bound to keys **1-4**, and tracks timed player buffs (surfaced in the existing HUD aura pills). `CombatController.useSkill()` dispatches on `effect.kind`: `damage` reuses `calcPhysicalDamage(..., powerMultiplier)` with the skill's own element; `heal` restores HP via a new `bridge.healPlayer`; `buff` applies a timed atk/def/flee bonus via `bridge.applyPlayerBuff`; `debuff`/`mark` land on the target `Monster` (new `applyDebuff`/`applyMark`/`tickEffects`/`markMultiplier` — flee reduction and bonus damage-taken, both timed). `economy`/`gather`/`utility` skill kinds are intentionally not cast here — those belong to the (not yet built) vendor/gather systems. Verified live in a running dev server (not just typecheck): direct calls into the running `WorldScene`/`CombatController` confirmed `basic_strike` doing formula-correct damage, `first_aid` restoring exactly its `amount` and spending its `mpCost`, `shield_bash` zeroing a monster's flee, `hunters_mark` raising `markMultiplier` to 1.15, and `guard_stance` adding +8 def for 10s — all through the production code path, zero console errors. `npx tsc --noEmit` and `vite build` clean; root `npm run verify` unaffected (data-layer only, untouched).
+# **2026-07-01** — Added a **skill catalog** (`src/data/catalog/skills.ts`, `SkillDefinition`/`SkillEffect` in `types.ts`) defining all 20 skill ids referenced by `JOB_CLASSES.startingSkills` (previously unresolved design stubs). Damage skills carry a `powerMultiplier` that maps directly onto the existing `calcPhysicalDamage(attacker, defender, skillMultiplier)` param in `src/data/combat/formulas.ts`; heal/buff/debuff/mark skills carry `amount`/`stat`/`duration`; the Wayfarer's `haggle`/`ore_sense`/`pilfer` skills use `economy`/`gather` effect kinds that hook into vendor pricing and drop rate, connecting classes to the economy per the design-loop system-connection rule. New `scripts/verify-skills.ts` cross-checks every job's `startingSkills` id resolves to a real skill and validates element/cost/effect shape (registered in `package.json`, `tools/cli.ts`, `verify:all` — now 13 checks). Also refreshed `docs/ROADMAP.md`, which had drifted (still read "Phase A current" though the session log already showed Phase B complete and Phase C underway) — Phase A/B now marked done, Phase C current, and combat/jobs moved out of the server-only "Later" backlog since client-side versions already exist or are in-flight (open PR #8). `npm run verify` passes (13/13); `npx tsc --noEmit` clean. Skills are still data-only — `CombatController` (open PR #8) does not yet consume `SkillDefinition.effect`; that wiring is called out as the next Phase C task.
+# **2026-07-01** — Added interactive NPCs: authored `title` + `dialogue` on every `NpcDefinition` (`src/data/catalog/npcs.ts`), new client `catalogData` service (loads `/catalog/npcs.json` + `/catalog/quests.json`), a camera-fixed `DialogueBox` (`client/src/ui/DialogueBox.ts`), and `WorldScene` proximity talk (press **E** near an NPC to open role-colored dialogue + quest hints; quest-givers show a `!` marker; movement freezes while talking).
+# **2026-07-01** — Added character **job classes** to the data layer: `src/data/catalog/jobs.ts` (`JobClassDefinition` in `types.ts`) with the tier-0 **Vale Novice** base branching into six tier-1 paths (Vale Warden, Glade Ranger, Thorn Channeler, Hearth Mender, Wayfarer Trader, Hollow Shade). Wired into catalog `index.ts`, `export-data.ts` (`data/catalog/jobs.json`), and a new `scripts/verify-jobs.ts` (tier/parent/level/growth checks) registered in `package.json`, `tools/cli.ts`, and `verify:all`. `npm run verify` passes (11 checks). Skill ids are Phase A design stubs — not yet wired to combat.
+# **2026-07-01** — Made the HUD fully snapshot-driven: `HudOverlay` no longer holds hardcoded panel constants — `WorldScene` owns all HUD state via `HudSnapshot`. Live-wired the **target frame** (locks onto nearest drawn monster within `TARGET_LOCK_RADIUS`, real name/level from `/catalog/monsters.json`) and **buffs/debuffs** (derived from vitals/zone: Rested in safe zone, Tired on stamina drain, Low on <30% HP). Party/currency/hotbar/inventory pass through as scene-owned seed (no party/economy/inventory systems yet). Removed the F5 combat-preview dev toggle (target is now real). `npm run build` passed.
+# **2026-07-01** — Implemented scene-level monster spawn + AI behavior in `client/src/scenes/WorldScene.ts` using map `spawnTables` (weighted entries, max concurrency, respawn timer, chase/wander movement, and proximity return behavior).
+# **2026-06-30** — Wired player HUD panel fields in `client/src/hud/HudOverlay.ts` to live `WorldScene` snapshot data (`name`, `level`, `HP`, `MP`, `SP`, `XP`, `stance`) so the overlay is no longer static for those channels.
+# Phase B complete — Phaser client loop playable. **HearthVale Compass** (NightRaven guidance UI) added under `compass/` with macOS Electron shell. Next: Phase C (dungeon depth, combat hooks, level-gated portals).

### Next task: MP-2 — server-authoritative combat + character persistence

This is the recommended next unit of work, already scoped in
`docs/ROADMAP.md`:

+# Combat loop — `CombatController` (aggro/leash/XP), hotbar skills 1–4, telegraphs, Brace, live drop-table loot
+# All 10 Hearthlight Vale maps walkable with authored collision/props (`verify:map-art`)
+# iOS Capacitor landscape shell (`npm run ios:sync` / `ios:open`)
+# HearthVale Compass — `compass/` NightRaven Compass Phases 1–8; `npm run mac:compass` (Electron Mac); registry → this repo
+# Phase B Phaser client — `client/` with WorldScene, portal traversal, placeholder maps, HUD (`npm run dev:client`)
+# Phase A data foundation — `src/data/world/*`, `npm run export:data`, `npm run verify:portals` (passes)
+# NightRaven ledgers scaffolded (`BUILD_LEDGER.md`, `AUDIT_LEDGER.md`)
+# `STRATEGY.md`, `AGENTS.md`, `docs/01_PROJECT_MEMORY.md`, `README.md` created
+# ApprovalGranted recorded — user: "run in parallel"

Do **not** start MP-3 (chat/real-player party grouping), MP-4 (trading),
MP-5 (guilds), or MP-6 (PvP) before MP-2 — they all assume persisted,
server-authoritative characters exist. Party grouping in particular depends
on a locked-in decision already made: **players keep their existing 3 AI
companions**; multiplayer "party" is a later "party of squads" concept
(MP-3), not a same-player-1-avatar redesign — don't relitigate that.

### Known gaps / honest scope-downs from the MP-0/MP-1 pass (not bugs, just not done yet)

+# **2026-08-20** — Auto-trigger Copilot: `auto-assign-copilot.yml` (label `copilot` → assign `hearthvale-builder`) and `scheduled-copilot-slice.yml` (weekly Phase C issue + assign). Requires Actions secret `COPILOT_AGENT_TOKEN` (user PAT). Native Agents→Automations UI needs a private repo; public repo uses Actions + Issues assign API instead. Docs in `.github/COPILOT.md`.
+# **2026-08-20** — Set up GitHub Copilot cloud agent at repo root: `.github/copilot-instructions.md`, path instructions (data + Phaser), `hearthvale-builder` custom agent, `copilot-setup-steps.yml` (npm ci + verify + build:client), Copilot issue template, `.github/COPILOT.md`, root `AGENTS.md` shim, VS Code Copilot extension recommendations. Must merge to `main` before Copilot uses the setup workflow.
+# **2026-08-20** — Made Windows + remote access docs: root README pointing at nested package; Windows clone/run section in `HearthVale/README.md`; Vite `server.host: true` for LAN play. GitHub remote remains `https://github.com/brennin0820/HearthVale` (public). Local tree still has uncommitted work and is behind `origin/main` by 1 — Windows clone will not see Mac WIP until commit + pull/rebase + push.
+# **2026-08-20** — Refreshed `docs/ROADMAP.md` (and companion status in project memory, overlay, layout acceptance, README) so Phase C/D match the shipped client instead of the July "combat still an open PR / four maps only" snapshot. No gameplay code changed.
+# **2026-07-24** — Added the first functional **HearthVale iOS app** while preserving the Path A Phaser/TypeScript client. Added a Capacitor 8 sync/Xcode scaffold (`client/ios`, `client/capacitor.config.ts`, root/client `ios:sync` + `ios:open` scripts), an iOS 27 scene-based landscape shell, safe-area viewport handling, and an accessible multi-touch control overlay for movement, skills 1–4, Talk, Attack, Brace, and Map. The production bundle now embeds the validated JSON map/catalog/audio data plus CSS and uses a local-file-compatible classic script, avoiding iOS WebKit's blocked local fetch/module/custom-scheme paths while remaining fully offline. Added original HearthVale app/splash art and README run instructions. Verified `npm run verify` (all checks), `npm run build:client`, `git diff --check`, production dependency audit (0 vulnerabilities), and a clean Xcode Simulator build/run on iPhone 17 Pro / iOS 27; runtime screenshot confirmed the live Hearthvale Town map, styled HUD, NPCs, minimap, and touch controls.
+# **2026-07-23** — Added reactive combat telegraphs and a functional local-map HUD. Enemy melee attacks now use a controller-owned 700ms wind-up instead of landing immediately: monsters stop, show an original amber warning ring + `!`, and the transparent target frame exposes a quantized **Heavy strike** cast bar. Leaving melee range cancels the attack with a short recovery; holding **Shift** activates **Brace**, spending 12 SP only on impact and reducing that hit to 35% damage with blue `BRACE` floating feedback plus a HUD aura/stance. The minimap now maps the live player position against authored map bounds at the existing 10 Hz HUD cadence, distinguishes portal/NPC POIs, highlights nearby portals by name, and toggles an expanded local map with **M**. The unrelated Currency/World Chat interpretation was explicitly removed after clarification. Preserved transparent HUD, bounded sync, loot/inventory, and listener cleanup. `npm run verify`, `npm run build:client`, and `git diff --check` pass; the running Vite client hot-reloaded the changes.
+# **2026-07-23** — Redesigned the DOM overlay as the original **Hearthglass field HUD**: transparent glass-backed combat vitals, compact top-center target frame, smaller minimap/objective cluster, six-slot recent-loot tray, centered action bar/progression, hidden mock party chrome, and responsive disclosure at 1100px/620px breakpoints to keep the center playfield clear. All themes now use translucent backing surfaces with readable edge contrast and solid combat bars; reduced-motion disables non-essential animation. Replaced fixed 3440×1440 artboard scaling with viewport-relative anchoring so small screens retain legible text. Preserved the 10 Hz bounded HUD sync and live loot behavior. `npm run verify`, `npm run build:client`, and `git diff --check` pass. Restarted Vite successfully at `http://127.0.0.1:5173/`; visual browser automation was skipped per coordinator direction.
+# **2026-07-23** — Performance triage after a user report of client lag: found `WorldScene.update()` rebuilding HUD snapshots and issuing DOM writes every animation frame (including allocating/serializing the live 24-slot bag) and map restarts registering pointer/F3 listeners without explicit teardown. Capped DOM HUD synchronization at 10 Hz while leaving Phaser movement/combat simulation at full frame rate (roughly 83% fewer HUD sync passes at 60 FPS), removed both pointer listeners on shutdown, and added lifecycle cleanup for the debug overlay's F3 handler/text. Preserved the live loot inventory. `npm run verify` passes all checks and `npm run build:client` succeeds; Vite still reports the existing large-bundle warning, so browser profiling is the next step only if runtime lag remains.
+# **2026-07-23** — Closed the prototype's combat reward loop by loading the validated item/drop catalogs in the client and rolling authored monster drops on defeat. Loot now stacks in scene-owned inventory across portal/map restarts, replaces the HUD's mock bag contents with live item slots (rarity tint, quantity, accessible hover label), and posts each pickup to the existing log. XP awards still work at the level cap while loot continues independently. Installed locked dependencies to restore local verification; `npm run verify` passes all checks and `npm run build:client` produces a clean production build.
+# **2026-07-01** — Rebased the NPC/HUD branch again after `main` advanced with the real-time combat merge: `WorldScene` now keeps the right-click auto-pathing + in-world NPC chatter from the branch while deferring monster spawning/target HP to `CombatController` from `main`, so the PR no longer forks combat state from a parallel monster-AI system. Re-ran `npm run verify` and `npm run build:client` after resolving the final `WorldScene` conflict.
+# **2026-07-01** — Resolved the open merge conflicts by reconciling the NPC/HUD branch with current `main`: kept the richer NPC catalog/dialogue data, preserved auto-pathing + monster AI, retained HUD snapshot target/auras, regenerated `data/catalog/npcs.json`, and restored a clean merge state across `WorldScene`, `HudOverlay`, `src/data/catalog/npcs.ts`, and `types.ts`. `npm run verify` and `npm run build:client` both pass after reinstalling missing client dependencies in this checkout.
+# **2026-07-01** — HUD review/harden pass (adversarial multi-agent review, 4 verified defects fixed): (1) fixed auto-scale mis-centering by reordering `.hv-hud` transform to `translate() scale()` in `client/src/hud/hud.css` so centering offsets apply in real viewport pixels, not scaled space — supersedes the earlier "scale before translate" change which had the offset consumed by the scale; (2) removed the `HUD_MIN_SCALE = 0.4` floor in `HudOverlay.syncScale` so the HUD always fits the viewport and the right-column minimap/coords/POI markers no longer clip off-screen on windows narrower than ~1376px; (3) set `.hv-slot { pointer-events: none }` so the non-interactive mock hotbar/bag no longer swallow right-click-to-move (and stop surfacing the browser context menu); (4) fixed a stale-stance flash on the zero-delta/initial-create frame outside a safe zone in `WorldScene.updatePlayerVitals` (now assigns idle `Ready`). Also fixed 2 pre-existing build-blocking type errors in the in-progress monster-AI code: `Phaser.GameObjects.Circle`→`Arc` and null-widened `end` in `queueAutoPath`. `npm run build` passed.
+# **2026-07-01** — Updated click autopathing to accept primary and secondary pointer buttons for pathing, improving usability on browsers that treat movement clicks as primary/touch input.
+# **2026-07-01** — Skills → combat wiring: `client/src/services/catalogData.ts` loads jobs/skills catalogs (`getJobSkills`, `getSkillById`); `client/src/combat/CombatController.ts` gains `useSkill(skill)` dispatching on `effect.kind` (damage/heal/buff/debuff/mark) plus a `skillCooldowns` map ticked in `update()`; `client/src/combat/Monster.ts` gains `applyDebuff`/`applyMark`/`tickEffects`/`markMultiplier` for the two enemy-targeted effect kinds; `client/src/scenes/WorldScene.ts` resolves the player's job (`novice` default) into a hotbar (keys 1-4 via `tryUseSkill`), tracks timed player buffs (`playerBuffs`, surfaced as HUD aura pills), and adds `spendMp`/`healPlayer`/`applyPlayerBuff` to the `CombatBridge`. Rebased onto the auto-pathing/NPC-chatter rewrite of `WorldScene` that landed in parallel — reapplied the same skill-loadout/hotbar/buff/bridge wiring onto the new file structure rather than merging, since the two touched overlapping regions extensively. Live-verified in a running dev server via direct calls into the loaded scene (not just typecheck) — all 5 effect kinds fire correctly with formula-accurate numbers. `npx tsc --noEmit` + `vite build` clean; root data-layer `npm run verify` unaffected. Updated `docs/ROADMAP.md` Phase C deliverables to check off the combat merge and this skill wiring.
+# **2026-07-01** — Skill catalog + roadmap correction: added `src/data/catalog/skills.ts` (20 `SkillDefinition`s covering every `JOB_CLASSES.startingSkills` id — 2 novice, 3 per tier-1 job × 6 jobs), new `SkillType`/`SkillTargetType`/`SkillEffect`/`SkillDefinition` types, `scripts/verify-skills.ts` (unique ids, cost/cooldown/effect-shape checks, element cross-check against `ELEMENT_MODIFIERS`, and job→skill reference resolution), and export wiring (`export-data.ts` → `data/catalog/skills.json`, `index.ts`, `package.json` `verify:skills`, `tools/cli.ts` help + steps list). Fixed `docs/ROADMAP.md` drift (Phase A/B were actually done and Phase C underway per this file's own log, but the roadmap still read "Phase A current"); updated phase statuses, Phase C deliverables (skills → combat wiring, job selection UI), and moved combat/jobs bullets out of the server-only "Later" backlog. `npm run verify` passes (13 checks); `npx tsc --noEmit` clean.
+# **2026-07-01** — Interactive NPC talk system: `NpcDefinition` gained `title` + `dialogue`; new `client/src/services/catalogData.ts` and `client/src/ui/DialogueBox.ts`; `WorldScene` now resolves NPC display names/role colors from the catalog, shows a `[E] Talk` prompt on proximity, opens a paged dialogue box (advance/close with **E**) that appends quest hints for quest-givers, and freezes movement while open. `npm run export:data`, `npm run verify:all`, and `npm run build:client` all passed.
+# **2026-07-01** — Merged `main` into the character job-class catalog branch, preserving the newer HUD snapshot/target updates while keeping the job catalog export + verifier wiring intact. Resolved the catalog re-export conflict in `src/data/catalog/index.ts`, restored `verify:items` alongside `verify:jobs`, and `npm run verify` now passes with both checks included.
+# **2026-07-01** — Wired the mock HUD panels to the scene snapshot. Added `loadMonsterCatalog()` to `client/src/services/worldData.ts` (fetches `/catalog/monsters.json`, served via Vite `publicDir: ../data`); `WorldScene` records drawn monsters as `MonsterInstance[]` and derives target/auras each frame. `HudOverlay` gained `HudAura`/`HudTarget`/`HudPartyMember`/`HudCurrency` exports + `DEFAULT_*` seeds, a stable `data-hud="auras"`/`data-hud="target"` DOM with keyed change-detection so live panels only re-render on change.
+# **2026-07-01** — Fixed HUD positioning by applying HUD scale before translation in `client/src/hud/hud.css`; viewport offsets now remain pixel-accurate and no longer compress/drift with resize.
+# **2026-07-01** — HUD overlay resize sync remains in `HudOverlay.syncScale` with clamped offsets for small viewports.
+# **2026-07-01** — Added right-click auto-pathing to `WorldScene` with A* tile pathing on collision masks, destination marker, and automatic follow when movement keys are idle.
# **2026-07-01** — Fixed HUD dynamic status text updates so quest/chat lines refresh on safe-zone or nearby-portal context changes while staying in the same map.
+# **2026-07-01** — Wired HUD player rendering to live scene state: `WorldScene` now drives `HudOverlay` with movement-based SP drain/regen and safe-zone HP/MP/SP recovery, plus snapshot-backed player shell rendering for name/level/HP/MP/SP/XP/stance.
+# **2026-06-30** — Implemented the "Hearthlight Vale HUD" Claude Design handoff (`.codex_tmp/hud_ref/Hearthlight Vale HUD.dc.html`) pixel-faithfully in `client/src/hud/`: full theme-token system with all 3 skins (Ironbound/Radiant Vale/Hearthlight, default Hearthlight, F4 to cycle — dev-only, no settings UI yet), player bars, buffs/debuffs, party frames, combat/chat log, zone banner, minimap, currency, quests, 24-slot bag + 10-slot hotbar with themed item-slot rendering, XP bar, hidden-by-default target frame (F5 dev preview). Live data (map/position/portal/safe zone) still drives banner/quest/log/minimap as before; everything else (party, buffs, target, bag, hotbar, currency) is the mock data the .dc.html ships with — no such systems exist yet. `npm run build` passed. Added `.claude/launch.json` for preview tooling.
+# **2026-06-30** — Hearthvale Town now ships as a full greybox playable hub: authored prop/collision export, obstacle-aware movement in `client/`, repositioned town NPCs/portal/spawn, and `npm run export:data`, `npm run build:client`, `npm run verify:bounds`, `npm run verify:npcs`, `npm run verify:portals` all passed
+# **2026-06-30** — HUD overlay now auto-scales with window resize in `client/`; scale is driven from viewport size instead of breakpoint-only layout changes, and `npm run build` passed
# **2026-06-30** — Replaced the Phaser text HUD with a responsive DOM overlay HUD in `client/`; live map banner, minimap, quest/log panels, hotbar/menu shell, and `npm run build` passed
+# **2026-06-11** — HearthVale Compass: full NightRaven Compass UI in `compass/` + macOS Electron (`mac:dev`, `build:mac`); `scripts/gods-eye-projects.conf` + overlay wired
+# **2026-06-11** — Tooling v2: Zod validation, `research` command + resource registry (OGA/Kenney/itch/Tiled/GitHub), Tiled import report, verify-assets, interactive world map; Phase C still next
+# **2026-06-11** — Phase B Phaser client: `client/` (Phaser 3 + Vite), WorldScene loads `/maps.json`, WASD movement, portal loop town ↔ plains ↔ hollow ↔ mine; `npm run build:client` + dev smoke pass
+# **2026-06-11** — Phase A parallel bootstrap: empty-repo docs foundation (Path A HearthVale-native Phaser MMO); seven files; no `src/` or `package.json`
+# **2026-08-12** — Coordinated game-completion pass: added original local SVG player/NPC/world atlases and Phaser frame/animation integration (with procedural fallbacks), authored themed obstacle/prop and collision layers across all ten maps, and added `verify:map-art` to prove every player/NPC/portal anchor remains walkable. Corrected Millwick’s authored grid width to cover its existing spawn/arrival. `npm run verify`, `npm run build:client`, and `git diff --check` pass; Vite retains only its existing large-bundle warning. Existing uncommitted iOS/client work was preserved.

## Guardrails

- Do not resurrect or extend `client/` or `client-phaser-archive/`; they remain
  historical. Active browser client work goes in `client-phaser-next/`.
- Do not touch `src/data/**`, `scripts/**`, or `tools/**` as part of "Unity
  work" unless a data schema is genuinely missing a field the Unity client
  needs — in that case, add the field to the TS types AND the C# DTOs
  (`client-unity/Assets/Scripts/Data/*.cs`) together, re-run
  `npm run export:data`, and note it in the build ledger.
- `npm run verify` must stay green. It was green after the 2026-07-23
  map-size scale pass (`MAP_GRID_SCALE = 1.5`).
- Coordinate convention: data is Y-down (Phaser-authored), Unity client code
  negates Y on read. Don't "fix" this by flipping the data — see
  `client-unity/README.md`.
- **Multiplayer guardrails**: `shared/sim/` is now the single copy of
  `WorldSimulation`/`CollisionGrid`/the data contract — edit it there, not
  at the old `client-phaser-next/src/game/{simulation,data,input}/*` paths
  (those are now `export * from '@hearthvale/sim'` shims kept only for
  import-path compatibility). Any change to `shared/sim/` must keep all 25
  `npm run test:phaser:*` suites green (they instantiate `WorldSimulation`
  directly) AND `npm run test:server` green (the same class runs
  server-side). The multiplayer server is **local-dev only** —
  `ws://localhost:2567`, SQLite in `server/hearthvale.db` (gitignored); do
  not add cloud deployment, TLS, or hosting config without the user asking.

## Recent sessions (newest first)

### 2026-07-29 — Primary player-avatar spec: late-Sengoku fire swordsman
- Promoted `late_sengoku_fire_swordsman_player_sheet.png` to Aster's persistent solo player avatar (member `warden`), while leaving the other party roles on their existing sheets.
- The selected appearance remains stable through gameplay job changes; `npm run build:phaser` verifies the active client compiles and packages the sheet.

### 2026-07-29 — Late-Sengoku fire swordsman player sheet

- Added a standalone transparent 2×4 player sheet for a late-Sengoku wandering
  fire swordsman at `data/assets/sprite-samples/late_sengoku_fire_swordsman_player_sheet.png`.
  It is 1536×1024, with eight 384×512 directional frames in the active Phaser
  convention. The sheet is a sample asset only and is not wired into a party
  role or manifest.

### 2026-07-29 — Prompt-kit sprites integrated at 2.5D world scale

- The active solo Phaser renderer now preloads the five prompt-kit sheets as
  384×512 spritesheets and renders the party with their specified eight
  directions, bottom-foot anchoring, and a 0.18 presentation scale. Physics,
  collision, authored map coordinates, and the 32-unit world grid remain
  unchanged.
- Camera zoom now targets the larger 2.5D actors responsively (0.72–0.98),
  maintaining useful map coverage. The multiplayer placeholder renderer,
  NPCs, and monsters remain intentionally unchanged pending their own art.
- Verification: `npm run build:phaser` and `npm run verify` pass; the built
  Vite output contains all five sheets. No browser automation is installed in
  this checkout, so live canvas screenshot QA remains outstanding.

### 2026-07-29 — Prompt-kit sprite alpha-matte correction

- Reprocessed all five generated class sheets from their original source files
  with a border-connected key rather than a broad color wipe. The entire
  magenta field and its fringe are now transparent while dark/purple character
  details remain intact. Confirmed 32-bit ARGB output with transparent corners
  and a transparent inter-cell gap on every sheet.

### 2026-07-29 — Prompt-kit 2.5D directional class sprite sheets

- Generated the complete tier-1 class sample set with the built-in image
  generator: Vale Warden, Glade Ranger, Thorn Channeler, Hearth Mender, and
  Hollow Shade. Each is a 1536×1024, two-row by four-column directional sheet
  in the prompt kit's Down → Down-Left order.
- The generated magenta backdrop was keyed to alpha and the five final PNGs
  live in `data/assets/sprite-samples/`. They are sample assets only; no
  runtime manifest or gameplay asset index has been changed.

### 2026-07-29 — MP-2 server-authoritative RNG and character persistence

- Replaced the final raw `Math.random()` calls in `shared/sim` gathering and
  loot resolution with sequence-keyed FNV-1a rolls. `WorldRoom` now generates a
  private 32-byte room salt and supplies it to every server simulation, so
  authoritative loot and gathering outcomes cannot be predicted from client
  state. The matching Phaser fixtures use explicit test-only salts instead of
  monkeypatching global randomness.
- Moved the solo `SaveGame` shape and its cloning/migration rules into
  `@hearthvale/sim`. The browser localStorage save store and the server now use
  the same normalized party, inventory, quest, equipment, socket, discovery,
  resource-cooldown, gold, map, and timestamp contract.
- Added `server/src/persistence/characterRepository.ts`: one durable character
  per local account in the existing SQLite `characters` table. `WorldRoom`
  loads a character on join, restores its saved leader position when returning
  to that map, saves on leave, and autosaves every 30 seconds. Auth replies now
  expose the last saved map so the multiplayer title flow resumes the character
  in the correct room. The existing AI-companion party model is unchanged.
- Added `character-persistence-smoke.ts` to `npm run test:server`; it seeds a
  level-6 character with inventory, moves it through a real Colyseus room,
  disconnects, and verifies level, exact leader position, and inventory after
  rejoin.
- Verification: `npm run verify`, `npm run build:phaser`, `npm run build:server`,
  and `npm run test:server` pass. All 25 Phaser smoke commands were run: 23
  pass; `test:phaser:dawnshore` and `test:phaser:stormglass` retain only their
  pre-existing `tidebreak_causeway` resource-node walkability failures.

### 2026-07-28 — Real multiplayer: MP-0/MP-1 (server foundation + shared-world visibility)

Kicked off converting HearthVale from a solo-only game into a true MMORPG
per user request, via a phased MP-0..MP-6 plan (full detail in
`docs/ROADMAP.md`'s "Later" section and `docs/01_PROJECT_MEMORY.md`'s
"Multiplayer facts" section — read those before continuing this work, don't
re-derive). Solo campaign is completely unaffected. See "Next task: MP-2"
above for what to do next.

- Extracted `WorldSimulation.ts`/`CollisionGrid.ts`/the data contract out of
  `client-phaser-next` into a new `shared/sim/` npm-workspace package
  (`@hearthvale/sim`), so the client and the new server share one copy of the
  simulation rules. Old import paths are thin re-export shims — zero edits
  needed in any of the 25 existing smoke tests or `WorldScene.ts`.
- Added root `workspaces` field (`client-phaser-next`, `shared/sim`,
  `server`) to `package.json`.
- Built `server/` — Node + Colyseus, local-dev only (`ws://localhost:2567`,
  `npm run dev:server`): `WorldRoom` (one room per `mapId`, one
  `WorldSimulation` instance per connected player — their existing 4-unit
  squad, unmodified), local SQLite accounts (scrypt-hashed passwords, opaque
  session tokens, `server/hearthvale.db`, gitignored), server-side
  portal-gate validation on room-crossing (level/quest requirements
  re-checked against the room's own `map.portals`, not trusted from the
  client), and a 25s reconnect grace window. `server/src/data/
  loadGameData.ts` imports `src/data/**` directly (same pattern as
  `scripts/export-data.ts`), no JSON round-trip.
- Added `client-phaser-next`'s `MultiplayerWorldScene` (renders whatever the
  room broadcasts — other players' leaders + companions, monsters, HP bars;
  no client-side prediction yet, see "Known gaps" above) and a "MULTIPLAYER
  (local server)" login/register panel on the title screen (Phaser DOM
  element, plain fetch calls to the new `/auth/register`/`/auth/login`
  routes).
- Added `server/scripts/*-smoke.ts` (auth round trip; two real
  `colyseus.js` clients joining the same room and confirming they see each
  other's live movement) wired into `npm run test:server`.
- Verification: `npm run verify` (15 checks), `npm run build:phaser`,
  `npm run build:server`, `npm run test:server`, and all pre-existing
  `npm run test:phaser:*` suites pass **except** the two documented
  pre-existing `dawnshore`/`stormglass` failures (unrelated, see "Known
  gaps" above — confirmed via `git status` that those smoke-test files and
  the underlying collision data were already untracked/modified before this
  session touched anything). Also ran both `npm run dev:server` and
  `npm run dev:phaser` live and exercised the real HTTP auth endpoints with
  `curl` against the running process (not just the isolated smoke tests).
- **Not done / explicitly out of scope this pass**: visual browser
  verification (no browser automation tool available in this sandbox — see
  "Known gaps"); everything in MP-2 through MP-6 (server-authoritative
  combat/loot RNG, character persistence, chat, real-player party grouping,
  trading, guilds, PvP).

### 2026-07-23 — Data-driven biome palettes and prop depth sorting

- `WorldPainter` no longer carries a hardcoded 14-entry `BIOME_PALETTES` table.
  Terrain palettes now derive from the authored `data/biomes.json` contract via
  `client-phaser-next/src/phaser/view/palette.ts`. **19 of 33 maps** previously
  fell through to one of four generic per-kind palettes — the whole starter
  region plus Runeveil, Namesong, Waystar, and Convergence. All 30 biomes now
  render their authored identity.
- The derived ramp reproduces the 14 hand-tuned palettes within 2–8 RGB units
  (no visual regression) and fixes Emberglass Shelf and Hollow Kiln, where
  `ground == walkable == wall` made collision edges literally invisible.
- Standing props (trees, buildings, crystals, stalls…) were all baked into one
  `Graphics` at depth `-10000`, so the party always drew **in front of** every
  tree and building. They are now grouped into 16px foot-line bands on the actor
  depth scale (`propDepth.ts`). Props are static, so this costs nothing per
  frame — ~8–37 band layers per map. Resource nodes moved from `y + 9600` to
  `y + 10000` to sort on the same scale.
- Added the missing `stall` paint branch (7 authored stalls rendered as generic
  blobs).
- New `scripts/verify-biomes.ts` (wired into `npm run verify`) fails if any map
  uses a biome with no authored entry, so this class of drift cannot recur.
- New `npm run test:phaser:painter` covers palette separation, biome coverage,
  band ordering, and prop-kind coverage headlessly.

**Known-broken, NOT caused by this pass:** `test:phaser:dawnshore` and
`test:phaser:stormglass` fail — `tidebreak_causeway` resource node
`stormreed_stand_2` at (-304, 400) sits inside the `tidebreak_channel_south`
rift and is unwalkable. This is fallout from the 1.5× map-scale pass below,
which ran `npm run verify` (no walkability check on resource nodes) but not the
Phaser smoke suites. `export:data` is deterministic; the coordinate needs
fixing in `src/data/world/maps.ts` (`TIDEBREAK_CAUSEWAY_POINTS.stormreed2`).

### 2026-07-23 — Map sizes scaled 1.5×

- Introduced canonical `MAP_GRID_SCALE = 1.5` in `src/data/world/mapScale.ts`
  (~2.25× area). All map grids, tile layouts, RO ASCII maps, and hardcoded
  world spawns/portals now go through scale helpers.
- Average grid area rose from ~2174 to ~4891 tiles. Examples: Hearthvale Town
  48×36 → 72×54; Waystar Moor 60×44 → 90×66; RO town 48×28 → 72×42.
- Camera bounds, collision, props, and points derive from scaled `gridSize`.
  Portal proximity verify threshold scaled with the same factor (200 → 300).
- `npm run export:data` and `npm run verify` passed (33 maps, 68 portals).

### 2026-07-22 — Waystar, Convergence, and level-28 callings

- Extended Dawnshore Reach into the level 26–27 Waystar Moor field and level
  27–28 Convergence Spire dungeon with authored collision, props, palettes,
  music, reciprocal travel, nine resources, linked quests, a tenth shop, and
  two quest-unlocked waylines.
- Added six monsters, seventeen items, six drop tables, six recipes, two
  quests, three NPCs, and seven abilities. The Manyroad Crown drops the
  guaranteed keystone; Anchorcord Tea cures Severed, which temporarily
  suppresses non-health rune bonuses.
- Added two level-28 callings for every advanced job. Each of the twelve choices
  grants permanent bonuses and one exclusive technique; first selection is
  free, retraining costs 500 gold, path changes clear the calling, and old or
  malformed saves are validated. Pathweaver Ione owns the responsive UI.
- Current totals: 33 maps in two regions, 68 portals, 71 monsters, 167 items,
  71 drop tables, 71 resource nodes, 10 shops, 52 recipes, 23 quests, 39 unique
  NPCs, 28 world-map pins, 28 music keys, 42 authored monster abilities, and
  38 skills. `npm run verify`, `npm run build:phaser`, and all 24 Phaser smoke
  suites pass. Browser QA covered desktop/mobile callings, a real 500g switch,
  both new maps, the boss arena, nonblank canvases, and empty problem logs.

### 2026-07-22 — Runeveil, Namesong, and equipment runes

- Extended Dawnshore Reach from Crownroot into the level 24–25 Runeveil
  Gardens field and level 25–26 Namesong Vault dungeon with authored collision,
  props, palettes, music, reciprocal travel, chart pins, nine resources, linked
  quests, a ninth shop, and two quest-unlocked waylines.
- Added six monsters, eighteen items, six drop tables, five recipes, two quests,
  three NPCs, and seven monster abilities. The Archivore drops the guaranteed
  Namesong Seal; quest rewards include Veilguard and Hollowstar equipment.
- Added five reusable equipment runes with explicit slot compatibility and
  ATK/DEF/HP/SPD/CRIT bonuses. The armory exposes one rune menu per equipped
  slot; replacement and unequip release runes, assigned copies cannot be sold
  or double-bound, HP changes synchronize immediately, and old/malformed saves
  migrate safely.
- Current totals: 31 maps in two regions, 64 portals, 65 monsters, 150 items,
  65 drop tables, 62 resource nodes, 9 shops, 46 recipes, 21 quests, 36 unique
  NPCs, 26 world-map pins, 26 music keys, 35 authored monster abilities, and
  26 skills. `npm run verify`, `npm run build:phaser`, and all 23 Phaser smoke
  suites pass. The live client remains at `http://127.0.0.1:5175/`.

### 2026-07-22 — Choirwood, Crownroot, and skill loadouts

- Extended Dawnshore Reach from Zenith into the level 22–23 Choirwood Canopy
  field and level 23–24 Crownroot Sanctum dungeon with authored collision,
  props, palettes, music, reciprocal travel, chart pins, nine resources,
  linked quests, an eighth shop, and two quest-unlocked waylines.
- Added six monsters, seventeen items, six drop tables, five recipes, two
  quests, three NPCs, and seven monster abilities. Muted prevents active skill
  casting while preserving ordinary attacks; Clearvoice Tisane removes it.
  The Crownroot Hierophant drops the guaranteed Concordance Seed.
- Added one level-24 Crownroot technique for every advanced job and a saved
  three-slot skill loadout. The armory shows all four path skills with level,
  quest, path, capacity, and minimum-one gates; equipped changes immediately
  rebind keys and feed manual plus auto-combat priorities. Invalid old or
  malformed save selections fall back to path defaults.
- Current totals: 29 maps in two regions, 60 portals, 59 monsters, 132 items,
  59 drop tables, 53 resource nodes, 8 shops, 41 recipes, 19 quests, 33 unique
  NPCs, 24 world-map pins, 24 music keys, 28 authored monster abilities, and
  26 skills. `npm run verify`, `npm run build:phaser`, and all 22 Phaser smoke
  suites pass. In-app browser QA covered both maps, Crownroot's boss arena, a
  real skill swap and hotkey update, default desktop and 390x844 layouts,
  transient HUD spacing, and empty warning/error logs. The live client remains
  at `http://127.0.0.1:5175/`.

### 2026-07-22 — Aurora Highlands, Zenith Archive, and branching oaths

- Extended Dawnshore Reach from Sunspire into the level 20–21 Aurora
  Highlands field and level 21–22 Zenith Archive dungeon with authored
  collision/props, palettes, music, reciprocal travel, chart pins, resources,
  encounters, a seventh shop, and a quest-unlocked Zenith wayline.
- Added the first durable branching quest contract. Keeper Aurell's gentle
  oath and Warden Maelis's direct oath are mutually exclusive; completing
  either satisfies Archivist Nerys's OR prerequisite for the shared archive
  finale. The journal explains both the chosen lockout and either/or gate.
- Added six monsters, seventeen items, six drop tables, nine resource nodes,
  five recipes, three quests, four NPCs, and seven abilities. Fractured reduces
  party defense against ordinary and telegraphed attacks until Mending Salve
  removes it; the Keeper of Zenith drops the guaranteed finale proof.
- Current totals: 27 maps in two regions, 56 portals, 53 monsters, 115 items,
  53 drop tables, 44 resource nodes, 7 shops, 36 recipes, 17 quests, 30 unique
  NPCs, 22 world-map pins, 22 music keys, and 21 authored monster abilities.
  `npm run verify`, `npm run build:phaser`, and all 21 Phaser smoke suites pass.
  Browser QA covered both maps, oath lock guidance, the highland shop, the
  eight-pin chart, desktop and 390x844 layouts, zero overflow, and no console
  warnings/errors. The live client remains at `http://127.0.0.1:5175/`.

### 2026-07-22 — Beaconfall Cliffs and Sunspire Observatory

- Extended Dawnshore Reach from Stormglass Reliquary into the level 18–19
  Beaconfall Cliffs field and level 19–20 Sunspire Observatory dungeon. Both
  maps have authored collision/props, distinct palettes and music, reciprocal
  travel, world-map pins, gathering nodes, and quest-unlocked courier waylines.
- Added Astronomer Sela, Cliffsmith Roan, a sixth shop, six monsters, sixteen
  items, six drop tables, nine resource nodes, five recipes, and two linked
  quests. The route culminates in the Celestial Orrery, its guaranteed Aurora
  Lens Core, the legendary Sunspire Compass, and a level-20 campaign endpoint.
- Added Sunblind to the shared ability contract. Solar Flare, Refracted Gaze,
  and Daybreak Axis can apply it; it reduces outgoing damage and critical
  chance, appears as a harmful HUD condition, and is removed by Clarity Tonic.
- Current totals: 25 maps in two regions, 52 portals, 47 monsters, 98 items,
  47 drop tables, 35 resource nodes, 6 shops, 31 recipes, 14 quests, 26 unique
  NPCs, 20 world-map pins, 20 music keys, and 14 authored monster abilities.
  `npm run verify`, `npm run build:phaser`, and all 20 Phaser smoke suites pass.
  Browser QA covered both maps, the boss arena, six-pin regional chart,
  outfitter, 1280x720 and 390x844 layouts, zero overflow, and no console issues.
  The live client remains at `http://127.0.0.1:5175/`.

### 2026-07-22 — Level-18 Lantern Masteries

- Added two authored level-18 masteries to every advanced path, for twelve
  choices total. Bonuses cover HP, MP, ATK, DEF, haste, critical chance,
  outgoing power, healing, evasion, shop prices, drops, and material stacks.
- The first mastery is free and changing it costs 300 gold. Selection is
  restricted to the member's current path, persists in saves and travel,
  validates malformed legacy data, updates derived HP/MP without doubling,
  and clears when the member retrains into a different path.
- Trainer Bram now presents a responsive mastery section beneath the path
  list with member-specific choices, bonus chips, locks, current state, cost,
  and two-step confirmation. `previewMastery=1` prepares a level-18 party and
  500 gold for deterministic QA.
- Added `test:phaser:mastery`. All 19 Phaser smoke suites, `npm run verify`,
  and `npm run build:phaser` pass. Browser QA covered level gating, free
  selection, paid retraining, immediate HP changes, member switching,
  1440x900 and 390x844 layouts, and zero console warnings/errors. The live
  client remains at `http://127.0.0.1:5175/`.

### 2026-07-22 — Lantern Path quest journal

- Replaced the compact tracker as the only quest reference with a responsive
  campaign journal. Current, available/locked, and completed views expose all
  twelve quests with state labels, level/prerequisite guidance, descriptions,
  objective-by-objective progress, XP/gold/item rewards, and giver/return NPCs.
- Added quest pinning from the detail pane. The pinned quest leads the compact
  tracker, survives saves and legacy migration, and is preserved through
  portals, Hearth Charm travel, courier travel, title reloads, and map scene
  restarts. The compact tracker is capped at two rows to avoid HUD overlap.
- Added toolbar and `J` access, touch-friendly narrow layout, mutual exclusion
  with map/loadout overlays, and simulation pausing while the journal is open.
  `previewJournal` provides a frozen authored state for repeatable visual QA.
- Added a pure quest-journal model and `test:phaser:journal`. All 18 Phaser
  smoke suites, `npm run verify`, and the production build pass. Live browser
  checks covered filtering, lock guidance, pin/unpin, keyboard and toolbar
  access, pause/resume behavior, 1280x720 and 500x844 layouts, no overflow,
  and zero browser errors. The live client remains at
  `http://127.0.0.1:5175/`.

### 2026-07-22 — Tidebreak Causeway and Stormglass Reliquary

- Extended Dawnshore Reach east through the level 16–17 Tidebreak Causeway
  field and into the level 17–18 Stormglass Reliquary dungeon. Both maps have
  custom collision, authored props, palettes, music stubs, reciprocal travel,
  resource nodes, regional chart pins, and quest-unlocked courier waylines.
- Added Beaconwright Orrin; Brinewing Rays, Surgeclaws, Galehorn Prowlers,
  Stormglass Custodians, and the Tempest Remnant boss; eleven items, five drop
  tables, four recipes, and nine gathering nodes. `Where the Tide Breaks` and
  `The Storm Remembers` form a complete visit, gather, hunt, dungeon, boss,
  proof, reward, and fast-travel progression arc.
- Added a cross-client authored monster-ability contract and seven live
  abilities with cooldowns, wind-ups, single-target tethers, area warnings,
  dodgeable resolution, and poison/Gloom/Drenched payloads. Drenched slows
  movement and attack cadence, Stormclear Draught cures it, and the HUD keeps
  harmful conditions prominent.
- Current totals: 23 maps in two regions, 48 portals, 41 monsters, 82 items,
  41 drop tables, 26 resource nodes, 5 shops, 26 recipes, 12 quests, 24 unique
  NPCs, 18 world-map pins, 18 music keys, and 7 authored monster abilities.
  `npm run verify`, the production build, and all 17 Phaser smoke suites pass.
  Browser QA verified both telegraph shapes and overlap-free 1440x900 and
  500x844 layouts with zero page errors. The live client remains at
  `http://127.0.0.1:5175/`.

### 2026-07-22 — Persistent gathering and Dawnshore Reach

- Added the first real gathering verb to the shared world contract. Seventeen
  herb, ore, fiber, and relic nodes now exist across Cloverfield Plains,
  Emberglass Shelf, Afterlight Expanse, and Glasswind Coast. Nodes enforce
  range and level requirements, grant materials, advance collect objectives,
  visibly reform on absolute-time cooldowns, persist through saves and map
  travel, appear on the minimap, and receive the Wayfarer's Ore Sense bonus.
- Opened Afterlight's east road into **Dawnshore Reach**, the second region.
  Its level-15 Dawnshore Camp hub and level-15–16 Glasswind Coast field have
  custom collision, authored props, palettes, music stubs, reciprocal travel,
  two regional chart pins, two courier destinations, and six gather nodes.
- Added Trailwarden Nia, Quartermaster Vesa, Tideglass Motes, Saltbound Husks,
  Beacon Wraiths, and The Drowned Meridian boss. Added nine items, four drop
  tables, four recipes, a fifth shop, and `The Glasswind Bearing`, a complete
  visit/gather/hunt/boss/proof quest with legendary and consumable rewards.
- Added resource schema parity to TypeScript, Zod, Phaser, and Unity DTOs;
  added `verify:resources`; corrected portal destination bounds validation;
  and added `test:phaser:dawnshore` for placement, persistence, gating,
  Ore Sense, map guidance, quest completion, rewards, and courier unlocks.
- Current totals: 21 maps in two regions, 44 portals, 36 monsters, 71 items,
  36 drop tables, 17 resource nodes, 5 shops, 22 recipes, 10 quests, 23 unique
  NPCs, 16 world-map pins, and 16 music keys. `npm run verify`, the production
  build, and all 16 Phaser smoke suites pass. Edge/Playwright verified actual
  gathering, cooldown marker behavior, regional lock guidance, nonblank
  canvases, zero page errors, and overlap-free 1440x900 and 500x844 layouts.
  The live client remains at `http://127.0.0.1:5175/`.

### 2026-07-22 — Hearth Courier and Afterlight postgame hunt

- Activated the previously data-only `hearth_courier` role in Phaser Next.
  Regional couriers now open a responsive eight-route wayline panel, explain
  level/quest/fare locks, deduct exact fares, reject invalid or same-map
  travel, preserve the complete journey state, and arrive at authored spawns.
- Extended Lanternspire east into the new level-14 Afterlight Expanse field,
  gated by completion of `The Lanternspire Accord`. The 58x42 map has custom
  collision, 41 authored props, reciprocal Summit travel, a 14th world-map
  pin, distinct palette/music, and a post-finale courier route.
- Added Sunshard Motes, Voidglass Revenants, Dawnscale Sentinels, and the
  Eclipse Herald boss with four complete drop tables. Added six items across
  materials, an ATK tonic, crafted and legendary equipment, and guaranteed
  boss proof, plus two recipes.
- Added Wren's postgame `The Afterlight Vigil`: visit the field, defeat four
  Revenants and three Sentinels, defeat the Herald, recover its sigil, and
  return for the Eclipse Guard and consumables. Its completion deliberately
  does not replay the campaign epilogue.
- Added `test:phaser:courier` and `test:phaser:afterlight`; corrected narrow
  target-card placement so combat status does not overlap party or map HUD.
- Current totals: 19 maps, 40 portals, 32 monsters, 62 items, 32 drop tables,
  4 shops, 18 recipes, 9 quests, 21 unique NPCs, 14 world-map pins, and 14
  music keys. `npm run verify`, production build, and all 15 Phaser smoke
  suites pass. Edge/Playwright screenshots passed at 1440x900 and 500x844;
  real pointer travel opened all eight routes and reached Cloverfield. The
  live client remains at `http://127.0.0.1:5175/`.

### 2026-07-22 — Lanternspire campaign finale and epilogue

- Joined the Moonwell Heart and Hollow Kiln capstones into a real final quest,
  `The Lanternspire Accord`, offered by Priestess Wren in the active town only
  after both branches are complete. Accepting it opens a level-14 gate to the
  new Lanternspire Summit instance; completion remains saved as quest state.
- Added a custom 52x38 Summit map with collision, 37 authored props, reciprocal
  town travel, a 13th world-map pin, distinct palette/music, Aurora Motes,
  Gloam Wardens, and The Starved Crown boss. Added five items, three drop
  tables, a Dawnpetal Elixir recipe/shop offering, guaranteed boss proof, and
  legendary Lanternbound Regalia.
- Shadow monsters now inflict Gloom every third landed attack, reducing
  outgoing damage until it expires or Dawnpetal Elixir cures it. Gloom is
  surfaced as a harmful party condition alongside poison.
- Completing the Accord now emits a campaign-ending event, writes the final
  save, pauses play under a responsive epilogue, and offers Continue Exploring
  or Return to Title. Completed saves are recognized on the title screen as
  `Hearthlight Restored` with `Continue Epilogue`.
- Added accepted-quest portal gating across shared TS data, Zod validation,
  Phaser types/navigation, quest verification, and Unity DTO parity. Added
  `test:phaser:finale` for route, collision/art, population, loot, Gloom,
  objective progression, boss, reward, turn-in, and campaign state.
- Current totals: 18 maps, 38 portals, 28 monsters, 56 items, 28 drop tables,
  4 shops, 16 recipes, 8 quests, 21 unique NPCs, 13 world-map pins, and 13
  music keys. `npm run verify`, production build, and all 13 Phaser smoke
  suites pass. Desktop 1440x900 and mobile 500x844 screenshots passed; a real
  Edge/Playwright pointer pass verified both epilogue actions and the completed
  save title. The live client remains at `http://127.0.0.1:5175/`.

### 2026-07-22 — Complete consumables, stamina, and conditions

- Made all eleven authored consumables mechanically usable. Stamina Snack now
  restores travel stamina, Warding Incense grants timed DEF, Gale Tonic
  quickens movement and attack cadence, Antidote Leaf cures poison without
  being wasted when no condition exists, and Hearth Charm returns the full
  party to Hearthvale Town while retaining inventory, quests, gear, gold, and
  discovered maps.
- Added a 100-point persisted stamina pool. Sprint drains 22 per second,
  resting recovers 14 per second, and an exhaustion lock requires 20 stamina
  before held sprint resumes, preventing frame-by-frame speed oscillation.
- Fungal monsters now inflict ten-second poison on every second landed attack;
  poison pulses once per second, can faint party members, clears on a wipe,
  and is surfaced alongside friendly timed effects in the party HUD.
- Added backward save migration for stamina and defensive cloning for older
  skill/effect arrays. Added a mobile pack toggle above the two-row skill bar,
  making consumables accessible at narrow touch widths.
- Added `test:phaser:consumables` with measured movement, recovery, defense,
  attack-speed, poison, cure, warp, non-waste, and migration coverage.
  `npm run verify`, production build, and all twelve Phaser smoke suites pass.
  Desktop 1440x900 and narrow 500x844 screenshots passed with the condition
  HUD and mobile pack open. The live client remains at
  `http://127.0.0.1:5175/`.

### 2026-07-22 — Emberglass Shelf and Hollow Kiln

- Added a complete optional level 11-14 crystal-side arc branching from
  Crystal Mine Approach: the authored Emberglass Shelf field leads into the
  quest-gated Hollow Kiln dungeon and returns cleanly to the regional graph.
- Both maps have custom collision masks and more than 25 authored props, with
  blocked crystal formations, molten rifts, lit paths, distinct palettes,
  world-map pins, music stubs, and a quest-unlocked Hearth Courier warp.
- Added Glasswright Orla, Cinder Mote, Prism Scarab, Sinterhorn, and the
  Kilnheart Colossus boss. Added eight items, four drop tables, two recipes,
  and two quests that form a survey, hunt, gather, dungeon, boss, core turn-in,
  and legendary equipment reward loop.
- Made Ember Wisp a true fire skill and added fire/crystal interactions plus
  fire monster presentation. Added deterministic `test:phaser:emberglass`
  coverage for travel, collision, population, quest gates, both turn-ins,
  guaranteed boss loot, recipes, rewards, warp unlock, and map art.
- Current totals are 17 maps, 36 portals, 25 monsters, 51 items, 25 drop
  tables, 4 shops, 15 recipes, and 7 quests. `npm run verify`, production
  build, and all eleven Phaser smoke suites pass. Desktop and 500x844 visual
  QA passed for both maps, the boss chamber, and the 12-pin region chart.
  Phaser Next remains live at `http://127.0.0.1:5175/`.

### 2026-07-22 — Six-path party advancement

- Fresh journeys now begin all four party members as Vale Novices. Existing
  saves infer their advanced path from the saved class name, preserving
  pre-advancement parties without requiring a save reset.
- Trainer Bram now opens a responsive party advancement panel at level 10.
  Every member can choose any of the six tier-1 paths; the first rite is free,
  later retraining costs 150 gold, and the panel uses a two-step confirmation.
- Job changes now apply catalog skills and level growth plus distinct combat
  profiles. Vale Novice, Warden, Ranger, Channeler, Mender, Wayfarer, and Shade
  behavior all run from the simulation and update the party HUD immediately.
- Made the utility paths fully mechanical: Haggle reduces shop prices by 10%,
  Pushcart adds 20 material/consumable stack capacity, Ore Sense adds 15% drop
  chance, Pilfer marks a monster for bonus loot, and Shadowstep grants evasion.
- Added `test:phaser:jobs`, updated the advanced-skill smoke setup, and added
  `?previewTrainer=trainer_bram&previewLevel=10` for direct QA. `npm run verify`,
  production build, and all ten Phaser smoke suites pass; 1440x900 and 500x844
  screenshots show no clipping or incoherent overlap. The game remains live at
  `http://127.0.0.1:5175/`.

### 2026-07-22 — Full-party equipment and armory

- Replaced the leader-only equipment record with independent five-slot
  loadouts for all four party members. Existing flat saves migrate their gear
  to Aster automatically, while new saves retain base HP separately from gear
  HP so leveling and loadouts cannot double-count growth.
- Made every authored gear stat functional: ATK and DEF work for every party
  member, HP changes effective maximum health, SPD shortens attack intervals,
  and CRIT uses a deterministic attack sequence for 1.5x hits.
- Added ownership rules: one inventory copy can be assigned once, duplicate
  copies can support multiple members, assigned copies cannot be sold, and
  unassigned duplicates remain tradable.
- Added a responsive party armory opened with `I` or the crossed-swords
  control. It provides member tabs, all five slots, complete gear bonuses,
  item stats, owner/free counts, same-slot comparison deltas, equip actions,
  and direct unequip controls. Combat pauses under loadout, map, and dialogue
  overlays.
- Added `test:phaser:equipment` and `?previewLoadout=1` for regression and
  visual QA. `npm run verify`, production build, and all nine Phaser smoke
  suites pass; 1440x900 and 500x844 screenshots show no clipping or overlap.
- Also fixed discovered-map state being omitted during portal scene restarts.
  Phaser Next remains available at `http://127.0.0.1:5175/`.

### 2026-07-22 — Reachable campaign and world map

- Repaired the default Phaser Next journey graph. The authored RO town/plains
  opening now links to Mushroom Hollow, Crystal Mine Approach, and
  Whisperwood, making the Millwick, Moonreed, ruins, and finale routes
  reachable during normal play.
- Added `verify:campaign`, which proves all 15 maps are reachable from a new
  journey, every map can return to the Hearthvale capital, and the 10 visible
  region pins have unique names.
- Added persisted map discovery and a responsive world map opened with `M` or
  the map control. It shows current, visited, available, locked, and uncharted
  routes; level/quest gate reasons; and active quest locations derived from
  visit, monster, drop-source, and turn-in data.
- Added `test:phaser:navigation` for discovery, route gates, and quest markers.
  Desktop 1440x900 and narrow 500x844 screenshots passed after correcting
  opening-label and Moonwell-cluster spacing.
- Verification: `npm run verify` (14 checks), `npm run build:phaser`, and all
  eight Phaser smoke suites pass. Phaser Next remains available at
  `http://127.0.0.1:5175/`.

### 2026-07-22 — Merchant and crafting economy

- Added four data-driven shops and thirteen recipes spanning alchemy,
  smithing, and tailoring, plus catalog export, schema validation, Unity DTOs,
  and a dedicated economy verifier.
- Added simulation-owned buy, sell, and craft transactions with deterministic
  gold/material changes, level gates, merchant/station validation, and
  protection for quest and equipped items.
- Added a responsive merchant workshop with Buy, Sell, and Craft views. The
  existing monster roster now supplies previously missing crafting materials,
  completing a gather → trade/craft → equip/use progression loop.
- Added `?previewShop=<npc_id>` (optionally with `previewMap`) for non-persistent
  merchant QA. Desktop 1440x900 and narrow 500x844 screenshots passed without
  overflow, overlap, or unreadable controls.
- Verification: `npm run verify`, `npm run build:phaser`, and all seven Phaser
  smoke suites, including `npm run test:phaser:economy`, pass. Current totals
  are 15 maps, 21 monsters, 43 items, 21 drop tables, 4 shops, 13 recipes, and
  5 quests. Phaser Next remains available at `http://127.0.0.1:5175/`.

### 2026-07-22 — Data-driven quest finale and elemental combat

- Replaced Phaser Next's hard-coded quest cases with catalog-driven multi-objective
  quests supporting defeat, collect, visit, prerequisites, start/turn-in items,
  rewards, completion NPCs, map-visit progress, and legacy save migration.
- Added elemental strengths/resistances for nature, arcane, and crystal skills,
  with combat text and monster-roster element labels.
- Added the quest-gated Moonwell Heart capstone instance, Wellbound Echo and
  Tidemoon Matriarch, five items, two drop tables, a new biome treatment, and
  two linked late-region quests. Catalog totals are now 15 maps, 21 monsters,
  43 items, 21 drop tables, and 5 quests.
- Added `?previewMap=<map_id>` for direct map QA and corrected narrow-screen
  title typography after desktop/500px screenshot review.
- Verification: `npm run verify`, `npm run build:phaser`, and all six Phaser
  smoke suites pass. Phaser Next is running at `http://127.0.0.1:5175/` because
  port 5174 is occupied by a retired-client server.

### 2026-07-22 — Content expansion: Moonreed Fen

- Added Moonreed Fen as a connected late-starter field between Moonwell
  Entrance and Moonwell Ruins, with bidirectional portal coverage.
- Added three original monsters (`reedwhisper`, `fen_wisp`, `glimmercroc`),
  two new monster elements (`water`, `spirit`), one new biome (`reed_fen`),
  four new items, and three new drop tables.
- Verification: `npm run verify`, `npm run build:phaser`, and all Phaser
  smoke tests pass.

### 2026-07-22 — Phaser Next actionable loot

- Added consumable use and equipment actions from the inventory HUD; usable
  rows now expose Use/Equip controls.
- Equipment state persists in save slots and weapon/defense bonuses feed into
  combat for the party leader.
- Expanded `npm run test:phaser:quests` to cover healing item use and weapon
  equip flow.
- Verification: `npm run build:phaser`, `npm run test:phaser:quests`, and all
  existing Phaser smoke suites pass.

### 2026-07-22 — Phaser Next RPG quest and inventory loop

- Wired Phaser Next into the exported items, quests, and drop-table catalogs.
- Added simulation-owned inventory, gold, quest state, monster loot drops,
  quest start/progress/turn-in events, and persistence for those RPG systems.
- Replaced the static quest card with live quest tracking and added a compact
  inventory panel to the HUD.
- Added `npm run test:phaser:quests` covering quest accept → defeats/drops →
  ready → turn-in rewards.
- Verification: `npm run build:phaser`, `npm run test:phaser:quests`, all
  existing Phaser smoke suites, and `npm run verify` pass.

### 2026-07-22 — Phaser Next save slots and system menu

- Added browser-local persistence for Phaser Next: continuing from title loads
  the saved map/party state, and New Game / Clear Save are available when a
  save exists.
- Added a compact in-game system menu with Save, Title, Clear, sound toggle,
  and reduced-motion toggle; map/combat progress auto-saves periodically and
  after meaningful progression events.
- Verification: `npm run build:phaser`, `npm run test:phaser:movement`,
  `npm run test:phaser:skills`, `npm run test:phaser:auto-attack`, and
  `npm run test:phaser:maps` pass.

### 2026-07-21 — Complete playable town-field-dungeon route

- Promoted the authored Hearthvale Town, Cloverfield Plains, and Old Crystal Mine B1 maps into Phaser Next's default journey and removed their draft-facing labels.
- Added data-driven prop and collision-grid loading, full procedural rendering for authored buildings/trees/roads/cave rooms, collision-aware party and monster movement, Scout Pip in the monster field, and a map-route smoke test.
- Browser-playtested the complete route from town to field to dungeon: NPC/minimap markers rendered, automatic portals transitioned correctly, field combat defeated monsters and awarded levels, and the dungeon populated its full encounter roster.
- Verification: `npm run build:phaser`, all four Phaser smoke suites, `npm run verify`, and a live browser console check pass.

### 2026-07-21 — Phaser Next combat FX polish

- Enriched combat/skill/attack feedback in `client-phaser-next` with
  role-specific slash/projectile trails, caster lunges, impact bursts, area
  blooms, heal/buff rings, and player-hit flashes.
- Kept changes renderer-side in `WorldScene`, driven by existing simulation
  events so auto-attacks, manual attacks, and skills share the same visual
  path.
- Verification: `npm run build:phaser`,
  `npm run test:phaser:auto-attack`, `npm run test:phaser:skills`, and
  `npm run test:phaser:movement` pass.

### 2026-07-21 — Party movement regression fix

- Fixed formation drift caused by combat targeting and movement sharing the
  leader's `facing` vector. Movement heading is now tracked independently, so
  attacks can aim at enemies without rotating or dragging idle followers.
- Added `npm run test:phaser:movement`; the regression reproduced as 28.66px
  of idle drift before the fix and passes with zero drift afterward.

### 2026-07-21 — Playable class skills

- Wired the shared job and skill catalogs into Phaser Next; all 12 skills for
  the four playable party classes now execute in the simulation instead of
  existing only as data definitions.
- Added MP, regeneration, per-skill cooldowns, timed buffs/debuffs/marks, area
  damage, healing, class-aware auto-casting, manual keyboard/click controls,
  visual feedback, and a responsive skill bar.
- Added a skill smoke test covering every playable skill and Thornvolley's
  clustered area hit. Production build, auto-attack smoke, skill smoke, and
  shared skill verification pass; desktop/mobile browser playtest reported no
  console warnings or errors.

### 2026-07-21 — Live map HUD

- Added a compact top-right area map to Phaser Next with live player heading,
  moving monster positions, authored NPC positions, coordinates, and a marker
  legend.
- Added a map-specific monster roster directly below it with each monster name,
  base level, and current active count; the layout condenses on mobile.

### 2026-07-21 — Automatic portal traversal

- Portals now trigger when the player enters their 68px radius; E is reserved
  for NPC dialogue.
- Added enter/exit arming so a destination spawn cannot immediately bounce the
  player back through its arrival portal. Level-gated portals notify once and
  re-arm only after the player leaves their radius.

### 2026-07-21 — Phaser Next auto-attack refinement

- Added simulation-owned auto-attack: when a living enemy enters the 66px
  attack radius, the player faces it and advances the existing timed combo.
- Auto-attacks pause during NPC dialogue; manual Space/click strikes remain.
- Routed swing visuals through simulation events so automatic and manual
  attacks share the same renderer feedback.

### 2026-07-21 — Phaser Next playable client

- Added `client-phaser-next/`, a fresh Phaser 3 + TypeScript + Vite game using
  the shared maps, NPCs, and monster catalogs without duplicating source data.
- Implemented title/boot flow, procedural map presentation, responsive DOM
  HUD, movement/sprint, NPC dialogue, portal travel, monster AI, strike combo,
  damage feedback, defeat/respawn, XP, and leveling.
- Added root `dev:phaser` / `build:phaser` commands and made Phaser Next the
  documented default client. The old Phaser archive and Unity scaffold remain
  untouched as historical/reference workstreams.
- Verification: production build passes; browser smoke test confirmed title →
  world, HUD/canvas layout, input response, and zero console warnings/errors.

### 2026-07-01 — Verification hardening for Unity setup pass

- Fixed `tools/cli.ts` so `npm run verify` works on Windows in this checkout by
  invoking the local `tsx` CLI through `node` instead of trying to spawn
  `npx.cmd` directly.
- Fixed the `tools/rathena-audit.ts` row-parser return type so
  `npx tsc --noEmit` is clean again.
- Verification after the Unity sync automation pass: `npm run verify` passed
  and `npx tsx scripts/sync-unity-data.ts --dry-run` reported it would create
  `client-unity/Assets/StreamingAssets/data -> data`.

### 2026-07-01 — Unity data sync automation

- Added `scripts/sync-unity-data.ts` plus root scripts
  `npm run unity:sync-data` / `npm run unity:refresh-data`.
- The sync flow targets `client-unity/Assets/StreamingAssets/data`, prefers a
  live link/junction into repo-root `data/`, and falls back to a mirrored
  copy when links are unavailable.
- Updated the root README and `client-unity/README.md` so Unity setup no
  longer depends on a manual symlink-only step.
- Still not done: opening `client-unity/` in a real Unity Editor. This pass
  improves setup ergonomics only; it does not validate C# compile/runtime
  correctness.

### 2026-07-01 — Path A → Path B (Unity) migration kickoff

- Archived the Phaser client: `client/` copied to `client-phaser-archive/`
  (source + config only; the original `client/` also remains on disk because
  this sandbox's mount would not permit deleting already-written files —
  treat `client-phaser-archive/` as canonical, `client/` as a stale
  duplicate).
- Scaffolded `client-unity/` — Assets folder tree (Art/Animations/Audio/
  Prefabs/Scenes/Scripts/UI/ScriptableObjects), `Packages/manifest.json`
  (Newtonsoft.Json, TextMeshPro, 2D/UI/networking modules), an `.asmdef`.
- Wrote C# scripts for Phase B-Unity parity scope: `WorldData.cs`/
  `CatalogData.cs` (DTOs mirroring `src/data/world/types.ts` and
  `src/data/catalog/types.ts`), `WorldDataService.cs` (StreamingAssets JSON
  loader), `WorldConstants.cs`, `MapBounds.cs`, `CollisionMask.cs`,
  `PortalTrigger.cs` (portal proximity + level/quest gating),
  `PlayerController.cs` (WASD movement + collision), `CameraFollow.cs`
  (soft follow), `HudController.cs` (HP/MP/SP/XP bars, map name, portal
  hint), `DialogueController.cs` (NPC talk panel, `[E]` interact),
  `BootLoader.cs` + `WorldController.cs` (scene orchestration).
- Explicitly deferred to Phase C-Unity+ (not silently skipped — see
  `client-unity/README.md` "Known gaps"): click-to-move A* pathfinding,
  combat (`CombatController` equivalent), player vitals drain/regen, prop/
  tile art rendering, job/skill/inventory/quest UI, audio, dev overlay.
- Rewrote `STRATEGY.md`, `docs/ROADMAP.md`, `AGENTS.md`, `README.md` for
  Path B. `docs/ROADMAP.md` now has Phase A (done) → Phase B-Phaser
  (retired/superseded) → Phase B-Unity (current, parity scope) →
  Phase C-Unity (planned) → Phase D → Later, replacing the old Phase A/B/C
  structure.
- Created this file and `docs/01_PROJECT_MEMORY.md` (both were referenced by
  `AGENTS.md` but did not exist).
- **Not done in this session:** opening `client-unity/` in an actual Unity
  Editor; StreamingAssets symlink was not created (no live Unity project to
  symlink into yet); prefab/scene files (Boot.unity, World.unity,
  Player.prefab) were not created since Unity scene/prefab YAML shouldn't be
  hand-authored outside the Editor. `npm run verify` was re-run to confirm
  the data layer is still green after all doc/Unity work (see
  `docs/ledgers/BUILD_LEDGER.md` for the exact result).
  Note: the manual symlink step is no longer the only path; use
  `npm run unity:refresh-data` from the repo root to create a link/junction or
  mirrored copy automatically.
