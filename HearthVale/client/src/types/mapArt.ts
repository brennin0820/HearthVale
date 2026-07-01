export interface CollisionMaskDefinition {
  mapId: string;
  tileSize: number;
  walkable: boolean[][];
}

export type MapPropKind =
  | 'path'
  | 'plaza'
  | 'building'
  | 'tree'
  | 'fence'
  | 'fountain'
  | 'stall'
  | 'crate'
  | 'sign'
  | 'planter'
  | 'gate'
  | 'lantern'
  | 'training_dummy';

export type MapPropShape = 'rect' | 'ellipse';

export interface MapPropDefinition {
  id: string;
  kind: MapPropKind;
  x: number;
  y: number;
  width: number;
  height: number;
  shape?: MapPropShape;
  label?: string;
  fillColor?: number;
  accentColor?: number;
  alpha?: number;
}

export interface PropLayerDefinition {
  mapId: string;
  props: MapPropDefinition[];
}
