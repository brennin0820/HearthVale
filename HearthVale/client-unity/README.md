# HearthVale — Unity Client (Path B)

Unity client for **HearthVale** (Hearthlight Vale), replacing the archived
Phaser 3 client at `../client-phaser-archive/`. Consumes the same TS-authored
data layer (`../src/data/**` → `../data/*.json` via `npm run export:data` in
the repo root) — this project never redefines maps, monsters, jobs, skills,
items, or quests; it only loads and renders them.

**Status:** scaffold only. Scripts are written and reviewed for correctness by
inspection, but this sandbox has no Unity Editor, so **nothing here has been
opened, compiled, or run yet**. Treat every step below as required, not
optional, before this is a working build.

## Requirements

- Unity Editor **6000.x (Unity 6)** — the project is pinned to 6000.5.1f1 in
  `ProjectSettings/ProjectVersion.txt`, and `Packages/manifest.json` uses
  Unity 6 package versions (e.g. `com.unity.ugui` 2.5.0, which bundles
  TextMeshPro — there is deliberately no separate `com.unity.textmeshpro`
  entry) (2D URP or Built-in 2D template; scripts
  don't depend on either render pipeline).
- Node.js (for the data-export step — already required by the repo root).

## One-time setup

1. **Open the project.** In Unity Hub, "Add project from disk" → select this
   `client-unity/` folder. First open will regenerate `Library/` and pull
   packages listed in `Packages/manifest.json` (includes
   `com.unity.nuget.newtonsoft-json`, TextMeshPro, 2D modules).

2. **Export game data** from the repo root (one directory up):
   ```bash
   npm install
   npm run unity:refresh-data
   ```
   This produces `../data/maps.json`, `../data/regions.json`,
   `../data/catalog/*.json`, `../data/collision/*.json` and syncs them into
   `Assets/StreamingAssets/data/`. The sync script prefers a live
   link/junction to repo-root `data/` and falls back to a mirrored copy when
   links are unavailable.

3. **If you need manual control, link or copy data into StreamingAssets.**
   Unity only reads runtime files from `Assets/StreamingAssets/`. The
   recommended path is the repo script above, but manual setup still works if
   you need it:

   Force a mirrored copy:
   ```bash
   npx tsx scripts/sync-unity-data.ts --mode=copy
   ```

   Force a live link/junction:
   ```bash
   npx tsx scripts/sync-unity-data.ts --mode=link
   ```

   Or create the symlink manually yourself:

   macOS/Linux:
   ```bash
   mkdir -p Assets/StreamingAssets
   ln -s ../../../data Assets/StreamingAssets/data
   ```

   Windows (from an elevated PowerShell/cmd, so relative paths resolve
   correctly from inside `client-unity/`):
   ```powershell
   mkdir Assets\StreamingAssets
   mklink /D Assets\StreamingAssets\data ..\..\data
   ```

   If links aren't permitted in your environment, the sync script's copy mode
   updates `Assets/StreamingAssets/data/` for you and removes stale generated
   files from prior exports.

4. **Create the two scenes** (not included — Unity scene files are binary
   YAML and shouldn't be hand-authored):
   - `Assets/Scenes/Boot.unity`: empty GameObject with `BootLoader.cs`
     attached. Optionally add a `TextMeshPro - Text (UI)` and assign it to
     `BootLoader.statusText` for a loading label.
   - `Assets/Scenes/World.unity`: empty GameObject with `WorldController.cs`
     attached, plus a Canvas with HUD elements (see below).
   - Add both to **File > Build Settings > Scenes In Build**, `Boot` first
     (index 0).

5. **Build the player prefab** (`Assets/Prefabs/Player.prefab`):
   - GameObject with `SpriteRenderer` (placeholder square/circle sprite is
     fine — matches the archived client's greybox-first approach),
     `Rigidbody2D` (gravity scale 0, freeze rotation — `PlayerController.cs`
     sets this at runtime but the component must exist), `PlayerController.cs`.
   - Child GameObject: `Camera` (orthographic) with `CameraFollow.cs`.
   - Assign this prefab to `WorldController.playerPrefab` in the World scene.

6. **Build the HUD** (Canvas in World scene):
   - `HudController.cs` on a GameObject under the Canvas; wire up
     `nameLevelText`, `hpBar`/`mpBar`/`spBar`/`xpBar` (UI Sliders), `stanceText`,
     `mapNameText`, `portalHintText` (all TextMeshPro/UI Slider references).
   - `DialogueController.cs` on another GameObject; wire `dialoguePanel`
     (a Panel, inactive by default), `speakerText`, `lineText`.
   - Assign both controllers to `WorldController.hudController` /
     `dialogueController`.

7. **Press Play** from the Boot scene. Expected result (Phase B-Unity parity
   target): loading text → spawn in Hearthvale Town → WASD movement → camera
   follows → walk into the east gate portal → arrive in Cloverfield Plains →
   `[E]` near an NPC opens a dialogue line.

## Architecture

```
Assets/Scripts/
  Data/
    WorldData.cs       — DTOs for maps.json/regions.json (mirrors src/data/world/types.ts)
    CatalogData.cs      — DTOs for catalog/*.json (mirrors src/data/catalog/types.ts)
  Services/
    WorldDataService.cs — loads + caches JSON from StreamingAssets (mirrors client/src/services/*.ts)
  World/
    WorldConstants.cs   — tile size, speed, biome colors (mirrors client/src/constants.ts)
    MapBounds.cs        — world-bounds computation (mirrors client/src/utils/mapBounds.ts)
    CollisionMask.cs    — per-map walkability grid loader
    PortalTrigger.cs    — portal proximity + gate-reason logic (mirrors checkPortals() in WorldScene.ts)
    BootLoader.cs        — boot/load sequence (mirrors scenes/BootScene.ts)
    WorldController.cs   — per-frame orchestration (mirrors scenes/WorldScene.ts)
  Player/
    PlayerController.cs — WASD movement + collision (mirrors handleMovement() in WorldScene.ts)
    CameraFollow.cs      — soft camera follow (mirrors startFollow() call in WorldScene.ts)
  UI/
    HudController.cs      — HP/MP/SP/XP bars, map name, portal hint
    DialogueController.cs — NPC talk panel, matches DialogueBox.ts + NPC interaction logic
```

## Known gaps vs. the archived Phaser client (intentional — Phase C-Unity+)

These existed in the retired Phaser client and are **not yet ported**. Do not
assume they work:

- Click-to-move A* pathfinding (`queueAutoPath`/`findPath` in the archive).
- Combat: `CombatController`, monster spawning/AI, attack/target-cycling
  input, damage floating text, death/respawn, XP-on-kill.
- Player vitals drain/regen (stamina/mp/hp tick based on movement + safe zone).
- Prop/tile art rendering (buildings, fences, fountains, lanterns, etc. — the
  archive's `drawPropLayer`/`drawProp`). Phase B-Unity renders bare
  map/portal/NPC placeholders only.
- Job/skill selection UI, inventory, quests, audio.
- Dev overlay (F3 debug panel).

See `../docs/ROADMAP.md` for the phase plan these land in.

## Coordinate convention (read before touching position code)

The data layer's Y axis is **Phaser-style Y-down** (authored for the old
client). Unity 2D conventionally uses **Y-up**. Every script that reads a
`Vec2`/`RectData` from `data/*.json` and places it in Unity world space negates Y
(`WorldController.ToUnityPosition` / `PhaserSpacePlayerPos`). If you add new
code that reads map/portal/NPC positions, follow the same pattern — do not
assume raw JSON coordinates can be used directly as Unity world positions.
