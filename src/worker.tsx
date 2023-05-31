import {SearchRequestMessage, SearchResponseMessage} from "./RemoteSearch";
import * as worms from "./worms";

const evaluationCacheUrlMap: Map<number, string> = new Map([
  [8, "/evaluation-cache-8-dice.json"],
]);
// Reusable evaluation caches
const evaluationCacheMap: Map<number, worms.EvaluationCache> = new Map();

interface InstanceInfo {
  id: number,
  stateEvaluator: worms.StateEvaluator,
  searching: boolean,
  evaluationCache: worms.EvaluationCache,
}

class SearchWorker {
  instancesById: Map<number, InstanceInfo> = new Map();
  worker: Worker;

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
    const {stateEvaluator, searching, evaluationCache} = this.instancesById.get(instanceId)!;
    const progress = stateEvaluator.getCompletionProgress();
    this.postMessage({
      type: "result",
      id: instanceId,
      progress,
      searching,
      searchFinished: progress === 1,
      evaluation: stateEvaluator.compilePartialEvaluation().serialise(),
      cacheStats: evaluationCache.getStats(),
    });
  }

  onMessage = ({data}: MessageEvent<SearchRequestMessage>) => {
    switch (data.type) {
      case "set-state":
        this.onSetState(data.id, worms.State.deserialise(data.state));
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

  onSetState(instanceId: number, state: worms.State) {
    this.onStop(instanceId);
    let evaluationCache;
    const instance = this.instancesById.get(instanceId);
    const totalDiceCount = state.totalDiceCount;
    if (instance && instance.stateEvaluator.state.totalDiceCount === totalDiceCount) {
      evaluationCache = instance.evaluationCache;
    } else if (evaluationCacheMap.has(totalDiceCount)) {
      evaluationCache = evaluationCacheMap.get(totalDiceCount)!;
    } else {
      evaluationCache = new worms.EvaluationCache();
      const evaluationCacheUrl = evaluationCacheUrlMap.get(totalDiceCount);
      if (evaluationCacheUrl) {
        (async () => {
          const response = await fetch(evaluationCacheUrl);
          this.onLoadEvaluationCache(instanceId, await response.text());
          const instance = this.instancesById.get(instanceId);
          if (instance) {
            evaluationCacheMap.set(totalDiceCount, instance.evaluationCache);
          }
        })();
      }
    }
    this.instancesById.set(instanceId, {
      id: instanceId,
      stateEvaluator: worms.StateEvaluator.fromStateLazy(state, true),
      searching: false,
      evaluationCache: evaluationCache,
    });
  }

  onStep(instanceId: number) {
    if (!this.instancesById.has(instanceId)) {
      return;
    }
    const {stateEvaluator, evaluationCache} = this.instancesById.get(instanceId)!;
    stateEvaluator.processOne({removeEvaluated: true, evaluationCache});
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
    try {
      instance.evaluationCache = worms.EvaluationCache.deserialiseCompressed(JSON.parse(jsonSerialised));
    } catch (e) {
      console.error("File was not a valid cache file");
      return;
    }
    this.postResult(instanceId);
  }

  onClearEvaluationCache(instanceId: number) {
    if (!this.instancesById.has(instanceId)) {
      return;
    }
    const instance = this.instancesById.get(instanceId)!;
    instance.evaluationCache = new worms.EvaluationCache();
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
      while (instanceInfo.searching && !instanceInfo.stateEvaluator.finished) {
        instanceInfo.stateEvaluator.processOne({removeEvaluated: true, evaluationCache: instanceInfo.evaluationCache});
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
