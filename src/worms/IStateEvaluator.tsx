import {IState} from "./IState";
import {Evaluation} from "./Evaluation";
import {EvaluationCache} from "./EvaluationCache";

export interface SearchOptions {
  removeEvaluated?: boolean,
  evaluationCache?: EvaluationCache,
}

export interface IStateEvaluator<S extends IState> {
  state: S;
  evaluation: Evaluation | null;
  finished: boolean;
  processAll(options?: SearchOptions): this;
  processOne(options?: SearchOptions): boolean;
  getCacheKey(): string;
  compileEvaluation(): Evaluation;
  compilePartialEvaluation(options?: {useCached?: boolean}): Evaluation;
}
