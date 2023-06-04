import {DiceRoll} from "./DiceRoll";
import {RollResult} from "./RollResult";
import {UnrolledState} from "./UnrolledState";
import {IState} from "./IState";

type RolledStateType = "rolled";

export class RolledState implements IState {
  type: RolledStateType = "rolled";
  unrolledState: UnrolledState;
  diceRoll: DiceRoll;

  static fromDice(chestDice: RollResult[], rolledDice: RollResult[]): RolledState {
    return new RolledState(UnrolledState.fromDice(chestDice, rolledDice.length), DiceRoll.fromDice(rolledDice));
  }

  constructor(unrolledState: UnrolledState, diceRoll: DiceRoll) {
    this.unrolledState = unrolledState;
    this.diceRoll = diceRoll;
  }

  get pickedDice(): DiceRoll {
    return this.unrolledState.pickedDice;
  }

  get rolledDice(): DiceRoll {
    return this.diceRoll;
  }

  get totalDiceCount(): number {
    return this.unrolledState.totalDiceCount;
  }

  get selectedDiceCount(): number {
    return this.unrolledState.selectedDiceCount + this.diceRoll.diceCount;
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
