import { DiceRoll } from "./DiceRoll";
import { RollResult, Worm } from "./RollResult";

export class Chest {
  diceCounts: DiceRoll;
  hasWorms: boolean;

  static initial(): Chest {
    return new Chest(new DiceRoll(), false);
  }

  constructor(diceCounts: DiceRoll, hasWorms: boolean) {
    this.diceCounts = diceCounts;
    this.hasWorms = hasWorms;
  }

  get total(): number {
    return this.diceCounts.total;
  }

  canAdd(roll: RollResult): boolean {
    return !this.diceCounts.has(roll);
  }

  add(roll: RollResult, diceCount: number): Chest {
    if (!this.canAdd(roll)) {
      throw new Error("Cannot add existing dice to chest");
    }
    return new Chest(
      this.diceCounts.adding(roll, diceCount), 
      this.hasWorms || roll === Worm,
    );
  }
}
