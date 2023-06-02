import React, {Component, createRef, RefObject} from "react";
import "./styles.scss";
import * as worms from "./worms";
import {RemoteSearch, SearchInstance} from "./RemoteSearch";
import {Button, Progress} from "semantic-ui-react";
import {InitialStateModal, RChest, REvaluation} from "./components";

const remoteSearch = RemoteSearch.default();

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface AppProps {
}
interface AppState {
  initialUnrolledState: worms.UnrolledState,
  progress: number,
  evaluation: worms.Evaluation,
  searching: boolean,
  searchFinished: boolean,
  cacheStats: worms.EvaluationCacheStats,
}

export default class App extends Component<AppProps, AppState> {
  loadCacheFileRef: RefObject<HTMLInputElement> = createRef();

  state = {
    initialUnrolledState: worms.UnrolledState.initial(),
    progress: 1,
    evaluation: worms.Evaluation.empty(),
    searching: false,
    searchFinished: true,
    cacheStats: {hitCount: 0, missCount: 0, entryCount: 0},
  };

  onSearchResult = (
    searching: boolean, searchFinished: boolean, progress: number, evaluation: worms.Evaluation,
    cacheStats: worms.EvaluationCacheStats,
  ) => {
    this.setState({
      progress,
      evaluation: evaluation.toFixed(),
      searchFinished,
      searching,
      cacheStats,
    });
  };

  searchInstance: SearchInstance = remoteSearch.newInstance(this.onSearchResult);

  componentDidMount() {
    this.onReset();
  }

  componentWillUnmount() {
    this.searchInstance.removeSearch();
  }

  render() {
    const {
      initialUnrolledState, progress, evaluation, searching, searchFinished, cacheStats,
    } = this.state;
    return (
      <div className="App">
        <h2>Search</h2>
        <label>
          Initial state:
          <RChest chest={initialUnrolledState.chest} remainingDice={initialUnrolledState.remainingDiceCount} />
        </label>
        <InitialStateModal trigger={<Button>Change</Button>} onChangeInitialState={this.onChangeInitialState} />
        <Progress percent={Math.floor(progress * 100)} progress={"percent"} indicating={searching && !searchFinished} autoSuccess />
        <Button.Group>
          <Button content={"Step"} icon={"step forward"} labelPosition={"right"} onClick={this.onSearchStep} disabled={searching || searchFinished} />
          <Button content={"Start"} icon={"play"} labelPosition={"right"} onClick={this.onSearchToggle} disabled={searching || searchFinished} />
          <Button content={"Pause"} icon={"pause"} labelPosition={"right"} onClick={this.onSearchToggle} disabled={!searching || searchFinished} />
          <Button content={"Restart"} icon={"undo"} labelPosition={"right"} onClick={this.onSearchRestart} disabled={!searchFinished} />
        </Button.Group>
        <br/>
        <label>
          ({Math.floor(cacheStats.hitCount / ((cacheStats.hitCount + cacheStats.missCount) || 1) * 100)}%
          cache hit rate{" - "}
          {cacheStats.hitCount}/{(cacheStats.hitCount + cacheStats.missCount)} with {cacheStats.entryCount} entries)
        </label>
        <button onClick={this.onDownloadCache}>Download cache</button>
        <label>
          <input ref={this.loadCacheFileRef} type={"file"} />
          <button onClick={this.onLoadCache}>Load cache</button>
          <button onClick={this.onClearCache}>Clear cache</button>
        </label>
        <br/>
        <label>Evaluation:</label>
        <br/>
        <REvaluation evaluation={evaluation} />
      </div>
    );
  }

  onChangeInitialState = (initialUnrolledState: worms.UnrolledState) => {
    this.setState({initialUnrolledState});
    this.searchInstance.setSearchUnrolledState(initialUnrolledState);
  };

  onReset = () => {
    const {initialUnrolledState} = this.state;
    this.searchInstance.setSearchUnrolledState(initialUnrolledState);
  };

  onSearchStep = () => {
    this.searchInstance.stepSearch();
  };

  onSearchToggle = () => {
    if (this.state.searching) {
      this.stopSearch();
    } else if (!this.state.searchFinished) {
      this.startSearch();
    }
  };

  onSearchRestart = () => {
    this.setState({searching: false, searchFinished: false});
    this.searchInstance.setSearchUnrolledState(this.state.initialUnrolledState);
  };

  onDownloadCache = () => {
    this.searchInstance.downloadEvaluationCache();
  };

  onLoadCache = async () => {
    if (!this.loadCacheFileRef?.current?.files?.length) {
      alert("No file selected");
      return;
    }
    const file = this.loadCacheFileRef.current.files[0];
    const content = await file.text();
    this.searchInstance.loadEvaluationCache(content);
  };

  onClearCache = () => {
    this.searchInstance.clearEvaluationCache();
  };

  startSearch() {
    this.searchInstance.startSearch();
  }

  stopSearch() {
    this.searchInstance.stopSearch();
  }
}
