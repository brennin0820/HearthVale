// MapBounds.cs
// C# port of client-phaser-archive/src/utils/mapBounds.ts.
// World origin is centered at (0,0), same convention as the Phaser client, so
// existing map/portal/NPC coordinates in data/maps.json need no transform.

using System.Collections.Generic;
using HearthVale.Data;
using UnityEngine;

namespace HearthVale.World
{
    public struct MapBoundsRect
    {
        public float minX, maxX, minY, maxY;
    }

    public static class MapBounds
    {
        /// <summary>Tile size in world units. Matches TILE_SIZE (32px) in the
        /// archived client's constants.ts, reinterpreted as Unity world units
        /// via WorldConstants.TileSize (see WorldConstants.cs).</summary>
        public static MapBoundsRect GetMapBounds(MapDefinition map)
        {
            float halfW = (map.gridSize.width * WorldConstants.TileSize) / 2f;
            float halfH = (map.gridSize.height * WorldConstants.TileSize) / 2f;

            float minX = -halfW, maxX = halfW, minY = -halfH, maxY = halfH;

            var points = new List<Vec2> { map.playerSpawn };
            foreach (var p in map.portals) points.Add(p.position);
            foreach (var n in map.npcs) points.Add(n.position);

            foreach (var point in points)
            {
                minX = Mathf.Min(minX, point.x - WorldConstants.TileSize);
                maxX = Mathf.Max(maxX, point.x + WorldConstants.TileSize);
                minY = Mathf.Min(minY, point.y - WorldConstants.TileSize);
                maxY = Mathf.Max(maxY, point.y + WorldConstants.TileSize);
            }

            return new MapBoundsRect { minX = minX, maxX = maxX, minY = minY, maxY = maxY };
        }

        public static Vector2 ClampToBounds(float x, float y, MapBoundsRect bounds)
        {
            return new Vector2(
                Mathf.Clamp(x, bounds.minX, bounds.maxX),
                Mathf.Clamp(y, bounds.minY, bounds.maxY));
        }
    }
}
