// CollisionMask.cs
// C# port of the collision-mask consumption in client-phaser-archive's
// WorldScene.ts (isWalkable/worldToTile/tileToWorld) and the mask format
// produced by scripts/export-data.ts into data/collision/<mapId>.json.
//
// Phase B-Unity note: town maps in the archived data mostly ship with open
// walkable grids; this loader is included now (rather than stubbed) because
// PlayerController.IsWalkable already calls into it, and skipping collision
// entirely would regress below what Phaser had, not match it.

using System;
using System.IO;
using System.Threading.Tasks;
using HearthVale.Data;
using Newtonsoft.Json;
using UnityEngine;

namespace HearthVale.World
{
    [Serializable]
    public class CollisionMaskJson
    {
        public float tileSize;
        public bool[][] walkable; // [row][col], row 0 = top
    }

    public class CollisionMask
    {
        private readonly bool[][] _walkable;
        private readonly float _tileSize;
        private readonly int _gridWidth;
        private readonly int _gridHeight;

        public CollisionMask(CollisionMaskJson json, int gridWidth, int gridHeight)
        {
            _walkable = json.walkable;
            _tileSize = json.tileSize > 0 ? json.tileSize : WorldConstants.TileSize;
            _gridWidth = gridWidth;
            _gridHeight = gridHeight;
        }

        /// <summary>Ported from isWalkable() in WorldScene.ts, minus the
        /// multi-sample player-footprint check (Phase C-Unity item — Phase
        /// B-Unity checks only the player's center point).</summary>
        public bool IsWalkableWorldPoint(float x, float y)
        {
            if (_walkable == null || _walkable.Length == 0) return true;

            float halfW = (_gridWidth * _tileSize) / 2f;
            float halfH = (_gridHeight * _tileSize) / 2f;

            int col = Mathf.FloorToInt((x + halfW) / _tileSize);
            int row = Mathf.FloorToInt((y + halfH) / _tileSize);

            if (row < 0 || row >= _walkable.Length) return false;
            var rowArr = _walkable[row];
            if (col < 0 || col >= rowArr.Length) return false;

            return rowArr[col];
        }

        public static async Task<CollisionMask> LoadAsync(string mapId, int gridWidth, int gridHeight)
        {
            string path = Path.Combine(
                Application.streamingAssetsPath, "data", "collision", $"{mapId}.json");

            if (!File.Exists(path))
            {
                // Not fatal: some maps (e.g. new ones) may not have a collision
                // export yet. Matches the archived client's graceful handling
                // when collisionMask stays null.
                Debug.LogWarning($"No collision mask for map '{mapId}' at {path}; treating as fully walkable.");
                return null;
            }

            string json = await File.ReadAllTextAsync(path);
            var parsed = JsonConvert.DeserializeObject<CollisionMaskJson>(json);
            return new CollisionMask(parsed, gridWidth, gridHeight);
        }
    }
}
