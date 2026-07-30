// HudController.cs
// C# port of the HP/MP/SP/XP bar subset of client-phaser-archive/src/hud/HudOverlay.ts.
// Phase B-Unity parity scope = HP + EXP bars, player name/level, current map
// name, nearest-portal hint. Party/currency/hotbar/inventory panels from the
// archived HUD are explicitly Phase C-Unity+ (they were placeholder/default
// data even in the Phaser client — see DEFAULT_PARTY/DEFAULT_CURRENCY/etc. in
// the archive — so Unity should not invent real functionality for them yet).

using HearthVale.Data;
using TMPro;
using UnityEngine;
using UnityEngine.UI;

namespace HearthVale.UI
{
    public class PlayerHudState
    {
        public string Name = "Hero";
        public int Level = 1;
        public int HpCur, HpMax;
        public int MpCur, MpMax;
        public int SpCur, SpMax;
        public int XpCur, XpNext;
        public string Stance = "Ready";
    }

    public class HudController : MonoBehaviour
    {
        [Header("Player")]
        [SerializeField] private TextMeshProUGUI nameLevelText;
        [SerializeField] private Slider hpBar;
        [SerializeField] private Slider mpBar;
        [SerializeField] private Slider spBar;
        [SerializeField] private Slider xpBar;
        [SerializeField] private TextMeshProUGUI stanceText;

        [Header("World context")]
        [SerializeField] private TextMeshProUGUI mapNameText;
        [SerializeField] private TextMeshProUGUI portalHintText;

        public void SyncPlayer(PlayerHudState state)
        {
            if (nameLevelText != null)
            {
                nameLevelText.text = $"{state.Name}  Lv.{state.Level}";
            }

            SetBar(hpBar, state.HpCur, state.HpMax);
            SetBar(mpBar, state.MpCur, state.MpMax);
            SetBar(spBar, state.SpCur, state.SpMax);
            SetBar(xpBar, state.XpCur, state.XpNext);

            if (stanceText != null)
            {
                stanceText.text = state.Stance;
            }
        }

        public void SyncMap(MapDefinition map)
        {
            if (mapNameText != null)
            {
                mapNameText.text = map.displayName;
            }
        }

        public void SyncPortalHint(MapPortal nearestPortal, string blockedReason)
        {
            if (portalHintText == null) return;

            if (nearestPortal == null)
            {
                portalHintText.text = string.Empty;
                portalHintText.gameObject.SetActive(false);
                return;
            }

            portalHintText.gameObject.SetActive(true);
            portalHintText.text = blockedReason != null
                ? $"{nearestPortal.label}: {blockedReason}"
                : $"Enter {nearestPortal.label}";
        }

        private static void SetBar(Slider bar, int current, int max)
        {
            if (bar == null) return;
            bar.maxValue = Mathf.Max(1, max);
            bar.value = Mathf.Clamp(current, 0, max);
        }
    }
}
