import {DiceRoll} from "./DiceRoll";
import {Results} from "./Results";
import {RolledState} from "./RolledState";
import {RollResult} from "./RollResult";
import {State} from "./State";

export class StateExplorer {
  results: Results = new Results();
  nextRolledStates: {rolledState: RolledState, count: number}[] = [];
  nextStates: {state: State, count: number}[];
  private _stopProcessing: boolean = false;

  static initial(): StateExplorer {
    return this.fromState(State.initial());
  }

  static fromState(state: State): StateExplorer {
    return new StateExplorer([], [{state, count: 1}]);
  }

  static fromRolledState(rolledState: RolledState): StateExplorer {
    return new StateExplorer([{rolledState, count: 1}], []);
  }

  static fromFirstDice(dice: RollResult[]): StateExplorer {
    return this.fromRolledState(State.initial().withRoll(DiceRoll.fromDice(dice)));
  }

  constructor(nextRolledStates: {rolledState: RolledState, count: number}[], nextStates: {state: State, count: number}[]) {
    this.nextRolledStates = nextRolledStates;
    this.nextStates = nextStates;
  }

  get completed(): boolean {
    return !this.nextRolledStates.length && !this.nextStates.length;
  }

  processAll(): boolean {
    this._stopProcessing = false;
    while (!this._stopProcessing) {
      this.processNextState();
      while (this.nextRolledStates.length) {
        this.processNextState();
      }
    }
    return !this.completed;
  }

  processNextState(): boolean {
    if (this.completed) {
      return false;
    }
    if (this.nextRolledStates.length) {
      const {rolledState, count} = this.nextRolledStates.shift()!;
      const {results, nextStates} = rolledState.getNextStates();
      this.results.mergeWith(results.results);
      for (const {state: nextState} of nextStates) {
        this.nextStates.push({state: nextState, count});
      }
    } else {
      const {state: nextState, count: nextCount} = this.nextStates.shift()!;
      this.nextRolledStates = nextState.getNextRolledStates()
        .map(({rolledState, count}) => ({rolledState, count: count * nextCount}));
      if (!this.nextRolledStates.length) {
        this.results.add(nextState.total, nextCount);
      }
    }
    return true;
  }
}
