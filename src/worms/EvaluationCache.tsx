import {Evaluation} from "./Evaluation";
import {CompressedSerialisedResults, SerialisedResults} from "./Results";

export interface EvaluationCacheStats {
  hitCount: number,
  missCount: number,
  entryCount: number,
}

export type SerialisedEvaluationCache = [string, SerialisedResults, SerialisedResults, number][];
export type CompressedSerialisedEvaluationCache = [string, CompressedSerialisedResults, SerialisedResults, number][];

export class EvaluationCache {
  cache: Map<string, Evaluation> = new Map();
  hitCount: number = 0;
  missCount: number = 0;

  static deserialise(serialised: SerialisedEvaluationCache): EvaluationCache {
    const cache = new EvaluationCache();
    for (const [key, minimumResultOccurrencesEntries, exactResultOccurrencesEntries, expectedValue] of serialised) {
      cache.set(key, Evaluation.deserialise({
        minimumResultOccurrencesEntries,
        exactResultOccurrencesEntries,
        expectedValue: expectedValue ?? 0,
      }));
    }
    return cache;
  }

  static deserialiseCompressed(serialised: CompressedSerialisedEvaluationCache): EvaluationCache {
    const cache = new EvaluationCache();
    for (const [key, minimumResultOccurrencesEntries, exactResultOccurrencesEntries, expectedValue] of serialised) {
      cache.set(key, Evaluation.deserialiseCompressed({
        minimumResultOccurrencesEntries,
        exactResultOccurrencesEntries,
        expectedValue: expectedValue ?? 0,
      }));
    }
    return cache;
  }

  has(key: string): boolean {
    return this.cache.has(key);
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

  get size(): number {
    return this.cache.size;
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
          serialisedEvaluation.minimumResultOccurrencesEntries,
          serialisedEvaluation.exactResultOccurrencesEntries,
          serialisedEvaluation.expectedValue,
        ];
      });
  }

  serialiseCompressed(): CompressedSerialisedEvaluationCache {
    return Array.from(this.cache.entries()).map(
      ([key, evaluation]) => {
        const serialisedEvaluation = evaluation.serialiseCompressed();
        return [
          key,
          serialisedEvaluation.minimumResultOccurrencesEntries,
          serialisedEvaluation.exactResultOccurrencesEntries,
          serialisedEvaluation.expectedValue,
        ];
      });
  }
}
