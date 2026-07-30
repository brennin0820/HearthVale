import type {
  BiomeDefinition,
  CollisionGrid,
  GameData,
  DropTableDefinition,
  ItemDefinition,
  JobDefinition,
  MapDefinition,
  MapPropSet,
  MonsterDefinition,
  NpcDefinition,
  QuestDefinition,
  RecipeDefinition,
  RegionDefinition,
  ShopDefinition,
  SkillDefinition,
} from './types.js';

async function loadJson<T>(path: string): Promise<T> {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`Could not load ${path} (${response.status})`);
  return response.json() as Promise<T>;
}

async function loadOptionalJson<T>(path: string): Promise<T | undefined> {
  const response = await fetch(path);
  if (response.status === 404) return undefined;
  if (!response.ok) throw new Error(`Could not load ${path} (${response.status})`);
  return response.json() as Promise<T>;
}

export async function loadGameData(): Promise<GameData> {
  const [loadedMaps, regions, biomes, npcs, monsters, jobs, skills, items, quests, drops, shops, recipes] = await Promise.all([
    loadJson<MapDefinition[]>('/maps.json'),
    loadJson<RegionDefinition[]>('/regions.json'),
    loadJson<BiomeDefinition[]>('/biomes.json'),
    loadJson<NpcDefinition[]>('/catalog/npcs.json'),
    loadJson<MonsterDefinition[]>('/catalog/monsters.json'),
    loadJson<JobDefinition[]>('/catalog/jobs.json'),
    loadJson<SkillDefinition[]>('/catalog/skills.json'),
    loadJson<ItemDefinition[]>('/catalog/items.json'),
    loadJson<QuestDefinition[]>('/catalog/quests.json'),
    loadJson<DropTableDefinition[]>('/catalog/drops.json'),
    loadJson<ShopDefinition[]>('/catalog/shops.json'),
    loadJson<RecipeDefinition[]>('/catalog/recipes.json'),
  ]);
  const maps = loadedMaps.map((map) => map.id.endsWith('_ro') || map.id.endsWith('_ro_b1')
    ? { ...map, displayName: map.displayName.replace(' RO Draft', '') }
    : map);
  const mapContent = await Promise.all(maps.map(async (map) => {
    const [collision, props] = await Promise.all([
      loadOptionalJson<CollisionGrid>(`/collision/${map.id}.json`),
      loadOptionalJson<MapPropSet>(`/props/${map.id}.json`),
    ]);
    return { mapId: map.id, collision, props };
  }));
  return {
    maps,
    regions,
    biomes,
    npcs,
    monsters,
    items,
    quests,
    drops,
    shops,
    recipes,
    jobs,
    skills,
    collisions: Object.fromEntries(mapContent.flatMap(({ mapId, collision }) => collision ? [[mapId, collision]] : [])),
    props: Object.fromEntries(mapContent.flatMap(({ mapId, props }) => props ? [[mapId, props]] : [])),
  };
}
