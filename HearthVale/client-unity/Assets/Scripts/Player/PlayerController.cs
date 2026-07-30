// PlayerController.cs
// C# port of the movement subset of client-phaser-archive/src/scenes/WorldScene.ts
// (handleMovement/getMovementIntent/moveByVector). WASD + arrow keys, 8-directional,
// normalized diagonal speed, axis-separated collision resolution (matches the
// original's "try X then try Y independently" approach so sliding along walls
// works the same way).
//
// NOT ported here (explicitly deferred to Phase C-Unity, see docs/ROADMAP.md):
// click-to-move A* pathfinding, combat attack/target-cycling input. Only
// keyboard movement is in Phase B-Unity's parity scope.

using UnityEngine;
using HearthVale.World;

namespace HearthVale.Player
{
    [RequireComponent(typeof(Rigidbody2D))]
    public class PlayerController : MonoBehaviour
    {
        private MapBoundsRect _bounds;
        private CollisionMask _collisionMask; // may be null if a map has none yet
        private Rigidbody2D _rb;

        public void Initialize(MapBoundsRect bounds, CollisionMask collisionMask)
        {
            _bounds = bounds;
            _collisionMask = collisionMask;
        }

        private void Awake()
        {
            _rb = GetComponent<Rigidbody2D>();
            _rb.gravityScale = 0f;
            _rb.constraints = RigidbodyConstraints2D.FreezeRotation;
        }

        /// <summary>
        /// True if the player moved this frame (feeds vitals drain/regen logic
        /// in PlayerVitals, matching the "moved" bool threaded through the
        /// archived WorldScene.update()).
        /// </summary>
        public bool TickMovement(float deltaTime)
        {
            Vector2 intent = GetMovementIntent();
            if (intent == Vector2.zero) return false;

            return MoveByVector(deltaTime, intent);
        }

        private Vector2 GetMovementIntent()
        {
            float vx = 0f, vy = 0f;
            if (Input.GetKey(KeyCode.A) || Input.GetKey(KeyCode.LeftArrow)) vx -= 1f;
            if (Input.GetKey(KeyCode.D) || Input.GetKey(KeyCode.RightArrow)) vx += 1f;
            if (Input.GetKey(KeyCode.W) || Input.GetKey(KeyCode.UpArrow)) vy += 1f; // Unity Y-up vs Phaser Y-down: inverted on purpose, see note below
            if (Input.GetKey(KeyCode.S) || Input.GetKey(KeyCode.DownArrow)) vy -= 1f;

            var v = new Vector2(vx, vy);
            return v.sqrMagnitude > 0f ? v.normalized : Vector2.zero;
        }

        private bool MoveByVector(float deltaTime, Vector2 intent)
        {
            float step = WorldConstants.PlayerSpeed * deltaTime;
            Vector2 pos = _rb.position;
            bool moved = false;

            float nextX = pos.x + intent.x * step;
            if (IsWalkable(nextX, pos.y))
            {
                var clampedX = MapBounds.ClampToBounds(nextX, pos.y, _bounds);
                pos.x = clampedX.x;
                moved = true;
            }

            float nextY = pos.y + intent.y * step;
            if (IsWalkable(pos.x, nextY))
            {
                var clampedY = MapBounds.ClampToBounds(pos.x, nextY, _bounds);
                pos.y = clampedY.y;
                moved = true;
            }

            _rb.position = pos;
            return moved;
        }

        private bool IsWalkable(float x, float y)
        {
            if (_collisionMask == null) return true; // no mask loaded yet -> open world (matches archived isWalkable() early-return)
            return _collisionMask.IsWalkableWorldPoint(x, y);
        }
    }
}

/*
 * NOTE ON COORDINATE CONVENTION (Y axis):
 * The Phaser client used screen-space Y-down (W/up-arrow decreases Y).
 * Unity 2D conventionally uses Y-up (W/up-arrow increases Y) for world space,
 * matching how Unity's 2D physics, camera, and Scene view all expect
 * positions to behave. This file intentionally flips the Y sign versus the
 * archived WorldScene.ts so movement feels correct in the Unity Editor.
 *
 * CONSEQUENCE: data/maps.json's Y coordinates (portals, npc positions,
 * playerSpawn, safeZone, spawnTables bounds) were authored under Phaser's
 * Y-down convention. WorldController.cs must negate the Y component of every
 * position read from MapDefinition/MapPortal/MapNpcPlacement/RectData before
 * placing GameObjects, OR the data-export step must add a Unity-specific
 * flipped export. This port takes the "negate on read" approach — see
 * WorldController.ToUnityPosition() — to avoid touching the TS data layer.
 * This is called out explicitly in docs/ROADMAP.md Phase B-Unity deliverables
 * as a correctness-critical detail, not a minor tweak.
 */
