import {Evaluation} from "./Evaluation";

export interface EvaluationCacheStats {
  hitCount: number,
  missCount: number,
  entryCount: number,
}

export class EvaluationCache {
  cache: Map<string, Evaluation> = new Map();
  hitCount: number = 0;
  missCount: number = 0;

  get(key: string): Evaluation | undefined {
    if (this.cache.has(key)) {
      this.hitCount++;
    } else {
      this.missCount++;
    }
    return this.cache.get(key);
  }

  set(key: string, evaluation: Evaluation) {
    this.cache.set(key, evaluation);
  }

  getStats(): EvaluationCacheStats {
    return {
      hitCount: this.hitCount,
      missCount: this.missCount,
      entryCount: this.cache.size,
    };
  }
}
