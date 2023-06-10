import { DiceRoll } from "./DiceRoll";
import { RollResult, Worm } from "./RollResult";

export class Chest {
  diceCounts: DiceRoll;
  hasWorms: boolean;

  static initial(): Chest {
    return new Chest(new DiceRoll(), false);
  }

  static fromDiceRoll(diceRoll: DiceRoll): Chest {
    return new Chest(new DiceRoll(diceRoll.entries()), diceRoll.has(Worm));
  }

  static fromDice(dice: RollResult[]): Chest {
    return this.fromDiceRoll(DiceRoll.fromDice(dice));
  }

  constructor(diceCounts: DiceRoll, hasWorms: boolean) {
    this.diceCounts = diceCounts;
    this.hasWorms = hasWorms;
  }

  equals(other: Chest): boolean {
    if (this === other) {
      return true;
    }
    return (
      this.hasWorms === other.hasWorms
      && this.diceCounts.equals(other.diceCounts)
    );
  }

  get total(): number {
    return this.diceCounts.total;
  }

  get diceCount(): number {
    return this.diceCounts.diceCount;
  }

  get dice(): RollResult[] {
    return this.diceCounts.dice;
  }

  get key(): string {
    return this.diceCounts.key;
  }

  uniqueDice(): RollResult[] {
    return Array.from(this.diceCounts.keys()).sort();
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

  get(roll: RollResult): number {
    return this.diceCounts.get(roll);
  }

  replacing(roll: RollResult, count: number): Chest {
    return Chest.fromDiceRoll(this.diceCounts.replacing(roll, count));
  }
}
