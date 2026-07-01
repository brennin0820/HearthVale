# Session handoff — HearthVale

**Scope:** App memory for **this repository only**.

---

## Current state / focus

+# **2026-07-01** — Added character **job classes** to the data layer: `src/data/catalog/jobs.ts` (`JobClassDefinition` in `types.ts`) with the tier-0 **Vale Novice** base branching into six tier-1 paths (Vale Warden, Glade Ranger, Thorn Channeler, Hearth Mender, Wayfarer Trader, Hollow Shade). Wired into catalog `index.ts`, `export-data.ts` (`data/catalog/jobs.json`), and a new `scripts/verify-jobs.ts` (tier/parent/level/growth checks) registered in `package.json`, `tools/cli.ts`, and `verify:all`. `npm run verify` passes (11 checks). Skill ids are Phase A design stubs — not yet wired to combat.
+# **2026-07-01** — Implemented scene-level monster spawn + AI behavior in `client/src/scenes/WorldScene.ts` using map `spawnTables` (weighted entries, max concurrency, respawn timer, chase/wander movement, and proximity return behavior).
+# **2026-06-30** — Wired player HUD panel fields in `client/src/hud/HudOverlay.ts` to live `WorldScene` snapshot data (`name`, `level`, `HP`, `MP`, `SP`, `XP`, `stance`) so the overlay is no longer static for those channels.
+# Phase B complete — Phaser client loop playable. **HearthVale Compass** (NightRaven guidance UI) added under `compass/` with macOS Electron shell. Next: Phase C (dungeon depth, combat hooks, level-gated portals).

---

## Already done

+# HearthVale Compass — `compass/` NightRaven Compass Phases 1–8; `npm run mac:compass` (Electron Mac); registry → this repo
+# Phase B Phaser client — `client/` with WorldScene, portal traversal, placeholder maps, HUD (`npm run dev:client`)
+# Phase A data foundation — `src/data/world/*`, `npm run export:data`, `npm run verify:portals` (passes)
+# NightRaven ledgers scaffolded (`BUILD_LEDGER.md`, `AUDIT_LEDGER.md`)
+# `STRATEGY.md`, `AGENTS.md`, `docs/01_PROJECT_MEMORY.md`, `README.md` created
+# ApprovalGranted recorded — user: "run in parallel"

---

## Recent sessions

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

---

## Guardrails / locks

- **`+#` only** on memory docs — never `-#` or collapse **Recent sessions** / **Already done**
- **This repo only** — no cross-repo handoff bleed
- **Path A** — Phaser + TS data now; Colyseus later
- **Append-only ledgers** — never edit prior `BUILD_LEDGER` / `AUDIT_LEDGER` entries


