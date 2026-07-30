import type { QuestDefinition } from '../data/types.js';
import type { QuestState } from '../simulation/WorldSimulation.js';

export type QuestJournalMode = 'current' | 'available' | 'completed';
export type QuestJournalStatus = QuestState['status'] | 'available' | 'locked';

export interface QuestJournalEntry {
  quest: QuestDefinition;
  state?: QuestState;
  status: QuestJournalStatus;
  lockReason?: string;
}

export interface QuestJournalModel {
  entries: QuestJournalEntry[];
  counts: Record<QuestJournalMode, number>;
  completedCount: number;
}

export function buildQuestJournal(
  quests: QuestDefinition[],
  states: QuestState[],
  playerLevel: number,
): QuestJournalModel {
  const statesById = new Map(states.map((state) => [state.questId, state]));
  const completed = new Set(states.filter((state) => state.status === 'completed').map((state) => state.questId));
  const started = new Set(states.map((state) => state.questId));
  const questNames = new Map(quests.map((quest) => [quest.id, quest.displayName]));
  const entries = quests.map((quest): QuestJournalEntry => {
    const state = statesById.get(quest.id);
    if (state) return { quest, state, status: state.status };
    if (playerLevel < (quest.requiredLevel ?? 1)) {
      return { quest, status: 'locked', lockReason: `Reach level ${quest.requiredLevel ?? 1}.` };
    }
    const chosenAlternative = (quest.exclusiveQuestIds ?? []).find((questId) => started.has(questId));
    if (chosenAlternative) {
      return {
        quest,
        status: 'locked',
        lockReason: `${questNames.get(chosenAlternative) ?? chosenAlternative} was chosen instead.`,
      };
    }
    const missing = (quest.prerequisiteQuestIds ?? []).filter((questId) => !completed.has(questId));
    if (missing.length > 0) {
      return {
        quest,
        status: 'locked',
        lockReason: `Complete ${missing.map((questId) => questNames.get(questId) ?? questId).join(', ')}.`,
      };
    }
    const anyPrerequisites = quest.prerequisiteAnyQuestIds ?? [];
    if (anyPrerequisites.length > 0 && !anyPrerequisites.some((questId) => completed.has(questId))) {
      return {
        quest,
        status: 'locked',
        lockReason: `Complete either ${anyPrerequisites.map((questId) => questNames.get(questId) ?? questId).join(' or ')}.`,
      };
    }
    return { quest, status: 'available' };
  });
  return {
    entries,
    counts: {
      current: entries.filter((entry) => entry.status === 'active' || entry.status === 'ready').length,
      available: entries.filter((entry) => entry.status === 'available' || entry.status === 'locked').length,
      completed: entries.filter((entry) => entry.status === 'completed').length,
    },
    completedCount: completed.size,
  };
}

export function journalEntriesForMode(
  model: QuestJournalModel,
  mode: QuestJournalMode,
  trackedQuestId?: string,
): QuestJournalEntry[] {
  return model.entries.filter((entry) => mode === 'current'
    ? entry.status === 'active' || entry.status === 'ready'
    : mode === 'completed' ? entry.status === 'completed' : entry.status === 'available' || entry.status === 'locked')
    .sort((a, b) => Number(b.quest.id === trackedQuestId) - Number(a.quest.id === trackedQuestId)
      || (a.quest.requiredLevel ?? 1) - (b.quest.requiredLevel ?? 1)
      || a.quest.displayName.localeCompare(b.quest.displayName));
}
