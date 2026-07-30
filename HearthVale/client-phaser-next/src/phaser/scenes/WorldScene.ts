import Phaser from 'phaser';
import type { GameData, MapDefinition, MapNpcPlacement, MapPortal, NpcDefinition, PartyRole, ResourceNodeKind, Vec2 } from '../../game/data/types.js';
import type { InputActions } from '../../game/input/actions.js';
import { formatSaveTime, saveGame } from '../../game/persistence/saveStore.js';
import { WorldSimulation, type EquipmentSlot, type EquipmentState, type InventoryStack, type MonsterState, type PlayerState, type QuestState, type ResourceCooldowns, type ResourceNodeState, type SimEvent, type SocketState } from '../../game/simulation/WorldSimulation.js';
import { hud } from '../../ui/Hud.js';
import { ACTOR_SPRITE_FRAME, actorFrameForFacing, actorTextureForMember } from '../view/ActorSprites.js';
import { biomeAccent, paintWorld } from '../view/WorldPainter.js';

interface WorldStart {
  mapId?: string;
  spawn?: Vec2;
  party?: PlayerState[];
  inventory?: InventoryStack[];
  quests?: QuestState[];
  gold?: number;
  equipment?: EquipmentState;
  sockets?: SocketState;
  discoveredMapIds?: string[];
  resourceCooldowns?: ResourceCooldowns;
  trackedQuestId?: string;
  previewMerchantNpcId?: string;
  previewTrainerNpcId?: string;
  previewWarpNpcId?: string;
  previewLevel?: number;
  previewMastery?: boolean;
  previewEvolution?: boolean;
  previewWorldMap?: boolean;
  previewLoadout?: boolean;
  previewRunes?: boolean;
  previewJournal?: boolean;
  previewConsumables?: boolean;
  previewCampaignComplete?: boolean;
  previewFreeze?: boolean;
  preview?: boolean;
}
interface MonsterView {
  root: Phaser.GameObjects.Container;
  body: Phaser.GameObjects.Arc;
  hp: Phaser.GameObjects.Graphics;
  name: Phaser.GameObjects.Text;
  telegraph: Phaser.GameObjects.Graphics;
  ability: Phaser.GameObjects.Text;
}
interface PartyView { root: Phaser.GameObjects.Container; sprite: Phaser.GameObjects.Sprite; glyph: Phaser.GameObjects.Text }
interface NpcView { placement: MapNpcPlacement; definition: NpcDefinition; root: Phaser.GameObjects.Container; dialogueIndex: number }
interface ResourceView { root: Phaser.GameObjects.Container; label: Phaser.GameObjects.Text }

const TILE = 32;
const INTERACT_RANGE = 68;
const FX_DEPTH = 26000;
const FLOATING_TEXT_DEPTH = 30000;
const WORLD_CAMERA_MIN_ZOOM = 0.72;
const WORLD_CAMERA_MAX_ZOOM = 0.98;
const WORLD_CAMERA_REFERENCE_WIDTH = 1500;
const ROLE_GLYPHS: Record<PartyRole, string> = {
  novice: '○', melee: '◇', ranged: '➶', magic: '✦', support: '+', artisan: '$', scout: '◆',
};

function distance(a: Vec2, b: Vec2): number { return Math.hypot(a.x - b.x, a.y - b.y); }
function colorToHex(color: number): string { return `#${color.toString(16).padStart(6, '0')}`; }
function isCloseCombatRole(role: PartyRole): boolean { return role === 'novice' || role === 'melee' || role === 'artisan' || role === 'scout'; }

export class WorldScene extends Phaser.Scene {
  private gameData!: GameData;
  private map!: MapDefinition;
  private sim!: WorldSimulation;
  private playerView!: Phaser.GameObjects.Container;
  private partyViews = new Map<string, PartyView>();
  private monsterViews = new Map<string, MonsterView>();
  private resourceViews = new Map<string, ResourceView>();
  private npcViews: NpcView[] = [];
  private portals: Array<{ definition: MapPortal; root: Phaser.GameObjects.Container }> = [];
  private keys!: Record<'up' | 'down' | 'left' | 'right' | 'w' | 'a' | 's' | 'd' | 'shift' | 'attack' | 'interact' | 'journal' | 'loadout' | 'map' | 'escape', Phaser.Input.Keyboard.Key>;
  private skillKeys: Array<{ memberId: string; skillId: string; key: Phaser.Input.Keyboard.Key }> = [];
  private queuedSkills: Array<{ memberId: string; skillId: string }> = [];
  private attackQueued = false;
  private activeDialogue: NpcView | null = null;
  private transitioning = false;
  private portalArmed = false;
  private saveTimer = 0;
  private previewMode = false;
  private previewFrozen = false;
  private worldMapOpen = false;
  private loadoutOpen = false;
  private journalOpen = false;
  private campaignOpen = false;
  private trackedQuestId = '';

  constructor() { super('World'); }

  create(start: WorldStart): void {
    this.gameData = this.registry.get('gameData') as GameData;
    this.previewMode = Boolean(start.preview);
    this.previewFrozen = Boolean(start.preview && start.previewFreeze);
    this.map = this.gameData.maps.find((map) => map.id === (start.mapId ?? 'hearthvale_town_ro')) ?? this.gameData.maps[0];
    const spawn = start.spawn ?? this.map.playerSpawn;
    this.sim = new WorldSimulation(this.gameData, this.map, spawn, start.party, start.inventory, start.quests, start.gold, start.equipment, start.discoveredMapIds, start.resourceCooldowns, start.sockets);
    this.trackedQuestId = start.trackedQuestId ?? '';
    if (this.previewMode && start.previewLevel) {
      for (const member of this.sim.party) member.level = start.previewLevel;
    }
    if (this.previewMode && start.previewRunes) {
      this.sim.socketRune('warden', 'weapon', 'embermark_rune');
      this.sim.socketRune('warden', 'body', 'heartroot_rune');
    }
    if (this.previewMode && start.previewMastery) {
      this.sim.gold = start.previewEvolution ? 1200 : 500;
      for (const member of this.sim.party) this.sim.changeJob(member.id, member.id);
    }
    if (this.previewMode && start.previewEvolution) {
      this.sim.chooseEvolution('warden', 'hearthwall_marshal');
      this.sim.chooseEvolution('ranger', 'waystar_stalker');
      this.sim.chooseEvolution('channeler', 'convergence_magus');
      this.sim.chooseEvolution('mender', 'beacon_saint');
    }
    if (this.previewMode && start.previewConsumables) {
      this.sim.player.stamina = 36;
      this.sim.player.hp = Math.max(1, this.sim.player.hp - 28);
      this.sim.player.activeEffects.push(
        { skillId: 'item:warding_incense', stat: 'def', amount: 8, remaining: 60 },
        { skillId: 'item:gale_tonic', stat: 'spd', amount: 15, remaining: 45 },
        { skillId: 'status:poison', stat: 'poison', amount: 2, remaining: 10, tickTimer: 1 },
      );
    }
    this.monsterViews.clear(); this.resourceViews.clear(); this.partyViews.clear(); this.npcViews = []; this.portals = []; this.transitioning = false; this.activeDialogue = null; this.portalArmed = false; this.queuedSkills = []; this.worldMapOpen = false; this.loadoutOpen = false; this.journalOpen = false; this.campaignOpen = false;
    this.cameras.main.setBackgroundColor(this.map.kind === 'dungeon' ? '#11181c' : '#172d27');
    paintWorld(
      this,
      this.map,
      this.gameData.props?.[this.map.id]?.props ?? [],
      this.gameData.collisions?.[this.map.id],
      this.gameData.biomes ?? [],
    );
    this.createPortals();
    this.createNpcs();
    this.createResources();
    this.createMonsters();
    this.createParty();
    this.bindInput();
    hud.setSkillHandler((memberId, skillId) => {
      if (!this.activeDialogue && !this.worldMapOpen && !this.loadoutOpen && !this.journalOpen && !this.campaignOpen && !this.transitioning) this.queuedSkills.push({ memberId, skillId });
    });
    hud.setSaveHandler({
      saveNow: () => this.saveSnapshot(true),
      exitToTitle: () => this.exitToTitle(),
    });
    hud.setItemHandler((itemId) => {
      if (!this.campaignOpen) this.handleEvents(this.sim.useItem(itemId));
    });
    hud.setCampaignHandler({
      continueJourney: () => { this.campaignOpen = false; },
      exitToTitle: () => this.exitToTitle(),
    });
    hud.setWarpHandler((warpId) => this.handleEvents(this.sim.travelByCourier(warpId)), () => this.closeActiveInteraction());
    hud.setLoadoutHandler((action, memberId, targetId) => {
      const events = action === 'equip'
        ? this.sim.equipItem(memberId, targetId)
        : action === 'unequip'
          ? this.sim.unequipItem(memberId, targetId as EquipmentSlot)
          : action === 'socket-rune'
            ? this.sim.socketRune(memberId, targetId.split(':')[0] as EquipmentSlot, targetId.split(':')[1])
            : action === 'unsocket-rune'
              ? this.sim.unsocketRune(memberId, targetId as EquipmentSlot)
          : this.sim.toggleSkillLoadout(memberId, targetId);
      this.handleEvents(events);
      if (events.some((event) => event.type === 'skill-loadout-changed')) this.bindSkillKeys();
    }, (open) => { this.loadoutOpen = open; });
    hud.setJobHandler((memberId, jobId) => this.handleEvents(this.sim.changeJob(memberId, jobId)), () => this.closeActiveInteraction());
    hud.setMasteryHandler((memberId, masteryId) => this.handleEvents(this.sim.chooseMastery(memberId, masteryId)));
    hud.setEvolutionHandler((memberId, evolutionId) => this.handleEvents(this.sim.chooseEvolution(memberId, evolutionId)));
    hud.setEconomyHandler((action, targetId) => {
      const npcId = this.activeDialogue?.definition.role === 'merchant' ? this.activeDialogue.definition.id : undefined;
      if (!npcId) return;
      const events = action === 'buy'
        ? this.sim.buyItem(npcId, targetId)
        : action === 'sell'
          ? this.sim.sellItem(npcId, targetId)
          : this.sim.craftRecipe(npcId, targetId);
      this.handleEvents(events);
    }, () => this.closeActiveInteraction());
    hud.setWorldMapHandler((open) => { this.worldMapOpen = open; });
    hud.setJournalHandler((questId) => {
      this.trackedQuestId = questId ?? '';
      this.saveSnapshot(false);
    }, (open) => {
      if (open) this.closeActiveInteraction();
      this.journalOpen = open;
    });
    hud.setWorldMapOpen(Boolean(start.previewWorldMap));
    hud.setLoadoutOpen(Boolean(start.previewLoadout));
    hud.setJournalOpen(Boolean(start.previewJournal));
    hud.setMobilePackOpen(Boolean(start.previewConsumables));
    hud.setCampaignOpen(false);
    if (start.previewMerchantNpcId) {
      const merchant = this.npcViews.find((npc) => npc.definition.id === start.previewMerchantNpcId);
      if (merchant && this.sim.shopDefinition(merchant.definition.id)) this.activeDialogue = merchant;
    }
    if (start.previewTrainerNpcId) {
      const trainer = this.npcViews.find((npc) => npc.definition.id === start.previewTrainerNpcId && npc.definition.role === 'trainer');
      if (trainer) this.activeDialogue = trainer;
    }
    if (start.previewWarpNpcId) {
      const courier = this.npcViews.find((npc) => npc.definition.id === start.previewWarpNpcId && npc.definition.role === 'warp');
      if (courier) this.activeDialogue = courier;
    }
    const width = this.map.gridSize.width * TILE; const height = this.map.gridSize.height * TILE;
    this.cameras.main.setBounds(-width / 2, -height / 2, width, height);
    this.cameras.main.startFollow(this.playerView, true, 0.1, 0.1);
    this.setWorldCameraZoom();
    const resizeCamera = () => this.setWorldCameraZoom();
    this.scale.on(Phaser.Scale.Events.RESIZE, resizeCamera);
    this.cameras.main.fadeIn(420, 12, 24, 20);
    hud.setVisible(true); hud.hideDialogue(); hud.toast(this.map.displayName);
    this.saveSnapshot(false);
    if (start.previewCampaignComplete) this.showCampaignComplete();
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => { this.scale.off(Phaser.Scale.Events.RESIZE, resizeCamera); hud.hideDialogue(); hud.setCampaignOpen(false); hud.setMobilePackOpen(false); hud.setJournalOpen(false); hud.setLoadoutOpen(false); hud.setWorldMapOpen(false); hud.setSkillHandler(); hud.setItemHandler(); hud.setCampaignHandler(); hud.setWarpHandler(); hud.setLoadoutHandler(); hud.setJobHandler(); hud.setMasteryHandler(); hud.setEvolutionHandler(); hud.setEconomyHandler(); hud.setWorldMapHandler(); hud.setJournalHandler(); hud.setSaveHandler(); });
  }

  update(_time: number, deltaMs: number): void {
    if (this.transitioning) return;
    if (!this.campaignOpen && Phaser.Input.Keyboard.JustDown(this.keys.escape) && this.journalOpen) hud.setJournalOpen(false);
    else if (!this.campaignOpen && Phaser.Input.Keyboard.JustDown(this.keys.escape) && this.loadoutOpen) hud.setLoadoutOpen(false);
    else if (!this.campaignOpen && Phaser.Input.Keyboard.JustDown(this.keys.escape) && this.worldMapOpen) hud.setWorldMapOpen(false);
    else if (!this.campaignOpen && Phaser.Input.Keyboard.JustDown(this.keys.journal) && !this.activeDialogue && !this.loadoutOpen && !this.worldMapOpen) hud.setJournalOpen(!this.journalOpen);
    else if (!this.campaignOpen && Phaser.Input.Keyboard.JustDown(this.keys.loadout) && !this.activeDialogue && !this.worldMapOpen && !this.journalOpen) hud.setLoadoutOpen(!this.loadoutOpen);
    else if (!this.campaignOpen && Phaser.Input.Keyboard.JustDown(this.keys.map) && !this.activeDialogue && !this.loadoutOpen && !this.journalOpen) hud.setWorldMapOpen(!this.worldMapOpen);
    const actions = this.readInput();
    const events = this.activeDialogue || this.worldMapOpen || this.loadoutOpen || this.journalOpen || this.campaignOpen || this.previewFrozen ? [] : this.sim.update(actions, deltaMs / 1000);
    this.syncViews();
    this.handleEvents(events);
    this.saveTimer += deltaMs;
    if (this.saveTimer >= 5000) this.saveSnapshot(false);
    const nearbyNpc = this.nearestNpc(); const nearbyResource = this.sim.nearestResource(INTERACT_RANGE); const nearbyPortal = this.nearestPortal();
    if (!nearbyPortal) {
      this.portalArmed = true;
    } else if (this.portalArmed && !this.activeDialogue && !this.worldMapOpen && !this.loadoutOpen && !this.journalOpen && !this.campaignOpen) {
      this.portalArmed = false;
      this.travelThroughPortal(nearbyPortal);
      return;
    }
    if (!this.worldMapOpen && !this.loadoutOpen && !this.journalOpen && !this.campaignOpen && Phaser.Input.Keyboard.JustDown(this.keys.interact)) this.interact();
    let prompt: string | undefined;
    if (this.activeDialogue || this.journalOpen || this.campaignOpen) prompt = undefined;
    else if (!this.loadoutOpen && nearbyNpc) prompt = `E  Talk to ${nearbyNpc.definition.displayName}`;
    else if (!this.loadoutOpen && nearbyResource?.available) prompt = `E  Gather ${nearbyResource.definition.displayName}`;
    else if (!this.loadoutOpen && nearbyResource) prompt = `${nearbyResource.definition.displayName} reforms in ${Math.ceil(nearbyResource.respawn)}s`;
    const target = this.sim.nearestLivingMonster(230);
    hud.update({
      player: this.sim.player,
      party: this.sim.party,
      map: this.map,
      maps: this.gameData.maps,
      regions: this.gameData.regions ?? [],
      monsters: this.sim.monsters,
      resources: this.sim.resources,
      npcs: this.npcViews,
      npcDefinitions: this.gameData.npcs,
      skills: this.gameData.skills,
      jobs: this.gameData.jobs,
      items: this.gameData.items,
      quests: this.gameData.quests,
      drops: this.gameData.drops,
      shops: this.gameData.shops ?? [],
      recipes: this.gameData.recipes ?? [],
      activeMerchantNpcId: this.activeDialogue?.definition.role === 'merchant' ? this.activeDialogue.definition.id : undefined,
      activeTrainerNpcId: this.activeDialogue?.definition.role === 'trainer' ? this.activeDialogue.definition.id : undefined,
      activeWarpNpcId: this.activeDialogue?.definition.role === 'warp' ? this.activeDialogue.definition.id : undefined,
      inventory: this.sim.inventory,
      questStates: this.sim.quests,
      trackedQuestId: this.trackedQuestId,
      equipment: this.sim.equipment,
      sockets: this.sim.sockets,
      discoveredMapIds: this.sim.discoveredMapIds,
      gold: this.sim.gold,
      buyPriceMultiplier: this.sim.buyPriceMultiplier(),
      dropRateBonus: this.sim.dropRateBonus(),
      stackSizeBonus: this.sim.stackSizeBonus(),
      target,
      prompt,
    });
  }

  private bindInput(): void {
    const keyboard = this.input.keyboard!;
    this.keys = {
      up: keyboard.addKey('UP'), down: keyboard.addKey('DOWN'), left: keyboard.addKey('LEFT'), right: keyboard.addKey('RIGHT'),
      w: keyboard.addKey('W'), a: keyboard.addKey('A'), s: keyboard.addKey('S'), d: keyboard.addKey('D'),
      shift: keyboard.addKey('SHIFT'), attack: keyboard.addKey('SPACE'), interact: keyboard.addKey('E'),
      journal: keyboard.addKey('J'), loadout: keyboard.addKey('I'), map: keyboard.addKey('M'), escape: keyboard.addKey('ESC'),
    };
    const keyRows = [
      [Phaser.Input.Keyboard.KeyCodes.ONE, Phaser.Input.Keyboard.KeyCodes.TWO, Phaser.Input.Keyboard.KeyCodes.THREE],
      [Phaser.Input.Keyboard.KeyCodes.FOUR, Phaser.Input.Keyboard.KeyCodes.FIVE, Phaser.Input.Keyboard.KeyCodes.SIX],
      [Phaser.Input.Keyboard.KeyCodes.SEVEN, Phaser.Input.Keyboard.KeyCodes.EIGHT, Phaser.Input.Keyboard.KeyCodes.NINE],
      [Phaser.Input.Keyboard.KeyCodes.Z, Phaser.Input.Keyboard.KeyCodes.X, Phaser.Input.Keyboard.KeyCodes.C],
    ];
    this.bindSkillKeys(keyboard, keyRows);
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.leftButtonDown() && !this.activeDialogue && !this.worldMapOpen && !this.loadoutOpen && !this.journalOpen && !this.campaignOpen) this.attackQueued = true;
    });
  }

  private bindSkillKeys(keyboard = this.input.keyboard!, keyRows = [
    [Phaser.Input.Keyboard.KeyCodes.ONE, Phaser.Input.Keyboard.KeyCodes.TWO, Phaser.Input.Keyboard.KeyCodes.THREE],
    [Phaser.Input.Keyboard.KeyCodes.FOUR, Phaser.Input.Keyboard.KeyCodes.FIVE, Phaser.Input.Keyboard.KeyCodes.SIX],
    [Phaser.Input.Keyboard.KeyCodes.SEVEN, Phaser.Input.Keyboard.KeyCodes.EIGHT, Phaser.Input.Keyboard.KeyCodes.NINE],
    [Phaser.Input.Keyboard.KeyCodes.Z, Phaser.Input.Keyboard.KeyCodes.X, Phaser.Input.Keyboard.KeyCodes.C],
  ]): void {
    this.skillKeys = this.sim.party.flatMap((member, memberIndex) => member.skillIds.map((skillId, skillIndex) => ({
      memberId: member.id,
      skillId,
      key: keyboard.addKey(keyRows[memberIndex][skillIndex]),
    })));
  }

  private readInput(): InputActions {
    const blocked = Boolean(this.activeDialogue || this.worldMapOpen || this.loadoutOpen || this.journalOpen || this.campaignOpen);
    const attackPressed = !blocked && (Phaser.Input.Keyboard.JustDown(this.keys.attack) || this.attackQueued);
    const skillRequests = blocked ? [] : [
      ...this.queuedSkills,
      ...this.skillKeys.filter((binding) => Phaser.Input.Keyboard.JustDown(binding.key)).map(({ memberId, skillId }) => ({ memberId, skillId })),
    ].filter((request, index, requests) => requests.findIndex((candidate) => candidate.memberId === request.memberId) === index);
    this.attackQueued = false;
    this.queuedSkills = [];
    return {
      x: blocked ? 0 : Number(this.keys.right.isDown || this.keys.d.isDown) - Number(this.keys.left.isDown || this.keys.a.isDown),
      y: blocked ? 0 : Number(this.keys.down.isDown || this.keys.s.isDown) - Number(this.keys.up.isDown || this.keys.w.isDown),
      sprint: this.keys.shift.isDown,
      attackPressed,
      autoAttack: !blocked,
      interactPressed: false,
      skillRequests,
    };
  }

  private createParty(): void {
    for (const member of this.sim.party) {
      const shadow = this.add.ellipse(0, 4, 42, 14, 0x0b1713, 0.34);
      const sprite = this.add.sprite(0, 0, actorTextureForMember(member.id, member.jobId, member.role), actorFrameForFacing(member.facing))
        .setOrigin(ACTOR_SPRITE_FRAME.originX, ACTOR_SPRITE_FRAME.originY)
        .setScale(ACTOR_SPRITE_FRAME.scale);
      const glyph = this.add.text(0, -72, ROLE_GLYPHS[member.role], { fontFamily: 'Arial', fontStyle: 'bold', fontSize: '15px', color: '#ffe7a0', stroke: '#24372f', strokeThickness: 3 }).setOrigin(0.5);
      const name = this.add.text(0, 18, member.name, { fontFamily: 'Arial', fontSize: '9px', color: '#eaf1e6', stroke: '#14231d', strokeThickness: 3 }).setOrigin(0.5);
      const root = this.add.container(member.x, member.y, [shadow, sprite, glyph, name]);
      this.partyViews.set(member.id, { root, sprite, glyph });
      if (member.id === this.sim.player.id) {
        const lanternGlow = this.add.circle(18, -10, 9, 0xf5c66a, 0.22);
        const lantern = this.add.circle(18, -10, 4, 0xffdf78).setStrokeStyle(1, 0x765326);
        root.add([lanternGlow, lantern]);
        this.tweens.add({ targets: lanternGlow, scale: 1.45, alpha: 0.08, yoyo: true, repeat: -1, duration: 900 });
        this.playerView = root;
      }
    }
  }

  private createMonsters(): void {
    const colors: Record<string, number> = { nature: 0x84b85d, fungal: 0xba7f9d, crystal: 0x69b9c4, neutral: 0xb79d73, wind: 0x8bc6aa, shadow: 0x7c6a93, lunar: 0xc9b7de, arcane: 0xa777c4, water: 0x5aa9c8, spirit: 0x8fd6bf, fire: 0xe1774c };
    for (const monster of this.sim.monsters) {
      const radius = monster.definition.size === 'large' ? 22 : monster.definition.size === 'medium' ? 17 : 13;
      const telegraph = this.add.graphics();
      const shadow = this.add.ellipse(0, radius * 0.75, radius * 2.1, radius * 0.7, 0x0a1512, 0.34);
      const body = this.add.circle(0, 0, radius, colors[monster.definition.element] ?? 0xb9a584).setStrokeStyle(3, 0x24362e);
      const eyeA = this.add.circle(-radius * 0.28, -2, 2.2, 0xf7f0d2);
      const eyeB = this.add.circle(radius * 0.28, -2, 2.2, 0xf7f0d2);
      const name = this.add.text(0, -radius - 17, monster.definition.displayName, { fontFamily: 'Arial', fontSize: '10px', color: '#e9f0dd', stroke: '#16231e', strokeThickness: 3 }).setOrigin(0.5);
      const ability = this.add.text(0, -radius - 52, '', { fontFamily: 'Arial', fontStyle: 'bold', fontSize: '10px', color: '#ffd2a8', stroke: '#3d1715', strokeThickness: 4 }).setOrigin(0.5).setVisible(false);
      const hp = this.add.graphics();
      const root = this.add.container(monster.x, monster.y, [telegraph, shadow, body, eyeA, eyeB, name, ability, hp]);
      this.monsterViews.set(monster.uid, { root, body, hp, name, telegraph, ability });
    }
  }

  private createResources(): void {
    const colors: Record<ResourceNodeKind, number> = {
      herb: 0x79ba65, ore: 0x79bdc3, fiber: 0xd0b85f, relic: 0xa889c4,
    };
    for (const node of this.sim.resources) {
      const color = colors[node.definition.kind];
      const glow = this.add.circle(0, 4, 24, color, 0.12);
      const pieces: Phaser.GameObjects.GameObject[] = [glow];
      if (node.definition.kind === 'ore') {
        pieces.push(
          this.add.triangle(-7, 3, -7, 12, 0, -11, 7, 12, color).setStrokeStyle(2, 0x263c39),
          this.add.triangle(7, 7, -5, 9, 2, -7, 8, 9, 0xb9e5d8).setStrokeStyle(1, 0x3f615d),
        );
      } else if (node.definition.kind === 'fiber') {
        for (let i = -2; i <= 2; i += 1) pieces.push(this.add.rectangle(i * 5, 2 - Math.abs(i) * 2, 4, 24, color).setOrigin(0.5, 1));
      } else if (node.definition.kind === 'relic') {
        pieces.push(
          this.add.circle(0, 2, 11, color, 0.82).setStrokeStyle(3, 0xf4dfa0),
          this.add.circle(0, 2, 4, 0xffe384),
        );
      } else {
        pieces.push(
          this.add.ellipse(-7, 2, 12, 22, color).setRotation(-0.55).setStrokeStyle(1, 0x2c4939),
          this.add.ellipse(7, 2, 12, 22, 0x96cf72).setRotation(0.55).setStrokeStyle(1, 0x2c4939),
          this.add.circle(0, -5, 5, 0xf2d475),
        );
      }
      const label = this.add.text(0, -28, node.definition.displayName, {
        fontFamily: 'Arial', fontSize: '9px', color: '#eaf2dc', stroke: '#15251f', strokeThickness: 3,
      }).setOrigin(0.5);
      pieces.push(label);
      const root = this.add.container(node.x, node.y, pieces);
      this.tweens.add({ targets: glow, scale: 1.35, alpha: 0.04, yoyo: true, repeat: -1, duration: 1450 });
      this.resourceViews.set(node.definition.id, { root, label });
    }
  }

  private createNpcs(): void {
    const catalog = new Map(this.gameData.npcs.map((npc) => [npc.id, npc]));
    const roleColors: Record<NpcDefinition['role'], number> = { quest: 0xe6b756, merchant: 0x67a86d, trainer: 0xbd6852, warp: 0x6a9ed5, flavor: 0xc4a67d };
    const roleGlyph: Record<NpcDefinition['role'], string> = { quest: '!', merchant: '$', trainer: '✦', warp: '»', flavor: '' };
    for (const placement of this.map.npcs) {
      const definition = catalog.get(placement.npcId); if (!definition) continue;
      const shadow = this.add.ellipse(0, 14, 28, 10, 0x0b1713, 0.32);
      const body = this.add.circle(0, 0, 13, roleColors[definition.role]).setStrokeStyle(3, 0x263a31);
      const glyph = this.add.text(0, -26, roleGlyph[definition.role], { fontFamily: 'Georgia', fontStyle: 'bold', fontSize: '18px', color: '#ffeaa5', stroke: '#4c3924', strokeThickness: 3 }).setOrigin(0.5);
      const name = this.add.text(0, 24, definition.displayName, { fontFamily: 'Arial', fontSize: '10px', color: '#e9f0dd', stroke: '#16231e', strokeThickness: 3 }).setOrigin(0.5);
      const root = this.add.container(placement.position.x, placement.position.y, [shadow, body, glyph, name]);
      this.tweens.add({ targets: glyph, y: -30, yoyo: true, repeat: -1, duration: 1000 + this.npcViews.length * 47 });
      this.npcViews.push({ placement, definition, root, dialogueIndex: 0 });
    }
  }

  private createPortals(): void {
    const accent = biomeAccent(this.map, this.gameData.biomes ?? []);
    for (const definition of this.map.portals) {
      const outer = this.add.ellipse(0, 0, 56, 30, accent, 0.12).setStrokeStyle(2, accent, 0.65);
      const inner = this.add.ellipse(0, 0, 32, 16, 0xffe59a, 0.22);
      const label = this.add.text(0, -28, definition.label, { fontFamily: 'Arial', fontSize: '10px', color: '#ffe8a6', stroke: '#192820', strokeThickness: 3 }).setOrigin(0.5);
      const root = this.add.container(definition.position.x, definition.position.y, [outer, inner, label]);
      this.tweens.add({ targets: inner, scaleX: 1.45, scaleY: 1.35, alpha: 0.05, yoyo: true, repeat: -1, duration: 1300 });
      this.portals.push({ definition, root });
    }
  }

  private syncViews(): void {
    for (const member of this.sim.party) {
      const view = this.partyViews.get(member.id); if (!view) continue;
      view.root.setPosition(member.x, member.y).setDepth(Math.round(member.y + 10000));
      view.root.setScale(1).setAlpha(member.hp > 0 ? 1 : 0.32);
      const texture = actorTextureForMember(member.id, member.jobId, member.role);
      if (view.sprite.texture.key !== texture) view.sprite.setTexture(texture);
      view.sprite.setFrame(actorFrameForFacing(member.facing));
      if (member.invulnerable > 0) view.sprite.setTint(0xffb6a5); else view.sprite.clearTint();
      view.glyph.setText(ROLE_GLYPHS[member.role]);
    }
    for (const monster of this.sim.monsters) {
      const view = this.monsterViews.get(monster.uid); if (!view) continue;
      view.root.setPosition(monster.x, monster.y).setDepth(Math.round(monster.y + 10000)).setVisible(monster.alive);
      view.body.setFillStyle(monster.hurtFlash > 0 ? 0xfff0d0 : this.monsterColor(monster));
      view.telegraph.clear();
      if (monster.telegraph) {
        const progress = 1 - monster.telegraph.remaining / monster.telegraph.totalDuration;
        const ability = monster.definition.abilities?.find((candidate) => candidate.id === monster.telegraph?.abilityId);
        const target = this.sim.party.find((member) => member.id === monster.telegraph?.targetMemberId);
        if (ability?.target === 'single' && target) {
          const targetX = target.x - monster.x;
          const targetY = target.y - monster.y;
          const targetRadius = 34;
          view.telegraph.lineStyle(2, 0xffa06f, 0.72).lineBetween(0, 0, targetX, targetY);
          view.telegraph.fillStyle(0xff735f, 0.08 + progress * 0.1).fillCircle(targetX, targetY, targetRadius);
          view.telegraph.lineStyle(2 + progress * 2, 0xffa06f, 0.65 + progress * 0.3).strokeCircle(targetX, targetY, targetRadius);
          view.telegraph.lineStyle(2, 0xffd18a, 0.9).strokeCircle(targetX, targetY, Math.max(7, targetRadius * (1 - progress)));
        } else {
          view.telegraph.fillStyle(0xff735f, 0.05 + progress * 0.08).fillCircle(0, 0, monster.telegraph.range);
          view.telegraph.lineStyle(2 + progress * 2, 0xffa06f, 0.6 + progress * 0.35).strokeCircle(0, 0, monster.telegraph.range);
          view.telegraph.lineStyle(2, 0xffd18a, 0.85).strokeCircle(0, 0, Math.max(8, monster.telegraph.range * progress));
        }
        view.ability.setText(ability?.displayName ?? monster.telegraph.abilityId).setVisible(true);
        view.body.setStrokeStyle(3, 0xffc17a);
      } else {
        view.ability.setVisible(false);
        view.body.setStrokeStyle(3, 0x24362e);
      }
      view.hp.clear();
      if (monster.hp < monster.maxHp) {
        view.hp.fillStyle(0x17231e, 0.8).fillRoundedRect(-18, -29, 36, 4, 2);
        view.hp.fillStyle(0xe06b63, 1).fillRoundedRect(-18, -29, 36 * Math.max(0, monster.hp / monster.maxHp), 4, 2);
      }
    }
    for (const node of this.sim.resources) {
      const view = this.resourceViews.get(node.definition.id); if (!view) continue;
      // Same depth scale as actors and standing props so gathering nodes sort by foot position.
      view.root.setPosition(node.x, node.y).setDepth(Math.round(node.y + 10000)).setAlpha(node.available ? 1 : 0.22);
      view.label.setText(node.available ? node.definition.displayName : `${Math.ceil(node.respawn)}s`);
    }
    for (const npc of this.npcViews) npc.root.setDepth(Math.round(npc.placement.position.y + 10000));
    for (const portal of this.portals) portal.root.setDepth(Math.round(portal.definition.position.y + 9000));
  }

  private monsterColor(monster: MonsterState): number {
    return ({ nature: 0x84b85d, fungal: 0xba7f9d, crystal: 0x69b9c4, neutral: 0xb79d73, wind: 0x8bc6aa, shadow: 0x7c6a93, lunar: 0xc9b7de, arcane: 0xa777c4, water: 0x5aa9c8, spirit: 0x8fd6bf, fire: 0xe1774c } as Record<string, number>)[monster.definition.element] ?? 0xb9a584;
  }

  private setWorldCameraZoom(): void {
    this.cameras.main.setZoom(Math.max(WORLD_CAMERA_MIN_ZOOM, Math.min(WORLD_CAMERA_MAX_ZOOM, this.scale.width / WORLD_CAMERA_REFERENCE_WIDTH)));
  }

  private handleEvents(events: SimEvent[]): void {
    let shouldSave = false;
    let warpTarget: string | undefined;
    let courierTarget: { mapId: string; spawn: Vec2 } | undefined;
    let campaignCompleted = false;
    for (const event of events) {
      if (event.type === 'attack-swing') {
        this.showAttackEffect(event);
      } else if (event.type === 'skill-used') {
        this.showSkillEffect(event);
      } else if (event.type === 'skill-blocked') {
        const skill = this.sim.skillDefinition(event.skillId);
        const reason = event.reason === 'mp' ? 'not enough MP' : event.reason === 'cooldown' ? 'still cooling down' : event.reason === 'passive' ? 'always active for the party' : event.reason === 'muted' ? 'silenced by Muted' : 'no valid target';
        hud.toast(`${skill?.displayName ?? 'Skill'}: ${reason}`, 'danger');
      } else if (event.type === 'skill-loadout-changed') {
        const member = this.sim.party.find((candidate) => candidate.id === event.memberId);
        const skill = this.sim.skillDefinition(event.skillId);
        hud.toast(`${member?.name ?? 'Party member'} ${event.equipped ? 'equipped' : 'removed'} ${skill?.displayName ?? event.skillId}`);
        shouldSave = true;
      } else if (event.type === 'skill-loadout-blocked') {
        const skill = this.sim.skillDefinition(event.skillId);
        const reason = event.reason === 'level' ? `requires level ${skill?.requiredLevel ?? 1}`
          : event.reason === 'quest' ? 'technique has not been learned'
            : event.reason === 'slots' ? 'all three skill slots are filled'
              : event.reason === 'minimum' ? 'at least one skill must stay equipped' : 'skill does not belong to this path';
        hud.toast(`${skill?.displayName ?? event.skillId}: ${reason}`, 'danger');
      } else if (event.type === 'member-healed') {
        const member = this.sim.party.find((candidate) => candidate.id === event.memberId); if (!member) continue;
        this.floatingText(member.x, member.y - 28, `+${event.amount}`, '#9ff0ae');
        this.showHealPulse(member);
        const view = this.partyViews.get(member.id);
        if (view) this.tweens.add({ targets: view.root, alpha: 0.45, duration: 100, yoyo: true });
      } else if (event.type === 'monster-hit') {
        const monster = this.sim.monsters.find((candidate) => candidate.uid === event.uid); if (!monster) continue;
        const hitLabel = event.critical ? `${event.amount} CRIT` : event.effectiveness === 'strong' ? `${event.amount} WEAK` : event.effectiveness === 'resisted' ? `${event.amount} RESIST` : `${event.amount}`;
        const hitColor = event.critical ? '#ffd86f' : event.effectiveness === 'strong' ? '#a9f2b8' : event.effectiveness === 'resisted' ? '#a7b8c8' : '#ffe099';
        this.floatingText(monster.x, monster.y - 24, hitLabel, hitColor);
        const attacker = this.sim.party.find((member) => member.id === event.memberId) ?? this.sim.player;
        const view = this.monsterViews.get(event.uid); if (view) this.tweens.add({ targets: view.root, x: view.root.x + (monster.x - attacker.x) * 0.08, duration: 65, yoyo: true });
        this.showImpactBurst(monster.x, monster.y, attacker.color, event.defeated ? 1.35 : 0.9);
        if (event.defeated) { hud.toast(`${monster.definition.displayName} defeated · XP gained`); shouldSave = true; }
      } else if (event.type === 'item-loot') {
        const item = this.sim.itemDefinition(event.itemId);
        hud.toast(`Found ${item?.displayName ?? event.itemId} x${event.count}`);
        shouldSave = true;
      } else if (event.type === 'resource-gathered') {
        const item = this.sim.itemDefinition(event.itemId);
        const node = this.sim.resources.find((candidate) => candidate.definition.id === event.nodeId);
        if (node) {
          this.floatingText(node.x, node.y - 24, `+${event.count} ${item?.displayName ?? event.itemId}`, '#c9ef9b');
          this.showBuffRing(node.x, node.y, 0x86ca72);
        }
        hud.toast(`Gathered ${item?.displayName ?? event.itemId} x${event.count}${event.bonus ? ' · Ore Sense +1' : ''}`);
        shouldSave = true;
      } else if (event.type === 'resource-blocked') {
        const node = this.sim.resources.find((candidate) => candidate.definition.id === event.nodeId);
        const reason = event.reason === 'cooldown' ? `reforms in ${Math.ceil(node?.respawn ?? 0)}s`
          : event.reason === 'level' ? `requires level ${node?.definition.requiredLevel ?? 1}`
            : event.reason === 'range' ? 'move closer' : 'cannot be gathered';
        hud.toast(`${node?.definition.displayName ?? event.nodeId}: ${reason}`, 'danger');
      } else if (event.type === 'quest-started') {
        const quest = this.sim.questDefinition(event.questId);
        hud.toast(`Quest started: ${quest?.displayName ?? event.questId}`);
        shouldSave = true;
      } else if (event.type === 'quest-progress') {
        const quest = this.sim.questDefinition(event.questId);
        if (event.progress >= event.target) hud.toast(`${quest?.displayName ?? 'Quest'} ready to turn in`);
        shouldSave = true;
      } else if (event.type === 'quest-completed') {
        const quest = this.sim.questDefinition(event.questId);
        hud.toast(`Quest complete: ${quest?.displayName ?? event.questId}`);
        shouldSave = true;
        campaignCompleted ||= Boolean(event.campaignCompleted);
      } else if (event.type === 'item-used') {
        const item = this.sim.itemDefinition(event.itemId);
        const effect = item?.effect;
        const detail = effect?.type === 'restore' && effect.stat === 'stamina' && event.amount
          ? ` · +${event.amount} stamina`
          : effect?.type === 'buff' && effect.stat && effect.amount && effect.duration
            ? ` · ${effect.stat.toUpperCase()} +${effect.amount} for ${effect.duration}s`
            : '';
        hud.toast(`Used ${item?.displayName ?? event.itemId}${detail}`);
        shouldSave = true;
      } else if (event.type === 'warp-requested') {
        warpTarget = event.target;
      } else if (event.type === 'courier-warp-requested') {
        const destination = this.sim.warpDestinations().find((warp) => warp.id === event.warpId);
        hud.toast(`Hearthline opened: ${destination?.label ?? event.targetMapId}${event.goldCost > 0 ? ` · ${event.goldCost}g` : ''}`);
        courierTarget = { mapId: event.targetMapId, spawn: event.targetSpawn };
        shouldSave = true;
      } else if (event.type === 'courier-warp-blocked') {
        const destination = this.sim.warpDestinations().find((warp) => warp.id === event.warpId);
        const reason = event.reason === 'level' ? `requires level ${destination?.requiredLevel ?? 1}`
          : event.reason === 'quest' ? 'wayline is not attuned yet'
            : event.reason === 'gold' ? 'not enough gold'
              : event.reason === 'location' ? 'already here' : 'destination unavailable';
        hud.toast(`${destination?.label ?? event.warpId}: ${reason}`, 'danger');
      } else if (event.type === 'item-equipped') {
        const item = this.sim.itemDefinition(event.itemId);
        const member = this.sim.party.find((candidate) => candidate.id === event.memberId);
        hud.toast(`${member?.name ?? 'Party member'} equipped ${item?.displayName ?? event.itemId}`);
        shouldSave = true;
      } else if (event.type === 'item-unequipped') {
        const item = this.sim.itemDefinition(event.itemId);
        const member = this.sim.party.find((candidate) => candidate.id === event.memberId);
        hud.toast(`${member?.name ?? 'Party member'} removed ${item?.displayName ?? event.itemId}`);
        shouldSave = true;
      } else if (event.type === 'rune-socketed') {
        const rune = this.sim.itemDefinition(event.runeId);
        const member = this.sim.party.find((candidate) => candidate.id === event.memberId);
        hud.toast(`${member?.name ?? 'Party member'} bound ${rune?.displayName ?? event.runeId}`);
        shouldSave = true;
      } else if (event.type === 'rune-unsocketed') {
        shouldSave = true;
      } else if (event.type === 'rune-blocked') {
        const rune = this.sim.itemDefinition(event.runeId);
        const reason = event.reason === 'equipment' ? 'equip an item in that slot first'
          : event.reason === 'level' ? 'level too low'
            : event.reason === 'slot' ? 'incompatible equipment slot'
              : event.reason === 'assigned' ? 'every copy is already bound'
                : event.reason === 'missing' ? 'not in pack' : 'cannot bind that rune';
        hud.toast(`${rune?.displayName ?? event.runeId}: ${reason}`, 'danger');
      } else if (event.type === 'item-blocked') {
        const item = this.sim.itemDefinition(event.itemId);
        const reason = event.reason === 'level' ? 'level too low'
          : event.reason === 'missing' ? 'not in pack'
            : event.reason === 'assigned' ? 'every copy is already assigned'
              : event.reason === 'full' ? 'already at full strength'
                : event.reason === 'condition' ? 'no matching condition to cure'
                  : event.reason === 'location' ? 'already at the hearth' : 'cannot use that';
        hud.toast(`${item?.displayName ?? event.itemId}: ${reason}`, 'danger');
      } else if (event.type === 'economy-transaction') {
        const item = this.sim.itemDefinition(event.itemId);
        const verb = event.action === 'buy' ? 'Bought' : event.action === 'sell' ? 'Sold' : 'Crafted';
        const gold = event.goldDelta === 0 ? '' : ` · ${event.goldDelta > 0 ? '+' : ''}${event.goldDelta}g`;
        hud.toast(`${verb} ${item?.displayName ?? event.itemId}${event.count > 1 ? ` x${event.count}` : ''}${gold}`);
        shouldSave = true;
      } else if (event.type === 'economy-blocked') {
        const definition = event.action === 'craft' ? this.sim.recipeDefinition(event.targetId) : this.sim.itemDefinition(event.targetId);
        const reason = ({
          merchant: 'not offered here', stock: 'not available', gold: 'not enough gold',
          items: 'missing materials', level: 'level too low', protected: 'cannot be traded', equipped: 'currently equipped',
        } as const)[event.reason];
        hud.toast(`${definition?.displayName ?? event.targetId}: ${reason}`, 'danger');
      } else if (event.type === 'player-hit') {
        const member = this.sim.party.find((candidate) => candidate.id === event.memberId); if (!member) continue;
        this.floatingText(member.x, member.y - 30, `−${event.amount}`, '#ff9b8e');
        this.showPlayerHitEffect(member);
        this.cameras.main.shake(100, 0.006);
      } else if (event.type === 'player-dodged') {
        const member = this.sim.party.find((candidate) => candidate.id === event.memberId); if (!member) continue;
        this.floatingText(member.x, member.y - 30, 'EVADE', '#a9e3d2');
        const view = this.partyViews.get(member.id);
        if (view) this.tweens.add({ targets: view.root, x: view.root.x - member.facing.y * 10, duration: 70, yoyo: true });
      } else if (event.type === 'monster-ability-telegraph') {
        const monster = this.sim.monsters.find((candidate) => candidate.uid === event.uid);
        if (monster) {
          const view = this.monsterViews.get(monster.uid);
          if (view) this.tweens.add({ targets: view.body, scale: 1.18, duration: 120, yoyo: true });
        }
      } else if (event.type === 'status-applied') {
        const member = this.sim.party.find((candidate) => candidate.id === event.memberId);
        if (member) hud.toast(`${member.name} is ${event.status === 'poison' ? 'poisoned' : event.status === 'gloom' ? 'shrouded in gloom' : event.status === 'drenched' ? 'drenched and slowed' : event.status === 'sunblind' ? 'sunblinded' : event.status === 'fractured' ? 'fractured and exposed' : event.status === 'muted' ? 'muted and cannot use skills' : event.status === 'severed' ? 'severed from non-health runes' : `affected by ${event.status}`}`, 'danger');
      } else if (event.type === 'status-damage') {
        const member = this.sim.party.find((candidate) => candidate.id === event.memberId); if (!member) continue;
        this.floatingText(member.x, member.y - 30, `-${event.amount} ${event.status.toUpperCase()}`, '#d6a1e2');
        const view = this.partyViews.get(member.id);
        if (view) this.tweens.add({ targets: view.root, alpha: 0.58, duration: 90, yoyo: true });
      } else if (event.type === 'status-cured') {
        const member = this.sim.party.find((candidate) => candidate.id === event.memberId);
        if (member) hud.toast(`${member.name} is free of ${event.status}`);
      } else if (event.type === 'job-changed') {
        const member = this.sim.party.find((candidate) => candidate.id === event.memberId);
        const job = this.sim.jobDefinition(event.jobId);
        hud.toast(`${member?.name ?? 'Party member'} became ${job?.displayName ?? event.jobId}`);
        this.bindSkillKeys();
        this.cameras.main.flash(320, 240, 205, 112, false);
        shouldSave = true;
      } else if (event.type === 'job-change-blocked') {
        const job = this.sim.jobDefinition(event.jobId);
        const reason = event.reason === 'level' ? `requires level ${job?.requiredLevel ?? 10}` : event.reason === 'gold' ? 'not enough gold' : event.reason === 'same' ? 'already follows this path' : 'path unavailable';
        hud.toast(`${job?.displayName ?? event.jobId}: ${reason}`, 'danger');
      } else if (event.type === 'mastery-changed') {
        const member = this.sim.party.find((candidate) => candidate.id === event.memberId);
        const mastery = this.sim.masteryDefinition(event.masteryId);
        hud.toast(`${member?.name ?? 'Party member'} mastered ${mastery?.displayName ?? event.masteryId}`);
        this.cameras.main.flash(360, 231, 197, 111, false);
        shouldSave = true;
      } else if (event.type === 'mastery-change-blocked') {
        const mastery = this.sim.masteryDefinition(event.masteryId);
        const reason = event.reason === 'level' ? `requires level ${mastery?.requiredLevel ?? 18}` : event.reason === 'gold' ? 'not enough gold' : event.reason === 'same' ? 'already mastered' : 'mastery unavailable for this path';
        hud.toast(`${mastery?.displayName ?? event.masteryId}: ${reason}`, 'danger');
      } else if (event.type === 'evolution-changed') {
        const member = this.sim.party.find((candidate) => candidate.id === event.memberId);
        const evolution = this.sim.evolutionDefinition(event.evolutionId);
        hud.toast(`${member?.name ?? 'Party member'} answered as ${evolution?.displayName ?? event.evolutionId}`);
        this.bindSkillKeys();
        this.cameras.main.flash(420, 213, 190, 117, false);
        shouldSave = true;
      } else if (event.type === 'evolution-change-blocked') {
        const evolution = this.sim.evolutionDefinition(event.evolutionId);
        const reason = event.reason === 'level' ? `requires level ${evolution?.requiredLevel ?? 28}`
          : event.reason === 'quest' ? 'complete the Convergence Rite'
            : event.reason === 'gold' ? 'not enough gold'
              : event.reason === 'same' ? 'already follows this calling' : 'calling unavailable';
        hud.toast(`${evolution?.displayName ?? event.evolutionId}: ${reason}`, 'danger');
      } else if (event.type === 'member-fainted') {
        const member = this.sim.party.find((candidate) => candidate.id === event.memberId);
        if (member) hud.toast(`${member.name} is down!`, 'danger');
      } else if (event.type === 'level-up') {
        hud.toast(`Party level ${event.level} · Four lanterns burn brighter!`);
        this.cameras.main.flash(360, 247, 211, 120, false);
        shouldSave = true;
      } else if (event.type === 'party-wiped') {
        hud.toast('The hearthlight returns your party to safety', 'danger');
        this.cameras.main.fadeOut(120, 70, 20, 20); this.time.delayedCall(150, () => this.cameras.main.fadeIn(400));
        shouldSave = true;
      }
    }
    if (shouldSave) this.saveSnapshot(false);
    if (campaignCompleted) this.showCampaignComplete();
    if (courierTarget) this.travelByCourier(courierTarget.mapId, courierTarget.spawn);
    else if (warpTarget) this.travelByCharm(warpTarget);
  }

  private showAttackEffect(event: Extract<SimEvent, { type: 'attack-swing' }>): void {
    const member = this.sim.party.find((candidate) => candidate.id === event.memberId);
    const target = this.sim.monsters.find((candidate) => candidate.uid === event.targetUid);
    if (!member || !target) return;

    const memberView = this.partyViews.get(member.id);
    if (memberView) {
      const lunge = event.automatic ? 5 : 9;
      this.tweens.add({
        targets: memberView.root,
        x: memberView.root.x + member.facing.x * lunge,
        y: memberView.root.y + member.facing.y * lunge,
        duration: 58,
        yoyo: true,
        ease: 'Quad.easeOut',
      });
    }

    if (isCloseCombatRole(member.role)) {
      const angle = Math.atan2(member.facing.y, member.facing.x);
      this.showSlashArc(member.x, member.y, angle, member.color, member.combo);
    } else {
      this.showProjectileTrail(member, target, member.role === 'magic' ? 10 : 5);
    }
  }

  private showSkillEffect(event: Extract<SimEvent, { type: 'skill-used' }>): void {
    const member = this.sim.party.find((candidate) => candidate.id === event.memberId);
    const skill = this.sim.skillDefinition(event.skillId);
    if (!member || !skill) return;
    this.floatingText(member.x, member.y - 38, skill.displayName, colorToHex(member.color));
    const targetUids = event.affectedUids ?? (event.targetUid ? [event.targetUid] : []);
    const effect = this.add.graphics().setDepth(FX_DEPTH);
    if (targetUids.length > 0) {
      effect.lineStyle(skill.type === 'magical' ? 6 : 3, member.color, 0.88);
      for (const uid of targetUids) {
        const target = this.sim.monsters.find((monster) => monster.uid === uid);
        if (!target) continue;
        if (skill.targetType === 'area') {
          this.showAreaSkillBloom(target.x, target.y, member.color);
        } else {
          this.showProjectileTrail(member, target, skill.type === 'magical' ? 12 : 7);
        }
        effect.lineBetween(member.x, member.y, target.x, target.y);
        effect.fillStyle(member.color, skill.targetType === 'area' ? 0.16 : 0.22).fillCircle(target.x, target.y, skill.targetType === 'area' ? 34 : 16);
        effect.lineStyle(2, member.color, 0.85).strokeCircle(target.x, target.y, skill.targetType === 'area' ? 34 : 16);
      }
    } else {
      const target = this.sim.party.find((candidate) => candidate.id === event.targetMemberId) ?? member;
      const isHeal = skill.effect.kind === 'heal';
      effect.fillStyle(isHeal ? 0x9ff0ae : member.color, 0.14).fillCircle(target.x, target.y, 30);
      effect.lineStyle(4, isHeal ? 0x9ff0ae : member.color, 0.9).strokeCircle(target.x, target.y, 30);
      this.showBuffRing(target.x, target.y, isHeal ? 0x9ff0ae : member.color);
    }
    this.tweens.add({ targets: effect, alpha: 0, duration: 480, ease: 'Cubic.easeOut', onComplete: () => effect.destroy() });
  }

  private floatingText(x: number, y: number, value: string, color: string): void {
    const text = this.add.text(x, y, value, { fontFamily: 'Arial', fontStyle: 'bold', fontSize: '16px', color, stroke: '#241c18', strokeThickness: 4 }).setOrigin(0.5).setDepth(FLOATING_TEXT_DEPTH);
    this.tweens.add({ targets: text, y: y - 32, alpha: 0, duration: 650, ease: 'Cubic.easeOut', onComplete: () => text.destroy() });
  }

  private showSlashArc(x: number, y: number, angle: number, color: number, combo: number): void {
    const radius = 38 + combo * 4;
    const effect = this.add.graphics().setDepth(FX_DEPTH);
    effect.lineStyle(10, 0xfff2c2, 0.8);
    effect.beginPath(); effect.arc(x, y, radius, angle - 0.86, angle + 0.76); effect.strokePath();
    effect.lineStyle(4, color, 0.95);
    effect.beginPath(); effect.arc(x, y, radius + 5, angle - 0.66, angle + 0.56); effect.strokePath();
    effect.fillStyle(color, 0.22).fillCircle(x + Math.cos(angle) * 26, y + Math.sin(angle) * 26, 18);
    this.tweens.add({
      targets: effect,
      alpha: 0,
      scaleX: 1.16,
      scaleY: 1.16,
      duration: 180,
      ease: 'Cubic.easeOut',
      onComplete: () => effect.destroy(),
    });
  }

  private showProjectileTrail(member: PlayerState, target: MonsterState, impactRadius: number): void {
    const dx = target.x - member.x;
    const dy = target.y - member.y;
    const angle = Math.atan2(dy, dx);
    const effect = this.add.graphics().setDepth(FX_DEPTH);
    effect.lineStyle(member.role === 'magic' ? 7 : 4, member.color, 0.86).lineBetween(member.x, member.y, target.x, target.y);
    effect.lineStyle(2, 0xfff3bd, 0.72).lineBetween(member.x + Math.sin(angle) * 5, member.y - Math.cos(angle) * 5, target.x, target.y);
    effect.fillStyle(member.color, 0.9).fillCircle(target.x, target.y, impactRadius);
    effect.fillStyle(0xfff3bd, 0.72).fillCircle(target.x, target.y, Math.max(3, impactRadius * 0.45));
    this.tweens.add({ targets: effect, alpha: 0, duration: member.role === 'magic' ? 280 : 190, ease: 'Cubic.easeOut', onComplete: () => effect.destroy() });
  }

  private showImpactBurst(x: number, y: number, color: number, scale: number): void {
    const burst = this.add.graphics().setDepth(FX_DEPTH + 1);
    burst.lineStyle(2, 0xfff0c0, 0.9).strokeCircle(x, y, 12 * scale);
    burst.fillStyle(color, 0.22).fillCircle(x, y, 18 * scale);
    for (let i = 0; i < 8; i += 1) {
      const angle = (Math.PI * 2 * i) / 8;
      burst.lineStyle(2, color, 0.75).lineBetween(x + Math.cos(angle) * 8, y + Math.sin(angle) * 8, x + Math.cos(angle) * 22 * scale, y + Math.sin(angle) * 22 * scale);
    }
    this.tweens.add({ targets: burst, alpha: 0, scaleX: 1.35, scaleY: 1.35, duration: 260, ease: 'Cubic.easeOut', onComplete: () => burst.destroy() });
  }

  private showAreaSkillBloom(x: number, y: number, color: number): void {
    const bloom = this.add.graphics().setDepth(FX_DEPTH - 1);
    bloom.fillStyle(color, 0.1).fillCircle(x, y, 42);
    bloom.lineStyle(3, color, 0.72).strokeCircle(x, y, 42);
    bloom.lineStyle(1, 0xfff0c0, 0.55).strokeCircle(x, y, 27);
    this.tweens.add({ targets: bloom, alpha: 0, scaleX: 1.45, scaleY: 1.45, duration: 520, ease: 'Cubic.easeOut', onComplete: () => bloom.destroy() });
  }

  private showBuffRing(x: number, y: number, color: number): void {
    const ring = this.add.graphics().setDepth(FX_DEPTH);
    ring.lineStyle(4, color, 0.9).strokeCircle(x, y, 24);
    ring.lineStyle(2, 0xfff3bd, 0.7).strokeCircle(x, y, 16);
    this.tweens.add({ targets: ring, y: -18, alpha: 0, scaleX: 1.28, scaleY: 1.28, duration: 560, ease: 'Cubic.easeOut', onComplete: () => ring.destroy() });
  }

  private showHealPulse(member: PlayerState): void {
    this.showBuffRing(member.x, member.y, 0x9ff0ae);
    const motes = this.add.graphics().setDepth(FX_DEPTH + 1);
    for (let i = 0; i < 6; i += 1) {
      const angle = (Math.PI * 2 * i) / 6;
      motes.fillStyle(0xdaf7bf, 0.9).fillCircle(member.x + Math.cos(angle) * 18, member.y + Math.sin(angle) * 12, 3);
    }
    this.tweens.add({ targets: motes, y: -22, alpha: 0, duration: 620, ease: 'Sine.easeOut', onComplete: () => motes.destroy() });
  }

  private showPlayerHitEffect(member: PlayerState): void {
    const hit = this.add.graphics().setDepth(FX_DEPTH + 2);
    hit.lineStyle(5, 0xff9b8e, 0.82).lineBetween(member.x - 16, member.y - 18, member.x + 16, member.y + 12);
    hit.lineStyle(3, 0xfff0c0, 0.72).lineBetween(member.x + 13, member.y - 18, member.x - 11, member.y + 10);
    hit.fillStyle(0xff5544, 0.16).fillCircle(member.x, member.y - 2, 24);
    this.tweens.add({ targets: hit, alpha: 0, scaleX: 1.15, scaleY: 1.15, duration: 220, ease: 'Cubic.easeOut', onComplete: () => hit.destroy() });
  }

  private nearestNpc(): NpcView | undefined {
    return this.npcViews.filter((npc) => distance(npc.placement.position, this.sim.player) <= INTERACT_RANGE)
      .sort((a, b) => distance(a.placement.position, this.sim.player) - distance(b.placement.position, this.sim.player))[0];
  }
  private nearestPortal(): MapPortal | undefined {
    return this.map.portals.filter((portal) => distance(portal.position, this.sim.player) <= INTERACT_RANGE)
      .sort((a, b) => distance(a.position, this.sim.player) - distance(b.position, this.sim.player))[0];
  }

  private interact(): void {
    if (this.activeDialogue) {
      if (this.activeDialogue.definition.role === 'merchant' || this.activeDialogue.definition.role === 'trainer' || this.activeDialogue.definition.role === 'warp') {
        this.closeActiveInteraction();
        return;
      }
      this.activeDialogue.dialogueIndex += 1;
      if (this.activeDialogue.dialogueIndex >= this.activeDialogue.definition.dialogue.length) {
        this.activeDialogue.dialogueIndex = 0; this.activeDialogue = null; hud.hideDialogue();
      } else {
        hud.showDialogue(this.activeDialogue.definition, this.activeDialogue.definition.dialogue[this.activeDialogue.dialogueIndex]);
      }
      return;
    }
    const npc = this.nearestNpc();
    if (npc) {
      const events = this.sim.interactWithNpc(npc.definition);
      this.handleEvents(events);
      if (this.campaignOpen) return;
      this.activeDialogue = npc;
      if ((npc.definition.role === 'merchant' && this.sim.shopDefinition(npc.definition.id)) || npc.definition.role === 'trainer' || npc.definition.role === 'warp') hud.hideDialogue();
      else hud.showDialogue(npc.definition, npc.definition.dialogue[npc.dialogueIndex] ?? 'The vale is quiet today.');
      return;
    }
    const resource = this.sim.nearestResource(INTERACT_RANGE);
    if (resource) this.handleEvents(this.sim.gatherResource(resource.definition.id));
  }

  private closeActiveInteraction(): void {
    if (this.activeDialogue) this.activeDialogue.dialogueIndex = 0;
    this.activeDialogue = null;
    hud.hideDialogue();
  }

  private travelThroughPortal(portal: MapPortal): void {
    if (portal.requiredLevel && this.sim.player.level < portal.requiredLevel) { hud.toast(`Reach level ${portal.requiredLevel} to travel there`, 'danger'); return; }
    if (portal.requiredQuestId && !this.sim.isQuestCompleted(portal.requiredQuestId)) {
      const quest = this.sim.questDefinition(portal.requiredQuestId);
      hud.toast(`Complete ${quest?.displayName ?? 'the required quest'} first`, 'danger');
      return;
    }
    if (portal.requiredQuestStartedId && !this.sim.isQuestStarted(portal.requiredQuestStartedId)) {
      const quest = this.sim.questDefinition(portal.requiredQuestStartedId);
      hud.toast(`Accept ${quest?.displayName ?? 'the required quest'} first`, 'danger');
      return;
    }
    const target = this.gameData.maps.find((map) => map.id === portal.targetMapId);
    if (!target) { hud.toast('That road is not ready yet', 'danger'); return; }
    this.transitioning = true; hud.hideDialogue();
    this.cameras.main.fadeOut(320, 10, 23, 19);
    const party = this.sim.party.map((member) => ({
      ...member,
      facing: { ...member.facing },
      skillIds: [...member.skillIds],
      skillCooldowns: { ...member.skillCooldowns },
      activeEffects: member.activeEffects.map((effect) => ({ ...effect })),
    }));
    this.time.delayedCall(330, () => this.scene.restart({
      mapId: target.id,
      spawn: portal.targetSpawn,
      party,
      inventory: this.sim.inventory,
      quests: this.sim.quests,
      gold: this.sim.gold,
      equipment: this.sim.equipment,
      sockets: this.sim.sockets,
      discoveredMapIds: this.sim.discoveredMapIds,
      resourceCooldowns: this.sim.resourceCooldowns,
      trackedQuestId: this.trackedQuestId,
    }));
  }

  private travelByCharm(warpTarget: string): void {
    const targetMapId = warpTarget === 'warp_hearthvale' ? 'hearthvale_town_ro' : warpTarget;
    const target = this.gameData.maps.find((map) => map.id === targetMapId);
    if (!target) { hud.toast('The charm cannot find its hearth', 'danger'); return; }
    this.transitioning = true;
    this.closeActiveInteraction();
    hud.toast('Hearthlight carries the party home');
    this.cameras.main.fadeOut(360, 233, 190, 103);
    const party = this.sim.party.map((member) => ({
      ...member,
      facing: { ...member.facing },
      skillIds: [...member.skillIds],
      skillCooldowns: { ...member.skillCooldowns },
      activeEffects: member.activeEffects.map((effect) => ({ ...effect })),
    }));
    this.time.delayedCall(370, () => this.scene.restart({
      mapId: target.id,
      spawn: target.playerSpawn,
      party,
      inventory: this.sim.inventory,
      quests: this.sim.quests,
      gold: this.sim.gold,
      equipment: this.sim.equipment,
      sockets: this.sim.sockets,
      discoveredMapIds: this.sim.discoveredMapIds,
      resourceCooldowns: this.sim.resourceCooldowns,
      trackedQuestId: this.trackedQuestId,
    }));
  }

  private travelByCourier(targetMapId: string, spawn: Vec2): void {
    const target = this.gameData.maps.find((map) => map.id === targetMapId);
    if (!target) { hud.toast('The hearthline has lost its destination', 'danger'); return; }
    this.transitioning = true;
    this.closeActiveInteraction();
    this.cameras.main.fadeOut(360, 78, 169, 164);
    const party = this.sim.party.map((member) => ({
      ...member,
      facing: { ...member.facing },
      skillIds: [...member.skillIds],
      skillCooldowns: { ...member.skillCooldowns },
      activeEffects: member.activeEffects.map((effect) => ({ ...effect })),
    }));
    this.time.delayedCall(370, () => this.scene.restart({
      mapId: target.id,
      spawn,
      party,
      inventory: this.sim.inventory,
      quests: this.sim.quests,
      gold: this.sim.gold,
      equipment: this.sim.equipment,
      sockets: this.sim.sockets,
      discoveredMapIds: this.sim.discoveredMapIds,
      resourceCooldowns: this.sim.resourceCooldowns,
      trackedQuestId: this.trackedQuestId,
    }));
  }

  private saveSnapshot(notify: boolean): void {
    if (!this.sim || this.transitioning) return;
    if (this.previewMode) {
      this.saveTimer = 0;
      return;
    }
    const save = saveGame(this.map.id, this.sim.party, this.sim.inventory, this.sim.quests, this.sim.gold, this.sim.equipment, this.sim.discoveredMapIds, this.sim.resourceCooldowns, this.trackedQuestId, this.sim.sockets);
    this.saveTimer = 0;
    if (save) {
      hud.setSaveStatus(`Saved ${formatSaveTime(save.savedAt)}`);
      if (notify) hud.toast('Journey saved');
    } else if (notify) {
      hud.toast('Save storage is unavailable', 'danger');
    }
  }

  private showCampaignComplete(): void {
    this.campaignOpen = true;
    this.closeActiveInteraction();
    hud.setMobilePackOpen(false);
    hud.setJournalOpen(false);
    hud.setLoadoutOpen(false);
    hud.setWorldMapOpen(false);
    const visibleMaps = this.gameData.maps.filter((map) => map.regionId === this.map.regionId && map.showOnWorldMap);
    const discovered = new Set(this.sim.discoveredMapIds);
    hud.showCampaignComplete({
      level: this.sim.player.level,
      exploredMaps: visibleMaps.filter((map) => discovered.has(map.id)).length,
      totalMaps: visibleMaps.length,
      completedQuests: this.sim.quests.filter((quest) => quest.status === 'completed').length,
    });
    this.cameras.main.flash(520, 246, 220, 145, false);
  }

  private exitToTitle(): void {
    this.saveSnapshot(false);
    this.transitioning = true;
    hud.hideDialogue();
    hud.setSkillHandler();
    hud.setItemHandler();
    hud.setCampaignOpen(false);
    hud.setCampaignHandler();
    hud.setWarpHandler();
    hud.setLoadoutOpen(false);
    hud.setLoadoutHandler();
    hud.setJobHandler();
    hud.setEconomyHandler();
    hud.setWorldMapOpen(false);
    hud.setWorldMapHandler();
    hud.setSaveHandler();
    this.cameras.main.fadeOut(250, 14, 28, 24);
    this.time.delayedCall(260, () => this.scene.start('Title'));
  }
}
