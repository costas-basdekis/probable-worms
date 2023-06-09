import {CacheFetchingStatus, SearchRequestMessage, SearchResponseMessage} from "./RemoteSearch";
import * as worms from "./worms";
import {EvaluationCacheCache} from "./EvaluationCacheCache";
import {Evaluation, SerialisedEvaluation, StateEvaluator, StateEvaluatorHelper} from "./worms";
import _ from "underscore";

interface InstanceInfo {
  id: number,
  stateEvaluator: worms.StateEvaluator,
  searching: boolean,
  evaluationCache: worms.EvaluationCache,
}

class SearchWorker {
  instancesById: Map<number, InstanceInfo> = new Map();
  worker: Worker;
  onCacheFetchingProgress = (diceCount: number, status: CacheFetchingStatus) => {
    const matchingInstances = Array.from(this.instancesById.values())
      .filter(instance => instance.stateEvaluator.state.totalDiceCount === diceCount);
    for (const instance of matchingInstances) {
      this.postMessage({
        type: "cache-fetching-progress",
        id: instance.id,
        diceCount,
        status,
      });
    }
  };
  evaluationCacheCache: EvaluationCacheCache = new EvaluationCacheCache(this.onCacheFetchingProgress);

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
    const instance = this.instancesById.get(instanceId)!;
    const {stateEvaluator, searching, evaluationCache} = instance;
    const progress = stateEvaluator.getCompletionProgress();
    const serialisedEvaluation = stateEvaluator.compilePartialEvaluation().serialise({}) as SerialisedEvaluation;
    this.postMessage({
      type: "result",
      id: instanceId,
      progress,
      searching,
      searchFinished: progress === 1,
      evaluation: serialisedEvaluation,
      preRollEvaluation: (
        instance.stateEvaluator.state.type === "unrolled"
          ? serialisedEvaluation
          : this.getEvaluation(instance, instance.stateEvaluator.state.unrolledState).serialise({}) as SerialisedEvaluation
      ),
      dicePickEvaluations: stateEvaluator.state.type === "unrolled" ? null : (
        stateEvaluator.state.getNextUnrolledStatesAndPickedRolls()
        .filter(({pickedRoll}) => pickedRoll !== null)
        .map(({state, pickedRoll, pickedCount}) => {
          return {
            pickedRoll: pickedRoll!,
            pickedCount: pickedCount!,
            evaluation: this.getEvaluation(instance, state).serialise({}) as SerialisedEvaluation,
            total: state.runningTotal,
          };
        })
      ),
      cacheStats: evaluationCache.getStats(),
    });
  }

  onMessage = ({data}: MessageEvent<SearchRequestMessage>) => {
    switch (data.type) {
      case "set-state":
        switch (data.stateType) {
          case "unrolled":
            this.onSetUnrolledState(data.id, worms.UnrolledState.deserialise(data.state));
            break;
          case "rolled":
            this.onSetRolledState(data.id, worms.RolledState.deserialise(data.state));
            break;
          default:
            throw new Error("Unknown state type");
        }
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
      case "dice-comparison":
        this.requestDiceComparison(data.id, worms.UnrolledState.deserialise(data.unrolledState), data.firstDie, data.secondDie);
        break;
    }
  };

  onSetUnrolledState(instanceId: number, unrolledState: worms.UnrolledState) {
    this.setStateEvaluator(instanceId, worms.UnrolledStateEvaluator.fromUnrolledStateLazy(unrolledState, true));
  }

  onSetRolledState(instanceId: number, rolledState: worms.RolledState) {
    this.setStateEvaluator(instanceId, worms.RolledStateEvaluator.fromRolledState(rolledState));
  }

  setStateEvaluator(instanceId: number, stateEvaluator: StateEvaluator) {
    this.onStop(instanceId);
    const instance = {
      id: instanceId,
      stateEvaluator,
      searching: false,
      evaluationCache: this.evaluationCacheCache.getSync(stateEvaluator.state.totalDiceCount, evaluationCache => {
        const instance = this.instancesById.get(instanceId);
        if (!instance) {
          return;
        }
        this.setEvaluationCache(instance, evaluationCache);
      }),
    };
    this.instancesById.set(instanceId, instance);
    this.setEvaluationCache(instance, instance.evaluationCache);
    if (!instance.stateEvaluator.finished && !instance.searching && instance.stateEvaluator.state.remainingDiceCount <= 4) {
      this.onStart(instance.id);
    }
  }

  getEvaluation(instance: InstanceInfo, state: worms.State): Evaluation {
    const cacheKey = StateEvaluatorHelper.getStateCacheKey(state);
    if (!instance.evaluationCache.has(cacheKey) && state.remainingDiceCount <= 4) {
      StateEvaluatorHelper.processAllFromState(state, {evaluationCache: instance.evaluationCache});
    }

    return instance.evaluationCache.get(cacheKey) ?? Evaluation.empty();
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
    const bytes = new TextEncoder().encode(JSON.stringify(evaluationCache.serialise({rounded: true, compressed: true, sparse: true})));
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
      evaluationCache = worms.EvaluationCache.deserialise(JSON.parse(jsonSerialised), {rounded: true, compressed: true, sparse: true});
    } catch (e) {
      console.error("File was not a valid cache file");
      return;
    }
    this.setEvaluationCache(instance, evaluationCache);
  }

  setEvaluationCache(instance: InstanceInfo, evaluationCache: worms.EvaluationCache) {
    this.evaluationCacheCache.set(instance.stateEvaluator.state.totalDiceCount, evaluationCache);
    instance.evaluationCache = evaluationCache;
    const evaluator = instance.stateEvaluator;
    const cacheKey = evaluator.getCacheKey();
    if (!evaluator.finished && instance.evaluationCache.has(cacheKey)) {
      evaluator.evaluation = instance.evaluationCache.get(cacheKey)!;
      instance.searching = true;
    }
    this.postResult(instance.id);
  }

  onClearEvaluationCache(instanceId: number) {
    if (!this.instancesById.has(instanceId)) {
      return;
    }
    const instance = this.instancesById.get(instanceId)!;
    instance.evaluationCache = this.evaluationCacheCache
      .clear(instance.stateEvaluator.state.totalDiceCount);
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

  private requestDiceComparison(id: number, unrolledState: worms.UnrolledState, firstDie: worms.RollResult, secondDie: worms.RollResult) {
    if (!this.instancesById.has(id)) {
      return;
    }
    const instance = this.instancesById.get(id)!;
    this.postMessage({
      type: "dice-comparison",
      id,
      diceComparisonEvaluationsInfo: {
        unrolledState: unrolledState.serialise(),
        firstDie,
        secondDie,
        firstEvaluations: new Map(_.range(1, unrolledState.remainingDiceCount).map(
          firstDiceCount => [firstDiceCount, this.getEvaluation(instance, unrolledState.withPick(firstDie, firstDiceCount)).serialise({}) as SerialisedEvaluation],
        )),
        secondEvaluations: new Map(_.range(1, unrolledState.remainingDiceCount).map(
          secondDiceCount => [secondDiceCount, this.getEvaluation(instance, unrolledState.withPick(secondDie, secondDiceCount)).serialise({}) as SerialisedEvaluation],
        )),
      },
    });
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const worker = SearchWorker.default();
