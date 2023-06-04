import {Evaluation} from "./Evaluation";
import {RolledState} from "./RolledState";
import {RolledStateEvaluator} from "./RolledStateEvaluator";
import {UnrolledState} from "./UnrolledState";
import {IStateEvaluator, SearchOptions} from "./IStateEvaluator";

interface NextRolledState {
  rolledState: RolledState;
  count: number;
  evaluator: RolledStateEvaluator | null;
  evaluation: Evaluation | null;
}

export class UnrolledStateEvaluator implements IStateEvaluator<UnrolledState> {
  state: UnrolledState;
  nextRolledStates: NextRolledState[] | null;
  evaluation: Evaluation | null = null;
  isRoot: boolean;

  static fromUnrolledState(unrolledState: UnrolledState, isRoot: boolean): UnrolledStateEvaluator {
    const nextRolledStates = unrolledState.getNextRolledStates();
    return new UnrolledStateEvaluator(
      unrolledState,
      nextRolledStates.map(nextRolledState => ({...nextRolledState, evaluator: null, evaluation: null})),
      isRoot,
    );
  }

  static fromUnrolledStateLazy(unrolledState: UnrolledState, isRoot: boolean): UnrolledStateEvaluator {
    return new UnrolledStateEvaluator(
      unrolledState,
      null,
      isRoot,
    );
  }

  constructor(unrolledState: UnrolledState, nextRolledStates: NextRolledState[] | null, isRoot: boolean) {
    this.state = unrolledState;
    this.nextRolledStates = nextRolledStates;
    this.isRoot = isRoot;
  }

  get finished(): boolean {
    return this.evaluation !== null;
  }

  processAll(): this {
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
    if (!this.evaluation) {
      this.evaluation = this.compileEvaluation();
      if (this.isRoot) {
        this.setOwnEvaluationCache(options);
      }
    }
    return false;
  }

  nestedProcessOne(options?: SearchOptions): boolean {
    const {removeEvaluated = false} = options ?? {};
    if (this.finished) {
      return false;
    }
    if (!this.nextRolledStates) {
      if (options?.evaluationCache) {
        const evaluation = options.evaluationCache.get(this.getCacheKey());
        if (evaluation) {
          this.evaluation = evaluation;
          return false;
        }
      }
      this.nextRolledStates = this.state
        .getNextRolledStates()
        .map(nextRolledState => ({...nextRolledState, evaluator: null, evaluation: null}));
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

  setOwnEvaluationCache(options?: SearchOptions) {
    if (!this.evaluation) {
      return;
    }
    const {evaluationCache} = options ?? {};
    if (evaluationCache) {
      evaluationCache.set(this.getCacheKey(), this.evaluation);
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
    if (!this.nextRolledStates || this.nextRolledStates.some(({evaluation}) => !evaluation)) {
      throw new Error("Some part of the evaluation tree is not completed");
    }
    return this.compilePartialEvaluation({useCached: false});
  }

  getCompletionProgress(): number {
    if (this.finished) {
      return 1;
    }
    if (!this.nextRolledStates) {
      return 0;
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
    if (!this.nextRolledStates) {
      return Evaluation.empty();
    }
    if (!this.nextRolledStates.length) {
      return Evaluation.fromTotal(this.state.total);
    }
    const nextRolledStatesWithEvaluation = this.nextRolledStates
      .filter(({evaluator, evaluation}) => evaluator || evaluation);
    const totalCount = nextRolledStatesWithEvaluation.reduce(
      (total, current) => total + current.count, 0);
    const combined = Evaluation.combineProbabilities(
      nextRolledStatesWithEvaluation
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
