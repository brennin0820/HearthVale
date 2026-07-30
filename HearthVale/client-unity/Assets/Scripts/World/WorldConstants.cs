// WorldConstants.cs
// C# port of client-phaser-archive/src/constants.ts (subset needed for
// Phase B-Unity parity: tile size, player speed, portal trigger radius,
// starting map id). Biome/kind color tables are ported too since they drive
// map background tinting, which the parity milestone includes (cheap, already
// used by drawMapBackground in the archived WorldScene.ts).

using System.Collections.Generic;
using UnityEngine;

namespace HearthVale.World
{
    public static class WorldConstants
    {
        /// <summary>World units per tile. The archived Phaser client used 32px
        /// tiles at 1 world-unit == 1px; Unity's default is 1 world-unit == 1
        /// meter with an orthographic camera, so this is a straight numeric
        /// port (map/portal/NPC coordinates need no rescaling since we treat
        /// 1 Unity unit == 1 Phaser pixel for parity's sake).</summary>
        public const float TileSize = 32f;

        public const float PlayerSpeed = 180f; // units/sec, matches PLAYER_SPEED

        public const float PortalTriggerRadius = 28f;

        public const string InitialMapId = "hearthvale_town";

        public static readonly Dictionary<string, Color> BiomeColors = new()
        {
            { "temperate_town", HexColor(0x4a6741) },
            { "clover_grassland", HexColor(0x5a8f4a) },
            { "fungal_grove", HexColor(0x6b4f7a) },
            { "crystal_cavern", HexColor(0x3d4f6f) },
            { "whisperwood", HexColor(0x3d6b4f) },
            { "mill_countryside", HexColor(0x7a8f4a) },
            { "riverside_town", HexColor(0x4a7a6b) },
            { "crystal_foothills", HexColor(0x6b7a5a) },
            { "moonlit_glade", HexColor(0x4a5a7a) },
            { "ancient_ruins", HexColor(0x5a4a6b) },
        };

        public static readonly Dictionary<string, Color> KindAccent = new()
        {
            { "town", HexColor(0xc9a86c) },
            { "field", HexColor(0x8fbc8f) },
            { "dungeon", HexColor(0x7a6b8f) },
            { "instance", HexColor(0x8f7a6b) },
        };

        public static readonly Color DefaultMapColor = HexColor(0x3a3a4a);

        private static Color HexColor(int hex)
        {
            float r = ((hex >> 16) & 0xFF) / 255f;
            float g = ((hex >> 8) & 0xFF) / 255f;
            float b = (hex & 0xFF) / 255f;
            return new Color(r, g, b, 1f);
        }
    }
}
