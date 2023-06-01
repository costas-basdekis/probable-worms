import {DiceRoll} from "./DiceRoll";
import {RollResult} from "./RollResult";
import {State} from "./State";

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

  getNextStates(): State[] {
    const nextStates = Array.from(this.diceRoll.entries())
      .filter(([roll]) => this.state.canAdd(roll))
      .map(([roll, diceCount]) => this.state.add(roll, diceCount));
    if (!nextStates.length) {
      return [this.state.finished()];
    }
    return nextStates;
  }
}
