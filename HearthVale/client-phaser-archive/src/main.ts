import Phaser from 'phaser';
import './hud/hud.css';
import { hudOverlay } from './hud/HudOverlay.js';
import { BootScene } from './scenes/BootScene.js';
import { WorldScene } from './scenes/WorldScene.js';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game',
  width: window.innerWidth,
  height: window.innerHeight,
  backgroundColor: '#1a1520',
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [BootScene, WorldScene],
};

hudOverlay.mount();
new Phaser.Game(config);

window.addEventListener('resize', () => {
  // Phaser Scale.RESIZE handles canvas sizing; no extra work needed for MVP.
});
