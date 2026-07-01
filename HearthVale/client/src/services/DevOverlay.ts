import Phaser from 'phaser';
import type { MapDefinition } from '../types/world.js';

/** Jupiter / Engineer lane — dev-only debug overlay (F3). */
export class DevOverlay {
  private text: Phaser.GameObjects.Text | null = null;
  private visible = false;

  constructor(private scene: Phaser.Scene) {}

  mount(map: MapDefinition): void {
    this.text = this.scene.add
      .text(12, this.scene.scale.height - 120, '', {
        fontFamily: 'monospace',
        fontSize: '10px',
        color: '#66ff99',
        backgroundColor: '#000000aa',
        padding: { x: 6, y: 4 },
      })
      .setScrollFactor(0)
      .setDepth(2000)
      .setVisible(false);

    const f3 = this.scene.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.F3);
    f3?.on('down', () => this.toggle(map));
  }

  update(map: MapDefinition, position: { x: number; y: number }): void {
    if (!this.text || !this.visible) return;
    this.text.setText(
      [
        `DEV  F3 hide`,
        `map: ${map.id}`,
        `asset: ${map.assetKey}`,
        `music: ${map.musicKey}`,
        `biome: ${map.biome}`,
        `portals: ${map.portals.length}`,
        `pos: ${Math.round(position.x)}, ${Math.round(position.y)}`,
      ].join('\n'),
    );
  }

  private toggle(map: MapDefinition): void {
    this.visible = !this.visible;
    this.text?.setVisible(this.visible);
    if (this.visible && this.text) {
      this.text.setText(`map: ${map.id}\n(F3 to hide)`);
    }
  }
}
