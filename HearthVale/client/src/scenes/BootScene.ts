import Phaser from 'phaser';
import { audioService } from '../services/AudioService.js';
import { loadWorldMaps, getMapById } from '../services/worldData.js';
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
  }

  async create(): Promise<void> {
    try {
      await loadWorldMaps();
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
}
