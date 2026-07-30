// WorldController.cs
// Central scene controller for the "World" scene — C# port of the orchestration
// logic in client-phaser-archive/src/scenes/WorldScene.ts (create()/update()),
// scoped to Phase B-Unity parity: map load, player spawn/movement, camera
// follow, portal transitions across the starter 4-map loop, HP/EXP HUD sync,
// and NPC dialogue on [E]. Vitals regen/drain, combat, auto-path, and
// prop/tile art rendering are explicitly deferred — see the TODO markers and
// docs/ROADMAP.md Phase B-Unity / Phase C-Unity split.
//
// SCENE WIRING (do in the Unity Editor, not in code):
//   1. Create Scenes/Boot.unity with a GameObject holding BootLoader.cs.
//   2. Create Scenes/World.unity with an empty GameObject holding this script.
//   3. Add both scenes to File > Build Settings > Scenes In Build (Boot first).
//   4. Assign playerPrefab (a GameObject with SpriteRenderer + Rigidbody2D +
//      PlayerController + a child Camera with CameraFollow), hudController,
//      and dialogueController via the Inspector.
//   5. Player prefab's SpriteRenderer can use a plain placeholder sprite
//      (e.g. Unity's built-in Square/Circle) until real art lands — matches
//      the archived client's greybox-first approach (see docs/ROADMAP.md).

using System.Collections.Generic;
using System.Threading.Tasks;
using HearthVale.Data;
using HearthVale.Player;
using HearthVale.UI;
using UnityEngine;

namespace HearthVale.World
{
    public class WorldController : MonoBehaviour
    {
        [SerializeField] private GameObject playerPrefab;
        [SerializeField] private HudController hudController;
        [SerializeField] private DialogueController dialogueController;

        private MapDefinition _currentMap;
        private MapBoundsRect _bounds;
        private CollisionMask _collisionMask;
        private GameObject _playerInstance;
        private PlayerController _playerController;
        private CameraFollow _cameraFollow;

        private PlayerHudState _playerState = new();
        private float _portalCooldown; // seconds
        private readonly Dictionary<string, int> _npcDialogueIndex = new();
        private string _lastPortalHintKey = "";

        private async void Start()
        {
            if (!WorldDataService.Instance.IsLoaded)
            {
                // Defensive fallback: if the World scene is entered directly
                // (e.g. in-Editor Play from this scene) without going through
                // Boot first, load data now instead of failing silently.
                await WorldDataService.Instance.LoadAllAsync();
            }

            string mapId = string.IsNullOrEmpty(WorldSceneArgs.MapId)
                ? WorldConstants.InitialMapId
                : WorldSceneArgs.MapId;
            Vec2 spawn = WorldSceneArgs.Spawn ?? WorldDataService.Instance.GetMapById(mapId)?.playerSpawn;

            await EnterMap(mapId, spawn);
        }

        private async Task EnterMap(string mapId, Vec2 spawn)
        {
            var map = WorldDataService.Instance.GetMapById(mapId);
            if (map == null)
            {
                Debug.LogError($"Map not found: {mapId}");
                return;
            }

            _currentMap = map;
            _bounds = MapBounds.GetMapBounds(map);
            _collisionMask = await CollisionMask.LoadAsync(mapId, map.gridSize.width, map.gridSize.height);

            SpawnOrMovePlayer(spawn ?? map.playerSpawn);
            hudController?.SyncMap(map);

            _portalCooldown = 0.5f; // matches the 500ms initial portalCooldown in the archived scene
        }

        private void SpawnOrMovePlayer(Vec2 spawnPos)
        {
            Vector2 unityPos = ToUnityPosition(spawnPos);

            if (_playerInstance == null)
            {
                _playerInstance = Instantiate(playerPrefab, unityPos, Quaternion.identity);
                _playerController = _playerInstance.GetComponent<PlayerController>();
                if (_playerController == null)
                {
                    Debug.LogError(
                        "WorldController.playerPrefab is missing a PlayerController component. " +
                        "See client-unity/README.md step 5 for required prefab setup.");
                    return;
                }

                _cameraFollow = _playerInstance.GetComponentInChildren<CameraFollow>();
                if (_cameraFollow == null)
                {
                    Debug.LogWarning(
                        "WorldController.playerPrefab has no CameraFollow in its children; " +
                        "the camera will not track the player. See client-unity/README.md step 5.");
                }
                _cameraFollow?.SetTarget(_playerInstance.transform);

                var vitals = PlayerVitals.ForLevel(_playerState.Level);
                _playerState.HpMax = vitals.hpMax;
                _playerState.HpCur = vitals.hpMax;
                _playerState.MpMax = vitals.mpMax;
                _playerState.MpCur = vitals.mpMax;
                _playerState.XpNext = PlayerVitals.XpToNextLevel(_playerState.Level);
            }
            else
            {
                _playerInstance.transform.position = new Vector3(unityPos.x, unityPos.y, _playerInstance.transform.position.z);
            }

            _playerController.Initialize(_bounds, _collisionMask);
        }

        /// <summary>
        /// Converts a data-layer Vec2 (Phaser Y-down convention) to Unity
        /// world space (Y-up). See the coordinate-convention note in
        /// PlayerController.cs for why this negation exists.
        /// </summary>
        private static Vector2 ToUnityPosition(Vec2 v) => new(v.x, -v.y);

        private void Update()
        {
            if (_currentMap == null || _playerController == null) return;

            if (_portalCooldown > 0f)
            {
                _portalCooldown = Mathf.Max(0f, _portalCooldown - Time.deltaTime);
            }

            bool moved = _playerController.TickMovement(Time.deltaTime);

            // TODO (Phase C-Unity): vitals drain/regen (stamina/mp/hp based on
            // moved + safe-zone state), matching updatePlayerVitals() in the
            // archived WorldScene.ts. Not wired yet — HUD shows static
            // hp/mp/sp until combat/vitals lands.

            UpdateNpcInteraction();
            CheckPortals();
            SyncHud();
        }

        private void UpdateNpcInteraction()
        {
            if (dialogueController == null) return;

            Vector2 playerPos = _playerInstance.transform.position;
            var nearestPlacement = DialogueController.FindNearestNpc(_currentMap, PhaserSpacePlayerPos(playerPos));

            if (nearestPlacement != null && Input.GetKeyDown(KeyCode.E))
            {
                var npcDef = WorldDataService.Instance.GetNpcById(nearestPlacement.npcId);
                int idx = _npcDialogueIndex.TryGetValue(nearestPlacement.npcId, out var i) ? i : 0;
                dialogueController.Talk(npcDef, nearestPlacement.npcId, idx);
                _npcDialogueIndex[nearestPlacement.npcId] = idx + 1;
            }
        }

        private void CheckPortals()
        {
            if (_portalCooldown > 0f)
            {
                hudController?.SyncPortalHint(null, null);
                return;
            }

            Vector2 playerPos = _playerInstance.transform.position;
            var nearest = PortalSystem.FindNearestPortal(_currentMap, PhaserSpacePlayerPos(playerPos));

            if (nearest == null)
            {
                hudController?.SyncPortalHint(null, null);
                return;
            }

            string blocked = PortalSystem.GetBlockReason(nearest, _playerState.Level);
            hudController?.SyncPortalHint(nearest, blocked);

            if (blocked != null)
            {
                return;
            }

            string hintKey = nearest.id;
            if (hintKey != _lastPortalHintKey)
            {
                _lastPortalHintKey = hintKey;
                _ = TransitionToPortal(nearest);
            }
        }

        private async Task TransitionToPortal(MapPortal portal)
        {
            var target = WorldDataService.Instance.GetMapById(portal.targetMapId);
            if (target == null)
            {
                Debug.LogWarning($"Portal target missing: {portal.targetMapId}");
                return;
            }

            _portalCooldown = 0.8f; // matches 800ms in the archived transitionToPortal()
            _lastPortalHintKey = "";
            await EnterMap(portal.targetMapId, portal.targetSpawn);
        }

        /// <summary>
        /// The data layer (portals/NPCs) is authored in Phaser's Y-down space;
        /// convert a Unity-space player position back to that space for
        /// distance checks against MapPortal/MapNpcPlacement positions,
        /// rather than converting the whole map's data on load.
        /// </summary>
        private static Vector2 PhaserSpacePlayerPos(Vector2 unityPos) => new(unityPos.x, -unityPos.y);

        private void SyncHud()
        {
            hudController?.SyncPlayer(_playerState);
        }
    }

    /// <summary>
    /// C# port of client-phaser-archive/src/combat/progression.ts (the vitals
    /// subset only — monsterXpReward/playerCombatStats are Phase C-Unity,
    /// once combat lands). Kept as a small static helper here rather than a
    /// new file since it's ~10 lines; promote to its own file when combat
    /// wiring starts.
    /// </summary>
    public static class PlayerVitals
    {
        public const int StarterRegionLevelCap = 14;

        public static (int hpMax, int mpMax) ForLevel(int level) =>
            (40 + level * 12, 20 + level * 6);

        private static int TotalXpForLevel(int level)
        {
            if (level <= 1) return 0;
            return Mathf.FloorToInt(100f * Mathf.Pow(level, 1.8f));
        }

        public static int XpToNextLevel(int level) =>
            Mathf.Max(1, TotalXpForLevel(level + 1) - TotalXpForLevel(level));
    }
}
