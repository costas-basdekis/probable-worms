import {Evaluation} from "./Evaluation";
import {Results} from "./Results";
import {RollResult} from "./RollResult";
import {RolledState} from "./RolledState";
import {State} from "./State";
import {StateEvaluator} from "./StateEvaluator";

export class RolledStateEvaluator {
  rolledState: RolledState;
  nextStates: {state: State, pickedRoll: RollResult, pickedCount: number, ratio: number, evaluator: StateEvaluator | null}[];
  results: Results;
  evaluation: Evaluation | null = null;

  static fromRolledState(rolledState: RolledState): RolledStateEvaluator {
    const { results, nextStates } = rolledState.getNextStates();
    return new RolledStateEvaluator(
      rolledState,
      nextStates.map(nextState => ({...nextState, evaluator: null})),
      results.results,
    );
  }

  constructor(rolledState: RolledState, nextStates: {state: State, pickedRoll: RollResult, pickedCount: number, ratio: number, evaluator: StateEvaluator | null}[], results: Results) {
    this.rolledState = rolledState;
    this.nextStates = nextStates;
    this.results = results;
  }

  get finished(): boolean {
    return this.evaluation !== null;
  }

  processAll(): RolledStateEvaluator {
    while (this.processOne()) {
      //
    }
    return this;
  }

  processOne(): boolean {
    if (this.finished) {
      return false;
    }
    if (this.nestedProcessOne()) {
      return true;
    }
    this.evaluation = this.compileEvaluation();
    return false;
  }

  nestedProcessOne(): boolean {
    if (this.finished) {
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
    return false;
  }

  compileEvaluation(): Evaluation {
    if (this.nextStates.some(({evaluator}) => !evaluator || !evaluator.evaluation)) {
      throw new Error("Some part of the evaluation tree is not completed");
    }
    const optionEvaluation = Evaluation.combineOptions(this.nextStates.map(({evaluator}) => evaluator!.evaluation!));
    return Evaluation.combineProbabilities([
      {evaluation: Evaluation.fromResults(this.results), ratio: this.results.total},
      {evaluation: optionEvaluation, ratio: this.nextStates.reduce((total, current) => total + current.ratio, 0)},
    ]);
  }

  getCompletionProgress(): number {
    if (this.finished) {
      return 1;
    }
    const completedCount = this.nextStates.reduce(
      (total, current) => total + (current.evaluator?.getCompletionProgress() ?? 0), 0);
    return completedCount / this.nextStates.length;
  }
}
