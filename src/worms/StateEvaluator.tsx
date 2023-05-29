import {Evaluation} from "./Evaluation";
import {RolledState} from "./RolledState";
import {RolledStateEvaluator} from "./RolledStateEvaluator";
import {State} from "./State";
import {EvaluationCache} from "./EvaluationCache";

interface NextRolledState {
  rolledState: RolledState;
  count: number;
  evaluator: RolledStateEvaluator | null;
  evaluation: Evaluation | null;
}

interface SearchOptions {
  removeEvaluated?: boolean,
  evaluationCache?: EvaluationCache,
}

export class StateEvaluator {
  state: State;
  nextRolledStates: NextRolledState[];
  evaluation: Evaluation | null = null;

  static fromState(state: State): StateEvaluator {
    const nextRolledStates = state.getNextRolledStates();
    return new StateEvaluator(
      state,
      nextRolledStates.map(nextRolledState => ({...nextRolledState, evaluator: null, evaluation: null})),
    );
  }

  constructor(state: State, nextRolledStates: NextRolledState[]) {
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

  processOne(options?: SearchOptions): boolean {
    if (this.finished) {
      return false;
    }
    if (this.nestedProcessOne(options)) {
      return true;
    }
    this.evaluation = this.compileEvaluation();
    return false;
  }

  nestedProcessOne(options?: SearchOptions): boolean {
    const {removeEvaluated = false} = options ?? {};
    if (this.finished) {
      return false;
    }
    for (const nextRolledState of this.nextRolledStates) {
      if (nextRolledState.evaluation) {
        continue;
      }
      if (!nextRolledState.evaluator) {
        nextRolledState.evaluator = RolledStateEvaluator.fromRolledState(nextRolledState.rolledState);
        if (this.useEvaluationCache(nextRolledState, options)) {
          continue;
        }
      }
      nextRolledState.evaluator.processOne(options);
      if (nextRolledState.evaluator.evaluation) {
        nextRolledState.evaluation = nextRolledState.evaluator.evaluation;
        this.setEvaluationCache(nextRolledState, options);
        if (removeEvaluated) {
          nextRolledState.evaluator = null;
        }
      }
      return true;
    }
    return false;
  }

  useEvaluationCache(nextRolledState: NextRolledState, options?: SearchOptions): boolean {
    if (!nextRolledState.evaluator) {
      return false;
    }
    const {removeEvaluated = false, evaluationCache} = options ?? {};
    const evaluation = evaluationCache?.get(nextRolledState.evaluator.getCacheKey());
    if (evaluation) {
      nextRolledState.evaluation = evaluation;
      if (removeEvaluated) {
        nextRolledState.evaluator = null;
      }
      return true;
    }
    return false;
  }

  setEvaluationCache(nextRolledState: NextRolledState, options?: SearchOptions) {
    if (!nextRolledState.evaluator || !nextRolledState.evaluation) {
      return;
    }
    const {evaluationCache} = options ?? {};
    if (evaluationCache) {
      evaluationCache.set(nextRolledState.evaluator.getCacheKey(), nextRolledState.evaluation);
    }
  }

  getCacheKey(): string {
    return [
      "S",
      `t${this.state.chest.total}`,
      `c${this.state.chest.uniqueDice().join(",")}`,
      `r${this.state.remainingDiceCount}`,
    ].join("").replaceAll(/[[\]]/g, "");
  }

  compileEvaluation(): Evaluation {
    if (this.nextRolledStates.some(({evaluation}) => !evaluation)) {
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
      (total, current) => total + (current.evaluation ? 1 : (current.evaluator?.getCompletionProgress() ?? 0)), 0);
    return completedCount / this.nextRolledStates.length;
  }

  compilePartialEvaluation({useCached = true}: {useCached?: boolean} = {}): Evaluation {
    if (this.evaluation && useCached) {
      return this.evaluation;
    }
    const totalCount = this.nextRolledStates.reduce((total, current) => total + current.count, 0);
    const combined = Evaluation.combineProbabilities(
      this.nextRolledStates
      .filter(({evaluator, evaluation}) => evaluator || evaluation)
      .map(({evaluator, evaluation, count}) => ({
        evaluation: evaluation ?? evaluator!.compilePartialEvaluation(),
        ratio: count / totalCount,
      }))
    );
    // Because we can choose to stop, the current total has 100% chance of happening, if it's our target
    combined.exactResultOccurrences.set(this.state.total, 1);
    return combined;
  }
}
