import {Evaluation} from "./Evaluation";
import {Results} from "./Results";
import {RollResult} from "./RollResult";
import {RolledState} from "./RolledState";
import {State} from "./State";
import {StateEvaluator} from "./StateEvaluator";

export class RolledStateEvaluator {
  rolledState: RolledState;
  nextStates: {state: State, pickedRoll: RollResult, pickedCount: number, ratio: number, evaluator: StateEvaluator | null, evaluation: Evaluation | null}[];
  results: Results;
  evaluation: Evaluation | null = null;

  static fromRolledState(rolledState: RolledState): RolledStateEvaluator {
    const { results, nextStates } = rolledState.getNextStates();
    return new RolledStateEvaluator(
      rolledState,
      nextStates.map(nextState => ({...nextState, evaluator: null, evaluation: null})),
      results.results,
    );
  }

  constructor(rolledState: RolledState, nextStates: {state: State, pickedRoll: RollResult, pickedCount: number, ratio: number, evaluator: StateEvaluator | null, evaluation: Evaluation | null}[], results: Results) {
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

  processOne(options?: {removeEvaluated?: boolean}): boolean {
    if (this.finished) {
      return false;
    }
    if (this.nestedProcessOne(options)) {
      return true;
    }
    this.evaluation = this.compileEvaluation();
    return false;
  }

  nestedProcessOne({removeEvaluated = false}: {removeEvaluated?: boolean} = {}): boolean {
    if (this.finished) {
      return false;
    }
    for (const nextState of this.nextStates) {
      if (nextState.evaluation) {
        continue;
      }
      if (!nextState.evaluator) {
        nextState.evaluator = StateEvaluator.fromState(nextState.state);
      }
      nextState.evaluator.processOne();
      if (nextState.evaluator.evaluation) {
        nextState.evaluation = nextState.evaluator.evaluation;
        if (removeEvaluated) {
          nextState.evaluator = null;
        }
      }
      return true;
    }
    return false;
  }

  compileEvaluation(): Evaluation {
    if (this.nextStates.some(({evaluation}) => !evaluation)) {
      throw new Error("Some part of the evaluation tree is not completed");
    }
    return this.compilePartialEvaluation({useCached: false});
  }

  getCompletionProgress(): number {
    if (this.finished) {
      return 1;
    }
    const completedCount = this.nextStates.reduce(
      (total, current) => total + (current.evaluation ? 1 : (current.evaluator?.getCompletionProgress() ?? 0)), 0);
    return completedCount / this.nextStates.length;
  }

  compilePartialEvaluation({useCached = true}: {useCached?: boolean} = {}): Evaluation {
    if (this.evaluation && useCached) {
      return this.evaluation;
    }
    const optionEvaluation = Evaluation.combineOptions(
      this.nextStates
      .filter(({evaluator, evaluation}) => evaluator || evaluation)
      .map(({evaluator, evaluation}) => evaluation ?? evaluator!.compilePartialEvaluation())
    );
    return Evaluation.combineProbabilities([
      {evaluation: Evaluation.fromResults(this.results), ratio: this.results.total},
      {evaluation: optionEvaluation, ratio: this.nextStates.reduce((total, current) => total + current.ratio, 0)},
    ]);
  }
}
