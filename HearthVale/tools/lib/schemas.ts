import { z } from 'zod';

export function parseOrExit<T>(schema: z.ZodType<T>, value: unknown, label: string): T {
  const result = schema.safeParse(value);
  if (!result.success) {
    console.error(`Invalid ${label}:`);
    for (const issue of result.error.issues) {
      console.error(`  ${issue.path.join('.') || '(root)'}: ${issue.message}`);
    }
    process.exit(1);
  }
  return result.data;
}

export const Vec2Schema = z.object({
  x: z.number(),
  y: z.number(),
});

export const LevelRangeSchema = z.object({
  min: z.number().int().min(1),
  max: z.number().int().min(1),
});

export const MapPortalSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  position: Vec2Schema,
  targetMapId: z.string().min(1),
  targetSpawn: Vec2Schema,
  requiredLevel: z.number().int().optional(),
  requiredQuestId: z.string().optional(),
  requiredQuestStartedId: z.string().optional(),
});

export const ResourceNodeSchema = z.object({
  id: z.string().min(1),
  displayName: z.string().min(1),
  kind: z.enum(['herb', 'ore', 'fiber', 'relic']),
  position: Vec2Schema,
  itemId: z.string().min(1),
  minCount: z.number().int().positive(),
  maxCount: z.number().int().positive(),
  respawnSeconds: z.number().positive(),
  requiredLevel: z.number().int().min(1).optional(),
});

export const MapDefinitionSchema = z.object({
  id: z.string().min(1),
  displayName: z.string().min(1),
  kind: z.enum(['town', 'field', 'dungeon', 'instance']),
  regionId: z.string().min(1),
  levelRange: LevelRangeSchema,
  showOnWorldMap: z.boolean(),
  worldMapPosition: Vec2Schema,
  biome: z.string().min(1),
  musicKey: z.string().min(1),
  gridSize: z.object({ width: z.number().int().positive(), height: z.number().int().positive() }),
  spawnTables: z.array(z.any()),
  resourceNodes: z.array(ResourceNodeSchema).optional(),
  npcs: z.array(z.any()),
  portals: z.array(MapPortalSchema),
  playerSpawn: Vec2Schema,
  safeZone: z
    .object({
      x: z.number(),
      y: z.number(),
      width: z.number().positive(),
      height: z.number().positive(),
    })
    .nullable(),
  assetKey: z.string().min(1),
});

export const MapsFileSchema = z.array(MapDefinitionSchema);

export const MonsterAbilitySchema = z.object({
  id: z.string().min(1),
  displayName: z.string().min(1),
  target: z.enum(['single', 'area']),
  cooldown: z.number().positive(),
  telegraphSeconds: z.number().min(0.25),
  range: z.number().min(40),
  powerMultiplier: z.number().positive(),
  status: z.enum(['poison', 'gloom', 'drenched', 'sunblind', 'fractured', 'muted', 'severed']).optional(),
  statusAmount: z.number().positive().optional(),
  statusDuration: z.number().positive().optional(),
});

export const MonsterSchema = z.object({
  id: z.string().min(1),
  displayName: z.string().min(1),
  baseLevel: z.number().int().min(1),
  hp: z.number().int().positive(),
  atk: z.number().int().min(0),
  def: z.number().int().min(0),
  size: z.enum(['small', 'medium', 'large']),
  element: z.string().min(1),
  abilities: z.array(MonsterAbilitySchema).optional(),
});
