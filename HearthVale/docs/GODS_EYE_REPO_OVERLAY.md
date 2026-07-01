# HearthVale — God's Eye repo overlay

**Scope:** App memory vocabulary for **this repository only**.

## Product boundary

| Layer | Name |
|-------|------|
| Product / category | Cozy solo MMO (Ragnarok-inspired) |
| Brand / ship name | **HearthVale** |
| Starter region | **Hearthlight Vale** (levels 1–14) |
| Client stack | Phaser 3 · TypeScript · Vite |
| Data layer | `src/data/world/*` → `data/maps.json` |
| Server (later) | Node · Colyseus |

## Not now

- Colyseus multiplayer server until solo loop is shippable
- Combat systems before dungeon depth (Phase C)
- Cross-repo handoff bleed from gods-eye framework or NightRaven iOS
- Renaming domain types to match marketing before ship

## Current focus

Phase C — dungeon depth, combat hooks, Whisperwood unlock gating. Phase B client loop is complete.

## Next

See `docs/14_SESSION_HANDOFF.md` **Current state** and **Next:** lines.
