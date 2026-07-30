// BootLoader.cs
// C# port of client-phaser-archive/src/scenes/BootScene.ts.
// Attach to a single GameObject in a "Boot" scene (Scenes/Boot.unity).
// Loads world/catalog data, then loads the "World" scene and hands off the
// starting map id + spawn point via WorldSceneArgs (a tiny static bridge,
// since Unity's SceneManager.LoadScene has no built-in typed-payload param —
// mirrors how BootScene.ts passed `{ mapId, spawn }` into WorldScene's init()).

using System;
using HearthVale.Data;
using TMPro;
using UnityEngine;
using UnityEngine.SceneManagement;

namespace HearthVale.World
{
    /// <summary>
    /// Static handoff bag read by WorldController.Start() in the World scene.
    /// Not a persisted singleton across app restarts — only lives for the
    /// duration of a single scene transition, same lifetime as the Phaser
    /// WorldSceneData payload it replaces.
    /// </summary>
    public static class WorldSceneArgs
    {
        public static string MapId;
        public static Vec2 Spawn;
    }

    public class BootLoader : MonoBehaviour
    {
        [Tooltip("Map id to enter on boot. Matches INITIAL_MAP_ID in the archived client's constants.ts.")]
        [SerializeField] private string initialMapId = "hearthvale_town";

        [SerializeField] private TextMeshProUGUI statusText;

        private async void Start()
        {
            SetStatus("Loading Hearthlight Vale...");

            try
            {
                await WorldDataService.Instance.LoadAllAsync();

                var startMap = WorldDataService.Instance.GetMapById(initialMapId);
                if (startMap == null)
                {
                    throw new Exception($"Missing start map: {initialMapId}");
                }

                WorldSceneArgs.MapId = initialMapId;
                WorldSceneArgs.Spawn = startMap.playerSpawn;

                SceneManager.LoadScene("World");
            }
            catch (Exception error)
            {
                Debug.LogError($"Boot load failed: {error}");
                SetStatus($"Load error: {error.Message}");
            }
        }

        private void SetStatus(string message)
        {
            if (statusText != null)
            {
                statusText.text = message;
            }
            else
            {
                Debug.Log($"[BootLoader] {message}");
            }
        }
    }
}
