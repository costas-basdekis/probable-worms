import { Chest } from "./Chest";
import { DiceRoll } from "./DiceRoll";
import { RolledState } from "./RolledState";
import { RollResult } from "./RollResult";

export class State {
  chest: Chest;
  remainingDiceCount: number;

  static initial(): State {
    return new State(Chest.initial(), 8);
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
}
