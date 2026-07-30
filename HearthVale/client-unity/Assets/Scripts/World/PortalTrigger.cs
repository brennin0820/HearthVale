// PortalTrigger.cs
// C# port of checkPortals()/transitionToPortal()/portalBlockReason() from the
// archived WorldScene.ts. Distance-check against the player each frame
// (matches the original's approach) rather than Unity trigger colliders, to
// keep exact parity with the requiredLevel/requiredQuestId gating logic and
// portal-cooldown behavior without introducing a second, divergent code path.

using HearthVale.Data;
using UnityEngine;

namespace HearthVale.World
{
    public class PortalRuntimeState
    {
        public MapPortal Portal;
        public string BlockedReason; // null when usable
    }

    public static class PortalSystem
    {
        /// <summary>
        /// Finds the nearest portal within trigger radius of the player, if any.
        /// Mirrors checkPortals()'s nearestDist-tracking loop.
        /// </summary>
        public static MapPortal FindNearestPortal(MapDefinition map, Vector2 playerPos)
        {
            MapPortal nearest = null;
            float nearestDist = WorldConstants.PortalTriggerRadius;

            foreach (var portal in map.portals)
            {
                float dist = Vector2.Distance(playerPos, new Vector2(portal.position.x, portal.position.y));
                if (dist <= nearestDist)
                {
                    nearestDist = dist;
                    nearest = portal;
                }
            }

            return nearest;
        }

        /// <summary>
        /// Ported from portalBlockReason(). Returns null if the portal is
        /// usable, or a human-readable block reason otherwise (level gate or
        /// quest gate — Whisperwood Meadows' requiredLevel: 5 gate from
        /// docs/ROADMAP.md Phase C is the primary real-data example of this
        /// path being exercised).
        /// </summary>
        public static string GetBlockReason(MapPortal portal, int playerLevel)
        {
            if (portal.requiredLevel.HasValue && playerLevel < portal.requiredLevel.Value)
            {
                return $"Requires Lv {portal.requiredLevel.Value}";
            }
            if (!string.IsNullOrEmpty(portal.requiredQuestId))
            {
                return $"Requires quest {portal.requiredQuestId}";
            }
            return null;
        }
    }
}
