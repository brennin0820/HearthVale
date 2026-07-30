// WorldDataService.cs
// C# port of client-phaser-archive/src/services/worldData.ts + npcData.ts +
// catalogData.ts, collapsed into one loader service (Phase B-Unity scope:
// maps + monsters + npcs only; items/quests/jobs/skills/drops loading is
// stubbed for Phase C-Unity and marked TODO below rather than silently
// omitted).
//
// SOURCE OF TRUTH: this script never defines game data. It only deserializes
// JSON that `npm run export:data` (repo root) already produced. If a field is
// missing here, add it to WorldData.cs/CatalogData.cs — do not hardcode a
// substitute value in this file.
//
// DATA LOCATION: Unity's StreamingAssets folder is the standard place for
// runtime-read files that ship with a build unmodified. Before running the
// Unity client, copy (or symlink) the repo's exported data into:
//   client-unity/Assets/StreamingAssets/data/maps.json
//   client-unity/Assets/StreamingAssets/data/regions.json
//   client-unity/Assets/StreamingAssets/data/catalog/monsters.json
//   client-unity/Assets/StreamingAssets/data/catalog/npcs.json
//   (jobs.json, skills.json, items.json, quests.json, drops.json — Phase C-Unity)
// A build/sync step to automate this copy is TODO (see docs/ROADMAP.md
// Phase B-Unity deliverables) — until then, copy manually or via a symlink:
//   ln -s ../../../../data client-unity/Assets/StreamingAssets/data   (macOS/Linux)
// Windows: use `mklink /D` (junction) from an elevated shell, or a plain copy.
//
// REQUIRES: com.unity.nuget.newtonsoft-json package (Newtonsoft.Json for
// Unity). Add via Package Manager > Add package by name >
// com.unity.nuget.newtonsoft-json. Unity's built-in JsonUtility cannot
// deserialize nullable fields, nested polymorphic effect objects, or the
// List<T> shapes used throughout WorldData.cs/CatalogData.cs.

using System;
using System.Collections.Generic;
using System.IO;
using System.Threading.Tasks;
using Newtonsoft.Json;
using UnityEngine;
using UnityEngine.Networking;

namespace HearthVale.Data
{
    /// <summary>
    /// Singleton-style static service (mirrors the module-level cache pattern
    /// in the original worldData.ts) so any script can call
    /// WorldDataService.Instance.GetMapById(...) after LoadAllAsync() resolves,
    /// without needing a scene reference wired in the Inspector.
    /// </summary>
    public class WorldDataService
    {
        private static WorldDataService _instance;
        public static WorldDataService Instance => _instance ??= new WorldDataService();

        private List<MapDefinition> _maps;
        private Dictionary<string, MapDefinition> _mapsById = new();
        private Dictionary<string, MonsterDefinition> _monstersById = new();
        private Dictionary<string, NpcDefinition> _npcsById = new();

        public bool IsLoaded { get; private set; }

        /// <summary>
        /// Starter 4-map loop from the original Phase B (Phaser) scope — used
        /// for HUD hints / dev overlay parity. Mirrors STARTER_LOOP_MAP_IDS in
        /// the archived worldData.ts.
        /// </summary>
        public static readonly string[] StarterLoopMapIds =
        {
            "hearthvale_town",
            "cloverfield_plains",
            "mushroom_hollow",
            "old_crystal_mine",
        };

        /// <summary>
        /// Loads maps.json, regions.json, catalog/monsters.json, and
        /// catalog/npcs.json from StreamingAssets. Call once from a boot
        /// scene/script before entering the world scene. Throws on any
        /// missing/malformed file — Phase B-Unity treats a data load failure
        /// as fatal (matches BootScene.ts's try/catch-and-show-error behavior;
        /// do not silently continue with partial data).
        /// </summary>
        public async Task LoadAllAsync()
        {
            if (IsLoaded) return;

            _maps = await LoadJsonAsync<List<MapDefinition>>("data/maps.json");
            _mapsById = new Dictionary<string, MapDefinition>();
            foreach (var map in _maps)
            {
                _mapsById[map.id] = map;
            }

            var monsters = await LoadJsonAsync<List<MonsterDefinition>>("data/catalog/monsters.json");
            _monstersById = new Dictionary<string, MonsterDefinition>();
            foreach (var m in monsters)
            {
                _monstersById[m.id] = m;
            }

            var npcs = await LoadJsonAsync<List<NpcDefinition>>("data/catalog/npcs.json");
            _npcsById = new Dictionary<string, NpcDefinition>();
            foreach (var n in npcs)
            {
                _npcsById[n.id] = n;
            }

            // TODO (Phase C-Unity): load regions.json (warp table), jobs.json,
            // skills.json, items.json, quests.json, drops.json here following
            // the same LoadJsonAsync<T> pattern once job selection / skills /
            // inventory / quests land. Left unloaded now rather than faked.

            IsLoaded = true;
        }

        public MapDefinition GetMapById(string mapId)
        {
            if (!IsLoaded)
            {
                throw new InvalidOperationException(
                    "WorldDataService.GetMapById called before LoadAllAsync completed.");
            }
            return _mapsById.TryGetValue(mapId, out var map) ? map : null;
        }

        public IReadOnlyList<MapDefinition> GetAllMaps() => _maps;

        public MonsterDefinition GetMonsterById(string monsterId) =>
            _monstersById.TryGetValue(monsterId, out var m) ? m : null;

        public NpcDefinition GetNpcById(string npcId) =>
            _npcsById.TryGetValue(npcId, out var n) ? n : null;

        public static bool IsStarterLoopMap(string mapId)
        {
            foreach (var id in StarterLoopMapIds)
            {
                if (id == mapId) return true;
            }
            return false;
        }

        /// <summary>
        /// Reads a JSON file under Assets/StreamingAssets/&lt;relativePath&gt;
        /// using UnityWebRequest (required on Android/WebGL where
        /// StreamingAssets is not a plain filesystem path; also works
        /// transparently in the Editor and on desktop builds).
        /// </summary>
        private static async Task<T> LoadJsonAsync<T>(string relativePath)
        {
            string fullPath = Path.Combine(Application.streamingAssetsPath, relativePath);
            string json;

            if (fullPath.Contains("://"))
            {
                // Android / WebGL: streamingAssetsPath is a URL, must use UnityWebRequest.
                using var request = UnityWebRequest.Get(fullPath);
                var op = request.SendWebRequest();
                while (!op.isDone) await Task.Yield();

                if (request.result != UnityWebRequest.Result.Success)
                {
                    throw new IOException(
                        $"Failed to load {relativePath}: {request.error}");
                }
                json = request.downloadHandler.text;
            }
            else
            {
                // Desktop (Windows/Mac/Linux) + Editor: plain file read.
                if (!File.Exists(fullPath))
                {
                    throw new FileNotFoundException(
                        $"Missing data file: {fullPath}. Did you run `npm run export:data` " +
                        "in the repo root and copy/symlink data/ into " +
                        "client-unity/Assets/StreamingAssets/data/?", fullPath);
                }
                json = await File.ReadAllTextAsync(fullPath);
            }

            return JsonConvert.DeserializeObject<T>(json);
        }
    }
}
