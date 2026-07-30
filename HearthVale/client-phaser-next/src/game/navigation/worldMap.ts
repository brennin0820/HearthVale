import type { GameData, MapDefinition, MapPortal, QuestDefinition } from '../data/types.js';
import type { QuestState } from '../simulation/WorldSimulation.js';

export type WorldMapNodeStatus = 'current' | 'visited' | 'available' | 'locked' | 'uncharted';
export type WorldMapRouteStatus = 'traveled' | 'available' | 'locked' | 'uncharted';

export interface WorldMapNode {
  id: string;
  displayName: string;
  kind: MapDefinition['kind'];
  levelMin: number;
  levelMax: number;
  x: number;
  y: number;
  status: WorldMapNodeStatus;
  objectiveLabels: string[];
  lockReasons: string[];
}

export interface WorldMapRoute {
  id: string;
  sourceId: string;
  targetId: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  status: WorldMapRouteStatus;
}

export interface WorldMapModel {
  regionName: string;
  discoveredCount: number;
  pinCount: number;
  nodes: WorldMapNode[];
  routes: WorldMapRoute[];
}

type WorldMapData = Pick<GameData, 'maps' | 'regions' | 'quests' | 'drops'>;

interface PortalRef {
  sourceId: string;
  portal: MapPortal;
}

export function buildWorldMapModel(
  data: WorldMapData,
  currentMapId: string,
  playerLevel: number,
  questStates: QuestState[],
  discoveredMapIds: string[],
): WorldMapModel {
  const currentMap = data.maps.find((map) => map.id === currentMapId) ?? data.maps[0];
  const region = data.regions?.find((candidate) => candidate.id === currentMap?.regionId) ?? data.regions?.[0];
  const discovered = new Set([...discoveredMapIds, currentMapId]);
  const completedQuests = new Set(questStates.filter((quest) => quest.status === 'completed').map((quest) => quest.questId));
  const startedQuests = new Set(questStates.map((quest) => quest.questId));
  const questCatalog = new Map(data.quests.map((quest) => [quest.id, quest]));
  const objectives = objectiveLabelsByMap(data, questStates);
  const maps = data.maps.filter((map) => map.regionId === currentMap?.regionId
    && (map.showOnWorldMap || map.id === currentMapId));
  const visibleIds = new Set(maps.map((map) => map.id));
  const bounds = region?.worldMapBounds ?? boundsFor(maps);
  const positions = new Map(maps.map((map) => {
    const position = map.worldMapPosition ?? { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 };
    return [map.id, {
      x: clamp(6 + ((position.x - bounds.x) / Math.max(1, bounds.width)) * 88, 5, 95),
      y: clamp(8 + ((position.y - bounds.y) / Math.max(1, bounds.height)) * 84, 6, 94),
    }];
  }));

  const portalRefs: PortalRef[] = data.maps.flatMap((map) => map.portals.map((portal) => ({ sourceId: map.id, portal })))
    .filter((ref) => visibleIds.has(ref.sourceId) && visibleIds.has(ref.portal.targetMapId));
  const refsByTarget = new Map<string, PortalRef[]>();
  for (const ref of portalRefs) {
    const refs = refsByTarget.get(ref.portal.targetMapId) ?? [];
    refs.push(ref);
    refsByTarget.set(ref.portal.targetMapId, refs);
  }

  const nodes = maps.map((map): WorldMapNode => {
    const incoming = (refsByTarget.get(map.id) ?? []).filter((ref) => discovered.has(ref.sourceId));
    const unlockedIncoming = incoming.filter((ref) => portalLockReasons(ref.portal, playerLevel, completedQuests, startedQuests, questCatalog).length === 0);
    const lockReasons = unique(incoming.flatMap((ref) => portalLockReasons(ref.portal, playerLevel, completedQuests, startedQuests, questCatalog)));
    let status: WorldMapNodeStatus = 'uncharted';
    if (map.id === currentMapId) status = 'current';
    else if (discovered.has(map.id)) status = 'visited';
    else if (unlockedIncoming.length > 0) status = 'available';
    else if (incoming.length > 0) status = 'locked';
    const position = positions.get(map.id)!;
    return {
      id: map.id,
      displayName: map.displayName,
      kind: map.kind,
      levelMin: map.levelRange.min,
      levelMax: map.levelRange.max,
      x: position.x,
      y: position.y,
      status,
      objectiveLabels: objectives.get(map.id) ?? [],
      lockReasons,
    };
  });

  const routeGroups = new Map<string, PortalRef[]>();
  for (const ref of portalRefs) {
    const key = [ref.sourceId, ref.portal.targetMapId].sort().join('::');
    const refs = routeGroups.get(key) ?? [];
    refs.push(ref);
    routeGroups.set(key, refs);
  }
  const routes = [...routeGroups.entries()].map(([id, refs]): WorldMapRoute => {
    const [sourceId, targetId] = id.split('::');
    const source = positions.get(sourceId)!;
    const target = positions.get(targetId)!;
    const discoveredTraversals = refs.filter((ref) => discovered.has(ref.sourceId));
    const hasUnlockedTraversal = discoveredTraversals.some((ref) => portalLockReasons(ref.portal, playerLevel, completedQuests, startedQuests, questCatalog).length === 0);
    const hasLockedTraversal = discoveredTraversals.some((ref) => portalLockReasons(ref.portal, playerLevel, completedQuests, startedQuests, questCatalog).length > 0);
    const status: WorldMapRouteStatus = discovered.has(sourceId) && discovered.has(targetId)
      ? 'traveled'
      : hasUnlockedTraversal
        ? 'available'
        : hasLockedTraversal
          ? 'locked'
          : 'uncharted';
    return { id, sourceId, targetId, x1: source.x, y1: source.y, x2: target.x, y2: target.y, status };
  });

  return {
    regionName: region?.displayName ?? 'Hearthlight Vale',
    discoveredCount: maps.filter((map) => discovered.has(map.id)).length,
    pinCount: maps.length,
    nodes,
    routes,
  };
}

function objectiveLabelsByMap(data: WorldMapData, questStates: QuestState[]): Map<string, string[]> {
  const labels = new Map<string, string[]>();
  const dropsByItem = new Map<string, string[]>();
  for (const table of data.drops) {
    for (const entry of table.entries) {
      const monsters = dropsByItem.get(entry.itemId) ?? [];
      monsters.push(table.monsterId);
      dropsByItem.set(entry.itemId, monsters);
    }
  }

  const add = (mapId: string, label: string): void => {
    const mapLabels = labels.get(mapId) ?? [];
    if (!mapLabels.includes(label)) mapLabels.push(label);
    labels.set(mapId, mapLabels);
  };

  for (const state of questStates) {
    if (state.status === 'completed') continue;
    const quest = data.quests.find((candidate) => candidate.id === state.questId);
    if (!quest) continue;
    if (state.status === 'ready' && quest.completionNpcId) {
      for (const map of data.maps.filter((candidate) => candidate.npcs.some((npc) => npc.npcId === quest.completionNpcId))) {
        add(map.id, `Return: ${quest.displayName}`);
      }
      continue;
    }
    for (const objective of quest.objectives ?? []) {
      if ((state.objectiveProgress?.[objective.id] ?? 0) >= objective.count) continue;
      if (objective.kind === 'visit') {
        add(objective.targetId, objective.label);
        continue;
      }
      if (objective.kind === 'collect') {
        for (const map of data.maps.filter((candidate) => candidate.resourceNodes?.some((node) => node.itemId === objective.targetId))) {
          add(map.id, objective.label);
        }
      }
      const monsterIds = objective.kind === 'defeat' ? [objective.targetId] : dropsByItem.get(objective.targetId) ?? [];
      for (const map of data.maps.filter((candidate) => candidate.spawnTables.some((table) => table.entries.some((entry) => objective.targetId === '*' || monsterIds.includes(entry.monsterId))))) {
        add(map.id, objective.label);
      }
    }
  }
  return labels;
}

function portalLockReasons(
  portal: MapPortal,
  playerLevel: number,
  completedQuests: Set<string>,
  startedQuests: Set<string>,
  quests: Map<string, QuestDefinition>,
): string[] {
  const reasons: string[] = [];
  if (portal.requiredLevel && playerLevel < portal.requiredLevel) reasons.push(`Reach level ${portal.requiredLevel}`);
  if (portal.requiredQuestId && !completedQuests.has(portal.requiredQuestId)) {
    reasons.push(`Complete ${quests.get(portal.requiredQuestId)?.displayName ?? 'the required quest'}`);
  }
  if (portal.requiredQuestStartedId && !startedQuests.has(portal.requiredQuestStartedId)) {
    reasons.push(`Accept ${quests.get(portal.requiredQuestStartedId)?.displayName ?? 'the required quest'}`);
  }
  return reasons;
}

function boundsFor(maps: MapDefinition[]): { x: number; y: number; width: number; height: number } {
  const positions = maps.flatMap((map) => map.worldMapPosition ? [map.worldMapPosition] : []);
  if (positions.length === 0) return { x: 0, y: 0, width: 1, height: 1 };
  const xs = positions.map((position) => position.x);
  const ys = positions.map((position) => position.y);
  const minX = Math.min(...xs); const maxX = Math.max(...xs);
  const minY = Math.min(...ys); const maxY = Math.max(...ys);
  return { x: minX, y: minY, width: Math.max(1, maxX - minX), height: Math.max(1, maxY - minY) };
}

function unique(values: string[]): string[] { return [...new Set(values)]; }
function clamp(value: number, min: number, max: number): number { return Math.max(min, Math.min(max, value)); }
