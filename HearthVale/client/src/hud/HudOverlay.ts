import { TILE_SIZE } from '../constants.js';
import type { MapDefinition, MapPortal, Vec2 } from '../types/world.js';
import { getMapBounds } from '../utils/mapBounds.js';

export interface HudSnapshot {
  map: MapDefinition;
  position: Vec2;
  nearestPortal: MapPortal | null;
  inSafeZone: boolean;
  player: HudPlayerSnapshot;
  /** Live status auras derived from player vitals/zone (see WorldScene). */
  buffs: HudAura[];
  debuffs: HudAura[];
  /** Nearest locked-on monster, or null when nothing is in range. */
  target: HudTarget | null;
  /** Scene-owned seed panels — no party/economy/inventory systems exist yet. */
  party: HudPartyMember[];
  currency: HudCurrency[];
  hotbar: SlotItem[];
  inventory: SlotItem[];
}

export interface HudAura {
  letter: string;
  time: string;
}

export interface HudPartyMember {
  initial: string;
  name: string;
  role: string;
  hpPct: string;
  mpPct: string;
}

export interface HudTarget {
  name: string;
  level: number;
  hpPct: string;
  cast?: string;
  castPct?: string;
}

export interface HudCurrency {
  value: string;
}

export interface HudPlayerSnapshot {
  name: string;
  level: number;
  hpCur: number;
  hpMax: number;
  mpCur: number;
  mpMax: number;
  spCur: number;
  spMax: number;
  xpCur: number;
  xpNext: number;
  stance: string;
}

export type HudTheme = 'Ironbound' | 'Radiant Vale' | 'Hearthlight';
type SlotTheme = 'iron' | 'gold' | 'glass';
type ItemShape = 'empty' | 'blade' | 'guard' | 'gem' | 'scroll' | 'potion' | 'stance';

interface ThemeTokens {
  slotTheme: SlotTheme;
  fontBody: string;
  fontDisplay: string;
  nameFont: string;
  nameWeight: string;
  dispWeight: string;
  dispTransform: string;
  dispSpacing: string;
  panelBg: string;
  panelRing: string;
  panelRadius: string;
  panelBackdrop: string;
  bannerRadius: string;
  minimapRadius: string;
  textPrimary: string;
  textMuted: string;
  accent: string;
  accentSoft: string;
  hpFill: string;
  hpTrack: string;
  hpSolid: string;
  mpFill: string;
  mpTrack: string;
  mpSolid: string;
  spFill: string;
  spTrack: string;
  barRadius: string;
  barBorder: string;
  buffRing: string;
  debuffRing: string;
  portraitRadius: string;
  portraitFace: string;
  portraitHead: string;
  portraitBody: string;
  portraitAnim: string;
  hasRivets: boolean;
  hasDiamond: boolean;
}

export interface SlotItem {
  shape: ItemShape;
  tint: string;
  label?: string;
  qty?: number;
  rare?: boolean;
  cdPct?: number;
  cdLabel?: string;
  keybind?: string;
  active?: boolean;
}

const THEME_CYCLE: HudTheme[] = ['Ironbound', 'Radiant Vale', 'Hearthlight'];
const DEFAULT_THEME: HudTheme = 'Hearthlight';
const THEME_STORAGE_KEY = 'hv-hud-theme';

const THEME_TOKENS: Record<HudTheme, ThemeTokens> = {
  'Radiant Vale': {
    slotTheme: 'gold',
    fontBody: "'EB Garamond', serif",
    fontDisplay: 'Cinzel, serif',
    nameFont: 'Cinzel, serif',
    nameWeight: '700',
    dispWeight: '700',
    dispTransform: 'uppercase',
    dispSpacing: '1px',
    panelBg: 'oklch(0.19 0.03 25 / 0.88)',
    panelRing:
      '0 0 0 1.5px oklch(0.78 0.14 85), 0 0 0 3.5px oklch(0.4 0.06 30), 0 10px 30px rgba(0,0,0,.55)',
    panelRadius: '10px',
    panelBackdrop: 'none',
    bannerRadius: '10px',
    minimapRadius: '50%',
    textPrimary: 'oklch(0.96 0.02 80)',
    textMuted: 'oklch(0.78 0.04 80)',
    accent: 'oklch(0.82 0.15 85)',
    accentSoft: 'oklch(0.78 0.14 85)',
    hpFill: 'linear-gradient(180deg,oklch(0.6 0.19 25),oklch(0.42 0.16 25))',
    hpTrack: 'oklch(0.14 0.02 25 / .7)',
    hpSolid: 'oklch(0.55 0.19 25)',
    mpFill: 'linear-gradient(180deg,oklch(0.58 0.15 250),oklch(0.4 0.13 250))',
    mpTrack: 'oklch(0.13 0.02 250 / .7)',
    mpSolid: 'oklch(0.55 0.15 250)',
    spFill: 'linear-gradient(180deg,oklch(0.63 0.15 145),oklch(0.44 0.13 145))',
    spTrack: 'oklch(0.13 0.02 145 / .7)',
    barRadius: '4px',
    barBorder: '0 0 0 1px oklch(0.4 0.06 30)',
    buffRing: 'oklch(0.63 0.15 145)',
    debuffRing: 'oklch(0.6 0.19 25)',
    portraitRadius: '50%',
    portraitFace: 'linear-gradient(160deg,#5a3a2e,#2a1712)',
    portraitHead: 'oklch(0.6 0.03 60)',
    portraitBody: 'oklch(0.45 0.03 60)',
    portraitAnim: 'pulse',
    hasRivets: false,
    hasDiamond: true,
  },
  Hearthlight: {
    slotTheme: 'glass',
    fontBody: 'Jost, sans-serif',
    fontDisplay: 'Jost, sans-serif',
    nameFont: "'Cormorant Garamond', serif",
    nameWeight: '500',
    dispWeight: '500',
    dispTransform: 'none',
    dispSpacing: '.2px',
    panelBg: 'oklch(0.25 0.025 260 / 0.62)',
    panelRing:
      '0 0 0 1px oklch(0.72 0.05 85 / .45), inset 0 1px 0 rgba(255,255,255,.06), 0 12px 34px rgba(0,0,0,.45)',
    panelRadius: '14px',
    panelBackdrop: 'blur(16px)',
    bannerRadius: '999px',
    minimapRadius: '16px',
    textPrimary: 'oklch(0.95 0.008 250)',
    textMuted: 'oklch(0.72 0.01 250)',
    accent: 'oklch(0.76 0.07 85)',
    accentSoft: 'oklch(0.72 0.05 85 / .4)',
    hpFill: 'oklch(0.58 0.13 20)',
    hpTrack: 'oklch(0.16 0.01 20 / .6)',
    hpSolid: 'oklch(0.58 0.13 20)',
    mpFill: 'oklch(0.58 0.09 230)',
    mpTrack: 'oklch(0.15 0.01 230 / .6)',
    mpSolid: 'oklch(0.58 0.09 230)',
    spFill: 'oklch(0.62 0.08 140)',
    spTrack: 'oklch(0.15 0.01 140 / .6)',
    barRadius: '999px',
    barBorder: 'none',
    buffRing: 'oklch(0.62 0.08 140)',
    debuffRing: 'oklch(0.58 0.13 20)',
    portraitRadius: '50%',
    portraitFace: 'linear-gradient(160deg,#3a4152,#20242f)',
    portraitHead: 'oklch(0.55 0.01 250)',
    portraitBody: 'oklch(0.42 0.01 250)',
    portraitAnim: '',
    hasRivets: false,
    hasDiamond: false,
  },
  Ironbound: {
    slotTheme: 'iron',
    fontBody: 'Spectral, serif',
    fontDisplay: 'Cinzel, serif',
    nameFont: 'Cinzel, serif',
    nameWeight: '600',
    dispWeight: '600',
    dispTransform: 'none',
    dispSpacing: '.4px',
    panelBg: 'oklch(0.22 0.02 55 / 0.90)',
    panelRing:
      '0 0 0 2px oklch(0.15 0.015 55), 0 0 0 4px oklch(0.42 0.03 65), 0 10px 26px rgba(0,0,0,.5)',
    panelRadius: '8px',
    panelBackdrop: 'none',
    bannerRadius: '8px',
    minimapRadius: '10px',
    textPrimary: 'oklch(0.93 0.015 70)',
    textMuted: 'oklch(0.68 0.02 65)',
    accent: 'oklch(0.64 0.09 80)',
    accentSoft: 'oklch(0.64 0.09 80)',
    hpFill: 'linear-gradient(180deg,oklch(0.58 0.16 25),oklch(0.4 0.14 25))',
    hpTrack: 'oklch(0.18 0.02 25 / .7)',
    hpSolid: 'oklch(0.5 0.16 25)',
    mpFill: 'linear-gradient(180deg,oklch(0.55 0.09 235),oklch(0.36 0.08 235))',
    mpTrack: 'oklch(0.16 0.02 235 / .7)',
    mpSolid: 'oklch(0.48 0.09 235)',
    spFill: 'linear-gradient(180deg,oklch(0.6 0.11 120),oklch(0.42 0.09 120))',
    spTrack: 'oklch(0.16 0.02 120 / .7)',
    barRadius: '4px',
    barBorder: '0 0 0 1px oklch(0.15 0.015 55)',
    buffRing: 'oklch(0.6 0.11 120)',
    debuffRing: 'oklch(0.55 0.15 25)',
    portraitRadius: '10px',
    portraitFace: 'linear-gradient(160deg,#4a4038,#241d18)',
    portraitHead: 'oklch(0.55 0.02 60)',
    portraitBody: 'oklch(0.42 0.02 60)',
    portraitAnim: '',
    hasRivets: true,
    hasDiamond: false,
  },
};

const TOKEN_VAR_KEYS: (keyof ThemeTokens)[] = [
  'fontBody', 'fontDisplay', 'nameFont', 'nameWeight', 'dispWeight', 'dispTransform', 'dispSpacing',
  'panelBg', 'panelRing', 'panelRadius', 'panelBackdrop', 'bannerRadius', 'minimapRadius',
  'textPrimary', 'textMuted', 'accent', 'accentSoft',
  'hpFill', 'hpTrack', 'hpSolid', 'mpFill', 'mpTrack', 'mpSolid', 'spFill', 'spTrack',
  'barRadius', 'barBorder', 'buffRing', 'debuffRing',
  'portraitRadius', 'portraitFace', 'portraitHead', 'portraitBody',
];

/** Mock content ported from the Hearthlight Vale HUD design — no systems exist yet
 * for party/combat/inventory/economy. */
const PLAYER = {
  name: 'Hero',
  level: 7,
  hpCur: 129, hpMax: 165,
  mpCur: 48, mpMax: 88,
  spCur: 90, spMax: 100,
  xpCur: 1240, xpNext: 2950,
  stance: 'Steady',
};
export const DEFAULT_PLAYER = PLAYER as HudPlayerSnapshot;

/** Seed panels below are the mock content shipped by the Hearthlight Vale HUD
 * design. WorldScene owns them now and passes them through the snapshot; the
 * party/currency/hotbar/bag sets stay static until real systems back them, while
 * buffs/debuffs/target are recomputed live each frame from scene state. */
export const DEFAULT_BUFFS: HudAura[] = [
  { letter: 'W', time: '8:12' },
  { letter: 'G', time: '2:40' },
  { letter: 'B', time: '14:55' },
  { letter: 'C', time: '0:45' },
];
export const DEFAULT_DEBUFFS: HudAura[] = [
  { letter: 'W', time: '0:12' },
  { letter: 'C', time: '1:05' },
];
export const DEFAULT_PARTY: HudPartyMember[] = [
  { initial: 'B', name: 'Brynn', role: 'Guardian', hpPct: '82%', mpPct: '40%' },
  { initial: 'O', name: 'Oswin', role: 'Ranger', hpPct: '65%', mpPct: '90%' },
  { initial: 'S', name: 'Sable', role: 'Mender', hpPct: '100%', mpPct: '55%' },
];
export const DEFAULT_TARGET: HudTarget = { name: 'Bandit Captain', level: 9, hpPct: '34%', cast: 'Reckless Swing', castPct: '60%' };
export const DEFAULT_CURRENCY: HudCurrency[] = [
  { value: '1,248' },
  { value: '36' },
];
export const DEFAULT_HOTBAR: SlotItem[] = [
  { shape: 'stance', tint: '#e3c77d', active: true, keybind: '1' },
  { shape: 'blade', tint: '#c9a227', keybind: '2' },
  { shape: 'guard', tint: '#8fa3c9', cdPct: 0.4, cdLabel: '4s', keybind: '3' },
  { shape: 'scroll', tint: '#d8c9a3', keybind: '4' },
  { shape: 'potion', tint: '#c85450', qty: 3, keybind: '5' },
  { shape: 'potion', tint: '#4f7fc9', qty: 2, keybind: '6' },
  { shape: 'blade', tint: '#a9762a', cdPct: 0.7, cdLabel: '9s', keybind: '7' },
  { shape: 'guard', tint: '#7fae6a', keybind: '8' },
  { shape: 'empty', tint: '#888', keybind: '9' },
  { shape: 'guard', tint: '#8ed5ff', keybind: '⇧', label: 'Brace — hold Shift' },
];
export const DEFAULT_INVENTORY: SlotItem[] = [
  { shape: 'blade', tint: '#c9a227', rare: true }, { shape: 'guard', tint: '#8fa3c9' },
  { shape: 'potion', tint: '#c85450', qty: 6 }, { shape: 'potion', tint: '#4f7fc9', qty: 2 },
  { shape: 'scroll', tint: '#d8c9a3', qty: 3 }, { shape: 'gem', tint: '#7fd9d0', rare: true },
  { shape: 'gem', tint: '#b98be0', qty: 4 }, { shape: 'blade', tint: '#a9762a' },
  { shape: 'scroll', tint: '#d8c9a3', rare: true }, { shape: 'potion', tint: '#c85450', qty: 8 },
  { shape: 'guard', tint: '#7fae6a', rare: true }, { shape: 'gem', tint: '#7fd9d0', qty: 2 },
  { shape: 'empty', tint: '#888' }, { shape: 'empty', tint: '#888' }, { shape: 'empty', tint: '#888' },
  { shape: 'empty', tint: '#888' }, { shape: 'empty', tint: '#888' }, { shape: 'empty', tint: '#888' },
  { shape: 'empty', tint: '#888' }, { shape: 'empty', tint: '#888' }, { shape: 'empty', tint: '#888' },
  { shape: 'empty', tint: '#888' }, { shape: 'empty', tint: '#888' }, { shape: 'empty', tint: '#888' },
];
interface HudRefs {
  playerTitle: HTMLElement;
  playerName: HTMLElement;
  playerLevel: HTMLElement;
  hpFill: HTMLElement;
  hpLabel: HTMLElement;
  mpFill: HTMLElement;
  spFill: HTMLElement;
  xpLevel: HTMLElement;
  xpFill: HTMLElement;
  xpLabel: HTMLElement;
  stance: HTMLElement;
  bannerTitle: HTMLElement;
  bannerSubtitle: HTMLElement;
  minimapCoords: HTMLElement;
  minimap: HTMLElement;
  minimapGrid: HTMLElement;
  minimapPlayer: HTMLElement;
  minimapTitle: HTMLElement;
  questList: HTMLElement;
  chatLog: HTMLElement;
  auras: HTMLElement;
  target: HTMLElement;
  inventory: HTMLElement;
}

function esc(value: string): string {
  return value.replace(/[&<>"']/g, (ch) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch] as string
  ));
}

function humanize(value: string): string {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

function percent(value: number): string {
  return `${Math.max(0, Math.min(100, value))}%`;
}

function clampPercent(current: number, max: number): string {
  if (!max || !Number.isFinite(max) || max <= 0) return '0%';
  return percent((current / max) * 100);
}

function formatStatLabel(cur: number, max: number): string {
  if (!max || max <= 0) return '0 / 0';
  return `${Math.max(0, Math.round(cur)).toLocaleString()} / ${Math.max(0, Math.round(max)).toLocaleString()}`;
}

function formatXpLabel(cur: number, next: number): string {
  return `${Math.max(0, Math.round(cur)).toLocaleString()} / ${Math.max(0, Math.round(next)).toLocaleString()} XP`;
}

function shapeMarkup(shape: ItemShape, tint: string, active: boolean): string {
  switch (shape) {
    case 'blade':
      return `<div class="hv-shape hv-shape--blade">
        <div class="hv-shape__blade-edge"></div>
        <div class="hv-shape__blade-guard" style="background:${tint}"></div>
        <div class="hv-shape__blade-hilt"></div>
      </div>`;
    case 'guard':
      return `<div class="hv-shape hv-shape--guard">
        <div class="hv-shape__guard-gem" style="background:${tint}"></div>
      </div>`;
    case 'gem':
      return `<div class="hv-shape hv-shape--gem">
        <div class="hv-shape__gem-body" style="background:linear-gradient(135deg,${tint},rgba(0,0,0,.5))"></div>
        <div class="hv-shape__gem-shine"></div>
      </div>`;
    case 'scroll':
      return `<div class="hv-shape hv-shape--scroll">
        <div class="hv-shape__scroll-line hv-shape__scroll-line--1"></div>
        <div class="hv-shape__scroll-line hv-shape__scroll-line--2"></div>
        <div class="hv-shape__scroll-line hv-shape__scroll-line--3"></div>
      </div>`;
    case 'potion':
      return `<div class="hv-shape hv-shape--potion">
        <div class="hv-shape__potion-cap"></div>
        <div class="hv-shape__potion-body" style="background:${tint}">
          <div class="hv-shape__potion-shine"></div>
        </div>
      </div>`;
    case 'stance':
      return `<div class="hv-shape hv-shape--stance" style="border-color:${tint}${active ? ';animation:pulseGlowSlot 2.4s ease-in-out infinite' : ''}">
        <div class="hv-shape__stance-dot" style="background:${tint}"></div>
      </div>`;
    default:
      return '';
  }
}

function slotVisuals(theme: SlotTheme, rare: boolean): { bg: string; ring: string; radius: string; blur: string; glow: string } {
  if (theme === 'iron') {
    return {
      bg: 'oklch(0.22 0.02 55 / 0.88)',
      ring: rare
        ? '0 0 0 2px oklch(0.15 0.015 55), 0 0 0 4px oklch(0.55 0.13 300), inset 0 1px 1px rgba(255,255,255,.08)'
        : '0 0 0 2px oklch(0.15 0.015 55), 0 0 0 4px oklch(0.42 0.03 65), inset 0 1px 1px rgba(255,255,255,.08)',
      radius: '5px', blur: 'none', glow: 'oklch(0.64 0.09 80)',
    };
  }
  if (theme === 'gold') {
    return {
      bg: 'oklch(0.19 0.03 25 / 0.88)',
      ring: rare
        ? '0 0 0 2px oklch(0.6 0.17 300), 0 0 0 3.5px oklch(0.4 0.08 30)'
        : '0 0 0 1.5px oklch(0.78 0.14 85), 0 0 0 3.5px oklch(0.4 0.06 30)',
      radius: '7px', blur: 'none', glow: 'oklch(0.82 0.15 85)',
    };
  }
  return {
    bg: 'oklch(0.27 0.025 260 / 0.55)',
    ring: rare
      ? '0 0 0 1.5px oklch(0.62 0.11 300 / .8), inset 0 1px 0 rgba(255,255,255,.06)'
      : '0 0 0 1px oklch(0.7 0.05 85 / .4), inset 0 1px 0 rgba(255,255,255,.06)',
    radius: '12px', blur: 'blur(6px)', glow: 'oklch(0.76 0.07 85)',
  };
}

function itemSlotHtml(theme: SlotTheme, item: SlotItem, size: number): string {
  const { bg, ring, radius, blur, glow } = slotVisuals(theme, !!item.rare);
  const qty = item.qty ?? 0;
  const cdPct = item.cdPct ?? 0;
  const keybind = item.keybind ?? '';
  const shapeHtml = shapeMarkup(item.shape, item.tint, !!item.active);
  const qtyHtml = qty > 0 ? `<div class="hv-slot__qty">${qty}</div>` : '';
  const cdHtml = cdPct > 0
    ? `<div class="hv-slot__cd" style="height:${Math.round(cdPct * 100)}%"><span>${esc(item.cdLabel ?? '')}</span></div>`
    : '';
  const kbHtml = keybind ? `<div class="hv-slot__kb">${esc(keybind)}</div>` : '';
  const label = item.label ? ` title="${esc(item.label)}" aria-label="${esc(item.label)}"` : '';
  return `<div class="hv-slot"${label} style="width:${size}px;height:${size}px;background:${bg};box-shadow:${ring};border-radius:${radius};backdrop-filter:${blur};color:${glow}">${shapeHtml}${qtyHtml}${cdHtml}${kbHtml}</div>`;
}

function cornerAccents(tk: ThemeTokens): string {
  let html = '';
  if (tk.hasRivets) {
    html += `
      <div class="hv-rivet hv-rivet--tl"></div>
      <div class="hv-rivet hv-rivet--tr"></div>
      <div class="hv-rivet hv-rivet--bl"></div>
      <div class="hv-rivet hv-rivet--br"></div>`;
  }
  if (tk.hasDiamond) {
    html += `<div class="hv-diamond" style="background:${tk.accent};box-shadow:0 0 8px ${tk.accent}"></div>`;
  }
  return html;
}

function auraMarkup(kind: 'buff' | 'debuff', aura: HudAura): string {
  return `<div class="hv-hud__aura">
    <div class="hv-hud__aura-icon hv-hud__aura-icon--${kind}">${esc(aura.letter)}</div>
    <div class="hv-hud__aura-time">${esc(aura.time)}</div>
  </div>`;
}

function aurasMarkup(buffs: HudAura[], debuffs: HudAura[]): string {
  const buffHtml = buffs.map((buff) => auraMarkup('buff', buff)).join('');
  const debuffHtml = debuffs.map((debuff) => auraMarkup('debuff', debuff)).join('');
  const divider = buffs.length && debuffs.length ? '<div class="hv-hud__aura-divider"></div>' : '';
  return `${buffHtml}${divider}${debuffHtml}`;
}

function targetInnerMarkup(tk: ThemeTokens, target: HudTarget): string {
  const castHtml = target.cast && target.castPct
    ? `<div class="hv-hud__target-cast-row">
        <div class="hv-hud__target-cast-track"><div class="hv-hud__target-cast-fill" style="width:${esc(target.castPct)}"></div></div>
        <span class="hv-hud__target-cast-label">${esc(target.cast)}</span>
      </div>`
    : '';
  return `${cornerAccents(tk)}
    <div class="hv-hud__target-row">
      <span class="hv-hud__target-name">${esc(target.name)}</span>
      <span class="hv-hud__target-level">Lv ${target.level}</span>
    </div>
    <div class="hv-hud__target-hp"><div class="hv-hud__target-hp-fill" style="width:${esc(target.hpPct)}"></div></div>
    ${castHtml}`;
}

function targetKey(target: HudTarget | null): string {
  return target ? `${target.name}|${target.level}|${target.hpPct}|${target.cast ?? ''}|${target.castPct ?? ''}` : '';
}

export class HudOverlay {
  private root: HTMLElement | null = null;
  private refs: HudRefs | null = null;
  private lastSnapshot: HudSnapshot | null = null;
  private lastMapId = '';
  private resizeBound = false;
  private theme: HudTheme = DEFAULT_THEME;
  private npcLog: { speaker: string; text: string }[] = [];
  private lastAurasKey = '';
  private lastTargetKey = '';
  private lastInventoryKey = '';
  private mapExpanded = false;

  mount(): void {
    if (this.root) return;

    const host = document.getElementById('hud-root');
    if (!host) return;

    this.theme = this.loadStoredTheme();
    host.innerHTML = '<div class="hv-hud"></div>';
    this.root = host.firstElementChild as HTMLElement | null;
    if (!this.root) return;

    this.rebuild();
    this.syncScale();
    this.bindResize();
    this.bindDevKeys();
  }

  sync(snapshot: HudSnapshot): void {
    this.mount();
    if (!this.refs) return;

    const previous = this.lastSnapshot;
    const mapChanged = !previous || snapshot.map.id !== previous.map.id;
    const portalChanged = (previous?.nearestPortal?.label ?? null) !== (snapshot.nearestPortal?.label ?? null);
    const safeZoneChanged = !previous || snapshot.inSafeZone !== previous.inSafeZone;

    this.lastSnapshot = snapshot;
    this.renderPlayer(snapshot);
    this.syncLivePanels(snapshot);
    if (mapChanged) {
      this.lastMapId = snapshot.map.id;
      this.renderBanner(snapshot);
      this.renderMinimapPoints(snapshot.map);
    }

    if (mapChanged || portalChanged || safeZoneChanged) {
      this.renderQuestList(snapshot);
      this.renderChatLog(snapshot);
    }

    this.updatePosition(snapshot);
  }

  private renderBanner(snapshot: HudSnapshot): void {
    if (!this.refs) return;
    const { map } = snapshot;
    this.refs.playerTitle.textContent = `${snapshot.player.name} · ${humanize(map.regionId)}`;
    this.refs.bannerTitle.textContent = map.displayName;
    this.refs.bannerSubtitle.textContent = this.buildSubtitle(snapshot);
  }

  /** Live per-frame panels: only re-render when their content actually changes. */
  private syncLivePanels(snapshot: HudSnapshot): void {
    if (!this.refs) return;
    const aurasKey = JSON.stringify([snapshot.buffs, snapshot.debuffs]);
    if (aurasKey !== this.lastAurasKey) {
      this.lastAurasKey = aurasKey;
      this.renderAuras(snapshot.buffs, snapshot.debuffs);
    }
    const key = targetKey(snapshot.target);
    if (key !== this.lastTargetKey) {
      this.lastTargetKey = key;
      this.renderTarget(snapshot.target);
    }
    const inventoryKey = JSON.stringify(snapshot.inventory);
    if (inventoryKey !== this.lastInventoryKey) {
      this.lastInventoryKey = inventoryKey;
      const tk = THEME_TOKENS[this.theme];
      this.refs.inventory.innerHTML = snapshot.inventory.slice(0, 6).map((item) => itemSlotHtml(tk.slotTheme, item, 44)).join('');
    }
  }

  private renderAuras(buffs: HudAura[], debuffs: HudAura[]): void {
    if (!this.refs) return;
    this.refs.auras.innerHTML = aurasMarkup(buffs, debuffs);
  }

  private renderTarget(target: HudTarget | null): void {
    if (!this.refs) return;
    const el = this.refs.target;
    if (!target) {
      el.style.display = 'none';
      el.innerHTML = '';
      return;
    }
    el.style.display = '';
    el.innerHTML = targetInnerMarkup(THEME_TOKENS[this.theme], target);
  }

  /** Resolves the seed panels for skeleton rendering — live snapshot or design defaults. */
  private panels(): {
    buffs: HudAura[];
    debuffs: HudAura[];
    party: HudPartyMember[];
    currency: HudCurrency[];
    hotbar: SlotItem[];
    inventory: SlotItem[];
  } {
    const s = this.lastSnapshot;
    return {
      buffs: s?.buffs ?? DEFAULT_BUFFS,
      debuffs: s?.debuffs ?? DEFAULT_DEBUFFS,
      party: s?.party ?? DEFAULT_PARTY,
      currency: s?.currency ?? DEFAULT_CURRENCY,
      hotbar: s?.hotbar ?? DEFAULT_HOTBAR,
      inventory: s?.inventory ?? DEFAULT_INVENTORY,
    };
  }

  private renderPlayer(snapshot: HudSnapshot): void {
    if (!this.refs) return;
    const player = snapshot.player ?? DEFAULT_PLAYER;
    this.refs.playerName.textContent = player.name;
    this.refs.playerLevel.textContent = String(player.level);
    this.refs.hpFill.style.width = clampPercent(player.hpCur, player.hpMax);
    this.refs.hpLabel.textContent = formatStatLabel(player.hpCur, player.hpMax);
    this.refs.mpFill.style.width = clampPercent(player.mpCur, player.mpMax);
    this.refs.spFill.style.width = clampPercent(player.spCur, player.spMax);
    this.refs.xpLevel.textContent = String(player.level);
    this.refs.xpFill.style.width = clampPercent(player.xpCur, player.xpNext);
    this.refs.xpLabel.textContent = formatXpLabel(player.xpCur, player.xpNext);
    this.refs.stance.textContent = `Stance: ${player.stance ?? 'Steady'}`;
  }

  private updatePosition(snapshot: HudSnapshot): void {
    if (!this.refs) return;
    const tileX = Math.round(snapshot.position.x / TILE_SIZE);
    const tileY = Math.round(snapshot.position.y / TILE_SIZE);
    this.refs.minimapCoords.textContent = `${tileX}, ${tileY}`;
    const mapped = this.toPercent(snapshot.map, snapshot.position);
    this.refs.minimapPlayer.style.left = mapped.left;
    this.refs.minimapPlayer.style.top = mapped.top;
    const portalNearby = snapshot.nearestPortal !== null;
    this.refs.minimap.classList.toggle('hv-hud__minimap--portal-near', portalNearby);
    this.refs.minimapTitle.textContent = portalNearby
      ? `Portal · ${snapshot.nearestPortal!.label}`
      : 'Local Map · M';
    this.refs.bannerSubtitle.textContent = this.buildSubtitle(snapshot);
  }

  private renderQuestList(snapshot: HudSnapshot): void {
    if (!this.refs) return;
    const quests = [
      snapshot.nearestPortal
        ? `Approach ${esc(snapshot.nearestPortal.label)} to travel.`
        : `Survey ${esc(snapshot.map.displayName)}.`,
      snapshot.inSafeZone
        ? 'Rest and plan your next route in the safe zone.'
        : `Reach Lv ${snapshot.map.levelRange.min}-${snapshot.map.levelRange.max} pacing for this area.`,
      snapshot.map.portals.length > 0
        ? `Portals available: ${snapshot.map.portals.length}.`
        : 'No portals registered in this map.',
    ];

    this.refs.questList.innerHTML = quests
      .map((quest) => `
        <div class="hv-hud__quest-item">
          <span class="hv-hud__quest-bullet"></span>
          <span>${quest}</span>
        </div>`)
      .join('');
  }

  /** Appends a spoken NPC line to the chat log; the most recent few persist
   * across map/portal context changes so a conversation stays readable. */
  logNpcLine(speaker: string, text: string): void {
    this.mount();
    this.npcLog.unshift({ speaker, text });
    if (this.npcLog.length > 3) {
      this.npcLog.length = 3;
    }
    if (this.lastSnapshot) {
      this.renderChatLog(this.lastSnapshot);
    }
  }

  private renderChatLog(snapshot: HudSnapshot): void {
    if (!this.refs) return;
    const npcLines = this.npcLog.map((entry) => ({
      plain: `<em>${esc(entry.speaker)}:</em> ${esc(entry.text)}`,
    }));
    const lines = [
      ...npcLines,
      { plain: `Welcome to <em>${esc(snapshot.map.displayName)}</em>.` },
      snapshot.inSafeZone
        ? { plain: '<span class="hv-hud__hint">Safe zone active.</span>' }
        : { plain: `<em>${esc(humanize(snapshot.map.kind))}</em> zone is live.` },
      snapshot.nearestPortal
        ? { plain: `<span class="hv-hud__hint hv-hud__hint--travel">Portal nearby: ${esc(snapshot.nearestPortal.label)}</span>` }
        : { plain: 'Walk to glowing portals to travel.' },
    ];

    this.refs.chatLog.innerHTML = lines
      .map((line) => `<div class="hv-hud__log-line">${line.plain}</div>`)
      .join('');
  }

  private renderMinimapPoints(map: MapDefinition): void {
    if (!this.refs) return;
    const points = [
      ...map.portals.map((portal) => ({ position: portal.position, className: 'hv-hud__poi hv-hud__poi--portal' })),
      ...map.npcs.map((npc) => ({ position: npc.position, className: 'hv-hud__poi hv-hud__poi--npc' })),
    ];

    this.refs.minimapGrid.querySelectorAll('.hv-hud__poi').forEach((node) => node.remove());

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
    return { left: percent(x), top: percent(y) };
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

  /** Dev-only hook — F4 cycles the HUD skin. No settings UI exists yet. The target
   * frame is now driven by live scene state (nearest monster), so the old F5
   * combat-preview toggle is gone. */
  private bindDevKeys(): void {
    window.addEventListener('keydown', (event) => {
      if (event.code === 'F4') {
        event.preventDefault();
        this.cycleTheme();
      } else if (event.code === 'KeyM') {
        event.preventDefault();
        this.mapExpanded = !this.mapExpanded;
        this.root?.classList.toggle('hv-hud--map-open', this.mapExpanded);
      }
    });
  }

  private cycleTheme(): void {
    const index = THEME_CYCLE.indexOf(this.theme);
    this.setTheme(THEME_CYCLE[(index + 1) % THEME_CYCLE.length]);
  }

  setTheme(theme: HudTheme): void {
    this.theme = theme;
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // localStorage unavailable (e.g. private browsing) — theme just won't persist.
    }
    this.rebuild();
  }

  private loadStoredTheme(): HudTheme {
    try {
      const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
      if (stored && THEME_CYCLE.includes(stored as HudTheme)) return stored as HudTheme;
    } catch {
      // ignore
    }
    return DEFAULT_THEME;
  }

  private syncScale = (): void => {
    if (!this.root) return;
    // The field HUD uses viewport-relative edge anchors and responsive CSS
    // instead of scaling a desktop artboard down to illegible mobile text.
    this.root.parentElement?.style.setProperty('--hv-hud-scale', '1');
    this.root.parentElement?.style.setProperty('--hv-hud-offset-x', '0px');
    this.root.parentElement?.style.setProperty('--hv-hud-offset-y', '0px');
  };

  /** Rebuilds the full skeleton (theme + all static/mock panels) and re-binds
   * live refs. Only called on mount / theme swap / combat-preview toggle —
   * per-frame updates go through sync() and touch individual nodes instead. */
  private rebuild(): void {
    if (!this.root) return;
    const host = this.root.parentElement;
    const tk = THEME_TOKENS[this.theme];
    const player = this.lastSnapshot?.player ?? DEFAULT_PLAYER;

    if (host) {
      for (const key of TOKEN_VAR_KEYS) {
        host.style.setProperty(`--t-${key}`, String(tk[key]));
      }
    }
    this.root.classList.toggle('hv-hud--portrait-glow', !!tk.portraitAnim);
    this.root.classList.toggle('hv-hud--map-open', this.mapExpanded);

    this.root.innerHTML = this.template(tk, player);
    this.refs = {
      playerTitle: this.getRef('player-title'),
      playerName: this.getRef('player-name'),
      playerLevel: this.getRef('player-level'),
      hpFill: this.getRef('player-hp-fill'),
      hpLabel: this.getRef('player-hp-label'),
      mpFill: this.getRef('player-mp-fill'),
      spFill: this.getRef('player-sp-fill'),
      xpLevel: this.getRef('player-xp-level'),
      xpFill: this.getRef('player-xp-fill'),
      xpLabel: this.getRef('player-xp-label'),
      stance: this.getRef('player-stance'),
      bannerTitle: this.getRef('banner-title'),
      bannerSubtitle: this.getRef('banner-subtitle'),
      minimapCoords: this.getRef('minimap-coords'),
      minimap: this.getRef('minimap'),
      minimapGrid: this.getRef('minimap-grid'),
      minimapPlayer: this.getRef('minimap-player'),
      minimapTitle: this.getRef('minimap-title'),
      questList: this.getRef('quest-list'),
      chatLog: this.getRef('chat-log'),
      auras: this.getRef('auras'),
      target: this.getRef('target'),
      inventory: this.getRef('inventory'),
    };

    // DOM was recreated — force live panels to re-render on the next sync.
    this.lastAurasKey = '';
    this.lastTargetKey = '';
    this.lastInventoryKey = '';

    if (this.lastSnapshot) {
      this.renderBanner(this.lastSnapshot);
      this.renderMinimapPoints(this.lastSnapshot.map);
      this.renderQuestList(this.lastSnapshot);
      this.renderChatLog(this.lastSnapshot);
      this.renderPlayer(this.lastSnapshot);
      this.renderTarget(this.lastSnapshot.target);
      this.updatePosition(this.lastSnapshot);
    }
  }

  private template(tk: ThemeTokens, player: HudPlayerSnapshot): string {
    const playerHpPct = clampPercent(player.hpCur, player.hpMax);
    const playerMpPct = clampPercent(player.mpCur, player.mpMax);
    const playerSpPct = clampPercent(player.spCur, player.spMax);
    const xpPct = clampPercent(player.xpCur, player.xpNext);
    const panels = this.panels();
    const aurasHtml = aurasMarkup(panels.buffs, panels.debuffs);

    const partyHtml = panels.party.map((p) => `
      <div class="hv-hud__party-member">
        <div class="hv-hud__party-avatar">${esc(p.initial)}</div>
        <div class="hv-hud__party-info">
          <div class="hv-hud__party-row"><span>${esc(p.name)}</span><span class="hv-hud__party-role">${esc(p.role)}</span></div>
          <div class="hv-hud__party-hp"><div class="hv-hud__party-hp-fill" style="width:${p.hpPct}"></div></div>
          <div class="hv-hud__party-mp"><div class="hv-hud__party-mp-fill" style="width:${p.mpPct}"></div></div>
        </div>
      </div>`).join('');

    const currencyHtml = panels.currency.map((c) => `
      <div class="hv-hud__currency-item">
        <div class="hv-hud__currency-coin"></div>
        <span>${esc(c.value)}</span>
      </div>`).join('');

    const inventoryHtml = panels.inventory.slice(0, 6).map((item) => itemSlotHtml(tk.slotTheme, item, 44)).join('');
    const hotbarHtml = panels.hotbar.map((item) => itemSlotHtml(tk.slotTheme, item, 52)).join('');

    return `
      <section class="hv-hud__player">
        ${cornerAccents(tk)}
        <div class="hv-hud__portrait">
          <div class="hv-hud__portrait-face">
            <div class="hv-hud__portrait-head"></div>
            <div class="hv-hud__portrait-body"></div>
          </div>
        <div class="hv-hud__portrait-level" data-hud="player-level">${player.level}</div>
      </div>
        <div class="hv-hud__player-info">
          <div class="hv-hud__player-name" data-hud="player-name">${esc(player.name)}</div>
          <div class="hv-hud__player-title" data-hud="player-title">Wanderer · Hearthlight Vale</div>
          <div class="hv-hud__hp-bar"><div class="hv-hud__hp-fill" data-hud="player-hp-fill" style="width:${playerHpPct}"></div><div class="hv-hud__hp-label" data-hud="player-hp-label">${formatStatLabel(player.hpCur, player.hpMax)}</div></div>
          <div class="hv-hud__mp-bar"><div class="hv-hud__mp-fill" data-hud="player-mp-fill" style="width:${playerMpPct}"></div></div>
          <div class="hv-hud__sp-bar"><div class="hv-hud__sp-fill" data-hud="player-sp-fill" style="width:${playerSpPct}"></div></div>
        </div>
      </section>

      <div class="hv-hud__auras" data-hud="auras">${aurasHtml}</div>

      <div class="hv-hud__party">${partyHtml}</div>

      <section class="hv-hud__log">
        <div class="hv-hud__log-tabs">
          <span class="hv-hud__log-tab">Combat</span>
          <span class="hv-hud__log-tab hv-hud__log-tab--active">Chat</span>
        </div>
        <div class="hv-hud__log-body" data-hud="chat-log"></div>
      </section>

      <section class="hv-hud__banner">
        <div class="hv-hud__banner-title" data-hud="banner-title">HearthVale</div>
        <div class="hv-hud__banner-subtitle" data-hud="banner-subtitle">Loading map data&hellip;</div>
      </section>

      <section class="hv-hud__target" data-hud="target" style="display:none"></section>

      <section class="hv-hud__minimap" data-hud="minimap">
        <div class="hv-hud__minimap-dots"></div>
        <div class="hv-hud__minimap-grid" data-hud="minimap-grid">
          <div class="hv-hud__minimap-compass" data-hud="minimap-player"></div>
        </div>
        <div class="hv-hud__minimap-title" data-hud="minimap-title">Local Map · M</div>
        <div class="hv-hud__minimap-coords" data-hud="minimap-coords">0, 0</div>
      </section>

      <section class="hv-hud__currency">${currencyHtml}</section>

      <section class="hv-hud__quests">
        <div class="hv-hud__section-title">Active Quests</div>
        <div class="hv-hud__quest-list" data-hud="quest-list"></div>
      </section>

      <section class="hv-hud__bag">
        <div class="hv-hud__bag-tabs"><span class="hv-hud__bag-tab hv-hud__bag-tab--active">Recent loot</span></div>
        <div class="hv-hud__bag-grid" data-hud="inventory">${inventoryHtml}</div>
      </section>

      <div class="hv-hud__xp">
        <div class="hv-hud__xp-level" data-hud="player-xp-level">${player.level}</div>
        <div class="hv-hud__xp-track"><div class="hv-hud__xp-fill" data-hud="player-xp-fill" style="width:${xpPct}"></div></div>
        <span class="hv-hud__xp-label" data-hud="player-xp-label">${formatXpLabel(player.xpCur, player.xpNext)}</span>
      </div>

      <div class="hv-hud__hotbar">${hotbarHtml}</div>
      <div class="hv-hud__stance" data-hud="player-stance">Stance: ${esc(player.stance)}</div>
    `;
  }

}

export const hudOverlay = new HudOverlay();
