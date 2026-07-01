export interface AnimationDefinition {
  key: string;
  frames: string[];
  frameRate: number;
  repeat: number;
}

/** Placeholder animation configs — frames resolve via assets manifest. */
export const ANIMATIONS: AnimationDefinition[] = [
  { key: 'player_walk_down', frames: ['player_down_0', 'player_down_1'], frameRate: 6, repeat: -1 },
  { key: 'portal_pulse', frames: ['portal_0', 'portal_1'], frameRate: 4, repeat: -1 },
];
