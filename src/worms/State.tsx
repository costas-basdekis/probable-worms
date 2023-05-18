import _ from "underscore";
import {Chest} from "./Chest";
import {DiceRoll} from "./DiceRoll";
import {RolledState} from "./RolledState";
import {RollResult, rollResults} from "./RollResult";

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
    return this.getNextRolls().map(({diceRoll, count}) => ({
      rolledState: this.withRoll(diceRoll), 
      count,
    }));
  }

  getNextRolls(): {diceRoll: DiceRoll, count: number}[] {
    const diceRollInfoByKey: Map<string, {diceRoll: DiceRoll, count: number}> = new Map();

    for (const diceRoll of State.iterateDiceRolls(this.remainingDiceCount)) {
      if (!diceRollInfoByKey.has(diceRoll.key)) {
        diceRollInfoByKey.set(diceRoll.key, {diceRoll, count: 0});
      }
      diceRollInfoByKey.get(diceRoll.key)!.count += 1;
    }

    return Array.from(diceRollInfoByKey.values());
  }

  withRoll(diceRoll: DiceRoll): RolledState {
    return new RolledState(this, diceRoll);
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
    };
    let items: Iterable<RollResult[]> = [[]];
    for (const _1 in _.range(count)) {
      items = addLayer(items, rollResults);
    }
    for (const item of items) {
      yield DiceRoll.fromDice(item);
    }
  }

  static rollDice(count: number): DiceRoll {
    return DiceRoll.fromDice(_.range(count).map(() => _.sample(rollResults) as RollResult));
  }

  canAdd(roll: RollResult): boolean {
    return this.chest.canAdd(roll);
  }

  add(roll: RollResult, diceCount: number): State {
    return new State(this.chest.add(roll, diceCount), this.remainingDiceCount - diceCount);
  }
}
