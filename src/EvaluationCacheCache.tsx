import * as worms from "./worms";
import {OnCacheFetchingProgress} from "./RemoteSearch";

export class EvaluationCacheCache {
  evaluationCacheUrlMap: Map<number, string> = new Map([
    [5, "evaluation-cache-5-dice.json"],
    [6, "evaluation-cache-6-dice.json"],
    [7, "evaluation-cache-7-dice.json"],
    [8, "evaluation-cache-8-dice.json"],
  ]);
  hasFetchedEvaluationCacheMap: Map<number, boolean> = new Map();
  // Reusable evaluation caches
  evaluationCacheMap: Map<number, worms.EvaluationCache> = new Map();
  onCacheFetchingProgress: OnCacheFetchingProgress | null;

  constructor(onCacheFetchingProgress: OnCacheFetchingProgress | undefined | null = null) {
    this.onCacheFetchingProgress = onCacheFetchingProgress ?? null;
  }

  async get(diceCount: number): Promise<worms.EvaluationCache> {
    if (this.shouldFetchEvaluationCache(diceCount)) {
      this.evaluationCacheMap.set(diceCount, (
        await this.fetchEvaluationCache(diceCount)
        ?? this.evaluationCacheMap.get(diceCount)
        ?? new worms.EvaluationCache()
      ));
    } else if (this.shouldSetEmptyEvaluationCache(diceCount)) {
      this.evaluationCacheMap.set(diceCount, new worms.EvaluationCache());
    }
    return this.evaluationCacheMap.get(diceCount)!;
  }

  getSync(diceCount: number, callback: (evaluationCache: worms.EvaluationCache) => void): worms.EvaluationCache {
    if (this.shouldFetchEvaluationCache(diceCount)) {
      (async () => {
        callback(await this.get(diceCount));
      })();
    }
    if (this.shouldSetEmptyEvaluationCache(diceCount)) {
      this.evaluationCacheMap.set(diceCount, new worms.EvaluationCache());
    }
    return this.evaluationCacheMap.get(diceCount)!;
  }

  shouldFetchEvaluationCache(diceCount: number): boolean {
    return (
      !this.evaluationCacheMap.get(diceCount)?.size
      && this.evaluationCacheUrlMap.has(diceCount)
      && !(this.hasFetchedEvaluationCacheMap.get(diceCount) ?? false)
    );
  }

  shouldSetEmptyEvaluationCache(diceCount: number): boolean {
    return !this.evaluationCacheMap.has(diceCount);
  }

  async fetchEvaluationCache(diceCount: number): Promise<worms.EvaluationCache | null> {
    const evaluationCacheUrl = this.evaluationCacheUrlMap.get(diceCount);
    if (!evaluationCacheUrl) {
      return null;
    }
    const response = await fetch(`${process.env.PUBLIC_URL}/${evaluationCacheUrl}`);
    this.onCacheFetchingProgress?.(diceCount, "fetching");
    let evaluationCache;
    try {
      evaluationCache = worms.EvaluationCache.deserialise(JSON.parse(await response.text()), {rounded: true, compressed: true, sparse: true});
    } catch (e) {
      this.onCacheFetchingProgress?.(diceCount, "failure");
      console.error("File was not a valid cache file");
      return null;
    }
    this.hasFetchedEvaluationCacheMap.set(diceCount, true);
    this.onCacheFetchingProgress?.(diceCount, "success");
    return evaluationCache;
  }

  clear(diceCount: number): worms.EvaluationCache {
    this.evaluationCacheMap.set(diceCount, new worms.EvaluationCache());
    return this.evaluationCacheMap.get(diceCount)!;
  }

  set(diceCount: number, evaluationCache: worms.EvaluationCache) {
    this.evaluationCacheMap.set(diceCount, evaluationCache);
  }
}
