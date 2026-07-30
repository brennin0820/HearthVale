import Phaser from 'phaser';
import { BootScene } from './phaser/scenes/BootScene.js';
import { TitleScene } from './phaser/scenes/TitleScene.js';
import { WorldScene } from './phaser/scenes/WorldScene.js';
import { MultiplayerWorldScene } from './phaser/scenes/MultiplayerWorldScene.js';
import { applySettings } from './game/persistence/saveStore.js';
import { hud } from './ui/Hud.js';
import './styles.css';

applySettings();
hud.mount();

new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: window.innerWidth,
  height: window.innerHeight,
  backgroundColor: '#10231e',
  render: { antialias: true, pixelArt: false, roundPixels: true },
  scale: { mode: Phaser.Scale.RESIZE, autoCenter: Phaser.Scale.CENTER_BOTH },
  dom: { createContainer: true },
  scene: [BootScene, TitleScene, WorldScene, MultiplayerWorldScene],
});
