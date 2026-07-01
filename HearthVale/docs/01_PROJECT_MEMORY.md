# Project memory — HearthVale

**Scope:** App memory for **this repository only**.

---

## Identity

+# **Project name:** HearthVale (IP: Hearthlight Vale)
+# **Genre:** Cozy RO-inspired solo MMO
+# **Phase:** B complete — Phaser starter client shipped; Phase C next

---

## Stack — Path A

+# **Client:** Phaser 3 + TypeScript (HearthVale-native)
+# **Data:** TypeScript data layer with JSON exports
+# **Server (later):** Node + Colyseus
+# **Phase A target:** Starter region levels 1–14

---

## Current focus

+# Phase B complete (2026-06-11) — Phaser client under `client/`; 4-map portal loop; loads exported `data/maps.json`
+# Phase C next — dungeon depth, combat placeholders, level-gated portal UI; MMO tooling suite landed (five-lane parallel build).

---

## Guardrails

+# Append-only ledgers under `docs/ledgers/`
+# No cross-project memory import
+# Client reads `data/maps.json` at runtime via Vite `publicDir` — re-run `npm run export:data` after world data edits
