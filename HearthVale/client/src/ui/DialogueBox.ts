import Phaser from 'phaser';
import { HUD_DEPTH, NPC_ROLE_COLORS } from '../constants.js';
import type { NpcDefinition, NpcRole, QuestDefinition } from '../types/catalog.js';

export const PANEL_WIDTH = 560;
export const PANEL_HEIGHT = 176;
export const PANEL_MARGIN_BOTTOM = 48;

const ROLE_LABEL: Record<NpcRole, string> = {
  quest: 'Quest',
  merchant: 'Merchant',
  trainer: 'Trainer',
  warp: 'Warp',
  flavor: 'Townsfolk',
};

/**
 * Camera-fixed talk panel. Presents an NPC's dialogue one page at a time and
 * appends any quests the NPC offers, then closes. Purely presentational — the
 * scene owns input and movement locking.
 */
export class DialogueBox {
  private readonly scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private background: Phaser.GameObjects.Rectangle;
  private accentBar: Phaser.GameObjects.Rectangle;
  private nameText: Phaser.GameObjects.Text;
  private roleText: Phaser.GameObjects.Text;
  private bodyText: Phaser.GameObjects.Text;
  private hintText: Phaser.GameObjects.Text;

  private pages: string[] = [];
  private pageIndex = 0;
  private open = false;
  private accent = NPC_ROLE_COLORS.flavor;

  private readonly onResize = () => this.reposition();

  constructor(scene: Phaser.Scene) {
    this.scene = scene;

    this.background = scene.add
      .rectangle(0, 0, PANEL_WIDTH, PANEL_HEIGHT, 0x161320, 0.94)
      .setOrigin(0.5, 1)
      .setStrokeStyle(2, 0xf0e0b0, 0.6);

    this.accentBar = scene.add
      .rectangle(0, -PANEL_HEIGHT, PANEL_WIDTH, 4, this.accent, 1)
      .setOrigin(0.5, 0);

    this.nameText = scene.add
      .text(-PANEL_WIDTH / 2 + 20, -PANEL_HEIGHT + 16, '', {
        fontFamily: 'Georgia, serif',
        fontSize: '18px',
        color: '#ffe8b0',
        stroke: '#1a1520',
        strokeThickness: 3,
      })
      .setOrigin(0, 0);

    this.roleText = scene.add
      .text(-PANEL_WIDTH / 2 + 20, -PANEL_HEIGHT + 40, '', {
        fontFamily: 'sans-serif',
        fontSize: '11px',
        color: '#b6a98a',
      })
      .setOrigin(0, 0);

    this.bodyText = scene.add
      .text(-PANEL_WIDTH / 2 + 20, -PANEL_HEIGHT + 70, '', {
        fontFamily: 'sans-serif',
        fontSize: '14px',
        color: '#eadfc8',
        lineSpacing: 4,
        wordWrap: { width: PANEL_WIDTH - 40 },
      })
      .setOrigin(0, 0);

    this.hintText = scene.add
      .text(PANEL_WIDTH / 2 - 20, -20, '', {
        fontFamily: 'sans-serif',
        fontSize: '11px',
        color: '#8a8270',
      })
      .setOrigin(1, 1);

    this.container = scene.add
      .container(0, 0, [
        this.background,
        this.accentBar,
        this.nameText,
        this.roleText,
        this.bodyText,
        this.hintText,
      ])
      .setScrollFactor(0)
      .setDepth(HUD_DEPTH + 5)
      .setVisible(false);

    this.reposition();
    scene.scale.on(Phaser.Scale.Events.RESIZE, this.onResize);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.destroy());
  }

  get isOpen(): boolean {
    return this.open;
  }

  /** Open the panel for an NPC, building pages from dialogue + offered quests. */
  show(npc: NpcDefinition, quests: QuestDefinition[]): void {
    this.pages = [...npc.dialogue];
    for (const quest of quests) {
      const level = quest.requiredLevel ? ` (Lv ${quest.requiredLevel}+)` : '';
      this.pages.push(`◈ Quest available — "${quest.displayName}"${level}`);
    }
    if (this.pages.length === 0) {
      this.pages = ['...'];
    }

    this.accent = NPC_ROLE_COLORS[npc.role];
    this.accentBar.setFillStyle(this.accent, 1);
    this.background.setStrokeStyle(2, this.accent, 0.7);
    this.nameText.setText(npc.displayName);
    const subtitle = npc.title ? `${npc.title} · ${ROLE_LABEL[npc.role]}` : ROLE_LABEL[npc.role];
    this.roleText.setText(subtitle);

    this.pageIndex = 0;
    this.open = true;
    this.container.setVisible(true);
    this.reposition();
    this.renderPage();
  }

  /** Advance to the next page; returns false and closes when past the last. */
  advance(): boolean {
    if (!this.open) {
      return false;
    }
    if (this.pageIndex >= this.pages.length - 1) {
      this.hide();
      return false;
    }
    this.pageIndex += 1;
    this.renderPage();
    return true;
  }

  hide(): void {
    this.open = false;
    this.container.setVisible(false);
  }

  private renderPage(): void {
    this.bodyText.setText(this.pages[this.pageIndex] ?? '');
    const last = this.pageIndex >= this.pages.length - 1;
    this.hintText.setText(last ? '[E] Close' : '[E] Continue ▸');
  }

  private reposition(): void {
    const { width, height } = this.scene.scale;
    this.container.setPosition(width / 2, height - PANEL_MARGIN_BOTTOM);
  }

  private destroy(): void {
    this.scene.scale.off(Phaser.Scale.Events.RESIZE, this.onResize);
    this.container.destroy();
  }
}
