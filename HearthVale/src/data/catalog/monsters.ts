import type { MonsterDefinition } from './types.js';

/** Starter-region monster catalog — HearthVale original IP. */
export const MONSTERS: MonsterDefinition[] = [
  { id: 'jellybud', displayName: 'Jellybud', baseLevel: 1, hp: 45, atk: 8, def: 2, size: 'small', element: 'nature' },
  { id: 'spriggle', displayName: 'Spriggle', baseLevel: 2, hp: 55, atk: 10, def: 3, size: 'small', element: 'nature' },
  { id: 'puffshroom', displayName: 'Puffshroom', baseLevel: 3, hp: 70, atk: 12, def: 4, size: 'small', element: 'fungal' },
  { id: 'sporeling', displayName: 'Sporeling', baseLevel: 4, hp: 85, atk: 14, def: 5, size: 'small', element: 'fungal' },
  { id: 'leafsprite', displayName: 'Leafsprite', baseLevel: 5, hp: 95, atk: 16, def: 6, size: 'small', element: 'nature' },
  { id: 'barkling', displayName: 'Barkling', baseLevel: 6, hp: 110, atk: 18, def: 8, size: 'medium', element: 'nature' },
  { id: 'roadjack', displayName: 'Roadjack', baseLevel: 8, hp: 130, atk: 22, def: 10, size: 'medium', element: 'neutral' },
  { id: 'windmite', displayName: 'Windmite', baseLevel: 9, hp: 120, atk: 24, def: 8, size: 'small', element: 'wind' },
  { id: 'shardling', displayName: 'Shardling', baseLevel: 7, hp: 100, atk: 20, def: 12, size: 'small', element: 'crystal' },
  { id: 'cavebat', displayName: 'Cavebat', baseLevel: 8, hp: 90, atk: 21, def: 6, size: 'small', element: 'neutral' },
  { id: 'crystal_golem', displayName: 'Crystal Golem', baseLevel: 11, hp: 220, atk: 28, def: 18, size: 'large', element: 'crystal' },
  { id: 'vein_wraith', displayName: 'Vein Wraith', baseLevel: 12, hp: 160, atk: 32, def: 10, size: 'medium', element: 'shadow' },
  { id: 'moonmoth', displayName: 'Moonmoth', baseLevel: 10, hp: 105, atk: 19, def: 7, size: 'small', element: 'lunar' },
  { id: 'glade_stalker', displayName: 'Glade Stalker', baseLevel: 11, hp: 150, atk: 26, def: 11, size: 'medium', element: 'nature' },
  { id: 'rune_sentinel', displayName: 'Rune Sentinel', baseLevel: 13, hp: 200, atk: 30, def: 16, size: 'large', element: 'arcane' },
  { id: 'moonwell_guardian', displayName: 'Moonwell Guardian', baseLevel: 14, hp: 320, atk: 36, def: 20, size: 'large', element: 'lunar' },
  { id: 'reedwhisper', displayName: 'Reedwhisper', baseLevel: 12, hp: 135, atk: 25, def: 9, size: 'small', element: 'water' },
  { id: 'fen_wisp', displayName: 'Fen Wisp', baseLevel: 13, hp: 150, atk: 31, def: 8, size: 'small', element: 'spirit' },
  { id: 'glimmercroc', displayName: 'Glimmercroc', baseLevel: 14, hp: 260, atk: 34, def: 18, size: 'large', element: 'water' },
  { id: 'wellbound_echo', displayName: 'Wellbound Echo', baseLevel: 14, hp: 190, atk: 34, def: 11, size: 'medium', element: 'spirit' },
  { id: 'tidemoon_matriarch', displayName: 'Tidemoon Matriarch', baseLevel: 14, hp: 560, atk: 43, def: 24, size: 'large', element: 'lunar' },
  { id: 'cinder_mote', displayName: 'Cinder Mote', baseLevel: 11, hp: 120, atk: 26, def: 7, size: 'small', element: 'fire' },
  { id: 'prism_scarab', displayName: 'Prism Scarab', baseLevel: 12, hp: 160, atk: 29, def: 14, size: 'medium', element: 'crystal' },
  { id: 'sinterhorn', displayName: 'Sinterhorn', baseLevel: 13, hp: 240, atk: 35, def: 16, size: 'large', element: 'fire' },
  { id: 'kilnheart_colossus', displayName: 'Kilnheart Colossus', baseLevel: 14, hp: 600, atk: 45, def: 25, size: 'large', element: 'fire' },
  { id: 'aurora_mote', displayName: 'Aurora Mote', baseLevel: 14, hp: 210, atk: 36, def: 12, size: 'small', element: 'spirit' },
  { id: 'gloam_warden', displayName: 'Gloam Warden', baseLevel: 14, hp: 300, atk: 42, def: 20, size: 'medium', element: 'shadow' },
  { id: 'starved_crown', displayName: 'The Starved Crown', baseLevel: 14, hp: 900, atk: 52, def: 28, size: 'large', element: 'shadow' },
  { id: 'sunshard_mote', displayName: 'Sunshard Mote', baseLevel: 14, hp: 250, atk: 39, def: 13, size: 'small', element: 'spirit' },
  { id: 'voidglass_revenant', displayName: 'Voidglass Revenant', baseLevel: 14, hp: 340, atk: 45, def: 19, size: 'medium', element: 'shadow' },
  { id: 'dawnscale_sentinel', displayName: 'Dawnscale Sentinel', baseLevel: 14, hp: 430, atk: 48, def: 27, size: 'large', element: 'crystal' },
  { id: 'eclipse_herald', displayName: 'Eclipse Herald', baseLevel: 14, hp: 1200, atk: 58, def: 31, size: 'large', element: 'shadow' },
  { id: 'tideglass_mote', displayName: 'Tideglass Mote', baseLevel: 15, hp: 300, atk: 43, def: 15, size: 'small', element: 'water' },
  { id: 'saltbound_husk', displayName: 'Saltbound Husk', baseLevel: 15, hp: 420, atk: 49, def: 24, size: 'medium', element: 'crystal' },
  { id: 'beacon_wraith', displayName: 'Beacon Wraith', baseLevel: 16, hp: 360, atk: 52, def: 19, size: 'medium', element: 'shadow' },
  {
    id: 'drowned_meridian', displayName: 'The Drowned Meridian', baseLevel: 16, hp: 1450, atk: 64, def: 34, size: 'large', element: 'water',
    abilities: [
      { id: 'false_bearing', displayName: 'False Bearing', target: 'area', cooldown: 8, telegraphSeconds: 1.1, range: 150, powerMultiplier: 1.05, status: 'drenched', statusAmount: 12, statusDuration: 6 },
    ],
  },
  {
    id: 'brinewing_ray', displayName: 'Brinewing Ray', baseLevel: 16, hp: 390, atk: 55, def: 17, size: 'medium', element: 'water',
    abilities: [
      { id: 'undertow_burst', displayName: 'Undertow Burst', target: 'area', cooldown: 7.5, telegraphSeconds: 0.85, range: 125, powerMultiplier: 0.85, status: 'drenched', statusAmount: 15, statusDuration: 6 },
    ],
  },
  {
    id: 'surgeclaw', displayName: 'Surgeclaw', baseLevel: 16, hp: 480, atk: 58, def: 27, size: 'medium', element: 'crystal',
    abilities: [
      { id: 'riptide_clamp', displayName: 'Riptide Clamp', target: 'single', cooldown: 6.5, telegraphSeconds: 0.7, range: 96, powerMultiplier: 1.45, status: 'drenched', statusAmount: 10, statusDuration: 5 },
    ],
  },
  {
    id: 'galehorn_prowler', displayName: 'Galehorn Prowler', baseLevel: 17, hp: 540, atk: 62, def: 24, size: 'large', element: 'wind',
    abilities: [
      { id: 'gale_pounce', displayName: 'Gale Pounce', target: 'single', cooldown: 6, telegraphSeconds: 0.65, range: 118, powerMultiplier: 1.55 },
    ],
  },
  {
    id: 'stormglass_custodian', displayName: 'Stormglass Custodian', baseLevel: 17, hp: 650, atk: 66, def: 34, size: 'large', element: 'crystal',
    abilities: [
      { id: 'prism_surge', displayName: 'Prism Surge', target: 'area', cooldown: 7, telegraphSeconds: 1, range: 145, powerMultiplier: 1.1 },
    ],
  },
  {
    id: 'tempest_remnant', displayName: 'The Tempest Remnant', baseLevel: 18, hp: 1850, atk: 74, def: 39, size: 'large', element: 'spirit',
    abilities: [
      { id: 'eye_of_the_storm', displayName: 'Eye of the Storm', target: 'area', cooldown: 9, telegraphSeconds: 1.25, range: 180, powerMultiplier: 1.3, status: 'drenched', statusAmount: 22, statusDuration: 8 },
      { id: 'stormglass_fall', displayName: 'Stormglass Fall', target: 'single', cooldown: 7, telegraphSeconds: 0.8, range: 150, powerMultiplier: 1.7 },
    ],
  },
  {
    id: 'sunveil_sprite', displayName: 'Sunveil Sprite', baseLevel: 18, hp: 680, atk: 70, def: 21, size: 'small', element: 'spirit',
    abilities: [
      { id: 'solar_flare', displayName: 'Solar Flare', target: 'area', cooldown: 7.5, telegraphSeconds: 0.95, range: 140, powerMultiplier: 0.9, status: 'sunblind', statusAmount: 20, statusDuration: 8 },
    ],
  },
  {
    id: 'zephyrkin_screecher', displayName: 'Zephyrkin Screecher', baseLevel: 18, hp: 760, atk: 72, def: 24, size: 'medium', element: 'wind',
    abilities: [
      { id: 'crosswind_dive', displayName: 'Crosswind Dive', target: 'single', cooldown: 6.5, telegraphSeconds: 0.7, range: 125, powerMultiplier: 1.55 },
    ],
  },
  {
    id: 'cliffglass_ram', displayName: 'Cliffglass Ram', baseLevel: 19, hp: 920, atk: 78, def: 38, size: 'large', element: 'crystal',
    abilities: [
      { id: 'shatterline', displayName: 'Shatterline', target: 'area', cooldown: 7, telegraphSeconds: 1, range: 150, powerMultiplier: 1.15 },
    ],
  },
  {
    id: 'lensbound_sentry', displayName: 'Lensbound Sentry', baseLevel: 19, hp: 980, atk: 80, def: 40, size: 'large', element: 'arcane',
    abilities: [
      { id: 'refracted_gaze', displayName: 'Refracted Gaze', target: 'single', cooldown: 6.5, telegraphSeconds: 0.8, range: 145, powerMultiplier: 1.35, status: 'sunblind', statusAmount: 25, statusDuration: 9 },
    ],
  },
  {
    id: 'starfall_choir', displayName: 'Starfall Choir', baseLevel: 20, hp: 860, atk: 84, def: 27, size: 'medium', element: 'spirit',
    abilities: [
      { id: 'falling_chorus', displayName: 'Falling Chorus', target: 'area', cooldown: 7.5, telegraphSeconds: 1.1, range: 165, powerMultiplier: 1.2 },
    ],
  },
  {
    id: 'celestial_orrery', displayName: 'The Celestial Orrery', baseLevel: 20, hp: 2600, atk: 92, def: 48, size: 'large', element: 'arcane',
    abilities: [
      { id: 'daybreak_axis', displayName: 'Daybreak Axis', target: 'area', cooldown: 9, telegraphSeconds: 1.25, range: 185, powerMultiplier: 1.3, status: 'sunblind', statusAmount: 30, statusDuration: 10 },
      { id: 'falling_constellation', displayName: 'Falling Constellation', target: 'single', cooldown: 7, telegraphSeconds: 0.85, range: 160, powerMultiplier: 1.8 },
    ],
  },
  {
    id: 'prismwing_moth', displayName: 'Prismwing Moth', baseLevel: 20, hp: 960, atk: 86, def: 29, size: 'medium', element: 'spirit',
    abilities: [
      { id: 'rainbow_shear', displayName: 'Rainbow Shear', target: 'area', cooldown: 7.2, telegraphSeconds: 0.9, range: 145, powerMultiplier: 1, status: 'fractured', statusAmount: 10, statusDuration: 8 },
    ],
  },
  {
    id: 'sunforge_boar', displayName: 'Sunforge Boar', baseLevel: 20, hp: 1180, atk: 90, def: 45, size: 'large', element: 'fire',
    abilities: [
      { id: 'sunmetal_charge', displayName: 'Sunmetal Charge', target: 'single', cooldown: 6.5, telegraphSeconds: 0.75, range: 130, powerMultiplier: 1.6, status: 'fractured', statusAmount: 14, statusDuration: 8 },
    ],
  },
  {
    id: 'horizon_raptor', displayName: 'Horizon Raptor', baseLevel: 21, hp: 1050, atk: 94, def: 33, size: 'medium', element: 'wind',
    abilities: [
      { id: 'horizon_rake', displayName: 'Horizon Rake', target: 'area', cooldown: 7, telegraphSeconds: 0.9, range: 155, powerMultiplier: 1.25 },
    ],
  },
  {
    id: 'index_wraith', displayName: 'Index Wraith', baseLevel: 21, hp: 1100, atk: 96, def: 35, size: 'medium', element: 'arcane',
    abilities: [
      { id: 'redacted_memory', displayName: 'Redacted Memory', target: 'area', cooldown: 8, telegraphSeconds: 1, range: 165, powerMultiplier: 1.15, status: 'fractured', statusAmount: 16, statusDuration: 9 },
    ],
  },
  {
    id: 'gilded_automaton', displayName: 'Gilded Automaton', baseLevel: 22, hp: 1350, atk: 102, def: 52, size: 'large', element: 'crystal',
    abilities: [
      { id: 'catalogue_crush', displayName: 'Catalogue Crush', target: 'single', cooldown: 6.5, telegraphSeconds: 0.8, range: 145, powerMultiplier: 1.65, status: 'fractured', statusAmount: 18, statusDuration: 9 },
    ],
  },
  {
    id: 'keeper_of_zenith', displayName: 'The Keeper of Zenith', baseLevel: 22, hp: 3400, atk: 112, def: 60, size: 'large', element: 'arcane',
    abilities: [
      { id: 'final_revision', displayName: 'Final Revision', target: 'area', cooldown: 9, telegraphSeconds: 1.25, range: 190, powerMultiplier: 1.4, status: 'fractured', statusAmount: 22, statusDuration: 10 },
      { id: 'closed_book', displayName: 'Closed Book', target: 'single', cooldown: 7, telegraphSeconds: 0.85, range: 170, powerMultiplier: 1.9 },
    ],
  },
  {
    id: 'chimebeetle', displayName: 'Chimebeetle', baseLevel: 22, hp: 1180, atk: 104, def: 38, size: 'small', element: 'nature',
    abilities: [
      { id: 'carapace_chime', displayName: 'Carapace Chime', target: 'area', cooldown: 7.5, telegraphSeconds: 0.9, range: 145, powerMultiplier: 1.1 },
    ],
  },
  {
    id: 'canticle_stag', displayName: 'Canticle Stag', baseLevel: 23, hp: 1480, atk: 110, def: 49, size: 'large', element: 'spirit',
    abilities: [
      { id: 'antler_refrain', displayName: 'Antler Refrain', target: 'single', cooldown: 6.5, telegraphSeconds: 0.75, range: 140, powerMultiplier: 1.7 },
    ],
  },
  {
    id: 'mossbound_cantor', displayName: 'Mossbound Cantor', baseLevel: 23, hp: 1320, atk: 114, def: 41, size: 'medium', element: 'nature',
    abilities: [
      { id: 'hushing_verse', displayName: 'Hushing Verse', target: 'area', cooldown: 8, telegraphSeconds: 1.05, range: 165, powerMultiplier: 1.05, status: 'muted', statusAmount: 1, statusDuration: 8 },
    ],
  },
  {
    id: 'scriptroot_lurker', displayName: 'Scriptroot Lurker', baseLevel: 23, hp: 1550, atk: 116, def: 51, size: 'medium', element: 'shadow',
    abilities: [
      { id: 'inkvine_lash', displayName: 'Inkvine Lash', target: 'single', cooldown: 6.5, telegraphSeconds: 0.8, range: 150, powerMultiplier: 1.75 },
    ],
  },
  {
    id: 'bellglass_myconid', displayName: 'Bellglass Myconid', baseLevel: 24, hp: 1680, atk: 121, def: 55, size: 'large', element: 'fungal',
    abilities: [
      { id: 'stillspore_peal', displayName: 'Stillspore Peal', target: 'area', cooldown: 7.5, telegraphSeconds: 1, range: 170, powerMultiplier: 1.15, status: 'muted', statusAmount: 1, statusDuration: 9 },
    ],
  },
  {
    id: 'crownroot_hierophant', displayName: 'The Crownroot Hierophant', baseLevel: 24, hp: 4300, atk: 132, def: 68, size: 'large', element: 'spirit',
    abilities: [
      { id: 'edict_of_silence', displayName: 'Edict of Silence', target: 'area', cooldown: 9, telegraphSeconds: 1.25, range: 195, powerMultiplier: 1.45, status: 'muted', statusAmount: 1, statusDuration: 10 },
      { id: 'crownfall_cadence', displayName: 'Crownfall Cadence', target: 'single', cooldown: 7, telegraphSeconds: 0.85, range: 175, powerMultiplier: 2 },
    ],
  },
  {
    id: 'glyphhare', displayName: 'Glyphhare', baseLevel: 24, hp: 1620, atk: 124, def: 50, size: 'small', element: 'nature',
    abilities: [{ id: 'skipping_sigils', displayName: 'Skipping Sigils', target: 'single', cooldown: 6.2, telegraphSeconds: 0.7, range: 145, powerMultiplier: 1.75 }],
  },
  {
    id: 'lanternback_elk', displayName: 'Lanternback Elk', baseLevel: 25, hp: 1900, atk: 130, def: 61, size: 'large', element: 'spirit',
    abilities: [{ id: 'memory_charge', displayName: 'Memory Charge', target: 'area', cooldown: 8, telegraphSeconds: 1.05, range: 175, powerMultiplier: 1.25, status: 'fractured', statusAmount: 18, statusDuration: 9 }],
  },
  {
    id: 'wayglass_watcher', displayName: 'Wayglass Watcher', baseLevel: 25, hp: 1780, atk: 133, def: 64, size: 'medium', element: 'crystal',
    abilities: [{ id: 'refracted_verdict', displayName: 'Refracted Verdict', target: 'area', cooldown: 8.5, telegraphSeconds: 1.1, range: 180, powerMultiplier: 1.2, status: 'fractured', statusAmount: 20, statusDuration: 10 }],
  },
  {
    id: 'epitaph_sentinel', displayName: 'Epitaph Sentinel', baseLevel: 25, hp: 2050, atk: 136, def: 69, size: 'large', element: 'shadow',
    abilities: [{ id: 'stoneword_censure', displayName: 'Stoneword Censure', target: 'single', cooldown: 7, telegraphSeconds: 0.85, range: 160, powerMultiplier: 1.9, status: 'muted', statusAmount: 1, statusDuration: 8 }],
  },
  {
    id: 'pale_scriptling', displayName: 'Pale Scriptling', baseLevel: 26, hp: 1880, atk: 141, def: 62, size: 'medium', element: 'arcane',
    abilities: [{ id: 'borrowed_name', displayName: 'Borrowed Name', target: 'area', cooldown: 8, telegraphSeconds: 1, range: 175, powerMultiplier: 1.25, status: 'gloom', statusAmount: 20, statusDuration: 10 }],
  },
  {
    id: 'archivore', displayName: 'The Archivore', baseLevel: 26, hp: 5200, atk: 151, def: 82, size: 'large', element: 'spirit',
    abilities: [
      { id: 'catalogue_of_one', displayName: 'Catalogue of One', target: 'area', cooldown: 9, telegraphSeconds: 1.3, range: 205, powerMultiplier: 1.5, status: 'muted', statusAmount: 1, statusDuration: 10 },
      { id: 'unwritten_end', displayName: 'Unwritten End', target: 'single', cooldown: 7.2, telegraphSeconds: 0.9, range: 180, powerMultiplier: 2.1, status: 'fractured', statusAmount: 24, statusDuration: 10 },
    ],
  },
  {
    id: 'waystar_grazer', displayName: 'Waystar Grazer', baseLevel: 26, hp: 2220, atk: 148, def: 68, size: 'large', element: 'spirit',
    abilities: [{ id: 'comet_antlers', displayName: 'Comet Antlers', target: 'area', cooldown: 8, telegraphSeconds: 1.05, range: 180, powerMultiplier: 1.3, status: 'fractured', statusAmount: 20, statusDuration: 9 }],
  },
  {
    id: 'compass_scarab', displayName: 'Compass Scarab', baseLevel: 27, hp: 2050, atk: 151, def: 75, size: 'medium', element: 'crystal',
    abilities: [{ id: 'unthreaded_axis', displayName: 'Unthreaded Axis', target: 'single', cooldown: 7, telegraphSeconds: 0.85, range: 160, powerMultiplier: 1.9, status: 'severed', statusAmount: 100, statusDuration: 10 }],
  },
  {
    id: 'pathless_wisp', displayName: 'Pathless Wisp', baseLevel: 27, hp: 1960, atk: 154, def: 66, size: 'small', element: 'arcane',
    abilities: [{ id: 'road_without_mark', displayName: 'Road Without Mark', target: 'area', cooldown: 8.5, telegraphSeconds: 1.1, range: 185, powerMultiplier: 1.2, status: 'severed', statusAmount: 100, statusDuration: 11 }],
  },
  {
    id: 'vowsteel_knight', displayName: 'Vowsteel Knight', baseLevel: 27, hp: 2420, atk: 158, def: 82, size: 'large', element: 'spirit',
    abilities: [{ id: 'severing_edict', displayName: 'Severing Edict', target: 'area', cooldown: 8, telegraphSeconds: 1.05, range: 180, powerMultiplier: 1.35, status: 'severed', statusAmount: 100, statusDuration: 12 }],
  },
  {
    id: 'splitstar_echo', displayName: 'Splitstar Echo', baseLevel: 28, hp: 2180, atk: 162, def: 72, size: 'medium', element: 'shadow',
    abilities: [{ id: 'divided_refrain', displayName: 'Divided Refrain', target: 'single', cooldown: 7.2, telegraphSeconds: 0.9, range: 170, powerMultiplier: 2, status: 'muted', statusAmount: 1, statusDuration: 9 }],
  },
  {
    id: 'manyroad_crown', displayName: 'The Manyroad Crown', baseLevel: 28, hp: 6400, atk: 174, def: 94, size: 'large', element: 'arcane',
    abilities: [
      { id: 'edict_of_no_return', displayName: 'Edict of No Return', target: 'area', cooldown: 9, telegraphSeconds: 1.3, range: 210, powerMultiplier: 1.55, status: 'severed', statusAmount: 100, statusDuration: 13 },
      { id: 'twelvefold_sentence', displayName: 'Twelvefold Sentence', target: 'single', cooldown: 7, telegraphSeconds: 0.9, range: 185, powerMultiplier: 2.2, status: 'fractured', statusAmount: 26, statusDuration: 11 },
    ],
  },
];

export const MONSTER_BY_ID = new Map(MONSTERS.map((m) => [m.id, m]));
