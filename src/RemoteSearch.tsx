import * as worms from "./worms";

export interface SetUnrolledStateSearchRequestMessage {
  type: "set-state",
  id: number,
  stateType: "unrolled",
  state: worms.SerialisedUnrolledState,
}
export interface SetRolledStateSearchRequestMessage {
  type: "set-state",
  id: number,
  stateType: "rolled",
  state: worms.SerialisedRolledState,
}
export interface StepSearchRequestMessage {
  type: "step",
  id: number,
}
export interface StartSearchRequestMessage {
  type: "start",
  id: number,
}
export interface StopSearchRequestMessage{
  type: "stop",
  id: number,
}
export interface RemoveSearchRequestMessage{
  type: "remove",
  id: number,
}
export interface DownloadEvaluationCacheRequestMessage {
  type: "download-evaluation-cache",
  id: number,
}
export interface LoadEvaluationCacheRequestMessage {
  type: "load-evaluation-cache",
  id: number,
  jsonSerialised: string,
}
export interface ClearEvaluationCacheRequestMessage {
  type: "clear-evaluation-cache",
  id: number,
}
export type SearchRequestMessage = (
  | SetUnrolledStateSearchRequestMessage
  | SetRolledStateSearchRequestMessage
  | StepSearchRequestMessage
  | StartSearchRequestMessage
  | StopSearchRequestMessage
  | RemoveSearchRequestMessage
  | DownloadEvaluationCacheRequestMessage
  | LoadEvaluationCacheRequestMessage
  | ClearEvaluationCacheRequestMessage
);

export interface ResultSearchResponseMessage {
  type: "result",
  id: number,
  searching: boolean,
  searchFinished: boolean,
  progress: number,
  evaluation: worms.SerialisedEvaluation,
  dicePickEvaluations: {pickedRoll: worms.RollResult, pickedCount: number, evaluation: worms.SerialisedEvaluation}[] | null,
  cacheStats: worms.EvaluationCacheStats,
}
export interface EvaluationCacheLinkResponseMessage {
  type: "evaluation-cache-link",
  id: number,
  link: string,
}
export type CacheFetchingStatus = "fetching" | "success" | "failure";
export interface CacheFetchingProgressResponseMessage {
  type: "cache-fetching-progress",
  id: number,
  diceCount: number,
  status: CacheFetchingStatus,
}
export type SearchResponseMessage = (
  | ResultSearchResponseMessage
  | EvaluationCacheLinkResponseMessage
  | CacheFetchingProgressResponseMessage
);

export class RemoteSearch {
  worker: Worker;
  instanceIds: Map<SearchInstance, number> = new Map();
  instancesById: Map<number, SearchInstance> = new Map();
  nextInstanceId: number = 1;

  static default(): RemoteSearch {
    return new RemoteSearch(new Worker(new URL("./worker.tsx", import.meta.url)));
  }

  constructor(worker: Worker) {
    this.worker = worker;
    this.worker.onmessage = this.onMessage;
  }

  onMessage = ({data}: MessageEvent<SearchResponseMessage>) => {
    if (!this.instancesById.has(data.id)) {
      return;
    }
    switch (data.type) {
      case "result":
        this.onResult(data);
        break;
      case "evaluation-cache-link":
        this.onEvaluationCacheLink(data);
        break;
      case "cache-fetching-progress":
        this.onCacheFetchingProgress(data);
        break;
    }
  };

  onResult(resultResponse: ResultSearchResponseMessage) {
    const searchInstance = this.instancesById.get(resultResponse.id)!;
    searchInstance.onResult(
      resultResponse.searching,
      resultResponse.searchFinished,
      resultResponse.progress,
      worms.Evaluation.deserialise(resultResponse.evaluation, {}),
      resultResponse.dicePickEvaluations ? (
        resultResponse.dicePickEvaluations?.map(({pickedRoll, pickedCount, evaluation}) => ({
          pickedRoll,
          pickedCount,
          evaluation: worms.Evaluation.deserialise(evaluation, {}),
        }))
      ) : null,
      resultResponse.cacheStats,
    );
  }

  onEvaluationCacheLink(resultResponse: EvaluationCacheLinkResponseMessage) {
    this.downloadUrl(resultResponse.link, "evaluation-cache.json");
  }

  onCacheFetchingProgress(resultResponse: CacheFetchingProgressResponseMessage) {
    const searchInstance = this.instancesById.get(resultResponse.id)!;
    searchInstance.onCacheFetchingProgress(
      resultResponse.diceCount,
      resultResponse.status,
    );
  }

  downloadUrl(url: string, filename: string) {
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
  }

  newInstance(onResult: OnSearchResult, onCacheFetchingProgress: OnCacheFetchingProgress): SearchInstance {
    const instanceId = this.nextInstanceId;
    const instance = new SearchInstance(this, instanceId, onResult, onCacheFetchingProgress);
    this.instanceIds.set(instance, instanceId);
    this.instancesById.set(instanceId, instance);
    this.nextInstanceId++;
    return instance;
  }

  private postMessage(message: SearchRequestMessage) {
    this.worker.postMessage(message);
  }

  setSearchState(instance: SearchInstance, state: worms.State) {
    switch (state.type) {
      case "unrolled":
        this.setSearchUnrolledState(instance, state);
        break;
      case "rolled":
        this.setSearchRolledState(instance, state);
        break;
      default:
        throw new Error("Unknown state type");
    }
  }

  setSearchUnrolledState(instance: SearchInstance, unrolledState: worms.UnrolledState) {
    this.postMessage({
      type: "set-state",
      id: instance.id,
      stateType: "unrolled",
      state: unrolledState.serialise(),
    });
  }

  setSearchRolledState(instance: SearchInstance, rolledState: worms.RolledState) {
    this.postMessage({
      type: "set-state",
      id: instance.id,
      stateType: "rolled",
      state: rolledState.serialise(),
    });
  }

  stepSearch(instance: SearchInstance) {
    this.postMessage({
      type: "step",
      id: instance.id,
    });
  }

  startSearch(instance: SearchInstance) {
    this.postMessage({
      type: "start",
      id: instance.id,
    });
  }

  stopSearch(instance: SearchInstance) {
    this.postMessage({
      type: "stop",
      id: instance.id,
    });
  }

  removeSearch(instance: SearchInstance) {
    this.postMessage({
      type: "remove",
      id: instance.id,
    });
  }

  downloadEvaluationCache(instance: SearchInstance) {
    this.postMessage({
      type: "download-evaluation-cache",
      id: instance.id,
    });
  }

  loadEvaluationCache(instance: SearchInstance, jsonSerialised: string) {
    this.postMessage({
      type: "load-evaluation-cache",
      id: instance.id,
      jsonSerialised,
    });
  }

  clearEvaluationCache(instance: SearchInstance) {
    this.postMessage({
      type: "clear-evaluation-cache",
      id: instance.id,
    });
  }
}

export type OnSearchResult = (
  searching: boolean, searchFinished: boolean, progress: number, evaluation: worms.Evaluation,
  dicePickEvaluations: {pickedRoll: worms.RollResult, pickedCount: number, evaluation: worms.Evaluation}[] | null,
  cacheStats: worms.EvaluationCacheStats,
) => void;

export type OnCacheFetchingProgress = (diceCount: number, status: CacheFetchingStatus) => void;

export class SearchInstance {
  id: number;
  remoteSearch: RemoteSearch;
  onResult: OnSearchResult;
  onCacheFetchingProgress: OnCacheFetchingProgress;

  constructor(remoteSearch: RemoteSearch, id: number, onResult: OnSearchResult, onCacheFetchingProgress: OnCacheFetchingProgress) {
    this.remoteSearch = remoteSearch;
    this.id = id;
    this.onResult = onResult;
    this.onCacheFetchingProgress = onCacheFetchingProgress;
  }

  setSearchState(state: worms.State) {
    this.remoteSearch.setSearchState(this, state);
  }

  stepSearch() {
    this.remoteSearch.stepSearch(this);
  }

  startSearch() {
    this.remoteSearch.startSearch(this);
  }

  stopSearch() {
    this.remoteSearch.stopSearch(this);
  }

  removeSearch() {
    this.remoteSearch.removeSearch(this);
  }

  downloadEvaluationCache() {
    this.remoteSearch.downloadEvaluationCache(this);
  }

  loadEvaluationCache(jsonSerialised: string) {
    this.remoteSearch.loadEvaluationCache(this, jsonSerialised);
  }

  clearEvaluationCache() {
    this.remoteSearch.clearEvaluationCache(this);
  }
}
