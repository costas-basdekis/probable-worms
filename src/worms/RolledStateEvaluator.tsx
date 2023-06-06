import {Evaluation} from "./Evaluation";
import {RolledState} from "./RolledState";
import {UnrolledState} from "./UnrolledState";
import {UnrolledStateEvaluator} from "./UnrolledStateEvaluator";
import {EvaluationCache} from "./EvaluationCache";
import {IStateEvaluator} from "./IStateEvaluator";

interface NextUnrolledState {
  unrolledState: UnrolledState;
  evaluator: UnrolledStateEvaluator | null;
  evaluation: Evaluation | null;
}

interface SearchOptions {
  removeEvaluated?: boolean,
  evaluationCache?: EvaluationCache,
}

export class RolledStateEvaluator implements IStateEvaluator<RolledState> {
  state: RolledState;
  nextUnrolledStates: NextUnrolledState[];
  evaluation: Evaluation | null = null;

  static fromRolledState(rolledState: RolledState): RolledStateEvaluator {
    const nextUnrolledStates = rolledState.getNextUnrolledStates();
    return new RolledStateEvaluator(
      rolledState,
      nextUnrolledStates.map(unrolledState => ({unrolledState, evaluator: null, evaluation: null})),
    );
  }
  static getRemainingDiceCountFromCacheKey(cacheKey: string): number | null {
    if (cacheKey[0] !== "R") {
      return null;
    }
    const [, diceStr] = cacheKey.split("d");
    const dice = diceStr.split(",").map(itemStr => parseInt(itemStr, 10));
    return dice.reduce((total, current, index) => (index % 2 === 0) ? total : (total + current), 0);
  }

  constructor(rolledState: RolledState, nextUnrolledStates: NextUnrolledState[]) {
    this.state = rolledState;
    this.nextUnrolledStates = nextUnrolledStates;
  }

  get finished(): boolean {
    return this.evaluation !== null;
  }

  processAll(options?: SearchOptions): this {
    while (this.processOne(options)) {
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
    for (const nextUnrolledState of this.nextUnrolledStates) {
      if (nextUnrolledState.evaluation) {
        continue;
      }
      if (!nextUnrolledState.evaluator) {
        nextUnrolledState.evaluator = UnrolledStateEvaluator.fromUnrolledState(nextUnrolledState.unrolledState, false);
        if (this.useEvaluationCache(nextUnrolledState, options)) {
          continue;
        }
      }
      nextUnrolledState.evaluator.processOne(options);
      if (nextUnrolledState.evaluator.evaluation) {
        nextUnrolledState.evaluation = nextUnrolledState.evaluator.evaluation;
        this.setEvaluationCache(nextUnrolledState, options);
        if (removeEvaluated) {
          nextUnrolledState.evaluator = null;
        }
      }
      return true;
    }
    return false;
  }

  useEvaluationCache(nextUnrolledState: NextUnrolledState, options?: SearchOptions): boolean {
    if (!nextUnrolledState.evaluator) {
      return false;
    }
    const {removeEvaluated = false, evaluationCache} = options ?? {};
    const evaluation = evaluationCache?.get(nextUnrolledState.evaluator.getCacheKey());
    if (evaluation) {
      nextUnrolledState.evaluation = evaluation;
      if (removeEvaluated) {
        nextUnrolledState.evaluator = null;
      }
      return true;
    }
    return false;
  }

  setEvaluationCache(nextUnrolledState: NextUnrolledState, options?: SearchOptions) {
    if (!nextUnrolledState.evaluator || !nextUnrolledState.evaluation) {
      return;
    }
    const {evaluationCache} = options ?? {};
    if (evaluationCache) {
      evaluationCache.set(nextUnrolledState.evaluator.getCacheKey(), nextUnrolledState.evaluation);
    }
  }

  getCacheKey(): string {
    return [
      "R",
      `t${this.state.unrolledState.chest.total}`,
      `c${this.state.unrolledState.chest.uniqueDice().join(",")}`,
      `d${this.state.diceRoll.key}`,
    ].join("").replaceAll(/[[\]]/g, "");
  }

  compileEvaluation(): Evaluation {
    if (this.nextUnrolledStates.some(({evaluation}) => !evaluation)) {
      throw new Error("Some part of the evaluation tree is not completed");
    }
    return this.compilePartialEvaluation({useCached: false});
  }

  getCompletionProgress(): number {
    if (this.finished) {
      return 1;
    }
    const completedCount = this.nextUnrolledStates.reduce(
      (total, current) => total + (current.evaluation ? 1 : (current.evaluator?.getCompletionProgress() ?? 0)), 0);
    return completedCount / this.nextUnrolledStates.length;
  }

  compilePartialEvaluation({useCached = true}: {useCached?: boolean} = {}): Evaluation {
    if (this.evaluation && useCached) {
      return this.evaluation;
    }
    return Evaluation.combineOptions(
      this.nextUnrolledStates
      .filter(({evaluator, evaluation}) => evaluator || evaluation)
      .map(({evaluator, evaluation}) => evaluation ?? evaluator!.compilePartialEvaluation())
    );
  }
}
