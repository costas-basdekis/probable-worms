import { DiceRoll } from "./DiceRoll";
import { Results } from "./Results";
import { ResultState } from "./ResultState";
import { RollResult } from "./RollResult";
import { State } from "./State";

export class RolledState {
  state: State;
  diceRoll: DiceRoll;

  static fromDice(chestDice: RollResult[], rolledDice: RollResult[]): RolledState {
    return new RolledState(State.fromDice(chestDice, rolledDice.length), DiceRoll.fromDice(rolledDice));
  }

  constructor(state: State, diceRoll: DiceRoll) {
    this.state = state;
    this.diceRoll = diceRoll;
  }

  get total(): number {
    return this.state.total;
  }

  getNextStates(): {results: ResultState, nextStates: {state: State, pickedRoll: RollResult, pickedCount: number, ratio: number}[]} {
    const results = ResultState.empty(this.state);
    const nextStates: {state: State, pickedRoll: RollResult, pickedCount: number, ratio: number}[] = [];
    const rollCount = this.diceRoll.count;
    for (const [roll, diceCount] of this.diceRoll.entries()) {
      if (!this.state.canAdd(roll)) {
        results.add(this.state.total, 1 / rollCount);
        continue;
      }
      const nextState = this.state.add(roll, diceCount);
      if (nextState.remainingDiceCount) {
        nextStates.push({
          state: nextState,
          pickedRoll: roll,
          pickedCount: diceCount,
          ratio: 1 / rollCount,
        });
      } else {
        results.add(nextState.total, 1 / rollCount);
      }
    }
    return {results, nextStates};
  }

  pick(roll: null | RollResult): State | ResultState {
    if (roll === null) {
      return new ResultState(this.state, new Results([[this.total, 1]]));
    } else {
      if (!this.diceRoll.get(roll)) {
        throw new Error("Cannot pick dice that were not rolled");
      } else {
        return this.state.add(roll, this.diceRoll.get(roll)!);
      }
    }
  }
}
