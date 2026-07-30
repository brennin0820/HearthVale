# Colyseus server stub (superseded)

This directory predates the real multiplayer server. Implementation now lives
in `server/` at the repo root (Node + Colyseus, local-dev only for now).

## What's implemented (MP-0 / MP-1)

- `server/src/index.ts` — Colyseus + Express bootstrap on `ws://localhost:2567`
- `server/src/rooms/WorldRoom.ts` — one room per `mapId`, server-authoritative
  tick over a `@hearthvale/sim` `WorldSimulation` instance per connected
  player, portal-gate validation, reconnect grace window
- `server/src/auth/**` — local username/password accounts (SQLite + scrypt),
  opaque session tokens
- `server/src/persistence/db.ts` — `better-sqlite3` schema (accounts,
  sessions, characters)
- `server/src/data/loadGameData.ts` — imports `src/data/**` directly, no JSON
  round-trip

See `docs/ROADMAP.md`'s "Later — Server-authoritative multiplayer" section
and the MP-2..MP-6 follow-on phases (combat authority + persistence, chat +
party grouping, trading, guilds, PvP) for what's still ahead.

Run it with `npm run dev:server` from the repo root.
