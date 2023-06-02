import {SearchRequestMessage, SearchResponseMessage} from "./RemoteSearch";
import * as worms from "./worms";
import {EvaluationCacheCache} from "./EvaluationCacheCache";

interface InstanceInfo {
  id: number,
  unrolledStateEvaluator: worms.UnrolledStateEvaluator,
  searching: boolean,
  evaluationCache: worms.EvaluationCache,
}

class SearchWorker {
  instancesById: Map<number, InstanceInfo> = new Map();
  worker: Worker;
  evaluationCacheCache: EvaluationCacheCache = new EvaluationCacheCache();

  static default(): SearchWorker {
    return new SearchWorker(self as unknown as Worker);
  }

  constructor(worker: Worker) {
    this.worker = worker;
    this.worker.onmessage = this.onMessage;
  }

  private postMessage(message: SearchResponseMessage) {
    this.worker.postMessage(message);
  }

  postResult(instanceId: number) {
    if (!this.instancesById.has(instanceId)) {
      return;
    }
    const {unrolledStateEvaluator, searching, evaluationCache} = this.instancesById.get(instanceId)!;
    const progress = unrolledStateEvaluator.getCompletionProgress();
    this.postMessage({
      type: "result",
      id: instanceId,
      progress,
      searching,
      searchFinished: progress === 1,
      evaluation: unrolledStateEvaluator.compilePartialEvaluation().serialise(),
      cacheStats: evaluationCache.getStats(),
    });
  }

  onMessage = ({data}: MessageEvent<SearchRequestMessage>) => {
    switch (data.type) {
      case "set-unrolled-state":
        this.onSetUnrolledState(data.id, worms.UnrolledState.deserialise(data.state));
        break;
      case "step":
        this.onStep(data.id);
        break;
      case "start":
        this.onStart(data.id);
        break;
      case "stop":
        this.onStop(data.id);
        break;
      case "remove":
        this.onRemove(data.id);
        break;
      case "download-evaluation-cache":
        this.onDownloadEvaluationCache(data.id);
        break;
      case "load-evaluation-cache":
        this.onLoadEvaluationCache(data.id, data.jsonSerialised);
        break;
      case "clear-evaluation-cache":
        this.onClearEvaluationCache(data.id);
        break;
    }
  };

  onSetUnrolledState(instanceId: number, unrolledState: worms.UnrolledState) {
    this.onStop(instanceId);
    const instance = {
      id: instanceId,
      unrolledStateEvaluator: worms.UnrolledStateEvaluator.fromUnrolledStateLazy(unrolledState, true),
      searching: false,
      evaluationCache: this.evaluationCacheCache.getSync(unrolledState.totalDiceCount, evaluationCache => {
        const instance = this.instancesById.get(instanceId);
        if (!instance) {
          return;
        }
        this.setEvaluationCache(instance, evaluationCache);
      }),
    };
    this.instancesById.set(instanceId, instance);
    this.setEvaluationCache(instance, instance.evaluationCache);
    if (!instance.unrolledStateEvaluator.finished && !instance.searching && instance.unrolledStateEvaluator.unrolledState.totalDiceCount <= 4) {
      this.onStart(instance.id);
    }
  }

  onStep(instanceId: number) {
    if (!this.instancesById.has(instanceId)) {
      return;
    }
    const {unrolledStateEvaluator, evaluationCache} = this.instancesById.get(instanceId)!;
    unrolledStateEvaluator.processOne({removeEvaluated: true, evaluationCache});
    this.postResult(instanceId);
  }

  onStart(instanceId: number) {
    this.onStop(instanceId);
    const iterator = this.makeSearch(instanceId);
    if (!iterator) {
      return;
    }
    self.setTimeout(iterator, 0);
  }

  onDownloadEvaluationCache(instanceId: number) {
    if (!this.instancesById.has(instanceId)) {
      return;
    }
    const {evaluationCache} = this.instancesById.get(instanceId)!;
    const bytes = new TextEncoder().encode(JSON.stringify(evaluationCache.serialiseCompressed()));
    const blob = new Blob([bytes], {
      type: "application/json;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    self.postMessage({
      type: "evaluation-cache-link",
      id: instanceId,
      link: url,
    });
  }

  onLoadEvaluationCache(instanceId: number, jsonSerialised: string) {
    if (!this.instancesById.has(instanceId)) {
      return;
    }
    const instance = this.instancesById.get(instanceId)!;
    let evaluationCache;
    try {
      evaluationCache = worms.EvaluationCache.deserialiseCompressed(JSON.parse(jsonSerialised));
    } catch (e) {
      console.error("File was not a valid cache file");
      return;
    }
    this.setEvaluationCache(instance, evaluationCache);
  }

  setEvaluationCache(instance: InstanceInfo, evaluationCache: worms.EvaluationCache) {
    const evaluator = instance.unrolledStateEvaluator;
    const cacheKey = evaluator.getCacheKey();
    if (!evaluator.finished && evaluationCache.has(cacheKey)) {
      evaluator.evaluation = evaluationCache.get(cacheKey)!;
      instance.searching = true;
    }
    this.postResult(instance.id);
  }

  onClearEvaluationCache(instanceId: number) {
    if (!this.instancesById.has(instanceId)) {
      return;
    }
    const instance = this.instancesById.get(instanceId)!;
    instance.evaluationCache = new worms.EvaluationCache();
    this.evaluationCacheCache.clear(instance.unrolledStateEvaluator.unrolledState.totalDiceCount);
    this.postResult(instanceId);
  }

  makeSearch(instanceId: number, reportInterval: number = 1000): (() => void) | null {
    if (!this.instancesById.has(instanceId)) {
      return null;
    }
    const instanceInfo = this.instancesById.get(instanceId)!;
    instanceInfo.searching = true;
    const iterator = () => {
      const startTime = new Date();
      while (instanceInfo.searching && !instanceInfo.unrolledStateEvaluator.finished) {
        instanceInfo.unrolledStateEvaluator.processOne({removeEvaluated: true, evaluationCache: instanceInfo.evaluationCache});
        const endTime = new Date();
        if ((endTime.valueOf() - startTime.valueOf()) >= reportInterval) {
          self.setTimeout(iterator, 0);
          break;
        }
      }
      this.postResult(instanceId);
    };
    return iterator;
  }

  onStop(instanceId: number) {
    if (!this.instancesById.has(instanceId)) {
      return;
    }
    this.instancesById.get(instanceId)!.searching = false;
    this.postResult(instanceId);
  }

  onRemove(instanceId: number) {
    if (!this.instancesById.has(instanceId)) {
      return;
    }
    this.instancesById.get(instanceId)!.searching = false;
    this.postResult(instanceId);
    this.instancesById.delete(instanceId);
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const worker = SearchWorker.default();
