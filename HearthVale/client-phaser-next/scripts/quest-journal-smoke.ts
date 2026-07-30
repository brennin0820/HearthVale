import assert from 'node:assert/strict';
import type { QuestDefinition } from '../src/game/data/types.js';
import { loadSave, saveGame } from '../src/game/persistence/saveStore.js';
import { buildQuestJournal, journalEntriesForMode } from '../src/game/quests/journal.js';
import type { QuestState } from '../src/game/simulation/WorldSimulation.js';

const values = new Map<string, string>();
const localStorage = {
  getItem: (key: string) => values.get(key) ?? null,
  setItem: (key: string, value: string) => { values.set(key, value); },
  removeItem: (key: string) => { values.delete(key); },
};
Object.defineProperty(globalThis, 'window', { value: { localStorage }, configurable: true });

const quests: QuestDefinition[] = [
  {
    id: 'quest_prologue', displayName: 'A First Light', requiredLevel: 1,
    objectives: [{ id: 'visit', kind: 'visit', targetId: 'hearthvale', count: 1, label: 'Reach Hearthvale' }],
    rewards: { xp: 20, gold: 10 },
  },
  {
    id: 'quest_current', displayName: 'The Open Road', requiredLevel: 3,
    prerequisiteQuestIds: ['quest_prologue'],
    objectives: [{ id: 'hunt', kind: 'defeat', targetId: 'road_mote', count: 4, label: 'Clear Road Motes' }],
    rewards: { xp: 80, gold: 40 },
  },
  {
    id: 'quest_available', displayName: 'Waiting Lantern', requiredLevel: 3,
    prerequisiteQuestIds: ['quest_prologue'], rewards: { xp: 90, gold: 45 },
  },
  {
    id: 'quest_level_locked', displayName: 'Far Beacon', requiredLevel: 8,
    rewards: { xp: 200, gold: 100 },
  },
  {
    id: 'quest_prerequisite_locked', displayName: 'Sealed Archive', requiredLevel: 3,
    prerequisiteQuestIds: ['quest_available'], rewards: { xp: 150, gold: 75 },
  },
];
const states: QuestState[] = [
  { questId: 'quest_prologue', status: 'completed', progress: 1, target: 1, objectiveProgress: { visit: 1 } },
  { questId: 'quest_current', status: 'active', progress: 2, target: 4, objectiveProgress: { hunt: 2 } },
];

const model = buildQuestJournal(quests, states, 5);
assert.deepEqual(model.counts, { current: 1, available: 3, completed: 1 });
assert.equal(model.completedCount, 1);
assert.equal(model.entries.find((entry) => entry.quest.id === 'quest_available')?.status, 'available');
assert.equal(model.entries.find((entry) => entry.quest.id === 'quest_level_locked')?.lockReason, 'Reach level 8.');
assert.equal(model.entries.find((entry) => entry.quest.id === 'quest_prerequisite_locked')?.lockReason, 'Complete Waiting Lantern.');
assert.equal(journalEntriesForMode(model, 'current', 'quest_current')[0]?.quest.id, 'quest_current', 'Pinned quest should lead the current view');
assert.deepEqual(journalEntriesForMode(model, 'completed').map((entry) => entry.quest.id), ['quest_prologue']);

const save = saveGame('test_map', [], [], states, 120, {}, ['test_map'], {}, 'quest_current', {
  warden: { weapon: 'embermark_rune' },
});
assert.equal(save?.trackedQuestId, 'quest_current');
assert.equal(loadSave()?.trackedQuestId, 'quest_current', 'Tracked quest should survive a save reload');
assert.equal(loadSave()?.sockets.warden.weapon, 'embermark_rune', 'Rune sockets should survive a save reload');

const saveKey = 'hearthvale:lanternbound:save:v1';
const legacy = JSON.parse(values.get(saveKey) ?? '{}') as Record<string, unknown>;
delete legacy.trackedQuestId;
delete legacy.sockets;
values.set(saveKey, JSON.stringify(legacy));
assert.equal(loadSave()?.trackedQuestId, undefined, 'Legacy saves should load without a tracked quest');
assert.deepEqual(loadSave()?.sockets, {}, 'Legacy saves should load with an empty socket state');

console.log('Quest journal smoke test passed: filters, lock guidance, pin ordering, persistence, and legacy migration are connected.');
