import {Evaluation} from "./Evaluation";

export interface EvaluationCacheStats {
  hitCount: number,
  missCount: number,
  entryCount: number,
}

export type SerialisedEvaluationCache = [string, [number, number][], [number, number][]][];

export class EvaluationCache {
  cache: Map<string, Evaluation> = new Map();
  hitCount: number = 0;
  missCount: number = 0;

  static deserialise(serialised: SerialisedEvaluationCache): EvaluationCache {
    const cache = new EvaluationCache();
    for (const [key, exactResultOccurrencesEntries, minimumResultOccurrencesEntries] of serialised) {
      cache.set(key, Evaluation.deserialise({
        exactResultOccurrencesEntries,
        minimumResultOccurrencesEntries,
      }));
    }
    return cache;
  }

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

  serialise(): SerialisedEvaluationCache {
    return Array.from(this.cache.entries()).map(
      ([key, evaluation]) => {
        const serialisedEvaluation = evaluation.serialise();
        return [
          key,
          serialisedEvaluation.exactResultOccurrencesEntries,
          serialisedEvaluation.minimumResultOccurrencesEntries,
        ];
      });
  }
}
