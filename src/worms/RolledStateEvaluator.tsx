import {Evaluation} from "./Evaluation";
import {RolledState} from "./RolledState";
import {State} from "./State";
import {StateEvaluator} from "./StateEvaluator";
import {EvaluationCache} from "./EvaluationCache";

interface NextState {
  state: State;
  evaluator: StateEvaluator | null;
  evaluation: Evaluation | null;
}

interface SearchOptions {
  removeEvaluated?: boolean,
  evaluationCache?: EvaluationCache,
}

export class RolledStateEvaluator {
  rolledState: RolledState;
  nextStates: NextState[];
  evaluation: Evaluation | null = null;

  static fromRolledState(rolledState: RolledState): RolledStateEvaluator {
    const nextStates = rolledState.getNextStates();
    return new RolledStateEvaluator(
      rolledState,
      nextStates.map(state => ({state, evaluator: null, evaluation: null})),
    );
  }

  constructor(rolledState: RolledState, nextStates: NextState[]) {
    this.rolledState = rolledState;
    this.nextStates = nextStates;
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
    for (const nextState of this.nextStates) {
      if (nextState.evaluation) {
        continue;
      }
      if (!nextState.evaluator) {
        nextState.evaluator = StateEvaluator.fromState(nextState.state);
        if (this.useEvaluationCache(nextState, options)) {
          continue;
        }
      }
      nextState.evaluator.processOne(options);
      if (nextState.evaluator.evaluation) {
        nextState.evaluation = nextState.evaluator.evaluation;
        this.setEvaluationCache(nextState, options);
        if (removeEvaluated) {
          nextState.evaluator = null;
        }
      }
      return true;
    }
    return false;
  }

  useEvaluationCache(nextState: NextState, options?: SearchOptions): boolean {
    if (!nextState.evaluator) {
      return false;
    }
    const {removeEvaluated = false, evaluationCache} = options ?? {};
    const evaluation = evaluationCache?.get(nextState.evaluator.getCacheKey());
    if (evaluation) {
      nextState.evaluation = evaluation;
      if (removeEvaluated) {
        nextState.evaluator = null;
      }
      return true;
    }
    return false;
  }

  setEvaluationCache(nextState: NextState, options?: SearchOptions) {
    if (!nextState.evaluator || !nextState.evaluation) {
      return;
    }
    const {evaluationCache} = options ?? {};
    if (evaluationCache) {
      evaluationCache.set(nextState.evaluator.getCacheKey(), nextState.evaluation);
    }
  }

  getCacheKey(): string {
    return [
      "R",
      `t${this.rolledState.state.chest.total}`,
      `c${this.rolledState.state.chest.uniqueDice().join(",")}`,
      `d${this.rolledState.diceRoll.key}`,
    ].join("").replaceAll(/[[\]]/g, "");
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
    return Evaluation.combineOptions(
      this.nextStates
      .filter(({evaluator, evaluation}) => evaluator || evaluation)
      .map(({evaluator, evaluation}) => evaluation ?? evaluator!.compilePartialEvaluation())
    );
  }
}
