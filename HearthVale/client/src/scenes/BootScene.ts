import Phaser from 'phaser';
import { audioService } from '../services/AudioService.js';
import { loadCatalog } from '../services/catalogData.js';
import { getMapById, loadMonsterCatalog, loadWorldMaps } from '../services/worldData.js';
import { WorldScene } from './WorldScene.js';
import { INITIAL_MAP_ID } from '../constants.js';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    this.cameras.main.setBackgroundColor('#1a1520');
    const { width, height } = this.scale;
    this.add
      .text(width / 2, height / 2, 'Loading HearthVale…', {
        fontFamily: 'Georgia, serif',
        fontSize: '24px',
        color: '#e8dcc8',
      })
      .setOrigin(0.5);

    // Original, local SVG atlases. These sit in Vite's public directory so the
    // same relative paths work in the browser and the offline Capacitor build.
    this.load.image('atlas_hearthvale_characters', './assets/hearthvale-characters.svg');
    this.load.image('atlas_hearthvale_world', './assets/hearthvale-world.svg');
  }

  async create(): Promise<void> {
    try {
      this.registerAtlasFrames();
      this.registerWorldAnimations();
      await Promise.all([loadWorldMaps(), loadCatalog(), loadMonsterCatalog()]);
      await audioService.load();
      const startMap = getMapById(INITIAL_MAP_ID);
      if (!startMap) {
        throw new Error(`Missing start map: ${INITIAL_MAP_ID}`);
      }
      this.scene.start('WorldScene', {
        mapId: INITIAL_MAP_ID,
        spawn: { ...startMap.playerSpawn },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown load error';
      this.add
        .text(this.scale.width / 2, this.scale.height / 2 + 40, message, {
          fontFamily: 'monospace',
          fontSize: '14px',
          color: '#ff8888',
          wordWrap: { width: this.scale.width - 40 },
          align: 'center',
        })
        .setOrigin(0.5);
    }
  }

  private registerWorldAnimations(): void {
    const characterAtlas = 'atlas_hearthvale_characters';
    const walkingDirections = [
      ['down', ['player_down_0', 'player_down_1']],
      ['up', ['player_up_0', 'player_up_1']],
      ['left', ['player_left_0', 'player_left_1']],
      ['right', ['player_right_0', 'player_right_1']],
    ] as const;

    for (const [direction, frames] of walkingDirections) {
      const key = `player_walk_${direction}`;
      if (!this.anims.exists(key)) {
        this.anims.create({
          key,
          frames: frames.map((frame) => ({ key: characterAtlas, frame })),
          frameRate: 6,
          repeat: -1,
        });
      }
    }
  }

  private registerAtlasFrames(): void {
    const addFrames = (key: string, frames: string[], row = 0): void => {
      const texture = this.textures.get(key);
      for (let index = 0; index < frames.length; index += 1) {
        const frame = frames[index];
        if (!texture.has(frame)) {
          texture.add(frame, 0, index * 48, row * 48, 48, 48);
        }
      }
    };

    addFrames('atlas_hearthvale_characters', [
      'player_down_0', 'player_down_1', 'player_up_0', 'player_up_1',
      'player_left_0', 'player_left_1', 'player_right_0', 'player_right_1',
    ]);
    addFrames('atlas_hearthvale_characters', [
      'npc_quest', 'npc_merchant', 'npc_trainer', 'npc_warp', 'npc_flavor',
    ], 1);
    addFrames('atlas_hearthvale_world', [
      'prop_tree', 'prop_cottage', 'prop_crystal', 'prop_fence', 'prop_crate',
      'prop_lantern', 'prop_moonwell', 'portal_0',
    ]);
  }
}
