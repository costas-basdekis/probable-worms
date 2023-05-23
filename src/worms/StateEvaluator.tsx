import { Evaluation } from "./Evaluation";
import { RolledState } from "./RolledState";
import { RolledStateEvaluator } from "./RolledStateEvaluator";
import { State } from "./State";

export class StateEvaluator {
  state: State;
  nextRolledStates: {rolledState: RolledState, count: number, evaluator: RolledStateEvaluator | null}[];
  evaluation: Evaluation | null = null;

  static fromState(state: State): StateEvaluator {
    const nextRolledStates = state.getNextRolledStates();
    return new StateEvaluator(
      state,
      nextRolledStates.map(nextRolledState => ({...nextRolledState, evaluator: null})),      
    );
  }

  constructor(state: State, nextRolledStates: {rolledState: RolledState, count: number, evaluator: RolledStateEvaluator | null}[]) {
    this.state = state;
    this.nextRolledStates = nextRolledStates;
  }

  get finished(): boolean {
    return this.evaluation !== null;
  }

  processAll(): StateEvaluator {
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
    for (const nextRolledState of this.nextRolledStates) {
      if (nextRolledState.evaluator?.evaluation) {
        continue;
      }
      if (!nextRolledState.evaluator) {
        nextRolledState.evaluator = RolledStateEvaluator.fromRolledState(nextRolledState.rolledState);
      }
      nextRolledState.evaluator.processOne();
      return true;
    }
    return false;
  }

  compileEvaluation(): Evaluation {
    if (this.nextRolledStates.some(({evaluator}) => !evaluator || !evaluator.evaluation)) {
      throw new Error("Some part of the evaluation tree is not completed");
    }
    return this.compilePartialEvaluation({useCached: false});
  }

  getCompletionProgress(): number {
    if (this.finished) {
      return 1;
    }
    if (!this.nextRolledStates.length) {
      return 1;
    }
    const completedCount = this.nextRolledStates.reduce(
      (total, current) => total + (current.evaluator?.getCompletionProgress() ?? 0), 0);
    return completedCount / this.nextRolledStates.length;
  }

  compilePartialEvaluation({useCached = true}: {useCached?: boolean} = {}): Evaluation {
    if (this.evaluation && useCached) {
      return this.evaluation;
    }
    const totalCount = this.nextRolledStates.reduce((total, current) => total + current.count, 0);
    return Evaluation.combineProbabilities(
      this.nextRolledStates
      .filter(({evaluator}) => evaluator)
      .map(({evaluator, count}) => ({
        evaluation: evaluator!.compilePartialEvaluation(),
        ratio: count / totalCount,
      }))
    );
  }
}
