// CameraFollow.cs
// C# port of `this.cameras.main.startFollow(this.player, true, 0.12, 0.12)`
// from the archived WorldScene.ts. Phaser's startFollow with lerp values
// (0.12, 0.12) is a simple exponential-smoothing follow; Vector3.Lerp with an
// equivalent per-frame factor reproduces the same "soft follow" feel.

using UnityEngine;

namespace HearthVale.Player
{
    public class CameraFollow : MonoBehaviour
    {
        [SerializeField] private Transform target;
        [Tooltip("Matches Phaser's startFollow lerp factor (0.12).")]
        [SerializeField, Range(0.01f, 1f)] private float lerpFactor = 0.12f;
        [SerializeField] private float zOffset = -10f; // camera must sit in front of 2D sprites

        public void SetTarget(Transform newTarget) => target = newTarget;

        private void LateUpdate()
        {
            if (target == null) return;

            Vector3 desired = new Vector3(target.position.x, target.position.y, zOffset);
            // Frame-rate-independent exponential smoothing equivalent to Phaser's
            // per-frame lerp factor (Phaser applies its lerp every render tick
            // at a roughly fixed cadence; we scale by Time.deltaTime * 60 to
            // keep the same felt responsiveness at other frame rates).
            float t = 1f - Mathf.Pow(1f - lerpFactor, Time.deltaTime * 60f);
            transform.position = Vector3.Lerp(transform.position, desired, t);
        }
    }
}
