export interface BiomeDefinition {
  id: string;
  displayName: string;
  groundColor: string;
  accentColor: string;
}

export const BIOMES: BiomeDefinition[] = [
  { id: 'temperate_town', displayName: 'Temperate Town', groundColor: '#4a6741', accentColor: '#c9a86c' },
  { id: 'clover_grassland', displayName: 'Clover Grassland', groundColor: '#5a8f4a', accentColor: '#8fbc8f' },
  { id: 'fungal_grove', displayName: 'Fungal Grove', groundColor: '#6b4f7a', accentColor: '#8fbc8f' },
  { id: 'whisperwood', displayName: 'Whisperwood', groundColor: '#3d6b4f', accentColor: '#8fbc8f' },
  { id: 'mill_countryside', displayName: 'Mill Countryside', groundColor: '#7a8f4a', accentColor: '#8fbc8f' },
  { id: 'riverside_town', displayName: 'Riverside Town', groundColor: '#4a7a6b', accentColor: '#c9a86c' },
  { id: 'crystal_foothills', displayName: 'Crystal Foothills', groundColor: '#6b7a5a', accentColor: '#8fbc8f' },
  { id: 'crystal_cavern', displayName: 'Crystal Cavern', groundColor: '#3d4f6f', accentColor: '#7a6b8f' },
  { id: 'moonlit_glade', displayName: 'Moonlit Glade', groundColor: '#4a5a7a', accentColor: '#8fbc8f' },
  { id: 'reed_fen', displayName: 'Reed Fen', groundColor: '#3f6f68', accentColor: '#9fc8c6' },
  { id: 'ancient_ruins', displayName: 'Ancient Ruins', groundColor: '#5a4a6b', accentColor: '#7a6b8f' },
  { id: 'moonwell_depths', displayName: 'Moonwell Depths', groundColor: '#263f58', accentColor: '#85d7cf' },
  { id: 'emberglass_shelf', displayName: 'Emberglass Shelf', groundColor: '#4f5149', accentColor: '#e99b55' },
  { id: 'hollow_kiln', displayName: 'Hollow Kiln', groundColor: '#332829', accentColor: '#f07b42' },
  { id: 'lanternspire_summit', displayName: 'Lanternspire Summit', groundColor: '#273a42', accentColor: '#f1cf72' },
  { id: 'afterlight_expanse', displayName: 'Afterlight Expanse', groundColor: '#304c4e', accentColor: '#f0d27a' },
  { id: 'dawnshore_camp', displayName: 'Dawnshore Camp', groundColor: '#3c6561', accentColor: '#e8cb79' },
  { id: 'glasswind_coast', displayName: 'Glasswind Coast', groundColor: '#315b62', accentColor: '#8fd8d0' },
  { id: 'tidebreak_causeway', displayName: 'Tidebreak Causeway', groundColor: '#34565c', accentColor: '#99d8c9' },
  { id: 'stormglass_reliquary', displayName: 'Stormglass Reliquary', groundColor: '#283c4b', accentColor: '#9bded4' },
  { id: 'beaconfall_cliffs', displayName: 'Beaconfall Cliffs', groundColor: '#485c58', accentColor: '#e6cf7f' },
  { id: 'sunspire_observatory', displayName: 'Sunspire Observatory', groundColor: '#343f50', accentColor: '#efd889' },
  { id: 'aurora_highlands', displayName: 'Aurora Highlands', groundColor: '#486257', accentColor: '#b8dda0' },
  { id: 'zenith_archive', displayName: 'Zenith Archive', groundColor: '#394744', accentColor: '#dfc877' },
  { id: 'choirwood_canopy', displayName: 'Choirwood Canopy', groundColor: '#365c49', accentColor: '#d7ce7e' },
  { id: 'crownroot_sanctum', displayName: 'Crownroot Sanctum', groundColor: '#2f4338', accentColor: '#c7b96e' },
  { id: 'runeveil_gardens', displayName: 'Runeveil Gardens', groundColor: '#38564e', accentColor: '#d3a8b4' },
  { id: 'namesong_vault', displayName: 'Namesong Vault', groundColor: '#303f44', accentColor: '#9fd2c6' },
  { id: 'waystar_moor', displayName: 'Waystar Moor', groundColor: '#3f554f', accentColor: '#d2c46f' },
  { id: 'convergence_spire', displayName: 'Convergence Spire', groundColor: '#343541', accentColor: '#c3a5dd' },
];

export const BIOME_BY_ID = new Map(BIOMES.map((b) => [b.id, b]));
