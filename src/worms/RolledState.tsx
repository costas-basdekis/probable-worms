import {DiceRoll} from "./DiceRoll";
import {RollResult} from "./RollResult";
import {UnrolledState} from "./UnrolledState";
import {IState} from "./IState";

export interface SerialisedRolledState {
  chestDice: RollResult[],
  rolledDice: RollResult[],
}

type RolledStateType = "rolled";

export class RolledState implements IState {
  type: RolledStateType = "rolled";
  unrolledState: UnrolledState;
  diceRoll: DiceRoll;

  static fromDice(chestDice: RollResult[], rolledDice: RollResult[]): RolledState {
    return new RolledState(UnrolledState.fromDice(chestDice, rolledDice.length), DiceRoll.fromDice(rolledDice));
  }

  static deserialise(serialised: SerialisedRolledState): RolledState {
    return RolledState.fromDice(serialised.chestDice, serialised.rolledDice);
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

  get remainingDiceCount(): number {
    return this.totalDiceCount - this.selectedDiceCount;
  }

  get runningTotal(): number {
    return this.unrolledState.runningTotal;
  }

  get total(): number {
    return this.unrolledState.total;
  }

  getNextUnrolledStates(): UnrolledState[] {
    return this.getNextUnrolledStatesAndPickedRolls().map(({state}) => state);
  }

  getNextUnrolledStatesAndPickedRolls(): {state: UnrolledState, pickedRoll: RollResult | null, pickedCount: number | null}[] {
    const nextUnrolledStates = Array.from(this.diceRoll.entries())
      .filter(([roll]) => this.unrolledState.canAdd(roll))
      .map(([roll, diceCount]) => ({state: this.unrolledState.add(roll, diceCount), pickedRoll: roll, pickedCount: diceCount}));
    if (!nextUnrolledStates.length) {
      return [{state: this.unrolledState.finished(), pickedRoll: null, pickedCount: null}];
    }
    return nextUnrolledStates;
  }

  pick(pickedRoll: RollResult): UnrolledState {
    if (!this.diceRoll.has(pickedRoll)) {
      throw new Error("Face was not rolled");
    }
    return this.unrolledState.add(pickedRoll, this.diceRoll.get(pickedRoll));
  }

  serialise(): SerialisedRolledState {
    return {
      chestDice: this.unrolledState.chest.dice,
      rolledDice: this.rolledDice.dice,
    };
  }
}
