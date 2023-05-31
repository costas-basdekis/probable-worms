import * as worms from "./worms";
import {SerialisedEvaluationCache} from "./worms";

export interface SetStateSearchRequestMessage {
  type: "set-state",
  id: number,
  state: worms.SerialisedState,
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
  SetStateSearchRequestMessage
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
  cacheStats: worms.EvaluationCacheStats,
}
export interface EvaluationCacheLinkResponseMessage {
  type: "evaluation-cache-link",
  id: number,
  link: string,
}
export type SearchResponseMessage = (
  ResultSearchResponseMessage
  | EvaluationCacheLinkResponseMessage
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
    }
  };

  onResult(resultResponse: ResultSearchResponseMessage) {
    const searchInstance = this.instancesById.get(resultResponse.id)!;
    searchInstance.onResult(
      resultResponse.searching,
      resultResponse.searchFinished,
      resultResponse.progress,
      worms.Evaluation.deserialise(resultResponse.evaluation),
      resultResponse.cacheStats,
    );
  }

  onEvaluationCacheLink(resultResponse: EvaluationCacheLinkResponseMessage) {
    this.downloadUrl(resultResponse.link, "evaluation-cache.json");
  }

  downloadUrl(url: string, filename: string) {
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
  }

  newInstance(onResult: OnSearchResult): SearchInstance {
    const instanceId = this.nextInstanceId;
    const instance = new SearchInstance(this, instanceId, onResult);
    this.instanceIds.set(instance, instanceId);
    this.instancesById.set(instanceId, instance);
    this.nextInstanceId++;
    return instance;
  }

  private postMessage(message: SearchRequestMessage) {
    this.worker.postMessage(message);
  }

  setSearchState(instance: SearchInstance, state: worms.State) {
    this.postMessage({
      type: "set-state",
      id: instance.id,
      state: state.serialise(),
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
  cacheStats: worms.EvaluationCacheStats,
) => void;

export class SearchInstance {
  id: number;
  remoteSearch: RemoteSearch;
  onResult: OnSearchResult;

  constructor(remoteSearch: RemoteSearch, id: number, onResult: OnSearchResult) {
    this.remoteSearch = remoteSearch;
    this.id = id;
    this.onResult = onResult;
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
