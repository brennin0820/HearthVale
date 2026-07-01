import { TILE_SIZE } from '../constants.js';
import type { MapDefinition, MapPortal, Vec2 } from '../types/world.js';
import { getMapBounds } from '../utils/mapBounds.js';

export interface HudSnapshot {
  map: MapDefinition;
  position: Vec2;
  nearestPortal: MapPortal | null;
  inSafeZone: boolean;
}

interface HudRefs {
  mapName: HTMLElement;
  mapSubtitle: HTMLElement;
  minimapCoords: HTMLElement;
  minimapGrid: HTMLElement;
  minimapPlayer: HTMLElement;
  questList: HTMLElement;
  chatLog: HTMLElement;
  stance: HTMLElement;
  playerTitle: HTMLElement;
}

const PLAYER_NAME = 'Hero';
const PLAYER_LEVEL = 1;
const PLAYER_HP = { current: 129, max: 129 };
const PLAYER_MP = { current: 48, max: 48 };
const XP_FILL = '42%';
const XP_LABEL = 'Path to Lv. 2';
const HUD_BASE_WIDTH = 1600;
const HUD_BASE_HEIGHT = 900;
const HUD_MIN_SCALE = 0.72;

function humanize(value: string): string {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

function percent(value: number): string {
  return `${Math.max(0, Math.min(100, value))}%`;
}

export class HudOverlay {
  private root: HTMLElement | null = null;
  private refs: HudRefs | null = null;
  private lastSignature = '';
  private lastMapId = '';
  private resizeBound = false;

  mount(): void {
    if (this.root) return;

    const host = document.getElementById('hud-root');
    if (!host) return;

    host.innerHTML = this.template();
    this.root = host.firstElementChild as HTMLElement | null;
    if (!this.root) return;

    this.refs = {
      mapName: this.getRef('map-name'),
      mapSubtitle: this.getRef('map-subtitle'),
      minimapCoords: this.getRef('minimap-coords'),
      minimapGrid: this.getRef('minimap-grid'),
      minimapPlayer: this.getRef('minimap-player'),
      questList: this.getRef('quest-list'),
      chatLog: this.getRef('chat-log'),
      stance: this.getRef('stance'),
      playerTitle: this.getRef('player-title'),
    };

    this.syncScale();
    this.bindResize();
  }

  sync(snapshot: HudSnapshot): void {
    this.mount();
    if (!this.refs) return;

    const roundedX = Math.round(snapshot.position.x);
    const roundedY = Math.round(snapshot.position.y);
    const portalLabel = snapshot.nearestPortal?.label ?? '';
    const signature = [
      snapshot.map.id,
      roundedX,
      roundedY,
      portalLabel,
      snapshot.inSafeZone ? 'safe' : 'field',
    ].join('|');

    if (signature === this.lastSignature) return;
    this.lastSignature = signature;

    if (snapshot.map.id !== this.lastMapId) {
      this.lastMapId = snapshot.map.id;
      this.renderMap(snapshot);
      this.renderMinimapPoints(snapshot.map);
    }

    this.updatePosition(snapshot);
    this.renderQuestList(snapshot);
    this.renderChatLog(snapshot);
  }

  private renderMap(snapshot: HudSnapshot): void {
    if (!this.refs) return;

    const { map } = snapshot;
    this.refs.mapName.textContent = map.displayName;
    this.refs.playerTitle.textContent = `Wanderer · ${humanize(map.regionId)}`;
    this.refs.mapSubtitle.textContent = this.buildSubtitle(snapshot);
  }

  private updatePosition(snapshot: HudSnapshot): void {
    if (!this.refs) return;

    const tileX = Math.round(snapshot.position.x / TILE_SIZE);
    const tileY = Math.round(snapshot.position.y / TILE_SIZE);
    this.refs.minimapCoords.textContent = `${tileX}, ${tileY}`;
    this.refs.mapSubtitle.textContent = this.buildSubtitle(snapshot);
    this.refs.stance.textContent = snapshot.nearestPortal
      ? `Stance: Steady · ${snapshot.nearestPortal.label}`
      : `Stance: Steady · ${humanize(snapshot.map.kind)}`;

    const { left, top } = this.toPercent(snapshot.map, snapshot.position);
    this.refs.minimapPlayer.style.left = left;
    this.refs.minimapPlayer.style.top = top;
  }

  private renderQuestList(snapshot: HudSnapshot): void {
    if (!this.refs) return;

    const quests = [
      snapshot.nearestPortal
        ? `Approach ${snapshot.nearestPortal.label} to travel.`
        : `Survey ${snapshot.map.displayName}.`,
      snapshot.inSafeZone
        ? 'Rest and plan your next route in the safe zone.'
        : `Reach Lv ${snapshot.map.levelRange.min}-${snapshot.map.levelRange.max} pacing for this area.`,
      snapshot.map.portals.length > 0
        ? `Portals available: ${snapshot.map.portals.length}.`
        : 'No portals registered in this map.',
    ];

    this.refs.questList.innerHTML = quests
      .map((quest) => `<div class="hv-hud__quests-item"><span>${quest}</span></div>`)
      .join('');
  }

  private renderChatLog(snapshot: HudSnapshot): void {
    if (!this.refs) return;

    const lines = [
      `Welcome to <em>${snapshot.map.displayName}</em>.`,
      snapshot.inSafeZone
        ? '<span class="hv-hud__hint">Safe zone active.</span>'
        : `<em>${humanize(snapshot.map.kind)}</em> zone is live.`,
      snapshot.nearestPortal
        ? `<span class="hv-hud__hint hv-hud__hint--travel">Portal nearby: ${snapshot.nearestPortal.label}</span>`
        : 'Walk to glowing portals to travel.',
    ];

    this.refs.chatLog.innerHTML = lines.map((line) => `<div>${line}</div>`).join('');
  }

  private renderMinimapPoints(map: MapDefinition): void {
    if (!this.refs) return;

    const points = [
      ...map.portals.map((portal) => ({ position: portal.position, className: 'hv-hud__poi hv-hud__poi--portal' })),
      ...map.npcs.map((npc) => ({ position: npc.position, className: 'hv-hud__poi hv-hud__poi--npc' })),
    ];

    this.refs.minimapGrid
      .querySelectorAll('.hv-hud__poi')
      .forEach((node) => node.remove());

    for (const point of points) {
      const marker = document.createElement('div');
      marker.className = point.className;
      const mapped = this.toPercent(map, point.position);
      marker.style.left = mapped.left;
      marker.style.top = mapped.top;
      this.refs.minimapGrid.appendChild(marker);
    }
  }

  private buildSubtitle(snapshot: HudSnapshot): string {
    const prefix = snapshot.inSafeZone ? 'Safe Zone' : humanize(snapshot.map.kind);
    return `${prefix} · Lv ${snapshot.map.levelRange.min}-${snapshot.map.levelRange.max}`;
  }

  private toPercent(map: MapDefinition, position: Vec2): { left: string; top: string } {
    const bounds = getMapBounds(map);
    const xRange = Math.max(1, bounds.maxX - bounds.minX);
    const yRange = Math.max(1, bounds.maxY - bounds.minY);
    const x = ((position.x - bounds.minX) / xRange) * 100;
    const y = ((position.y - bounds.minY) / yRange) * 100;

    return {
      left: percent(x),
      top: percent(y),
    };
  }

  private getRef(name: string): HTMLElement {
    const element = this.root?.querySelector<HTMLElement>(`[data-hud="${name}"]`);
    if (!element) {
      throw new Error(`HUD element not found: ${name}`);
    }
    return element;
  }

  private bindResize(): void {
    if (this.resizeBound) return;
    this.resizeBound = true;
    window.addEventListener('resize', this.syncScale);
  }

  private syncScale = (): void => {
    if (!this.root) return;

    const widthScale = window.innerWidth / HUD_BASE_WIDTH;
    const heightScale = window.innerHeight / HUD_BASE_HEIGHT;
    const scale = Math.max(HUD_MIN_SCALE, Math.min(1, widthScale, heightScale));

    this.root.style.setProperty('--hv-hud-scale', scale.toFixed(4));
  };

  private template(): string {
    const hotbarSlots = [
      ['1', 'ST', true],
      ['2', 'ATK', false],
      ['3', 'GRD', false],
      ['4', 'SKL', false],
      ['5', 'HP', false],
      ['6', 'MP', false],
      ['7', 'AUX', false],
      ['8', 'MAP', false],
    ]
      .map(
        ([key, icon, active]) => `
          <div class="hv-hud__hotbar-slot${active ? ' hv-hud__hotbar-slot--active' : ''}" data-icon="${icon}">
            <span class="hv-hud__slot-key">${key}</span>
          </div>`,
      )
      .join('');

    const menuTiles = [
      ['CHAR', 'C'],
      ['BAG', 'B'],
      ['SKILL', 'S'],
      ['QUEST', 'Q'],
      ['MAP', 'M'],
      ['MENU', '='],
    ]
      .map(
        ([label, glyph]) => `
          <div class="hv-hud__menu-tile">
            <div class="hv-hud__menu-glyph">${glyph}</div>
            <div class="hv-hud__menu-label">${label}</div>
          </div>`,
      )
      .join('');

    return `
      <div class="hv-hud">
        <section class="hv-hud__panel hv-hud__player">
          <div class="hv-hud__portrait">${PLAYER_LEVEL}</div>
          <div>
            <div class="hv-hud__player-name">${PLAYER_NAME}</div>
            <div class="hv-hud__player-title" data-hud="player-title">Wanderer · Hearthlight Vale</div>
            <div class="hv-hud__bars">
              <div class="hv-hud__bar">
                <div class="hv-hud__bar-fill hv-hud__bar-fill--hp"></div>
                <div class="hv-hud__bar-label">${PLAYER_HP.current} / ${PLAYER_HP.max}</div>
              </div>
              <div class="hv-hud__bar">
                <div class="hv-hud__bar-fill hv-hud__bar-fill--mp"></div>
                <div class="hv-hud__bar-label">${PLAYER_MP.current} / ${PLAYER_MP.max}</div>
              </div>
            </div>
          </div>
        </section>

        <section class="hv-hud__banner">
          <div class="hv-hud__banner-title" data-hud="map-name">HearthVale</div>
          <div class="hv-hud__banner-subtitle" data-hud="map-subtitle">Loading map data...</div>
        </section>

        <div class="hv-hud__right">
          <section class="hv-hud__minimap">
            <div class="hv-hud__minimap-title">Region</div>
            <div class="hv-hud__minimap-coords" data-hud="minimap-coords">0, 0</div>
            <div class="hv-hud__minimap-grid" data-hud="minimap-grid">
              <div class="hv-hud__player-marker" data-hud="minimap-player"></div>
            </div>
          </section>

          <section class="hv-hud__panel hv-hud__quests">
            <div class="hv-hud__section-title">Active Quests</div>
            <div class="hv-hud__quests-list" data-hud="quest-list"></div>
          </section>
        </div>

        <section class="hv-hud__panel hv-hud__chat">
          <div class="hv-hud__section-title">Field Log</div>
          <div class="hv-hud__chat-log" data-hud="chat-log"></div>
        </section>

        <section class="hv-hud__bottom">
          <div class="hv-hud__xp">
            <div class="hv-hud__level">${PLAYER_LEVEL}</div>
            <div class="hv-hud__xp-track">
              <div class="hv-hud__xp-fill" style="width: ${XP_FILL}"></div>
            </div>
            <div class="hv-hud__xp-label">${XP_LABEL}</div>
          </div>
          <div class="hv-hud__hotbar">
            ${hotbarSlots}
          </div>
          <div class="hv-hud__stance" data-hud="stance">Stance: Steady</div>
        </section>

        <section class="hv-hud__panel hv-hud__menu">
          <div class="hv-hud__section-title">Guild</div>
          <div class="hv-hud__menu-grid">${menuTiles}</div>
        </section>
      </div>`;
  }
}

export const hudOverlay = new HudOverlay();
