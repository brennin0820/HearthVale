export interface AudioTrackEntry {
  key: string;
  path?: string;
  stub?: boolean;
  loop?: boolean;
  volume?: number;
}

export interface SfxEntry {
  key: string;
  path?: string;
  stub?: boolean;
  volume?: number;
}

export interface AudioManifest {
  music: AudioTrackEntry[];
  sfx: SfxEntry[];
  /** Neptune lane — run: npm run hearthvale -- research "<query>" audio */
  resourceHints?: string[];
}

/** Map musicKey values and standard SFX keys. */
export const AUDIO_MANIFEST: AudioManifest = {
  resourceHints: [
    'npm run hearthvale -- research "cozy town RPG loop" neptune',
    'npm run hearthvale -- research "UI click SFX CC0" neptune',
    'Hubs: OpenGameArt, Kenney.nl, Freesound (verify license each)',
  ],
  music: [
    { key: 'music_hearthvale_town', stub: true, loop: true, volume: 0.4 },
    { key: 'music_cloverfield', stub: true, loop: true, volume: 0.4 },
    { key: 'music_mushroom_hollow', stub: true, loop: true, volume: 0.4 },
    { key: 'music_whisperwood', stub: true, loop: true, volume: 0.4 },
    { key: 'music_old_mill_road', stub: true, loop: true, volume: 0.4 },
    { key: 'music_millwick_crossing', stub: true, loop: true, volume: 0.4 },
    { key: 'music_crystal_approach', stub: true, loop: true, volume: 0.4 },
    { key: 'music_crystal_mine', stub: true, loop: true, volume: 0.4 },
    { key: 'music_moonwell_entrance', stub: true, loop: true, volume: 0.4 },
    { key: 'music_moonwell_ruins', stub: true, loop: true, volume: 0.4 },
  ],
  sfx: [
    { key: 'sfx_portal', stub: true, volume: 0.6 },
    { key: 'sfx_footstep', stub: true, volume: 0.3 },
    { key: 'sfx_ui_click', stub: true, volume: 0.5 },
    { key: 'sfx_combat_hit', stub: true, volume: 0.7 },
  ],
};
