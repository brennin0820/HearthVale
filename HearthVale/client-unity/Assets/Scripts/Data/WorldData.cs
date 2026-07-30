// WorldData.cs
// C# DTOs mirroring src/data/world/types.ts. These are deserialization targets
// for data/maps.json and data/regions.json (produced by `npm run export:data`
// in the repo root — the Unity client never redefines game data, only loads it).
//
// Field names match the exported JSON exactly (camelCase) so Newtonsoft.Json
// can deserialize with zero attribute mapping. Do not rename fields here
// without regenerating export-data.ts output or adding [JsonProperty] maps.

using System;
using System.Collections.Generic;

namespace HearthVale.Data
{
    [Serializable]
    public class Vec2
    {
        public float x;
        public float y;
    }

    [Serializable]
    public class LevelRange
    {
        public int min;
        public int max;
    }

    [Serializable]
    public class GridSize
    {
        public int width;
        public int height;
    }

    [Serializable]
    public class RectData // named to avoid CS0104 ambiguity with UnityEngine.Rect
    {
        public float x;
        public float y;
        public float width;
        public float height;
    }

    [Serializable]
    public class SpawnTableEntry
    {
        public string monsterId;
        public float weight;
        public int? minLevel;
        public int? maxLevel;
    }

    [Serializable]
    public class SpawnTable
    {
        public string id;
        public RectData bounds;
        public int maxConcurrent;
        public float respawnSeconds;
        public List<SpawnTableEntry> entries = new();
    }

    [Serializable]
    public class MapNpcPlacement
    {
        public string npcId;
        public Vec2 position;
        public string facing; // "north" | "south" | "east" | "west" | null
    }

    [Serializable]
    public class ResourceNodeDefinition
    {
        public string id;
        public string displayName;
        public string kind; // herb | ore | fiber | relic
        public Vec2 position;
        public string itemId;
        public int minCount;
        public int maxCount;
        public float respawnSeconds;
        public int? requiredLevel;
    }

    [Serializable]
    public class MapPortal
    {
        public string id;
        public string label;
        public Vec2 position;
        public string targetMapId;
        public Vec2 targetSpawn;
        public int? requiredLevel;
        public string requiredQuestId;
        public string requiredQuestStartedId;
    }

    /// <summary>
    /// Mirrors MapDefinition from src/data/world/types.ts.
    /// "kind" is one of: town | field | dungeon | instance.
    /// </summary>
    [Serializable]
    public class MapDefinition
    {
        public string id;
        public string displayName;
        public string kind;
        public string regionId;
        public LevelRange levelRange;
        public bool showOnWorldMap;
        public Vec2 worldMapPosition;
        public string biome;
        public string musicKey;
        public GridSize gridSize;
        public List<SpawnTable> spawnTables = new();
        public List<ResourceNodeDefinition> resourceNodes = new();
        public List<MapNpcPlacement> npcs = new();
        public List<MapPortal> portals = new();
        public Vec2 playerSpawn;
        public RectData safeZone; // nullable in TS; null-check before use
        public string assetKey;
    }

    [Serializable]
    public class WarpDestination
    {
        public string id;
        public string label;
        public string targetMapId;
        public Vec2 targetSpawn;
        public int cost;
        public int? requiredLevel;
        public string unlockQuestId;
    }

    [Serializable]
    public class RegionDefinition
    {
        public string id;
        public string displayName;
        public string capitalMapId;
        public LevelRange levelRange;
        public RectData worldMapBounds;
        public List<WarpDestination> warpTable = new();
    }
}
