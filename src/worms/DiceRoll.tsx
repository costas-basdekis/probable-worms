import _ from "underscore";
import {RollResult, rollResults, ValueMap} from "./RollResult";

export class DiceRoll {
  counts: Map<RollResult, number>;
  key: string;
  total: number;

  static fromDice(dice: RollResult[]): DiceRoll {
    return new DiceRoll(
      Object.values(_.groupBy(dice)).map((group) => [group[0], group.length])
    );
  }

  constructor(items?: Iterable<readonly [RollResult, number]>) {
    this.counts = new Map(items as Iterable<readonly [RollResult, number]>);
    this.key = JSON.stringify(Array.from(this.counts.entries()).sort());
    this.total = Array.from(this.counts.entries()).reduce(
      (total, [roll, count]) => total + ValueMap.get(roll)! * count,
      0
    );
  }

  adding(roll: RollResult, count: number): DiceRoll {
    return new DiceRoll([
      ...Array.from(this.counts.entries()),
      [roll, count] as [RollResult, number],
    ]);
  }

  copy(): DiceRoll {
    return new DiceRoll(this.counts.entries());
  }

  get(key: RollResult): number {
    return this.counts.get(key) ?? 0;
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

  get diceCount(): number {
    return Array.from(this.counts.values()).reduce((total, current) => total + current, 0);
  }

  get dice(): RollResult[] {
    return Array.from(this.counts.entries()).map(([roll, count]) => _.range(count).map(() => roll)).flat().sort((lhs, rhs) => {
      return ValueMap.get(lhs)! - ValueMap.get(rhs)!;
    });
  }

  replacing(roll: RollResult, count: number): DiceRoll {
    return this.copy().replace(roll, count);
  }

  replace(roll: RollResult, count: number): DiceRoll {
    if (count) {
      this.counts.set(roll, count);
    } else if (this.has(roll)) {
      this.counts.delete(roll);
    }
    return this;
  }

  limitToCount(diceCount: number): DiceRoll {
    if (diceCount <= this.diceCount) {
      return this;
    }
    const diceRoll = new DiceRoll();
    let remainingDiceCount = diceCount;
    for (const roll of rollResults) {
      const rollCount = Math.min(remainingDiceCount, this.get(roll));
      diceRoll.counts.set(roll, rollCount);
      remainingDiceCount -= rollCount;
    }
    return diceRoll;
  }

  getFaces(): RollResult[] {
    return rollResults.filter(face => this.has(face));
  }

  getOppositeFaces(): RollResult[] {
    return rollResults.filter(face => !this.has(face));
  }

  limitToFaces(faces: RollResult[]): DiceRoll {
    if (!faces.some(face => this.has(face))) {
      return this;
    }
    const diceRoll = new DiceRoll();
    for (const face of faces) {
      diceRoll.replace(face, this.get(face));
    }
    return diceRoll;
  }

  static getNextRolls(diceCount: number): {diceRoll: DiceRoll, count: number}[] {
    const diceRollInfoByKey: Map<string, {diceRoll: DiceRoll, count: number}> = new Map();

    for (const diceRoll of DiceRoll.iterateDiceRolls(diceCount)) {
      if (!diceRollInfoByKey.has(diceRoll.key)) {
        diceRollInfoByKey.set(diceRoll.key, { diceRoll, count: 0 });
      }
      diceRollInfoByKey.get(diceRoll.key)!.count += 1;
    }

    return Array.from(diceRollInfoByKey.values());
  }

  static *iterateDiceRolls(count: number): Iterable<DiceRoll> {
    if (!count) {
      return;
    }
    function *addLayer<T>(lists: Iterable<T[]>, layer: T[]): Iterable<T[]> {
      for (const list of lists) {
        for (const newItem of layer) {
          yield [...list, newItem];
        }
      }
    }
    let items: Iterable<RollResult[]> = [[]];
    for (const _1 in _.range(count)) {
      items = addLayer(items, rollResults);
    }
    for (const item of items) {
      yield DiceRoll.fromDice(item);
    }
  }
}
