import Phaser from 'phaser';
import { loadGameData } from '../../game/data/loader.js';
import { ACTOR_SPRITE_ASSETS, ACTOR_SPRITE_FRAME } from '../view/ActorSprites.js';

export class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }

  preload(): void {
    for (const asset of Object.values(ACTOR_SPRITE_ASSETS)) {
      this.load.spritesheet(asset.key, asset.path, {
        frameWidth: ACTOR_SPRITE_FRAME.width,
        frameHeight: ACTOR_SPRITE_FRAME.height,
      });
    }
  }

  create(): void {
    const { width, height } = this.scale;
    const title = this.add.text(width / 2, height / 2 - 24, 'Lighting the vale…', {
      fontFamily: 'Georgia, serif', fontSize: '28px', color: '#f6e7ba',
    }).setOrigin(0.5);
    this.add.text(width / 2, height / 2 + 22, 'Gathering maps, folk, and field creatures', {
      fontFamily: 'Arial, sans-serif', fontSize: '13px', color: '#9bb8aa', letterSpacing: 1,
    }).setOrigin(0.5);
    loadGameData().then((data) => {
      this.registry.set('gameData', data);
      this.scene.start('Title');
    }).catch((error: unknown) => {
      console.error(error);
      title.setText('The lantern went out.\nCould not load HearthVale data.').setColor('#ffb4a8').setAlign('center');
    });
  }
}
