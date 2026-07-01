# STRATEGY — HearthVale

## Product

**HearthVale** is a cozy, Ragnarok Online–inspired **solo MMO** set in the original IP **Hearthlight Vale**. Players explore a warm, community-forward fantasy world at their own pace — gathering, crafting, light combat, and region progression without mandatory group content.

## Vision

- **Feel:** Cozy, nostalgic MMO warmth; readable UI; low-friction session loops (15–45 minutes).
- **Scope (Phase A target):** Starter region content for **levels 1–14** — towns, fields, dungeons, quests, drops, and portals wired through a shared data layer before client polish.
- **IP:** Original world, factions, and naming under **Hearthlight Vale**; no third-party asset or lore dependency.

## Technical approach — Path A

| Layer | Choice | Notes |
|-------|--------|-------|
| Client | **Phaser 3** (TypeScript) | HearthVale-native; top-down 2D, tilemaps, sprites, UI scenes |
| Data | **TypeScript** modules + JSON exports | Single source of truth for maps, NPCs, items, quests, portals |
| Server (later) | **Node + Colyseus** | Authoritative rooms, persistence, multiplayer — not Phase A blocker |
| Tooling | npm scripts (planned) | `export:data`, `verify:portals` from parallel data worker |

Path A prioritizes **client-first iteration** on Phaser with a strict TS data contract so a Colyseus backend can adopt the same schemas later.

## Target player loop (starter region)

1. Create character → tutorial hamlet → first job path hints (Lv 1–5).
2. Field grinding and light quests → first dungeon (Lv 6–10).
3. Crafting / economy hooks → border region and portal checks (Lv 11–14).

## Success metrics (Phase A)

- Starter region data validates (`verify:portals` clean).
- Phaser client can load exported region pack without hand-edited duplicates.
- Documented stack and agent memory prevent cross-project bleed.

## Non-goals (Phase A)

- Live multiplayer / Colyseus deployment
- Full audio pipeline or production art pass
- Monetization or account systems

## Open decisions

- Exact starter region name and zone graph (sibling data worker)
- Persistence format for player state pre-server
- Art pipeline (pixel vs HD) — defer until first playable map
