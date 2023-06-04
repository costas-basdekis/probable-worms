import { Chest } from "./Chest";
import { DiceRoll } from "./DiceRoll";
import { RolledState } from "./RolledState";
import { RollResult } from "./RollResult";
import {IState} from "./IState";

export interface SerialisedUnrolledState {
  chestDice: RollResult[],
  remainingDiceCount: number,
}

type UnrolledStateType = "unrolled";

export class UnrolledState implements IState {
  type: UnrolledStateType = "unrolled";
  chest: Chest;
  remainingDiceCount: number;

  static initial(): UnrolledState {
    return new UnrolledState(Chest.initial(), 8);
  }

  static empty(): UnrolledState {
    return new UnrolledState(Chest.initial(), 0);
  }

  static fromDice(dice: RollResult[], remainingDiceCount: number): UnrolledState {
    return new UnrolledState(Chest.fromDice(dice), remainingDiceCount);
  }

  static deserialise(serialised: SerialisedUnrolledState): UnrolledState {
    return UnrolledState.fromDice(serialised.chestDice, serialised.remainingDiceCount);
  }

  constructor(chest: Chest, remainingDiceCount: number) {
    this.chest = chest;
    this.remainingDiceCount = remainingDiceCount;
  }

  get pickedDice(): DiceRoll {
    return this.chest.diceCounts.copy();
  }

  get rolledDice(): null {
    return null;
  }

  get totalDiceCount(): number {
    return this.chest.diceCount + this.remainingDiceCount;
  }

  get selectedDiceCount(): number {
    return this.chest.diceCount;
  }

  get total(): number {
    if (this.chest.hasWorms) {
      return this.chest.total;
    } else {
      return 0;
    }
  }

  getNextRolledStates(): {rolledState: RolledState, count: number}[] {
    return DiceRoll.getNextRolls(this.remainingDiceCount).map(({diceRoll, count}) => ({
      rolledState: this.withRoll(diceRoll), 
      count,
    }));
  }

  withRoll(diceRoll: DiceRoll): RolledState {
    return new RolledState(this, diceRoll);
  }

  canAdd(roll: RollResult): boolean {
    return this.chest.canAdd(roll);
  }

  add(roll: RollResult, diceCount: number): UnrolledState {
    return new UnrolledState(this.chest.add(roll, diceCount), this.remainingDiceCount - diceCount);
  }

  finished(): UnrolledState {
    return new UnrolledState(this.chest, 0);
  }

  serialise(): SerialisedUnrolledState {
    return {
      chestDice: this.chest.dice,
      remainingDiceCount: this.remainingDiceCount,
    };
  }
}
