import * as worms from "./worms";

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
export type SearchRequestMessage = (
  SetStateSearchRequestMessage
  | StepSearchRequestMessage
  | StartSearchRequestMessage
  | StopSearchRequestMessage
  | RemoveSearchRequestMessage
);

export interface ResultSearchResponseMessage {
  type: "result",
  id: number,
  searching: boolean,
  searchFinished: boolean,
  progress: number,
  evaluation: worms.SerialisedEvaluation,
}
export type SearchResponseMessage = ResultSearchResponseMessage;

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
    }
  };

  onResult(resultResponse: ResultSearchResponseMessage) {
    const searchInstance = this.instancesById.get(resultResponse.id)!;
    searchInstance.onResult(
      resultResponse.searching,
      resultResponse.searchFinished,
      resultResponse.progress,
      worms.Evaluation.deserialise(resultResponse.evaluation),
    );
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
}

export type OnSearchResult = (searching: boolean, searchFinished: boolean, progress: number, evaluation: worms.Evaluation) => void;

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
}
