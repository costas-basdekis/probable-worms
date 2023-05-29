import {Evaluation} from "./Evaluation";

export class EvaluationCache {
  cache: Map<string, Evaluation> = new Map();

  get(key: string): Evaluation | undefined {
    return this.cache.get(key);
  }

  set(key: string, evaluation: Evaluation) {
    this.cache.set(key, evaluation);
  }
}
