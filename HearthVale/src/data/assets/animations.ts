export interface AnimationDefinition {
  key: string;
  frames: string[];
  frameRate: number;
  repeat: number;
}

/** Frame ids resolve through the original HearthVale SVG atlases in the asset manifest. */
export const ANIMATIONS: AnimationDefinition[] = [
  { key: 'player_walk_down', frames: ['player_down_0', 'player_down_1'], frameRate: 6, repeat: -1 },
  { key: 'player_walk_up', frames: ['player_up_0', 'player_up_1'], frameRate: 6, repeat: -1 },
  { key: 'player_walk_left', frames: ['player_left_0', 'player_left_1'], frameRate: 6, repeat: -1 },
  { key: 'player_walk_right', frames: ['player_right_0', 'player_right_1'], frameRate: 6, repeat: -1 },
  // The world atlas supplies a quiet static portal glyph; runtime tweening keeps the cue gentle.
  { key: 'portal_pulse', frames: ['portal_0'], frameRate: 1, repeat: -1 },
];
