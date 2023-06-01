import {DiceRoll} from "./DiceRoll";
import {RollResult} from "./RollResult";
import {UnrolledState} from "./UnrolledState";

export class RolledState {
  unrolledState: UnrolledState;
  diceRoll: DiceRoll;

  static fromDice(chestDice: RollResult[], rolledDice: RollResult[]): RolledState {
    return new RolledState(UnrolledState.fromDice(chestDice, rolledDice.length), DiceRoll.fromDice(rolledDice));
  }

  constructor(unrolledState: UnrolledState, diceRoll: DiceRoll) {
    this.unrolledState = unrolledState;
    this.diceRoll = diceRoll;
  }

  get total(): number {
    return this.unrolledState.total;
  }

  getNextUnrolledStates(): UnrolledState[] {
    const nextUnrolledStates = Array.from(this.diceRoll.entries())
      .filter(([roll]) => this.unrolledState.canAdd(roll))
      .map(([roll, diceCount]) => this.unrolledState.add(roll, diceCount));
    if (!nextUnrolledStates.length) {
      return [this.unrolledState.finished()];
    }
    return nextUnrolledStates;
  }
}
