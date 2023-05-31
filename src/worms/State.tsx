import { Chest } from "./Chest";
import { DiceRoll } from "./DiceRoll";
import { RolledState } from "./RolledState";
import { RollResult } from "./RollResult";

export interface SerialisedState {
  chestDice: RollResult[],
  remainingDiceCount: number,
}

export class State {
  chest: Chest;
  remainingDiceCount: number;

  static initial(): State {
    return new State(Chest.initial(), 8);
  }

  static empty(): State {
    return new State(Chest.initial(), 0);
  }

  static fromDice(dice: RollResult[], remainingDiceCount: number): State {
    return new State(Chest.fromDice(dice), remainingDiceCount);
  }

  static deserialise(serialised: SerialisedState): State {
    return State.fromDice(serialised.chestDice, serialised.remainingDiceCount);
  }

  constructor(chest: Chest, remainingDiceCount: number) {
    this.chest = chest;
    this.remainingDiceCount = remainingDiceCount;
  }

  get total(): number {
    if (this.chest.hasWorms) {
      return this.chest.total;
    } else {
      return 0;
    }
  }

  get totalDiceCount(): number {
    return this.chest.diceCount + this.remainingDiceCount;
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

  add(roll: RollResult, diceCount: number): State {
    return new State(this.chest.add(roll, diceCount), this.remainingDiceCount - diceCount);
  }

  serialise(): SerialisedState {
    return {
      chestDice: this.chest.dice,
      remainingDiceCount: this.remainingDiceCount,
    };
  }
}
