import { createSaveGame, normalizeSaveGame, type SaveGame } from '@hearthvale/sim';
import type { EquipmentState, InventoryStack, PlayerState, QuestState, ResourceCooldowns, SocketState } from '../simulation/WorldSimulation.js';

export interface GameSettings {
  reducedMotion: boolean;
  soundEnabled: boolean;
}

export type { SaveGame } from '@hearthvale/sim';

const SAVE_KEY = 'hearthvale:lanternbound:save:v1';
const SETTINGS_KEY = 'hearthvale:lanternbound:settings:v1';

const DEFAULT_SETTINGS: GameSettings = {
  reducedMotion: false,
  soundEnabled: true,
};

export function loadSave(): SaveGame | null {
  if (!storageAvailable()) return null;
  try {
    const raw = window.localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    return normalizeSaveGame(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function hasSave(): boolean {
  return loadSave() !== null;
}

export function saveGame(mapId: string, party: PlayerState[], inventory: InventoryStack[] = [], quests: QuestState[] = [], gold = 0, equipment: EquipmentState = {}, discoveredMapIds: string[] = [mapId], resourceCooldowns: ResourceCooldowns = {}, trackedQuestId?: string, sockets: SocketState = {}): SaveGame | null {
  if (!storageAvailable()) return null;
  const save = createSaveGame({
    mapId, party, inventory, quests, gold, equipment, discoveredMapIds,
    resourceCooldowns, trackedQuestId, sockets,
  });
  window.localStorage.setItem(SAVE_KEY, JSON.stringify(save));
  return save;
}

export function deleteSave(): void {
  if (storageAvailable()) window.localStorage.removeItem(SAVE_KEY);
}

export function loadSettings(): GameSettings {
  if (!storageAvailable()) return { ...DEFAULT_SETTINGS };
  try {
    const raw = window.localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const parsed = JSON.parse(raw) as Partial<GameSettings>;
    return {
      reducedMotion: Boolean(parsed.reducedMotion),
      soundEnabled: parsed.soundEnabled !== false,
    };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(settings: GameSettings): GameSettings {
  const next = { ...settings };
  if (storageAvailable()) window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
  applySettings(next);
  return next;
}

export function applySettings(settings = loadSettings()): void {
  document.documentElement.classList.toggle('reduce-motion', settings.reducedMotion);
  document.documentElement.dataset.sound = settings.soundEnabled ? 'on' : 'off';
}

export function formatSaveTime(savedAt: number): string {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(savedAt));
}


function storageAvailable(): boolean {
  return typeof window !== 'undefined' && 'localStorage' in window;
}
