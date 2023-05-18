export type RollResult = 1 | 2 | 3 | 4 | 5 | "W";
export const Worm: RollResult = "W";
export const rollResults: RollResult[] = [1, 2, 3, 4, 5, Worm];
export const ValueMap: Map<RollResult, number> = new Map([
  [1, 1],
  [2, 2],
  [3, 3],
  [4, 4],
  [5, 5],
  [Worm, 5],
] as [RollResult, number][]);
