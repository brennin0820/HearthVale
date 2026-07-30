import type { DropTableDefinition, ItemDefinition, JobDefinition, JobMasteryBonuses, MapDefinition, MapNpcPlacement, MonsterDefinition, NpcDefinition, QuestDefinition, RecipeDefinition, RegionDefinition, ShopDefinition, SkillDefinition, Vec2 } from '../game/data/types.js';
import { buildWorldMapModel, type WorldMapNode } from '../game/navigation/worldMap.js';
import { deleteSave, loadSettings, saveSettings } from '../game/persistence/saveStore.js';
import { buildQuestJournal, journalEntriesForMode, type QuestJournalMode } from '../game/quests/journal.js';
import { EQUIPMENT_SLOTS, EVOLUTION_RETRAIN_COST, JOB_RETRAIN_COST, MASTERY_RETRAIN_COST, MAX_SKILL_SLOTS, equipmentStatsForMember, type EquipmentSlot, type EquipmentState, type EquipmentStats, type InventoryStack, type MonsterState, type PlayerState, type QuestState, type ResourceNodeState, type SocketState } from '../game/simulation/WorldSimulation.js';

interface HudNpc {
  placement: MapNpcPlacement;
  definition: NpcDefinition;
}

export interface HudContext {
  player: PlayerState;
  party: PlayerState[];
  map: MapDefinition;
  maps: MapDefinition[];
  regions: RegionDefinition[];
  monsters: readonly MonsterState[];
  resources: readonly ResourceNodeState[];
  npcs: readonly HudNpc[];
  npcDefinitions: NpcDefinition[];
  target?: { definition: MonsterDefinition; hp: number; maxHp: number };
  prompt?: string;
  skills: SkillDefinition[];
  jobs: JobDefinition[];
  items: ItemDefinition[];
  quests: QuestDefinition[];
  drops: DropTableDefinition[];
  shops: ShopDefinition[];
  recipes: RecipeDefinition[];
  activeMerchantNpcId?: string;
  activeTrainerNpcId?: string;
  activeWarpNpcId?: string;
  inventory: InventoryStack[];
  questStates: QuestState[];
  trackedQuestId?: string;
  equipment: EquipmentState;
  sockets: SocketState;
  discoveredMapIds: string[];
  gold: number;
  buyPriceMultiplier: number;
  dropRateBonus: number;
  stackSizeBonus: number;
}

const SKILL_KEYS: Record<string, string[]> = {
  warden: ['1', '2', '3'],
  ranger: ['4', '5', '6'],
  channeler: ['7', '8', '9'],
  mender: ['Z', 'X', 'C'],
};
const EQUIPMENT_SLOT_LABELS: Record<EquipmentSlot, string> = {
  weapon: 'Weapon', offhand: 'Offhand', head: 'Head', body: 'Body', accessory: 'Accessory',
};
const EQUIPMENT_STAT_LABELS: Record<keyof EquipmentStats, string> = {
  atk: 'ATK', def: 'DEF', hp: 'HP', spd: 'HASTE', crit: 'CRIT',
};
const EQUIPMENT_STAT_KEYS = Object.keys(EQUIPMENT_STAT_LABELS) as Array<keyof EquipmentStats>;
type LoadoutAction = 'equip' | 'unequip' | 'equip-skill' | 'unequip-skill' | 'socket-rune' | 'unsocket-rune';
const MASTERY_BONUS_LABELS: Record<keyof JobMasteryBonuses, string> = {
  hp: 'HP', mp: 'MP', atk: 'ATK', def: 'DEF', spd: 'HASTE', crit: 'CRIT',
  powerPercent: 'POWER', healingPercent: 'HEALING', evasion: 'EVADE',
  buyPrice: 'SHOP PRICES', dropRate: 'DROPS', stackMax: 'STACKS',
};

class Hud {
  private root = document.querySelector<HTMLElement>('#hud')!;
  private toastTimer = 0;
  private mapKey = '';
  private monsterMarkers = new Map<string, HTMLElement>();
  private npcMarkers = new Map<string, HTMLElement>();
  private resourceMarkers = new Map<string, HTMLElement>();
  private monsterRows = new Map<string, HTMLElement>();
  private renderedSkills = '';
  private inventorySignature = '';
  private questSignature = '';
  private journalSignature = '';
  private economySignature = '';
  private warpSignature = '';
  private worldMapSignature = '';
  private loadoutSignature = '';
  private advancementSignature = '';
  private economyMode: 'buy' | 'sell' | 'craft' = 'buy';
  private selectedWorldMapId = '';
  private selectedJournalQuestId = '';
  private journalMode: QuestJournalMode = 'current';
  private selectedLoadoutMemberId = 'warden';
  private selectedAdvancementMemberId = 'warden';
  private pendingJobId = '';
  private pendingMasteryId = '';
  private pendingEvolutionId = '';
  private worldMapOpen = false;
  private loadoutOpen = false;
  private journalOpen = false;
  private skillHandler?: (memberId: string, skillId: string) => void;
  private itemHandler?: (itemId: string) => void;
  private economyHandler?: (action: 'buy' | 'sell' | 'craft', targetId: string) => void;
  private economyCloseHandler?: () => void;
  private warpHandler?: (warpId: string) => void;
  private warpCloseHandler?: () => void;
  private worldMapHandler?: (open: boolean) => void;
  private journalTrackHandler?: (questId?: string) => void;
  private journalOpenHandler?: (open: boolean) => void;
  private loadoutHandler?: (action: LoadoutAction, memberId: string, targetId: string) => void;
  private loadoutOpenHandler?: (open: boolean) => void;
  private jobHandler?: (memberId: string, jobId: string) => void;
  private masteryHandler?: (memberId: string, masteryId: string) => void;
  private evolutionHandler?: (memberId: string, evolutionId: string) => void;
  private jobCloseHandler?: () => void;
  private saveHandler?: { saveNow: () => void; exitToTitle: () => void };
  private campaignHandler?: { continueJourney: () => void; exitToTitle: () => void };

  mount(): void {
    this.root.innerHTML = `
      <section class="hud-top">
        <div class="party-card glass">
          <div class="party-heading"><strong>Lanternbound Party</strong><div><span id="level">Lv. 1</span><span id="stamina-label">ST 100</span></div></div>
          <div class="party-progress"><div class="meter xp" title="Party experience"><i id="xp-fill"></i></div><div class="meter stamina" title="Travel stamina"><i id="stamina-fill"></i></div></div>
          <div class="party-grid">
            <div class="party-member" data-party-id="warden"><i></i><div><strong>Aster</strong><small>Vale Warden</small><em class="member-mp"></em><span class="member-status"></span></div><div class="meter hp"><b></b><span></span></div></div>
            <div class="party-member" data-party-id="ranger"><i></i><div><strong>Rowan</strong><small>Glade Ranger</small><em class="member-mp"></em><span class="member-status"></span></div><div class="meter hp"><b></b><span></span></div></div>
            <div class="party-member" data-party-id="channeler"><i></i><div><strong>Iris</strong><small>Thorn Channeler</small><em class="member-mp"></em><span class="member-status"></span></div><div class="meter hp"><b></b><span></span></div></div>
            <div class="party-member" data-party-id="mender"><i></i><div><strong>Mara</strong><small>Hearth Mender</small><em class="member-mp"></em><span class="member-status"></span></div><div class="meter hp"><b></b><span></span></div></div>
          </div>
        </div>
        <aside class="map-hud glass" aria-label="Area map">
          <header class="map-hud__header">
            <div><small id="map-kind">STARTER REGION</small><strong id="map-name">Hearthvale Town</strong></div>
            <span id="map-coordinates">0, 0</span>
          </header>
          <div id="minimap" class="minimap" role="img" aria-label="Map showing player, monsters, and NPCs">
            <div class="minimap__grid"></div>
            <div class="minimap__vignette"></div>
            <div id="minimap-player" class="map-marker map-marker--player" title="You"><i></i></div>
          </div>
          <div class="map-legend" aria-hidden="true"><span><i class="legend-player"></i>You</span><span><i class="legend-monster"></i>Monster</span><span><i class="legend-npc"></i>NPC</span><span><i class="legend-resource"></i>Gather</span></div>
          <section class="monster-roster" aria-label="Monsters in this area">
            <div class="monster-roster__heading"><span>MONSTERS</span><small id="monster-count">0 ACTIVE</small></div>
            <div id="monster-list" class="monster-list"></div>
          </section>
        </aside>
      </section>
      <section class="system-tray">
        <button id="pack-toggle" class="icon-button glass" type="button" title="Pack" aria-label="Open pack">▤</button>
        <button id="journal-toggle" class="icon-button glass" type="button" title="Quest journal (J)" aria-label="Open quest journal">▧</button>
        <button id="loadout-toggle" class="icon-button glass" type="button" title="Party loadout (I)" aria-label="Open party loadout">⚔</button>
        <button id="world-map-toggle" class="icon-button glass" type="button" title="World map (M)" aria-label="Open world map">⌖</button>
        <button id="menu-toggle" class="icon-button glass" type="button" title="Menu" aria-label="Menu">☰</button>
        <aside id="system-panel" class="system-panel glass hidden" aria-label="Game menu">
          <header><small>SYSTEM</small><strong>Journey Menu</strong></header>
          <p id="save-status">Not saved yet</p>
          <div class="system-actions">
            <button type="button" data-action="save">Save</button>
            <button type="button" data-action="title">Title</button>
            <button type="button" data-action="clear">Clear</button>
          </div>
          <label><input id="setting-sound" type="checkbox"> Sound cues</label>
          <label><input id="setting-motion" type="checkbox"> Reduce motion</label>
        </aside>
      </section>
      <aside id="target-card" class="target-card glass hidden">
        <div><strong id="target-name"></strong><span id="target-level"></span></div>
        <div class="meter enemy"><i id="target-fill"></i></div>
      </aside>
      <section class="quest-card glass">
        <header><small>LANTERN PATH</small><button id="quest-journal-open" type="button" title="Open quest journal" aria-label="Open quest journal">▧</button></header>
        <div id="quest-list"></div>
      </section>
      <div id="journal-scrim" class="journal-scrim hidden"></div>
      <aside id="journal-panel" class="journal-panel glass hidden" aria-label="Quest journal">
        <header class="journal-header">
          <div><small>QUEST JOURNAL</small><strong>Lantern Path</strong><span id="journal-progress"></span></div>
          <button id="journal-close" type="button" title="Close" aria-label="Close quest journal">×</button>
        </header>
        <nav class="journal-tabs" role="tablist" aria-label="Quest journal views">
          <button type="button" role="tab" data-journal-mode="current">Current</button>
          <button type="button" role="tab" data-journal-mode="available">Available</button>
          <button type="button" role="tab" data-journal-mode="completed">Completed</button>
        </nav>
        <div class="journal-layout">
          <nav id="journal-list" class="journal-list" aria-label="Quests"></nav>
          <section class="journal-detail" aria-live="polite">
            <small id="journal-detail-status">CURRENT QUEST</small>
            <strong id="journal-detail-name">Choose a quest</strong>
            <span id="journal-detail-meta"></span>
            <p id="journal-detail-copy"></p>
            <div id="journal-detail-objectives" class="journal-objectives"></div>
            <div id="journal-detail-rewards" class="journal-rewards"></div>
            <button id="journal-track" type="button" disabled>Track quest</button>
          </section>
        </div>
      </aside>
      <section class="inventory-card glass">
        <header><small>PACK</small><strong id="gold-count">25g</strong></header>
        <div id="inventory-list"></div>
      </section>
      <div id="world-map-scrim" class="world-map-scrim hidden"></div>
      <aside id="world-map-panel" class="world-map-panel glass hidden" aria-label="Hearthlight Vale world map">
        <header class="world-map-header">
          <div><small>REGION CHART</small><strong id="world-map-region">Hearthlight Vale</strong><span id="world-map-progress"></span></div>
          <button id="world-map-close" type="button" title="Close" aria-label="Close world map">×</button>
        </header>
        <div class="world-map-layout">
          <div id="world-map-chart" class="world-map-chart" role="img" aria-label="Map of routes through Hearthlight Vale">
            <svg id="world-map-routes" class="world-map-routes" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"></svg>
            <div id="world-map-nodes" class="world-map-nodes"></div>
          </div>
          <section class="world-map-detail" aria-live="polite">
            <small id="world-map-detail-status">CURRENT AREA</small>
            <strong id="world-map-detail-name">Hearthvale Town</strong>
            <span id="world-map-detail-meta"></span>
            <p id="world-map-detail-copy"></p>
            <div id="world-map-detail-objectives"></div>
          </section>
        </div>
        <footer class="world-map-legend" aria-label="Map legend">
          <span><i class="is-current"></i>Current</span><span><i class="is-visited"></i>Visited</span><span><i class="is-available"></i>Open road</span><span><i class="is-locked"></i>Locked</span><span><b>!</b>Quest</span>
        </footer>
      </aside>
      <div id="loadout-scrim" class="loadout-scrim hidden"></div>
      <aside id="loadout-panel" class="loadout-panel glass hidden" aria-label="Party equipment and inventory">
        <header class="loadout-header">
          <div><small>PARTY LOADOUT</small><strong>Lanternbound Armory</strong><span id="loadout-owned-count"></span></div>
          <button id="loadout-close" type="button" title="Close" aria-label="Close party loadout">×</button>
        </header>
        <nav id="loadout-party-tabs" class="loadout-party-tabs" role="tablist" aria-label="Party members"></nav>
        <div class="loadout-layout">
          <section class="loadout-member" aria-label="Selected party member">
            <header><div id="loadout-member-mark"></div><div><strong id="loadout-member-name"></strong><span id="loadout-member-role"></span></div></header>
            <div id="loadout-stats" class="loadout-stats"></div>
            <div id="loadout-slots" class="loadout-slots"></div>
          </section>
          <section class="loadout-pack" aria-label="Equipment and skills">
            <header><strong>Skill Set</strong><span id="loadout-skill-summary"></span></header>
            <div id="loadout-skill-list" class="loadout-skill-list"></div>
            <header class="loadout-gear-heading"><strong>Gear in Pack</strong><span id="loadout-pack-summary"></span></header>
            <div id="loadout-item-list" class="loadout-item-list"></div>
          </section>
        </div>
      </aside>
      <div id="advancement-scrim" class="advancement-scrim hidden"></div>
      <aside id="advancement-panel" class="advancement-panel glass hidden" aria-label="Party job advancement">
        <header class="advancement-header">
          <div><small id="advancement-kicker">TRAINER BRAM · PATH RITE</small><strong id="advancement-title">Paths of the Vale</strong><span id="advancement-gold"></span></div>
          <button id="advancement-close" type="button" title="Close" aria-label="Close path training">×</button>
        </header>
        <nav id="advancement-party-tabs" class="advancement-party-tabs" role="tablist" aria-label="Party members"></nav>
        <div class="advancement-layout">
          <section class="advancement-member" aria-label="Selected party member">
            <header><div id="advancement-member-mark"></div><div><strong id="advancement-member-name"></strong><span id="advancement-member-job"></span></div></header>
            <p id="advancement-member-status"></p>
            <dl id="advancement-party-gifts" class="advancement-party-gifts"></dl>
          </section>
          <section class="advancement-paths" aria-label="Available job paths">
            <header><strong id="advancement-path-heading">Choose a Path</strong><span id="advancement-path-summary"></span></header>
            <div id="advancement-path-list" class="advancement-path-list"></div>
            <header id="advancement-mastery-heading" class="advancement-mastery-heading"><strong>Lantern Mastery</strong><span id="advancement-mastery-summary"></span></header>
            <div id="advancement-mastery-list" class="advancement-mastery-list"></div>
          </section>
        </div>
      </aside>
      <div id="economy-scrim" class="economy-scrim hidden"></div>
      <aside id="economy-panel" class="economy-panel glass hidden" aria-label="Merchant and crafting menu">
        <header class="economy-header">
          <div><small>MARKET & WORKSHOP</small><strong id="economy-name">Merchant</strong></div>
          <div><span id="economy-gold">25g</span><button id="economy-close" type="button" title="Close" aria-label="Close merchant menu">×</button></div>
        </header>
        <nav class="economy-tabs" role="tablist" aria-label="Merchant actions">
          <button type="button" role="tab" data-economy-mode="buy">Buy</button>
          <button type="button" role="tab" data-economy-mode="sell">Sell</button>
          <button type="button" role="tab" data-economy-mode="craft">Craft</button>
        </nav>
        <div id="economy-list" class="economy-list"></div>
      </aside>
      <div id="warp-scrim" class="warp-scrim hidden"></div>
      <aside id="warp-panel" class="warp-panel glass hidden" aria-label="Hearth Courier destinations">
        <header class="warp-header">
          <div><small>HEARTH COURIER · WAYLINES</small><strong>Choose a Hearthline</strong></div>
          <div><span id="warp-gold">25g</span><button id="warp-close" type="button" title="Close" aria-label="Close Hearth Courier">×</button></div>
        </header>
        <div id="warp-list" class="warp-list"></div>
      </aside>
      <div id="campaign-scrim" class="campaign-scrim hidden"></div>
      <section id="campaign-panel" class="campaign-panel glass hidden" role="dialog" aria-modal="true" aria-labelledby="campaign-title">
        <div class="campaign-seal" aria-hidden="true">✦</div>
        <small>THE LANTERNSPIRE ACCORD</small>
        <h2 id="campaign-title">Hearthlight Restored</h2>
        <p>The Moonwell runs clear, the Hollow Kiln warms without hunger, and the first dawn in an age reaches every road in the vale.</p>
        <div class="campaign-stats" aria-label="Journey summary">
          <span><strong id="campaign-level">14</strong>Party level</span>
          <span><strong id="campaign-maps">0/0</strong>Places charted</span>
          <span><strong id="campaign-quests">0</strong>Quests fulfilled</span>
        </div>
        <p class="campaign-coda">Your journey is complete. Hearthlight Vale remains open.</p>
        <div class="campaign-actions">
          <button id="campaign-continue" type="button">Continue Exploring</button>
          <button id="campaign-title-button" type="button">Return to Title</button>
        </div>
      </section>
      <div id="prompt" class="prompt hidden"></div>
      <div id="dialogue" class="dialogue glass hidden"><small id="speaker-role"></small><strong id="speaker-name"></strong><p id="dialogue-line"></p><span>Press E to continue</span></div>
      <div id="toast" class="toast hidden"></div>
      <nav id="skillbar" class="skillbar" aria-label="Party skills"></nav>
      <nav class="hotbar controls-bar" aria-label="Controls">
        <div><kbd>WASD</kbd><span>Move</span></div><div><kbd>Shift</kbd><span>Sprint</span></div><div><kbd>Auto</kbd><span>Nearby strike</span></div><div><kbd>E</kbd><span>Interact</span></div><div><kbd>I</kbd><span>Loadout</span></div><div><kbd>M</kbd><span>Map</span></div>
      </nav>`;
    this.root.addEventListener('click', (event) => {
      const campaignContinue = (event.target as HTMLElement).closest<HTMLButtonElement>('#campaign-continue');
      if (campaignContinue) {
        this.setCampaignOpen(false);
        this.campaignHandler?.continueJourney();
        return;
      }
      const campaignTitle = (event.target as HTMLElement).closest<HTMLButtonElement>('#campaign-title-button');
      if (campaignTitle) {
        this.campaignHandler?.exitToTitle();
        return;
      }
      const worldMapToggle = (event.target as HTMLElement).closest<HTMLButtonElement>('#world-map-toggle');
      if (worldMapToggle) {
        this.setWorldMapOpen(!this.worldMapOpen);
        return;
      }
      const journalToggle = (event.target as HTMLElement).closest<HTMLButtonElement>('#journal-toggle, #quest-journal-open');
      if (journalToggle) {
        this.setJournalOpen(!this.journalOpen);
        return;
      }
      const journalClose = (event.target as HTMLElement).closest('#journal-close, #journal-scrim');
      if (journalClose) {
        this.setJournalOpen(false);
        return;
      }
      const journalMode = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-journal-mode]');
      if (journalMode?.dataset.journalMode) {
        this.journalMode = journalMode.dataset.journalMode as QuestJournalMode;
        this.selectedJournalQuestId = '';
        this.journalSignature = '';
        return;
      }
      const journalQuest = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-journal-quest-id]');
      if (journalQuest?.dataset.journalQuestId) {
        this.selectedJournalQuestId = journalQuest.dataset.journalQuestId;
        this.journalSignature = '';
        return;
      }
      const journalTrack = (event.target as HTMLElement).closest<HTMLButtonElement>('#journal-track');
      if (journalTrack && !journalTrack.disabled) {
        const questId = journalTrack.dataset.questId;
        const tracked = journalTrack.dataset.tracked === 'true';
        this.journalTrackHandler?.(tracked ? undefined : questId);
        this.questSignature = '';
        this.journalSignature = '';
        return;
      }
      const loadoutToggle = (event.target as HTMLElement).closest<HTMLButtonElement>('#loadout-toggle');
      if (loadoutToggle) {
        this.setLoadoutOpen(!this.loadoutOpen);
        return;
      }
      const loadoutClose = (event.target as HTMLElement).closest('#loadout-close, #loadout-scrim');
      if (loadoutClose) {
        this.setLoadoutOpen(false);
        return;
      }
      const loadoutMember = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-loadout-member-id]');
      if (loadoutMember?.dataset.loadoutMemberId) {
        this.selectedLoadoutMemberId = loadoutMember.dataset.loadoutMemberId;
        this.loadoutSignature = '';
        return;
      }
      const loadoutAction = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-loadout-action]');
      if (loadoutAction?.dataset.loadoutAction && loadoutAction.dataset.targetId) {
        this.loadoutHandler?.(loadoutAction.dataset.loadoutAction as LoadoutAction, this.selectedLoadoutMemberId, loadoutAction.dataset.targetId);
        this.loadoutSignature = '';
        return;
      }
      const worldMapClose = (event.target as HTMLElement).closest('#world-map-close, #world-map-scrim');
      if (worldMapClose) {
        this.setWorldMapOpen(false);
        return;
      }
      const worldMapNode = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-world-map-id]');
      if (worldMapNode?.dataset.worldMapId) {
        this.selectedWorldMapId = worldMapNode.dataset.worldMapId;
        this.worldMapSignature = '';
        return;
      }
      const menuButton = (event.target as HTMLElement).closest<HTMLButtonElement>('#menu-toggle');
      if (menuButton) {
        this.root.querySelector('#system-panel')!.classList.toggle('hidden');
        return;
      }
      const packButton = (event.target as HTMLElement).closest<HTMLButtonElement>('#pack-toggle');
      if (packButton) {
        this.setMobilePackOpen(!this.root.classList.contains('mobile-pack-open'));
        return;
      }
      const action = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-action]');
      if (action) {
        if (action.dataset.action === 'save') this.saveHandler?.saveNow();
        if (action.dataset.action === 'title') this.saveHandler?.exitToTitle();
        if (action.dataset.action === 'clear') { deleteSave(); this.setSaveStatus('Save cleared'); this.toast('Save cleared', 'danger'); }
        return;
      }
      const itemButton = (event.target as HTMLElement).closest<HTMLButtonElement>('.inventory-action');
      if (itemButton?.dataset.itemId) {
        if (itemButton.dataset.itemKind === 'equipment' || itemButton.dataset.itemKind === 'rune') this.setLoadoutOpen(true);
        else this.itemHandler?.(itemButton.dataset.itemId);
        return;
      }
      const advancementClose = (event.target as HTMLElement).closest('#advancement-close, #advancement-scrim');
      if (advancementClose) {
        this.pendingJobId = '';
        this.pendingMasteryId = '';
        this.pendingEvolutionId = '';
        this.jobCloseHandler?.();
        return;
      }
      const advancementMember = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-advancement-member-id]');
      if (advancementMember?.dataset.advancementMemberId) {
        this.selectedAdvancementMemberId = advancementMember.dataset.advancementMemberId;
        this.pendingJobId = '';
        this.pendingMasteryId = '';
        this.pendingEvolutionId = '';
        this.advancementSignature = '';
        return;
      }
      const jobButton = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-job-id]');
      if (jobButton?.dataset.jobId && !jobButton.disabled) {
        this.pendingMasteryId = '';
        this.pendingEvolutionId = '';
        if (this.pendingJobId === jobButton.dataset.jobId) {
          this.jobHandler?.(this.selectedAdvancementMemberId, jobButton.dataset.jobId);
          this.pendingJobId = '';
        } else {
          this.pendingJobId = jobButton.dataset.jobId;
        }
        this.advancementSignature = '';
        return;
      }
      const masteryButton = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-mastery-id]');
      if (masteryButton?.dataset.masteryId && !masteryButton.disabled) {
        this.pendingJobId = '';
        this.pendingEvolutionId = '';
        if (this.pendingMasteryId === masteryButton.dataset.masteryId) {
          this.masteryHandler?.(this.selectedAdvancementMemberId, masteryButton.dataset.masteryId);
          this.pendingMasteryId = '';
        } else {
          this.pendingMasteryId = masteryButton.dataset.masteryId;
        }
        this.advancementSignature = '';
        return;
      }
      const evolutionButton = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-evolution-id]');
      if (evolutionButton?.dataset.evolutionId && !evolutionButton.disabled) {
        this.pendingJobId = '';
        this.pendingMasteryId = '';
        if (this.pendingEvolutionId === evolutionButton.dataset.evolutionId) {
          this.evolutionHandler?.(this.selectedAdvancementMemberId, evolutionButton.dataset.evolutionId);
          this.pendingEvolutionId = '';
        } else {
          this.pendingEvolutionId = evolutionButton.dataset.evolutionId;
        }
        this.advancementSignature = '';
        return;
      }
      const economyClose = (event.target as HTMLElement).closest('#economy-close, #economy-scrim');
      if (economyClose) {
        this.economyCloseHandler?.();
        return;
      }
      const economyMode = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-economy-mode]');
      if (economyMode?.dataset.economyMode) {
        this.economyMode = economyMode.dataset.economyMode as 'buy' | 'sell' | 'craft';
        this.economySignature = '';
        return;
      }
      const economyAction = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-economy-action]');
      if (economyAction?.dataset.economyAction && economyAction.dataset.targetId) {
        this.economyHandler?.(economyAction.dataset.economyAction as 'buy' | 'sell' | 'craft', economyAction.dataset.targetId);
        return;
      }
      const warpClose = (event.target as HTMLElement).closest('#warp-close, #warp-scrim');
      if (warpClose) {
        this.warpCloseHandler?.();
        return;
      }
      const warpAction = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-warp-id]');
      if (warpAction?.dataset.warpId && !warpAction.disabled) {
        this.warpHandler?.(warpAction.dataset.warpId);
        return;
      }
      const button = (event.target as HTMLElement).closest<HTMLButtonElement>('.skill-slot');
      if (!button || button.disabled) return;
      const { memberId, skillId } = button.dataset;
      if (memberId && skillId) this.skillHandler?.(memberId, skillId);
    });
    this.root.addEventListener('change', (event) => {
      const input = event.target as HTMLInputElement;
      const runeSelect = input.closest<HTMLSelectElement>('[data-rune-slot]');
      if (runeSelect?.dataset.runeSlot) {
        const action: LoadoutAction = runeSelect.value ? 'socket-rune' : 'unsocket-rune';
        const targetId = runeSelect.value ? `${runeSelect.dataset.runeSlot}:${runeSelect.value}` : runeSelect.dataset.runeSlot;
        this.loadoutHandler?.(action, this.selectedLoadoutMemberId, targetId);
        this.loadoutSignature = '';
        return;
      }
      if (input.id !== 'setting-sound' && input.id !== 'setting-motion') return;
      saveSettings({
        soundEnabled: this.root.querySelector<HTMLInputElement>('#setting-sound')?.checked ?? true,
        reducedMotion: this.root.querySelector<HTMLInputElement>('#setting-motion')?.checked ?? false,
      });
    });
    this.syncSettingsControls();
  }

  update(context: HudContext): void {
    const { player, party, map, monsters, resources, npcs, target } = context;
    this.renderSkills(party, context.skills);
    this.renderQuests(context.quests, context.questStates, context.trackedQuestId);
    this.renderJournal(context);
    this.renderInventory(context.items, context.inventory, context.gold, context.equipment);
    this.renderEconomy(context);
    this.renderWarp(context);
    this.renderAdvancement(context);
    this.renderWorldMap(context);
    this.renderLoadout(context);
    this.text('#level', `Lv. ${player.level}`);
    this.width('#xp-fill', player.xp / player.xpNext);
    this.text('#stamina-label', `ST ${Math.ceil(player.stamina)}`);
    this.width('#stamina-fill', player.stamina / player.maxStamina);
    for (const member of party) {
      const row = this.root.querySelector<HTMLElement>(`[data-party-id="${member.id}"]`);
      if (!row) continue;
      row.classList.toggle('is-fainted', member.hp <= 0);
      const fill = row.querySelector<HTMLElement>('.meter span');
      if (fill) fill.style.width = `${Math.max(0, member.hp / member.maxHp) * 100}%`;
      const label = row.querySelector<HTMLElement>('.meter b');
      if (label) label.textContent = `${Math.ceil(member.hp)}/${member.maxHp}`;
      const mana = row.querySelector<HTMLElement>('.member-mp');
      if (mana) mana.textContent = `${Math.floor(member.mp)} MP`;
      const status = row.querySelector<HTMLElement>('.member-status');
      if (status) {
        const labels = member.activeEffects.filter((effect) => ['poison', 'gloom', 'drenched', 'sunblind', 'fractured', 'muted', 'severed', 'def', 'spd', 'flee', 'matk_resist', 'atk'].includes(effect.stat))
          .sort((a, b) => Number(['poison', 'gloom', 'drenched', 'sunblind', 'fractured', 'muted', 'severed'].includes(b.stat)) - Number(['poison', 'gloom', 'drenched', 'sunblind', 'fractured', 'muted', 'severed'].includes(a.stat)))
          .slice(0, 2).map((effect) => `${this.statusLabel(effect.stat)} ${Math.ceil(effect.remaining)}s`);
        status.textContent = labels.join(' · ');
        status.classList.toggle('is-harmful', member.activeEffects.some((effect) => ['poison', 'gloom', 'drenched', 'sunblind', 'fractured', 'muted', 'severed'].includes(effect.stat)));
      }
      const className = row.querySelector<HTMLElement>('div:nth-child(2) small');
      if (className) className.textContent = member.className;
    }
    this.updateSkills(party, context.skills);
    this.text('#map-name', map.displayName);
    this.text('#map-kind', `${map.kind.toUpperCase()} · LV ${map.levelRange.min}–${map.levelRange.max}`);
    this.text('#map-coordinates', `${Math.round(player.x)}, ${Math.round(player.y)}`);
    this.updateMap(map, player, monsters, resources, npcs);
    const targetCard = this.root.querySelector('#target-card')!;
    targetCard.classList.toggle('hidden', !target);
    if (target) {
      this.text('#target-name', target.definition.displayName);
      this.text('#target-level', `Lv. ${target.definition.baseLevel}`);
      this.width('#target-fill', target.hp / target.maxHp);
    }
    const prompt = this.root.querySelector('#prompt')!;
    prompt.textContent = context.prompt ?? '';
    prompt.classList.toggle('hidden', !context.prompt);
  }

  showDialogue(npc: NpcDefinition, line: string): void {
    this.text('#speaker-role', npc.title.toUpperCase());
    this.text('#speaker-name', npc.displayName);
    this.text('#dialogue-line', line);
    this.root.querySelector('#dialogue')!.classList.remove('hidden');
  }

  hideDialogue(): void { this.root.querySelector('#dialogue')!.classList.add('hidden'); }

  toast(message: string, tone: 'gold' | 'danger' = 'gold'): void {
    const toast = this.root.querySelector<HTMLElement>('#toast')!;
    toast.textContent = message;
    toast.dataset.tone = tone;
    toast.classList.remove('hidden');
    window.clearTimeout(this.toastTimer);
    this.toastTimer = window.setTimeout(() => toast.classList.add('hidden'), 1800);
  }

  setVisible(visible: boolean): void { this.root.classList.toggle('is-hidden', !visible); }

  setMobilePackOpen(open: boolean): void {
    this.root.classList.toggle('mobile-pack-open', open);
    this.root.querySelector('#pack-toggle')?.setAttribute('aria-expanded', String(open));
  }

  setSkillHandler(handler?: (memberId: string, skillId: string) => void): void { this.skillHandler = handler; }

  setItemHandler(handler?: (itemId: string) => void): void { this.itemHandler = handler; }

  setEconomyHandler(handler?: (action: 'buy' | 'sell' | 'craft', targetId: string) => void, closeHandler?: () => void): void {
    this.economyHandler = handler;
    this.economyCloseHandler = closeHandler;
  }

  setWarpHandler(handler?: (warpId: string) => void, closeHandler?: () => void): void {
    this.warpHandler = handler;
    this.warpCloseHandler = closeHandler;
  }

  setJobHandler(handler?: (memberId: string, jobId: string) => void, closeHandler?: () => void): void {
    this.jobHandler = handler;
    this.jobCloseHandler = closeHandler;
  }

  setMasteryHandler(handler?: (memberId: string, masteryId: string) => void): void {
    this.masteryHandler = handler;
  }

  setEvolutionHandler(handler?: (memberId: string, evolutionId: string) => void): void {
    this.evolutionHandler = handler;
  }

  setWorldMapHandler(handler?: (open: boolean) => void): void { this.worldMapHandler = handler; }

  setWorldMapOpen(open: boolean): void {
    if (open && this.loadoutOpen) this.setLoadoutOpen(false);
    if (open && this.journalOpen) this.setJournalOpen(false);
    this.worldMapOpen = open;
    this.root.querySelector('#world-map-panel')?.classList.toggle('hidden', !open);
    this.root.querySelector('#world-map-scrim')?.classList.toggle('hidden', !open);
    this.root.classList.toggle('world-map-open', open);
    this.root.querySelector('#world-map-toggle')?.setAttribute('aria-expanded', String(open));
    if (open) this.worldMapSignature = '';
    this.worldMapHandler?.(open);
  }

  setLoadoutHandler(handler?: (action: LoadoutAction, memberId: string, targetId: string) => void, openHandler?: (open: boolean) => void): void {
    this.loadoutHandler = handler;
    this.loadoutOpenHandler = openHandler;
  }

  setLoadoutOpen(open: boolean, memberId?: string): void {
    if (memberId) this.selectedLoadoutMemberId = memberId;
    if (open && this.worldMapOpen) this.setWorldMapOpen(false);
    if (open && this.journalOpen) this.setJournalOpen(false);
    this.loadoutOpen = open;
    this.root.querySelector('#loadout-panel')?.classList.toggle('hidden', !open);
    this.root.querySelector('#loadout-scrim')?.classList.toggle('hidden', !open);
    this.root.classList.toggle('loadout-open', open);
    this.root.querySelector('#loadout-toggle')?.setAttribute('aria-expanded', String(open));
    if (open) this.loadoutSignature = '';
    this.loadoutOpenHandler?.(open);
  }

  setJournalHandler(trackHandler?: (questId?: string) => void, openHandler?: (open: boolean) => void): void {
    this.journalTrackHandler = trackHandler;
    this.journalOpenHandler = openHandler;
  }

  setJournalOpen(open: boolean): void {
    if (open && this.worldMapOpen) this.setWorldMapOpen(false);
    if (open && this.loadoutOpen) this.setLoadoutOpen(false);
    this.journalOpen = open;
    this.root.querySelector('#journal-panel')?.classList.toggle('hidden', !open);
    this.root.querySelector('#journal-scrim')?.classList.toggle('hidden', !open);
    this.root.classList.toggle('journal-open', open);
    this.root.querySelector('#journal-toggle')?.setAttribute('aria-expanded', String(open));
    if (open) this.journalSignature = '';
    this.journalOpenHandler?.(open);
  }

  setSaveHandler(handler?: { saveNow: () => void; exitToTitle: () => void }): void { this.saveHandler = handler; }

  setCampaignHandler(handler?: { continueJourney: () => void; exitToTitle: () => void }): void {
    this.campaignHandler = handler;
  }

  setCampaignOpen(open: boolean): void {
    if (open && this.journalOpen) this.setJournalOpen(false);
    this.root.querySelector('#campaign-panel')?.classList.toggle('hidden', !open);
    this.root.querySelector('#campaign-scrim')?.classList.toggle('hidden', !open);
    this.root.classList.toggle('campaign-open', open);
  }

  showCampaignComplete(summary: { level: number; exploredMaps: number; totalMaps: number; completedQuests: number }): void {
    this.text('#campaign-level', String(summary.level));
    this.text('#campaign-maps', `${summary.exploredMaps}/${summary.totalMaps}`);
    this.text('#campaign-quests', String(summary.completedQuests));
    this.setCampaignOpen(true);
  }

  setSaveStatus(status: string): void { this.text('#save-status', status); }

  private renderSkills(party: PlayerState[], skills: SkillDefinition[]): void {
    const signature = party.map((member) => `${member.id}:${member.skillIds.join(',')}`).join('|');
    if (signature === this.renderedSkills) return;
    this.renderedSkills = signature;
    const catalog = new Map(skills.map((skill) => [skill.id, skill]));
    const bar = this.root.querySelector<HTMLElement>('#skillbar')!;
    bar.replaceChildren(...party.map((member) => {
      const group = document.createElement('section');
      group.className = 'skill-group glass';
      group.dataset.memberId = member.id;
      const heading = document.createElement('strong');
      heading.textContent = member.name;
      group.append(heading);
      member.skillIds.forEach((skillId, index) => {
        const skill = catalog.get(skillId);
        if (!skill) return;
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'skill-slot';
        button.dataset.memberId = member.id;
        button.dataset.skillId = skill.id;
        const passive = this.isPassiveSkill(skill);
        button.classList.toggle('is-passive', passive);
        button.title = passive ? `${skill.description} (Party passive)` : `${skill.description} (${skill.mpCost} MP · ${skill.cooldown}s cooldown)`;
        const key = document.createElement('kbd'); key.textContent = passive ? '∞' : SKILL_KEYS[member.id]?.[index] ?? '';
        const label = document.createElement('span'); label.textContent = skill.displayName;
        const status = document.createElement('small'); status.textContent = passive ? 'PASSIVE' : `${skill.mpCost} MP`;
        button.append(key, label, status);
        group.append(button);
      });
      return group;
    }));
  }

  private updateSkills(party: PlayerState[], skills: SkillDefinition[]): void {
    const catalog = new Map(skills.map((skill) => [skill.id, skill]));
    for (const member of party) {
      for (const skillId of member.skillIds) {
        const skill = catalog.get(skillId);
        const button = this.root.querySelector<HTMLButtonElement>(`.skill-slot[data-member-id="${member.id}"][data-skill-id="${skillId}"]`);
        if (!skill || !button) continue;
        const passive = this.isPassiveSkill(skill);
        const cooldown = member.skillCooldowns[skillId] ?? 0;
        button.disabled = passive || member.hp <= 0 || cooldown > 0 || member.mp < skill.mpCost;
        button.classList.toggle('is-passive', passive);
        button.classList.toggle('on-cooldown', cooldown > 0);
        button.classList.toggle('low-mp', cooldown <= 0 && member.mp < skill.mpCost);
        const status = button.querySelector('small');
        if (status) status.textContent = passive ? 'PASSIVE' : cooldown > 0 ? `${cooldown.toFixed(1)}s` : `${skill.mpCost} MP`;
      }
    }
  }

  private renderQuests(quests: QuestDefinition[], states: QuestState[], trackedQuestId?: string): void {
    const signature = `${trackedQuestId ?? ''}|${states.map((state) => `${state.questId}:${state.status}:${state.progress}/${state.target}:${JSON.stringify(state.objectiveProgress)}`).join('|')}`;
    if (signature === this.questSignature) return;
    this.questSignature = signature;
    const questCatalog = new Map(quests.map((quest) => [quest.id, quest]));
    const list = this.root.querySelector<HTMLElement>('#quest-list')!;
    list.replaceChildren();
    const visible = states.filter((state) => state.status !== 'completed')
      .sort((a, b) => Number(b.questId === trackedQuestId) - Number(a.questId === trackedQuestId)
        || Number(b.status === 'ready') - Number(a.status === 'ready'))
      .slice(0, 2);
    if (visible.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'quest-row';
      empty.innerHTML = '<strong>Find a quest giver</strong><span>Talk to marked townsfolk to begin the starter path.</span>';
      list.append(empty);
      return;
    }
    for (const state of visible) {
      const quest = questCatalog.get(state.questId);
      const row = document.createElement('div');
      row.className = `quest-row quest-row--${state.status}`;
      const name = document.createElement('strong');
      name.textContent = `${state.questId === trackedQuestId ? '◆ ' : ''}${quest?.displayName ?? state.questId}`;
      const detail = document.createElement('span');
      const nextObjective = quest?.objectives?.find((objective) => (state.objectiveProgress?.[objective.id] ?? 0) < objective.count);
      detail.textContent = state.status === 'ready'
        ? 'Ready to turn in'
        : nextObjective
          ? `${nextObjective.label} ${state.objectiveProgress?.[nextObjective.id] ?? 0}/${nextObjective.count}`
          : `${state.progress}/${state.target} complete`;
      const bar = document.createElement('i');
      bar.style.width = `${Math.max(0, Math.min(1, state.progress / Math.max(1, state.target))) * 100}%`;
      row.append(name, detail, bar);
      list.append(row);
    }
  }

  private renderJournal(context: HudContext): void {
    if (!this.journalOpen) return;
    const stateSignature = context.questStates.map((state) => `${state.questId}:${state.status}:${state.progress}/${state.target}:${JSON.stringify(state.objectiveProgress)}`).join('|');
    const signature = [context.player.level, context.trackedQuestId ?? '', this.journalMode, this.selectedJournalQuestId, stateSignature].join('::');
    if (signature === this.journalSignature) return;
    this.journalSignature = signature;

    const itemCatalog = new Map(context.items.map((item) => [item.id, item]));
    const allNpcCatalog = new Map(context.npcDefinitions.map((npc) => [npc.id, npc]));
    const model = buildQuestJournal(context.quests, context.questStates, context.player.level);
    const visible = journalEntriesForMode(model, this.journalMode, context.trackedQuestId);

    for (const mode of ['current', 'available', 'completed'] as const) {
      const button = this.root.querySelector<HTMLButtonElement>(`[data-journal-mode="${mode}"]`);
      if (button) {
        button.textContent = `${mode === 'current' ? 'Current' : mode === 'available' ? 'Available' : 'Completed'} ${model.counts[mode]}`;
        button.classList.toggle('is-selected', this.journalMode === mode);
        button.setAttribute('aria-selected', String(this.journalMode === mode));
      }
    }
    this.text('#journal-progress', `${model.completedCount}/${context.quests.length} fulfilled`);

    if (!visible.some((record) => record.quest.id === this.selectedJournalQuestId)) {
      this.selectedJournalQuestId = visible.find((record) => record.quest.id === context.trackedQuestId)?.quest.id ?? visible[0]?.quest.id ?? '';
    }
    const list = this.root.querySelector<HTMLElement>('#journal-list')!;
    list.replaceChildren();
    if (visible.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'journal-empty';
      empty.textContent = this.journalMode === 'current' ? 'No quests are currently underway.' : 'No quests in this section yet.';
      list.append(empty);
    }
    for (const record of visible) {
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.journalQuestId = record.quest.id;
      button.className = `journal-row journal-row--${record.status}${record.quest.id === this.selectedJournalQuestId ? ' is-selected' : ''}`;
      const heading = document.createElement('span');
      const name = document.createElement('strong');
      name.textContent = `${record.quest.id === context.trackedQuestId ? '◆ ' : ''}${record.quest.displayName}`;
      const level = document.createElement('small');
      level.textContent = `Lv ${record.quest.requiredLevel ?? 1}`;
      heading.append(name, level);
      const summary = document.createElement('em');
      summary.textContent = record.status === 'ready' ? 'Ready to return'
          : record.status === 'active' && record.state ? `${record.state.progress}/${record.state.target} progress`
          : record.status === 'completed' ? 'Fulfilled' : record.status === 'available' ? 'Ready to accept' : 'Locked';
      button.append(heading, summary);
      list.append(button);
    }

    const selected = visible.find((record) => record.quest.id === this.selectedJournalQuestId);
    const trackButton = this.root.querySelector<HTMLButtonElement>('#journal-track')!;
    if (!selected) {
      this.text('#journal-detail-status', 'QUEST JOURNAL');
      this.text('#journal-detail-name', 'Nothing here yet');
      this.text('#journal-detail-meta', '');
      this.text('#journal-detail-copy', 'Continue exploring the vale and speaking with its people.');
      this.root.querySelector('#journal-detail-objectives')?.replaceChildren();
      this.root.querySelector('#journal-detail-rewards')?.replaceChildren();
      trackButton.disabled = true;
      trackButton.dataset.questId = '';
      return;
    }

    const { quest, state, status } = selected;
    const giver = quest.giverNpcId ? allNpcCatalog.get(quest.giverNpcId)?.displayName ?? this.humanizeId(quest.giverNpcId) : 'Story progression';
    const completion = quest.completionNpcId ? allNpcCatalog.get(quest.completionNpcId)?.displayName ?? this.humanizeId(quest.completionNpcId) : giver;
    this.text('#journal-detail-status', ({ active: 'IN PROGRESS', ready: 'READY TO RETURN', completed: 'FULFILLED', available: 'AVAILABLE', locked: 'LOCKED' } as const)[status]);
    this.text('#journal-detail-name', quest.displayName);
    this.text('#journal-detail-meta', `Lv ${quest.requiredLevel ?? 1} · From ${giver} · Return to ${completion}`);
    this.text('#journal-detail-copy', quest.description ?? 'Follow the lantern path and see this promise through.');

    const objectiveList = this.root.querySelector<HTMLElement>('#journal-detail-objectives')!;
    objectiveList.replaceChildren();
    if (status === 'locked') {
      const requirement = document.createElement('p');
      requirement.textContent = selected.lockReason ?? 'Continue the lantern path to unlock this quest.';
      requirement.className = 'journal-requirement';
      objectiveList.append(requirement);
    } else {
      for (const objective of quest.objectives ?? []) {
        const progress = status === 'completed' ? objective.count : state?.objectiveProgress?.[objective.id] ?? 0;
        const row = document.createElement('div');
        row.className = `journal-objective${progress >= objective.count ? ' is-complete' : ''}`;
        const marker = document.createElement('i'); marker.textContent = progress >= objective.count ? '✓' : '○';
        const label = document.createElement('span'); label.textContent = objective.label;
        const count = document.createElement('strong'); count.textContent = `${Math.min(progress, objective.count)}/${objective.count}`;
        row.append(marker, label, count);
        objectiveList.append(row);
      }
    }

    const rewards = this.root.querySelector<HTMLElement>('#journal-detail-rewards')!;
    rewards.replaceChildren();
    const rewardHeading = document.createElement('small'); rewardHeading.textContent = 'REWARDS';
    const rewardCopy = document.createElement('span');
    const rewardItems = (quest.rewards?.items ?? []).map((stack) => `${stack.count}× ${itemCatalog.get(stack.itemId)?.displayName ?? this.humanizeId(stack.itemId)}`);
    rewardCopy.textContent = [`${quest.rewards?.xp ?? 0} XP`, `${quest.rewards?.gold ?? 0}g`, ...rewardItems].join(' · ');
    rewards.append(rewardHeading, rewardCopy);

    const trackable = status === 'active' || status === 'ready';
    const tracked = quest.id === context.trackedQuestId;
    trackButton.disabled = !trackable;
    trackButton.dataset.questId = quest.id;
    trackButton.dataset.tracked = String(tracked);
    trackButton.textContent = tracked ? 'Untrack quest' : trackable ? 'Track quest' : status === 'completed' ? 'Quest fulfilled' : 'Accept from quest giver';
  }

  private renderInventory(items: ItemDefinition[], inventory: InventoryStack[], gold: number, equipment: EquipmentState): void {
    const signature = `${gold}|${this.equipmentSignature(equipment)}|${inventory.map((stack) => `${stack.itemId}:${stack.count}`).join('|')}`;
    if (signature === this.inventorySignature) return;
    this.inventorySignature = signature;
    this.text('#gold-count', `${gold}g`);
    const itemCatalog = new Map(items.map((item) => [item.id, item]));
    const list = this.root.querySelector<HTMLElement>('#inventory-list')!;
    list.replaceChildren();
    const visible = inventory.filter((stack) => stack.count > 0).slice(0, 7);
    if (visible.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'inventory-empty';
      empty.textContent = 'Your pack is empty';
      list.append(empty);
      return;
    }
    for (const stack of visible) {
      const item = itemCatalog.get(stack.itemId);
      const row = document.createElement('div');
      row.className = `inventory-row inventory-row--${item?.rarity ?? 'common'}`;
      row.title = item?.description ?? stack.itemId;
      const name = document.createElement('span');
      const equippedCount = item ? this.equippedCount(equipment, item.id) : 0;
      name.textContent = `${item?.displayName ?? stack.itemId}${equippedCount > 0 ? ` · ${equippedCount} worn` : ''}`;
      const count = document.createElement('strong');
      count.textContent = `x${stack.count}`;
      const action = document.createElement('button');
      action.type = 'button';
      action.className = 'inventory-action';
      action.dataset.itemId = stack.itemId;
      action.dataset.itemKind = item?.kind;
      action.disabled = item?.kind !== 'consumable' && item?.kind !== 'equipment' && item?.kind !== 'rune';
      action.textContent = item?.kind === 'equipment' ? 'Gear' : item?.kind === 'rune' ? 'Rune' : item?.kind === 'consumable' ? 'Use' : '-';
      row.append(name, count, action);
      list.append(row);
    }
  }

  private statusLabel(stat: string): string {
    return ({ poison: 'POISON', gloom: 'GLOOM', drenched: 'DRENCHED', sunblind: 'SUNBLIND', fractured: 'FRACTURED', muted: 'MUTED', severed: 'SEVERED', def: 'WARD', spd: 'GALE', flee: 'EVADE', matk_resist: 'RESIST', atk: 'POWER' } as Record<string, string>)[stat] ?? stat.toUpperCase();
  }

  private humanizeId(id: string): string {
    return id.split('_').filter(Boolean).map((part) => `${part[0]?.toUpperCase() ?? ''}${part.slice(1)}`).join(' ');
  }

  private renderWarp(context: HudContext): void {
    const panel = this.root.querySelector<HTMLElement>('#warp-panel')!;
    const scrim = this.root.querySelector<HTMLElement>('#warp-scrim')!;
    const region = context.regions.find((candidate) => candidate.id === context.map.regionId);
    const active = Boolean(context.activeWarpNpcId && region);
    panel.classList.toggle('hidden', !active);
    scrim.classList.toggle('hidden', !active);
    this.root.classList.toggle('warp-open', active);
    if (!active || !region) {
      this.warpSignature = '';
      return;
    }

    const completed = new Set(context.questStates.filter((quest) => quest.status === 'completed').map((quest) => quest.questId));
    const questCatalog = new Map(context.quests.map((quest) => [quest.id, quest]));
    const signature = [
      context.map.id, context.player.level, context.gold,
      [...completed].sort().join(','), region.warpTable.map((warp) => warp.id).join(','),
    ].join('::');
    if (signature === this.warpSignature) return;
    this.warpSignature = signature;
    this.text('#warp-gold', `${context.gold}g`);
    const list = this.root.querySelector<HTMLElement>('#warp-list')!;
    list.replaceChildren();
    for (const warp of region.warpTable) {
      const current = warp.targetMapId === context.map.id;
      const levelLocked = context.player.level < (warp.requiredLevel ?? 1);
      const questLocked = Boolean(warp.unlockQuestId && !completed.has(warp.unlockQuestId));
      const goldLocked = context.gold < warp.cost;
      const questName = warp.unlockQuestId ? questCatalog.get(warp.unlockQuestId)?.displayName : undefined;
      const detail = current ? 'Current location'
        : levelLocked ? `Requires level ${warp.requiredLevel}`
          : questLocked ? `Complete ${questName ?? 'the required quest'}`
            : goldLocked ? 'Not enough gold'
              : warp.requiredLevel ? `Level ${warp.requiredLevel}+ wayline` : 'Open wayline';
      const row = document.createElement('div');
      row.className = `warp-row${current || levelLocked || questLocked || goldLocked ? ' is-locked' : ''}`;
      const copy = document.createElement('div');
      const name = document.createElement('strong');
      name.textContent = warp.label;
      const status = document.createElement('small');
      status.textContent = detail;
      copy.append(name, status);
      const fare = document.createElement('span');
      fare.textContent = warp.cost === 0 ? 'FREE' : `${warp.cost}g`;
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.warpId = warp.id;
      button.disabled = current || levelLocked || questLocked || goldLocked;
      button.textContent = current ? 'Here' : questLocked ? 'Locked' : 'Travel';
      row.append(copy, fare, button);
      list.append(row);
    }
  }

  private renderEconomy(context: HudContext): void {
    const panel = this.root.querySelector<HTMLElement>('#economy-panel')!;
    const scrim = this.root.querySelector<HTMLElement>('#economy-scrim')!;
    const shop = context.shops.find((candidate) => candidate.npcId === context.activeMerchantNpcId);
    const active = Boolean(shop);
    panel.classList.toggle('hidden', !active);
    scrim.classList.toggle('hidden', !active);
    this.root.classList.toggle('economy-open', active);
    if (!shop) {
      this.economySignature = '';
      return;
    }

    const signature = [
      shop.id, this.economyMode, context.gold, context.player.level,
      context.buyPriceMultiplier,
      context.inventory.map((stack) => `${stack.itemId}:${stack.count}`).join('|'),
      this.equipmentSignature(context.equipment),
      this.equipmentSignature(context.sockets),
    ].join('::');
    if (signature === this.economySignature) return;
    this.economySignature = signature;
    this.text('#economy-name', shop.displayName);
    this.text('#economy-gold', `${context.gold}g`);
    for (const tab of this.root.querySelectorAll<HTMLButtonElement>('[data-economy-mode]')) {
      const selected = tab.dataset.economyMode === this.economyMode;
      tab.classList.toggle('is-selected', selected);
      tab.setAttribute('aria-selected', String(selected));
    }

    const itemCatalog = new Map(context.items.map((item) => [item.id, item]));
    const inventoryCount = (itemId: string) => context.inventory
      .filter((stack) => stack.itemId === itemId)
      .reduce((sum, stack) => sum + stack.count, 0);
    const list = this.root.querySelector<HTMLElement>('#economy-list')!;
    list.replaceChildren();

    if (this.economyMode === 'buy') {
      for (const itemId of shop.itemIds) {
        const item = itemCatalog.get(itemId);
        if (!item || item.buyPrice === undefined) continue;
        const price = Math.max(1, Math.ceil(item.buyPrice * context.buyPriceMultiplier));
        const discount = Math.max(0, Math.round((1 - context.buyPriceMultiplier) * 100));
        list.append(this.economyRow({
          name: item.displayName,
          detail: `${item.kind.toUpperCase()} · Lv ${item.levelReq ?? 1}${discount > 0 ? ` · Wayfarer -${discount}%` : ''}`,
          meta: `${price}g`,
          action: 'buy', targetId: item.id, actionLabel: 'Buy', disabled: context.gold < price,
          title: item.description,
        }));
      }
    } else if (this.economyMode === 'sell') {
      const sellable = [...new Map(context.inventory.filter((stack) => {
        const item = itemCatalog.get(stack.itemId);
        return stack.count > 0 && item && item.kind !== 'quest' && item.tradable !== false;
      }).map((stack) => [stack.itemId, stack])).values()];
      for (const stack of sellable) {
        const item = itemCatalog.get(stack.itemId)!;
        const assigned = this.equippedCount(context.equipment, item.id);
        const equipped = inventoryCount(item.id) <= assigned;
        list.append(this.economyRow({
          name: item.displayName,
          detail: `${item.kind.toUpperCase()} · Owned ${inventoryCount(item.id)}${assigned > 0 ? ` · Worn ${assigned}` : ''}`,
          meta: `+${item.sellPrice}g`,
          action: 'sell', targetId: item.id, actionLabel: equipped ? 'Equipped' : 'Sell', disabled: equipped,
          title: item.description,
        }));
      }
    } else {
      const recipes = context.recipes.filter((recipe) => recipe.stationNpcIds.includes(shop.npcId));
      for (const recipe of recipes) {
        const result = itemCatalog.get(recipe.result.itemId);
        const ingredients = recipe.ingredients.map((ingredient) => {
          const item = itemCatalog.get(ingredient.itemId);
          return `${item?.displayName ?? ingredient.itemId} ${inventoryCount(ingredient.itemId)}/${ingredient.count}`;
        });
        const hasIngredients = recipe.ingredients.every((ingredient) => inventoryCount(ingredient.itemId) >= ingredient.count);
        const levelReady = context.player.level >= (recipe.requiredLevel ?? 1);
        list.append(this.economyRow({
          name: recipe.displayName,
          detail: ingredients.join(' · '),
          meta: `${recipe.goldCost}g · Lv ${recipe.requiredLevel ?? 1}`,
          action: 'craft', targetId: recipe.id, actionLabel: 'Craft',
          disabled: !hasIngredients || !levelReady || context.gold < recipe.goldCost,
          title: result?.description,
        }));
      }
    }

    if (list.childElementCount === 0) {
      const empty = document.createElement('p');
      empty.className = 'economy-empty';
      empty.textContent = this.economyMode === 'sell' ? 'Nothing in your pack can be sold.' : 'No offerings are available here.';
      list.append(empty);
    }
  }

  private renderAdvancement(context: HudContext): void {
    const panel = this.root.querySelector<HTMLElement>('#advancement-panel')!;
    const scrim = this.root.querySelector<HTMLElement>('#advancement-scrim')!;
    const active = Boolean(context.activeTrainerNpcId);
    panel.classList.toggle('hidden', !active);
    scrim.classList.toggle('hidden', !active);
    this.root.classList.toggle('advancement-open', active);
    if (!active) {
      this.advancementSignature = '';
      this.pendingJobId = '';
      this.pendingMasteryId = '';
      this.pendingEvolutionId = '';
      return;
    }

    const selected = context.party.find((member) => member.id === this.selectedAdvancementMemberId) ?? context.party[0];
    if (!selected) return;
    this.selectedAdvancementMemberId = selected.id;
    const signature = [
      context.activeTrainerNpcId, selected.id, this.pendingJobId, this.pendingMasteryId, this.pendingEvolutionId, context.gold,
      context.party.map((member) => `${member.id}:${member.level}:${member.jobId}:${member.masteryId ?? ''}:${member.evolutionId ?? ''}:${member.skillIds.join(',')}`).join('|'),
      context.buyPriceMultiplier, context.dropRateBonus, context.stackSizeBonus,
    ].join('::');
    if (signature === this.advancementSignature) return;
    this.advancementSignature = signature;

    const jobCatalog = new Map(context.jobs.map((job) => [job.id, job]));
    const skillCatalog = new Map(context.skills.map((skill) => [skill.id, skill]));
    const currentJob = jobCatalog.get(selected.jobId);
    const currentMastery = currentJob?.masteries?.find((mastery) => mastery.id === selected.masteryId);
    const currentEvolution = currentJob?.evolutions?.find((evolution) => evolution.id === selected.evolutionId);
    const masteries = currentJob?.masteries ?? [];
    const evolutions = currentJob?.evolutions ?? [];
    const evolutionMode = context.activeTrainerNpcId === 'pathweaver_ione';
    const completedQuests = new Set(context.questStates.filter((quest) => quest.status === 'completed').map((quest) => quest.questId));
    const paths = context.jobs.filter((job) => (job.tier ?? 0) > 0 && job.baseClassId === 'novice')
      .sort((a, b) => (a.requiredLevel ?? 1) - (b.requiredLevel ?? 1) || a.displayName.localeCompare(b.displayName));
    this.root.querySelector('.advancement-paths')?.classList.toggle('is-evolution-mode', evolutionMode);
    this.text('#advancement-kicker', evolutionMode ? 'PATHWEAVER IONE · CONVERGENCE RITE' : 'TRAINER BRAM · PATH RITE');
    this.text('#advancement-title', evolutionMode ? 'Callings Beyond Names' : 'Paths of the Vale');
    this.text('#advancement-path-heading', evolutionMode ? 'Choose a Calling' : 'Choose a Path');
    this.text('#advancement-gold', `${context.gold}g`);
    this.text('#advancement-path-summary', evolutionMode
      ? `${evolutions.length} callings · first answer is free`
      : `${paths.length} paths · first choice is free`);
    const masteryLevel = Math.min(...masteries.map((mastery) => mastery.requiredLevel), Number.POSITIVE_INFINITY);
    this.text('#advancement-mastery-summary', masteries.length === 0
      ? 'Choose a path first'
      : selected.level < masteryLevel
        ? `Unlocks at Lv ${masteryLevel}`
        : currentMastery
          ? `Retrain ${MASTERY_RETRAIN_COST}g`
          : 'First choice is free');

    const tabs = this.root.querySelector<HTMLElement>('#advancement-party-tabs')!;
    tabs.replaceChildren(...context.party.map((member) => {
      const button = document.createElement('button');
      button.type = 'button'; button.role = 'tab'; button.dataset.advancementMemberId = member.id;
      button.className = member.id === selected.id ? 'is-selected' : '';
      button.setAttribute('aria-selected', String(member.id === selected.id));
      const mark = document.createElement('i'); mark.style.background = `#${member.color.toString(16).padStart(6, '0')}`;
      const identity = document.createElement('span');
      const name = document.createElement('strong'); name.textContent = member.name;
      const role = document.createElement('small'); role.textContent = member.className;
      identity.append(name, role); button.append(mark, identity);
      return button;
    }));

    const memberMark = this.root.querySelector<HTMLElement>('#advancement-member-mark')!;
    memberMark.textContent = selected.name.slice(0, 1);
    memberMark.style.setProperty('--member-color', `#${selected.color.toString(16).padStart(6, '0')}`);
    this.text('#advancement-member-name', `${selected.name} · Lv ${selected.level}`);
    this.text('#advancement-member-job', currentJob?.displayName ?? selected.className);
    const readyLevel = Math.min(...paths.map((job) => job.requiredLevel ?? 1));
    const currentTier = currentJob?.tier ?? 0;
    if (evolutionMode) {
      const evolutionLevel = Math.min(...evolutions.map((evolution) => evolution.requiredLevel), Number.POSITIVE_INFINITY);
      const unlockQuest = evolutions[0]?.unlockQuestId;
      this.text('#advancement-member-status', currentTier === 0
        ? 'Choose an advanced path with Trainer Bram before answering a later calling.'
        : selected.level < evolutionLevel
          ? `${evolutionLevel - selected.level} levels until the Convergence Rite at Lv ${evolutionLevel}.`
          : unlockQuest && !completedQuests.has(unlockQuest)
            ? 'Restore the Convergence Spire before a calling can answer you.'
            : currentEvolution
              ? `${currentEvolution.displayName} answered. A different calling costs ${EVOLUTION_RETRAIN_COST}g.`
              : 'Ready to answer a later calling. The first answer costs no gold.');
    } else {
      this.text('#advancement-member-status', selected.level < readyLevel
        ? `${readyLevel - selected.level} levels until the path rite at Lv ${readyLevel}.`
        : currentTier > 0
          ? currentMastery
            ? `${currentMastery.displayName} mastered. A new mastery costs ${MASTERY_RETRAIN_COST}g; a new path costs ${JOB_RETRAIN_COST}g.`
            : selected.level < masteryLevel
              ? `${masteryLevel - selected.level} levels until Lantern Mastery. Path retraining costs ${JOB_RETRAIN_COST}g.`
              : 'Ready to choose a Lantern Mastery. The first mastery costs no gold.'
          : 'Ready to choose an advanced path. The first rite costs no gold.');
    }

    const gifts = this.root.querySelector<HTMLElement>('#advancement-party-gifts')!;
    const passiveRows = [
      { label: 'Shop prices', value: context.buyPriceMultiplier < 1 ? `${Math.round((1 - context.buyPriceMultiplier) * 100)}% lower` : 'Standard' },
      { label: 'Drop chance', value: context.dropRateBonus > 0 ? `+${context.dropRateBonus}%` : 'Standard' },
      { label: 'Material stacks', value: context.stackSizeBonus > 0 ? `+${context.stackSizeBonus}` : 'Standard' },
    ];
    gifts.replaceChildren(...passiveRows.flatMap((gift) => {
      const term = document.createElement('dt'); term.textContent = gift.label;
      const value = document.createElement('dd'); value.textContent = gift.value;
      return [term, value];
    }));

    const list = this.root.querySelector<HTMLElement>('#advancement-path-list')!;
    if (evolutionMode) {
      if (evolutions.length === 0) {
        const empty = document.createElement('p');
        empty.className = 'advancement-mastery-empty';
        empty.textContent = 'Choose an advanced path with Trainer Bram before answering a calling.';
        list.replaceChildren(empty);
      } else {
        list.replaceChildren(...evolutions.map((evolution) => {
          const current = selected.evolutionId === evolution.id;
          const levelReady = selected.level >= evolution.requiredLevel;
          const questReady = completedQuests.has(evolution.unlockQuestId);
          const goldCost = selected.evolutionId && !current ? EVOLUTION_RETRAIN_COST : 0;
          const pending = this.pendingEvolutionId === evolution.id;
          const row = document.createElement('article');
          row.className = `advancement-path advancement-path--${currentJob?.role ?? 'novice'}${current ? ' is-current' : ''}${pending ? ' is-pending' : ''}`;
          const identity = document.createElement('div');
          const heading = document.createElement('header');
          const name = document.createElement('strong'); name.textContent = evolution.displayName;
          const level = document.createElement('span'); level.textContent = `CALLING · LV ${evolution.requiredLevel}`;
          heading.append(name, level);
          const description = document.createElement('p'); description.textContent = evolution.description;
          const requirement = document.createElement('small');
          const questName = context.quests.find((quest) => quest.id === evolution.unlockQuestId)?.displayName ?? 'its rite';
          requirement.textContent = questReady ? `RITE COMPLETE · ${questName}` : `REQUIRES · ${questName}`;
          identity.append(heading, description, requirement);
          const gifts = document.createElement('div'); gifts.className = 'advancement-path-skills';
          const skill = skillCatalog.get(evolution.skillId);
          const skillBadge = document.createElement('span');
          skillBadge.textContent = skill?.displayName ?? evolution.skillId;
          skillBadge.title = skill?.description ?? evolution.skillId;
          gifts.append(skillBadge);
          for (const [key, value] of Object.entries(evolution.bonuses) as Array<[keyof JobMasteryBonuses, number]>) {
            const badge = document.createElement('span');
            const suffix = key === 'spd' || key === 'crit' || key === 'powerPercent' || key === 'healingPercent'
              || key === 'evasion' || key === 'buyPrice' || key === 'dropRate' ? '%' : '';
            badge.textContent = `${MASTERY_BONUS_LABELS[key]} ${value > 0 ? '+' : ''}${value}${suffix}`;
            gifts.append(badge);
          }
          const action = document.createElement('button'); action.type = 'button'; action.dataset.evolutionId = evolution.id;
          action.disabled = current || !levelReady || !questReady || context.gold < goldCost;
          action.textContent = current ? 'Answered' : !levelReady ? `Lv ${evolution.requiredLevel}` : !questReady ? 'Rite locked'
            : context.gold < goldCost ? `Need ${goldCost}g` : pending ? 'Confirm' : goldCost > 0 ? `${goldCost}g` : 'Answer';
          row.append(identity, gifts, action);
          return row;
        }));
      }
    } else {
      list.replaceChildren(...paths.map((job) => {
      const current = selected.jobId === job.id;
      const levelReady = selected.level >= (job.requiredLevel ?? 1);
      const goldCost = currentTier > 0 && !current ? JOB_RETRAIN_COST : 0;
      const pending = this.pendingJobId === job.id;
      const row = document.createElement('article');
      row.className = `advancement-path advancement-path--${job.role}${current ? ' is-current' : ''}${pending ? ' is-pending' : ''}`;
      const identity = document.createElement('div');
      const heading = document.createElement('header');
      const name = document.createElement('strong'); name.textContent = job.displayName;
      const role = document.createElement('span'); role.textContent = `${job.role.toUpperCase()} · ${job.primaryStat?.toUpperCase() ?? 'BALANCED'}`;
      heading.append(name, role);
      const description = document.createElement('p'); description.textContent = job.description ?? 'An advanced path through Hearthlight Vale.';
      const growth = document.createElement('small');
      growth.textContent = job.growth
        ? `GROWTH · HP ${job.growth.hp} · MP ${job.growth.mp} · ATK ${job.growth.atk} · DEF ${job.growth.def} · MATK ${job.growth.matk} · SPR ${job.growth.spr}`
        : 'GROWTH · BALANCED';
      identity.append(heading, description, growth);
      const skills = document.createElement('div'); skills.className = 'advancement-path-skills';
      for (const skillId of job.startingSkills) {
        const skill = skillCatalog.get(skillId);
        const badge = document.createElement('span');
        badge.textContent = skill?.displayName ?? skillId;
        badge.className = skill && this.isPassiveSkill(skill) ? 'is-passive' : '';
        badge.title = skill?.description ?? skillId;
        skills.append(badge);
      }
      const action = document.createElement('button'); action.type = 'button'; action.dataset.jobId = job.id;
      action.disabled = current || !levelReady || context.gold < goldCost;
      action.textContent = current ? 'Current' : !levelReady ? `Lv ${job.requiredLevel ?? 1}` : context.gold < goldCost ? `Need ${goldCost}g` : pending ? 'Confirm' : goldCost > 0 ? `${goldCost}g` : 'Choose';
      row.append(identity, skills, action);
      return row;
      }));
    }

    const masteryList = this.root.querySelector<HTMLElement>('#advancement-mastery-list')!;
    const masteryHeading = this.root.querySelector<HTMLElement>('#advancement-mastery-heading')!;
    masteryHeading.classList.toggle('hidden', evolutionMode);
    masteryList.classList.toggle('hidden', evolutionMode);
    if (evolutionMode) {
      masteryList.replaceChildren();
    } else if (masteries.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'advancement-mastery-empty';
      empty.textContent = 'Choose an advanced path to reveal its masteries.';
      masteryList.replaceChildren(empty);
    } else {
      masteryList.replaceChildren(...masteries.map((mastery) => {
        const current = selected.masteryId === mastery.id;
        const levelReady = selected.level >= mastery.requiredLevel;
        const goldCost = selected.masteryId && !current ? MASTERY_RETRAIN_COST : 0;
        const pending = this.pendingMasteryId === mastery.id;
        const row = document.createElement('article');
        row.className = `advancement-mastery${current ? ' is-current' : ''}${pending ? ' is-pending' : ''}`;
        const identity = document.createElement('div');
        const heading = document.createElement('header');
        const name = document.createElement('strong'); name.textContent = mastery.displayName;
        const level = document.createElement('span'); level.textContent = `LV ${mastery.requiredLevel}`;
        heading.append(name, level);
        const description = document.createElement('p'); description.textContent = mastery.description;
        const bonuses = document.createElement('div'); bonuses.className = 'advancement-mastery-bonuses';
        for (const [key, value] of Object.entries(mastery.bonuses) as Array<[keyof JobMasteryBonuses, number]>) {
          const badge = document.createElement('span');
          const suffix = key === 'spd' || key === 'crit' || key === 'powerPercent' || key === 'healingPercent'
            || key === 'evasion' || key === 'buyPrice' || key === 'dropRate' ? '%' : '';
          badge.textContent = `${MASTERY_BONUS_LABELS[key]} ${value > 0 ? '+' : ''}${value}${suffix}`;
          bonuses.append(badge);
        }
        identity.append(heading, description, bonuses);
        const action = document.createElement('button'); action.type = 'button'; action.dataset.masteryId = mastery.id;
        action.disabled = current || !levelReady || context.gold < goldCost;
        action.textContent = current ? 'Mastered' : !levelReady ? `Lv ${mastery.requiredLevel}` : context.gold < goldCost ? `Need ${goldCost}g` : pending ? 'Confirm' : goldCost > 0 ? `${goldCost}g` : 'Master';
        row.append(identity, action);
        return row;
      }));
    }
  }

  private renderLoadout(context: HudContext): void {
    if (!this.loadoutOpen) return;
    const selected = context.party.find((member) => member.id === this.selectedLoadoutMemberId) ?? context.party[0];
    if (!selected) return;
    this.selectedLoadoutMemberId = selected.id;
    const signature = [
      selected.id,
      context.party.map((member) => `${member.id}:${member.level}:${member.hp}/${member.maxHp}`).join('|'),
      context.inventory.map((stack) => `${stack.itemId}:${stack.count}`).join('|'),
      this.equipmentSignature(context.equipment),
      this.equipmentSignature(context.sockets),
      selected.evolutionId ?? '', selected.skillIds.join('|'),
      context.questStates.map((quest) => `${quest.questId}:${quest.status}`).join('|'),
    ].join('::');
    if (signature === this.loadoutSignature) return;
    this.loadoutSignature = signature;

    const itemCatalog = new Map(context.items.map((item) => [item.id, item]));
    const inventoryCount = (itemId: string) => context.inventory
      .filter((stack) => stack.itemId === itemId)
      .reduce((sum, stack) => sum + stack.count, 0);
    const gear = context.items.filter((item) => item.kind === 'equipment' && inventoryCount(item.id) > 0)
      .sort((a, b) => EQUIPMENT_SLOTS.indexOf(a.slot ?? 'accessory') - EQUIPMENT_SLOTS.indexOf(b.slot ?? 'accessory')
        || (a.levelReq ?? 1) - (b.levelReq ?? 1)
        || a.displayName.localeCompare(b.displayName));
    const runes = context.items.filter((item) => item.kind === 'rune' && inventoryCount(item.id) > 0)
      .sort((a, b) => (a.levelReq ?? 1) - (b.levelReq ?? 1) || a.displayName.localeCompare(b.displayName));
    const gearCount = gear.reduce((sum, item) => sum + inventoryCount(item.id), 0);
    this.text('#loadout-owned-count', `${gearCount} ${gearCount === 1 ? 'piece' : 'pieces'} owned`);

    const tabs = this.root.querySelector<HTMLElement>('#loadout-party-tabs')!;
    tabs.replaceChildren(...context.party.map((member) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.role = 'tab';
      button.dataset.loadoutMemberId = member.id;
      button.className = member.id === selected.id ? 'is-selected' : '';
      button.setAttribute('aria-selected', String(member.id === selected.id));
      const mark = document.createElement('i'); mark.style.background = `#${member.color.toString(16).padStart(6, '0')}`;
      const identity = document.createElement('span');
      const name = document.createElement('strong'); name.textContent = member.name;
      const role = document.createElement('small'); role.textContent = member.className;
      identity.append(name, role);
      button.append(mark, identity);
      return button;
    }));

    const memberMark = this.root.querySelector<HTMLElement>('#loadout-member-mark')!;
    memberMark.textContent = selected.name.slice(0, 1);
    memberMark.style.setProperty('--member-color', `#${selected.color.toString(16).padStart(6, '0')}`);
    this.text('#loadout-member-name', `${selected.name} · Lv ${selected.level}`);
    this.text('#loadout-member-role', selected.className);
    const totals = equipmentStatsForMember(context.equipment, context.items, selected.id, context.sockets);
    const stats = this.root.querySelector<HTMLElement>('#loadout-stats')!;
    const statValues: Array<{ label: string; value: string; detail: string }> = [
      { label: 'MAX HP', value: String(selected.maxHp), detail: totals.hp > 0 ? `+${totals.hp} loadout` : 'Base' },
      { label: 'ATK', value: `+${totals.atk}`, detail: 'Damage' },
      { label: 'DEF', value: `+${totals.def}`, detail: 'Guard' },
      { label: 'HASTE', value: `+${totals.spd * 2}%`, detail: 'Attack speed' },
      { label: 'CRIT', value: `+${totals.crit}%`, detail: '1.5x damage' },
    ];
    stats.replaceChildren(...statValues.map((stat) => {
      const cell = document.createElement('div');
      const label = document.createElement('small'); label.textContent = stat.label;
      const value = document.createElement('strong'); value.textContent = stat.value;
      const detail = document.createElement('span'); detail.textContent = stat.detail;
      cell.append(label, value, detail);
      return cell;
    }));

    const slots = this.root.querySelector<HTMLElement>('#loadout-slots')!;
    slots.replaceChildren(...EQUIPMENT_SLOTS.map((slot) => {
      const row = document.createElement('div'); row.className = 'loadout-slot';
      const label = document.createElement('small'); label.textContent = EQUIPMENT_SLOT_LABELS[slot];
      const identity = document.createElement('div');
      const itemId = context.equipment[selected.id]?.[slot];
      const item = itemId ? itemCatalog.get(itemId) : undefined;
      const name = document.createElement('strong'); name.textContent = item?.displayName ?? 'Empty slot';
      const detail = document.createElement('span'); detail.textContent = item ? this.itemStatsText(item) : 'No gear assigned';
      identity.append(name, detail);
      const runeSelect = document.createElement('select');
      runeSelect.className = 'loadout-rune-select';
      runeSelect.dataset.runeSlot = slot;
      runeSelect.title = `Rune for ${EQUIPMENT_SLOT_LABELS[slot]}`;
      runeSelect.setAttribute('aria-label', `Rune for ${EQUIPMENT_SLOT_LABELS[slot]}`);
      const currentRuneId = context.sockets[selected.id]?.[slot] ?? '';
      const emptyOption = document.createElement('option');
      emptyOption.value = '';
      emptyOption.textContent = item ? 'Empty rune socket' : 'Equip gear to socket';
      runeSelect.append(emptyOption);
      for (const rune of runes.filter((candidate) => candidate.runeSlots?.includes(slot))) {
        const option = document.createElement('option');
        option.value = rune.id;
        option.textContent = `${rune.displayName} · ${this.runeStatsText(rune)}`;
        option.disabled = rune.id !== currentRuneId && inventoryCount(rune.id) <= this.socketedCount(context.sockets, rune.id);
        runeSelect.append(option);
      }
      runeSelect.value = currentRuneId;
      runeSelect.disabled = !item || (runeSelect.options.length <= 1 && !currentRuneId);
      identity.append(runeSelect);
      const action = document.createElement('button'); action.type = 'button'; action.title = `Unequip ${EQUIPMENT_SLOT_LABELS[slot]}`;
      action.dataset.loadoutAction = 'unequip'; action.dataset.targetId = slot; action.textContent = '×'; action.disabled = !item;
      row.append(label, identity, action);
      return row;
    }));

    const job = context.jobs.find((candidate) => candidate.id === selected.jobId);
    const completedQuests = new Set(context.questStates.filter((quest) => quest.status === 'completed').map((quest) => quest.questId));
    const skillPool = context.skills.filter((skill) => job
      && (job.startingSkills.includes(skill.id) || (skill.jobIds ?? []).includes(job.id))
      && (!skill.evolutionIds?.length || Boolean(selected.evolutionId && skill.evolutionIds.includes(selected.evolutionId))))
      .sort((a, b) => Number(selected.skillIds.includes(b.id)) - Number(selected.skillIds.includes(a.id))
        || (a.requiredLevel ?? 1) - (b.requiredLevel ?? 1)
        || a.displayName.localeCompare(b.displayName));
    this.text('#loadout-skill-summary', `${selected.skillIds.length}/${MAX_SKILL_SLOTS} equipped`);
    const skillList = this.root.querySelector<HTMLElement>('#loadout-skill-list')!;
    skillList.replaceChildren(...skillPool.map((skill) => {
      const equipped = selected.skillIds.includes(skill.id);
      const levelReady = selected.level >= (skill.requiredLevel ?? 1);
      const questReady = !skill.unlockQuestId || completedQuests.has(skill.unlockQuestId);
      const slotIndex = selected.skillIds.indexOf(skill.id);
      const row = document.createElement('div');
      row.className = `loadout-skill${equipped ? ' is-equipped' : ''}${!levelReady || !questReady ? ' is-locked' : ''}`;
      const identity = document.createElement('div');
      const name = document.createElement('strong'); name.textContent = skill.displayName;
      const meta = document.createElement('small');
      const cost = skill.mpCost > 0 ? `${skill.mpCost} MP` : 'PASSIVE';
      meta.textContent = equipped ? `${SKILL_KEYS[selected.id]?.[slotIndex] ?? slotIndex + 1} · ${cost} · ${skill.cooldown}s`
        : !levelReady ? `Unlocks at Lv ${skill.requiredLevel}`
          : !questReady ? `Complete ${context.quests.find((quest) => quest.id === skill.unlockQuestId)?.displayName ?? 'its teaching quest'}`
            : `${cost} · ${skill.cooldown}s`;
      const description = document.createElement('p'); description.textContent = skill.description;
      identity.append(name, meta, description);
      const action = document.createElement('button'); action.type = 'button';
      action.dataset.loadoutAction = equipped ? 'unequip-skill' : 'equip-skill';
      action.dataset.targetId = skill.id;
      action.disabled = !levelReady || !questReady
        || (equipped && selected.skillIds.length <= 1)
        || (!equipped && selected.skillIds.length >= MAX_SKILL_SLOTS);
      action.textContent = equipped ? 'Remove' : !levelReady ? `Lv ${skill.requiredLevel}` : !questReady ? 'Locked'
        : selected.skillIds.length >= MAX_SKILL_SLOTS ? '3/3' : 'Equip';
      row.append(identity, action);
      return row;
    }));

    const assignedCount = gear.reduce((sum, item) => sum + this.equippedCount(context.equipment, item.id), 0);
    this.text('#loadout-pack-summary', `${Math.max(0, gearCount - assignedCount)} free · ${assignedCount} assigned`);
    const list = this.root.querySelector<HTMLElement>('#loadout-item-list')!;
    list.replaceChildren();
    for (const item of gear) {
      const row = document.createElement('div');
      row.className = `loadout-item loadout-item--${item.rarity ?? 'common'}`;
      row.title = item.description ?? item.displayName;
      const identity = document.createElement('div');
      const name = document.createElement('strong'); name.textContent = item.displayName;
      const detail = document.createElement('small');
      const assignedNames = context.party
        .filter((member) => Object.values(context.equipment[member.id] ?? {}).includes(item.id))
        .map((member) => member.name);
      detail.textContent = `${(item.slot ?? 'gear').toUpperCase()} · Lv ${item.levelReq ?? 1} · ${this.itemStatsText(item)}${assignedNames.length > 0 ? ` · ${assignedNames.join(', ')}` : ''}`;
      identity.append(name, detail);
      const comparison = this.itemComparison(item, item.slot ? itemCatalog.get(context.equipment[selected.id]?.[item.slot] ?? '') : undefined);
      const owned = inventoryCount(item.id);
      const worn = this.equippedCount(context.equipment, item.id);
      const current = Boolean(item.slot && context.equipment[selected.id]?.[item.slot] === item.id);
      const available = owned - worn;
      const meta = document.createElement('span'); meta.textContent = `${owned} owned · ${Math.max(0, available)} free`;
      const action = document.createElement('button'); action.type = 'button';
      action.dataset.loadoutAction = 'equip'; action.dataset.targetId = item.id;
      action.disabled = current || available <= 0 || selected.level < (item.levelReq ?? 1);
      action.textContent = current ? 'Equipped' : selected.level < (item.levelReq ?? 1) ? `Lv ${item.levelReq}` : available <= 0 ? 'Assigned' : 'Equip';
      row.append(identity, comparison, meta, action);
      list.append(row);
    }
    if (gear.length === 0) {
      const empty = document.createElement('p'); empty.className = 'loadout-empty';
      empty.textContent = 'No equipment is waiting in the pack.';
      list.append(empty);
    }
  }

  private renderWorldMap(context: HudContext): void {
    if (!this.worldMapOpen) return;
    const signature = [
      context.map.id,
      context.player.level,
      this.selectedWorldMapId,
      context.discoveredMapIds.join('|'),
      context.questStates.map((quest) => `${quest.questId}:${quest.status}:${JSON.stringify(quest.objectiveProgress)}`).join('|'),
    ].join('::');
    if (signature === this.worldMapSignature) return;
    this.worldMapSignature = signature;
    const model = buildWorldMapModel({
      maps: context.maps,
      regions: context.regions,
      quests: context.quests,
      drops: context.drops,
    }, context.map.id, context.player.level, context.questStates, context.discoveredMapIds);
    const selected = model.nodes.find((node) => node.id === this.selectedWorldMapId)
      ?? model.nodes.find((node) => node.id === context.map.id)
      ?? model.nodes[0];
    if (selected) this.selectedWorldMapId = selected.id;
    this.text('#world-map-region', model.regionName);
    this.text('#world-map-progress', `${model.discoveredCount}/${model.pinCount} charted`);

    const routes = this.root.querySelector<SVGSVGElement>('#world-map-routes')!;
    routes.replaceChildren(...model.routes.map((route) => {
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', String(route.x1)); line.setAttribute('y1', String(route.y1));
      line.setAttribute('x2', String(route.x2)); line.setAttribute('y2', String(route.y2));
      line.setAttribute('class', `world-map-route world-map-route--${route.status}`);
      return line;
    }));

    const nodes = this.root.querySelector<HTMLElement>('#world-map-nodes')!;
    nodes.replaceChildren(...model.nodes.map((node) => this.worldMapNode(node, node.id === selected?.id)));
    if (!selected) return;
    this.text('#world-map-detail-status', this.worldMapStatusLabel(selected));
    this.text('#world-map-detail-name', selected.displayName);
    this.text('#world-map-detail-meta', `${selected.kind.toUpperCase()} · LV ${selected.levelMin}–${selected.levelMax}`);
    this.text('#world-map-detail-copy', this.worldMapStatusCopy(selected));
    const objectives = this.root.querySelector<HTMLElement>('#world-map-detail-objectives')!;
    objectives.replaceChildren();
    const detailLines = selected.objectiveLabels.length > 0
      ? selected.objectiveLabels
      : selected.lockReasons.length > 0
        ? selected.lockReasons
        : ['No active objective here'];
    for (const line of detailLines) {
      const row = document.createElement('span');
      row.textContent = line;
      row.className = selected.objectiveLabels.length > 0 ? 'is-objective' : '';
      objectives.append(row);
    }
  }

  private worldMapNode(node: WorldMapNode, selected: boolean): HTMLButtonElement {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `world-map-node world-map-node--${node.kind} world-map-node--${node.status}${selected ? ' is-selected' : ''}`;
    button.dataset.worldMapId = node.id;
    button.style.left = `${node.x}%`;
    button.style.top = `${node.y}%`;
    button.title = `${node.displayName} · Lv ${node.levelMin}–${node.levelMax}`;
    const marker = document.createElement('i');
    const label = document.createElement('span'); label.textContent = node.displayName;
    const level = document.createElement('small'); level.textContent = `Lv ${node.levelMin}–${node.levelMax}`;
    button.append(marker, label, level);
    if (node.objectiveLabels.length > 0) {
      const objective = document.createElement('b'); objective.textContent = '!';
      button.append(objective);
    }
    return button;
  }

  private worldMapStatusLabel(node: WorldMapNode): string {
    return ({ current: 'CURRENT AREA', visited: 'CHARTED', available: 'OPEN ROAD', locked: 'ROAD LOCKED', uncharted: 'UNCHARTED' } as const)[node.status];
  }

  private worldMapStatusCopy(node: WorldMapNode): string {
    if (node.status === 'current') return 'Your lantern burns here.';
    if (node.status === 'visited') return 'A known place on your traveled route.';
    if (node.status === 'available') return 'An open road leads from your explored path.';
    if (node.status === 'locked') return node.lockReasons.join(' · ') || 'The road is not open yet.';
    return 'This place lies beyond your traveled roads.';
  }

  private isPassiveSkill(skill: SkillDefinition): boolean {
    return skill.targetType === 'self' && skill.mpCost === 0 && skill.cooldown === 0
      && (skill.effect.kind === 'economy' || skill.effect.kind === 'gather' || skill.effect.kind === 'utility');
  }

  private equipmentSignature(equipment: EquipmentState): string {
    return Object.keys(equipment).sort().map((memberId) =>
      `${memberId}:${EQUIPMENT_SLOTS.map((slot) => `${slot}=${equipment[memberId]?.[slot] ?? ''}`).join(',')}`).join('|');
  }

  private equippedCount(equipment: EquipmentState, itemId: string): number {
    return Object.values(equipment).reduce((count, loadout) =>
      count + Object.values(loadout).filter((equippedId) => equippedId === itemId).length, 0);
  }

  private socketedCount(sockets: SocketState, runeId: string): number {
    return Object.values(sockets).reduce((count, loadout) =>
      count + Object.values(loadout).filter((socketedId) => socketedId === runeId).length, 0);
  }

  private itemStatsText(item: ItemDefinition): string {
    const stats = item.stats ?? {};
    const parts = EQUIPMENT_STAT_KEYS.flatMap((stat) => {
      const value = stats[stat] ?? 0;
      if (value === 0) return [];
      const display = stat === 'spd' ? `${value * 2}%` : stat === 'crit' ? `${value}%` : String(value);
      return [`${EQUIPMENT_STAT_LABELS[stat]} ${display}`];
    });
    return parts.join(' · ') || 'No stat bonus';
  }

  private runeStatsText(item: ItemDefinition): string {
    const stats = item.runeStats ?? {};
    const parts = EQUIPMENT_STAT_KEYS.flatMap((stat) => {
      const value = stats[stat] ?? 0;
      if (value === 0) return [];
      const display = stat === 'spd' ? `${value * 2}%` : stat === 'crit' ? `${value}%` : String(value);
      return [`${EQUIPMENT_STAT_LABELS[stat]} ${display}`];
    });
    return parts.join(' · ') || 'No stat bonus';
  }

  private itemComparison(candidate: ItemDefinition, current?: ItemDefinition): HTMLElement {
    const comparison = document.createElement('div');
    comparison.className = 'loadout-comparison';
    for (const stat of EQUIPMENT_STAT_KEYS) {
      const delta = (candidate.stats?.[stat] ?? 0) - (current?.stats?.[stat] ?? 0);
      if (delta === 0) continue;
      const value = stat === 'spd' ? delta * 2 : delta;
      const suffix = stat === 'spd' || stat === 'crit' ? '%' : '';
      const line = document.createElement('span');
      line.className = delta > 0 ? 'is-up' : 'is-down';
      line.textContent = `${EQUIPMENT_STAT_LABELS[stat]} ${value > 0 ? '+' : ''}${value}${suffix}`;
      comparison.append(line);
    }
    if (comparison.childElementCount === 0) {
      const same = document.createElement('span'); same.className = 'is-same'; same.textContent = current ? 'No stat change' : 'Utility gear';
      comparison.append(same);
    }
    return comparison;
  }

  private economyRow(options: {
    name: string; detail: string; meta: string; action: 'buy' | 'sell' | 'craft';
    targetId: string; actionLabel: string; disabled: boolean; title?: string;
  }): HTMLElement {
    const row = document.createElement('div');
    row.className = 'economy-row';
    row.title = options.title ?? options.name;
    const identity = document.createElement('div');
    const name = document.createElement('strong'); name.textContent = options.name;
    const detail = document.createElement('small'); detail.textContent = options.detail;
    identity.append(name, detail);
    const meta = document.createElement('span'); meta.textContent = options.meta;
    const action = document.createElement('button');
    action.type = 'button';
    action.dataset.economyAction = options.action;
    action.dataset.targetId = options.targetId;
    action.textContent = options.actionLabel;
    action.disabled = options.disabled;
    row.append(identity, meta, action);
    return row;
  }

  private updateMap(map: MapDefinition, player: PlayerState, monsters: readonly MonsterState[], resources: readonly ResourceNodeState[], npcs: readonly HudNpc[]): void {
    const nextMapKey = `${map.id}:${monsters.map((monster) => monster.uid).join(',')}:${resources.map((node) => node.definition.id).join(',')}:${npcs.map((npc) => npc.placement.npcId).join(',')}`;
    if (nextMapKey !== this.mapKey) {
      this.mapKey = nextMapKey;
      this.rebuildMapEntities(monsters, resources, npcs);
      this.rebuildMonsterList(monsters);
    }

    const playerMarker = this.root.querySelector<HTMLElement>('#minimap-player');
    this.positionMarker(playerMarker, player, map);
    const angle = Math.atan2(player.facing.y, player.facing.x) * 180 / Math.PI + 90;
    playerMarker?.style.setProperty('--marker-angle', `${angle}deg`);

    for (const monster of monsters) {
      const marker = this.monsterMarkers.get(monster.uid);
      this.positionMarker(marker, monster, map);
      if (marker) marker.hidden = !monster.alive;
    }
    for (const npc of npcs) this.positionMarker(this.npcMarkers.get(npc.placement.npcId), npc.placement.position, map);
    for (const node of resources) {
      const marker = this.resourceMarkers.get(node.definition.id);
      this.positionMarker(marker, node, map);
      if (marker) marker.hidden = !node.available;
    }

    const aliveByDefinition = new Map<string, number>();
    for (const monster of monsters) {
      if (monster.alive) aliveByDefinition.set(monster.definition.id, (aliveByDefinition.get(monster.definition.id) ?? 0) + 1);
    }
    this.text('#monster-count', `${monsters.filter((monster) => monster.alive).length} ACTIVE`);
    for (const [id, row] of this.monsterRows) {
      const count = row.querySelector<HTMLElement>('[data-monster-count]');
      if (count) count.textContent = `${aliveByDefinition.get(id) ?? 0} nearby`;
    }
  }

  private rebuildMapEntities(monsters: readonly MonsterState[], resources: readonly ResourceNodeState[], npcs: readonly HudNpc[]): void {
    const minimap = this.root.querySelector<HTMLElement>('#minimap')!;
    minimap.querySelectorAll('.map-marker--monster, .map-marker--npc, .map-marker--resource').forEach((marker) => marker.remove());
    this.monsterMarkers.clear();
    this.npcMarkers.clear();
    this.resourceMarkers.clear();

    for (const monster of monsters) {
      const marker = document.createElement('div');
      marker.className = 'map-marker map-marker--monster';
      marker.title = `${monster.definition.displayName} · Lv. ${monster.definition.baseLevel}`;
      marker.setAttribute('aria-label', marker.title);
      minimap.appendChild(marker);
      this.monsterMarkers.set(monster.uid, marker);
    }
    for (const npc of npcs) {
      const marker = document.createElement('div');
      marker.className = `map-marker map-marker--npc map-marker--npc-${npc.definition.role}`;
      marker.title = `${npc.definition.displayName} · ${npc.definition.title}`;
      marker.setAttribute('aria-label', marker.title);
      minimap.appendChild(marker);
      this.npcMarkers.set(npc.placement.npcId, marker);
    }
    for (const node of resources) {
      const marker = document.createElement('div');
      marker.className = `map-marker map-marker--resource map-marker--resource-${node.definition.kind}`;
      marker.title = `Gather ${node.definition.displayName}`;
      marker.setAttribute('aria-label', marker.title);
      minimap.appendChild(marker);
      this.resourceMarkers.set(node.definition.id, marker);
    }
  }

  private rebuildMonsterList(monsters: readonly MonsterState[]): void {
    const list = this.root.querySelector<HTMLElement>('#monster-list')!;
    const definitions = [...new Map(monsters.map((monster) => [monster.definition.id, monster.definition])).values()]
      .sort((a, b) => a.baseLevel - b.baseLevel || a.displayName.localeCompare(b.displayName));
    this.monsterRows.clear();
    list.replaceChildren();

    if (definitions.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'monster-list__empty';
      empty.textContent = 'No monsters in this area';
      list.appendChild(empty);
      return;
    }

    for (const definition of definitions) {
      const row = document.createElement('div');
      row.className = 'monster-list__row';
      const identity = document.createElement('div');
      const dot = document.createElement('i');
      const label = document.createElement('span');
      label.textContent = definition.displayName;
      label.title = `${definition.element} element`;
      const element = document.createElement('small');
      element.className = 'monster-element';
      element.textContent = definition.element.toUpperCase();
      identity.append(dot, label, element);
      const details = document.createElement('div');
      const count = document.createElement('small');
      count.dataset.monsterCount = '';
      const level = document.createElement('strong');
      level.textContent = `Lv. ${definition.baseLevel}`;
      details.append(count, level);
      row.append(identity, details);
      list.appendChild(row);
      this.monsterRows.set(definition.id, row);
    }
  }

  private positionMarker(marker: HTMLElement | null | undefined, point: Vec2, map: MapDefinition): void {
    if (!marker) return;
    const worldWidth = map.gridSize.width * 32;
    const worldHeight = map.gridSize.height * 32;
    const left = Math.max(2, Math.min(98, (point.x + worldWidth / 2) / worldWidth * 100));
    const top = Math.max(2, Math.min(98, (point.y + worldHeight / 2) / worldHeight * 100));
    marker.style.left = `${left}%`;
    marker.style.top = `${top}%`;
  }

  private text(selector: string, value: string): void {
    const element = this.root.querySelector(selector);
    if (element && element.textContent !== value) element.textContent = value;
  }
  private width(selector: string, ratio: number): void {
    const element = this.root.querySelector<HTMLElement>(selector);
    if (element) element.style.width = `${Math.max(0, Math.min(1, ratio)) * 100}%`;
  }

  private syncSettingsControls(): void {
    const settings = loadSettings();
    const sound = this.root.querySelector<HTMLInputElement>('#setting-sound');
    const motion = this.root.querySelector<HTMLInputElement>('#setting-motion');
    if (sound) sound.checked = settings.soundEnabled;
    if (motion) motion.checked = settings.reducedMotion;
  }
}

export const hud = new Hud();
