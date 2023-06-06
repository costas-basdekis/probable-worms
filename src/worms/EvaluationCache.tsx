import {CompressedSerialisedEvaluation, Evaluation, SerialisedEvaluation} from "./Evaluation";
import {CompressedSerialisedResults, SerialisationOptions, SerialisedResults} from "./Results";
import {UnrolledStateEvaluator} from "./UnrolledStateEvaluator";
import {RolledStateEvaluator} from "./RolledStateEvaluator";

export interface EvaluationCacheStats {
  hitCount: number,
  missCount: number,
  entryCount: number,
}

export type SerialisedEvaluationCache = [string, SerialisedResults, SerialisedResults, SerialisedResults, number][];
export type CompressedSerialisedEvaluationCache = [string, CompressedSerialisedResults, SerialisedResults, CompressedSerialisedResults, number][];

export class EvaluationCache {
  cache: Map<string, Evaluation> = new Map();
  hitCount: number = 0;
  missCount: number = 0;

  static deserialise(serialised: SerialisedEvaluationCache | CompressedSerialisedEvaluationCache, options: SerialisationOptions): EvaluationCache {
    const cache = new EvaluationCache();
    for (const [key, minimumResultOccurrencesEntries, exactResultOccurrencesEntries, expectedValueOfAtLeastEntries, expectedValue] of serialised) {
      cache.set(key, Evaluation.deserialise({
        minimumResultOccurrencesEntries,
        exactResultOccurrencesEntries,
        expectedValueOfAtLeastEntries: expectedValueOfAtLeastEntries,
        expectedValue: expectedValue,
      } as SerialisedEvaluation | CompressedSerialisedEvaluation, options));
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

  serialise(options: SerialisationOptions): SerialisedEvaluationCache | CompressedSerialisedEvaluationCache {
    let entries = Array.from(this.cache.entries());
    if (options.sparse) {
      entries = entries.filter(([key]) => {
        const remainingDiceCount: number | null = (
          UnrolledStateEvaluator.getRemainingDiceCountFromCacheKey(key)
          ?? RolledStateEvaluator.getRemainingDiceCountFromCacheKey(key)
        );
        if (remainingDiceCount === null) {
          return false;
        }
        return remainingDiceCount > 4;
      });
    }
    return entries.map(
      ([key, evaluation]) => {
        const serialisedEvaluation = evaluation.serialise(options) as SerialisedEvaluation;
        return [
          key,
          serialisedEvaluation.minimumResultOccurrencesEntries,
          serialisedEvaluation.exactResultOccurrencesEntries,
          serialisedEvaluation.expectedValueOfAtLeastEntries,
          serialisedEvaluation.expectedValue,
        ];
      });
  }
}
