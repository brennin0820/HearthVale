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
    { key: 'music_emberglass', stub: true, loop: true, volume: 0.4 },
    { key: 'music_hollow_kiln', stub: true, loop: true, volume: 0.42 },
    { key: 'music_lanternspire', stub: true, loop: true, volume: 0.44 },
    { key: 'music_afterlight', stub: true, loop: true, volume: 0.44 },
    { key: 'music_dawnshore_camp', stub: true, loop: true, volume: 0.42 },
    { key: 'music_glasswind_coast', stub: true, loop: true, volume: 0.44 },
    { key: 'music_tidebreak_causeway', stub: true, loop: true, volume: 0.44 },
    { key: 'music_stormglass_reliquary', stub: true, loop: true, volume: 0.46 },
    { key: 'music_beaconfall_cliffs', stub: true, loop: true, volume: 0.44 },
    { key: 'music_sunspire_observatory', stub: true, loop: true, volume: 0.47 },
    { key: 'music_aurora_highlands', stub: true, loop: true, volume: 0.44 },
    { key: 'music_zenith_archive', stub: true, loop: true, volume: 0.47 },
    { key: 'music_choirwood_canopy', stub: true, loop: true, volume: 0.45 },
    { key: 'music_crownroot_sanctum', stub: true, loop: true, volume: 0.48 },
    { key: 'music_runeveil_gardens', stub: true, loop: true, volume: 0.45 },
    { key: 'music_namesong_vault', stub: true, loop: true, volume: 0.49 },
    { key: 'music_waystar_moor', stub: true, loop: true, volume: 0.46 },
    { key: 'music_convergence_spire', stub: true, loop: true, volume: 0.5 },
  ],
  sfx: [
    { key: 'sfx_portal', stub: true, volume: 0.6 },
    { key: 'sfx_footstep', stub: true, volume: 0.3 },
    { key: 'sfx_ui_click', stub: true, volume: 0.5 },
    { key: 'sfx_combat_hit', stub: true, volume: 0.7 },
  ],
};
