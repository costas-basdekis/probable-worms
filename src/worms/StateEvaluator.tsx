import {UnrolledStateEvaluator} from "./UnrolledStateEvaluator";
import {RolledStateEvaluator} from "./RolledStateEvaluator";
import {State} from "./State";
import {Evaluation} from "./Evaluation";
import {SearchOptions} from "./IStateEvaluator";

export type StateEvaluator = UnrolledStateEvaluator | RolledStateEvaluator;
export class StateEvaluatorHelper {
  static evaluatorFromStateLazy(state: State, isRoot: boolean): StateEvaluator {
    switch (state.type) {
      case "unrolled":
        return UnrolledStateEvaluator.fromUnrolledStateLazy(state, isRoot);
      case "rolled":
        return RolledStateEvaluator.fromRolledState(state);
      default:
        throw new Error("Unknown state type");
    }
  }

  static getStateCacheKey(state: State): string {
    return this.evaluatorFromStateLazy(state, true).getCacheKey();
  }

  static processAllFromState(state: State, options?: SearchOptions): Evaluation {
    const evaluator = this.evaluatorFromStateLazy(state, true);
    return evaluator.processAll(options).evaluation!;
  }

  static getRemainingDiceCountFromCacheKey(cacheKey: string): number | null {
    return (
      UnrolledStateEvaluator.getRemainingDiceCountFromCacheKey(cacheKey)
      ?? RolledStateEvaluator.getRemainingDiceCountFromCacheKey(cacheKey)
    );
  }
}
