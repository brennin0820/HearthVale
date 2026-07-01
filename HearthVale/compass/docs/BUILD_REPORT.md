# Compass build report — full product (Phases 1–8)

**Date:** 2026-06-11  
**Scope:** Mock MVP → functioning local product with GE wire + IndexedDB persistence

## Architecture

```
gods-eye-projects.conf
        ↓
Vite compassApiPlugin (/api/registry, /api/project)
        ↓
buildSnapshot.ts + parseHandoff.ts  →  base ProjectSnapshot
        ↓
IndexedDB overrides (per project path)  →  mergeSnapshot.ts
        ↓
enrichSnapshot.ts (prompts, progress, loops, reports, done criteria)
        ↓
ProjectContext → useCompassData → all pages
```

## Persistence

- **IndexedDB** store `nightraven-compass` / `project-overrides` — patches for tasks, decisions, blockers, audits, phases, settings
- **localStorage** key `compass.selectedProject`
- Seed: registry API snapshot; fallback to enriched mock seed when API unavailable

## God's Eye integration

Reads from registered project path:

- `docs/14_SESSION_HANDOFF.md` — focus, **Next:** items, Recent sessions
- `docs/GODS_EYE_REPO_OVERLAY.md` — Not Now / product boundary
- Artifact count for progress (37, overlay, handoff, changelog, learning, AGENTS, rules, hooks)

## Routing

All `NavItemId` values registered in `src/app/routeRegistry.tsx` — compile-time check against `navigation.ts`.

## Verification

```bash
cd apps/compass && npm run build && npm run lint
npm run dev   # live GE reads
npm run preview   # API on preview server too
```

## Deferred

- Cloud sync, auth, multi-user
- Writing back to handoff/changelog on disk (read-only GE wire)
- Autonomous agent execution
