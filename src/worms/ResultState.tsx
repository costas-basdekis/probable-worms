import {Results} from "./Results";
import {State} from "./State";

export class ResultState {
  state: State;
  results: Results;

  static empty(state: State): ResultState {
    return new ResultState(state, new Results());
  }

  constructor(state: State, results: Results) {
    this.state = state;
    this.results = results;
  }

  add(result: number, count: number): void {
    this.results.add(result, count);
  }
}
