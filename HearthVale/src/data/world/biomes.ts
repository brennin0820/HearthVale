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
  { id: 'ancient_ruins', displayName: 'Ancient Ruins', groundColor: '#5a4a6b', accentColor: '#7a6b8f' },
];

export const BIOME_BY_ID = new Map(BIOMES.map((b) => [b.id, b]));
