import Phaser from 'phaser';
import type { GameData } from '../../game/data/types.js';
import { deleteSave, formatSaveTime, loadSave } from '../../game/persistence/saveStore.js';
import { hud } from '../../ui/Hud.js';

export class TitleScene extends Phaser.Scene {
  constructor() { super('Title'); }

  create(): void {
    hud.setVisible(false);
    hud.hideDialogue();
    hud.setCampaignOpen(false);
    hud.setJournalOpen(false);
    hud.setWorldMapOpen(false);
    const { width, height } = this.scale;
    const compact = width < 900;
    const titleSize = compact ? '32px' : '92px';
    const save = loadSave();
    const previewParams = new URLSearchParams(window.location.search);
    const previewMapId = previewParams.get('previewMap');
    const previewMerchantNpcId = previewParams.get('previewShop');
    const previewTrainerNpcId = previewParams.get('previewTrainer')
      ?? (previewParams.has('previewEvolution') ? 'pathweaver_ione' : null);
    const previewWarpNpcId = previewParams.get('previewWarp');
    const previewLevel = Number(previewParams.get('previewLevel') ?? 0) || undefined;
    const previewSkillLoadout = previewParams.has('previewSkillLoadout');
    const previewRunes = previewParams.has('previewRunes');
    const previewEvolution = previewParams.has('previewEvolution');
    const previewMastery = previewParams.has('previewMastery') || previewSkillLoadout || previewEvolution;
    const previewX = Number(previewParams.get('previewX'));
    const previewY = Number(previewParams.get('previewY'));
    const previewSpawn = Number.isFinite(previewX) && Number.isFinite(previewY)
      && previewParams.has('previewX') && previewParams.has('previewY')
      ? { x: previewX, y: previewY }
      : undefined;
    const previewWorldMap = previewParams.has('previewWorldMap');
    const previewLoadout = previewParams.has('previewLoadout') || previewSkillLoadout || previewRunes;
    const previewBranch = previewParams.get('previewBranch');
    const previewJournal = previewParams.has('previewJournal') || previewBranch === 'mercy' || previewBranch === 'vigil';
    const previewConsumables = previewParams.has('previewConsumables');
    const previewCampaignComplete = previewParams.has('previewCampaignComplete');
    const previewFreeze = previewParams.has('previewFreeze');
    const previewDiscoveredMapIds = previewParams.get('previewDiscovered')?.split(',').filter(Boolean);
    const gameData = this.registry.get('gameData') as GameData | undefined;
    const campaignComplete = Boolean(save?.quests.some((state) => state.status === 'completed'
      && gameData?.quests.some((quest) => quest.id === state.questId && quest.completesCampaign)));
    const previewNpcId = previewMerchantNpcId ?? previewTrainerNpcId ?? previewWarpNpcId;
    const previewMap = previewMapId
      ? gameData?.maps?.find((map) => map.id === previewMapId)
      : previewNpcId
        ? gameData?.maps?.find((map) => map.npcs.some((npc) => npc.npcId === previewNpcId))
        : undefined;
    if (previewMap) {
      const previewBranchQuests = previewBranch === 'mercy' ? [
        { questId: 'quest_sunspire_lens', status: 'completed' as const, progress: 1, target: 1, objectiveProgress: {} },
        {
          questId: 'quest_highlands_mercy', status: 'active' as const, progress: 5, target: 14,
          objectiveProgress: { reach_aurora_mercy: 1, free_prismwings: 2, gather_aurora_silk: 1, gather_dawnsage_mercy: 1 },
        },
      ] : previewBranch === 'vigil' ? [
        { questId: 'quest_sunspire_lens', status: 'completed' as const, progress: 1, target: 1, objectiveProgress: {} },
        {
          questId: 'quest_highlands_vigil', status: 'active' as const, progress: 4, target: 16,
          objectiveProgress: { reach_aurora_vigil: 1, break_sunforge_herd: 1, turn_horizon_raptors: 1, gather_sunmetal_vigil: 1, recover_horizon_talons: 0 },
        },
      ] : previewEvolution ? [
        { questId: 'quest_convergence_rite', status: 'completed' as const, progress: 1, target: 1, objectiveProgress: {} },
      ] : previewSkillLoadout ? [
        { questId: 'quest_crownroot_concordance', status: 'completed' as const, progress: 1, target: 1, objectiveProgress: {} },
      ] : undefined;
      const previewNpc = previewNpcId
        ? previewMap.npcs.find((npc) => npc.npcId === previewNpcId)
        : undefined;
      this.time.delayedCall(0, () => this.scene.start('World', {
        mapId: previewMap.id,
        spawn: previewNpc ? { x: previewNpc.position.x + 42, y: previewNpc.position.y } : previewSpawn ?? previewMap.playerSpawn,
        previewMerchantNpcId: previewMerchantNpcId ? previewNpc?.npcId : undefined,
        previewTrainerNpcId: previewTrainerNpcId ? previewNpc?.npcId : undefined,
        previewWarpNpcId: previewWarpNpcId ? previewNpc?.npcId : undefined,
        previewLevel: previewLevel ?? (previewEvolution ? 28 : previewCampaignComplete ? 14 : undefined),
        previewMastery,
        previewEvolution,
        previewWorldMap,
        previewLoadout,
        previewRunes,
        previewJournal,
        previewConsumables,
        previewCampaignComplete,
        previewFreeze,
        inventory: previewRunes ? [
          { itemId: 'runesmith_maul', count: 1 },
          { itemId: 'bellglass_ward', count: 1 },
          { itemId: 'hollowstar_circlet', count: 1 },
          { itemId: 'veilguard_mantle', count: 1 },
          { itemId: 'concordance_band', count: 1 },
          { itemId: 'embermark_rune', count: 1 },
          { itemId: 'bastion_rune', count: 1 },
          { itemId: 'heartroot_rune', count: 1 },
          { itemId: 'galescript_rune', count: 1 },
          { itemId: 'seer_rune', count: 1 },
        ] : previewLoadout ? [
          { itemId: 'wooden_blade', count: 1 },
          { itemId: 'clover_dagger', count: 1 },
          { itemId: 'gale_bow', count: 1 },
          { itemId: 'crystal_edge', count: 1 },
          { itemId: 'bark_buckler', count: 1 },
          { itemId: 'crystal_ward', count: 1 },
          { itemId: 'leather_cap', count: 1 },
          { itemId: 'miners_helm', count: 1 },
          { itemId: 'traveler_tunic', count: 1 },
          { itemId: 'spore_weave_vest', count: 1 },
          { itemId: 'clover_charm', count: 1 },
          { itemId: 'moonstone_ring', count: 1 },
        ] : previewConsumables ? [
          { itemId: 'healing_brew', count: 2 },
          { itemId: 'mana_draught', count: 2 },
          { itemId: 'stamina_snack', count: 3 },
          { itemId: 'antidote_leaf', count: 2 },
          { itemId: 'warding_incense', count: 1 },
          { itemId: 'gale_tonic', count: 1 },
          { itemId: 'hearth_charm', count: 1 },
        ] : undefined,
        equipment: previewRunes ? {
          warden: { weapon: 'runesmith_maul', offhand: 'bellglass_ward', head: 'hollowstar_circlet', body: 'veilguard_mantle', accessory: 'concordance_band' },
          ranger: {}, channeler: {}, mender: {},
        } : previewLoadout ? {
          warden: { weapon: 'wooden_blade', offhand: 'bark_buckler', head: 'leather_cap', body: 'traveler_tunic', accessory: 'clover_charm' },
          ranger: { weapon: 'gale_bow' },
          channeler: { accessory: 'moonstone_ring' },
          mender: {},
        } : undefined,
        quests: previewBranchQuests ?? (previewJournal ? [
          { questId: 'quest_glasswind_beacon', status: 'completed', progress: 10, target: 10, objectiveProgress: {} },
          {
            questId: 'quest_tidebreak_road', status: 'active', progress: 8, target: 16,
            objectiveProgress: { reach_tidebreak: 1, gather_stormreed: 4, clear_brinewings: 3, break_surgeclaws: 0, turn_galehorns: 0, recover_charged_pearls: 0 },
          },
        ] : undefined),
        trackedQuestId: previewBranch === 'mercy' || previewBranch === 'vigil'
          ? `quest_highlands_${previewBranch}`
          : previewJournal ? 'quest_tidebreak_road' : undefined,
        discoveredMapIds: previewDiscoveredMapIds,
        preview: true,
      }));
    }
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x102521, 0x102521, 0x1d302a, 0x1d302a, 1);
    bg.fillRect(0, 0, width, height);
    for (let i = 0; i < 28; i += 1) {
      const x = (i * 173) % width; const y = 80 + ((i * 97) % Math.max(100, height - 160));
      const light = this.add.circle(x, y, 2 + (i % 3), 0xf4c768, 0.22 + (i % 4) * 0.08);
      this.tweens.add({ targets: light, alpha: 0.08, y: y - 24, yoyo: true, repeat: -1, duration: 1900 + i * 83 });
    }
    this.add.text(width / 2, height * 0.32, 'HEARTHVALE', {
      fontFamily: 'Georgia, serif', fontSize: titleSize, color: '#f6e5b7',
      stroke: '#5e4329', strokeThickness: 2, letterSpacing: compact ? 2 : 8,
    }).setOrigin(0.5);
    this.add.text(width / 2, height * 0.32 + (compact ? 52 : 72), 'L A N T E R N B O U N D', {
      fontFamily: 'Arial, sans-serif', fontSize: compact ? '11px' : '14px', color: '#e3b85f', letterSpacing: compact ? 2 : 5,
    }).setOrigin(0.5);
    const tagline = campaignComplete
      ? compact ? 'Hearthlight Restored\nThe vale remains yours to explore' : 'Hearthlight Restored · The vale remains yours to explore'
      : compact ? 'A cozy solo adventure\nthrough Hearthlight Vale' : 'A cozy solo adventure through Hearthlight Vale';
    this.add.text(width / 2, height * 0.57, tagline, {
      fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: compact ? '17px' : '20px', color: '#a9c6b7',
      align: 'center', wordWrap: { width: Math.max(240, width - 48) },
    }).setOrigin(0.5);
    const primaryLabel = campaignComplete ? '  CONTINUE EPILOGUE  ' : save ? '  CONTINUE JOURNEY  ' : '  BEGIN JOURNEY  ';
    const button = this.add.text(width / 2, height * 0.68, primaryLabel, {
      fontFamily: 'Arial, sans-serif', fontStyle: 'bold', fontSize: '16px', color: '#15251f',
      backgroundColor: '#e8c46d', padding: { x: 24, y: 15 }, letterSpacing: 2,
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    button.on('pointerover', () => button.setStyle({ backgroundColor: '#f5d98c' }));
    button.on('pointerout', () => button.setStyle({ backgroundColor: '#e8c46d' }));
    button.on('pointerdown', () => this.begin(Boolean(save)));
    this.input.keyboard?.once('keydown-ENTER', () => this.begin(Boolean(save)));

    if (save) {
      this.add.text(width / 2, height * 0.68 + 58, `Saved ${formatSaveTime(save.savedAt)}`, {
        fontFamily: 'Arial, sans-serif', fontSize: '11px', color: '#86a696', letterSpacing: 1,
      }).setOrigin(0.5);
      const newGame = this.add.text(width / 2 - 70, height * 0.68 + 96, 'NEW GAME', {
        fontFamily: 'Arial, sans-serif', fontStyle: 'bold', fontSize: '12px', color: '#dfc37d', letterSpacing: 2,
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });
      const clear = this.add.text(width / 2 + 78, height * 0.68 + 96, 'CLEAR SAVE', {
        fontFamily: 'Arial, sans-serif', fontStyle: 'bold', fontSize: '12px', color: '#b98578', letterSpacing: 2,
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });
      newGame.on('pointerdown', () => this.begin(false));
      clear.on('pointerdown', () => { deleteSave(); this.scene.restart(); });
    }
    this.add.text(width / 2, height - 34, 'Built from HearthVale world data · Phaser Edition', {
      fontFamily: 'Arial, sans-serif', fontSize: compact ? '9px' : '11px', color: '#6f8f80', letterSpacing: compact ? 0 : 1,
      align: 'center', wordWrap: { width: Math.max(240, width - 40) },
    }).setOrigin(0.5);

    const multiplayerButton = this.add.text(width / 2, height * 0.68 + (save ? 130 : 60), '  MULTIPLAYER (local server)  ', {
      fontFamily: 'Arial, sans-serif', fontStyle: 'bold', fontSize: '13px', color: '#cfe3da',
      backgroundColor: '#25423a', padding: { x: 16, y: 10 }, letterSpacing: 1,
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    multiplayerButton.on('pointerover', () => multiplayerButton.setStyle({ backgroundColor: '#2f5147' }));
    multiplayerButton.on('pointerout', () => multiplayerButton.setStyle({ backgroundColor: '#25423a' }));
    multiplayerButton.on('pointerdown', () => this.openMultiplayerPanel());
  }

  private openMultiplayerPanel(): void {
    const { width, height } = this.scale;
    const overlay = this.add.dom(width / 2, height / 2).createFromHTML(`
      <div style="
        width: 280px; padding: 20px; border-radius: 10px; background: #16261f;
        border: 1px solid #3a5a4d; font-family: Arial, sans-serif; color: #e7ddc7;
        box-shadow: 0 8px 24px rgba(0,0,0,0.4);
      ">
        <div style="font-weight: bold; letter-spacing: 1px; margin-bottom: 10px;">MULTIPLAYER LOGIN</div>
        <input id="mp-username" placeholder="username" autocomplete="off" style="
          width: 100%; box-sizing: border-box; margin-bottom: 8px; padding: 8px;
          border-radius: 4px; border: 1px solid #3a5a4d; background: #0f1c17; color: #e7ddc7;
        " />
        <input id="mp-password" placeholder="password" type="password" style="
          width: 100%; box-sizing: border-box; margin-bottom: 10px; padding: 8px;
          border-radius: 4px; border: 1px solid #3a5a4d; background: #0f1c17; color: #e7ddc7;
        " />
        <div style="display: flex; gap: 8px; margin-bottom: 8px;">
          <button id="mp-login" style="flex:1; padding: 8px; border-radius: 4px; border: none; background: #e8c46d; color:#15251f; font-weight:bold; cursor:pointer;">Login</button>
          <button id="mp-register" style="flex:1; padding: 8px; border-radius: 4px; border: none; background: #3a5a4d; color:#e7ddc7; font-weight:bold; cursor:pointer;">Register</button>
        </div>
        <div id="mp-status" style="font-size: 11px; min-height: 14px; color: #d99; margin-bottom: 6px;"></div>
        <button id="mp-close" style="width:100%; padding: 6px; border-radius: 4px; border: 1px solid #3a5a4d; background: transparent; color:#86a696; cursor:pointer;">Cancel</button>
      </div>
    `).setDepth(20000);

    const root = overlay.node as HTMLElement;
    const usernameInput = root.querySelector<HTMLInputElement>('#mp-username')!;
    const passwordInput = root.querySelector<HTMLInputElement>('#mp-password')!;
    const statusEl = root.querySelector<HTMLElement>('#mp-status')!;
    const serverUrl = 'ws://localhost:2567';
    const httpUrl = 'http://localhost:2567';

    const submit = async (endpoint: 'login' | 'register') => {
      const username = usernameInput.value.trim();
      const password = passwordInput.value;
      if (username.length < 3 || password.length < 6) {
        statusEl.textContent = 'Username 3+ chars, password 6+ chars.';
        return;
      }
      statusEl.style.color = '#cfe3da';
      statusEl.textContent = endpoint === 'login' ? 'Logging in...' : 'Creating account...';
      try {
        const res = await fetch(`${httpUrl}/auth/${endpoint}`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ username, password }),
        });
        const body = await res.json();
        if (!res.ok) {
          statusEl.style.color = '#d99';
          statusEl.textContent = body.error === 'username_taken' ? 'That username is taken.'
            : body.error === 'invalid_credentials' && endpoint === 'login' ? 'Wrong username or password.'
              : 'Could not sign in — check the fields.';
          return;
        }
        overlay.destroy();
        this.scene.start('MultiplayerWorld', {
          serverUrl,
          token: body.token,
          username: body.username,
          mapId: typeof body.mapId === 'string' ? body.mapId : 'hearthvale_town',
        });
      } catch {
        statusEl.style.color = '#d99';
        statusEl.textContent = `Can't reach the local server — run "npm run dev:server" first.`;
      }
    };

    root.querySelector<HTMLButtonElement>('#mp-login')!.addEventListener('click', () => { void submit('login'); });
    root.querySelector<HTMLButtonElement>('#mp-register')!.addEventListener('click', () => { void submit('register'); });
    root.querySelector<HTMLButtonElement>('#mp-close')!.addEventListener('click', () => overlay.destroy());
  }

  private begin(continueSave: boolean): void {
    if (this.scene.isActive('World')) return;
    const save = continueSave ? loadSave() : null;
    this.cameras.main.fadeOut(350, 14, 28, 24);
    this.time.delayedCall(360, () => this.scene.start('World', save ? {
      mapId: save.mapId,
      party: save.party,
      inventory: save.inventory,
      quests: save.quests,
      gold: save.gold,
      equipment: save.equipment,
      sockets: save.sockets,
      discoveredMapIds: save.discoveredMapIds,
      resourceCooldowns: save.resourceCooldowns,
      trackedQuestId: save.trackedQuestId,
      spawn: save.party[0],
    } : { mapId: 'hearthvale_town_ro' }));
  }
}
