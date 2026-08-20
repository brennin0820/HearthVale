# MEMORIES

Tracked open/rejected bugfix PRs from critical bug hunts. Keep small.

- MultiplayerWorldScene portal travel fired `leave()` without awaiting it before `joinOrCreate`, so the destination room could load a stale character and later autosave overwrite fresher progress — https://github.com/brennin0820/HearthVale/pull/12 — open — 2026-08-20
