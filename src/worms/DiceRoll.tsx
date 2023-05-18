import _ from "underscore";
import {RollResult, ValueMap} from "./RollResult";

export class DiceRoll {
  counts: Map<RollResult, number>;
  key: string;
  total: number;

  static fromDice(dice: RollResult[]): DiceRoll {
    return new DiceRoll(Object.values(_.groupBy(dice)).map(group => [group[0], group.length]));
  }

  constructor(items?: Iterable<[RollResult, number]>) {
    this.counts = new Map(items);
    this.key = JSON.stringify(Array.from(this.counts.entries()).sort());
    this.total = Array.from(this.counts.entries()).reduce((total, [roll, count]) => total + ValueMap.get(roll)! * count, 0);
  }

  adding(roll: RollResult, count: number): DiceRoll {
    return new DiceRoll([...Array.from(this.counts.entries()), [roll, count] as [RollResult, number]]);
  }

  clear(): void {
    throw new Error("Cannot modify a dice roll");
  }

  delete(key: RollResult): boolean {
    throw new Error("Cannot modify a dice roll");
  }

  set(key: RollResult, value: number): this {
    // Can only let the constructor modify it
    if (this.key !== undefined) {
      throw new Error("Cannot modify a dice roll");
    }
    this.counts.set(key, value);
    return this;
  }

  get(key: RollResult): number | undefined {
    return this.counts.get(key);
  }

  has(key: RollResult): boolean {
    return this.counts.has(key);
  }

  keys(): Iterable<RollResult> {
    return this.counts.keys();
  }

  entries(): Iterable<[RollResult, number]> {
    return this.counts.entries();
  }
  
  get count(): number {
    return this.counts.size;
  }
}
