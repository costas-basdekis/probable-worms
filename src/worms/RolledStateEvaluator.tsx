import {Evaluation} from "./Evaluation";
import {Results} from "./Results";
import {RollResult} from "./RollResult";
import {RolledState} from "./RolledState";
import {State} from "./State";
import {StateEvaluator} from "./StateEvaluator";

export class RolledStateEvaluator {
  rolledState: RolledState;
  nextStates: {state: State, pickedRoll: RollResult, pickedCount: number, evaluator: StateEvaluator | null}[];
  results: Results;
  evaluation: Evaluation | null = null;

  static fromRolledState(rolledState: RolledState): RolledStateEvaluator {
    const {results, nextStates} = rolledState.getNextStates();
    return new RolledStateEvaluator(
      rolledState,
      nextStates.map(nextState => ({...nextState, evaluator: null})),
      results.results,
    );
  }

  constructor(rolledState: RolledState, nextStates: {state: State, pickedRoll: RollResult, pickedCount: number, evaluator: StateEvaluator | null}[], results: Results) {
    this.rolledState = rolledState;
    this.nextStates = nextStates;
    this.results = results;
  }

  processAll(): RolledStateEvaluator {
    while (this.processOne()) {
      //
    }
    return this!;
  }

  processOne(): boolean {
    if (this.evaluation) {
      return false;
    }
    for (const nextState of this.nextStates) {
      if (nextState.evaluator?.evaluation) {
        continue;
      }
      if (!nextState.evaluator) {
        nextState.evaluator = StateEvaluator.fromState(nextState.state);
      }
      nextState.evaluator.processOne();
      return true;
    }
    const optionEvaluation = Evaluation.combineOptions(this.nextStates.map(({evaluator}) => evaluator!.evaluation!));
    const totalCount = this.results.total + this.nextStates.length;
    this.evaluation = Evaluation.combineProbabilities([
      {evaluation: Evaluation.fromResults(this.results), ratio: this.results.total / totalCount},
      {evaluation: optionEvaluation, ratio: this.nextStates.length / totalCount},
    ]);
    return false;
  }
}
