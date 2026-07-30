// CatalogData.cs
// C# DTOs mirroring src/data/catalog/types.ts. Deserialization targets for
// data/catalog/*.json (monsters.json, npcs.json, items.json, quests.json,
// drops.json, jobs.json, skills.json) produced by `npm run export:data`.
//
// Phase B-Unity (parity milestone) only consumes MonsterDefinition (HUD target
// frame, spawn-table lookups) and NpcDefinition (dialogue). JobClassDefinition,
// SkillDefinition, ItemDefinition, QuestDefinition, DropTableDefinition are
// included now so the loader is complete for Phase C-Unity (job selection,
// skills-in-combat, inventory) without another schema pass later.

using System;
using System.Collections.Generic;

namespace HearthVale.Data
{
    [Serializable]
    public class MonsterAbilityDefinition
    {
        public string id;
        public string displayName;
        public string target; // "single" | "area"
        public float cooldown;
        public float telegraphSeconds;
        public float range;
        public float powerMultiplier;
        public string status; // poison | gloom | drenched | sunblind | fractured | muted | severed
        public float? statusAmount;
        public float? statusDuration;
    }

    [Serializable]
    public class MonsterDefinition
    {
        public string id;
        public string displayName;
        public int baseLevel;
        public int hp;
        public int atk;
        public int def;
        public string size; // "small" | "medium" | "large"
        public string element;
        public List<MonsterAbilityDefinition> abilities = new();
    }

    /// <summary>NpcRole: quest | merchant | trainer | warp | flavor.</summary>
    [Serializable]
    public class NpcDefinition
    {
        public string id;
        public string displayName;
        public string role;
        public string title;
        public List<string> dialogue = new();
    }

    [Serializable]
    public class ItemStats
    {
        public int? atk;
        public int? def;
        public int? hp;
        public int? spd;
        public int? crit;
    }

    [Serializable]
    public class ConsumableEffect
    {
        public string type; // heal | restore | buff | cure | warp
        public float? amount;
        public float? duration;
        public string stat;
        public string target;
    }

    /// <summary>
    /// ItemKind: consumable | material | equipment | rune | quest.
    /// EquipmentSlot (when kind == "equipment"): weapon | offhand | head | body | accessory.
    /// </summary>
    [Serializable]
    public class ItemDefinition
    {
        public string id;
        public string displayName;
        public string kind;
        public int stackMax;
        public int sellPrice;
        public string rarity = "common"; // common|uncommon|rare|epic|legendary; present in all exported items today, default is a safety net
        public string description;
        public int? buyPrice;
        public int? levelReq;
        public string slot;
        public ItemStats stats;
        public ItemStats runeStats;
        public List<string> runeSlots = new();
        public ConsumableEffect effect;
        public bool tradable = true;
    }

    [Serializable]
    public class QuestItemStack
    {
        public string itemId;
        public int count;
    }

    [Serializable]
    public class QuestObjectiveDefinition
    {
        public string id;
        public string kind;
        public string targetId;
        public int count;
        public string label;
    }

    [Serializable]
    public class QuestRewardDefinition
    {
        public int xp;
        public int gold;
        public List<QuestItemStack> items = new();
    }

    [Serializable]
    public class QuestDefinition
    {
        public string id;
        public string displayName;
        public string description;
        public string giverNpcId;
        public string completionNpcId;
        public int? requiredLevel;
        public List<string> prerequisiteQuestIds = new();
        public List<string> prerequisiteAnyQuestIds = new();
        public List<string> exclusiveQuestIds = new();
        public List<QuestObjectiveDefinition> objectives = new();
        public List<QuestItemStack> startItems = new();
        public List<QuestItemStack> turnInItems = new();
        public QuestRewardDefinition rewards;
        public string unlocksWarpId;
        public bool completesCampaign;
    }

    [Serializable]
    public class DropEntry
    {
        public string itemId;
        public float weight;
        public int minCount;
        public int maxCount;
    }

    [Serializable]
    public class DropTableDefinition
    {
        public string id;
        public string monsterId;
        public List<DropEntry> entries = new();
    }

    [Serializable]
    public class ShopDefinition
    {
        public string id;
        public string displayName;
        public string npcId;
        public List<string> itemIds = new();
    }

    [Serializable]
    public class RecipeDefinition
    {
        public string id;
        public string displayName;
        public string category;
        public List<string> stationNpcIds = new();
        public QuestItemStack result;
        public List<QuestItemStack> ingredients = new();
        public int goldCost;
        public int? requiredLevel;
    }

    [Serializable]
    public class JobStatGrowth
    {
        public int hp;
        public int mp;
        public int atk;
        public int def;
        public int matk;
        public int spr;
    }

    [Serializable]
    public class JobMasteryBonuses
    {
        public int hp;
        public int mp;
        public int atk;
        public int def;
        public int spd;
        public int crit;
        public int powerPercent;
        public int healingPercent;
        public int evasion;
        public int buyPrice;
        public int dropRate;
        public int stackMax;
    }

    [Serializable]
    public class JobMasteryDefinition
    {
        public string id;
        public string displayName;
        public string description;
        public int requiredLevel;
        public JobMasteryBonuses bonuses;
    }

    [Serializable]
    public class JobEvolutionDefinition
    {
        public string id;
        public string displayName;
        public string description;
        public int requiredLevel;
        public string unlockQuestId;
        public string skillId;
        public JobMasteryBonuses bonuses;
    }

    /// <summary>
    /// JobRole: novice | melee | ranged | magic | support | artisan | scout.
    /// primaryStat: str | agi | int | vit | dex | wis.
    /// </summary>
    [Serializable]
    public class JobClassDefinition
    {
        public string id;
        public string displayName;
        public int tier;
        public string role;
        public string baseClassId; // null for tier-0 base
        public int requiredLevel;
        public string primaryStat;
        public string description;
        public JobStatGrowth growth;
        public List<string> startingSkills = new();
        public List<JobMasteryDefinition> masteries = new();
        public List<JobEvolutionDefinition> evolutions = new();
    }

    /// <summary>
    /// SkillType: physical | magical | support | utility.
    /// SkillTargetType: self | enemy | ally | area.
    /// </summary>
    [Serializable]
    public class SkillEffect
    {
        public string kind; // damage|heal|buff|debuff|mark|economy|gather|utility
        public float? powerMultiplier;
        public float? amount;
        public string stat;
        public float? duration;
    }

    [Serializable]
    public class SkillDefinition
    {
        public string id;
        public string displayName;
        public string type;
        public string targetType;
        public string description;
        public int mpCost;
        public float cooldown;
        public SkillEffect effect;
        public string element;
        public List<string> jobIds = new();
        public List<string> evolutionIds = new();
        public int? requiredLevel;
        public string unlockQuestId;
    }
}
