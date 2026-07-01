# Session handoff — HearthVale

**Scope:** App memory for **this repository only**.

---

## Current state / focus

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
