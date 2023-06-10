import * as worms from "../src/worms";

export const run = (diceCount: number) => {
  const state = worms.UnrolledState.fromDice([], diceCount);
  console.log(state.serialise());
};
