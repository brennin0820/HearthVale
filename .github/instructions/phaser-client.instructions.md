---
applyTo: "HearthVale/client/src/**/*.ts"
---

# Phaser client instructions

- Entry: `client/src/main.ts`; world loop: `scenes/WorldScene.ts`.
- Combat: `combat/CombatController.ts` — skills dispatch on `effect.kind`; do not fork a second monster AI.
- HUD is DOM (`hud/HudOverlay.ts`) synced ~10 Hz from scene snapshots — avoid per-frame full bag rebuilds.
- Client loads exported JSON from Vite `publicDir: ../data`. Re-export after data changes.
- Keep listener teardown on scene shutdown.
- Skip Capacitor/`ios/` changes unless the task is explicitly iOS.
- Default job id is Vale Novice until job-selection UI exists — do not hardcode other jobs unless implementing that UI.
