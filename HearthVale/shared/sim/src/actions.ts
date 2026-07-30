export interface InputActions {
  x: number;
  y: number;
  sprint: boolean;
  attackPressed: boolean;
  autoAttack: boolean;
  interactPressed: boolean;
  skillRequests: Array<{ memberId: string; skillId: string }>;
}

export const NO_INPUT: InputActions = {
  x: 0,
  y: 0,
  sprint: false,
  attackPressed: false,
  autoAttack: false,
  interactPressed: false,
  skillRequests: [],
};
