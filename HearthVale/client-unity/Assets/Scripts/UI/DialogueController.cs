// DialogueController.cs
// C# port of client-phaser-archive/src/ui/DialogueBox.ts + the NPC-interaction
// subset of WorldScene.ts (updateNpcInteraction/talkToNpc/showDialogueBubble/
// closeDialogueBubble). Interaction key is E (matches the archived
// interactKey binding). Auto-closes after NpcDialogueDurationSeconds, same as
// NPC_DIALOGUE_MS (5200ms) in the original.
//
// NOT ported: click-to-talk (tryClickNpc) — Phase B-Unity is keyboard/[E]-only
// per the parity scope; mouse interaction is a Phase C-Unity item alongside
// click-to-move pathfinding.

using HearthVale.Data;
using TMPro;
using UnityEngine;

namespace HearthVale.UI
{
    public class DialogueController : MonoBehaviour
    {
        private const float NpcDialogueDurationSeconds = 5.2f;
        private const float NpcInteractRadius = 62f; // world units, matches NPC_INTERACT_RADIUS

        [SerializeField] private GameObject dialoguePanel;
        [SerializeField] private TextMeshProUGUI speakerText;
        [SerializeField] private TextMeshProUGUI lineText;

        private float _closeTimer;
        private bool _isOpen;

        public bool IsOpen => _isOpen;

        private void Awake()
        {
            if (dialoguePanel != null) dialoguePanel.SetActive(false);
        }

        private void Update()
        {
            if (!_isOpen) return;
            _closeTimer -= Time.deltaTime;
            if (_closeTimer <= 0f)
            {
                Close();
            }
        }

        /// <summary>
        /// Finds the nearest NPC placement within interact radius, matching
        /// updateNpcInteraction()'s nearest-in-radius scan.
        /// </summary>
        public static MapNpcPlacement FindNearestNpc(MapDefinition map, Vector2 playerPos)
        {
            MapNpcPlacement nearest = null;
            float best = NpcInteractRadius;

            foreach (var placement in map.npcs)
            {
                float dist = Vector2.Distance(playerPos, new Vector2(placement.position.x, placement.position.y));
                if (dist <= best)
                {
                    best = dist;
                    nearest = placement;
                }
            }

            return nearest;
        }

        /// <summary>
        /// Opens (or advances, or closes-on-repress) dialogue for the given
        /// NPC. dialogueIndex is caller-owned (per-NPC-instance state) since
        /// this controller only owns the UI, matching how the archived
        /// NpcInstance.dialogueIndex lived on the world-scene-side struct, not
        /// the dialogue box itself.
        /// </summary>
        public void Talk(NpcDefinition npcDef, string placementNpcId, int dialogueIndex)
        {
            if (_isOpen)
            {
                Close();
                return;
            }

            string displayName = npcDef?.displayName ?? placementNpcId.Replace('_', ' ');
            string title = npcDef?.title;
            var dialogue = npcDef?.dialogue;

            string line = (dialogue != null && dialogue.Count > 0)
                ? dialogue[dialogueIndex % dialogue.Count]
                : "...";

            if (speakerText != null)
            {
                speakerText.text = string.IsNullOrEmpty(title) ? displayName : $"{displayName} · {title}";
            }
            if (lineText != null)
            {
                lineText.text = line;
            }

            if (dialoguePanel != null) dialoguePanel.SetActive(true);
            _isOpen = true;
            _closeTimer = NpcDialogueDurationSeconds;
        }

        public void Close()
        {
            if (dialoguePanel != null) dialoguePanel.SetActive(false);
            _isOpen = false;
        }
    }
}
